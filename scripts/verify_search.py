#!/usr/bin/env python3

from __future__ import annotations

import hashlib
import json
import re
import sys
import time

from pathlib import Path
from typing import Any


ROOT = Path.cwd()

CORPUS_PATH = (
    ROOT
    / "lib/data/generated/docs/corpus.json"
)

MANIFEST_PATH = (
    ROOT
    / "lib/data/generated/docs/index-manifest.json"
)

PUBLIC_MANIFEST_PATH = (
    ROOT
    / "public/_docs-index/manifest.json"
)

WORKER_PATH = (
    ROOT
    / "public/docs-search-worker.js"
)

REPORT_PATH = (
    ROOT
    / "lib/data/generated/docs/search-report.json"
)


def load_json(
    path: Path,
) -> Any:
    return json.loads(
        path.read_text(
            encoding="utf-8"
        )
    )


def sha256(
    value: str,
) -> str:
    return hashlib.sha256(
        value.encode(
            "utf-8"
        )
    ).hexdigest()


def normalize(
    value: str,
) -> str:
    return re.sub(
        r"\s+",
        " ",
        re.sub(
            r"[^a-z0-9._:/+\-]+",
            " ",
            value.lower(),
        ),
    ).strip()


def simple_score(
    entry: dict[str, Any],
    query: str,
) -> int:
    phrase = normalize(
        query
    )

    tokens = [
        token
        for token in phrase.split()
        if len(token) >= 2
    ]

    title = normalize(
        str(
            entry.get(
                "documentTitle",
                "",
            )
        )
    )

    section = normalize(
        str(
            entry.get(
                "sectionTitle",
                "",
            )
        )
    )

    headings = normalize(
        " ".join(
            str(item)
            for item in entry.get(
                "headingPath",
                [],
            )
        )
    )

    body = normalize(
        str(
            entry.get(
                "searchText",
                "",
            )
        )
    )

    combined = " ".join(
        [
            title,
            section,
            headings,
            body,
        ]
    )

    if not any(
        token in combined
        for token in tokens
    ):
        return 0

    total = 0

    if section == phrase:
        total += 300
    elif phrase in section:
        total += 220

    if title == phrase:
        total += 260
    elif phrase in title:
        total += 180

    if phrase in headings:
        total += 135

    if phrase in body:
        total += 62

    matched = 0

    for token in tokens:
        if token in combined:
            matched += 1
            total += 32

        if token in section:
            total += 72

        if token in title:
            total += 62

    if (
        len(tokens) > 1
        and matched == len(tokens)
    ):
        total += 130

    return total


def main() -> None:
    corpus = load_json(
        CORPUS_PATH
    )

    manifest = load_json(
        MANIFEST_PATH
    )

    public_manifest = load_json(
        PUBLIC_MANIFEST_PATH
    )

    if manifest != public_manifest:
        raise RuntimeError(
            "Generated and public search manifests differ."
        )

    documents = corpus.get(
        "documents",
        [],
    )

    routes = {
        str(
            document["route"]
        )
        for document in documents
    }

    projects = manifest.get(
        "projects",
        [],
    )

    if not projects:
        raise RuntimeError(
            "Search manifest has no projects."
        )

    project_ids: set[str] = set()
    entry_ids: set[str] = set()

    entries: list[
        dict[str, Any]
    ] = []

    total_bytes = 0

    for project in projects:
        project_id = str(
            project["projectId"]
        )

        if project_id in project_ids:
            raise RuntimeError(
                "Duplicate project shard: "
                + project_id
            )

        project_ids.add(
            project_id
        )

        relative = str(
            project["file"]
        )

        if not re.fullmatch(
            r"/_docs-index/"
            r"[a-z0-9-]+\."
            r"[a-f0-9]{16}\.json",
            relative,
        ):
            raise RuntimeError(
                "Shard is not content-addressed: "
                + relative
            )

        shard_path = (
            ROOT
            / "public"
            / relative.lstrip("/")
        )

        serialized = (
            shard_path.read_text(
                encoding="utf-8"
            )
        )

        calculated = sha256(
            serialized
        )[:16]

        if calculated != str(
            project["hash"]
        ):
            raise RuntimeError(
                "Shard content hash mismatch: "
                + relative
            )

        shard = json.loads(
            serialized
        )

        shard_entries = shard.get(
            "entries",
            [],
        )

        if (
            len(shard_entries)
            != int(
                project["entries"]
            )
        ):
            raise RuntimeError(
                "Shard entry count mismatch: "
                + relative
            )

        for entry in shard_entries:
            entry_id = str(
                entry.get(
                    "id",
                    "",
                )
            )

            if not entry_id:
                raise RuntimeError(
                    "Search entry has no ID."
                )

            if entry_id in entry_ids:
                raise RuntimeError(
                    "Duplicate search entry: "
                    + entry_id
                )

            entry_ids.add(
                entry_id
            )

            route = str(
                entry.get(
                    "route",
                    "",
                )
            ).split(
                "#",
                1,
            )[0]

            if route not in routes:
                raise RuntimeError(
                    "Search result points to an unknown route: "
                    + route
                )

            search_text = str(
                entry.get(
                    "searchText",
                    "",
                )
            )

            if not search_text:
                raise RuntimeError(
                    "Search entry has no searchable text: "
                    + entry_id
                )

            if len(search_text) > 6000:
                raise RuntimeError(
                    "Search entry exceeds its size budget: "
                    + entry_id
                )

            entries.append(
                entry
            )

        size = shard_path.stat().st_size

        if size > 2_000_000:
            raise RuntimeError(
                "A project shard exceeds 2 MB: "
                + relative
            )

        total_bytes += size

    if len(entries) != int(
        manifest["totalEntries"]
    ):
        raise RuntimeError(
            "Manifest total entry count is incorrect."
        )

    if total_bytes > 4_000_000:
        raise RuntimeError(
            "Combined documentation index exceeds 4 MB."
        )

    representative_queries = [
        "commands",
        "installation",
        "extensions",
        "rules",
        "display",
        "api",
    ]

    verified_queries = []

    for query in representative_queries:
        ranked = sorted(
            (
                (
                    simple_score(
                        entry,
                        query,
                    ),
                    entry,
                )
                for entry in entries
            ),
            key=lambda item:
                item[0],
            reverse=True,
        )

        matches = [
            item
            for item in ranked
            if item[0] > 0
        ]

        if matches:
            verified_queries.append(
                {
                    "query": query,
                    "matches":
                        len(matches),
                    "topProject":
                        matches[0][1][
                            "projectId"
                        ],
                    "topSection":
                        matches[0][1][
                            "sectionTitle"
                        ],
                }
            )

    if len(verified_queries) < 4:
        raise RuntimeError(
            "Too few representative search queries produced results."
        )

    canopy_entries = [
        entry
        for entry in entries
        if entry.get(
            "projectId"
        ) == "canopy"
    ]

    if not canopy_entries:
        raise RuntimeError(
            "Canopy has no searchable entries."
        )

    if not any(
        simple_score(
            entry,
            "commands",
        )
        > 0
        for entry in canopy_entries
    ):
        raise RuntimeError(
            "The Canopy commands browser query has no results."
        )

    benchmark_queries = (
        [
            query["query"]
            for query in verified_queries
        ]
        * 50
    )

    started = time.perf_counter()

    for query in benchmark_queries:
        sorted(
            (
                simple_score(
                    entry,
                    query,
                )
                for entry in entries
            ),
            reverse=True,
        )

    elapsed_ms = (
        time.perf_counter()
        - started
    ) * 1000

    worker_source = (
        WORKER_PATH.read_text(
            encoding="utf-8"
        )
    )

    required_worker_tokens = [
        "typeof caches",
        "prewarm",
        "force-cache",
        "rankEntry",
        "searchDocumentation",
    ]

    for token in required_worker_tokens:
        if token not in worker_source:
            raise RuntimeError(
                "Search worker is missing required behavior: "
                + token
            )

    report = {
        "schemaVersion": 1,
        "projects":
            len(projects),
        "entries":
            len(entries),
        "indexBytes":
            total_bytes,
        "workerBytes":
            WORKER_PATH
                .stat()
                .st_size,
        "workerHash":
            sha256(
                worker_source
            ),
        "verifiedQueries":
            verified_queries,
        "benchmarkQueries":
            len(
                benchmark_queries
            ),
        "benchmarkMs":
            round(
                elapsed_ms,
                3,
            ),
        "browserTest": {
            "primaryQuery":
                "commands",
            "secondaryQuery":
                "installation",
            "projectId":
                "canopy",
        },
        "passed":
            True,
    }

    REPORT_PATH.write_text(
        json.dumps(
            report,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print(
        json.dumps(
            report,
            indent=2,
        )
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(
            "Search verification failed: "
            f"{error}",
            file=sys.stderr,
        )

        raise SystemExit(1)
