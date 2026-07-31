#!/usr/bin/env python3

from __future__ import annotations

import collections
import json
import re
import sys

from pathlib import Path
from typing import Any


ROOT = Path.cwd()

CORPUS_PATH = (
    ROOT
    / "lib/data/generated/docs/corpus.json"
)

SEARCH_MANIFEST_PATH = (
    ROOT
    / "lib/data/generated/docs/index-manifest.json"
)

MEDIA_MANIFEST_PATH = (
    ROOT
    / "lib/data/generated/docs/media-manifest.json"
)

NAVIGATION_PATH = (
    ROOT
    / "lib/data/generated/docs/navigation.json"
)

INTEGRITY_PATH = (
    ROOT
    / "lib/data/generated/docs/integrity-report.json"
)

WORD_PATTERN = re.compile(
    r"[A-Za-z0-9_'-]+"
)

MARKDOWN_LINK = re.compile(
    r"(?<!!)\[[^\]]+\]\(([^)]+)\)"
)

STOP_WORDS = {
    "about",
    "after",
    "also",
    "and",
    "are",
    "can",
    "docs",
    "documentation",
    "for",
    "from",
    "have",
    "how",
    "into",
    "more",
    "not",
    "repository",
    "that",
    "the",
    "their",
    "this",
    "use",
    "using",
    "what",
    "when",
    "where",
    "which",
    "with",
    "your",
}


def load_json(
    path: Path,
) -> Any:
    return json.loads(
        path.read_text(
            encoding="utf-8"
        )
    )


def clean_markdown(
    markdown: str,
) -> str:
    value = re.sub(
        r"```.*?```",
        " ",
        markdown,
        flags=re.DOTALL,
    )

    value = re.sub(
        r"`[^`]*`",
        " ",
        value,
    )

    value = re.sub(
        r"<[^>]+>",
        " ",
        value,
    )

    value = re.sub(
        r"!\[[^\]]*\]\([^)]+\)",
        " ",
        value,
    )

    value = re.sub(
        r"\[([^\]]+)\]\([^)]+\)",
        r"\1",
        value,
    )

    value = re.sub(
        r"[#>*_~|-]+",
        " ",
        value,
    )

    return re.sub(
        r"\s+",
        " ",
        value,
    ).strip()


def tokens_for(
    document: dict[str, Any],
) -> set[str]:
    text = " ".join(
        [
            str(
                document.get(
                    "title",
                    "",
                )
            ),
            str(
                document.get(
                    "sourcePath",
                    "",
                )
            ),
            " ".join(
                str(
                    section.get(
                        "title",
                        "",
                    )
                )
                for section
                in document.get(
                    "sections",
                    []
                )
            ),
        ]
    ).lower()

    return {
        token
        for token
        in WORD_PATTERN.findall(
            text
        )
        if (
            len(token) >= 3
            and token
            not in STOP_WORDS
        )
    }


def title_for(
    document: dict[str, Any],
) -> str:
    title = str(
        document.get(
            "title",
            "",
        )
    ).strip()

    if title:
        return title

    sections = document.get(
        "sections",
        [],
    )

    if sections:
        section_title = str(
            sections[0].get(
                "title",
                "",
            )
        ).strip()

        if section_title:
            return section_title

    source_path = str(
        document.get(
            "sourcePath",
            "",
        )
    )

    stem = Path(
        source_path
    ).stem

    return re.sub(
        r"[-_]+",
        " ",
        stem,
    ).strip().title()


def order_key(
    document: dict[str, Any],
) -> tuple[Any, ...]:
    title = title_for(
        document
    ).casefold()

    source_path = str(
        document.get(
            "sourcePath",
            "",
        )
    ).casefold()

    route = str(
        document.get(
            "route",
            "",
        )
    )

    combined = (
        title
        + " "
        + source_path
    )

    priorities = [
        (
            0,
            (
                "readme",
                "overview",
                "introduction",
                "home",
            ),
        ),
        (
            1,
            (
                "install",
                "update",
                "getting started",
                "quick start",
                "setup",
            ),
        ),
        (
            2,
            (
                "command",
                "usage",
                "guide",
            ),
        ),
        (
            3,
            (
                "extension",
                "plugin",
                "module",
            ),
        ),
        (
            4,
            (
                "rule",
                "configuration",
                "config",
                "setting",
            ),
        ),
        (
            5,
            (
                "api",
                "model",
                "reference",
            ),
        ),
    ]

    priority = 6

    for value, keywords in priorities:
        if any(
            keyword in combined
            for keyword
            in keywords
        ):
            priority = value
            break

    depth = route.count(
        "/"
    )

    source_priority = (
        0
        if document.get(
            "sourceType"
        )
        == "wiki"
        else 1
    )

    return (
        priority,
        source_priority,
        depth,
        title,
        route,
    )


def related_score(
    first: set[str],
    second: set[str],
) -> float:
    if (
        not first
        or not second
    ):
        return 0.0

    intersection = len(
        first & second
    )

    if intersection == 0:
        return 0.0

    union = len(
        first | second
    )

    return (
        intersection
        / union
        + intersection
        * 0.08
    )


def main() -> None:
    corpus = load_json(
        CORPUS_PATH
    )

    search_manifest = load_json(
        SEARCH_MANIFEST_PATH
    )

    media_manifest = load_json(
        MEDIA_MANIFEST_PATH
    )

    documents = corpus.get(
        "documents",
        [],
    )

    if not documents:
        raise RuntimeError(
            "Documentation corpus is empty."
        )

    by_project: dict[
        str,
        list[
            dict[str, Any]
        ],
    ] = collections.defaultdict(
        list
    )

    duplicate_ids: list[str] = []
    duplicate_routes: list[str] = []
    missing_core_fields: list[
        dict[str, Any]
    ] = []
    duplicate_anchors: list[
        dict[str, Any]
    ] = []

    seen_ids: set[str] = set()
    seen_routes: set[str] = set()

    tokens: dict[
        str,
        set[str],
    ] = {}

    source_types: collections.Counter[
        str
    ] = collections.Counter()

    total_sections = 0
    total_words = 0
    total_markdown_links = 0

    for document in documents:
        document_id = str(
            document.get(
                "id",
                "",
            )
        )

        route = str(
            document.get(
                "route",
                "",
            )
        )

        project_id = str(
            document.get(
                "projectId",
                "",
            )
        )

        required = {
            "id":
                document_id,
            "route":
                route,
            "projectId":
                project_id,
            "sourceUrl":
                str(
                    document.get(
                        "sourceUrl",
                        "",
                    )
                ),
            "sourcePath":
                str(
                    document.get(
                        "sourcePath",
                        "",
                    )
                ),
        }

        missing = [
            key
            for key, value
            in required.items()
            if not value
        ]

        if missing:
            missing_core_fields.append(
                {
                    "documentId":
                        document_id,
                    "missing":
                        missing,
                }
            )

        if document_id in seen_ids:
            duplicate_ids.append(
                document_id
            )

        seen_ids.add(
            document_id
        )

        if route in seen_routes:
            duplicate_routes.append(
                route
            )

        seen_routes.add(
            route
        )

        sections = document.get(
            "sections",
            [],
        )

        total_sections += len(
            sections
        )

        anchors = [
            str(
                section.get(
                    "anchor",
                    "",
                )
            )
            for section
            in sections
            if section.get(
                "anchor"
            )
        ]

        repeated = sorted(
            anchor
            for anchor, count
            in collections.Counter(
                anchors
            ).items()
            if count > 1
        )

        if repeated:
            duplicate_anchors.append(
                {
                    "documentId":
                        document_id,
                    "anchors":
                        repeated,
                }
            )

        markdown = str(
            document.get(
                "markdown",
                "",
            )
        )

        words = WORD_PATTERN.findall(
            clean_markdown(
                markdown
            )
        )

        total_words += len(
            words
        )

        total_markdown_links += len(
            MARKDOWN_LINK.findall(
                markdown
            )
        )

        source_types[
            str(
                document.get(
                    "sourceType",
                    "unknown",
                )
            )
        ] += 1

        by_project[
            project_id
        ].append(
            document
        )

        tokens[
            document_id
        ] = tokens_for(
            document
        )

    flat_entries: dict[
        str,
        dict[str, Any]
    ] = {}

    project_entries: list[
        dict[str, Any]
    ] = []

    for project_id in sorted(
        by_project,
        key=lambda value:
            str(
                by_project[
                    value
                ][0].get(
                    "projectTitle",
                    value,
                )
            ).casefold(),
    ):
        project_documents = sorted(
            by_project[
                project_id
            ],
            key=order_key,
        )

        project_title = str(
            project_documents[
                0
            ].get(
                "projectTitle",
                project_id,
            )
        )

        navigation_documents: list[
            dict[str, Any]
        ] = []

        for index, document in enumerate(
            project_documents
        ):
            document_id = str(
                document["id"]
            )

            markdown = str(
                document.get(
                    "markdown",
                    "",
                )
            )

            word_count = len(
                WORD_PATTERN.findall(
                    clean_markdown(
                        markdown
                    )
                )
            )

            candidate_related: list[
                tuple[
                    float,
                    dict[str, Any],
                ]
            ] = []

            for candidate in project_documents:
                candidate_id = str(
                    candidate["id"]
                )

                if candidate_id == document_id:
                    continue

                score = related_score(
                    tokens[
                        document_id
                    ],
                    tokens[
                        candidate_id
                    ],
                )

                if score > 0:
                    candidate_related.append(
                        (
                            score,
                            candidate,
                        )
                    )

            candidate_related.sort(
                key=lambda item: (
                    -item[0],
                    order_key(
                        item[1]
                    ),
                )
            )

            related_ids = [
                str(
                    candidate[
                        "id"
                    ]
                )
                for _, candidate
                in candidate_related[:3]
            ]

            previous_id = (
                str(
                    project_documents[
                        index - 1
                    ][
                        "id"
                    ]
                )
                if index > 0
                else None
            )

            next_id = (
                str(
                    project_documents[
                        index + 1
                    ][
                        "id"
                    ]
                )
                if index + 1
                < len(
                    project_documents
                )
                else None
            )

            entry = {
                "id":
                    document_id,
                "title":
                    title_for(
                        document
                    ),
                "route":
                    str(
                        document.get(
                            "route",
                            "",
                        )
                    ),
                "projectId":
                    project_id,
                "projectTitle":
                    project_title,
                "repository":
                    str(
                        document.get(
                            "repository",
                            project_id,
                        )
                    ),
                "sourceType":
                    str(
                        document.get(
                            "sourceType",
                            "repository",
                        )
                    ),
                "sourcePath":
                    str(
                        document.get(
                            "sourcePath",
                            "",
                        )
                    ),
                "sourceUrl":
                    str(
                        document.get(
                            "sourceUrl",
                            "",
                        )
                    ),
                "sourceRevision":
                    str(
                        document.get(
                            "sourceRevision",
                            "",
                        )
                    ),
                "retrievedAt":
                    str(
                        document.get(
                            "retrievedAt",
                            corpus.get(
                                "generatedAt",
                                "",
                            ),
                        )
                    ),
                "wordCount":
                    word_count,
                "readingMinutes":
                    max(
                        1,
                        round(
                            word_count
                            / 220
                        ),
                    ),
                "sectionCount":
                    len(
                        document.get(
                            "sections",
                            [],
                        )
                    ),
                "previousId":
                    previous_id,
                "nextId":
                    next_id,
                "relatedIds":
                    related_ids,
            }

            navigation_documents.append(
                entry
            )

            flat_entries[
                document_id
            ] = entry

        project_entries.append(
            {
                "id":
                    project_id,
                "title":
                    project_title,
                "repository":
                    str(
                        project_documents[
                            0
                        ].get(
                            "repository",
                            project_id,
                        )
                    ),
                "documents":
                    navigation_documents,
                "documentCount":
                    len(
                        navigation_documents
                    ),
                "sectionCount":
                    sum(
                        entry[
                            "sectionCount"
                        ]
                        for entry
                        in navigation_documents
                    ),
                "wordCount":
                    sum(
                        entry[
                            "wordCount"
                        ]
                        for entry
                        in navigation_documents
                    ),
            }
        )

    search_projects = search_manifest.get(
        "projects",
        []
    )

    search_entries = int(
        search_manifest.get(
            "totalEntries",
            0,
        )
    )

    media_summary = media_manifest.get(
        "summary",
        {},
    )

    navigation = {
        "schemaVersion": 1,
        "generatedAt":
            corpus.get(
                "generatedAt"
            ),
        "projects":
            project_entries,
        "documents":
            flat_entries,
        "summary": {
            "projects":
                len(
                    project_entries
                ),
            "documents":
                len(
                    documents
                ),
            "sections":
                total_sections,
            "words":
                total_words,
            "searchEntries":
                search_entries,
            "searchProjects":
                len(
                    search_projects
                ),
            "mediaAssets":
                int(
                    media_summary.get(
                        "uniqueAssets",
                        0,
                    )
                ),
            "documentsWithMedia":
                int(
                    media_summary.get(
                        "documentsWithMedia",
                        0,
                    )
                ),
            "markdownLinks":
                total_markdown_links,
            "sourceTypes":
                dict(
                    sorted(
                        source_types.items()
                    )
                ),
        },
    }

    failures = {
        "duplicateIds":
            sorted(
                set(
                    duplicate_ids
                )
            ),
        "duplicateRoutes":
            sorted(
                set(
                    duplicate_routes
                )
            ),
        "missingCoreFields":
            missing_core_fields,
        "duplicateAnchors":
            duplicate_anchors,
    }

    passed = not any(
        failures.values()
    )

    integrity = {
        "schemaVersion": 1,
        "generatedAt":
            corpus.get(
                "generatedAt"
            ),
        "summary":
            navigation[
                "summary"
            ],
        "checks": {
            "uniqueDocumentIds":
                not duplicate_ids,
            "uniqueRoutes":
                not duplicate_routes,
            "completeProvenance":
                not missing_core_fields,
            "uniqueAnchorsPerDocument":
                not duplicate_anchors,
            "searchCoverage":
                search_entries
                == total_sections,
            "projectCoverage":
                len(
                    search_projects
                )
                == len(
                    project_entries
                ),
            "localMediaAvailable":
                int(
                    media_summary.get(
                        "uniqueAssets",
                        0,
                    )
                )
                > 0,
        },
        "failures":
            failures,
        "passed":
            passed,
    }

    NAVIGATION_PATH.write_text(
        json.dumps(
            navigation,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    INTEGRITY_PATH.write_text(
        json.dumps(
            integrity,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print(
        json.dumps(
            integrity,
            indent=2,
        )
    )

    if not passed:
        raise RuntimeError(
            "Documentation navigation integrity checks failed."
        )


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(
            "Documentation navigation generation failed: "
            f"{error}",
            file=sys.stderr,
        )

        raise SystemExit(1)
