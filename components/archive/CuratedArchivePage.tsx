import Image from "next/image";

import Link from "next/link";

import ArchiveCatalog from "@/components/archive/ArchiveCatalog";
import ArchiveSectionRail from "@/components/archive/ArchiveSectionRail";
import CuratedBlocks from "@/components/archive/CuratedBlocks";

import type {
    CuratedArchiveProject,
    CuratedRelease,
    CuratedSection,
} from "@/lib/curated-archive-types";

function number(
    value: number,
): string {
    return new Intl.NumberFormat(
        "en-US",
    ).format(
        value,
    );
}

function bytes(
    value: number,
): string {
    if (
        value
        < 1_024
    ) {
        return `${value} B`;
    }

    if (
        value
        < 1_048_576
    ) {
        return `${(
            value
            / 1_024
        ).toFixed(
            0,
        )} KB`;
    }

    if (
        value
        < 1_073_741_824
    ) {
        return `${(
            value
            / 1_048_576
        ).toFixed(
            1,
        )} MB`;
    }

    return `${(
        value
        / 1_073_741_824
    ).toFixed(
        2,
    )} GB`;
}

function date(
    value: string,
): string {
    if (!value) {
        return "Captured tag";
    }

    const parsed =
        new Date(
            value,
        );

    if (
        Number.isNaN(
            parsed.getTime(),
        )
    ) {
        return value;
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            dateStyle:
                "medium",
            timeZone:
                "UTC",
        },
    ).format(
        parsed,
    );
}

function SectionHeader({
    section,
}: {
    section: CuratedSection;
}) {
    return (
        <header className="curated-section__header">
            <p className="curated-section__eyebrow">
                {section.eyebrow}
            </p>

            <h2>
                {section.title}
            </h2>

            <p className="curated-section__description">
                {section.description}
            </p>
        </header>
    );
}

function ProseSection({
    section,
}: {
    section: CuratedSection;
}) {
    return (
        <div className="curated-documents">
            {section.documents?.map(
                (
                    document,
                    index,
                ) => (
                    <article
                        key={`${document.source}-${index}`}
                        className="curated-document"
                    >
                        {section.documents
                            && section.documents.length
                                > 1 ? (
                                    <header className="curated-document__header">
                                        <span>
                                            {String(
                                                index
                                                + 1,
                                            ).padStart(
                                                2,
                                                "0",
                                            )}
                                        </span>

                                        <h3>
                                            {document.title}
                                        </h3>
                                    </header>
                                ) : null}

                        <CuratedBlocks
                            blocks={
                                document.blocks
                                ?? []
                            }
                            idPrefix={`${section.id}-document-${index + 1}`}
                        />
                    </article>
                ),
            )}
        </div>
    );
}

function DownloadCard({
    release,
    featured,
}: {
    release: CuratedRelease;
    featured: boolean;
}) {
    return (
        <details
            className="curated-release"
            open={featured}
        >
            <summary>
                <div>
                    <span className="curated-release__date">
                        {date(
                            release.publishedAt,
                        )}
                    </span>

                    <h3>
                        {release.name}
                    </h3>

                    <p>
                        {release.tag}
                    </p>
                </div>

                <div className="curated-release__summary-meta">
                    {release.prerelease ? (
                        <span>
                            Pre-release
                        </span>
                    ) : null}

                    {!release.formalRelease ? (
                        <span>
                            Tag
                        </span>
                    ) : null}

                    <strong>
                        {release.downloads.length}
                        {" "}
                        files
                    </strong>
                </div>
            </summary>

            <div className="curated-release__body">
                {release.notes ? (
                    <p className="curated-release__notes">
                        {release.notes}
                    </p>
                ) : null}

                <div className="curated-release__downloads">
                    {release.downloads.map(
                        (
                            download,
                        ) => (
                            <a
                                key={`${release.tag}-${download.sha256}`}
                                href={download.href}
                                download={download.name}
                                className="curated-download"
                                data-local-download
                            >
                                <span className="curated-download__kind">
                                    {download.kind}
                                </span>

                                <strong>
                                    {download.name}
                                </strong>

                                <span className="curated-download__meta">
                                    {bytes(
                                        download.bytes,
                                    )}
                                    {" · "}
                                    SHA-256
                                    {" "}
                                    {download.sha256.slice(
                                        0,
                                        12,
                                    )}
                                </span>

                                <span className="curated-download__action">
                                    Download
                                </span>
                            </a>
                        ),
                    )}
                </div>
            </div>
        </details>
    );
}

function DownloadsSection({
    section,
}: {
    section: CuratedSection;
}) {
    return (
        <div className="curated-releases">
            {section.releases?.map(
                (
                    release,
                    index,
                ) => (
                    <DownloadCard
                        key={`${release.tag}-${index}`}
                        release={release}
                        featured={
                            index
                            === 0
                        }
                    />
                ),
            )}
        </div>
    );
}

function CodeSection({
    project,
    section,
}: {
    project: CuratedArchiveProject;
    section: CuratedSection;
}) {
    return (
        <div className="curated-code-grid">
            <article className="curated-code-card curated-code-card--primary">
                <p>
                    Upstream source
                </p>

                <h3>
                    {project.fullName}
                </h3>

                <p>
                    The source remains open for deliberate inspection,
                    contribution, and reuse under the repository’s stated
                    license.
                </p>

                <a
                    href={section.repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                >
                    Open source repository
                </a>
            </article>

            <article className="curated-code-card">
                <p>
                    Implementation index
                </p>

                <h3>
                    {number(
                        section.functions
                        ?? 0,
                    )}
                    {" "}
                    captured functions
                </h3>

                <p>
                    Browse the statically generated implementation index without
                    loading GitHub in the browser.
                </p>

                {(section.functions
                    ?? 0)
                    > 0 ? (
                        <Link
                            href={`/archive/${project.slug}/functions/1`}
                        >
                            Browse function index
                        </Link>
                    ) : (
                        <span>
                            No function index was detected.
                        </span>
                    )}
            </article>

            <article className="curated-code-card">
                <p>
                    License
                </p>

                <h3>
                    {section.license?.license
                    || project.license
                    || "Repository terms"}
                </h3>

                <p>
                    {section.license?.statement
                    || project.copyright.statement
                    || (
                        "Refer to the repository license file for exact terms."
                    )}
                </p>

                <dl>
                    <div>
                        <dt>
                            Default branch
                        </dt>

                        <dd>
                            {section.defaultBranch
                            || "Not reported"}
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Primary language
                        </dt>

                        <dd>
                            {section.language
                            || "Mixed"}
                        </dd>
                    </div>
                </dl>
            </article>
        </div>
    );
}

function ProjectCredits({
    project,
}: {
    project: CuratedArchiveProject;
}) {
    const hasContributors =
        project.contributors.length
        > 0;

    const legalStatement =
        project.copyright.statement
        || (
            project.license
                ? `Released under the ${project.license} license.`
                : "Refer to the repository license for exact terms."
        );

    if (
        !hasContributors
        && !project.support
        && !legalStatement
    ) {
        return null;
    }

    return (
        <div
            className="curated-info-credits"
            data-curated-project-credits
        >
            {hasContributors ? (
                <div className="curated-info-credits__contributors">
                    <header className="curated-info-credits__header">
                        <p className="curated-section__eyebrow">
                            Source order preserved
                        </p>

                        <h3>
                            Contributors
                        </h3>

                        <p>
                            Names remain in the order captured from GitHub.
                            Display names are used when available; repository
                            logins remain the fallback.
                        </p>
                    </header>

                    <ol className="curated-contributor-grid">
                        {project.contributors.map(
                            (
                                contributor,
                                index,
                            ) => (
                                <li
                                    key={`${contributor.login}-${index}`}
                                    data-contributor-login={contributor.login}
                                >
                                    <a
                                        href={contributor.profileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <Image
                                            src={contributor.avatar}
                                            alt=""
                                            width={72}
                                            height={72}
                                        />

                                        <span className="curated-contributor__rank">
                                            {String(
                                                index
                                                + 1,
                                            ).padStart(
                                                2,
                                                "0",
                                            )}
                                        </span>

                                        <span className="curated-contributor__identity">
                                            <strong>
                                                {contributor.displayName}
                                            </strong>

                                            <span>
                                                @{contributor.login}
                                            </span>
                                        </span>

                                        <span className="curated-contributor__count">
                                            {number(
                                                contributor.contributions,
                                            )}
                                            {" "}
                                            contributions
                                        </span>
                                    </a>
                                </li>
                            ),
                        )}
                    </ol>
                </div>
            ) : null}

            <div className="curated-info-credits__legal">
                <p className="curated-section__eyebrow">
                    Rights and license
                </p>

                <h3>
                    {project.copyright.license
                    || project.license
                    || "Repository terms"}
                </h3>

                <p>
                    {legalStatement}
                </p>
            </div>

            {project.support ? (
                <aside className="curated-support">
                    <div className="curated-support__signal">
                        <span />
                        <span />
                        <span />
                    </div>

                    <div>
                        <p className="curated-support__eyebrow">
                            Sustain the work
                        </p>

                        <h3>
                            {project.support.title}
                        </h3>

                        <p>
                            {project.support.description}
                        </p>
                    </div>

                    <a
                        href={project.support.href}
                        target="_blank"
                        rel="noreferrer"
                    >
                        {project.support.label}
                    </a>
                </aside>
            ) : null}
        </div>
    );
}

export default function CuratedArchivePage({
    project,
}: {
    project: CuratedArchiveProject;
}) {
    const jump =
        project.jump;

    return (
        <main
            className="curated-archive"
            data-curated-archive
            data-project-slug={project.slug}
        >
            <section className="curated-hero">
                <div
                    aria-hidden="true"
                    className="curated-hero__grid"
                />

                <div className="curated-hero__inner">
                    <div className="curated-hero__copy">
                        <p className="curated-hero__eyebrow">
                            {project.kind}
                        </p>

                        <h1>
                            {project.name}
                        </h1>

                        <p className="curated-hero__tagline">
                            {project.tagline}
                        </p>

                        <p className="curated-hero__description">
                            {project.description}
                        </p>

                        <div className="curated-hero__badges">
                            {project.language ? (
                                <span>
                                    {project.language}
                                </span>
                            ) : null}

                            {project.license ? (
                                <span>
                                    {project.license}
                                </span>
                            ) : null}

                            {project.archived ? (
                                <span>
                                    Archived upstream
                                </span>
                            ) : null}

                            {project.fork ? (
                                <span>
                                    Fork
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <dl className="curated-hero__metrics">
                        {[
                            [
                                "Versions",
                                project.counts.versions,
                            ],
                            [
                                "Downloads",
                                project.counts.releaseAssets,
                            ],
                            [
                                "Contributors",
                                project.counts.contributors,
                            ],
                            [
                                "Functions",
                                project.counts.functions,
                            ],
                        ].map(
                            ([
                                label,
                                value,
                            ]) => (
                                <div
                                    key={label}
                                >
                                    <dt>
                                        {label}
                                    </dt>

                                    <dd>
                                        {number(
                                            Number(
                                                value,
                                            ),
                                        )}
                                    </dd>
                                </div>
                            ),
                        )}
                    </dl>
                </div>
            </section>

            <ArchiveSectionRail
                items={jump}
                projectName={project.name}
            />

            <div className="curated-sections">
                {project.sections.map(
                    (
                        section,
                        index,
                    ) => (
                        <section
                            key={section.id}
                            id={section.id}
                            className={
                                index
                                % 2
                                    ? "curated-section curated-section--tinted"
                                    : "curated-section"
                            }
                            data-curated-section={section.id}
                        >
                            <div className="curated-section__inner">
                                <SectionHeader
                                    section={section}
                                />

                                {section.kind
                                    === "prose" ? (
                                        <ProseSection
                                            section={section}
                                        />
                                    ) : null}

                                {section.kind
                                    === "catalog" ? (
                                        <ArchiveCatalog
                                            documents={
                                                section.documents
                                                ?? []
                                            }
                                            sectionLabel={section.label}
                                            sectionId={section.id}
                                        />
                                    ) : null}

                                {section.kind
                                    === "downloads" ? (
                                        <DownloadsSection
                                            section={section}
                                        />
                                    ) : null}

                                {section.kind
                                    === "code" ? (
                                        <CodeSection
                                            project={project}
                                            section={section}
                                        />
                                    ) : null}


                                {section.id
                                    === "info" ? (
                                        <ProjectCredits
                                            project={project}
                                        />
                                    ) : null}
                            </div>
                        </section>
                    ),
                )}
            </div>


            {project.crossLinks.length ? (
                <section className="curated-cross-links">
                    <div className="curated-section__inner">
                        {project.crossLinks.map(
                            (
                                link,
                            ) => (
                                <Link
                                    key={link.slug}
                                    href={`/archive/${link.slug}`}
                                >
                                    <span>
                                        Related project
                                    </span>

                                    <strong>
                                        {link.label}
                                    </strong>

                                    <p>
                                        {link.description}
                                    </p>
                                </Link>
                            ),
                        )}
                    </div>
                </section>
            ) : null}
        </main>
    );
}
