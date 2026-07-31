export type RepositoryIndexEntry = {
    position: number;
    slug: string;
    name: string;
    description: string;
    language: string;
    category: string;
    relationship: string;
    projectHref: string;
    archiveHref: string;
    docsHref: string;
    sourceHref: string;
    counts: {
        versions: number;
        releaseAssets: number;
        documents: number;
        commands: number;
        globalRules: number;
        functions: number;
    };
};

export const repositoryIndex =
    [
    {
        "position": 1,
        "slug": "canopy",
        "name": "Canopy",
        "description": "An addon for Minecraft Bedrock that adds technical informatics, new features, and QoL options.",
        "language": "JavaScript",
        "category": "Core system",
        "relationship": "Flagship project",
        "projectHref": "/projects/canopy",
        "archiveHref": "/archive/canopy",
        "docsHref": "/docs/canopy",
        "sourceHref": "https://github.com/ForestOfLight/Canopy",
        "counts": {
            "versions": 34,
            "releaseAssets": 114,
            "documents": 9,
            "commands": 59,
            "globalRules": 115,
            "functions": 1650
        }
    },
    {
        "position": 2,
        "slug": "understudy",
        "name": "Understudy",
        "description": "A simulated player Canopy extension for Minecraft Bedrock Edition.",
        "language": "JavaScript",
        "category": "Canopy extension",
        "relationship": "Extends Canopy",
        "projectHref": "/projects/understudy",
        "archiveHref": "/archive/understudy",
        "docsHref": "/docs/understudy",
        "sourceHref": "https://github.com/ForestOfLight/Understudy",
        "counts": {
            "versions": 21,
            "releaseAssets": 63,
            "documents": 1,
            "commands": 19,
            "globalRules": 1,
            "functions": 324
        }
    },
    {
        "position": 3,
        "slug": "statistic-display",
        "name": "Statistic-Display",
        "description": "An easy statistics tracker for Minecraft Bedrock Edition.",
        "language": "JavaScript",
        "category": "World information",
        "relationship": "Independent addon",
        "projectHref": "/projects/statistic-display",
        "archiveHref": "/archive/statistic-display",
        "docsHref": "/docs/statistic-display",
        "sourceHref": "https://github.com/ForestOfLight/Statistic-Display",
        "counts": {
            "versions": 17,
            "releaseAssets": 51,
            "documents": 1,
            "commands": 9,
            "globalRules": 2,
            "functions": 228
        }
    },
    {
        "position": 4,
        "slug": "construct",
        "name": "Construct",
        "description": "A Minecraft Bedrock addon to ease the survival building process.",
        "language": "JavaScript",
        "category": "Building workflow",
        "relationship": "Independent addon",
        "projectHref": "/projects/construct",
        "archiveHref": "/archive/construct",
        "docsHref": "/docs/construct",
        "sourceHref": "https://github.com/ForestOfLight/Construct",
        "counts": {
            "versions": 11,
            "releaseAssets": 33,
            "documents": 5,
            "commands": 9,
            "globalRules": 0,
            "functions": 508
        }
    },
    {
        "position": 5,
        "slug": "nudge",
        "name": "Nudge",
        "description": "An addon that adds intuitive, powerful creative building tools to Minecraft Bedrock.",
        "language": "JavaScript",
        "category": "Building workflow",
        "relationship": "Independent addon",
        "projectHref": "/projects/nudge",
        "archiveHref": "/archive/nudge",
        "docsHref": "/docs/nudge",
        "sourceHref": "https://github.com/ForestOfLight/Nudge",
        "counts": {
            "versions": 5,
            "releaseAssets": 15,
            "documents": 1,
            "commands": 11,
            "globalRules": 0,
            "functions": 423
        }
    },
    {
        "position": 6,
        "slug": "boreal",
        "name": "Boreal",
        "description": "An Endstone plugin for Technical Minecraft Bedrock Edition.",
        "language": "C++",
        "category": "Server tooling",
        "relationship": "Independent plugin",
        "projectHref": "/projects/boreal",
        "archiveHref": "/archive/boreal",
        "docsHref": "/docs/boreal",
        "sourceHref": "https://github.com/ForestOfLight/Boreal",
        "counts": {
            "versions": 3,
            "releaseAssets": 9,
            "documents": 1,
            "commands": 11,
            "globalRules": 0,
            "functions": 79
        }
    },
    {
        "position": 7,
        "slug": "addonapikit",
        "name": "AddonAPIKit",
        "description": "Expose APIs from your Minecraft Bedrock Addons",
        "language": "JavaScript",
        "category": "Developer infrastructure",
        "relationship": "Independent library",
        "projectHref": "/projects/addonapikit",
        "archiveHref": "/archive/addonapikit",
        "docsHref": "/docs/addonapikit",
        "sourceHref": "https://github.com/ForestOfLight/AddonAPIKit",
        "counts": {
            "versions": 1,
            "releaseAssets": 3,
            "documents": 4,
            "commands": 0,
            "globalRules": 0,
            "functions": 73
        }
    },
    {
        "position": 8,
        "slug": "amelixsmpviewer",
        "name": "AmelixSMPViewer",
        "description": "A webpage to view the Amelix worlds. Rendered by uNmINeD with a custom world-switcher.",
        "language": "JavaScript",
        "category": "World viewer",
        "relationship": "Independent web tool",
        "projectHref": "/projects/amelixsmpviewer",
        "archiveHref": "/archive/amelixsmpviewer",
        "docsHref": "/docs/amelixsmpviewer",
        "sourceHref": "https://github.com/ForestOfLight/AmelixSMPViewer",
        "counts": {
            "versions": 0,
            "releaseAssets": 0,
            "documents": 1,
            "commands": 0,
            "globalRules": 0,
            "functions": 71
        }
    },
    {
        "position": 9,
        "slug": "bedrock-src-itemstack-database",
        "name": "Bedrock-SRC-ItemStack-Database",
        "description": "A Minecraft Bedrock Script Api ItemStack database to save items along with its NBT Data",
        "language": "JavaScript",
        "category": "Developer infrastructure",
        "relationship": "Independent library",
        "projectHref": "/projects/bedrock-src-itemstack-database",
        "archiveHref": "/archive/bedrock-src-itemstack-database",
        "docsHref": "/docs/bedrock-src-itemstack-database",
        "sourceHref": "https://github.com/ForestOfLight/Bedrock-SRC-ItemStack-Database",
        "counts": {
            "versions": 0,
            "releaseAssets": 0,
            "documents": 1,
            "commands": 0,
            "globalRules": 0,
            "functions": 78
        }
    },
    {
        "position": 10,
        "slug": "canopy-extension-example",
        "name": "Canopy-Extension-Example",
        "description": "An example Canopy Extension behavior pack.",
        "language": "JavaScript",
        "category": "Developer infrastructure",
        "relationship": "Canopy extension example",
        "projectHref": "/projects/canopy-extension-example",
        "archiveHref": "/archive/canopy-extension-example",
        "docsHref": "/docs/canopy-extension-example",
        "sourceHref": "https://github.com/ForestOfLight/Canopy-Extension-Example",
        "counts": {
            "versions": 0,
            "releaseAssets": 0,
            "documents": 1,
            "commands": 0,
            "globalRules": 0,
            "functions": 113
        }
    },
    {
        "position": 11,
        "slug": "minecraft-vitest-mocks",
        "name": "minecraft-vitest-mocks",
        "description": "A template library for mocking the Minecraft Bedrock Script API modules with Vitest.",
        "language": "JavaScript",
        "category": "Testing infrastructure",
        "relationship": "Independent library",
        "projectHref": "/projects/minecraft-vitest-mocks",
        "archiveHref": "/archive/minecraft-vitest-mocks",
        "docsHref": "/docs/minecraft-vitest-mocks",
        "sourceHref": "https://github.com/ForestOfLight/minecraft-vitest-mocks",
        "counts": {
            "versions": 0,
            "releaseAssets": 0,
            "documents": 1,
            "commands": 0,
            "globalRules": 0,
            "functions": 21
        }
    },
    {
        "position": 12,
        "slug": "add-on-registry",
        "name": "add-on-registry",
        "description": "A registry for Minecraft Bedrock Add-Ons and their basic meta-data. This is intended to be used by features such as WAILA-add-ons to display accurate information about packs.",
        "language": "Not specified",
        "category": "Registry and data",
        "relationship": "Independent registry",
        "projectHref": "/projects/add-on-registry",
        "archiveHref": "/archive/add-on-registry",
        "docsHref": "/docs/add-on-registry",
        "sourceHref": "https://github.com/ForestOfLight/add-on-registry",
        "counts": {
            "versions": 5,
            "releaseAssets": 10,
            "documents": 1,
            "commands": 0,
            "globalRules": 0,
            "functions": 9
        }
    },
    {
        "position": 13,
        "slug": "toontown-rewritten-bot",
        "name": "Toontown-Rewritten-Bot",
        "description": "Repository documentation is available in the local archive.",
        "language": "C#",
        "category": "Automation",
        "relationship": "Independent project",
        "projectHref": "/projects/toontown-rewritten-bot",
        "archiveHref": "/archive/toontown-rewritten-bot",
        "docsHref": "/docs/toontown-rewritten-bot",
        "sourceHref": "https://github.com/ForestOfLight/Toontown-Rewritten-Bot",
        "counts": {
            "versions": 3,
            "releaseAssets": 7,
            "documents": 1,
            "commands": 0,
            "globalRules": 0,
            "functions": 61
        }
    },
    {
        "position": 14,
        "slug": "coralfans",
        "name": "CoralFans",
        "description": "CoralFans Mod.",
        "language": "Not specified",
        "category": "Addon",
        "relationship": "Independent project",
        "projectHref": "/projects/coralfans",
        "archiveHref": "/archive/coralfans",
        "docsHref": "/docs/coralfans",
        "sourceHref": "https://github.com/ForestOfLight/CoralFans",
        "counts": {
            "versions": 0,
            "releaseAssets": 0,
            "documents": 2,
            "commands": 0,
            "globalRules": 0,
            "functions": 140
        }
    },
    {
        "position": 15,
        "slug": "skyoobguide",
        "name": "skyoobguide",
        "description": "A documentation of tricks and glitches in Sky: Children of the Light.",
        "language": "SCSS",
        "category": "Documentation",
        "relationship": "Independent guide",
        "projectHref": "/projects/skyoobguide",
        "archiveHref": "/archive/skyoobguide",
        "docsHref": "/docs/skyoobguide",
        "sourceHref": "https://github.com/ForestOfLight/skyoobguide",
        "counts": {
            "versions": 0,
            "releaseAssets": 0,
            "documents": 17,
            "commands": 0,
            "globalRules": 0,
            "functions": 63
        }
    }
] as const satisfies readonly RepositoryIndexEntry[];

export type RepositorySlug =
    (typeof repositoryIndex)[number]["slug"];
