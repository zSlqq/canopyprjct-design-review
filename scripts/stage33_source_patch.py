#!/usr/bin/env python3

from __future__ import annotations

import json
import re

from pathlib import Path


ROOT = Path.cwd()


def patch_navigation() -> dict[str, object]:
    path = ROOT / "components/SiteNavigation.tsx"
    source = path.read_text(
        encoding="utf-8"
    )

    if (
        'href="/archive"' in source
        or 'href: "/archive"' in source
        or "href: '/archive'" in source
    ):
        return {
            "path": str(
                path.relative_to(ROOT)
            ),
            "changed": False,
            "reason": "already-present",
        }

    patterns = [
        re.compile(
            r'(?P<entry>\{\s*href:\s*"/docs"\s*,\s*(?:label|name|title):\s*"[^"]+"\s*,?\s*\})',
            re.DOTALL,
        ),
        re.compile(
            r"(?P<entry>\{\s*href:\s*'/docs'\s*,\s*(?:label|name|title):\s*'[^']+'\s*,?\s*\})",
            re.DOTALL,
        ),
    ]

    for pattern in patterns:
        match = pattern.search(source)

        if not match:
            continue

        entry = match.group("entry")

        archive_entry = re.sub(
            r"(['\"])/docs\1",
            r"\1/archive\1",
            entry,
            count=1,
        )

        archive_entry = re.sub(
            r'((?:label|name|title):\s*)("[^"]*"|\'[^\']*\')',
            r'\1"Archive"',
            archive_entry,
            count=1,
        )

        source = (
            source[:match.end()]
            + ",\n"
            + archive_entry
            + source[match.end():]
        )

        path.write_text(
            source,
            encoding="utf-8",
        )

        return {
            "path": str(
                path.relative_to(ROOT)
            ),
            "changed": True,
            "method": "navigation-data",
        }

    closing_nav = source.find("</nav>")

    if closing_nav < 0:
        raise RuntimeError(
            "Could not locate SiteNavigation nav element."
        )

    link_import = (
        'import Link from "next/link";'
    )

    if (
        link_import
        not in source
    ):
        directive = re.search(
            r'(?m)^[ \\t]*(?P<quote>["\\\'])use client(?P=quote);?[ \\t]*$',
            source,
        )

        if directive:
            line_end = source.find(
                "\n",
                directive.end(),
            )

            insert_at = (
                len(
                    source
                )
                if line_end < 0
                else line_end
                + 1
            )

            source = (
                source[
                    :insert_at
                ]
                + link_import
                + "\n"
                + source[
                    insert_at:
                ]
            )
        else:
            source = (
                link_import
                + "\n"
                + source
            )

    archive_link = '''
                <Link
                    href="/archive"
                    prefetch={false}
                    data-archive-nav
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-slate-800 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
                >
                    Archive
                </Link>
'''

    source = (
        source[:closing_nav]
        + archive_link
        + source[closing_nav:]
    )

    first_expression = next(
        (
            line.strip()
            for line
            in source.splitlines()
            if line.strip()
            and not line.lstrip().startswith(
                "//"
            )
        ),
        "",
    )

    if (
        '"use client"'
        in source
        or "'use client'"
        in source
    ):
        if first_expression not in {
            '"use client";',
            '"use client"',
            "'use client';",
            "'use client'",
        }:
            raise RuntimeError(
                'The "use client" directive is no longer the first expression.'
            )

        directive_position = max(
            source.find(
                '"use client"'
            ),
            source.find(
                "'use client'"
            ),
        )

        import_position = source.find(
            link_import
        )

        if (
            import_position < 0
            or import_position
            < directive_position
        ):
            raise RuntimeError(
                "The Next.js Link import was not placed after the client directive."
            )

    path.write_text(
        source,
        encoding="utf-8",
    )

    return {
        "path": str(
            path.relative_to(ROOT)
        ),
        "changed": True,
        "method": "nav-link-after-client-directive",
    }


def remove_canopy_banner() -> dict[str, object]:
    report_path = (
        ROOT
        / ".stage33/canopy-artwork-patch.json"
    )

    if not report_path.is_file():
        raise RuntimeError(
            "The Canopy artwork AST patch report is missing."
        )

    report = json.loads(
        report_path.read_text(
            encoding="utf-8"
        )
    )

    if (
        not report.get(
            "passed"
        )
        or report.get(
            "runtimeMarkerReferences"
        )
        != 0
    ):
        raise RuntimeError(
            "The Canopy artwork AST patch did not certify zero runtime references."
        )

    markers = [
        "canopy-banner",
        "6170169d0da576b8e6cfa262",
    ]

    suffixes = {
        ".js",
        ".jsx",
        ".json",
        ".ts",
        ".tsx",
    }

    failures = []

    for directory in [
        ROOT
        / "app",
        ROOT
        / "components",
        ROOT
        / "lib",
    ]:
        if not directory.exists():
            continue

        for path in directory.rglob(
            "*"
        ):
            if (
                not path.is_file()
                or path.suffix
                not in suffixes
                or "generated"
                in path.parts
            ):
                continue

            source = path.read_text(
                encoding="utf-8"
            ).lower()

            if any(
                marker
                in source
                for marker
                in markers
            ):
                failures.append(
                    str(
                        path.relative_to(
                            ROOT
                        )
                    )
                )

    if failures:
        raise RuntimeError(
            "Runtime Canopy artwork references remain in: "
            + ", ".join(
                failures
            )
        )

    banner = (
        ROOT
        / "public/brand/canopy-banner.jpg"
    )

    return {
        **report,
        "sourceVerification":
            "zero-runtime-marker-references",
        "compatibilityAssetRetained":
            banner.is_file(),
        "compatibilityAssetBytes":
            (
                banner.stat().st_size
                if banner.is_file()
                else 0
            ),
    }


def patch_features_heading() -> dict[str, object]:
    features_root = (
        ROOT
        / "app/features"
    )

    removed = []

    for name in [
        "layout.tsx",
        "template.tsx",
    ]:
        path = (
            features_root
            / name
        )

        if not path.exists():
            continue

        source = path.read_text(
            encoding="utf-8"
        )

        stage_owned = (
            "data-feature-page-heading"
            in source
            and (
                "Every documented ForestOfLight feature."
                in source
            )
            and (
                "FeaturesHeadingBoundary"
                in source
            )
        )

        if stage_owned:
            path.unlink()

            removed.append(
                str(
                    path.relative_to(
                        ROOT
                    )
                )
            )

    for path in [
        features_root
        / "layout.tsx",
        features_root
        / "template.tsx",
    ]:
        if not path.exists():
            continue

        source = path.read_text(
            encoding="utf-8"
        )

        if (
            "data-feature-page-heading"
            in source
            or (
                "Every documented ForestOfLight feature."
                in source
            )
        ):
            raise RuntimeError(
                "A stale Stage 33 features heading wrapper remains."
            )

    return {
        "changed":
            bool(
                removed
            ),
        "removedStageOwnedWrappers":
            removed,
        "method":
            "runtime-heading-only",
        "runtimeValidation":
            "HOMEPAGE AND FEATURE RUNTIME PREFLIGHT",
    }


def patch_launch_audit_settle() -> dict[str, object]:
    path = (
        ROOT
        / "scripts/launch-audit.mjs"
    )

    source = path.read_text(
        encoding="utf-8"
    )

    marker = '''                    await page.waitForTimeout(
                        180,
                    );'''

    replacement = '''                    if (
                        route
                        === "/features"
                    ) {
                        await page
                            .locator(
                                "h1",
                            )
                            .first()
                            .waitFor({
                                state:
                                    "attached",
                                timeout:
                                    5_000,
                            })
                            .catch(
                                () => {},
                            );
                    }

                    await page
                        .waitForFunction(
                            () =>
                                [
                                    ...document.images,
                                ].every(
                                    (
                                        image,
                                    ) =>
                                        image.complete,
                                ),
                            undefined,
                            {
                                timeout:
                                    5_000,
                            },
                        )
                        .catch(
                            () => {},
                        );

                    await page.waitForTimeout(
                        120,
                    );'''

    if replacement in source:
        return {
            "path":
                str(
                    path.relative_to(
                        ROOT
                    )
                ),
            "changed":
                False,
            "method":
                "settled-render-audit-already-installed",
        }

    if source.count(
        marker
    ) != 1:
        raise RuntimeError(
            "Could not locate the unique launch-audit settle point."
        )

    source = source.replace(
        marker,
        replacement,
        1,
    )

    required_checks = [
        "result.h1Count",
        "result.brokenImages",
        "result.pageErrors",
        "result.githubRequests",
        "limits.transferBytes",
        "initialFeatureShardRequests",
    ]

    missing_checks = [
        check
        for check
        in required_checks
        if check not in source
    ]

    if missing_checks:
        raise RuntimeError(
            "Launch-audit quality checks were unexpectedly lost: "
            + ", ".join(
                missing_checks
            )
        )

    path.write_text(
        source,
        encoding="utf-8",
    )

    return {
        "path":
            str(
                path.relative_to(
                    ROOT
                )
            ),
        "changed":
            True,
        "method":
            "settled-render-audit",
        "featuresH1WaitMs":
            5_000,
        "imageCompletionWaitMs":
            5_000,
        "qualityChecksPreserved":
            required_checks,
    }


def patch_release_verifier() -> dict[str, object]:
    path = (
        ROOT
        / "scripts/verify-release.mjs"
    )

    source = path.read_text(
        encoding="utf-8"
    )

    message = (
        "Prepared release Canopy artwork is missing."
    )

    if message not in source:
        return {
            "path":
                str(
                    path.relative_to(
                        ROOT
                    )
                ),
            "changed":
                False,
            "reason":
                "obsolete-artwork-assertion-already-absent",
        }

    message_position = source.find(
        message
    )

    start = source.rfind(
        "assert(",
        0,
        message_position,
    )

    end = source.find(
        ");",
        message_position,
    )

    if (
        start < 0
        or end < 0
    ):
        raise RuntimeError(
            "Could not isolate the obsolete Canopy artwork assertion."
        )

    end += len(
        ");"
    )

    block = source[
        start:
        end
    ]

    if (
        message not in block
        or "canopy-banner.jpg"
        not in block
        or "existsSync" not in block
    ):
        raise RuntimeError(
            "The located release assertion was not the expected Canopy artwork check."
        )

    before = source[
        :start
    ].rstrip()

    after = source[
        end:
    ].lstrip(
        "\n"
    )

    source = (
        before
        + "\n\n"
        + after
    )

    if (
        message in source
        or (
            "canopy-banner.jpg"
            in source
            and "Prepared release Canopy artwork"
            in source
        )
    ):
        raise RuntimeError(
            "The obsolete Canopy artwork assertion remains in release verification."
        )

    path.write_text(
        source,
        encoding="utf-8",
    )

    return {
        "path":
            str(
                path.relative_to(
                    ROOT
                )
            ),
        "changed":
            True,
        "removedAssertion":
            message,
        "remainingIntegrityAssertions":
            source.count(
                "assert("
            ),
    }


def patch_package_scripts() -> dict[str, str]:
    path = ROOT / "package.json"
    package = json.loads(
        path.read_text(
            encoding="utf-8"
        )
    )

    scripts = package.setdefault(
        "scripts",
        {},
    )

    scripts["archive:build"] = (
        "python3 scripts/build_github_archive.py"
    )

    scripts["delivery:build"] = (
        "python3 scripts/build_delivery_manifest.py "
        "&& python3 scripts/augment_delivery_manifest.py"
    )

    scripts["archive:verify-media"] = (
        "python3 scripts/verify_archive_media.py "
        "--archive-root lib/data/generated/archive "
        "--media-root public/_archive-media/contributors"
    )

    for name in [
        "quality",
        "launch:certify",
    ]:
        value = scripts.get(name, "")

        if not value:
            continue

        if "archive:build" not in value:
            if (
                "npm run features:build"
                in value
            ):
                value = value.replace(
                    "npm run features:build",
                    (
                        "npm run archive:build "
                        "&& npm run archive:verify-media "
                        "&& npm run features:build"
                    ),
                    1,
                )
            else:
                value = (
                    "npm run archive:build "
                    "&& npm run archive:verify-media "
                    "&& "
                    + value
                )
        elif (
            "archive:verify-media"
            not in value
        ):
            value = value.replace(
                "npm run archive:build",
                (
                    "npm run archive:build "
                    "&& npm run archive:verify-media"
                ),
                1,
            )

        scripts[name] = value

    if (
        "quality:splus"
        not in scripts
    ):
        scripts["quality:splus"] = (
            "npm run launch:certify "
            "&& npm run visual:check"
        )

    path.write_text(
        json.dumps(
            package,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    return {
        "archive:build": scripts[
            "archive:build"
        ],
        "delivery:build": scripts[
            "delivery:build"
        ],
        "archive:verify-media": scripts[
            "archive:verify-media"
        ],
        "launch:certify": scripts.get(
            "launch:certify",
            "",
        ),
    }


def patch_workflows() -> list[str]:
    changed = []

    workflow_root = (
        ROOT
        / ".github/workflows"
    )

    for path in workflow_root.glob(
        "*.yml"
    ):
        source = path.read_text(
            encoding="utf-8"
        )

        if (
            "npm run build"
            not in source
        ):
            continue

        build_line = re.search(
            r"(?m)^(?P<indent>[ \t]+)run:\s*npm run build\s*$",
            source,
        )

        if not build_line:
            continue

        run_indent = build_line.group(
            "indent"
        )

        if len(
            run_indent
        ) < 2:
            raise RuntimeError(
                f"Could not determine the build-step indentation in {path}."
            )

        step_indent = run_indent[
            :-2
        ]

        if (
            "npm run archive:build"
            in source
            and "npm run archive:verify-media"
            in source
        ):
            continue

        prefix = source[
            :build_line.start()
        ]

        candidate = (
            "\n"
            + step_indent
            + "- "
        )

        step_start = prefix.rfind(
            candidate
        )

        if step_start >= 0:
            step_start += 1
        elif source.startswith(
            step_indent
            + "- "
        ):
            step_start = 0
        else:
            raise RuntimeError(
                f"Could not locate the beginning of the build step in {path}."
            )

        insertion_parts = []

        if (
            "npm run archive:build"
            not in source
        ):
            insertion_parts.append(
                step_indent
                + "- name: Capture ForestOfLight archive\n"
                + run_indent
                + "run: npm run archive:build\n"
            )

        if (
            "npm run archive:verify-media"
            not in source
        ):
            insertion_parts.append(
                step_indent
                + "- name: Verify archive contributor media\n"
                + run_indent
                + "run: npm run archive:verify-media\n"
            )

        insertion = (
            "\n".join(
                insertion_parts
            )
            + "\n"
        )

        source = (
            source[
                :step_start
            ]
            + insertion
            + source[
                step_start:
            ]
        )

        path.write_text(
            source,
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


def main() -> None:
    report = {
        "navigation": patch_navigation(),
        "canopy": remove_canopy_banner(),
        "featuresHeading": patch_features_heading(),
        "launchAudit": patch_launch_audit_settle(),
        "releaseVerifier": patch_release_verifier(),
        "scripts": patch_package_scripts(),
        "workflows": patch_workflows(),
    }

    (
        ROOT
        / ".stage33/source-patch.json"
    ).write_text(
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


if __name__ == "__main__":
    main()
