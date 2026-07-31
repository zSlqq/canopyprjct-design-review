import { FeatureExplorer } from "@/components/FeatureExplorer";
import { featuresForProject } from "@/lib/features/catalog";

interface ProjectFeatureSectionProps {
    projectId: string;
    projectTitle: string;
}

export function ProjectFeatureSection({
    projectId,
    projectTitle,
}: ProjectFeatureSectionProps) {
    const entries =
        featuresForProject(
            projectId,
        );

    if (entries.length === 0) {
        return null;
    }

    return (
        <FeatureExplorer
            entries={entries}
            variant="project"
            projectTitle={
                projectTitle
            }
        />
    );
}
