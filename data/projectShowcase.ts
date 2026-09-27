import { Bot, HeartPulse, Layers, LayoutGrid, Wallet, type LucideIcon } from "lucide-react";

export interface ShowcaseProject {
  id: string;
  title: string;
  /** Wording shown on the card's category badge. */
  category: string;
  categoryLabel?: string;
  description: string;
  /**
   * Official brand logo, used exactly as supplied. Never redrawn, recoloured,
   * cropped or replaced.
   */
  logo: string;
  /** Live product site. */
  href: string;
  cta: string;
  icon: LucideIcon;
  /**
   * BRAND SAFETY: true only for real, shipped ELVAVEO products. Any future
   * concept must be added with `false` and badged as a concept, so the site
   * never implies unverified client work or unbuilt features.
   */
  isProduct: boolean;
}

/**
 * Projects shown on /projects.
 *
 * Only real, live ELVAVEO products are listed. Finlo and FinloNexa CRM link to
 * their public sites (finlo.elvaveo.com, crm.elvaveo.com) — no placeholders, no
 * invented clients, no invented metrics.
 *
 * The earlier concept entries (RetailPlus, HealthHub, EduNext, InsightAI) were
 * removed on request. Reintroduce them with `isProduct: false` and an explicit
 * "Concept" status badge if they are ever built out for real.
 */
export const showcaseProjects: ShowcaseProject[] = [
  {
    id: "finlo",
    title: "Finlo",
    category: "Fintech",
    description:
      "A personal finance platform designed to help users understand, plan, and manage their finances with confidence.",
    logo: "/brand/finlo-logo.svg",
    href: "https://finlo.elvaveo.com",
    cta: "View Project",
    icon: Wallet,
    isProduct: true,
  },
  {
    id: "finlonexa-crm",
    title: "FinloNexa CRM",
    category: "SaaS Platforms",
    categoryLabel: "SaaS / CRM",
    description:
      "A modern customer relationship management platform designed to manage leads, customers, sales workflows, and business growth.",
    logo: "/brand/finlonexa-crm-logo.svg",
    href: "https://crm.elvaveo.com",
    cta: "View Project",
    icon: Layers,
    isProduct: true,
  },
];

/** Hero benefit chips. Three, to match the trust-indicator row on every hero. */
export const projectBenefits: { label: string; icon: LucideIcon }[] = [
  { label: "Real product thinking", icon: Layers },
  { label: "Innovative solutions", icon: Bot },
  { label: "Scalable technology", icon: Wallet },
];

/**
 * Section 5 — qualitative cards only.
 * Deliberately no user counts, ratings or growth percentages: none of those
 * are verified, so they must not be published.
 */
export const caseStudyMetrics: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: LayoutGrid,
    title: "Modern UI",
    description: "User-first Experience",
  },
  {
    icon: Layers,
    title: "Secure Foundation",
    description: "Built with scalable architecture",
  },
  {
    icon: Wallet,
    title: "Smart Insights",
    description: "Useful financial visibility",
  },
  {
    icon: Bot,
    title: "Continuous Improvement",
    description: "Designed to evolve",
  },
];

/** Section 6 — capability blocks. No invented counts or satisfaction scores. */
export const projectCapabilities: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: LayoutGrid,
    title: "Digital Products",
    description: "Modern product experiences",
  },
  {
    icon: Layers,
    title: "Scalable Architecture",
    description: "Built to grow",
  },
  {
    icon: HeartPulse,
    title: "User-Centered Design",
    description: "Designed around real needs",
  },
  {
    icon: Bot,
    title: "Continuous Innovation",
    description: "Improved over time",
  },
];

/** Section 4 — Finlo value points. */
export const finloValuePoints: { icon: LucideIcon; title: string; note: string }[] = [
  {
    icon: LayoutGrid,
    title: "Modern, user-centric design",
    note: "A seamless experience across devices.",
  },
  {
    icon: Layers,
    title: "Built for scale",
    note: "A flexible architecture designed to grow.",
  },
  {
    icon: Wallet,
    title: "Real user value",
    note: "Tools designed to help users plan and manage finances with confidence.",
  },
];
