import { MetadataRoute } from "next";

/**
 * Generator File robots.txt Otomatis untuk Next.js 15 App Router.
 * Mengatur akses web crawler serta merujuk ke sitemap.xml.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kerajinanraja.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
