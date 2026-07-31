export const addonCategories = [
    "All",
    "Redstone",
    "Mechanics",
    "Scripting",
    "Automation",
] as const;

export type AddonCategoryFilter =
    (typeof addonCategories)[number];

export type AddonCategory =
    Exclude<AddonCategoryFilter, "All">;

export type ProjectKind =
    | "Flagship"
    | "Extension"
    | "Addon"
    | "Server plugin"
    | "Developer tool"
    | "Template";

export interface AddonStats {
    downloads: number | null;
    stars: number | null;
    updatedAt: string;
}

export interface AddonProject {
    id: string;
    title: string;
    shortDescription: string;
    fullDescription: string;
    author: string;
    version: string;
    minecraftVersion: string;
    category: AddonCategory;
    kind: ProjectKind;
    downloadUrl: string;
    githubUrl: string;
    stats: AddonStats;
    screenshots: string[];
    capabilities: string[];
    installationSteps: string[];
    dependencies: string[];
    tags: string[];
    accent: string;
    featured?: boolean;
}
