"use client";

import {
    ArrowUpRight,
    Boxes,
    Braces,
    GitBranch,
    PackageOpen,
    ServerCog,
} from "lucide-react";
import Link from "next/link";

import { addons } from "@/lib/data/addons";
import type { AddonProject } from "@/lib/types";

function ProjectIcon({
    addon,
}: {
    addon: AddonProject;
}) {
    if (addon.kind === "Server plugin") {
        return (
            <ServerCog
                aria-hidden="true"
                size={21}
            />
        );
    }

    if (
        addon.kind === "Developer tool" ||
        addon.kind === "Template"
    ) {
        return (
            <Braces
                aria-hidden="true"
                size={21}
            />
        );
    }

    if (addon.kind === "Extension") {
        return (
            <GitBranch
                aria-hidden="true"
                size={21}
            />
        );
    }

    return (
        <Boxes
            aria-hidden="true"
            size={21}
        />
    );
}

function ProjectIndexRow({
    addon,
    index,
}: {
    addon: AddonProject;
    index: number;
}) {
    const number = String(
        index + 1,
    ).padStart(2, "0");

    return (
        <article
            data-project-index-row
            className="group relative overflow-hidden border-b border-slate-200 bg-white transition duration-300 last:border-b-0 hover:bg-[#faf9ff]"
        >
            <div
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-[3px] origin-center scale-y-0 transition duration-300 group-hover:scale-y-100"
                style={{
                    backgroundColor:
                        addon.accent,
                }}
            />

            <div className="grid gap-6 px-5 py-7 sm:px-7 lg:grid-cols-[4.5rem_minmax(14rem,0.9fr)_minmax(18rem,1.25fr)_auto] lg:items-center lg:px-8 lg:py-8">
                <div className="flex items-center gap-4 lg:block">
                    <span className="font-mono text-[10px] font-black tracking-[0.13em] text-slate-400">
                        {number}
                    </span>

                    <span
                        className="mt-0 grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-slate-50 transition duration-300 group-hover:border-brand-200 group-hover:bg-brand-50 lg:mt-4"
                        style={{
                            color: addon.accent,
                        }}
                    >
                        <ProjectIcon
                            addon={addon}
                        />
                    </span>
                </div>

                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-brand-800">
                            {addon.kind}
                        </span>

                        {addon.featured ? (
                            <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-brand-800">
                                Core project
                            </span>
                        ) : null}
                    </div>

                    <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-ink-950 sm:text-[1.75rem]">
                        {addon.title}
                    </h3>

                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.11em] text-slate-400">
                        {addon.category}
                    </p>
                </div>

                <div>
                    <p className="max-w-2xl text-sm font-medium leading-7 text-slate-600">
                        {addon.shortDescription}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {addon.tags
                            .slice(0, 4)
                            .map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.09em] text-slate-500"
                                >
                                    {tag}
                                </span>
                            ))}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:max-w-[14rem] lg:justify-end">
                    <Link
                        href={`/projects/${addon.id}`}
                        data-project-details-link
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 text-[9px] font-black uppercase tracking-[0.1em] text-white shadow-lg shadow-slate-950/10 transition hover:bg-brand-800"
                        style={{
                            color: "#ffffff",
                        }}
                    >
                        Project page

                        <ArrowUpRight
                            aria-hidden="true"
                            size={14}
                        />
                    </Link>

                    <a
                        href={addon.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-[9px] font-black uppercase tracking-[0.1em] transition hover:border-brand-300 hover:bg-brand-50"
                        style={{
                            color: "#0f172a",
                        }}
                    >
                        Repository

                        <ArrowUpRight
                            aria-hidden="true"
                            size={14}
                        />
                    </a>

                    <a
                        href={addon.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${addon.title} releases`}
                        className="grid h-11 w-11 place-items-center rounded-xl border border-slate-300 bg-white text-ink-950 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                    >
                        <PackageOpen
                            aria-hidden="true"
                            size={15}
                        />
                    </a>
                </div>
            </div>
        </article>
    );
}

export function TechnicalHub() {
    const projects = [...addons].sort(
        (first, second) =>
            Number(
                Boolean(second.featured),
            ) -
            Number(
                Boolean(first.featured),
            ),
    );

    const categoryCount = new Set(
        projects.map(
            (project) =>
                project.category,
        ),
    ).size;

    const developerCount =
        projects.filter(
            (project) =>
                project.kind ===
                    "Developer tool" ||
                project.kind ===
                    "Template",
        ).length;

    return (
        <section
            id="projects"
            data-project-count={
                projects.length
            }
            aria-labelledby="projects-title"
            className="relative scroll-mt-24 overflow-hidden border-t border-slate-200 bg-[#f5f5fa] py-20 sm:py-28"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(124,58,237,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.045)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]"
            />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-44 top-16 h-[32rem] w-[32rem] rounded-full bg-violet-300/20 blur-[125px]"
            />

            <div className="relative mx-auto max-w-[94rem] px-4 sm:px-6 lg:px-8">
                <header className="grid gap-10 border-b border-slate-300/80 pb-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
                    <div>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-brand-800">
                            <span className="grid h-8 min-w-8 place-items-center rounded-xl border border-brand-200 bg-brand-50 px-2">
                                08
                            </span>

                            <span>
                                Project directory
                            </span>
                        </div>

                        <h2
                            id="projects-title"
                            className="mt-7 max-w-5xl text-[clamp(3.7rem,8vw,7.4rem)] font-black leading-[0.84] tracking-[-0.078em] text-ink-950"
                        >
                            Project
                            <br />
                            index.
                        </h2>
                    </div>

                    <div className="max-w-xl lg:ml-auto">
                        <p className="text-lg font-medium leading-8 text-slate-600">
                            Every public ForestOfLight
                            tool, extension, server
                            project, template, and
                            developer utility in one
                            place.
                        </p>

                        <div className="mt-7 grid grid-cols-3 gap-3">
                            {[
                                [
                                    String(
                                        projects.length,
                                    ).padStart(
                                        2,
                                        "0",
                                    ),
                                    "Projects",
                                ],
                                [
                                    String(
                                        categoryCount,
                                    ).padStart(
                                        2,
                                        "0",
                                    ),
                                    "Categories",
                                ],
                                [
                                    String(
                                        developerCount,
                                    ).padStart(
                                        2,
                                        "0",
                                    ),
                                    "Dev tools",
                                ],
                            ].map(
                                ([
                                    value,
                                    label,
                                ]) => (
                                    <div
                                        key={label}
                                        className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-4 shadow-sm backdrop-blur"
                                    >
                                        <p className="font-mono text-lg font-black text-ink-950">
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

                <div className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
                    {projects.map(
                        (
                            addon,
                            index,
                        ) => (
                            <ProjectIndexRow
                                key={
                                    addon.id
                                }
                                addon={
                                    addon
                                }
                                index={
                                    index
                                }
                            />
                        ),
                    )}
                </div>
            </div>
        </section>
    );
}
