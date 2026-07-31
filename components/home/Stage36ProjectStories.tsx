import Link from "next/link";

import {
    repositoryIndex,
    type RepositorySlug,
} from "@/lib/design/repository-index";

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

function ProjectLinks({
    item,
    inverse = false,
}: {
    item: Project;
    inverse?: boolean;
}) {
    return (
        <div
            className="stage36c-actions"
            data-inverse={inverse}
        >
            <Link
                href={item.projectHref}
                className="stage36c-action stage36c-action--primary"
            >
                Project page
                <span aria-hidden="true">
                    ↗
                </span>
            </Link>

            <Link
                href={item.archiveHref}
                className="stage36c-action"
            >
                Archive
                <span aria-hidden="true">
                    →
                </span>
            </Link>

            <Link
                href={item.docsHref}
                className="stage36c-action"
            >
                Documentation
                <span aria-hidden="true">
                    →
                </span>
            </Link>
        </div>
    );
}

function SectionHeading({
    label,
    title,
    description,
    inverse = false,
}: {
    label: string;
    title: string;
    description: string;
    inverse?: boolean;
}) {
    return (
        <header
            className="stage36c-heading"
            data-inverse={inverse}
        >
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
    );
}

function CanopyStory() {
    const canopy =
        project(
            "canopy",
        );

    return (
        <section
            id="canopy-system"
            className="stage36c-story stage36c-canopy"
            data-stage36-story="canopy"
            aria-labelledby="stage36c-canopy-title"
        >
            <div className="stage36c-shell stage36c-story__grid">
                <div>
                    <p className="stage36c-context">
                        Flagship system
                    </p>

                    <h2
                        id="stage36c-canopy-title"
                        className="stage36c-display"
                    >
                        Canopy makes a running world legible.
                    </h2>

                    <p className="stage36c-lead">
                        Live information, technical controls,
                        commands, rules, and extension points
                        are presented as one operating layer,
                        not a loose collection of utilities.
                    </p>

                    <dl className="stage36c-facts">
                        <div>
                            <dt>
                                Commands
                            </dt>
                            <dd>
                                {canopy.counts.commands}
                            </dd>
                        </div>

                        <div>
                            <dt>
                                Rules
                            </dt>
                            <dd>
                                {canopy.counts.globalRules}
                            </dd>
                        </div>

                        <div>
                            <dt>
                                Indexed functions
                            </dt>
                            <dd>
                                {canopy.counts.functions}
                            </dd>
                        </div>
                    </dl>

                    <ProjectLinks
                        item={canopy}
                    />
                </div>

                <div
                    className="stage36c-instrument"
                    role="img"
                    aria-label="Canopy world-state instrument showing block, light, biome, entity, and tick readings"
                >
                    <div className="stage36c-instrument__bar">
                        <span>
                            world/overworld
                        </span>
                        <span>
                            live
                        </span>
                    </div>

                    <div className="stage36c-instrument__body">
                        <div className="stage36c-world-slice">
                            {Array.from({
                                length: 30,
                            }).map(
                                (
                                    _,
                                    index,
                                ) => (
                                    <span
                                        key={index}
                                        data-signal={
                                            index % 7 === 0
                                            || index % 11 === 0
                                        }
                                    />
                                ),
                            )}

                            <i />
                        </div>

                        <dl className="stage36c-readings">
                            <div>
                                <dt>
                                    block
                                </dt>
                                <dd>
                                    observer
                                </dd>
                            </div>
                            <div>
                                <dt>
                                    light
                                </dt>
                                <dd>
                                    11 / 15
                                </dd>
                            </div>
                            <div>
                                <dt>
                                    biome
                                </dt>
                                <dd>
                                    plains
                                </dd>
                            </div>
                            <div>
                                <dt>
                                    entities
                                </dt>
                                <dd>
                                    24
                                </dd>
                            </div>
                            <div>
                                <dt>
                                    tick
                                </dt>
                                <dd>
                                    20.0
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="stage36c-instrument__footer">
                        <span>
                            x 128
                        </span>
                        <span>
                            y 64
                        </span>
                        <span>
                            z −32
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}

function ExtensionStory() {
    const understudy =
        project(
            "understudy",
        );
    const statisticDisplay =
        project(
            "statistic-display",
        );

    return (
        <section
            id="extensions"
            className="stage36c-story stage36c-extensions"
            data-stage36-story="extensions"
            aria-labelledby="stage36c-extensions-title"
        >
            <div className="stage36c-shell">
                <SectionHeading
                    label="Extensions and world information"
                    title="Act on the world. Keep the result visible."
                    description="Understudy introduces repeatable simulated-player action. Statistic Display turns persistent world values into readable information. Each project has a distinct job while remaining close to Canopy's technical workflow."
                />

                <div className="stage36c-extension-layout">
                    <article className="stage36c-understudy">
                        <div className="stage36c-project-line">
                            <span>
                                simulated player
                            </span>
                            <strong>
                                Understudy
                            </strong>
                        </div>

                        <h3>
                            A repeatable actor for technical tests.
                        </h3>

                        <p>
                            Define a path, face a target, run an
                            interaction, and inspect the resulting
                            world state without turning the page into
                            a fake command console.
                        </p>

                        <div
                            className="stage36c-path"
                            role="img"
                            aria-label="Understudy path from spawn through movement and action to a recorded result"
                        >
                            {[
                                "spawn",
                                "move",
                                "face",
                                "act",
                                "record",
                            ].map(
                                (
                                    step,
                                ) => (
                                    <span
                                        key={step}
                                    >
                                        {step}
                                    </span>
                                ),
                            )}
                        </div>

                        <ProjectLinks
                            item={understudy}
                        />
                    </article>

                    <article className="stage36c-statistics">
                        <div className="stage36c-project-line">
                            <span>
                                persistent values
                            </span>
                            <strong>
                                Statistic Display
                            </strong>
                        </div>

                        <h3>
                            Numbers that remain part of the world.
                        </h3>

                        <p>
                            Surface counters and tracked values where
                            players can read them, instead of burying
                            useful information in configuration or logs.
                        </p>

                        <dl
                            className="stage36c-counter-bank"
                            aria-label="Example statistic readouts"
                        >
                            <div>
                                <dt>
                                    sessions
                                </dt>
                                <dd>
                                    184
                                </dd>
                            </div>
                            <div>
                                <dt>
                                    events
                                </dt>
                                <dd>
                                    2,416
                                </dd>
                            </div>
                            <div>
                                <dt>
                                    active
                                </dt>
                                <dd>
                                    08
                                </dd>
                            </div>
                        </dl>

                        <ProjectLinks
                            item={statisticDisplay}
                        />
                    </article>
                </div>
            </div>
        </section>
    );
}

function BuildingStory() {
    const construct =
        project(
            "construct",
        );
    const nudge =
        project(
            "nudge",
        );

    return (
        <section
            id="building-workflow"
            className="stage36c-story stage36c-building"
            data-stage36-story="building"
            aria-labelledby="stage36c-building-title"
        >
            <div className="stage36c-shell">
                <SectionHeading
                    label="Building workflow"
                    title="Move from intention to exact placement."
                    description="Construct organizes a build into a survival workflow. Nudge handles precise region movement and correction. Their visual language shares coordinates and selection geometry without pretending they are the same product."
                />

                <div className="stage36c-building-board">
                    <article className="stage36c-build-half">
                        <div className="stage36c-project-line">
                            <span>
                                creative → survival
                            </span>
                            <strong>
                                Construct
                            </strong>
                        </div>

                        <h3>
                            Read a structure as layers and materials.
                        </h3>

                        <div
                            className="stage36c-layers"
                            role="img"
                            aria-label="Four separated build layers progressing toward completion"
                        >
                            <span data-layer="roof">
                                roof · 18 / 18
                            </span>
                            <span data-layer="frame">
                                frame · 42 / 42
                            </span>
                            <span data-layer="walls">
                                walls · 71 / 96
                            </span>
                            <span data-layer="base">
                                base · 64 / 64
                            </span>
                        </div>

                        <ProjectLinks
                            item={construct}
                        />
                    </article>

                    <article className="stage36c-build-half stage36c-build-half--nudge">
                        <div className="stage36c-project-line">
                            <span>
                                selected region
                            </span>
                            <strong>
                                Nudge
                            </strong>
                        </div>

                        <h3>
                            Correct a volume without rebuilding it.
                        </h3>

                        <div
                            className="stage36c-region-shift"
                            role="img"
                            aria-label="A selected block region moving three blocks on the X axis and one block on the Z axis"
                        >
                            <span className="stage36c-region-shift__before">
                                before
                            </span>
                            <i>
                                x +3 · z −1
                            </i>
                            <span className="stage36c-region-shift__after">
                                after
                            </span>
                        </div>

                        <ProjectLinks
                            item={nudge}
                        />
                    </article>
                </div>
            </div>
        </section>
    );
}

function ServerStory() {
    const boreal =
        project(
            "boreal",
        );

    return (
        <section
            id="server-control"
            className="stage36c-story stage36c-server"
            data-stage36-story="server"
            aria-labelledby="stage36c-server-title"
        >
            <div className="stage36c-shell stage36c-server__grid">
                <div>
                    <p className="stage36c-context">
                        Native server tooling
                    </p>

                    <h2
                        id="stage36c-server-title"
                        className="stage36c-display"
                    >
                        Boreal controls progression below the addon layer.
                    </h2>

                    <p className="stage36c-lead">
                        Freeze, step, sprint, and resume server ticks
                        through an Endstone plugin built for technical
                        controls the normal Script API does not expose.
                    </p>

                    <ProjectLinks
                        item={boreal}
                        inverse
                    />
                </div>

                <div
                    className="stage36c-tick-sequencer"
                    role="img"
                    aria-label="Boreal tick sequence showing freeze, three controlled steps, and resume"
                >
                    <div className="stage36c-tick-sequencer__header">
                        <span>
                            server progression
                        </span>
                        <strong>
                            controlled
                        </strong>
                    </div>

                    <ol>
                        <li data-state="done">
                            <span>
                                freeze
                            </span>
                            <i>
                                0.0 tps
                            </i>
                        </li>
                        <li data-state="done">
                            <span>
                                step
                            </span>
                            <i>
                                +1 tick
                            </i>
                        </li>
                        <li data-state="done">
                            <span>
                                step
                            </span>
                            <i>
                                +1 tick
                            </i>
                        </li>
                        <li data-state="active">
                            <span>
                                step
                            </span>
                            <i>
                                +1 tick
                            </i>
                        </li>
                        <li>
                            <span>
                                resume
                            </span>
                            <i>
                                20.0 tps
                            </i>
                        </li>
                    </ol>

                    <div className="stage36c-tick-sequencer__footer">
                        <span>
                            piston behavior
                        </span>
                        <span>
                            chunk ticking
                        </span>
                        <span>
                            tick sprinting
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}

function DeveloperStory() {
    const apiKit =
        project(
            "addonapikit",
        );
    const mocks =
        project(
            "minecraft-vitest-mocks",
        );
    const extensionExample =
        project(
            "canopy-extension-example",
        );

    return (
        <section
            id="developer-infrastructure"
            className="stage36c-story stage36c-developer"
            data-stage36-story="developer"
            aria-labelledby="stage36c-developer-title"
        >
            <div className="stage36c-shell">
                <SectionHeading
                    label="Developer infrastructure"
                    title="Interfaces, tests, and a known starting shape."
                    description="The developer layer is shown as a working sequence: define communication, test behavior outside the game, then package an extension through a documented structure."
                />

                <div className="stage36c-pipeline">
                    <article>
                        <span className="stage36c-pipeline__step">
                            define
                        </span>
                        <h3>
                            AddonAPIKit
                        </h3>
                        <p>
                            Named endpoints, typed parameters,
                            asynchronous calls, and return values
                            keep independent addons decoupled.
                        </p>
                        <code>
                            api.call(&quot;spawn/query&quot;)
                        </code>
                        <ProjectLinks
                            item={apiKit}
                        />
                    </article>

                    <article>
                        <span className="stage36c-pipeline__step">
                            verify
                        </span>
                        <h3>
                            minecraft-vitest-mocks
                        </h3>
                        <p>
                            Exercise Script API behavior, scheduled
                            ticks, UI modules, and dynamic properties
                            without launching a full game session.
                        </p>
                        <ul>
                            <li>
                                server module · pass
                            </li>
                            <li>
                                scheduled ticks · pass
                            </li>
                            <li>
                                dynamic properties · pass
                            </li>
                        </ul>
                        <ProjectLinks
                            item={mocks}
                        />
                    </article>

                    <article>
                        <span className="stage36c-pipeline__step">
                            package
                        </span>
                        <h3>
                            Canopy Extension Example
                        </h3>
                        <p>
                            A visible reference for manifests,
                            commands, rules, APIs, packaging,
                            and reusable integration patterns.
                        </p>
                        <pre aria-label="Example extension structure">
                            <code>{`extension/
├─ manifest.json
├─ src/commands
├─ src/rules
├─ src/api
└─ package.json`}</code>
                        </pre>
                        <ProjectLinks
                            item={extensionExample}
                        />
                    </article>
                </div>
            </div>
        </section>
    );
}

function DiscoveryStory() {
    const destinations = [
        {
            href: "/features",
            title: "Feature library",
            description:
                "Search project capabilities and trace them back to source.",
        },
        {
            href: "/docs",
            title: "Documentation",
            description:
                "Read repository and wiki material in the local documentation system.",
        },
        {
            href: "/archive",
            title: "Release archive",
            description:
                "Open curated project records, releases, contributors, and mirrored downloads.",
        },
        {
            href: "/search",
            title: "Global search",
            description:
                "Move across projects, documentation, features, and archive content.",
        },
    ] as const;

    return (
        <section
            id="research-surfaces"
            className="stage36c-story stage36c-discovery"
            data-stage36-story="discovery"
            aria-labelledby="stage36c-discovery-title"
        >
            <div className="stage36c-shell">
                <SectionHeading
                    label="Research surfaces"
                    title="The showcase leads somewhere useful."
                    description="The homepage introduces the system. The deeper tools provide the evidence: source-derived features, maintained documentation, release history, and complete search."
                />

                <nav
                    className="stage36c-destinations"
                    aria-label="Research and discovery tools"
                >
                    {destinations.map(
                        (
                            destination,
                        ) => (
                            <Link
                                key={destination.href}
                                href={destination.href}
                            >
                                <strong>
                                    {destination.title}
                                </strong>
                                <span>
                                    {destination.description}
                                </span>
                                <i aria-hidden="true">
                                    →
                                </i>
                            </Link>
                        ),
                    )}
                </nav>
            </div>
        </section>
    );
}

function Stage36Footer() {
    return (
        <footer
            className="stage36c-footer"
            data-stage36-footer
        >
            <div className="stage36c-shell stage36c-footer__layout">
                <div>
                    <strong>
                        ForestOfLight
                    </strong>
                    <span>
                        Technical Bedrock projects,
                        documentation, and releases.
                    </span>
                </div>

                <nav aria-label="Footer links">
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
    );
}

export function Stage36ProjectStories() {
    return (
        <div data-stage36-project-stories>
            <CanopyStory />
            <ExtensionStory />
            <BuildingStory />
            <ServerStory />
            <DeveloperStory />
            <DiscoveryStory />
            <Stage36Footer />
        </div>
    );
}
