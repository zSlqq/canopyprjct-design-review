import {
    createHash,
} from "node:crypto";
import {
    existsSync,
    mkdirSync,
    readFileSync,
    statSync,
    writeFileSync,
} from "node:fs";
import {
    join,
} from "node:path";

const root =
    process.cwd();

function loadJson(
    ...segments
) {
    return JSON.parse(
        readFileSync(
            join(
                root,
                ...segments,
            ),
            "utf8",
        ),
    );
}

function sha256(
    path,
) {
    return createHash(
        "sha256",
    )
        .update(
            readFileSync(
                path,
            ),
        )
        .digest(
            "hex",
        );
}

const docs =
    loadJson(
        "lib",
        "data",
        "generated",
        "docs",
        "index-manifest.json",
    );

const publicDocs =
    loadJson(
        "public",
        "_docs-index",
        "manifest.json",
    );

const features =
    loadJson(
        "lib",
        "data",
        "generated",
        "features",
        "manifest.json",
    );

const publicFeatures =
    loadJson(
        "public",
        "_feature-library",
        "manifest.json",
    );

const delivery =
    loadJson(
        "lib",
        "data",
        "generated",
        "docs",
        "delivery-manifest.json",
    );

const prerender =
    loadJson(
        ".next",
        "prerender-manifest.json",
    );

const packageJson =
    loadJson(
        "package.json",
    );

const release =
    loadJson(
        "dist",
        "forestoflight-hub",
        "release-manifest.json",
    );

const failures = [];

function assert(
    condition,
    message,
) {
    if (
        !condition
    ) {
        failures.push(
            message,
        );
    }
}

assert(
    JSON.stringify(
        docs,
    )
    === JSON.stringify(
        publicDocs,
    ),
    "Generated and public documentation manifests differ.",
);

assert(
    JSON.stringify(
        features,
    )
    === JSON.stringify(
        publicFeatures,
    ),
    "Generated and public feature manifests differ.",
);

assert(
    docs.totalEntries
    === features.totalEntries,
    "Feature coverage does not equal documentation search coverage.",
);

assert(
    docs.projects.length
    === features.projects.length,
    "Feature project coverage does not equal documentation project coverage.",
);

assert(
    delivery.passed
    === true,
    "Delivery manifest is not passing.",
);

assert(
    release.fingerprint
    === delivery.fingerprint,
    "Release fingerprint does not match delivery fingerprint.",
);

assert(
    existsSync(
        join(
            root,
            ".next",
            "standalone",
            "server.js",
        ),
    ),
    "Next.js standalone server is missing.",
);

assert(
    existsSync(
        join(
            root,
            "dist",
            "forestoflight-hub",
            "server.js",
        ),
    ),
    "Prepared release server is missing.",
);

assert(
    existsSync(
        join(
            root,
            "dist",
            "forestoflight-hub",
            ".next",
            "static",
        ),
    ),
    "Prepared release static assets are missing.",
);

for (
    const project
    of docs.projects
) {
    const path =
        join(
            root,
            "public",
            project.file
                .replace(
                    /^\/+/,
                    "",
                ),
        );

    assert(
        existsSync(
            path,
        ),
        `Documentation shard is missing: ${project.file}`,
    );

    if (
        existsSync(
            path,
        )
    ) {
        assert(
            sha256(
                path,
            )
                .slice(
                    0,
                    16,
                )
            === project.hash,
            `Documentation shard hash mismatch: ${project.file}`,
        );
    }
}

for (
    const project
    of features.projects
) {
    const path =
        join(
            root,
            "public",
            project.file
                .replace(
                    /^\/+/,
                    "",
                ),
        );

    assert(
        existsSync(
            path,
        ),
        `Feature shard is missing: ${project.file}`,
    );

    if (
        existsSync(
            path,
        )
    ) {
        assert(
            sha256(
                path,
            )
                .slice(
                    0,
                    16,
                )
            === project.hash,
            `Feature shard hash mismatch: ${project.file}`,
        );
    }
}

const prerenderRoutes =
    new Set(
        Object.keys(
            prerender.routes
            ?? {},
        ),
    );

for (
    const route
    of delivery.routes
) {
    assert(
        prerenderRoutes.has(
            route,
        ),
        `Canonical route is not prerendered: ${route}`,
    );
}

for (
    const script
    of [
        "features:build",
        "delivery:build",
        "release:prepare",
        "release:verify",
        "quality",
        "site",
    ]
) {
    assert(
        Boolean(
            packageJson.scripts
                ?.[script],
        ),
        `Required package script is missing: ${script}`,
    );
}

for (
    const path
    of [
        ".github/workflows/quality.yml",
        ".github/workflows/docs-sync.yml",
        ".github/dependabot.yml",
        "Dockerfile",
        ".dockerignore",
        "DEPLOYMENT.md",
        "OPERATIONS.md",
        "RELEASE_CHECKLIST.md",
    ]
) {
    assert(
        existsSync(
            join(
                root,
                path,
            ),
        ),
        `Release file is missing: ${path}`,
    );
}

assert(
    statSync(
        join(
            root,
            "dist",
            "forestoflight-hub",
            "server.js",
        ),
    ).size
    > 0,
    "Prepared release server is empty.",
);

const report = {
    schemaVersion:
        1,
    generatedAt:
        new Date()
            .toISOString(),
    projects:
        docs.projects.length,
    documents:
        delivery.summary.documents,
    sections:
        docs.totalEntries,
    featureEntries:
        features.totalEntries,
    routes:
        delivery.routes.length,
    releaseFiles:
        release.files,
    releaseBytes:
        release.bytes,
    fingerprint:
        delivery.fingerprint,
    failures,
    passed:
        failures.length
        === 0,
};

const reportDirectory =
    join(
        root,
        ".stage30",
    );

mkdirSync(
    reportDirectory,
    {
        recursive:
            true,
    },
);

writeFileSync(
    join(
        reportDirectory,
        "release-verification.json",
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
