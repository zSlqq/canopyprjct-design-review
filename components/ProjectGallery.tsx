"use client";

/* eslint-disable @next/next/no-img-element */

import {
    ImageIcon,
} from "lucide-react";
import { useState } from "react";

interface ProjectGalleryProps {
    title: string;
    screenshots: string[];
    accent: string;
}

export function ProjectGallery({
    title,
    screenshots,
    accent,
}: ProjectGalleryProps) {
    const [failedImages, setFailedImages] =
        useState<Record<number, boolean>>(
            {},
        );

    const previews = Array.from(
        {
            length: 3,
        },
        (_, index) =>
            screenshots[index] ?? "",
    );

    return (
        <div
            data-project-gallery
            className="grid gap-3 lg:grid-cols-[1.45fr_0.55fr]"
        >
            {previews.map(
                (
                    screenshot,
                    index,
                ) => {
                    const failed =
                        !screenshot ||
                        failedImages[index];

                    return (
                        <figure
                            key={
                                screenshot ||
                                index
                            }
                            className={`group relative min-h-[15rem] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#070b14] ${
                                index === 0
                                    ? "lg:row-span-2 lg:min-h-[34rem]"
                                    : "lg:min-h-0"
                            }`}
                        >
                            {!failed ? (
                                <img
                                    src={screenshot}
                                    alt={`${title} preview ${index + 1}`}
                                    loading={
                                        index === 0
                                            ? "eager"
                                            : "lazy"
                                    }
                                    onError={() =>
                                        setFailedImages(
                                            (
                                                current,
                                            ) => ({
                                                ...current,
                                                [index]:
                                                    true,
                                            }),
                                        )
                                    }
                                    className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.02] group-hover:opacity-100"
                                />
                            ) : (
                                <div
                                    className="absolute inset-0 grid place-items-center p-8 text-center"
                                    style={{
                                        backgroundImage:
                                            `radial-gradient(circle at 72% 18%, ${accent}55, transparent 34%), linear-gradient(145deg, ${accent}20, transparent 54%)`,
                                    }}
                                >
                                    <div>
                                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-white">
                                            <ImageIcon
                                                aria-hidden="true"
                                                size={22}
                                            />
                                        </span>

                                        <p className="mt-5 text-sm font-black text-white">
                                            {title}
                                        </p>

                                        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
                                            Project preview
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
                            />

                            <figcaption className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-white backdrop-blur">
                                Preview{" "}
                                {String(
                                    index + 1,
                                ).padStart(
                                    2,
                                    "0",
                                )}
                            </figcaption>
                        </figure>
                    );
                },
            )}
        </div>
    );
}
