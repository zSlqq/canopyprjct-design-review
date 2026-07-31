#!/usr/bin/env python3

from __future__ import annotations

import json
import re

from pathlib import Path


ROOT = Path.cwd()


def write(
    path: Path,
    source: str,
) -> None:
    path.write_text(
        source,
        encoding="utf-8",
    )


def archive_index() -> dict[str, object]:
    path = (
        ROOT
        / "app/archive/page.tsx"
    )

    source = path.read_text(
        encoding="utf-8"
    )

    if (
        'href="/archive/search"'
        in source
    ):
        return {
            "changed":
                False,
            "method":
                "existing-search-link",
        }

    candidates = [
        re.search(
            r'(?m)^(?P<indent>[ \t]*)<section\s+className="[^"]*\bpy-16\b',
            source,
        ),
        re.search(
            r'(?m)^(?P<indent>[ \t]*)<section\s+className="[^"]*px-5[^"]*"',
            source,
        ),
    ]

    match = next(
        (
            candidate
            for candidate
            in candidates
            if candidate
        ),
        None,
    )

    if not match:
        raise RuntimeError(
            "Archive repository-grid section not found."
        )

    indent = match.group(
        "indent"
    )

    block = f'''{indent}<section className="px-5 pt-12 sm:px-8 lg:px-12">
{indent}    <div className="mx-auto max-w-7xl rounded-[2rem] bg-[linear-gradient(135deg,#1e1b4b,#5b21b6_55%,#047857)] p-6 text-white shadow-[0_28px_100px_rgba(76,29,149,0.18)] sm:p-8">
{indent}        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
{indent}            <div className="max-w-3xl">
{indent}                <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-violet-200">
{indent}                    Search every captured record
{indent}                </p>

{indent}                <h2 className="mt-3 text-balance text-3xl font-black tracking-[-0.045em] sm:text-5xl">
{indent}                    Find any version, download,
{indent}                    command, rule, function, or
{indent}                    contributor.
{indent}                </h2>
{indent}            </div>

{indent}            <Link
{indent}                href="/archive/search"
{indent}                prefetch={{false}}
{indent}                className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-white px-6 text-sm font-black text-violet-950"
{indent}            >
{indent}                Search the archive →
{indent}            </Link>
{indent}        </div>
{indent}    </div>
{indent}</section>

'''

    source = (
        source[
            :match.start()
        ]
        + block
        + source[
            match.start():
        ]
    )

    if source.count(
        'href="/archive/search"'
    ) != 1:
        raise RuntimeError(
            "Archive search CTA integration is not unique."
        )

    write(
        path,
        source,
    )

    return {
        "changed":
            True,
        "method":
            "semantic-section-insertion",
    }


def delivery() -> dict[str, object]:
    path = (
        ROOT
        / "scripts/augment_delivery_manifest.py"
    )

    source = path.read_text(
        encoding="utf-8"
    )

    route_pattern = re.compile(
        r'routes\.add\(\s*[\'\"]\/archive\/search[\'\"]\s*\)',
    )

    if route_pattern.search(
        source
    ):
        return {
            "changed":
                False,
            "method":
                "existing-route",
        }

    archive_pattern = re.compile(
        r'(?P<statement>routes\.add\(\s*[\'\"]\/archive[\'\"]\s*\))',
    )

    match = archive_pattern.search(
        source
    )

    if not match:
        raise RuntimeError(
            "Archive route statement not found."
        )

    source = (
        source[
            :match.end()
        ]
        + '\n\nroutes.add(\n    "/archive/search"\n)'
        + source[
            match.end():
        ]
    )

    # Keep the diagnostic count accurate when the existing script reports
    # repositories plus the archive root.
    source = re.sub(
        r'(\"archiveRoutes\"\s*:\s*\(\s*archive\s*\[\s*\"summary\"\s*\]\s*\[\s*\"repositories\"\s*\]\s*\+\s*)1(\s*\))',
        r'\g<1>2\g<2>',
        source,
        count=1,
    )

    compile(
        source,
        str(
            path
        ),
        "exec",
    )

    if len(
        route_pattern.findall(
            source
        )
    ) != 1:
        raise RuntimeError(
            "Archive search delivery route is not unique."
        )

    write(
        path,
        source,
    )

    return {
        "changed":
            True,
        "method":
            "python-route-statement",
    }


def package() -> dict[str, object]:
    path = (
        ROOT
        / "package.json"
    )

    data = json.loads(
        path.read_text(
            encoding="utf-8"
        )
    )

    scripts = data.setdefault(
        "scripts",
        {},
    )

    scripts[
        "archive:search"
    ] = (
        "python3 scripts/build_archive_search.py"
    )

    changed_scripts = []

    for name in [
        "quality",
        "launch:certify",
    ]:
        value = scripts.get(
            name,
            "",
        )

        if not value:
            continue

        if "npm run archive:search" not in value:
            anchor = (
                "npm run archive:build"
            )

            if anchor in value:
                value = value.replace(
                    anchor,
                    (
                        "npm run archive:build "
                        "&& npm run archive:search"
                    ),
                    1,
                )
            else:
                value = (
                    "npm run archive:search && "
                    + value
                )

            scripts[
                name
            ] = value

            changed_scripts.append(
                name
            )

    write(
        path,
        json.dumps(
            data,
            indent=2,
        )
        + "\n",
    )

    return {
        "archive:search":
            scripts[
                "archive:search"
            ],
        "changedScripts":
            changed_scripts,
    }


def next_config() -> dict[str, object]:
    candidates = [
        ROOT
        / "next.config.ts",
        ROOT
        / "next.config.mjs",
        ROOT
        / "next.config.js",
    ]

    existing = [
        path
        for path
        in candidates
        if path.exists()
    ]

    if len(
        existing
    ) != 1:
        raise RuntimeError(
            "Expected one Next.js config."
        )

    path = existing[
        0
    ]

    source = path.read_text(
        encoding="utf-8"
    )

    required = [
        "/_archive-search/manifest.json",
        "/_archive-search/archive.:hash.json",
        "/archive-search-worker.js",
    ]

    if all(
        item in source
        for item
        in required
    ):
        return {
            "changed":
                False,
            "method":
                "existing-cache-rules",
        }

    headers = re.search(
        r'async\s+headers\s*\([^)]*\)\s*\{',
        source,
    )

    if not headers:
        raise RuntimeError(
            "Next.js headers function not found."
        )

    returned = re.search(
        r'return\s*\[',
        source[
            headers.end():
        ],
    )

    if not returned:
        raise RuntimeError(
            "Next.js headers return array not found."
        )

    opening = (
        headers.end()
        + returned.end()
        - 1
    )

    rules = '''
      {
        source: "/_archive-search/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/_archive-search/archive.:hash.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/archive-search-worker.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
'''

    source = (
        source[
            :opening
            + 1
        ]
        + rules
        + source[
            opening
            + 1:
        ]
    )

    for item in required:
        if source.count(
            item
        ) != 1:
            raise RuntimeError(
                f"Cache rule is not unique: {item}"
            )

    write(
        path,
        source,
    )

    return {
        "changed":
            True,
        "method":
            "headers-array-insertion",
    }


def visual() -> dict[str, object]:
    path = (
        ROOT
        / "scripts/visual-regression.mjs"
    )

    source = path.read_text(
        encoding="utf-8"
    )

    if (
        '"desktop-archive-search"'
        in source
        and '"mobile-archive-search"'
        in source
    ):
        return {
            "changed":
                False,
            "method":
                "existing-scenes",
        }

    match = re.search(
        r'const\s+scenes\s*=\s*\[',
        source,
    )

    if not match:
        raise RuntimeError(
            "Visual scene list not found."
        )

    scenes = '''
    {
        name:
            "desktop-archive-search",
        route:
            "/archive/search",
        viewport: {
            width:
                1440,
            height:
                1000,
        },
        fullPage:
            true,
    },
    {
        name:
            "mobile-archive-search",
        route:
            "/archive/search",
        viewport: {
            width:
                390,
            height:
                844,
        },
        fullPage:
            true,
        isMobile:
            true,
        hasTouch:
            true,
    },
'''

    source = (
        source[
            :match.end()
        ]
        + scenes
        + source[
            match.end():
        ]
    )

    if source.count(
        '"desktop-archive-search"'
    ) != 1:
        raise RuntimeError(
            "Desktop archive-search visual scene is not unique."
        )

    if source.count(
        '"mobile-archive-search"'
    ) != 1:
        raise RuntimeError(
            "Mobile archive-search visual scene is not unique."
        )

    write(
        path,
        source,
    )

    return {
        "changed":
            True,
        "method":
            "semantic-scenes-array-insertion",
    }


def source_hygiene() -> dict[str, object]:
    path = (
        ROOT
        / "scripts/remove-canopy-artwork.mjs"
    )

    if not path.is_file():
        return {
            "changed":
                False,
            "method":
                "stage33-remover-not-present",
        }

    source = path.read_text(
        encoding="utf-8"
    )

    original = source

    for name in [
        "lstatSync",
        "realpathSync",
        "statSync",
    ]:
        source = re.sub(
            rf"(?m)^[ \t]+{name},\n",
            "",
            source,
            count=1,
        )

    property_helper = re.compile(
        r"\nfunction propertyName\(\n[\s\S]*?\n}\n\n(?=function identifierNames\()",
    )

    source, removed_helpers = (
        property_helper.subn(
            "\n",
            source,
            count=1,
        )
    )

    remaining = [
        name
        for name
        in [
            "lstatSync",
            "realpathSync",
            "statSync",
            "function propertyName(",
        ]
        if name in source
    ]

    if remaining:
        raise RuntimeError(
            "Stage 33 remover hygiene remains incomplete: "
            + ", ".join(
                remaining
            )
        )

    changed = (
        source
        != original
    )

    if changed:
        write(
            path,
            source,
        )

    return {
        "changed":
            changed,
        "method":
            "unused-stage33-remover-code-cleanup",
        "removedPropertyHelpers":
            removed_helpers,
    }


def main() -> None:
    report = {
        "archiveIndex":
            archive_index(),
        "deliveryRoute":
            delivery(),
        "packageScripts":
            package(),
        "cacheHeaders":
            next_config(),
        "visualScenes":
            visual(),
        "sourceHygiene":
            source_hygiene(),
    }

    report[
        "passed"
    ] = True

    destination = (
        ROOT
        / ".stage34/source-patch.json"
    )

    destination.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    write(
        destination,
        json.dumps(
            report,
            indent=2,
        )
        + "\n",
    )

    print(
        json.dumps(
            report,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

