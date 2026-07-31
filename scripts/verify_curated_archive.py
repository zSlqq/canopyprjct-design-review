#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys

from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_ROOT = ROOT / "lib/data/generated/archive"
CURATED_ROOT = ROOT / "lib/data/generated/curated-archive"
DEFAULT_PUBLIC_ROOT = ROOT / "public"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def text_values(value: Any):
    if isinstance(value, dict):
        for item in value.values():
            yield from text_values(item)
    elif isinstance(value, list):
        for item in value:
            yield from text_values(item)
    elif isinstance(value, str):
        yield value


def image_blocks(value: Any) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []

    if isinstance(value, list):
        for item in value:
            output.extend(
                image_blocks(
                    item
                )
            )
        return output

    if not isinstance(value, dict):
        return output

    if value.get(
        "type"
    ) == "image":
        output.append(
            value
        )

    for child in value.values():
        output.extend(
            image_blocks(
                child
            )
        )

    return output



def predicted_dom_ids(
    project: dict[str, Any],
) -> list[str]:
    identifiers: list[str] = []

    for section in project.get(
        "sections",
        [],
    ):
        section_id = str(
            section.get(
                "id"
            )
            or ""
        ).strip()

        if section_id:
            identifiers.append(
                section_id
            )

        documents = section.get(
            "documents",
            [],
        )

        if section.get(
            "kind"
        ) == "prose":
            for document_index, document in enumerate(
                documents,
                start=1,
            ):
                for block_index, block in enumerate(
                    document.get(
                        "blocks",
                        [],
                    ),
                    start=1,
                ):
                    if block.get(
                        "type"
                    ) != "heading":
                        continue

                    block_id = str(
                        block.get(
                            "id"
                        )
                        or ""
                    ).strip()

                    if not block_id:
                        continue

                    identifiers.append(
                        f"{section_id}-document-{document_index}-{block_id}-{block_index}"
                    )

        if section.get(
            "kind"
        ) == "catalog":
            source_index = 0

            for document in documents:
                for entry in document.get(
                    "entries",
                    [],
                ):
                    source_index += 1

                    entry_id = str(
                        entry.get(
                            "id"
                        )
                        or ""
                    ).strip()

                    if not entry_id:
                        continue

                    identifiers.append(
                        f"{section_id}-{entry_id}-{source_index}"
                    )

    return identifiers


def duplicate_values(
    values: list[str],
) -> list[str]:
    seen: set[str] = set()
    duplicates: list[str] = []

    for value in values:
        if value in seen and value not in duplicates:
            duplicates.append(
                value
            )
        seen.add(
            value
        )

    return duplicates


def project_media_summary(
    project: dict[str, Any],
    public_root: Path,
) -> dict[str, Any]:
    sources = [
        str(
            block.get(
                "src"
            )
            or ""
        ).strip()
        for block in image_blocks(
            project
        )
    ]

    unique_sources = list(
        dict.fromkeys(
            source
            for source in sources
            if source
        )
    )

    delivered_bytes = 0
    missing: list[str] = []
    oversized: list[str] = []

    for source in unique_sources:
        if not source.startswith(
            "/_curated-archive/"
        ):
            missing.append(
                source
            )
            continue

        path = (
            public_root
            / source.lstrip(
                "/"
            )
        )

        if not path.is_file():
            missing.append(
                source
            )
            continue

        size = path.stat().st_size
        delivered_bytes += size

        if size > 1_600_000:
            oversized.append(
                source
            )

    return {
        "images":
            len(
                unique_sources
            ),
        "deliveredBytes":
            delivered_bytes,
        "missing":
            missing,
        "oversized":
            oversized,
    }

def verify_media(
    project: dict[str, Any],
    public_root: Path,
) -> list[str]:
    failures: list[str] = []
    slug = str(
        project.get(
            "slug"
        )
        or "project"
    ).strip()

    for block in image_blocks(
        project
    ):
        source = str(
            block.get(
                "src"
            )
            or ""
        ).strip()

        if not source.startswith(
            "/_curated-archive/"
        ):
            failures.append(
                f"{slug}: non-local or relative image source: {source}"
            )
            continue

        path = (
            public_root
            / source.lstrip(
                "/"
            )
        )

        if not path.is_file():
            failures.append(
                f"{slug}: missing curated image: {source}"
            )
            continue

        if path.stat().st_size > 2_000_000:
            failures.append(
                f"{slug}: curated image exceeds 2 MB: {source}"
            )

        width = int(
            block.get(
                "width"
            )
            or 0
        )
        height = int(
            block.get(
                "height"
            )
            or 0
        )

        if width <= 0 or height <= 0:
            failures.append(
                f"{slug}: curated image is missing intrinsic dimensions: {source}"
            )

    return failures


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--public-root",
        type=Path,
        default=DEFAULT_PUBLIC_ROOT,
    )
    parser.add_argument(
        "--report",
        type=Path,
    )
    arguments = parser.parse_args()

    public_root = arguments.public_root

    manifest_path = CURATED_ROOT / "manifest.json"
    downloads_path = CURATED_ROOT / "downloads.json"
    media_report_path = CURATED_ROOT / "media-optimization.json"
    archive_path = ARCHIVE_ROOT / "manifest.json"
    archive_builder_path = ROOT / "scripts/build_github_archive.py"

    failures: list[str] = []

    for path in [
        manifest_path,
        downloads_path,
        media_report_path,
        archive_path,
        archive_builder_path,
    ]:
        if not path.is_file():
            failures.append(f"Missing required file: {path}")

    if failures:
        for failure in failures:
            print(f"FAIL: {failure}", file=sys.stderr)
        raise SystemExit(1)

    manifest = read_json(manifest_path)
    downloads = read_json(downloads_path)
    media_optimization = read_json(
        media_report_path
    )
    archive = read_json(archive_path)
    archive_builder = archive_builder_path.read_text(
        encoding="utf-8"
    )

    if "MAX_FUNCTIONS = 1_500" in archive_builder:
        failures.append(
            "The legacy 1,500-function archive cap is still active."
        )
    if "MAX_FUNCTIONS: int | None = None" not in archive_builder:
        failures.append(
            "The archive builder is not configured for uncapped function capture."
        )
    if re.search(
        r"if\s+len\(output\)\s*>=\s*MAX_FUNCTIONS",
        archive_builder,
    ):
        failures.append(
            "An unguarded function-cap comparison remains in the archive builder."
        )

    if not manifest.get("passed"):
        failures.append("Curated manifest is not certified.")
    if not downloads.get("passed"):
        failures.append("Download mirror is not certified.")
    if not media_optimization.get("passed"):
        failures.append("Curated media optimization is not certified.")
    if media_optimization.get("failures"):
        failures.append(
            "Curated media optimization reported failures."
        )
    if len(manifest.get("projects", [])) != 15:
        failures.append(
            f"Expected 15 curated projects, found {len(manifest.get('projects', []))}."
        )

    archive_by_slug = {
        item["slug"]: item
        for item in archive.get("projects", [])
    }

    expected_canopy = [
        "info",
        "commands",
        "global-rules",
        "infodisplay-rules",
        "installation",
        "downloads",
        "code",
    ]

    download_count = 0
    contributor_count = 0
    section_count = 0
    predicted_dom_id_count = 0
    media_bytes = 0
    media_by_project: dict[str, dict[str, Any]] = {}

    for summary in manifest.get("projects", []):
        slug = summary["slug"]
        project_path = CURATED_ROOT / summary["file"]

        if not project_path.is_file():
            failures.append(f"{slug}: curated project file is missing.")
            continue

        project = read_json(project_path)
        sections = project.get("sections", [])
        section_ids = [
            section.get("id")
            for section in sections
        ]

        section_count += len(sections)
        contributor_count += len(project.get("contributors", []))

        failures.extend(
            verify_media(
                project,
                public_root,
            )
        )

        predicted_ids = predicted_dom_ids(
            project
        )

        predicted_dom_id_count += len(
            predicted_ids
        )

        predicted_duplicates = duplicate_values(
            predicted_ids
        )

        if predicted_duplicates:
            failures.append(
                f"{slug}: predicted duplicate rendered IDs: "
                + ", ".join(
                    predicted_duplicates
                )
            )

        media_summary = project_media_summary(
            project,
            public_root,
        )

        media_by_project[
            slug
        ] = media_summary

        media_bytes += int(
            media_summary[
                "deliveredBytes"
            ]
        )

        if media_summary[
            "missing"
        ]:
            failures.append(
                f"{slug}: missing or non-local media remained: "
                + ", ".join(
                    media_summary[
                        "missing"
                    ]
                )
            )

        if media_summary[
            "oversized"
        ]:
            failures.append(
                f"{slug}: oversized delivered media remained: "
                + ", ".join(
                    media_summary[
                        "oversized"
                    ]
                )
            )

        if len(section_ids) != len(set(section_ids)):
            failures.append(f"{slug}: duplicate section IDs.")

        if len(section_ids) < 3:
            failures.append(f"{slug}: fewer than three source-backed sections.")

        if section_ids[0:1] != ["info"]:
            failures.append(f"{slug}: Info is not the first section.")

        if section_ids[-1:] != ["code"]:
            failures.append(f"{slug}: Code is not the final section.")

        if slug == "canopy" and section_ids != expected_canopy:
            failures.append(
                f"canopy: section order mismatch: {section_ids}"
            )

        if "downloads" in section_ids:
            download_section = next(
                section
                for section in sections
                if section.get("id") == "downloads"
            )
            releases = download_section.get("releases", [])
            if not releases:
                failures.append(f"{slug}: Downloads section is empty.")

            for release in releases:
                if not release.get("downloads"):
                    failures.append(
                        f"{slug} {release.get('tag')}: release has no local downloads."
                    )

                for download in release.get("downloads", []):
                    download_count += 1
                    href = str(download.get("href") or "")
                    if not href.startswith("/_downloads/"):
                        failures.append(
                            f"{slug}: non-local download href {href}"
                        )
                        continue

                    local = public_root / href.lstrip("/")
                    if not local.is_file():
                        failures.append(f"{slug}: missing mirrored file {local}")
                        continue

                    expected_sha = str(download.get("sha256") or "")
                    if sha256_file(local) != expected_sha:
                        failures.append(f"{slug}: checksum mismatch for {local}")

        archive_summary = archive_by_slug.get(slug)
        if not archive_summary:
            failures.append(f"{slug}: missing from archive manifest.")
        else:
            archive_project = read_json(
                ARCHIVE_ROOT / archive_summary["file"]
            )

            function_records = archive_project.get(
                "functions",
                [],
            )
            function_count = int(
                archive_project.get(
                    "counts",
                    {},
                ).get(
                    "functions",
                    -1,
                )
            )
            if function_count != len(function_records):
                failures.append(
                    f"{slug}: function count differs from the uncapped record list."
                )

            expected_order = [
                contributor.get("login")
                for contributor in archive_project.get("contributors", [])
            ]
            actual_order = [
                contributor.get("login")
                for contributor in project.get("contributors", [])
            ]
            if actual_order != expected_order:
                failures.append(
                    f"{slug}: contributor order differs from GitHub capture."
                )

        for value in text_values(project):
            if re.search(r"\{\{[^{}]+\}\}", value):
                failures.append(f"{slug}: unresolved placeholder {value[:90]!r}")
                break

        if slug == "canopy":
            global_section = next(
                (
                    section
                    for section in sections
                    if section.get("id") == "global-rules"
                ),
                None,
            )
            if not global_section:
                failures.append("canopy: Global Rules section is missing.")
            else:
                entries = [
                    entry
                    for document in global_section.get("documents", [])
                    for entry in document.get("entries", [])
                ]
                names = [
                    entry.get("name")
                    for entry in entries
                ]
                if "dupeTnt" not in names:
                    failures.append("canopy: dupeTnt rule is missing.")
                else:
                    dupe = entries[names.index("dupeTnt")]
                    images = [
                        block
                        for block in dupe.get("blocks", [])
                        if block.get("type") == "image"
                    ]
                    if not images:
                        failures.append(
                            "canopy: dupeTnt does not contain its reference image."
                        )
                    elif images[0].get("src") != (
                        "/_curated-archive/canopy/dupe-tnt.png"
                    ):
                        failures.append(
                            "canopy: dupeTnt image is not locally served."
                        )

            if not project.get("support"):
                failures.append("canopy: support section is missing.")

    if download_count != int(downloads.get("summary", {}).get("files") or -1):
        failures.append(
            "Curated download count does not match the mirror manifest."
        )

    if download_count != int(archive.get("summary", {}).get("releaseAssets") or -1):
        failures.append(
            f"Expected {archive.get('summary', {}).get('releaseAssets')} mirrored "
            f"download actions, found {download_count}."
        )

    result = {
        "schemaVersion": 1,
        "projects": len(manifest.get("projects", [])),
        "sections": section_count,
        "contributors": contributor_count,
        "downloads": download_count,
        "predictedDomIds": predicted_dom_id_count,
        "mediaBytes": media_bytes,
        "mediaByProject": media_by_project,
        "mediaOptimization": {
            "images":
                media_optimization.get(
                    "images",
                    0,
                ),
            "optimized":
                media_optimization.get(
                    "optimized",
                    0,
                ),
            "deliveredBytes":
                media_optimization.get(
                    "deliveredBytes",
                    0,
                ),
            "passed":
                media_optimization.get(
                    "passed",
                    False,
                ),
        },
        "failures": failures,
        "passed": not failures,
    }

    print(json.dumps(result, indent=2))

    report = (
        arguments.report
        if arguments.report
        else ROOT / ".stage35/curated-integrity.json"
    )
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(
        json.dumps(result, indent=2) + "\n",
        encoding="utf-8",
    )

    if failures:
        for failure in failures:
            print(f"FAIL: {failure}", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
