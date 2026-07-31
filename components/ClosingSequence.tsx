import {
    ArrowUp,
    ArrowUpRight,
    Braces,
    GitBranch,
    Layers3,
} from "lucide-react";

export function ClosingSequence() {
    return (
        <section
            id="closing-sequence"
            aria-labelledby="closing-title"
            className="relative isolate overflow-hidden bg-[#090e1a] text-white"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_10%,rgba(124,58,237,0.28),transparent_32rem),radial-gradient(circle_at_8%_88%,rgba(76,29,149,0.2),transparent_28rem)]"
            />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 opacity-[0.11] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]"
            />

            <div className="mx-auto max-w-[94rem] px-4 pb-14 pt-20 sm:px-6 sm:pb-16 sm:pt-28 lg:px-8">
                <div className="grid gap-12 border-b border-white/10 pb-16 lg:grid-cols-[1.18fr_0.82fr] lg:items-end">
                    <div>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-brand-200">
                            <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.05]">
                                <Braces
                                    aria-hidden="true"
                                    size={16}
                                />
                            </span>

                            <span>
                                ForestOfLight
                            </span>
                        </div>

                        <h2
                            id="closing-title"
                            className="mt-8 max-w-6xl text-[clamp(3.6rem,8.2vw,8rem)] font-black leading-[0.83] tracking-[-0.082em] text-white"
                        >
                            Open tools for Minecraft Bedrock
                        </h2>
                    </div>

                    <div className="max-w-xl lg:ml-auto">
                        <p className="text-lg font-medium leading-8 text-slate-300">
                            A connected body of open
                            technical work for observing,
                            automating, constructing,
                            editing, extending, and
                            controlling Minecraft
                            Bedrock.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:justify-end">
                            <a
                                href="https://github.com/ForestOfLight"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[10px] font-black uppercase tracking-[0.12em] text-ink-950 transition hover:bg-brand-100"
                            >
                                <GitBranch
                                    aria-hidden="true"
                                    size={15}
                                />
                                View GitHub
                                <ArrowUpRight
                                    aria-hidden="true"
                                    size={14}
                                />
                            </a>

                            <a
                                href="#top"
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 text-[10px] font-black uppercase tracking-[0.12em] text-white transition hover:border-brand-300/50 hover:bg-brand-400/10"
                            >
                                Back to top
                                <ArrowUp
                                    aria-hidden="true"
                                    size={14}
                                />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 py-8 sm:grid-cols-3">
                    {[
                        {
                            icon: (
                                <Layers3
                                    aria-hidden="true"
                                    size={17}
                                />
                            ),
                            title:
                                "Connected systems",
                            detail:
                                "Projects share a coherent technical direction.",
                        },
                        {
                            icon: (
                                <GitBranch
                                    aria-hidden="true"
                                    size={17}
                                />
                            ),
                            title:
                                "Open development",
                            detail:
                                "Source, releases, and contribution paths remain visible.",
                        },
                        {
                            icon: (
                                <Braces
                                    aria-hidden="true"
                                    size={17}
                                />
                            ),
                            title:
                                "Bedrock focused",
                            detail:
                                "Every tool responds to a specific technical gap.",
                        },
                    ].map(
                        ({
                            icon,
                            title,
                            detail,
                        }) => (
                            <div
                                key={title}
                                className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5"
                            >
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-300/15 bg-brand-400/10 text-brand-200">
                                    {icon}
                                </span>

                                <div>
                                    <p className="text-xs font-black text-white">
                                        {title}
                                    </p>

                                    <p className="mt-2 text-[11px] font-medium leading-5 text-slate-400">
                                        {detail}
                                    </p>
                                </div>
                            </div>
                        ),
                    )}
                </div>

                <footer className="flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-ink-950">
                            <Braces
                                aria-hidden="true"
                                size={18}
                            />
                        </span>

                        <div>
                            <p className="text-sm font-black text-white">
                                ForestOfLight
                            </p>

                            <p className="mt-1 text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">
                                Technical Bedrock
                                ecosystem
                            </p>
                        </div>
                    </div>

                    <p className="max-w-3xl text-xs font-medium leading-6 text-slate-500 sm:text-right">
                        Independent showcase
                        concept. Project names,
                        source code, artwork, and
                        original addon work belong
                        to ForestOfLight and the
                        respective contributors.
                    </p>
                </footer>
            </div>
        </section>
    );
}
