"use client";

import clsx from "clsx";
import { Boxes, SearchX } from "lucide-react";

import {
    addonCategories,
    type AddonCategoryFilter,
} from "@/lib/types";

interface SearchAndFilterProps {
    query: string;
    category: AddonCategoryFilter;
    resultCount: number;
    onQueryChange: (value: string) => void;
    onCategoryChange: (
        value: AddonCategoryFilter,
    ) => void;
}

export function SearchAndFilter({
    query,
    category,
    resultCount,
    onQueryChange,
    onCategoryChange,
}: SearchAndFilterProps) {
    const resultLabel =
        resultCount === 1
            ? "1 project"
            : `${resultCount} projects`;

    return (
        <section
            aria-labelledby="directory-tools-title"
            className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-card sm:p-5"
        >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="mb-3 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-700">
                                Project directory
                            </p>

                            <h2
                                id="directory-tools-title"
                                className="mt-1 text-lg font-black tracking-[-0.025em] text-ink-950"
                            >
                                Search the technical ecosystem
                            </h2>
                        </div>

                        <p
                            role="status"
                            aria-live="polite"
                            className="shrink-0 text-xs font-bold text-slate-500"
                        >
                            {resultLabel}
                        </p>
                    </div>

                    <div className="relative">
                        <SearchX
                            aria-hidden="true"
                            size={18}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <label
                            htmlFor="project-search"
                            className="sr-only"
                        >
                            Search projects
                        </label>

                        <input
                            id="project-search"
                            type="search"
                            value={query}
                            onChange={(event) =>
                                onQueryChange(
                                    event.target.value,
                                )
                            }
                            placeholder="Search projects, systems, features, or dependencies"
                            autoComplete="off"
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-20 text-sm font-semibold text-ink-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
                        />

                        {query ? (
                            <button
                                type="button"
                                onClick={() =>
                                    onQueryChange("")
                                }
                                className="absolute right-2 top-1/2 h-8 -translate-y-1/2 rounded-xl px-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 transition hover:bg-slate-200 hover:text-ink-950"
                                aria-label="Clear project search"
                            >
                                Clear
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="xl:max-w-[32rem]">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                        <Boxes
                            aria-hidden="true"
                            size={14}
                        />
                        Category
                    </div>

                    <div
                        role="group"
                        aria-label="Filter projects by category"
                        className="flex gap-2 overflow-x-auto pb-1"
                    >
                        {addonCategories.map(
                            (option) => {
                                const selected =
                                    option ===
                                    category;

                                return (
                                    <button
                                        key={
                                            option
                                        }
                                        type="button"
                                        aria-pressed={
                                            selected
                                        }
                                        onClick={() =>
                                            onCategoryChange(
                                                option,
                                            )
                                        }
                                        className={clsx(
                                            "h-10 shrink-0 rounded-xl border px-4 text-[10px] font-black uppercase tracking-[0.1em] transition",
                                            selected
                                                ? "border-ink-950 bg-ink-950 text-white shadow-lg shadow-slate-950/10"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900",
                                        )}
                                    >
                                        {
                                            option
                                        }
                                    </button>
                                );
                            },
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
