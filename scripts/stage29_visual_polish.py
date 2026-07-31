#!/usr/bin/env python3

from __future__ import annotations

import json
import re
import sys

from pathlib import Path


ROOT = Path.cwd()

EXCLUDED = {
    ".git",
    ".next",
    "node_modules",
    ".stage20",
    ".stage21",
    ".stage22",
    ".stage23",
    ".stage24",
    ".stage25",
    ".stage26",
    ".stage27",
    ".stage28",
    ".stage29",
}


def source_files(
    suffix: str,
):
    for path in ROOT.rglob(
        f"*{suffix}"
    ):
        if any(
            part in EXCLUDED
            for part
            in path.parts
        ):
            continue

        yield path


def ensure_title_renderer() -> list[str]:
    changed = []

    import_line = (
        'import { canonicalFeatureTitle } '
        'from "@/lib/feature-display";\n'
    )

    for path in source_files(
        ".tsx"
    ):
        source = path.read_text(
            encoding="utf-8"
        )

        updated, count = re.subn(
            r"\{\s*feature\.title\s*\}",
            "{canonicalFeatureTitle(feature)}",
            source,
        )

        if count == 0:
            continue

        if import_line not in updated:
            directive = re.match(
                r"^(['\"]use client['\"];\s*\n)",
                updated,
            )

            if directive:
                position = directive.end()

                updated = (
                    updated[:position]
                    + "\n"
                    + import_line
                    + updated[position:]
                )
            else:
                updated = (
                    import_line
                    + updated
                )

        path.write_text(
            updated,
            encoding="utf-8",
        )

        changed.append(
            str(
                path.relative_to(
                    ROOT
                )
            )
        )

    return changed


def mark_section(
    source: str,
    phrase_pattern: str,
    attribute: str,
) -> tuple[
    str,
    int,
]:
    match = re.search(
        phrase_pattern,
        source,
        flags=re.IGNORECASE
        | re.DOTALL,
    )

    if match is None:
        return (
            source,
            0,
        )

    section_start = source.rfind(
        "<section",
        0,
        match.start(),
    )

    if section_start < 0:
        return (
            source,
            0,
        )

    opening_end = source.find(
        ">",
        section_start,
        match.start(),
    )

    if opening_end < 0:
        return (
            source,
            0,
        )

    opening = source[
        section_start:
        opening_end
        + 1
    ]

    if attribute in opening:
        return (
            source,
            0,
        )

    replacement = (
        opening[:-1]
        + f"\n            {attribute}\n"
        + ">"
    )

    return (
        source[:section_start]
        + replacement
        + source[opening_end + 1:],
        1,
    )


def mark_color_sections() -> dict[
    str,
    object,
]:
    targets = [
        (
            r"Tools\s+for\s+building",
            "data-stage29-color-section",
        ),
        (
            r"The\s+core\s*,",
            "data-stage29-canopy-section",
        ),
    ]

    changed = []

    for path in source_files(
        ".tsx"
    ):
        source = path.read_text(
            encoding="utf-8"
        )

        updated = source
        count = 0

        for phrase, attribute in targets:
            updated, added = mark_section(
                updated,
                phrase,
                attribute,
            )

            count += added

        if count:
            path.write_text(
                updated,
                encoding="utf-8",
            )

            changed.append(
                {
                    "path":
                        str(
                            path.relative_to(
                                ROOT
                            )
                        ),
                    "sections":
                        count,
                }
            )

    return {
        "files":
            changed,
        "total":
            sum(
                item[
                    "sections"
                ]
                for item
                in changed
            ),
    }


def patch_canopy_data() -> dict[
    str,
    object,
]:
    path = (
        ROOT
        / "lib/data/addons.ts"
    )

    source = path.read_text(
        encoding="utf-8"
    )

    patterns = [
        r"/_project-media/6170169d0da576b8e6cfa262\.jpg",
        r"https://raw\.githubusercontent\.com/ForestOfLight/Canopy/main/canopylogo_banner\.jpg",
        r"https://github\.com/ForestOfLight/Canopy/raw/[^\"'`]+/canopylogo_banner\.jpg",
    ]

    updated = source
    replacements = 0

    for pattern in patterns:
        updated, count = re.subn(
            pattern,
            "/brand/canopy-banner.jpg",
            updated,
        )

        replacements += count

    if (
        replacements == 0
        and "/brand/canopy-banner.jpg"
        not in updated
    ):
        raise RuntimeError(
            "Could not locate Canopy artwork in lib/data/addons.ts."
        )

    path.write_text(
        updated,
        encoding="utf-8",
    )

    return {
        "path":
            str(
                path.relative_to(
                    ROOT
                )
            ),
        "replacements":
            replacements,
    }


def patch_static_controls() -> dict[
    str,
    object,
]:
    pattern = re.compile(
        r'<(?P<tag>button|a|Link)\b'
        r'(?P<body>[^>]*?)'
        r'className="(?P<classes>[^"]*)"',
        re.DOTALL,
    )

    files = []
    repairs = 0

    for path in source_files(
        ".tsx"
    ):
        source = path.read_text(
            encoding="utf-8"
        )

        changes = 0

        def repair(
            match:
                re.Match[str],
        ) -> str:
            nonlocal changes

            tokens = match.group(
                "classes"
            ).split()

            original = list(
                tokens
            )

            tokens = [
                (
                    "opacity-100"
                    if token
                    == "opacity-0"
                    else "visible"
                    if token
                    == "invisible"
                    else "text-current"
                    if token
                    == "text-transparent"
                    else token
                )
                for token
                in tokens
            ]

            if (
                "bg-white"
                in tokens
            ):
                tokens = [
                    (
                        "text-slate-950"
                        if token
                        in {
                            "text-white",
                            "text-slate-50",
                        }
                        else token
                    )
                    for token
                    in tokens
                ]

            if tokens == original:
                return match.group(
                    0
                )

            changes += 1

            return (
                f'<{match.group("tag")}'
                f'{match.group("body")}'
                f'className="{" ".join(tokens)}"'
            )

        updated = pattern.sub(
            repair,
            source,
        )

        if changes:
            path.write_text(
                updated,
                encoding="utf-8",
            )

            files.append(
                str(
                    path.relative_to(
                        ROOT
                    )
                )
            )

            repairs += changes

    return {
        "files":
            files,
        "repairs":
            repairs,
    }


def append_css() -> None:
    path = (
        ROOT
        / "app/globals.css"
    )

    css = path.read_text(
        encoding="utf-8"
    )

    marker = (
        "/* stage-29-visual-stabilization */"
    )

    if marker in css:
        return

    css += r'''

/* stage-29-visual-stabilization */
:where(
  main,
  [data-feature-command-center],
  #project-features,
  [data-stage29-color-section],
  [data-stage29-canopy-section]
) :is(button, a[href], [role="button"])[class~="opacity-0"],
:where(
  main,
  [data-feature-command-center],
  #project-features,
  [data-stage29-color-section],
  [data-stage29-canopy-section]
) :is(button, a[href], [role="button"])[class~="invisible"],
:where(
  main,
  [data-feature-command-center],
  #project-features,
  [data-stage29-color-section],
  [data-stage29-canopy-section]
) :is(button, a[href], [role="button"])[class~="group-hover:opacity-100"] {
  opacity: 1 !important;
  visibility: visible !important;
}

:where(
  main,
  [data-feature-command-center],
  #project-features,
  [data-stage29-color-section],
  [data-stage29-canopy-section]
) :is(button, a[href], [role="button"])[class~="bg-white"] {
  color: #0f172a !important;
}

:where(
  main,
  [data-feature-command-center],
  #project-features,
  [data-stage29-color-section],
  [data-stage29-canopy-section]
) :is(button, a[href], [role="button"])[class~="bg-slate-950"],
:where(
  main,
  [data-feature-command-center],
  #project-features,
  [data-stage29-color-section],
  [data-stage29-canopy-section]
) :is(button, a[href], [role="button"])[class~="bg-violet-600"],
:where(
  main,
  [data-feature-command-center],
  #project-features,
  [data-stage29-color-section],
  [data-stage29-canopy-section]
) :is(button, a[href], [role="button"])[class~="bg-black"] {
  color: #ffffff !important;
}

[data-stage29-color-section] {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 8% 8%,
      rgba(124, 58, 237, 0.16),
      transparent 29rem
    ),
    radial-gradient(
      circle at 92% 18%,
      rgba(16, 185, 129, 0.13),
      transparent 26rem
    ),
    linear-gradient(
      180deg,
      #fbfaff 0%,
      #f5f2ff 52%,
      #f4faf7 100%
    ) !important;
  border-block:
    1px solid rgba(124, 58, 237, 0.11);
}

[data-stage29-color-section]::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.42;
  background-image:
    linear-gradient(
      rgba(124, 58, 237, 0.08) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(124, 58, 237, 0.08) 1px,
      transparent 1px
    );
  background-size: 46px 46px;
}

[data-stage29-color-section] article:nth-of-type(3n + 1) {
  border-top-color:
    rgba(124, 58, 237, 0.55) !important;
}

[data-stage29-color-section] article:nth-of-type(3n + 2) {
  border-top-color:
    rgba(16, 185, 129, 0.48) !important;
}

[data-stage29-color-section] article:nth-of-type(3n) {
  border-top-color:
    rgba(14, 165, 233, 0.46) !important;
}

[data-stage29-canopy-section] {
  background:
    radial-gradient(
      circle at 18% 12%,
      rgba(16, 185, 129, 0.16),
      transparent 31rem
    ),
    radial-gradient(
      circle at 88% 16%,
      rgba(124, 58, 237, 0.12),
      transparent 28rem
    ),
    linear-gradient(
      180deg,
      #ffffff 0%,
      #f3faf7 100%
    ) !important;
}

img[src*="canopy-banner.jpg"],
img[src*="6170169d0da576b8e6cfa262"] {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
  object-position: center !important;
  background:
    linear-gradient(
      135deg,
      #0c3e34,
      #0f4d3f
    ) !important;
  image-rendering: auto !important;
}

:where(
  figure,
  div,
  article
):has(
  > img[src*="canopy-banner.jpg"]
),
:where(
  figure,
  div,
  article
):has(
  > img[src*="6170169d0da576b8e6cfa262"]
) {
  overflow: hidden !important;
  min-height: 12rem;
  aspect-ratio: 19 / 7;
  border-radius: 1.5rem;
  background:
    linear-gradient(
      135deg,
      #0c3e34,
      #0f4d3f
    ) !important;
}

#project-features :is(h2, h3),
[data-feature-command-center] [data-feature-title] {
  text-wrap: balance;
  overflow-wrap: anywhere;
}

#project-features :is(p, code),
[data-feature-command-center] :is(p, code) {
  text-wrap: pretty;
  overflow-wrap: anywhere;
}
'''

    path.write_text(
        css,
        encoding="utf-8",
    )


def patch_next_config() -> str:
    candidates = [
        ROOT
        / "next.config.ts",
        ROOT
        / "next.config.mjs",
        ROOT
        / "next.config.js",
        ROOT
        / "next.config.cjs",
    ]

    existing = [
        path
        for path
        in candidates
        if path.is_file()
    ]

    if len(
        existing
    ) != 1:
        raise RuntimeError(
            "Expected exactly one Next.js configuration file."
        )

    path = existing[0]

    source = path.read_text(
        encoding="utf-8"
    )

    marker = (
        "stage-29-brand-cache"
    )

    if marker not in source:
        return_match = re.search(
            r"return\s*\[",
            source,
        )

        if return_match is None:
            raise RuntimeError(
                "Could not locate headers() return array."
            )

        insertion = r'''
      {
        // stage-29-brand-cache
        source: "/brand/:path*",
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
'''

        position = return_match.end()

        source = (
            source[:position]
            + insertion
            + source[position:]
        )

        path.write_text(
            source,
            encoding="utf-8",
        )

    return str(
        path.relative_to(
            ROOT
        )
    )


def main() -> None:
    result = {
        "canonicalTitleFiles":
            ensure_title_renderer(),
        "coloredSections":
            mark_color_sections(),
        "canopyData":
            patch_canopy_data(),
        "staticControlRepairs":
            patch_static_controls(),
    }

    append_css()

    result[
        "nextConfig"
    ] = patch_next_config()

    (
        ROOT
        / ".stage29/patch-report.json"
    ).write_text(
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


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(
            "Stage 29 visual patch failed: "
            f"{error}",
            file=sys.stderr,
        )

        raise SystemExit(1)
