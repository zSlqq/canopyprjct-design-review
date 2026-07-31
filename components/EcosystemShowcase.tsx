"use client";

import {
    motion,
} from "framer-motion";
import {
    ArrowUpRight,
    Blocks,
    Bot,
    Braces,
    Layers3,
    PackageOpen,
    ServerCog,
    Sparkles,
    Waypoints,
} from "lucide-react";
import Image from "next/image";
import {
    type ReactNode,
    useState,
} from "react";

import { ClosingSequence } from "@/components/ClosingSequence";
import { DeveloperEcosystem } from "@/components/DeveloperEcosystem";
import { Stage37Home } from "@/components/home/Stage37Home";
import { ImageGalleryModal } from "@/components/ImageGalleryModal";
import { SiteNavigation } from "@/components/SiteNavigation";
import { TechnicalHub } from "@/components/TechnicalHub";
import { addons } from "@/lib/data/addons";
import type { AddonProject } from "@/lib/types";
import { FeatureExplorer } from "@/components/FeatureExplorer";
function project(
    title: string,
    alternateIds: string[] = [],
): AddonProject | undefined {
    const normalized =
        title.toLowerCase();

    return addons.find((item) => {
        return (
            item.title.toLowerCase() ===
                normalized ||
            alternateIds.includes(item.id)
        );
    });
}

function Reveal({
    children,
    className = "",
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{
                          opacity: 0,
                          y: 26,
                      }}
            whileInView={{
                opacity: 1,
                y: 0,
            }}
            viewport={{
                once: true,
                amount: 0.18,
            }}
            transition={{
                duration: 0.72,
                delay: delay,
                ease: [0.22, 1, 0.36, 1],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

function SectionIndex({
    number,
    label,
    inverse = false,
}: {
    number: string;
    label: string;
    inverse?: boolean;
}) {
    return (
        <div
            className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] ${
                inverse
                    ? "text-brand-200"
                    : "text-brand-800"
            }`}
        >
            <span
                className={`grid h-8 min-w-8 place-items-center rounded-xl border px-2 ${
                    inverse
                        ? "border-white/15 bg-white/[0.05]"
                        : "border-brand-200 bg-brand-50"
                }`}
            >
                {number}
            </span>

            <span>{label}</span>
        </div>
    );
}

function Actions({
    item,
    onDetails,
    inverse = false,
}: {
    item: AddonProject;
    onDetails: (
        project: AddonProject,
    ) => void;
    inverse?: boolean;
}) {
    return (
        <div className="flex flex-wrap gap-2.5">
            <button
                type="button"
                onClick={() =>
                    onDetails(item)
                }
                className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[10px] font-black uppercase tracking-[0.1em] transition ${
                    inverse
                        ? "bg-white text-ink-950 hover:bg-brand-100"
                        : "bg-ink-950 text-white hover:bg-brand-800"
                }`}
            >
                <Layers3
                    aria-hidden="true"
                    size={15}
                />
                Details
            </button>

            <a
                href={item.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-[10px] font-black uppercase tracking-[0.1em] transition ${
                    inverse
                        ? "border-white/15 bg-white/[0.04] text-white hover:border-brand-300 hover:bg-brand-500/10"
                        : "border-slate-300 bg-white text-ink-950 hover:border-brand-300 hover:bg-brand-50"
                }`}
            >
                <PackageOpen
                    aria-hidden="true"
                    size={15}
                />
                Download
            </a>

            <a
                href={item.githubUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${item.title} repository`}
                className={`grid h-11 w-11 place-items-center rounded-xl border transition ${
                    inverse
                        ? "border-white/15 bg-white/[0.04] text-white hover:border-brand-300 hover:bg-brand-500/10"
                        : "border-slate-300 bg-white text-ink-950 hover:border-brand-300 hover:bg-brand-50"
                }`}
            >
                <ArrowUpRight
                    aria-hidden="true"
                    size={16}
                />
            </a>
        </div>
    );
}

function CapabilityRows({
    item,
    limit,
    inverse = false,
}: {
    item: AddonProject;
    limit: number;
    inverse?: boolean;
}) {
    return (
        <div className="grid gap-2.5 sm:grid-cols-2">
            {item.capabilities
                .slice(0, limit)
                .map((capability) => (
                    <div
                        key={capability}
                        className={`flex gap-3 rounded-xl border px-4 py-3 text-xs font-semibold leading-5 ${
                            inverse
                                ? "border-white/10 bg-white/[0.04] text-slate-200"
                                : "border-slate-200 bg-white text-slate-600"
                        }`}
                    >
                        <span
                            aria-hidden="true"
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{
                                backgroundColor:
                                    item.accent,
                            }}
                        />

                        {capability}
                    </div>
                ))}
        </div>
    );
}

function CanopyProductVisual({
    item,
}: {
    item: AddonProject;
}) {
    const [imageFailed, setImageFailed] =
        useState(false);

    const banner = item.screenshots[0];

    const primaryResources = [
        {
            code: "01",
            title: "Live world data",
            detail:
                "Biome, light, blocks, entities, and TPS",
        },
        {
            code: "02",
            title: "Technical diagnostics",
            detail:
                "Farm rates, spawning, counters, and inspection",
        },
        {
            code: "03",
            title: "Runtime control",
            detail:
                "Tick speed, freezing, stepping, and rules",
        },
    ];

    const connectedResources = [
        {
            title: "Understudy",
            detail: "Canopy extension for simulated players",
        },
        {
            title: "Statistic Display",
            detail: "Canopy extension for world statistics",
        },
    ];

    return (
        <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-800 bg-[#080d19] shadow-[0_40px_130px_rgba(15,23,42,0.36)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(124,58,237,0.22),transparent_30rem),radial-gradient(circle_at_94%_92%,rgba(88,28,135,0.18),transparent_24rem)]" />

            <div className="relative flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="h-2 w-2 rounded-full bg-amber-300" />
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>

                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Canopy technical layer
                </span>

                <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-brand-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
                    Connected
                </span>
            </div>

            <div className="relative grid items-start gap-5 p-5 sm:p-7 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-3 sm:p-4">
                    <motion.div
                        initial={{
                                      opacity: 0,
                                      y: 24,
                                      scale: 0.965,
                                  }}
                        whileInView={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}
                        viewport={{
                            once: true,
                            amount: 0.48,
                        }}
                        transition={{
                            duration: 0.82,
                            ease: [
                                0.22,
                                1,
                                0.36,
                                1,
                            ],
                        }}
                        className="relative aspect-[16/10] overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#0b1519]"
                    >
                        {banner &&
                        !imageFailed ? (
                            <Image
                                src={banner}
                                alt="Canopy project artwork"
                                fill
                                priority
                                sizes="(min-width: 1024px) 46vw, 90vw"
                                className="object-cover"
                                onError={() =>
                                    setImageFailed(
                                        true,
                                    )
                                }
                            />
                        ) : (
                            <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_28%_22%,rgba(34,197,94,0.22),transparent_32%),linear-gradient(145deg,#071712,#0f172a)]">
                                <div className="text-center">
                                    <span className="mx-auto grid h-20 w-20 place-items-center rounded-[1.6rem] border border-white/15 bg-white/[0.07] text-white shadow-2xl backdrop-blur">
                                        <Braces
                                            aria-hidden="true"
                                            size={34}
                                        />
                                    </span>

                                    <p className="mt-5 text-xl font-black tracking-[-0.04em] text-white">
                                        Canopy
                                    </p>
                                </div>
                            </div>
                        )}

                        <motion.div
                            aria-hidden="true"
                            initial={{
                                          x: "-115%",
                                          opacity: 0,
                                      }}
                            whileInView={{
                                x: "135%",
                                opacity: [
                                    0,
                                    0.72,
                                    0,
                                ],
                            }}
                            viewport={{
                                once: true,
                                amount: 0.55,
                            }}
                            transition={{
                                duration: 1.15,
                                delay: 0.45,
                                ease: "easeInOut",
                            }}
                            className="absolute inset-y-0 w-28 rotate-12 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-md"
                        />

                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-slate-950 via-slate-950/72 to-transparent px-5 pb-5 pt-20">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-brand-200">
                                    Flagship project
                                </p>

                                <p className="mt-1 text-sm font-black text-white">
                                    The technical core
                                    of the ecosystem
                                </p>
                            </div>

                            <span className="rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-white backdrop-blur">
                                Project artwork
                            </span>
                        </div>
                    </motion.div>

                    <div className="mt-3 grid gap-2.5">
                        {primaryResources.map(
                            (
                                resource,
                                index,
                            ) => (
                                <motion.div
                                    key={
                                        resource.code
                                    }
                                    initial={{
                                                  opacity: 0,
                                                  y: 12,
                                              }}
                                    whileInView={{
                                        opacity: 1,
                                        y: 0,
                                    }}
                                    viewport={{
                                        once: true,
                                        amount: 0.6,
                                    }}
                                    transition={{
                                        duration: 0.48,
                                        delay: 0.58 + index * 0.11,
                                    }}
                                    className="grid grid-cols-[2.4rem_1fr] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3"
                                >
                                    <span className="grid h-9 w-9 place-items-center rounded-lg border border-brand-300/15 bg-brand-400/10 font-mono text-[9px] font-black text-brand-200">
                                        {
                                            resource.code
                                        }
                                    </span>

                                    <div>
                                        <p className="text-xs font-black text-white">
                                            {
                                                resource.title
                                            }
                                        </p>

                                        <p className="mt-0.5 text-[10px] font-medium leading-4 text-slate-400">
                                            {
                                                resource.detail
                                            }
                                        </p>
                                    </div>
                                </motion.div>
                            ),
                        )}
                    </div>
                </div>

                <div className="relative flex flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.17em] text-brand-200">
                            Verified extension layer
                        </p>

                        <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
                            Two extensions.
                            <br />
                            Built on Canopy.
                        </h3>

                        <p className="mt-4 text-sm font-medium leading-6 text-slate-400">
                            Canopy supplies the shared
                            technical foundation. Its
                            extensions build focused
                            workflows above it.
                        </p>
                    </div>

                    <motion.svg
                        aria-hidden="true"
                        viewBox="0 0 320 92"
                        className="my-5 h-20 w-full overflow-visible"
                    >
                        <motion.path
                            d="M14 46 H92 C116 46 112 18 138 18 H306"
                            fill="none"
                            stroke="rgba(196,181,253,0.5)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            initial={{
                                          pathLength: 0,
                                          opacity: 0,
                                      }}
                            whileInView={{
                                pathLength: 1,
                                opacity: 1,
                            }}
                            viewport={{
                                once: true,
                                amount: 0.7,
                            }}
                            transition={{
                                duration: 0.9,
                                delay: 0.65,
                            }}
                        />

                        <motion.path
                            d="M92 46 C116 46 112 74 138 74 H306"
                            fill="none"
                            stroke="rgba(167,139,250,0.32)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            initial={{
                                          pathLength: 0,
                                          opacity: 0,
                                      }}
                            whileInView={{
                                pathLength: 1,
                                opacity: 1,
                            }}
                            viewport={{
                                once: true,
                                amount: 0.7,
                            }}
                            transition={{
                                duration: 0.9,
                                delay: 0.82,
                            }}
                        />

                        <circle
                            cx="14"
                            cy="46"
                            r="4"
                            fill="#c4b5fd"
                        />

                        <circle
                            cx="306"
                            cy="18"
                            r="3"
                            fill="#a78bfa"
                        />

                        <circle
                            cx="306"
                            cy="74"
                            r="3"
                            fill="#a78bfa"
                        />
                    </motion.svg>

                    <div className="space-y-3">
                        {connectedResources.map(
                            (
                                resource,
                                index,
                            ) => (
                                <motion.div
                                    key={
                                        resource.title
                                    }
                                    initial={{
                                                  opacity: 0,
                                                  x: 20,
                                              }}
                                    whileInView={{
                                        opacity: 1,
                                        x: 0,
                                    }}
                                    viewport={{
                                        once: true,
                                        amount: 0.65,
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        delay: 0.82 + index * 0.12,
                                    }}
                                    className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3.5"
                                >
                                    <div>
                                        <p className="text-xs font-black text-white">
                                            {
                                                resource.title
                                            }
                                        </p>

                                        <p className="mt-1 text-[10px] font-medium text-slate-400">
                                            {
                                                resource.detail
                                            }
                                        </p>
                                    </div>

                                    <ArrowUpRight
                                        aria-hidden="true"
                                        size={14}
                                        className="shrink-0 text-brand-200"
                                    />
                                </motion.div>
                            ),
                        )}
                    </div>

                    <div className="mt-auto pt-5">
                        <div className="flex items-center justify-between border-t border-white/10 pt-4">
                            <span className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">
                                Extension interface
                            </span>

                            <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.13em] text-brand-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
                                Available
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


function ExtensionModule({
    item,
    icon,
    index,
    onDetails,
}: {
    item: AddonProject;
    icon: ReactNode;
    index: string;
    onDetails: (
        project: AddonProject,
    ) => void;
}) {
    return (
        <Reveal>
            <article className="group relative overflow-hidden border-t border-slate-200 py-8 first:border-t-0 lg:grid lg:grid-cols-[7rem_0.8fr_1.2fr] lg:items-start lg:gap-7">
                <div className="hidden pt-1 lg:block">
                    <span className="font-mono text-xs font-bold text-slate-400">
                        {index}
                    </span>
                </div>

                <div>
                    <span className="grid h-13 w-13 place-items-center rounded-2xl bg-ink-950 text-white shadow-lg">
                        {icon}
                    </span>

                    <p className="mt-6 text-[9px] font-black uppercase tracking-[0.16em] text-brand-700">
                        Canopy extension
                    </p>

                    <h3 className="mt-2 text-3xl font-black tracking-[-0.045em] text-ink-950">
                        {item.title}
                    </h3>
                </div>

                <div className="mt-6 lg:mt-0">
                    <p className="max-w-2xl text-base font-medium leading-7 text-slate-600">
                        {item.fullDescription}
                    </p>

                    <div className="mt-5">
                        <CapabilityRows
                            item={item}
                            limit={4}
                        />
                    </div>

                    <div className="mt-6">
                        <Actions
                            item={item}
                            onDetails={onDetails}
                        />
                    </div>
                </div>
            </article>
        </Reveal>
    );
}

function WorkflowSection({
    item,
    number,
    descriptor,
    title,
    icon,
    reverse,
    onDetails,
}: {
    item: AddonProject;
    number: string;
    descriptor: string;
    title: ReactNode;
    icon: ReactNode;
    reverse?: boolean;
    onDetails: (
        project: AddonProject,
    ) => void;
}) {
    return (
        <section className="border-t border-slate-200 py-16 first:border-t-0 sm:py-24">
            <div
                className={`grid gap-10 lg:grid-cols-2 lg:items-center ${
                    reverse
                        ? "lg:[&>*:first-child]:order-2"
                        : ""
                }`}
            >
                <Reveal>
                    <div className="relative min-h-[31rem] overflow-hidden rounded-[2rem] border border-slate-200 bg-ink-950 shadow-panel">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(124,58,237,0.32),transparent_32%),linear-gradient(145deg,#0f172a,#1e1b4b)]" />

                        <div className="absolute inset-0 opacity-[0.11] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:38px_38px]" />

                        <motion.div
                            initial={{
                                          opacity: 0,
                                          scale: 0.78,
                                          y: 22,
                                      }}
                            whileInView={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                            }}
                            viewport={{
                                once: true,
                                amount: 0.5,
                            }}
                            transition={{
                                duration: 0.9,
                                ease: [
                                    0.22,
                                    1,
                                    0.36,
                                    1,
                                ],
                            }}
                            className="absolute left-1/2 top-1/2 grid h-48 w-48 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[2.6rem] border border-white/15 bg-white/[0.08] text-white shadow-[0_28px_90px_rgba(124,58,237,0.28)] backdrop-blur"
                        >
                            {icon}
                        </motion.div>

                        <motion.div
                            initial={{
                                          opacity: 0,
                                          width: 0,
                                      }}
                            whileInView={{
                                opacity: 1,
                                width: "58%",
                            }}
                            viewport={{
                                once: true,
                                amount: 0.6,
                            }}
                            transition={{
                                duration: 0.85,
                                delay: 0.35,
                            }}
                            className="absolute left-8 top-10 h-px bg-gradient-to-r from-brand-300 to-transparent"
                        />

                        <div className="absolute inset-x-6 bottom-6 flex items-end justify-between border-t border-white/10 pt-5">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-brand-200">
                                    {descriptor}
                                </p>

                                <p className="mt-1 text-sm font-black text-white">
                                    {item.title}
                                </p>
                            </div>

                            <span className="font-mono text-[10px] font-bold text-slate-500">
                                {number}
                            </span>
                        </div>
                    </div>
                </Reveal>

                <Reveal delay={0.1}>
                    <div className="lg:px-5">
                        <SectionIndex
                            number={number}
                            label={descriptor}
                        />

                        <h2 className="mt-7 text-[clamp(3.2rem,7vw,6.7rem)] font-black leading-[0.88] tracking-[-0.075em] text-ink-950">
                            {title}
                        </h2>

                        <p className="mt-7 max-w-xl text-lg font-medium leading-8 text-slate-600">
                            {item.fullDescription}
                        </p>

                        <div className="mt-8">
                            <CapabilityRows
                                item={item}
                                limit={4}
                            />
                        </div>

                        <div className="mt-8">
                            <Actions
                                item={item}
                                onDetails={onDetails}
                            />
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}


export function EcosystemShowcase() {
    const [
        selectedProject,
        setSelectedProject,
    ] = useState<AddonProject | null>(
        null,
    );

    const canopy = project(
        "Canopy",
        ["canopy"],
    );

    const understudy = project(
        "Understudy",
        ["understudy"],
    );

    const statisticDisplay = project(
        "Statistic Display",
        [
            "statistic-display",
            "statisticdisplay",
        ],
    );

    const construct = project(
        "Construct",
        ["construct"],
    );

    const nudge = project(
        "Nudge",
        ["nudge"],
    );

    const boreal = project(
        "Boreal",
        ["boreal"],
    );



    return (
        <>
            <main className="min-h-screen overflow-hidden bg-[#fafafa] text-ink-950">
                <SiteNavigation />

                <div id="top" />

                <Stage37Home />




            {process.env.NEXT_PUBLIC_STAGE36_LEGACY_HOME === "1" ? (
                <div data-stage36-legacy-home>
{canopy ? (
                    <section
                        id="canopy"
                        className="scroll-mt-24 border-b border-slate-200 py-20 sm:py-28"
                    >
                        <div className="mx-auto max-w-[94rem] px-4 sm:px-6 lg:px-8">
                            <div className="grid gap-12 lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
                                <Reveal>
                                    <div>
                                        <SectionIndex
                                            number="01"
                                            label="Flagship system"
                                        />

                                        <p className="mt-9 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                            Technical
                                            foundation
                                        </p>

                                        <h2 className="mt-3 text-[clamp(4rem,9vw,8rem)] font-black leading-[0.82] tracking-[-0.085em] text-ink-950">
                                            Canopy
                                        </h2>

                                        <p className="mt-7 max-w-xl text-lg font-medium leading-8 text-slate-600">
                                            {
                                                canopy.fullDescription
                                            }
                                        </p>

                                        <div className="mt-8">
                                            <CapabilityRows
                                                item={
                                                    canopy
                                                }
                                                limit={6}
                                            />
                                        </div>

                                        <div className="mt-8">
                                            <Actions
                                                item={
                                                    canopy
                                                }
                                                onDetails={
                                                    setSelectedProject
                                                }
                                            />
                                        </div>
                                    </div>
                                </Reveal>

                                <Reveal delay={0.12}>
                                    <CanopyProductVisual
                                        item={canopy}
                                    />
                                </Reveal>
                            </div>
                        </div>
                    </section>
                ) : null}

                {(understudy ||
                    statisticDisplay) ? (
                    <section
                        id="extensions"
                        className="scroll-mt-24 border-b border-slate-200 bg-white py-20 sm:py-28"

            data-stage29-canopy-section
>
                        <div className="mx-auto max-w-[94rem] px-4 sm:px-6 lg:px-8">
                            <Reveal>
                                <div className="grid gap-7 border-b border-slate-200 pb-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                                    <div>
                                        <SectionIndex
                                            number="02"
                                            label="Canopy extension layer"
                                        />

                                        <h2 className="mt-7 text-[clamp(3.5rem,7vw,6.8rem)] font-black leading-[0.88] tracking-[-0.075em] text-ink-950">
                                            The core,
                                            extended.
                                        </h2>
                                    </div>

                                    <p className="max-w-xl text-lg font-medium leading-8 text-slate-600 lg:ml-auto">
                                        Specialized
                                        systems connect
                                        to Canopy for
                                        simulated players
                                        and persistent
                                        world statistics.
                                    </p>
                                </div>
                            </Reveal>

                            <div>
                                {understudy ? (
                                    <ExtensionModule
                                        item={
                                            understudy
                                        }
                                        icon={
                                            <Bot
                                                aria-hidden="true"
                                                size={22}
                                            />
                                        }
                                        index="02.1"
                                        onDetails={
                                            setSelectedProject
                                        }
                                    />
                                ) : null}

                                {statisticDisplay ? (
                                    <ExtensionModule
                                        item={
                                            statisticDisplay
                                        }
                                        icon={
                                            <Sparkles
                                                aria-hidden="true"
                                                size={22}
                                            />
                                        }
                                        index="02.2"
                                        onDetails={
                                            setSelectedProject
                                        }
                                    />
                                ) : null}
                            </div>
                        </div>
                    </section>
                ) : null}

                {(construct || nudge) ? (
                    <section
                        id="workflows"
                        className="scroll-mt-24 border-b border-slate-200 py-4"
                    >
                        <div className="mx-auto max-w-[94rem] px-4 sm:px-6 lg:px-8">
                            {construct ? (
                                <WorkflowSection
                                    item={
                                        construct
                                    }
                                    number="03"
                                    descriptor="Survival construction"
                                    title={
                                        <>
                                            Transfer
                                            designs.
                                            <br />
                                            Build them
                                            precisely.
                                        </>
                                    }
                                    icon={
                                        <Blocks
                                            aria-hidden="true"
                                            size={58}
                                        />
                                    }
                                    onDetails={
                                        setSelectedProject
                                    }
                                />
                            ) : null}

                            {nudge ? (
                                <WorkflowSection
                                    item={nudge}
                                    number="04"
                                    descriptor="Creative editing"
                                    title={
                                        <>
                                            Select.
                                            Move.
                                            <br />
                                            Transform.
                                        </>
                                    }
                                    icon={
                                        <Waypoints
                                            aria-hidden="true"
                                            size={58}
                                        />
                                    }
                                    reverse
                                    onDetails={
                                        setSelectedProject
                                    }
                                />
                            ) : null}
                        </div>
                    </section>
                ) : null}

                {boreal ? (
                    <section
                        id="server"
                        className="relative scroll-mt-24 overflow-hidden bg-ink-950 py-20 text-white sm:py-28"
                    >
                        <div
                            aria-hidden="true"
                            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/70 to-transparent"
                        />

                        <div
                            aria-hidden="true"
                            className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brand-100/45 to-transparent opacity-20"
                        />
                        <div className="relative mx-auto max-w-[94rem] px-4 sm:px-6 lg:px-8">
                            <div className="absolute -right-56 -top-72 h-[42rem] w-[42rem] rounded-full bg-brand-700/20 blur-[110px]" />

                            <div className="relative grid gap-12 lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
                                <Reveal>
                                    <div>
                                        <SectionIndex
                                            number="05"
                                            label="Native server layer"
                                            inverse
                                        />

                                        <h2 className="mt-8 text-[clamp(4rem,9vw,8rem)] font-black leading-[0.82] tracking-[-0.085em] text-white">
                                            Boreal
                                        </h2>

                                        <p className="mt-7 max-w-xl text-lg font-medium leading-8 text-slate-300">
                                            {
                                                boreal.fullDescription
                                            }
                                        </p>

                                        <div className="mt-8">
                                            <Actions
                                                item={
                                                    boreal
                                                }
                                                onDetails={
                                                    setSelectedProject
                                                }
                                                inverse
                                            />
                                        </div>
                                    </div>
                                </Reveal>

                                <Reveal delay={0.12}>
                                    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_36px_110px_rgba(0,0,0,0.35)] backdrop-blur sm:p-7">
                                        <div
                                            aria-hidden="true"
                                            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-brand-300/80 via-brand-500/40 to-transparent"
                                        />

                                        <div
                                            aria-hidden="true"
                                            className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-brand-600/15 blur-3xl"
                                        />
                                        <div className="relative flex items-center justify-between border-b border-white/10 pb-5">
                                            <div className="flex items-center gap-3">
                                                <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-brand-200">
                                                    <ServerCog
                                                        aria-hidden="true"
                                                        size={
                                                            20
                                                        }
                                                    />
                                                </span>

                                                <div>
                                                    <p className="text-xs font-black text-white">
                                                        Server
                                                        capabilities
                                                    </p>

                                                    <p className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">
                                                        Native
                                                        access
                                                        beyond
                                                        Script
                                                        API
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="h-2 w-2 rounded-full bg-brand-300" />
                                        </div>

                                        <div className="relative mt-5">
                                            <CapabilityRows
                                                item={
                                                    boreal
                                                }
                                                limit={6}
                                                inverse
                                            />
                                        </div>
                                    </div>
                                </Reveal>
                            </div>
                        </div>
                    </section>
                ) : null}

                <DeveloperEcosystem />

                <FeatureExplorer />
                <TechnicalHub />

                <ClosingSequence />
                </div>
            ) : null}
            </main>

            <ImageGalleryModal
                addon={selectedProject}
                onClose={() =>
                    setSelectedProject(null)
                }
            />
        </>
    );
}
