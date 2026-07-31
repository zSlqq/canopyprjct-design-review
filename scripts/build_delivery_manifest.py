#!/usr/bin/env python3

from __future__ import annotations

import hashlib
import json
import re
import sys

from pathlib import Path
from typing import Any


ROOT = Path.cwd()

GENERATED = (
    ROOT
    / "lib/data/generated/docs"
)

OUTPUT_PATH = (
    GENERATED
    / "delivery-manifest.json"
)

REPORT_PATH = (
    GENERATED
    / "delivery-report.json"
)

INDEX_FILENAME = re.compile(
    r"^[a-z0-9-]+\.[a-f0-9]{16}\.json$"
)

MEDIA_FILENAME = re.compile(
    r"^[a-f0-9]{24}\.(png|jpg|gif|webp)$"
)


def load_json(
    path: Path,
) -> Any:
    return json.loads(
        path.read_text(
            encoding="utf-8"
        )
    )


def canonical_bytes(
    value: Any,
) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(
            ",",
            ":",
        ),
        ensure_ascii=False,
    ).encode(
        "utf-8"
    )


def file_hash(
    path: Path,
) -> str:
    digest = hashlib.sha256()

    with path.open(
        "rb"
    ) as handle:
        while True:
            chunk = handle.read(
                1024 * 1024
            )

            if not chunk:
                break

            digest.update(
                chunk
            )

    return digest.hexdigest()


def main() -> None:
    corpus = load_json(
        GENERATED
        / "corpus.json"
    )

    search = load_json(
        GENERATED
        / "index-manifest.json"
    )

    media = load_json(
        GENERATED
        / "media-manifest.json"
    )

    navigation = load_json(
        GENERATED
        / "navigation.json"
    )

    integrity = load_json(
        GENERATED
        / "integrity-report.json"
    )

    documents = corpus.get(
        "documents",
        [],
    )

    projects = navigation.get(
        "projects",
        [],
    )

    routes = {
        "/",
        "/docs",
        "/features",
        "/search",
        "/status",
    }

    routes.update(
        str(
            document.get(
                "route",
                "",
            )
        )
        for document
        in documents
    )

    routes.update(
        f"/docs/{project['id']}"
        for project
        in projects
    )

    routes = {
        route
        for route in routes
        if route.startswith(
            "/"
        )
    }

    index_failures: list[
        dict[str, str]
    ] = []

    index_files = []

    for project in search.get(
        "projects",
        [],
    ):
        relative = str(
            project.get(
                "file",
                "",
            )
        )

        filename = Path(
            relative
        ).name

        local = (
            ROOT
            / "public"
            / relative.lstrip("/")
        )

        if not INDEX_FILENAME.fullmatch(
            filename
        ):
            index_failures.append(
                {
                    "file":
                        relative,
                    "reason":
                        "filename is not content-addressed",
                }
            )

            continue

        if not local.is_file():
            index_failures.append(
                {
                    "file":
                        relative,
                    "reason":
                        "file is missing",
                }
            )

            continue

        calculated = file_hash(
            local
        )[:16]

        expected = str(
            project.get(
                "hash",
                "",
            )
        )

        if calculated != expected:
            index_failures.append(
                {
                    "file":
                        relative,
                    "reason":
                        "content hash mismatch",
                }
            )

        index_files.append(
            {
                "path":
                    relative,
                "bytes":
                    local.stat().st_size,
                "hash":
                    expected,
            }
        )

    media_failures: list[
        dict[str, str]
    ] = []

    media_files: dict[
        str,
        dict[str, Any]
    ] = {}

    for mappings in (
        media.get(
            "assets",
            {},
        )
        .values()
    ):
        for asset in mappings.values():
            relative = str(
                asset.get(
                    "path",
                    "",
                )
            )

            if relative in media_files:
                continue

            filename = Path(
                relative
            ).name

            local = (
                ROOT
                / "public"
                / relative.lstrip("/")
            )

            if not MEDIA_FILENAME.fullmatch(
                filename
            ):
                media_failures.append(
                    {
                        "file":
                            relative,
                        "reason":
                            "filename is not content-addressed",
                    }
                )

                continue

            if not local.is_file():
                media_failures.append(
                    {
                        "file":
                            relative,
                        "reason":
                            "file is missing",
                    }
                )

                continue

            calculated = file_hash(
                local
            )

            expected = str(
                asset.get(
                    "hash",
                    "",
                )
            )

            if calculated != expected:
                media_failures.append(
                    {
                        "file":
                            relative,
                        "reason":
                            "content hash mismatch",
                    }
                )

            media_files[
                relative
            ] = {
                "path":
                    relative,
                "bytes":
                    local.stat().st_size,
                "hash":
                    expected,
            }

    fingerprint_payload = {
        "corpusGeneratedAt":
            corpus.get(
                "generatedAt"
            ),
        "integrity":
            integrity,
        "navigationSummary":
            navigation.get(
                "summary",
                {},
            ),
        "searchProjects":
            search.get(
                "projects",
                [],
            ),
        "mediaSummary":
            media.get(
                "summary",
                {},
            ),
        "routes":
            sorted(
                routes
            ),
    }

    fingerprint = hashlib.sha256(
        canonical_bytes(
            fingerprint_payload
        )
    ).hexdigest()

    checks = {
        "integrityPassed":
            bool(
                integrity.get(
                    "passed"
                )
            ),
        "documentCountMatches":
            len(
                documents
            )
            == int(
                navigation[
                    "summary"
                ][
                    "documents"
                ]
            ),
        "searchCoverageMatches":
            int(
                search.get(
                    "totalEntries",
                    0,
                )
            )
            == int(
                navigation[
                    "summary"
                ][
                    "sections"
                ]
            ),
        "projectCoverageMatches":
            len(
                search.get(
                    "projects",
                    [],
                )
            )
            == len(
                projects
            ),
        "indexAssetsVerified":
            not index_failures
            and len(
                index_files
            )
            == len(
                search.get(
                    "projects",
                    [],
                )
            ),
        "mediaAssetsVerified":
            not media_failures
            and len(
                media_files
            )
            == int(
                media[
                    "summary"
                ][
                    "uniqueAssets"
                ]
            ),
        "routesUnique":
            len(
                routes
            )
            == len(
                sorted(
                    routes
                )
            ),
    }

    passed = all(
        checks.values()
    )

    manifest = {
        "schemaVersion": 1,
        "generatedAt":
            corpus.get(
                "generatedAt"
            ),
        "fingerprint":
            fingerprint,
        "routes":
            sorted(
                routes
            ),
        "summary": {
            "projects":
                len(
                    projects
                ),
            "documents":
                len(
                    documents
                ),
            "sections":
                int(
                    navigation[
                        "summary"
                    ][
                        "sections"
                    ]
                ),
            "words":
                int(
                    navigation[
                        "summary"
                    ][
                        "words"
                    ]
                ),
            "searchEntries":
                int(
                    search.get(
                        "totalEntries",
                        0,
                    )
                ),
            "searchShards":
                len(
                    index_files
                ),
            "searchBytes":
                sum(
                    item[
                        "bytes"
                    ]
                    for item
                    in index_files
                ),
            "mediaAssets":
                len(
                    media_files
                ),
            "mediaBytes":
                sum(
                    item[
                        "bytes"
                    ]
                    for item
                    in media_files.values()
                ),
            "routes":
                len(
                    routes
                ),
        },
        "checks":
            checks,
        "passed":
            passed,
    }

    report = {
        **manifest,
        "indexFailures":
            index_failures,
        "mediaFailures":
            media_failures,
    }

    OUTPUT_PATH.write_text(
        json.dumps(
            manifest,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

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

    if not passed:
        raise RuntimeError(
            "Production delivery verification failed."
        )


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(
            "Delivery manifest generation failed: "
            f"{error}",
            file=sys.stderr,
        )

        raise SystemExit(1)
