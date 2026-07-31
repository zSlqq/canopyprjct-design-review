import Link from "next/link";

import {
    ArrowUpRight,
    Braces,
} from "lucide-react";

import {
    ForestCapabilityScene,
} from "@/components/home/ForestCapabilityScene";

import {
    addons,
} from "@/lib/data/addons";

import {
    homepageCopy,
} from "@/lib/design/homepage";

import {
    repositoryIndex,
    type RepositorySlug,
} from "@/lib/design/repository-index";

import styles from "./ForestHome.module.css";

type Project =
    (typeof repositoryIndex)[number];

type Addon =
    (typeof addons)[number];

const projectRouteOverrides:
    Partial<
        Record<
            RepositorySlug,
            string
        >
    > = {
        addonapikit:
            "/projects/addon-api-kit",
    };

const documentationRouteOverrides:
    Partial<
        Record<
            RepositorySlug,
            string
        >
    > = {
        addonapikit:
            "/docs/addon-api-kit",
    };

const richProjectSlugs =
    new Set<RepositorySlug>(
        [
            "canopy",
            "understudy",
            "statistic-display",
            "construct",
            "nudge",
            "boreal",
            "addonapikit",
            "minecraft-vitest-mocks",
            "canopy-extension-example",
        ],
    );

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

function addon(
    id: string,
): Addon {
    const match =
        addons.find(
            (
                item,
            ) =>
                item.id
                === id,
        );

    if (!match) {
        throw new Error(
            `Missing approved project content: ${id}`,
        );
    }

    return match;
}

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

function projectHref(
    item: Project,
): string | null {
    if (
        !richProjectSlugs.has(
            item.slug,
        )
    ) {
        return null;
    }

    return (
        projectRouteOverrides[
            item.slug
        ]
        ?? item.projectHref
    );
}

function ProjectActions({
    item,
}: {
    item: Project;
}) {
    const richHref =
        projectHref(
            item,
        );

    return (
        <nav
            className={
                styles.projectActions
            }
            aria-label={`${item.name} destinations`}
        >
            {richHref ? (
                <Link
                    href={
                        richHref
                    }
                >
                    Project
                </Link>
            ) : null}

            <Link
                href={
                    item.archiveHref
                }
            >
                Archive
            </Link>

            <Link
                href={
                    documentationHref(
                        item,
                    )
                }
            >
                Docs
            </Link>

            <a
                href={
                    item.sourceHref
                }
                target="_blank"
                rel="noreferrer"
            >
                Source
                <ArrowUpRight
                    aria-hidden="true"
                    size={13}
                />
            </a>
        </nav>
    );
}

function ProjectDiagram({
    id,
}: {
    id: string;
}) {
    return (
        <div
            className={
                styles.projectDiagram
            }
            data-diagram={
                id
            }
            aria-hidden="true"
        >
            <div
                className={
                    styles.diagramGrid
                }
            />

            <div
                className={
                    styles.diagramPath
                }
            >
                <i />
                <i />
                <i />
                <i />
                <i />
            </div>

            <div
                className={
                    styles.diagramActor
                }
            >
                <span />
            </div>

            <div
                className={
                    styles.diagramBars
                }
            >
                <i />
                <i />
                <i />
                <i />
                <i />
            </div>

            <div
                className={
                    styles.diagramLayers
                }
            >
                <i />
                <i />
                <i />
                <i />
            </div>

            <div
                className={
                    styles.diagramSelection
                }
            >
                <span />
                <span />
                <span />
                <span />
            </div>

            <div
                className={
                    styles.diagramTicks
                }
            >
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
            </div>

            <div
                className={
                    styles.diagramNodes
                }
            >
                <span>
                    API
                </span>
                <span>
                    ADDON
                </span>
                <span>
                    TEST
                </span>
                <i />
                <i />
            </div>

            <div
                className={
                    styles.diagramTerminal
                }
            >
                <code>
                    $ vitest run
                </code>
                <span>
                    12 passed
                </span>
            </div>

            <small>
                {id}
            </small>
        </div>
    );
}

function RepositoryRow({
    item,
}: {
    item: Project;
}) {
    return (
        <li
            className={
                styles.repositoryRow
            }
            data-forest-project-row
        >
            <div
                className={
                    styles.repositoryPrimary
                }
            >
                <span
                    className={
                        styles.repositoryNumber
                    }
                >
                    {String(
                        item.position,
                    ).padStart(
                        2,
                        "0",
                    )}
                </span>

                <div>
                    <Link
                        href={
                            item.archiveHref
                        }
                    >
                        {item.name}
                    </Link>

                    <p>
                        {item.description}
                    </p>
                </div>
            </div>

            <div
                className={
                    styles.repositoryClassification
                }
            >
                <span>
                    {item.category}
                </span>

                <span>
                    {item.relationship}
                </span>

                <span>
                    {item.language}
                </span>
            </div>

            <div
                className={
                    styles.repositoryCounts
                }
            >
                <span>
                    {
                        item.counts
                            .versions
                    }
                    {" "}
                    releases
                </span>

                <span>
                    {
                        item.counts
                            .documents
                    }
                    {" "}
                    docs
                </span>
            </div>

            <ProjectActions
                item={
                    item
                }
            />
        </li>
    );
}

function Story({
    repositorySlug,
    addonId,
    number,
}: {
    repositorySlug:
        RepositorySlug;
    addonId: string;
    number: string;
}) {
    const item =
        project(
            repositorySlug,
        );

    const content =
        addon(
            addonId,
        );

    return (
        <article
            className={
                styles.story
            }
            data-project-story={
                item.slug
            }
        >
            <div
                className={
                    styles.storyVisual
                }
            >
                <div
                    className={
                        styles.storyTopline
                    }
                >
                    <span>
                        {number}
                    </span>

                    <span>
                        {item.language}
                    </span>
                </div>

                <ProjectDiagram
                    id={
                        item.slug
                    }
                />
            </div>

            <div
                className={
                    styles.storyCopy
                }
            >
                <p>
                    {item.category}
                </p>

                <h3>
                    {content.title}
                </h3>

                <strong>
                    {
                        content.shortDescription
                    }
                </strong>

                <span>
                    {
                        content.fullDescription
                    }
                </span>

                <ul>
                    {content.capabilities
                        .slice(
                            0,
                            4,
                        )
                        .map(
                            (
                                capability,
                            ) => (
                                <li
                                    key={
                                        capability
                                    }
                                >
                                    {
                                        capability
                                    }
                                </li>
                            ),
                        )}
                </ul>

                <ProjectActions
                    item={
                        item
                    }
                />
            </div>
        </article>
    );
}

export function ForestHome() {
    const canopy =
        project(
            "canopy",
        );

    const canopyContent =
        addon(
            "canopy",
        );

    const boreal =
        project(
            "boreal",
        );

    const borealContent =
        addon(
            "boreal",
        );

    const developerProjects =
        [
            {
                repository:
                    project(
                        "addonapikit",
                    ),
                content:
                    addon(
                        "addon-api-kit",
                    ),
            },
            {
                repository:
                    project(
                        "minecraft-vitest-mocks",
                    ),
                content:
                    addon(
                        "minecraft-vitest-mocks",
                    ),
            },
            {
                repository:
                    project(
                        "canopy-extension-example",
                    ),
                content:
                    addon(
                        "canopy-extension-example",
                    ),
            },
        ];

    const totals =
        repositoryIndex.reduce(
            (
                result,
                item,
            ) => ({
                releases:
                    result.releases
                    + item.counts
                        .versions,
                assets:
                    result.assets
                    + item.counts
                        .releaseAssets,
                documents:
                    result.documents
                    + item.counts
                        .documents,
                commands:
                    result.commands
                    + item.counts
                        .commands,
                rules:
                    result.rules
                    + item.counts
                        .globalRules,
                functions:
                    result.functions
                    + item.counts
                        .functions,
            }),
            {
                releases: 0,
                assets: 0,
                documents: 0,
                commands: 0,
                rules: 0,
                functions: 0,
            },
        );

    return (
        <main
            className={
                styles.root
            }
            data-forest-home
        >
            <a
                className={
                    styles.skipLink
                }
                href="#main-content"
            >
                Skip to content
            </a>

            <header
                className={
                    styles.header
                }
            >
                <div
                    className={
                        styles.headerInner
                    }
                >
                    <Link
                        className={
                            styles.brand
                        }
                        href="/"
                        aria-label="ForestOfLight home"
                    >
                        <span
                            className={
                                styles.brandMark
                            }
                            aria-hidden="true"
                        >
                            <Braces
                                size={17}
                            />
                        </span>

                        <span
                            className={
                                styles.brandText
                            }
                        >
                            <strong>
                                ForestOfLight
                            </strong>

                            <small>
                                Technical Bedrock
                            </small>
                        </span>
                    </Link>

                    <nav
                        className={
                            styles.sectionNavigation
                        }
                        aria-label="Homepage sections"
                    >
                        <a href="#projects">
                            Projects
                        </a>
                        <a href="#canopy">
                            Canopy
                        </a>
                        <a href="#workflows">
                            Workflows
                        </a>
                        <a href="#developers">
                            Developers
                        </a>
                    </nav>

                    <nav
                        className={
                            styles.routeNavigation
                        }
                        aria-label="Product destinations"
                    >
                        <Link href="/features">
                            Features
                        </Link>
                        <Link href="/docs">
                            Docs
                        </Link>
                        <Link href="/archive">
                            Archive
                        </Link>
                        <Link href="/search">
                            Search
                        </Link>
                    </nav>
                </div>
            </header>

            <div id="main-content">
                <section
                    className={
                        styles.hero
                    }
                    aria-labelledby="forest-home-heading"
                >
                    <div
                        className={
                            styles.heroAtmosphere
                        }
                        aria-hidden="true"
                    />

                    <div
                        className={
                            styles.shell
                        }
                    >
                        <div
                            className={
                                styles.heroGrid
                            }
                        >
                            <div
                                className={
                                    styles.heroCopy
                                }
                            >
                                <p
                                    className={
                                        styles.eyebrow
                                    }
                                >
                                    {
                                        homepageCopy.eyebrow
                                    }
                                </p>

                                <h1
                                    id="forest-home-heading"
                                >
                                    {
                                        homepageCopy.title
                                    }
                                </h1>

                                <p
                                    className={
                                        styles.heroIntroduction
                                    }
                                >
                                    {
                                        homepageCopy.introduction
                                    }
                                </p>

                                <div
                                    className={
                                        styles.heroActions
                                    }
                                >
                                    <Link
                                        className={
                                            styles.primaryAction
                                        }
                                        href="/projects/canopy"
                                    >
                                        {
                                            homepageCopy.primaryAction
                                        }

                                        <ArrowUpRight
                                            aria-hidden="true"
                                            size={16}
                                        />
                                    </Link>

                                    <a
                                        className={
                                            styles.secondaryAction
                                        }
                                        href="#projects"
                                    >
                                        {
                                            homepageCopy.secondaryAction
                                        }
                                    </a>
                                </div>

                                <dl
                                    className={
                                        styles.heroFacts
                                    }
                                >
                                    <div>
                                        <dt>
                                            Repositories
                                        </dt>
                                        <dd>
                                            {
                                                repositoryIndex.length
                                            }
                                        </dd>
                                    </div>

                                    <div>
                                        <dt>
                                            Release records
                                        </dt>
                                        <dd>
                                            {
                                                totals.releases
                                            }
                                        </dd>
                                    </div>

                                    <div>
                                        <dt>
                                            Local assets
                                        </dt>
                                        <dd>
                                            {
                                                totals.assets
                                            }
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <ForestCapabilityScene />
                        </div>
                    </div>
                </section>

                <section
                    id="projects"
                    className={
                        styles.repositorySection
                    }
                    aria-labelledby="repository-heading"
                >
                    <div
                        className={
                            styles.shell
                        }
                    >
                        <header
                            className={
                                styles.sectionHeader
                            }
                        >
                            <div
                                className={
                                    styles.sectionMarker
                                }
                            >
                                <span>
                                    01
                                </span>

                                <p>
                                    Complete project index
                                </p>
                            </div>

                            <div
                                className={
                                    styles.sectionHeadingCopy
                                }
                            >
                                <h2
                                    id="repository-heading"
                                >
                                    Fifteen repositories.
                                    One authored body of work.
                                </h2>

                                <p>
                                    The directory keeps ForestOfLight&apos;s
                                    selected order and links every project
                                    directly to its local archive,
                                    documentation, and original source.
                                </p>
                            </div>

                            <Link
                                className={
                                    styles.headingAction
                                }
                                href="/search"
                            >
                                Search everything

                                <ArrowUpRight
                                    aria-hidden="true"
                                    size={15}
                                />
                            </Link>
                        </header>

                        <ol
                            className={
                                styles.repositoryList
                            }
                        >
                            {repositoryIndex.map(
                                (
                                    item,
                                ) => (
                                    <RepositoryRow
                                        key={
                                            item.slug
                                        }
                                        item={
                                            item
                                        }
                                    />
                                ),
                            )}
                        </ol>
                    </div>
                </section>

                <section
                    id="canopy"
                    className={
                        styles.canopySection
                    }
                    aria-labelledby="canopy-heading"
                >
                    <div
                        className={
                            styles.shell
                        }
                    >
                        <div
                            className={
                                styles.sectionMarker
                            }
                        >
                            <span>
                                02
                            </span>

                            <p>
                                Flagship system
                            </p>
                        </div>

                        <div
                            className={
                                styles.canopyGrid
                            }
                        >
                            <div
                                className={
                                    styles.canopyCopy
                                }
                            >
                                <p
                                    className={
                                        styles.eyebrow
                                    }
                                >
                                    Canopy / live world information
                                </p>

                                <h2
                                    id="canopy-heading"
                                >
                                    The technical layer
                                    closest to the world.
                                </h2>

                                <strong>
                                    {
                                        canopyContent.shortDescription
                                    }
                                </strong>

                                <span>
                                    {
                                        canopyContent.fullDescription
                                    }
                                </span>

                                <ul>
                                    {canopyContent.capabilities.map(
                                        (
                                            capability,
                                        ) => (
                                            <li
                                                key={
                                                    capability
                                                }
                                            >
                                                {
                                                    capability
                                                }
                                            </li>
                                        ),
                                    )}
                                </ul>

                                <div
                                    className={
                                        styles.canopyActions
                                    }
                                >
                                    <Link
                                        href="/projects/canopy"
                                    >
                                        Open Canopy
                                    </Link>

                                    <Link
                                        href="/features?project=canopy"
                                    >
                                        Feature catalog
                                    </Link>

                                    <Link
                                        href="/docs/canopy"
                                    >
                                        Documentation
                                    </Link>

                                    <Link
                                        href="/archive/canopy#downloads"
                                    >
                                        Local downloads
                                    </Link>
                                </div>
                            </div>

                            <div
                                className={
                                    styles.canopyInstrument
                                }
                                aria-label="Canopy archive instrumentation"
                            >
                                <header>
                                    <span>
                                        CANOPY / INDEX
                                    </span>

                                    <span>
                                        LOCAL SOURCE
                                    </span>
                                </header>

                                <div
                                    className={
                                        styles.instrumentReadout
                                    }
                                >
                                    <div>
                                        <span>
                                            COMMANDS
                                        </span>
                                        <strong>
                                            {
                                                canopy.counts
                                                    .commands
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            GLOBAL RULES
                                        </span>
                                        <strong>
                                            {
                                                canopy.counts
                                                    .globalRules
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            FUNCTIONS
                                        </span>
                                        <strong>
                                            {canopy.counts.functions.toLocaleString(
                                                "en-US",
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            RELEASES
                                        </span>
                                        <strong>
                                            {
                                                canopy.counts
                                                    .versions
                                            }
                                        </strong>
                                    </div>
                                </div>

                                <div
                                    className={
                                        styles.instrumentRows
                                    }
                                >
                                    {[
                                        [
                                            "world information",
                                            92,
                                        ],
                                        [
                                            "technical rules",
                                            79,
                                        ],
                                        [
                                            "commands",
                                            68,
                                        ],
                                        [
                                            "extension layer",
                                            55,
                                        ],
                                    ].map(
                                        (
                                            [
                                                label,
                                                value,
                                            ],
                                        ) => (
                                            <div
                                                key={
                                                    label
                                                }
                                            >
                                                <span>
                                                    {
                                                        label
                                                    }
                                                </span>

                                                <i>
                                                    <b
                                                        style={{
                                                            width:
                                                                `${value}%`,
                                                        }}
                                                    />
                                                </i>
                                            </div>
                                        ),
                                    )}
                                </div>

                                <div
                                    className={
                                        styles.relationshipRail
                                    }
                                >
                                    <Link
                                        href="/archive/canopy"
                                    >
                                        <span>
                                            CORE
                                        </span>
                                        <strong>
                                            Canopy
                                        </strong>
                                    </Link>

                                    <Link
                                        href="/archive/understudy"
                                    >
                                        <span>
                                            EXTENDS CANOPY
                                        </span>
                                        <strong>
                                            Understudy
                                        </strong>
                                    </Link>

                                    <Link
                                        href="/archive/statistic-display"
                                    >
                                        <span>
                                            WORLD INFORMATION
                                        </span>
                                        <strong>
                                            Statistic Display
                                        </strong>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    className={
                        styles.extensionsSection
                    }
                    aria-labelledby="extensions-heading"
                >
                    <div
                        className={
                            styles.shell
                        }
                    >
                        <header
                            className={
                                styles.sectionHeader
                            }
                        >
                            <div
                                className={
                                    styles.sectionMarker
                                }
                            >
                                <span>
                                    03
                                </span>

                                <p>
                                    World actors and records
                                </p>
                            </div>

                            <div
                                className={
                                    styles.sectionHeadingCopy
                                }
                            >
                                <h2
                                    id="extensions-heading"
                                >
                                    Repeatable action.
                                    Persistent information.
                                </h2>

                                <p>
                                    Understudy controls simulated players.
                                    Statistic Display keeps detailed world
                                    activity available without filling a
                                    world with scoreboard objectives.
                                </p>
                            </div>
                        </header>

                        <div
                            className={
                                styles.storyList
                            }
                        >
                            <Story
                                repositorySlug="understudy"
                                addonId="understudy"
                                number="03.1"
                            />

                            <Story
                                repositorySlug="statistic-display"
                                addonId="statistic-display"
                                number="03.2"
                            />
                        </div>
                    </div>
                </section>

                <section
                    id="workflows"
                    className={
                        styles.workflowSection
                    }
                    aria-labelledby="workflow-heading"
                >
                    <div
                        className={
                            styles.shell
                        }
                    >
                        <header
                            className={
                                styles.sectionHeader
                            }
                        >
                            <div
                                className={
                                    styles.sectionMarker
                                }
                            >
                                <span>
                                    04
                                </span>

                                <p>
                                    Building workflow
                                </p>
                            </div>

                            <div
                                className={
                                    styles.sectionHeadingCopy
                                }
                            >
                                <h2
                                    id="workflow-heading"
                                >
                                    From designed structure
                                    to controlled transformation.
                                </h2>
                            </div>
                        </header>

                        <div
                            className={
                                styles.workflowGrid
                            }
                        >
                            <Story
                                repositorySlug="construct"
                                addonId="construct"
                                number="04.1"
                            />

                            <Story
                                repositorySlug="nudge"
                                addonId="nudge"
                                number="04.2"
                            />
                        </div>
                    </div>
                </section>

                <section
                    className={
                        styles.serverSection
                    }
                    aria-labelledby="server-heading"
                >
                    <div
                        className={
                            styles.shell
                        }
                    >
                        <div
                            className={
                                styles.serverGrid
                            }
                        >
                            <div
                                className={
                                    styles.serverCopy
                                }
                            >
                                <div
                                    className={
                                        styles.sectionMarker
                                    }
                                >
                                    <span>
                                        05
                                    </span>

                                    <p>
                                        Server tooling
                                    </p>
                                </div>

                                <p
                                    className={
                                        styles.eyebrow
                                    }
                                >
                                    Boreal / Endstone
                                </p>

                                <h2
                                    id="server-heading"
                                >
                                    Freeze the world.
                                    Advance it deliberately.
                                </h2>

                                <strong>
                                    {
                                        borealContent.shortDescription
                                    }
                                </strong>

                                <span>
                                    {
                                        borealContent.fullDescription
                                    }
                                </span>

                                <ProjectActions
                                    item={
                                        boreal
                                    }
                                />
                            </div>

                            <div
                                className={
                                    styles.serverTimeline
                                }
                                aria-hidden="true"
                            >
                                <header>
                                    <span>
                                        SERVER / TICK STATE
                                    </span>
                                    <strong>
                                        FROZEN
                                    </strong>
                                </header>

                                <div>
                                    {Array.from(
                                        {
                                            length: 18,
                                        },
                                        (
                                            _,
                                            index,
                                        ) => (
                                            <i
                                                key={
                                                    index
                                                }
                                                data-major={
                                                    index
                                                    % 5
                                                    === 0
                                                        ? "true"
                                                        : "false"
                                                }
                                            />
                                        ),
                                    )}
                                </div>

                                <footer>
                                    <span>
                                        tick 40812
                                    </span>
                                    <strong>
                                        step +1
                                    </strong>
                                    <span>
                                        chunks active
                                    </span>
                                </footer>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="developers"
                    className={
                        styles.developerSection
                    }
                    aria-labelledby="developer-heading"
                >
                    <div
                        className={
                            styles.shell
                        }
                    >
                        <header
                            className={
                                styles.sectionHeader
                            }
                        >
                            <div
                                className={
                                    styles.sectionMarker
                                }
                            >
                                <span>
                                    06
                                </span>

                                <p>
                                    Developer infrastructure
                                </p>
                            </div>

                            <div
                                className={
                                    styles.sectionHeadingCopy
                                }
                            >
                                <h2
                                    id="developer-heading"
                                >
                                    Interfaces, tests,
                                    and a reusable extension path.
                                </h2>

                                <p>
                                    The supporting repositories make addon
                                    communication, testing, and Canopy
                                    extension development easier to repeat.
                                </p>
                            </div>
                        </header>

                        <div
                            className={
                                styles.developerGrid
                            }
                        >
                            <div
                                className={
                                    styles.developerMap
                                }
                                aria-hidden="true"
                            >
                                <span
                                    data-node="api"
                                >
                                    API
                                </span>

                                <span
                                    data-node="provider"
                                >
                                    PROVIDER
                                </span>

                                <span
                                    data-node="consumer"
                                >
                                    CONSUMER
                                </span>

                                <span
                                    data-node="test"
                                >
                                    TEST
                                </span>

                                <span
                                    data-node="package"
                                >
                                    PACKAGE
                                </span>

                                <i />
                                <i />
                                <i />
                                <i />
                            </div>

                            <div
                                className={
                                    styles.developerRows
                                }
                            >
                                {developerProjects.map(
                                    ({
                                        repository,
                                        content,
                                    }) => (
                                        <article
                                            key={
                                                repository.slug
                                            }
                                        >
                                            <div>
                                                <p>
                                                    {
                                                        repository.category
                                                    }
                                                </p>

                                                <h3>
                                                    {
                                                        content.title
                                                    }
                                                </h3>

                                                <span>
                                                    {
                                                        content.shortDescription
                                                    }
                                                </span>
                                            </div>

                                            <ProjectActions
                                                item={
                                                    repository
                                                }
                                            />
                                        </article>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    className={
                        styles.destinationSection
                    }
                    aria-labelledby="destination-heading"
                >
                    <div
                        className={
                            styles.shell
                        }
                    >
                        <header
                            className={
                                styles.sectionHeader
                            }
                        >
                            <div
                                className={
                                    styles.sectionMarker
                                }
                            >
                                <span>
                                    07
                                </span>

                                <p>
                                    Product destinations
                                </p>
                            </div>

                            <div
                                className={
                                    styles.sectionHeadingCopy
                                }
                            >
                                <h2
                                    id="destination-heading"
                                >
                                    Find the exact material,
                                    not another landing page.
                                </h2>
                            </div>
                        </header>

                        <div
                            className={
                                styles.destinationGrid
                            }
                        >
                            {[
                                {
                                    href:
                                        "/features",
                                    number:
                                        "01",
                                    title:
                                        "Feature library",
                                    body:
                                        "Search capabilities, commands, and rules with compact source context.",
                                },
                                {
                                    href:
                                        "/docs",
                                    number:
                                        "02",
                                    title:
                                        "Documentation",
                                    body:
                                        "Read repository and wiki material through the local documentation reader.",
                                },
                                {
                                    href:
                                        "/archive",
                                    number:
                                        "03",
                                    title:
                                        "Release archive",
                                    body:
                                        "Browse releases, contributors, files, functions, and mirrored downloads.",
                                },
                                {
                                    href:
                                        "/status",
                                    number:
                                        "04",
                                    title:
                                        "System status",
                                    body:
                                        "Inspect the generated archive, delivery, documentation, and feature state.",
                                },
                            ].map(
                                (
                                    destination,
                                ) => (
                                    <Link
                                        key={
                                            destination.href
                                        }
                                        href={
                                            destination.href
                                        }
                                    >
                                        <span>
                                            {
                                                destination.number
                                            }
                                        </span>

                                        <strong>
                                            {
                                                destination.title
                                            }
                                        </strong>

                                        <p>
                                            {
                                                destination.body
                                            }
                                        </p>

                                        <i>
                                            Open
                                            <ArrowUpRight
                                                aria-hidden="true"
                                                size={14}
                                            />
                                        </i>
                                    </Link>
                                ),
                            )}
                        </div>

                        <dl
                            className={
                                styles.coverageLedger
                            }
                            aria-label="Local archive coverage"
                        >
                            <div>
                                <dt>
                                    Commands
                                </dt>
                                <dd>
                                    {
                                        totals.commands
                                    }
                                </dd>
                            </div>

                            <div>
                                <dt>
                                    Global rules
                                </dt>
                                <dd>
                                    {
                                        totals.rules
                                    }
                                </dd>
                            </div>

                            <div>
                                <dt>
                                    Documents
                                </dt>
                                <dd>
                                    {
                                        totals.documents
                                    }
                                </dd>
                            </div>

                            <div>
                                <dt>
                                    Indexed functions
                                </dt>
                                <dd>
                                    {totals.functions.toLocaleString(
                                        "en-US",
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </section>
            </div>

            <footer
                className={
                    styles.footer
                }
            >
                <div
                    className={
                        styles.shell
                    }
                >
                    <div>
                        <strong>
                            ForestOfLight
                        </strong>

                        <span>
                            Technical Bedrock projects,
                            documentation, and releases.
                        </span>
                    </div>

                    <nav
                        aria-label="Footer navigation"
                    >
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
                        <Link href="/search">
                            Search
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
