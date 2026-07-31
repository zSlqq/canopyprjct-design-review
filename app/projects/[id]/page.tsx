import {
    redirect,
} from "next/navigation";

import {
    getCuratedArchiveManifest,
} from "@/lib/curated-archive";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export async function generateStaticParams() {
    const manifest =
        await getCuratedArchiveManifest();

    return manifest.projects.map(
        (
            project,
        ) => ({
            id:
                project.slug,
        }),
    );
}

export default async function ProjectDetailsRedirect({
    params,
}: PageProps) {
    const {
        id,
    } = await params;

    redirect(
        `/archive/${id}`,
    );
}
