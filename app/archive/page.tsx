import type {
    Metadata,
} from "next";

import Link from "next/link";

import {
    getArchiveManifest,
} from "@/lib/archive";

export const metadata:
    Metadata = {
        title:
            "ForestOfLight Archive",
        description:
            "A complete static archive of ForestOfLight repositories, releases, contributors, functions, commands, rules, and documentation.",
    };

function number(
    value: number,
): string {
    return new Intl.NumberFormat(
        "en-US",
    ).format(value);
}

export default async function ArchivePage() {
    const archive =
        await getArchiveManifest();

    return (
        <main
            id="main-content"
            data-archive-index
            className="min-h-screen bg-[#f7f8fc] text-slate-950"
        >
            <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_12%_8%,rgba(124,58,237,0.16),transparent_34rem),radial-gradient(circle_at_88%_12%,rgba(16,185,129,0.13),transparent_31rem),linear-gradient(180deg,#ffffff,#f5f3ff)] px-5 pb-20 pt-28 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-7xl">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">
                        Complete public record
                    </p>

                    <div className="mt-5 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.55fr)] lg:items-end">
                        <div className="min-w-0">
                            <h1 className="max-w-5xl text-balance text-5xl font-black leading-[0.88] tracking-[-0.07em] sm:text-7xl lg:text-[7.1rem]">
                                ForestOfLight archive.
                            </h1>

                            <p className="mt-7 max-w-3xl text-pretty text-base font-semibold leading-8 text-slate-600 sm:text-lg">
                                Every captured repository,
                                version, release asset,
                                contributor, documented
                                command, global rule, and
                                indexed function. The page is
                                static and performs no GitHub
                                request while loading.
                            </p>
                        </div>

                        <dl className="grid grid-cols-2 gap-3">
                            {[
                                [
                                    "Repositories",
                                    archive.summary.repositories,
                                ],
                                [
                                    "Versions",
                                    archive.summary.versions,
                                ],
                                [
                                    "Downloads",
                                    archive.summary.releaseAssets,
                                ],
                                [
                                    "Functions",
                                    archive.summary.functions,
                                ],
                            ].map(
                                ([
                                    label,
                                    value,
                                ]) => (
                                    <div
                                        key={label}
                                        className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)]"
                                    >
                                        <dt className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-slate-500">
                                            {label}
                                        </dt>

                                        <dd className="mt-2 text-3xl font-black tracking-[-0.05em]">
                                            {number(
                                                Number(
                                                    value,
                                                ),
                                            )}
                                        </dd>
                                    </div>
                                ),
                            )}
                        </dl>
                    </div>
                </div>
            </section>

            <section className="px-5 pt-12 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-7xl rounded-[2rem] bg-[linear-gradient(135deg,#1e1b4b,#5b21b6_55%,#047857)] p-6 text-white shadow-[0_28px_100px_rgba(76,29,149,0.18)] sm:p-8">
                    <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-3xl">
                            <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-violet-200">
                                Search every captured record
                            </p>

                            <h2 className="mt-3 text-balance text-3xl font-black tracking-[-0.045em] sm:text-5xl">
                                Find any version, download,
                                command, rule, function, or
                                contributor.
                            </h2>
                        </div>

                        <Link
                            href="/archive/search"
                            prefetch={false}
                            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-white px-6 text-sm font-black text-violet-950"
                        >
                            Search the archive →
                        </Link>
                    </div>
                </div>
            </section>

            <section className="px-5 py-16 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-7xl">
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {archive.projects.map(
                            (
                                project,
                                index,
                            ) => (
                                <article
                                    key={project.slug}
                                    className="group min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-violet-300"
                                >
                                    <div className="flex items-start justify-between gap-5">
                                        <div className="min-w-0">
                                            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-violet-700">
                                                {String(
                                                    index
                                                    + 1,
                                                ).padStart(
                                                    2,
                                                    "0",
                                                )}
                                                {" · "}
                                                {project.fork
                                                    ? "Fork"
                                                    : project.archived
                                                        ? "Archived"
                                                        : "Repository"}
                                            </p>

                                            <h2 className="mt-3 break-words text-2xl font-black leading-tight tracking-[-0.04em]">
                                                {project.name}
                                            </h2>
                                        </div>

                                        <span
                                            aria-hidden="true"
                                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-lg transition group-hover:bg-violet-600 group-hover:text-white"
                                        >
                                            ↗
                                        </span>
                                    </div>

                                    <p className="mt-4 min-h-20 text-pretty text-sm font-semibold leading-6 text-slate-600">
                                        {project.description
                                            || "Public ForestOfLight repository captured in the archive."}
                                    </p>

                                    <dl className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5">
                                        <div>
                                            <dt className="text-[0.6rem] font-black uppercase tracking-[0.13em] text-slate-400">
                                                Versions
                                            </dt>

                                            <dd className="mt-1 text-lg font-black">
                                                {number(
                                                    project.counts.versions,
                                                )}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-[0.6rem] font-black uppercase tracking-[0.13em] text-slate-400">
                                                Functions
                                            </dt>

                                            <dd className="mt-1 text-lg font-black">
                                                {number(
                                                    project.counts.functions,
                                                )}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-[0.6rem] font-black uppercase tracking-[0.13em] text-slate-400">
                                                People
                                            </dt>

                                            <dd className="mt-1 text-lg font-black">
                                                {number(
                                                    project.counts.contributors,
                                                )}
                                            </dd>
                                        </div>
                                    </dl>

                                    <Link
                                        href={`/archive/${project.slug}`}
                                        prefetch={false}
                                        className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
                                    >
                                        Open complete archive
                                    </Link>
                                </article>
                            ),
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
