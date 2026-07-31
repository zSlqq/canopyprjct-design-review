"use client";

import Link from "next/link";

import {
    repositoryIndex,
    type RepositorySlug,
} from "@/lib/design/repository-index";

import {
    homepageCopy,
} from "@/lib/design/homepage";

type Project =
    (typeof repositoryIndex)[number];

function project(
    slug: RepositorySlug,
): Project {
    const match =
        repositoryIndex.find(
            (
                item,
            ) =>
                item.slug
                === slug,
        );

    if (!match) {
        throw new Error(
            `Missing certified project: ${slug}`,
        );
    }

    return match;
}

const documentationRouteOverrides:
    Partial<Record<RepositorySlug, string>> = {
        addonapikit: "/docs/addon-api-kit",
    };

function documentationHref(
    item: Project,
): string {
    return (
        documentationRouteOverrides[
            item.slug
        ]
        ?? item.docsHref
    );
}

function ProjectActions({
    item,
}: {
    item: Project;
}) {
    return (
        <nav
            className="stage37-project-actions"
            aria-label={`${item.name} links`}
        >
            <Link href={item.projectHref}>
                Project
            </Link>

            <Link href={item.archiveHref}>
                Archive
            </Link>

            <Link href={documentationHref(item)}>
                Docs
            </Link>

            <a
                href={item.sourceHref}
                target="_blank"
                rel="noreferrer"
            >
                Source
            </a>
        </nav>
    );
}

function DirectoryRow({
    item,
}: {
    item: Project;
}) {
    return (
        <li
            className="stage37-directory-row"
            data-stage37-project-row
        >
            <Link
                href={item.projectHref}
                className="stage37-directory-main"
            >
                <span className="stage37-directory-index">
                    {String(
                        item.position,
                    ).padStart(
                        2,
                        "0",
                    )}
                </span>

                <strong>
                    {item.name}
                </strong>

                <span className="stage37-directory-category">
                    {item.category}
                </span>

                <span className="stage37-directory-arrow">
                    ↗
                </span>
            </Link>

            <p>
                {item.description}
            </p>
        </li>
    );
}

function ProjectLine({
    item,
}: {
    item: Project;
}) {
    return (
        <article className="stage37-project-line">
            <div className="stage37-project-line__heading">
                <p>
                    {item.relationship}
                </p>

                <h3>
                    {item.name}
                </h3>
            </div>

            <p className="stage37-project-line__description">
                {item.description}
            </p>

            <ProjectActions
                item={item}
            />
        </article>
    );
}

function EditorialGroup({
    label,
    title,
    description,
    projects,
}: {
    label: string;
    title: string;
    description: string;
    projects: readonly Project[];
}) {
    return (
        <section className="stage37-editorial-section">
            <div className="stage37-shell stage37-editorial-grid">
                <header className="stage37-editorial-heading">
                    <p>
                        {label}
                    </p>

                    <h2>
                        {title}
                    </h2>

                    <span>
                        {description}
                    </span>
                </header>

                <div className="stage37-project-lines">
                    {projects.map(
                        (
                            item,
                        ) => (
                            <ProjectLine
                                key={item.slug}
                                item={item}
                            />
                        ),
                    )}
                </div>
            </div>
        </section>
    );
}

function CanopyFlagship() {
    const canopy =
        project(
            "canopy",
        );

    const facts = [
        [
            "Commands",
            canopy.counts.commands,
        ],
        [
            "Rules",
            canopy.counts.globalRules,
        ],
        [
            "Documents",
            canopy.counts.documents,
        ],
        [
            "Functions",
            canopy.counts.functions,
        ],
    ] as const;

    return (
        <section
            id="canopy"
            className="stage37-flagship"
        >
            <div className="stage37-shell">
                <div className="stage37-flagship__topline">
                    <p>
                        Flagship project
                    </p>

                    <span>
                        {canopy.relationship}
                    </span>
                </div>

                <div className="stage37-flagship__body">
                    <div>
                        <h2>
                            Canopy
                        </h2>

                        <p>
                            {canopy.description}
                        </p>

                        <ProjectActions
                            item={canopy}
                        />
                    </div>

                    <dl className="stage37-facts">
                        {facts.map(
                            (
                                [
                                    label,
                                    value,
                                ],
                            ) => (
                                <div key={label}>
                                    <dt>
                                        {label}
                                    </dt>

                                    <dd>
                                        {value}
                                    </dd>
                                </div>
                            ),
                        )}
                    </dl>
                </div>
            </div>
        </section>
    );
}

function DestinationRow({
    href,
    title,
    description,
}: {
    href: string;
    title: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            className="stage37-destination-row"
        >
            <strong>
                {title}
            </strong>

            <span>
                {description}
            </span>

            <i aria-hidden="true">
                →
            </i>
        </Link>
    );
}

export function Stage37Home() {
    const understudy =
        project(
            "understudy",
        );

    const statisticDisplay =
        project(
            "statistic-display",
        );

    const construct =
        project(
            "construct",
        );

    const nudge =
        project(
            "nudge",
        );

    const boreal =
        project(
            "boreal",
        );

    const addonApiKit =
        project(
            "addonapikit",
        );

    const vitestMocks =
        project(
            "minecraft-vitest-mocks",
        );

    const extensionExample =
        project(
            "canopy-extension-example",
        );

    return (
        <main
            className="stage37-home"
            data-stage37-home
        >
            <section
                className="stage37-hero"
                data-stage37-hero
                aria-labelledby="stage37-hero-title"
            >
                <div className="stage37-shell stage37-hero__inner">
                    <h1
                        id="stage37-hero-title"
                    >
                        {homepageCopy.title}
                    </h1>
                </div>
            </section>

            <CanopyFlagship />

            <EditorialGroup
                label="Canopy extensions"
                title="Action and information stay connected to the world."
                description="Understudy introduces repeatable simulated-player action. Statistic Display keeps persistent values readable without turning the page into a dashboard."
                projects={[
                    understudy,
                    statisticDisplay,
                ]}
            />

            <EditorialGroup
                label="Building workflow"
                title="Plan, transfer, and place with precision."
                description="Construct translates a design into a survival workflow. Nudge handles exact region movement, duplication, stacking, deletion, and recovery."
                projects={[
                    construct,
                    nudge,
                ]}
            />

            <EditorialGroup
                label="Server tooling"
                title="Control progression deliberately."
                description="Boreal exposes native server control for tick state, administration, and technical world behavior."
                projects={[
                    boreal,
                ]}
            />

            <EditorialGroup
                label="Developer infrastructure"
                title="Build against verified interfaces."
                description="Typed communication, deterministic mocks, and a complete extension example support addon development without decorative code windows."
                projects={[
                    addonApiKit,
                    vitestMocks,
                    extensionExample,
                ]}
            />

            <section
                id="projects"
                className="stage37-directory"
                aria-labelledby="stage37-directory-title"
            >
                <div className="stage37-shell">
                    <header className="stage37-directory-heading">
                        <p>
                            Complete repository index
                        </p>

                        <h2
                            id="stage37-directory-title"
                        >
                            Fifteen repositories.
                            One body of work.
                        </h2>

                        <span>
                            Every project remains directly reachable.
                            Canopy leads. Extensions, addons, server
                            tooling, libraries, tests, examples, and
                            independent work follow in authored order.
                        </span>
                    </header>

                    <ol className="stage37-directory-list">
                        {repositoryIndex.map(
                            (
                                item,
                            ) => (
                                <DirectoryRow
                                    key={item.slug}
                                    item={item}
                                />
                            ),
                        )}
                    </ol>
                </div>
            </section>

            <section className="stage37-destinations">
                <div className="stage37-shell">
                    <header className="stage37-destinations__heading">
                        <p>
                            Find the exact material
                        </p>

                        <h2>
                            The site is a working technical index,
                            not a portfolio slideshow.
                        </h2>
                    </header>

                    <div className="stage37-destination-list">
                        <DestinationRow
                            href="/features"
                            title="Feature library"
                            description="Search project capabilities and trace each result back to source."
                        />

                        <DestinationRow
                            href="/docs"
                            title="Documentation"
                            description="Read repository and wiki material through the local documentation system."
                        />

                        <DestinationRow
                            href="/archive"
                            title="Release archive"
                            description="Browse curated project records, releases, contributors, and mirrored downloads."
                        />

                        <DestinationRow
                            href="/search"
                            title="Global search"
                            description="Move across projects, documentation, features, and archive content."
                        />
                    </div>
                </div>
            </section>

            <footer className="stage37-footer">
                <div className="stage37-shell stage37-footer__inner">
                    <div>
                        <strong>
                            ForestOfLight
                        </strong>

                        <span>
                            Technical Bedrock projects,
                            documentation, and releases.
                        </span>
                    </div>

                    <nav aria-label="Footer">
                        <Link href="/projects/canopy">
                            Canopy
                        </Link>

                        <Link href="/features">
                            Features
                        </Link>

                        <Link href="/docs">
                            Docs
                        </Link>

                        <Link href="/archive">
                            Archive
                        </Link>

                        <a
                            href="https://github.com/ForestOfLight"
                            target="_blank"
                            rel="noreferrer"
                        >
                            GitHub
                        </a>
                    </nav>
                </div>
            </footer>
        </main>
    );
}
