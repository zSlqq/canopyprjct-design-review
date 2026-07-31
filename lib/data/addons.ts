import type { AddonProject } from "@/lib/types";
function repoScreenshots(repository: string, primary?: string): string[] {
    return [
        primary ??
            `/icon.svg`,
        `/icon.svg`,
        `/icon.svg`
    ];
}
/*
 * Download counts intentionally remain nullable because public
 * publisher totals change continuously.
 *
 * Repository stars are a dated public snapshot, not live data.
 */
export const addons: AddonProject[] = [
    {
        id: "canopy",
        title: "Canopy",
        shortDescription: "The flagship technical toolkit for analyzing, optimizing, and understanding Minecraft Bedrock worlds.",
        fullDescription: "Canopy is the foundation of ForestOfLight's technical Bedrock ecosystem. It provides live world information, debugging utilities, farm and spawn analysis, tick controls, configurable gameplay rules, and an extension system while preserving the vanilla character of the game.",
        author: "ForestOfLight",
        version: "See latest release",
        minecraftVersion: "Check release notes",
        category: "Redstone",
        kind: "Flagship",
        downloadUrl: "https://github.com/ForestOfLight/Canopy/releases/latest",
        githubUrl: "https://github.com/ForestOfLight/Canopy",
        stats: {
            downloads: null,
            stars: null,
            updatedAt: "Publisher maintained"
        },
        screenshots: repoScreenshots("Canopy"),
        capabilities: [
            "Live TPS, biome, lighting, block, and entity information",
            "Farm-rate and spawn tracking",
            "Hopper counters and technical diagnostics",
            "Tick-speed manipulation",
            "Configurable technical and quality-of-life rules",
            "Modular extension support"
        ],
        installationSteps: [
            "Download the latest .mcaddon release from GitHub.",
            "Open the downloaded file with Minecraft Bedrock.",
            "Apply the Canopy behavior and resource packs to the world.",
            "Enable the Beta APIs experimental feature.",
            "Enter the world and configure Canopy through its commands and menu."
        ],
        dependencies: [
            "Minecraft Bedrock Edition",
            "Beta APIs experimental feature"
        ],
        tags: [
            "technical",
            "telemetry",
            "redstone",
            "farm analysis",
            "spawn tracking",
            "vanilla+"
        ],
        accent: "#7C3AED",
        featured: true
    },
    {
        id: "understudy",
        title: "Understudy",
        shortDescription: "Precise simulated-player control for farms, loading, automation, and repeatable technical experiments.",
        fullDescription: "Understudy extends Canopy with simulated players that can join, move, navigate, interact, attack, build, break, use items, manage inventories, and perform delayed or repeating actions.",
        author: "ForestOfLight",
        version: "See latest release",
        minecraftVersion: "Check release notes",
        category: "Automation",
        kind: "Extension",
        downloadUrl: "https://github.com/ForestOfLight/Understudy/releases/latest",
        githubUrl: "https://github.com/ForestOfLight/Understudy",
        stats: {
            downloads: null,
            stars: null,
            updatedAt: "Publisher maintained"
        },
        screenshots: repoScreenshots("Understudy"),
        capabilities: [
            "Create and remove simulated players",
            "Movement and vanilla pathfinding",
            "Attack, interact, build, break, and use actions",
            "Delayed and repeating action schedules",
            "Hotbar and inventory controls",
            "Persistent rejoining behavior"
        ],
        installationSteps: [
            "Install a compatible version of Canopy.",
            "Download the latest Understudy release.",
            "Import the addon into Minecraft.",
            "Apply Understudy to the same world as Canopy.",
            "Use the simplayer command family to create and control players."
        ],
        dependencies: [
            "Canopy",
            "Minecraft Bedrock Edition"
        ],
        tags: [
            "simulated players",
            "fake players",
            "automation",
            "AFK",
            "testing"
        ],
        accent: "#8B5CF6",
        featured: true
    },
    {
        id: "construct",
        title: "Construct",
        shortDescription: "A survival-building workflow for transferring, validating, and collaboratively constructing complex designs.",
        fullDescription: "Construct brings a structure-guided building workflow to Minecraft Bedrock. It helps players move designs from creative into survival, identify incorrect blocks, gather required materials, and construct large builds one layer at a time.",
        author: "ForestOfLight",
        version: "See latest release",
        minecraftVersion: "Check release notes",
        category: "Mechanics",
        kind: "Addon",
        downloadUrl: "https://github.com/ForestOfLight/Construct/releases/latest",
        githubUrl: "https://github.com/ForestOfLight/Construct",
        stats: {
            downloads: null,
            stars: null,
            updatedAt: "Publisher maintained"
        },
        screenshots: repoScreenshots("Construct"),
        capabilities: [
            "Easy Place building assistance",
            "Incorrect-block validation",
            "Layer-by-layer construction",
            "Material retrieval workflows",
            "Multiple structure instances",
            ".mcstructure importing"
        ],
        installationSteps: [
            "Download the newest Construct release.",
            "Import the addon into Minecraft.",
            "Apply its packs to the target world.",
            "Enable the required experimental APIs.",
            "Open the Construct interface and import or create a structure instance."
        ],
        dependencies: [
            "Minecraft Bedrock Edition",
            "Beta APIs experimental feature"
        ],
        tags: [
            "building",
            "structures",
            "survival",
            "Litematica",
            "collaboration"
        ],
        accent: "#6D28D9",
        featured: true
    },
    {
        id: "nudge",
        title: "Nudge",
        shortDescription: "Powerful creative editing through fast selection, movement-based transformation, cloning, and undo controls.",
        fullDescription: "Nudge is a creative building tool inspired by the speed and simplicity of modern world-editing interfaces. Players can select regions from a distance and transform builds without relying on long command sequences.",
        author: "ForestOfLight",
        version: "See latest release",
        minecraftVersion: "Check release notes",
        category: "Mechanics",
        kind: "Addon",
        downloadUrl: "https://github.com/ForestOfLight/Nudge/releases/latest",
        githubUrl: "https://github.com/ForestOfLight/Nudge",
        stats: {
            downloads: null,
            stars: null,
            updatedAt: "Publisher maintained"
        },
        screenshots: repoScreenshots("Nudge"),
        capabilities: [
            "Long-distance region selection",
            "Movement-based editing",
            "Move, clone, stack, and delete operations",
            "Large-volume transformations",
            "Undo and redo history",
            "Expandable transformation system"
        ],
        installationSteps: [
            "Download the latest Nudge release.",
            "Import the addon into Minecraft.",
            "Apply the required packs to a creative world.",
            "Enable the experiments listed by the release.",
            "Use the selection and movement tools to begin editing."
        ],
        dependencies: [
            "Minecraft Bedrock Edition",
            "Debug permissions for selected server features"
        ],
        tags: [
            "creative",
            "world edit",
            "selection",
            "building",
            "Axiom",
            "undo"
        ],
        accent: "#9333EA",
        featured: true
    },
    {
        id: "statistic-display",
        title: "Statistic Display",
        shortDescription: "A focused Canopy extension for tracking and comparing detailed multiplayer world statistics.",
        fullDescription: "Statistic Display records multiplayer and single-player activity without requiring a large collection of scoreboard objectives. Statistics continue tracking even while they are not actively displayed.",
        author: "ForestOfLight",
        version: "See latest release",
        minecraftVersion: "Check release notes",
        category: "Scripting",
        kind: "Extension",
        downloadUrl: "https://github.com/ForestOfLight/Statistic-Display/releases/latest",
        githubUrl: "https://github.com/ForestOfLight/Statistic-Display",
        stats: {
            downloads: null,
            stars: null,
            updatedAt: "Publisher maintained"
        },
        screenshots: repoScreenshots("Statistic-Display"),
        capabilities: [
            "Deaths and survival streaks",
            "Blocks mined and placed",
            "Combat and damage statistics",
            "Item and tool activity",
            "Session and dimension tracking",
            "Single-objective scoreboard display"
        ],
        installationSteps: [
            "Install Canopy first.",
            "Download and import Statistic Display.",
            "Apply the extension to the Canopy-enabled world.",
            "Select the statistics to track and display.",
            "Configure scoreboard rotation as required."
        ],
        dependencies: [
            "Canopy",
            "Minecraft Bedrock Edition"
        ],
        tags: [
            "statistics",
            "scoreboard",
            "multiplayer",
            "analytics",
            "tracking"
        ],
        accent: "#A855F7"
    },
    {
        id: "boreal",
        title: "Boreal",
        shortDescription: "Native Endstone server tooling that unlocks technical controls unavailable through the normal Script API.",
        fullDescription: "Boreal operates below the behavior-pack layer as an Endstone server plugin. It fills technical gaps in Bedrock's Script API and can integrate with Canopy while remaining useful independently.",
        author: "ForestOfLight",
        version: "See latest release",
        minecraftVersion: "Check release notes",
        category: "Redstone",
        kind: "Server plugin",
        downloadUrl: "https://github.com/ForestOfLight/Boreal/releases/latest",
        githubUrl: "https://github.com/ForestOfLight/Boreal",
        stats: {
            downloads: null,
            stars: null,
            updatedAt: "Publisher maintained"
        },
        screenshots: ["/projects/boreal/Boreal-Logo.png"],
        capabilities: [
            "Tick-rate control",
            "Freeze, unfreeze, and step ticks",
            "Tick sprinting",
            "Creative fly-speed controls",
            "Noclip and obstructed-container access",
            "Piston and chunk-ticking configuration"
        ],
        installationSteps: [
            "Prepare an Endstone-compatible Bedrock server.",
            "Download the latest Boreal plugin build.",
            "Place the plugin in the server plugins directory.",
            "Restart the server.",
            "Review the Boreal configuration and optionally connect it to Canopy."
        ],
        dependencies: [
            "Endstone-compatible Bedrock server",
            "Canopy is optional"
        ],
        tags: [
            "server",
            "Endstone",
            "native",
            "ticks",
            "pistons",
            "profiling"
        ],
        accent: "#581C87"
    },
    {
        id: "addon-api-kit",
        title: "AddonAPIKit",
        shortDescription: "A typed communication layer that allows independent Bedrock addons to expose and consume reusable APIs.",
        fullDescription: "AddonAPIKit lets Script API projects communicate through clearly defined endpoints and typed contracts instead of tightly coupling their internal implementations.",
        author: "ForestOfLight",
        version: "See latest release",
        minecraftVersion: "Check release notes",
        category: "Scripting",
        kind: "Developer tool",
        downloadUrl: "https://github.com/ForestOfLight/AddonAPIKit",
        githubUrl: "https://github.com/ForestOfLight/AddonAPIKit",
        stats: {
            downloads: null,
            stars: null,
            updatedAt: "Publisher maintained"
        },
        screenshots: repoScreenshots("AddonAPIKit"),
        capabilities: [
            "Typed addon-to-addon APIs",
            "Named endpoint registration",
            "Parameter validation",
            "Asynchronous return values",
            "Reusable integration contracts",
            "Decoupled addon architecture"
        ],
        installationSteps: [
            "Add AddonAPIKit to the Script API project.",
            "Define the API contract and parameter types.",
            "Register endpoint handlers in the provider addon.",
            "Call the endpoint from consuming addons.",
            "Handle asynchronous results and errors."
        ],
        dependencies: [
            "@minecraft/server",
            "JavaScript or TypeScript addon project"
        ],
        tags: [
            "API",
            "TypeScript",
            "interoperability",
            "developer",
            "script events"
        ],
        accent: "#7E22CE"
    },
    {
        id: "minecraft-vitest-mocks",
        title: "minecraft-vitest-mocks",
        shortDescription: "A practical Vitest environment for testing Minecraft Bedrock Script API projects outside the game.",
        fullDescription: "minecraft-vitest-mocks supports fast, repeatable addon testing without launching Minecraft by mocking important Script API modules, scheduling behavior, dynamic properties, and UI systems.",
        author: "ForestOfLight",
        version: "See latest release",
        minecraftVersion: "Check release notes",
        category: "Scripting",
        kind: "Developer tool",
        downloadUrl: "https://github.com/ForestOfLight/minecraft-vitest-mocks",
        githubUrl: "https://github.com/ForestOfLight/minecraft-vitest-mocks",
        stats: {
            downloads: null,
            stars: null,
            updatedAt: "Publisher maintained"
        },
        screenshots: repoScreenshots("minecraft-vitest-mocks"),
        capabilities: [
            "@minecraft/server mocks",
            "@minecraft/server-ui mocks",
            "GameTest and debug utility support",
            "Scheduled tick simulation",
            "Dynamic property storage",
            "Continuous integration support"
        ],
        installationSteps: [
            "Add the library as a development dependency.",
            "Configure Vitest aliases for Minecraft modules.",
            "Initialize the required mocks in the test setup.",
            "Write tests against the mocked server environment.",
            "Run the suite locally or in continuous integration."
        ],
        dependencies: [
            "Node.js",
            "Vitest",
            "TypeScript is recommended"
        ],
        tags: [
            "testing",
            "Vitest",
            "mocks",
            "TypeScript",
            "Script API"
        ],
        accent: "#8B5CF6"
    },
    {
        id: "canopy-extension-example",
        title: "Canopy Extension Example",
        shortDescription: "The official starting structure for developers creating modular projects that integrate with Canopy.",
        fullDescription: "The Canopy Extension Example provides a reusable baseline for manifests, packaging, commands, rules, APIs, and extension-specific behavior.",
        author: "ForestOfLight",
        version: "See latest release",
        minecraftVersion: "Check release notes",
        category: "Scripting",
        kind: "Template",
        downloadUrl: "https://github.com/ForestOfLight/Canopy-Extension-Example",
        githubUrl: "https://github.com/ForestOfLight/Canopy-Extension-Example",
        stats: {
            downloads: null,
            stars: null,
            updatedAt: "Publisher maintained"
        },
        screenshots: repoScreenshots("Canopy-Extension-Example"),
        capabilities: [
            "Extension-ready project structure",
            "Canopy integration patterns",
            "Manifest and packaging foundation",
            "Command and rule scaffolding",
            "Testing baseline",
            "Open contribution path"
        ],
        installationSteps: [
            "Create a new repository from the example.",
            "Replace package and manifest identifiers.",
            "Declare the compatible Canopy version.",
            "Implement extension commands and behavior.",
            "Build and test inside a Canopy-enabled world."
        ],
        dependencies: [
            "Canopy",
            "Minecraft Bedrock Script API"
        ],
        tags: [
            "template",
            "extension",
            "Canopy",
            "developer",
            "open source"
        ],
        accent: "#6B21A8"
    }
];
export const featuredAddons = addons.filter((addon) => addon.featured);
