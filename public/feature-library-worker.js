"use strict";

const CACHE_PREFIX = "forestoflight-feature-library-v1-";
const memoryShards = new Map();
const pendingShards = new Map();

let manifest = null;
let cacheName = `${CACHE_PREFIX}unconfigured`;

function normalize(value) {
    return String(value || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9._:/+-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function identityHash(value) {
    let hash = 2166136261;

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(16).padStart(8, "0");
}

function configureCache(nextManifest) {
    const identity = nextManifest.projects
        .map((project) => `${project.projectId}:${project.hash}`)
        .sort()
        .join("|");

    cacheName = CACHE_PREFIX + identityHash(identity);
}

async function cleanupCaches() {
    if (typeof caches === "undefined") {
        return;
    }

    const names = await caches.keys();

    await Promise.all(
        names
            .filter(
                (name) =>
                    name.startsWith(CACHE_PREFIX)
                    && name !== cacheName,
            )
            .map((name) => caches.delete(name)),
    );
}

async function fetchShard(project) {
    const request = new Request(project.file, {
        credentials: "same-origin",
    });

    if (typeof caches === "undefined") {
        const response = await fetch(request, {
            cache: "force-cache",
        });

        if (!response.ok) {
            throw new Error(
                `Feature shard ${project.projectId} returned HTTP ${response.status}.`,
            );
        }

        return response;
    }

    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    const response = await fetch(request, {
        cache: "force-cache",
    });

    if (!response.ok) {
        throw new Error(
            `Feature shard ${project.projectId} returned HTTP ${response.status}.`,
        );
    }

    await cache.put(request, response.clone());
    return response;
}

async function loadShard(project) {
    if (memoryShards.has(project.projectId)) {
        return memoryShards.get(project.projectId);
    }

    if (pendingShards.has(project.projectId)) {
        return pendingShards.get(project.projectId);
    }

    const promise = (async () => {
        const response = await fetchShard(project);
        const payload = await response.json();

        if (!payload || !Array.isArray(payload.entries)) {
            throw new Error(
                `Feature shard ${project.projectId} is malformed.`,
            );
        }

        memoryShards.set(project.projectId, payload.entries);
        return payload.entries;
    })();

    pendingShards.set(project.projectId, promise);

    try {
        return await promise;
    } finally {
        pendingShards.delete(project.projectId);
    }
}

function tokenize(query) {
    const stopWords = new Set([
        "a", "an", "and", "are", "as", "at", "be", "by",
        "for", "from", "in", "is", "it", "of", "on", "or",
        "the", "to", "with",
    ]);

    return [
        ...new Set(
            normalize(query)
                .split(" ")
                .filter(
                    (token) =>
                        token.length >= 2
                        && !stopWords.has(token),
                ),
        ),
    ];
}

function scoreField(value, phrase, tokens, weights) {
    const field = normalize(value);

    if (!field) {
        return 0;
    }

    let score = 0;

    if (phrase && field === phrase) {
        score += weights.exact;
    } else if (phrase && field.includes(phrase)) {
        score += weights.phrase;
    }

    const words = new Set(field.split(" "));

    for (const token of tokens) {
        if (field === token) {
            score += weights.tokenExact;
        } else if (words.has(token)) {
            score += weights.word;
        } else if (field.includes(token)) {
            score += weights.partial;
        }
    }

    return score;
}

function rank(entry, phrase, tokens) {
    if (!phrase && tokens.length === 0) {
        return 1;
    }

    const headings = Array.isArray(entry.headingPath)
        ? entry.headingPath.join(" ")
        : "";

    const aliases = Array.isArray(entry.aliases)
        ? entry.aliases.join(" ")
        : "";

    const combined = normalize([
        entry.title,
        entry.originalTitle,
        entry.projectTitle,
        entry.repository,
        entry.kind,
        entry.documentTitle,
        headings,
        aliases,
        entry.snippet,
        entry.syntax,
    ].join(" "));

    const matched = tokens.filter((token) => combined.includes(token));

    if (tokens.length > 0 && matched.length === 0) {
        return 0;
    }

    let score = 0;

    score += scoreField(entry.title, phrase, tokens, {
        exact: 420,
        phrase: 310,
        tokenExact: 140,
        word: 92,
        partial: 40,
    });

    score += scoreField(entry.originalTitle, phrase, tokens, {
        exact: 230,
        phrase: 170,
        tokenExact: 76,
        word: 52,
        partial: 24,
    });

    score += scoreField(headings, phrase, tokens, {
        exact: 190,
        phrase: 145,
        tokenExact: 70,
        word: 48,
        partial: 22,
    });

    score += scoreField(
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

    score += scoreField(
        `${entry.snippet || ""} ${entry.syntax || ""}`,
        phrase,
        tokens,
        {
            exact: 84,
            phrase: 66,
            tokenExact: 25,
            word: 17,
            partial: 7,
        },
    );

    score += matched.length * 38;

    if (tokens.length > 1 && matched.length === tokens.length) {
        score += 160;
    }

    return score;
}

async function executeSearch(message) {
    if (!manifest) {
        throw new Error("Feature worker is not configured.");
    }

    const started = performance.now();
    const query = normalize(message.query);
    const tokens = tokenize(query);
    const requestedProject = message.projectId || "all";
    const requestedKind = message.kind || "all";

    const selectedProjects =
        requestedProject === "all"
            ? manifest.projects
            : manifest.projects.filter(
                (project) =>
                    project.projectId === requestedProject
                    || normalize(project.repository)
                        === normalize(requestedProject),
            );

    const shards = await Promise.all(
        selectedProjects.map(async (project) => ({
            project,
            entries: await loadShard(project),
        })),
    );

    const ranked = [];

    for (const shard of shards) {
        for (const entry of shard.entries) {
            if (
                requestedKind !== "all"
                && entry.kind !== requestedKind
            ) {
                continue;
            }

            const score = rank(entry, query, tokens);

            if (score <= 0) {
                continue;
            }

            ranked.push({ score, entry });
        }
    }

    ranked.sort(
        (first, second) =>
            second.score - first.score
            || String(first.entry.projectTitle).localeCompare(
                String(second.entry.projectTitle),
            )
            || String(first.entry.title).localeCompare(
                String(second.entry.title),
            ),
    );

    const limit = Math.max(
        1,
        Math.min(240, Number(message.limit) || 48),
    );

    return {
        requestId: message.requestId,
        query,
        projectId: requestedProject,
        kind: requestedKind,
        results: ranked.slice(0, limit).map((item) => item.entry),
        totalMatches: ranked.length,
        searchedProjects: selectedProjects.length,
        loadedShards: memoryShards.size,
        durationMs:
            Math.round((performance.now() - started) * 1000) / 1000,
    };
}

self.addEventListener("message", async (event) => {
    const message = event.data || {};

    try {
        if (message.type === "configure") {
            if (
                !message.manifest
                || !Array.isArray(message.manifest.projects)
            ) {
                throw new Error("Invalid feature manifest.");
            }

            manifest = message.manifest;
            configureCache(manifest);
            await cleanupCaches();

            self.postMessage({
                type: "ready",
                projects: manifest.projects.length,
                entries: manifest.totalEntries,
                cacheName,
            });

            return;
        }

        if (message.type === "search") {
            const payload = await executeSearch(message);

            self.postMessage({
                type: "results",
                payload,
            });
        }
    } catch (error) {
        self.postMessage({
            type: "error",
            requestId: message.requestId || 0,
            message:
                error instanceof Error
                    ? error.message
                    : String(error),
        });
    }
});
