"use client";

import Link from "next/link";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

type SearchKind =
    | "all"
    | "project"
    | "release"
    | "download"
    | "contributor"
    | "function"
    | "command"
    | "rule"
    | "document";

type SearchResult = {
    id: string;
    kind:
        Exclude<
            SearchKind,
            "all"
        >;
    project: string;
    title: string;
    subtitle: string;
    href: string;
    external: boolean;
    downloadable: boolean;
    score: number;
};

type WorkerMessage =
    | {
        type: "results";
        requestId: number;
        results: SearchResult[];
        total: number;
        indexEntries: number;
    }
    | {
        type: "error";
        requestId: number;
        message: string;
    };

const filters:
    {
        value:
            SearchKind;
        label:
            string;
    }[] = [
        {
            value:
                "all",
            label:
                "Everything",
        },
        {
            value:
                "download",
            label:
                "Downloads",
        },
        {
            value:
                "release",
            label:
                "Versions",
        },
        {
            value:
                "command",
            label:
                "Commands",
        },
        {
            value:
                "rule",
            label:
                "Rules",
        },
        {
            value:
                "function",
            label:
                "Functions",
        },
        {
            value:
                "contributor",
            label:
                "Contributors",
        },
        {
            value:
                "document",
            label:
                "Documents",
        },
        {
            value:
                "project",
            label:
                "Projects",
        },
    ];

export function ArchiveSearch() {
    const [
        query,
        setQuery,
    ] = useState(
        "",
    );

    const [
        kind,
        setKind,
    ] =
        useState<SearchKind>(
            "all",
        );

    const [
        results,
        setResults,
    ] =
        useState<
            SearchResult[]
        >([]);

    const [
        total,
        setTotal,
    ] = useState(
        0,
    );

    const [
        indexEntries,
        setIndexEntries,
    ] = useState(
        0,
    );

    const [
        searching,
        setSearching,
    ] = useState(
        false,
    );

    const [
        error,
        setError,
    ] = useState(
        "",
    );

    const worker =
        useRef<
            Worker
            | null
        >(
            null,
        );

    const request =
        useRef(
            0,
        );

    const timer =
        useRef<
            ReturnType<
                typeof setTimeout
            >
            | null
        >(
            null,
        );

    const initializingFromUrl =
        useRef(
            true,
        );

    const normalizedQuery =
        query.trim();

    const queryReady =
        normalizedQuery.length
        >= 2;

    const ensureWorker =
        useCallback(
            () => {
                if (
                    worker.current
                ) {
                    return worker.current;
                }

                const instance =
                    new Worker(
                        "/archive-search-worker.js",
                    );

                instance.addEventListener(
                    "message",
                    (
                        event:
                            MessageEvent<
                                WorkerMessage
                            >,
                    ) => {
                        const message =
                            event.data;

                        if (
                            message.requestId
                            !== request.current
                        ) {
                            return;
                        }

                        setSearching(
                            false,
                        );

                        if (
                            message.type
                            === "error"
                        ) {
                            setError(
                                message.message,
                            );

                            return;
                        }

                        setResults(
                            message.results,
                        );

                        setTotal(
                            message.total,
                        );

                        setIndexEntries(
                            message.indexEntries,
                        );

                        setError(
                            "",
                        );
                    },
                );

                worker.current =
                    instance;

                return instance;
            },
            [],
        );

    useEffect(
        () => {
            const parameters =
                new URLSearchParams(
                    window.location.search,
                );

            const initialQuery =
                parameters.get(
                    "q",
                )
                ?? "";

            const initialKind =
                parameters.get(
                    "kind",
                );

            const validKind =
                filters.some(
                    (
                        filter,
                    ) =>
                        filter.value
                        === initialKind,
                );

            const frame =
                window.requestAnimationFrame(
                    () => {
                        if (
                            initialQuery
                        ) {
                            setQuery(
                                initialQuery,
                            );
                        }

                        if (
                            validKind
                            && initialKind
                        ) {
                            setKind(
                                initialKind as SearchKind,
                            );
                        }

                        initializingFromUrl.current =
                            false;
                    },
                );

            return () => {
                window.cancelAnimationFrame(
                    frame,
                );
            };
        },
        [],
    );

    useEffect(
        () => {
            if (
                initializingFromUrl.current
            ) {
                return;
            }

            if (
                timer.current
            ) {
                clearTimeout(
                    timer.current,
                );
            }

            const parameters =
                new URLSearchParams();

            if (
                normalizedQuery
            ) {
                parameters.set(
                    "q",
                    normalizedQuery,
                );
            }

            if (
                kind
                !== "all"
            ) {
                parameters.set(
                    "kind",
                    kind,
                );
            }

            window.history.replaceState(
                null,
                "",
                parameters.toString()
                    ? `/archive/search?${parameters.toString()}`
                    : "/archive/search",
            );

            if (
                !queryReady
            ) {
                request.current +=
                    1;

                return;
            }

            timer.current =
                setTimeout(
                    () => {
                        const instance =
                            ensureWorker();

                        request.current +=
                            1;

                        setSearching(
                            true,
                        );

                        setResults(
                            [],
                        );

                        setTotal(
                            0,
                        );

                        setError(
                            "",
                        );

                        instance.postMessage({
                            type:
                                "search",
                            requestId:
                                request.current,
                            query:
                                normalizedQuery,
                            kind,
                        });
                    },
                    90,
                );

            return () => {
                if (
                    timer.current
                ) {
                    clearTimeout(
                        timer.current,
                    );
                }
            };
        },
        [
            normalizedQuery,
            queryReady,
            kind,
            ensureWorker,
        ],
    );

    useEffect(
        () =>
            () => {
                worker.current
                    ?.terminate();
            },
        [],
    );

    const visibleResults =
        queryReady
            ? results
            : [];

    const visibleTotal =
        queryReady
            ? total
            : 0;

    const visibleSearching =
        queryReady
        && searching;

    const visibleError =
        queryReady
            ? error
            : "";

    return (
        <div
            data-archive-search
            className="mx-auto max-w-7xl"
        >
            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-[0_28px_100px_rgba(15,23,42,0.1)] backdrop-blur sm:p-6">
                <label
                    htmlFor="archive-query"
                    className="sr-only"
                >
                    Search the ForestOfLight archive
                </label>

                <input
                    id="archive-query"
                    type="search"
                    autoComplete="off"
                    spellCheck={false}
                    value={query}
                    onFocus={
                        ensureWorker
                    }
                    onChange={
                        (
                            event,
                        ) => {
                            setQuery(
                                event.target.value,
                            );

                            setError(
                                "",
                            );
                        }
                    }
                    placeholder="Search releases, downloads, commands, functions, contributors…"
                    className="min-h-14 w-full rounded-2xl border border-slate-300 bg-slate-50 px-5 text-base font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />

                <div
                    role="group"
                    aria-label="Archive result type"
                    className="mt-4 flex gap-2 overflow-x-auto pb-1"
                >
                    {filters.map(
                        (
                            filter,
                        ) => (
                            <button
                                key={filter.value}
                                type="button"
                                aria-pressed={
                                    kind
                                    === filter.value
                                }
                                onClick={() => {
                                    setKind(
                                        filter.value,
                                    );

                                    setError(
                                        "",
                                    );
                                }}
                                className={
                                    kind
                                    === filter.value
                                        ? "inline-flex min-h-10 shrink-0 items-center rounded-full bg-violet-700 px-4 text-xs font-black text-white"
                                        : "inline-flex min-h-10 shrink-0 items-center rounded-full border border-slate-300 bg-white px-4 text-xs font-black text-slate-700 hover:border-violet-300 hover:bg-violet-50"
                                }
                            >
                                {filter.label}
                            </button>
                        ),
                    )}
                </div>

                <p
                    role="status"
                    aria-live="polite"
                    className="mt-4 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500"
                >
                    {visibleSearching
                        ? "Searching the archive…"
                        : visibleError
                            || (
                                !queryReady
                                    ? "Enter at least two characters. The archive index remains unloaded until then."
                                    : `${visibleTotal.toLocaleString("en-US")} matches in ${indexEntries.toLocaleString("en-US")} indexed records.`
                            )}
                </p>
            </div>

            {visibleResults.length ? (
                <div className="mt-7 grid gap-3 lg:grid-cols-2">
                    {visibleResults.map(
                        (
                            result,
                        ) => (
                            <Link
                                key={result.id}
                                href={result.href}
                                prefetch={false}
                                rel={
                                    result.external
                                        ? "nofollow"
                                        : undefined
                                }
                                className="group min-w-0 rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5 hover:border-violet-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-violet-700">
                                            {result.kind}
                                            {" · "}
                                            {result.project}
                                        </p>

                                        <h2 className="mt-3 break-words text-lg font-black leading-tight tracking-[-0.03em] text-slate-950">
                                            {result.title}
                                        </h2>

                                        {result.subtitle ? (
                                            <p className="mt-2 line-clamp-3 text-pretty text-sm font-semibold leading-6 text-slate-600">
                                                {result.subtitle}
                                            </p>
                                        ) : null}
                                    </div>

                                    <span
                                        aria-hidden="true"
                                        className={
                                            result.downloadable
                                                ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg text-white"
                                                : "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-lg text-white"
                                        }
                                    >
                                        {result.downloadable
                                            ? "↓"
                                            : "↗"}
                                    </span>
                                </div>
                            </Link>
                        ),
                    )}
                </div>
            ) : null}
        </div>
    );
}
