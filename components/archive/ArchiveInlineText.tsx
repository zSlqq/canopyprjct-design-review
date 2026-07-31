import {
    Fragment,
} from "react";

const tokenPattern =
    /(`[^`]+`|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)]+)/g;

function external(
    href: string,
): boolean {
    return /^https?:\/\//i.test(
        href,
    );
}

export default function ArchiveInlineText({
    text,
}: {
    text: string;
}) {
    const parts =
        text.split(
            tokenPattern,
        );

    return (
        <>
            {parts.map(
                (
                    part,
                    index,
                ) => {
                    const code =
                        part.match(
                            /^`([^`]+)`$/,
                        );

                    if (code) {
                        return (
                            <code
                                key={`${part}-${index}`}
                                className="curated-inline-code"
                            >
                                {code[
                                    1
                                ]}
                            </code>
                        );
                    }

                    const markdownLink =
                        part.match(
                            /^\[([^\]]+)\]\(([^)]+)\)$/,
                        );

                    if (markdownLink) {
                        const [
                            ,
                            label,
                            href,
                        ] = markdownLink;

                        return (
                            <a
                                key={`${part}-${index}`}
                                href={href}
                                target={
                                    external(
                                        href,
                                    )
                                        ? "_blank"
                                        : undefined
                                }
                                rel={
                                    external(
                                        href,
                                    )
                                        ? "noreferrer"
                                        : undefined
                                }
                                className="curated-inline-link"
                            >
                                {label}
                            </a>
                        );
                    }

                    if (
                        /^https?:\/\//i.test(
                            part,
                        )
                    ) {
                        return (
                            <a
                                key={`${part}-${index}`}
                                href={part}
                                target="_blank"
                                rel="noreferrer"
                                className="curated-inline-link"
                            >
                                {part}
                            </a>
                        );
                    }

                    return (
                        <Fragment
                            key={`${part}-${index}`}
                        >
                            {part}
                        </Fragment>
                    );
                },
            )}
        </>
    );
}
