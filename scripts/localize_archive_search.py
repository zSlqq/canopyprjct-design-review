#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import sys

from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SEARCH_ROOT = ROOT / "public/_archive-search"
DOWNLOADS = ROOT / "lib/data/generated/curated-archive/downloads.json"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> bytes:
    encoded = (
        json.dumps(
            value,
            ensure_ascii=False,
            separators=(",", ":"),
        )
        + "\n"
    ).encode("utf-8")
    path.write_bytes(encoded)
    return encoded


def main() -> None:
    manifest_path = SEARCH_ROOT / "manifest.json"

    if not manifest_path.is_file():
        raise SystemExit("Archive search manifest is missing.")
    if not DOWNLOADS.is_file():
        raise SystemExit("Curated download manifest is missing.")

    manifest = read_json(manifest_path)
    downloads = read_json(DOWNLOADS)

    if not downloads.get("passed"):
        raise SystemExit("Curated download manifest is not certified.")

    source_to_local: dict[str, str] = {}

    for project in downloads.get("projects", []):
        for release in project.get("releases", []):
            for download in release.get("downloads", []):
                source = str(download.get("sourceUrl") or "")
                href = str(download.get("href") or "")
                if source and href:
                    source_to_local[source] = href

    file_value = str(manifest.get("file") or "")
    source_path = ROOT / "public" / file_value.lstrip("/")

    if not source_path.is_file():
        raise SystemExit(f"Archive search index is missing: {source_path}")

    payload = read_json(source_path)

    entries = (
        payload.get("entries", [])
        if isinstance(payload, dict)
        else payload
    )

    download_entries = 0
    localized = 0
    missing: list[str] = []

    for entry in entries:
        if entry.get("kind") != "download":
            continue

        download_entries += 1
        source = str(entry.get("href") or "")
        local = source_to_local.get(source)

        if not local:
            missing.append(source)
            continue

        entry["href"] = local
        entry["external"] = False
        entry["downloadable"] = True
        localized += 1

    if missing:
        for source in missing[:20]:
            print(f"FAIL: archive-search download was not mirrored: {source}", file=sys.stderr)
        raise SystemExit(
            f"{len(missing)} archive-search downloads were not localized."
        )

    if localized != len(source_to_local):
        raise SystemExit(
            "Archive-search localization count differs from the mirrored download count: "
            f"{localized} vs {len(source_to_local)}."
        )

    temporary = SEARCH_ROOT / "archive.localized.json"
    encoded = write_json(temporary, payload)
    digest = hashlib.sha256(encoded).hexdigest()
    final_name = f"archive.{digest[:16]}.json"
    final_path = SEARCH_ROOT / final_name

    temporary.replace(final_path)

    for old in SEARCH_ROOT.glob("archive.*.json"):
        if old != final_path:
            old.unlink()

    manifest["file"] = f"/_archive-search/{final_name}"
    manifest["sha256"] = digest
    manifest["bytes"] = len(encoded)
    manifest["downloadsLocalized"] = localized
    manifest["downloadPolicy"] = "same-origin"
    manifest["passed"] = True

    manifest_path.write_text(
        json.dumps(
            manifest,
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    result = {
        "entries": len(entries),
        "downloadEntries": download_entries,
        "localized": localized,
        "file": manifest["file"],
        "sha256": digest,
        "bytes": len(encoded),
        "passed": (
            download_entries == localized
            and not missing
        ),
    }

    print(json.dumps(result, indent=2))

    if not result["passed"]:
        raise SystemExit("Archive search localization failed.")


if __name__ == "__main__":
    main()
