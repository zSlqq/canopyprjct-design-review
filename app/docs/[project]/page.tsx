import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    FileText,
    Search,
    ShieldCheck,
} from "lucide-react";
import type {
    Metadata,
} from "next";
import Link from "next/link";
import {
    notFound,
} from "next/navigation";

import {
    ActiveTableOfContents,
} from "@/components/docs/ActiveTableOfContents";
import {
    DocumentFooter,
} from "@/components/docs/DocumentFooter";
import {
    MarkdownDocument,
} from "@/components/docs/MarkdownDocument";
import {
    ReaderTools,
} from "@/components/docs/ReaderTools";
import corpusJson from "@/lib/data/generated/docs/corpus.json";
import {
    documentationNavigation,
    navigationProject,
} from "@/lib/docs-navigation";
import type {
    DocumentationDocument,
} from "@/lib/docs";

type ProjectPageProperties = {
    params:
        Promise<{
            project: string;
        }>;
};

type DocumentationCorpus = {
    documents:
        DocumentationDocument[];
};

const corpus =
    corpusJson as unknown as DocumentationCorpus;

export const dynamicParams =
    false;

export const revalidate =
    false;

export function generateStaticParams() {
    return documentationNavigation.projects.map(
        (project) => ({
            project:
                project.id,
        }),
    );
}

export async function generateMetadata({
    params,
}: ProjectPageProperties):
    Promise<Metadata> {
    const {
        project: projectId,
    } = await params;

    const project =
        navigationProject(
            projectId,
        );

    if (!project) {
        return {
            title:
                "Documentation | ForestOfLight",
        };
    }

    return {
        title:
            `${project.title} Documentation | ForestOfLight`,
        description:
            `Browse ${project.documentCount} synchronized technical documents and ${project.sectionCount} indexed sections for ${project.title}.`,
    };
}

export default async function DocumentationProjectPage({
    params,
}: ProjectPageProperties) {
    const {
        project: projectId,
    } = await params;

    const project =
        navigationProject(
            projectId,
        );

    if (!project) {
        notFound();
    }

    const exactDocument =
        corpus.documents.find(
            (document) =>
                document.route
                === `/docs/${projectId}`,
        );

    const tocSections =
        exactDocument
            ?.sections
            .filter(
                (section) =>
                    section.anchor
                    !== "overview",
            )
        ?? [];

    return (
        <main
            data-doc-project-page
            data-doc-reader={
                exactDocument
                    ? "true"
                    : undefined
            }
            className="min-h-screen overflow-x-clip bg-slate-50 text-slate-950"
        >
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex min-h-[4.75rem] max-w-[100rem] items-center justify-between gap-3 px-5 sm:px-8">
                    <Link
                        href="/docs"
                        prefetch={false}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[8px] font-black uppercase tracking-[0.11em] text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
                    >
                        <ArrowLeft
                            aria-hidden="true"
                            size={14}
                        />

                        All docs
                    </Link>

                    <Link
                        href={`/search?project=${encodeURIComponent(project.id)}`}
                        prefetch={false}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-950 px-4 text-[8px] font-black uppercase tracking-[0.11em] text-white transition hover:bg-violet-700"
                    >
                        <Search
                            aria-hidden="true"
                            size={14}
                        />

                        Search project
                    </Link>
                </div>
            </header>

            <section className="relative isolate overflow-hidden border-b border-slate-200 bg-white">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 opacity-[0.055] [background-image:linear-gradient(rgba(15,23,42,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.22)_1px,transparent_1px)] [background-size:52px_52px]"
                />

                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-28 top-0 -z-10 h-[30rem] w-[30rem] rounded-full bg-violet-300/35 blur-[130px]"
                />

                <div className="mx-auto max-w-[100rem] px-5 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20">
                    <div className="inline-flex items-center gap-3 rounded-full border border-violet-200 bg-violet-50 px-4 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-violet-700">
                        <ShieldCheck
                            aria-hidden="true"
                            size={14}
                        />

                        Synchronized documentation
                    </div>

                    <h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.7rem)] font-black leading-[0.86] tracking-[-0.075em]">
                        {
                            project.title
                        }
                    </h1>

                    <div className="mt-7 flex flex-wrap gap-2 text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-2">
                            {
                                project.documentCount
                            }{" "}
                            documents
                        </span>

                        <span className="rounded-full border border-slate-200 bg-white px-3 py-2">
                            {
                                project.sectionCount
                            }{" "}
                            sections
                        </span>

                        <span className="rounded-full border border-slate-200 bg-white px-3 py-2">
                            {
                                project.wordCount
                                    .toLocaleString(
                                        "en-US",
                                    )
                            }{" "}
                            words
                        </span>
                    </div>
                </div>
            </section>

            <div className={`mx-auto max-w-[100rem] ${
                exactDocument
                    ? "2xl:grid 2xl:grid-cols-[minmax(0,1fr)_18rem]"
                    : ""
            }`}>
                <div className="min-w-0 px-5 py-10 sm:px-8 sm:py-14">
                    {exactDocument ? (
                        <article className="mx-auto max-w-[58rem]">
                            <ReaderTools
                                title={
                                    exactDocument.title
                                }
                                route={
                                    exactDocument.route
                                }
                            />

                            <MarkdownDocument
                                document={
                                    exactDocument
                                }
                            />

                            <DocumentFooter
                                documentId={
                                    exactDocument.id
                                }
                            />
                        </article>
                    ) : (
                        <section
                            data-project-document-list
                            className="mx-auto max-w-[92rem]"
                        >
                            <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-violet-700">
                                        Project library
                                    </p>

                                    <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-5xl">
                                        Choose a document.
                                    </h2>
                                </div>

                                <p className="max-w-xl text-sm font-medium leading-7 text-slate-500">
                                    Each page is generated
                                    from a synchronized
                                    repository or wiki
                                    source and retains its
                                    source path and revision.
                                </p>
                            </div>

                            <div className="mt-7 grid gap-3 lg:grid-cols-2">
                                {project.documents.map(
                                    (
                                        document,
                                        index,
                                    ) => (
                                        <Link
                                            key={
                                                document.id
                                            }
                                            href={
                                                document.route
                                            }
                                            prefetch={false}
                                            className="group grid gap-5 rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_22px_65px_rgba(15,23,42,0.08)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                                        >
                                            <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 font-mono text-xs font-black text-slate-500 transition group-hover:bg-violet-100 group-hover:text-violet-700">
                                                {
                                                    String(
                                                        index + 1,
                                                    ).padStart(
                                                        2,
                                                        "0",
                                                    )
                                                }
                                            </span>

                                            <span className="min-w-0">
                                                <span className="flex flex-wrap items-center gap-2 text-[8px] font-black uppercase tracking-[0.11em] text-slate-400">
                                                    <FileText
                                                        aria-hidden="true"
                                                        size={12}
                                                    />

                                                    {
                                                        document.sourceType
                                                    }

                                                    <span aria-hidden="true">
                                                        ·
                                                    </span>

                                                    {
                                                        document.readingMinutes
                                                    }{" "}
                                                    min
                                                </span>

                                                <span className="mt-2 block break-words text-lg font-black tracking-[-0.025em] text-slate-950 group-hover:text-violet-700">
                                                    {
                                                        document.title
                                                    }
                                                </span>

                                                <span className="mt-2 block break-words font-mono text-[9px] leading-5 text-slate-400 [overflow-wrap:anywhere]">
                                                    {
                                                        document.sourcePath
                                                    }
                                                </span>
                                            </span>

                                            <span className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition group-hover:border-violet-300 group-hover:bg-violet-50 group-hover:text-violet-700">
                                                <ArrowRight
                                                    aria-hidden="true"
                                                    size={15}
                                                />
                                            </span>
                                        </Link>
                                    ),
                                )}
                            </div>

                            <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-6 text-white">
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.13em] text-violet-200">
                                            <BookOpen
                                                aria-hidden="true"
                                                size={14}
                                            />

                                            Full ecosystem
                                        </div>

                                        <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-400">
                                            Search this
                                            project directly
                                            or return to the
                                            complete
                                            documentation
                                            directory.
                                        </p>
                                    </div>

                                    <Link
                                        href="/docs"
                                        prefetch={false}
                                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-[8px] font-black uppercase tracking-[0.11em] text-slate-950 transition hover:bg-violet-200"
                                    >
                                        Browse all projects
                                    </Link>
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                {exactDocument ? (
                    <aside className="hidden border-l border-slate-200 bg-white 2xl:block">
                        <div className="sticky top-0 max-h-screen overflow-y-auto px-5 py-8">
                            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                                On this page
                            </p>

                            <ActiveTableOfContents
                                sections={
                                    tocSections
                                }
                            />
                        </div>
                    </aside>
                ) : null}
            </div>
        </main>
    );
}
