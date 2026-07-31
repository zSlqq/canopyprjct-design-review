"use client";

import {
    AnimatePresence,
    motion,
    useReducedMotion,
} from "framer-motion";
import {
    ArrowUpRight,
    Boxes,
    Braces,
    PackageOpen,
} from "lucide-react";
import Image from "next/image";
import {
    useEffect,
    useRef,
    useState,
} from "react";

import type { AddonProject } from "@/lib/types";

interface ImageGalleryModalProps {
    addon: AddonProject | null;
    onClose: () => void;
}

const modalTabs = [
    {
        id: "overview",
        label: "Overview",
    },
    {
        id: "installation",
        label: "Installation",
    },
    {
        id: "dependencies",
        label: "Requirements",
    },
] as const;

type ModalTab =
    (typeof modalTabs)[number]["id"];

export function ImageGalleryModal({
    addon,
    onClose,
}: ImageGalleryModalProps) {
    return (
        <AnimatePresence>
            {addon ? (
                <ModalPanel
                    key={addon.id}
                    addon={addon}
                    onClose={onClose}
                />
            ) : null}
        </AnimatePresence>
    );
}

function ModalPanel({
    addon,
    onClose,
}: {
    addon: AddonProject;
    onClose: () => void;
}) {
    const reduceMotion = useReducedMotion();
    const dialogRef =
        useRef<HTMLDivElement>(null);
    const closeButtonRef =
        useRef<HTMLButtonElement>(null);

    const [imageIndex, setImageIndex] =
        useState(0);
    const [activeTab, setActiveTab] =
        useState<ModalTab>("overview");
    const [failedImages, setFailedImages] =
        useState<Record<number, boolean>>(
            {},
        );

    const images = addon.screenshots;
    const imageCount = images.length;
    const safeImageIndex =
        imageCount > 0
            ? imageIndex % imageCount
            : 0;
    const activeImage =
        images[safeImageIndex];

    useEffect(() => {
        const previousActive =
            document.activeElement instanceof
            HTMLElement
                ? document.activeElement
                : null;

        const previousOverflow =
            document.body.style.overflow;
        const previousPaddingRight =
            document.body.style.paddingRight;

        const scrollbarWidth =
            window.innerWidth -
            document.documentElement.clientWidth;

        document.body.style.overflow =
            "hidden";

        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        const focusFrame =
            window.requestAnimationFrame(
                () => {
                    closeButtonRef.current?.focus();
                },
            );

        function handleKeyDown(
            event: KeyboardEvent,
        ) {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }

            if (
                event.key ===
                    "ArrowLeft" &&
                imageCount > 1
            ) {
                event.preventDefault();

                setImageIndex(
                    (current) =>
                        (current -
                            1 +
                            imageCount) %
                        imageCount,
                );

                return;
            }

            if (
                event.key ===
                    "ArrowRight" &&
                imageCount > 1
            ) {
                event.preventDefault();

                setImageIndex(
                    (current) =>
                        (current + 1) %
                        imageCount,
                );

                return;
            }

            if (
                event.key !== "Tab" ||
                !dialogRef.current
            ) {
                return;
            }

            const focusable =
                dialogRef.current.querySelectorAll<HTMLElement>(
                    [
                        "a[href]",
                        "button:not([disabled])",
                        "input:not([disabled])",
                        "select:not([disabled])",
                        "textarea:not([disabled])",
                        '[tabindex]:not([tabindex="-1"])',
                    ].join(","),
                );

            if (!focusable.length) {
                return;
            }

            const first = focusable[0];
            const last =
                focusable[
                    focusable.length - 1
                ];

            if (
                event.shiftKey &&
                document.activeElement ===
                    first
            ) {
                event.preventDefault();
                last.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement ===
                    last
            ) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener(
            "keydown",
            handleKeyDown,
        );

        return () => {
            window.cancelAnimationFrame(
                focusFrame,
            );

            document.removeEventListener(
                "keydown",
                handleKeyDown,
            );

            document.body.style.overflow =
                previousOverflow;

            document.body.style.paddingRight =
                previousPaddingRight;

            previousActive?.focus();
        };
    }, [imageCount, onClose]);

    function markImageFailed(
        index: number,
    ) {
        setFailedImages((current) => ({
            ...current,
            [index]: true,
        }));
    }

    function showPreviousImage() {
        if (imageCount < 2) {
            return;
        }

        setImageIndex(
            (current) =>
                (current -
                    1 +
                    imageCount) %
                imageCount,
        );
    }

    function showNextImage() {
        if (imageCount < 2) {
            return;
        }

        setImageIndex(
            (current) =>
                (current + 1) %
                imageCount,
        );
    }

    return (
        <motion.div
            className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/70 px-3 py-4 backdrop-blur-md sm:px-6 sm:py-8"
            initial={
                reduceMotion
                    ? false
                    : {
                          opacity: 0,
                      }
            }
            animate={{
                opacity: 1,
            }}
            exit={{
                opacity: 0,
            }}
            transition={{
                duration: reduceMotion
                    ? 0
                    : 0.2,
            }}
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
        >
            <motion.div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${addon.id}-modal-title`}
                aria-describedby={`${addon.id}-modal-description`}
                initial={
                    reduceMotion
                        ? false
                        : {
                              opacity: 0,
                              y: 24,
                              scale: 0.985,
                          }
                }
                animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                }}
                exit={{
                    opacity: 0,
                    y: 16,
                    scale: 0.99,
                }}
                transition={{
                    duration: reduceMotion
                        ? 0
                        : 0.26,
                }}
                className="relative mx-auto max-w-6xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-white shadow-[0_36px_120px_rgba(2,6,23,0.42)] sm:rounded-[2rem]"
            >
                <header className="flex items-start justify-between gap-5 border-b border-slate-200 px-5 py-5 sm:px-7">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                aria-hidden="true"
                                className="h-2 w-2 rounded-full"
                                style={{
                                    backgroundColor:
                                        addon.accent,
                                }}
                            />

                            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-brand-800">
                                {addon.kind}
                            </span>

                            <span
                                aria-hidden="true"
                                className="h-1 w-1 rounded-full bg-slate-300"
                            />

                            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                                {addon.category}
                            </span>
                        </div>

                        <h2
                            id={`${addon.id}-modal-title`}
                            className="mt-2 text-2xl font-black tracking-[-0.035em] text-ink-950 sm:text-3xl"
                        >
                            {addon.title}
                        </h2>

                        <p className="mt-1 text-xs font-bold text-slate-500">
                            By {addon.author}
                        </p>
                    </div>

                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        aria-label={`Close ${addon.title} details`}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-2xl font-light leading-none text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900"
                    >
                        ×
                    </button>
                </header>

                <div className="grid lg:grid-cols-[1.12fr_0.88fr]">
                    <section
                        aria-label={`${addon.title} repository previews`}
                        className="border-b border-slate-200 bg-slate-950 p-4 sm:p-6 lg:border-b-0 lg:border-r"
                    >
                        <div className="relative aspect-[16/10] overflow-hidden rounded-[1.35rem] border border-white/10 bg-slate-900">
                            {activeImage &&
                            !failedImages[
                                safeImageIndex
                            ] ? (
                                <Image
                                    src={
                                        activeImage
                                    }
                                    alt=""
                                    fill
                                    priority
                                    sizes="(min-width: 1024px) 56vw, 94vw"
                                    className="object-cover"
                                    onError={() =>
                                        markImageFailed(
                                            safeImageIndex,
                                        )
                                    }
                                />
                            ) : (
                                <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_75%_12%,rgba(196,181,253,0.38),transparent_34%),linear-gradient(145deg,#0f172a,#312e81)]">
                                    <div className="text-center text-white">
                                        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
                                            <Braces
                                                aria-hidden="true"
                                                size={
                                                    28
                                                }
                                            />
                                        </span>

                                        <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-white/75">
                                            Preview
                                            unavailable
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent px-4 pb-4 pt-12">
                                <span className="rounded-full border border-white/15 bg-slate-950/60 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white backdrop-blur">
                                    Repository
                                    preview
                                </span>

                                {imageCount > 0 ? (
                                    <span className="rounded-full border border-white/15 bg-slate-950/60 px-3 py-1.5 text-[9px] font-black tabular-nums tracking-[0.12em] text-white backdrop-blur">
                                        {safeImageIndex +
                                            1}
                                        /
                                        {
                                            imageCount
                                        }
                                    </span>
                                ) : null}
                            </div>

                            {imageCount > 1 ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={
                                            showPreviousImage
                                        }
                                        aria-label="Show previous preview"
                                        className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl border border-white/15 bg-slate-950/65 text-2xl font-light text-white backdrop-blur transition hover:bg-white hover:text-ink-950"
                                    >
                                        ‹
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            showNextImage
                                        }
                                        aria-label="Show next preview"
                                        className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl border border-white/15 bg-slate-950/65 text-2xl font-light text-white backdrop-blur transition hover:bg-white hover:text-ink-950"
                                    >
                                        ›
                                    </button>
                                </>
                            ) : null}
                        </div>

                        {imageCount > 1 ? (
                            <div className="mt-3 grid grid-cols-3 gap-3">
                                {images.map(
                                    (
                                        image,
                                        index,
                                    ) => {
                                        const selected =
                                            index ===
                                            safeImageIndex;

                                        return (
                                            <button
                                                key={`${image}-${index}`}
                                                type="button"
                                                onClick={() =>
                                                    setImageIndex(
                                                        index,
                                                    )
                                                }
                                                aria-label={`Show preview ${index + 1}`}
                                                aria-current={
                                                    selected
                                                        ? "true"
                                                        : undefined
                                                }
                                                className={`relative aspect-[16/9] overflow-hidden rounded-xl border-2 transition ${
                                                    selected
                                                        ? "border-brand-400 ring-4 ring-brand-400/15"
                                                        : "border-white/10 opacity-65 hover:border-white/35 hover:opacity-100"
                                                }`}
                                            >
                                                {!failedImages[
                                                    index
                                                ] ? (
                                                    <Image
                                                        src={
                                                            image
                                                        }
                                                        alt=""
                                                        fill
                                                        sizes="180px"
                                                        className="object-cover"
                                                        onError={() =>
                                                            markImageFailed(
                                                                index,
                                                            )
                                                        }
                                                    />
                                                ) : (
                                                    <span className="absolute inset-0 grid place-items-center bg-slate-800 text-white">
                                                        <Braces
                                                            aria-hidden="true"
                                                            size={
                                                                17
                                                            }
                                                        />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    },
                                )}
                            </div>
                        ) : null}

                        <p className="mt-4 text-[10px] font-semibold leading-5 text-slate-400">
                            Visuals in this
                            showcase are repository
                            previews unless marked
                            otherwise.
                        </p>
                    </section>

                    <section className="flex min-h-[34rem] flex-col">
                        <div
                            role="tablist"
                            aria-label={`${addon.title} project information`}
                            className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4 pt-4 sm:px-6"
                        >
                            {modalTabs.map(
                                (tab) => {
                                    const selected =
                                        activeTab ===
                                        tab.id;

                                    return (
                                        <button
                                            key={
                                                tab.id
                                            }
                                            id={`${addon.id}-${tab.id}-tab`}
                                            type="button"
                                            role="tab"
                                            aria-selected={
                                                selected
                                            }
                                            aria-controls={`${addon.id}-${tab.id}-panel`}
                                            tabIndex={
                                                selected
                                                    ? 0
                                                    : -1
                                            }
                                            onClick={() =>
                                                setActiveTab(
                                                    tab.id,
                                                )
                                            }
                                            className={`relative h-11 shrink-0 px-4 text-[10px] font-black uppercase tracking-[0.1em] transition ${
                                                selected
                                                    ? "text-brand-800"
                                                    : "text-slate-500 hover:text-ink-950"
                                            }`}
                                        >
                                            {
                                                tab.label
                                            }

                                            {selected ? (
                                                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-700" />
                                            ) : null}
                                        </button>
                                    );
                                },
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
                            {activeTab ===
                            "overview" ? (
                                <div
                                    id={`${addon.id}-overview-panel`}
                                    role="tabpanel"
                                    aria-labelledby={`${addon.id}-overview-tab`}
                                >
                                    <p
                                        id={`${addon.id}-modal-description`}
                                        className="text-[0.95rem] font-medium leading-7 text-slate-600"
                                    >
                                        {
                                            addon.fullDescription
                                        }
                                    </p>

                                    <div className="mt-7 flex items-center gap-2">
                                        <Boxes
                                            aria-hidden="true"
                                            size={
                                                17
                                            }
                                            className="text-brand-700"
                                        />

                                        <h3 className="text-xs font-black uppercase tracking-[0.12em] text-ink-950">
                                            Core
                                            capabilities
                                        </h3>
                                    </div>

                                    <ul className="mt-4 space-y-3">
                                        {addon.capabilities.map(
                                            (
                                                capability,
                                            ) => (
                                                <li
                                                    key={
                                                        capability
                                                    }
                                                    className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700"
                                                >
                                                    <span
                                                        aria-hidden="true"
                                                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                addon.accent,
                                                        }}
                                                    />

                                                    {
                                                        capability
                                                    }
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            ) : null}

                            {activeTab ===
                            "installation" ? (
                                <div
                                    id={`${addon.id}-installation-panel`}
                                    role="tabpanel"
                                    aria-labelledby={`${addon.id}-installation-tab`}
                                >
                                    <p className="text-sm font-medium leading-6 text-slate-600">
                                        Follow the
                                        publisher’s
                                        release
                                        instructions
                                        before applying
                                        the project to an
                                        important world.
                                    </p>

                                    <ol className="mt-5 space-y-3">
                                        {addon.installationSteps.map(
                                            (
                                                step,
                                                index,
                                            ) => (
                                                <li
                                                    key={
                                                        step
                                                    }
                                                    className="grid grid-cols-[2.25rem_1fr] gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                                                >
                                                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink-950 text-[10px] font-black text-white">
                                                        {String(
                                                            index +
                                                                1,
                                                        ).padStart(
                                                            2,
                                                            "0",
                                                        )}
                                                    </span>

                                                    <p className="pt-1 text-sm font-semibold leading-6 text-slate-700">
                                                        {
                                                            step
                                                        }
                                                    </p>
                                                </li>
                                            ),
                                        )}
                                    </ol>
                                </div>
                            ) : null}

                            {activeTab ===
                            "dependencies" ? (
                                <div
                                    id={`${addon.id}-dependencies-panel`}
                                    role="tabpanel"
                                    aria-labelledby={`${addon.id}-dependencies-tab`}
                                >
                                    <p className="text-sm font-medium leading-6 text-slate-600">
                                        Check each
                                        requirement
                                        against the
                                        selected release
                                        before
                                        installation.
                                    </p>

                                    <ul className="mt-5 space-y-3">
                                        {addon.dependencies.map(
                                            (
                                                dependency,
                                            ) => (
                                                <li
                                                    key={
                                                        dependency
                                                    }
                                                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                                                >
                                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-800">
                                                        <PackageOpen
                                                            aria-hidden="true"
                                                            size={
                                                                17
                                                            }
                                                        />
                                                    </span>

                                                    <span className="text-sm font-bold text-slate-700">
                                                        {
                                                            dependency
                                                        }
                                                    </span>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            ) : null}
                        </div>

                        <footer className="grid gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 sm:p-5">
                            <a
                                href={
                                    addon.downloadUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-ink-950 px-5 text-[10px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-brand-800"
                            >
                                <PackageOpen
                                    aria-hidden="true"
                                    size={16}
                                />
                                Open releases
                                <ArrowUpRight
                                    aria-hidden="true"
                                    size={14}
                                />
                            </a>

                            <a
                                href={
                                    addon.githubUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-[10px] font-black uppercase tracking-[0.1em] text-ink-950 transition hover:border-brand-300 hover:bg-brand-50"
                            >
                                <Braces
                                    aria-hidden="true"
                                    size={16}
                                />
                                View repository
                                <ArrowUpRight
                                    aria-hidden="true"
                                    size={14}
                                />
                            </a>
                        </footer>
                    </section>
                </div>
            </motion.div>
        </motion.div>
    );
}
