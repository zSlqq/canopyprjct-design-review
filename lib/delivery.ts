import deliveryJson from "@/lib/data/generated/docs/delivery-manifest.json";

export type DeliveryManifest = {
    schemaVersion: number;
    generatedAt: string;
    fingerprint: string;
    routes: string[];
    summary: {
        projects: number;
        documents: number;
        sections: number;
        words: number;
        searchEntries: number;
        searchShards: number;
        searchBytes: number;
        mediaAssets: number;
        mediaBytes: number;
        routes: number;
    };
    checks:
        Record<string, boolean>;
    passed: boolean;
};

export const deliveryManifest =
    deliveryJson as unknown as DeliveryManifest;
