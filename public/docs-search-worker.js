"use strict";

const CACHE_PREFIX =
    "forestoflight-docs-search-v3-";

const memoryShards =
    new Map();

const pendingShards =
    new Map();

let manifest = null;
let cacheName =
    `${CACHE_PREFIX}unconfigured`;

function normalize(value) {
    return String(value || "")
        .normalize("NFKD")
        .replace(
            /[\u0300-\u036f]/g,
            "",
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9._:/+-]+/g,
            " ",
        )
        .replace(
            /\s+/g,
            " ",
        )
        .trim();
}

function identityHash(value) {
    let hash = 2166136261;

    for (
        let index = 0;
        index < value.length;
        index += 1
    ) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(
            hash,
            16777619,
        );
    }

    return (
        hash >>> 0
    )
        .toString(16)
        .padStart(8, "0");
}

function configureCache(
    nextManifest,
) {
    const identity =
        nextManifest.projects
            .map(
                (project) =>
                    `${project.projectId}:${project.hash}`,
            )
            .sort()
            .join("|");

    cacheName =
        CACHE_PREFIX
        + identityHash(identity);
}

async function cleanupCaches() {
    if (
        typeof caches
        === "undefined"
    ) {
        return;
    }

    const names =
        await caches.keys();

    await Promise.all(
        names
            .filter(
                (name) =>
                    name.startsWith(
                        CACHE_PREFIX,
                    )
                    && name
                        !== cacheName,
            )
            .map(
                (name) =>
                    caches.delete(name),
            ),
    );
}

async function fetchShardResponse(
    project,
) {
    const request =
        new Request(
            project.file,
            {
                credentials:
                    "same-origin",
            },
        );

    if (
        typeof caches
        === "undefined"
    ) {
        const response =
            await fetch(
                request,
                {
                    cache:
                        "force-cache",
                },
            );

        if (!response.ok) {
            throw new Error(
                `Search shard ${project.projectId} returned HTTP ${response.status}.`,
            );
        }

        return response;
    }

    const cache =
        await caches.open(
            cacheName,
        );

    const cached =
        await cache.match(
            request,
        );

    if (cached) {
        return cached;
    }

    const response =
        await fetch(
            request,
            {
                cache:
                    "force-cache",
            },
        );

    if (!response.ok) {
        throw new Error(
            `Search shard ${project.projectId} returned HTTP ${response.status}.`,
        );
    }

    await cache.put(
        request,
        response.clone(),
    );

    return response;
}

async function loadShard(
    project,
) {
    if (
        memoryShards.has(
            project.projectId,
        )
    ) {
        return memoryShards.get(
            project.projectId,
        );
    }

    if (
        pendingShards.has(
            project.projectId,
        )
    ) {
        return pendingShards.get(
            project.projectId,
        );
    }

    const promise =
        (async () => {
            const response =
                await fetchShardResponse(
                    project,
                );

            const payload =
                await response.json();

            if (
                !payload
                || !Array.isArray(
                    payload.entries,
                )
            ) {
                throw new Error(
                    `Search shard ${project.projectId} is malformed.`,
                );
            }

            memoryShards.set(
                project.projectId,
                payload.entries,
            );

            return payload.entries;
        })();

    pendingShards.set(
        project.projectId,
        promise,
    );

    try {
        return await promise;
    } finally {
        pendingShards.delete(
            project.projectId,
        );
    }
}

function tokenize(query) {
    const stopWords =
        new Set([
            "a",
            "an",
            "and",
            "are",
            "as",
            "at",
            "be",
            "by",
            "for",
            "from",
            "in",
            "is",
            "it",
            "of",
            "on",
            "or",
            "the",
            "to",
            "with",
        ]);

    return [
        ...new Set(
            normalize(query)
                .split(" ")
                .filter(
                    (token) =>
                        token.length
                            >= 2
                        && !stopWords
                            .has(token),
                ),
        ),
    ];
}

function fieldScore(
    value,
    phrase,
    tokens,
    weights,
) {
    const field =
        normalize(value);

    if (!field) {
        return 0;
    }

    let score = 0;

    if (
        phrase
        && field === phrase
    ) {
        score += weights.exact;
    } else if (
        phrase
        && field.includes(phrase)
    ) {
        score += weights.phrase;
    }

    for (
        const token
        of tokens
    ) {
        if (field === token) {
            score += weights.tokenExact;
        } else if (
            field
                .split(" ")
                .includes(token)
        ) {
            score += weights.word;
        } else if (
            field.includes(token)
        ) {
            score += weights.partial;
        }
    }

    return score;
}

function rankEntry(
    entry,
    phrase,
    tokens,
) {
    const joinedHeadings =
        Array.isArray(
            entry.headingPath,
        )
            ? entry.headingPath
                .join(" ")
            : "";

    const combined =
        normalize(
            [
                entry.projectTitle,
                entry.repository,
                entry.documentTitle,
                entry.sectionTitle,
                joinedHeadings,
                entry.searchText,
            ].join(" "),
        );

    const matched =
        tokens.filter(
            (token) =>
                combined.includes(token),
        );

    if (
        matched.length === 0
    ) {
        return 0;
    }

    let score = 0;

    score += fieldScore(
        entry.sectionTitle,
        phrase,
        tokens,
        {
            exact: 320,
            phrase: 230,
            tokenExact: 110,
            word: 74,
            partial: 34,
        },
    );

    score += fieldScore(
        entry.documentTitle,
        phrase,
        tokens,
        {
            exact: 280,
            phrase: 190,
            tokenExact: 96,
            word: 64,
            partial: 30,
        },
    );

    score += fieldScore(
        joinedHeadings,
        phrase,
        tokens,
        {
            exact: 190,
            phrase: 145,
            tokenExact: 70,
            word: 48,
            partial: 22,
        },
    );

    score += fieldScore(
        `${entry.projectTitle || ""} ${entry.repository || ""}`,
        phrase,
        tokens,
        {
            exact: 170,
            phrase: 120,
            tokenExact: 58,
            word: 38,
            partial: 18,
        },
    );

    score += fieldScore(
        entry.searchText,
        phrase,
        tokens,
        {
            exact: 82,
            phrase: 64,
            tokenExact: 25,
            word: 17,
            partial: 7,
        },
    );

    score +=
        matched.length
        * 36;

    if (
        tokens.length > 1
        && matched.length
            === tokens.length
    ) {
        score += 140;
    }

    if (
        entry.sourceType
        === "wiki"
    ) {
        score += 4;
    }

    return score;
}

function createSnippet(
    entry,
    tokens,
) {
    const source =
        String(
            entry.text
            || entry.sectionTitle
            || entry.documentTitle
            || "",
        )
            .replace(
                /\s+/g,
                " ",
            )
            .trim();

    if (!source) {
        return "";
    }

    const normalized =
        normalize(source);

    let position = -1;

    for (
        const token
        of tokens
    ) {
        const candidate =
            normalized.indexOf(token);

        if (
            candidate >= 0
            && (
                position < 0
                || candidate
                    < position
            )
        ) {
            position = candidate;
        }
    }

    const start =
        position > 90
            ? position - 90
            : 0;

    const end =
        Math.min(
            source.length,
            start + 320,
        );

    return (
        (
            start > 0
                ? "…"
                : ""
        )
        + source.slice(
            start,
            end,
        )
        + (
            end < source.length
                ? "…"
                : ""
        )
    );
}

async function searchDocumentation(
    message,
) {
    if (!manifest) {
        throw new Error(
            "Search worker is not configured.",
        );
    }

    const started =
        performance.now();

    const query =
        normalize(
            message.query,
        );

    const tokens =
        tokenize(query);

    if (
        query.length < 2
        || tokens.length === 0
    ) {
        return {
            requestId:
                message.requestId,
            query,
            projectId:
                message.projectId
                || "all",
            results: [],
            totalMatches: 0,
            durationMs: 0,
            searchedProjects: 0,
            cachedShards:
                memoryShards.size,
            projectCounts: {},
        };
    }

    const requestedProject =
        message.projectId
        || "all";

    const selectedProjects =
        requestedProject
            === "all"
            ? manifest.projects
            : manifest.projects
                .filter(
                    (project) =>
                        project.projectId
                        === requestedProject,
                );

    const shards =
        await Promise.all(
            selectedProjects.map(
                async (project) => ({
                    project,
                    entries:
                        await loadShard(
                            project,
                        ),
                }),
            ),
        );

    const ranked = [];
    const projectCounts = {};

    for (
        const shard
        of shards
    ) {
        for (
            const entry
            of shard.entries
        ) {
            const score =
                rankEntry(
                    entry,
                    query,
                    tokens,
                );

            if (score <= 0) {
                continue;
            }

            projectCounts[
                entry.projectId
            ] =
                (
                    projectCounts[
                        entry.projectId
                    ]
                    || 0
                )
                + 1;

            ranked.push({
                id:
                    entry.id,
                documentId:
                    entry.documentId,
                projectId:
                    entry.projectId,
                projectTitle:
                    entry.projectTitle,
                repository:
                    entry.repository,
                sourceType:
                    entry.sourceType,
                route:
                    entry.route,
                documentTitle:
                    entry.documentTitle,
                sectionTitle:
                    entry.sectionTitle,
                headingPath:
                    Array.isArray(
                        entry.headingPath,
                    )
                        ? entry.headingPath
                        : [],
                sourceUrl:
                    entry.sourceUrl,
                snippet:
                    createSnippet(
                        entry,
                        tokens,
                    ),
                score,
            });
        }
    }

    ranked.sort(
        (first, second) =>
            second.score
            - first.score
            || String(
                first.projectTitle,
            ).localeCompare(
                String(
                    second.projectTitle,
                ),
            )
            || String(
                first.sectionTitle,
            ).localeCompare(
                String(
                    second.sectionTitle,
                ),
            ),
    );

    const limit =
        Math.max(
            1,
            Math.min(
                Number(
                    message.limit,
                )
                || 64,
                100,
            ),
        );

    return {
        requestId:
            message.requestId,
        query,
        projectId:
            requestedProject,
        results:
            ranked.slice(
                0,
                limit,
            ),
        totalMatches:
            ranked.length,
        durationMs:
            Math.round(
                (
                    performance.now()
                    - started
                )
                * 100,
            )
            / 100,
        searchedProjects:
            selectedProjects.length,
        cachedShards:
            memoryShards.size,
        projectCounts,
    };
}

async function prewarm() {
    if (!manifest) {
        return;
    }

    let loaded = 0;

    for (
        let index = 0;
        index
        < manifest.projects.length;
        index += 4
    ) {
        const group =
            manifest.projects.slice(
                index,
                index + 4,
            );

        await Promise.all(
            group.map(
                (project) =>
                    loadShard(
                        project,
                    ),
            ),
        );

        loaded += group.length;

        self.postMessage({
            type:
                "warm-progress",
            loaded,
            total:
                manifest.projects.length,
            cacheName,
        });
    }

    self.postMessage({
        type:
            "warm-complete",
        loaded,
        total:
            manifest.projects.length,
        cacheName,
    });
}

self.addEventListener(
    "message",
    async (event) => {
        const message =
            event.data || {};

        try {
            if (
                message.type
                === "configure"
            ) {
                if (
                    !message.manifest
                    || !Array.isArray(
                        message
                            .manifest
                            .projects,
                    )
                ) {
                    throw new Error(
                        "Invalid search manifest.",
                    );
                }

                manifest =
                    message.manifest;

                configureCache(
                    manifest,
                );

                await cleanupCaches();

                self.postMessage({
                    type:
                        "ready",
                    projects:
                        manifest.projects
                            .length,
                    totalEntries:
                        manifest
                            .totalEntries,
                    cacheName,
                });

                return;
            }

            if (
                message.type
                === "prewarm"
            ) {
                await prewarm();
                return;
            }

            if (
                message.type
                === "search"
            ) {
                self.postMessage({
                    type:
                        "results",
                    payload:
                        await searchDocumentation(
                            message,
                        ),
                });

                return;
            }

            if (
                message.type
                === "cache-status"
            ) {
                self.postMessage({
                    type:
                        "cache-status",
                    loaded:
                        memoryShards.size,
                    total:
                        manifest
                            ?.projects
                            ?.length
                        || 0,
                    cacheName,
                });
            }
        } catch (error) {
            self.postMessage({
                type:
                    "error",
                requestId:
                    message.requestId
                    ?? null,
                message:
                    error instanceof Error
                        ? error.message
                        : String(error),
            });
        }
    },
);
