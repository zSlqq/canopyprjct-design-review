#!/usr/bin/env python3
from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable
import json
import os
import re
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT / "lib" / "data" / "generated"

CATALOG_PATH = GENERATED / "feature-catalog.json"
INVENTORY_PATH = GENERATED / "repository-inventory.json"
QUEUE_PATH = GENERATED / "feature-review-queue.json"
CACHE_PATH = GENERATED / "source-document-cache.json"
REPORT_PATH = GENERATED / "feature-content-report.json"
AUDIT_PATH = ROOT / "FEATURE-CONTENT-AUDIT.md"

OWNER = "ForestOfLight"
USER_AGENT = "ForestOfLight-Feature-Enrichment"

REQUIREMENT_TERMS = (
    "require",
    "required",
    "requires",
    "prerequisite",
    "dependency",
    "depends on",
    "permission",
    "operator",
    "admin",
    "experiment",
    "experimental",
    "must have",
    "must be",
    "enable ",
)

NOTE_TERMS = (
    "note:",
    "warning:",
    "important:",
    "caution:",
    "deprecated",
    "only works",
    "only available",
    "not supported",
    "known issue",
)


def now() -> str:
    return datetime.now(
        timezone.utc,
    ).isoformat(
        timespec="seconds",
    )


def clean(value: str) -> str:
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

    value = re.sub(
        r"^\s*(?:[-*+]|\d+[.)])\s+",
        "",
        value,
    )

    return re.sub(
        r"\s+",
        " ",
        value,
    ).strip()


def key(value: str) -> str:
    return re.sub(
        r"[^a-z0-9:/._-]+",
        " ",
        value.lower(),
    ).strip()


def unique(
    values: Iterable[str],
) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()

    for value in values:
        cleaned = clean(
            str(value)
        )

        normalized = key(
            cleaned
        )

        if (
            not cleaned
            or not normalized
            or normalized in seen
        ):
            continue

        seen.add(normalized)
        result.append(cleaned)

    return result


def fetch_text(
    url: str,
    attempts: int = 3,
) -> str:
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/plain",
    }

    token = os.environ.get(
        "GITHUB_TOKEN",
        "",
    ).strip()

    if token:
        headers["Authorization"] = (
            f"Bearer {token}"
        )

    last_error: Exception | None = None

    for attempt in range(
        1,
        attempts + 1,
    ):
        request = urllib.request.Request(
            url,
            headers=headers,
        )

        try:
            with urllib.request.urlopen(
                request,
                timeout=35,
            ) as response:
                return response.read().decode(
                    "utf-8",
                    errors="replace",
                )

        except Exception as error:
            last_error = error

        if attempt < attempts:
            time.sleep(attempt * 2)

    raise RuntimeError(
        f"Unable to fetch {url}: "
        f"{last_error}"
    )


def raw_url(
    repository: str,
    source_path: str,
    branch: str,
) -> str:
    if source_path.startswith(
        "wiki/"
    ):
        wiki_path = (
            source_path.removeprefix(
                "wiki/"
            )
        )

        encoded = "/".join(
            urllib.parse.quote(part)
            for part in wiki_path.split("/")
        )

        return (
            "https://raw.githubusercontent.com/"
            f"wiki/{OWNER}/{repository}/"
            f"{encoded}"
        )

    encoded = "/".join(
        urllib.parse.quote(part)
        for part in source_path.split("/")
    )

    return (
        "https://raw.githubusercontent.com/"
        f"{OWNER}/{repository}/"
        f"{branch}/{encoded}"
    )


def heading(
    line: str,
) -> tuple[int, str] | None:
    match = re.match(
        r"^(#{1,6})\s+(.+?)\s*$",
        line,
    )

    if not match:
        return None

    return (
        len(match.group(1)),
        clean(match.group(2)),
    )


def section_lines(
    document: str,
    source_line: int,
    section_name: str,
) -> tuple[list[str], int]:
    lines = document.splitlines()

    if not lines:
        return [], 0

    target = min(
        max(source_line - 1, 0),
        len(lines) - 1,
    )

    wanted = key(
        section_name
    )

    matching: list[
        tuple[int, int]
    ] = []

    for index, line in enumerate(
        lines
    ):
        parsed = heading(line)

        if (
            parsed
            and key(parsed[1]) == wanted
        ):
            matching.append(
                (index, parsed[0])
            )

    if matching:
        start, level = min(
            matching,
            key=lambda item:
                abs(item[0] - target),
        )
    else:
        start = 0
        level = 0

        for index in range(
            target,
            -1,
            -1,
        ):
            parsed = heading(
                lines[index]
            )

            if parsed:
                start = index
                level = parsed[0]
                break

    end = len(lines)

    if level:
        for index in range(
            start + 1,
            len(lines),
        ):
            parsed = heading(
                lines[index]
            )

            if (
                parsed
                and parsed[0] <= level
            ):
                end = index
                break

    content_start = (
        start + 1
        if heading(lines[start])
        else start
    )

    relative_target = max(
        0,
        target - content_start,
    )

    return (
        lines[
            content_start:end
        ],
        relative_target,
    )


def split_words(
    value: str,
) -> str:
    value = re.sub(
        r"([a-z0-9])([A-Z])",
        r"\1 \2",
        value,
    )

    value = re.sub(
        r"[-_]+",
        " ",
        value,
    )

    return re.sub(
        r"\s+",
        " ",
        value,
    ).strip()


def derive_aliases(
    feature: dict[str, Any],
) -> list[str]:
    title = str(
        feature.get(
            "title",
            "",
        )
    ).strip()

    syntax = str(
        feature.get(
            "usage",
            {},
        ).get(
            "syntax",
            "",
        )
        or ""
    ).strip()

    candidates: list[str] = list(
        feature.get(
            "aliases",
            [],
        )
    )

    title_variants = [
        split_words(title),
        title.replace(" ", ""),
        title.replace(" ", "-"),
    ]

    candidates.extend(
        title_variants
    )

    if syntax:
        root = syntax.split(
            maxsplit=1
        )[0]

        root_without_slash = (
            root.lstrip("/")
        )

        candidates.extend(
            [
                root,
                root_without_slash,
                split_words(
                    root_without_slash
                ),
            ]
        )

        if ":" in root_without_slash:
            namespace, command = (
                root_without_slash.split(
                    ":",
                    1,
                )
            )

            candidates.extend(
                [
                    command,
                    f"/{command}",
                    split_words(command),
                    f"{namespace} {command}",
                ]
            )

    title_key = key(title)
    syntax_key = key(syntax)

    return [
        alias
        for alias in unique(
            candidates
        )
        if key(alias)
        not in {
            title_key,
            syntax_key,
        }
    ]


def command_like(
    value: str,
    syntax: str,
) -> bool:
    stripped = value.strip()

    if (
        not stripped
        or len(stripped) > 320
    ):
        return False

    lowered = stripped.lower()

    if lowered.startswith(
        (
            "http://",
            "https://",
        )
    ):
        return False

    syntax_root = (
        syntax.split(
            maxsplit=1
        )[0].lstrip("/")
        if syntax
        else ""
    )

    return bool(
        stripped.startswith(
            (
                "/",
                "!",
                ".",
            )
        )
        or re.match(
            r"^[a-z0-9_-]+:"
            r"[a-z0-9_-]+",
            stripped,
            re.IGNORECASE,
        )
        or (
            syntax_root
            and syntax_root.lower()
            in lowered
            and len(
                stripped.split()
            ) > 1
        )
    )


def extract_examples(
    lines: list[str],
    syntax: str,
) -> list[str]:
    examples: list[str] = []
    fenced = False

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("```"):
            fenced = not fenced
            continue

        if fenced:
            if command_like(
                stripped,
                syntax,
            ):
                examples.append(
                    stripped
                )

            continue

        for inline in re.findall(
            r"`([^`\n]+)`",
            line,
        ):
            if command_like(
                inline,
                syntax,
            ):
                examples.append(
                    inline
                )

    return unique(
        examples
    )[:8]


def extract_steps(
    lines: list[str],
) -> list[str]:
    steps: list[str] = []

    for line in lines:
        match = re.match(
            r"^\s*\d+[.)]\s+(.+?)\s*$",
            line,
        )

        if not match:
            continue

        value = clean(
            match.group(1)
        )

        if (
            4 <= len(value) <= 320
        ):
            steps.append(value)

    return unique(
        steps
    )[:12]


def extract_requirements(
    lines: list[str],
) -> list[str]:
    values: list[str] = []

    for line in lines:
        cleaned = clean(line)
        lowered = cleaned.lower()

        if (
            not cleaned
            or len(cleaned) > 320
        ):
            continue

        if any(
            term in lowered
            for term in REQUIREMENT_TERMS
        ):
            values.append(cleaned)

    return unique(
        values
    )[:10]


def extract_notes(
    lines: list[str],
) -> list[str]:
    values: list[str] = []

    for line in lines:
        cleaned = clean(line)
        lowered = cleaned.lower()

        if (
            not cleaned
            or len(cleaned) > 320
        ):
            continue

        if (
            line.strip().startswith(">")
            or any(
                term in lowered
                for term in NOTE_TERMS
            )
        ):
            values.append(cleaned)

    return unique(
        values
    )[:10]


def find_summary(
    lines: list[str],
    target: int,
) -> str:
    indexes = list(
        range(
            target + 1,
            min(
                len(lines),
                target + 8,
            ),
        )
    )

    indexes.extend(
        range(
            max(0, target - 5),
            target,
        )
    )

    for index in indexes:
        line = lines[index]
        stripped = line.strip()

        if (
            not stripped
            or stripped.startswith(
                (
                    "#",
                    "```",
                    "|",
                    ">",
                )
            )
            or re.match(
                r"^\s*(?:[-*+]|\d+[.)])\s+",
                line,
            )
        ):
            continue

        summary = clean(line)

        if (
            12 <= len(summary) <= 500
        ):
            return summary

    return ""


def metrics(
    catalog: list[
        dict[str, Any]
    ],
) -> dict[str, int]:
    return {
        "entries": len(catalog),
        "aliases": sum(
            bool(
                entry.get(
                    "aliases"
                )
            )
            for entry in catalog
        ),
        "summaries": sum(
            bool(
                entry["usage"].get(
                    "summary"
                )
            )
            for entry in catalog
        ),
        "steps": sum(
            bool(
                entry["usage"].get(
                    "steps"
                )
            )
            for entry in catalog
        ),
        "examples": sum(
            bool(
                entry["usage"].get(
                    "examples"
                )
            )
            for entry in catalog
        ),
        "prerequisites": sum(
            bool(
                entry["usage"].get(
                    "prerequisites"
                )
            )
            for entry in catalog
        ),
        "notes": sum(
            bool(
                entry["usage"].get(
                    "notes"
                )
            )
            for entry in catalog
        ),
    }


def enrich(
    feature: dict[str, Any],
    document: str | None,
) -> dict[str, Any]:
    result = json.loads(
        json.dumps(feature)
    )

    usage = result.setdefault(
        "usage",
        {},
    )

    usage.setdefault(
        "syntax",
        None,
    )

    usage.setdefault(
        "summary",
        "",
    )

    for field in (
        "steps",
        "examples",
        "prerequisites",
        "notes",
    ):
        usage.setdefault(
            field,
            [],
        )

    result["aliases"] = (
        derive_aliases(result)
    )

    if not document:
        return result

    source = result["source"]

    lines, target = section_lines(
        document,
        int(
            source.get(
                "line",
                1,
            )
            or 1
        ),
        str(
            source.get(
                "section",
                "",
            )
        ),
    )

    if not lines:
        return result

    syntax = str(
        usage.get(
            "syntax",
            "",
        )
        or ""
    )

    if not usage["summary"]:
        usage["summary"] = (
            find_summary(
                lines,
                target,
            )
        )

    usage["steps"] = unique(
        [
            *usage["steps"],
            *extract_steps(lines),
        ]
    )

    usage["examples"] = unique(
        [
            *usage["examples"],
            *extract_examples(
                lines,
                syntax,
            ),
        ]
    )

    usage["prerequisites"] = unique(
        [
            *usage[
                "prerequisites"
            ],
            *extract_requirements(
                lines
            ),
        ]
    )

    usage["notes"] = unique(
        [
            *usage["notes"],
            *extract_notes(lines),
        ]
    )

    return result


def review_queue(
    catalog: list[
        dict[str, Any]
    ],
) -> list[dict[str, Any]]:
    queue: list[
        dict[str, Any]
    ] = []

    for entry in catalog:
        usage = entry["usage"]
        missing: list[str] = []

        if not usage["summary"]:
            missing.append(
                "summary"
            )

        if (
            entry["kind"] == "command"
            and not usage["examples"]
        ):
            missing.append(
                "documented example"
            )

        if (
            entry["kind"]
            in {
                "command",
                "rule",
                "configuration",
                "workflow",
            }
            and not usage["steps"]
        ):
            missing.append(
                "documented steps"
            )

        if missing:
            queue.append(
                {
                    "id": entry["id"],
                    "repository":
                        entry[
                            "repository"
                        ],
                    "title":
                        entry["title"],
                    "missing":
                        missing,
                    "sourceUrl":
                        entry[
                            "source"
                        ]["url"],
                }
            )

    return queue


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


def main() -> None:
    catalog = json.loads(
        CATALOG_PATH.read_text(
            encoding="utf-8",
        )
    )

    inventory = json.loads(
        INVENTORY_PATH.read_text(
            encoding="utf-8",
        )
    )

    if not catalog:
        raise RuntimeError(
            "Feature catalog is empty."
        )

    branches = {
        item["repository"]:
            item.get(
                "defaultBranch",
                "main",
            )
        for item in inventory
    }

    cache: dict[
        str,
        dict[str, Any],
    ] = {}

    if CACHE_PATH.exists():
        try:
            loaded = json.loads(
                CACHE_PATH.read_text(
                    encoding="utf-8",
                )
            )

            if isinstance(
                loaded,
                dict,
            ):
                cache = loaded

        except Exception:
            cache = {}

    sources = sorted(
        {
            (
                entry[
                    "repository"
                ],
                entry[
                    "source"
                ]["path"],
            )
            for entry in catalog
        }
    )

    failures: list[
        dict[str, str]
    ] = []

    fetched = 0

    for repository, source_path in sources:
        cache_key = (
            f"{repository}|"
            f"{source_path}"
        )

        url = raw_url(
            repository,
            source_path,
            branches.get(
                repository,
                "main",
            ),
        )

        try:
            text = fetch_text(url)

            cache[cache_key] = {
                "repository":
                    repository,
                "path":
                    source_path,
                "rawUrl": url,
                "retrievedAt":
                    now(),
                "text": text,
            }

            fetched += 1

            print(
                f"FETCHED: "
                f"{repository}/"
                f"{source_path}"
            )

        except Exception as error:
            existing = cache.get(
                cache_key
            )

            if (
                existing
                and existing.get(
                    "text"
                )
            ):
                print(
                    f"CACHED: "
                    f"{repository}/"
                    f"{source_path}"
                )
            else:
                failures.append(
                    {
                        "repository":
                            repository,
                        "path":
                            source_path,
                        "error":
                            str(error),
                    }
                )

                print(
                    f"FAILED: "
                    f"{repository}/"
                    f"{source_path}"
                )

    before = metrics(catalog)

    enriched = [
        enrich(
            entry,
            cache.get(
                (
                    f"{entry['repository']}|"
                    f"{entry['source']['path']}"
                ),
                {},
            ).get("text"),
        )
        for entry in catalog
    ]

    after = metrics(enriched)
    queue = review_queue(enriched)

    report = {
        "generatedAt": now(),
        "documentsRequested":
            len(sources),
        "documentsFetched":
            fetched,
        "documentsAvailable":
            sum(
                bool(
                    record.get(
                        "text"
                    )
                )
                for record in
                cache.values()
            ),
        "failedSources":
            failures,
        "before": before,
        "after": after,
        "reviewQueueEntries":
            len(queue),
        "kindCounts":
            dict(
                Counter(
                    entry["kind"]
                    for entry in enriched
                )
            ),
    }

    lines = [
        "# ForestOfLight Feature Content Audit",
        "",
        f"Generated: {report['generatedAt']}",
        "",
        "## Source coverage",
        "",
        (
            f"- Documents requested: "
            f"{report['documentsRequested']}"
        ),
        (
            f"- Documents fetched: "
            f"{report['documentsFetched']}"
        ),
        (
            f"- Documents available: "
            f"{report['documentsAvailable']}"
        ),
        (
            f"- Failed documents: "
            f"{len(failures)}"
        ),
        "",
        "## Content coverage",
        "",
        "| Field | Before | After |",
        "|---|---:|---:|",
    ]

    for field in (
        "aliases",
        "summaries",
        "steps",
        "examples",
        "prerequisites",
        "notes",
    ):
        lines.append(
            f"| {field} | "
            f"{before[field]} | "
            f"{after[field]} |"
        )

    lines.extend(
        [
            "",
            "## Review queue",
            "",
            (
                f"- Entries requiring "
                f"manual review: "
                f"{len(queue)}"
            ),
            "",
            (
                "Aliases are only added when "
                "they differ meaningfully from "
                "the title or exact syntax."
            ),
            "",
            (
                "Steps, examples, requirements, "
                "and notes remain source-backed."
            ),
            "",
        ]
    )

    write_json(
        CATALOG_PATH,
        enriched,
    )

    write_json(
        QUEUE_PATH,
        queue,
    )

    write_json(
        CACHE_PATH,
        cache,
    )

    write_json(
        REPORT_PATH,
        report,
    )

    AUDIT_PATH.write_text(
        "\n".join(lines) + "\n",
        encoding="utf-8",
    )

    print()
    print(
        "Entries:",
        after["entries"],
    )

    print(
        "Aliases:",
        after["aliases"],
    )

    print(
        "Summaries:",
        after["summaries"],
    )

    print(
        "Steps:",
        after["steps"],
    )

    print(
        "Examples:",
        after["examples"],
    )

    print(
        "Requirements:",
        after[
            "prerequisites"
        ],
    )

    print(
        "Notes:",
        after["notes"],
    )

    print(
        "Review queue:",
        len(queue),
    )


if __name__ == "__main__":
    main()
