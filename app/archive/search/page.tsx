import type {
    Metadata,
} from "next";

import Link from "next/link";

import {
    ArchiveSearch,
} from "@/components/archive/ArchiveSearch";

export const metadata:
    Metadata = {
        title:
            "Search the ForestOfLight Archive",
        description:
            "Search every captured release, download, contributor, function, command, global rule, document, and repository.",
    };

export default function ArchiveSearchPage() {
    return (
        <main
            id="main-content"
            className="min-h-screen bg-[radial-gradient(circle_at_8%_4%,rgba(124,58,237,0.15),transparent_31rem),radial-gradient(circle_at_92%_10%,rgba(16,185,129,0.11),transparent_28rem),linear-gradient(180deg,#ffffff,#f7f8fc_48rem)] px-5 pb-24 pt-28 text-slate-950 sm:px-8 lg:px-12"
        >
            <div className="mx-auto max-w-7xl">
                <Link
                    href="/archive"
                    prefetch={false}
                    className="inline-flex min-h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-xs font-black uppercase tracking-[0.13em] text-slate-700"
                >
                    ← ForestOfLight archive
                </Link>

                <p className="mt-10 text-xs font-black uppercase tracking-[0.2em] text-violet-700">
                    Instant discovery
                </p>

                <h1 className="mt-4 max-w-6xl text-balance text-5xl font-black leading-[0.88] tracking-[-0.07em] sm:text-7xl lg:text-[7.2rem]">
                    Search the entire
                    {" "}
                    ForestOfLight archive.
                </h1>

                <p className="mt-7 max-w-3xl text-pretty text-base font-semibold leading-8 text-slate-600 sm:text-lg">
                    Releases, direct downloads,
                    commands, global rules,
                    contributors, functions, and
                    repository documents. The index
                    remains unloaded until you search.
                </p>
            </div>

            <div className="mt-12">
                <ArchiveSearch />
            </div>
        </main>
    );
}
