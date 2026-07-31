import type {
    Metadata,
} from "next";

import {
    notFound,
} from "next/navigation";

import CuratedArchivePage from "@/components/archive/CuratedArchivePage";

import {
    getCuratedArchiveManifest,
    getCuratedArchiveProject,
} from "@/lib/curated-archive";

type PageProps = {
    params: Promise<{
        project: string;
    }>;
};

export async function generateStaticParams() {
    const manifest =
        await getCuratedArchiveManifest();

    return manifest.projects.map(
        (
            project,
        ) => ({
            project:
                project.slug,
        }),
    );
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const {
        project:
            slug,
    } = await params;

    const project =
        await getCuratedArchiveProject(
            slug,
        );

    if (!project) {
        return {};
    }

    return {
        title:
            `${project.name} — Technical Archive`,
        description:
            project.description
            || project.tagline,
    };
}

export default async function ArchiveProjectRoute({
    params,
}: PageProps) {
    const {
        project:
            slug,
    } = await params;

    const project =
        await getCuratedArchiveProject(
            slug,
        );

    if (!project) {
        notFound();
    }

    return (
        <CuratedArchivePage
            project={project}
        />
    );
}
