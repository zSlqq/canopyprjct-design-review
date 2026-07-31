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

export type ArchiveReleaseAsset = {
    name: string;
    downloadUrl: string;
    bytes: number;
    downloads: number;
    contentType: string;
};

export type ArchiveRelease = {
    tag: string;
    name: string;
    publishedAt: string;
    prerelease: boolean;
    draft: boolean;
    notes: string;
    htmlUrl: string;
    assets: ArchiveReleaseAsset[];
    sourceZipUrl: string;
    sourceTarUrl: string;
    formalRelease: boolean;
};

export type ArchiveContributor = {
    login: string;
    contributions: number;
    profileUrl: string;
    avatar: string;
    type: string;
};

export type ArchiveFunction = {
    name: string;
    kind: string;
    signature: string;
    file: string;
    line: number;
    exported: boolean;
};

export type ArchiveCommand = {
    command: string;
    source: string;
    line: number;
    context: string;
};

export type ArchiveRule = {
    name: string;
    source: string;
};

export type ArchiveDocument = {
    source: string;
    title: string;
    headings: string[];
    bytes: number;
};

export type ArchiveCounts = {
    versions: number;
    releaseAssets: number;
    contributors: number;
    functions: number;
    commands: number;
    globalRules: number;
    documents: number;
};

export type ArchiveProjectSummary = {
    slug: string;
    name: string;
    description: string;
    language: string;
    fork: boolean;
    archived: boolean;
    updatedAt: string;
    stars: number;
    counts: ArchiveCounts;
    file: string;
    sha256: string;
    bytes: number;
};

export type ArchiveManifest = {
    schemaVersion: number;
    generatedAt: string;
    owner: string;
    projects: ArchiveProjectSummary[];
    summary: ArchiveCounts & {
        repositories: number;
    };
    failures: {
        repository: string;
        stage: string;
        error: string;
    }[];
    authenticated: boolean;
    passed: boolean;
};

export type ArchiveProject = {
    schemaVersion: number;
    slug: string;
    name: string;
    fullName: string;
    description: string;
    homepage: string;
    repositoryUrl: string;
    defaultBranch: string;
    language: string;
    license: string;
    fork: boolean;
    archived: boolean;
    createdAt: string;
    updatedAt: string;
    pushedAt: string;
    stars: number;
    forks: number;
    openIssues: number;
    topics: string[];
    releases: ArchiveRelease[];
    contributors: ArchiveContributor[];
    functions: ArchiveFunction[];
    commands: ArchiveCommand[];
    globalRules: ArchiveRule[];
    documents: ArchiveDocument[];
    counts: ArchiveCounts;
};

const generatedRoot =
    join(
        process.cwd(),
        "lib",
        "data",
        "generated",
        "archive",
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

export const getArchiveManifest =
    cache(
        async (): Promise<ArchiveManifest> =>
            readJson<ArchiveManifest>(
                join(
                    generatedRoot,
                    "manifest.json",
                ),
            ),
    );

export const getArchiveProject =
    cache(
        async (
            slug: string,
        ): Promise<ArchiveProject | null> => {
            const manifest =
                await getArchiveManifest();

            const summary =
                manifest.projects.find(
                    (
                        project,
                    ) =>
                        project.slug
                        === slug,
                );

            if (!summary) {
                return null;
            }

            return readJson<ArchiveProject>(
                join(
                    generatedRoot,
                    summary.file,
                ),
            );
        },
    );
