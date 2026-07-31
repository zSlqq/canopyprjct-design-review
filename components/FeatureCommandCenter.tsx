"use client";


import { canonicalFeatureTitle } from "@/lib/feature-display";
import {
    ArrowLeft,
    ArrowUpRight,
    BookOpen,
    Braces,
    Check,
    ChevronDown,
    Clipboard,
    ExternalLink,
    Filter,
    Layers3,
    LoaderCircle,
    Search,
    Sparkles,
    Terminal,
    X,
} from "lucide-react";
import Link from "next/link";
import {
    useDeferredValue,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import manifestJson from "@/lib/data/generated/features/manifest.json";
import type {
    FeatureLibraryManifest,
    FeatureLibraryRecord,
    FeatureLibraryResponse,
} from "@/lib/feature-library-types";

type FeatureCommandCenterProps = {
    initialQuery?: string;
    initialKind?: string;
    initialRepository?: string;
};

type WorkerMessage =
    | {
        type: "ready";
        projects: number;
        entries: number;
        cacheName: string;
    }
    | {
        type: "results";
        payload: FeatureLibraryResponse;
    }
    | {
        type: "error";
        requestId: number;
        message: string;
    };

const manifest =
    manifestJson as unknown as FeatureLibraryManifest;

const kindLabels: Record<string, string> = {
    all: "All types",
    command: "Commands",
    extension: "Extensions",
    rule: "Rules",
    api: "APIs",
    installation: "Installation",
    configuration: "Configuration",
    model: "Models",
    event: "Events",
    guide: "Guides",
    reference: "Reference",
    feature: "Features",
};

function normalize(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function initialProjectId(
    value: string | undefined,
): string {
    if (!value) {
        return "all";
    }

    const normalized = normalize(value);

    return (
        manifest.projects.find(
            (project) =>
                normalize(project.projectId) === normalized
                || normalize(project.repository) === normalized,
        )?.projectId
        ?? "all"
    );
}

function initialKindValue(
    value: string | undefined,
): string {
    return value && manifest.kinds.includes(value)
        ? value
        : "all";
}

async function copyText(value: string): Promise<void> {
    if (
        navigator.clipboard
        && window.isSecureContext
    ) {
        await navigator.clipboard.writeText(value);
        return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand("copy");
    textarea.remove();

    if (!copied) {
        throw new Error("Copy command was rejected.");
    }
}

function FeatureCard({
    feature,
    copiedId,
    onCopy,
}: {
    feature: FeatureLibraryRecord;
    copiedId: string | null;
    onCopy: (feature: FeatureLibraryRecord) => void;
}) {
    const copied = copiedId === feature.id;

    return (
        <article
            id={`feature-${feature.id}`}
            data-feature-result
            data-feature-project={feature.projectId}
            data-feature-kind={feature.kind}
            className="feature-result-card scroll-mt-28 overflow-hidden rounded-[1.5rem] border border-white/12 bg-white/[0.065] shadow-[0_22px_70px_rgba(0,0,0,0.18)] transition duration-300 hover:border-violet-300/45 hover:bg-white/[0.085]"
        >
            <div className="grid min-w-0 gap-5 p-5 sm:p-7 lg:grid-cols-[3.2rem_minmax(0,1fr)_auto]">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-violet-100">
                    <Terminal aria-hidden="true" size={18} />
                </span>

                <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="rounded-full bg-violet-400/12 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.13em] text-violet-100">
                            {kindLabels[feature.kind] ?? feature.kind}
                        </span>

                        <span className="min-w-0 break-words text-[8px] font-black uppercase tracking-[0.12em] text-slate-400 [overflow-wrap:anywhere]">
                            {feature.projectTitle}
                        </span>
                    </div>

                    <h2
                        data-feature-title
                        className="mt-3 break-words text-2xl font-black leading-[0.96] tracking-[-0.045em] text-white [overflow-wrap:anywhere] sm:text-3xl"
                    >
                        {canonicalFeatureTitle(feature)}
                    </h2>

                    {feature.syntax ? (
                        <div className="mt-5 flex min-w-0 flex-col gap-3 rounded-2xl border border-white/10 bg-black/35 p-3 sm:flex-row sm:items-start sm:p-4">
                            <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap break-words py-1 font-mono text-xs font-bold leading-6 text-violet-100 [overflow-wrap:anywhere] sm:text-sm">
                                {feature.syntax}
                            </code>

                            <button
                                type="button"
                                data-feature-copy
                                data-copy-state={copied ? "copied" : "idle"}
                                onClick={() => {
                                    onCopy(feature);
                                }}
                                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-100 px-3 text-[8px] font-black uppercase tracking-[0.1em] text-slate-950 shadow-sm transition hover:bg-white"
                            >
                                {copied ? (
                                    <Check aria-hidden="true" size={14} />
                                ) : (
                                    <Clipboard aria-hidden="true" size={14} />
                                )}

                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>
                    ) : null}

                    {feature.snippet ? (
                        <p className="mt-5 max-w-4xl break-words text-sm font-medium leading-7 text-slate-300 [overflow-wrap:anywhere] sm:text-base">
                            {feature.snippet}
                        </p>
                    ) : null}

                    <p className="mt-5 break-words font-mono text-[8px] uppercase tracking-[0.09em] text-slate-500 [overflow-wrap:anywhere]">
                        {feature.documentTitle}
                        {" · "}
                        {feature.sourceType}
                    </p>
                </div>

                <div className="flex min-w-0 flex-wrap items-start gap-2 lg:max-w-[14rem] lg:justify-end">
                    <Link
                        href={feature.route}
                        prefetch={false}
                        data-feature-action
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-violet-300/35 bg-violet-400/12 px-4 text-[8px] font-black uppercase tracking-[0.1em] text-violet-50 transition hover:border-violet-200 hover:bg-violet-300/20"
                    >
                        Open guide
                        <BookOpen aria-hidden="true" size={13} />
                    </Link>

                    {feature.sourceUrl ? (
                        <a
                            href={feature.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            data-feature-action
                            data-feature-source
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-violet-300/45 bg-violet-600 px-4 text-[8px] font-black uppercase tracking-[0.1em] text-white shadow-sm transition hover:bg-violet-500"
                        >
                            Source
                            <ExternalLink aria-hidden="true" size={13} />
                        </a>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

export function FeatureCommandCenter({
    initialQuery = "",
    initialKind,
    initialRepository,
}: FeatureCommandCenterProps) {
    const [query, setQuery] = useState(initialQuery);
    const deferredQuery = useDeferredValue(query);

    const [kind, setKind] = useState(
        () => initialKindValue(initialKind),
    );

    const [projectId, setProjectId] = useState(
        () => initialProjectId(initialRepository),
    );

    const [browseAll, setBrowseAll] = useState(false);
    const [limit, setLimit] = useState(48);

    const [results, setResults] = useState<FeatureLibraryRecord[]>(
        () => manifest.spotlight,
    );

    const [totalMatches, setTotalMatches] = useState(
        manifest.spotlight.length,
    );

    const [loading, setLoading] = useState(false);
    const [workerReady, setWorkerReady] = useState(false);
    const [workerError, setWorkerError] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef(0);
    const copyTimerRef = useRef<number | null>(null);

    const activeSearch =
        browseAll
        || Boolean(deferredQuery.trim())
        || kind !== "all"
        || projectId !== "all";

    useEffect(() => {
        const worker = new Worker(
            "/feature-library-worker.js",
            {
                name: "forestoflight-feature-library",
            },
        );

        workerRef.current = worker;

        const handleMessage = (
            event: MessageEvent<WorkerMessage>,
        ) => {
            const message = event.data;

            if (message.type === "ready") {
                setWorkerReady(true);
                return;
            }

            if (message.type === "results") {
                if (
                    message.payload.requestId
                    !== requestIdRef.current
                ) {
                    return;
                }

                setResults(message.payload.results);
                setTotalMatches(message.payload.totalMatches);
                setLoading(false);
                setWorkerError("");
                return;
            }

            if (
                message.type === "error"
                && message.requestId === requestIdRef.current
            ) {
                setLoading(false);
                setWorkerError(message.message);
            }
        };

        worker.addEventListener("message", handleMessage);

        worker.postMessage({
            type: "configure",
            manifest,
        });

        return () => {
            worker.removeEventListener("message", handleMessage);
            worker.terminate();
            workerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!workerReady || !activeSearch) {
            return;
        }

        const timer = window.setTimeout(
            () => {
                const worker = workerRef.current;

                if (!worker) {
                    return;
                }

                requestIdRef.current += 1;
                setLoading(true);

                worker.postMessage({
                    type: "search",
                    requestId: requestIdRef.current,
                    query: deferredQuery,
                    projectId,
                    kind,
                    limit,
                });
            },
            deferredQuery.trim() ? 110 : 0,
        );

        return () => {
            window.clearTimeout(timer);
        };
    }, [
        activeSearch,
        deferredQuery,
        kind,
        limit,
        projectId,
        workerReady,
    ]);

    useEffect(() => {
        const parameters = new URLSearchParams();

        if (query.trim()) {
            parameters.set("q", query.trim());
        }

        if (kind !== "all") {
            parameters.set("kind", kind);
        }

        if (projectId !== "all") {
            parameters.set("repo", projectId);
        }

        const serialized = parameters.toString();
        const nextUrl =
            window.location.pathname
            + (serialized ? `?${serialized}` : "")
            + window.location.hash;

        window.history.replaceState(null, "", nextUrl);
    }, [kind, projectId, query]);

    useEffect(() => {
        return () => {
            if (copyTimerRef.current !== null) {
                window.clearTimeout(copyTimerRef.current);
            }
        };
    }, []);

    const selectedProject = useMemo(
        () =>
            manifest.projects.find(
                (project) => project.projectId === projectId,
            ),
        [projectId],
    );

    async function handleCopy(
        feature: FeatureLibraryRecord,
    ) {
        await copyText(
            feature.syntax
            || `${window.location.origin}${feature.route}`,
        );

        setCopiedId(feature.id);

        if (copyTimerRef.current !== null) {
            window.clearTimeout(copyTimerRef.current);
        }

        copyTimerRef.current = window.setTimeout(
            () => {
                setCopiedId(null);
            },
            1800,
        );
    }

    function showSpotlight() {
        setBrowseAll(false);
        setLimit(48);
        setResults(manifest.spotlight);
        setTotalMatches(manifest.spotlight.length);
        setLoading(false);
        setWorkerError("");
    }

    function resetAll() {
        setQuery("");
        setKind("all");
        setProjectId("all");
        showSpotlight();
    }

    return (
        <main
            data-feature-command-center
            data-catalog-count={manifest.totalEntries}
            className="min-h-screen overflow-x-clip bg-[#090e1a] text-white"
        >
            <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090e1a]/92 backdrop-blur-2xl">
                <div className="mx-auto flex min-h-[4.75rem] max-w-[96rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                    <Link
                        href="/#feature-explorer"
                        prefetch={false}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 text-[9px] font-black uppercase tracking-[0.1em] text-white transition hover:border-violet-300/45 hover:bg-violet-400/12"
                    >
                        <ArrowLeft aria-hidden="true" size={14} />
                        Home
                    </Link>

                    <Link
                        href="/"
                        prefetch={false}
                        aria-label="ForestOfLight home"
                        data-feature-home
                        className="grid h-11 w-11 place-items-center rounded-xl border border-violet-300/45 bg-violet-600 text-white shadow-sm transition hover:bg-violet-500"
                    >
                        <Braces aria-hidden="true" size={17} />
                    </Link>

                    <Link
                        href="/search"
                        prefetch={false}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-violet-300/35 bg-violet-400/12 px-4 text-[9px] font-black uppercase tracking-[0.1em] text-violet-50 transition hover:bg-violet-300/20"
                    >
                        Docs search
                        <ArrowUpRight aria-hidden="true" size={14} />
                    </Link>
                </div>
            </header>

            <section className="relative isolate overflow-hidden border-b border-white/10">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 opacity-[0.09] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:54px_54px]"
                />

                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-44 top-0 -z-10 h-[34rem] w-[34rem] rounded-full bg-violet-600/25 blur-[135px]"
                />

                <div className="mx-auto max-w-[96rem] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
                    <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] lg:items-end">
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-3 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-3 text-[9px] font-black uppercase tracking-[0.16em] text-violet-100">
                                <Sparkles aria-hidden="true" size={14} />
                                Complete technical library
                            </div>

                            <h1 className="mt-8 max-w-6xl text-balance text-[clamp(3.6rem,8.5vw,8rem)] font-black leading-[0.83] tracking-[-0.083em]">
                                Every indexed
                                <br />
                                feature. Fast.
                            </h1>
                        </div>

                        <div className="min-w-0 max-w-xl lg:ml-auto">
                            <p className="text-pretty text-base font-medium leading-8 text-slate-300 sm:text-lg">
                                Search all documented commands, rules,
                                APIs, extensions, installation steps,
                                models, settings, and guides across
                                every synchronized project.
                            </p>

                            <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
                                {[
                                    [manifest.totalEntries, "Entries"],
                                    [manifest.projects.length, "Projects"],
                                    [manifest.kinds.length, "Types"],
                                ].map(([value, label]) => (
                                    <div
                                        key={label}
                                        className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.065] px-3 py-4 sm:px-4"
                                    >
                                        <p className="break-words font-mono text-lg font-black [overflow-wrap:anywhere]">
                                            {Number(value).toLocaleString("en-US")}
                                        </p>

                                        <p className="mt-1 break-words text-[8px] font-black uppercase tracking-[0.1em] text-slate-400 [overflow-wrap:anywhere]">
                                            {label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-[96rem] px-4 py-9 sm:px-6 lg:px-8">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.24)]">
                    <div className="flex min-h-16 min-w-0 items-center gap-3 rounded-[1.25rem] border border-white/10 bg-black/30 px-4 sm:px-5">
                        <Search
                            aria-hidden="true"
                            size={19}
                            className="shrink-0 text-violet-200"
                        />

                        <label
                            htmlFor="feature-library-search"
                            className="sr-only"
                        >
                            Search the complete feature library
                        </label>

                        <input
                            id="feature-library-search"
                            data-feature-search
                            type="search"
                            value={query}
                            onChange={(event) => {
                                const value = event.target.value;
                                setQuery(value);
                                setBrowseAll(false);
                                setLimit(48);

                                if (
                                    !value.trim()
                                    && kind === "all"
                                    && projectId === "all"
                                ) {
                                    showSpotlight();
                                }
                            }}
                            placeholder="Search commands, settings, rules, APIs, extensions…"
                            autoComplete="off"
                            className="min-w-0 flex-1 bg-transparent py-4 text-sm font-bold text-white outline-none placeholder:text-slate-500 sm:text-base"
                        />

                        {query ? (
                            <button
                                type="button"
                                aria-label="Clear feature search"
                                onClick={() => {
                                    setQuery("");

                                    if (
                                        kind === "all"
                                        && projectId === "all"
                                    ) {
                                        showSpotlight();
                                    }
                                }}
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-white transition hover:bg-white/[0.15]"
                            >
                                <X aria-hidden="true" size={14} />
                            </button>
                        ) : null}
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="flex min-w-0 flex-wrap gap-2">
                            {["all", ...manifest.kinds].map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    data-feature-kind-filter={option}
                                    aria-pressed={kind === option}
                                    onClick={() => {
                                        setKind(option);
                                        setBrowseAll(false);
                                        setLimit(48);

                                        if (
                                            option === "all"
                                            && !query.trim()
                                            && projectId === "all"
                                        ) {
                                            showSpotlight();
                                        }
                                    }}
                                    className={`inline-flex min-h-10 items-center rounded-full border px-4 text-[8px] font-black uppercase tracking-[0.1em] transition ${
                                        kind === option
                                            ? "border-violet-200 bg-violet-100 text-slate-950"
                                            : "border-white/12 bg-white/[0.055] text-slate-300 hover:border-violet-300/35 hover:bg-violet-400/12 hover:text-white"
                                    }`}
                                >
                                    {kindLabels[option] ?? option}
                                </button>
                            ))}
                        </div>

                        <label className="relative min-w-0">
                            <span className="sr-only">
                                Filter feature library by project
                            </span>

                            <select
                                data-feature-project-filter
                                value={projectId}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setProjectId(value);
                                    setBrowseAll(false);
                                    setLimit(48);

                                    if (
                                        value === "all"
                                        && !query.trim()
                                        && kind === "all"
                                    ) {
                                        showSpotlight();
                                    }
                                }}
                                className="min-h-11 w-full appearance-none rounded-full border border-white/12 bg-[#111827] py-2 pl-4 pr-11 text-[9px] font-black uppercase tracking-[0.09em] text-white outline-none transition focus:border-violet-300 lg:w-[18rem]"
                            >
                                <option value="all">
                                    All projects
                                </option>

                                {manifest.projects.map((project) => (
                                    <option
                                        key={project.projectId}
                                        value={project.projectId}
                                    >
                                        {project.projectTitle}
                                        {" · "}
                                        {project.entries}
                                    </option>
                                ))}
                            </select>

                            <ChevronDown
                                aria-hidden="true"
                                size={14}
                                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </label>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <p
                            data-feature-result-count
                            data-total-matches={totalMatches}
                            className="break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 [overflow-wrap:anywhere]"
                        >
                            {loading
                                ? "Searching…"
                                : `${totalMatches.toLocaleString("en-US")} ${
                                    totalMatches === 1
                                        ? "entry"
                                        : "entries"
                                }`}
                            {selectedProject
                                ? ` · ${selectedProject.projectTitle}`
                                : ""}
                        </p>

                        <p className="mt-2 text-xs font-medium leading-6 text-slate-500">
                            The initial view uses only the tiny manifest.
                            Project shards load on demand and remain cached.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {!activeSearch ? (
                            <button
                                type="button"
                                data-browse-all
                                onClick={() => {
                                    setBrowseAll(true);
                                    setLimit(48);
                                }}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-violet-200 bg-violet-100 px-5 text-[8px] font-black uppercase tracking-[0.1em] text-slate-950 shadow-sm transition hover:bg-white"
                            >
                                <Layers3 aria-hidden="true" size={14} />
                                Browse all {manifest.totalEntries}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={resetAll}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.065] px-5 text-[8px] font-black uppercase tracking-[0.1em] text-white transition hover:border-violet-300/40 hover:bg-violet-400/12"
                            >
                                <Filter aria-hidden="true" size={14} />
                                Reset view
                            </button>
                        )}
                    </div>
                </div>

                {workerError ? (
                    <div
                        role="alert"
                        className="mt-6 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-5 py-4 text-sm font-bold leading-6 text-rose-100"
                    >
                        {workerError}
                    </div>
                ) : null}

                {loading ? (
                    <div className="mt-6 flex min-h-48 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/[0.04]">
                        <LoaderCircle
                            aria-hidden="true"
                            size={24}
                            className="animate-spin text-violet-200"
                        />
                        <span className="ml-3 text-sm font-bold text-slate-300">
                            Loading required project shard
                            {projectId === "all" ? "s" : ""}…
                        </span>
                    </div>
                ) : results.length > 0 ? (
                    <div
                        data-feature-results
                        className="mt-6 grid gap-4"
                    >
                        {results.map((feature) => (
                            <FeatureCard
                                key={feature.id}
                                feature={feature}
                                copiedId={copiedId}
                                onCopy={handleCopy}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.04] px-6 py-20 text-center">
                        <Search
                            aria-hidden="true"
                            size={26}
                            className="mx-auto text-slate-500"
                        />
                        <p className="mt-5 text-xl font-black">
                            No matching feature
                        </p>
                        <button
                            type="button"
                            onClick={resetAll}
                            className="mt-5 inline-flex min-h-11 items-center rounded-full border border-violet-200 bg-violet-100 px-5 text-[8px] font-black uppercase tracking-[0.1em] text-slate-950"
                        >
                            Reset library
                        </button>
                    </div>
                )}

                {!loading && results.length < totalMatches ? (
                    <div className="mt-7 flex justify-center">
                        <button
                            type="button"
                            data-feature-load-more
                            onClick={() => {
                                setLimit((current) =>
                                    Math.min(240, current + 48),
                                );
                            }}
                            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] px-6 text-[8px] font-black uppercase tracking-[0.1em] text-white transition hover:border-violet-300/40 hover:bg-violet-400/12"
                        >
                            Load more
                        </button>
                    </div>
                ) : null}
            </section>

            <footer className="mt-16 border-t border-white/10">
                <div className="mx-auto flex max-w-[96rem] flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <p className="max-w-2xl text-sm font-medium leading-7 text-slate-400">
                        Every result opens its synchronized guide and
                        preserves the original repository source.
                    </p>

                    <Link
                        href="/status"
                        prefetch={false}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 text-[9px] font-black uppercase tracking-[0.1em] text-white transition hover:border-violet-300/40"
                    >
                        Coverage status
                        <ArrowUpRight aria-hidden="true" size={14} />
                    </Link>
                </div>
            </footer>
        </main>
    );
}
