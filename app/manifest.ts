import type {
    MetadataRoute,
} from "next";

export default function manifest():
    MetadataRoute.Manifest {
    return {
        name:
            "ForestOfLight Technical Bedrock Hub",
        short_name:
            "ForestOfLight",
        description:
            "A unified technical documentation and project hub for the ForestOfLight Bedrock ecosystem.",
        start_url:
            "/",
        display:
            "standalone",
        background_color:
            "#080d18",
        theme_color:
            "#7c3aed",
        categories: [
            "developer",
            "documentation",
            "utilities",
        ],
        icons: [
            {
                src:
                    "/icon.svg",
                sizes:
                    "any",
                type:
                    "image/svg+xml",
                purpose:
                    "any",
            },
        ],
    };
}
