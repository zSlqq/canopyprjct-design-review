import {
    createWriteStream,
    readFileSync,
    writeFileSync,
} from "node:fs";

import {
    createServer,
} from "node:net";

import {
    join,
} from "node:path";

import {
    spawn,
} from "node:child_process";

import {
    chromium,
} from "playwright";


const root =
    process.cwd();

const reportDirectory =
    process.env.STAGE35_REPORT
    || join(
        root,
        ".stage35",
    );

const manifest =
    JSON.parse(
        readFileSync(
            join(
                root,
                "lib/data/generated/curated-archive/manifest.json",
            ),
            "utf8",
        ),
    );

function githubHost(
    url,
) {
    try {
        const hostname =
            new URL(
                url,
            ).hostname.toLowerCase();

        return (
            hostname
            === "github.com"
            || hostname
                === "api.github.com"
            || hostname
                === "raw.githubusercontent.com"
            || hostname.endsWith(
                ".githubusercontent.com",
            )
        );
    } catch {
        return false;
    }
}

async function findPort() {
    for (
        let port = 3200;
        port <= 3230;
        port += 1
    ) {
        const available =
            await new Promise(
                (
                    resolve,
                ) => {
                    const probe =
                        createServer();

                    probe.once(
                        "error",
                        () =>
                            resolve(
                                false,
                            ),
                    );

                    probe.once(
                        "listening",
                        () =>
                            probe.close(
                                () =>
                                    resolve(
                                        true,
                                    ),
                            ),
                    );

                    probe.listen(
                        port,
                        "127.0.0.1",
                    );
                },
            );

        if (available) {
            return port;
        }
    }

    throw new Error(
        "No Stage 35 QA port is available.",
    );
}

async function waitForHealth(
    url,
) {
    const deadline =
        Date.now()
        + 90_000;

    while (
        Date.now()
        < deadline
    ) {
        try {
            const response =
                await fetch(
                    url,
                );

            if (response.ok) {
                return;
            }
        } catch {
            // Standalone server may still be starting.
        }

        await new Promise(
            (
                resolve,
            ) =>
                setTimeout(
                    resolve,
                    300,
                ),
        );
    }

    throw new Error(
        `Timed out waiting for ${url}.`,
    );
}

const port =
    await findPort();

const base =
    `http://127.0.0.1:${port}`;

const serverLog =
    createWriteStream(
        join(
            reportDirectory,
            "curated-server.log",
        ),
    );

const server =
    spawn(
        process.execPath,
        [
            "server.js",
        ],
        {
            cwd:
                join(
                    root,
                    "dist/forestoflight-hub",
                ),
            env: {
                ...process.env,
                NODE_ENV:
                    "production",
                HOSTNAME:
                    "127.0.0.1",
                PORT:
                    String(
                        port,
                    ),
            },
            stdio: [
                "ignore",
                "pipe",
                "pipe",
            ],
        },
    );

server.stdout.pipe(
    serverLog,
);

server.stderr.pipe(
    serverLog,
);

let browser;

try {
    await waitForHealth(
        `${base}/api/health`,
    );

    browser =
        await chromium.launch({
            headless:
                true,
            args: [
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ],
        });

    const failures = [];
    const results = [];

    for (
        const profile
        of [
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
        ]
    ) {
        for (
            const summary
            of manifest.projects
        ) {
            const project =
                JSON.parse(
                    readFileSync(
                        join(
                            root,
                            "lib/data/generated/curated-archive",
                            summary.file,
                        ),
                        "utf8",
                    ),
                );

            const context =
                await browser.newContext({
                    viewport:
                        profile.viewport,
                    isMobile:
                        profile.isMobile,
                    hasTouch:
                        profile.hasTouch,
                    reducedMotion:
                        "reduce",
                });

            const page =
                await context.newPage();

            const githubRequests = [];
            const runtimeErrors = [];
            const badResponses = [];

            page.on(
                "request",
                (
                    request,
                ) => {
                    if (
                        githubHost(
                            request.url(),
                        )
                    ) {
                        githubRequests.push(
                            request.url(),
                        );
                    }
                },
            );

            page.on(
                "pageerror",
                (
                    error,
                ) =>
                    runtimeErrors.push(
                        error.message,
                    ),
            );

            page.on(
                "console",
                (
                    message,
                ) => {
                    if (
                        message.type()
                        === "error"
                    ) {
                        runtimeErrors.push(
                            message.text(),
                        );
                    }
                },
            );

            page.on(
                "response",
                (
                    response,
                ) => {
                    if (
                        response.status()
                        >= 400
                    ) {
                        badResponses.push({
                            status:
                                response.status(),
                            url:
                                response.url(),
                        });
                    }
                },
            );

            const route =
                `/archive/${project.slug}`;

            const response =
                await page.goto(
                    base
                    + route,
                    {
                        waitUntil:
                            "networkidle",
                        timeout:
                            60_000,
                    },
                );

            await page.waitForTimeout(
                150,
            );

            const audit =
                await page.evaluate(
                    () => ({
                        h1:
                            document.querySelectorAll(
                                "h1",
                            ).length,
                        projectSlug:
                            document.querySelector(
                                "[data-curated-archive]",
                            )?.getAttribute(
                                "data-project-slug",
                            )
                            || "",
                        sections: [
                            ...document.querySelectorAll(
                                "[data-curated-section]",
                            ),
                        ].map(
                            (
                                element,
                            ) =>
                                element.getAttribute(
                                    "data-curated-section",
                                ),
                        ),
                        railLinks: [
                            ...document.querySelectorAll(
                                "[data-curated-section-rail] a",
                            ),
                        ].map(
                            (
                                element,
                            ) =>
                                element.getAttribute(
                                    "href",
                                ),
                        ),
                        contributors: [
                            ...document.querySelectorAll(
                                "[data-contributor-login]",
                            ),
                        ].map(
                            (
                                element,
                            ) =>
                                element.getAttribute(
                                    "data-contributor-login",
                                ),
                        ),
                        creditsInsideInfo:
                            Boolean(
                                document.querySelector(
                                    '#info [data-curated-project-credits]',
                                ),
                            ),
                        contributorsInsideInfo:
                            document.querySelectorAll(
                                '#info [data-contributor-login]',
                            ).length,
                        downloads: [
                            ...document.querySelectorAll(
                                "[data-local-download]",
                            ),
                        ].map(
                            (
                                element,
                            ) => ({
                                href:
                                    element.getAttribute(
                                        "href",
                                    ),
                                download:
                                    element.getAttribute(
                                        "download",
                                    ),
                            }),
                        ),
                        horizontalOverflow:
                            document.documentElement.scrollWidth
                            > document.documentElement.clientWidth
                            + 1,
                        ids: [
                            ...document.querySelectorAll(
                                "[id]",
                            ),
                        ].map(
                            (
                                element,
                            ) =>
                                element.id,
                        ),
                        domNodes:
                            document.getElementsByTagName(
                                "*",
                            ).length,
                        brokenImages: [
                            ...document.images,
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
                            ),
                        placeholderText:
                            /\{\{[^{}]+\}\}/.test(
                                document.body.innerText,
                            ),
                        dupeImage:
                            document.querySelector(
                                'img[src*="/_curated-archive/canopy/dupe-tnt"]',
                            )?.getAttribute(
                                "src",
                            )
                            || "",
                        dupeImageInDom:
                            Boolean(
                                document.querySelector(
                                    'img[src*="/_curated-archive/canopy/dupe-tnt"]',
                                ),
                            ),
                        supportLink:
                            document.querySelector(
                                'a[href="https://buymeacoffee.com/forestoflight"]',
                            )?.getAttribute(
                                "href",
                            )
                            || "",
                        transfer:
                            performance
                                .getEntriesByType(
                                    "resource",
                                )
                                .reduce(
                                    (
                                        total,
                                        entry,
                                    ) =>
                                        total
                                        + (
                                            entry.transferSize
                                            || 0
                                        ),
                                    0,
                                ),
                        scriptTransfer:
                            performance
                                .getEntriesByType(
                                    "resource",
                                )
                                .filter(
                                    (
                                        entry,
                                    ) =>
                                        entry.initiatorType
                                        === "script",
                                )
                                .reduce(
                                    (
                                        total,
                                        entry,
                                    ) =>
                                        total
                                        + (
                                            entry.transferSize
                                            || 0
                                        ),
                                    0,
                                ),
                    }),
                );

            if (project.slug === "canopy") {
                const source =
                    "/_curated-archive/canopy/dupe-tnt.png";

                try {
                    const imageResponse =
                        await page.request.get(
                            base + source,
                            {
                                timeout: 30_000,
                            },
                        );

                    const contentType =
                        imageResponse.headers()[
                            "content-type"
                        ]
                        || "";

                    const body =
                        await imageResponse.body();

                    if (
                        imageResponse.ok()
                        && contentType.startsWith(
                            "image/",
                        )
                        && body.length > 0
                    ) {
                        audit.dupeImage =
                            source;
                    }
                }
                catch {
                    audit.dupeImage =
                        "";
                }
            }

            const duplicateIds =
                audit.ids.filter(
                    (
                        id,
                        index,
                    ) =>
                        id
                        && audit.ids.indexOf(
                            id,
                        )
                            !== index,
                );

            const expectedSections =
                project.sections.map(
                    (
                        section,
                    ) =>
                        section.id,
                );

            const expectedRail = [
                ...expectedSections,
            ].map(
                (
                    id,
                ) =>
                    `#${id}`,
            );

            const expectedContributors =
                project.contributors.map(
                    (
                        contributor,
                    ) =>
                        contributor.login,
                );

            const prefix =
                `${profile.name} ${route}`;

            if (
                response?.status()
                !== 200
            ) {
                failures.push(
                    `${prefix}: HTTP ${response?.status()}`,
                );
            }

            if (
                audit.h1
                !== 1
            ) {
                failures.push(
                    `${prefix}: expected one h1, found ${audit.h1}`,
                );
            }

            if (
                duplicateIds.length
            ) {
                failures.push(
                    `${prefix}: duplicate ids ${[
                        ...new Set(
                            duplicateIds,
                        ),
                    ].join(
                        ", ",
                    )}`,
                );
            }

            if (
                audit.domNodes
                > 3_500
            ) {
                failures.push(
                    `${prefix}: DOM ${audit.domNodes} exceeds 3500`,
                );
            }

            if (
                audit.projectSlug
                !== project.slug
            ) {
                failures.push(
                    `${prefix}: project identity mismatch`,
                );
            }

            if (
                JSON.stringify(
                    audit.sections,
                )
                !== JSON.stringify(
                    expectedSections,
                )
            ) {
                failures.push(
                    `${prefix}: section order mismatch`,
                );
            }

            if (
                JSON.stringify(
                    audit.railLinks,
                )
                !== JSON.stringify(
                    expectedRail,
                )
            ) {
                failures.push(
                    `${prefix}: section rail mismatch`,
                );
            }

            if (
                JSON.stringify(
                    audit.contributors,
                )
                !== JSON.stringify(
                    expectedContributors,
                )
            ) {
                failures.push(
                    `${prefix}: contributor order mismatch`,
                );
            }


            if (!audit.creditsInsideInfo) {
                failures.push(
                    `${prefix}: project credits are not grouped inside Info`,
                );
            }

            if (
                audit.contributorsInsideInfo
                !== project.contributors.length
            ) {
                failures.push(
                    `${prefix}: contributors are not fully contained in Info`,
                );
            }

            if (
                audit.horizontalOverflow
            ) {
                failures.push(
                    `${prefix}: horizontal overflow`,
                );
            }

            if (
                audit.brokenImages.length
            ) {
                failures.push(
                    `${prefix}: broken images ${audit.brokenImages.join(
                        " | ",
                    )}`,
                );
            }

            if (
                audit.placeholderText
            ) {
                failures.push(
                    `${prefix}: unresolved placeholders`,
                );
            }

            if (
                githubRequests.length
            ) {
                failures.push(
                    `${prefix}: visitor-time GitHub requests`,
                );
            }

            if (
                runtimeErrors.length
            ) {
                failures.push(
                    `${prefix}: browser/runtime errors`,
                );
            }

            if (
                badResponses.length
            ) {
                failures.push(
                    `${prefix}: bad responses`,
                );
            }

            for (
                const download
                of audit.downloads
            ) {
                if (
                    !download.href
                    || !download.href.startsWith(
                        "/_downloads/",
                    )
                    || !download.download
                ) {
                    failures.push(
                        `${prefix}: invalid local download link`,
                    );
                    break;
                }
            }

            if (
                project.slug
                === "canopy"
            ) {
                const exact = [
                    "info",
                    "commands",
                    "global-rules",
                    "infodisplay-rules",
                    "installation",
                    "downloads",
                    "code",
                ];

                if (
                    JSON.stringify(
                        audit.sections,
                    )
                    !== JSON.stringify(
                        exact,
                    )
                ) {
                    failures.push(
                        `${prefix}: Canopy golden section order changed`,
                    );
                }

                if (!audit.dupeImage) {
                    failures.push(
                        `${prefix}: dupeTnt reference image asset is not browser-reachable`,
                    );
                }

                if (!audit.supportLink) {
                    failures.push(
                        `${prefix}: support link is missing`,
                    );
                }
            }

            if (
                audit.transfer
                > 2_500_000
            ) {
                failures.push(
                    `${prefix}: transfer ${audit.transfer} exceeds 2500000`,
                );
            }

            if (
                audit.scriptTransfer
                > 450_000
            ) {
                failures.push(
                    `${prefix}: script transfer ${audit.scriptTransfer} exceeds 450000`,
                );
            }

            if (
                (
                    profile.name
                    === "desktop"
                    && [
                        "canopy",
                        "understudy",
                        "construct",
                        "addonapikit",
                        "skyoobguide",
                    ].includes(
                        project.slug,
                    )
                )
                || (
                    profile.name
                    === "mobile"
                    && project.slug
                        === "canopy"
                )
            ) {
                await page.screenshot({
                    path:
                        join(
                            reportDirectory,
                            `curated-${profile.name}-${project.slug}.png`,
                        ),
                    fullPage:
                        true,
                });
            }

            const samples = [
                audit.downloads[
                    0
                ],
                audit.downloads[
                    audit.downloads.length
                    - 1
                ],
            ].filter(
                Boolean,
            );

            for (
                const sample
                of samples
            ) {
                const downloadResponse =
                    await context.request.get(
                        base
                        + sample.href,
                        {
                            timeout:
                                30_000,
                            headers: {
                                Range:
                                    "bytes=0-31",
                            },
                        },
                    );

                if (
                    ![
                        200,
                        206,
                    ].includes(
                        downloadResponse.status(),
                    )
                ) {
                    failures.push(
                        `${prefix}: sampled download returned ${downloadResponse.status()}`,
                    );
                }
            }

            const detailsResponse =
                await page.goto(
                    `${base}/projects/${project.slug}`,
                    {
                        waitUntil:
                            "domcontentloaded",
                        timeout:
                            30_000,
                    },
                );

            if (
                !page.url().endsWith(
                    `/archive/${project.slug}`,
                )
            ) {
                failures.push(
                    `${prefix}: Details route did not resolve to archive`,
                );
            }

            results.push({
                profile:
                    profile.name,
                route,
                status:
                    response?.status()
                    ?? null,
                sections:
                    audit.sections.length,
                contributors:
                    audit.contributors.length,
                downloads:
                    audit.downloads.length,
                transfer:
                    audit.transfer,
                scriptTransfer:
                    audit.scriptTransfer,
                githubRequests:
                    githubRequests.length,
                runtimeErrors:
                    runtimeErrors.length,
                detailsStatus:
                    detailsResponse?.status()
                    ?? null,
            });

            await context.close();
        }
    }

    const report = {
        schemaVersion:
            1,
        projects:
            manifest.projects.length,
        profileChecks:
            results.length,
        results,
        failures,
        passed:
            failures.length
            === 0,
    };

    writeFileSync(
        join(
            reportDirectory,
            "curated-browser-qa.json",
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
            {
                projects:
                    report.projects,
                profileChecks:
                    report.profileChecks,
                failures:
                    failures.length,
                passed:
                    report.passed,
            },
            null,
            2,
        ),
    );

    if (
        failures.length
    ) {
        console.error(
            JSON.stringify(
                failures,
                null,
                2,
            ),
        );

        process.exitCode =
            1;
    }
} finally {
    if (browser) {
        await browser.close();
    }

    server.kill(
        "SIGTERM",
    );

    serverLog.end();
}
