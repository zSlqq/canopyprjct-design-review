#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.parse

from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_ROOT = ROOT / "lib/data/generated/archive"
OUTPUT_ROOT = ROOT / "public/_downloads"
GENERATED_ROOT = ROOT / "lib/data/generated/curated-archive"
def default_cache_root() -> Path:
    workspaces = Path("C:/Users/DELL/AppData/Local/Temp/forestoflight-stage35/closure-v4-20260729-234024/repository/.stage35-work/tools")
    base = (
        workspaces
        if workspaces.parent.is_dir()
        else ROOT / ".cache/stage35"
    )
    return base / "forestoflight-release-mirror"


CACHE_ROOT = Path(
    os.environ.get(
        "FORESTOFLIGHT_DOWNLOAD_CACHE",
        str(default_cache_root()),
    )
)


def configured_total_ceiling() -> int:
    raw = os.environ.get(
        "FORESTOFLIGHT_DOWNLOAD_MAX_BYTES",
        "",
    ).strip()
    if raw:
        value = int(raw)
        if value <= 0:
            raise ValueError(
                "FORESTOFLIGHT_DOWNLOAD_MAX_BYTES must be positive."
            )
        return value

    # Preserve at least 3 GiB for build output and Codespaces/runner tooling.
    free = shutil.disk_usage(ROOT).free
    return max(
        1 * 1024 * 1024 * 1024,
        free - 3 * 1024 * 1024 * 1024,
    )


MAX_TOTAL_BYTES = configured_total_ceiling()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def clean_segment(value: str, fallback: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", value.strip())
    cleaned = cleaned.strip("._-")
    return cleaned[:140] or fallback


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def github_token() -> str:
    for key in ("GH_TOKEN", "GITHUB_TOKEN"):
        value = os.environ.get(key, "").strip()
        if value:
            return value

    try:
        result = subprocess.run(
            ["gh", "auth", "token"],
            capture_output=True,
            text=True,
            timeout=15,
            check=False,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return ""

    return result.stdout.strip() if result.returncode == 0 else ""


def download(
    url: str,
    destination: Path,
    *,
    token: str,
) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".part")

    if temporary.exists():
        temporary.unlink()

    command = [
        "curl",
        "--location",
        "--fail",
        "--silent",
        "--show-error",
        "--retry",
        "5",
        "--retry-delay",
        "2",
        "--connect-timeout",
        "30",
        "--max-time",
        "1800",
        "--user-agent",
        "ForestOfLight-Technical-Hub/1.0",
        "--output",
        str(temporary),
        url,
    ]

    if token and (
        "github.com" in urllib.parse.urlparse(url).hostname
        or "githubusercontent.com" in urllib.parse.urlparse(url).hostname
    ):
        command[1:1] = [
            "--header",
            f"Authorization: Bearer {token}",
            "--header",
            "Accept: application/octet-stream",
        ]

    result = subprocess.run(
        command,
        text=True,
        capture_output=True,
        check=False,
    )

    if result.returncode != 0:
        temporary.unlink(missing_ok=True)
        raise RuntimeError(
            f"Download failed for {url}: {result.stderr.strip()}"
        )

    if not temporary.is_file() or temporary.stat().st_size <= 0:
        temporary.unlink(missing_ok=True)
        raise RuntimeError(f"Downloaded file is empty: {url}")

    temporary.replace(destination)


def cache_key(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()


def localize(
    *,
    project_slug: str,
    release_tag: str,
    source_name: str,
    source_url: str,
    expected_bytes: int,
    kind: str,
    token: str,
    running_total: list[int],
) -> dict[str, Any]:
    key = cache_key(source_url)
    safe_name = clean_segment(source_name, "download.bin")
    cache_path = CACHE_ROOT / key[:2] / key
    metadata_path = cache_path.with_suffix(".json")

    valid_cache = False
    cached_metadata: dict[str, Any] = {}

    if cache_path.is_file() and metadata_path.is_file():
        try:
            cached_metadata = read_json(metadata_path)
            valid_cache = (
                cached_metadata.get("sourceUrl") == source_url
                and cached_metadata.get("sha256") == sha256_file(cache_path)
                and cache_path.stat().st_size > 0
            )
        except (OSError, ValueError, json.JSONDecodeError):
            valid_cache = False

    if not valid_cache:
        download(source_url, cache_path, token=token)
        digest = sha256_file(cache_path)
        cached_metadata = {
            "sourceUrl": source_url,
            "sha256": digest,
            "bytes": cache_path.stat().st_size,
            "fetchedAt": time.strftime(
                "%Y-%m-%dT%H:%M:%SZ",
                time.gmtime(),
            ),
        }
        write_json(metadata_path, cached_metadata)

    actual_bytes = cache_path.stat().st_size
    running_total[0] += actual_bytes

    if running_total[0] > MAX_TOTAL_BYTES:
        raise RuntimeError(
            "Release mirror exceeded the configured safety ceiling "
            f"of {MAX_TOTAL_BYTES:,} bytes."
        )

    digest = str(cached_metadata["sha256"])
    tag_segment = clean_segment(release_tag, "untagged")
    output_name = f"{digest[:12]}-{safe_name}"
    output_path = (
        OUTPUT_ROOT
        / clean_segment(project_slug, "project")
        / tag_segment
        / output_name
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)

    if output_path.exists():
        if (
            output_path.stat().st_size != actual_bytes
            or sha256_file(output_path) != digest
        ):
            output_path.unlink()

    if not output_path.exists():
        try:
            os.link(cache_path, output_path)
        except OSError:
            shutil.copy2(cache_path, output_path)

    if expected_bytes > 0 and kind == "asset" and actual_bytes != expected_bytes:
        raise RuntimeError(
            f"Size mismatch for {project_slug} {release_tag} {source_name}: "
            f"expected {expected_bytes}, received {actual_bytes}."
        )

    return {
        "name": source_name,
        "kind": kind,
        "href": "/" + output_path.relative_to(ROOT / "public").as_posix(),
        "bytes": actual_bytes,
        "sha256": digest,
        "sourceUrl": source_url,
    }


def verify_existing_mirror() -> dict[str, Any]:
    manifest_path = GENERATED_ROOT / "downloads.json"
    if not manifest_path.is_file():
        raise RuntimeError(
            "Mirrored download manifest is missing."
        )

    manifest = read_json(manifest_path)
    failures: list[str] = []
    files = 0
    total_bytes = 0

    for project in manifest.get("projects", []):
        slug = str(project.get("slug") or "project")
        for release in project.get("releases", []):
            tag = str(release.get("tag") or "untagged")
            for download_record in release.get("downloads", []):
                files += 1
                href = str(download_record.get("href") or "")
                if not href.startswith("/_downloads/"):
                    failures.append(
                        f"{slug} {tag}: non-local mirror href {href!r}"
                    )
                    continue

                path = ROOT / "public" / href.lstrip("/")
                if not path.is_file():
                    failures.append(
                        f"{slug} {tag}: mirrored file is missing: {path}"
                    )
                    continue

                actual_bytes = path.stat().st_size
                expected_bytes = int(download_record.get("bytes") or 0)
                expected_sha = str(download_record.get("sha256") or "")
                total_bytes += actual_bytes

                if actual_bytes != expected_bytes:
                    failures.append(
                        f"{slug} {tag}: size mismatch for {path.name}"
                    )

                if sha256_file(path) != expected_sha:
                    failures.append(
                        f"{slug} {tag}: checksum mismatch for {path.name}"
                    )

    expected_files = int(manifest.get("summary", {}).get("files") or -1)
    expected_bytes = int(manifest.get("summary", {}).get("bytes") or -1)

    if files != expected_files:
        failures.append(
            f"Mirror manifest reports {expected_files} files, verified {files}."
        )

    if total_bytes != expected_bytes:
        failures.append(
            f"Mirror manifest reports {expected_bytes} bytes, verified {total_bytes}."
        )

    result = {
        "schemaVersion": 1,
        "files": files,
        "bytes": total_bytes,
        "failures": failures,
        "passed": bool(manifest.get("passed")) and not failures,
    }

    print(json.dumps(result, indent=2))
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--verify-only",
        action="store_true",
    )
    args = parser.parse_args()

    if args.verify_only:
        result = verify_existing_mirror()
        if not result["passed"]:
            raise SystemExit(
                "Release mirror verification failed."
            )
        return

    manifest_path = ARCHIVE_ROOT / "manifest.json"
    if not manifest_path.is_file():
        raise SystemExit("Archive manifest is missing.")

    manifest = read_json(manifest_path)
    if not manifest.get("passed"):
        raise SystemExit("Archive manifest is not certified.")

    token = github_token()
    CACHE_ROOT.mkdir(parents=True, exist_ok=True)
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    GENERATED_ROOT.mkdir(parents=True, exist_ok=True)

    projects_output: list[dict[str, Any]] = []
    failures: list[str] = []
    running_total = [0]
    expected_files: set[Path] = set()

    for project_summary in manifest.get("projects", []):
        project_path = ARCHIVE_ROOT / project_summary["file"]
        project = read_json(project_path)
        project_releases: list[dict[str, Any]] = []

        for release in project.get("releases", []):
            tag = str(release.get("tag") or "untagged")
            downloads: list[dict[str, Any]] = []

            sources: list[tuple[str, str, int, str]] = []

            for asset in release.get("assets", []):
                sources.append(
                    (
                        str(asset.get("name") or "Release asset"),
                        str(asset.get("downloadUrl") or ""),
                        int(asset.get("bytes") or 0),
                        "asset",
                    )
                )

            project_name = clean_segment(
                project.get("name", project["slug"]),
                project["slug"],
            )
            tag_name = clean_segment(tag, "untagged")
            sources.extend(
                [
                    (
                        f"{project_name}-{tag_name}-source.zip",
                        str(release.get("sourceZipUrl") or ""),
                        0,
                        "source-zip",
                    ),
                    (
                        f"{project_name}-{tag_name}-source.tar.gz",
                        str(release.get("sourceTarUrl") or ""),
                        0,
                        "source-tar",
                    ),
                ]
            )

            for name, url, expected_bytes, kind in sources:
                if not url:
                    failures.append(
                        f"{project['slug']} {tag}: missing URL for {name}"
                    )
                    continue

                try:
                    local = localize(
                        project_slug=project["slug"],
                        release_tag=tag,
                        source_name=name,
                        source_url=url,
                        expected_bytes=expected_bytes,
                        kind=kind,
                        token=token,
                        running_total=running_total,
                    )
                    expected_files.add(
                        ROOT / "public" / local["href"].lstrip("/")
                    )
                    downloads.append(local)
                except Exception as error:
                    failures.append(
                        f"{project['slug']} {tag} {name}: {error}"
                    )

            project_releases.append(
                {
                    "tag": tag,
                    "name": str(release.get("name") or tag),
                    "publishedAt": str(release.get("publishedAt") or ""),
                    "prerelease": bool(release.get("prerelease")),
                    "formalRelease": bool(release.get("formalRelease")),
                    "notes": str(release.get("notes") or ""),
                    "downloads": downloads,
                }
            )

        projects_output.append(
            {
                "slug": project["slug"],
                "name": project["name"],
                "releases": project_releases,
            }
        )

    for path in OUTPUT_ROOT.rglob("*"):
        if path.is_file() and path not in expected_files:
            path.unlink()

    for directory in sorted(
        [path for path in OUTPUT_ROOT.rglob("*") if path.is_dir()],
        reverse=True,
    ):
        try:
            directory.rmdir()
        except OSError:
            pass

    result = {
        "schemaVersion": 1,
        "generatedAt": time.strftime(
            "%Y-%m-%dT%H:%M:%SZ",
            time.gmtime(),
        ),
        "projects": projects_output,
        "summary": {
            "projects": len(projects_output),
            "releases": sum(
                len(project["releases"])
                for project in projects_output
            ),
            "files": sum(
                len(release["downloads"])
                for project in projects_output
                for release in project["releases"]
            ),
            "bytes": sum(
                download["bytes"]
                for project in projects_output
                for release in project["releases"]
                for download in release["downloads"]
            ),
        },
        "failures": failures,
        "passed": (
            len(projects_output) == len(manifest.get("projects", []))
            and not failures
            and all(
                release["downloads"]
                for project in projects_output
                for release in project["releases"]
            )
        ),
    }

    output_path = GENERATED_ROOT / "downloads.json"
    write_json(output_path, result)
    print(json.dumps(result["summary"] | {"failures": len(failures), "passed": result["passed"]}, indent=2))

    if not result["passed"]:
        for failure in failures:
            print(f"FAIL: {failure}", file=sys.stderr)
        raise SystemExit("Release mirror is incomplete.")


if __name__ == "__main__":
    main()
