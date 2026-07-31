export type DocumentationSearchProject = {
    projectId: string;
    projectTitle: string;
    file: string;
    hash: string;
    entries: number;
    bytes: number;
};

export type DocumentationSearchManifest = {
    schemaVersion: number;
    generatedAt: string;
    projects:
        DocumentationSearchProject[];
    totalEntries: number;
};

export type DocumentationSearchResult = {
    id: string;
    documentId: string;
    projectId: string;
    projectTitle: string;
    repository: string;
    sourceType:
        | "wiki"
        | "repository";
    route: string;
    documentTitle: string;
    sectionTitle: string;
    headingPath: string[];
    sourceUrl: string;
    snippet: string;
    score: number;
};

export type DocumentationSearchResponse = {
    requestId: number;
    query: string;
    projectId: string;
    results:
        DocumentationSearchResult[];
    totalMatches: number;
    durationMs: number;
    searchedProjects: number;
    cachedShards: number;
    projectCounts:
        Record<string, number>;
};
