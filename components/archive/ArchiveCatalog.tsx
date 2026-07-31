"use client";

import Image from "next/image";

import {
    useMemo,
    useState,
} from "react";

import ArchiveInlineText from "@/components/archive/ArchiveInlineText";

import type {
    CuratedBlock,
    CuratedDocument,
    CuratedEntry,
} from "@/lib/curated-archive-types";

function normalize(
    value: string,
): string {
    return value
        .normalize(
            "NFKD",
        )
        .replace(
            /[\u0300-\u036f]/g,
            "",
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            " ",
        )
        .trim();
}

function blockText(
    block: CuratedBlock,
): string {
    if (
        block.type
        === "paragraph"
        || block.type
            === "quote"
        || block.type
            === "heading"
    ) {
        return block.text;
    }

    if (
        block.type
        === "list"
    ) {
        return block.items.join(
            " ",
        );
    }

    if (
        block.type
        === "code"
    ) {
        return block.text;
    }

    if (
        block.type
        === "image"
    ) {
        return [
            block.alt,
            block.caption,
        ]
            .filter(
                Boolean,
            )
            .join(
                " ",
            );
    }

    return "";
}

function entryText(
    entry: CuratedEntry,
): string {
    return normalize(
        [
            entry.name,
            entry.group,
            ...entry.usage,
            ...Object.values(
                entry.metadata,
            ),
            ...entry.blocks.map(
                blockText,
            ),
        ].join(
            " ",
        ),
    );
}

function CatalogBlocks({
    blocks,
}: {
    blocks: CuratedBlock[];
}) {
    return (
        <div className="curated-catalog__body">
            {blocks.map(
                (
                    block,
                    index,
                ) => {
                    if (
                        block.type
                        === "paragraph"
                    ) {
                        return (
                            <p
                                key={`p-${index}`}
                            >
                                <ArchiveInlineText
                                    text={block.text}
                                />
                            </p>
                        );
                    }

                    if (
                        block.type
                        === "list"
                    ) {
                        const Tag =
                            block.ordered
                                ? "ol"
                                : "ul";

                        return (
                            <Tag
                                key={`list-${index}`}
                            >
                                {block.items.map(
                                    (
                                        item,
                                        itemIndex,
                                    ) => (
                                        <li
                                            key={`${item}-${itemIndex}`}
                                        >
                                            <ArchiveInlineText
                                                text={item}
                                            />
                                        </li>
                                    ),
                                )}
                            </Tag>
                        );
                    }

                    if (
                        block.type
                        === "code"
                    ) {
                        return (
                            <pre
                                key={`code-${index}`}
                            >
                                <code>
                                    {block.text}
                                </code>
                            </pre>
                        );
                    }

                    if (
                        block.type
                        === "quote"
                    ) {
                        return (
                            <blockquote
                                key={`quote-${index}`}
                            >
                                <ArchiveInlineText
                                    text={block.text}
                                />
                            </blockquote>
                        );
                    }

                    if (
                        block.type
                        === "image"
                    ) {
                        return (
                            <figure
                                key={`image-${block.src}-${index}`}
                                className="curated-catalog__figure"
                            >
                                <Image
                                    src={block.src}
                                    alt={block.alt}
                                    width={
                                        block.width
                                        ?? (
                                            block.src.includes(
                                                "/_curated-archive/canopy/dupe-tnt.png",
                                            )
                                                ? 1474
                                                : 1200
                                        )
                                    }
                                    height={
                                        block.height
                                        ?? (
                                            block.src.includes(
                                                "/_curated-archive/canopy/dupe-tnt.png",
                                            )
                                                ? 1570
                                                : 1200
                                        )
                                    }
                                    sizes="(max-width: 800px) 100vw, 680px"
                                />

                                {block.caption ? (
                                    <figcaption>
                                        {block.caption}
                                    </figcaption>
                                ) : null}
                            </figure>
                        );
                    }

                    if (
                        block.type
                        === "heading"
                    ) {
                        return (
                            <h4
                                key={`heading-${index}`}
                            >
                                {block.text}
                            </h4>
                        );
                    }

                    return (
                        <hr
                            key={`rule-${index}`}
                        />
                    );
                },
            )}
        </div>
    );
}

function flatten(
    documents: CuratedDocument[],
): CuratedEntry[] {
    return documents.flatMap(
        (
            document,
        ) =>
            document.entries
            ?? [],
    );
}

const INITIAL_VISIBLE_ENTRIES =
    12;

const VISIBLE_ENTRY_STEP =
    12;

export default function ArchiveCatalog({
    documents,
    sectionLabel,
    sectionId,
}: {
    documents: CuratedDocument[];
    sectionLabel: string;
    sectionId: string;
}) {
    const entries =
        useMemo(
            () =>
                flatten(
                    documents,
                ),
            [
                documents,
            ],
        );

    const indexedEntries =
        useMemo(
            () =>
                entries.map(
                    (
                        entry,
                        sourceIndex,
                    ) => ({
                        entry,
                        sourceIndex,
                    }),
                ),
            [
                entries,
            ],
        );

    const groups =
        useMemo(
            () => {
                const output: string[] = [];

                for (
                    const record
                    of indexedEntries
                ) {
                    const entry =
                        record.entry;

                    if (
                        entry.group
                        && !output.includes(
                            entry.group,
                        )
                    ) {
                        output.push(
                            entry.group,
                        );
                    }
                }

                return output;
            },
            [
                indexedEntries,
            ],
        );

    const [
        query,
        setQuery,
    ] = useState(
        "",
    );

    const [
        group,
        setGroup,
    ] = useState(
        "all",
    );

    const [
        visibleCount,
        setVisibleCount,
    ] = useState(
        INITIAL_VISIBLE_ENTRIES,
    );

    const normalizedQuery =
        normalize(
            query,
        );

    const filtered =
        useMemo(
            () =>
                indexedEntries.filter(
                    (
                        record,
                    ) => {
                        const entry =
                            record.entry;

                        return (
                            group
                            === "all"
                            || entry.group
                                === group
                        )
                        && (
                            !normalizedQuery
                            || entryText(
                                entry,
                            ).includes(
                                normalizedQuery,
                            )
                        );
                    },
                ),
            [
                indexedEntries,
                group,
                normalizedQuery,
            ],
        );

    const visibleEntries =
        filtered.slice(
            0,
            visibleCount,
        );

    const remainingEntries =
        Math.max(
            0,
            filtered.length
            - visibleEntries.length,
        );

    return (
        <div
            className="curated-catalog"
            data-curated-catalog
        >
            <div className="curated-catalog__controls">
                <label className="curated-catalog__search">
                    <span>
                        Search {sectionLabel}
                    </span>

                    <input
                        type="search"
                        value={query}
                        onChange={
                            (
                                event,
                            ) =>
                                {
                                    setQuery(
                                        event.target.value,
                                    );
                                    setVisibleCount(
                                        INITIAL_VISIBLE_ENTRIES,
                                    );
                                }
                        }
                        placeholder={`Search ${entries.length.toLocaleString(
                            "en-US",
                        )} entries`}
                        autoComplete="off"
                    />
                </label>

                {groups.length
                    > 1 ? (
                        <label className="curated-catalog__group">
                            <span>
                                Group
                            </span>

                            <select
                                value={group}
                                onChange={
                                    (
                                        event,
                                    ) =>
                                        {
                                            setGroup(
                                                event.target.value,
                                            );
                                            setVisibleCount(
                                                INITIAL_VISIBLE_ENTRIES,
                                            );
                                        }
                                }
                            >
                                <option value="all">
                                    All groups
                                </option>

                                {groups.map(
                                    (
                                        item,
                                    ) => (
                                        <option
                                            key={item}
                                            value={item}
                                        >
                                            {item}
                                        </option>
                                    ),
                                )}
                            </select>
                        </label>
                    ) : null}

                <p
                    className="curated-catalog__result-count"
                    aria-live="polite"
                >
                    {filtered.length.toLocaleString(
                        "en-US",
                    )}
                    {" "}
                    {filtered.length
                        === 1
                            ? "entry"
                            : "entries"}
                </p>
            </div>

            <div className="curated-catalog__entries">
                {visibleEntries.map(
                    (
                        record,
                        index,
                    ) => {
                        const entry =
                            record.entry;

                        const entryId =
                            `${sectionId}-${entry.id}-${record.sourceIndex + 1}`;

                        return (
                        <details
                            key={entryId}
                            id={entryId}
                            className="curated-catalog__entry"
                            open={
                                index
                                === 0
                                && !query
                            }
                        >
                            <summary>
                                <span className="curated-catalog__ordinal">
                                    {String(
                                        index
                                        + 1,
                                    ).padStart(
                                        2,
                                        "0",
                                    )}
                                </span>

                                <span className="curated-catalog__name">
                                    {entry.name}
                                </span>

                                {entry.group ? (
                                    <span className="curated-catalog__badge">
                                        {entry.group}
                                    </span>
                                ) : null}

                                <span
                                    aria-hidden="true"
                                    className="curated-catalog__toggle"
                                >
                                    +
                                </span>
                            </summary>

                            <div className="curated-catalog__content">
                                {entry.usage.length ? (
                                    <div className="curated-catalog__usage">
                                        <p>
                                            Usage
                                        </p>

                                        {entry.usage.map(
                                            (
                                                usage,
                                            ) => (
                                                <code
                                                    key={usage}
                                                >
                                                    {usage}
                                                </code>
                                            ),
                                        )}
                                    </div>
                                ) : null}

                                {Object.keys(
                                    entry.metadata,
                                ).length ? (
                                    <dl className="curated-catalog__metadata">
                                        {Object.entries(
                                            entry.metadata,
                                        ).map(
                                            ([
                                                key,
                                                value,
                                            ]) => (
                                                <div
                                                    key={key}
                                                >
                                                    <dt>
                                                        {key}
                                                    </dt>

                                                    <dd>
                                                        {value}
                                                    </dd>
                                                </div>
                                            ),
                                        )}
                                    </dl>
                                ) : null}

                                <CatalogBlocks
                                    blocks={entry.blocks}
                                />
                            </div>
                        </details>
                        );
                    },
                )}

                {remainingEntries > 0 ? (
                    <div className="curated-catalog__load-more">
                        <button
                            type="button"
                            onClick={
                                () =>
                                    setVisibleCount(
                                        (
                                            current,
                                        ) =>
                                            Math.min(
                                                filtered.length,
                                                current
                                                + VISIBLE_ENTRY_STEP,
                                            ),
                                    )
                            }
                        >
                            Load {Math.min(
                                remainingEntries,
                                VISIBLE_ENTRY_STEP,
                            ).toLocaleString(
                                "en-US",
                            )} more
                        </button>

                        <span>
                            {visibleEntries.length.toLocaleString(
                                "en-US",
                            )}
                            {" of "}
                            {filtered.length.toLocaleString(
                                "en-US",
                            )}
                        </span>
                    </div>
                ) : null}

                {!filtered.length ? (
                    <div className="curated-catalog__empty">
                        <p>
                            No entries match this search.
                        </p>

                        <button
                            type="button"
                            onClick={
                                () => {
                                    setQuery(
                                        "",
                                    );
                                    setGroup(
                                        "all",
                                    );
                                    setVisibleCount(
                                        INITIAL_VISIBLE_ENTRIES,
                                    );
                                }
                            }
                        >
                            Reset filters
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
