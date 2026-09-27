export interface StatItem {
  value: string;
  label: string;
}

export interface QuoteItem {
  lines: string[];
  author: string;
}

/**
 * Metrics strip configuration.
 *
 * IMPORTANT — DEMO PLACEHOLDERS:
 * All values below come straight from the design reference and must be
 * verified or removed before production. They are NOT verified company
 * facts. Edit this single object to change the stats strip in one place.
 */
export const stats: {
  isDemo: true;
  items: StatItem[];
  quote: QuoteItem;
} = {
  isDemo: true,
  items: [
    { value: "50+", label: "Projects Delivered" },
    { value: "30+", label: "Happy Clients" },
    { value: "4+", label: "Years of Experience" },
    { value: "99%", label: "Client Satisfaction" },
  ],
  quote: {
    lines: ["Technology is more than code.", "It’s a brighter tomorrow."],
    author: "The ELVAVEO Team",
  },
};