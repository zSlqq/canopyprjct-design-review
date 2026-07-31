import catalogData from "@/lib/data/generated/feature-catalog.json";
import inventoryData from "@/lib/data/generated/repository-inventory.json";
import reviewQueueData from "@/lib/data/generated/feature-review-queue.json";
import type {
    FeatureEntry,
    RepositoryFeatureInventory,
} from "@/lib/features/types";

export const featureCatalog =
    catalogData as FeatureEntry[];

export const repositoryFeatureInventory =
    inventoryData as RepositoryFeatureInventory[];

export const featureReviewQueue =
    reviewQueueData as Array<{
        id: string;
        repository: string;
        title: string;
        missing: string[];
        sourceUrl: string;
    }>;

export function featuresForProject(
    projectId: string,
): FeatureEntry[] {
    return featureCatalog.filter(
        (feature) =>
            feature.siteProjectId ===
            projectId,
    );
}

export function searchFeatures(
    query: string,
): FeatureEntry[] {
    const normalized =
        query.trim().toLowerCase();

    if (!normalized) {
        return featureCatalog;
    }

    return featureCatalog.filter(
        (feature) => {
            const searchable = [
                feature.projectTitle,
                feature.repository,
                feature.kind,
                feature.title,
                feature.usage.syntax ?? "",
                feature.usage.summary,
                ...feature.aliases,
                ...feature.tags,
                ...feature.usage.notes,
                ...feature.usage.prerequisites,
                ...feature.usage.steps,
                ...feature.usage.examples,
            ]
                .join(" ")
                .toLowerCase();

            return searchable.includes(
                normalized,
            );
        },
    );
}
