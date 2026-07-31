import "server-only";

import {
    cache,
} from "react";

import {
    readFile,
} from "node:fs/promises";

import {
    join,
} from "node:path";

import type {
    CuratedArchiveManifest,
    CuratedArchiveProject,
} from "@/lib/curated-archive-types";

export type {
    CuratedArchiveManifest,
    CuratedArchiveProject,
    CuratedBlock,
    CuratedContributor,
    CuratedDocument,
    CuratedDownload,
    CuratedEntry,
    CuratedRelease,
    CuratedSection,
} from "@/lib/curated-archive-types";

const generatedRoot =
    join(
        process.cwd(),
        "lib",
        "data",
        "generated",
        "curated-archive",
    );

async function readJson<T>(
    path: string,
): Promise<T> {
    return JSON.parse(
        await readFile(
            path,
            "utf8",
        ),
    ) as T;
}

export const getCuratedArchiveManifest =
    cache(
        async (): Promise<CuratedArchiveManifest> =>
            readJson<CuratedArchiveManifest>(
                join(
                    generatedRoot,
                    "manifest.json",
                ),
            ),
    );

export const getCuratedArchiveProject =
    cache(
        async (
            slug: string,
        ): Promise<CuratedArchiveProject | null> => {
            const manifest =
                await getCuratedArchiveManifest();

            const project =
                manifest.projects.find(
                    (
                        item,
                    ) =>
                        item.slug
                        === slug,
                );

            if (!project) {
                return null;
            }

            return readJson<CuratedArchiveProject>(
                join(
                    generatedRoot,
                    project.file,
                ),
            );
        },
    );
