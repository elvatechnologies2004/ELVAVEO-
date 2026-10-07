/**
 * Site-wide constants.
 *
 * Single source of truth for brand identity, routes, and product links so the
 * navbar, footer, metadata, sitemap, and contact API can never drift apart.
 */

/** Canonical production origin. Used for metadataBase, sitemap, and robots. */
export const SITE_URL = "https://elvaveo.com";

export const SITE_NAME = "ELVAVEO";

export const SITE_DESCRIPTION =
  "ELVAVEO builds modern software, SaaS products, web experiences and digital solutions, including Finlo and FinloCRM.";

export const SITE_AUTHOR = "ELVAVEO";

/** Inbox that receives contact form submissions. */
export const CONTACT_EMAIL = "hello@elvaveo.com";

/**
 * Brand logo used in the navbar and footer.
 *
 * The 8-character suffix is the first 8 hex digits of the file's SHA-256, so
 * the URL changes whenever the artwork does. Without it the path stays the
 * same across a logo swap and browsers keep serving the old image from cache -
 * the Next.js image optimizer serves it with a 4 hour freshness window, so a
 * rebrand would stay invisible to returning visitors.
 *
 * To swap the logo: run scripts/crop-brand-mark.ps1, rename the result to
 * elvaveo-logo.<new-hash>.png and update this line. The navbar and footer read
 * it from here, so nothing else needs editing.
 */
export const BRAND_LOGO = "/brand/elvaveo-logo.3d7b3289.png";

/** Social sharing image (1200x630). */
export const OG_IMAGE = "/og-image.png";

export interface AppRoute {
  /** Absolute path, e.g. "/about". */
  path: string;
  label: string;
  /** Sitemap priority, 0-1. */
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
}

/**
 * Every page on the site, in navigation order.
 *
 * The navbar renders `label` + `path`; `app/sitemap.ts` renders the rest.
 */
export const APP_ROUTES: readonly AppRoute[] = [
  { path: "/", label: "Home", priority: 1, changeFrequency: "monthly" },
  { path: "/about", label: "About", priority: 0.8, changeFrequency: "monthly" },
  { path: "/services", label: "Services", priority: 0.9, changeFrequency: "monthly" },
  { path: "/products", label: "Products", priority: 0.9, changeFrequency: "monthly" },
  { path: "/projects", label: "Projects", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", label: "Contact", priority: 0.8, changeFrequency: "yearly" },
] as const;

export interface ProductLink {
  id: "finlo" | "finlonexa";
  name: string;
  /** Live product site, hosted on an ELVAVEO subdomain. */
  href: string;
}

/** Live ELVAVEO products, linked from the products page, cards, and footer. */
export const PRODUCT_LINKS: readonly ProductLink[] = [
  { id: "finlo", name: "Finlo", href: "https://finlo.elvaveo.com" },
  {
    id: "finlonexa",
    name: "FinloCRM",
    href: "https://crm.elvaveo.com",
  },
] as const;
