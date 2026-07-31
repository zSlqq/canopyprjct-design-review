#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import textwrap

from pathlib import Path
from typing import Any


ROOT = Path("C:/Users/DELL/AppData/Local/Temp/forestoflight-stage35/closure-v4-20260729-234024/repository")
MARKER = "Stage 35 — Curated archive field manuals"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value, encoding="utf-8")


def package_scripts() -> dict[str, Any]:
    path = ROOT / "package.json"
    package = json.loads(read(path))
    scripts = package.setdefault("scripts", {})

    scripts["archive:mirror"] = (
        "python3 scripts/mirror_archive_downloads.py"
    )
    scripts["archive:search"] = (
        "python3 scripts/build_archive_search.py "
        "&& python3 scripts/localize_archive_search.py"
    )
    scripts["curated:build"] = (
        "python3 scripts/build_curated_archive.py"
    )
    scripts["curated:media"] = (
        "node scripts/optimize_curated_media.mjs"
    )
    scripts["curated:verify"] = (
        "python3 scripts/verify_curated_archive.py"
    )
    scripts["curated:qa"] = (
        "node scripts/curated-archive-qa.mjs"
    )
    scripts["curated:sync"] = (
        "npm run archive:build "
        "&& npm run archive:verify-media "
        "&& npm run archive:mirror "
        "&& npm run curated:build "
        "&& npm run curated:media "
        "&& npm run curated:verify "
        "&& npm run features:build "
        "&& npm run archive:search "
        "&& npm run delivery:build"
    )

    for name in [
        "quality",
        "launch:certify",
    ]:
        value = str(scripts.get(name) or "")
        if not value:
            continue

        chain = (
            "npm run archive:mirror "
            "&& npm run curated:build "
            "&& npm run curated:media "
            "&& npm run curated:verify"
        )

        if all(
            command in value
            for command in [
                "npm run archive:mirror",
                "npm run curated:build",
                "npm run curated:media",
                "npm run curated:verify",
            ]
        ):
            scripts[name] = value
            continue

        anchor = "npm run archive:search"
        if anchor in value:
            value = value.replace(
                anchor,
                f"{chain} && {anchor}",
                1,
            )
        elif "npm run features:build" in value:
            value = value.replace(
                "npm run features:build",
                f"{chain} && npm run features:build",
                1,
            )
        else:
            value = f"{chain} && {value}"

        scripts[name] = value

    write(
        path,
        json.dumps(
            package,
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
    )

    return {
        "archive:mirror": scripts["archive:mirror"],
        "archive:search": scripts["archive:search"],
        "curated:build": scripts["curated:build"],
        "curated:media": scripts["curated:media"],
        "curated:verify": scripts["curated:verify"],
        "curated:qa": scripts["curated:qa"],
        "curated:sync": scripts["curated:sync"],
        "qualityChanged": "curated:verify" in str(scripts.get("quality")),
        "launchChanged": "curated:verify" in str(scripts.get("launch:certify")),
    }


def next_headers() -> dict[str, Any]:
    candidates = [
        ROOT / "next.config.ts",
        ROOT / "next.config.mjs",
        ROOT / "next.config.js",
    ]
    existing = [
        path
        for path in candidates
        if path.is_file()
    ]
    if len(existing) != 1:
        raise RuntimeError(
            f"Expected one Next.js config, found {len(existing)}."
        )

    path = existing[0]
    source = read(path)
    required = [
        "/_downloads/:path*",
        "/_curated-archive/:path*",
    ]

    if all(item in source for item in required):
        return {
            "changed": False,
            "path": str(path.relative_to(ROOT)),
        }

    headers = re.search(
        r"async\s+headers\s*\([^)]*\)\s*\{",
        source,
    )
    if not headers:
        raise RuntimeError("Next.js headers function not found.")

    returned = re.search(
        r"return\s*\[",
        source[headers.end():],
    )
    if not returned:
        raise RuntimeError("Next.js headers return array not found.")

    opening = headers.end() + returned.end() - 1
    rules = '''
      {
        source: "/_downloads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source: "/_curated-archive/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
'''

    source = (
        source[: opening + 1]
        + rules
        + source[opening + 1 :]
    )

    for item in required:
        if source.count(item) != 1:
            raise RuntimeError(
                f"Curated cache rule is not unique: {item}"
            )

    write(path, source)
    return {
        "changed": True,
        "path": str(path.relative_to(ROOT)),
    }


def delivery_routes() -> dict[str, Any]:
    path = ROOT / "scripts/augment_delivery_manifest.py"
    source = read(path)

    if 'f"/projects/{curated_slug}"' in source:
        compile(
            source,
            str(path),
            "exec",
        )

        return {
            "changed": False,
            "path": str(path.relative_to(ROOT)),
            "method": "validated-existing-project-routes",
        }

    marker_candidates = [
        'routes.add("/archive/search")',
        'routes.add("/archive")',
    ]

    marker = next(
        (
            candidate
            for candidate in marker_candidates
            if candidate in source
        ),
        None,
    )

    if marker is None:
        raise RuntimeError(
            "Could not locate archive route insertion point."
        )

    marker_count = source.count(
        marker
    )

    if marker_count != 1:
        raise RuntimeError(
            f"Archive route insertion point is not unique: {marker_count}."
        )

    marker_index = source.index(
        marker
    )

    line_start = (
        source.rfind(
            "\n",
            0,
            marker_index,
        )
        + 1
    )

    indentation = source[
        line_start:
        marker_index
    ]

    if indentation.strip():
        raise RuntimeError(
            "Archive route marker is preceded by non-whitespace content."
        )

    block = '''for curated_project in archive.get(
    "projects",
    [],
):
    curated_slug = str(
        curated_project.get(
            "slug",
            "",
        )
    ).strip()

    if curated_slug:
        routes.add(
            f"/projects/{curated_slug}"
        )
'''

    insertion = (
        "\n"
        + textwrap.indent(
            block.rstrip(),
            indentation,
        )
    )

    insertion_point = (
        marker_index
        + len(
            marker
        )
    )

    source = (
        source[:insertion_point]
        + insertion
        + source[insertion_point:]
    )

    if source.count(
        'f"/projects/{curated_slug}"'
    ) != 1:
        raise RuntimeError(
            "Curated project route insertion is not unique."
        )

    try:
        compile(
            source,
            str(path),
            "exec",
        )
    except SyntaxError as error:
        raise RuntimeError(
            "The patched delivery augmenter is invalid Python: "
            f"line {error.lineno}: {error.msg}"
        ) from error

    write(path, source)

    return {
        "changed": True,
        "path": str(path.relative_to(ROOT)),
        "method": "scope-preserving-python-route-insertion",
        "marker": marker,
        "indentationWidth": len(indentation),
        "compiled": True,
    }


def remove_function_capture_cap() -> dict[str, Any]:
    path = ROOT / "scripts/build_github_archive.py"
    source = read(path)

    old_constant = "MAX_FUNCTIONS = 1_500"
    new_constant = "MAX_FUNCTIONS: int | None = None"

    changed = False
    if old_constant in source:
        source = source.replace(
            old_constant,
            new_constant,
            1,
        )
        changed = True

    old_guard = "if len(output) >= MAX_FUNCTIONS:"
    while old_guard in source:
        line_start = source.rfind("\n", 0, source.index(old_guard)) + 1
        indent = source[line_start:source.index(old_guard)]
        replacement = (
            "if (\n"
            f"{indent}    MAX_FUNCTIONS is not None\n"
            f"{indent}    and len(output) >= MAX_FUNCTIONS\n"
            f"{indent}):"
        )
        source = source.replace(
            old_guard,
            replacement,
            1,
        )
        changed = True

    if "MAX_FUNCTIONS = 1_500" in source:
        raise RuntimeError(
            "The Stage 33 function cap remains in the archive builder."
        )

    if re.search(
        r"if\s+len\(output\)\s*>=\s*MAX_FUNCTIONS",
        source,
    ):
        raise RuntimeError(
            "An unguarded function-cap comparison remains."
        )

    if new_constant not in source:
        raise RuntimeError(
            "The archive builder does not expose the uncapped function setting."
        )

    compile(
        source,
        str(path),
        "exec",
    )

    write(path, source)

    return {
        "changed": changed,
        "path": str(path.relative_to(ROOT)),
        "functionLimit": None,
        "method": "uncapped-complete-function-capture",
    }


def append_css() -> dict[str, Any]:
    path = ROOT / "app/globals.css"
    source = read(path)
    addition = read(ROOT / "scripts/stage35-curated.css")

    if MARKER in source:
        return {
            "changed": False,
            "path": str(path.relative_to(ROOT)),
        }

    source = source.rstrip() + "\n\n" + addition.strip() + "\n"
    write(path, source)

    return {
        "changed": True,
        "path": str(path.relative_to(ROOT)),
        "bytes": len(addition.encode("utf-8")),
    }


def main() -> None:
    result = {
        "packageScripts": package_scripts(),
        "cacheHeaders": next_headers(),
        "deliveryRoutes": delivery_routes(),
        "archiveCompleteness": remove_function_capture_cap(),
        "css": append_css(),
        "passed": True,
    }

    print(
        json.dumps(
            result,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
