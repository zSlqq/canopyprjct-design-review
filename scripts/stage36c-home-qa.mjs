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
    || "http://127.0.0.1:3127";
const output =
    process.env.STAGE36_QA_OUTPUT
    || path.join(
        process.cwd(),
        ".stage36-reports",
        "stage36c-browser-qa",
    );

fs.mkdirSync(
    output,
    {
        recursive: true,
    },
);

const playwright =
    await loadPlaywright();
const browser =
    await playwright.chromium.launch({
        headless: true,
    });

const profiles = [
    {
        name: "desktop",
        viewport: {
            width: 1440,
            height: 1000,
        },
        isMobile: false,
        hasTouch: false,
        reducedMotion: "no-preference",
    },
    {
        name: "tablet",
        viewport: {
            width: 820,
            height: 1180,
        },
        isMobile: false,
        hasTouch: true,
        reducedMotion: "no-preference",
    },
    {
        name: "mobile",
        viewport: {
            width: 390,
            height: 844,
        },
        isMobile: true,
        hasTouch: true,
        reducedMotion: "no-preference",
    },
    {
        name: "reduced-motion",
        viewport: {
            width: 1280,
            height: 900,
        },
        isMobile: false,
        hasTouch: false,
        reducedMotion: "reduce",
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
            viewport: profile.viewport,
            isMobile: profile.isMobile,
            hasTouch: profile.hasTouch,
            reducedMotion: profile.reducedMotion,
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
                String(error),
            );
        },
    );

    const response =
        await page.goto(
            baseUrl,
            {
                waitUntil: "networkidle",
                timeout: 90000,
            },
        );
    const status =
        response?.status()
        ?? 0;

    const measurements =
        await page.evaluate(
            () => {
                const visible = (
                    element,
                ) => {
                    const style =
                        window.getComputedStyle(
                            element,
                        );

                    return style.display
                        !== "none"
                        && style.visibility
                        !== "hidden"
                        && element.getClientRects().length
                        > 0;
                };

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
                const headings =
                    [
                        ...document.querySelectorAll(
                            "h1, h2, h3, h4, h5, h6",
                        ),
                    ]
                        .filter(visible)
                        .map(
                            (
                                heading,
                            ) => ({
                                level: Number(
                                    heading.tagName.slice(1),
                                ),
                                text:
                                    heading.textContent
                                        ?.trim()
                                    ?? "",
                            }),
                        );
                const headingJumps = [];

                for (
                    let index = 1;
                    index < headings.length;
                    index += 1
                ) {
                    if (
                        headings[index].level
                        - headings[index - 1].level
                        > 1
                    ) {
                        headingJumps.push({
                            from:
                                headings[index - 1],
                            to:
                                headings[index],
                        });
                    }
                }

                const brokenImages =
                    [
                        ...document.images,
                    ]
                        .filter(
                            (
                                image,
                            ) =>
                                !image.complete
                                || image.naturalWidth
                                    === 0,
                        )
                        .map(
                            (
                                image,
                            ) =>
                                image.currentSrc
                                || image.src,
                        );

                return {
                    heroCount:
                        document.querySelectorAll(
                            "[data-stage36-hero]",
                        ).length,
                    projectCount:
                        document.querySelectorAll(
                            "[data-stage36-project-row]",
                        ).length,
                    storyCount:
                        document.querySelectorAll(
                            "[data-stage36-story]",
                        ).length,
                    storyRootCount:
                        document.querySelectorAll(
                            "[data-stage36-project-stories]",
                        ).length,
                    legacyCount:
                        document.querySelectorAll(
                            "[data-stage36-legacy-home]",
                        ).length,
                    visibleFooterCount:
                        [
                            ...document.querySelectorAll(
                                "footer",
                            ),
                        ].filter(visible).length,
                    h1Count:
                        [
                            ...document.querySelectorAll(
                                "h1",
                            ),
                        ].filter(visible).length,
                    overflow:
                        document.documentElement.scrollWidth
                        - document.documentElement.clientWidth,
                    duplicateIds:
                        ids.filter(
                            (
                                id,
                                index,
                            ) =>
                                ids.indexOf(id)
                                !== index,
                        ),
                    headingJumps,
                    brokenImages,
                };
            },
        );

    const expected = {
        heroCount: 1,
        projectCount: 15,
        storyCount: 6,
        storyRootCount: 1,
        legacyCount: 0,
        visibleFooterCount: 1,
        h1Count: 1,
    };

    for (
        const [
            key,
            value,
        ]
        of Object.entries(
            expected,
        )
    ) {
        if (
            measurements[key]
            !== value
        ) {
            failures.push(
                `${profile.name}: ${key} expected ${value}, found ${measurements[key]}`,
            );
        }
    }

    if (
        status
        !== 200
    ) {
        failures.push(
            `${profile.name}: homepage status ${status}`,
        );
    }

    if (
        measurements.overflow
        > 1
    ) {
        failures.push(
            `${profile.name}: horizontal overflow ${measurements.overflow}px`,
        );
    }

    if (
        measurements.duplicateIds.length
    ) {
        failures.push(
            `${profile.name}: duplicate ids ${measurements.duplicateIds.join(", ")}`,
        );
    }

    if (
        measurements.headingJumps.length
    ) {
        failures.push(
            `${profile.name}: heading-level jumps ${JSON.stringify(measurements.headingJumps)}`,
        );
    }

    if (
        measurements.brokenImages.length
    ) {
        failures.push(
            `${profile.name}: broken images ${measurements.brokenImages.join(" | ")}`,
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

    const screenshot =
        path.join(
            output,
            `${profile.name}.png`,
        );

    await page.screenshot({
        path: screenshot,
        fullPage: true,
    });

    reports.push({
        profile: profile.name,
        status,
        ...measurements,
        consoleErrors,
        pageErrors,
        screenshot,
    });

    await context.close();
}

const routeChecks = [];

for (
    const route
    of [
        "/projects/canopy",
        "/archive/canopy",
        "/docs/canopy",
        "/features",
        "/search",
    ]
) {
    const response =
        await fetch(
            `${baseUrl}${route}`,
        );
    const status =
        response.status;

    routeChecks.push({
        route,
        status,
    });

    if (
        status
        !== 200
    ) {
        failures.push(
            `route ${route}: status ${status}`,
        );
    }
}

await browser.close();

const report = {
    schemaVersion: 1,
    baseUrl,
    profiles: reports,
    routeChecks,
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
    process.exit(1);
}
