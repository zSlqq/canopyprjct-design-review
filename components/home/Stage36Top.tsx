"use client";

import Link from "next/link";

import {
    useMemo,
    useState,
    type ChangeEvent,
    type KeyboardEvent,
} from "react";

import {
    heroCapabilities,
    homepageCopy,
    type HeroCapabilityId,
} from "@/lib/design/homepage";

import {
    repositoryIndex,
    type RepositorySlug,
} from "@/lib/design/repository-index";

function WorldSpecimen({
    state,
}: {
    state: HeroCapabilityId;
}) {
    const blocks = Array.from(
        {
            length:
                48,
        },
        (
            _,
            index,
        ) => index,
    );

    return (
        <div
            className="stage36-specimen"
            data-state={state}
            role="img"
            aria-label={`Technical world state: ${state}`}
        >
            <div
                className="stage36-specimen__topline"
                aria-hidden="true"
            >
                <span>
                    dimension/overworld
                </span>

                <span>
                    state/{state}
                </span>
            </div>

            <div
                className="stage36-specimen__world"
                aria-hidden="true"
            >
                <div className="stage36-specimen__grid">
                    {blocks.map(
                        (block) => (
                            <span
                                key={block}
                                className="stage36-specimen__block"
                                data-block={block}
                            />
                        ),
                    )}
                </div>

                <div className="stage36-specimen__scan" />

                <div className="stage36-specimen__selection">
                    <span>
                        8 × 5 × 6
                    </span>
                </div>

                <div className="stage36-specimen__path">
                    <span />
                    <span />
                    <span />
                    <span />
                </div>

                <div className="stage36-specimen__target">
                    target
                </div>

                <div className="stage36-specimen__layers">
                    <span>
                        04
                    </span>
                    <span>
                        03
                    </span>
                    <span>
                        02
                    </span>
                    <span>
                        01
                    </span>
                </div>

                <div className="stage36-specimen__tick">
                    <strong>
                        tick
                    </strong>

                    <span>
                        frozen
                    </span>
                </div>

                <div className="stage36-specimen__api">
                    <span>
                        canopy
                    </span>

                    <i />

                    <span>
                        extension
                    </span>
                </div>
            </div>

            <div
                className="stage36-specimen__readout"
                aria-hidden="true"
            >
                <span>
                    x 128
                </span>
                <span>
                    y 64
                </span>
                <span>
                    z −32
                </span>
                <span>
                    tps 20.0
                </span>
            </div>
        </div>
    );
}

function CapabilityHero() {
    const [
        activeId,
        setActiveId,
    ] = useState<HeroCapabilityId>(
        heroCapabilities[0].id,
    );

    const activeCapability =
        heroCapabilities.find(
            (
                capability,
            ) =>
                capability.id
                === activeId,
        )
        ?? heroCapabilities[0];

    return (
        <section
            className="stage36-hero"
            data-stage36-hero
            aria-labelledby="stage36-hero-title"
        >
            <div className="stage36-shell stage36-hero__layout">
                <div className="stage36-hero__copy">
                    <p className="stage36-kicker">
                        {homepageCopy.eyebrow}
                    </p>

                    <h1
                        id="stage36-hero-title"
                    >
                        {homepageCopy.title}
                    </h1>

                    <p className="stage36-hero__intro">
                        {homepageCopy.introduction}
                    </p>

                    <div className="stage36-actions">
                        <Link
                            href="/projects/canopy"
                            className="stage36-button stage36-button--solid"
                        >
                            {homepageCopy.primaryAction}
                            <span aria-hidden="true">
                                ↗
                            </span>
                        </Link>

                        <a
                            href="#stage36-projects"
                            className="stage36-button stage36-button--line"
                        >
                            {homepageCopy.secondaryAction}
                            <span aria-hidden="true">
                                ↓
                            </span>
                        </a>
                    </div>
                </div>

                <div className="stage36-hero__system">
                    <div
                        className="stage36-capabilities"
                        role="tablist"
                        aria-label="ForestOfLight capabilities"
                    >
                        {heroCapabilities.map(
                            (
                                capability,
                                index,
                            ) => {
                                const selected =
                                    capability.id
                                    === activeId;

                                return (
                                    <button
                                        key={capability.id}
                                        type="button"
                                        role="tab"
                                        id={`stage36-tab-${capability.id}`}
                                        aria-controls="stage36-capability-panel"
                                        aria-selected={selected}
                                        tabIndex={
                                            selected
                                                ? 0
                                                : -1
                                        }
                                        className="stage36-capability"
                                        data-active={selected}
                                        onClick={() =>
                                            setActiveId(
                                                capability.id,
                                            )
                                        }
                                        onFocus={() =>
                                            setActiveId(
                                                capability.id,
                                            )
                                        }
                                        onKeyDown={(
                                            event: KeyboardEvent<HTMLButtonElement>,
                                        ) => {
                                            if (
                                                event.key
                                                !== "ArrowDown"
                                                && event.key
                                                !== "ArrowRight"
                                                && event.key
                                                !== "ArrowUp"
                                                && event.key
                                                !== "ArrowLeft"
                                            ) {
                                                return;
                                            }

                                            event.preventDefault();

                                            const direction =
                                                event.key
                                                    === "ArrowDown"
                                                || event.key
                                                    === "ArrowRight"
                                                    ? 1
                                                    : -1;

                                            const nextIndex =
                                                (
                                                    index
                                                    + direction
                                                    + heroCapabilities.length
                                                )
                                                % heroCapabilities.length;

                                            const next =
                                                document.getElementById(
                                                    `stage36-tab-${heroCapabilities[nextIndex].id}`,
                                                );

                                            if (
                                                next
                                                instanceof HTMLElement
                                            ) {
                                                next.focus();
                                            }
                                        }}
                                    >
                                        <span className="stage36-capability__number">
                                            {String(
                                                index
                                                + 1,
                                            ).padStart(
                                                2,
                                                "0",
                                            )}
                                        </span>

                                        <span className="stage36-capability__label">
                                            {capability.label}
                                        </span>

                                        <span
                                            className="stage36-capability__arrow"
                                            aria-hidden="true"
                                        >
                                            →
                                        </span>
                                    </button>
                                );
                            },
                        )}
                    </div>

                    <div
                        id="stage36-capability-panel"
                        role="tabpanel"
                        aria-labelledby={`stage36-tab-${activeCapability.id}`}
                        className="stage36-capability-panel"
                    >
                        <div className="stage36-capability-panel__copy">
                            <p>
                                {activeCapability.eyebrow}
                            </p>

                            <h2>
                                {activeCapability.label}
                            </h2>

                            <span>
                                {activeCapability.description}
                            </span>

                            <ul aria-label="Technical concepts">
                                {activeCapability.technicalLabels.map(
                                    (
                                        label,
                                    ) => (
                                        <li key={label}>
                                            {label}
                                        </li>
                                    ),
                                )}
                            </ul>
                        </div>

                        <WorldSpecimen
                            state={activeCapability.id}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function RepositoryIndex() {
    const [
        query,
        setQuery,
    ] = useState("");

    const [
        activeSlug,
        setActiveSlug,
    ] = useState<RepositorySlug>(
        repositoryIndex[0].slug,
    );

    const normalized =
        query
            .trim()
            .toLowerCase();

    const projects =
        useMemo(
            () =>
                repositoryIndex.filter(
                    (
                        project,
                    ) => {
                        if (!normalized) {
                            return true;
                        }

                        return [
                            project.name,
                            project.description,
                            project.language,
                            project.category,
                            project.relationship,
                        ]
                            .join(" ")
                            .toLowerCase()
                            .includes(
                                normalized,
                            );
                    },
                ),
            [
                normalized,
            ],
        );

    const activeProject =
        projects.find(
            (
                project,
            ) =>
                project.slug
                === activeSlug,
        )
        ?? projects[0];

    return (
        <section
            id="stage36-projects"
            className="stage36-projects"
            data-stage36-project-index
            aria-labelledby="stage36-projects-title"
        >
            <div className="stage36-shell">
                <header className="stage36-projects__header">
                    <div>
                        <p className="stage36-kicker">
                            Complete project index
                        </p>

                        <h2
                            id="stage36-projects-title"
                        >
                            Every repository, near the top.
                        </h2>
                    </div>

                    <p>
                        Canopy leads the ecosystem. Extensions,
                        independent addons, server tooling,
                        libraries, examples, guides, and testing
                        infrastructure remain directly reachable.
                    </p>
                </header>

                <div className="stage36-projects__search">
                    <label htmlFor="stage36-project-search">
                        Find a repository
                    </label>

                    <input
                        id="stage36-project-search"
                        type="search"
                        value={query}
                        onChange={(
                            event: ChangeEvent<HTMLInputElement>,
                        ) =>
                            setQuery(
                                event.target.value,
                            )
                        }
                        placeholder="Project, purpose, language, relationship…"
                        autoComplete="off"
                    />

                    <span
                        role="status"
                        aria-live="polite"
                    >
                        {projects.length}
                        {" "}
                        of
                        {" "}
                        {repositoryIndex.length}
                    </span>
                </div>

                <div className="stage36-projects__layout">
                    <ol className="stage36-project-list">
                        {projects.map(
                            (
                                project,
                            ) => {
                                const selected =
                                    project.slug
                                    === activeProject?.slug;

                                return (
                                    <li
                                        key={project.slug}
                                        data-stage36-project-row
                                        data-active={selected}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setActiveSlug(
                                                    project.slug,
                                                )
                                            }
                                            onFocus={() =>
                                                setActiveSlug(
                                                    project.slug,
                                                )
                                            }
                                            onMouseEnter={() =>
                                                setActiveSlug(
                                                    project.slug,
                                                )
                                            }
                                            aria-pressed={selected}
                                        >
                                            <span className="stage36-project-list__number">
                                                {String(
                                                    project.position,
                                                ).padStart(
                                                    2,
                                                    "0",
                                                )}
                                            </span>

                                            <span className="stage36-project-list__name">
                                                {project.name}
                                            </span>

                                            <span className="stage36-project-list__kind">
                                                {project.category}
                                            </span>
                                        </button>

                                        <Link
                                            href={project.projectHref}
                                            aria-label={`Open ${project.name} project page`}
                                        >
                                            Open
                                            <span aria-hidden="true">
                                                ↗
                                            </span>
                                        </Link>
                                    </li>
                                );
                            },
                        )}
                    </ol>

                    {activeProject ? (
                        <aside
                            className="stage36-project-preview"
                            aria-live="polite"
                            aria-label={`${activeProject.name} preview`}
                        >
                            <div className="stage36-project-preview__meta">
                                <span>
                                    {activeProject.category}
                                </span>

                                <span>
                                    {activeProject.relationship}
                                </span>
                            </div>

                            <h3>
                                {activeProject.name}
                            </h3>

                            <p>
                                {activeProject.description}
                            </p>

                            <dl>
                                <div>
                                    <dt>
                                        Language
                                    </dt>
                                    <dd>
                                        {activeProject.language}
                                    </dd>
                                </div>

                                <div>
                                    <dt>
                                        Documentation
                                    </dt>
                                    <dd>
                                        {activeProject.counts.documents}
                                        {" "}
                                        source
                                        {activeProject.counts.documents === 1
                                            ? ""
                                            : "s"}
                                    </dd>
                                </div>

                                <div>
                                    <dt>
                                        Releases
                                    </dt>
                                    <dd>
                                        {activeProject.counts.versions}
                                    </dd>
                                </div>

                                <div>
                                    <dt>
                                        Downloads
                                    </dt>
                                    <dd>
                                        {activeProject.counts.releaseAssets}
                                    </dd>
                                </div>
                            </dl>

                            <ul>
                                {activeProject.counts.commands > 0 ? (
                                    <li>
                                        {activeProject.counts.commands}
                                        {" "}
                                        commands
                                    </li>
                                ) : null}

                                {activeProject.counts.globalRules > 0 ? (
                                    <li>
                                        {activeProject.counts.globalRules}
                                        {" "}
                                        documented rules
                                    </li>
                                ) : null}

                                {activeProject.counts.functions > 0 ? (
                                    <li>
                                        {activeProject.counts.functions}
                                        {" "}
                                        indexed functions
                                    </li>
                                ) : null}

                                <li>
                                    {activeProject.relationship}
                                </li>
                            </ul>

                            <div className="stage36-project-preview__actions">
                                <Link
                                    href={activeProject.projectHref}
                                    className="stage36-button stage36-button--solid"
                                >
                                    Project page
                                    <span aria-hidden="true">
                                        ↗
                                    </span>
                                </Link>

                                <Link
                                    href={activeProject.archiveHref}
                                    className="stage36-button stage36-button--line"
                                >
                                    Archive
                                    <span aria-hidden="true">
                                        →
                                    </span>
                                </Link>

                                <Link
                                    href={activeProject.docsHref}
                                    className="stage36-source-link"
                                >
                                    Documentation
                                    <span aria-hidden="true">
                                        →
                                    </span>
                                </Link>

                                <a
                                    href={activeProject.sourceHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="stage36-source-link"
                                >
                                    Source
                                    <span aria-hidden="true">
                                        ↗
                                    </span>
                                </a>
                            </div>
                        </aside>
                    ) : (
                        <div className="stage36-project-preview stage36-project-preview--empty">
                            <h3>
                                No matching repositories
                            </h3>

                            <p>
                                Clear the search or use a broader
                                project, purpose, language, or relationship.
                            </p>

                            <button
                                type="button"
                                className="stage36-button stage36-button--solid"
                                onClick={() =>
                                    setQuery(
                                        "",
                                    )
                                }
                            >
                                Show every repository
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export function Stage36Top() {
    return (
        <>
            <CapabilityHero />
            <RepositoryIndex />
        </>
    );
}
