import type { MetadataRoute } from "next";
import { APP_ROUTES, SITE_URL } from "@/lib/constants";

/**
 * Dynamic sitemap generated from the shared route table, so a new page can
 * never be added to the site without also appearing here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return APP_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
