import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { teamMembers as defaultTeam, type TeamMember } from "@/data/team";
import { products as defaultProducts, type Product } from "@/data/products";
import { showcaseProjects as defaultProjects } from "@/data/projectShowcase";
import { getSupabaseClient, getSupabasePublicClient } from "@/lib/supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const TEAM_FILE = path.join(DATA_DIR, "team.json");
const TEAM_TS_FILE = path.join(DATA_DIR, "team.ts");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const PRODUCTS_TS_FILE = path.join(DATA_DIR, "products.ts");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const INQUIRIES_FILE = path.join(DATA_DIR, "inquiries.json");
const PRIVACY_POLICY_FILE = path.join(DATA_DIR, "privacy-policy.json");

// Serverless writable cache fallback (for platforms like Vercel where process.cwd() is read-only)
const TMP_DIR = path.join(os.tmpdir(), "elvaveo_store");
const TMP_TEAM_FILE = path.join(TMP_DIR, "team.json");
const TMP_PRODUCTS_FILE = path.join(TMP_DIR, "products.json");
const TMP_PROJECTS_FILE = path.join(TMP_DIR, "projects.json");
const TMP_SETTINGS_FILE = path.join(TMP_DIR, "settings.json");
const TMP_INQUIRIES_FILE = path.join(TMP_DIR, "inquiries.json");
const TMP_DELETED_INQUIRIES_FILE = path.join(TMP_DIR, "deleted_inquiries.json");
const TMP_PRIVACY_POLICY_FILE = path.join(TMP_DIR, "privacy-policy.json");

// In-memory cache to guarantee immediate cross-route reactivity within the runtime
let memoryTeamCache: TeamMember[] | null = null;
let memoryProductsCache: Product[] | null = null;
let memoryProjectsCache: StoredProject[] | null = null;
let memorySettingsCache: SiteSettings | null = null;
let memoryInquiriesCache: InquiryItem[] | null = null;
let memoryPrivacyPolicyCache: PrivacyPolicyDocument | null = null;
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

/**
 * Safe Supabase Storage JSON reader (globally persistent across Vercel serverless)
 */
async function readStorageJson<T>(fileName: string): Promise<T | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.storage.from("uploads").download(`store/${fileName}`);
    if (!error && data) {
      const text = await data.text();
      return JSON.parse(text) as T;
    }
  } catch (err) {
    console.warn(`[dataStore] Storage download warning for store/${fileName}:`, err);
  }
  return null;
}

/**
 * Safe Supabase Storage JSON writer (globally persistent across Vercel serverless)
 */
async function writeStorageJson<T>(fileName: string, data: T): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn(`[dataStore] Supabase client unavailable for store/${fileName}`);
    return false;
  }
  try {
    const payload = JSON.stringify(data, null, 2);
    const { error } = await supabase.storage.from("uploads").upload(`store/${fileName}`, payload, {
      upsert: true,
      contentType: "application/json",
    });
    if (!error) return true;

    // If bucket was not found, auto-create public bucket 'uploads' and retry once
    const errMessage = (error as any)?.message || "";
    if (errMessage.toLowerCase().includes("bucket") || (error as any)?.statusCode === "404") {
      try {
        await supabase.storage.createBucket("uploads", { public: true });
        const retry = await supabase.storage.from("uploads").upload(`store/${fileName}`, payload, {
          upsert: true,
          contentType: "application/json",
        });
        if (!retry.error) return true;
      } catch {}
    }

    console.warn(`[dataStore] Storage upload warning for store/${fileName}:`, error);
  } catch (err) {
    console.warn(`[dataStore] Storage upload exception for store/${fileName}:`, err);
  }
  return false;
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
export async function getTeamMembers(forceRefresh: boolean = false): Promise<TeamMember[]> {
  // 1. In-memory cache
  if (!forceRefresh && memoryTeamCache && Array.isArray(memoryTeamCache) && memoryTeamCache.length > 0) {
    return memoryTeamCache;
  }

  // 2. Supabase Storage (store/team.json)
  const storageTeam = await readStorageJson<TeamMember[]>("team.json");
  if (storageTeam && Array.isArray(storageTeam) && storageTeam.length > 0) {
    memoryTeamCache = storageTeam;
    return storageTeam;
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

  // 1. Persist to Supabase Storage (persists globally across all Vercel serverless containers)
  const storageSaved = await writeStorageJson("team.json", members);

  // 2. Write to local project repo (works in local dev & writable servers)
  let fsSaved = false;
  try {
    fsSaved = await writeJson(TEAM_FILE, members);
    if (fsSaved) {
      try {
        await fs.writeFile(TEAM_TS_FILE, formatTeamTs(members), "utf-8");
      } catch {}
    }
  } catch {}

  // 3. Write to OS temp storage (persists across warm requests on serverless)
  let tmpSaved = false;
  try {
    tmpSaved = await writeJson(TMP_TEAM_FILE, members);
  } catch {}

  return storageSaved || fsSaved || tmpSaved || true;
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
export async function getProducts(forceRefresh: boolean = false): Promise<Product[]> {
  if (!forceRefresh && memoryProductsCache && Array.isArray(memoryProductsCache) && memoryProductsCache.length > 0) {
    return memoryProductsCache;
  }

  // 1. Supabase Storage (store/products.json)
  const storageProducts = await readStorageJson<Product[]>("products.json");
  if (storageProducts && Array.isArray(storageProducts) && storageProducts.length > 0) {
    memoryProductsCache = storageProducts;
    return storageProducts;
  }

  // 2. Writable tmp runtime cache
  const tmpProducts = await readJson<Product[] | null>(TMP_PRODUCTS_FILE, null);
  if (tmpProducts && Array.isArray(tmpProducts) && tmpProducts.length > 0) {
    memoryProductsCache = tmpProducts;
    return tmpProducts;
  }

  // 3. Local repo file
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

  // 1. Supabase Storage (store/products.json)
  const storageSaved = await writeStorageJson("products.json", products);

  // 2. Local repo file
  let fsSaved = false;
  try {
    fsSaved = await writeJson(PRODUCTS_FILE, products);
    if (fsSaved) {
      try {
        await fs.writeFile(PRODUCTS_TS_FILE, formatProductsTs(products), "utf-8");
      } catch {}
    }
  } catch {}

  // 3. Writable tmp runtime cache
  let tmpSaved = false;
  try {
    tmpSaved = await writeJson(TMP_PRODUCTS_FILE, products);
  } catch {}

  return storageSaved || fsSaved || tmpSaved || true;
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

export async function getProjects(forceRefresh: boolean = false): Promise<StoredProject[]> {
  if (!forceRefresh && memoryProjectsCache && Array.isArray(memoryProjectsCache) && memoryProjectsCache.length > 0) {
    return memoryProjectsCache;
  }

  // 1. Supabase Storage (store/projects.json)
  const storageProjects = await readStorageJson<StoredProject[]>("projects.json");
  if (storageProjects && Array.isArray(storageProjects) && storageProjects.length > 0) {
    memoryProjectsCache = storageProjects;
    return storageProjects;
  }

  // 2. Writable tmp runtime cache
  const tmpProjects = await readJson<StoredProject[] | null>(TMP_PROJECTS_FILE, null);
  if (tmpProjects && Array.isArray(tmpProjects) && tmpProjects.length > 0) {
    memoryProjectsCache = tmpProjects;
    return tmpProjects;
  }

  // 3. Local repo fallback
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

  // 1. Supabase Storage (store/projects.json)
  const storageSaved = await writeStorageJson("projects.json", projects);

  // 2. Local repo file
  let fsSaved = false;
  try {
    fsSaved = await writeJson(PROJECTS_FILE, projects);
  } catch {}

  // 3. Writable tmp runtime cache
  let tmpSaved = false;
  try {
    tmpSaved = await writeJson(TMP_PROJECTS_FILE, projects);
  } catch {}

  return storageSaved || fsSaved || tmpSaved || true;
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

export async function getSiteSettings(forceRefresh: boolean = false): Promise<SiteSettings> {
  if (!forceRefresh && memorySettingsCache) {
    return memorySettingsCache;
  }

  // 1. Supabase Storage (store/settings.json)
  const storageSettings = await readStorageJson<SiteSettings>("settings.json");
  if (storageSettings && typeof storageSettings === "object" && storageSettings.siteName) {
    memorySettingsCache = storageSettings;
    return storageSettings;
  }

  // 2. Writable tmp runtime cache
  const tmpSettings = await readJson<SiteSettings | null>(TMP_SETTINGS_FILE, null);
  if (tmpSettings && typeof tmpSettings === "object" && tmpSettings.siteName) {
    memorySettingsCache = tmpSettings;
    return tmpSettings;
  }

  // 3. Local repo file
  const stored = await readJson<SiteSettings>(SETTINGS_FILE, defaultSettings);
  memorySettingsCache = stored;
  return stored;
}

export async function saveSiteSettings(settings: SiteSettings): Promise<boolean> {
  memorySettingsCache = { ...settings };

  // 1. Supabase Storage (store/settings.json)
  const storageSaved = await writeStorageJson("settings.json", settings);

  // 2. Local repo file
  let fsSaved = false;
  try {
    fsSaved = await writeJson(SETTINGS_FILE, settings);
  } catch {}

  // 3. Writable tmp runtime cache
  let tmpSaved = false;
  try {
    tmpSaved = await writeJson(TMP_SETTINGS_FILE, settings);
  } catch {}

  return storageSaved || fsSaved || tmpSaved || true;
}

// ==================== PRIVACY POLICY ====================
export type PrivacyPolicyStatus = "draft" | "published" | "archived";

export interface PrivacyPolicyVersion {
  id: string;
  versionNumber?: number;
  title: string;
  content: string;
  summary: string;
  status: PrivacyPolicyStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  publishedBy?: string | null;
  author: string;
}

export interface PrivacyPolicyDocument {
  currentVersionId: string | null;
  updatedAt: string;
  versions: PrivacyPolicyVersion[];
}

export function sanitizePrivacyPolicyContent(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function getPublishedPrivacyPolicyVersion(document: PrivacyPolicyDocument | null | undefined): PrivacyPolicyVersion | null {
  if (!document || !Array.isArray(document.versions) || document.versions.length === 0) {
    return null;
  }

  return document.versions.find(
    (version) => version.id === document.currentVersionId && version.status === "published"
  ) ?? null;
}

interface PrivacyPolicyVersionRow {
  id: string;
  version_number: number;
  status: string;
  title: string;
  summary: string;
  content: string;
  created_by: string;
  published_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface PrivacyPolicyDocumentRow {
  id: string;
  current_version_id: string | null;
  updated_at: string;
}

function mapPrivacyPolicyVersion(row: PrivacyPolicyVersionRow): PrivacyPolicyVersion {
  if (row.status !== "draft" && row.status !== "published" && row.status !== "archived") {
    throw new Error("Supabase returned an invalid privacy policy version status.");
  }

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    publishedBy: row.published_by,
    author: row.created_by,
  };
}

function emptyPrivacyPolicyDocument(updatedAt = new Date(0).toISOString()): PrivacyPolicyDocument {
  return { currentVersionId: null, updatedAt, versions: [] };
}

const DEFAULT_PRIVACY_POLICY_CONTENT = `## Privacy Policy

ELVAVEO respects the privacy of visitors, clients, and business contacts. This policy explains the information we collect through the ELVAVEO website and how we use it.

## Information we collect

We may collect information you provide directly through the ELVAVEO website, including your name, email address, company, and message content when you contact us. We also automatically receive limited technical information such as browser type, operating system, referring page, and approximate usage data needed to keep the website secure and working correctly.

## How we use information

We use the information we collect to respond to inquiries, manage business conversations, provide services, improve the website, and maintain the security of our systems. We do not sell personal data.

## Cookies and analytics

Our site may use basic cookies or session tools that are necessary for basic site operation and security. If non-essential analytics or advertising tools are introduced in the future, we will update this policy and provide appropriate notice and consent controls before activating them for visitors.

## Sharing and third parties

We may share information with trusted service providers that help us operate our site, send email, or support business workflows. We limit sharing to what is necessary for those services and require reasonable safeguards. We may also disclose information when required by law, court order, or to protect legal rights and safety.

## Retention

We retain information only as long as needed to fulfill the purpose for which it was collected, to satisfy legal obligations, to resolve disputes, and to enforce agreements.

## Your rights and contact

You can contact us at hello@elvaveo.com to ask for access, correction, or deletion of personal data you have submitted through our website, to the extent applicable under applicable law. We will review requests in good faith and respond as required by law.

## Updates

This policy may be updated from time to time to reflect changes in our services, legal requirements, or operational practices. The most current version is the version published on this page.`;

function createDefaultPrivacyPolicyDocument(): PrivacyPolicyDocument {
  const now = new Date().toISOString();
  const defaultVersion: PrivacyPolicyVersion = {
    id: "default-v1",
    versionNumber: 1,
    status: "published",
    title: "Privacy Policy",
    summary:
      "This notice explains what ELVAVEO collects through its website and how we handle business and contact information in a responsible, limited, and transparent way.",
    content: DEFAULT_PRIVACY_POLICY_CONTENT,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    publishedBy: "ELVAVEO Team",
    author: "ELVAVEO Team",
  };
  return {
    currentVersionId: "default-v1",
    updatedAt: now,
    versions: [defaultVersion],
  };
}

export async function getStoredPrivacyPolicyFallback(): Promise<PrivacyPolicyDocument> {
  if (
    memoryPrivacyPolicyCache &&
    Array.isArray(memoryPrivacyPolicyCache.versions) &&
    memoryPrivacyPolicyCache.versions.length > 0
  ) {
    return memoryPrivacyPolicyCache;
  }

  // 1. Supabase Storage
  const storageDoc = await readStorageJson<PrivacyPolicyDocument>("privacy-policy.json");
  if (storageDoc && Array.isArray(storageDoc.versions) && storageDoc.versions.length > 0) {
    memoryPrivacyPolicyCache = storageDoc;
    return storageDoc;
  }

  // 2. Local file
  const fileDoc = await readJson<PrivacyPolicyDocument | null>(PRIVACY_POLICY_FILE, null);
  if (fileDoc && Array.isArray(fileDoc.versions) && fileDoc.versions.length > 0) {
    memoryPrivacyPolicyCache = fileDoc;
    return fileDoc;
  }

  // 3. Writable tmp runtime cache
  const tmpDoc = await readJson<PrivacyPolicyDocument | null>(TMP_PRIVACY_POLICY_FILE, null);
  if (tmpDoc && Array.isArray(tmpDoc.versions) && tmpDoc.versions.length > 0) {
    memoryPrivacyPolicyCache = tmpDoc;
    return tmpDoc;
  }

  const defaultDoc = createDefaultPrivacyPolicyDocument();
  memoryPrivacyPolicyCache = defaultDoc;
  return defaultDoc;
}

export async function savePrivacyPolicyFallback({
  action,
  title,
  summary,
  content,
  actor,
  versionId,
}: {
  action: "save" | "publish" | "restore";
  title: string;
  summary: string;
  content: string;
  actor: string;
  versionId?: string | null;
}): Promise<{ versionId: string; policy: PrivacyPolicyDocument }> {
  const currentDoc = await getStoredPrivacyPolicyFallback();
  const now = new Date().toISOString();
  const versions = [...(currentDoc.versions || [])];

  let targetId = versionId || crypto.randomUUID();

  if (action === "restore" && versionId) {
    const toRestore = versions.find((v) => v.id === versionId);
    if (!toRestore) throw new Error("Target version to restore was not found.");
    const newVersionNumber = Math.max(0, ...versions.map((v) => v.versionNumber || 0)) + 1;
    targetId = crypto.randomUUID();
    const restoredVersion: PrivacyPolicyVersion = {
      ...toRestore,
      id: targetId,
      versionNumber: newVersionNumber,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      publishedBy: null,
      author: actor,
    };
    versions.push(restoredVersion);
  } else {
    const existingIndex = versionId ? versions.findIndex((v) => v.id === versionId) : -1;
    if (existingIndex >= 0) {
      const existing = versions[existingIndex];
      const updatedVersion: PrivacyPolicyVersion = {
        ...existing,
        title,
        summary,
        content,
        status: action === "publish" ? "published" : existing.status === "published" ? "draft" : existing.status,
        updatedAt: now,
        ...(action === "publish" ? { publishedAt: now, publishedBy: actor } : {}),
      };
      versions[existingIndex] = updatedVersion;
    } else {
      const newVersionNumber = Math.max(0, ...versions.map((v) => v.versionNumber || 0)) + 1;
      const newVersion: PrivacyPolicyVersion = {
        id: targetId,
        versionNumber: newVersionNumber,
        status: action === "publish" ? "published" : "draft",
        title,
        summary,
        content,
        createdAt: now,
        updatedAt: now,
        publishedAt: action === "publish" ? now : null,
        publishedBy: action === "publish" ? actor : null,
        author: actor,
      };
      versions.push(newVersion);
    }
  }

  let currentVersionId = currentDoc.currentVersionId;
  if (action === "publish") {
    currentVersionId = targetId;
  }

  const updatedDocument: PrivacyPolicyDocument = {
    currentVersionId,
    updatedAt: now,
    versions,
  };

  memoryPrivacyPolicyCache = updatedDocument;
  await writeStorageJson("privacy-policy.json", updatedDocument);
  await writeJson(PRIVACY_POLICY_FILE, updatedDocument);
  await writeJson(TMP_PRIVACY_POLICY_FILE, updatedDocument);

  return { versionId: targetId, policy: updatedDocument };
}

export async function getPrivacyPolicyForAdmin(): Promise<PrivacyPolicyDocument> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: document, error: documentError } = await supabase
        .from("privacy_policy_documents")
        .select("id,current_version_id,updated_at")
        .eq("slug", "privacy-policy")
        .maybeSingle();

      if (!documentError && document) {
        const documentRow = document as PrivacyPolicyDocumentRow;
        const { data: versions, error: versionsError } = await supabase
          .from("privacy_policy_versions")
          .select("id,version_number,status,title,summary,content,created_by,published_by,created_at,updated_at,published_at")
          .eq("document_id", documentRow.id)
          .order("version_number", { ascending: true });

        if (!versionsError && Array.isArray(versions) && versions.length > 0) {
          return {
            currentVersionId: documentRow.current_version_id,
            updatedAt: documentRow.updated_at,
            versions: versions.map((version: PrivacyPolicyVersionRow) => mapPrivacyPolicyVersion(version)),
          };
        }
      }
    } catch {}
  }

  return getStoredPrivacyPolicyFallback();
}

export async function getPublishedPrivacyPolicy(): Promise<PrivacyPolicyDocument> {
  const supabase = getSupabasePublicClient();
  if (supabase) {
    try {
      const { data: document, error: documentError } = await supabase
        .from("privacy_policy_documents")
        .select("id,current_version_id,updated_at")
        .eq("slug", "privacy-policy")
        .maybeSingle();

      if (!documentError && document) {
        const documentRow = document as PrivacyPolicyDocumentRow;
        if (documentRow.current_version_id) {
          const { data: version, error: versionError } = await supabase
            .from("privacy_policy_versions")
            .select("id,version_number,status,title,summary,content,created_by,published_by,created_at,updated_at,published_at")
            .eq("id", documentRow.current_version_id)
            .eq("document_id", documentRow.id)
            .eq("status", "published")
            .maybeSingle();

          if (!versionError && version) {
            const mappedVersion = mapPrivacyPolicyVersion(version as PrivacyPolicyVersionRow);
            return {
              currentVersionId: mappedVersion.id,
              updatedAt: documentRow.updated_at,
              versions: [mappedVersion],
            };
          }
        }
      }
    } catch {}
  }

  return getStoredPrivacyPolicyFallback();
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
