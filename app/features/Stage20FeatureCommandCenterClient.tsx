"use client";

import dynamic from "next/dynamic";

function LoadingCommandCenter() {
    return (
        <main className="min-h-screen bg-[#090e1a] p-4 text-white sm:p-8">
            <section
                aria-busy="true"
                aria-live="polite"
                className="mx-auto min-h-[40rem] max-w-[94rem] animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.055] p-8"
            >
                <div className="h-3 w-32 rounded-full bg-violet-400/20" />

                <div className="mt-7 h-16 max-w-3xl rounded-2xl bg-white/[0.08]" />

                <div className="mt-10 grid gap-4 lg:grid-cols-3">
                    {Array.from({
                        length: 6,
                    }).map(
                        (_, index) => (
                            <div
                                key={index}
                                className="min-h-48 rounded-[1.5rem] border border-white/10 bg-white/[0.04]"
                            />
                        ),
                    )}
                </div>

                <span className="sr-only">
                    Loading the feature command center.
                </span>
            </section>
        </main>
    );
}

const DeferredFeatureCommandCenter =
    dynamic(
        () =>
            import(
                "@/components/FeatureCommandCenter"
            ).then(
                (module) =>
                    module.FeatureCommandCenter,
            ),
        {
            ssr: false,
            loading:
                LoadingCommandCenter,
        },
    );

export function Stage20FeatureCommandCenterClient() {
    return (
        <DeferredFeatureCommandCenter />
    );
}
