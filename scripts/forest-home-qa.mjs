import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
    chromium,
} from "playwright";

const baseUrl =
    process.argv[2]
    ?? "http://127.0.0.1:4010";

const reportDirectory =
    process.argv[3]
    ?? ".design-reports/forest-home-browser";

const routes = [
    "/",
    "/projects/canopy",
    "/archive/canopy",
    "/docs/canopy",
    "/features",
    "/search",
    "/status",
];

const profiles = [
    {
        name: "desktop",
        width: 1440,
        height: 1000,
        reducedMotion:
            "no-preference",
    },
    {
        name: "laptop",
        width: 1180,
        height: 820,
        reducedMotion:
            "no-preference",
    },
    {
        name: "tablet",
        width: 820,
        height: 1180,
        reducedMotion:
            "no-preference",
    },
    {
        name: "mobile",
        width: 390,
        height: 844,
        reducedMotion:
            "no-preference",
    },
    {
        name: "reduced-motion",
        width: 1280,
        height: 900,
        reducedMotion:
            "reduce",
    },
];

await fs.mkdir(
    reportDirectory,
    {
        recursive: true,
    },
);

const browser =
    await chromium.launch(
        {
            headless: true,
        },
    );

const results = [];

try {
    for (
        const profile
        of profiles
    ) {
        for (
            const route
            of routes
        ) {
            const context =
                await browser.newContext(
                    {
                        viewport: {
                            width:
                                profile.width,
                            height:
                                profile.height,
                        },
                        reducedMotion:
                            profile.reducedMotion,
                        deviceScaleFactor:
                            1,
                    },
                );

            const page =
                await context.newPage();

            const consoleErrors = [];
            const pageErrors = [];
            const failedRequests = [];

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
                        error.message,
                    );
                },
            );

            page.on(
                "requestfailed",
                (
                    request,
                ) => {
                    failedRequests.push(
                        {
                            url:
                                request.url(),
                            failure:
                                request
                                    .failure()
                                    ?.errorText
                                ?? "unknown",
                        },
                    );
                },
            );

            const response =
                await page.goto(
                    `${baseUrl}${route}`,
                    {
                        waitUntil:
                            "networkidle",
                        timeout:
                            60_000,
                    },
                );

            const status =
                response?.status()
                ?? 0;

            await page.evaluate(
                async () => {
                    await document
                        .fonts
                        .ready;

                    const maximum =
                        document
                            .documentElement
                            .scrollHeight
                        - window
                            .innerHeight;

                    const steps = 7;

                    for (
                        let index = 0;
                        index <= steps;
                        index += 1
                    ) {
                        window.scrollTo(
                            0,
                            Math.round(
                                maximum
                                * index
                                / steps,
                            ),
                        );

                        await new Promise(
                            (
                                resolve,
                            ) =>
                                setTimeout(
                                    resolve,
                                    70,
                                ),
                        );
                    }

                    window.scrollTo(
                        0,
                        0,
                    );
                },
            );

            const audit =
                await page.evaluate(
                    (
                        currentRoute,
                    ) => {
                        const duplicateIds =
                            [
                                ...document
                                    .querySelectorAll(
                                        "[id]",
                                    ),
                            ]
                                .map(
                                    (
                                        element,
                                    ) =>
                                        element.id,
                                )
                                .filter(
                                    (
                                        id,
                                        index,
                                        values,
                                    ) =>
                                        values.indexOf(
                                            id,
                                        )
                                        !== index,
                                );

                        const headings =
                            [
                                ...document
                                    .querySelectorAll(
                                        "h1,h2,h3,h4,h5,h6",
                                    ),
                            ].map(
                                (
                                    heading,
                                ) =>
                                    Number(
                                        heading
                                            .tagName
                                            .slice(
                                                1,
                                            ),
                                    ),
                            );

                        const headingSkips = [];

                        for (
                            let index = 1;
                            index
                            < headings.length;
                            index += 1
                        ) {
                            if (
                                headings[index]
                                - headings[
                                    index - 1
                                ]
                                > 1
                            ) {
                                headingSkips.push(
                                    {
                                        from:
                                            headings[
                                                index
                                                - 1
                                            ],
                                        to:
                                            headings[
                                                index
                                            ],
                                    },
                                );
                            }
                        }

                        const root =
                            document.querySelector(
                                "main[data-forest-home]",
                            );

                        const homepage =
                            currentRoute
                            === "/";

                        const capabilityButtons =
                            [
                                ...document
                                    .querySelectorAll(
                                        "[data-capability-control] button",
                                    ),
                            ];

                        const smallCapabilityTargets =
                            capabilityButtons
                                .map(
                                    (
                                        button,
                                    ) => {
                                        const rectangle =
                                            button
                                                .getBoundingClientRect();

                                        return {
                                            width:
                                                rectangle.width,
                                            height:
                                                rectangle.height,
                                        };
                                    },
                                )
                                .filter(
                                    (
                                        target,
                                    ) =>
                                        target.height
                                        < 44
                                        || target.width
                                        < 44,
                                );

                        const brokenHomepageImages =
                            homepage
                                ? [
                                      ...document
                                          .images,
                                  ]
                                      .filter(
                                          (
                                              image,
                                          ) =>
                                              image.complete
                                              && image.naturalWidth
                                                  === 0,
                                      )
                                      .map(
                                          (
                                              image,
                                          ) =>
                                              image.currentSrc
                                              || image.src,
                                      )
                                : [];

                        const links =
                            [
                                ...document
                                    .querySelectorAll(
                                        "a[href]",
                                    ),
                            ].map(
                                (
                                    link,
                                ) =>
                                    link.getAttribute(
                                        "href",
                                    ),
                            );

                        const essentialLinks =
                            [
                                "/projects/canopy",
                                "/features",
                                "/docs",
                                "/archive",
                                "/search",
                                "/status",
                            ];

                        return {
                            homepage,
                            h1Count:
                                document
                                    .querySelectorAll(
                                        "h1",
                                    )
                                    .length,
                            repositoryRows:
                                document
                                    .querySelectorAll(
                                        "[data-forest-project-row]",
                                    )
                                    .length,
                            capabilityButtons:
                                capabilityButtons.length,
                            pressedCapabilities:
                                document
                                    .querySelectorAll(
                                        '[data-capability-control] button[aria-pressed="true"]',
                                    )
                                    .length,
                            legacyHomeCount:
                                document
                                    .querySelectorAll(
                                        "[data-stage37-home], [data-ecosystem-showcase]",
                                    )
                                    .length,
                            horizontalOverflow:
                                document
                                    .documentElement
                                    .scrollWidth
                                - document
                                    .documentElement
                                    .clientWidth,
                            duplicateIds,
                            headingSkips,
                            smallCapabilityTargets,
                            brokenHomepageImages,
                            missingEssentialLinks:
                                homepage
                                    ? essentialLinks.filter(
                                          (
                                              href,
                                          ) =>
                                              !links.includes(
                                                  href,
                                              ),
                                      )
                                    : [],
                            fontFamily:
                                root
                                    ? getComputedStyle(
                                          root,
                                      ).fontFamily
                                    : getComputedStyle(
                                          document.body,
                                      ).fontFamily,
                            reducedMotion:
                                window.matchMedia(
                                    "(prefers-reduced-motion: reduce)",
                                ).matches,
                        };
                    },
                    route,
                );

            if (
                route === "/"
            ) {
                const buttons =
                    page.locator(
                        "[data-capability-control] button",
                    );

                for (
                    let index = 0;
                    index < 6;
                    index += 1
                ) {
                    await buttons
                        .nth(
                            index,
                        )
                        .click();

                    const pressed =
                        await buttons
                            .nth(
                                index,
                            )
                            .getAttribute(
                                "aria-pressed",
                            );

                    if (
                        pressed
                        !== "true"
                    ) {
                        throw new Error(
                            `${profile.name}: capability ${index + 1} did not activate`,
                        );
                    }
                }

                await buttons
                    .first()
                    .click();

                if (
                    profile.name
                    === "desktop"
                    || profile.name
                    === "mobile"
                ) {
                    await page.screenshot(
                        {
                            path:
                                path.join(
                                    reportDirectory,
                                    `${profile.name}.png`,
                                ),
                            fullPage:
                                true,
                        },
                    );
                }
            }

            const passed =
                status >= 200
                && status < 400
                && audit.horizontalOverflow
                    <= 1
                && audit.duplicateIds
                    .length
                    === 0
                && consoleErrors.length
                    === 0
                && pageErrors.length
                    === 0
                && failedRequests.length
                    === 0
                && (
                    !audit.homepage
                    || (
                        audit.h1Count
                            === 1
                        && audit.repositoryRows
                            === 15
                        && audit.capabilityButtons
                            === 6
                        && audit.pressedCapabilities
                            === 1
                        && audit.legacyHomeCount
                            === 0
                        && audit.smallCapabilityTargets
                            .length
                            === 0
                        && audit.brokenHomepageImages
                            .length
                            === 0
                        && audit.missingEssentialLinks
                            .length
                            === 0
                        && audit.fontFamily
                            .toLowerCase()
                            .includes(
                                "geist",
                            )
                    )
                );

            results.push(
                {
                    profile:
                        profile.name,
                    route,
                    status,
                    passed,
                    audit,
                    consoleErrors,
                    pageErrors,
                    failedRequests,
                },
            );

            await context.close();
        }
    }
} finally {
    await browser.close();
}

const report = {
    generatedAt:
        new Date()
            .toISOString(),
    baseUrl,
    passed:
        results.every(
            (
                result,
            ) =>
                result.passed,
        ),
    results,
};

await fs.writeFile(
    path.join(
        reportDirectory,
        "browser-qa.json",
    ),
    `${JSON.stringify(
        report,
        null,
        2,
    )}\n`,
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
    !report.passed
) {
    process.exitCode = 1;
} else {
    console.log(
        "FOREST HOME BROWSER QA: PASS",
    );
}
