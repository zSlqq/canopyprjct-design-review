import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Braces,
    Layers3,
    Search,
} from "lucide-react";
import type {
    Metadata,
} from "next";
import Link from "next/link";

import {
    allDocumentation,
    documentationGeneratedAt,
    documentationProjects,
} from "@/lib/docs";

export const metadata: Metadata = {
    title:
        "Unified Documentation | ForestOfLight",
    description:
        "Source-linked documentation unified from ForestOfLight repositories and GitHub wikis.",
};

export const dynamic =
    "force-static";

export const revalidate =
    false;

export default function DocumentationIndexPage() {
    const projects =
        documentationProjects();

    const documents =
        allDocumentation();

    const totalSections =
        projects.reduce(
            (
                total,
                project,
            ) =>
                total
                + project.sections,
            0,
        );

    const totalWords =
        projects.reduce(
            (
                total,
                project,
            ) =>
                total
                + project.words,
            0,
        );

    return (
        <main
            data-docs-index
            className="min-h-screen overflow-x-clip bg-[#080d18] text-white"
        >
            <header className="border-b border-white/10">
                <div className="mx-auto flex min-h-[4.75rem] max-w-[100rem] items-center justify-between gap-4 px-5 sm:px-8">
                    <Link
                        href="/"
                        prefetch={false}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[9px] font-black uppercase tracking-[0.11em]"
                    >
                        <ArrowLeft
                            aria-hidden="true"
                            size={14}
                        />

                        Home
                    </Link>

                    <Link
                        href="/"
                        prefetch={false}
                        aria-label="ForestOfLight"
                        className="grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-950"
                    >
                        <Braces
                            aria-hidden="true"
                            size={17}
                        />
                    </Link>

                    <Link
                        href="/search"
                        prefetch={false}
                        data-doc-search-link
                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-[9px] font-black uppercase tracking-[0.11em] text-slate-950"
                    >
                        <Search
                            aria-hidden="true"
                            size={14}
                        />

                        Search docs
                    </Link>
                </div>
            </header>

            <section className="relative isolate overflow-hidden border-b border-white/10">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:58px_58px]"
                />

                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-32 top-0 -z-10 h-[34rem] w-[34rem] rounded-full bg-violet-600/25 blur-[140px]"
                />

                <div className="mx-auto max-w-[100rem] px-5 py-20 sm:px-8 sm:py-28">
                    <div className="grid gap-12 lg:grid-cols-[1fr_0.72fr] lg:items-end">
                        <div>
                            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-violet-200">
                                <BookOpen
                                    aria-hidden="true"
                                    size={14}
                                />

                                Source-linked knowledge base
                            </div>

                            <h1 className="mt-8 max-w-6xl text-[clamp(4rem,10vw,9rem)] font-black leading-[0.8] tracking-[-0.09em]">
                                Every repo.
                                <br />
                                One clean
                                <br />
                                manual.
                            </h1>
                        </div>

                        <div className="max-w-xl lg:ml-auto">
                            <p className="text-lg font-medium leading-8 text-slate-300">
                                Wikis, READMEs,
                                guides, commands,
                                rules, extensions,
                                and technical
                                references unified
                                without visitor-time
                                GitHub loading.
                            </p>

                            <dl className="mt-8 grid grid-cols-2 gap-3">
                                {[
                                    [
                                        projects.length,
                                        "Projects",
                                    ],
                                    [
                                        documents.length,
                                        "Documents",
                                    ],
                                    [
                                        totalSections,
                                        "Sections",
                                    ],
                                    [
                                        totalWords,
                                        "Words",
                                    ],
                                ].map(
                                    ([
                                        value,
                                        label,
                                    ]) => (
                                        <div
                                            key={label}
                                            className="rounded-2xl border border-white/10 bg-white/[0.055] p-5"
                                        >
                                            <dt className="text-[8px] font-black uppercase tracking-[0.13em] text-slate-500">
                                                {label}
                                            </dt>

                                            <dd className="mt-2 font-mono text-2xl font-black">
                                                {Number(
                                                    value,
                                                ).toLocaleString(
                                                    "en-US",
                                                )}
                                            </dd>
                                        </div>
                                    ),
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-[100rem] px-5 py-16 sm:px-8 sm:py-24">
                <div className="border-b border-white/10 pb-8">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-200">
                        Documentation systems
                    </p>

                    <h2 className="mt-4 text-4xl font-black tracking-[-0.055em] sm:text-6xl">
                        Select a project.
                    </h2>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {projects.map(
                        (
                            project,
                            index,
                        ) => (
                            <Link
                                key={
                                    project.id
                                }
                                href={
                                    project.route
                                }
                                prefetch={false}
                                className="group relative min-h-[21rem] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-7 transition hover:-translate-y-1 hover:border-violet-300/35 hover:bg-white/[0.075]"
                            >
                                <div className="flex items-start justify-between">
                                    <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-black/25 text-violet-200">
                                        <Layers3
                                            aria-hidden="true"
                                            size={19}
                                        />
                                    </span>

                                    <span className="font-mono text-[9px] text-slate-600">
                                        {String(
                                            index + 1,
                                        ).padStart(
                                            2,
                                            "0",
                                        )}
                                    </span>
                                </div>

                                <h3 className="mt-10 break-words text-4xl font-black tracking-[-0.055em]">
                                    {
                                        project.title
                                    }
                                </h3>

                                <dl className="mt-8 grid grid-cols-3 gap-2">
                                    {[
                                        [
                                            project.documents,
                                            "Docs",
                                        ],
                                        [
                                            project.sections,
                                            "Sections",
                                        ],
                                        [
                                            project.wikiDocuments,
                                            "Wiki",
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
                                                className="rounded-xl border border-white/10 bg-black/20 p-3"
                                            >
                                                <dt className="text-[7px] font-black uppercase tracking-[0.12em] text-slate-600">
                                                    {
                                                        label
                                                    }
                                                </dt>

                                                <dd className="mt-1 font-mono text-base font-black">
                                                    {
                                                        value
                                                    }
                                                </dd>
                                            </div>
                                        ),
                                    )}
                                </dl>

                                <span className="absolute bottom-7 right-7 grid h-11 w-11 place-items-center rounded-full bg-white text-slate-950 transition group-hover:bg-violet-200">
                                    <ArrowRight
                                        aria-hidden="true"
                                        size={16}
                                    />
                                </span>
                            </Link>
                        ),
                    )}
                </div>
            </section>

            <footer className="border-t border-white/10">
                <div className="mx-auto flex max-w-[100rem] flex-col gap-3 px-5 py-9 text-sm font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <span>
                        Generated{" "}
                        {new Date(
                            documentationGeneratedAt(),
                        ).toLocaleDateString(
                            "en-US",
                            {
                                year:
                                    "numeric",
                                month:
                                    "short",
                                day:
                                    "numeric",
                            },
                        )}
                    </span>

                    <span>
                        Static pages · local corpus · source revisions preserved
                    </span>
                </div>
            </footer>
        </main>
    );
}
