import type {
    Metadata,
} from "next";
import { Stage20FeatureCommandCenterClient } from "./Stage20FeatureCommandCenterClient";

export const metadata: Metadata = {
    title:
        "Feature Command Center | ForestOfLight",
    description:
        "Search ForestOfLight features, commands, statistics, rules, APIs, workflows, and repositories.",
};

export const dynamic = "force-static";
export const revalidate = false;

export default function FeaturesPage() {
    return <Stage20FeatureCommandCenterClient />;
}
