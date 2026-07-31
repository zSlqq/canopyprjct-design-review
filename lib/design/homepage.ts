export type HeroCapabilityId =
    | "world"
    | "tests"
    | "builds"
    | "regions"
    | "servers"
    | "addons";

export type HeroCapability = {
    id: HeroCapabilityId;
    label: string;
    eyebrow: string;
    description: string;
    technicalLabels: readonly string[];
};

export const homepageCopy = {
    eyebrow: "ForestOfLight / Technical Bedrock",
    title: "The technical layer for Bedrock.",
    introduction:
        "Analyze worlds, automate tests, transfer builds, edit regions, control servers, and extend addons through one connected body of technical work.",
    primaryAction: "Open Canopy",
    secondaryAction: "Browse all projects",
} as const;

// Change any hero label here. The visual state is keyed by `id`,
// so wording changes do not require component or CSS edits.
export const heroCapabilities = [
    {
        id: "world",
        label: "Read world state",
        eyebrow: "Canopy / live information",
        description:
            "Inspect blocks, entities, light, biomes, counters, and tick behavior while the world remains active.",
        technicalLabels: [
            "block",
            "entity",
            "light",
            "biome",
            "tick",
        ],
    },
    {
        id: "tests",
        label: "Automate technical tests",
        eyebrow: "Understudy / repeatable action",
        description:
            "Move a simulated player, target an interaction, run a timed action, and record the resulting state.",
        technicalLabels: [
            "path",
            "target",
            "action",
            "assertion",
            "result",
        ],
    },
    {
        id: "builds",
        label: "Transfer builds",
        eyebrow: "Construct / survival workflow",
        description:
            "Translate a creative structure into layers, material requirements, validation states, and a completed survival build.",
        technicalLabels: [
            "ghost",
            "layers",
            "materials",
            "validate",
            "complete",
        ],
    },
    {
        id: "regions",
        label: "Edit regions",
        eyebrow: "Nudge / precise transformation",
        description:
            "Select a volume, apply an offset, move or clone blocks, and keep a clear before-and-after state.",
        technicalLabels: [
            "select",
            "offset",
            "move",
            "clone",
            "undo",
        ],
    },
    {
        id: "servers",
        label: "Control servers",
        eyebrow: "Boreal / controlled progression",
        description:
            "Freeze world progression, step ticks deliberately, inspect activity, and manage technical server behavior.",
        technicalLabels: [
            "freeze",
            "step",
            "chunks",
            "tick",
            "resume",
        ],
    },
    {
        id: "addons",
        label: "Extend addons",
        eyebrow: "Canopy / typed extension layer",
        description:
            "Connect Canopy, extensions, tests, and independent tools through verified interfaces and reusable project structures.",
        technicalLabels: [
            "register",
            "request",
            "response",
            "test",
            "package",
        ],
    },
] as const satisfies readonly HeroCapability[];
