#!/usr/bin/env python3

from __future__ import annotations

import hashlib
import json
import re
import sys

from pathlib import Path


ROOT = Path.cwd()

GENERATED = (
    ROOT
    / "lib/data/generated/docs"
)


def load(
    filename: str,
):
    return json.loads(
        (
            GENERATED
            / filename
        ).read_text(
            encoding="utf-8"
        )
    )


def digest(
    value: str,
) -> str:
    return hashlib.sha256(
        value.encode("utf-8")
    ).hexdigest()


def main() -> None:
    corpus = load(
        "corpus.json"
    )

    manifest = load(
        "index-manifest.json"
    )

    sources = load(
        "sources.json"
    )

    documents = corpus.get(
        "documents"
    )

    if (
        not isinstance(
            documents,
            list,
        )
        or len(documents) < 10
    ):
        raise RuntimeError(
            "Documentation corpus is unexpectedly small."
        )

    ids: set[str] = set()
    routes: set[str] = set()

    invalid_project_ids = {
        "",
        "none",
        "null",
        "undefined",
    }

    for document in documents:
        document_id = str(
            document.get(
                "id"
            )
            or ""
        )

        project_id = str(
            document.get(
                "projectId"
            )
            or ""
        ).lower()

        route = str(
            document.get(
                "route"
            )
            or ""
        )

        if (
            not document_id
            or not route
            or not document.get(
                "title"
            )
            or not document.get(
                "sourceUrl"
            )
            or not document.get(
                "sourceRevision"
            )
            or not document.get(
                "markdown"
            )
            or not document.get(
                "sections"
            )
        ):
            raise RuntimeError(
                "Incomplete document: "
                + document_id
            )

        if (
            project_id
            in invalid_project_ids
        ):
            raise RuntimeError(
                "Invalid project ID: "
                + project_id
            )

        if document_id in ids:
            raise RuntimeError(
                "Duplicate document ID: "
                + document_id
            )

        if route in routes:
            raise RuntimeError(
                "Duplicate route: "
                + route
            )

        ids.add(
            document_id
        )

        routes.add(route)

    canopy_wiki = [
        document
        for document in documents
        if (
            str(
                document[
                    "repository"
                ]
            ).lower()
            == "canopy"
            and document[
                "sourceType"
            ]
            == "wiki"
        )
    ]

    if len(canopy_wiki) < 5:
        raise RuntimeError(
            "Expected at least five Canopy wiki pages; "
            f"found {len(canopy_wiki)}."
        )

    total_entries = 0
    total_bytes = 0

    projects = manifest.get(
        "projects"
    )

    if (
        not isinstance(
            projects,
            list,
        )
        or not projects
    ):
        raise RuntimeError(
            "No search shards were generated."
        )

    project_ids: set[str] = set()

    for project in projects:
        project_id = str(
            project["projectId"]
        )

        if project_id in project_ids:
            raise RuntimeError(
                "Duplicate search project: "
                + project_id
            )

        project_ids.add(
            project_id
        )

        file_path = str(
            project["file"]
        )

        if not re.fullmatch(
            r"/_docs-index/"
            r"[a-z0-9-]+\."
            r"[a-f0-9]{16}\.json",
            file_path,
        ):
            raise RuntimeError(
                "Invalid shard filename: "
                + file_path
            )

        shard_path = (
            ROOT
            / "public"
            / file_path.lstrip("/")
        )

        serialized = shard_path.read_text(
            encoding="utf-8"
        )

        calculated = digest(
            serialized
        )[:16]

        if calculated != project[
            "hash"
        ]:
            raise RuntimeError(
                "Shard hash mismatch: "
                + file_path
            )

        shard = json.loads(
            serialized
        )

        entries = shard.get(
            "entries"
        )

        if (
            not isinstance(
                entries,
                list,
            )
            or len(entries)
            != int(
                project["entries"]
            )
        ):
            raise RuntimeError(
                "Shard entry mismatch: "
                + file_path
            )

        size = shard_path.stat().st_size

        if size > 2_000_000:
            raise RuntimeError(
                "Shard exceeds 2 MB: "
                + file_path
            )

        total_entries += len(
            entries
        )

        total_bytes += size

    if total_entries != int(
        manifest["totalEntries"]
    ):
        raise RuntimeError(
            "Search manifest total is incorrect."
        )

    summary = {
        "documents": len(
            documents
        ),
        "uniqueDocumentIds": len(
            ids
        ),
        "uniqueRoutes": len(
            routes
        ),
        "canopyWikiPages": len(
            canopy_wiki
        ),
        "projects": len(
            projects
        ),
        "searchEntries": total_entries,
        "searchBytes": total_bytes,
        "sourceFailures": len(
            sources.get(
                "failures",
                [],
            )
        ),
        "passed": True,
    }

    print(
        json.dumps(
            summary,
            indent=2,
        )
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(
            "Documentation verification failed: "
            f"{error}",
            file=sys.stderr,
        )

        raise SystemExit(1)
