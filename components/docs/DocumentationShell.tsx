import {
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    BookOpen,
    Braces,
    Clock3,
    FileCode2,
    GitBranch,
    Layers3,
    Menu,
    Search,
} from "lucide-react";
import Link from "next/link";

import {
    documentNeighbors,
    projectDocuments,
    type DocumentationDocument,
} from "@/lib/docs";

import {
    ActiveTableOfContents,
} from "./ActiveTableOfContents";
import {
    DocumentFooter,
} from "./DocumentFooter";
import {
    ReaderTools,
} from "./ReaderTools";
import {
    MarkdownDocument,
} from "./MarkdownDocument";

export function DocumentationShell({
    document,
}: {
    document:
        DocumentationDocument;
}) {
    const navigation =
        projectDocuments(
            document.projectId,
        );

    const {
        previous,
        next,
    } = documentNeighbors(
        document,
    );

    const sections =
        document.sections
            .filter(
                (section) =>
                    section.anchor
                    !== "overview",
            )
            .slice(0, 100);

    return (
        <main
            data-doc-reader
            data-document-id={
                document.id
            }
            className="min-h-screen overflow-x-clip bg-[#f6f7fb] text-slate-950"
        >
            <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl">
                <div className="mx-auto flex min-h-[4.75rem] max-w-[110rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link
                            href="/"
                            prefetch={false}
                            aria-label="ForestOfLight home"
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-white"
                        >
                            <Braces
                                aria-hidden="true"
                                size={17}
                            />
                        </Link>

                        <div className="min-w-0">
                            <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-violet-600">
                                Unified documentation
                            </p>

                            <p className="truncate text-sm font-black">
                                {
                                    document.projectTitle
                                }
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/docs"
                            prefetch={false}
                            className="hidden min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-[9px] font-black uppercase tracking-[0.1em] text-slate-700 sm:inline-flex"
                        >
                            <BookOpen
                                aria-hidden="true"
                                size={14}
                            />

                            All docs
                        </Link>

                        <Link
                            href={`/search?project=${encodeURIComponent(document.projectId)}`}
                            prefetch={false}
                            data-doc-search-link
                            aria-label={`Search ${document.projectTitle} documentation`}
                            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[9px] font-black uppercase tracking-[0.1em] text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
                        >
                            <Search
                                aria-hidden="true"
                                size={14}
                            />

                            <span className="hidden sm:inline">
                                Search
                            </span>
                        </Link>

                        <a
                            href={
                                document.sourceUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            data-document-source
                            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-950 px-4 text-[9px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-violet-700"
                        >
                            <GitBranch
                                aria-hidden="true"
                                size={14}
                            />

                            Source

                            <ArrowUpRight
                                aria-hidden="true"
                                size={13}
                            />
                        </a>
                    </div>
                </div>
            </header>

            <div className="mx-auto grid max-w-[110rem] lg:grid-cols-[18rem_minmax(0,1fr)] 2xl:grid-cols-[19rem_minmax(0,1fr)_17rem]">
                <aside className="hidden border-r border-slate-200 bg-white lg:block">
                    <div className="sticky top-[4.75rem] max-h-[calc(100vh-4.75rem)] overflow-y-auto px-5 py-7">
                        <Link
                            href="/docs"
                            prefetch={false}
                            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 px-3 text-[8px] font-black uppercase tracking-[0.11em] text-slate-500"
                        >
                            <ArrowLeft
                                aria-hidden="true"
                                size={12}
                            />

                            Documentation
                        </Link>

                        <p className="mt-8 text-[8px] font-black uppercase tracking-[0.16em] text-violet-600">
                            {
                                document.projectTitle
                            }
                        </p>

                        <p className="mt-2 text-2xl font-black tracking-[-0.04em]">
                            Knowledge base
                        </p>

                        <nav className="mt-7 space-y-1">
                            {navigation.map(
                                (entry) => {
                                    const active =
                                        entry.id
                                        ===
                                        document.id;

                                    return (
                                        <Link
                                            key={
                                                entry.id
                                            }
                                            href={
                                                entry.route
                                            }
                                            prefetch={
                                                false
                                            }
                                            aria-current={
                                                active
                                                    ? "page"
                                                    : undefined
                                            }
                                            className={`block rounded-xl border px-3 py-3 transition ${
                                                active
                                                    ? "border-violet-200 bg-violet-50 text-violet-950"
                                                    : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950"
                                            }`}
                                        >
                                            <span className="block break-words text-sm font-extrabold leading-5">
                                                {
                                                    entry.title
                                                }
                                            </span>

                                            <span className="mt-1 block text-[8px] font-black uppercase tracking-[0.11em] opacity-55">
                                                {
                                                    entry.sourceType
                                                }
                                            </span>
                                        </Link>
                                    );
                                },
                            )}
                        </nav>
                    </div>
                </aside>

                <article className="min-w-0 px-5 py-10 sm:px-8 sm:py-14 xl:px-14 2xl:px-16">
                    <div className="mx-auto min-w-0 max-w-[54rem]">
                        <details className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 lg:hidden">
                            <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 font-black">
                                <Menu
                                    aria-hidden="true"
                                    size={16}
                                />

                                {
                                    document.projectTitle
                                }{" "}
                                pages
                            </summary>

                            <nav className="mt-4 grid gap-2">
                                {navigation.map(
                                    (entry) => (
                                        <Link
                                            key={
                                                entry.id
                                            }
                                            href={
                                                entry.route
                                            }
                                            prefetch={
                                                false
                                            }
                                            className={`rounded-xl border px-4 py-3 text-sm font-extrabold ${
                                                entry.id
                                                ===
                                                document.id
                                                    ? "border-violet-200 bg-violet-50 text-violet-950"
                                                    : "border-slate-200 text-slate-600"
                                            }`}
                                        >
                                            {
                                                entry.title
                                            }
                                        </Link>
                                    ),
                                )}
                            </nav>
                        </details>

                        <div className="flex flex-wrap items-center gap-2 text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                                <Layers3
                                    aria-hidden="true"
                                    size={12}
                                />

                                {
                                    document.projectTitle
                                }
                            </span>

                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                                <FileCode2
                                    aria-hidden="true"
                                    size={12}
                                />

                                {
                                    document.sourceType
                                }
                            </span>

                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                                <Clock3
                                    aria-hidden="true"
                                    size={12}
                                />

                                {
                                    document.wordCount
                                        .toLocaleString(
                                            "en-US",
                                        )
                                }{" "}
                                words
                            </span>
                        </div>

                        <header className="mt-8 border-b border-slate-200 pb-10">
                            <h1 className="break-words text-[clamp(3rem,8vw,6.75rem)] font-black leading-[0.87] tracking-[-0.075em]">
                                {
                                    document.title
                                }
                            </h1>

                            <p className="mt-7 max-w-3xl text-lg font-medium leading-8 text-slate-600">
                                Clean, unified
                                documentation sourced
                                from{" "}
                                <strong className="font-black text-slate-950">
                                    {
                                        document.repository
                                    }
                                </strong>
                                , with its original
                                file and revision
                                preserved.
                            </p>

                            <div className="mt-7 flex flex-wrap gap-3 font-mono text-[9px] text-slate-500">
                                <span className="max-w-full break-all rounded-lg border border-slate-200 bg-white px-3 py-2">
                                    {
                                        document.sourcePath
                                    }
                                </span>

                                <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                    rev{" "}
                                    {
                                        document.sourceRevision
                                            .slice(
                                                0,
                                                10,
                                            )
                                    }
                                </span>
                            </div>
                        </header>

                        <div className="min-w-0 pb-16 pt-2">
                            <ReaderTools
                                title={
                                    document.title
                                }
                                route={
                                    document.route
                                }
                            />

                            <MarkdownDocument
                                document={
                                    document
                                }
                            />

                            <DocumentFooter
                                documentId={
                                    document.id
                                }
                            />
                        </div>

                        <nav className="grid gap-3 border-t border-slate-200 pt-8 sm:grid-cols-2">
                            {previous ? (
                                <Link
                                    href={
                                        previous.route
                                    }
                                    prefetch={false}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-violet-300"
                                >
                                    <span className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">
                                        <ArrowLeft
                                            aria-hidden="true"
                                            size={12}
                                        />

                                        Previous
                                    </span>

                                    <span className="mt-3 block break-words text-lg font-black">
                                        {
                                            previous.title
                                        }
                                    </span>
                                </Link>
                            ) : (
                                <span />
                            )}

                            {next ? (
                                <Link
                                    href={
                                        next.route
                                    }
                                    prefetch={false}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 text-right transition hover:border-violet-300"
                                >
                                    <span className="flex items-center justify-end gap-2 text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">
                                        Next

                                        <ArrowRight
                                            aria-hidden="true"
                                            size={12}
                                        />
                                    </span>

                                    <span className="mt-3 block break-words text-lg font-black">
                                        {
                                            next.title
                                        }
                                    </span>
                                </Link>
                            ) : null}
                        </nav>
                    </div>
                </article>

                <aside className="hidden border-l border-slate-200 bg-white 2xl:block">
                    <div className="sticky top-[4.75rem] max-h-[calc(100vh-4.75rem)] overflow-y-auto px-5 py-8">
                        <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                            On this page
                        </p>

                        <ActiveTableOfContents
                            sections={
                                sections
                            }
                        />
                    </div>
                </aside>
            </div>
        </main>
    );
}
