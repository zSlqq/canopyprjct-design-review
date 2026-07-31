#!/usr/bin/env python3

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata

from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote


ROOT = Path.cwd()

CACHE = Path(
    os.environ.get(
        "FOREST_DOCS_CACHE",
        "/workspaces/_project-cache/forestoflight-docs",
    )
)

INVENTORY = (
    ROOT
    / "lib/data/generated/repository-inventory.json"
)

GENERATED = (
    ROOT
    / "lib/data/generated/docs"
)

PUBLIC_INDEX = (
    ROOT
    / "public/_docs-index"
)

NOW = datetime.now(
    timezone.utc
).isoformat()

MARKDOWN_EXTENSIONS = {
    ".md",
    ".mdx",
    ".markdown",
}

DOC_DIRECTORIES = {
    "docs",
    "documentation",
    "guides",
    "guide",
    "wiki",
    "manual",
    "help",
}


def command(
    arguments: list[str],
    *,
    cwd: Path | None = None,
    required: bool = True,
) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        arguments,
        cwd=str(cwd or ROOT),
        env={
            **os.environ,
            "GIT_TERMINAL_PROMPT": "0",
        },
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=False,
    )

    if required and result.returncode != 0:
        details = "\n".join(
            item
            for item in [
                "$ " + " ".join(arguments),
                result.stdout.strip(),
                result.stderr.strip(),
            ]
            if item
        )

        raise RuntimeError(details)

    return result


def digest(
    value: str,
    length: int = 64,
) -> str:
    return hashlib.sha256(
        value.encode("utf-8")
    ).hexdigest()[:length]


def slug(
    value: Any,
) -> str:
    if value is None:
        text = ""
    elif isinstance(
        value,
        str,
    ):
        text = value
    else:
        text = str(value)

    normalized = unicodedata.normalize(
        "NFKD",
        text,
    )

    normalized = "".join(
        character
        for character in normalized
        if not unicodedata.combining(
            character
        )
    )

    result = re.sub(
        r"[^a-z0-9]+",
        "-",
        normalized
        .lower()
        .replace(
            "&",
            " and ",
        ),
    ).strip("-")

    return result


def clean_text(
    markdown: str,
) -> str:
    text = markdown

    text = re.sub(
        r"^---\s*\n[\s\S]*?\n---\s*\n",
        " ",
        text,
        count=1,
    )

    text = re.sub(
        r"```[^\n]*\n([\s\S]*?)```",
        r" \1 ",
        text,
    )

    text = re.sub(
        r"!\[([^\]]*)\]\([^)]+\)",
        r" \1 ",
        text,
    )

    text = re.sub(
        r"\[([^\]]+)\]\([^)]+\)",
        r" \1 ",
        text,
    )

    text = re.sub(
        r"<[^>]+>",
        " ",
        text,
    )

    text = re.sub(
        r"[`*_~>#|]",
        " ",
        text,
    )

    return re.sub(
        r"\s+",
        " ",
        text.replace(
            "&nbsp;",
            " ",
        ).replace(
            "&amp;",
            "&",
        ),
    ).strip()


def filename_title(
    relative_path: str,
) -> str:
    return re.sub(
        r"\s+",
        " ",
        re.sub(
            r"[-_]+",
            " ",
            Path(relative_path).stem,
        ),
    ).strip().title()


def parse_markdown(
    markdown: str,
    fallback_title: str,
) -> dict[str, Any]:
    lines = markdown.replace(
        "\r\n",
        "\n",
    ).replace(
        "\r",
        "\n",
    ).splitlines()

    title = fallback_title
    in_code = False

    for line in lines:
        if line.lstrip().startswith(
            "```"
        ):
            in_code = not in_code
            continue

        if in_code:
            continue

        match = re.match(
            r"^#\s+(.+?)\s*#*\s*$",
            line,
        )

        if match:
            title = (
                clean_text(
                    match.group(1)
                )
                or fallback_title
            )

            break

    sections: list[
        dict[str, Any]
    ] = []

    anchors: dict[str, int] = {}
    heading_path: list[str] = []

    current_title = "Overview"
    current_level = 1
    current_anchor = "overview"
    current_path = ["Overview"]
    current_lines: list[str] = []

    def flush() -> None:
        markdown_value = "\n".join(
            current_lines
        ).strip()

        plain_value = clean_text(
            markdown_value
        )

        if (
            not markdown_value
            and not plain_value
        ):
            return

        sections.append(
            {
                "title": current_title,
                "level": current_level,
                "anchor": current_anchor,
                "headingPath": list(
                    current_path
                ),
                "markdown": markdown_value,
                "plainText": plain_value,
                "wordCount": len(
                    plain_value.split()
                ),
            }
        )

    in_code = False

    for line in lines:
        if line.lstrip().startswith(
            "```"
        ):
            in_code = not in_code
            current_lines.append(line)
            continue

        if not in_code:
            match = re.match(
                r"^(#{1,6})\s+(.+?)\s*#*\s*$",
                line,
            )

            if match:
                flush()

                level = len(
                    match.group(1)
                )

                section_title = (
                    clean_text(
                        match.group(2)
                    )
                    or "Section"
                )

                base_anchor = (
                    slug(section_title)
                    or "section"
                )

                count = (
                    anchors.get(
                        base_anchor,
                        0,
                    )
                    + 1
                )

                anchors[
                    base_anchor
                ] = count

                anchor = (
                    base_anchor
                    if count == 1
                    else f"{base_anchor}-{count}"
                )

                heading_path = heading_path[
                    : max(
                        level - 1,
                        0,
                    )
                ]

                while (
                    len(heading_path)
                    < level - 1
                ):
                    heading_path.append(
                        ""
                    )

                heading_path.append(
                    section_title
                )

                current_title = (
                    section_title
                )

                current_level = level
                current_anchor = anchor

                current_path = [
                    item
                    for item in heading_path
                    if item
                ]

                current_lines = [line]
                continue

        current_lines.append(line)

    flush()

    if not sections:
        plain = clean_text(
            markdown
        )

        sections = [
            {
                "title": "Overview",
                "level": 1,
                "anchor": "overview",
                "headingPath": [
                    "Overview"
                ],
                "markdown": markdown,
                "plainText": plain,
                "wordCount": len(
                    plain.split()
                ),
            }
        ]

    return {
        "title": title,
        "plainText": clean_text(
            markdown
        ),
        "sections": sections,
    }


def remote_branch(
    remote: str,
    fallback: str,
) -> str | None:
    result = command(
        [
            "git",
            "ls-remote",
            "--symref",
            remote,
            "HEAD",
        ],
        required=False,
    )

    if result.returncode != 0:
        return None

    if not result.stdout.strip():
        return None

    match = re.search(
        r"ref:\s+refs/heads/([^\s]+)\s+HEAD",
        result.stdout,
    )

    return (
        match.group(1)
        if match
        else fallback
    )


def update_clone(
    remote: str,
    branch: str,
    destination: Path,
) -> None:
    destination.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    if (
        destination
        / ".git"
    ).is_dir():
        command(
            [
                "git",
                "remote",
                "set-url",
                "origin",
                remote,
            ],
            cwd=destination,
        )

        command(
            [
                "git",
                "fetch",
                "--depth",
                "1",
                "origin",
                branch,
            ],
            cwd=destination,
        )

        command(
            [
                "git",
                "reset",
                "--hard",
                "FETCH_HEAD",
            ],
            cwd=destination,
        )

        command(
            [
                "git",
                "clean",
                "-fdx",
            ],
            cwd=destination,
        )

        return

    shutil.rmtree(
        destination,
        ignore_errors=True,
    )

    command(
        [
            "git",
            "clone",
            "--depth",
            "1",
            "--single-branch",
            "--branch",
            branch,
            remote,
            str(destination),
        ]
    )


def tracked_files(
    repository: Path,
) -> list[Path]:
    result = command(
        [
            "git",
            "ls-files",
            "-z",
        ],
        cwd=repository,
    )

    return [
        repository / relative
        for relative in result.stdout.split(
            "\0"
        )
        if relative
    ]


def repository_documents(
    repository: Path,
) -> list[Path]:
    output: list[Path] = []

    for file in tracked_files(
        repository
    ):
        if (
            file.suffix.lower()
            not in MARKDOWN_EXTENSIONS
        ):
            continue

        relative = file.relative_to(
            repository
        )

        if (
            len(relative.parts) == 1
            and relative.stem.lower()
            == "readme"
        ):
            output.append(file)
            continue

        if (
            len(relative.parts) > 1
            and relative.parts[
                0
            ].lower()
            in DOC_DIRECTORIES
        ):
            output.append(file)

    return sorted(output)


def wiki_documents(
    repository: Path,
) -> list[Path]:
    output: list[Path] = []

    for file in tracked_files(
        repository
    ):
        if (
            file.suffix.lower()
            not in MARKDOWN_EXTENSIONS
        ):
            continue

        if file.name.lower() in {
            "_sidebar.md",
            "_footer.md",
        }:
            continue

        output.append(file)

    return sorted(output)


def source_url(
    repository_url: str,
    source_type: str,
    relative_path: str,
    revision: str,
) -> str:
    if source_type == "wiki":
        page = Path(
            relative_path
        ).stem

        return (
            f"{repository_url}/wiki/"
            f"{quote(page, safe='')}"
        )

    encoded = "/".join(
        quote(
            part,
            safe="",
        )
        for part in Path(
            relative_path
        ).parts
    )

    return (
        f"{repository_url}/blob/"
        f"{revision}/{encoded}"
    )


def base_route(
    project_id: str,
    source_type: str,
    relative_path: str,
) -> str:
    path_value = Path(
        relative_path
    )

    stem = path_value.stem.lower()

    if (
        source_type == "wiki"
        and stem == "home"
    ):
        return (
            f"/docs/{project_id}"
        )

    if (
        source_type
        == "repository"
        and stem == "readme"
        and len(
            path_value.parts
        )
        == 1
    ):
        return (
            f"/docs/{project_id}/"
            "repository-readme"
        )

    page_slug = (
        slug(
            str(
                path_value.with_suffix(
                    ""
                )
            )
        )
        or "document"
    )

    return (
        f"/docs/{project_id}/"
        f"{page_slug}"
    )


def write_json(
    path: Path,
    value: Any,
    *,
    compact: bool = False,
) -> None:
    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    path.write_text(
        json.dumps(
            value,
            ensure_ascii=False,
            indent=(
                None
                if compact
                else 2
            ),
            separators=(
                (",", ":")
                if compact
                else None
            ),
        )
        + (
            ""
            if compact
            else "\n"
        ),
        encoding="utf-8",
    )


def main() -> None:
    inventory = json.loads(
        INVENTORY.read_text(
            encoding="utf-8"
        )
    )

    if not isinstance(
        inventory,
        list,
    ):
        raise RuntimeError(
            "Repository inventory is not an array."
        )

    shutil.rmtree(
        GENERATED,
        ignore_errors=True,
    )

    shutil.rmtree(
        PUBLIC_INDEX,
        ignore_errors=True,
    )

    GENERATED.mkdir(
        parents=True,
        exist_ok=True,
    )

    PUBLIC_INDEX.mkdir(
        parents=True,
        exist_ok=True,
    )

    documents: list[
        dict[str, Any]
    ] = []

    sources: list[
        dict[str, Any]
    ] = []

    failures: list[
        dict[str, str]
    ] = []

    for item in inventory:
        repository = str(
            item.get(
                "repository"
            )
            or ""
        ).strip()

        repository_url = str(
            item.get(
                "repositoryUrl"
            )
            or ""
        ).strip().rstrip("/")

        if (
            not repository
            or not repository_url
            or "github.com/ForestOfLight/"
            not in repository_url
        ):
            continue

        raw_project_id = item.get(
            "siteProjectId"
        )

        project_id = (
            slug(raw_project_id)
            or slug(repository)
        )

        if not project_id:
            raise RuntimeError(
                "Could not derive a project ID "
                f"for {repository}."
            )

        groups: list[
            tuple[
                str,
                Path,
                str,
                str,
                list[Path],
            ]
        ] = []

        repository_remote = (
            repository_url
            if repository_url.endswith(
                ".git"
            )
            else repository_url
            + ".git"
        )

        branch = remote_branch(
            repository_remote,
            str(
                item.get(
                    "defaultBranch"
                )
                or "main"
            ),
        )

        if branch:
            destination = (
                CACHE
                / "repositories"
                / slug(repository)
            )

            try:
                update_clone(
                    repository_remote,
                    branch,
                    destination,
                )

                revision = command(
                    [
                        "git",
                        "rev-parse",
                        "HEAD",
                    ],
                    cwd=destination,
                ).stdout.strip()

                files = repository_documents(
                    destination
                )

                groups.append(
                    (
                        "repository",
                        destination,
                        branch,
                        revision,
                        files,
                    )
                )

                sources.append(
                    {
                        "repository": repository,
                        "projectId": project_id,
                        "sourceType": "repository",
                        "branch": branch,
                        "revision": revision,
                        "fileCount": len(files),
                    }
                )
            except Exception as error:
                failures.append(
                    {
                        "repository": repository,
                        "source": "repository",
                        "error": str(error),
                    }
                )

        wiki_remote = (
            "https://github.com/"
            f"ForestOfLight/{repository}.wiki.git"
        )

        wiki_branch = remote_branch(
            wiki_remote,
            "master",
        )

        if wiki_branch:
            destination = (
                CACHE
                / "wikis"
                / slug(repository)
            )

            try:
                update_clone(
                    wiki_remote,
                    wiki_branch,
                    destination,
                )

                revision = command(
                    [
                        "git",
                        "rev-parse",
                        "HEAD",
                    ],
                    cwd=destination,
                ).stdout.strip()

                files = wiki_documents(
                    destination
                )

                groups.insert(
                    0,
                    (
                        "wiki",
                        destination,
                        wiki_branch,
                        revision,
                        files,
                    ),
                )

                sources.append(
                    {
                        "repository": repository,
                        "projectId": project_id,
                        "sourceType": "wiki",
                        "branch": wiki_branch,
                        "revision": revision,
                        "fileCount": len(files),
                    }
                )
            except Exception as error:
                failures.append(
                    {
                        "repository": repository,
                        "source": "wiki",
                        "error": str(error),
                    }
                )

        for (
            source_type,
            directory,
            source_branch,
            revision,
            files,
        ) in groups:
            for file in files:
                relative_path = (
                    file.relative_to(
                        directory
                    ).as_posix()
                )

                markdown = (
                    file.read_text(
                        encoding="utf-8",
                        errors="replace",
                    )
                    .replace(
                        "\r\n",
                        "\n",
                    )
                    .replace(
                        "\r",
                        "\n",
                    )
                    .strip()
                )

                if not markdown:
                    continue

                fallback_title = (
                    repository
                    if Path(
                        relative_path
                    ).stem.lower()
                    == "readme"
                    else filename_title(
                        relative_path
                    )
                )

                parsed = parse_markdown(
                    markdown,
                    fallback_title,
                )

                identity_seed = (
                    f"{repository}|"
                    f"{source_type}|"
                    f"{relative_path}"
                )

                path_digest = digest(
                    identity_seed,
                    10,
                )

                document_id = (
                    f"{project_id}--"
                    f"{source_type}--"
                    f"{slug(relative_path) or 'document'}--"
                    f"{path_digest}"
                )

                document_route = base_route(
                    project_id,
                    source_type,
                    relative_path,
                )

                documents.append(
                    {
                        "id": document_id,
                        "projectId": project_id,
                        "projectTitle": repository,
                        "repository": repository,
                        "repositoryUrl": repository_url,
                        "sourceType": source_type,
                        "sourcePath": relative_path,
                        "sourceUrl": source_url(
                            repository_url,
                            source_type,
                            relative_path,
                            revision,
                        ),
                        "sourceRevision": revision,
                        "sourceBranch": source_branch,
                        "retrievedAt": NOW,
                        "title": parsed["title"],
                        "route": document_route,
                        "markdown": markdown,
                        "plainText": parsed[
                            "plainText"
                        ],
                        "contentHash": digest(
                            markdown
                        ),
                        "wordCount": len(
                            str(
                                parsed[
                                    "plainText"
                                ]
                            ).split()
                        ),
                        "sections": parsed[
                            "sections"
                        ],
                    }
                )

    used_routes: dict[
        str,
        str,
    ] = {}

    for document in documents:
        route = str(
            document["route"]
        )

        if route in used_routes:
            route = (
                f"{route}-"
                f"{digest(str(document['id']), 8)}"
            )

        used_routes[
            route
        ] = str(
            document["id"]
        )

        document["route"] = route

    documents.sort(
        key=lambda document: (
            str(
                document[
                    "projectTitle"
                ]
            ).lower(),
            (
                0
                if document[
                    "sourceType"
                ]
                == "wiki"
                else 1
            ),
            str(
                document["route"]
            ),
        )
    )

    write_json(
        GENERATED
        / "corpus.json",
        {
            "schemaVersion": 1,
            "generatedAt": NOW,
            "documents": documents,
        },
    )

    project_entries: dict[
        str,
        list[dict[str, Any]],
    ] = {}

    for document in documents:
        entries = project_entries.setdefault(
            str(
                document[
                    "projectId"
                ]
            ),
            [],
        )

        for section in document[
            "sections"
        ]:
            text = str(
                section.get(
                    "plainText"
                )
                or ""
            )

            heading_path = [
                str(item)
                for item in section.get(
                    "headingPath",
                    [],
                )
            ]

            entries.append(
                {
                    "id": (
                        f"{document['id']}#"
                        f"{section['anchor']}"
                    ),
                    "documentId": document[
                        "id"
                    ],
                    "projectId": document[
                        "projectId"
                    ],
                    "projectTitle": document[
                        "projectTitle"
                    ],
                    "repository": document[
                        "repository"
                    ],
                    "sourceType": document[
                        "sourceType"
                    ],
                    "route": (
                        f"{document['route']}#"
                        f"{section['anchor']}"
                    ),
                    "documentTitle": document[
                        "title"
                    ],
                    "sectionTitle": section[
                        "title"
                    ],
                    "headingPath": heading_path,
                    "sourceUrl": document[
                        "sourceUrl"
                    ],
                    "text": text[:3000],
                    "searchText": re.sub(
                        r"\s+",
                        " ",
                        " ".join(
                            [
                                str(
                                    document[
                                        "projectTitle"
                                    ]
                                ),
                                str(
                                    document[
                                        "title"
                                    ]
                                ),
                                str(
                                    section[
                                        "title"
                                    ]
                                ),
                                *heading_path,
                                text,
                            ]
                        ).lower(),
                    ).strip()[:6000],
                }
            )

    projects: list[
        dict[str, Any]
    ] = []

    for project_id in sorted(
        project_entries
    ):
        entries = project_entries[
            project_id
        ]

        shard = {
            "schemaVersion": 1,
            "projectId": project_id,
            "entries": entries,
        }

        serialized = json.dumps(
            shard,
            ensure_ascii=False,
            separators=(",", ":"),
        )

        shard_hash = digest(
            serialized,
            16,
        )

        filename = (
            f"{project_id}."
            f"{shard_hash}.json"
        )

        target = (
            PUBLIC_INDEX
            / filename
        )

        target.write_text(
            serialized,
            encoding="utf-8",
        )

        projects.append(
            {
                "projectId": project_id,
                "projectTitle": (
                    entries[0][
                        "projectTitle"
                    ]
                    if entries
                    else project_id
                ),
                "file": (
                    f"/_docs-index/"
                    f"{filename}"
                ),
                "hash": shard_hash,
                "entries": len(entries),
                "bytes": target.stat().st_size,
            }
        )

    manifest = {
        "schemaVersion": 1,
        "generatedAt": NOW,
        "projects": projects,
        "totalEntries": sum(
            int(
                project["entries"]
            )
            for project in projects
        ),
    }

    write_json(
        GENERATED
        / "index-manifest.json",
        manifest,
    )

    write_json(
        PUBLIC_INDEX
        / "manifest.json",
        manifest,
        compact=True,
    )

    write_json(
        GENERATED
        / "sources.json",
        {
            "schemaVersion": 1,
            "generatedAt": NOW,
            "sources": sources,
            "failures": failures,
        },
    )

    report = {
        "repositories": len(
            {
                document[
                    "repository"
                ]
                for document in documents
            }
        ),
        "sources": len(sources),
        "documents": len(documents),
        "wikiDocuments": len(
            [
                document
                for document in documents
                if document[
                    "sourceType"
                ]
                == "wiki"
            ]
        ),
        "sections": sum(
            len(
                document[
                    "sections"
                ]
            )
            for document in documents
        ),
        "searchEntries": manifest[
            "totalEntries"
        ],
        "indexedProjects": len(
            projects
        ),
        "sourceFailures": len(
            failures
        ),
        "corpusBytes": (
            GENERATED
            / "corpus.json"
        ).stat().st_size,
        "searchBytes": sum(
            int(
                project["bytes"]
            )
            for project in projects
        ),
    }

    write_json(
        GENERATED
        / "report.json",
        report,
    )

    print(
        json.dumps(
            report,
            indent=2,
        )
    )

    if not documents:
        raise RuntimeError(
            "No documentation was generated."
        )


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(
            f"Documentation sync failed: {error}",
            file=sys.stderr,
        )

        raise SystemExit(1)
