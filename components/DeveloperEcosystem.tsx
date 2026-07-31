"use client";

import {
    ArrowUpRight,
    Braces,
    CheckCircle2,
    FileCode2,
    GitBranch,
    PackageCheck,
    Terminal,
} from "lucide-react";

import { addons } from "@/lib/data/addons";
import type { AddonProject } from "@/lib/types";

function findProject(
    id: string,
    title: string,
): AddonProject | undefined {
    return addons.find(
        (project) =>
            project.id === id ||
            project.title === title,
    );
}

function RepositoryLink({
    project,
    label,
    inverted = false,
}: {
    project: AddonProject | undefined;
    label: string;
    inverted?: boolean;
}) {
    return (
        <a
            href={
                project?.githubUrl ??
                "https://github.com/ForestOfLight"
            }
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${project?.title ?? label} on GitHub`}
            className={
                inverted
                    ? "inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-white transition duration-300 hover:border-violet-300/50 hover:bg-violet-400/10"
                    : "inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-950 transition duration-300 hover:border-violet-300 hover:bg-violet-50"
            }
        >
            {label}
            <ArrowUpRight
                size={14}
                aria-hidden="true"
            />
        </a>
    );
}

export function DeveloperEcosystem() {
    const apiKit = findProject(
        "addon-api-kit",
        "AddonAPIKit",
    );

    const vitestMocks = findProject(
        "minecraft-vitest-mocks",
        "minecraft-vitest-mocks",
    );

    const extensionExample = findProject(
        "canopy-extension-example",
        "Canopy Extension Example",
    );

    return (
        <section
            id="developers"
            aria-labelledby="developers-title"
            className="relative isolate overflow-hidden border-y border-slate-200 bg-[#f7f7fb] py-24 sm:py-28 lg:py-32"

            data-stage29-color-section
>
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 opacity-70 [background-image:linear-gradient(rgba(124,58,237,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.055)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]"
            />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-12 -z-10 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-violet-300/20 blur-[120px]"
            />

            <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-10">
                <header className="grid gap-8 border-b border-slate-300/80 pb-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">
                                05
                            </span>

                            <span
                                aria-hidden="true"
                                className="h-px w-12 bg-violet-300"
                            />

                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                Enable developers
                            </span>
                        </div>

                        <h2
                            id="developers-title"
                            className="mt-6 max-w-3xl text-4xl font-black tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-6xl"
                        >
                            Tools for building the next layer.
                        </h2>
                    </div>

                    <div className="lg:justify-self-end lg:max-w-xl">
                        <p className="text-base font-medium leading-8 text-slate-600 sm:text-lg">
                            The ecosystem extends beneath the visible products.
                            Typed communication, repeatable tests, and a clear
                            extension structure make new Bedrock tooling easier
                            to design and maintain.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2">
                            {[
                                "Typed interfaces",
                                "Outside-game testing",
                                "Reusable extension patterns",
                            ].map((label) => (
                                <span
                                    key={label}
                                    className="rounded-full border border-slate-300 bg-white/80 px-3 py-2 text-[9px] font-black uppercase tracking-[0.11em] text-slate-600"
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="mt-10 grid gap-5 lg:grid-cols-12 lg:grid-rows-[minmax(19rem,auto)_minmax(19rem,auto)]">
                    <article className="group relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:p-8 lg:col-span-7 lg:row-span-2 lg:p-10">
                        <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-[radial-gradient(circle_at_84%_12%,rgba(139,92,246,0.3),transparent_32%),linear-gradient(145deg,transparent_55%,rgba(124,58,237,0.11))]"
                        />

                        <div className="relative flex h-full flex-col">
                            <div className="flex items-start justify-between gap-5">
                                <div>
                                    <div className="flex items-center gap-2 text-violet-300">
                                        <Braces
                                            size={17}
                                            aria-hidden="true"
                                        />

                                        <span className="text-[9px] font-black uppercase tracking-[0.16em]">
                                            Typed addon communication
                                        </span>
                                    </div>

                                    <h3 className="mt-5 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
                                        AddonAPIKit
                                    </h3>

                                    <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-slate-300 sm:text-base">
                                        A structured bridge between independent
                                        addons, built around named endpoints,
                                        typed parameters, return values, and
                                        asynchronous calls.
                                    </p>
                                </div>

                                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-violet-300">
                                    <GitBranch
                                        size={21}
                                        aria-hidden="true"
                                    />
                                </span>
                            </div>

                            <div className="mt-9 grid gap-4 sm:grid-cols-[0.9fr_auto_0.9fr] sm:items-center">
                                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
                                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                                        Producer addon
                                    </p>

                                    <p className="mt-3 font-mono text-sm font-bold text-white">
                                        canopy:world-info
                                    </p>

                                    <div className="mt-5 space-y-2">
                                        <div className="h-1.5 w-full rounded-full bg-violet-400/25" />
                                        <div className="h-1.5 w-4/5 rounded-full bg-violet-400/15" />
                                    </div>
                                </div>

                                <div className="hidden items-center gap-2 sm:flex">
                                    <span className="h-px w-6 bg-violet-400/50" />
                                    <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2.5 py-1 font-mono text-[9px] font-bold text-violet-200">
                                        await
                                    </span>
                                    <span className="h-px w-6 bg-violet-400/50" />
                                </div>

                                <div className="rounded-2xl border border-violet-400/25 bg-violet-400/[0.08] p-5 backdrop-blur">
                                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-300">
                                        Consumer addon
                                    </p>

                                    <p className="mt-3 font-mono text-sm font-bold text-white">
                                        extension:request
                                    </p>

                                    <div className="mt-5 flex items-center gap-2 text-[10px] font-bold text-emerald-300">
                                        <CheckCircle2
                                            size={14}
                                            aria-hidden="true"
                                        />
                                        Typed response
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/25">
                                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                                    <div className="flex gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-rose-400/70" />
                                        <span className="h-2 w-2 rounded-full bg-amber-300/70" />
                                        <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
                                    </div>

                                    <span className="font-mono text-[9px] text-slate-500">
                                        endpoint.ts
                                    </span>
                                </div>

                                <div className="space-y-2 overflow-x-auto p-5 font-mono text-[11px] leading-6 sm:text-xs">
                                    <p>
                                        <span className="text-fuchsia-300">
                                            type
                                        </span>{" "}
                                        <span className="text-sky-300">
                                            SpawnQuery
                                        </span>{" "}
                                        <span className="text-slate-500">
                                            = &#123;
                                        </span>
                                    </p>

                                    <p className="pl-5 text-slate-300">
                                        dimension:
                                        <span className="text-amber-200">
                                            {" "}
                                            string
                                        </span>
                                        ;
                                    </p>

                                    <p className="pl-5 text-slate-300">
                                        radius:
                                        <span className="text-amber-200">
                                            {" "}
                                            number
                                        </span>
                                        ;
                                    </p>

                                    <p className="text-slate-500">
                                        &#125;;
                                    </p>

                                    <p className="pt-2 text-slate-300">
                                        <span className="text-fuchsia-300">
                                            const
                                        </span>{" "}
                                        result =
                                        <span className="text-fuchsia-300">
                                            {" "}
                                            await
                                        </span>{" "}
                                        api.call
                                        <span className="text-violet-300">
                                            (&quot;spawn/query&quot;)
                                        </span>
                                        ;
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto flex flex-wrap items-end justify-between gap-5 pt-8">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[10px] font-bold text-slate-400">
                                    <span>Named endpoints</span>
                                    <span>Async calls</span>
                                    <span>Typed parameters</span>
                                    <span>Decoupled addons</span>
                                </div>

                                <RepositoryLink
                                    project={apiKit}
                                    label="View AddonAPIKit"
                                    inverted
                                />
                            </div>
                        </div>
                    </article>

                    <article className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8 lg:col-span-5">
                        <div
                            aria-hidden="true"
                            className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-200/35 blur-3xl transition duration-500 group-hover:scale-125"
                        />

                        <div className="relative">
                            <div className="flex items-start justify-between gap-5">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                        Test outside Minecraft
                                    </p>

                                    <h3 className="mt-4 max-w-md break-words text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
                                        minecraft-vitest-mocks
                                    </h3>
                                </div>

                                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                                    <Terminal
                                        size={20}
                                        aria-hidden="true"
                                    />
                                </span>
                            </div>

                            <p className="mt-4 max-w-lg text-sm font-medium leading-7 text-slate-600">
                                A focused test layer for Bedrock Script API
                                projects, including server modules, UI behavior,
                                GameTest utilities, scheduled ticks, and dynamic
                                properties.
                            </p>

                            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                                    <span className="font-mono text-[9px] text-slate-500">
                                        npm test
                                    </span>

                                    <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-300">
                                        CI ready
                                    </span>
                                </div>

                                <div className="space-y-3 p-4 font-mono text-[10px]">
                                    {[
                                        "@minecraft/server",
                                        "@minecraft/server-ui",
                                        "scheduled ticks",
                                        "dynamic properties",
                                    ].map((test) => (
                                        <div
                                            key={test}
                                            className="flex items-center justify-between gap-4"
                                        >
                                            <span className="text-slate-400">
                                                {test}
                                            </span>

                                            <span className="flex items-center gap-1.5 text-emerald-300">
                                                <CheckCircle2
                                                    size={12}
                                                    aria-hidden="true"
                                                />
                                                pass
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6">
                                <RepositoryLink
                                    project={vitestMocks}
                                    label="Open test toolkit"
                                />
                            </div>
                        </div>
                    </article>

                    <article className="group relative overflow-hidden rounded-[2rem] border border-violet-200 bg-violet-50 p-6 shadow-[0_24px_70px_rgba(88,28,135,0.08)] sm:p-8 lg:col-span-5">
                        <div
                            aria-hidden="true"
                            className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(124,58,237,0.11)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.11)_1px,transparent_1px)] [background-size:24px_24px]"
                        />

                        <div className="relative grid h-full gap-6 sm:grid-cols-[1fr_0.8fr] sm:items-end">
                            <div>
                                <div className="flex items-center gap-2 text-violet-700">
                                    <PackageCheck
                                        size={16}
                                        aria-hidden="true"
                                    />

                                    <span className="text-[9px] font-black uppercase tracking-[0.16em]">
                                        Reference structure
                                    </span>
                                </div>

                                <h3 className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
                                    Canopy Extension Example
                                </h3>

                                <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
                                    A starting point for extension manifests,
                                    commands, rules, APIs, packaging, and reusable
                                    integration patterns.
                                </p>

                                <div className="mt-6">
                                    <RepositoryLink
                                        project={extensionExample}
                                        label="View starter structure"
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-violet-200/80 bg-white/80 p-4 font-mono text-[10px] shadow-sm backdrop-blur">
                                <div className="mb-3 flex items-center gap-2 border-b border-violet-100 pb-3 text-violet-800">
                                    <FileCode2
                                        size={14}
                                        aria-hidden="true"
                                    />
                                    extension/
                                </div>

                                <div className="space-y-2.5 text-slate-500">
                                    <p>├─ manifest.json</p>
                                    <p>├─ src/commands</p>
                                    <p>├─ src/rules</p>
                                    <p>├─ src/api</p>
                                    <p>└─ package.json</p>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>

                <div className="mt-12 overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 text-white shadow-[0_35px_100px_rgba(15,23,42,0.22)]">
                    <div className="grid border-b border-white/10 sm:grid-cols-4">
                        {[
                            ["01", "Observe"],
                            ["02", "Automate"],
                            ["03", "Construct"],
                            ["04", "Extend"],
                        ].map(([number, title]) => (
                            <div
                                key={title}
                                className="flex items-center gap-3 border-b border-white/10 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                            >
                                <span className="font-mono text-[9px] text-violet-300">
                                    {number}
                                </span>

                                <span className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-300">
                                    {title}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:p-10">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.17em] text-violet-300">
                                ForestOfLight project ecosystem
                            </p>

                            <h3 className="mt-5 max-w-3xl text-3xl font-black tracking-[-0.05em] sm:text-4xl lg:text-5xl">
                                Projects for building, testing, and extending Minecraft Bedrock
                            </h3>

                            <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-slate-400 sm:text-base">
                                The flagship tools, extensions, server systems,
                                and developer foundations form one continuous
                                body of technical work.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 lg:items-end">
                            <a
                                href="#projects"
                                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-[10px] font-black uppercase tracking-[0.12em] text-slate-950 transition duration-300 hover:bg-violet-100 sm:w-auto"

                            data-developer-directory-cta
                            style={{ color: "#0f172a" }}>
                                Browse all projects
                                <ArrowUpRight
                                    size={14}
                                    aria-hidden="true"
                                />
                            </a>

                            <a
                                href="https://github.com/ForestOfLight"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/15 px-6 text-[10px] font-black uppercase tracking-[0.12em] text-white transition duration-300 hover:border-violet-300/50 hover:bg-violet-400/10 sm:w-auto"
                            >
                                GitHub
                                <ArrowUpRight
                                    size={14}
                                    aria-hidden="true"
                                />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
