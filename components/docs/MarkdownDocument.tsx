import Link from "next/link";
import type {
    HTMLAttributes,
    ReactNode,
} from "react";
import ReactMarkdown, {
    type Components,
} from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import {
    CodeBlock,
} from "@/components/docs/CodeBlock";
import {
    DocumentationMedia,
} from "@/components/docs/DocumentationMedia";
import {
    documentationAnchorPlugin,
} from "@/lib/docs-markdown";
import mediaManifestJson from "@/lib/data/generated/docs/media-manifest.json";
import {
    resolveDocumentationHref,
    type DocumentationDocument,
} from "@/lib/docs";

type MediaAsset = {
    path: string;
    width: number;
    height: number;
    mime: string;
    bytes: number;
    hash: string;
    sourceUrl: string;
    animated: boolean;
};

type DocumentationMediaManifest = {
    schemaVersion: number;
    assets:
        Record<
            string,
            Record<
                string,
                MediaAsset
            >
        >;
};

const mediaManifest =
    mediaManifestJson as unknown as DocumentationMediaManifest;

function textFromChildren(
    children: ReactNode,
): string {
    if (
        typeof children
        === "string"
        || typeof children
        === "number"
    ) {
        return String(children);
    }

    if (
        Array.isArray(children)
    ) {
        return children
            .map(
                textFromChildren,
            )
            .join("");
    }

    if (
        children
        && typeof children
            === "object"
        && "props" in children
    ) {
        const element =
            children as {
                props?: {
                    children?:
                        ReactNode;
                };
            };

        return textFromChildren(
            element.props
                ?.children,
        );
    }

    return "";
}

function assetFor(
    document:
        DocumentationDocument,
    source: string,
): MediaAsset | undefined {
    const mappings =
        mediaManifest.assets[
            document.id
        ];

    if (!mappings) {
        return undefined;
    }

    if (mappings[source]) {
        return mappings[source];
    }

    try {
        return mappings[
            decodeURIComponent(
                source,
            )
        ];
    } catch {
        return undefined;
    }
}

function headingComponent(
    level:
        | 2
        | 3
        | 4
        | 5
        | 6,
) {
    return function DocumentationHeading({
        children,
        id,
    }: HTMLAttributes<HTMLHeadingElement>) {
        const text =
            textFromChildren(
                children,
            );

        const anchor =
            id
                ? (
                    <a
                        href={`#${id}`}
                        aria-label={`Link to ${text || "section"}`}
                        className="shrink-0 text-slate-300 no-underline opacity-100 transition group-hover:opacity-100 hover:text-violet-600 focus:opacity-100"
                    >
                        #
                    </a>
                )
                : null;

        const shared =
            "group flex scroll-mt-28 items-start gap-3 break-words font-black text-slate-950";

        if (level === 2) {
            return (
                <h2
                    id={id}
                    className={`${shared} mt-16 text-3xl tracking-[-0.045em] sm:text-4xl`}
                >
                    <span className="min-w-0">
                        {children}
                    </span>

                    {anchor}
                </h2>
            );
        }

        if (level === 3) {
            return (
                <h3
                    id={id}
                    className={`${shared} mt-12 text-2xl tracking-[-0.035em]`}
                >
                    <span className="min-w-0">
                        {children}
                    </span>

                    {anchor}
                </h3>
            );
        }

        if (level === 4) {
            return (
                <h4
                    id={id}
                    className={`${shared} mt-10 text-xl tracking-[-0.025em]`}
                >
                    <span className="min-w-0">
                        {children}
                    </span>

                    {anchor}
                </h4>
            );
        }

        if (level === 5) {
            return (
                <h5
                    id={id}
                    className={`${shared} mt-10 text-lg`}
                >
                    <span className="min-w-0">
                        {children}
                    </span>

                    {anchor}
                </h5>
            );
        }

        return (
            <h6
                id={id}
                className={`${shared} mt-9`}
            >
                <span className="min-w-0">
                    {children}
                </span>

                {anchor}
            </h6>
        );
    };
}

export function MarkdownDocument({
    document,
}: {
    document:
        DocumentationDocument;
}) {
    const headingAnchors =
        document.sections
            .filter(
                (section) =>
                    section.anchor
                    !== "overview",
            )
            .map(
                (section) =>
                    section.anchor,
            );

    const anchorPlugin =
        documentationAnchorPlugin(
            headingAnchors,
        );

    const linkStyles =
        "break-words font-extrabold text-violet-700 underline decoration-violet-300 decoration-2 underline-offset-4 transition hover:text-violet-950 [overflow-wrap:anywhere]";

    const components: Components = {
        h1:
            headingComponent(2),
        h2:
            headingComponent(2),
        h3:
            headingComponent(3),
        h4:
            headingComponent(4),
        h5:
            headingComponent(5),
        h6:
            headingComponent(6),

        p: ({ children }) => (
            <p className="mt-6 break-words text-[1.02rem] font-medium leading-8 text-slate-700">
                {children}
            </p>
        ),

        strong:
            ({ children }) => (
                <strong className="font-black text-slate-950">
                    {children}
                </strong>
            ),

        a: ({
            href = "",
            children,
        }) => {
            const resolved =
                resolveDocumentationHref(
                    document,
                    href,
                );

            if (
                resolved.startsWith(
                    "/",
                )
            ) {
                return (
                    <Link
                        href={resolved}
                        prefetch={false}
                        className={
                            linkStyles
                        }
                    >
                        {children}
                    </Link>
                );
            }

            if (
                resolved.startsWith(
                    "#",
                )
            ) {
                return (
                    <a
                        href={resolved}
                        className={
                            linkStyles
                        }
                    >
                        {children}
                    </a>
                );
            }

            return (
                <a
                    href={resolved}
                    target="_blank"
                    rel="noreferrer"
                    className={
                        linkStyles
                    }
                >
                    {children}
                </a>
            );
        },

        ul:
            ({ children }) => (
                <ul className="mt-6 list-disc space-y-3 pl-7 text-[1.02rem] font-medium leading-8 text-slate-700 marker:text-violet-500">
                    {children}
                </ul>
            ),

        ol:
            ({ children }) => (
                <ol className="mt-6 list-decimal space-y-3 pl-7 text-[1.02rem] font-medium leading-8 text-slate-700 marker:font-black marker:text-violet-600">
                    {children}
                </ol>
            ),

        li:
            ({ children }) => (
                <li className="break-words pl-2">
                    {children}
                </li>
            ),

        blockquote:
            ({ children }) => (
                <blockquote className="my-8 rounded-r-2xl border-l-4 border-violet-500 bg-violet-50 px-6 py-4 text-slate-700">
                    {children}
                </blockquote>
            ),

        hr: () => (
            <hr className="my-14 border-slate-200" />
        ),

        pre:
            ({ children }) => (
                <CodeBlock
                    code={
                        textFromChildren(
                            children,
                        ).replace(
                            /\n$/,
                            "",
                        )
                    }
                />
            ),

        code: ({
            className,
            children,
        }) => {
            const value =
                textFromChildren(
                    children,
                );

            const block =
                Boolean(
                    className,
                )
                || value.includes(
                    "\n",
                );

            return block
                ? (
                    <code
                        className={
                            className
                        }
                    >
                        {children}
                    </code>
                )
                : (
                    <code className="break-words rounded-md border border-violet-100 bg-violet-50 px-1.5 py-0.5 font-mono text-[0.9em] font-bold text-violet-900 [overflow-wrap:anywhere]">
                        {children}
                    </code>
                );
        },

        table:
            ({ children }) => (
                <div className="my-8 max-w-full overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
                        {children}
                    </table>
                </div>
            ),

        thead:
            ({ children }) => (
                <thead className="bg-slate-950 text-white">
                    {children}
                </thead>
            ),

        tbody:
            ({ children }) => (
                <tbody className="divide-y divide-slate-200 bg-white">
                    {children}
                </tbody>
            ),

        th:
            ({ children }) => (
                <th className="px-5 py-4 font-black">
                    {children}
                </th>
            ),

        td:
            ({ children }) => (
                <td className="px-5 py-4 align-top font-medium leading-6 text-slate-700">
                    {children}
                </td>
            ),

        details:
            ({ children }) => (
                <details className="my-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    {children}
                </details>
            ),

        summary:
            ({ children }) => (
                <summary className="cursor-pointer font-black text-slate-950">
                    {children}
                </summary>
            ),

        img: ({
            alt = "",
            src = "",
        }) => {
            const source =
                typeof src
                === "string"
                    ? src
                    : "";

            const asset =
                assetFor(
                    document,
                    source,
                );

            if (!asset) {
                return (
                    <span
                        role="note"
                        data-doc-media-placeholder
                        className="mx-1 inline-flex max-w-full items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 align-middle text-[0.7rem] font-black text-slate-500"
                    >
                        {alt
                            ? `Media: ${alt}`
                            : "Repository media"}
                    </span>
                );
            }

            const unavailable =
                asset.path.endsWith(
                    "/6170169d0da576b8e6cfa262.jpg",
                );

            if (
                unavailable
            ) {
                return (
                    <span
                        role="note"
                        data-stage37-unavailable-media
                        className="my-6 block border-l border-white/15 py-1 pl-4 text-sm leading-6 text-slate-400"
                    >
                        {alt
                            ? `${alt} is unavailable in the captured repository media.`
                            : "Repository media is unavailable in this capture."}
                    </span>
                );
            }

            const compact =
                asset.height <= 96
                || asset.width
                    / asset.height
                    >= 4;

            return (
                <DocumentationMedia
                    path={asset.path}
                    width={asset.width}
                    height={asset.height}
                    alt={alt}
                    animated={asset.animated}
                    bytes={asset.bytes}
                    compact={compact}
                />
            );
        },
    };

    return (
        <div
            data-document-markdown
            className="min-w-0"
        >
            <ReactMarkdown
                remarkPlugins={[
                    remarkGfm,
                ]}
                rehypePlugins={[
                    rehypeRaw,
                    rehypeSanitize,
                    anchorPlugin,
                ]}
                components={
                    components
                }
            >
                {document.markdown}
            </ReactMarkdown>
        </div>
    );
}
