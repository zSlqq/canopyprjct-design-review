import {
    ArrowLeft,
    BookOpen,
    Search,
    Waypoints,
} from "lucide-react";
import Link from "next/link";

export default function NotFoundPage() {
    return (
        <main
            data-not-found
            className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[#080d18] px-5 py-16 text-white"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:54px_54px]"
            />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-32 top-0 -z-10 h-[34rem] w-[34rem] rounded-full bg-violet-600/25 blur-[145px]"
            />

            <section className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-white/[0.055] p-7 shadow-[0_35px_110px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-11">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-violet-200">
                    <Waypoints
                        aria-hidden="true"
                        size={14}
                    />

                    Route not found
                </div>

                <p className="mt-8 font-mono text-sm font-black text-violet-300">
                    ERROR / 404
                </p>

                <h1 className="mt-4 text-[clamp(3.4rem,9vw,7rem)] font-black leading-[0.84] tracking-[-0.08em]">
                    This path left
                    <br />
                    the canopy.
                </h1>

                <p className="mt-7 max-w-2xl text-base font-medium leading-8 text-slate-400">
                    The page may have moved,
                    changed names, or never existed.
                    Search the synchronized technical
                    index or return to the main
                    documentation directory.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href="/search"
                        prefetch={false}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-[8px] font-black uppercase tracking-[0.11em] text-slate-950 transition hover:bg-violet-200"
                    >
                        <Search
                            aria-hidden="true"
                            size={14}
                        />

                        Search documentation
                    </Link>

                    <Link
                        href="/docs"
                        prefetch={false}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 text-[8px] font-black uppercase tracking-[0.11em] text-white transition hover:border-violet-300/40"
                    >
                        <BookOpen
                            aria-hidden="true"
                            size={14}
                        />

                        Browse docs
                    </Link>

                    <Link
                        href="/"
                        prefetch={false}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-transparent px-5 text-[8px] font-black uppercase tracking-[0.11em] text-slate-400 transition hover:text-white"
                    >
                        <ArrowLeft
                            aria-hidden="true"
                            size={14}
                        />

                        Home
                    </Link>
                </div>
            </section>
        </main>
    );
}
