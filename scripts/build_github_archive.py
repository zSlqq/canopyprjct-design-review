#!/usr/bin/env python3

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import tarfile
import time
import urllib.error
import urllib.parse
import urllib.request

from collections import defaultdict
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
OWNER = "ForestOfLight"

GENERATED = ROOT / "lib/data/generated/archive"
PROJECTS = GENERATED / "projects"
PUBLIC_AVATARS = ROOT / "public/_archive-media/contributors"
WORK = ROOT / ".stage33/archive-work"

TOKEN = (
    os.environ.get("GITHUB_TOKEN")
    or os.environ.get("GH_TOKEN")
    or ""
).strip()

if (
    not TOKEN
    and shutil.which("gh")
):
    token_result = subprocess.run(
        [
            "gh",
            "auth",
            "token",
        ],
        text=True,
        capture_output=True,
    )

    if token_result.returncode == 0:
        TOKEN = token_result.stdout.strip()

CODE_SUFFIXES = {
    ".c",
    ".cc",
    ".cpp",
    ".cs",
    ".go",
    ".h",
    ".hpp",
    ".java",
    ".js",
    ".jsx",
    ".kt",
    ".mjs",
    ".py",
    ".rs",
    ".ts",
    ".tsx",
}

MARKDOWN_SUFFIXES = {
    ".md",
    ".mdx",
    ".markdown",
}

IGNORED_PARTS = {
    ".git",
    ".github",
    ".next",
    ".venv",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "out",
    "target",
    "vendor",
}

MAX_CODE_BYTES = 700_000
MAX_MARKDOWN_BYTES = 1_500_000
MAX_FUNCTIONS: int | None = None
MAX_DOCUMENT_ITEMS = 1_000


def slugify(value: str) -> str:
    return re.sub(
        r"[^a-z0-9]+",
        "-",
        value.lower(),
    ).strip("-")


def clean_text(value: Any) -> str:
    return str(
        value
        if value is not None
        else ""
    ).strip()


def request_bytes(
    url: str,
    *,
    accept: str = "application/vnd.github+json",
    timeout: int = 60,
    retries: int = 4,
) -> bytes:
    headers = {
        "Accept": accept,
        "User-Agent": "ForestOfLight-Archive-Builder/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"

    last_error: Exception | None = None

    for attempt in range(retries):
        request = urllib.request.Request(
            url,
            headers=headers,
        )

        try:
            with urllib.request.urlopen(
                request,
                timeout=timeout,
            ) as response:
                return response.read()
        except (
            urllib.error.HTTPError,
            urllib.error.URLError,
            TimeoutError,
        ) as error:
            last_error = error
            status = getattr(error, "code", None)

            if status in {404, 409, 422}:
                raise

            time.sleep(
                1.2
                * (
                    attempt
                    + 1
                )
            )

    assert last_error is not None
    raise last_error


def api_json(path: str) -> Any:
    url = (
        path
        if path.startswith("http")
        else "https://api.github.com" + path
    )

    return json.loads(
        request_bytes(url).decode("utf-8")
    )


def api_pages(
    path: str,
    *,
    maximum_pages: int = 20,
) -> list[dict[str, Any]]:
    separator = "&" if "?" in path else "?"
    output: list[dict[str, Any]] = []

    for page in range(
        1,
        maximum_pages + 1,
    ):
        page_path = (
            f"{path}{separator}"
            f"per_page=100&page={page}"
        )

        payload = api_json(page_path)

        if not isinstance(payload, list):
            raise RuntimeError(
                f"Expected a list from {page_path}."
            )

        output.extend(
            item
            for item in payload
            if isinstance(item, dict)
        )

        if len(payload) < 100:
            break

    return output


def download_file(
    url: str,
    destination: Path,
    *,
    accept: str = "*/*",
) -> None:
    destination.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    destination.write_bytes(
        request_bytes(
            url,
            accept=accept,
        )
    )


def safe_extract(
    archive: Path,
    destination: Path,
) -> Path:
    destination.mkdir(
        parents=True,
        exist_ok=True,
    )

    with tarfile.open(
        archive,
        "r:gz",
    ) as handle:
        root = destination.resolve()

        for member in handle.getmembers():
            member_path = (
                destination
                / member.name
            ).resolve()

            if (
                member_path != root
                and root not in member_path.parents
            ):
                raise RuntimeError(
                    "Unsafe repository archive path."
                )

        handle.extractall(destination)

    directories = [
        path
        for path in destination.iterdir()
        if path.is_dir()
    ]

    return (
        directories[0]
        if len(directories) == 1
        else destination
    )


def _stage35_archive_cache_enabled() -> bool:
    return os.environ.get(
        "FORESTOFLIGHT_REUSE_ARCHIVE_WORK",
        "1",
    ).strip().lower() not in {
        "0",
        "false",
        "no",
    }


def _stage35_existing_source(
    destination: Path,
) -> Path | None:
    source = destination / "source"

    if not source.is_dir():
        return None

    directories = [
        path
        for path in source.iterdir()
        if path.is_dir()
    ]

    candidate = (
        directories[0]
        if len(directories) == 1
        else source
    )

    if not any(
        path.is_file()
        for path in candidate.rglob("*")
    ):
        return None

    return candidate


def _stage35_stream_download(
    url: str,
    destination: Path,
    *,
    accept: str,
) -> None:
    headers = {
        "Accept": accept,
        "User-Agent": "ForestOfLight-Technical-Hub/1.0",
    }

    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"

    temporary = destination.with_suffix(
        destination.suffix + ".part"
    )
    temporary.unlink(missing_ok=True)
    last_error: Exception | None = None

    for attempt in range(3):
        request = urllib.request.Request(
            url,
            headers=headers,
        )

        try:
            with urllib.request.urlopen(
                request,
                timeout=120,
            ) as response:
                with temporary.open("wb") as stream:
                    while True:
                        chunk = response.read(1024 * 1024)
                        if not chunk:
                            break
                        stream.write(chunk)

            if temporary.is_file() and temporary.stat().st_size > 0:
                temporary.replace(destination)
                return

            raise RuntimeError(
                f"Empty repository archive: {url}"
            )
        except (
            urllib.error.HTTPError,
            urllib.error.URLError,
            TimeoutError,
            OSError,
        ) as error:
            last_error = error
            temporary.unlink(missing_ok=True)
            status = getattr(error, "code", None)

            if status in {401, 403, 404, 422}:
                raise

            time.sleep(2.0 * (attempt + 1))

    assert last_error is not None
    raise last_error


def repository_checkout(
    full_name: str,
    branch: str,
    destination: Path,
) -> Path:
    archive = destination / "repository.tar.gz"
    source = destination / "source"
    cached = _stage35_existing_source(destination)

    if cached is not None and _stage35_archive_cache_enabled():
        print(
            f"  archive source cache: reuse {full_name}",
            flush=True,
        )
        return cached

    branch_encoded = urllib.parse.quote(
        branch,
        safe="",
    )
    destination.mkdir(
        parents=True,
        exist_ok=True,
    )

    try:
        _stage35_stream_download(
            (
                "https://codeload.github.com/"
                f"{full_name}/tar.gz/refs/heads/"
                f"{branch_encoded}"
            ),
            archive,
            accept="application/octet-stream",
        )
    except Exception:
        if cached is not None:
            print(
                f"  archive source cache: refresh failed, retaining {full_name}",
                flush=True,
            )
            return cached
        raise

    shutil.rmtree(
        source,
        ignore_errors=True,
    )

    return safe_extract(
        archive,
        source,
    )


def wiki_checkout(
    full_name: str,
    destination: Path,
) -> Path | None:
    if (
        destination.is_dir()
        and any(destination.rglob("*.md"))
        and _stage35_archive_cache_enabled()
    ):
        print(
            f"  archive wiki cache: reuse {full_name}",
            flush=True,
        )
        return destination

    temporary = destination.with_name(
        destination.name + ".stage35-part"
    )
    shutil.rmtree(
        temporary,
        ignore_errors=True,
    )

    environment = os.environ.copy()
    environment["GIT_TERMINAL_PROMPT"] = "0"
    environment["GCM_INTERACTIVE"] = "Never"
    environment["GIT_ASKPASS"] = ""

    try:
        result = subprocess.run(
            [
                "git",
                "-c",
                "core.longpaths=true",
                "-c",
                "http.version=HTTP/1.1",
                "-c",
                "http.lowSpeedLimit=1024",
                "-c",
                "http.lowSpeedTime=60",
                "-c",
                "credential.interactive=never",
                "clone",
                "--depth=1",
                "--filter=blob:none",
                "--quiet",
                f"https://github.com/{full_name}.wiki.git",
                str(temporary),
            ],
            text=True,
            capture_output=True,
            timeout=180,
            check=False,
            env=environment,
        )
    except subprocess.TimeoutExpired:
        result = None

    if result is None or result.returncode != 0:
        shutil.rmtree(
            temporary,
            ignore_errors=True,
        )

        if destination.is_dir() and any(destination.rglob("*.md")):
            return destination

        return None

    shutil.rmtree(
        destination,
        ignore_errors=True,
    )
    temporary.replace(destination)
    return destination

def ignored(path: Path) -> bool:
    return any(
        part in IGNORED_PARTS
        for part in path.parts
    )


def relative(root: Path, path: Path) -> str:
    return str(
        path.relative_to(root)
    ).replace("\\", "/")


def line_number(
    source: str,
    offset: int,
) -> int:
    return (
        source.count(
            "\n",
            0,
            offset,
        )
        + 1
    )


def clean_signature(value: str) -> str:
    return re.sub(
        r"\s+",
        " ",
        value,
    ).strip()[:260]


def parse_functions(
    source_root: Path,
) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    seen: set[tuple[str, str, int]] = set()

    patterns = [
        (
            "function",
            re.compile(
                r"(?m)^(?P<prefix>\s*(?:export\s+)?(?:async\s+)?)"
                r"function\s+(?P<name>[A-Za-z_$][\w$]*)"
                r"\s*(?P<signature>\([^)\n]*\))"
            ),
        ),
        (
            "arrow function",
            re.compile(
                r"(?m)^(?P<prefix>\s*(?:export\s+)?(?:const|let|var)\s+)"
                r"(?P<name>[A-Za-z_$][\w$]*)"
                r"\s*=\s*(?:async\s*)?"
                r"(?P<signature>\([^)\n]*\)|[A-Za-z_$][\w$]*)\s*=>"
            ),
        ),
        (
            "method",
            re.compile(
                r"(?m)^\s*(?P<prefix>(?:public|private|protected|static|async|readonly|\s)*)"
                r"(?P<name>[A-Za-z_$][\w$]*)"
                r"\s*(?P<signature>\([^)\n]*\))\s*(?::[^={\n]+)?\s*\{"
            ),
        ),
        (
            "python function",
            re.compile(
                r"(?m)^(?P<prefix>\s*(?:async\s+)?)def\s+"
                r"(?P<name>[A-Za-z_][\w]*)"
                r"\s*(?P<signature>\([^)\n]*\))"
            ),
        ),
        (
            "go function",
            re.compile(
                r"(?m)^\s*func\s+(?:\([^)]+\)\s*)?"
                r"(?P<name>[A-Za-z_][\w]*)"
                r"\s*(?P<signature>\([^)\n]*\))"
            ),
        ),
        (
            "rust function",
            re.compile(
                r"(?m)^\s*(?P<prefix>pub(?:\([^)]*\))?\s+)?"
                r"(?:async\s+)?fn\s+"
                r"(?P<name>[A-Za-z_][\w]*)"
                r"\s*(?P<signature>\([^)\n]*\))"
            ),
        ),
    ]

    for path in sorted(source_root.rglob("*")):
        if (
            MAX_FUNCTIONS is not None
            and len(output) >= MAX_FUNCTIONS
        ):
            break

        if (
            not path.is_file()
            or path.suffix.lower() not in CODE_SUFFIXES
            or ignored(path)
            or path.stat().st_size > MAX_CODE_BYTES
        ):
            continue

        source = path.read_text(
            encoding="utf-8",
            errors="replace",
        )

        file = relative(
            source_root,
            path,
        )

        for kind, pattern in patterns:
            for match in pattern.finditer(source):
                name = clean_text(
                    match.group("name")
                )

                if (
                    not name
                    or name.startswith("_")
                    or name == "constructor"
                ):
                    continue

                line = line_number(
                    source,
                    match.start(),
                )

                key = (
                    name,
                    file,
                    line,
                )

                if key in seen:
                    continue

                seen.add(key)

                prefix = clean_text(
                    match.groupdict().get(
                        "prefix"
                    )
                )

                output.append({
                    "name": name,
                    "kind": kind,
                    "signature": clean_signature(
                        clean_text(
                            match.groupdict().get(
                                "signature"
                            )
                        )
                    ),
                    "file": file,
                    "line": line,
                    "exported": (
                        "export" in prefix
                        or "pub" in prefix
                        or (
                            kind == "go function"
                            and name[:1].isupper()
                        )
                    ),
                })

                if (
                    MAX_FUNCTIONS is not None
                    and len(output) >= MAX_FUNCTIONS
                ):
                    break

            if (
                MAX_FUNCTIONS is not None
                and len(output) >= MAX_FUNCTIONS
            ):
                break

    output.sort(
        key=lambda item: (
            not item["exported"],
            item["name"].lower(),
            item["file"],
            item["line"],
        )
    )

    return output


def markdown_sources(
    source_root: Path,
    wiki_root: Path | None,
) -> list[tuple[str, str]]:
    roots = [
        (
            "repository",
            source_root,
        ),
    ]

    if wiki_root is not None:
        roots.append(
            (
                "wiki",
                wiki_root,
            )
        )

    output: list[tuple[str, str]] = []

    for origin, root in roots:
        for path in sorted(root.rglob("*")):
            if (
                not path.is_file()
                or path.suffix.lower()
                not in MARKDOWN_SUFFIXES
                or ignored(path)
                or path.stat().st_size > MAX_MARKDOWN_BYTES
            ):
                continue

            output.append(
                (
                    f"{origin}:{relative(root, path)}",
                    path.read_text(
                        encoding="utf-8",
                        errors="replace",
                    ),
                )
            )

    return output


def clean_heading(value: str) -> str:
    return re.sub(
        r"\s+",
        " ",
        re.sub(
            r"[`*_~\[\]()]",
            " ",
            value,
        ),
    ).strip(" -–—:.")[:140]


def extract_document_data(
    sources: list[tuple[str, str]],
) -> tuple[
    list[dict[str, Any]],
    list[dict[str, Any]],
    list[dict[str, Any]],
]:
    commands: list[dict[str, Any]] = []
    rules: list[dict[str, Any]] = []
    documents: list[dict[str, Any]] = []

    command_seen: set[tuple[str, str]] = set()
    rule_seen: set[tuple[str, str]] = set()

    command_pattern = re.compile(
        r"(?<![\w/])"
        r"(?P<command>/[A-Za-z][A-Za-z0-9:_-]*)"
    )

    generic = {
        "",
        "commands",
        "configuration",
        "default",
        "default value",
        "description",
        "details",
        "example",
        "examples",
        "features",
        "global rules",
        "notes",
        "options",
        "overview",
        "parameters",
        "rules",
        "settings",
        "syntax",
        "type",
        "usage",
        "values",
    }

    for source_name, source in sources:
        headings = [
            clean_heading(
                match.group(1)
            )
            for match in re.finditer(
                r"(?m)^#{1,6}\s+(.+?)\s*$",
                source,
            )
        ]

        headings = [
            heading
            for heading in headings
            if heading
        ]

        documents.append({
            "source": source_name,
            "title": (
                headings[0]
                if headings
                else Path(
                    source_name.split(
                        ":",
                        1,
                    )[-1]
                ).stem.replace(
                    "-",
                    " ",
                ).title()
            ),
            "headings": headings[:100],
            "bytes": len(
                source.encode("utf-8")
            ),
        })

        lower_name = source_name.lower()
        likely_commands = (
            "command" in lower_name
            or re.search(
                r"(?im)^#{1,6}\s+.*command",
                source,
            )
            is not None
        )

        likely_rules = (
            "rule" in lower_name
            or re.search(
                r"(?im)^#{1,6}\s+.*rule",
                source,
            )
            is not None
        )

        if likely_commands:
            for match in command_pattern.finditer(source):
                command = match.group("command")
                key = (
                    command.lower(),
                    source_name,
                )

                if key in command_seen:
                    continue

                command_seen.add(key)

                context = re.sub(
                    r"\s+",
                    " ",
                    source[
                        max(
                            0,
                            match.start() - 90,
                        ):
                        min(
                            len(source),
                            match.end() + 180,
                        )
                    ],
                ).strip()

                commands.append({
                    "command": command,
                    "source": source_name,
                    "line": line_number(
                        source,
                        match.start(),
                    ),
                    "context": context[:280],
                })

                if len(commands) >= MAX_DOCUMENT_ITEMS:
                    break

        if likely_rules:
            for heading in headings:
                normalized = re.sub(
                    r"[^a-z0-9]+",
                    " ",
                    heading.lower(),
                ).strip()

                if (
                    normalized in generic
                    or len(normalized) < 3
                ):
                    continue

                key = (
                    normalized,
                    source_name,
                )

                if key in rule_seen:
                    continue

                rule_seen.add(key)

                rules.append({
                    "name": heading,
                    "source": source_name,
                })

                if len(rules) >= MAX_DOCUMENT_ITEMS:
                    break

    commands.sort(
        key=lambda item: (
            item["command"].lower(),
            item["source"],
        )
    )

    rules.sort(
        key=lambda item: (
            item["name"].lower(),
            item["source"],
        )
    )

    documents.sort(
        key=lambda item: (
            item["title"].lower(),
            item["source"],
        )
    )

    return (
        commands,
        rules,
        documents,
    )


def release_records(
    full_name: str,
) -> list[dict[str, Any]]:
    releases = api_pages(
        f"/repos/{full_name}/releases"
    )

    tags = api_pages(
        f"/repos/{full_name}/tags"
    )

    output: list[dict[str, Any]] = []
    seen_tags: set[str] = set()

    for release in releases:
        tag = clean_text(
            release.get("tag_name")
        )

        if not tag:
            continue

        seen_tags.add(tag)
        assets = []

        for asset in release.get("assets", []):
            if not isinstance(asset, dict):
                continue

            url = clean_text(
                asset.get(
                    "browser_download_url"
                )
            )

            if not url:
                continue

            assets.append({
                "name": clean_text(
                    asset.get("name")
                )
                or "Release asset",
                "downloadUrl": url,
                "bytes": int(
                    asset.get("size")
                    or 0
                ),
                "downloads": int(
                    asset.get(
                        "download_count"
                    )
                    or 0
                ),
                "contentType": clean_text(
                    asset.get(
                        "content_type"
                    )
                ),
            })

        assets.sort(
            key=lambda item:
                item["name"].lower()
        )

        tag_encoded = urllib.parse.quote(
            tag,
            safe="",
        )

        output.append({
            "tag": tag,
            "name": clean_text(
                release.get("name")
            )
            or tag,
            "publishedAt": clean_text(
                release.get("published_at")
                or release.get("created_at")
            ),
            "prerelease": bool(
                release.get("prerelease")
            ),
            "draft": bool(
                release.get("draft")
            ),
            "notes": clean_text(
                release.get("body")
            )[:16_000],
            "htmlUrl": clean_text(
                release.get("html_url")
            ),
            "assets": assets,
            "sourceZipUrl": (
                f"https://github.com/{full_name}/archive/refs/tags/"
                f"{tag_encoded}.zip"
            ),
            "sourceTarUrl": (
                f"https://github.com/{full_name}/archive/refs/tags/"
                f"{tag_encoded}.tar.gz"
            ),
            "formalRelease": True,
        })

    for tag_data in tags:
        tag = clean_text(
            tag_data.get("name")
        )

        if (
            not tag
            or tag in seen_tags
        ):
            continue

        tag_encoded = urllib.parse.quote(
            tag,
            safe="",
        )

        output.append({
            "tag": tag,
            "name": tag,
            "publishedAt": "",
            "prerelease": False,
            "draft": False,
            "notes": "",
            "htmlUrl": (
                f"https://github.com/{full_name}/tree/"
                f"{tag_encoded}"
            ),
            "assets": [],
            "sourceZipUrl": (
                f"https://github.com/{full_name}/archive/refs/tags/"
                f"{tag_encoded}.zip"
            ),
            "sourceTarUrl": (
                f"https://github.com/{full_name}/archive/refs/tags/"
                f"{tag_encoded}.tar.gz"
            ),
            "formalRelease": False,
        })

    output.sort(
        key=lambda item: (
            item["publishedAt"],
            item["tag"],
        ),
        reverse=True,
    )

    return output


def contributor_records(
    full_name: str,
) -> list[dict[str, Any]]:
    contributors = api_pages(
        f"/repos/{full_name}/contributors"
    )

    output: list[dict[str, Any]] = []

    for contributor in contributors:
        login = clean_text(
            contributor.get("login")
        )

        if not login:
            continue

        avatar_url = clean_text(
            contributor.get("avatar_url")
        )

        local_avatar = ""

        if avatar_url:
            destination = (
                PUBLIC_AVATARS
                / f"{slugify(login)}.png"
            )

            try:
                download_file(
                    (
                        avatar_url
                        + (
                            "&"
                            if "?" in avatar_url
                            else "?"
                        )
                        + "s=96"
                    ),
                    destination,
                    accept="image/*",
                )

                local_avatar = (
                    "/_archive-media/contributors/"
                    + destination.name
                )
            except Exception:
                local_avatar = ""

        output.append({
            "login": login,
            "contributions": int(
                contributor.get(
                    "contributions"
                )
                or 0
            ),
            "profileUrl": clean_text(
                contributor.get(
                    "html_url"
                )
            ),
            "avatar": local_avatar,
            "type": clean_text(
                contributor.get("type")
            ),
        })

    output.sort(
        key=lambda item: (
            -item["contributions"],
            item["login"].lower(),
        )
    )

    return output


def write_json(
    path: Path,
    value: Any,
) -> None:
    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    path.write_text(
        json.dumps(
            value,
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )



def load_previous_archive_state() -> tuple[dict[str, Any], dict[str, Any]]:
    previous_manifest: dict[str, Any] = {}
    previous_projects: dict[str, Any] = {}

    manifest_path = GENERATED / "manifest.json"
    if manifest_path.is_file():
        try:
            value = json.loads(manifest_path.read_text(encoding="utf-8"))
            if isinstance(value, dict):
                previous_manifest = value
        except Exception:
            previous_manifest = {}

    if PROJECTS.is_dir():
        for path in PROJECTS.glob("*.json"):
            try:
                value = json.loads(path.read_text(encoding="utf-8"))
            except Exception:
                continue

            if isinstance(value, dict):
                slug = clean_text(value.get("slug")) or path.stem
                previous_projects[slug] = value

    return previous_manifest, previous_projects


def retry_operation(
    label: str,
    operation,
    *,
    attempts: int = 4,
):
    last_error: Exception | None = None

    for attempt in range(1, attempts + 1):
        try:
            return operation()
        except Exception as error:
            last_error = error
            if attempt >= attempts:
                break

            delay = min(12, 2 ** (attempt - 1))
            print(
                f"  {label}: attempt {attempt}/{attempts} failed, "
                f"retrying in {delay}s: {error}",
                flush=True,
            )
            time.sleep(delay)

    assert last_error is not None
    raise last_error


def previous_list(
    previous: dict[str, Any],
    key: str,
) -> list[dict[str, Any]]:
    value = previous.get(key)
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]


def preserve_previous_list(
    current: list[dict[str, Any]],
    previous: dict[str, Any],
    key: str,
    *,
    repository: str,
    warnings: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    prior = previous_list(previous, key)
    if len(current) >= len(prior):
        return current

    warnings.append({
        "repository": repository,
        "stage": key,
        "resolution": "reused-prior-complete-data",
        "currentCount": len(current),
        "priorCount": len(prior),
    })
    return prior

def main() -> None:
    (
        previous_manifest,
        previous_projects,
    ) = load_previous_archive_state()

    shutil.rmtree(
        GENERATED,
        ignore_errors=True,
    )

    shutil.rmtree(
        PUBLIC_AVATARS,
        ignore_errors=True,
    )

    PROJECTS.mkdir(
        parents=True,
        exist_ok=True,
    )

    PUBLIC_AVATARS.mkdir(
        parents=True,
        exist_ok=True,
    )

    WORK.mkdir(
        parents=True,
        exist_ok=True,
    )

    repositories = api_pages(
        f"/users/{OWNER}/repos?type=owner&sort=updated"
    )

    repositories = [
        repository
        for repository in repositories
        if (
            not repository.get("private")
            and not repository.get("disabled")
        )
    ]

    projects = []
    totals = defaultdict(int)
    failures = []
    warnings = []

    for index, repository in enumerate(
        repositories,
        start=1,
    ):
        name = clean_text(
            repository.get("name")
        )

        full_name = clean_text(
            repository.get("full_name")
        )

        branch = clean_text(
            repository.get(
                "default_branch"
            )
        )

        if (
            not name
            or not full_name
            or not branch
        ):
            continue

        slug = slugify(name)
        work_project = WORK / slug
        previous_payload = previous_projects.get(slug, {})

        print(
            f"[{index}/{len(repositories)}] {full_name}",
            flush=True,
        )

        try:
            source_root = repository_checkout(
                full_name,
                branch,
                work_project,
            )
        except Exception as error:
            record = {
                "repository": full_name,
                "stage": "source",
                "error": str(error),
            }

            if previous_payload:
                record["resolution"] = "reused-prior-complete-data"
                warnings.append(record)
            else:
                failures.append(record)

            source_root = (
                work_project
                / "empty-source"
            )

            source_root.mkdir(
                parents=True,
                exist_ok=True,
            )

        wiki_root = wiki_checkout(
            full_name,
            work_project / "wiki",
        )

        try:
            releases = retry_operation(
                f"{full_name} releases",
                lambda: release_records(full_name),
            )
        except Exception as error:
            releases = previous_list(
                previous_payload,
                "releases",
            )

            record = {
                "repository": full_name,
                "stage": "releases",
                "error": str(error),
            }

            if releases:
                record["resolution"] = "reused-prior-complete-data"
                record["reusedCount"] = len(releases)
                warnings.append(record)
            else:
                failures.append(record)

        try:
            contributors = retry_operation(
                f"{full_name} contributors",
                lambda: contributor_records(full_name),
            )
        except Exception as error:
            contributors = previous_list(
                previous_payload,
                "contributors",
            )

            record = {
                "repository": full_name,
                "stage": "contributors",
                "error": str(error),
            }

            if contributors:
                record["resolution"] = "reused-prior-complete-data"
                record["reusedCount"] = len(contributors)
                warnings.append(record)
            else:
                failures.append(record)

        functions = parse_functions(
            source_root
        )

        sources = markdown_sources(
            source_root,
            wiki_root,
        )

        (
            commands,
            global_rules,
            documents,
        ) = extract_document_data(
            sources
        )

        functions = preserve_previous_list(
            functions,
            previous_payload,
            "functions",
            repository=full_name,
            warnings=warnings,
        )
        commands = preserve_previous_list(
            commands,
            previous_payload,
            "commands",
            repository=full_name,
            warnings=warnings,
        )
        global_rules = preserve_previous_list(
            global_rules,
            previous_payload,
            "globalRules",
            repository=full_name,
            warnings=warnings,
        )
        documents = preserve_previous_list(
            documents,
            previous_payload,
            "documents",
            repository=full_name,
            warnings=warnings,
        )

        counts = {
            "versions": len(releases),
            "releaseAssets": sum(
                len(release["assets"]) + 2
                for release in releases
            ),
            "contributors": len(contributors),
            "functions": len(functions),
            "commands": len(commands),
            "globalRules": len(global_rules),
            "documents": len(documents),
        }

        payload = {
            "schemaVersion": 1,
            "slug": slug,
            "name": name,
            "fullName": full_name,
            "description": clean_text(
                repository.get("description")
            ),
            "homepage": clean_text(
                repository.get("homepage")
            ),
            "repositoryUrl": clean_text(
                repository.get("html_url")
            ),
            "defaultBranch": branch,
            "language": clean_text(
                repository.get("language")
            ),
            "license": clean_text(
                (
                    repository.get("license")
                    or {}
                ).get("spdx_id")
            ),
            "fork": bool(
                repository.get("fork")
            ),
            "archived": bool(
                repository.get("archived")
            ),
            "createdAt": clean_text(
                repository.get("created_at")
            ),
            "updatedAt": clean_text(
                repository.get("updated_at")
            ),
            "pushedAt": clean_text(
                repository.get("pushed_at")
            ),
            "stars": int(
                repository.get(
                    "stargazers_count"
                )
                or 0
            ),
            "forks": int(
                repository.get(
                    "forks_count"
                )
                or 0
            ),
            "openIssues": int(
                repository.get(
                    "open_issues_count"
                )
                or 0
            ),
            "topics": [
                clean_text(topic)
                for topic in repository.get(
                    "topics",
                    [],
                )
                if clean_text(topic)
            ],
            "releases": releases,
            "contributors": contributors,
            "functions": functions,
            "commands": commands,
            "globalRules": global_rules,
            "documents": documents,
            "counts": counts,
        }

        project_path = (
            PROJECTS
            / f"{slug}.json"
        )

        write_json(
            project_path,
            payload,
        )

        projects.append({
            "slug": slug,
            "name": name,
            "description": payload[
                "description"
            ],
            "language": payload[
                "language"
            ],
            "fork": payload["fork"],
            "archived": payload[
                "archived"
            ],
            "updatedAt": payload[
                "updatedAt"
            ],
            "stars": payload["stars"],
            "counts": counts,
            "file": (
                "projects/"
                f"{slug}.json"
            ),
            "sha256": hashlib.sha256(
                project_path.read_bytes()
            ).hexdigest(),
            "bytes": project_path.stat().st_size,
        })

        for key, value in counts.items():
            totals[key] += value

    projects.sort(
        key=lambda item: (
            item["archived"],
            item["fork"],
            -item["counts"]["versions"],
            item["name"].lower(),
        )
    )

    previous_summary = (
        previous_manifest.get("summary")
        if isinstance(previous_manifest, dict)
        else {}
    )
    if not isinstance(previous_summary, dict):
        previous_summary = {}

    current_summary = {
        "repositories": len(projects),
        **dict(totals),
    }

    completeness_regressions = []
    for key in [
        "repositories",
        "versions",
        "releaseAssets",
        "contributors",
        "functions",
        "commands",
        "globalRules",
        "documents",
    ]:
        previous_value = int(previous_summary.get(key) or 0)
        current_value = int(current_summary.get(key) or 0)
        if previous_value > 0 and current_value < previous_value:
            completeness_regressions.append({
                "metric": key,
                "previous": previous_value,
                "current": current_value,
            })

    manifest = {
        "schemaVersion": 1,
        "generatedAt": time.strftime(
            "%Y-%m-%dT%H:%M:%SZ",
            time.gmtime(),
        ),
        "owner": OWNER,
        "projects": projects,
        "summary": current_summary,
        "warnings": warnings,
        "failures": failures,
        "completenessRegressions": completeness_regressions,
        "authenticated": bool(TOKEN),
        "passed": (
            len(projects) > 0
            and totals["versions"] > 0
            and totals["contributors"] > 0
            and totals["functions"] > 0
            and not failures
            and not completeness_regressions
        ),
    }

    write_json(
        GENERATED / "manifest.json",
        manifest,
    )

    print(
        json.dumps(
            manifest,
            indent=2,
        )
    )

    if not manifest["passed"]:
        raise SystemExit(
            "Archive completeness requirements failed."
        )


if __name__ == "__main__":
    main()
