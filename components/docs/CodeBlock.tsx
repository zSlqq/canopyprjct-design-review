"use client";

import {
    Check,
    Copy,
} from "lucide-react";
import {
    useEffect,
    useRef,
    useState,
} from "react";

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

export function CodeBlock({
    code,
}: {
    code: string;
}) {
    const [
        copied,
        setCopied,
    ] = useState(false);

    const resetTimer =
        useRef<
            number | null
        >(null);

    useEffect(
        () => {
            return () => {
                if (
                    resetTimer.current
                    !== null
                ) {
                    window.clearTimeout(
                        resetTimer.current,
                    );
                }
            };
        },
        [],
    );

    return (
        <div
            data-doc-code-block
            className="group relative my-8 overflow-hidden rounded-[1.4rem] border border-slate-800 bg-[#0b1020] shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
        >
            <div className="flex min-h-11 items-center justify-between gap-4 border-b border-white/10 px-4">
                <span className="font-mono text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">
                    Code
                </span>

                <button
                    type="button"
                    data-code-copy
                    data-copy-state={
                        copied
                            ? "copied"
                            : "idle"
                    }
                    onClick={async () => {
                        try {
                            await copyText(
                                code,
                            );

                            setCopied(
                                true,
                            );

                            if (
                                resetTimer.current
                                !== null
                            ) {
                                window.clearTimeout(
                                    resetTimer.current,
                                );
                            }

                            resetTimer.current =
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
                    aria-label={
                        copied
                            ? "Code copied"
                            : "Copy code"
                    }
                    className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 text-[8px] font-black uppercase tracking-[0.11em] text-slate-300 transition hover:border-violet-300/40 hover:text-white"
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
                        ? "Copied"
                        : "Copy"}
                </button>
            </div>

            <pre className="max-w-full overflow-x-auto p-5 font-mono text-sm leading-7 text-slate-100">
                <code>
                    {code}
                </code>
            </pre>
        </div>
    );
}
