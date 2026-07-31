"use client";

import Image from "next/image";
import {
    useState,
} from "react";

type DocumentationMediaProps = {
    path: string;
    width: number;
    height: number;
    alt: string;
    animated: boolean;
    bytes: number;
    compact: boolean;
};

function formattedBytes(
    bytes: number,
): string {
    if (
        bytes
        < 1_024
    ) {
        return `${bytes} B`;
    }

    if (
        bytes
        < 1_048_576
    ) {
        return `${(
            bytes
            / 1_024
        ).toFixed(
            0,
        )} KB`;
    }

    return `${(
        bytes
        / 1_048_576
    ).toFixed(
        1,
    )} MB`;
}

export function DocumentationMedia({
    path,
    width,
    height,
    alt,
    animated,
    bytes,
    compact,
}: DocumentationMediaProps) {
    const [
        revealed,
        setRevealed,
    ] = useState(
        !animated,
    );


    const [
        failed,
        setFailed,
    ] = useState(
        false,
    );

    const label =
        alt.trim()
        || (
            animated
                ? "Repository animation"
                : "Repository image"
        );

    if (
        failed
    ) {
        return (
            <span
                role="note"
                data-doc-media-fallback
                className="my-6 block border-l border-white/15 py-1 pl-4 text-sm leading-6 text-slate-400"
            >
                {label} is unavailable in the captured repository media.
            </span>
        );
    }

    if (
        animated
        && !revealed
    ) {
        return (
            <span
                data-doc-media
                data-media-kind="deferred-animation"
                className="my-9 block overflow-hidden rounded-[1.5rem] border border-emerald-200 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_40%),linear-gradient(135deg,#f8fffc,#f5f3ff)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
            >
                <span className="flex min-h-44 flex-col items-start justify-between gap-8 rounded-[1.15rem] border border-white/80 bg-white/75 p-6 backdrop-blur-sm sm:flex-row sm:items-center">
                    <span className="min-w-0">
                        <span className="block text-[0.68rem] font-black uppercase tracking-[0.18em] text-emerald-700">
                            Deferred animation
                        </span>

                        <span className="mt-3 block break-words text-lg font-black tracking-[-0.025em] text-slate-950">
                            {label}
                        </span>

                        <span className="mt-2 block max-w-xl text-sm font-semibold leading-6 text-slate-600">
                            This repository animation is loaded only when requested,
                            keeping the documentation page immediate on mobile and
                            slower connections.
                        </span>
                    </span>

                    <button
                        type="button"
                        aria-label={`Load animation: ${label}`}
                        onClick={() => {
                            setRevealed(
                                true,
                            );
                        }}
                        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-full border border-emerald-700 bg-emerald-700 px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(5,150,105,0.24)] transition hover:-translate-y-0.5 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                    >
                        <span aria-hidden="true">
                            ▶
                        </span>

                        Load animation

                        <span className="rounded-full bg-white/15 px-2 py-1 text-[0.65rem] uppercase tracking-[0.1em]">
                            {formattedBytes(
                                bytes,
                            )}
                        </span>
                    </button>
                </span>
            </span>
        );
    }

    if (
        compact
    ) {
        return (
            <span
                data-doc-media
                data-media-kind="badge"
                className="mx-1 inline-flex max-w-full align-middle"
            >
                <Image
                    src={path}
                    width={width}
                    height={height}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    unoptimized={animated}
                    quality={72}
                    sizes="(max-width: 768px) 44vw, 260px"
                    className="h-auto max-h-12 w-auto max-w-full object-contain"
                    onError={() => {
                        setFailed(
                            true,
                        );
                    }}
                />
            </span>
        );
    }

    return (
        <span
            data-doc-media
            data-media-kind={
                animated
                    ? "animation"
                    : "figure"
            }
            className="my-9 block overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
        >
            <Image
                src={path}
                width={width}
                height={height}
                alt={alt}
                loading="lazy"
                decoding="async"
                unoptimized={animated}
                quality={72}
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 86vw, 860px"
                className="h-auto w-full rounded-[1.1rem] object-contain"
                onError={() => {
                    setFailed(
                        true,
                    );
                }}
            />

            {alt ? (
                <span className="block px-3 pb-2 pt-3 text-center text-xs font-bold leading-5 text-slate-500">
                    {alt}
                </span>
            ) : null}
        </span>
    );
}
