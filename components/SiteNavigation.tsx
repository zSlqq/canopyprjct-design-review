"use client";
import Link from "next/link";

import {
    ArrowUpRight,
    Braces,
    Menu,
    X,
} from "lucide-react";
import {
    useEffect,
    useState,
} from "react";

const navigationItems = [
    {
        id: "canopy",
        number: "01",
        label: "Canopy",
    },
    {
        id: "extensions",
        number: "02",
        label: "Extensions",
    },
    {
        id: "workflows",
        number: "03",
        label: "Workflows",
    },
    {
        id: "server",
        number: "05",
        label: "Server",
    },
    {
        id: "developers",
        number: "06",
        label: "Developers",
    },
    {
        id: "feature-explorer",
        number: "07",
        label: "Features",
    },
    {
        id: "projects",
        number: "08",
        label: "Projects",
    },

] as const;

export function SiteNavigation() {
    const [activeId, setActiveId] =
        useState("top");

    const [progress, setProgress] =
        useState(0);

    const [mobileOpen, setMobileOpen] =
        useState(false);

    useEffect(() => {
        let frame = 0;

        function updateNavigation() {
            window.cancelAnimationFrame(
                frame,
            );

            frame =
                window.requestAnimationFrame(
                    () => {
                        const activationLine =
                            window.scrollY +
                            Math.min(
                                190,
                                window.innerHeight *
                                    0.24,
                            );

                        let currentId =
                            "top";

                        for (
                            const item
                            of navigationItems
                        ) {
                            const element =
                                document.getElementById(
                                    item.id,
                                );

                            if (
                                element &&
                                element.offsetTop <=
                                    activationLine
                            ) {
                                currentId =
                                    item.id;
                            }
                        }

                        setActiveId(
                            currentId,
                        );

                        const scrollable =
                            document
                                .documentElement
                                .scrollHeight -
                            window.innerHeight;

                        const nextProgress =
                            scrollable > 0
                                ? Math.min(
                                      100,
                                      Math.max(
                                          0,
                                          (window.scrollY /
                                              scrollable) *
                                              100,
                                      ),
                                  )
                                : 0;

                        setProgress(
                            nextProgress,
                        );
                    },
                );
        }

        updateNavigation();

        window.addEventListener(
            "scroll",
            updateNavigation,
            {
                passive: true,
            },
        );

        window.addEventListener(
            "resize",
            updateNavigation,
        );

        return () => {
            window.cancelAnimationFrame(
                frame,
            );

            window.removeEventListener(
                "scroll",
                updateNavigation,
            );

            window.removeEventListener(
                "resize",
                updateNavigation,
            );
        };
    }, []);

    useEffect(() => {
        function handleKeyDown(
            event: KeyboardEvent,
        ) {
            if (event.key === "Escape") {
                setMobileOpen(false);
            }
        }

        document.addEventListener(
            "keydown",
            handleKeyDown,
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown,
            );
        };
    }, []);

    const activeLabel =
        navigationItems.find(
            (item) =>
                item.id === activeId,
        )?.label ?? "Overview";

    return (
        <>
            <a
                href="#canopy"
                className="sr-only fixed left-4 top-4 z-[100] rounded-xl bg-ink-950 px-4 py-3 text-xs font-black text-white focus:not-sr-only"
            >
                Skip to content
            </a>

            <header
                data-site-navigation
                data-active-section={
                    activeId
                }
                className="sticky top-0 z-50 border-b border-slate-200/75 bg-white/85 shadow-[0_8px_35px_rgba(15,23,42,0.045)] backdrop-blur-2xl"
            >
                <div className="relative mx-auto flex h-[4.5rem] max-w-[94rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <a
                        href="#top"
                        onClick={() =>
                            setMobileOpen(
                                false,
                            )
                        }
                        className="group flex min-w-0 items-center gap-3"
                    >
                        <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[0.9rem] bg-ink-950 text-white shadow-[0_10px_30px_rgba(15,23,42,0.2)]">
                            <span
                                aria-hidden="true"
                                className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(167,139,250,0.42),transparent_48%)]"
                            />

                            <Braces
                                aria-hidden="true"
                                size={18}
                                className="relative"
                            />
                        </span>

                        <span className="min-w-0">
                            <span className="block truncate text-xs font-black tracking-[-0.01em] text-ink-950">
                                ForestOfLight
                            </span>

                            <span className="mt-0.5 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />

                                <span className="truncate text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">
                                    {activeLabel}
                                </span>
                            </span>
                        </span>
                    </a>

                    <nav
                        aria-label="Primary navigation"
                        className="hidden items-center gap-1 xl:flex"
                    >
                        {navigationItems.map(
                            (item) => {
                                const active =
                                    activeId ===
                                    item.id;

                                return (
                                    <a
                                        key={
                                            item.id
                                        }
                                        href={`#${item.id}`}
                                        aria-current={
                                            active
                                                ? "location"
                                                : undefined
                                        }
                                        className={`group relative inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-[9px] font-black uppercase tracking-[0.1em] transition duration-300 ${
                                            active
                                                ? "bg-ink-950 text-white shadow-lg shadow-slate-950/10"
                                                : "text-slate-500 hover:bg-slate-100 hover:text-ink-950"
                                        }`}
                                    >
                                        <span
                                            className={`font-mono text-[8px] ${
                                                active
                                                    ? "text-brand-200"
                                                    : "text-slate-400 group-hover:text-brand-700"
                                            }`}
                                        >
                                            {
                                                item.number
                                            }
                                        </span>

                                        {
                                            item.label
                                        }
                                    </a>
                                );
                            },

                <Link
                    href="/archive"
                    prefetch={false}
                    data-archive-nav
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-slate-800 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
                >
                    Archive
                </Link>
       )}
                    </nav>

                    <div className="flex items-center gap-2">
                        <a
                            data-nav-projects-cta
                            href="#projects"
                            className="hidden h-10 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-[9px] font-black uppercase tracking-[0.1em] text-ink-950 transition hover:border-brand-300 hover:bg-brand-50 sm:inline-flex"
                        >
                            Explore
                        </a>

                        <a
                            data-nav-github
                            href="https://github.com/ForestOfLight"
                            target="_blank"
                            rel="noreferrer"
                            className="hidden h-10 items-center gap-2 rounded-full bg-ink-950 px-4 text-[9px] font-black uppercase tracking-[0.1em] text-white shadow-lg shadow-slate-950/10 transition hover:bg-brand-800 md:inline-flex"
                        >
                            GitHub

                            <ArrowUpRight
                                aria-hidden="true"
                                size={14}
                            />
                        </a>

                        <button
                            type="button"
                            aria-expanded={
                                mobileOpen
                            }
                            aria-controls="mobile-site-navigation"
                            aria-label={
                                mobileOpen
                                    ? "Close navigation"
                                    : "Open navigation"
                            }
                            onClick={() =>
                                setMobileOpen(
                                    (current) =>
                                        !current,
                                )
                            }
                            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 bg-white text-ink-950 transition hover:border-brand-300 hover:bg-brand-50 xl:hidden"
                        >
                            {mobileOpen ? (
                                <X
                                    aria-hidden="true"
                                    size={18}
                                />
                            ) : (
                                <Menu
                                    aria-hidden="true"
                                    size={18}
                                />
                            )}
                        </button>
                    </div>
                </div>

                {mobileOpen ? (
                    <div
                        id="mobile-site-navigation"
                        className="absolute inset-x-0 top-full border-b border-slate-200 bg-white/97 px-4 pb-5 pt-3 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:px-6 xl:hidden"
                    >
                        <nav
                            aria-label="Mobile navigation"
                            className="mx-auto grid max-w-[94rem] gap-2 sm:grid-cols-2"
                        >
                            {navigationItems.map(
                                (item) => {
                                    const active =
                                        activeId ===
                                        item.id;

                                    return (
                                        <a
                                            key={
                                                item.id
                                            }
                                            href={`#${item.id}`}
                                            aria-current={
                                                active
                                                    ? "location"
                                                    : undefined
                                            }
                                            onClick={() =>
                                                setMobileOpen(
                                                    false,
                                                )
                                            }
                                            className={`flex min-h-12 items-center justify-between rounded-2xl border px-4 transition ${
                                                active
                                                    ? "border-ink-950 bg-ink-950 text-white"
                                                    : "border-slate-200 bg-slate-50 text-ink-950 hover:border-brand-300 hover:bg-brand-50"
                                            }`}
                                        >
                                            <span className="flex items-center gap-3">
                                                <span
                                                    className={`font-mono text-[9px] font-bold ${
                                                        active
                                                            ? "text-brand-200"
                                                            : "text-brand-700"
                                                    }`}
                                                >
                                                    {
                                                        item.number
                                                    }
                                                </span>

                                                <span className="text-[10px] font-black uppercase tracking-[0.11em]">
                                                    {
                                                        item.label
                                                    }
                                                </span>
                                            </span>

                                            <ArrowUpRight
                                                aria-hidden="true"
                                                size={14}
                                                className={
                                                    active
                                                        ? "text-brand-200"
                                                        : "text-slate-400"
                                                }
                                            />
                                        </a>
                                    );
                                },
                            )}

                            <a
                                href="https://github.com/ForestOfLight"
                                target="_blank"
                                rel="noreferrer"
                                className="flex min-h-12 items-center justify-between rounded-2xl border border-brand-300 bg-brand-50 px-4 text-brand-950 sm:col-span-2"
                            >
                                <span className="text-[10px] font-black uppercase tracking-[0.11em]">
                                    ForestOfLight on GitHub
                                </span>

                                <ArrowUpRight
                                    aria-hidden="true"
                                    size={15}
                                />
                            </a>
                        </nav>
                    </div>
                ) : null}

                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-slate-200/70"
                >
                    <div
                        className="h-full w-full origin-left bg-gradient-to-r from-brand-700 via-brand-500 to-violet-300 transition-transform duration-150"
                        style={{
                            transform: `scaleX(${
                                progress /
                                100
                            })`,
                        }}
                    />
                </div>
            </header>
        </>
    );
}
