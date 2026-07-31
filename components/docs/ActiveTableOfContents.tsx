"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

type TocSection = {
    title: string;
    level: number;
    anchor: string;
};

export function ActiveTableOfContents({
    sections,
}: {
    sections:
        TocSection[];
}) {
    const stableSections =
        useMemo(
            () =>
                sections.filter(
                    (section) =>
                        Boolean(
                            section.anchor,
                        ),
                ),
            [
                sections,
            ],
        );

    const [
        activeAnchor,
        setActiveAnchor,
    ] = useState(
        stableSections[0]
            ?.anchor
        ?? "",
    );

    useEffect(
        () => {
            const elements =
                stableSections
                    .map(
                        (section) =>
                            document
                                .getElementById(
                                    section.anchor,
                                ),
                    )
                    .filter(
                        (
                            element,
                        ): element is HTMLElement =>
                            element
                            instanceof HTMLElement,
                    );

            if (
                elements.length
                === 0
            ) {
                return;
            }

            const visible =
                new Map<
                    string,
                    number
                >();

            const observer =
                new IntersectionObserver(
                    (entries) => {
                        for (
                            const entry
                            of entries
                        ) {
                            if (
                                entry.isIntersecting
                            ) {
                                visible.set(
                                    entry
                                        .target
                                        .id,
                                    entry
                                        .intersectionRatio,
                                );
                            } else {
                                visible.delete(
                                    entry
                                        .target
                                        .id,
                                );
                            }
                        }

                        const active =
                            [
                                ...visible
                                    .entries(),
                            ]
                                .sort(
                                    (
                                        first,
                                        second,
                                    ) =>
                                        second[1]
                                        - first[1],
                                )[0];

                        if (active) {
                            setActiveAnchor(
                                active[0],
                            );
                        }
                    },
                    {
                        rootMargin:
                            "-15% 0px -68% 0px",
                        threshold: [
                            0,
                            0.25,
                            0.5,
                            0.75,
                            1,
                        ],
                    },
                );

            for (
                const element
                of elements
            ) {
                observer.observe(
                    element,
                );
            }

            const handleHashChange =
                () => {
                    const hash =
                        decodeURIComponent(
                            window.location
                                .hash
                                .slice(1),
                        );

                    if (hash) {
                        setActiveAnchor(
                            hash,
                        );
                    }
                };

            window.addEventListener(
                "hashchange",
                handleHashChange,
            );

            return () => {
                observer.disconnect();

                window.removeEventListener(
                    "hashchange",
                    handleHashChange,
                );
            };
        },
        [
            stableSections,
        ],
    );

    if (
        stableSections.length
        === 0
    ) {
        return (
            <p className="mt-5 text-xs font-medium leading-5 text-slate-400">
                This page has no
                additional headings.
            </p>
        );
    }

    return (
        <nav
            data-doc-toc
            aria-label="On this page"
            className="mt-5 space-y-1"
        >
            {stableSections.map(
                (
                    section,
                    index,
                ) => {
                    const active =
                        section.anchor
                        === activeAnchor;

                    return (
                        <a
                            key={`${section.anchor}-${index}`}
                            href={`#${section.anchor}`}
                            data-toc-link
                            aria-current={
                                active
                                    ? "location"
                                    : undefined
                            }
                            className={`block break-words border-l py-1.5 text-xs font-bold leading-5 transition ${
                                section.level
                                <= 2
                                    ? "pl-3"
                                    : "pl-6"
                            } ${
                                active
                                    ? "border-violet-500 text-violet-700"
                                    : "border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-700"
                            }`}
                        >
                            {
                                section.title
                            }
                        </a>
                    );
                },
            )}
        </nav>
    );
}
