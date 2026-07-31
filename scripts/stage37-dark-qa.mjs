"use strict";

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

async function loadPlaywright() {
    for (const moduleName of ["playwright", "@playwright/test"]) {
        try {
            const loaded = await import(moduleName);
            if (loaded.chromium) {
                return loaded;
            }
        }
        catch {
            // Try the next installed package.
        }
    }

    throw new Error("Neither playwright nor @playwright/test is installed.");
}

const baseUrl =
    process.env.STAGE37_BASE_URL
    || "http://127.0.0.1:3130";

const output =
    process.env.STAGE37_QA_OUTPUT
    || path.join(
        process.cwd(),
        ".stage37-reports",
        "dark-editorial-qa",
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
        reducedMotion: "no-preference",
    },
    {
        name: "laptop",
        viewport: {
            width: 1280,
            height: 800,
        },
        reducedMotion: "no-preference",
    },
    {
        name: "tablet",
        viewport: {
            width: 768,
            height: 1024,
        },
        reducedMotion: "no-preference",
        hasTouch: true,
    },
    {
        name: "mobile",
        viewport: {
            width: 390,
            height: 844,
        },
        reducedMotion: "no-preference",
        isMobile: true,
        hasTouch: true,
    },
    {
        name: "reduced-motion",
        viewport: {
            width: 1440,
            height: 1000,
        },
        reducedMotion: "reduce",
    },
];

const routes = [
    "/",
    "/projects/canopy",
    "/archive",
    "/archive/canopy",
    "/docs",
    "/docs/canopy",
    "/features",
    "/search",
    "/status",
];

const failures = [];
const reports = [];

function luminance(
    red,
    green,
    blue,
) {
    const values =
        [
            red,
            green,
            blue,
        ].map(
            (
                value,
            ) => {
                const normalized =
                    value
                    / 255;

                return normalized
                    <= 0.03928
                    ? normalized
                        / 12.92
                    : (
                        (
                            normalized
                            + 0.055
                        )
                        / 1.055
                    ) ** 2.4;
            },
        );

    return (
        0.2126
        * values[0]
        + 0.7152
        * values[1]
        + 0.0722
        * values[2]
    );
}

for (const profile of profiles) {
    const context =
        await browser.newContext({
            viewport: profile.viewport,
            reducedMotion: profile.reducedMotion,
            isMobile: profile.isMobile || false,
            hasTouch: profile.hasTouch || false,
        });

    for (const route of routes) {
        const page =
            await context.newPage();

        const consoleErrors = [];
        const pageErrors = [];
        const errorResponses = [];
        const failedRequests = [];

        page.on(
            "console",
            (
                message,
            ) => {
                if (
                    message.type()
                    === "error"
                    && !message.text().startsWith(
                        "Failed to load resource:",
                    )
                ) {
                    consoleErrors.push(
                        message.text(),
                    );
                }
            },
        );

        page.on(
            "response",
            (
                resourceResponse,
            ) => {
                if (
                    resourceResponse.status()
                    >= 400
                ) {
                    errorResponses.push({
                        status:
                            resourceResponse.status(),
                        url:
                            resourceResponse.url(),
                    });
                }
            },
        );

        page.on(
            "requestfailed",
            (
                request,
            ) => {
                failedRequests.push({
                    url:
                        request.url(),
                    error:
                        request.failure()?.errorText
                        || "request failed",
                });
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
                `${baseUrl}${route}`,
                {
                    waitUntil: "networkidle",
                    timeout: 90000,
                },
            );

        const status =
            response?.status()
            || 0;

        await page.evaluate(
            async () => {
                const pause =
                    (
                        milliseconds,
                    ) =>
                        new Promise(
                            (
                                resolve,
                            ) =>
                                window.setTimeout(
                                    resolve,
                                    milliseconds,
                                ),
                        );

                const height =
                    Math.max(
                        document.body.scrollHeight,
                        document.documentElement.scrollHeight,
                    );

                const step =
                    Math.max(
                        480,
                        Math.floor(
                            window.innerHeight
                            * 0.72,
                        ),
                    );

                for (
                    let position = 0;
                    position < height;
                    position += step
                ) {
                    window.scrollTo(
                        0,
                        position,
                    );
                    await pause(
                        70,
                    );
                }

                window.scrollTo(
                    0,
                    height,
                );
                await pause(
                    180,
                );

                const pending =
                    [
                        ...document.images,
                    ]
                        .filter(
                            (
                                image,
                            ) =>
                                !image.complete,
                        )
                        .map(
                            (
                                image,
                            ) =>
                                new Promise(
                                    (
                                        resolve,
                                    ) => {
                                        const finish =
                                            () =>
                                                resolve(
                                                    undefined,
                                                );

                                        image.addEventListener(
                                            "load",
                                            finish,
                                            {
                                                once: true,
                                            },
                                        );
                                        image.addEventListener(
                                            "error",
                                            finish,
                                            {
                                                once: true,
                                            },
                                        );
                                        window.setTimeout(
                                            finish,
                                            2500,
                                        );
                                    },
                                ),
                        );

                await Promise.all(
                    pending,
                );

                // Give client-side media fallbacks time to replace any
                // failed image nodes before the DOM audit runs.
                await pause(
                    420,
                );

                window.scrollTo(
                    0,
                    0,
                );
                await pause(
                    120,
                );
            },
        );

        const measurements =
            await page.evaluate(
                () => {
                    const parseColor =
                        (
                            value,
                        ) => {
                            const match =
                                value.match(
                                    /rgba?\(([^)]+)\)/,
                                );

                            if (!match) {
                                return null;
                            }

                            const channels =
                                match[1]
                                    .split(",")
                                    .map(
                                        (
                                            part,
                                        ) =>
                                            Number.parseFloat(
                                                part.trim(),
                                            ),
                                    );

                            return {
                                red:
                                    channels[0]
                                    || 0,
                                green:
                                    channels[1]
                                    || 0,
                                blue:
                                    channels[2]
                                    || 0,
                                alpha:
                                    channels.length
                                    > 3
                                        ? channels[3]
                                        : 1,
                            };
                        };

                    const visible =
                        (
                            element,
                        ) => {
                            const style =
                                getComputedStyle(
                                    element,
                                );

                            const rect =
                                element.getBoundingClientRect();

                            return (
                                style.display
                                !== "none"
                                && style.visibility
                                !== "hidden"
                                && Number.parseFloat(
                                    style.opacity,
                                )
                                > 0.01
                                && rect.width
                                > 1
                                && rect.height
                                > 1
                            );
                        };

                    const structural =
                        [
                            ...document.querySelectorAll(
                                "header, main, section, article, aside, footer, details, dialog, [role=dialog]",
                            ),
                        ]
                            .filter(
                                visible,
                            )
                            .map(
                                (
                                    element,
                                ) => {
                                    const style =
                                        getComputedStyle(
                                            element,
                                        );

                                    return {
                                        tag:
                                            element.tagName.toLowerCase(),
                                        className:
                                            typeof element.className
                                            === "string"
                                                ? element.className
                                                : "",
                                        background:
                                            style.backgroundColor,
                                        parsed:
                                            parseColor(
                                                style.backgroundColor,
                                            ),
                                    };
                                },
                            );

                    const lightSurfaces =
                        structural.filter(
                            (
                                entry,
                            ) => {
                                const color =
                                    entry.parsed;

                                if (
                                    !color
                                    || color.alpha
                                    < 0.72
                                ) {
                                    return false;
                                }

                                const max =
                                    Math.max(
                                        color.red,
                                        color.green,
                                        color.blue,
                                    );

                                const min =
                                    Math.min(
                                        color.red,
                                        color.green,
                                        color.blue,
                                    );

                                return (
                                    max
                                    > 205
                                    && min
                                    > 180
                                );
                            },
                        );

                    const bodyStyle =
                        getComputedStyle(
                            document.body,
                        );

                    const bodyColor =
                        parseColor(
                            bodyStyle.backgroundColor,
                        );

                    const header =
                        document.querySelector(
                            "body > div > header, body > header, main > header",
                        );

                    const headerStyle =
                        header
                            ? getComputedStyle(
                                header,
                            )
                            : null;

                    const headerColor =
                        headerStyle
                            ? parseColor(
                                headerStyle.backgroundColor,
                            )
                            : null;

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

                    const duplicateIds =
                        ids.filter(
                            (
                                id,
                                index,
                            ) =>
                                ids.indexOf(
                                    id,
                                )
                                !== index,
                        );

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
                        bodyColor,
                        headerColor,
                        lightSurfaces:
                            lightSurfaces
                                .slice(
                                    0,
                                    20,
                                ),
                        lightSurfaceCount:
                            lightSurfaces.length,
                        overflow:
                            document.documentElement.scrollWidth
                            - document.documentElement.clientWidth,
                        duplicateIds,
                        brokenImages,
                        stage37Home:
                            document.querySelectorAll(
                                "[data-stage37-home]",
                            ).length,
                        stage37Hero:
                            document.querySelectorAll(
                                "[data-stage37-hero]",
                            ).length,
                        heroText:
                            (
                                document.querySelector(
                                    "[data-stage37-hero] h1",
                                )?.textContent
                                || ""
                            ).trim(),
                        projectRows:
                            document.querySelectorAll(
                                "[data-stage37-project-row]",
                            ).length,
                        legacyHero:
                            document.querySelectorAll(
                                "[data-stage36-hero]",
                            ).length,
                        legacyStories:
                            document.querySelectorAll(
                                "[data-stage36-story]",
                            ).length,
                        homeImages:
                            document.querySelectorAll(
                                "[data-stage37-home] img",
                            ).length,
                        knownBrokenMediaNodes:
                            [
                                ...document.images,
                            ].filter(
                                (
                                    image,
                                ) =>
                                    (
                                        image.currentSrc
                                        || image.src
                                        || ""
                                    ).endsWith(
                                        "/6170169d0da576b8e6cfa262.jpg",
                                    ),
                            ).length,
                        mediaFallbackNotes:
                            document.querySelectorAll(
                                "[data-stage37-unavailable-media]",
                            ).length,
                        projectHeroGalleryVisible:
                            [
                                ...document.querySelectorAll(
                                    "[data-project-detail] > section:first-of-type [data-project-gallery]",
                                ),
                            ].some(
                                visible,
                            ),
                    };
                },
            );

        const darkBody =
            measurements.bodyColor
            && luminance(
                measurements.bodyColor.red,
                measurements.bodyColor.green,
                measurements.bodyColor.blue,
            )
            < 0.04;

        const darkHeader =
            !measurements.headerColor
            || luminance(
                measurements.headerColor.red,
                measurements.headerColor.green,
                measurements.headerColor.blue,
            )
            < 0.08;

        if (
            status
            !== 200
        ) {
            failures.push(
                `${profile.name} ${route}: status ${status}`,
            );
        }

        if (
            !darkBody
        ) {
            failures.push(
                `${profile.name} ${route}: body is not dark`,
            );
        }

        if (
            !darkHeader
        ) {
            failures.push(
                `${profile.name} ${route}: header is not dark`,
            );
        }

        if (
            measurements.lightSurfaceCount
            > 0
        ) {
            const samples =
                measurements.lightSurfaces
                    .slice(
                        0,
                        6,
                    )
                    .map(
                        (
                            surface,
                        ) =>
                            `${surface.tag}.${surface.className || "(no-class)"}=${surface.background}`,
                    )
                    .join(
                        " | ",
                    );

            failures.push(
                `${profile.name} ${route}: ${measurements.lightSurfaceCount} visible light structural surfaces (${samples})`,
            );
        }

        if (
            measurements.overflow
            > 1
        ) {
            failures.push(
                `${profile.name} ${route}: horizontal overflow ${measurements.overflow}px`,
            );
        }

        if (
            measurements.duplicateIds.length
        ) {
            failures.push(
                `${profile.name} ${route}: duplicate ids ${measurements.duplicateIds.join(", ")}`,
            );
        }

        if (
            measurements.brokenImages.length
        ) {
            failures.push(
                `${profile.name} ${route}: broken images ${measurements.brokenImages.join(" | ")}`,
            );
        }

        if (
            measurements.knownBrokenMediaNodes
            > 0
        ) {
            failures.push(
                `${profile.name} ${route}: certified corrupt media still produced ${measurements.knownBrokenMediaNodes} image node(s)`,
            );
        }

        if (
            route
            === "/docs/canopy"
            && measurements.mediaFallbackNotes
            < 1
        ) {
            failures.push(
                `${profile.name} ${route}: deterministic media fallback note is missing`,
            );
        }

        if (
            route
            === "/"
        ) {
            if (
                measurements.stage37Home
                !== 1
            ) {
                failures.push(
                    `${profile.name}: expected one Stage 37 homepage`,
                );
            }

            if (
                measurements.stage37Hero
                !== 1
            ) {
                failures.push(
                    `${profile.name}: expected one Stage 37 hero`,
                );
            }

            if (
                measurements.heroText
                !== "The technical layer for Bedrock."
            ) {
                failures.push(
                    `${profile.name}: unexpected hero text ${measurements.heroText}`,
                );
            }

            if (
                measurements.projectRows
                !== 15
            ) {
                failures.push(
                    `${profile.name}: expected 15 project rows, found ${measurements.projectRows}`,
                );
            }

            if (
                measurements.legacyHero
                !== 0
                || measurements.legacyStories
                !== 0
            ) {
                failures.push(
                    `${profile.name}: legacy Stage 36 homepage remains visible`,
                );
            }

            if (
                measurements.homeImages
                !== 0
            ) {
                failures.push(
                    `${profile.name}: homepage contains ${measurements.homeImages} image widgets`,
                );
            }
        }

        if (
            route
            === "/projects/canopy"
            && measurements.projectHeroGalleryVisible
        ) {
            failures.push(
                `${profile.name}: Canopy project hero still contains a gallery widget`,
            );
        }

        if (
            errorResponses.length
        ) {
            failures.push(
                `${profile.name} ${route}: HTTP errors ${errorResponses.map(
                    (
                        item,
                    ) =>
                        `${item.status} ${item.url}`,
                ).join(" | ")}`,
            );
        }

        if (
            failedRequests.length
        ) {
            failures.push(
                `${profile.name} ${route}: failed requests ${failedRequests.map(
                    (
                        item,
                    ) =>
                        `${item.error} ${item.url}`,
                ).join(" | ")}`,
            );
        }

        if (
            consoleErrors.length
        ) {
            failures.push(
                `${profile.name} ${route}: console errors ${consoleErrors.join(" | ")}`,
            );
        }

        if (
            pageErrors.length
        ) {
            failures.push(
                `${profile.name} ${route}: page errors ${pageErrors.join(" | ")}`,
            );
        }

        const safeRoute =
            route
                === "/"
                ? "home"
                : route
                    .replace(
                        /^\//,
                        "",
                    )
                    .replaceAll(
                        "/",
                        "-",
                    );

        const screenshot =
            path.join(
                output,
                `${profile.name}-${safeRoute}.png`,
            );

        await page.screenshot({
            path: screenshot,
            fullPage: true,
        });

        reports.push({
            profile:
                profile.name,
            route,
            status,
            measurements,
            errorResponses,
            failedRequests,
            consoleErrors,
            pageErrors,
            screenshot,
        });

        await page.close();
    }

    await context.close();
}

await browser.close();

const report = {
    schemaVersion: 1,
    baseUrl,
    profiles: reports,
    failures,
    passed: failures.length === 0,
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
