#!/usr/bin/env python3

from __future__ import annotations

import hashlib
import json
import re
import shutil
import unicodedata

from pathlib import Path
from typing import Any


ROOT = Path.cwd()

ARCHIVE = (
    ROOT
    / "lib/data/generated/archive"
)

PUBLIC = (
    ROOT
    / "public/_archive-search"
)

PAGE_SIZE = 100


def load(
    path: Path,
) -> Any:
    return json.loads(
        path.read_text(
            encoding="utf-8"
        )
    )


def normalize(
    value: Any,
) -> str:
    prepared = unicodedata.normalize(
        "NFKD",
        str(
            value
            if value is not None
            else ""
        ),
    )

    prepared = "".join(
        character
        for character
        in prepared
        if not unicodedata.combining(
            character
        )
    )

    prepared = re.sub(
        r"([a-z0-9])([A-Z])",
        r"\1 \2",
        prepared,
    )

    return re.sub(
        r"[^a-z0-9]+",
        " ",
        prepared.lower(),
    ).strip()


def compact(
    value: Any,
    limit: int,
) -> str:
    return re.sub(
        r"\s+",
        " ",
        str(
            value
            if value is not None
            else ""
        ),
    ).strip()[
        :limit
    ]


def item(
    identifier: str,
    kind: str,
    project: str,
    title: str,
    subtitle: str,
    href: str,
    external: bool = False,
    downloadable: bool = False,
) -> dict[str, Any]:
    title = compact(
        title,
        150,
    )

    subtitle = compact(
        subtitle,
        240,
    )

    return {
        "id":
            identifier,
        "kind":
            kind,
        "project":
            project,
        "title":
            title,
        "subtitle":
            subtitle,
        "href":
            href,
        "external":
            external,
        "downloadable":
            downloadable,
        "search":
            normalize(
                " ".join([
                    kind,
                    project,
                    title,
                    subtitle,
                ])
            ),
    }


def collect(
    project: dict[str, Any],
) -> list[dict[str, Any]]:
    slug = project[
        "slug"
    ]

    name = project[
        "name"
    ]

    output = [
        item(
            f"{slug}:project",
            "project",
            name,
            name,
            project.get(
                "description"
            )
            or "ForestOfLight repository",
            f"/archive/{slug}",
        )
    ]

    for release_index, release in enumerate(
        project.get(
            "releases",
            [],
        )
    ):
        tag = (
            release.get(
                "tag"
            )
            or release.get(
                "name"
            )
            or f"version-{release_index + 1}"
        )

        release_name = (
            release.get(
                "name"
            )
            or tag
        )

        output.append(
            item(
                f"{slug}:release:{release_index}",
                "release",
                name,
                release_name,
                tag,
                f"/archive/{slug}#releases",
            )
        )

        for asset_index, asset in enumerate(
            release.get(
                "assets",
                [],
            )
        ):
            output.append(
                item(
                    f"{slug}:asset:{release_index}:{asset_index}",
                    "download",
                    name,
                    asset.get(
                        "name"
                    )
                    or "Release asset",
                    (
                        f"{tag} · "
                        f"{asset.get('bytes', 0)} bytes"
                    ),
                    asset.get(
                        "downloadUrl"
                    )
                    or f"/archive/{slug}#releases",
                    True,
                    True,
                )
            )

        for source_kind, source_key, source_label in [
            (
                "zip",
                "sourceZipUrl",
                "Source ZIP",
            ),
            (
                "tar",
                "sourceTarUrl",
                "Source TAR.GZ",
            ),
        ]:
            source_url = release.get(
                source_key
            )

            if not source_url:
                continue

            output.append(
                item(
                    f"{slug}:source:{release_index}:{source_kind}",
                    "download",
                    name,
                    f"{release_name} {source_label}",
                    tag,
                    source_url,
                    True,
                    True,
                )
            )

    for contributor_index, contributor in enumerate(
        project.get(
            "contributors",
            [],
        )
    ):
        login = contributor.get(
            "login"
        )

        if login:
            output.append(
                item(
                    f"{slug}:contributor:{contributor_index}",
                    "contributor",
                    name,
                    login,
                    (
                        f"{contributor.get('contributions', 0)} contributions"
                    ),
                    f"/archive/{slug}#contributors",
                )
            )

    for function_index, function in enumerate(
        project.get(
            "functions",
            [],
        )
    ):
        function_name = function.get(
            "name"
        )

        if not function_name:
            continue

        page = (
            function_index
            // PAGE_SIZE
        ) + 1

        output.append(
            item(
                f"{slug}:function:{function_index}",
                "function",
                name,
                function_name,
                (
                    f"{compact(function.get('signature'), 120)} · "
                    f"{function.get('file', '')}:"
                    f"{function.get('line', '')}"
                ),
                f"/archive/{slug}/functions/{page}",
            )
        )

    for command_index, command in enumerate(
        project.get(
            "commands",
            [],
        )
    ):
        command_name = command.get(
            "command"
        )

        if command_name:
            output.append(
                item(
                    f"{slug}:command:{command_index}",
                    "command",
                    name,
                    command_name,
                    command.get(
                        "context"
                    )
                    or command.get(
                        "source"
                    )
                    or "Documented command",
                    f"/archive/{slug}#commands",
                )
            )

    for rule_index, rule in enumerate(
        project.get(
            "globalRules",
            [],
        )
    ):
        rule_name = rule.get(
            "name"
        )

        if rule_name:
            output.append(
                item(
                    f"{slug}:rule:{rule_index}",
                    "rule",
                    name,
                    rule_name,
                    rule.get(
                        "source"
                    )
                    or "Documented global rule",
                    f"/archive/{slug}#global-rules",
                )
            )

    for document_index, document in enumerate(
        project.get(
            "documents",
            [],
        )
    ):
        document_title = document.get(
            "title"
        )

        if document_title:
            output.append(
                item(
                    f"{slug}:document:{document_index}",
                    "document",
                    name,
                    document_title,
                    " · ".join(
                        str(
                            heading
                        )
                        for heading
                        in document.get(
                            "headings",
                            [],
                        )[
                            :4
                        ]
                    )
                    or document.get(
                        "source"
                    )
                    or "Repository document",
                    f"/archive/{slug}#documents",
                )
            )

    return output


def main() -> None:
    archive = load(
        ARCHIVE
        / "manifest.json"
    )

    shutil.rmtree(
        PUBLIC,
        ignore_errors=True,
    )

    PUBLIC.mkdir(
        parents=True,
        exist_ok=True,
    )

    entries = []

    for summary in archive.get(
        "projects",
        [],
    ):
        project = load(
            ARCHIVE
            / summary[
                "file"
            ]
        )

        entries.extend(
            collect(
                project
            )
        )

    encoded = (
        json.dumps(
            {
                "schemaVersion":
                    1,
                "entries":
                    entries,
            },
            ensure_ascii=False,
            separators=(
                ",",
                ":",
            ),
        )
        + "\n"
    ).encode(
        "utf-8"
    )

    digest = hashlib.sha256(
        encoded
    ).hexdigest()

    filename = (
        f"archive.{digest[:16]}.json"
    )

    (
        PUBLIC
        / filename
    ).write_bytes(
        encoded
    )

    kinds: dict[
        str,
        int,
    ] = {}

    for entry in entries:
        kinds[
            entry[
                "kind"
            ]
        ] = (
            kinds.get(
                entry[
                    "kind"
                ],
                0,
            )
            + 1
        )

    manifest = {
        "schemaVersion":
            1,
        "file":
            f"/_archive-search/{filename}",
        "sha256":
            digest,
        "bytes":
            len(
                encoded
            ),
        "entries":
            len(
                entries
            ),
        "projects":
            archive[
                "summary"
            ][
                "repositories"
            ],
        "kinds":
            dict(
                sorted(
                    kinds.items()
                )
            ),
        "passed":
            (
                len(
                    entries
                )
                > archive[
                    "summary"
                ][
                    "functions"
                ]
            ),
    }

    (
        PUBLIC
        / "manifest.json"
    ).write_text(
        json.dumps(
            manifest,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    (
        ARCHIVE
        / "search-manifest.json"
    ).write_text(
        json.dumps(
            manifest,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print(
        json.dumps(
            manifest,
            indent=2,
        )
    )

    if not manifest[
        "passed"
    ]:
        raise SystemExit(
            "Archive search coverage is incomplete."
        )


if __name__ == "__main__":
    main()
