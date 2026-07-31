import type {
    MetadataRoute,
} from "next";

export default function robots():
    MetadataRoute.Robots {
    const configuredOrigin =
        process.env
            .NEXT_PUBLIC_SITE_URL
            ?.replace(
                /\/+$/,
                "",
            );

    return {
        rules: {
            userAgent:
                "*",
            allow:
                "/",
        },
        sitemap:
            configuredOrigin
                ? `${configuredOrigin}/sitemap.xml`
                : "/sitemap.xml",
    };
}
