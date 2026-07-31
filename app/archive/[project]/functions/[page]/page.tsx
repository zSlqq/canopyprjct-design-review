import type {
    Metadata,
} from "next";

import Link from "next/link";

import {
    notFound,
} from "next/navigation";

import {
    getArchiveManifest,
    getArchiveProject,
} from "@/lib/archive";

const pageSize =
    100;

type PageProps = {
    params:
        Promise<{
            project: string;
            page: string;
        }>;
};

export async function generateStaticParams() {
    const archive =
        await getArchiveManifest();

    const params = [];

    for (
        const summary
        of archive.projects
    ) {
        const project =
            await getArchiveProject(
                summary.slug,
            );

        if (!project) {
            continue;
        }

        const pages =
            Math.max(
                1,
                Math.ceil(
                    project.functions.length
                    / pageSize,
                ),
            );

        for (
            let page = 1;
            page <= pages;
            page += 1
        ) {
            params.push({
                project:
                    summary.slug,
                page:
                    String(page),
            });
        }
    }

    return params;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const {
        project:
            slug,
        page,
    } = await params;

    const project =
        await getArchiveProject(
            slug,
        );

    return project
        ? {
            title:
                `${project.name} Functions — Page ${page}`,
            description:
                `Complete paginated source-function index for ${project.name}.`,
        }
        : {};
}

export default async function ArchiveFunctionsPage({
    params,
}: PageProps) {
    const {
        project:
            slug,
        page:
            pageValue,
    } = await params;

    const project =
        await getArchiveProject(
            slug,
        );

    const page =
        Number.parseInt(
            pageValue,
            10,
        );

    if (
        !project
        || !Number.isFinite(page)
        || page < 1
    ) {
        notFound();
    }

    const pageCount =
        Math.max(
            1,
            Math.ceil(
                project.functions.length
                / pageSize,
            ),
        );

    if (
        page
        > pageCount
    ) {
        notFound();
    }

    const start =
        (
            page
            - 1
        )
        * pageSize;

    const functions =
        project.functions.slice(
            start,
            start
            + pageSize,
        );

    return (
        <main
            id="main-content"
            data-archive-function-index
            className="min-h-screen bg-[#f7f8fc] px-5 pb-20 pt-28 text-slate-950 sm:px-8 lg:px-12"
        >
            <div className="mx-auto max-w-7xl">
                <Link
                    href={`/archive/${project.slug}#functions`}
                    prefetch={false}
                    className="inline-flex min-h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-xs font-black uppercase tracking-[0.13em] text-slate-700"
                >
                    ← {project.name} archive
                </Link>

                <p className="mt-10 text-xs font-black uppercase tracking-[0.2em] text-violet-700">
                    Complete source index
                </p>

                <h1 className="mt-4 text-balance text-5xl font-black leading-[0.9] tracking-[-0.06em] sm:text-7xl">
                    {project.name}
                    {" functions."}
                </h1>

                <p className="mt-6 max-w-3xl text-pretty text-base font-semibold leading-8 text-slate-600">
                    Page {page} of {pageCount}.
                    {" "}
                    Showing {functions.length} of
                    {" "}
                    {project.functions.length}
                    {" indexed functions and methods."}
                </p>

                <nav
                    aria-label="Function-index pages"
                    className="mt-8 flex flex-wrap gap-2"
                >
                    {Array.from(
                        {
                            length:
                                pageCount,
                        },
                        (
                            _,
                            index,
                        ) =>
                            index
                            + 1,
                    ).map(
                        (
                            item,
                        ) => (
                            <Link
                                key={item}
                                href={`/archive/${project.slug}/functions/${item}`}
                                prefetch={false}
                                aria-current={
                                    item
                                    === page
                                        ? "page"
                                        : undefined
                                }
                                className={
                                    item
                                    === page
                                        ? "inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-violet-700 px-3 text-xs font-black text-white"
                                        : "inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-300 bg-white px-3 text-xs font-black text-slate-700"
                                }
                            >
                                {item}
                            </Link>
                        ),
                    )}
                </nav>

                <div className="mt-10 grid gap-3 lg:grid-cols-2">
                    {functions.map(
                        (
                            item,
                            index,
                        ) => (
                            <article
                                key={`${item.file}-${item.line}-${item.name}-${index}`}
                                className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_44px_rgba(15,23,42,0.045)]"
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="break-words text-base font-black tracking-[-0.025em]">
                                        {item.name}
                                    </h2>

                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[0.6rem] font-black uppercase tracking-[0.1em] text-slate-500">
                                        {item.kind}
                                    </span>

                                    {item.exported ? (
                                        <span className="rounded-full bg-violet-100 px-2 py-1 text-[0.6rem] font-black uppercase tracking-[0.1em] text-violet-700">
                                            Exported
                                        </span>
                                    ) : null}
                                </div>

                                {item.signature ? (
                                    <code className="mt-3 block max-w-full overflow-x-auto rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold leading-5 text-slate-100">
                                        {item.name}
                                        {item.signature}
                                    </code>
                                ) : null}

                                <p className="mt-3 break-all text-xs font-semibold leading-5 text-slate-500">
                                    {item.file}
                                    {":"}
                                    {item.line}
                                </p>
                            </article>
                        ),
                    )}
                </div>
            </div>
        </main>
    );
}
