export type FeatureLibraryRecord = {
    id: string;
    documentId: string;
    projectId: string;
    projectTitle: string;
    repository: string;
    kind: string;
    title: string;
    originalTitle: string;
    route: string;
    sourceUrl: string;
    sourceType: string;
    documentTitle: string;
    sectionTitle: string;
    headingPath: string[];
    snippet: string;
    syntax: string;
    aliases: string[];
};

export type FeatureLibraryProject = {
    projectId: string;
    projectTitle: string;
    repository: string;
    file: string;
    hash: string;
    entries: number;
    bytes: number;
    kinds: Record<string, number>;
};

export type FeatureLibraryManifest = {
    schemaVersion: number;
    generatedAt: string;
    projects: FeatureLibraryProject[];
    kinds: string[];
    totalEntries: number;
    totalBytes: number;
    spotlight: FeatureLibraryRecord[];
};

export type FeatureLibraryResponse = {
    requestId: number;
    query: string;
    projectId: string;
    kind: string;
    results: FeatureLibraryRecord[];
    totalMatches: number;
    searchedProjects: number;
    loadedShards: number;
    durationMs: number;
};
