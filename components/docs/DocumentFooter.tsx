import {
    ArrowLeft,
    ArrowRight,
    Clock3,
    ExternalLink,
    FileText,
    GitBranch,
    Network,
    ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import {
    linkedNavigationDocument,
    navigationDocument,
} from "@/lib/docs-navigation";

function shortRevision(
    revision: string,
): string {
    return revision
        ? revision.slice(
            0,
            12,
        )
        : "unavailable";
}

export function DocumentFooter({
    documentId,
}: {
    documentId: string;
}) {
    const document =
        navigationDocument(
            documentId,
        );

    if (!document) {
        return null;
    }

    const previous =
        linkedNavigationDocument(
            document.previousId,
        );

    const next =
        linkedNavigationDocument(
            document.nextId,
        );

    const related =
        document.relatedIds
            .map(
                linkedNavigationDocument,
            )
            .filter(
                (
                    item,
                ): item is NonNullable<
                    typeof item
                > =>
                    Boolean(item),
            );

    return (
        <footer
            data-doc-footer
            className="mt-20 border-t border-slate-200 pt-10"
        >
            <section
                data-doc-provenance
                className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5 sm:p-6"
            >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.14em] text-violet-700">
                            <ShieldCheck
                                aria-hidden="true"
                                size={14}
                            />

                            Source provenance
                        </div>

                        <p className="mt-4 max-w-3xl break-words font-mono text-xs font-bold leading-6 text-slate-600 [overflow-wrap:anywhere]">
                            {
                                document.sourcePath
                            }
                        </p>
                    </div>

                    {document.sourceUrl ? (
                        <a
                            href={
                                document.sourceUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-[8px] font-black uppercase tracking-[0.11em] text-white transition hover:bg-violet-700"
                        >
                            View source

                            <ExternalLink
                                aria-hidden="true"
                                size={13}
                            />
                        </a>
                    ) : null}
                </div>

                <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <dt className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.11em] text-slate-400">
                            <Clock3
                                aria-hidden="true"
                                size={13}
                            />

                            Reading time
                        </dt>

                        <dd className="mt-2 text-sm font-black text-slate-900">
                            {
                                document.readingMinutes
                            }{" "}
                            min ·{" "}
                            {
                                document.wordCount
                                    .toLocaleString(
                                        "en-US",
                                    )
                            }{" "}
                            words
                        </dd>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <dt className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.11em] text-slate-400">
                            <FileText
                                aria-hidden="true"
                                size={13}
                            />

                            Source type
                        </dt>

                        <dd className="mt-2 text-sm font-black capitalize text-slate-900">
                            {
                                document.sourceType
                            }
                        </dd>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <dt className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.11em] text-slate-400">
                            <GitBranch
                                aria-hidden="true"
                                size={13}
                            />

                            Revision
                        </dt>

                        <dd className="mt-2 font-mono text-xs font-black text-slate-900">
                            {
                                shortRevision(
                                    document.sourceRevision,
                                )
                            }
                        </dd>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <dt className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.11em] text-slate-400">
                            <Network
                                aria-hidden="true"
                                size={13}
                            />

                            Sections
                        </dt>

                        <dd className="mt-2 text-sm font-black text-slate-900">
                            {
                                document.sectionCount
                            }{" "}
                            indexed
                        </dd>
                    </div>
                </dl>
            </section>

            {previous || next ? (
                <nav
                    data-doc-pager
                    aria-label="Documentation pagination"
                    className="mt-6 grid gap-3 md:grid-cols-2"
                >
                    {previous ? (
                        <Link
                            href={
                                previous.route
                            }
                            prefetch={false}
                            data-doc-previous
                            className="group rounded-[1.4rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_20px_55px_rgba(15,23,42,0.08)]"
                        >
                            <span className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">
                                <ArrowLeft
                                    aria-hidden="true"
                                    size={13}
                                />

                                Previous
                            </span>

                            <span className="mt-3 block text-lg font-black tracking-[-0.025em] text-slate-950 group-hover:text-violet-700">
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
                            data-doc-next
                            className="group rounded-[1.4rem] border border-slate-200 bg-white p-5 text-right transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_20px_55px_rgba(15,23,42,0.08)]"
                        >
                            <span className="flex items-center justify-end gap-2 text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">
                                Next

                                <ArrowRight
                                    aria-hidden="true"
                                    size={13}
                                />
                            </span>

                            <span className="mt-3 block text-lg font-black tracking-[-0.025em] text-slate-950 group-hover:text-violet-700">
                                {
                                    next.title
                                }
                            </span>
                        </Link>
                    ) : null}
                </nav>
            ) : null}

            {related.length > 0 ? (
                <section
                    data-related-docs
                    className="mt-10"
                >
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-violet-700">
                                Continue exploring
                            </p>

                            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
                                Related documentation
                            </h2>
                        </div>

                        <Link
                            href="/status"
                            prefetch={false}
                            className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-violet-700"
                        >
                            System status
                        </Link>
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-3">
                        {related.map(
                            (
                                item,
                            ) => (
                                <Link
                                    key={
                                        item.id
                                    }
                                    href={
                                        item.route
                                    }
                                    prefetch={false}
                                    className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 transition hover:border-violet-300 hover:bg-violet-50"
                                >
                                    <span className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-400">
                                        {
                                            item.projectTitle
                                        }
                                    </span>

                                    <span className="mt-2 block text-sm font-black leading-6 text-slate-950">
                                        {
                                            item.title
                                        }
                                    </span>
                                </Link>
                            ),
                        )}
                    </div>
                </section>
            ) : null}
        </footer>
    );
}
