"use strict";

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

async function loadPlaywright() {
    for (
        const moduleName
        of [
            "playwright",
            "@playwright/test",
        ]
    ) {
        try {
            const loaded =
                await import(
                    moduleName
                );

            if (
                loaded.chromium
            ) {
                return loaded;
            }
        }
        catch {
            // Try the next installed package.
        }
    }

    throw new Error(
        "Neither playwright nor @playwright/test is installed.",
    );
}

const baseUrl =
    process.env.STAGE36_BASE_URL
    || "http://127.0.0.1:3126";

const output =
    process.env.STAGE36_QA_OUTPUT
    || path.join(
        process.cwd(),
        ".stage36-reports",
        "browser-qa",
    );

fs.mkdirSync(
    output,
    {
        recursive:
            true,
    },
);

const playwright =
    await loadPlaywright();

const browser =
    await playwright.chromium.launch({
        headless:
            true,
    });

const profiles = [
    {
        name:
            "desktop",
        viewport: {
            width:
                1440,
            height:
                1000,
        },
        isMobile:
            false,
        hasTouch:
            false,
    },
    {
        name:
            "mobile",
        viewport: {
            width:
                390,
            height:
                844,
        },
        isMobile:
            true,
        hasTouch:
            true,
    },
];

const failures = [];
const reports = [];

for (
    const profile
    of profiles
) {
    const context =
        await browser.newContext({
            viewport:
                profile.viewport,
            isMobile:
                profile.isMobile,
            hasTouch:
                profile.hasTouch,
            reducedMotion:
                profile.name
                === "mobile"
                    ? "reduce"
                    : "no-preference",
        });

    const page =
        await context.newPage();

    const consoleErrors = [];
    const pageErrors = [];

    page.on(
        "console",
        (
            message,
        ) => {
            if (
                message.type()
                === "error"
            ) {
                consoleErrors.push(
                    message.text(),
                );
            }
        },
    );

    page.on(
        "pageerror",
        (
            error,
        ) => {
            pageErrors.push(
                String(
                    error,
                ),
            );
        },
    );

    const response =
        await page.goto(
            baseUrl,
            {
                waitUntil:
                    "networkidle",
                timeout:
                    90000,
            },
        );

    const status =
        response?.status()
        ?? 0;

    const heroCount =
        await page.locator(
            "[data-stage36-hero]",
        ).count();

    const tabCount =
        await page.locator(
            "[data-stage36-hero] [role=tab]",
        ).count();

    const projectCount =
        await page.locator(
            "[data-stage36-project-row]",
        ).count();

    const h1Count =
        await page.locator(
            "h1",
        ).count();

    const overflow =
        await page.evaluate(
            () =>
                document.documentElement.scrollWidth
                - document.documentElement.clientWidth,
        );

    const duplicateIds =
        await page.evaluate(
            () => {
                const ids =
                    [
                        ...document.querySelectorAll(
                            "[id]",
                        ),
                    ].map(
                        (
                            element,
                        ) =>
                            element.id,
                    );

                return ids.filter(
                    (
                        id,
                        index,
                    ) =>
                        ids.indexOf(
                            id,
                        )
                        !== index,
                );
            },
        );

    if (
        status
        !== 200
    ) {
        failures.push(
            `${profile.name}: homepage status ${status}`,
        );
    }

    if (
        heroCount
        !== 1
    ) {
        failures.push(
            `${profile.name}: expected one Stage 36 hero, found ${heroCount}`,
        );
    }

    if (
        tabCount
        !== 6
    ) {
        failures.push(
            `${profile.name}: expected six capability tabs, found ${tabCount}`,
        );
    }

    if (
        projectCount
        !== 15
    ) {
        failures.push(
            `${profile.name}: expected fifteen repository rows, found ${projectCount}`,
        );
    }

    if (
        h1Count
        !== 1
    ) {
        failures.push(
            `${profile.name}: expected one h1, found ${h1Count}`,
        );
    }

    if (
        overflow
        > 1
    ) {
        failures.push(
            `${profile.name}: horizontal overflow ${overflow}px`,
        );
    }

    if (
        duplicateIds.length
    ) {
        failures.push(
            `${profile.name}: duplicate ids ${duplicateIds.join(", ")}`,
        );
    }

    if (
        consoleErrors.length
    ) {
        failures.push(
            `${profile.name}: console errors ${consoleErrors.join(" | ")}`,
        );
    }

    if (
        pageErrors.length
    ) {
        failures.push(
            `${profile.name}: page errors ${pageErrors.join(" | ")}`,
        );
    }

    const tabs =
        page.locator(
            "[data-stage36-hero] [role=tab]",
        );

    for (
        let index = 0;
        index < 6;
        index += 1
    ) {
        await tabs.nth(
            index,
        ).click();

        const selected =
            await tabs.nth(
                index,
            ).getAttribute(
                "aria-selected",
            );

        if (
            selected
            !== "true"
        ) {
            failures.push(
                `${profile.name}: tab ${index + 1} did not become selected`,
            );
        }
    }

    const search =
        page.locator(
            "#stage36-project-search",
        );

    await search.fill(
        "Canopy",
    );

    const filteredCount =
        await page.locator(
            "[data-stage36-project-row]",
        ).count();

    if (
        filteredCount
        < 1
    ) {
        failures.push(
            `${profile.name}: project search returned no Canopy result`,
        );
    }

    await search.fill(
        "",
    );

    const screenshot =
        path.join(
            output,
            `${profile.name}.png`,
        );

    await page.screenshot({
        path:
            screenshot,
        fullPage:
            true,
    });

    reports.push({
        profile:
            profile.name,
        status,
        heroCount,
        tabCount,
        projectCount,
        h1Count,
        overflow,
        duplicateIds,
        consoleErrors,
        pageErrors,
        screenshot,
    });

    await context.close();
}

await browser.close();

const report = {
    schemaVersion:
        1,
    baseUrl,
    profiles:
        reports,
    failures,
    passed:
        failures.length
        === 0,
};

fs.writeFileSync(
    path.join(
        output,
        "report.json",
    ),
    JSON.stringify(
        report,
        null,
        2,
    )
    + "\n",
    "utf8",
);

console.log(
    JSON.stringify(
        report,
        null,
        2,
    ),
);

if (
    failures.length
) {
    process.exit(
        1,
    );
}
