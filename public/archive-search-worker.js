"use strict";

let indexPromise;

function normalized(
    value,
) {
    return String(
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
}

async function index() {
    if (!indexPromise) {
        indexPromise =
            fetch(
                "/_archive-search/manifest.json",
                {
                    cache:
                        "no-cache",
                },
            )
                .then(
                    (
                        response,
                    ) => {
                        if (!response.ok) {
                            throw new Error(
                                `Manifest HTTP ${response.status}`,
                            );
                        }

                        return response.json();
                    },
                )
                .then(
                    async (
                        manifest,
                    ) => {
                        const response =
                            await fetch(
                                manifest.file,
                                {
                                    cache:
                                        "force-cache",
                                },
                            );

                        if (!response.ok) {
                            throw new Error(
                                `Index HTTP ${response.status}`,
                            );
                        }

                        return {
                            manifest,
                            payload:
                                await response.json(),
                        };
                    },
                );
    }

    return indexPromise;
}

function rank(
    entry,
    query,
    tokens,
) {
    const title =
        normalized(
            entry.title,
        );

    const project =
        normalized(
            entry.project,
        );

    let score = 0;

    if (
        title
        === query
    ) {
        score += 1_300;
    } else if (
        title.startsWith(
            query,
        )
    ) {
        score += 850;
    } else if (
        title.includes(
            query,
        )
    ) {
        score += 620;
    }

    if (
        project
        === query
    ) {
        score += 420;
    } else if (
        project.includes(
            query,
        )
    ) {
        score += 220;
    }

    for (
        const token
        of tokens
    ) {
        if (
            entry.search.includes(
                token,
            )
        ) {
            score += 70;
        } else {
            return 0;
        }
    }

    if (
        entry.kind
        === "download"
    ) {
        score += 55;
    }

    return score;
}

self.addEventListener(
    "message",
    async (
        event,
    ) => {
        const message =
            event.data
            ?? {};

        if (
            message.type
            !== "search"
        ) {
            return;
        }

        try {
            const query =
                normalized(
                    message.query,
                );

            if (
                query.length
                < 2
            ) {
                self.postMessage({
                    type:
                        "results",
                    requestId:
                        message.requestId,
                    results: [],
                    total:
                        0,
                    indexEntries:
                        0,
                });

                return;
            }

            const {
                manifest,
                payload,
            } = await index();

            const tokens =
                query.split(
                    " ",
                ).filter(
                    Boolean,
                );

            const results = [];

            for (
                const entry
                of payload.entries
            ) {
                if (
                    message.kind
                    && message.kind
                        !== "all"
                    && entry.kind
                        !== message.kind
                ) {
                    continue;
                }

                const score =
                    rank(
                        entry,
                        query,
                        tokens,
                    );

                if (
                    score
                    <= 0
                ) {
                    continue;
                }

                results.push({
                    ...entry,
                    score,
                });
            }

            results.sort(
                (
                    left,
                    right,
                ) =>
                    right.score
                    - left.score
                    || left.project.localeCompare(
                        right.project,
                    )
                    || left.title.localeCompare(
                        right.title,
                    ),
            );

            self.postMessage({
                type:
                    "results",
                requestId:
                    message.requestId,
                results:
                    results.slice(
                        0,
                        80,
                    ),
                total:
                    results.length,
                indexEntries:
                    manifest.entries,
            });
        } catch (
            error
        ) {
            self.postMessage({
                type:
                    "error",
                requestId:
                    message.requestId,
                message:
                    error instanceof Error
                        ? error.message
                        : "Archive search failed.",
            });
        }
    },
);
