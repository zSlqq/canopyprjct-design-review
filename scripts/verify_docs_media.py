#!/usr/bin/env python3

from __future__ import annotations

import hashlib
import json
import re
import sys

from pathlib import Path
from typing import Any


ROOT = Path.cwd()

MANIFEST_PATH = (
    ROOT
    / "lib/data/generated/docs/media-manifest.json"
)

REPORT_PATH = (
    ROOT
    / "lib/data/generated/docs/media-verification.json"
)

HASHED_NAME = re.compile(
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


def main() -> None:
    manifest = load_json(
        MANIFEST_PATH
    )

    verified: set[str] = set()
    references = 0
    total_bytes = 0

    for document_id, mappings in (
        manifest.get(
            "assets",
            {},
        )
        .items()
    ):
        if (
            not document_id
            or not isinstance(
                mappings,
                dict,
            )
        ):
            raise RuntimeError(
                "Invalid document media map."
            )

        for source, asset in mappings.items():
            references += 1

            if (
                not source
                or not isinstance(
                    asset,
                    dict,
                )
            ):
                raise RuntimeError(
                    "Invalid media mapping."
                )

            path = str(
                asset.get(
                    "path",
                    "",
                )
            )

            if not path.startswith(
                "/_docs-media/"
            ):
                raise RuntimeError(
                    "Non-local media path: "
                    + path
                )

            filename = Path(
                path
            ).name

            if not HASHED_NAME.fullmatch(
                filename
            ):
                raise RuntimeError(
                    "Non-content-addressed media: "
                    + filename
                )

            if (
                int(
                    asset.get(
                        "width",
                        0,
                    )
                )
                <= 0
                or int(
                    asset.get(
                        "height",
                        0,
                    )
                )
                <= 0
            ):
                raise RuntimeError(
                    "Invalid media dimensions: "
                    + filename
                )

            local = (
                ROOT
                / "public"
                / path.lstrip("/")
            )

            payload = local.read_bytes()

            digest = hashlib.sha256(
                payload
            ).hexdigest()

            if digest != str(
                asset.get(
                    "hash",
                    "",
                )
            ):
                raise RuntimeError(
                    "Media hash mismatch: "
                    + filename
                )

            if len(payload) != int(
                asset.get(
                    "bytes",
                    -1,
                )
            ):
                raise RuntimeError(
                    "Media byte count mismatch: "
                    + filename
                )

            if path not in verified:
                verified.add(path)
                total_bytes += len(
                    payload
                )

    expected = int(
        manifest.get(
            "summary",
            {},
        )
        .get(
            "uniqueAssets",
            0,
        )
    )

    if expected != len(
        verified
    ):
        raise RuntimeError(
            "Unique media count mismatch."
        )

    result = {
        "documentsWithMedia":
            int(
                manifest[
                    "summary"
                ][
                    "documentsWithMedia"
                ]
            ),
        "references":
            references,
        "uniqueAssets":
            len(verified),
        "assetBytes":
            total_bytes,
        "localOnly":
            True,
        "contentAddressed":
            True,
        "passed":
            len(verified)
            > 0,
    }

    REPORT_PATH.write_text(
        json.dumps(
            result,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print(
        json.dumps(
            result,
            indent=2,
        )
    )

    if not result[
        "passed"
    ]:
        raise RuntimeError(
            "No mirrored media passed verification."
        )


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(
            "Documentation media verification failed: "
            f"{error}",
            file=sys.stderr,
        )

        raise SystemExit(1)
