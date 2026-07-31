"use client";

import {
    Bookmark,
    Check,
    ChevronUp,
    Copy,
    Printer,
} from "lucide-react";
import {
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";

type BookmarkEntry = {
    route: string;
    title: string;
    savedAt: string;
};

const BOOKMARK_STORAGE_KEY =
    "forestoflight-doc-bookmarks";

const BOOKMARK_EVENT =
    "forestoflight-doc-bookmarks-change";

function readBookmarks():
    BookmarkEntry[] {
    if (
        typeof window
        === "undefined"
    ) {
        return [];
    }

    try {
        const stored =
            window.localStorage
                .getItem(
                    BOOKMARK_STORAGE_KEY,
                );

        const parsed =
            stored
                ? JSON.parse(
                    stored,
                )
                : [];

        if (
            !Array.isArray(
                parsed,
            )
        ) {
            return [];
        }

        return parsed.filter(
            (
                item,
            ): item is BookmarkEntry =>
                Boolean(
                    item
                    && typeof item
                        .route
                        === "string"
                    && typeof item
                        .title
                        === "string"
                    && typeof item
                        .savedAt
                        === "string",
                ),
        );
    } catch {
        return [];
    }
}

function subscribeBookmarks(
    listener:
        () => void,
): () => void {
    window.addEventListener(
        "storage",
        listener,
    );

    window.addEventListener(
        BOOKMARK_EVENT,
        listener,
    );

    return () => {
        window.removeEventListener(
            "storage",
            listener,
        );

        window.removeEventListener(
            BOOKMARK_EVENT,
            listener,
        );
    };
}

async function copyText(
    value: string,
): Promise<void> {
    if (
        navigator.clipboard
        && window.isSecureContext
    ) {
        await navigator.clipboard.writeText(
            value,
        );

        return;
    }

    const textarea =
        document.createElement(
            "textarea",
        );

    textarea.value =
        value;

    textarea.setAttribute(
        "readonly",
        "",
    );

    textarea.style.position =
        "fixed";

    textarea.style.opacity =
        "0";

    document.body.appendChild(
        textarea,
    );

    textarea.select();

    const copied =
        document.execCommand(
            "copy",
        );

    textarea.remove();

    if (!copied) {
        throw new Error(
            "Copy command was rejected.",
        );
    }
}

export function ReaderTools({
    title,
    route,
}: {
    title: string;
    route: string;
}) {
    const [
        progress,
        setProgress,
    ] = useState(0);

    const [
        copied,
        setCopied,
    ] = useState(false);

    const bookmarked =
        useSyncExternalStore(
            subscribeBookmarks,
            () =>
                readBookmarks()
                    .some(
                        (
                            item,
                        ) =>
                            item.route
                            === route,
                    ),
            () => false,
        );

    const [
        showTop,
        setShowTop,
    ] = useState(false);

    const copyTimer =
        useRef<
            number | null
        >(null);

    useEffect(
        () => {
            const update =
                () => {
                    const root =
                        document
                            .documentElement;

                    const maximum =
                        Math.max(
                            1,
                            root.scrollHeight
                            - window.innerHeight,
                        );

                    const next =
                        Math.min(
                            100,
                            Math.max(
                                0,
                                (
                                    window.scrollY
                                    / maximum
                                )
                                * 100,
                            ),
                        );

                    setProgress(
                        next,
                    );

                    setShowTop(
                        window.scrollY
                        > 700,
                    );
                };

            update();

            window.addEventListener(
                "scroll",
                update,
                {
                    passive:
                        true,
                },
            );

            window.addEventListener(
                "resize",
                update,
            );

            return () => {
                window.removeEventListener(
                    "scroll",
                    update,
                );

                window.removeEventListener(
                    "resize",
                    update,
                );
            };
        },
        [],
    );

    useEffect(
        () => {
            return () => {
                if (
                    copyTimer.current
                    !== null
                ) {
                    window.clearTimeout(
                        copyTimer.current,
                    );
                }
            };
        },
        [],
    );

    const toggleBookmark =
        () => {
            const bookmarks =
                readBookmarks();

            const already =
                bookmarks.some(
                    (
                        item,
                    ) =>
                        item.route
                        === route,
                );

            const next =
                already
                    ? bookmarks.filter(
                        (
                            item,
                        ) =>
                            item.route
                            !== route,
                    )
                    : [
                        ...bookmarks,
                        {
                            route,
                            title,
                            savedAt:
                                new Date()
                                    .toISOString(),
                        },
                    ];

            try {
                window.localStorage
                    .setItem(
                        BOOKMARK_STORAGE_KEY,
                        JSON.stringify(
                            next,
                        ),
                    );

                window.dispatchEvent(
                    new Event(
                        BOOKMARK_EVENT,
                    ),
                );
            } catch {
                // Storage can be unavailable in privacy-restricted contexts.
            }
        };

    return (
        <>
            <div
                data-reading-progress
                aria-hidden="true"
                className="fixed inset-x-0 top-0 z-[80] h-1 bg-transparent print:hidden"
            >
                <span
                    className="block h-full origin-left bg-violet-600"
                    style={{
                        transform:
                            `scaleX(${progress / 100})`,
                    }}
                />
            </div>

            <div
                data-reader-tools
                className="mb-8 flex flex-wrap items-center gap-2 border-y border-slate-200 py-4 print:hidden"
            >
                <button
                    type="button"
                    data-reader-copy
                    data-copy-state={
                        copied
                            ? "copied"
                            : "idle"
                    }
                    onClick={async () => {
                        try {
                            await copyText(
                                window.location
                                    .href,
                            );

                            setCopied(
                                true,
                            );

                            if (
                                copyTimer.current
                                !== null
                            ) {
                                window.clearTimeout(
                                    copyTimer.current,
                                );
                            }

                            copyTimer.current =
                                window.setTimeout(
                                    () => {
                                        setCopied(
                                            false,
                                        );
                                    },
                                    1800,
                                );
                        } catch {
                            setCopied(
                                false,
                            );
                        }
                    }}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[8px] font-black uppercase tracking-[0.11em] text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
                >
                    {copied ? (
                        <Check
                            aria-hidden="true"
                            size={13}
                        />
                    ) : (
                        <Copy
                            aria-hidden="true"
                            size={13}
                        />
                    )}

                    {copied
                        ? "Link copied"
                        : "Copy link"}
                </button>

                <button
                    type="button"
                    data-reader-bookmark
                    data-bookmark-state={
                        bookmarked
                            ? "saved"
                            : "idle"
                    }
                    aria-pressed={
                        bookmarked
                    }
                    onClick={
                        toggleBookmark
                    }
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[8px] font-black uppercase tracking-[0.11em] text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
                >
                    <Bookmark
                        aria-hidden="true"
                        size={13}
                        fill={
                            bookmarked
                                ? "currentColor"
                                : "none"
                        }
                    />

                    {bookmarked
                        ? "Saved"
                        : "Save page"}
                </button>

                <button
                    type="button"
                    data-reader-print
                    onClick={() => {
                        window.print();
                    }}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[8px] font-black uppercase tracking-[0.11em] text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
                >
                    <Printer
                        aria-hidden="true"
                        size={13}
                    />

                    Print
                </button>
            </div>

            <button
                type="button"
                data-reader-top
                data-visible={
                    showTop
                        ? "true"
                        : "false"
                }
                onClick={() => {
                    window.scrollTo({
                        top: 0,
                        behavior:
                            "smooth",
                    });
                }}
                aria-label="Back to top"
                className={`fixed bottom-5 right-5 z-50 grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-[0_18px_50px_rgba(15,23,42,0.18)] transition print:hidden ${
                    showTop
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none translate-y-3 opacity-0"
                }`}
            >
                <ChevronUp
                    aria-hidden="true"
                    size={18}
                />
            </button>
        </>
    );
}
