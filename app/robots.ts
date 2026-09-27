import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

/**
 * Allows normal crawling and points search engines at the sitemap.
 * The contact API is disallowed — it is not a page and takes no index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
