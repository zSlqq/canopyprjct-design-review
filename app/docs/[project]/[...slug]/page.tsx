import type {
    Metadata,
} from "next";
import {
    notFound,
} from "next/navigation";

import {
    nestedDocument,
    nestedDocumentParams,
} from "@/lib/docs";
import {
    DocumentationShell,
} from "@/components/docs/DocumentationShell";

export const dynamic =
    "force-static";

export const dynamicParams =
    false;

export const revalidate =
    false;

type PageProps = {
    params: Promise<{
        project: string;
        slug: string[];
    }>;
};

export function generateStaticParams() {
    return nestedDocumentParams();
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const {
        project,
        slug,
    } = await params;

    const document =
        nestedDocument(
            project,
            slug,
        );

    if (!document) {
        return {};
    }

    return {
        title:
            `${document.title} | ${document.projectTitle} Docs`,
        description:
            document.plainText.slice(
                0,
                155,
            ),
        alternates: {
            canonical:
                document.route,
        },
    };
}

export default async function NestedDocumentationPage({
    params,
}: PageProps) {
    const {
        project,
        slug,
    } = await params;

    const document =
        nestedDocument(
            project,
            slug,
        );

    if (!document) {
        notFound();
    }

    return (
        <DocumentationShell
            document={document}
        />
    );
}
