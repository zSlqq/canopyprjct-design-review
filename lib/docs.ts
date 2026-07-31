import corpusJson from "@/lib/data/generated/docs/corpus.json";

export type DocumentationSection = {
    title: string;
    level: number;
    anchor: string;
    headingPath: string[];
    markdown: string;
    plainText: string;
    wordCount: number;
};

export type DocumentationDocument = {
    id: string;
    projectId: string;
    projectTitle: string;
    repository: string;
    repositoryUrl: string;
    sourceType: "wiki" | "repository";
    sourcePath: string;
    sourceUrl: string;
    sourceRevision: string;
    sourceBranch: string;
    retrievedAt: string;
    title: string;
    route: string;
    markdown: string;
    plainText: string;
    contentHash: string;
    wordCount: number;
    sections: DocumentationSection[];
};

type DocumentationCorpus = {
    schemaVersion: number;
    generatedAt: string;
    documents: DocumentationDocument[];
};

export type DocumentationProject = {
    id: string;
    title: string;
    route: string;
    documents: number;
    wikiDocuments: number;
    sections: number;
    words: number;
};

const corpus =
    corpusJson as DocumentationCorpus;

const documents =
    [...corpus.documents].sort(
        (first, second) => {
            const projectOrder =
                first.projectTitle.localeCompare(
                    second.projectTitle,
                );

            if (projectOrder !== 0) {
                return projectOrder;
            }

            if (
                first.sourceType
                !== second.sourceType
            ) {
                return first.sourceType === "wiki"
                    ? -1
                    : 1;
            }

            return first.route.localeCompare(
                second.route,
            );
        },
    );

const routeMap =
    new Map(
        documents.map(
            (document) => [
                document.route,
                document,
            ],
        ),
    );

function normalizePath(
    value: string,
): string {
    const output: string[] = [];

    for (
        const segment
        of value.split("/")
    ) {
        if (
            !segment
            || segment === "."
        ) {
            continue;
        }

        if (segment === "..") {
            output.pop();
            continue;
        }

        output.push(segment);
    }

    return output.join("/");
}

function separateSuffix(
    href: string,
): {
    pathname: string;
    suffix: string;
} {
    const index =
        href.search(/[?#]/);

    return index < 0
        ? {
            pathname: href,
            suffix: "",
        }
        : {
            pathname:
                href.slice(0, index),
            suffix:
                href.slice(index),
        };
}

export function allDocumentation():
    DocumentationDocument[] {
    return documents;
}

export function documentationGeneratedAt():
    string {
    return corpus.generatedAt;
}

export function projectDocuments(
    projectId: string,
): DocumentationDocument[] {
    return documents.filter(
        (document) =>
            document.projectId
            === projectId,
    );
}

export function documentationProjects():
    DocumentationProject[] {
    const groups =
        new Map<
            string,
            DocumentationDocument[]
        >();

    for (
        const document
        of documents
    ) {
        const entries =
            groups.get(
                document.projectId,
            )
            ?? [];

        entries.push(document);

        groups.set(
            document.projectId,
            entries,
        );
    }

    return [
        ...groups.entries(),
    ]
        .map(
            ([
                projectId,
                entries,
            ]) => {
                const home =
                    entries.find(
                        (entry) =>
                            entry.route
                            ===
                            `/docs/${projectId}`,
                    )
                    ?? entries[0];

                return {
                    id:
                        projectId,
                    title:
                        home.projectTitle,
                    route:
                        home.route,
                    documents:
                        entries.length,
                    wikiDocuments:
                        entries.filter(
                            (entry) =>
                                entry.sourceType
                                === "wiki",
                        ).length,
                    sections:
                        entries.reduce(
                            (
                                total,
                                entry,
                            ) =>
                                total
                                + entry
                                    .sections
                                    .length,
                            0,
                        ),
                    words:
                        entries.reduce(
                            (
                                total,
                                entry,
                            ) =>
                                total
                                + entry
                                    .wordCount,
                            0,
                        ),
                };
            },
        )
        .sort(
            (first, second) =>
                first.title.localeCompare(
                    second.title,
                ),
        );
}

export function documentByRoute(
    route: string,
): DocumentationDocument
    | undefined {
    return routeMap.get(
        route.replace(/\/+$/, "")
        || "/",
    );
}

export function projectHomeDocument(
    projectId: string,
): DocumentationDocument
    | undefined {
    return documentByRoute(
        `/docs/${projectId}`,
    );
}

export function nestedDocument(
    projectId: string,
    slug: string[],
): DocumentationDocument
    | undefined {
    return documentByRoute(
        `/docs/${projectId}/`
        + slug.join("/"),
    );
}

export function projectRootParams():
    Array<{
        project: string;
    }> {
    return documents
        .filter(
            (document) =>
                document.route
                ===
                `/docs/${
                    document.projectId
                }`,
        )
        .map(
            (document) => ({
                project:
                    document.projectId,
            }),
        );
}

export function nestedDocumentParams():
    Array<{
        project: string;
        slug: string[];
    }> {
    return documents
        .filter(
            (document) =>
                document.route
                !==
                `/docs/${
                    document.projectId
                }`,
        )
        .map(
            (document) => {
                const prefix =
                    `/docs/${
                        document.projectId
                    }/`;

                return {
                    project:
                        document.projectId,
                    slug:
                        document.route
                            .slice(
                                prefix.length,
                            )
                            .split("/")
                            .filter(Boolean),
                };
            },
        );
}

export function documentNeighbors(
    document:
        DocumentationDocument,
): {
    previous?:
        DocumentationDocument;
    next?:
        DocumentationDocument;
} {
    const entries =
        projectDocuments(
            document.projectId,
        );

    const index =
        entries.findIndex(
            (entry) =>
                entry.id
                === document.id,
        );

    return {
        previous:
            index > 0
                ? entries[index - 1]
                : undefined,
        next:
            index >= 0
            && index
                < entries.length - 1
                ? entries[index + 1]
                : undefined,
    };
}

export function resolveDocumentationHref(
    document:
        DocumentationDocument,
    href: string,
): string {
    if (
        !href
        || href.startsWith("#")
        || href.startsWith("/")
        || /^[a-z][a-z0-9+.-]*:/i.test(
            href,
        )
    ) {
        return href;
    }

    const {
        pathname,
        suffix,
    } = separateSuffix(href);

    let decoded =
        pathname;

    try {
        decoded =
            decodeURIComponent(
                pathname,
            );
    } catch {
        decoded =
            pathname;
    }

    const sourceDirectory =
        document.sourcePath
            .split("/")
            .slice(0, -1)
            .join("/");

    const normalized =
        normalizePath(
            [
                sourceDirectory,
                decoded,
            ]
                .filter(Boolean)
                .join("/"),
        );

    const stem =
        normalized.replace(
            /\.(md|mdx|markdown)$/i,
            "",
        );

    const candidates =
        new Set(
            [
                normalized,
                `${stem}.md`,
                `${stem}.mdx`,
                `${stem}.markdown`,
            ].map(
                (candidate) =>
                    candidate.toLowerCase(),
            ),
        );

    const target =
        documents.find(
            (entry) =>
                entry.projectId
                    ===
                    document.projectId
                && entry.sourceType
                    ===
                    document.sourceType
                && candidates.has(
                    entry.sourcePath
                        .toLowerCase(),
                ),
        );

    return target
        ? target.route + suffix
        : document.sourceUrl;
}
