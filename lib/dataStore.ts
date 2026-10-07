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

// ==================== PRODUCTS ====================
export async function getProducts(): Promise<Product[]> {
  return readJson<Product[]>(PRODUCTS_FILE, defaultProducts);
}

export async function saveProducts(products: Product[]): Promise<boolean> {
  return writeJson(PRODUCTS_FILE, products);
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
