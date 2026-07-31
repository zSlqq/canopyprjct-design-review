import {
    ArrowLeft,
    BookOpen,
    Braces,
    Layers3,
} from "lucide-react";
import type {
    Metadata,
} from "next";
import Link from "next/link";

import {
    DocumentationSearch,
} from "@/components/docs/DocumentationSearch";
import manifestJson from "@/lib/data/generated/docs/index-manifest.json";
import type {
    DocumentationSearchManifest,
} from "@/lib/docs-search-types";

export const metadata: Metadata = {
    title:
        "Search Documentation | ForestOfLight",
    description:
        "Search every synchronized ForestOfLight wiki, README, command, rule, extension, installation guide, and technical reference.",
};

export const dynamic =
    "force-static";

export const revalidate =
    false;

const manifest =
    manifestJson as DocumentationSearchManifest;

export default function DocumentationSearchPage() {
    return (
        <main
            data-search-page
            className="min-h-screen overflow-x-clip bg-[#080d18] text-white"
        >
            <header className="border-b border-white/10">
                <div className="mx-auto flex min-h-[4.75rem] max-w-[100rem] items-center justify-between gap-3 px-5 sm:px-8">
                    <Link
                        href="/docs"
                        prefetch={false}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[9px] font-black uppercase tracking-[0.11em] text-white transition hover:border-violet-300/40"
                    >
                        <ArrowLeft
                            aria-hidden="true"
                            size={14}
                        />

                        Documentation
                    </Link>

                    <Link
                        href="/"
                        prefetch={false}
                        aria-label="ForestOfLight home"
                        className="grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-950"
                    >
                        <Braces
                            aria-hidden="true"
                            size={17}
                        />
                    </Link>

                    <Link
                        href="/features"
                        prefetch={false}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[9px] font-black uppercase tracking-[0.11em] text-white transition hover:border-violet-300/40"
                    >
                        <Layers3
                            aria-hidden="true"
                            size={14}
                        />

                        Features
                    </Link>
                </div>
            </header>

            <section className="relative isolate overflow-hidden border-b border-white/10">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:54px_54px]"
                />

                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-28 top-0 -z-10 h-[35rem] w-[35rem] rounded-full bg-violet-600/25 blur-[145px]"
                />

                <div className="mx-auto max-w-[100rem] px-5 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-24">
                    <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-violet-200">
                                <BookOpen
                                    aria-hidden="true"
                                    size={14}
                                />

                                Unified technical index
                            </div>

                            <h1 className="mt-7 max-w-6xl text-[clamp(3.8rem,9vw,8rem)] font-black leading-[0.82] tracking-[-0.085em]">
                                Find anything.
                                <br />
                                Instantly.
                            </h1>
                        </div>

                        <p className="max-w-lg text-base font-medium leading-8 text-slate-400">
                            Search runs locally in a
                            dedicated worker against
                            content-addressed project
                            shards. Cached shards are
                            reused without contacting
                            GitHub.
                        </p>
                    </div>
                </div>
            </section>

            <section className="px-5 py-10 sm:px-8 sm:py-14">
                <DocumentationSearch
                    manifest={
                        manifest
                    }
                />
            </section>
        </main>
    );
}
