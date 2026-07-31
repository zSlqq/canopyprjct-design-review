import {
    ArrowLeft,
    ArrowUpRight,
    Boxes,
    Braces,
    CheckCircle2,
    GitBranch,
    Layers3,
    PackageOpen,
    ServerCog,
} from "lucide-react";
import Link from "next/link";
import type {
    CSSProperties,
} from "react";

import { ProjectFeatureSection } from "@/components/ProjectFeatureSection";
import type { AddonProject } from "@/lib/types";

interface ProjectDetailPageProps {
    project: AddonProject;
    relatedProjects: AddonProject[];
}

function ProjectIcon({
    project,
}: {
    project: AddonProject;
}) {
    if (
        project.kind ===
        "Server plugin"
    ) {
        return (
            <ServerCog
                aria-hidden="true"
                size={24}
            />
        );
    }

    if (
        project.kind ===
            "Developer tool" ||
        project.kind === "Template"
    ) {
        return (
            <Braces
                aria-hidden="true"
                size={24}
            />
        );
    }

    if (
        project.kind ===
        "Extension"
    ) {
        return (
            <GitBranch
                aria-hidden="true"
                size={24}
            />
        );
    }

    return (
        <Boxes
            aria-hidden="true"
            size={24}
        />
    );
}

export function ProjectDetailPage({
    project,
    relatedProjects,
}: ProjectDetailPageProps) {
    const theme = {
        "--project-accent":
            project.accent,
    } as CSSProperties;

    return (
        <main
            data-project-detail
            data-project-id={
                project.id
            }
            style={theme}
            className="min-h-screen bg-[#f5f5fa] text-ink-950"
        >
            <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl">
                <div className="mx-auto flex min-h-[4.75rem] max-w-[94rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <Link
                        href="/#projects"
                        data-back-to-projects
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-[9px] font-black uppercase tracking-[0.1em] text-ink-950 transition hover:border-brand-300 hover:bg-brand-50"
                    >
                        <ArrowLeft
                            aria-hidden="true"
                            size={14}
                        />

                        Projects
                    </Link>

                    <Link
                        href="/"
                        className="flex items-center gap-3"
                    >
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-950 text-white">
                            <Braces
                                aria-hidden="true"
                                size={17}
                            />
                        </span>

                        <span className="hidden sm:block">
                            <span className="block text-xs font-black text-ink-950">
                                ForestOfLight
                            </span>

                            <span className="mt-0.5 block text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">
                                Bedrock projects
                            </span>
                        </span>
                    </Link>

                    <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink-950 px-4 text-[9px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-brand-800"
                        style={{
                            color: "#ffffff",
                        }}
                    >
                        Repository

                        <ArrowUpRight
                            aria-hidden="true"
                            size={14}
                        />
                    </a>
                </div>
            </header>

            <section
                className="relative isolate overflow-hidden bg-[#090e1a] text-white"
                style={{
                    backgroundImage:
                        `radial-gradient(circle at 82% 8%, ${project.accent}55, transparent 34rem), radial-gradient(circle at 5% 92%, ${project.accent}28, transparent 28rem)`,
                }}
            >
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 opacity-[0.11] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:54px_54px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]"
                />

                <div className="mx-auto max-w-[94rem] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-1 lg:items-end">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <span
                                    className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.06]"
                                    style={{
                                        color:
                                            project.accent,
                                    }}
                                >
                                    <ProjectIcon
                                        project={
                                            project
                                        }
                                    />
                                </span>

                                <span className="text-[9px] font-black uppercase tracking-[0.17em] text-slate-300">
                                    {project.kind}
                                </span>

                                <span className="h-1 w-1 rounded-full bg-slate-600" />

                                <span className="text-[9px] font-black uppercase tracking-[0.17em] text-slate-500">
                                    {
                                        project.category
                                    }
                                </span>
                            </div>

                            <h1 className="mt-8 max-w-5xl break-words text-[clamp(3.8rem,8vw,7.8rem)] font-black leading-[0.84] tracking-[-0.08em] text-white">
                                {project.title}
                            </h1>

                            <p className="mt-8 max-w-3xl text-lg font-medium leading-8 text-slate-300 sm:text-xl">
                                {
                                    project.shortDescription
                                }
                            </p>

                            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                <a
                                    href={
                                        project.githubUrl
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[10px] font-black uppercase tracking-[0.12em] text-ink-950 transition hover:bg-brand-100"
                                >
                                    <GitBranch
                                        aria-hidden="true"
                                        size={15}
                                    />

                                    Repository

                                    <ArrowUpRight
                                        aria-hidden="true"
                                        size={14}
                                    />
                                </a>

                                <a
                                    href={
                                        project.downloadUrl
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 text-[10px] font-black uppercase tracking-[0.12em] text-white transition hover:border-brand-300/50 hover:bg-brand-400/10"
                                >
                                    <PackageOpen
                                        aria-hidden="true"
                                        size={15}
                                    />

                                    Releases

                                    <ArrowUpRight
                                        aria-hidden="true"
                                        size={14}
                                    />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto grid max-w-[94rem] grid-cols-2 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
                    {[
                        [
                            "Version",
                            project.version,
                        ],
                        [
                            "Minecraft",
                            project.minecraftVersion,
                        ],
                        [
                            "Maintainer",
                            project.author,
                        ],
                        [
                            "Status",
                            project.stats
                                .updatedAt,
                        ],
                    ].map(
                        ([
                            label,
                            value,
                        ]) => (
                            <div
                                key={label}
                                className="border-b border-r border-slate-200 px-4 py-6 last:border-r-0 md:border-b-0"
                            >
                                <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">
                                    {label}
                                </p>

                                <p className="mt-3 text-sm font-black leading-6 text-ink-950">
                                    {value}
                                </p>
                            </div>
                        ),
                    )}
                </div>
            </section>

            <section className="mx-auto max-w-[94rem] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.17em] text-brand-800">
                            Overview
                        </p>

                        <h2 className="mt-5 text-4xl font-black tracking-[-0.055em] text-ink-950 sm:text-5xl">
                            About the project
                        </h2>
                    </div>

                    <div>
                        <p className="text-lg font-medium leading-9 text-slate-600">
                            {
                                project.fullDescription
                            }
                        </p>

                        <div className="mt-9 flex flex-wrap gap-2">
                            {project.tags.map(
                                (tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-slate-500"
                                    >
                                        {tag}
                                    </span>
                                ),
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-20 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {project.capabilities.map(
                        (
                            capability,
                            index,
                        ) => (
                            <article
                                key={
                                    capability
                                }
                                data-capability
                                className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]"
                            >
                                <div
                                    aria-hidden="true"
                                    className="absolute inset-x-0 top-0 h-[3px]"
                                    style={{
                                        backgroundColor:
                                            project.accent,
                                    }}
                                />

                                <div className="flex items-start justify-between gap-5">
                                    <span
                                        className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-slate-50"
                                        style={{
                                            color:
                                                project.accent,
                                        }}
                                    >
                                        <CheckCircle2
                                            aria-hidden="true"
                                            size={18}
                                        />
                                    </span>

                                    <span className="font-mono text-[9px] font-black text-slate-400">
                                        {String(
                                            index + 1,
                                        ).padStart(
                                            2,
                                            "0",
                                        )}
                                    </span>
                                </div>

                                <p className="mt-7 text-sm font-bold leading-7 text-ink-950">
                                    {capability}
                                </p>
                            </article>
                        ),
                    )}
                </div>
            </section>

            <section className="border-y border-slate-200 bg-white">
                <div className="mx-auto grid max-w-[94rem] gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:px-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <span
                                className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-slate-50"
                                style={{
                                    color:
                                        project.accent,
                                }}
                            >
                                <Layers3
                                    aria-hidden="true"
                                    size={18}
                                />
                            </span>

                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-brand-800">
                                    Setup
                                </p>

                                <h2 className="mt-1 text-3xl font-black tracking-[-0.045em] text-ink-950">
                                    Installation
                                </h2>
                            </div>
                        </div>

                        <ol className="mt-8 space-y-3">
                            {project.installationSteps.map(
                                (
                                    step,
                                    index,
                                ) => (
                                    <li
                                        key={step}
                                        className="grid grid-cols-[2.5rem_1fr] gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                    >
                                        <span
                                            className="grid h-10 w-10 place-items-center rounded-xl text-[10px] font-black text-white"
                                            style={{
                                                backgroundColor:
                                                    project.accent,
                                            }}
                                        >
                                            {String(
                                                index +
                                                    1,
                                            ).padStart(
                                                2,
                                                "0",
                                            )}
                                        </span>

                                        <p className="pt-2 text-sm font-medium leading-6 text-slate-600">
                                            {step}
                                        </p>
                                    </li>
                                ),
                            )}
                        </ol>
                    </div>

                    <div>
                        <div className="flex items-center gap-3">
                            <span
                                className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-slate-50"
                                style={{
                                    color:
                                        project.accent,
                                }}
                            >
                                <Boxes
                                    aria-hidden="true"
                                    size={18}
                                />
                            </span>

                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-brand-800">
                                    Requirements
                                </p>

                                <h2 className="mt-1 text-3xl font-black tracking-[-0.045em] text-ink-950">
                                    Dependencies
                                </h2>
                            </div>
                        </div>

                        <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#090e1a]">
                            <div className="border-b border-white/10 px-5 py-4">
                                <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-slate-500">
                                    Project requirements
                                </p>
                            </div>

                            <div className="divide-y divide-white/10">
                                {project.dependencies.map(
                                    (
                                        dependency,
                                        index,
                                    ) => (
                                        <div
                                            key={
                                                dependency
                                            }
                                            className="flex items-center justify-between gap-5 px-5 py-5"
                                        >
                                            <span className="text-sm font-bold text-white">
                                                {
                                                    dependency
                                                }
                                            </span>

                                            <span className="font-mono text-[9px] text-slate-500">
                                                {String(
                                                    index +
                                                        1,
                                                ).padStart(
                                                    2,
                                                    "0",
                                                )}
                                            </span>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <ProjectFeatureSection
                projectId={project.id}
                projectTitle={
                    project.title
                }
            />

            {relatedProjects.length > 0 ? (
                <section className="mx-auto max-w-[94rem] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
                    <div className="flex flex-col gap-5 border-b border-slate-300 pb-8 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-brand-800">
                                More projects
                            </p>

                            <h2 className="mt-4 text-4xl font-black tracking-[-0.055em] text-ink-950">
                                Related work
                            </h2>
                        </div>

                        <Link
                            href="/#projects"
                            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-5 text-[9px] font-black uppercase tracking-[0.1em] text-ink-950 transition hover:border-brand-300 hover:bg-brand-50"
                        >
                            Full index

                            <ArrowUpRight
                                aria-hidden="true"
                                size={14}
                            />
                        </Link>
                    </div>

                    <div className="mt-7 grid gap-4 md:grid-cols-3">
                        {relatedProjects.map(
                            (
                                related,
                                index,
                            ) => (
                                <Link
                                    key={
                                        related.id
                                    }
                                    href={`/projects/${related.id}`}
                                    className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-brand-300"
                                >
                                    <div
                                        aria-hidden="true"
                                        className="absolute inset-x-0 top-0 h-[3px]"
                                        style={{
                                            backgroundColor:
                                                related.accent,
                                        }}
                                    />

                                    <div className="flex items-start justify-between gap-5">
                                        <span
                                            className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-slate-50"
                                            style={{
                                                color:
                                                    related.accent,
                                            }}
                                        >
                                            <Boxes
                                                aria-hidden="true"
                                                size={18}
                                            />
                                        </span>

                                        <span className="font-mono text-[9px] text-slate-400">
                                            {String(
                                                index +
                                                    1,
                                            ).padStart(
                                                2,
                                                "0",
                                            )}
                                        </span>
                                    </div>

                                    <p className="mt-7 text-[9px] font-black uppercase tracking-[0.14em] text-brand-800">
                                        {
                                            related.kind
                                        }
                                    </p>

                                    <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-ink-950">
                                        {
                                            related.title
                                        }
                                    </h3>

                                    <p className="mt-4 line-clamp-3 text-sm font-medium leading-6 text-slate-600">
                                        {
                                            related.shortDescription
                                        }
                                    </p>

                                    <span className="mt-7 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.1em] text-ink-950">
                                        Open project

                                        <ArrowUpRight
                                            aria-hidden="true"
                                            size={14}
                                            className="transition group-hover:translate-x-1"
                                        />
                                    </span>
                                </Link>
                            ),
                        )}
                    </div>
                </section>
            ) : null}

            <footer className="border-t border-white/10 bg-[#090e1a] text-white">
                <div className="mx-auto flex max-w-[94rem] flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-ink-950">
                            <Braces
                                aria-hidden="true"
                                size={17}
                            />
                        </span>

                        <div>
                            <p className="text-sm font-black">
                                ForestOfLight
                            </p>

                            <p className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">
                                Bedrock projects
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/#projects"
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-[9px] font-black uppercase tracking-[0.1em] text-white transition hover:border-brand-300/50 hover:bg-white/[0.05]"
                    >
                        Project index

                        <ArrowUpRight
                            aria-hidden="true"
                            size={14}
                        />
                    </Link>
                </div>
            </footer>
        </main>
    );
}
