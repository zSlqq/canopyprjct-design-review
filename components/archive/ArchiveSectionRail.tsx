"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

type RailItem = {
    id: string;
    label: string;
    count: number;
};

export default function ArchiveSectionRail({
    items,
    projectName,
}: {
    items: RailItem[];
    projectName: string;
}) {
    const [
        active,
        setActive,
    ] = useState(
        items[
            0
        ]?.id
        ?? "",
    );

    const ids =
        useMemo(
            () =>
                items.map(
                    (
                        item,
                    ) =>
                        item.id,
                ),
            [
                items,
            ],
        );

    useEffect(
        () => {
            if (
                !(
                    "IntersectionObserver"
                    in window
                )
                || !ids.length
            ) {
                return;
            }

            const observer =
                new IntersectionObserver(
                    (
                        entries,
                    ) => {
                        const visible =
                            entries
                                .filter(
                                    (
                                        entry,
                                    ) =>
                                        entry.isIntersecting,
                                )
                                .sort(
                                    (
                                        left,
                                        right,
                                    ) =>
                                        right.intersectionRatio
                                        - left.intersectionRatio,
                                );

                        const id =
                            visible[
                                0
                            ]?.target.id;

                        if (id) {
                            setActive(
                                id,
                            );
                        }
                    },
                    {
                        rootMargin:
                            "-18% 0px -68% 0px",
                        threshold: [
                            0.08,
                            0.25,
                            0.6,
                        ],
                    },
                );

            const elements =
                ids
                    .map(
                        (
                            id,
                        ) =>
                            document.getElementById(
                                id,
                            ),
                    )
                    .filter(
                        (
                            element,
                        ): element is HTMLElement =>
                            Boolean(
                                element,
                            ),
                    );

            elements.forEach(
                (
                    element,
                ) =>
                    observer.observe(
                        element,
                    ),
            );

            return () =>
                observer.disconnect();
        },
        [
            ids,
        ],
    );

    return (
        <nav
            aria-label={`${projectName} page sections`}
            className="curated-rail"
            data-curated-section-rail
        >
            <div className="curated-rail__track">
                {items.map(
                    (
                        item,
                        index,
                    ) => (
                        <a
                            key={item.id}
                            href={`#${item.id}`}
                            aria-current={
                                active
                                === item.id
                                    ? "location"
                                    : undefined
                            }
                            className="curated-rail__link"
                        >
                            <span
                                aria-hidden="true"
                                className="curated-rail__index"
                            >
                                {String(
                                    index
                                    + 1,
                                ).padStart(
                                    2,
                                    "0",
                                )}
                            </span>

                            <span className="curated-rail__label">
                                {item.label}
                            </span>

                            {item.count
                                > 0 ? (
                                    <span className="curated-rail__count">
                                        {new Intl.NumberFormat(
                                            "en-US",
                                        ).format(
                                            item.count,
                                        )}
                                    </span>
                                ) : null}
                        </a>
                    ),
                )}
            </div>
        </nav>
    );
}
