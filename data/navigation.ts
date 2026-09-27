import { APP_ROUTES, PRODUCT_LINKS, SITE_URL } from "@/lib/constants";

export interface NavItem {
  label: string;
  href: string;
}

/**
 * Primary navigation used by the navbar and the footer.
 *
 * Derived from the shared route table in lib/constants so the menu, the
 * sitemap, and the real pages can never drift apart.
 */
export const navItems: NavItem[] = APP_ROUTES.map(({ label, path }) => ({
  label,
  href: path,
}));

export interface SocialLink {
  label: string;
  href: string;
  ariaLabel: string;
  /** Brand glyph name — resolved in Footer and on the contact page */
  icon: "linkedin" | "x" | "instagram" | "facebook";
}

/** Company page for the group behind ELVAVEO. */
const LINKEDIN_COMPANY_URL = "https://www.linkedin.com/company/elva-global/";

/** Brand account for short updates and product news. */
const X_PROFILE_URL = "https://x.com/ELVAVEO";

/**
 * Visual channels for campaigns, launches, and behind-the-scenes posts.
 * The Facebook page has no vanity username, so the canonical numeric
 * form is the only stable URL (facebook.com/Elvaveo does not resolve).
 */
const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/elvaveo/";
const FACEBOOK_PAGE_URL = "https://www.facebook.com/p/Elvaveo-61594483501422/";

/**
 * Only channels ELVAVEO actually owns are listed. Generic network
 * homepages were placeholders and linked visitors nowhere useful — add a
 * new entry here (with its icon) when a real profile exists.
 */
export const socialLinks: SocialLink[] = [
  {
    label: "LinkedIn",
    href: LINKEDIN_COMPANY_URL,
    ariaLabel: "ELVA Global on LinkedIn",
    icon: "linkedin",
  },
  {
    label: "X",
    href: X_PROFILE_URL,
    ariaLabel: "ELVAVEO on X",
    icon: "x",
  },
  {
    label: "Instagram",
    href: INSTAGRAM_PROFILE_URL,
    ariaLabel: "ELVAVEO on Instagram",
    icon: "instagram",
  },
  {
    label: "Facebook",
    href: FACEBOOK_PAGE_URL,
    ariaLabel: "ELVAVEO on Facebook",
    icon: "facebook",
  },
];

/**
 * Live ELVAVEO products, linked from the footer and the products page.
 * These open on the product's own subdomain, so they are external links.
 */
export const productLinks: NavItem[] = PRODUCT_LINKS.map(
  ({ name, href }) => ({ label: name, href })
);

/** Primary site URL, shown in the footer. */
export const siteUrl = SITE_URL;