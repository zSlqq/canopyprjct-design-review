import {
    Activity,
    ArrowLeft,
    BookOpen,
    Database,
    GitBranch,
    Search,
    ShieldCheck,
} from "lucide-react";
import type {
    Metadata,
} from "next";
import Link from "next/link";

import integrityJson from "@/lib/data/generated/docs/integrity-report.json";
import {
    documentationNavigation,
} from "@/lib/docs-navigation";

export const metadata: Metadata = {
    title:
        "Documentation Status | ForestOfLight",
    description:
        "Build-time provenance, coverage, media, search, and integrity status for the ForestOfLight technical documentation.",
};

export const dynamic =
    "force-static";

export const revalidate =
    false;

type IntegrityReport = {
    schemaVersion: number;
    generatedAt: string;
    summary: {
        projects: number;
        documents: number;
        sections: number;
        words: number;
        searchEntries: number;
        searchProjects: number;
        mediaAssets: number;
        documentsWithMedia: number;
        markdownLinks: number;
        sourceTypes:
            Record<string, number>;
    };
    checks:
        Record<string, boolean>;
    passed: boolean;
};

const integrity =
    integrityJson as unknown as IntegrityReport;

export default function DocumentationStatusPage() {
    const summary =
        integrity.summary;

    const cards = [
        {
            label:
                "Projects",
            value:
                summary.projects,
            detail:
                `${summary.searchProjects} searchable`,
            icon:
                Database,
        },
        {
            label:
                "Documents",
            value:
                summary.documents,
            detail:
                `${summary.sections.toLocaleString("en-US")} indexed sections`,
            icon:
                BookOpen,
        },
        {
            label:
                "Search entries",
            value:
                summary.searchEntries,
            detail:
                "Project-sharded index",
            icon:
                Search,
        },
        {
            label:
                "Local media",
            value:
                summary.mediaAssets,
            detail:
                `${summary.documentsWithMedia} documents`,
            icon:
                Activity,
        },
    ];

    return (
        <main
            data-status-page
            className="min-h-screen overflow-x-clip bg-[#080d18] text-white"
        >
            <header className="border-b border-white/10">
                <div className="mx-auto flex min-h-[4.75rem] max-w-[100rem] items-center justify-between gap-4 px-5 sm:px-8">
                    <Link
                        href="/docs"
                        prefetch={false}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[8px] font-black uppercase tracking-[0.11em] text-white transition hover:border-violet-300/40"
                    >
                        <ArrowLeft
                            aria-hidden="true"
                            size={14}
                        />

                        Documentation
                    </Link>

                    <div className="inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />

                        Build verified
                    </div>
                </div>
            </header>

            <section className="relative isolate overflow-hidden border-b border-white/10">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:54px_54px]"
                />

                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-28 top-0 -z-10 h-[34rem] w-[34rem] rounded-full bg-violet-600/25 blur-[145px]"
                />

                <div className="mx-auto max-w-[100rem] px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
                    <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-[8px] font-black uppercase tracking-[0.15em] text-violet-200">
                        <ShieldCheck
                            aria-hidden="true"
                            size={14}
                        />

                        Documentation trust layer
                    </div>

                    <h1 className="mt-7 max-w-6xl text-[clamp(3.6rem,8vw,7.5rem)] font-black leading-[0.84] tracking-[-0.08em]">
                        Sources visible.
                        <br />
                        Integrity verified.
                    </h1>

                    <p className="mt-8 max-w-3xl text-base font-medium leading-8 text-slate-400">
                        This page reports the exact
                        documentation corpus used by
                        the site, including project
                        coverage, static routes,
                        search sections, mirrored
                        media, and source revisions.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-[100rem] px-5 py-10 sm:px-8 sm:py-14">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map(
                        (
                            card,
                        ) => {
                            const Icon =
                                card.icon;

                            return (
                                <article
                                    key={
                                        card.label
                                    }
                                    className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5"
                                >
                                    <Icon
                                        aria-hidden="true"
                                        size={18}
                                        className="text-violet-200"
                                    />

                                    <p className="mt-6 text-[8px] font-black uppercase tracking-[0.13em] text-slate-500">
                                        {
                                            card.label
                                        }
                                    </p>

                                    <p className="mt-2 font-mono text-3xl font-black">
                                        {typeof card.value
                                            === "number"
                                            ? card.value
                                                .toLocaleString(
                                                    "en-US",
                                                )
                                            : card.value}
                                    </p>

                                    <p className="mt-2 text-xs font-bold text-slate-500">
                                        {
                                            card.detail
                                        }
                                    </p>
                                </article>
                            );
                        },
                    )}
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
                    <section
                        data-integrity-checks
                        className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6"
                    >
                        <div className="flex items-center gap-3">
                            <ShieldCheck
                                aria-hidden="true"
                                size={20}
                                className="text-emerald-300"
                            />

                            <h2 className="text-2xl font-black tracking-[-0.04em]">
                                Integrity checks
                            </h2>
                        </div>

                        <div className="mt-6 space-y-3">
                            {Object.entries(
                                integrity.checks,
                            ).map(
                                ([
                                    name,
                                    passed,
                                ]) => (
                                    <div
                                        key={
                                            name
                                        }
                                        className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                                    >
                                        <span className="break-words font-mono text-[10px] font-bold text-slate-400">
                                            {name}
                                        </span>

                                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${
                                            passed
                                                ? "bg-emerald-400/15 text-emerald-300"
                                                : "bg-rose-400/15 text-rose-300"
                                        }`}>
                                            {passed
                                                ? "Pass"
                                                : "Review"}
                                        </span>
                                    </div>
                                ),
                            )}
                        </div>
                    </section>

                    <section
                        data-project-coverage
                        className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.05]"
                    >
                        <div className="border-b border-white/10 p-6">
                            <div className="flex items-center gap-3">
                                <GitBranch
                                    aria-hidden="true"
                                    size={20}
                                    className="text-violet-200"
                                />

                                <h2 className="text-2xl font-black tracking-[-0.04em]">
                                    Project coverage
                                </h2>
                            </div>
                        </div>

                        <div className="divide-y divide-white/10">
                            {documentationNavigation.projects.map(
                                (
                                    project,
                                ) => (
                                    <div
                                        key={
                                            project.id
                                        }
                                        className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                                    >
                                        <div>
                                            <p className="font-black text-white">
                                                {
                                                    project.title
                                                }
                                            </p>

                                            <p className="mt-1 font-mono text-[9px] text-slate-600">
                                                {
                                                    project.repository
                                                }
                                            </p>
                                        </div>

                                        <div className="font-mono text-xs font-black text-slate-400">
                                            {
                                                project.documentCount
                                            }{" "}
                                            docs ·{" "}
                                            {
                                                project.sectionCount
                                            }{" "}
                                            sections
                                        </div>

                                        <Link
                                            href={`/docs/${project.id}`}
                                            prefetch={false}
                                            className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] px-4 text-[8px] font-black uppercase tracking-[0.1em] text-white transition hover:border-violet-300/40"
                                        >
                                            Open
                                        </Link>
                                    </div>
                                ),
                            )}
                        </div>
                    </section>
                </div>

                <section className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6">
                    <p className="text-[8px] font-black uppercase tracking-[0.13em] text-slate-500">
                        Generated corpus
                    </p>

                    <p className="mt-3 break-words font-mono text-xs font-bold leading-6 text-slate-400">
                        {
                            integrity.generatedAt
                        }
                    </p>

                    <p className="mt-3 text-sm font-medium leading-7 text-slate-500">
                        {
                            summary.words
                                .toLocaleString(
                                    "en-US",
                                )
                        }{" "}
                        documentation words and{" "}
                        {
                            summary.markdownLinks
                                .toLocaleString(
                                    "en-US",
                                )
                        }{" "}
                        Markdown links were analyzed
                        while generating this status.
                    </p>
                </section>
            </section>
        </main>
    );
}
