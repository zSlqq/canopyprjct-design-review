import {
    NextResponse,
} from "next/server";

import {
    deliveryManifest,
} from "@/lib/delivery";

export const dynamic =
    "force-static";

export const revalidate =
    false;

export function GET() {
    return NextResponse.json(
        {
            status:
                deliveryManifest.passed
                    ? "ok"
                    : "degraded",
            service:
                "forestoflight-technical-bedrock-hub",
            fingerprint:
                deliveryManifest.fingerprint,
            generatedAt:
                deliveryManifest.generatedAt,
            summary:
                deliveryManifest.summary,
            checks:
                deliveryManifest.checks,
        },
        {
            status:
                deliveryManifest.passed
                    ? 200
                    : 503,
            headers: {
                "Cache-Control":
                    "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
            },
        },
    );
}
