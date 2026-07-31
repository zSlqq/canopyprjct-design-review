#!/usr/bin/env python3

from __future__ import annotations

import concurrent.futures
import hashlib
import html
import json
import posixpath
import re
import struct
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

from pathlib import Path
from typing import Any


ROOT = Path.cwd()

CORPUS_PATH = (
    ROOT
    / "lib/data/generated/docs/corpus.json"
)

OUTPUT_DIRECTORY = (
    ROOT
    / "public/_docs-media"
)

MANIFEST_PATH = (
    ROOT
    / "lib/data/generated/docs/media-manifest.json"
)

REPORT_PATH = (
    ROOT
    / "lib/data/generated/docs/media-report.json"
)

MAX_BYTES = 12 * 1024 * 1024
TIMEOUT_SECONDS = 15
RETRIES = 2
WORKERS = 8

INLINE_IMAGE = re.compile(
    r"!\[[^\]]*\]\("
    r"(?:<(?P<bracket>[^>]+)>|(?P<plain>[^\s)]+))"
    r"(?:\s+[\"'][^\"']*[\"'])?"
    r"\)"
)

REFERENCE_IMAGE = re.compile(
    r"!\[(?P<alt>[^\]]*)\]"
    r"\[(?P<reference>[^\]]*)\]"
)

DEFINITION = re.compile(
    r"(?m)^\s*\[(?P<label>[^\]]+)\]:\s*"
    r"(?:<(?P<bracket>[^>]+)>|(?P<plain>\S+))"
)

HTML_IMAGE = re.compile(
    r"<img\b[^>]*?\bsrc\s*=\s*"
    r"(?:\"(?P<double>[^\"]+)\""
    r"|'(?P<single>[^']+)'"
    r"|(?P<bare>[^\s>]+))",
    re.IGNORECASE,
)

EXTENSIONS = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
}


def load_json(
    path: Path,
) -> Any:
    return json.loads(
        path.read_text(
            encoding="utf-8"
        )
    )


def repository_parts(
    repository_url: str,
) -> tuple[str, str] | None:
    match = re.match(
        r"^https://github\.com/"
        r"(?P<owner>[^/]+)/"
        r"(?P<repository>[^/#?]+)",
        repository_url,
    )

    if not match:
        return None

    return (
        match.group("owner"),
        match.group("repository")
            .removesuffix(".git"),
    )


def image_sources(
    markdown: str,
) -> list[str]:
    sources: list[str] = []

    definitions: dict[str, str] = {}

    for match in DEFINITION.finditer(
        markdown
    ):
        target = (
            match.group("bracket")
            or match.group("plain")
            or ""
        ).strip()

        label = (
            match.group("label")
            .strip()
            .casefold()
        )

        if target and label:
            definitions[label] = target

    for match in INLINE_IMAGE.finditer(
        markdown
    ):
        target = (
            match.group("bracket")
            or match.group("plain")
            or ""
        ).strip()

        if target:
            sources.append(target)

    for match in REFERENCE_IMAGE.finditer(
        markdown
    ):
        label = (
            match.group("reference")
            or match.group("alt")
            or ""
        ).strip().casefold()

        target = definitions.get(
            label
        )

        if target:
            sources.append(target)

    for match in HTML_IMAGE.finditer(
        markdown
    ):
        target = (
            match.group("double")
            or match.group("single")
            or match.group("bare")
            or ""
        ).strip()

        if target:
            sources.append(target)

    return list(
        dict.fromkeys(sources)
    )


def relative_path(
    source_path: str,
    target: str,
) -> str:
    target_path = urllib.parse.urlsplit(
        target
    ).path

    decoded = urllib.parse.unquote(
        target_path
    )

    if decoded.startswith("/"):
        combined = decoded.lstrip("/")
    else:
        combined = posixpath.join(
            posixpath.dirname(
                source_path
            ),
            decoded,
        )

    normalized = posixpath.normpath(
        combined
    )

    while normalized.startswith(
        "../"
    ):
        normalized = normalized[3:]

    return normalized.lstrip("/")


def resolve_source(
    document: dict[str, Any],
    target: str,
) -> str | None:
    cleaned = html.unescape(
        target.strip()
    )

    lowered = cleaned.lower()

    if (
        not cleaned
        or cleaned.startswith("#")
        or lowered.startswith("data:")
        or lowered.startswith("javascript:")
    ):
        return None

    split = urllib.parse.urlsplit(
        cleaned
    )

    if split.scheme in {
        "http",
        "https",
    }:
        return urllib.parse.urlunsplit(
            (
                split.scheme,
                split.netloc,
                split.path,
                split.query,
                "",
            )
        )

    repository = repository_parts(
        str(
            document.get(
                "repositoryUrl",
                "",
            )
        )
    )

    if repository is None:
        return None

    owner, repository_name = repository

    path = relative_path(
        str(
            document.get(
                "sourcePath",
                "",
            )
        ),
        cleaned,
    )

    if not path:
        return None

    encoded_path = urllib.parse.quote(
        path,
        safe="/@:+-._~",
    )

    if (
        document.get(
            "sourceType"
        )
        == "wiki"
    ):
        return (
            "https://raw.githubusercontent.com/wiki/"
            f"{owner}/{repository_name}/"
            f"{encoded_path}"
        )

    revision = str(
        document.get(
            "sourceRevision",
            "",
        )
        or document.get(
            "sourceBranch",
            "main",
        )
        or "main"
    )

    return (
        "https://raw.githubusercontent.com/"
        f"{owner}/{repository_name}/"
        f"{urllib.parse.quote(revision, safe='@:+-._~')}/"
        f"{encoded_path}"
    )


def detect_mime(
    payload: bytes,
) -> str | None:
    if payload.startswith(
        b"\x89PNG\r\n\x1a\n"
    ):
        return "image/png"

    if payload.startswith(
        b"\xff\xd8\xff"
    ):
        return "image/jpeg"

    if payload.startswith(
        (
            b"GIF87a",
            b"GIF89a",
        )
    ):
        return "image/gif"

    if (
        len(payload) >= 12
        and payload[:4] == b"RIFF"
        and payload[8:12] == b"WEBP"
    ):
        return "image/webp"

    return None


def jpeg_size(
    payload: bytes,
) -> tuple[int, int] | None:
    index = 2

    while index + 9 < len(
        payload
    ):
        if payload[index] != 0xFF:
            index += 1
            continue

        marker = payload[index + 1]
        index += 2

        if marker in {
            0xD8,
            0xD9,
        }:
            continue

        if index + 2 > len(
            payload
        ):
            return None

        segment = struct.unpack(
            ">H",
            payload[
                index:index + 2
            ],
        )[0]

        if segment < 2:
            return None

        if marker in {
            0xC0,
            0xC1,
            0xC2,
            0xC3,
            0xC5,
            0xC6,
            0xC7,
            0xC9,
            0xCA,
            0xCB,
            0xCD,
            0xCE,
            0xCF,
        }:
            if index + 7 > len(
                payload
            ):
                return None

            height, width = struct.unpack(
                ">HH",
                payload[
                    index + 3:
                    index + 7
                ],
            )

            return width, height

        index += segment

    return None


def webp_size(
    payload: bytes,
) -> tuple[int, int] | None:
    if len(payload) < 30:
        return None

    chunk = payload[12:16]

    if chunk == b"VP8X":
        return (
            1
            + int.from_bytes(
                payload[24:27],
                "little",
            ),
            1
            + int.from_bytes(
                payload[27:30],
                "little",
            ),
        )

    if chunk == b"VP8L":
        bits = int.from_bytes(
            payload[21:25],
            "little",
        )

        return (
            (
                bits & 0x3FFF
            )
            + 1,
            (
                (
                    bits >> 14
                )
                & 0x3FFF
            )
            + 1,
        )

    if chunk == b"VP8 ":
        marker = payload.find(
            b"\x9d\x01\x2a",
            20,
        )

        if (
            marker < 0
            or marker + 7
                > len(payload)
        ):
            return None

        width, height = struct.unpack(
            "<HH",
            payload[
                marker + 3:
                marker + 7
            ],
        )

        return (
            width & 0x3FFF,
            height & 0x3FFF,
        )

    return None


def image_size(
    payload: bytes,
    mime: str,
) -> tuple[int, int] | None:
    if (
        mime == "image/png"
        and len(payload) >= 24
    ):
        return struct.unpack(
            ">II",
            payload[16:24],
        )

    if (
        mime == "image/gif"
        and len(payload) >= 10
    ):
        return struct.unpack(
            "<HH",
            payload[6:10],
        )

    if mime == "image/jpeg":
        return jpeg_size(
            payload
        )

    if mime == "image/webp":
        return webp_size(
            payload
        )

    return None


def download_asset(
    url: str,
) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent":
                "ForestOfLight-Documentation-Media/1.0",
            "Accept":
                "image/png,image/jpeg,image/webp,"
                "image/gif,image/*;q=0.8,*/*;q=0.1",
        },
    )

    last_error: Exception | None = None

    for attempt in range(
        RETRIES
    ):
        try:
            with urllib.request.urlopen(
                request,
                timeout=TIMEOUT_SECONDS,
            ) as response:
                length = response.headers.get(
                    "Content-Length"
                )

                if (
                    length
                    and int(length)
                    > MAX_BYTES
                ):
                    raise RuntimeError(
                        "asset exceeds 12 MB"
                    )

                payload = response.read(
                    MAX_BYTES + 1
                )

                if len(payload) > MAX_BYTES:
                    raise RuntimeError(
                        "asset exceeds 12 MB"
                    )

            mime = detect_mime(
                payload
            )

            if (
                mime is None
                or mime not in EXTENSIONS
            ):
                return {
                    "status":
                        "unsupported",
                    "reason":
                        "unsupported or unsafe image format",
                }

            size = image_size(
                payload,
                mime,
            )

            if (
                size is None
                or size[0] <= 0
                or size[1] <= 0
                or size[0] > 20000
                or size[1] > 20000
            ):
                raise RuntimeError(
                    "invalid image dimensions"
                )

            return {
                "status":
                    "ok",
                "payload":
                    payload,
                "mime":
                    mime,
                "width":
                    int(size[0]),
                "height":
                    int(size[1]),
            }
        except (
            urllib.error.URLError,
            urllib.error.HTTPError,
            TimeoutError,
            RuntimeError,
            ValueError,
        ) as error:
            last_error = error

            if attempt + 1 < RETRIES:
                time.sleep(
                    0.8
                    * (
                        attempt + 1
                    )
                )

    return {
        "status":
            "failed",
        "reason":
            str(last_error)
            if last_error
            else "download failed",
    }


def variants(
    source: str,
) -> set[str]:
    output = {
        source,
        html.unescape(source),
    }

    for value in list(
        output
    ):
        try:
            output.add(
                urllib.parse.unquote(
                    value
                )
            )
        except Exception:
            pass

    return {
        value
        for value in output
        if value
    }


def main() -> None:
    corpus = load_json(
        CORPUS_PATH
    )

    documents = corpus.get(
        "documents",
        [],
    )

    OUTPUT_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    for existing in OUTPUT_DIRECTORY.iterdir():
        if existing.is_file():
            existing.unlink()

    references: list[
        dict[str, str]
    ] = []

    for document in documents:
        document_id = str(
            document.get(
                "id",
                "",
            )
        )

        for source in image_sources(
            str(
                document.get(
                    "markdown",
                    "",
                )
            )
        ):
            resolved = resolve_source(
                document,
                source,
            )

            references.append(
                {
                    "documentId":
                        document_id,
                    "source":
                        source,
                    "resolved":
                        resolved
                        or "",
                }
            )

    urls = sorted(
        {
            reference[
                "resolved"
            ]
            for reference
            in references
            if reference[
                "resolved"
            ]
        }
    )

    results: dict[
        str,
        dict[str, Any],
    ] = {}

    with concurrent.futures.ThreadPoolExecutor(
        max_workers=WORKERS
    ) as executor:
        futures = {
            executor.submit(
                download_asset,
                url,
            ):
                url
            for url in urls
        }

        for future in concurrent.futures.as_completed(
            futures
        ):
            url = futures[
                future
            ]

            try:
                results[url] = (
                    future.result()
                )
            except Exception as error:
                results[url] = {
                    "status":
                        "failed",
                    "reason":
                        str(error),
                }

    stored: dict[
        str,
        dict[str, Any],
    ] = {}

    unique_paths: set[str] = set()
    total_bytes = 0

    for url, result in results.items():
        if result.get(
            "status"
        ) != "ok":
            continue

        payload = result[
            "payload"
        ]

        digest = hashlib.sha256(
            payload
        ).hexdigest()

        filename = (
            digest[:24]
            + EXTENSIONS[
                result["mime"]
            ]
        )

        destination = (
            OUTPUT_DIRECTORY
            / filename
        )

        if not destination.exists():
            destination.write_bytes(
                payload
            )

        path = (
            f"/_docs-media/{filename}"
        )

        if path not in unique_paths:
            unique_paths.add(path)
            total_bytes += len(
                payload
            )

        stored[url] = {
            "path":
                path,
            "width":
                result["width"],
            "height":
                result["height"],
            "mime":
                result["mime"],
            "bytes":
                len(payload),
            "hash":
                digest,
            "sourceUrl":
                url,
            "animated":
                result["mime"]
                == "image/gif",
        }

    assets: dict[
        str,
        dict[str, dict[str, Any]],
    ] = {}

    mirrored_references = 0

    for reference in references:
        asset = stored.get(
            reference[
                "resolved"
            ]
        )

        if asset is None:
            continue

        mappings = assets.setdefault(
            reference[
                "documentId"
            ],
            {},
        )

        for variant in variants(
            reference[
                "source"
            ]
        ):
            mappings[
                variant
            ] = asset

        mirrored_references += 1

    unsupported = sum(
        1
        for result
        in results.values()
        if result.get(
            "status"
        )
        == "unsupported"
    )

    failed = sum(
        1
        for result
        in results.values()
        if result.get(
            "status"
        )
        == "failed"
    )

    manifest = {
        "schemaVersion": 1,
        "generatedAt":
            corpus.get(
                "generatedAt"
            ),
        "assets":
            assets,
        "summary": {
            "documents":
                len(documents),
            "documentsWithMedia":
                sum(
                    1
                    for mappings
                    in assets.values()
                    if mappings
                ),
            "candidateReferences":
                len(references),
            "uniqueRemoteSources":
                len(urls),
            "mirroredReferences":
                mirrored_references,
            "uniqueAssets":
                len(unique_paths),
            "assetBytes":
                total_bytes,
            "unsupportedSources":
                unsupported,
            "failedSources":
                failed,
        },
    }

    failure_samples = [
        {
            "url":
                url,
            "status":
                result.get(
                    "status"
                ),
            "reason":
                result.get(
                    "reason",
                    "",
                ),
        }
        for url, result
        in results.items()
        if result.get(
            "status"
        )
        != "ok"
    ][:80]

    report = {
        **manifest[
            "summary"
        ],
        "failureSamples":
            failure_samples,
        "passed":
            len(unique_paths)
            > 0,
    }

    MANIFEST_PATH.write_text(
        json.dumps(
            manifest,
            indent=2,
            sort_keys=True,
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

    if len(unique_paths) <= 0:
        raise RuntimeError(
            "No safe raster documentation media could be mirrored."
        )


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(
            "Documentation media synchronization failed: "
            f"{error}",
            file=sys.stderr,
        )

        raise SystemExit(1)
