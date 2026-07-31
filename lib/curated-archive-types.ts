export type CuratedBlock =
    | {
        type: "paragraph";
        text: string;
    }
    | {
        type: "heading";
        level: number;
        text: string;
        id: string;
    }
    | {
        type: "list";
        ordered: boolean;
        items: string[];
    }
    | {
        type: "code";
        language: string;
        text: string;
    }
    | {
        type: "quote";
        text: string;
    }
    | {
        type: "image";
        src: string;
        alt: string;
        caption?: string;
        width?: number;
        height?: number;
    }
    | {
        type: "rule";
    };

export type CuratedEntry = {
    name: string;
    id: string;
    group: string;
    usage: string[];
    metadata: Record<string, string>;
    blocks: CuratedBlock[];
};

export type CuratedDocument = {
    source: string;
    title: string;
    score?: number;
    blocks?: CuratedBlock[];
    entries?: CuratedEntry[];
};

export type CuratedDownload = {
    name: string;
    kind: string;
    href: string;
    bytes: number;
    sha256: string;
    sourceUrl: string;
};

export type CuratedRelease = {
    tag: string;
    name: string;
    publishedAt: string;
    prerelease: boolean;
    formalRelease: boolean;
    notes: string;
    downloads: CuratedDownload[];
};

export type CuratedSection = {
    id: string;
    label: string;
    eyebrow: string;
    title: string;
    description: string;
    kind:
        | "prose"
        | "catalog"
        | "downloads"
        | "code";
    documents?: CuratedDocument[];
    releases?: CuratedRelease[];
    repositoryUrl?: string;
    defaultBranch?: string;
    language?: string;
    license?: {
        license: string;
        statement: string;
    };
    functions?: number;
    documentsCount?: number;
};

export type CuratedContributor = {
    login: string;
    displayName: string;
    contributions: number;
    profileUrl: string;
    avatar: string;
    type: string;
    bio: string;
    company: string;
};

export type CuratedArchiveProject = {
    schemaVersion: number;
    slug: string;
    name: string;
    fullName: string;
    kind: string;
    tagline: string;
    description: string;
    repositoryUrl: string;
    homepage: string;
    language: string;
    license: string;
    fork: boolean;
    archived: boolean;
    updatedAt: string;
    stars: number;
    counts: {
        versions: number;
        releaseAssets: number;
        contributors: number;
        functions: number;
        commands: number;
        globalRules: number;
        documents: number;
    };
    jump: {
        id: string;
        label: string;
        count: number;
    }[];
    sections: CuratedSection[];
    contributors: CuratedContributor[];
    copyright: {
        license: string;
        statement: string;
    };
    support: null | {
        title: string;
        description: string;
        href: string;
        label: string;
    };
    crossLinks: {
        slug: string;
        label: string;
        description: string;
    }[];
};

export type CuratedArchiveManifest = {
    schemaVersion: number;
    generatedAt: string;
    projects: {
        slug: string;
        name: string;
        kind: string;
        sections: string[];
        contributors: number;
        downloads: number;
        file: string;
    }[];
    summary: {
        projects: number;
        sections: number;
        contributors: number;
        downloads: number;
    };
    failures: {
        project: string;
        error: string;
    }[];
    passed: boolean;
};
