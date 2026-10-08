import fs from "fs/promises";
import path from "path";
import { teamMembers as defaultTeam, type TeamMember } from "@/data/team";
import { products as defaultProducts, type Product } from "@/data/products";
import { showcaseProjects as defaultProjects } from "@/data/projectShowcase";

const DATA_DIR = path.join(process.cwd(), "data");
const TEAM_FILE = path.join(DATA_DIR, "team.json");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

/** Safe JSON reader */
async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

/** Safe JSON writer */
async function writeJson<T>(filePath: string, data: T): Promise<boolean> {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error(`Failed to write ${filePath}:`, error);
    return false;
  }
}

// ==================== TEAM ====================
export async function getTeamMembers(): Promise<TeamMember[]> {
  return readJson<TeamMember[]>(TEAM_FILE, defaultTeam);
}

export async function saveTeamMembers(members: TeamMember[]): Promise<boolean> {
  return writeJson(TEAM_FILE, members);
}

const PRODUCTS_TS_FILE = path.join(DATA_DIR, "products.ts");

function formatProductsTs(productsList: Product[]): string {
  return `export interface ProductStat {
  label: string;
  value: string;
  trend?: string;
}

export interface Product {
  id: string;
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
 * Kept in sync with admin console and data/products.json.
 */
export const products: Product[] = ${JSON.stringify(productsList, null, 2)};
`;
}

// ==================== PRODUCTS ====================
export async function getProducts(): Promise<Product[]> {
  const stored = await readJson<Product[] | null>(PRODUCTS_FILE, null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    return defaultProducts;
  }
  // Check if defaultProducts in products.ts has items not in stored
  const storedIds = new Set(stored.map((p) => p.id));
  const newFromCode = defaultProducts.filter((p) => !storedIds.has(p.id));
  if (newFromCode.length > 0) {
    const merged = [...stored, ...newFromCode];
    await writeJson(PRODUCTS_FILE, merged);
    try {
      await fs.writeFile(PRODUCTS_TS_FILE, formatProductsTs(merged), "utf-8");
    } catch {}
    return merged;
  }
  return stored;
}

export async function saveProducts(products: Product[]): Promise<boolean> {
  const jsonSaved = await writeJson(PRODUCTS_FILE, products);
  try {
    await fs.writeFile(PRODUCTS_TS_FILE, formatProductsTs(products), "utf-8");
  } catch (err) {
    console.error("Failed to sync products.ts:", err);
  }
  return jsonSaved;
}

// ==================== PROJECTS ====================
export interface StoredProject {
  id: string;
  title: string;
  category: string;
  categoryLabel?: string;
  description: string;
  logo: string;
  href: string;
  cta: string;
  iconName?: string;
  isProduct: boolean;
}

export async function getProjects(): Promise<StoredProject[]> {
  const fallback = defaultProjects.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    categoryLabel: p.categoryLabel,
    description: p.description,
    logo: p.logo,
    href: p.href,
    cta: p.cta,
    isProduct: p.isProduct,
  }));
  return readJson<StoredProject[]>(PROJECTS_FILE, fallback);
}

export async function saveProjects(projects: StoredProject[]): Promise<boolean> {
  return writeJson(PROJECTS_FILE, projects);
}

// ==================== SETTINGS ====================
export interface SiteSettings {
  siteName: string;
  siteUrl: string;
  contactEmail: string;
  tagline: string;
}

const defaultSettings: SiteSettings = {
  siteName: "ELVAVEO",
  siteUrl: "https://elvaveo.com",
  contactEmail: "hello@elvaveo.com",
  tagline: "Software, SaaS & Digital Solutions",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  return readJson<SiteSettings>(SETTINGS_FILE, defaultSettings);
}

export async function saveSiteSettings(settings: SiteSettings): Promise<boolean> {
  return writeJson(SETTINGS_FILE, settings);
}
