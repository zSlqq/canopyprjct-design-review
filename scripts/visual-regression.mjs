import {
    createWriteStream,
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
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
    PNG,
} from "pngjs";
import pixelmatch from "pixelmatch";
import {
    chromium,
} from "playwright";

const root =
    process.cwd();

const mode =
    process.argv[2]
    ?? "check";

if (
    ![
        "baseline",
        "check",
    ].includes(
        mode,
    )
) {
    throw new Error(
        "Usage: node scripts/visual-regression.mjs baseline|check",
    );
}

const baselineDirectory =
    join(
        root,
        "tests",
        "visual",
        "baseline",
    );

const outputDirectory =
    join(
        root,
        ".stage32",
        "visual",
    );

const actualDirectory =
    join(
        outputDirectory,
        "actual",
    );

const diffDirectory =
    join(
        outputDirectory,
        "diff",
    );

mkdirSync(
    baselineDirectory,
    {
        recursive:
            true,
    },
);

rmSync(
    outputDirectory,
    {
        recursive:
            true,
        force:
            true,
    },
);

mkdirSync(
    actualDirectory,
    {
        recursive:
            true,
    },
);

mkdirSync(
    diffDirectory,
    {
        recursive:
            true,
    },
);

const scenes = [
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

    {
        name:
            "desktop-archive",
        route:
            "/archive",
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
            "desktop-canopy-archive",
        route:
            "/archive/canopy",
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
            "mobile-archive",
        route:
            "/archive",
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
    {
        name:
            "mobile-canopy-archive",
        route:
            "/archive/canopy",
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
    {
        name:
            "desktop-home",
        route:
            "/",
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
            "desktop-features",
        route:
            "/features",
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
            "desktop-docs",
        route:
            "/docs",
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
            "desktop-canopy-project",
        route:
            "/projects/canopy",
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
            "desktop-canopy-readme",
        route:
            "/docs/canopy/repository-readme",
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
            "mobile-home",
        route:
            "/",
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
    {
        name:
            "mobile-features",
        route:
            "/features",
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
    {
        name:
            "mobile-canopy-project",
        route:
            "/projects/canopy",
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
    {
        name:
            "mobile-canopy-readme",
        route:
            "/docs/canopy/repository-readme",
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
];

const thresholds = {
    pixelmatchThreshold:
        0.1,
    maximumChangedRatio:
        0.003,
    maximumChangedPixels:
        2_500,
};

async function findPort() {
    for (
        let port = 3180;
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
        "No visual-regression port is available.",
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
            // The standalone server may still be starting.
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

function compareImages(
    baselinePath,
    actualPath,
    diffPath,
) {
    const baseline =
        PNG.sync.read(
            readFileSync(
                baselinePath,
            ),
        );

    const actual =
        PNG.sync.read(
            readFileSync(
                actualPath,
            ),
        );

    if (
        baseline.width
        !== actual.width
        || baseline.height
        !== actual.height
    ) {
        return {
            passed:
                false,
            reason:
                "dimension-mismatch",
            baseline: {
                width:
                    baseline.width,
                height:
                    baseline.height,
            },
            actual: {
                width:
                    actual.width,
                height:
                    actual.height,
            },
            changedPixels:
                null,
            changedRatio:
                null,
        };
    }

    const diff =
        new PNG({
            width:
                baseline.width,
            height:
                baseline.height,
        });

    const changedPixels =
        pixelmatch(
            baseline.data,
            actual.data,
            diff.data,
            baseline.width,
            baseline.height,
            {
                threshold:
                    thresholds.pixelmatchThreshold,
                includeAA:
                    false,
                alpha:
                    0.65,
                diffColor: [
                    255,
                    0,
                    120,
                ],
                aaColor: [
                    255,
                    186,
                    0,
                ],
            },
        );

    const totalPixels =
        baseline.width
        * baseline.height;

    const changedRatio =
        changedPixels
        / totalPixels;

    const passed =
        changedRatio
        <= thresholds.maximumChangedRatio
        && changedPixels
        <= thresholds.maximumChangedPixels;

    if (
        !passed
    ) {
        writeFileSync(
            diffPath,
            PNG.sync.write(
                diff,
            ),
        );
    }

    return {
        passed,
        reason:
            passed
                ? null
                : "pixel-difference",
        width:
            baseline.width,
        height:
            baseline.height,
        changedPixels,
        changedRatio,
    };
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
                TZ:
                    "UTC",
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
                "--font-render-hinting=none",
            ],
        });

    const results = [];

    for (
        const scene
        of scenes
    ) {
        const context =
            await browser.newContext({
                viewport:
                    scene.viewport,
                isMobile:
                    scene.isMobile
                    ?? false,
                hasTouch:
                    scene.hasTouch
                    ?? false,
                deviceScaleFactor:
                    1,
                locale:
                    "en-US",
                timezoneId:
                    "UTC",
                colorScheme:
                    "light",
                reducedMotion:
                    "reduce",
            });

        const page =
            await context.newPage();

        const response =
            await page.goto(
                baseUrl
                + scene.route,
                {
                    waitUntil:
                        "networkidle",
                    timeout:
                        60_000,
                },
            );

        if (
            response?.status()
            !== 200
        ) {
            throw new Error(
                `${scene.route} returned HTTP ${response?.status()}.`,
            );
        }

        await page.addStyleTag({
            content: `
                *,
                *::before,
                *::after {
                    animation-duration: 0s !important;
                    animation-delay: 0s !important;
                    transition-duration: 0s !important;
                    transition-delay: 0s !important;
                    caret-color: transparent !important;
                }

                html {
                    scroll-behavior: auto !important;
                    scrollbar-gutter: stable !important;
                }

                video,
                canvas[data-visual-volatile],
                [data-visual-volatile="true"] {
                    visibility: hidden !important;
                }
            `,
        });

        await page.evaluate(
            async () => {
                const frame =
                    () =>
                        new Promise(
                            (
                                resolve,
                            ) => {
                                requestAnimationFrame(
                                    () => {
                                        requestAnimationFrame(
                                            resolve,
                                        );
                                    },
                                );
                            },
                        );

                await document.fonts.ready;

                for (
                    const animation
                    of document.getAnimations()
                ) {
                    try {
                        animation.finish();
                    } catch {
                        animation.cancel();
                    }
                }

                const images = [
                    ...document.images,
                ].filter(
                    (
                        image,
                    ) =>
                        !image.closest(
                            '[data-media-kind="deferred-animation"]',
                        ),
                );

                for (
                    const image
                    of images
                ) {
                    image.loading =
                        "eager";

                    image.decoding =
                        "sync";
                }

                const step =
                    Math.max(
                        420,
                        Math.floor(
                            window.innerHeight
                            * 0.72,
                        ),
                    );

                const maximum =
                    Math.max(
                        document.body.scrollHeight,
                        document.documentElement.scrollHeight,
                    );

                for (
                    let position = 0;
                    position <= maximum;
                    position += step
                ) {
                    window.scrollTo(
                        0,
                        position,
                    );

                    await frame();
                }

                window.scrollTo(
                    0,
                    0,
                );

                await Promise.all(
                    images.map(
                        async (
                            image,
                        ) => {
                            if (
                                !image.complete
                            ) {
                                await new Promise(
                                    (
                                        resolve,
                                    ) => {
                                        image.addEventListener(
                                            "load",
                                            resolve,
                                            {
                                                once:
                                                    true,
                                            },
                                        );

                                        image.addEventListener(
                                            "error",
                                            resolve,
                                            {
                                                once:
                                                    true,
                                            },
                                        );
                                    },
                                );
                            }

                            if (
                                image.complete
                                && image.naturalWidth
                                    > 0
                                && typeof image.decode
                                    === "function"
                            ) {
                                try {
                                    await image.decode();
                                } catch {
                                    // A loaded image can reject decode after a cache transition.
                                }
                            }
                        },
                    ),
                );

                for (
                    const animation
                    of document.getAnimations()
                ) {
                    try {
                        animation.finish();
                    } catch {
                        animation.cancel();
                    }
                }

                await document.fonts.ready;
                await frame();
            },
        );

        await page.waitForTimeout(
            260,
        );

        const actualPath =
            join(
                actualDirectory,
                `${scene.name}.png`,
            );

        await page.screenshot({
            path:
                actualPath,
            fullPage:
                scene.fullPage,
            animations:
                "disabled",
            caret:
                "hide",
        });

        await page.waitForTimeout(
            160,
        );

        const stabilityPath =
            join(
                actualDirectory,
                `${scene.name}.stability.png`,
            );

        await page.screenshot({
            path:
                stabilityPath,
            fullPage:
                scene.fullPage,
            animations:
                "disabled",
            caret:
                "hide",
        });

        const baselinePath =
            join(
                baselineDirectory,
                `${scene.name}.png`,
            );

        const diffPath =
            join(
                diffDirectory,
                `${scene.name}.png`,
            );

        const stabilityDiffPath =
            join(
                diffDirectory,
                `${scene.name}.stability.png`,
            );

        const stability =
            compareImages(
                actualPath,
                stabilityPath,
                stabilityDiffPath,
            );

        if (
            !stability.passed
        ) {
            results.push({
                scene:
                    scene.name,
                route:
                    scene.route,
                mode,
                passed:
                    false,
                reason:
                    "unstable-capture",
                stability,
            });
        } else if (
            mode
            === "baseline"
        ) {
            writeFileSync(
                baselinePath,
                readFileSync(
                    stabilityPath,
                ),
            );

            results.push({
                scene:
                    scene.name,
                route:
                    scene.route,
                mode,
                passed:
                    true,
                baseline:
                    baselinePath,
                stability,
            });
        } else if (
            !existsSync(
                baselinePath,
            )
        ) {
            results.push({
                scene:
                    scene.name,
                route:
                    scene.route,
                mode,
                passed:
                    false,
                reason:
                    "missing-baseline",
                baseline:
                    baselinePath,
                stability,
            });
        } else {
            results.push({
                scene:
                    scene.name,
                route:
                    scene.route,
                mode,
                stability,
                ...compareImages(
                    baselinePath,
                    stabilityPath,
                    diffPath,
                ),
            });
        }

        await context.close();
    }

    const failures =
        results.filter(
            (
                result,
            ) =>
                !result.passed,
        );

    const report = {
        schemaVersion:
            1,
        generatedAt:
            new Date()
                .toISOString(),
        mode,
        scenes:
            scenes.length,
        thresholds,
        failures:
            failures.length,
        passed:
            failures.length
            === 0,
        results,
    };

    writeFileSync(
        join(
            outputDirectory,
            "results.json",
        ),
        JSON.stringify(
            report,
            null,
            2,
        )
        + "\n",
        "utf8",
    );

    const markdown = [
        "# S–S+ visual regression",
        "",
        `- Mode: ${mode}`,
        `- Scenes: ${report.scenes}`,
        `- Pixel threshold: ${thresholds.pixelmatchThreshold}`,
        `- Maximum changed ratio: ${(thresholds.maximumChangedRatio * 100).toFixed(3)}%`,
        `- Maximum changed pixels: ${thresholds.maximumChangedPixels.toLocaleString("en-US")}`,
        `- Failures: ${report.failures}`,
        `- Result: ${report.passed ? "PASS" : "FAIL"}`,
        "",
        "## Scenes",
        "",
        ...results.map(
            (
                result,
            ) =>
                `- ${result.passed ? "PASS" : "FAIL"} — ${result.scene} (${result.route})${
                    typeof result.changedRatio === "number"
                        ? ` — ${(result.changedRatio * 100).toFixed(4)}%, ${result.changedPixels.toLocaleString("en-US")} pixels`
                        : ""
                }`,
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
            {
                mode:
                    report.mode,
                scenes:
                    report.scenes,
                failures:
                    report.failures,
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
