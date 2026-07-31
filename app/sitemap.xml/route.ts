import {
    deliveryManifest,
} from "@/lib/delivery";

export const dynamic =
    "force-dynamic";

function xmlEscape(
    value: string,
): string {
    return value
        .replaceAll(
            "&",
            "&amp;",
        )
        .replaceAll(
            "<",
            "&lt;",
        )
        .replaceAll(
            ">",
            "&gt;",
        )
        .replaceAll(
            '"',
            "&quot;",
        )
        .replaceAll(
            "'",
            "&apos;",
        );
}

export function GET(
    request: Request,
) {
    const origin =
        new URL(
            request.url,
        ).origin;

    const generatedAt =
        new Date(
            deliveryManifest.generatedAt,
        )
            .toISOString();

    const entries =
        deliveryManifest.routes.map(
            (
                route,
            ) => {
                const url =
                    new URL(
                        route,
                        origin,
                    ).toString();

                return [
                    "  <url>",
                    `    <loc>${xmlEscape(url)}</loc>`,
                    `    <lastmod>${generatedAt}</lastmod>`,
                    "  </url>",
                ].join(
                    "\n",
                );
            },
        );

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...entries,
        "</urlset>",
        "",
    ].join(
        "\n",
    );

    return new Response(
        xml,
        {
            status:
                200,
            headers: {
                "Content-Type":
                    "application/xml; charset=utf-8",
                "Cache-Control":
                    "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
            },
        },
    );
}
