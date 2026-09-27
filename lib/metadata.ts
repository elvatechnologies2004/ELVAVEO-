import type { Metadata } from "next";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "./constants";

interface PageMetadataInput {
  /** Page name only, e.g. "Products". The "| ELVAVEO" suffix is added for you. */
  title: string;
  description: string;
  /** Absolute path, e.g. "/products". Used for canonical and og:url. */
  path: string;
}

/**
 * Builds consistent per-page metadata.
 *
 * The root layout owns the `title.template` and the global defaults, so a page
 * must pass a bare title and must set its own canonical — otherwise Next.js
 * renders "Products | ELVAVEO | ELVAVEO" and points canonical at the homepage.
 * Keeping that logic here means no page can get it wrong.
 */
export function createPageMetadata({
  title,
  description,
  path,
}: PageMetadataInput): Metadata {
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url,
      title,
      description,
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
