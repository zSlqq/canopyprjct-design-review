import {
    ArrowLeft,
    BookOpen,
} from "lucide-react";
import Link from "next/link";

export default function DocumentationNotFound() {
    return (
        <main className="grid min-h-screen place-items-center bg-[#080d18] px-5 text-white">
            <section className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.055] p-8 text-center sm:p-12">
                <BookOpen
                    aria-hidden="true"
                    size={30}
                    className="mx-auto text-violet-300"
                />

                <h1 className="mt-7 text-5xl font-black tracking-[-0.06em]">
                    Documentation page not found.
                </h1>

                <p className="mx-auto mt-5 max-w-lg font-medium leading-7 text-slate-400">
                    This route is not part of the current synchronized documentation corpus.
                </p>

                <Link
                    href="/docs"
                    prefetch={false}
                    className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-[9px] font-black uppercase tracking-[0.11em] text-slate-950"
                >
                    <ArrowLeft
                        aria-hidden="true"
                        size={14}
                    />

                    Documentation
                </Link>
            </section>
        </main>
    );
}
