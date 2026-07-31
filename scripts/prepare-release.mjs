import {
    cpSync,
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    rmSync,
    statSync,
    writeFileSync,
} from "node:fs";
import {
    join,
    relative,
} from "node:path";

const root =
    process.cwd();

const source =
    join(
        root,
        ".next",
        "standalone",
    );

const destination =
    join(
        root,
        "dist",
        "forestoflight-hub",
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

if (
    !existsSync(
        join(
            source,
            "server.js",
        ),
    )
) {
    throw new Error(
        "Next.js standalone output is missing. Run npm run build first.",
    );
}

rmSync(
    destination,
    {
        recursive:
            true,
        force:
            true,
    },
);

mkdirSync(
    destination,
    {
        recursive:
            true,
    },
);

cpSync(
    source,
    destination,
    {
        recursive:
            true,
    },
);

cpSync(
    join(
        root,
        ".next",
        "static",
    ),
    join(
        destination,
        ".next",
        "static",
    ),
    {
        recursive:
            true,
    },
);

cpSync(
    join(
        root,
        "public",
    ),
    join(
        destination,
        "public",
    ),
    {
        recursive:
            true,
    },
);

for (
    const optionalFile
    of [
        ".env.example",
        "DEPLOYMENT.md",
        "OPERATIONS.md",
        "RELEASE_CHECKLIST.md",
    ]
) {
    const path =
        join(
            root,
            optionalFile,
        );

    if (
        existsSync(
            path,
        )
    ) {
        cpSync(
            path,
            join(
                destination,
                optionalFile,
            ),
        );
    }
}

function listFiles(
    directory,
) {
    const output = [];

    for (
        const name
        of readdirSync(
            directory,
        )
    ) {
        const absolute =
            join(
                directory,
                name,
            );

        const stats =
            statSync(
                absolute,
            );

        if (
            stats.isDirectory()
        ) {
            output.push(
                ...listFiles(
                    absolute,
                ),
            );
        } else {
            output.push({
                path:
                    relative(
                        destination,
                        absolute,
                    )
                        .replaceAll(
                            "\\",
                            "/",
                        ),
                bytes:
                    stats.size,
            });
        }
    }

    return output;
}

const files =
    listFiles(
        destination,
    );

const manifest = {
    schemaVersion:
        1,
    name:
        "forestoflight-technical-bedrock-hub",
    generatedAt:
        new Date()
            .toISOString(),
    sourceGeneratedAt:
        delivery.generatedAt,
    fingerprint:
        delivery.fingerprint,
    node:
        process.version,
    startup:
        "node server.js",
    health:
        "/api/health",
    port:
        3000,
    files:
        files.length,
    bytes:
        files.reduce(
            (
                total,
                file,
            ) =>
                total
                + file.bytes,
            0,
        ),
    routes:
        delivery.routes.length,
};

writeFileSync(
    join(
        destination,
        "release-manifest.json",
    ),
    JSON.stringify(
        manifest,
        null,
        2,
    )
    + "\n",
    "utf8",
);

console.log(
    JSON.stringify(
        manifest,
        null,
        2,
    ),
);
