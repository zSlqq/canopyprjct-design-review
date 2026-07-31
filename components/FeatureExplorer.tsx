"use client";


import { canonicalFeatureTitle } from "@/lib/feature-display";
import {
    ArrowUpRight,
    BarChart3,
    BookOpen,
    Braces,
    Command,
    FileCode2,

    Search,
    Settings2,
    Sparkles,
    Terminal,
    Workflow,
    X,
} from "lucide-react";
import Link from "next/link";
import {
    useMemo,
    useState,
} from "react";

import { featureCatalog } from "@/lib/features/catalog";
import type {
    FeatureEntry,
    FeatureKind,
} from "@/lib/features/types";

interface FeatureExplorerProps {
    entries?: FeatureEntry[];
    variant?: "full" | "project";
    projectTitle?: string;
}

const kindLabels: Record<
    FeatureKind,
    string
> = {
    feature: "Feature",
    command: "Command",
    rule: "Rule",
    statistic: "Statistic",
    api: "API",
    configuration: "Configuration",
    workflow: "Workflow",
    overview: "Overview",
};

function normalize(
    value: string,
): string {
    return value
        .toLowerCase()
        .replace(
            /[^a-z0-9:/._-]+/g,
            " ",
        )
        .replace(/\s+/g, " ")
        .trim();
}

function searchDocument(
    feature: FeatureEntry,
): string {
    return normalize(
        [
            feature.title,
            feature.repository,
            feature.projectTitle,
            feature.kind,
            feature.usage.syntax ?? "",
            feature.usage.summary,
            feature.source.section,
            feature.source.excerpt,
            ...feature.aliases,
            ...feature.tags,
            ...feature.usage.notes,
            ...feature.usage.steps,
            ...feature.usage.examples,
            ...feature.usage.prerequisites,
        ].join(" "),
    );
}

function scoreFeature(
    feature: FeatureEntry,
    query: string,
): number {
    const normalizedQuery =
        normalize(query);

    if (!normalizedQuery) {
        const kindScore =
            feature.kind === "command"
                ? 50
                : feature.kind === "feature"
                  ? 40
                  : feature.kind === "statistic"
                    ? 30
                    : feature.kind === "rule"
                      ? 25
                      : 15;

        return (
            kindScore +
            Number(
                Boolean(
                    feature.usage.summary,
                ),
            ) *
                8
        );
    }

    const tokens =
        normalizedQuery.split(" ");

    const document =
        searchDocument(feature);

    if (
        !tokens.every(
            (token) =>
                document.includes(token),
        )
    ) {
        return -1;
    }

    const title = normalize(
        feature.title,
    );

    const syntax = normalize(
        feature.usage.syntax ?? "",
    );

    const summary = normalize(
        feature.usage.summary,
    );

    const repository = normalize(
        feature.repository,
    );

    const aliases =
        feature.aliases.map(
            normalize,
        );

    let score = 0;

    if (
        title === normalizedQuery ||
        syntax === normalizedQuery
    ) {
        score += 260;
    }

    if (
        title.startsWith(
            normalizedQuery,
        ) ||
        syntax.startsWith(
            normalizedQuery,
        )
    ) {
        score += 170;
    }

    if (
        title.includes(
            normalizedQuery,
        )
    ) {
        score += 120;
    }

    if (
        syntax.includes(
            normalizedQuery,
        )
    ) {
        score += 110;
    }

    if (
        aliases.some(
            (alias) =>
                alias === normalizedQuery,
        )
    ) {
        score += 150;
    }

    if (
        aliases.some(
            (alias) =>
                alias.includes(
                    normalizedQuery,
                ),
        )
    ) {
        score += 90;
    }

    if (
        summary.includes(
            normalizedQuery,
        )
    ) {
        score += 65;
    }

    if (
        repository.includes(
            normalizedQuery,
        )
    ) {
        score += 40;
    }

    for (const token of tokens) {
        if (title.includes(token)) {
            score += 30;
        }

        if (syntax.includes(token)) {
            score += 27;
        }

        if (summary.includes(token)) {
            score += 14;
        }
    }

    return score;
}

function KindIcon({
    kind,
}: {
    kind: FeatureKind;
}) {
    if (kind === "command") {
        return (
            <Terminal
                aria-hidden="true"
                size={17}
            />
        );
    }

    if (kind === "statistic") {
        return (
            <BarChart3
                aria-hidden="true"
                size={17}
            />
        );
    }

    if (kind === "rule") {
        return (
            <Settings2
                aria-hidden="true"
                size={17}
            />
        );
    }

    if (kind === "api") {
        return (
            <Braces
                aria-hidden="true"
                size={17}
            />
        );
    }

    if (
        kind === "configuration"
    ) {
        return (
            <FileCode2
                aria-hidden="true"
                size={17}
            />
        );
    }

    if (kind === "workflow") {
        return (
            <Workflow
                aria-hidden="true"
                size={17}
            />
        );
    }

    return (
        <Sparkles
            aria-hidden="true"
            size={17}
        />
    );
}

function FeatureCard({
    feature,
    compact,
}: {
    feature: FeatureEntry;
    compact: boolean;
}) {
    const summary =
        feature.usage.summary ||
        feature.source.excerpt;

    const hasUsageDetails =
        feature.usage.prerequisites
            .length > 0 ||
        feature.usage.steps.length > 0 ||
        feature.usage.examples.length >
            0 ||
        feature.usage.notes.length > 0;

    return (
        <article
            data-feature-result
            data-feature-kind={
                feature.kind
            }
            data-feature-repository={
                feature.repository
            }
            data-feature-project-id={
                feature.siteProjectId ?? ""
            }
            className="group relative overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/[0.055] transition duration-300 hover:border-violet-300/35 hover:bg-white/[0.08]"
        >
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[3.25rem_minmax(0,1fr)_auto] lg:items-start">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-black/20 text-violet-200">
                    <KindIcon
                        kind={feature.kind}
                    />
                </span>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-violet-200">
                            {
                                kindLabels[
                                    feature.kind
                                ]
                            }
                        </span>

                        <span className="h-1 w-1 rounded-full bg-slate-600" />

                        <span className="truncate text-[8px] font-black uppercase tracking-[0.13em] text-slate-500">
                            {
                                feature.repository
                            }
                        </span>
                    </div>

                    <h3 className="mt-3 break-words text-xl font-black tracking-[-0.035em] text-white sm:text-2xl">
                        {canonicalFeatureTitle(feature)}
                    </h3>

                    {feature.usage.syntax ? (
                        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                            <code className="whitespace-pre text-xs font-bold text-violet-100">
                                {
                                    feature
                                        .usage
                                        .syntax
                                }
                            </code>
                        </div>
                    ) : null}

                    {summary ? (
                        <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-300">
                            {summary}
                        </p>
                    ) : null}

                    {hasUsageDetails ? (
                        <details className="mt-5 border-t border-white/10 pt-4">
                            <summary className="cursor-pointer text-[9px] font-black uppercase tracking-[0.12em] text-violet-200">
                                Usage details
                            </summary>

                            <div className="mt-5 grid gap-6 md:grid-cols-2">
                                {feature.usage
                                    .prerequisites
                                    .length >
                                0 ? (
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">
                                            Requirements
                                        </p>

                                        <ul className="mt-3 space-y-2">
                                            {feature.usage.prerequisites.map(
                                                (
                                                    item,
                                                ) => (
                                                    <li
                                                        key={
                                                            item
                                                        }
                                                        className="text-sm leading-6 text-slate-300"
                                                    >
                                                        {
                                                            item
                                                        }
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                ) : null}

                                {feature.usage
                                    .steps
                                    .length >
                                0 ? (
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">
                                            In-game steps
                                        </p>

                                        <ol className="mt-3 space-y-3">
                                            {feature.usage.steps.map(
                                                (
                                                    step,
                                                    index,
                                                ) => (
                                                    <li
                                                        key={
                                                            step
                                                        }
                                                        className="grid grid-cols-[1.8rem_1fr] gap-2 text-sm leading-6 text-slate-300"
                                                    >
                                                        <span className="font-mono text-[9px] text-violet-300">
                                                            {String(
                                                                index +
                                                                    1,
                                                            ).padStart(
                                                                2,
                                                                "0",
                                                            )}
                                                        </span>

                                                        <span>
                                                            {
                                                                step
                                                            }
                                                        </span>
                                                    </li>
                                                ),
                                            )}
                                        </ol>
                                    </div>
                                ) : null}

                                {feature.usage
                                    .examples
                                    .length >
                                0 ? (
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">
                                            Examples
                                        </p>

                                        <ul className="mt-3 space-y-2">
                                            {feature.usage.examples.map(
                                                (
                                                    example,
                                                ) => (
                                                    <li
                                                        key={
                                                            example
                                                        }
                                                        className="rounded-lg bg-black/25 px-3 py-2 font-mono text-xs text-violet-100"
                                                    >
                                                        {
                                                            example
                                                        }
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                ) : null}

                                {feature.usage
                                    .notes
                                    .length >
                                0 ? (
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">
                                            Notes
                                        </p>

                                        <ul className="mt-3 space-y-2">
                                            {feature.usage.notes.map(
                                                (
                                                    note,
                                                ) => (
                                                    <li
                                                        key={
                                                            note
                                                        }
                                                        className="text-sm leading-6 text-slate-300"
                                                    >
                                                        {
                                                            note
                                                        }
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                ) : null}
                            </div>
                        </details>
                    ) : null}
                </div>

                <div className="flex flex-wrap gap-2 lg:max-w-[13rem] lg:justify-end">
                    {!compact &&
                    feature.siteProjectId ? (
                        <a
                            data-feature-project-link
                            href={`/projects/${feature.siteProjectId}#project-features`}
                            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 text-[8px] font-black uppercase tracking-[0.1em] text-white transition hover:border-violet-300/40 hover:bg-violet-400/10"
                        >
                            Project guide

                            <ArrowUpRight
                                aria-hidden="true"
                                size={13}
                            />
                        </a>
                    ) : null}

                    <a
                        data-feature-source-link
                        href={
                            feature.source.url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-[8px] font-black uppercase tracking-[0.1em] text-slate-950 transition hover:bg-violet-100"
                    >
                        Source

                        <ArrowUpRight
                            aria-hidden="true"
                            size={13}
                        />
                    </a>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3 sm:px-6">
                <span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.1em] text-slate-600">
                    <BookOpen
                        aria-hidden="true"
                        size={12}
                    />

                    {
                        feature.source
                            .section
                    }
                </span>

                <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-slate-600">
                    GitHub source
                </span>
            </div>
        </article>
    );
}

export function FeatureExplorer({
    entries = featureCatalog,
    variant = "full",
    projectTitle,
}: FeatureExplorerProps) {
    const [query, setQuery] =
        useState("");

    const compact =
        variant === "project";

    const sectionId = compact
        ? "project-features"
        : "feature-explorer";

    const visibleLimit = compact
        ? 30
        : 60;

    const initialLimit = compact
        ? 14
        : 20;

    const results = useMemo(() => {
        const normalizedQuery =
            normalize(query);

        return entries
            .map((feature) => ({
                feature,
                score: scoreFeature(
                    feature,
                    normalizedQuery,
                ),
            }))
            .filter(
                (result) =>
                    result.score >= 0,
            )
            .sort(
                (first, second) =>
                    second.score -
                    first.score,
            )
            .slice(
                0,
                normalizedQuery
                    ? visibleLimit
                    : initialLimit,
            )
            .map(
                (result) =>
                    result.feature,
            );
    }, [
        entries,
        initialLimit,
        query,
        visibleLimit,
    ]);

    const commandCount =
        entries.filter(
            (feature) =>
                feature.kind ===
                "command",
        ).length;

    const repositoryCount =
        new Set(
            entries.map(
                (feature) =>
                    feature.repository,
            ),
        ).size;

    const searchInputId =
        `${sectionId}-search`;

    return (
        <section
            id={sectionId}
            data-feature-explorer
            data-project-feature-explorer={
                compact
                    ? "true"
                    : undefined
            }
            data-feature-count={
                entries.length
            }
            className={`relative overflow-hidden border-y border-white/10 bg-[#090e1a] text-white ${
                compact
                    ? "scroll-mt-24 py-20 sm:py-24"
                    : "scroll-mt-24 py-20 sm:py-28"
            }`}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.09] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:54px_54px] [mask-image:linear-gradient(to_bottom,black,transparent_94%)]"
            />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-40 top-0 h-[32rem] w-[32rem] rounded-full bg-violet-600/20 blur-[130px]"
            />

            <div className="relative mx-auto max-w-[94rem] px-4 sm:px-6 lg:px-8">
                <header className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1fr_0.9fr] lg:items-end">
                    <div>
                        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.18em] text-violet-200">
                            <span className="grid h-9 min-w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.06] px-2">
                                {compact
                                    ? "DOC"
                                    : "07"}
                            </span>

                            <span>
                                {compact
                                    ? `${projectTitle ?? "Project"} documentation`
                                    : "Feature catalog"}
                            </span>
                        </div>

                        <h2 className="mt-7 max-w-5xl text-[clamp(3.4rem,7.5vw,7rem)] font-black leading-[0.86] tracking-[-0.075em] text-white">
                            {compact ? (
                                <>
                                    Features and
                                    <br />
                                    commands.
                                </>
                            ) : (
                                <>
                                    Find the
                                    <br />
                                    exact feature.
                                </>
                            )}
                        </h2>
                    </div>

                    <div className="max-w-xl lg:ml-auto">
                        <p className="text-lg font-medium leading-8 text-slate-300">
                            {compact
                                ? `Search the documented features, commands, rules, statistics, and usage references for ${projectTitle ?? "this project"}.`
                                : "Search commands, statistics, rules, APIs, workflows, and documented features across ForestOfLight repositories."}
                        </p>

                        <div className="mt-7 grid grid-cols-3 gap-3">
                            {[
                                [
                                    String(
                                        entries.length,
                                    ).padStart(
                                        2,
                                        "0",
                                    ),
                                    "Entries",
                                ],
                                [
                                    String(
                                        commandCount,
                                    ).padStart(
                                        2,
                                        "0",
                                    ),
                                    "Commands",
                                ],
                                [
                                    String(
                                        repositoryCount,
                                    ).padStart(
                                        2,
                                        "0",
                                    ),
                                    compact
                                        ? "Sources"
                                        : "Repos",
                                ],
                            ].map(
                                ([
                                    value,
                                    label,
                                ]) => (
                                    <div
                                        key={label}
                                        className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-4"
                                    >
                                        <p className="font-mono text-lg font-black text-white">
                                            {value}
                                        </p>

                                        <p className="mt-1 text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
                                            {label}
                                        </p>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                </header>

                <div className="mt-10 rounded-[1.6rem] border border-white/10 bg-white/[0.055] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.24)]">
                    <div className="flex min-h-16 items-center gap-3 rounded-[1.2rem] border border-white/10 bg-black/25 px-4 sm:px-5">
                        <Search
                            aria-hidden="true"
                            size={19}
                            className="shrink-0 text-violet-300"
                        />

                        <label
                            htmlFor={
                                searchInputId
                            }
                            className="sr-only"
                        >
                            Search features
                            and commands
                        </label>

                        <input
                            id={searchInputId}
                            data-feature-search
                            type="search"
                            value={query}
                            onChange={(event) =>
                                setQuery(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder={
                                compact
                                    ? `Search ${projectTitle ?? "project"} features or commands`
                                    : "Search a feature, command, statistic, rule, or task"
                            }
                            autoComplete="off"
                            spellCheck={false}
                            className="min-w-0 flex-1 bg-transparent py-4 text-sm font-bold text-white outline-none placeholder:text-slate-500"
                        />

                        {query ? (
                            <button
                                type="button"
                                onClick={() =>
                                    setQuery("")
                                }
                                aria-label="Clear feature search"
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.1] hover:text-white"
                            >
                                <X
                                    aria-hidden="true"
                                    size={16}
                                />
                            </button>
                        ) : (
                            <span className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.1em] text-slate-500 sm:inline-flex">
                                <Command
                                    aria-hidden="true"
                                    size={12}
                                />

                                Instant search
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <p
                        data-feature-result-count
                        className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-500"
                    >
                        {query
                            ? `${results.length} result${results.length === 1 ? "" : "s"}`
                            : `${results.length} entries shown`}
                    </p>

                    <Link
                        data-full-feature-library
                        href="/features"
                        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[9px] font-black uppercase tracking-[0.12em] text-slate-300 transition hover:border-violet-300/40 hover:bg-violet-400/10 hover:text-white"
                    >
                        Full feature library

                        <ArrowUpRight
                            aria-hidden="true"
                            size={13}
                        />
                    </Link>
                </div>

                {results.length > 0 ? (
                    <div
                        data-feature-results
                        className="mt-6 grid gap-3"
                    >
                        {results.map(
                            (feature) => (
                                <FeatureCard
                                    key={
                                        feature.id
                                    }
                                    feature={
                                        feature
                                    }
                                    compact={
                                        compact
                                    }
                                />
                            ),
                        )}
                    </div>
                ) : (
                    <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.035] px-6 py-16 text-center">
                        <Search
                            aria-hidden="true"
                            size={24}
                            className="mx-auto text-slate-600"
                        />

                        <p className="mt-5 text-lg font-black text-white">
                            No matching entry
                        </p>

                        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                            Try a command,
                            feature name,
                            statistic, rule,
                            repository, or a
                            shorter task
                            description.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
