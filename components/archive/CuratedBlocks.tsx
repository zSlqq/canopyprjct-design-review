import Image from "next/image";

import ArchiveInlineText from "@/components/archive/ArchiveInlineText";

import type {
    CuratedBlock,
} from "@/lib/curated-archive-types";

function headingTag(
    level: number,
): "h3" | "h4" | "h5" {
    if (
        level
        <= 2
    ) {
        return "h3";
    }

    if (
        level
        === 3
    ) {
        return "h4";
    }

    return "h5";
}

export default function CuratedBlocks({
    blocks,
    idPrefix,
}: {
    blocks: CuratedBlock[];
    idPrefix: string;
}) {
    return (
        <div className="curated-prose">
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
                                key={`paragraph-${index}`}
                            >
                                <ArchiveInlineText
                                    text={block.text}
                                />
                            </p>
                        );
                    }

                    if (
                        block.type
                        === "heading"
                    ) {
                        const Tag =
                            headingTag(
                                block.level,
                            );

                        return (
                            <Tag
                                key={`heading-${block.id}-${index}`}
                                id={`${idPrefix}-${block.id}-${index + 1}`}
                            >
                                {block.text}
                            </Tag>
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
                                data-language={
                                    block.language
                                    || undefined
                                }
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
                                className="curated-prose__figure"
                            >
                                <div className="curated-prose__image-frame">
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
                                        sizes="(max-width: 900px) 100vw, 720px"
                                        className="curated-prose__image"
                                    />
                                </div>

                                {block.caption ? (
                                    <figcaption>
                                        {block.caption}
                                    </figcaption>
                                ) : null}
                            </figure>
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
