import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { teamMembers as defaultTeam, type TeamMember } from "@/data/team";
import { products as defaultProducts, type Product } from "@/data/products";
import { showcaseProjects as defaultProjects } from "@/data/projectShowcase";
import { getSupabaseClient } from "@/lib/supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const TEAM_FILE = path.join(DATA_DIR, "team.json");
const TEAM_TS_FILE = path.join(DATA_DIR, "team.ts");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const PRODUCTS_TS_FILE = path.join(DATA_DIR, "products.ts");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const INQUIRIES_FILE = path.join(DATA_DIR, "inquiries.json");

// Serverless writable cache fallback (for platforms like Vercel where process.cwd() is read-only)
const TMP_DIR = path.join(os.tmpdir(), "elvaveo_store");
const TMP_TEAM_FILE = path.join(TMP_DIR, "team.json");
const TMP_PRODUCTS_FILE = path.join(TMP_DIR, "products.json");
const TMP_PROJECTS_FILE = path.join(TMP_DIR, "projects.json");
const TMP_SETTINGS_FILE = path.join(TMP_DIR, "settings.json");
const TMP_INQUIRIES_FILE = path.join(TMP_DIR, "inquiries.json");
const TMP_DELETED_INQUIRIES_FILE = path.join(TMP_DIR, "deleted_inquiries.json");

// In-memory cache to guarantee immediate cross-route reactivity within the runtime
let memoryTeamCache: TeamMember[] | null = null;
let memoryProductsCache: Product[] | null = null;
let memoryProjectsCache: StoredProject[] | null = null;
let memorySettingsCache: SiteSettings | null = null;
let memoryInquiriesCache: InquiryItem[] | null = null;
let memoryDeletedInquiryIds = new Set<string>();

/** Safe JSON reader */
async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

/** Safe JSON writer with directory creation */
async function writeJson<T>(filePath: string, data: T): Promise<boolean> {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    // Expected on read-only environments (e.g. AWS Lambda / Vercel Serverless)
    return false;
  }
}

function formatTeamTs(teamList: TeamMember[]): string {
  return `export interface TeamMember {
  name: string;
  role: string;
  description: string;
  initials?: string;
  image?: string;
  imagePosition?: string;
  imageScale?: number;
  linkedin?: string;
}

/**
 * Team members list for the "Meet Our Team" section on the About page.
 * Kept in sync with admin console and data/team.json.
 */
export const teamMembers: TeamMember[] = ${JSON.stringify(teamList, null, 2)};
`;
}

// ==================== TEAM ====================
export async function getTeamMembers(): Promise<TeamMember[]> {
  // 1. In-memory cache
  if (memoryTeamCache && Array.isArray(memoryTeamCache) && memoryTeamCache.length > 0) {
    return memoryTeamCache;
  }

  // 2. Supabase if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("team")
        .select("*")
        .order("sort_order", { ascending: true });
      if (!error && data && data.length > 0) {
        const teamFromDb: TeamMember[] = data.map((row: any) => ({
          name: row.name,
          role: row.role,
          description: row.description || "",
          initials: row.initials || undefined,
          image: row.image || undefined,
          imagePosition: row.image_position || undefined,
          imageScale: row.image_scale || undefined,
          linkedin: row.linkedin || undefined,
        }));
        memoryTeamCache = teamFromDb;
        return teamFromDb;
      }
    } catch (err) {
      console.warn("[dataStore] Supabase team query failed:", err);
    }
  }

  // 3. Writable tmp runtime cache (Vercel)
  const tmpTeam = await readJson<TeamMember[] | null>(TMP_TEAM_FILE, null);
  if (tmpTeam && Array.isArray(tmpTeam) && tmpTeam.length > 0) {
    memoryTeamCache = tmpTeam;
    return tmpTeam;
  }

  // 4. Local repo file (data/team.json)
  const stored = await readJson<TeamMember[] | null>(TEAM_FILE, null);
  if (stored && Array.isArray(stored) && stored.length > 0) {
    memoryTeamCache = stored;
    return stored;
  }

  // 5. Default static dataset from data/team.ts
  memoryTeamCache = defaultTeam;
  return defaultTeam;
}

export async function saveTeamMembers(members: TeamMember[]): Promise<boolean> {
  // Always update in-memory cache immediately
  memoryTeamCache = [...members];

  let supabaseSaved = false;
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const rows = members.map((m, idx) => ({
        id: `team_${idx + 1}_${m.name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 40)}`,
        name: m.name,
        role: m.role,
        description: m.description || "",
        initials: m.initials || null,
        image: m.image || null,
        image_position: m.imagePosition || null,
        image_scale: m.imageScale || null,
        linkedin: m.linkedin || null,
        sort_order: idx,
        updated_at: new Date().toISOString(),
      }));

      const { error: delError } = await supabase.from("team").delete().neq("id", "___none___");
      if (!delError) {
        const { error: insError } = await supabase.from("team").insert(rows);
        if (!insError) {
          supabaseSaved = true;
        }
      }
    } catch (err) {
      console.warn("[dataStore] Supabase team sync warning:", err);
    }
  }

  // Write to local project repo (works in local dev & writable servers)
  let fsSaved = false;
  try {
    fsSaved = await writeJson(TEAM_FILE, members);
    if (fsSaved) {
      try {
        await fs.writeFile(TEAM_TS_FILE, formatTeamTs(members), "utf-8");
      } catch {}
    }
  } catch {}

  // Write to OS temp storage (persists across warm requests on serverless)
  let tmpSaved = false;
  try {
    tmpSaved = await writeJson(TMP_TEAM_FILE, members);
  } catch {}

  // Always consider saved if updated in memory / tmp / fs / Supabase
  return supabaseSaved || fsSaved || tmpSaved || true;
}

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
  if (memoryProductsCache && Array.isArray(memoryProductsCache) && memoryProductsCache.length > 0) {
    return memoryProductsCache;
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped: Product[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          logo: row.logo,
          badge: row.badge,
          category: row.category,
          headline: Array.isArray(row.headline) ? row.headline : [row.name],
          accentLine: row.accent_line ?? 1,
          description: row.description || "",
          cta: row.cta || "Learn More",
          stats: Array.isArray(row.stats) ? row.stats : [],
          accent: row.accent || "cyan",
          href: row.href || "",
        }));
        memoryProductsCache = mapped;
        return mapped;
      }
    } catch (err) {
      console.warn("[dataStore] Supabase products query warning:", err);
    }
  }

  const tmpProducts = await readJson<Product[] | null>(TMP_PRODUCTS_FILE, null);
  if (tmpProducts && Array.isArray(tmpProducts) && tmpProducts.length > 0) {
    memoryProductsCache = tmpProducts;
    return tmpProducts;
  }

  const stored = await readJson<Product[] | null>(PRODUCTS_FILE, null);
  if (stored && Array.isArray(stored) && stored.length > 0) {
    memoryProductsCache = stored;
    return stored;
  }

  memoryProductsCache = defaultProducts;
  return defaultProducts;
}

export async function saveProducts(products: Product[]): Promise<boolean> {
  memoryProductsCache = [...products];

  let supabaseSaved = false;
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const rows = products.map((p) => ({
        id: p.id,
        name: p.name,
        logo: p.logo,
        badge: p.badge,
        category: p.category,
        headline: p.headline,
        accent_line: p.accentLine,
        description: p.description,
        cta: p.cta,
        stats: p.stats,
        accent: p.accent,
        href: p.href,
        updated_at: new Date().toISOString(),
      }));

      const { error: delError } = await supabase.from("products").delete().neq("id", "___none___");
      if (!delError) {
        const { error: insError } = await supabase.from("products").insert(rows);
        if (!insError) {
          supabaseSaved = true;
        }
      }
    } catch (err) {
      console.warn("[dataStore] Supabase products sync warning:", err);
    }
  }

  let fsSaved = false;
  try {
    fsSaved = await writeJson(PRODUCTS_FILE, products);
    if (fsSaved) {
      try {
        await fs.writeFile(PRODUCTS_TS_FILE, formatProductsTs(products), "utf-8");
      } catch {}
    }
  } catch {}

  let tmpSaved = false;
  try {
    tmpSaved = await writeJson(TMP_PRODUCTS_FILE, products);
  } catch {}

  return supabaseSaved || fsSaved || tmpSaved || true;
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
  if (memoryProjectsCache && Array.isArray(memoryProjectsCache) && memoryProjectsCache.length > 0) {
    return memoryProjectsCache;
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped: StoredProject[] = data.map((row: any) => ({
          id: row.id,
          title: row.title,
          category: row.category,
          categoryLabel: row.category_label || undefined,
          description: row.description || "",
          logo: row.logo,
          href: row.href,
          cta: row.cta || "Explore Platform",
          iconName: row.icon_name || undefined,
          isProduct: row.is_product ?? true,
        }));
        memoryProjectsCache = mapped;
        return mapped;
      }
    } catch (err) {
      console.warn("[dataStore] Supabase projects query warning:", err);
    }
  }

  const tmpProjects = await readJson<StoredProject[] | null>(TMP_PROJECTS_FILE, null);
  if (tmpProjects && Array.isArray(tmpProjects) && tmpProjects.length > 0) {
    memoryProjectsCache = tmpProjects;
    return tmpProjects;
  }

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

  const stored = await readJson<StoredProject[]>(PROJECTS_FILE, fallback);
  memoryProjectsCache = stored;
  return stored;
}

export async function saveProjects(projects: StoredProject[]): Promise<boolean> {
  memoryProjectsCache = [...projects];

  let supabaseSaved = false;
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const rows = projects.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        category_label: p.categoryLabel || null,
        description: p.description,
        logo: p.logo,
        href: p.href,
        cta: p.cta,
        icon_name: p.iconName || null,
        is_product: p.isProduct,
        updated_at: new Date().toISOString(),
      }));

      const { error: delError } = await supabase.from("projects").delete().neq("id", "___none___");
      if (!delError) {
        const { error: insError } = await supabase.from("projects").insert(rows);
        if (!insError) {
          supabaseSaved = true;
        }
      }
    } catch (err) {
      console.warn("[dataStore] Supabase projects sync warning:", err);
    }
  }

  let fsSaved = false;
  try {
    fsSaved = await writeJson(PROJECTS_FILE, projects);
  } catch {}

  let tmpSaved = false;
  try {
    tmpSaved = await writeJson(TMP_PROJECTS_FILE, projects);
  } catch {}

  return supabaseSaved || fsSaved || tmpSaved || true;
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
  if (memorySettingsCache) {
    return memorySettingsCache;
  }

  const tmpSettings = await readJson<SiteSettings | null>(TMP_SETTINGS_FILE, null);
  if (tmpSettings && typeof tmpSettings === "object" && tmpSettings.siteName) {
    memorySettingsCache = tmpSettings;
    return tmpSettings;
  }

  const stored = await readJson<SiteSettings>(SETTINGS_FILE, defaultSettings);
  memorySettingsCache = stored;
  return stored;
}

export async function saveSiteSettings(settings: SiteSettings): Promise<boolean> {
  memorySettingsCache = { ...settings };

  let fsSaved = false;
  try {
    fsSaved = await writeJson(SETTINGS_FILE, settings);
  } catch {}

  let tmpSaved = false;
  try {
    tmpSaved = await writeJson(TMP_SETTINGS_FILE, settings);
  } catch {}

  return fsSaved || tmpSaved || true;
}

// ==================== INQUIRIES & LEADS ====================
export interface InquiryItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "replied" | "archived";
  createdAt: string;
  company?: string;
  source?: string;
  country?: string;
  sourceUrl?: string;
  qualificationScore?: number;
  observations?: string[];
}

/**
 * Transforms a raw row from the Supabase `leads` table into an `InquiryItem`
 */
function mapLeadToInquiry(lead: any): InquiryItem {
  const nameParts = [lead.first_name, lead.last_name].filter(Boolean);
  const fullName = nameParts.join(" ").trim();
  const name = fullName || lead.company || "Prospective Client";

  let subject = lead.target_service
    ? lead.target_service
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase())
    : lead.company
    ? `${lead.company} (Lead)`
    : "Business Lead";

  let message = lead.notes || "";
  let observations: string[] = [];
  let qualificationScore: number | undefined =
    typeof lead.qualification_score === "number" ? lead.qualification_score : undefined;
  let country: string | undefined = lead.country || undefined;
  let sourceUrl: string | undefined = lead.source_url || undefined;

  if (typeof lead.notes === "string" && lead.notes.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(lead.notes);
      if (parsed.subject) subject = parsed.subject;
      if (parsed.message) message = parsed.message;
      else if (parsed.qualification_explanation) message = parsed.qualification_explanation;
      if (Array.isArray(parsed.business_observations)) observations = parsed.business_observations;
      if (typeof parsed.qualification_score === "number") qualificationScore = parsed.qualification_score;
      if (parsed.country) country = parsed.country;
      if (parsed.source_url) sourceUrl = parsed.source_url;
    } catch {
      // Keep plain notes string
    }
  }

  const rawStatus: "new" | "replied" | "archived" =
    lead.status === "replied" || lead.status === "contacted"
      ? "replied"
      : lead.status === "archived"
      ? "archived"
      : "new";

  let sourceLabel = "CRM Lead";
  if (lead.source === "ai_discovery_engine") sourceLabel = "AI Discovery";
  else if (lead.source === "csv_import") sourceLabel = "CRM Import";
  else if (lead.source === "web_contact_form" || lead.source === "web_form") sourceLabel = "Website Contact";
  else if (lead.source) sourceLabel = lead.source;

  return {
    id: lead.id,
    name,
    email: lead.email,
    subject,
    message: message || "No message body provided.",
    status: rawStatus,
    createdAt: lead.created_at || new Date().toISOString(),
    company: lead.company || undefined,
    source: sourceLabel,
    country,
    sourceUrl,
    qualificationScore,
    observations: observations.length > 0 ? observations : undefined,
  };
}

/**
 * Retrieves inquiries and CRM leads with multi-tier fallback:
 * In-memory -> Supabase Storage (store/inquiries.json) -> /tmp -> data/inquiries.json + Supabase `leads` table
 */
export async function getInquiries(forceRefresh: boolean = false): Promise<InquiryItem[]> {
  if (!forceRefresh && memoryInquiriesCache && memoryInquiriesCache.length > 0) {
    return memoryInquiriesCache;
  }

  const supabase = getSupabaseClient();
  let storedList: InquiryItem[] = [];

  // 1. Try Supabase Storage (store/inquiries.json)
  if (supabase) {
    try {
      const { data: storageFile, error: storageErr } = await supabase.storage
        .from("uploads")
        .download("store/inquiries.json");
      if (!storageErr && storageFile) {
        const text = await storageFile.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          storedList = parsed;
        }
      }
    } catch (err) {
      console.warn("[dataStore] Supabase storage download warning:", err);
    }
  }

  // 2. Fallback to /tmp runtime cache (Vercel)
  if (storedList.length === 0) {
    const tmpInquiries = await readJson<InquiryItem[] | null>(TMP_INQUIRIES_FILE, null);
    if (tmpInquiries && Array.isArray(tmpInquiries) && tmpInquiries.length > 0) {
      storedList = tmpInquiries;
    }
  }

  // 3. Fallback to local repo data/inquiries.json
  if (storedList.length === 0) {
    const localInquiries = await readJson<InquiryItem[] | null>(INQUIRIES_FILE, null);
    if (localInquiries && Array.isArray(localInquiries) && localInquiries.length > 0) {
      storedList = localInquiries;
    }
  }

  // 4. Fetch live CRM Leads from Supabase `leads` table
  let dbLeads: InquiryItem[] = [];
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && Array.isArray(data)) {
        dbLeads = data.map(mapLeadToInquiry);
      }
    } catch (err) {
      console.warn("[dataStore] Supabase leads query warning:", err);
    }
  }

  // 5. Merge and deduplicate
  const combinedMap = new Map<string, InquiryItem>();

  // Add dbLeads first
  for (const lead of dbLeads) {
    combinedMap.set(lead.id, lead);
  }

  // Overlay storedList (which contains user status updates, web submissions, etc.)
  for (const item of storedList) {
    if (combinedMap.has(item.id)) {
      const existing = combinedMap.get(item.id)!;
      combinedMap.set(item.id, {
        ...existing,
        ...item,
        status: item.status || existing.status,
      });
    } else {
      combinedMap.set(item.id, item);
    }
  }

  // Load deleted tombstones if not in memory
  if (memoryDeletedInquiryIds.size === 0) {
    const persistedDeleted = await readJson<string[] | null>(TMP_DELETED_INQUIRIES_FILE, null);
    if (persistedDeleted && Array.isArray(persistedDeleted)) {
      memoryDeletedInquiryIds = new Set(persistedDeleted);
    }
  }

  const result = Array.from(combinedMap.values())
    .filter((item) => !memoryDeletedInquiryIds.has(item.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  memoryInquiriesCache = result;
  return result;
}

/**
 * Persists inquiries to Supabase Storage, /tmp runtime cache, and local file.
 */
export async function saveInquiries(inquiries: InquiryItem[]): Promise<boolean> {
  const bounded = inquiries.slice(0, 500);
  memoryInquiriesCache = [...bounded];

  const supabase = getSupabaseClient();
  let supabaseSaved = false;
  if (supabase) {
    try {
      const { error } = await supabase.storage
        .from("uploads")
        .upload("store/inquiries.json", JSON.stringify(bounded, null, 2), {
          upsert: true,
          contentType: "application/json",
        });
      if (!error) {
        supabaseSaved = true;
      }
    } catch (err) {
      console.warn("[dataStore] Supabase storage upload warning:", err);
    }
  }

  let tmpSaved = false;
  try {
    tmpSaved = await writeJson(TMP_INQUIRIES_FILE, bounded);
  } catch {}

  let fsSaved = false;
  try {
    fsSaved = await writeJson(INQUIRIES_FILE, bounded);
  } catch {}

  return supabaseSaved || tmpSaved || fsSaved || true;
}

/**
 * Adds a new inquiry or lead, syncing across Supabase `leads` table,
 * Supabase Storage, /tmp, and in-memory cache.
 */
export async function addInquiry(item: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  company?: string;
  source?: string;
}): Promise<InquiryItem> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const newInquiry: InquiryItem = {
    id,
    name: item.name.trim(),
    email: item.email.trim(),
    subject: item.subject?.trim() || "General Inquiry",
    message: item.message.trim(),
    company: item.company?.trim() || undefined,
    source: item.source || "Website Contact",
    status: "new",
    createdAt: now,
  };

  // Sync to Supabase leads table with identical UUID
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const parts = newInquiry.name.split(" ");
      const firstName = parts[0] || newInquiry.name;
      const lastName = parts.slice(1).join(" ") || "";
      await supabase.from("leads").insert({
        id: id,
        workspace_id: "00000000-0000-0000-0000-000000000001",
        email: newInquiry.email,
        first_name: firstName,
        last_name: lastName,
        company: newInquiry.company || null,
        status: "new",
        source: item.source === "CRM Manual" ? "manual_entry" : "web_contact_form",
        notes: JSON.stringify({
          subject: newInquiry.subject,
          message: newInquiry.message,
          submitted_at: now,
        }),
        consent_status: "opted_in",
        consent_source: "web_form",
        consent_timestamp: now,
      });
    } catch (err) {
      console.warn("[dataStore] Supabase lead insert warning:", err);
    }
  }

  // Prepend to inquiries and save
  const current = await getInquiries(true);
  const updated = [newInquiry, ...current.filter((i) => i.id !== id)];
  await saveInquiries(updated);

  return newInquiry;
}

/**
 * Updates status of an inquiry or lead (new, replied, archived).
 */
export async function updateInquiryStatus(
  id: string,
  status: "new" | "replied" | "archived"
): Promise<InquiryItem | null> {
  const current = await getInquiries();
  const target = current.find((i) => i.id === id);
  if (!target) return null;

  target.status = status;
  await saveInquiries(current);

  const supabase = getSupabaseClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (supabase && isUuid) {
    try {
      const dbStatus = status === "replied" ? "replied" : status === "archived" ? "contacted" : "new";
      await supabase
        .from("leads")
        .update({ status: dbStatus, updated_at: new Date().toISOString() })
        .eq("id", id);
    } catch (err) {
      console.warn("[dataStore] Supabase lead status update warning:", err);
    }
  }

  return target;
}

/**
 * Permanently deletes an inquiry or lead from all storage tiers.
 */
export async function deleteInquiry(id: string): Promise<boolean> {
  memoryDeletedInquiryIds.add(id);
  try {
    await writeJson(TMP_DELETED_INQUIRIES_FILE, Array.from(memoryDeletedInquiryIds));
  } catch {}

  const current = await getInquiries();
  const filtered = current.filter((i) => i.id !== id);
  await saveInquiries(filtered);

  const supabase = getSupabaseClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (supabase && isUuid) {
    try {
      await supabase.from("leads").delete().eq("id", id);
    } catch (err) {
      console.warn("[dataStore] Supabase lead delete warning:", err);
    }
  }

  return true;
}
