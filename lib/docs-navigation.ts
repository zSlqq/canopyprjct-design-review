import navigationJson from "@/lib/data/generated/docs/navigation.json";

export type NavigationDocument = {
    id: string;
    title: string;
    route: string;
    projectId: string;
    projectTitle: string;
    repository: string;
    sourceType:
        | "wiki"
        | "repository"
        | string;
    sourcePath: string;
    sourceUrl: string;
    sourceRevision: string;
    retrievedAt: string;
    wordCount: number;
    readingMinutes: number;
    sectionCount: number;
    previousId:
        | string
        | null;
    nextId:
        | string
        | null;
    relatedIds: string[];
};

export type NavigationProject = {
    id: string;
    title: string;
    repository: string;
    documents:
        NavigationDocument[];
    documentCount: number;
    sectionCount: number;
    wordCount: number;
};

export type DocumentationNavigation = {
    schemaVersion: number;
    generatedAt: string;
    projects:
        NavigationProject[];
    documents:
        Record<
            string,
            NavigationDocument
        >;
    summary: {
        projects: number;
        documents: number;
        sections: number;
        words: number;
        searchEntries: number;
        searchProjects: number;
        mediaAssets: number;
        documentsWithMedia: number;
        markdownLinks: number;
        sourceTypes:
            Record<string, number>;
    };
};

export const documentationNavigation =
    navigationJson as unknown as DocumentationNavigation;

export function navigationDocument(
    documentId: string,
): NavigationDocument | undefined {
    return documentationNavigation.documents[
        documentId
    ];
}

export function navigationProject(
    projectId: string,
): NavigationProject | undefined {
    return documentationNavigation.projects.find(
        (project) =>
            project.id
            === projectId,
    );
}

export function linkedNavigationDocument(
    documentId:
        | string
        | null,
): NavigationDocument | undefined {
    if (!documentId) {
        return undefined;
    }

    return navigationDocument(
        documentId,
    );
}
