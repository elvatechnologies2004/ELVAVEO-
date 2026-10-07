export interface ProductStat {
  label: string;
  value: string;
  trend?: string;
}

export interface Product {
  id: "finlo" | "finlonexa";
  name: string;
  /** Official brand lockup. Replace placeholders with supplied PNGs. */
  logo: string;
  /** Badge shown above the headline */
  badge: string;
  /** Category pill */
  category: string;
  /** Headline rendered across up to two lines */
  headline: string[];
  /** Second headline line receives the gradient accent */
  accentLine: number;
  description: string;
  cta: string;
  /** Demo stats used inside the product mockups. All placeholder data. */
  stats: ProductStat[];
  /** Mockup accent */
  accent: "cyan" | "violet";
  /**
   * Live product site. These are real, publicly reachable ELVAVEO products,
   * so the cards link straight to them rather than to an internal page.
   */
  href: string;
}

/**
 * ELVAVEO products.
 *
 * All dashboard numbers inside the mockups are DEMO PLACEHOLDERS from the
 * design reference — not verified facts. Replace logos with the official
 * supplied PNG files (see summary notes) before production.
 */
export const products: Product[] = [
  {
    id: "finlo",
    name: "Finlo",
    logo: "/brand/finlo-logo.svg",
    badge: "An ELVAVEO Product",
    category: "Personal Finance",
    headline: ["Take Control of", "Your Financial Future"],
    accentLine: 1,
    description:
      "Finlo helps you understand your cash flow, manage income and expenses, plan ahead, and spend with confidence.",
    cta: "Learn More",
    stats: [
      { label: "Total Balance", value: "Rs. 24,860.50" },
      { label: "Income", value: "Rs. 42,800", trend: "+12.4%" },
      { label: "Expenses", value: "Rs. 17,940", trend: "−8.2%" },
      { label: "Savings", value: "32%", trend: "+4.6%" },
    ],
    accent: "cyan",
    href: "https://finlo.elvaveo.com",
  },
  {
    id: "finlonexa",
    name: "FinloCRM",
    logo: "/brand/finlocrm-logo.png",
    badge: "An ELVAVEO Product",
    category: "CRM & Business",
    headline: ["Stronger Relationships.", "Bigger Opportunities."],
    accentLine: 1,
    description:
      "Manage leads, customers, deals, and sales workflows with a modern CRM built for growing businesses.",
    cta: "Learn More",
    stats: [
      { label: "Total Leads", value: "1,248", trend: "+8.2%" },
      { label: "Opportunities", value: "96", trend: "+14 deals" },
      { label: "Total Revenue", value: "$284K", trend: "+22%" },
      { label: "Sales Pipeline", value: "$92K", trend: "38 open" },
    ],
    accent: "violet",
    href: "https://crm.elvaveo.com",
  },
];