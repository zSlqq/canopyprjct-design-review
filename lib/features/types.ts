export type FeatureKind =
    | "feature"
    | "command"
    | "rule"
    | "statistic"
    | "api"
    | "configuration"
    | "workflow"
    | "overview";

export type FeatureReviewStatus =
    | "source-extracted"
    | "editor-reviewed"
    | "publisher-verified";

export interface FeatureSource {
    repository: string;
    repositoryUrl: string;
    path: string;
    url: string;
    section: string;
    line: number;
    retrievedAt: string;
    excerpt: string;
}

export interface FeatureUsage {
    syntax: string | null;
    summary: string;
    prerequisites: string[];
    steps: string[];
    examples: string[];
    notes: string[];
}

export interface FeatureEntry {
    id: string;
    repository: string;
    siteProjectId: string | null;
    projectTitle: string;
    kind: FeatureKind;
    title: string;
    aliases: string[];
    tags: string[];
    usage: FeatureUsage;
    source: FeatureSource;
    reviewStatus: FeatureReviewStatus;
}

export interface RepositoryFeatureInventory {
    repository: string;
    repositoryUrl: string;
    description: string | null;
    defaultBranch: string;
    archived: boolean;
    fork: boolean;
    siteProjectId: string | null;
    readmeFound: boolean;
    wikiDocuments: number;
    featureCandidates: number;
}
