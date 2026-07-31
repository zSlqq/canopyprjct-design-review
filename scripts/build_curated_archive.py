#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_ROOT = ROOT / "lib/data/generated/archive"
GENERATED_ROOT = ROOT / "lib/data/generated/curated-archive"
DOWNLOAD_MANIFEST = GENERATED_ROOT / "downloads.json"
def default_cache_root(name: str) -> Path:
    return ROOT / ".cache/stage35" / name


SOURCE_CACHE = Path(
    os.environ.get(
        "FORESTOFLIGHT_SOURCE_CACHE",
        str(default_cache_root("forestoflight-curated-sources")),
    )
)
USER_CACHE = SOURCE_CACHE / "_github-users.json"
DUPE_TNT_PATH = ROOT / "public/_curated-archive/canopy/dupe-tnt.png"
DUPE_TNT_URL = (
    "https://raw.githubusercontent.com/wiki/"
    "ForestOfLight/Canopy/exampleAssets/dupeTnt.png"
)
BUY_ME_A_COFFEE = "https://buymeacoffee.com/forestoflight"


BLUEPRINTS: dict[str, dict[str, Any]] = {
    "canopy": {
        "kind": "Technical Bedrock add-on",
        "tagline": "The technical player’s field manual.",
        "order": [
            "info",
            "commands",
            "global-rules",
            "infodisplay-rules",
            "installation",
            "downloads",
            "code",
        ],
        "labels": {
            "info": "Info",
            "commands": "Commands",
            "global-rules": "Global Rules",
            "infodisplay-rules": "InfoDisplay Rules",
            "installation": "Installation & Updates",
            "downloads": "Downloads",
            "code": "Code",
        },
        "sources": {
            "commands": [
                "wiki:Commands.md",
            ],
            "global-rules": [
                "wiki:Global-Rules.md",
            ],
            "infodisplay-rules": [
                "wiki:InfoDisplay-Rules.md",
            ],
            "installation": [
                "wiki:Installation-&-Updates.md",
            ],
        },
    },
    "understudy": {
        "kind": "Canopy extension",
        "tagline": "Precise simulated-player control for technical worlds.",
        "order": [
            "info",
            "usage",
            "commands",
            "installation",
            "downloads",
            "code",
        ],
        "labels": {
            "info": "Info",
            "usage": "Usage",
            "commands": "Commands",
            "installation": "Installation",
            "downloads": "Downloads",
            "code": "Code",
        },
        "keywords": {
            "usage": ["usage", "getting started", "quick start"],
            "commands": ["command", "player"],
            "installation": ["install", "setup", "requirement"],
        },
    },
    "statistic-display": {
        "kind": "Minecraft Bedrock add-on",
        "tagline": "A focused statistics display for multiplayer worlds.",
        "order": [
            "info",
            "features",
            "configuration",
            "installation",
            "downloads",
            "code",
        ],
        "labels": {
            "info": "Info",
            "features": "Features",
            "configuration": "Configuration",
            "installation": "Installation",
            "downloads": "Downloads",
            "code": "Code",
        },
        "keywords": {
            "features": ["feature", "statistic", "scoreboard"],
            "configuration": ["config", "setting", "usage"],
            "installation": ["install", "setup"],
        },
    },
    "construct": {
        "kind": "Minecraft Bedrock building add-on",
        "tagline": "Survival building tools with a technical workflow.",
        "order": [
            "info",
            "commands",
            "api",
            "installation",
            "downloads",
            "code",
        ],
        "labels": {
            "info": "Info",
            "commands": "Commands & CLI",
            "api": "API",
            "installation": "Installation",
            "downloads": "Downloads",
            "code": "Code",
        },
        "keywords": {
            "commands": ["command", "cli"],
            "api": ["api", "endpoint", "model"],
            "installation": ["install", "setup"],
        },
    },
    "nudge": {
        "kind": "Creative building add-on",
        "tagline": "Intuitive precision tools for Bedrock builders.",
        "order": [
            "info",
            "tools",
            "commands",
            "installation",
            "downloads",
            "code",
        ],
        "labels": {
            "info": "Info",
            "tools": "Creative Tools",
            "commands": "Commands",
            "installation": "Installation",
            "downloads": "Downloads",
            "code": "Code",
        },
        "keywords": {
            "tools": ["tool", "feature", "build"],
            "commands": ["command", "usage"],
            "installation": ["install", "setup"],
        },
    },
    "boreal": {
        "kind": "Endstone plugin",
        "tagline": "Technical Bedrock tooling for Endstone servers.",
        "order": [
            "info",
            "features",
            "commands",
            "configuration",
            "installation",
            "downloads",
            "code",
        ],
        "labels": {
            "info": "Info",
            "features": "Features",
            "commands": "Commands",
            "configuration": "Configuration",
            "installation": "Installation",
            "downloads": "Downloads",
            "code": "Code",
        },
        "keywords": {
            "features": ["feature", "technical"],
            "commands": ["command", "usage"],
            "configuration": ["config", "setting"],
            "installation": ["install", "build", "setup"],
        },
    },
    "addonapikit": {
        "kind": "Bedrock add-on API toolkit",
        "tagline": "Expose and consume APIs between Bedrock add-ons.",
        "order": [
            "info",
            "guides",
            "api",
            "publishing",
            "downloads",
            "code",
        ],
        "labels": {
            "info": "Info",
            "guides": "Guides",
            "api": "API Models",
            "publishing": "Publishing & Calling APIs",
            "downloads": "Downloads",
            "code": "Code",
        },
        "keywords": {
            "guides": ["guide", "getting started", "usage"],
            "api": ["api", "model"],
            "publishing": ["publish", "calling", "expose"],
        },
    },
    "amelixsmpviewer": {
        "kind": "World-map web viewer",
        "tagline": "A browser view of Amelix worlds and map layers.",
        "order": [
            "info",
            "usage",
            "deployment",
            "code",
        ],
        "labels": {
            "info": "Info",
            "usage": "Usage",
            "deployment": "Deployment",
            "code": "Code",
        },
        "keywords": {
            "usage": ["usage", "viewer", "world"],
            "deployment": ["deploy", "build", "hosting", "setup"],
        },
    },
    "bedrock-src-itemstack-database": {
        "kind": "Bedrock Script API library",
        "tagline": "Persist ItemStacks together with their data.",
        "order": [
            "info",
            "usage",
            "api",
            "code",
        ],
        "labels": {
            "info": "Info",
            "usage": "Usage",
            "api": "API",
            "code": "Code",
        },
        "keywords": {
            "usage": ["usage", "example", "getting started"],
            "api": ["api", "class", "method", "database"],
        },
    },
    "canopy-extension-example": {
        "kind": "Canopy extension template",
        "tagline": "A minimal reference implementation for extension authors.",
        "order": [
            "info",
            "structure",
            "usage",
            "code",
        ],
        "labels": {
            "info": "Info",
            "structure": "Extension Structure",
            "usage": "Usage",
            "code": "Code",
        },
        "keywords": {
            "structure": ["structure", "extension", "manifest"],
            "usage": ["usage", "example", "getting started"],
        },
    },
    "minecraft-vitest-mocks": {
        "kind": "Testing utility",
        "tagline": "Mock the Minecraft Bedrock Script API in Vitest.",
        "order": [
            "info",
            "usage",
            "api",
            "examples",
            "code",
        ],
        "labels": {
            "info": "Info",
            "usage": "Usage",
            "api": "Mocked APIs",
            "examples": "Examples",
            "code": "Code",
        },
        "keywords": {
            "usage": ["usage", "install", "getting started"],
            "api": ["api", "mock", "module"],
            "examples": ["example", "test"],
        },
    },
    "add-on-registry": {
        "kind": "Bedrock add-on registry",
        "tagline": "Shared metadata for identifying Bedrock packs.",
        "order": [
            "info",
            "schema",
            "contributing",
            "downloads",
            "code",
        ],
        "labels": {
            "info": "Info",
            "schema": "Registry Schema",
            "contributing": "Contributing",
            "downloads": "Downloads",
            "code": "Code",
        },
        "keywords": {
            "schema": ["schema", "metadata", "registry", "format"],
            "contributing": ["contribut", "submit", "pull request"],
        },
    },
    "toontown-rewritten-bot": {
        "kind": "Automation project",
        "tagline": "An archived automation codebase preserved for reference.",
        "order": [
            "info",
            "setup",
            "usage",
            "downloads",
            "code",
        ],
        "labels": {
            "info": "Info",
            "setup": "Setup",
            "usage": "Usage",
            "downloads": "Downloads",
            "code": "Code",
        },
        "keywords": {
            "setup": ["setup", "install", "requirement"],
            "usage": ["usage", "command", "run"],
        },
    },
    "coralfans": {
        "kind": "Minecraft mod project",
        "tagline": "A preserved CoralFans project archive.",
        "order": [
            "info",
            "documentation",
            "downloads",
            "code",
        ],
        "labels": {
            "info": "Info",
            "documentation": "Documentation",
            "downloads": "Downloads",
            "code": "Code",
        },
        "keywords": {
            "documentation": ["usage", "feature", "install", "documentation"],
        },
    },
    "skyoobguide": {
        "kind": "Technical game guide",
        "tagline": "A structured archive of Sky movement and glitch research.",
        "order": [
            "info",
            "movement",
            "clipping",
            "cosmetics",
            "advanced",
            "patched",
            "code",
        ],
        "labels": {
            "info": "Info",
            "movement": "Movement",
            "clipping": "Clipping",
            "cosmetics": "Cosmetics",
            "advanced": "Advanced",
            "patched": "Patched Techniques",
            "code": "Code",
        },
        "keywords": {
            "movement": ["movement", "single player", "multi-player"],
            "clipping": ["clipping"],
            "cosmetics": ["cosmetic"],
            "advanced": ["advanced", "miscellaneous", "terms"],
            "patched": ["patched"],
        },
    },
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def slugify(value: str) -> str:
    output = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return output or "section"


def heading_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


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


def request_json(url: str, token: str) -> dict[str, Any]:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "ForestOfLight-Technical-Hub/1.0",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def download_file(url: str, path: Path, token: str = "") -> None:
    headers = {
        "User-Agent": "ForestOfLight-Technical-Hub/1.0",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = urllib.request.Request(url, headers=headers)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".part")

    with urllib.request.urlopen(request, timeout=90) as response:
        with temporary.open("wb") as stream:
            shutil.copyfileobj(response, stream)

    if temporary.stat().st_size <= 0:
        temporary.unlink(missing_ok=True)
        raise RuntimeError(f"Downloaded file is empty: {url}")

    temporary.replace(path)


def _stage35_git_environment() -> dict[str, str]:
    environment = os.environ.copy()
    environment["GIT_TERMINAL_PROMPT"] = "0"
    environment["GCM_INTERACTIVE"] = "Never"
    environment["GIT_ASKPASS"] = ""
    return environment


def _stage35_run_git(
    arguments: list[str],
    *,
    timeout: int,
) -> subprocess.CompletedProcess[str]:
    command = [
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
        *arguments,
    ]

    print(
        "  git: " + " ".join(command[1:]),
        flush=True,
    )

    return subprocess.run(
        command,
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
        env=_stage35_git_environment(),
    )


def _stage35_markdown_files(root: Path) -> list[Path]:
    if not root.is_dir():
        return []

    output: set[Path] = set()
    for suffix in ("*.md", "*.mdx", "*.markdown"):
        output.update(
            path
            for path in root.rglob(suffix)
            if ".git" not in path.parts
        )
    return sorted(output)


def _stage35_valid_checkout(
    destination: Path,
    *,
    wiki: bool,
) -> bool:
    if not destination.is_dir():
        return False

    documents = _stage35_markdown_files(destination)
    if wiki:
        return bool(documents)

    licenses = {
        "license",
        "license.md",
        "license.txt",
        "copying",
        "copying.md",
        "copying.txt",
        "notice",
        "notice.md",
        "notice.txt",
    }
    return bool(
        documents
        or any(
            path.is_file() and path.name.lower() in licenses
            for path in destination.iterdir()
        )
    )


def _stage35_age_hours(path: Path) -> float:
    if not path.exists():
        return float("inf")

    newest = max(
        (
            candidate.stat().st_mtime
            for candidate in path.rglob("*")
            if candidate.is_file()
        ),
        default=path.stat().st_mtime,
    )
    return max(0.0, (time.time() - newest) / 3600.0)


def _stage35_cache_hours() -> float:
    raw = os.environ.get(
        "FORESTOFLIGHT_SOURCE_CACHE_MAX_AGE_HOURS",
        "72",
    ).strip()
    try:
        return max(0.0, float(raw))
    except ValueError:
        return 72.0


def _stage35_parse_repository_url(url: str) -> str:
    match = re.search(
        r"github\.com[/:](?P<name>[^?#]+?)(?:\.git)?$",
        url,
        re.IGNORECASE,
    )
    if not match:
        raise RuntimeError(
            f"Unsupported GitHub repository URL: {url}"
        )
    return match.group("name").strip("/")


def _stage35_request_json(url: str, token: str) -> Any:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "ForestOfLight-Technical-Hub/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    last_error: Exception | None = None
    for attempt in range(3):
        request = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                return json.load(response)
        except (
            urllib.error.HTTPError,
            urllib.error.URLError,
            TimeoutError,
        ) as error:
            last_error = error
            status = getattr(error, "code", None)
            if status in {401, 403, 404, 422}:
                raise
            time.sleep(1.5 * (attempt + 1))

    assert last_error is not None
    raise last_error


def _stage35_download_small_file(
    url: str,
    destination: Path,
    token: str,
) -> None:
    headers = {
        "Accept": "application/octet-stream",
        "User-Agent": "ForestOfLight-Technical-Hub/1.0",
    }
    if token and (
        "api.github.com" in url
        or "github.com" in url
        or "githubusercontent.com" in url
    ):
        headers["Authorization"] = f"Bearer {token}"

    request = urllib.request.Request(url, headers=headers)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".part")
    temporary.unlink(missing_ok=True)

    with urllib.request.urlopen(request, timeout=90) as response:
        with temporary.open("wb") as stream:
            shutil.copyfileobj(response, stream, length=1024 * 1024)

    if not temporary.is_file() or temporary.stat().st_size <= 0:
        temporary.unlink(missing_ok=True)
        raise RuntimeError(f"Downloaded file is empty: {url}")

    temporary.replace(destination)


def _stage35_relative_asset_paths(repository: Path) -> set[str]:
    from urllib.parse import unquote, urlsplit

    markdown_image = re.compile(
        r"!\[[^\]]*\]\(\s*([^) \t]+)",
        re.IGNORECASE,
    )
    html_image = re.compile(
        r"<(?:img|source)\b[^>]*\b(?:src|srcset)\s*=\s*[\"']([^\"']+)",
        re.IGNORECASE,
    )
    extensions = {
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".svg",
        ".avif",
    }
    output: set[str] = set()
    root_resolved = repository.resolve()

    for document in _stage35_markdown_files(repository):
        source = document.read_text(encoding="utf-8", errors="replace")
        candidates = [
            *markdown_image.findall(source),
            *html_image.findall(source),
        ]

        for raw in candidates:
            value = raw.split(",", 1)[0].strip()
            if " " in value and not value.startswith("<"):
                value = value.split()[0]
            parsed = urlsplit(value)
            if (
                parsed.scheme
                or parsed.netloc
                or value.startswith(("data:", "#"))
            ):
                continue

            path_text = unquote(parsed.path).replace("\\", "/")
            if not path_text:
                continue

            if path_text.startswith("/"):
                relative = Path(path_text.lstrip("/"))
            else:
                candidate = (document.parent / path_text).resolve()
                try:
                    relative = candidate.relative_to(root_resolved)
                except ValueError:
                    continue

            if relative.suffix.lower() not in extensions:
                continue

            normalized = relative.as_posix()
            if normalized == ".." or normalized.startswith("../"):
                continue
            output.add(normalized)

    return output


def _stage35_api_document_snapshot(
    url: str,
    destination: Path,
    branch: str,
) -> None:
    from urllib.parse import quote

    full_name = _stage35_parse_repository_url(url)
    token = github_token()
    temporary = destination.with_name(
        destination.name + ".stage35-api-part"
    )
    shutil.rmtree(temporary, ignore_errors=True)
    temporary.mkdir(parents=True, exist_ok=True)

    queue: list[tuple[str, int]] = [("", 0)]
    visited: set[str] = set()
    selected: list[dict[str, Any]] = []
    directory_tokens = {
        ".github",
        "doc",
        "docs",
        "documentation",
        "guide",
        "guides",
        "manual",
        "wiki",
    }
    license_names = {
        "license",
        "license.md",
        "license.txt",
        "copying",
        "copying.md",
        "copying.txt",
        "notice",
        "notice.md",
        "notice.txt",
    }

    while queue and len(visited) < 200:
        path, depth = queue.pop(0)
        if path in visited:
            continue
        visited.add(path)

        suffix = (
            "/" + quote(path, safe="/")
            if path
            else ""
        )
        endpoint = (
            "https://api.github.com/repos/"
            + full_name
            + "/contents"
            + suffix
            + "?ref="
            + quote(branch, safe="")
        )
        payload = _stage35_request_json(endpoint, token)
        if isinstance(payload, dict):
            payload = [payload]

        for item in payload:
            if not isinstance(item, dict):
                continue
            item_type = str(item.get("type") or "")
            item_path = str(item.get("path") or "")
            item_name = Path(item_path).name.lower()

            if item_type == "file":
                suffix_name = Path(item_name).suffix.lower()
                if (
                    suffix_name in {".md", ".mdx", ".markdown"}
                    or item_name in license_names
                ):
                    selected.append(item)
                continue

            if item_type == "dir" and depth < 4:
                parts = {
                    part.lower()
                    for part in Path(item_path).parts
                }
                if (
                    (depth == 0 and item_name in directory_tokens)
                    or bool(parts & directory_tokens)
                ):
                    queue.append((item_path, depth + 1))

    by_path = {
        str(item.get("path") or ""): item
        for item in selected
        if item.get("path")
    }

    for item_path, item in by_path.items():
        download_url = str(item.get("download_url") or "")
        if download_url:
            _stage35_download_small_file(
                download_url,
                temporary / item_path,
                token,
            )

    if not _stage35_markdown_files(temporary):
        shutil.rmtree(temporary, ignore_errors=True)
        raise RuntimeError(
            f"No Markdown documentation was available through the GitHub API for {full_name}."
        )

    for asset_path in sorted(_stage35_relative_asset_paths(temporary)):
        if (temporary / asset_path).is_file():
            continue
        endpoint = (
            "https://api.github.com/repos/"
            + full_name
            + "/contents/"
            + quote(asset_path, safe="/")
            + "?ref="
            + quote(branch, safe="")
        )
        try:
            item = _stage35_request_json(endpoint, token)
            if not isinstance(item, dict):
                continue
            size = int(item.get("size") or 0)
            download_url = str(item.get("download_url") or "")
            if download_url and 0 < size <= 20_000_000:
                _stage35_download_small_file(
                    download_url,
                    temporary / asset_path,
                    token,
                )
        except Exception as error:
            print(
                f"  source asset skipped {asset_path}: {error}",
                flush=True,
            )

    marker = {
        "schemaVersion": 1,
        "method": "github-contents-document-snapshot",
        "repository": full_name,
        "branch": branch,
        "generatedAt": time.strftime(
            "%Y-%m-%dT%H:%M:%SZ",
            time.gmtime(),
        ),
    }
    (temporary / ".stage35-source-snapshot.json").write_text(
        json.dumps(marker, indent=2) + "\n",
        encoding="utf-8",
    )

    shutil.rmtree(destination, ignore_errors=True)
    temporary.replace(destination)


def _stage35_sparse_patterns() -> list[str]:
    return [
        "/*.md",
        "/**/*.md",
        "/*.mdx",
        "/**/*.mdx",
        "/*.markdown",
        "/**/*.markdown",
        "/LICENSE",
        "/LICENSE.*",
        "/COPYING",
        "/COPYING.*",
        "/NOTICE",
        "/NOTICE.*",
    ]


def _stage35_sparse_clone(
    url: str,
    destination: Path,
    branch: str,
) -> None:
    temporary = destination.with_name(
        destination.name + ".stage35-part"
    )
    shutil.rmtree(temporary, ignore_errors=True)

    result = _stage35_run_git(
        [
            "clone",
            "--depth",
            "1",
            "--filter=blob:none",
            "--no-checkout",
            "--no-tags",
            "--single-branch",
            "--branch",
            branch,
            url,
            str(temporary),
        ],
        timeout=360,
    )
    if result.returncode != 0:
        shutil.rmtree(temporary, ignore_errors=True)
        raise RuntimeError(
            result.stderr.strip()
            or result.stdout.strip()
            or f"Sparse clone failed: {url}"
        )

    result = _stage35_run_git(
        [
            "-C",
            str(temporary),
            "sparse-checkout",
            "init",
            "--no-cone",
        ],
        timeout=60,
    )
    if result.returncode != 0:
        shutil.rmtree(temporary, ignore_errors=True)
        raise RuntimeError(
            result.stderr.strip()
            or result.stdout.strip()
            or "Sparse checkout initialization failed."
        )

    sparse_path = temporary / ".git" / "info" / "sparse-checkout"
    sparse_path.parent.mkdir(parents=True, exist_ok=True)
    sparse_path.write_text(
        "\n".join(_stage35_sparse_patterns()) + "\n",
        encoding="utf-8",
    )

    result = _stage35_run_git(
        [
            "-C",
            str(temporary),
            "checkout",
            "--force",
            branch,
        ],
        timeout=300,
    )
    if result.returncode != 0:
        shutil.rmtree(temporary, ignore_errors=True)
        raise RuntimeError(
            result.stderr.strip()
            or result.stdout.strip()
            or "Sparse checkout failed."
        )

    assets = sorted(_stage35_relative_asset_paths(temporary))
    if assets:
        sparse_path.write_text(
            "\n".join(
                [
                    *_stage35_sparse_patterns(),
                    *("/" + asset for asset in assets),
                ]
            )
            + "\n",
            encoding="utf-8",
        )
        result = _stage35_run_git(
            [
                "-C",
                str(temporary),
                "read-tree",
                "-mu",
                "HEAD",
            ],
            timeout=300,
        )
        if result.returncode != 0:
            shutil.rmtree(temporary, ignore_errors=True)
            raise RuntimeError(
                result.stderr.strip()
                or result.stdout.strip()
                or "Sparse asset checkout failed."
            )

    if not _stage35_valid_checkout(temporary, wiki=False):
        shutil.rmtree(temporary, ignore_errors=True)
        raise RuntimeError(
            f"Sparse checkout did not produce documentation: {url}"
        )

    shutil.rmtree(destination, ignore_errors=True)
    temporary.replace(destination)


def _stage35_wiki_clone(
    url: str,
    destination: Path,
) -> None:
    temporary = destination.with_name(
        destination.name + ".stage35-part"
    )
    shutil.rmtree(temporary, ignore_errors=True)

    result = _stage35_run_git(
        [
            "clone",
            "--depth",
            "1",
            "--filter=blob:none",
            "--no-tags",
            url,
            str(temporary),
        ],
        timeout=180,
    )
    if result.returncode != 0:
        shutil.rmtree(temporary, ignore_errors=True)
        raise RuntimeError(
            result.stderr.strip()
            or result.stdout.strip()
            or f"Wiki clone failed: {url}"
        )
    if not _stage35_valid_checkout(temporary, wiki=True):
        shutil.rmtree(temporary, ignore_errors=True)
        raise RuntimeError(
            f"Wiki clone contained no Markdown: {url}"
        )

    shutil.rmtree(destination, ignore_errors=True)
    temporary.replace(destination)


def clone_or_update(
    url: str,
    destination: Path,
    branch: str = "",
) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    is_wiki = url.lower().endswith(".wiki.git")
    branch = branch or "main"
    valid = _stage35_valid_checkout(destination, wiki=is_wiki)
    age = _stage35_age_hours(destination)

    if valid and age <= _stage35_cache_hours():
        print(
            f"  source cache: reuse {destination.parent.name}/{destination.name} ({age:.1f}h old)",
            flush=True,
        )
        return

    if is_wiki:
        try:
            _stage35_wiki_clone(url, destination)
            return
        except Exception:
            if valid:
                print(
                    f"  source cache: wiki refresh failed, retaining {destination}",
                    flush=True,
                )
                return
            raise

    full_name = _stage35_parse_repository_url(url)
    token = github_token()
    use_api_snapshot = False
    try:
        metadata = _stage35_request_json(
            f"https://api.github.com/repos/{full_name}",
            token,
        )
        use_api_snapshot = int(metadata.get("size") or 0) >= 250_000
    except Exception as error:
        print(
            f"  source sync: repository metadata unavailable, continuing with sparse clone: {error}",
            flush=True,
        )

    if use_api_snapshot:
        print(
            f"  source sync: large repository, using documentation-only API snapshot for {full_name}",
            flush=True,
        )
        try:
            _stage35_api_document_snapshot(
                url,
                destination,
                branch,
            )
            return
        except Exception as error:
            print(
                f"  source sync: API snapshot failed, falling back to sparse clone: {error}",
                flush=True,
            )

    try:
        _stage35_sparse_clone(url, destination, branch)
        return
    except Exception as clone_error:
        print(
            f"  source sync: sparse clone failed, using GitHub documentation snapshot: {clone_error}",
            flush=True,
        )

    try:
        _stage35_api_document_snapshot(
            url,
            destination,
            branch,
        )
        return
    except Exception:
        if valid:
            print(
                f"  source cache: refresh failed, retaining {destination}",
                flush=True,
            )
            return
        raise

def collect_markdown(repository: Path, wiki: Path) -> dict[str, Path]:
    documents: dict[str, Path] = {}

    roots = [
        ("repo", repository),
        ("wiki", wiki),
    ]

    for prefix, root in roots:
        if not root.is_dir():
            continue

        for path in sorted(root.rglob("*.md")):
            if any(
                part in {
                    ".git",
                    "node_modules",
                    "vendor",
                    "dist",
                    "coverage",
                }
                for part in path.parts
            ):
                continue
            relative = path.relative_to(root).as_posix()
            documents[f"{prefix}:{relative}"] = path

    return documents


def strip_frontmatter(lines: list[str]) -> list[str]:
    if not lines or lines[0].strip() != "---":
        return lines

    for index in range(1, min(len(lines), 200)):
        if lines[index].strip() == "---":
            return lines[index + 1 :]

    return lines


def normalize_markdown(source: str) -> str:
    source = source.replace("\r\n", "\n").replace("\r", "\n")
    source = re.sub(r"<!--[\s\S]*?-->", "", source)
    return source.strip()


def markdown_title(source: str, fallback: str) -> str:
    for line in normalize_markdown(source).splitlines():
        match = re.match(r"^\s*#\s+(.+?)\s*$", line)
        if match:
            return clean(re.sub(r"[`*_]", "", match.group(1)))
    return fallback


def inline_text(value: str) -> str:
    value = re.sub(r"!\[([^\]]*)\]\([^)]+\)", r"\1", value)
    value = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", value)
    value = re.sub(r"<https?://[^>]+>", "", value)
    value = re.sub(r"[`*_~]", "", value)
    return clean(html.unescape(value))


def parse_markdown_blocks(source: str, *, max_blocks: int = 220) -> list[dict[str, Any]]:
    lines = strip_frontmatter(normalize_markdown(source).splitlines())
    blocks: list[dict[str, Any]] = []
    paragraph: list[str] = []
    list_items: list[str] = []
    ordered = False
    code_lines: list[str] = []
    code_language = ""
    in_code = False

    def flush_paragraph() -> None:
        nonlocal paragraph
        if paragraph:
            text = clean(" ".join(paragraph))
            if text:
                blocks.append({"type": "paragraph", "text": text})
            paragraph = []

    def flush_list() -> None:
        nonlocal list_items, ordered
        if list_items:
            blocks.append(
                {
                    "type": "list",
                    "ordered": ordered,
                    "items": list_items,
                }
            )
            list_items = []
            ordered = False

    for line in lines:
        if len(blocks) >= max_blocks:
            break

        fence = re.match(r"^\s*```(.*)$", line)
        if fence:
            flush_paragraph()
            flush_list()
            if in_code:
                blocks.append(
                    {
                        "type": "code",
                        "language": code_language,
                        "text": "\n".join(code_lines).rstrip(),
                    }
                )
                code_lines = []
                code_language = ""
                in_code = False
            else:
                in_code = True
                code_language = clean(fence.group(1))
            continue

        if in_code:
            code_lines.append(line)
            continue

        if re.search(
            r"(?:img\.shields\.io|way2muchnoise\.eu|badgen\.net|buymeacoffee-badges|/actions/workflows/.+/badge\.svg)",
            line,
            flags=re.IGNORECASE,
        ):
            flush_paragraph()
            flush_list()
            continue

        html_image = re.search(
            r"<img\b[^>]*\bsrc=[\"']([^\"']+)[\"'][^>]*>",
            line,
            flags=re.IGNORECASE,
        )
        if html_image:
            flush_paragraph()
            flush_list()
            alt_match = re.search(
                r"\balt=[\"']([^\"']*)[\"']",
                line,
                flags=re.IGNORECASE,
            )
            blocks.append(
                {
                    "type": "image",
                    "alt": clean(
                        html.unescape(
                            alt_match.group(1)
                            if alt_match
                            else ""
                        )
                    ),
                    "src": clean(html_image.group(1)),
                }
            )
            continue

        if re.match(
            r"^\s*</?(?:a|div|center)(?:\s+[^>]*)?>\s*$",
            line,
            flags=re.IGNORECASE,
        ):
            flush_paragraph()
            flush_list()
            continue

        if "<" in line and ">" in line:
            line = clean(
                html.unescape(
                    re.sub(
                        r"<[^>]+>",
                        " ",
                        line,
                    )
                )
            )
            if not line:
                flush_paragraph()
                flush_list()
                continue

        heading = re.match(r"^(#{1,6})\s+(.+?)\s*$", line)
        if heading:
            flush_paragraph()
            flush_list()
            title = inline_text(heading.group(2))
            if title and heading_key(title) not in {
                "table of contents",
                "contents",
            }:
                blocks.append(
                    {
                        "type": "heading",
                        "level": len(heading.group(1)),
                        "text": title,
                        "id": slugify(title),
                    }
                )
            continue

        image = re.match(r"^\s*!\[([^\]]*)\]\(([^)]+)\)\s*$", line)
        if image:
            flush_paragraph()
            flush_list()
            blocks.append(
                {
                    "type": "image",
                    "alt": clean(image.group(1)),
                    "src": clean(image.group(2)),
                }
            )
            continue

        quote = re.match(r"^\s*>\s?(.*)$", line)
        if quote:
            flush_paragraph()
            flush_list()
            text = clean(quote.group(1))
            if text:
                blocks.append({"type": "quote", "text": text})
            continue

        item = re.match(r"^\s*[-*+]\s+(.+)$", line)
        numbered = re.match(r"^\s*\d+[.)]\s+(.+)$", line)
        if item or numbered:
            flush_paragraph()
            next_ordered = bool(numbered)
            if list_items and next_ordered != ordered:
                flush_list()
            ordered = next_ordered
            list_items.append(clean((numbered or item).group(1)))
            continue

        if re.match(r"^\s*(?:---+|\*\*\*+)\s*$", line):
            flush_paragraph()
            flush_list()
            blocks.append({"type": "rule"})
            continue

        if not line.strip():
            flush_paragraph()
            flush_list()
            continue

        if list_items:
            flush_list()

        paragraph.append(line.strip())

    flush_paragraph()
    flush_list()

    if in_code and code_lines:
        blocks.append(
            {
                "type": "code",
                "language": code_language,
                "text": "\n".join(code_lines).rstrip(),
            }
        )

    return blocks[:max_blocks]


def markdown_sections(source: str) -> list[dict[str, Any]]:
    lines = normalize_markdown(source).splitlines()
    sections: list[dict[str, Any]] = []
    current_title = ""
    current_level = 0
    body: list[str] = []
    preamble: list[str] = []

    def flush() -> None:
        nonlocal body
        if current_title:
            sections.append(
                {
                    "title": current_title,
                    "level": current_level,
                    "source": "\n".join(body).strip(),
                }
            )
        body = []

    for line in lines:
        match = re.match(r"^(#{1,6})\s+(.+?)\s*$", line)
        if match:
            if not current_title:
                preamble_source = "\n".join(preamble).strip()
                if preamble_source:
                    sections.append(
                        {
                            "title": "Overview",
                            "level": 1,
                            "source": preamble_source,
                        }
                    )
            flush()
            current_title = inline_text(match.group(2))
            current_level = len(match.group(1))
            continue

        if current_title:
            body.append(line)
        else:
            preamble.append(line)

    flush()

    return [
        section
        for section in sections
        if section["source"].strip()
        and heading_key(section["title"]) not in {
            "table of contents",
            "contents",
        }
    ]


def section_score(section: dict[str, Any], keywords: Iterable[str]) -> int:
    haystack = heading_key(
        f"{section.get('title', '')} {section.get('source', '')[:1600]}"
    )
    score = 0
    for keyword in keywords:
        key = heading_key(keyword)
        if key in haystack:
            score += 6 if key in heading_key(section.get("title", "")) else 2
    return score


def select_sections(
    documents: dict[str, Path],
    keywords: list[str],
    *,
    max_documents: int = 5,
) -> list[dict[str, Any]]:
    candidates: list[tuple[int, int, str, dict[str, Any]]] = []

    for document_index, (document_key, path) in enumerate(documents.items()):
        source = path.read_text(encoding="utf-8", errors="replace")
        for section_index, section in enumerate(markdown_sections(source)):
            score = section_score(section, keywords)
            if score <= 0:
                continue
            candidates.append(
                (
                    score,
                    -(document_index * 10_000 + section_index),
                    document_key,
                    section,
                )
            )

    candidates.sort(reverse=True)

    output: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    used_documents: set[str] = set()

    for score, _, document_key, section in candidates:
        identity = (
            document_key,
            heading_key(section["title"]),
        )
        if identity in seen:
            continue
        if len(used_documents) >= max_documents and document_key not in used_documents:
            continue
        seen.add(identity)
        used_documents.add(document_key)
        output.append(
            {
                "source": document_key,
                "title": section["title"],
                "score": score,
                "blocks": parse_markdown_blocks(section["source"]),
            }
        )
        if len(output) >= 12:
            break

    return output


def find_document(documents: dict[str, Path], key: str) -> Path | None:
    if key in documents:
        return documents[key]

    wanted = key.lower()
    for document_key, path in documents.items():
        if document_key.lower() == wanted:
            return path
    return None


def readme_path(documents: dict[str, Path]) -> Path | None:
    priority = [
        "repo:README.md",
        "repo:readme.md",
        "repo:.github/README.md",
        "repo:docs/README.md",
    ]
    for key in priority:
        path = find_document(documents, key)
        if path:
            return path

    for key, path in documents.items():
        if Path(key.split(":", 1)[1]).name.lower() == "readme.md":
            return path
    return None


def overview_blocks(source: str) -> list[dict[str, Any]]:
    sections = markdown_sections(source)
    selected: list[dict[str, Any]] = []

    preferred = {
        "overview",
        "key features",
        "features",
        "looking for simulated players",
        "getting started",
        "join the community",
        "contributing",
        "an amelix foundation project",
        "support",
        "installation",
        "usage",
    }

    for section in sections:
        title_key = heading_key(section["title"])
        if (
            len(selected) < 2
            or title_key in preferred
            or any(
                token in title_key
                for token in (
                    "feature",
                    "getting started",
                    "community",
                    "contribut",
                    "foundation",
                    "support",
                )
            )
        ):
            selected.extend(parse_markdown_blocks(
                f"## {section['title']}\n\n{section['source']}",
                max_blocks=40,
            ))

        if len(selected) >= 80:
            break

    return selected[:80]


def parse_entry_document(
    source: str,
    *,
    metadata_labels: tuple[str, ...] = (
        "type",
        "default value",
        "suggested options",
    ),
) -> list[dict[str, Any]]:
    lines = normalize_markdown(source).splitlines()
    nodes: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None

    for line in lines:
        match = re.match(r"^(#{1,6})\s+(.+?)\s*$", line)
        if match:
            if current is not None:
                nodes.append(current)

            current = {
                "level": len(match.group(1)),
                "title": inline_text(match.group(2)),
                "body": [],
            }
            continue

        if current is not None:
            current["body"].append(line)

    if current is not None:
        nodes.append(current)

    entries: list[dict[str, Any]] = []
    ancestors: list[tuple[int, str, bool]] = []

    generic = {
        "commands",
        "global rules",
        "infodisplay rules",
        "table of contents",
        "overview",
    }

    for node in nodes:
        level = int(node["level"])
        title = clean(node["title"])
        raw = "\n".join(node["body"]).strip()

        while ancestors and ancestors[-1][0] >= level:
            ancestors.pop()

        usage = []
        metadata: dict[str, str] = {}
        description_lines = []

        for line in raw.splitlines():
            plain = inline_text(line)

            usage_match = re.match(
                r"^\s*(?:[-*]\s*)?Usage\s*:\s*(.+)$",
                plain,
                flags=re.IGNORECASE,
            )
            if usage_match:
                usage.append(clean(usage_match.group(1)))
                continue

            meta_match = re.match(
                r"^\s*(?:[-*]\s*)?([^:]+)\s*:\s*(.+)$",
                plain,
            )
            if meta_match:
                key = heading_key(meta_match.group(1))
                if key in metadata_labels:
                    metadata[key] = clean(meta_match.group(2))
                    continue

            description_lines.append(line)

        blocks = parse_markdown_blocks(
            "\n".join(description_lines),
            max_blocks=30,
        )

        title_key = heading_key(title)
        has_entry_signal = bool(
            usage
            or metadata
        )

        # Rule pages use one H2 per rule. Command pages use H2 sections and
        # H3 command entries; a heading becomes an entry only when its own body
        # contains usage or rule metadata.
        is_entry = (
            title_key not in generic
            and has_entry_signal
        )

        group = ""
        for ancestor_level, ancestor_title, ancestor_is_entry in reversed(ancestors):
            if ancestor_is_entry:
                continue
            ancestor_key = heading_key(ancestor_title)
            if ancestor_key not in generic:
                group = ancestor_title
                break

        if is_entry:
            entries.append(
                {
                    "name": title,
                    "id": slugify(title),
                    "group": group,
                    "usage": usage,
                    "metadata": metadata,
                    "blocks": blocks,
                }
            )

        ancestors.append(
            (
                level,
                title,
                is_entry,
            )
        )

    return entries


def fetch_user_names(
    contributors: list[dict[str, Any]],
    token: str,
    cache: dict[str, Any],
    *,
    allow_network: bool,
) -> list[dict[str, Any]]:
    output = []

    for contributor in contributors:
        login = clean(contributor.get("login"))
        record = cache.get(login, {})

        if login and not record and allow_network:
            try:
                user = request_json(
                    f"https://api.github.com/users/{login}",
                    token,
                )
                record = {
                    "name": clean(user.get("name")),
                    "bio": clean(user.get("bio")),
                    "company": clean(user.get("company")),
                }
            except Exception:
                record = {
                    "name": "",
                    "bio": "",
                    "company": "",
                }
            cache[login] = record

        if login and not record:
            record = {
                "name": "",
                "bio": "",
                "company": "",
            }
            cache[login] = record

        output.append(
            {
                **contributor,
                "displayName": clean(record.get("name")) or login,
                "bio": clean(record.get("bio")),
                "company": clean(record.get("company")),
            }
        )

    return output


def license_statement(repository: Path, project: dict[str, Any]) -> dict[str, str]:
    candidates = [
        repository / "LICENSE",
        repository / "LICENSE.md",
        repository / "LICENSE.txt",
        repository / "COPYING",
    ]

    statement = ""
    for path in candidates:
        if not path.is_file():
            continue
        source = path.read_text(encoding="utf-8", errors="replace")
        match = re.search(
            r"(?im)^\s*(copyright[^\n]{0,200})$",
            source,
        )
        if match:
            statement = clean(match.group(1))
        break

    return {
        "license": clean(project.get("license")),
        "statement": statement,
    }


def localize_dupe_tnt(token: str) -> None:
    if DUPE_TNT_PATH.is_file() and DUPE_TNT_PATH.stat().st_size > 1000:
        return
    download_file(DUPE_TNT_URL, DUPE_TNT_PATH, token=token)


def rewrite_special_images(
    blocks: list[dict[str, Any]],
    *,
    project_slug: str,
    section_id: str,
) -> list[dict[str, Any]]:
    output = []
    for block in blocks:
        if (
            project_slug == "canopy"
            and section_id == "global-rules"
            and block.get("type") == "image"
            and "dupe" in heading_key(block.get("alt", ""))
        ):
            output.append(
                {
                    "type": "image",
                    "src": "/_curated-archive/canopy/dupe-tnt.png",
                    "alt": (
                        "Minecraft Bedrock TNT duplication setup using a piston, "
                        "slime blocks, TNT, and a note block."
                    ),
                    "caption": "Dupe TNT reference setup",
                }
            )
            continue
        output.append(block)
    return output


def localize_relative_images(
    blocks: list[dict[str, Any]],
    *,
    repository: Path,
    wiki: Path,
    source_key: str,
    project_slug: str,
) -> list[dict[str, Any]]:
    output = []
    origin_name, relative = source_key.split(":", 1)
    source_root = repository if origin_name == "repo" else wiki
    source_dir = (source_root / relative).parent
    asset_root = ROOT / "public/_curated-archive" / project_slug / "source-assets"

    for block in blocks:
        if block.get("type") != "image":
            output.append(block)
            continue

        src = clean(block.get("src"))
        if not src:
            continue

        if src.startswith(("http://", "https://", "data:")):
            # Remote source images are deliberately omitted unless explicitly localized.
            continue

        candidate = (source_dir / urllib_parse_path(src)).resolve()
        try:
            candidate.relative_to(source_root.resolve())
        except ValueError:
            continue

        if not candidate.is_file():
            continue

        digest = hashlib.sha256(candidate.read_bytes()).hexdigest()[:12]
        destination = asset_root / f"{digest}-{candidate.name}"
        destination.parent.mkdir(parents=True, exist_ok=True)
        if not destination.exists():
            shutil.copy2(candidate, destination)

        localized = dict(block)
        localized["src"] = "/" + destination.relative_to(ROOT / "public").as_posix()
        output.append(localized)

    return output


def rewrite_relative_links(
    blocks: list[dict[str, Any]],
    *,
    source_key: str,
    project: dict[str, Any],
) -> list[dict[str, Any]]:
    import posixpath

    from urllib.parse import quote, urlsplit

    if ":" not in source_key:
        return blocks

    origin, relative = source_key.split(
        ":",
        1,
    )

    repository_url = clean(
        project.get(
            "repositoryUrl"
        )
    ).rstrip(
        "/"
    )

    default_branch = clean(
        project.get(
            "defaultBranch"
        )
    ) or "main"

    base_directory = posixpath.dirname(
        relative
    )

    link_pattern = re.compile(
        r"\[([^\]]+)\]\(([^)]+)\)"
    )

    def replace_link(
        match: re.Match[str],
    ) -> str:
        label = match.group(
            1
        )
        href = clean(
            match.group(
                2
            )
        )

        if (
            not href
            or href.startswith(
                (
                    "#",
                    "/",
                    "mailto:",
                    "tel:",
                    "http://",
                    "https://",
                )
            )
        ):
            return match.group(
                0
            )

        parsed = urlsplit(
            href
        )
        path = parsed.path

        if not path:
            return match.group(
                0
            )

        normalized = posixpath.normpath(
            posixpath.join(
                base_directory,
                path,
            )
        )

        if (
            normalized == ".."
            or normalized.startswith(
                "../"
            )
        ):
            return label

        if origin == "repo":
            target = (
                f"{repository_url}/blob/"
                f"{quote(default_branch, safe='')}/"
                f"{quote(normalized, safe='/')}"
            )
        elif origin == "wiki":
            page = normalized
            if page.lower().endswith(
                ".md"
            ):
                page = page[
                    :-3
                ]
            page = page.replace(
                " ",
                "-",
            )
            target = (
                f"{repository_url}/wiki/"
                f"{quote(page, safe='/')}"
            )
        else:
            return match.group(
                0
            )

        if parsed.fragment:
            target += (
                "#"
                + quote(
                    parsed.fragment,
                    safe="-_.~",
                )
            )

        return (
            "["
            + label
            + "]("
            + target
            + ")"
        )

    output = []

    for original in blocks:
        block = dict(
            original
        )

        if block.get(
            "type"
        ) in {
            "paragraph",
            "quote",
        }:
            block[
                "text"
            ] = link_pattern.sub(
                replace_link,
                str(
                    block.get(
                        "text"
                    )
                    or ""
                ),
            )
        elif block.get(
            "type"
        ) == "list":
            block[
                "items"
            ] = [
                link_pattern.sub(
                    replace_link,
                    str(
                        item
                    ),
                )
                for item in block.get(
                    "items",
                    [],
                )
            ]

        output.append(
            block
        )

    return output


def urllib_parse_path(value: str) -> str:
    from urllib.parse import unquote, urlsplit

    path = urlsplit(value).path
    return unquote(path)


UNDERSTUDY_PLACEHOLDERS = {
    "playerjoin": "Simulated Player Join",
    "playerleave": "Simulated Player Leave",
    "playerrejoin": "Simulated Player Rejoin",
    "playertp": "Simulated Player Teleport",
    "playerlook": "Simulated Player Look",
    "playermove": "Simulated Player Move",
    "playeraction": "Simulated Player Action",
    "playerselect": "Simulated Player Select",
    "playersprint": "Simulated Player Sprint",
    "playersneak": "Simulated Player Sneak",
    "playerstop": "Simulated Player Stop",
    "playerswapheld": "Simulated Player Swap Held Item",
    "playerinventory": "Simulated Player Inventory",
    "playerprefix": "Simulated Player Prefix",
}


def understudy_command_fragments(source: str) -> dict[str, str]:
    lines = normalize_markdown(source).splitlines()
    commands: list[tuple[str, list[str]]] = []
    current_usage = ""
    current_body: list[str] = []

    def flush() -> None:
        nonlocal current_usage, current_body
        if current_usage:
            commands.append((current_usage, current_body))
        current_usage = ""
        current_body = []

    for line in lines:
        usage_match = re.match(
            r"^\s*\*\*Usage\s*:\s*`([^`]+)`\*\*\s*$",
            line,
            flags=re.IGNORECASE,
        )
        if usage_match:
            flush()
            current_usage = clean(usage_match.group(1))
            continue

        if current_usage:
            if re.match(r"^#{1,6}\s+", line):
                flush()
                continue
            current_body.append(line)

    flush()

    output: dict[str, str] = {}
    for usage, body in commands:
        command_match = re.match(r"/simplayer:([a-z0-9_-]+)", usage)
        if not command_match:
            continue
        key = "player" + command_match.group(1).replace("_", "")
        if key not in UNDERSTUDY_PLACEHOLDERS:
            continue
        title = UNDERSTUDY_PLACEHOLDERS[key]
        body_source = "\n".join(body).strip()
        output[key] = (
            f"### {title}\n\n"
            f"**Usage: `{usage}`**\n"
            + (f"{body_source}\n" if body_source else "")
        ).strip()

    return output


def resolve_canopy_commands(source: str, sources_root: Path) -> str:
    # The upstream wiki currently contains a stale Analyze Area placeholder,
    # while the current Canopy command tree has no analyzearea command file.
    # Remove that unsupported entry instead of inventing documentation.
    source = re.sub(
        r"(?ms)^###\s+Analyze Area\s*\n+\{\{analyzearea\}\}\s*(?=^###|^##|\Z)",
        "",
        source,
    )
    source = re.sub(
        r"(?m)^\s*-\s*\[Analyze Area\]\(#analyze-area\)\s*$",
        "",
        source,
    )

    understudy_readme = (
        sources_root
        / "understudy"
        / "repository"
        / "README.md"
    )
    if not understudy_readme.is_file():
        raise RuntimeError(
            "Understudy README is required to resolve Canopy simulated-player command placeholders."
        )

    fragments = understudy_command_fragments(
        understudy_readme.read_text(encoding="utf-8", errors="replace")
    )

    missing: list[str] = []
    for placeholder, title in UNDERSTUDY_PLACEHOLDERS.items():
        token = "{{" + placeholder + "}}"
        if token not in source:
            continue
        fragment = fragments.get(placeholder)
        if not fragment:
            missing.append(placeholder)
            continue
        source = source.replace(token, fragment, 1)

    unresolved = sorted(set(re.findall(r"\{\{([^{}]+)\}\}", source)))
    if missing or unresolved:
        raise RuntimeError(
            "Canopy command placeholders could not be resolved: "
            + ", ".join(sorted(set(missing + unresolved)))
        )

    return source


def project_downloads(download_manifest: dict[str, Any], slug: str) -> list[dict[str, Any]]:
    for project in download_manifest.get("projects", []):
        if project.get("slug") == slug:
            return project.get("releases", [])
    return []


def build_project(
    *,
    project: dict[str, Any],
    repository: Path,
    wiki: Path,
    documents: dict[str, Path],
    download_manifest: dict[str, Any],
    token: str,
    user_cache: dict[str, Any],
    sources_root: Path,
    allow_profile_network: bool,
) -> dict[str, Any]:
    slug = project["slug"]
    blueprint = BLUEPRINTS.get(slug)
    if not blueprint:
        raise RuntimeError(f"No curated blueprint exists for {slug}.")

    readme = readme_path(documents)
    readme_source = (
        readme.read_text(encoding="utf-8", errors="replace")
        if readme
        else ""
    )

    info_blocks = overview_blocks(readme_source)

    readme_source_key = ""
    if readme:
        if repository in readme.parents:
            readme_source_key = (
                "repo:"
                + readme.relative_to(repository).as_posix()
            )
        elif wiki in readme.parents:
            readme_source_key = (
                "wiki:"
                + readme.relative_to(wiki).as_posix()
            )

    if slug == "canopy":
        info_blocks = [
            block
            for block in info_blocks
            if not (
                block.get("type") == "image"
                and (
                    "banner" in clean(block.get("src")).lower()
                    or heading_key(block.get("alt")) == "canopy logo"
                )
            )
        ]

    if readme_source_key:
        info_blocks = localize_relative_images(
            info_blocks,
            repository=repository,
            wiki=wiki,
            source_key=readme_source_key,
            project_slug=slug,
        )
        info_blocks = rewrite_relative_links(
            info_blocks,
            source_key=readme_source_key,
            project=project,
        )

    if not info_blocks and project.get("description"):
        info_blocks = [
            {
                "type": "paragraph",
                "text": project["description"],
            }
        ]

    sections: list[dict[str, Any]] = []

    for section_id in blueprint["order"]:
        label = blueprint["labels"][section_id]

        if section_id == "info":
            sections.append(
                {
                    "id": "info",
                    "label": label,
                    "eyebrow": blueprint["kind"],
                    "title": f"About {project['name']}",
                    "description": project.get("description") or blueprint["tagline"],
                    "kind": "prose",
                    "documents": [
                        {
                            "source": (
                                readme_source_key
                                or "repository metadata"
                            ),
                            "title": "Project overview",
                            "blocks": info_blocks,
                        }
                    ],
                }
            )
            continue

        if section_id == "downloads":
            releases = project_downloads(download_manifest, slug)
            if releases:
                sections.append(
                    {
                        "id": "downloads",
                        "label": label,
                        "eyebrow": "Mirrored release archive",
                        "title": "Every captured version, served by the Hub",
                        "description": (
                            "Release assets and tagged source archives are synchronized "
                            "during the build and served from this site without visitor-time "
                            "GitHub requests."
                        ),
                        "kind": "downloads",
                        "releases": releases,
                    }
                )
            continue

        if section_id == "code":
            sections.append(
                {
                    "id": "code",
                    "label": label,
                    "eyebrow": "Open source",
                    "title": "Source, license, and implementation index",
                    "description": (
                        "Explore the upstream repository deliberately, or browse the "
                        "captured function and documentation indexes inside the Hub."
                    ),
                    "kind": "code",
                    "repositoryUrl": project.get("repositoryUrl"),
                    "defaultBranch": project.get("defaultBranch"),
                    "language": project.get("language"),
                    "license": license_statement(repository, project),
                    "functions": int(project.get("counts", {}).get("functions") or 0),
                    "documentsCount": int(project.get("counts", {}).get("documents") or 0),
                }
            )
            continue

        source_keys = blueprint.get("sources", {}).get(section_id, [])
        exact_documents = [
            (key, find_document(documents, key))
            for key in source_keys
        ]
        exact_documents = [
            (key, path)
            for key, path in exact_documents
            if path
        ]

        if exact_documents:
            section_documents = []
            for key, path in exact_documents:
                source = path.read_text(encoding="utf-8", errors="replace")
                if slug == "canopy" and section_id == "commands":
                    source = resolve_canopy_commands(
                        source,
                        sources_root,
                    )
                if section_id in {
                    "commands",
                    "global-rules",
                    "infodisplay-rules",
                }:
                    entries = parse_entry_document(source)
                    for entry in entries:
                        entry["blocks"] = localize_relative_images(
                            entry["blocks"],
                            repository=repository,
                            wiki=wiki,
                            source_key=key,
                            project_slug=slug,
                        )
                        entry["blocks"] = rewrite_relative_links(
                            entry["blocks"],
                            source_key=key,
                            project=project,
                        )
                        entry["blocks"] = rewrite_special_images(
                            entry["blocks"],
                            project_slug=slug,
                            section_id=section_id,
                        )
                    section_documents.append(
                        {
                            "source": key,
                            "title": markdown_title(source, label),
                            "entries": entries,
                        }
                    )
                else:
                    blocks = parse_markdown_blocks(source)
                    blocks = localize_relative_images(
                        blocks,
                        repository=repository,
                        wiki=wiki,
                        source_key=key,
                        project_slug=slug,
                    )
                    blocks = rewrite_relative_links(
                        blocks,
                        source_key=key,
                        project=project,
                    )
                    section_documents.append(
                        {
                            "source": key,
                            "title": markdown_title(source, label),
                            "blocks": blocks,
                        }
                    )

            has_entries = any(document.get("entries") for document in section_documents)
            has_blocks = any(document.get("blocks") for document in section_documents)
            if has_entries or has_blocks:
                sections.append(
                    {
                        "id": section_id,
                        "label": label,
                        "eyebrow": "Source-authored reference",
                        "title": label,
                        "description": (
                            f"Preserved from {project['name']} documentation in authored order."
                        ),
                        "kind": "catalog" if has_entries else "prose",
                        "documents": section_documents,
                    }
                )
            continue

        keywords = blueprint.get("keywords", {}).get(section_id, [])
        selected = select_sections(documents, keywords)
        for selected_document in selected:
            selected_source = selected_document.get(
                "source",
                "",
            )
            selected_document["blocks"] = localize_relative_images(
                selected_document.get(
                    "blocks",
                    [],
                ),
                repository=repository,
                wiki=wiki,
                source_key=selected_source,
                project_slug=slug,
            )
            selected_document["blocks"] = rewrite_relative_links(
                selected_document["blocks"],
                source_key=selected_source,
                project=project,
            )
        if selected:
            sections.append(
                {
                    "id": section_id,
                    "label": label,
                    "eyebrow": "Repository documentation",
                    "title": label,
                    "description": (
                        f"Source-backed {label.lower()} material selected from "
                        f"{project['name']} documentation."
                    ),
                    "kind": "prose",
                    "documents": selected,
                }
            )

    if (
        slug != "canopy"
        and len(
            sections
        )
        < 3
    ):
        fallback_documents = []

        for document_key, path in documents.items():
            source = path.read_text(
                encoding="utf-8",
                errors="replace",
            )

            blocks = parse_markdown_blocks(
                source,
                max_blocks=55,
            )

            if not blocks:
                continue

            blocks = localize_relative_images(
                blocks,
                repository=repository,
                wiki=wiki,
                source_key=document_key,
                project_slug=slug,
            )
            blocks = rewrite_relative_links(
                blocks,
                source_key=document_key,
                project=project,
            )

            fallback_documents.append(
                {
                    "source": document_key,
                    "title": markdown_title(
                        source,
                        Path(
                            document_key.split(
                                ":",
                                1,
                            )[
                                -1
                            ]
                        ).stem,
                    ),
                    "blocks": blocks,
                }
            )

            if len(
                fallback_documents
            ) >= 3:
                break

        if fallback_documents:
            fallback_section = {
                "id": "documentation",
                "label": "Documentation",
                "eyebrow": "Source-authored reference",
                "title": "Project documentation",
                "description": (
                    f"Preserved directly from {project['name']} repository files."
                ),
                "kind": "prose",
                "documents": fallback_documents,
            }

            code_index = next(
                (
                    index
                    for index, section
                    in enumerate(
                        sections
                    )
                    if section.get(
                        "id"
                    )
                    == "code"
                ),
                len(
                    sections
                ),
            )

            sections.insert(
                code_index,
                fallback_section,
            )

    contributors = fetch_user_names(
        project.get("contributors", []),
        token,
        user_cache,
        allow_network=allow_profile_network,
    )

    jump = []
    for section in sections:
        count = 0
        if section["kind"] == "catalog":
            count = sum(
                len(document.get("entries", []))
                for document in section.get("documents", [])
            )
        elif section["kind"] == "downloads":
            count = sum(
                len(release.get("downloads", []))
                for release in section.get("releases", [])
            )
        elif section["kind"] == "prose":
            count = sum(
                len(document.get("blocks", []))
                for document in section.get("documents", [])
            )
        jump.append(
            {
                "id": section["id"],
                "label": section["label"],
                "count": count,
            }
        )

    support = None
    if slug == "canopy":
        support = {
            "title": "Support ForestOfLight’s development",
            "description": (
                "Canopy represents hundreds of hours of technical Bedrock research, "
                "implementation, testing, and maintenance."
            ),
            "href": BUY_ME_A_COFFEE,
            "label": "Buy ForestOfLight a coffee",
        }

    return {
        "schemaVersion": 1,
        "slug": slug,
        "name": project["name"],
        "fullName": project["fullName"],
        "kind": blueprint["kind"],
        "tagline": blueprint["tagline"],
        "description": project.get("description"),
        "repositoryUrl": project.get("repositoryUrl"),
        "homepage": project.get("homepage"),
        "language": project.get("language"),
        "license": project.get("license"),
        "fork": project.get("fork"),
        "archived": project.get("archived"),
        "updatedAt": project.get("updatedAt"),
        "stars": project.get("stars"),
        "counts": project.get("counts"),
        "jump": jump,
        "sections": sections,
        "contributors": contributors,
        "copyright": license_statement(repository, project),
        "support": support,
        "crossLinks": [
            {
                "slug": "understudy",
                "label": "Explore Understudy",
                "description": "Simulated-player control for Canopy worlds.",
            }
        ] if slug == "canopy" else [],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--sources-root",
        type=Path,
        default=SOURCE_CACHE,
    )
    parser.add_argument(
        "--offline",
        action="store_true",
    )
    arguments = parser.parse_args()

    archive_manifest_path = ARCHIVE_ROOT / "manifest.json"
    if not archive_manifest_path.is_file():
        raise SystemExit("Archive manifest is missing.")
    if not DOWNLOAD_MANIFEST.is_file():
        raise SystemExit("Mirrored download manifest is missing.")

    archive_manifest = read_json(archive_manifest_path)
    download_manifest = read_json(DOWNLOAD_MANIFEST)

    if not archive_manifest.get("passed"):
        raise SystemExit("Archive manifest is not certified.")
    if not download_manifest.get("passed"):
        raise SystemExit("Download mirror is not certified.")

    token = github_token()
    user_cache = read_json(USER_CACHE) if USER_CACHE.is_file() else {}
    localize_dupe_tnt(token)

    projects_output = []
    failures = []
    sources_root = arguments.sources_root
    sources_root.mkdir(parents=True, exist_ok=True)

    projects: list[dict[str, Any]] = [
        read_json(ARCHIVE_ROOT / summary["file"])
        for summary in archive_manifest.get("projects", [])
    ]

    source_failures: dict[str, str] = {}

    # Synchronize every repository first. This makes cross-project source
    # references deterministic (Canopy resolves simulated-player placeholders
    # from Understudy) and lets later project generation remain order-safe.
    for project in projects:
        slug = project["slug"]
        repository = sources_root / slug / "repository"
        wiki = sources_root / slug / "wiki"

        try:
            if not arguments.offline:
                clone_or_update(
                    project["repositoryUrl"] + ".git",
                    repository,
                    project.get("defaultBranch") or "",
                )
                try:
                    clone_or_update(
                        f"https://github.com/{project['fullName']}.wiki.git",
                        wiki,
                    )
                except Exception:
                    if wiki.exists():
                        shutil.rmtree(wiki)
            elif not repository.is_dir():
                raise RuntimeError(
                    f"Offline source checkout is missing for {slug}."
                )
        except Exception as error:
            source_failures[slug] = str(error)

    for project in projects:
        slug = project["slug"]
        repository = sources_root / slug / "repository"
        wiki = sources_root / slug / "wiki"

        try:
            if slug in source_failures:
                raise RuntimeError(source_failures[slug])

            documents = collect_markdown(repository, wiki)
            if not documents:
                raise RuntimeError(f"No Markdown documentation found for {slug}.")

            payload = build_project(
                project=project,
                repository=repository,
                wiki=wiki,
                documents=documents,
                download_manifest=download_manifest,
                token=token,
                user_cache=user_cache,
                sources_root=sources_root,
                allow_profile_network=(
                    not arguments.offline
                ),
            )
            write_json(GENERATED_ROOT / "projects" / f"{slug}.json", payload)
            projects_output.append(
                {
                    "slug": slug,
                    "name": project["name"],
                    "kind": payload["kind"],
                    "sections": [
                        section["id"]
                        for section in payload["sections"]
                    ],
                    "contributors": len(payload["contributors"]),
                    "downloads": sum(
                        jump["count"]
                        for jump in payload["jump"]
                        if jump["id"] == "downloads"
                    ),
                    "file": f"projects/{slug}.json",
                }
            )
        except Exception as error:
            failures.append(
                {
                    "project": slug,
                    "error": str(error),
                }
            )

    write_json(USER_CACHE, user_cache)

    manifest = {
        "schemaVersion": 1,
        "generatedAt": time.strftime(
            "%Y-%m-%dT%H:%M:%SZ",
            time.gmtime(),
        ),
        "projects": projects_output,
        "summary": {
            "projects": len(projects_output),
            "sections": sum(
                len(project["sections"])
                for project in projects_output
            ),
            "contributors": sum(
                project["contributors"]
                for project in projects_output
            ),
            "downloads": sum(
                project["downloads"]
                for project in projects_output
            ),
        },
        "failures": failures,
        "passed": (
            len(projects_output) == len(archive_manifest.get("projects", []))
            and len(projects_output) == len(BLUEPRINTS)
            and not failures
            and all(project["sections"] for project in projects_output)
        ),
    }

    write_json(GENERATED_ROOT / "manifest.json", manifest)
    print(json.dumps(manifest["summary"] | {"failures": len(failures), "passed": manifest["passed"]}, indent=2))

    if not manifest["passed"]:
        for failure in failures:
            print(
                f"FAIL: {failure['project']}: {failure['error']}",
                file=os.sys.stderr,
            )
        raise SystemExit("Curated archive generation failed.")


if __name__ == "__main__":
    main()
