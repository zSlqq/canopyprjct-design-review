#!/usr/bin/env python3
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from hashlib import sha1
from pathlib import Path
from typing import Any
import base64
import json
import os
import re
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT / "lib" / "data" / "generated"
AUDIT_PATH = ROOT / "FEATURE-CATALOG-AUDIT.md"

OWNER = "ForestOfLight"
API_ROOT = "https://api.github.com"
USER_AGENT = (
    "ForestOfLight-Technical-Hub-Feature-Catalog"
)

SECTION_KINDS = {
    "command": (
        "command",
        "commands",
        "usage",
        "syntax",
    ),
    "rule": (
        "rule",
        "rules",
        "gamerule",
        "gamerules",
    ),
    "statistic": (
        "statistic",
        "statistics",
        "stats",
        "supported statistics",
    ),
    "api": (
        "api",
        "apis",
        "scripting api",
        "developer api",
    ),
    "configuration": (
        "configuration",
        "config",
        "settings",
        "options",
    ),
    "workflow": (
        "getting started",
        "installation",
        "setup",
        "how to use",
        "workflow",
        "workflows",
    ),
    "feature": (
        "feature",
        "features",
        "capability",
        "capabilities",
        "function",
        "functions",
    ),
}

IGNORED_HEADINGS = {
    "overview",
    "about",
    "license",
    "contributing",
    "credits",
    "community",
    "support",
    "resources",
    "installation",
    "getting started",
    "table of contents",
}


@dataclass(frozen=True)
class MarkdownSection:
    title: str
    level: int
    start_line: int
    lines: tuple[tuple[int, str], ...]


def utc_now() -> str:
    return datetime.now(
        timezone.utc,
    ).isoformat(
        timespec="seconds",
    )


def request_headers() -> dict[str, str]:
    headers = {
        "Accept":
            "application/vnd.github+json",
        "User-Agent":
            USER_AGENT,
    }

    token = os.environ.get(
        "GITHUB_TOKEN",
        "",
    ).strip()

    if token:
        headers["Authorization"] = (
            f"Bearer {token}"
        )

    return headers


def api_json(
    url: str,
    attempts: int = 3,
) -> Any:
    last_error: Exception | None = None

    for attempt in range(
        1,
        attempts + 1,
    ):
        request = urllib.request.Request(
            url,
            headers=request_headers(),
        )

        try:
            with urllib.request.urlopen(
                request,
                timeout=30,
            ) as response:
                return json.loads(
                    response.read().decode(
                        "utf-8",
                    )
                )

        except urllib.error.HTTPError as error:
            if error.code == 404:
                raise

            last_error = error

        except Exception as error:
            last_error = error

        if attempt < attempts:
            time.sleep(attempt * 2)

    raise RuntimeError(
        f"GitHub request failed: "
        f"{url}: {last_error}"
    )


def list_repositories() -> list[dict[str, Any]]:
    repositories: list[
        dict[str, Any]
    ] = []

    page = 1

    while True:
        result = api_json(
            f"{API_ROOT}/users/{OWNER}/repos"
            f"?per_page=100&page={page}"
            "&sort=updated"
        )

        if not isinstance(
            result,
            list,
        ):
            raise RuntimeError(
                "Unexpected repository response."
            )

        repositories.extend(result)

        if len(result) < 100:
            break

        page += 1

    return repositories


def fetch_readme(
    repository: str,
) -> tuple[str, str] | None:
    try:
        result = api_json(
            f"{API_ROOT}/repos/"
            f"{OWNER}/{repository}/readme"
        )
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return None

        raise

    encoded = result.get(
        "content",
        "",
    )

    if not encoded:
        return None

    return (
        result.get(
            "path",
            "README.md",
        ),
        base64.b64decode(
            encoded,
        ).decode(
            "utf-8",
            errors="replace",
        ),
    )


def fetch_wiki_documents(
    repository: str,
    has_wiki: bool,
) -> list[tuple[str, str, str]]:
    if not has_wiki:
        return []

    temporary_root = Path(
        tempfile.mkdtemp(
            prefix=(
                "forestoflight-wiki-"
                f"{repository}-"
            )
        )
    )

    clone_path = (
        temporary_root / "wiki"
    )

    try:
        result = subprocess.run(
            [
                "git",
                "clone",
                "--depth",
                "1",
                "--quiet",
                (
                    "https://github.com/"
                    f"{OWNER}/{repository}"
                    ".wiki.git"
                ),
                str(clone_path),
            ],
            capture_output=True,
            text=True,
            timeout=45,
            check=False,
        )

        if result.returncode != 0:
            return []

        documents: list[
            tuple[str, str, str]
        ] = []

        for path in sorted(
            clone_path.rglob("*.md")
        ):
            relative = path.relative_to(
                clone_path
            )

            page_name = (
                path.stem.replace(
                    " ",
                    "-",
                )
            )

            documents.append(
                (
                    f"wiki/{relative}",
                    path.read_text(
                        encoding="utf-8",
                        errors="replace",
                    ),
                    (
                        "https://github.com/"
                        f"{OWNER}/{repository}"
                        f"/wiki/{page_name}"
                    ),
                )
            )

        return documents

    finally:
        shutil.rmtree(
            temporary_root,
            ignore_errors=True,
        )


def clean_markdown(
    value: str,
) -> str:
    value = re.sub(
        r"!\[([^\]]*)\]\([^)]+\)",
        r"\1",
        value,
    )

    value = re.sub(
        r"\[([^\]]+)\]\([^)]+\)",
        r"\1",
        value,
    )

    value = re.sub(
        r"<[^>]+>",
        " ",
        value,
    )

    value = value.replace(
        "`",
        "",
    )

    value = re.sub(
        r"[*_~]+",
        "",
        value,
    )

    return re.sub(
        r"\s+",
        " ",
        value,
    ).strip()


def slug(
    value: str,
) -> str:
    result = re.sub(
        r"[^a-z0-9]+",
        "-",
        value.lower(),
    ).strip("-")

    return result or "entry"


def stable_id(
    *parts: object,
) -> str:
    normalized = [
        str(part).strip()
        for part in parts
    ]

    readable = slug(
        "-".join(
            normalized[:3]
        )
    )[:72]

    digest = sha1(
        "\0".join(
            normalized
        ).encode(
            "utf-8"
        )
    ).hexdigest()[:12]

    return f"{readable}-{digest}"


def split_sections(
    markdown: str,
) -> list[MarkdownSection]:
    sections: list[
        MarkdownSection
    ] = []

    title = "Overview"
    level = 0
    start_line = 1
    lines: list[
        tuple[int, str]
    ] = []

    heading_pattern = re.compile(
        r"^(#{1,6})\s+(.+?)\s*$"
    )

    for line_number, line in enumerate(
        markdown.splitlines(),
        start=1,
    ):
        match = heading_pattern.match(
            line
        )

        if not match:
            lines.append(
                (line_number, line)
            )
            continue

        sections.append(
            MarkdownSection(
                title=title,
                level=level,
                start_line=start_line,
                lines=tuple(lines),
            )
        )

        title = (
            clean_markdown(
                match.group(2)
            )
            or "Untitled"
        )

        level = len(
            match.group(1)
        )

        start_line = line_number
        lines = []

    sections.append(
        MarkdownSection(
            title=title,
            level=level,
            start_line=start_line,
            lines=tuple(lines),
        )
    )

    return sections


def section_kind(
    title: str,
) -> str | None:
    normalized = clean_markdown(
        title
    ).lower()

    for kind, terms in (
        SECTION_KINDS.items()
    ):
        if any(
            term in normalized
            for term in terms
        ):
            return kind

    return None


def site_project_map() -> dict[str, str]:
    path = ROOT / "lib/data/addons.ts"

    if not path.exists():
        return {}

    source = path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    pattern = re.compile(
        r"\{\s*"
        r'id:\s*"(?P<id>[^"]+)".*?'
        r'githubUrl:\s*"'
        r"https://github\.com/"
        r"ForestOfLight/"
        r'(?P<repo>[^"/]+)"',
        re.DOTALL,
    )

    return {
        match.group(
            "repo"
        ).lower():
            match.group("id")
        for match in pattern.finditer(
            source
        )
    }


def source_line_url(
    source_url: str,
    line: int,
) -> str:
    if "/wiki/" in source_url:
        return source_url

    return (
        f"{source_url}#L{line}"
    )


def make_entry(
    *,
    repository: str,
    site_project_id: str | None,
    project_title: str,
    kind: str,
    title: str,
    syntax: str | None,
    summary: str,
    section: str,
    path: str,
    source_url: str,
    line: int,
    excerpt: str,
    retrieved_at: str,
) -> dict[str, Any]:
    identifier = stable_id(
        repository,
        kind,
        syntax or title,
        path,
        line,
        section,
    )

    tags = {
        repository,
        project_title,
        kind,
        section,
    }

    if syntax:
        tags.add(
            syntax.split(
                maxsplit=1
            )[0]
        )

    return {
        "id": identifier,
        "repository": repository,
        "siteProjectId":
            site_project_id,
        "projectTitle":
            project_title,
        "kind": kind,
        "title": title,
        "aliases": [],
        "tags": sorted(
            {
                clean_markdown(tag)
                for tag in tags
                if clean_markdown(tag)
            },
            key=str.lower,
        ),
        "usage": {
            "syntax": syntax,
            "summary": summary,
            "prerequisites": [],
            "steps": [],
            "examples": [],
            "notes": [],
        },
        "source": {
            "repository": repository,
            "repositoryUrl":
                (
                    "https://github.com/"
                    f"{OWNER}/{repository}"
                ),
            "path": path,
            "url":
                source_line_url(
                    source_url,
                    line,
                ),
            "section": section,
            "line": line,
            "retrievedAt":
                retrieved_at,
            "excerpt": excerpt,
        },
        "reviewStatus":
            "source-extracted",
    }


def next_description(
    lines: tuple[
        tuple[int, str],
        ...
    ],
    index: int,
) -> str:
    for _, line in lines[
        index + 1:
        index + 5
    ]:
        stripped = line.strip()

        if not stripped:
            continue

        if (
            stripped.startswith("#")
            or re.match(
                r"^\s*[-*+]\s+",
                line,
            )
        ):
            break

        cleaned = clean_markdown(
            line
        )

        if cleaned:
            return cleaned

    return ""


def command_like(
    value: str,
) -> bool:
    value = value.strip()

    return bool(
        value.startswith(
            (
                "/",
                "!",
                ".",
            )
        )
        or re.match(
            r"^[a-z0-9_-]+:"
            r"[a-z0-9_-]+",
            value,
            re.IGNORECASE,
        )
    )


def extract_table_rows(
    section: MarkdownSection,
) -> list[
    tuple[int, list[str]]
]:
    rows: list[
        tuple[int, list[str]]
    ] = []

    for line_number, line in (
        section.lines
    ):
        stripped = line.strip()

        if not (
            stripped.startswith("|")
            and stripped.endswith("|")
        ):
            continue

        cells = [
            clean_markdown(cell)
            for cell in stripped
            .strip("|")
            .split("|")
        ]

        if not cells:
            continue

        if all(
            re.fullmatch(
                r":?-{3,}:?",
                cell,
            )
            for cell in cells
            if cell
        ):
            continue

        rows.append(
            (line_number, cells)
        )

    return rows


def extract_candidates(
    *,
    repository: str,
    site_project_id: str | None,
    project_title: str,
    path: str,
    markdown: str,
    source_url: str,
    retrieved_at: str,
) -> list[dict[str, Any]]:
    entries: list[
        dict[str, Any]
    ] = []

    usage_pattern = re.compile(
        r"^\s*(?:[-*+]\s*)?"
        r"(?:Usage\s*:\s*)?"
        r"`([^`\n]+)`"
        r"\s*(.*)$",
        re.IGNORECASE,
    )

    bullet_pattern = re.compile(
        r"^\s*[-*+]\s+(.+?)\s*$"
    )

    fenced = False

    for section in split_sections(
        markdown
    ):
        kind = section_kind(
            section.title
        )

        for index, (
            line_number,
            line,
        ) in enumerate(
            section.lines
        ):
            stripped = line.strip()

            if stripped.startswith("```"):
                fenced = not fenced
                continue

            usage_match = (
                usage_pattern.match(
                    line
                )
            )

            if usage_match:
                syntax = clean_markdown(
                    usage_match.group(1)
                )

                trailing = clean_markdown(
                    usage_match.group(2)
                )

                resolved_kind = kind

                if command_like(syntax):
                    resolved_kind = "command"

                if resolved_kind:
                    summary = (
                        trailing
                        or next_description(
                            section.lines,
                            index,
                        )
                    )

                    entries.append(
                        make_entry(
                            repository=repository,
                            site_project_id=
                                site_project_id,
                            project_title=
                                project_title,
                            kind=
                                resolved_kind,
                            title=(
                                syntax.split(
                                    maxsplit=1
                                )[0]
                                if command_like(
                                    syntax
                                )
                                else syntax
                            ),
                            syntax=syntax,
                            summary=summary,
                            section=
                                section.title,
                            path=path,
                            source_url=
                                source_url,
                            line=line_number,
                            excerpt=
                                clean_markdown(
                                    line
                                ),
                            retrieved_at=
                                retrieved_at,
                        )
                    )

                    continue

            if (
                fenced
                and command_like(
                    stripped
                )
            ):
                syntax = clean_markdown(
                    stripped
                )

                entries.append(
                    make_entry(
                        repository=repository,
                        site_project_id=
                            site_project_id,
                        project_title=
                            project_title,
                        kind="command",
                        title=
                            syntax.split(
                                maxsplit=1
                            )[0],
                        syntax=syntax,
                        summary="",
                        section=
                            section.title,
                        path=path,
                        source_url=
                            source_url,
                        line=line_number,
                        excerpt=syntax,
                        retrieved_at=
                            retrieved_at,
                    )
                )

                continue

            bullet_match = (
                bullet_pattern.match(
                    line
                )
            )

            if not bullet_match:
                continue

            bullet = clean_markdown(
                bullet_match.group(1)
            )

            if not bullet:
                continue

            inline_codes = re.findall(
                r"`([^`]+)`",
                bullet_match.group(1),
            )

            syntax = next(
                (
                    clean_markdown(code)
                    for code in inline_codes
                    if command_like(
                        clean_markdown(
                            code
                        )
                    )
                ),
                None,
            )

            if syntax:
                resolved_kind = "command"
                title = syntax.split(
                    maxsplit=1
                )[0]

            elif kind:
                resolved_kind = kind

                if " – " in bullet:
                    title = bullet.split(
                        " – ",
                        1,
                    )[0]
                elif " - " in bullet:
                    title = bullet.split(
                        " - ",
                        1,
                    )[0]
                elif ":" in bullet:
                    title = bullet.split(
                        ":",
                        1,
                    )[0]
                else:
                    title = bullet
            else:
                continue

            summary = bullet

            if (
                syntax
                and syntax in summary
            ):
                summary = summary.replace(
                    syntax,
                    "",
                    1,
                ).strip(
                    " :-–"
                )

            entries.append(
                make_entry(
                    repository=repository,
                    site_project_id=
                        site_project_id,
                    project_title=
                        project_title,
                    kind=resolved_kind,
                    title=title.strip(),
                    syntax=syntax,
                    summary=summary,
                    section=
                        section.title,
                    path=path,
                    source_url=
                        source_url,
                    line=line_number,
                    excerpt=bullet,
                    retrieved_at=
                        retrieved_at,
                )
            )

        if kind:
            for (
                line_number,
                cells,
            ) in extract_table_rows(
                section
            ):
                if len(cells) < 2:
                    continue

                title = cells[0]
                summary = cells[1]

                if (
                    not title
                    or title.lower()
                    in {
                        "name",
                        "command",
                        "feature",
                        "rule",
                        "statistic",
                        "option",
                    }
                ):
                    continue

                syntax = (
                    title
                    if command_like(
                        title
                    )
                    else None
                )

                resolved_kind = (
                    "command"
                    if syntax
                    else kind
                )

                entries.append(
                    make_entry(
                        repository=repository,
                        site_project_id=
                            site_project_id,
                        project_title=
                            project_title,
                        kind=
                            resolved_kind,
                        title=(
                            syntax.split(
                                maxsplit=1
                            )[0]
                            if syntax
                            else title
                        ),
                        syntax=syntax,
                        summary=summary,
                        section=
                            section.title,
                        path=path,
                        source_url=
                            source_url,
                        line=line_number,
                        excerpt=
                            " | ".join(cells),
                        retrieved_at=
                            retrieved_at,
                    )
                )

        normalized_heading = (
            clean_markdown(
                section.title
            ).lower()
        )

        if (
            section.level >= 3
            and normalized_heading
            not in IGNORED_HEADINGS
            and not kind
            and len(
                normalized_heading
            ) >= 3
        ):
            summary = next_description(
                section.lines,
                -1,
            )

            if summary:
                entries.append(
                    make_entry(
                        repository=repository,
                        site_project_id=
                            site_project_id,
                        project_title=
                            project_title,
                        kind="feature",
                        title=
                            clean_markdown(
                                section.title
                            ),
                        syntax=None,
                        summary=summary,
                        section=
                            section.title,
                        path=path,
                        source_url=
                            source_url,
                        line=
                            section.start_line,
                        excerpt=
                            clean_markdown(
                                section.title
                            ),
                        retrieved_at=
                            retrieved_at,
                    )
                )

    unique: dict[
        tuple[
            str,
            str,
            str,
            str,
            int,
        ],
        dict[str, Any],
    ] = {}

    for entry in entries:
        key = (
            entry[
                "repository"
            ].lower(),
            entry["kind"],
            (
                entry["usage"]["syntax"]
                or entry["title"]
            ).lower(),
            entry["source"]["path"],
            entry["source"]["line"],
        )

        unique[key] = entry

    return list(
        unique.values()
    )


def markdown_source_url(
    repository: str,
    branch: str,
    path: str,
) -> str:
    return (
        "https://github.com/"
        f"{OWNER}/{repository}/blob/"
        f"{branch}/{path}"
    )


def write_json(
    path: Path,
    value: Any,
) -> None:
    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    path.write_text(
        json.dumps(
            value,
            indent=2,
            ensure_ascii=False,
        ) + "\n",
        encoding="utf-8",
    )


def build_review_queue(
    features: list[
        dict[str, Any]
    ],
) -> list[dict[str, Any]]:
    queue: list[
        dict[str, Any]
    ] = []

    for feature in features:
        missing: list[str] = []

        if not feature["usage"][
            "summary"
        ]:
            missing.append(
                "summary"
            )

        if (
            feature["kind"]
            in {
                "command",
                "rule",
                "configuration",
                "workflow",
            }
            and not feature["usage"][
                "steps"
            ]
        ):
            missing.append(
                "in-game steps"
            )

        if (
            feature["kind"]
            == "command"
            and not feature["usage"][
                "examples"
            ]
        ):
            missing.append(
                "example"
            )

        if not feature["aliases"]:
            missing.append(
                "search aliases"
            )

        if missing:
            queue.append(
                {
                    "id":
                        feature["id"],
                    "repository":
                        feature[
                            "repository"
                        ],
                    "title":
                        feature["title"],
                    "missing":
                        missing,
                    "sourceUrl":
                        feature[
                            "source"
                        ]["url"],
                }
            )

    return queue


def build_audit(
    inventory: list[
        dict[str, Any]
    ],
    features: list[
        dict[str, Any]
    ],
    queue: list[
        dict[str, Any]
    ],
    retrieved_at: str,
) -> str:
    kind_counts = Counter(
        feature["kind"]
        for feature in features
    )

    no_candidates = [
        repository
        for repository in inventory
        if repository[
            "featureCandidates"
        ] == 0
    ]

    unmapped = [
        repository
        for repository in inventory
        if repository[
            "siteProjectId"
        ] is None
    ]

    lines = [
        "# ForestOfLight Feature Catalog Audit",
        "",
        f"Generated: {retrieved_at}",
        "",
        "## Summary",
        "",
        (
            f"- Public repositories: "
            f"{len(inventory)}"
        ),
        (
            f"- Source-extracted entries: "
            f"{len(features)}"
        ),
        (
            f"- Review queue entries: "
            f"{len(queue)}"
        ),
        (
            f"- Mapped website projects: "
            f"{sum(1 for item in inventory if item['siteProjectId'])}"
        ),
        "",
        (
            "Source extraction never invents "
            "commands, prerequisites, examples, "
            "or in-game instructions."
        ),
        "",
        "## Entry types",
        "",
    ]

    for kind, count in sorted(
        kind_counts.items()
    ):
        lines.append(
            f"- {kind}: {count}"
        )

    lines.extend(
        [
            "",
            "## Repository coverage",
            "",
            (
                "| Repository | Site project | "
                "README | Wiki docs | Entries |"
            ),
            "|---|---|---:|---:|---:|",
        ]
    )

    for item in inventory:
        lines.append(
            "| "
            f"{item['repository']} | "
            f"{item['siteProjectId'] or 'unmapped'} | "
            f"{'yes' if item['readmeFound'] else 'no'} | "
            f"{item['wikiDocuments']} | "
            f"{item['featureCandidates']} |"
        )

    lines.extend(
        [
            "",
            "## Repositories needing manual documentation review",
            "",
        ]
    )

    if no_candidates:
        lines.extend(
            f"- {item['repository']}"
            for item in no_candidates
        )
    else:
        lines.append("- None")

    lines.extend(
        [
            "",
            "## Repositories not mapped to homepage projects",
            "",
        ]
    )

    if unmapped:
        lines.extend(
            f"- {item['repository']}"
            for item in unmapped
        )
    else:
        lines.append("- None")

    lines.extend(
        [
            "",
            "## Next editorial work",
            "",
            (
                "- Verify command syntax against "
                "the current release."
            ),
            (
                "- Add plain-language search aliases."
            ),
            (
                "- Add exact in-game steps only from "
                "documented behavior."
            ),
            (
                "- Add prerequisites, permissions, "
                "and experimental settings."
            ),
            (
                "- Add examples and expected results."
            ),
            (
                "- Merge duplicate concepts found in "
                "different source documents."
            ),
            "",
        ]
    )

    return "\n".join(lines)


def main() -> None:
    retrieved_at = utc_now()
    project_map = site_project_map()
    repositories = list_repositories()

    inventory: list[
        dict[str, Any]
    ] = []

    features: list[
        dict[str, Any]
    ] = []

    for repository_data in repositories:
        repository = repository_data[
            "name"
        ]

        branch = (
            repository_data.get(
                "default_branch"
            )
            or "main"
        )

        site_project_id = (
            project_map.get(
                repository.lower()
            )
        )

        repository_entries: list[
            dict[str, Any]
        ] = []

        readme = fetch_readme(
            repository
        )

        if readme:
            readme_path, markdown = (
                readme
            )

            repository_entries.extend(
                extract_candidates(
                    repository=
                        repository,
                    site_project_id=
                        site_project_id,
                    project_title=
                        repository,
                    path=readme_path,
                    markdown=markdown,
                    source_url=
                        markdown_source_url(
                            repository,
                            branch,
                            readme_path,
                        ),
                    retrieved_at=
                        retrieved_at,
                )
            )

        wiki_documents = (
            fetch_wiki_documents(
                repository,
                bool(
                    repository_data.get(
                        "has_wiki"
                    )
                ),
            )
        )

        for (
            wiki_path,
            markdown,
            wiki_url,
        ) in wiki_documents:
            repository_entries.extend(
                extract_candidates(
                    repository=
                        repository,
                    site_project_id=
                        site_project_id,
                    project_title=
                        repository,
                    path=wiki_path,
                    markdown=markdown,
                    source_url=
                        wiki_url,
                    retrieved_at=
                        retrieved_at,
                )
            )

        repository_entries.sort(
            key=lambda entry: (
                entry["kind"],
                entry["title"].lower(),
                entry["source"]["path"],
                entry["source"]["line"],
            )
        )

        features.extend(
            repository_entries
        )

        inventory.append(
            {
                "repository":
                    repository,
                "repositoryUrl":
                    repository_data[
                        "html_url"
                    ],
                "description":
                    repository_data.get(
                        "description"
                    ),
                "defaultBranch":
                    branch,
                "archived":
                    bool(
                        repository_data.get(
                            "archived"
                        )
                    ),
                "fork":
                    bool(
                        repository_data.get(
                            "fork"
                        )
                    ),
                "siteProjectId":
                    site_project_id,
                "readmeFound":
                    readme is not None,
                "wikiDocuments":
                    len(
                        wiki_documents
                    ),
                "featureCandidates":
                    len(
                        repository_entries
                    ),
            }
        )

        print(
            f"{repository}: "
            f"{len(repository_entries)} "
            "entry or entries"
        )

    inventory.sort(
        key=lambda item:
            item["repository"].lower()
    )

    features.sort(
        key=lambda item: (
            item[
                "repository"
            ].lower(),
            item["kind"],
            item["title"].lower(),
        )
    )

    review_queue = (
        build_review_queue(
            features
        )
    )

    write_json(
        GENERATED /
        "repository-inventory.json",
        inventory,
    )

    write_json(
        GENERATED /
        "feature-catalog.json",
        features,
    )

    write_json(
        GENERATED /
        "feature-review-queue.json",
        review_queue,
    )

    AUDIT_PATH.write_text(
        build_audit(
            inventory,
            features,
            review_queue,
            retrieved_at,
        ) + "\n",
        encoding="utf-8",
    )

    print()
    print(
        "Repositories:",
        len(inventory),
    )

    print(
        "Catalog entries:",
        len(features),
    )

    print(
        "Review queue:",
        len(review_queue),
    )


if __name__ == "__main__":
    main()
