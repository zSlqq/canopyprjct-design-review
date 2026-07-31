#!/usr/bin/env node

import {
    createHash,
} from "node:crypto";
import {
    mkdir,
    readFile,
    stat,
    writeFile,
} from "node:fs/promises";
import {
    basename,
    dirname,
    extname,
    join,
} from "node:path";

import sharp from "sharp";

const root =
    "C:/Users/DELL/AppData/Local/Temp/forestoflight-stage35/closure-v4-20260729-234024/repository";

const generatedRoot =
    join(
        root,
        "lib/data/generated/curated-archive",
    );

const publicRoot =
    join(
        root,
        "public",
    );

const manifestPath =
    join(
        generatedRoot,
        "manifest.json",
    );

const maximumSourceBytes =
    1_250_000;

const maximumPosterWidth =
    960;

const manifest =
    JSON.parse(
        await readFile(
            manifestPath,
            "utf8",
        ),
    );

const report = {
    schemaVersion:
        1,
    projects:
        0,
    images:
        0,
    optimized:
        0,
    originalBytes:
        0,
    deliveredBytes:
        0,
    failures:
        [],
    passed:
        false,
};

function localPath(
    source,
) {
    if (
        typeof source
        !== "string"
        || !source.startsWith(
            "/_curated-archive/",
        )
    ) {
        return null;
    }

    return join(
        publicRoot,
        source.slice(
            1,
        ),
    );
}

async function optimizeBlock(
    block,
    projectSlug,
) {
    if (
        !block
        || block.type
            !== "image"
    ) {
        return;
    }

    report.images +=
        1;

    const input =
        localPath(
            block.src,
        );

    if (!input) {
        report.failures.push(
            `${projectSlug}: non-local image remained: ${String(block.src)}`,
        );
        return;
    }

    let sourceStat;

    try {
        sourceStat =
            await stat(
                input,
            );
    } catch {
        report.failures.push(
            `${projectSlug}: local image is missing: ${block.src}`,
        );
        return;
    }

    report.originalBytes +=
        sourceStat.size;

    const extension =
        extname(
            input,
        ).toLowerCase();

    let metadata;

    try {
        metadata =
            await sharp(
                input,
                {
                    animated:
                        false,
                    failOn:
                        "none",
                },
            ).metadata();
    } catch (
        error
    ) {
        report.failures.push(
            `${projectSlug}: unreadable image ${block.src}: ${error instanceof Error ? error.message : String(error)}`,
        );
        return;
    }

    if (
        Number.isFinite(
            metadata.width,
        )
        && metadata.width
    ) {
        block.width =
            metadata.width;
    }

    if (
        Number.isFinite(
            metadata.height,
        )
        && metadata.height
    ) {
        block.height =
            metadata.height;
    }

    const preserveOriginal =
        block.src
        === "/_curated-archive/canopy/dupe-tnt.png";

    const needsPoster =
        !preserveOriginal
        && (
            extension
            === ".gif"
            || sourceStat.size
                > maximumSourceBytes
        );

    if (!needsPoster) {
        report.deliveredBytes +=
            sourceStat.size;
        return;
    }

    const source =
        await readFile(
            input,
        );

    const fingerprint =
        createHash(
            "sha256",
        )
            .update(
                source,
            )
            .update(
                "stage35-final-static-webp-960-q82",
            )
            .digest(
                "hex",
            )
            .slice(
                0,
                12,
            );

    const outputName =
        `${basename(input, extension)}.${fingerprint}.poster.webp`;

    const output =
        join(
            dirname(
                input,
            ),
            outputName,
        );

    await mkdir(
        dirname(
            output,
        ),
        {
            recursive:
                true,
        },
    );

    const result =
        await sharp(
            input,
            {
                animated:
                    false,
                failOn:
                    "none",
            },
        )
            .rotate()
            .resize({
                width:
                    maximumPosterWidth,
                height:
                    maximumPosterWidth,
                fit:
                    "inside",
                withoutEnlargement:
                    true,
            })
            .webp({
                quality:
                    82,
                effort:
                    6,
                smartSubsample:
                    true,
            })
            .toFile(
                output,
            );

    block.src =
        block.src.replace(
            /[^/]+$/,
            outputName,
        );

    block.width =
        result.width;

    block.height =
        result.height;

    report.optimized +=
        1;

    report.deliveredBytes +=
        result.size;
}

async function visit(
    value,
    projectSlug,
) {
    if (
        Array.isArray(
            value,
        )
    ) {
        for (
            const item
            of value
        ) {
            await visit(
                item,
                projectSlug,
            );
        }
        return;
    }

    if (
        !value
        || typeof value
            !== "object"
    ) {
        return;
    }

    if (
        value.type
        === "image"
    ) {
        await optimizeBlock(
            value,
            projectSlug,
        );
    }

    for (
        const child
        of Object.values(
            value,
        )
    ) {
        await visit(
            child,
            projectSlug,
        );
    }
}

for (
    const summary
    of manifest.projects
    ?? []
) {
    const projectPath =
        join(
            generatedRoot,
            summary.file,
        );

    const project =
        JSON.parse(
            await readFile(
                projectPath,
                "utf8",
            ),
        );

    await visit(
        project,
        String(
            project.slug
            || summary.slug
            || "project",
        ),
    );

    await writeFile(
        projectPath,
        JSON.stringify(
            project,
            null,
            2,
        )
        + "\n",
        "utf8",
    );

    report.projects +=
        1;
}

report.passed =
    report.projects
        === (manifest.projects?.length ?? 0)
    && report.failures.length
        === 0
    && report.deliveredBytes
        <= report.originalBytes;

await writeFile(
    join(
        generatedRoot,
        "media-optimization.json",
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

if (!report.passed) {
    process.exitCode =
        1;
}
