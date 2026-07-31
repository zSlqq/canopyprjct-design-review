"use client";

import {
    motion,
} from "framer-motion";
import {
    ArrowUpRight,
    Boxes,
    Braces,
    GitBranch,
    Layers3,
    PackageOpen,
    ServerCog,
} from "lucide-react";

import type { AddonProject } from "@/lib/types";

interface AddonCardProps {
    addon: AddonProject;
    index: number;
    onOpen: (addon: AddonProject) => void;
}

function ProjectGlyph({
    addon,
}: {
    addon: AddonProject;
}) {
    if (addon.kind === "Server plugin") {
        return (
            <ServerCog
                aria-hidden="true"
                size={23}
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
                size={23}
            />
        );
    }

    if (addon.kind === "Extension") {
        return (
            <GitBranch
                aria-hidden="true"
                size={23}
            />
        );
    }

    return (
        <Boxes
            aria-hidden="true"
            size={23}
        />
    );
}

export function AddonCard({
    addon,
    index,
    onOpen,
}: AddonCardProps) {
    const descriptionId =
        `${addon.id}-directory-description`;

    const projectNumber = String(
        index + 1,
    ).padStart(2, "0");

    return (
        <motion.article
            layout
            initial={{
                          opacity: 0,
                          y: 20,
                      }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            exit={{
                opacity: 0,
                y: 12,
            }}
            transition={{
                duration: 0.42,
                delay: Math.min( index * 0.035,
                          0.18,
                      ),
                ease: [
                    0.22,
                    1,
                    0.36,
                    1,
                ],
            }}
            className="group relative flex min-h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_28px_80px_rgba(76,29,149,0.13)] motion-reduce:transform-none"
        >
            <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 z-20 h-[3px]"
                style={{
                    backgroundColor:
                        addon.accent,
                }}
            />

            <div
                className="relative min-h-[15rem] overflow-hidden border-b border-slate-800 bg-[#0b1120] p-5 text-white sm:p-6"
                style={{
                    backgroundImage: [
                        `radial-gradient(circle at 84% 12%, ${addon.accent}45, transparent 34%)`,
                        `linear-gradient(145deg, ${addon.accent}16, transparent 52%)`,
                    ].join(","),
                }}
            >
                <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:28px_28px]"
                />

                <div className="relative flex h-full min-h-[12rem] flex-col">
                    <div className="flex items-start justify-between gap-4">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-brand-200 shadow-xl backdrop-blur">
                            <ProjectGlyph
                                addon={addon}
                            />
                        </span>

                        <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-slate-500">
                            {projectNumber}
                        </span>
                    </div>

                    <div className="mt-auto pt-10">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-brand-200">
                            {addon.kind}
                        </p>

                        <p className="mt-2 line-clamp-2 text-2xl font-black tracking-[-0.045em] text-white">
                            {addon.title}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                            {addon.tags
                                .slice(0, 3)
                                .map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.09em] text-slate-300 backdrop-blur"
                                    >
                                        {tag}
                                    </span>
                                ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.14em] text-brand-800">
                        {addon.category}
                    </span>

                    {addon.featured ? (
                        <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-brand-800">
                            Core ecosystem
                        </span>
                    ) : (
                        <span className="text-[9px] font-bold text-slate-400">
                            ForestOfLight
                        </span>
                    )}
                </div>

                <p
                    id={descriptionId}
                    className="mt-4 line-clamp-4 text-sm font-medium leading-6 text-slate-600"
                >
                    {addon.shortDescription}
                </p>

                <div className="mt-auto pt-6">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-t border-slate-200 pt-4">
                        <button
                            type="button"
                            onClick={() =>
                                onOpen(addon)
                            }
                            aria-describedby={
                                descriptionId
                            }
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-ink-950 px-4 text-[10px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-brand-800"
                        >
                            <Layers3
                                aria-hidden="true"
                                size={15}
                            />
                            Details
                        </button>

                        <a
                            href={addon.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${addon.title} releases`}
                            className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-ink-950 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                        >
                            <PackageOpen
                                aria-hidden="true"
                                size={16}
                            />
                        </a>

                        <a
                            href={addon.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${addon.title} repository`}
                            className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-ink-950 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                        >
                            <ArrowUpRight
                                aria-hidden="true"
                                size={16}
                            />
                        </a>
                    </div>
                </div>
            </div>
        </motion.article>
    );
}
