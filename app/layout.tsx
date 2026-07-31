import type { Metadata } from "next";
import type { ReactNode } from "react";

import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import "./globals.css";
import "./stage37-dark.css";
import "./font-system.css";

export const metadata: Metadata = {
    title: {
        default:
            "ForestOfLight / Technical Bedrock Hub",
        template:
            "%s | ForestOfLight Technical Bedrock",
    },
    description:
        "An independent showcase of ForestOfLight's Minecraft Bedrock technical addons, Canopy extensions, building tools, server systems, and developer infrastructure.",
    applicationName:
        "ForestOfLight Technical Bedrock Hub",
    keywords: [
        "ForestOfLight",
        "Minecraft Bedrock",
        "Canopy",
        "Understudy",
        "Construct",
        "Nudge",
        "Boreal",
        "technical Minecraft",
        "Bedrock addons",
    ],
    authors: [
        {
            name: "ForestOfLight",
            url: "https://github.com/ForestOfLight",
        },
    ],
    creator: "ForestOfLight",
    openGraph: {
        title:
            "ForestOfLight / Technical Bedrock Hub",
        description:
            "Explore Canopy and the wider ForestOfLight technical Bedrock ecosystem.",
        type: "website",
        siteName:
            "ForestOfLight Technical Bedrock Hub",
    },
    twitter: {
        card: "summary_large_image",
        title:
            "ForestOfLight / Technical Bedrock Hub",
        description:
            "Explore Canopy and the wider ForestOfLight technical Bedrock ecosystem.",
    },
    robots: {
        index: true,
        follow: true,
    },
};

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({
    children,
}: RootLayoutProps) {
    return (
        <html
            lang="en"
            className={`${GeistSans.variable} ${GeistMono.variable}`}
        >
            <body>{children}</body>
        </html>
    );
}
