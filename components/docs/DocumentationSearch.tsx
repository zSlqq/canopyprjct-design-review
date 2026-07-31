"use client";

import {
    ArrowRight,
    BookOpen,
    Command,
    Database,
    Layers3,
    LoaderCircle,
    Search as SearchIcon,
    Sparkles,
    X,
} from "lucide-react";
import Link from "next/link";
import {
    Fragment,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";

import type {
    DocumentationSearchManifest,
    DocumentationSearchResponse,
    DocumentationSearchResult,
} from "@/lib/docs-search-types";

type SearchMetadata = {
    query: string;
    projectId: string;
    totalMatches: number;
    durationMs: number;
    searchedProjects: number;
    cachedShards: number;
    projectCounts:
        Record<string, number>;
};

type WarmState = {
    loaded: number;
    total: number;
    cacheName: string;
};

type WorkerMessage = {
    type?: string;
    projects?: number;
    totalEntries?: number;
    loaded?: number;
    total?: number;
    cacheName?: string;
    message?: string;
    payload?:
        DocumentationSearchResponse;
};

function normalizeQuery(
    value: string,
): string {
    return value
        .normalize("NFKD")
        .replace(
            /[\u0300-\u036f]/g,
            "",
        )
        .toLowerCase()
        .replace(
            /\s+/g,
            " ",
        )
        .trim();
}

function escapePattern(
    value: string,
): string {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
    );
}

function highlighted(
    value: string,
    query: string,
): ReactNode {
    const terms =
        [
            ...new Set(
                normalizeQuery(
                    query,
                )
                    .split(" ")
                    .filter(
                        (term) =>
                            term.length
                            >= 2,
                    ),
            ),
        ]
            .sort(
                (
                    first,
                    second,
                ) =>
                    second.length
                    - first.length,
            );

    if (
        !value
        || terms.length === 0
    ) {
        return value;
    }

    const matcher =
        new RegExp(
            `(${terms
                .map(
                    escapePattern,
                )
                .join("|")})`,
            "gi",
        );

    const termSet =
        new Set(
            terms,
        );

    return value
        .split(matcher)
        .map(
            (
                part,
                index,
            ) => {
                if (
                    termSet.has(
                        normalizeQuery(
                            part,
                        ),
                    )
                ) {
                    return (
                        <mark
                            key={`${part}-${index}`}
                            className="rounded-sm bg-violet-200 px-0.5 text-violet-950"
                        >
                            {part}
                        </mark>
                    );
                }

                return (
                    <Fragment
                        key={`${part}-${index}`}
                    >
                        {part}
                    </Fragment>
                );
            },
        );
}

function projectLabel(
    projectId: string,
    manifest:
        DocumentationSearchManifest,
): string {
    if (
        projectId === "all"
    ) {
        return "All projects";
    }

    return (
        manifest.projects.find(
            (project) =>
                project.projectId
                === projectId,
        )
        ?.projectTitle
        ?? projectId
    );
}

export function DocumentationSearch({
    manifest,
}: {
    manifest:
        DocumentationSearchManifest;
}) {
    const inputRef =
        useRef<HTMLInputElement>(
            null,
        );

    const workerRef =
        useRef<Worker | null>(
            null,
        );

    const requestIdRef =
        useRef(0);

    const [
        query,
        setQuery,
    ] = useState("");

    const [
        projectId,
        setProjectId,
    ] = useState("all");

    const [
        workerReady,
        setWorkerReady,
    ] = useState(false);

    const [
        results,
        setResults,
    ] = useState<
        DocumentationSearchResult[]
    >([]);

    const [
        metadata,
        setMetadata,
    ] = useState<
        SearchMetadata | null
    >(null);

    const [
        warmState,
        setWarmState,
    ] = useState<WarmState>({
        loaded: 0,
        total:
            manifest.projects
                .length,
        cacheName: "",
    });

    const [
        error,
        setError,
    ] = useState("");

    const validProjectIds =
        useMemo(
            () =>
                new Set(
                    manifest.projects
                        .map(
                            (project) =>
                                project
                                    .projectId,
                        ),
                ),
            [
                manifest.projects,
            ],
        );

    useEffect(
        () => {
            const applyLocation =
                () => {
                    const parameters =
                        new URLSearchParams(
                            window.location
                                .search,
                        );

                    const nextQuery =
                        parameters.get(
                            "q",
                        )
                        ?? "";

                    const requestedProject =
                        parameters.get(
                            "project",
                        )
                        ?? "all";

                    setQuery(
                        nextQuery,
                    );

                    setProjectId(
                        requestedProject
                            === "all"
                            || validProjectIds
                                .has(
                                    requestedProject,
                                )
                            ? requestedProject
                            : "all",
                    );
                };

            applyLocation();

            window.addEventListener(
                "popstate",
                applyLocation,
            );

            return () => {
                window.removeEventListener(
                    "popstate",
                    applyLocation,
                );
            };
        },
        [
            validProjectIds,
        ],
    );

    useEffect(
        () => {
            const worker =
                new Worker(
                    "/docs-search-worker.js",
                    {
                        name:
                            "forestoflight-documentation-search",
                    },
                );

            workerRef.current =
                worker;

            const handleMessage =
                (
                    event:
                        MessageEvent<WorkerMessage>,
                ) => {
                    const message =
                        event.data;

                    if (
                        message.type
                        === "ready"
                    ) {
                        setWorkerReady(
                            true,
                        );

                        setWarmState({
                            loaded: 0,
                            total:
                                Number(
                                    message.projects,
                                )
                                || manifest
                                    .projects
                                    .length,
                            cacheName:
                                String(
                                    message.cacheName
                                    || "",
                                ),
                        });


                        return;
                    }

                    if (
                        message.type
                        === "results"
                        && message.payload
                    ) {
                        if (
                            message.payload
                                .requestId
                            !==
                            requestIdRef
                                .current
                        ) {
                            return;
                        }

                        setResults(
                            message.payload
                                .results,
                        );

                        setMetadata({
                            query:
                                message.payload
                                    .query,
                            projectId:
                                message.payload
                                    .projectId,
                            totalMatches:
                                message.payload
                                    .totalMatches,
                            durationMs:
                                message.payload
                                    .durationMs,
                            searchedProjects:
                                message.payload
                                    .searchedProjects,
                            cachedShards:
                                message.payload
                                    .cachedShards,
                            projectCounts:
                                message.payload
                                    .projectCounts,
                        });

                        setError("");
                        return;
                    }

                    if (
                        message.type
                        === "warm-progress"
                        || message.type
                        === "warm-complete"
                        || message.type
                        === "cache-status"
                    ) {
                        setWarmState({
                            loaded:
                                Number(
                                    message.loaded,
                                )
                                || 0,
                            total:
                                Number(
                                    message.total,
                                )
                                || manifest
                                    .projects
                                    .length,
                            cacheName:
                                String(
                                    message.cacheName
                                    || "",
                                ),
                        });

                        return;
                    }

                    if (
                        message.type
                        === "error"
                    ) {
                        setError(
                            String(
                                message.message
                                || "Search worker error.",
                            ),
                        );
                    }
                };

            const handleError =
                (
                    event:
                        ErrorEvent,
                ) => {
                    setError(
                        event.message
                        || "The search worker could not start.",
                    );
                };

            worker.addEventListener(
                "message",
                handleMessage,
            );

            worker.addEventListener(
                "error",
                handleError,
            );

            worker.postMessage({
                type:
                    "configure",
                manifest,
            });

            return () => {
                worker.removeEventListener(
                    "message",
                    handleMessage,
                );

                worker.removeEventListener(
                    "error",
                    handleError,
                );

                worker.terminate();

                if (
                    workerRef.current
                    === worker
                ) {
                    workerRef.current =
                        null;
                }
            };
        },
        [
            manifest,
        ],
    );

    useEffect(
        () => {
            const timer =
                window.setTimeout(
                    () => {
                        const parameters =
                            new URLSearchParams();

                        if (
                            query.trim()
                        ) {
                            parameters.set(
                                "q",
                                query.trim(),
                            );
                        }

                        if (
                            projectId
                            !== "all"
                        ) {
                            parameters.set(
                                "project",
                                projectId,
                            );
                        }

                        const encoded =
                            parameters.toString();

                        const nextUrl =
                            encoded
                                ? `/search?${encoded}`
                                : "/search";

                        const currentUrl =
                            window.location
                                .pathname
                            + window.location
                                .search;

                        if (
                            nextUrl
                            !== currentUrl
                        ) {
                            window.history
                                .replaceState(
                                    null,
                                    "",
                                    nextUrl,
                                );
                        }
                    },
                    80,
                );

            return () => {
                window.clearTimeout(
                    timer,
                );
            };
        },
        [
            projectId,
            query,
        ],
    );

    useEffect(
        () => {
            const normalized =
                normalizeQuery(
                    query,
                );

            if (
                !workerReady
                || normalized.length
                    < 2
            ) {
                return;
            }

            const timer =
                window.setTimeout(
                    () => {
                        requestIdRef
                            .current
                            += 1;

                        workerRef.current
                            ?.postMessage({
                                type:
                                    "search",
                                requestId:
                                    requestIdRef
                                        .current,
                                query:
                                    normalized,
                                projectId,
                                limit: 72,
                            });
                    },
                    90,
                );

            return () => {
                window.clearTimeout(
                    timer,
                );
            };
        },
        [
            projectId,
            query,
            workerReady,
        ],
    );

    useEffect(
        () => {
            const handleShortcut =
                (
                    event:
                        KeyboardEvent,
                ) => {
                    const target =
                        event.target as HTMLElement | null;

                    const typing =
                        target
                        ?.tagName
                        === "INPUT"
                        || target
                            ?.tagName
                            === "TEXTAREA"
                        || target
                            ?.isContentEditable;

                    if (
                        (
                            event.key
                            === "/"
                            && !typing
                        )
                        || (
                            (
                                event.metaKey
                                || event.ctrlKey
                            )
                            && event.key
                                .toLowerCase()
                                === "k"
                        )
                    ) {
                        event.preventDefault();

                        inputRef.current
                            ?.focus();

                        inputRef.current
                            ?.select();
                    }

                    if (
                        event.key
                        === "Escape"
                        && document
                            .activeElement
                            ===
                            inputRef.current
                    ) {
                        inputRef.current
                            ?.blur();
                    }
                };

            window.addEventListener(
                "keydown",
                handleShortcut,
            );

            return () => {
                window.removeEventListener(
                    "keydown",
                    handleShortcut,
                );
            };
        },
        [],
    );

    const normalizedQuery =
        normalizeQuery(
            query,
        );

    const metadataMatches =
        metadata
        && metadata.query
            === normalizedQuery
        && metadata.projectId
            === projectId;

    const activeResults =
        metadataMatches
            ? results
            : [];

    const status =
        error
            ? "error"
            : normalizedQuery
                .length < 2
                ? "idle"
                : !workerReady
                    || !metadataMatches
                    ? "loading"
                    : "ready";

    const suggestions = [
        "commands",
        "installation",
        "extensions",
        "global rules",
        "display",
        "API models",
    ];

    return (
        <section
            data-doc-search
            data-search-status={
                status
            }
            data-cached-shards={
                warmState.loaded
            }
            data-total-shards={
                warmState.total
            }
            data-cache-name={
                warmState.cacheName
            }
            aria-busy={
                status === "loading"
            }
            className="mx-auto w-full max-w-[92rem]"
        >
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-[0_35px_110px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-6">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_15rem]">
                    <label className="group flex min-h-[4.5rem] items-center gap-4 rounded-[1.35rem] border border-white/10 bg-black/25 px-5 transition focus-within:border-violet-300/60 focus-within:bg-black/35">
                        <SearchIcon
                            aria-hidden="true"
                            size={22}
                            className="shrink-0 text-violet-200"
                        />

                        <span className="sr-only">
                            Search documentation
                        </span>

                        <input
                            ref={inputRef}
                            type="search"
                            value={query}
                            onChange={(
                                event,
                            ) => {
                                setQuery(
                                    event.target
                                        .value,
                                );

                                setError("");
                            }}
                            autoComplete="off"
                            spellCheck={false}
                            data-doc-search-input
                            placeholder="Search commands, rules, extensions, installation steps…"
                            className="min-w-0 flex-1 bg-transparent text-base font-bold text-white outline-none placeholder:text-slate-500 sm:text-lg"
                        />

                        {query ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setQuery("");
                                    inputRef
                                        .current
                                        ?.focus();
                                }}
                                aria-label="Clear search"
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-slate-400 transition hover:text-white"
                            >
                                <X
                                    aria-hidden="true"
                                    size={16}
                                />
                            </button>
                        ) : (
                            <span className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 font-mono text-[9px] font-black text-slate-500 sm:inline-flex">
                                <Command
                                    aria-hidden="true"
                                    size={11}
                                />

                                K
                            </span>
                        )}
                    </label>

                    <label className="flex min-h-[4.5rem] items-center gap-3 rounded-[1.35rem] border border-white/10 bg-black/25 px-5">
                        <Layers3
                            aria-hidden="true"
                            size={18}
                            className="shrink-0 text-violet-200"
                        />

                        <span className="sr-only">
                            Filter by project
                        </span>

                        <select
                            value={projectId}
                            onChange={(
                                event,
                            ) => {
                                setProjectId(
                                    event.target
                                        .value,
                                );

                                setError("");
                            }}
                            data-doc-search-project
                            className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-black text-white outline-none"
                        >
                            <option
                                value="all"
                                className="text-slate-950"
                            >
                                All projects
                            </option>

                            {manifest.projects.map(
                                (
                                    project,
                                ) => (
                                    <option
                                        key={
                                            project.projectId
                                        }
                                        value={
                                            project.projectId
                                        }
                                        className="text-slate-950"
                                    >
                                        {
                                            project.projectTitle
                                        }
                                    </option>
                                ),
                            )}
                        </select>
                    </label>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map(
                            (
                                suggestion,
                            ) => (
                                <button
                                    key={
                                        suggestion
                                    }
                                    type="button"
                                    onClick={() => {
                                        setQuery(
                                            suggestion,
                                        );

                                        inputRef
                                            .current
                                            ?.focus();
                                    }}
                                    className="min-h-9 rounded-full border border-white/10 bg-white/[0.045] px-3 text-[8px] font-black uppercase tracking-[0.11em] text-slate-400 transition hover:border-violet-300/40 hover:text-violet-100"
                                >
                                    {
                                        suggestion
                                    }
                                </button>
                            ),
                        )}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[9px] text-slate-500">
                        <Database
                            aria-hidden="true"
                            size={13}
                        />

                        <span>
                            {warmState.loaded}/
                            {warmState.total}{" "}
                            shards cached
                        </span>
                    </div>
                </div>
            </div>

            <div
                aria-live="polite"
                className="mt-7"
            >
                {status === "idle" ? (
                    <div
                        data-search-empty
                        className="grid gap-4 lg:grid-cols-[1fr_0.55fr]"
                    >
                        <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-7 sm:p-9">
                            <Sparkles
                                aria-hidden="true"
                                size={24}
                                className="text-violet-200"
                            />

                            <h2 className="mt-6 text-3xl font-black tracking-[-0.045em] sm:text-5xl">
                                Search the whole
                                ecosystem.
                            </h2>

                            <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-400">
                                Search every imported
                                wiki page, README,
                                command, heading,
                                installation guide,
                                rule, API note, and
                                extension from one
                                local index.
                            </p>
                        </div>

                        <dl className="grid grid-cols-2 gap-3">
                            {[
                                [
                                    manifest.totalEntries,
                                    "Indexed sections",
                                ],
                                [
                                    manifest.projects
                                        .length,
                                    "Projects",
                                ],
                                [
                                    warmState.loaded,
                                    "Cached shards",
                                ],
                                [
                                    "0",
                                    "GitHub runtime requests",
                                ],
                            ].map(
                                ([
                                    value,
                                    label,
                                ]) => (
                                    <div
                                        key={
                                            label
                                        }
                                        className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5"
                                    >
                                        <dt className="text-[8px] font-black uppercase tracking-[0.13em] text-slate-600">
                                            {
                                                label
                                            }
                                        </dt>

                                        <dd className="mt-3 font-mono text-2xl font-black text-white">
                                            {typeof value
                                                === "number"
                                                ? value
                                                    .toLocaleString(
                                                        "en-US",
                                                    )
                                                : value}
                                        </dd>
                                    </div>
                                ),
                            )}
                        </dl>
                    </div>
                ) : null}

                {status === "loading" ? (
                    <div
                        data-search-loading
                        className="flex min-h-[18rem] flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.045] text-center"
                    >
                        <LoaderCircle
                            aria-hidden="true"
                            size={28}
                            className="animate-spin text-violet-200"
                        />

                        <p className="mt-5 text-sm font-black uppercase tracking-[0.13em] text-slate-400">
                            Searching{" "}
                            {
                                projectLabel(
                                    projectId,
                                    manifest,
                                )
                            }
                        </p>
                    </div>
                ) : null}

                {status === "error" ? (
                    <div
                        data-search-error
                        className="rounded-[2rem] border border-rose-400/25 bg-rose-400/10 p-7"
                    >
                        <p className="text-sm font-black text-rose-100">
                            Search could not complete.
                        </p>

                        <p className="mt-3 font-mono text-xs leading-6 text-rose-200/70">
                            {error}
                        </p>
                    </div>
                ) : null}

                {status === "ready" ? (
                    <>
                        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-violet-200">
                                    Search results
                                </p>

                                <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-5xl">
                                    {metadata
                                        ?.totalMatches
                                        .toLocaleString(
                                            "en-US",
                                        )
                                    ?? 0}{" "}
                                    matches
                                </h2>
                            </div>

                            <div className="font-mono text-[9px] leading-5 text-slate-500 sm:text-right">
                                <p>
                                    {
                                        metadata
                                            ?.searchedProjects
                                    }{" "}
                                    projects searched
                                </p>

                                <p>
                                    {
                                        metadata
                                            ?.durationMs
                                            .toFixed(
                                                2,
                                            )
                                    }{" "}
                                    ms worker time
                                </p>
                            </div>
                        </div>

                        {activeResults.length
                            > 0 ? (
                            <div
                                data-search-results
                                className="mt-6 grid gap-3"
                            >
                                {activeResults.map(
                                    (
                                        result,
                                        index,
                                    ) => (
                                        <Link
                                            key={
                                                result.id
                                            }
                                            href={
                                                result.route
                                            }
                                            prefetch={
                                                false
                                            }
                                            data-search-result
                                            data-result-project={
                                                result.projectId
                                            }
                                            data-result-rank={
                                                index + 1
                                            }
                                            className="group grid gap-5 rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-5 transition hover:-translate-y-0.5 hover:border-violet-300/35 hover:bg-white/[0.07] sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 text-[8px] font-black uppercase tracking-[0.13em]">
                                                    <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-2.5 py-1.5 text-violet-200">
                                                        {
                                                            result.projectTitle
                                                        }
                                                    </span>

                                                    <span className="rounded-full border border-white/10 px-2.5 py-1.5 text-slate-500">
                                                        {
                                                            result.sourceType
                                                        }
                                                    </span>

                                                    <span className="font-mono text-slate-600">
                                                        score{" "}
                                                        {
                                                            result.score
                                                        }
                                                    </span>
                                                </div>

                                                <h3 className="mt-4 break-words text-xl font-black tracking-[-0.03em] text-white sm:text-2xl">
                                                    {
                                                        highlighted(
                                                            result.sectionTitle
                                                            || result.documentTitle,
                                                            query,
                                                        )
                                                    }
                                                </h3>

                                                {result.documentTitle
                                                    !==
                                                    result.sectionTitle ? (
                                                    <p className="mt-2 text-xs font-black uppercase tracking-[0.11em] text-slate-500">
                                                        {
                                                            highlighted(
                                                                result.documentTitle,
                                                                query,
                                                            )
                                                        }
                                                    </p>
                                                ) : null}

                                                <p className="mt-4 line-clamp-3 break-words text-sm font-medium leading-7 text-slate-400">
                                                    {
                                                        highlighted(
                                                            result.snippet,
                                                            query,
                                                        )
                                                    }
                                                </p>
                                            </div>

                                            <span className="grid h-11 w-11 shrink-0 place-items-center self-center rounded-full bg-white text-slate-950 transition group-hover:bg-violet-200">
                                                <ArrowRight
                                                    aria-hidden="true"
                                                    size={16}
                                                />
                                            </span>
                                        </Link>
                                    ),
                                )}
                            </div>
                        ) : (
                            <div
                                data-search-no-results
                                className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.045] p-8 text-center"
                            >
                                <BookOpen
                                    aria-hidden="true"
                                    size={24}
                                    className="mx-auto text-slate-500"
                                />

                                <h3 className="mt-5 text-2xl font-black">
                                    No matching section.
                                </h3>

                                <p className="mt-3 text-sm font-medium text-slate-500">
                                    Try a shorter command,
                                    rule, project, or API term.
                                </p>
                            </div>
                        )}
                    </>
                ) : null}
            </div>
        </section>
    );
}
