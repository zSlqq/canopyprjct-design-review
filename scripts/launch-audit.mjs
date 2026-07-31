import {
    createWriteStream,
    mkdirSync,
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

const outputDirectory =
    join(
        root,
        ".stage31",
        "launch-audit",
    );

const screenshotDirectory =
    join(
        outputDirectory,
        "screenshots",
    );

mkdirSync(
    screenshotDirectory,
    {
        recursive:
            true,
    },
);

const delivery =
    JSON.parse(
        readFileSync(
            join(
                root,
                "lib",
                "data",
                "generated",
                "docs",
                "delivery-manifest.json",
            ),
            "utf8",
        ),
    );

const release =
    JSON.parse(
        readFileSync(
            join(
                root,
                "dist",
                "forestoflight-hub",
                "release-manifest.json",
            ),
            "utf8",
        ),
    );

const limits = {
    transferBytes:
        4_000_000,
    scriptTransferBytes:
        800_000,
    domNodes:
        3_500,
    firstContentfulPaintMs:
        3_500,
};

const genericTitles =
    new Set([
        "",
        "-",
        "--",
        "/",
        "//",
        "command",
        "commands",
        "default",
        "default value",
        "description",
        "details",
        "example",
        "examples",
        "feature",
        "features",
        "notes",
        "options",
        "overview",
        "parameter",
        "parameters",
        "return value",
        "setting",
        "settings",
        "suggested option",
        "suggested options",
        "syntax",
        "type",
        "usage",
        "usage details",
        "value",
        "values",
    ]);

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

const screenshotRoutes =
    new Set([
        "/",
        "/features",
        "/search",
        "/docs",
        "/status",
        "/projects/canopy",
    ]);

function isGithubRequest(
    url,
) {
    try {
        const hostname =
            new URL(
                url,
            )
                .hostname
                .toLowerCase();

        return (
            hostname
                === "github.com"
            || hostname
                === "raw.githubusercontent.com"
            || hostname
                === "opengraph.githubassets.com"
            || hostname.endsWith(
                ".githubusercontent.com",
            )
        );
    } catch {
        return false;
    }
}

function safeName(
    route,
) {
    return (
        route
            .replace(
                /^\/+|\/+$/g,
                "",
            )
            .replace(
                /[^a-z0-9]+/gi,
                "-",
            )
        || "home"
    );
}

async function findPort() {
    for (
        let port = 3160;
        port <= 3199;
        port += 1
    ) {
        const available =
            await new Promise(
                (
                    resolve,
                ) => {
                    const server =
                        createServer();

                    server.once(
                        "error",
                        () => {
                            resolve(
                                false,
                            );
                        },
                    );

                    server.once(
                        "listening",
                        () => {
                            server.close(
                                () => {
                                    resolve(
                                        true,
                                    );
                                },
                            );
                        },
                    );

                    server.listen(
                        port,
                        "127.0.0.1",
                    );
                },
            );

        if (
            available
        ) {
            return port;
        }
    }

    throw new Error(
        "No launch-audit port is available.",
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

            if (
                response.ok
            ) {
                return;
            }
        } catch {
            // Server may still be starting.
        }

        await new Promise(
            (
                resolve,
            ) => {
                setTimeout(
                    resolve,
                    400,
                );
            },
        );
    }

    throw new Error(
        `Timed out waiting for ${url}.`,
    );
}

async function mapLimit(
    values,
    limit,
    callback,
) {
    const results =
        new Array(
            values.length,
        );

    let index = 0;

    async function worker() {
        while (
            index
            < values.length
        ) {
            const current =
                index;

            index += 1;

            results[
                current
            ] =
                await callback(
                    values[
                        current
                    ],
                    current,
                );
        }
    }

    await Promise.all(
        Array.from(
            {
                length:
                    Math.min(
                        limit,
                        values.length,
                    ),
            },
            () =>
                worker(),
        ),
    );

    return results;
}

function analyzeResults(
    routeResults,
    deliveryChecks,
) {
    const failures = [];

    for (
        const result
        of routeResults
    ) {
        const prefix =
            `${result.profile} ${result.route}`;

        if (
            result.status
            !== 200
        ) {
            failures.push(
                `${prefix}: HTTP ${result.status}`,
            );
        }

        if (
            result.h1Count
            !== 1
        ) {
            failures.push(
                `${prefix}: expected exactly one h1, found ${result.h1Count}`,
            );
        }

        if (
            result.language
            !== "en"
        ) {
            failures.push(
                `${prefix}: document language is not en`,
            );
        }

        if (
            !result.hasMain
        ) {
            failures.push(
                `${prefix}: main landmark is missing`,
            );
        }

        if (
            result.horizontalOverflow
        ) {
            failures.push(
                `${prefix}: horizontal overflow`,
            );
        }

        if (
            result.duplicateIds
                .length
        ) {
            failures.push(
                `${prefix}: duplicate ids (${result.duplicateIds.join(", ")})`,
            );
        }

        if (
            result.unnamedControls
                .length
        ) {
            failures.push(
                `${prefix}: unnamed controls (${result.unnamedControls.join(" | ")})`,
            );
        }

        if (
            result.brokenImages
                .length
        ) {
            failures.push(
                `${prefix}: broken images (${result.brokenImages.join(" | ")})`,
            );
        }

        if (
            result.imagesWithoutAlt
                .length
        ) {
            failures.push(
                `${prefix}: images without alt attributes (${result.imagesWithoutAlt.join(" | ")})`,
            );
        }

        if (
            result.genericFeatureTitles
                .length
        ) {
            failures.push(
                `${prefix}: generic feature titles (${result.genericFeatureTitles.join(" | ")})`,
            );
        }

        if (
            result.pageErrors
                .length
            || result.consoleErrors
                .length
            || result.failedRequests
                .length
            || result.badResponses
                .length
        ) {
            failures.push(
                `${prefix}: browser runtime errors`,
            );
        }

        if (
            result.githubRequests
                .length
        ) {
            failures.push(
                `${prefix}: visitor-time GitHub requests`,
            );
        }

        if (
            result.transferBytes
            > limits.transferBytes
        ) {
            const largest =
                result.largestResources
                    .slice(
                        0,
                        4,
                    )
                    .map(
                        (
                            resource,
                        ) =>
                            `${resource.transferBytes}:${resource.name}`,
                    )
                    .join(
                        " | ",
                    );

            failures.push(
                `${prefix}: transfer ${result.transferBytes} exceeds ${limits.transferBytes}; largest ${largest}`,
            );
        }

        if (
            result.scriptTransferBytes
            > limits.scriptTransferBytes
        ) {
            failures.push(
                `${prefix}: JavaScript ${result.scriptTransferBytes} exceeds ${limits.scriptTransferBytes}`,
            );
        }

        if (
            result.domNodes
            > limits.domNodes
        ) {
            failures.push(
                `${prefix}: DOM ${result.domNodes} exceeds ${limits.domNodes}`,
            );
        }

        if (
            result.firstContentfulPaintMs
            > limits.firstContentfulPaintMs
        ) {
            failures.push(
                `${prefix}: FCP ${result.firstContentfulPaintMs}ms exceeds ${limits.firstContentfulPaintMs}ms`,
            );
        }

        if (
            result.route
            === "/features"
            && result.initialFeatureShardRequests
                !== 0
        ) {
            failures.push(
                `${prefix}: feature shards loaded before interaction`,
            );
        }

        if (
            result.route
            === "/search"
            && result.initialDocsShardRequests
                !== 0
        ) {
            failures.push(
                `${prefix}: documentation shards loaded before a query`,
            );
        }
    }

    if (
        deliveryChecks.health.status
        !== 200
        || deliveryChecks.health.fingerprint
        !== delivery.fingerprint
    ) {
        failures.push(
            "Health endpoint fingerprint verification failed.",
        );
    }

    if (
        deliveryChecks.missing
        !== 404
    ) {
        failures.push(
            `Deliberate missing route returned HTTP ${deliveryChecks.missing}.`,
        );
    }

    if (
        deliveryChecks.sitemap
        !== 200
    ) {
        failures.push(
            `Sitemap returned HTTP ${deliveryChecks.sitemap}.`,
        );
    }

    if (
        deliveryChecks.robots
        !== 200
    ) {
        failures.push(
            `Robots returned HTTP ${deliveryChecks.robots}.`,
        );
    }

    return failures;
}

const port =
    await findPort();

const baseUrl =
    `http://127.0.0.1:${port}`;

const serverLog =
    createWriteStream(
        join(
            outputDirectory,
            "standalone-server.log",
        ),
        {
            flags:
                "w",
        },
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
                    "dist",
                    "forestoflight-hub",
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
        `${baseUrl}/api/health`,
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

    const routeResults = [];

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
                    "reduce",
            });

        const results =
            await mapLimit(
                delivery.routes,
                1,
                async (
                    route,
                ) => {
                    const page =
                        await context.newPage();

                    const pageErrors = [];
                    const consoleErrors = [];
                    const failedRequests = [];
                    const badResponses = [];
                    const githubRequests = [];
                    const featureShardRequests = [];
                    const docsShardRequests = [];

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
                        "request",
                        (
                            request,
                        ) => {
                            const url =
                                request.url();

                            if (
                                isGithubRequest(
                                    url,
                                )
                            ) {
                                githubRequests.push(
                                    url,
                                );
                            }

                            if (
                                url.includes(
                                    "/_feature-library/",
                                )
                                && !url.endsWith(
                                    "/manifest.json",
                                )
                            ) {
                                featureShardRequests.push(
                                    url,
                                );
                            }

                            if (
                                url.includes(
                                    "/_docs-index/",
                                )
                                && !url.endsWith(
                                    "/manifest.json",
                                )
                            ) {
                                docsShardRequests.push(
                                    url,
                                );
                            }
                        },
                    );

                    page.on(
                        "requestfailed",
                        (
                            request,
                        ) => {
                            const error =
                                request.failure()
                                    ?.errorText
                                ?? "unknown";

                            if (
                                !error.includes(
                                    "ERR_ABORTED",
                                )
                            ) {
                                failedRequests.push({
                                    url:
                                        request.url(),
                                    error,
                                });
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
                                    url:
                                        response.url(),
                                    status:
                                        response.status(),
                                });
                            }
                        },
                    );

                    const response =
                        await page.goto(
                            baseUrl
                            + route,
                            {
                                waitUntil:
                                    "domcontentloaded",
                                timeout:
                                    60_000,
                            },
                        );

                    if (
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
                    );

                    if (
                        screenshotRoutes.has(
                            route,
                        )
                    ) {
                        await page.screenshot({
                            path:
                                join(
                                    screenshotDirectory,
                                    `${profile.name}-${safeName(route)}.png`,
                                ),
                            fullPage:
                                true,
                        });
                    }

                    const audit =
                        await page.evaluate(
                            (
                                genericValues,
                            ) => {
                                const generic =
                                    new Set(
                                        genericValues,
                                    );

                                const normalize =
                                    (
                                        value,
                                    ) =>
                                        String(
                                            value
                                            ?? "",
                                        )
                                            .normalize(
                                                "NFKD",
                                            )
                                            .replace(
                                                /[\u0300-\u036f]/g,
                                                "",
                                            )
                                            .toLowerCase()
                                            .replace(
                                                /[^a-z0-9]+/g,
                                                " ",
                                            )
                                            .trim();

                                const visible =
                                    (
                                        element,
                                    ) => {
                                        const style =
                                            getComputedStyle(
                                                element,
                                            );

                                        const rect =
                                            element
                                                .getBoundingClientRect();

                                        return (
                                            style.display
                                                !== "none"
                                            && style.visibility
                                                !== "hidden"
                                            && Number(
                                                style.opacity,
                                            )
                                                > 0.05
                                            && rect.width
                                                > 0
                                            && rect.height
                                                > 0
                                        );
                                    };

                                const ids =
                                    new Map();

                                for (
                                    const element
                                    of document.querySelectorAll(
                                        "[id]",
                                    )
                                ) {
                                    const id =
                                        element.id;

                                    ids.set(
                                        id,
                                        (
                                            ids.get(
                                                id,
                                            )
                                            ?? 0
                                        )
                                        + 1,
                                    );
                                }

                                const duplicateIds = [
                                    ...ids.entries(),
                                ]
                                    .filter(
                                        ([
                                            ,
                                            count,
                                        ]) =>
                                            count
                                            > 1,
                                    )
                                    .map(
                                        ([
                                            id,
                                        ]) =>
                                            id,
                                    );

                                const unnamedControls = [
                                    ...document.querySelectorAll(
                                        'button, a[href], input, select, textarea, [role="button"]',
                                    ),
                                ]
                                    .filter(
                                        visible,
                                    )
                                    .filter(
                                        (
                                            element,
                                        ) =>
                                            !element.matches(
                                                ":disabled",
                                            )
                                            && element.getAttribute(
                                                "aria-hidden",
                                            )
                                                !== "true",
                                    )
                                    .filter(
                                        (
                                            element,
                                        ) => {
                                            const label =
                                                (
                                                    element.getAttribute(
                                                        "aria-label",
                                                    )
                                                    || element.getAttribute(
                                                        "title",
                                                    )
                                                    || element.getAttribute(
                                                        "placeholder",
                                                    )
                                                    || element.textContent
                                                    || ""
                                                )
                                                    .replace(
                                                        /\s+/g,
                                                        " ",
                                                    )
                                                    .trim();

                                            return !label;
                                        },
                                    )
                                    .slice(
                                        0,
                                        12,
                                    )
                                    .map(
                                        (
                                            element,
                                        ) =>
                                            element.outerHTML.slice(
                                                0,
                                                140,
                                            ),
                                    );

                                const images = [
                                    ...document.images,
                                ];

                                const brokenImages =
                                    images
                                        .filter(
                                            (
                                                image,
                                            ) =>
                                                image.complete
                                                && (
                                                    image.naturalWidth
                                                    <= 0
                                                    || image.naturalHeight
                                                    <= 0
                                                ),
                                        )
                                        .map(
                                            (
                                                image,
                                            ) =>
                                                image.currentSrc
                                                || image.src
                                                || image.alt,
                                        );

                                const imagesWithoutAlt =
                                    images
                                        .filter(
                                            (
                                                image,
                                            ) =>
                                                !image.hasAttribute(
                                                    "alt",
                                                ),
                                        )
                                        .map(
                                            (
                                                image,
                                            ) =>
                                                image.currentSrc
                                                || image.src,
                                        );

                                const genericFeatureTitles = [
                                    ...document.querySelectorAll(
                                        '[data-feature-title], #project-features h2, #project-features h3',
                                    ),
                                ]
                                    .filter(
                                        visible,
                                    )
                                    .map(
                                        (
                                            element,
                                        ) =>
                                            (
                                                element.textContent
                                                || ""
                                            )
                                                .replace(
                                                    /\s+/g,
                                                    " ",
                                                )
                                                .trim(),
                                    )
                                    .filter(
                                        (
                                            value,
                                        ) =>
                                            generic.has(
                                                normalize(
                                                    value,
                                                ),
                                            )
                                            || !/[A-Za-z0-9]/.test(
                                                value,
                                            ),
                                    );

                                const resources =
                                    performance.getEntriesByType(
                                        "resource",
                                    );

                                const scripts =
                                    resources.filter(
                                        (
                                            entry,
                                        ) =>
                                            entry.initiatorType
                                                === "script"
                                            || entry.name.includes(
                                                ".js",
                                            ),
                                    );

                                const paints =
                                    performance.getEntriesByType(
                                        "paint",
                                    );

                                return {
                                    language:
                                        document.documentElement.lang,
                                    hasMain:
                                        Boolean(
                                            document.querySelector(
                                                "main",
                                            ),
                                        ),
                                    h1Count:
                                        document.querySelectorAll(
                                            "h1",
                                        ).length,
                                    horizontalOverflow:
                                        document.documentElement.scrollWidth
                                        > document.documentElement.clientWidth
                                        + 1,
                                    duplicateIds,
                                    unnamedControls,
                                    brokenImages,
                                    imagesWithoutAlt,
                                    genericFeatureTitles,
                                    transferBytes:
                                        resources.reduce(
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
                                    largestResources:
                                        resources
                                            .map(
                                                (
                                                    entry,
                                                ) => ({
                                                    name:
                                                        entry.name,
                                                    transferBytes:
                                                        entry.transferSize
                                                        || 0,
                                                    encodedBodyBytes:
                                                        entry.encodedBodySize
                                                        || 0,
                                                    initiatorType:
                                                        entry.initiatorType,
                                                }),
                                            )
                                            .sort(
                                                (
                                                    left,
                                                    right,
                                                ) =>
                                                    right.transferBytes
                                                    - left.transferBytes,
                                            )
                                            .slice(
                                                0,
                                                8,
                                            ),
                                    scriptTransferBytes:
                                        scripts.reduce(
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
                                    domNodes:
                                        document.getElementsByTagName(
                                            "*",
                                        ).length,
                                    firstContentfulPaintMs:
                                        paints.find(
                                            (
                                                entry,
                                            ) =>
                                                entry.name
                                                === "first-contentful-paint",
                                        )
                                            ?.startTime
                                        ?? 0,
                                };
                            },
                            [
                                ...genericTitles,
                            ],
                        );

                    await page.close();

                    return {
                        profile:
                            profile.name,
                        route,
                        status:
                            response?.status()
                            ?? null,
                        initialFeatureShardRequests:
                            featureShardRequests.length,
                        initialDocsShardRequests:
                            docsShardRequests.length,
                        pageErrors,
                        consoleErrors,
                        failedRequests,
                        badResponses,
                        githubRequests,
                        ...audit,
                    };
                },
            );

        routeResults.push(
            ...results,
        );

        await context.close();
    }

    const healthResponse =
        await fetch(
            `${baseUrl}/api/health`,
        );

    const healthBody =
        await healthResponse.json();

    const missingResponse =
        await fetch(
            `${baseUrl}/stage-31-deliberate-missing-route`,
            {
                redirect:
                    "manual",
            },
        );

    const sitemapResponse =
        await fetch(
            `${baseUrl}/sitemap.xml`,
        );

    const robotsResponse =
        await fetch(
            `${baseUrl}/robots.txt`,
        );

    const deliveryChecks = {
        health: {
            status:
                healthResponse.status,
            fingerprint:
                healthBody.fingerprint,
        },
        missing:
            missingResponse.status,
        sitemap:
            sitemapResponse.status,
        robots:
            robotsResponse.status,
    };

    const failures =
        analyzeResults(
            routeResults,
            deliveryChecks,
        );

    const summary = {
        schemaVersion:
            1,
        generatedAt:
            new Date().toISOString(),
        releaseFingerprint:
            release.fingerprint,
        routes:
            delivery.routes.length,
        profileChecks:
            routeResults.length,
        screenshots:
            profiles.length
            * [
                ...screenshotRoutes,
            ].filter(
                (
                    route,
                ) =>
                    delivery.routes.includes(
                        route,
                    ),
            ).length,
        limits,
        deliveryChecks,
        visitorTimeGithubRequests:
            routeResults.reduce(
                (
                    total,
                    result,
                ) =>
                    total
                    + result.githubRequests.length,
                0,
            ),
        maximums: {
            transferBytes:
                Math.max(
                    ...routeResults.map(
                        (
                            result,
                        ) =>
                            result.transferBytes,
                    ),
                ),
            scriptTransferBytes:
                Math.max(
                    ...routeResults.map(
                        (
                            result,
                        ) =>
                            result.scriptTransferBytes,
                    ),
                ),
            domNodes:
                Math.max(
                    ...routeResults.map(
                        (
                            result,
                        ) =>
                            result.domNodes,
                    ),
                ),
            firstContentfulPaintMs:
                Math.max(
                    ...routeResults.map(
                        (
                            result,
                        ) =>
                            result.firstContentfulPaintMs,
                    ),
                ),
        },
        failures,
        passed:
            failures.length
            === 0,
    };

    writeFileSync(
        join(
            outputDirectory,
            "results.json",
        ),
        JSON.stringify(
            {
                summary,
                routeResults,
            },
            null,
            2,
        )
        + "\n",
        "utf8",
    );

    const markdown = [
        "# Launch certification",
        "",
        `- Fingerprint: \`${summary.releaseFingerprint}\``,
        `- Canonical routes: ${summary.routes}`,
        `- Desktop/mobile route checks: ${summary.profileChecks}`,
        `- Screenshots: ${summary.screenshots}`,
        `- Visitor-time GitHub requests: ${summary.visitorTimeGithubRequests}`,
        `- Maximum transfer: ${summary.maximums.transferBytes.toLocaleString("en-US")} bytes`,
        `- Maximum JavaScript transfer: ${summary.maximums.scriptTransferBytes.toLocaleString("en-US")} bytes`,
        `- Maximum DOM: ${summary.maximums.domNodes.toLocaleString("en-US")} nodes`,
        `- Maximum FCP: ${summary.maximums.firstContentfulPaintMs.toFixed(1)} ms`,
        `- Result: ${summary.passed ? "PASS" : "FAIL"}`,
        "",
        "## Failures",
        "",
        ...(
            failures.length
                ? failures.map(
                    (
                        failure,
                    ) =>
                        `- ${failure}`,
                )
                : [
                    "- None.",
                ]
        ),
        "",
    ].join(
        "\n",
    );

    writeFileSync(
        join(
            outputDirectory,
            "REPORT.md",
        ),
        markdown,
        "utf8",
    );

    console.log(
        JSON.stringify(
            summary,
            null,
            2,
        ),
    );

    if (
        failures.length
    ) {
        process.exitCode =
            1;
    }
} finally {
    if (
        browser
    ) {
        await browser.close();
    }

    server.kill(
        "SIGTERM",
    );

    await new Promise(
        (
            resolve,
        ) => {
            const timer =
                setTimeout(
                    () => {
                        server.kill(
                            "SIGKILL",
                        );

                        resolve();
                    },
                    4_000,
                );

            server.once(
                "exit",
                () => {
                    clearTimeout(
                        timer,
                    );

                    resolve();
                },
            );
        },
    );

    serverLog.end();
}
