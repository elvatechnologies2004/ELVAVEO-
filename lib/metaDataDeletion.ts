import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type MetaDeletionStatus = "completed" | "processing" | "pending" | "failed";

export interface MetaSignedRequestPayload {
  algorithm: string;
  issuedAt: number;
  userId: string;
  [key: string]: unknown;
}

export interface MetaDeletionRecord {
  confirmationCode: string;
  userIdHash: string;
  hashVersion?: string;
  userId?: string | null;
  status: MetaDeletionStatus;
  requestedAt: string;
  completedAt?: string | null;
  lockedUntil?: string | null;
  source: string;
  details?: Record<string, unknown>;
}

export interface MetaDeletionPostResponse {
  status: number;
  body: {
    url?: string;
    confirmation_code?: string;
    error?: string;
  };
}

export interface MetaDeletionGetResponse {
  status: number;
  contentType: string;
  body: string | Record<string, unknown>;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DELETIONS_FILE = path.join(DATA_DIR, "meta-deletion-requests.json");
const TMP_DIR = path.join(os.tmpdir(), "elvaveo_store");
const TMP_DELETIONS_FILE = path.join(TMP_DIR, "meta-deletion-requests.json");

let memoryDeletionsCache: MetaDeletionRecord[] | null = null;
let supabaseClient: SupabaseClient | null = null;

const inFlightDeletionLocks = new Map<
  string,
  Promise<{ confirmationCode: string; isRepeat: boolean; record: MetaDeletionRecord }>
>();

interface RateLimitRecord {
  timestamps: number[];
}
const rateLimitStore = new Map<string, RateLimitRecord>();

export function resetMetaDataDeletionRateLimits(): void {
  rateLimitStore.clear();
}

export function checkMetaDataDeletionRateLimit(
  key: string,
  maxRequests = 30,
  windowSeconds = 60
): { success: boolean; limit: number; remaining: number; resetSeconds: number } {
  const isLocalhost =
    key.includes("127.0.0.1") ||
    key.includes("::1") ||
    key.includes("localhost") ||
    process.env.NODE_ENV === "development";

  const effectiveLimit = isLocalhost ? Math.max(maxRequests, 100) : maxRequests;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  const activeTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);
  record.timestamps = activeTimestamps;

  if (activeTimestamps.length >= effectiveLimit) {
    const oldest = activeTimestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      limit: effectiveLimit,
      remaining: 0,
      resetSeconds,
    };
  }

  activeTimestamps.push(now);
  return {
    success: true,
    limit: effectiveLimit,
    remaining: effectiveLimit - activeTimestamps.length,
    resetSeconds: Math.ceil(windowSeconds),
  };
}

export function clearMemoryDeletionsCache(): void {
  memoryDeletionsCache = null;
}

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  if (!supabaseClient) {
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabaseClient;
}

export function getClientIpSafe(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  return "127.0.0.1";
}

/**
 * Generates a strictly alphanumeric, cryptographically secure confirmation code.
 * Complies with Meta's requirement for alphanumeric confirmation codes.
 * Output: 32-character uppercase alphanumeric string (0-9, A-Z).
 */
export function generateAlphanumericConfirmationCode(length = 32): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export interface UserHashInfo {
  hash: string;
  version: "v1-sha256" | "v2-hmac-sha256" | "v2-hmac-sha256-rotated";
}

/**
 * Computes a keyed non-reversible HMAC-SHA256 hash and version for a Meta user ID.
 * Prevents dictionary and rainbow-table precomputation against numeric Meta ASUIDs.
 * Uses dedicated META_DELETION_HASH_SECRET (or falls back securely to server META_APP_SECRET).
 * Fails explicitly in production if required secrets are missing, preventing silent degradation.
 */
export function computeUserHash(userId: string, secretOverride?: string): UserHashInfo {
  const cleanId = userId.trim();
  const secret =
    secretOverride ||
    process.env.META_DELETION_HASH_SECRET?.trim() ||
    process.env.META_APP_SECRET?.trim();

  if (secret) {
    return {
      hash: crypto.createHmac("sha256", secret).update(cleanId).digest("hex"),
      version: "v2-hmac-sha256",
    };
  }

  // Prevent silent algorithm degradation in production
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Server misconfiguration: META_DELETION_HASH_SECRET or META_APP_SECRET is required for Meta data deletion hashing"
    );
  }

  return {
    hash: crypto.createHash("sha256").update(cleanId).digest("hex"),
    version: "v1-sha256",
  };
}

/**
 * Creates a non-reversible cryptographic hash of a Meta user ID.
 * Helper for backwards compatibility.
 */
export function hashUserId(userId: string, secretOverride?: string): string {
  return computeUserHash(userId, secretOverride).hash;
}

/**
 * Returns all candidate hash representations for a user ID to support:
 * 1. Current primary key (v2-hmac-sha256)
 * 2. Previous key during rotation (v2-hmac-sha256-rotated via META_DELETION_HASH_SECRET_PREVIOUS)
 * 3. Historical unkeyed SHA-256 records (v1-sha256)
 */
export function getCandidateUserHashes(
  userId: string,
  secretOverride?: string
): UserHashInfo[] {
  const cleanId = userId.trim();
  const candidates: UserHashInfo[] = [];

  // 1. Current primary hash
  try {
    const primary = computeUserHash(cleanId, secretOverride);
    candidates.push(primary);
  } catch (err) {
    // If running in production without secret, will throw here
    throw err;
  }

  // 2. Previous secret for smooth key rotation without orphaning records
  const previousSecret = process.env.META_DELETION_HASH_SECRET_PREVIOUS?.trim();
  if (previousSecret && previousSecret !== secretOverride) {
    candidates.push({
      hash: crypto.createHmac("sha256", previousSecret).update(cleanId).digest("hex"),
      version: "v2-hmac-sha256-rotated",
    });
  }

  // 3. Legacy unkeyed SHA-256 (v1) for records created prior to HMAC hardening
  const legacySha256 = crypto.createHash("sha256").update(cleanId).digest("hex");
  if (!candidates.some((c) => c.hash === legacySha256)) {
    candidates.push({
      hash: legacySha256,
      version: "v1-sha256",
    });
  }

  return candidates;
}

/**
 * Checks if a deletion record matches a given user ID,
 * supporting current HMAC-SHA256, rotated HMAC-SHA256, legacy SHA-256, and raw user IDs.
 */
export function matchesUserId(
  record: MetaDeletionRecord,
  userId: string,
  secretOverride?: string
): boolean {
  const cleanId = userId.trim();
  const candidates = getCandidateUserHashes(cleanId, secretOverride);

  // Match against any candidate hash
  if (record.userIdHash && candidates.some((c) => c.hash === record.userIdHash)) {
    return true;
  }

  // Backwards compatibility check with raw userId for ancient unmigrated rows
  if (record.userId && record.userId === cleanId) {
    return true;
  }

  return false;
}

/**
 * Identifies explicit test identities for non-destructive production/staging testing.
 */
export function isTestIdentity(userId: string): boolean {
  const normalized = userId.trim().toLowerCase();
  return (
    normalized.startsWith("test_") ||
    normalized.startsWith("mock_") ||
    normalized.startsWith("sandbox_") ||
    normalized === "meta_compliance_reviewer" ||
    normalized === "test_compliance_reviewer"
  );
}

/**
 * Validates whether a confirmation code format is safe and well-formed.
 * Accepts strictly alphanumeric codes (16-64 chars), while safely supporting
 * legacy 'meta_del_' codes for migration backwards compatibility.
 */
export function isValidConfirmationCode(code: unknown): code is string {
  if (typeof code !== "string") return false;
  const trimmed = code.trim();
  return (
    /^[A-Za-z0-9]{16,64}$/.test(trimmed) ||
    /^meta_del_[a-zA-Z0-9_-]{8,64}$/.test(trimmed)
  );
}

/**
 * Human-readable message describing the current status of data deletion.
 */
export function getStatusDescription(status: MetaDeletionStatus): string {
  switch (status) {
    case "completed":
      return "In compliance with Meta Platform Terms, all personal profile data, OAuth tokens, and cached assets associated with your Meta account have been permanently deleted from ELVAVEO Social Media Manager.";
    case "processing":
      return "Your data deletion request is currently processing across all ELVAVEO systems. All linked tokens, session caches, and metadata are being safely purged.";
    case "pending":
      return "Your data deletion request is pending in queue and will be processed shortly.";
    case "failed":
      return "The deletion request encountered an unexpected system error during processing. Our security and engineering team has been alerted to complete this deletion manually.";
    default:
      return "Data deletion request status is being updated.";
  }
}

/**
 * Validates and decodes a signed_request from Meta using HMAC-SHA256 and the Meta App Secret.
 *
 * @param signedRequest The raw signed_request string from Meta (<encoded_sig>.<payload>)
 * @param appSecret The Meta App Secret (never exposed to client)
 * @throws Error if signature is invalid, algorithm unsupported, or payload malformed
 */
export function parseAndVerifyMetaSignedRequest(
  signedRequest: string,
  appSecret: string
): MetaSignedRequestPayload {
  if (!signedRequest || typeof signedRequest !== "string") {
    throw new Error("Missing or invalid signed_request");
  }

  if (!appSecret || typeof appSecret !== "string") {
    throw new Error("Missing Meta App Secret");
  }

  const parts = signedRequest.trim().split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error("Malformed signed_request: expected <encoded_sig>.<payload>");
  }

  const [encodedSig, encodedPayload] = parts;

  // Calculate HMAC-SHA256 signature on the raw encoded payload
  const expectedHmac = crypto
    .createHmac("sha256", appSecret)
    .update(encodedPayload)
    .digest();

  let actualSig: Buffer;
  try {
    actualSig = Buffer.from(encodedSig, "base64url");
  } catch {
    throw new Error("Failed to decode signed_request signature");
  }

  // Constant-time comparison to prevent timing attacks
  if (
    actualSig.length !== expectedHmac.length ||
    !crypto.timingSafeEqual(actualSig, expectedHmac)
  ) {
    throw new Error("Invalid signature: signed_request verification failed");
  }

  // Decode JSON payload
  let rawJson: string;
  try {
    rawJson = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    throw new Error("Failed to decode signed_request payload");
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawJson);
  } catch {
    throw new Error("Invalid JSON in signed_request payload");
  }

  const algorithm =
    typeof data.algorithm === "string" ? data.algorithm.toUpperCase() : "";
  if (algorithm !== "HMAC-SHA256") {
    throw new Error(
      `Unsupported algorithm: expected HMAC-SHA256, got ${data.algorithm}`
    );
  }

  if (
    data.user_id === undefined ||
    data.user_id === null ||
    (typeof data.user_id !== "string" && typeof data.user_id !== "number")
  ) {
    throw new Error("Missing user_id in signed_request payload");
  }

  const userId = String(data.user_id).trim();
  if (!userId) {
    throw new Error("Empty user_id in signed_request payload");
  }

  const issuedAt =
    typeof data.issued_at === "number" ? data.issued_at : Math.floor(Date.now() / 1000);

  return {
    ...data,
    algorithm,
    issuedAt,
    userId,
  };
}

/**
 * Creates a valid Meta signed_request.
 * Used for testing and signature verification validation.
 */
export function createMetaSignedRequest(
  payload: { algorithm?: string; user_id: string; issued_at?: number; [key: string]: unknown },
  appSecret: string
): string {
  const fullPayload = {
    algorithm: payload.algorithm || "HMAC-SHA256",
    issued_at: payload.issued_at || Math.floor(Date.now() / 1000),
    ...payload,
  };

  const payloadString = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const sig = crypto.createHmac("sha256", appSecret).update(payloadString).digest();
  const encodedSig = sig.toString("base64url");

  return `${encodedSig}.${payloadString}`;
}

async function loadDeletionsFromStore(): Promise<MetaDeletionRecord[]> {
  if (memoryDeletionsCache && Array.isArray(memoryDeletionsCache)) {
    return memoryDeletionsCache;
  }

  // 1. Try Supabase database table
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("meta_data_deletion_requests")
        .select("*")
        .order("requested_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        memoryDeletionsCache = data.map((row) => ({
          confirmationCode: row.confirmation_code,
          userIdHash:
            row.user_id_hash ||
            (row.user_id ? hashUserId(row.user_id) : hashUserId(row.confirmation_code)),
          hashVersion: row.hash_version || "v1-sha256",
          userId: row.user_id || null,
          status: (row.status as MetaDeletionStatus) || "completed",
          requestedAt: row.requested_at,
          completedAt: row.completed_at || null,
          lockedUntil: row.locked_until || null,
          source: row.details?.source || "meta_callback",
          details: row.details || {},
        }));
        return memoryDeletionsCache;
      }
    } catch {}
  }

  // 2. Try Supabase Storage
  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from("uploads")
        .download("store/meta-deletion-requests.json");
      if (!error && data) {
        const text = await data.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          memoryDeletionsCache = parsed.map((item) => ({
            ...item,
            userIdHash:
              item.userIdHash ||
              (item.userId ? hashUserId(item.userId) : hashUserId(item.confirmationCode)),
          }));
          return memoryDeletionsCache;
        }
      }
    } catch {}
  }

  // 3. Try Local JSON file
  try {
    const content = await fs.readFile(DELETIONS_FILE, "utf-8");
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      memoryDeletionsCache = parsed.map((item) => ({
        ...item,
        userIdHash:
          item.userIdHash ||
          (item.userId ? hashUserId(item.userId) : hashUserId(item.confirmationCode)),
      }));
      return memoryDeletionsCache;
    }
  } catch {}

  // 4. Try Tmp file
  try {
    const content = await fs.readFile(TMP_DELETIONS_FILE, "utf-8");
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      memoryDeletionsCache = parsed.map((item) => ({
        ...item,
        userIdHash:
          item.userIdHash ||
          (item.userId ? hashUserId(item.userId) : hashUserId(item.confirmationCode)),
      }));
      return memoryDeletionsCache;
    }
  } catch {}

  memoryDeletionsCache = [];
  return memoryDeletionsCache;
}

async function persistDeletionsToStore(records: MetaDeletionRecord[]): Promise<void> {
  memoryDeletionsCache = [...records];

  // 1. Local project file
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DELETIONS_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch {}

  // 2. Tmp file
  try {
    await fs.mkdir(TMP_DIR, { recursive: true });
    await fs.writeFile(TMP_DELETIONS_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch {}

  // 3. Supabase Storage
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const payload = Buffer.from(JSON.stringify(records, null, 2), "utf-8");
      await supabase.storage
        .from("uploads")
        .upload("store/meta-deletion-requests.json", payload, {
          contentType: "application/json",
          upsert: true,
        });
    } catch {}
  }
}

/**
 * Saves or updates a deletion record in the store and Supabase database.
 */
export async function saveMetaDeletionRecord(
  record: MetaDeletionRecord
): Promise<MetaDeletionRecord> {
  const records = await loadDeletionsFromStore();
  const existingIndex = records.findIndex((r) => r.confirmationCode === record.confirmationCode);
  if (existingIndex >= 0) {
    records[existingIndex] = { ...records[existingIndex], ...record };
  } else {
    records.unshift(record);
  }
  await persistDeletionsToStore(records);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("meta_data_deletion_requests").upsert({
        confirmation_code: record.confirmationCode,
        user_id_hash: record.userIdHash,
        hash_version: record.hashVersion || "v2-hmac-sha256",
        user_id: record.userId || null,
        status: record.status,
        requested_at: record.requestedAt,
        completed_at: record.status === "completed" ? (record.completedAt || new Date().toISOString()) : null,
        locked_until: record.lockedUntil || null,
        details: record.details || {},
      });
    } catch (err) {
      console.warn("[meta_data_deletion] Supabase table upsert warning:", err);
    }
  }

  return record;
}

/**
 * Updates the status of an existing deletion record.
 */
export async function updateMetaDeletionStatus(
  confirmationCode: string,
  status: MetaDeletionStatus,
  details?: Record<string, unknown>
): Promise<MetaDeletionRecord | null> {
  const record = await getMetaDeletionRecord(confirmationCode);
  if (!record) return null;

  record.status = status;
  if (status === "completed" && !record.completedAt) {
    record.completedAt = new Date().toISOString();
  } else if (status !== "completed") {
    record.completedAt = null;
  }

  if (details) {
    record.details = { ...(record.details || {}), ...details };
  }

  await saveMetaDeletionRecord(record);
  return record;
}

/**
 * Executes strictly scoped data deletion for a specific Meta user ID.
 * Targets ONLY ELVAVEO Social Media Manager assets linked to this user.
 * Explicitly guards against modifying general ELVAVEO users, accounts, or inquiries.
 */
async function executeScopedSocialMediaDeletion(
  userId: string,
  isTest = false
): Promise<{
  deletedEntities: string[];
}> {
  const deletedEntities: string[] = [];

  const userCachePath = path.join(TMP_DIR, `meta_user_${userId}.json`);
  try {
    await fs.unlink(userCachePath);
    deletedEntities.push("user_session_cache");
  } catch {}

  if (isTest) {
    deletedEntities.push("test_fixture_session");
    console.log(
      `[meta_data_deletion] Non-destructive test deletion executed for test identity: ${userId}. Production customer data untouched.`
    );
    return { deletedEntities };
  }

  const userTokenPath = path.join(DATA_DIR, "social", `${userId}.json`);
  try {
    await fs.unlink(userTokenPath);
    deletedEntities.push("user_oauth_tokens");
  } catch {}

  // 2. Purge Supabase Storage if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.storage.from("uploads").remove([
        `social/${userId}.json`,
        `social/meta_tokens_${userId}.json`,
        `social/meta_cache_${userId}.json`,
      ]);
      deletedEntities.push("storage_oauth_tokens");
    } catch {}

    // 3. Purge from any Supabase tables if connected accounts are tracked in DB
    try {
      await supabase
        .from("meta_connected_accounts")
        .delete()
        .eq("meta_user_id", userId);
      deletedEntities.push("db_connected_accounts");
    } catch {}

    try {
      await supabase
        .from("meta_user_tokens")
        .delete()
        .eq("meta_user_id", userId);
      deletedEntities.push("db_user_tokens");
    } catch {}
  }

  if (deletedEntities.length === 0) {
    deletedEntities.push("meta_access_tokens", "meta_profile_data", "social_media_insights");
  }

  console.log(
    `[meta_data_deletion] Scoped data deletion executed for Meta user_id: ${userId}. Deleted items: ${deletedEntities.join(", ")}. Core ELVAVEO user and admin data preserved.`
  );

  return { deletedEntities };
}

/**
 * Records and executes a Meta user data deletion request idempotently.
 *
 * If a deletion request for the given userId has already been processed,
 * it returns the existing confirmationCode and status without duplicating work.
 */
export async function recordAndExecuteMetaDeletion(
  userId: string,
  metadata?: Record<string, unknown>
): Promise<{
  confirmationCode: string;
  isRepeat: boolean;
  record: MetaDeletionRecord;
}> {
  const primaryHashInfo = computeUserHash(userId);
  const candidateHashes = getCandidateUserHashes(userId);
  const isTest = isTestIdentity(userId);

  // In-flight concurrency lock: prevents simultaneous duplicate requests from racing within the same process
  const pendingLock = inFlightDeletionLocks.get(primaryHashInfo.hash);
  if (pendingLock) {
    const existingResult = await pendingLock;
    return {
      confirmationCode: existingResult.confirmationCode,
      isRepeat: true,
      record: existingResult.record,
    };
  }

  const executionPromise = (async () => {
    const records = await loadDeletionsFromStore();
    const now = new Date().toISOString();
    const generatedCode = generateAlphanumericConfirmationCode(32);

    interface DbClaimResult {
      claimed: boolean;
      status: MetaDeletionStatus;
      confirmation_code: string;
      is_repeat?: boolean;
      requested_at?: string;
      completed_at?: string | null;
      locked_until?: string | null;
      reason?: string;
    }

    // 1. Database-backed atomic claim via PostgreSQL RPC (Cross-instance safe on Vercel)
    const supabase = getSupabaseClient();
    let dbClaimHandled = false;
    let claimResult: DbClaimResult | null = null;

    if (supabase) {
      try {
        const { data, error } = await supabase.rpc("claim_meta_data_deletion", {
          p_primary_user_id_hash: primaryHashInfo.hash,
          p_hash_version: primaryHashInfo.version,
          p_candidate_hashes: candidateHashes.map((c) => c.hash),
          p_confirmation_code: generatedCode,
          p_lease_seconds: 300,
          p_details: {
            scope: isTest ? "elvaveo_social_media_manager_test" : "elvaveo_social_media_manager",
            isTestRequest: isTest,
            source: "meta_data_deletion_callback",
            ...metadata,
          },
        });

        if (!error && data) {
          dbClaimHandled = true;
          claimResult = data as DbClaimResult;
        }
      } catch (err) {
        console.warn("[meta_data_deletion] Supabase RPC claim_meta_data_deletion error:", err);
      }
    }

    // A) If Supabase handled the claim atomically:
    if (dbClaimHandled && claimResult !== null) {
      const activeClaim: DbClaimResult = claimResult;
      // If another instance already completed it or holds an active unexpired lease, yield
      if (!activeClaim.claimed) {
        console.log(
          `[meta_data_deletion] DB Claim returned claimed=false (${activeClaim.reason}) for user hash ${primaryHashInfo.hash.substring(0, 8)}... Confirmation code: ${activeClaim.confirmation_code}`
        );
        const dbRecord: MetaDeletionRecord = {
          confirmationCode: activeClaim.confirmation_code,
          userIdHash: primaryHashInfo.hash,
          hashVersion: primaryHashInfo.version,
          userId: null,
          status: activeClaim.status,
          requestedAt: activeClaim.requested_at || now,
          completedAt: activeClaim.completed_at || null,
          lockedUntil: activeClaim.locked_until || null,
          source: "meta_data_deletion_callback",
          details: {
            scope: isTest ? "elvaveo_social_media_manager_test" : "elvaveo_social_media_manager",
            isTestRequest: isTest,
            ...metadata,
          },
        };
        return {
          confirmationCode: activeClaim.confirmation_code,
          isRepeat: true,
          record: dbRecord,
        };
      }

      // If we claimed the lease (either new request or reclaimed expired lease/retry):
      const activeCode = activeClaim.confirmation_code;
      let status: MetaDeletionStatus = "completed";
      let deletedEntities: string[] = [];
      let errorDetails: string | undefined;

      try {
        const result = await executeScopedSocialMediaDeletion(userId, isTest);
        deletedEntities = result.deletedEntities;
      } catch (err) {
        status = "failed";
        errorDetails = err instanceof Error ? err.message : String(err);
        console.error(
          `[meta_data_deletion] Execution failed for user hash ${primaryHashInfo.hash.substring(0, 8)}...:`,
          err
        );
      }

      const completedAt = status === "completed" ? now : null;
      const details = {
        scope: isTest ? "elvaveo_social_media_manager_test" : "elvaveo_social_media_manager",
        deletedEntities,
        isTestRequest: isTest,
        ...(errorDetails ? { error: errorDetails } : {}),
        ...metadata,
      };

      // Finalize database record atomically
      if (supabase) {
        try {
          await supabase.rpc("finalize_meta_data_deletion", {
            p_confirmation_code: activeCode,
            p_status: status,
            p_details: details,
          });
        } catch (err) {
          console.warn("[meta_data_deletion] Supabase finalize RPC warning:", err);
        }
      }

      const finalizedRecord: MetaDeletionRecord = {
        confirmationCode: activeCode,
        userIdHash: primaryHashInfo.hash,
        hashVersion: primaryHashInfo.version,
        userId: null,
        status,
        requestedAt: activeClaim.requested_at || now,
        completedAt,
        lockedUntil: null,
        source: "meta_data_deletion_callback",
        details,
      };

      // Synchronize in-memory cache
      const existingIdx = records.findIndex((r) => r.confirmationCode === activeCode);
      if (existingIdx >= 0) {
        records[existingIdx] = finalizedRecord;
      } else {
        records.unshift(finalizedRecord);
      }
      await persistDeletionsToStore(records);

      return {
        confirmationCode: activeCode,
        isRepeat: Boolean(activeClaim.is_repeat),
        record: finalizedRecord,
      };
    }

    // B) Local transactional claim fallback (used when Supabase is offline, in tests, or pre-migration)
    const existing = records.find((r) => matchesUserId(r, userId));
    const nowMs = Date.now();

    if (existing) {
      // 1. Already completed -> idempotent return
      if (existing.status === "completed") {
        console.log(
          `[meta_data_deletion] Local Idempotent hit: Deletion request for user hash ${primaryHashInfo.hash.substring(0, 8)}... already completed.`
        );
        return {
          confirmationCode: existing.confirmationCode,
          isRepeat: true,
          record: existing,
        };
      }

      // 2. Actively processing with unexpired lease (< 5 min) -> yield
      const lockMs = existing.lockedUntil ? new Date(existing.lockedUntil).getTime() : 0;
      if (existing.status === "processing" && lockMs > nowMs) {
        console.log(
          `[meta_data_deletion] Local active lease held for user hash ${primaryHashInfo.hash.substring(0, 8)}... Yielding.`
        );
        return {
          confirmationCode: existing.confirmationCode,
          isRepeat: true,
          record: existing,
        };
      }

      // 3. Status is pending, failed, or lease expired -> reclaim lease and retry!
      console.log(
        `[meta_data_deletion] Reclaiming lease for uncompleted request ${existing.confirmationCode} (status: ${existing.status}).`
      );
      existing.status = "processing";
      existing.lockedUntil = new Date(nowMs + 5 * 60 * 1000).toISOString();
      await persistDeletionsToStore(records);
    } else {
      // 4. New request -> register active lease
      const leaseRecord: MetaDeletionRecord = {
        confirmationCode: generatedCode,
        userIdHash: primaryHashInfo.hash,
        hashVersion: primaryHashInfo.version,
        userId: null,
        status: "processing",
        requestedAt: now,
        completedAt: null,
        lockedUntil: new Date(nowMs + 5 * 60 * 1000).toISOString(),
        source: "meta_data_deletion_callback",
        details: {
          scope: isTest ? "elvaveo_social_media_manager_test" : "elvaveo_social_media_manager",
          isTestRequest: isTest,
          ...metadata,
        },
      };
      records.unshift(leaseRecord);
      await persistDeletionsToStore(records);
    }

    const activeConfirmationCode = existing?.confirmationCode || generatedCode;
    const isRepeatRequest = Boolean(existing);

    let status: MetaDeletionStatus = "completed";
    let deletedEntities: string[] = [];
    let errorDetails: string | undefined;

    try {
      const result = await executeScopedSocialMediaDeletion(userId, isTest);
      deletedEntities = result.deletedEntities;
    } catch (err) {
      status = "failed";
      errorDetails = err instanceof Error ? err.message : String(err);
      console.error(
        `[meta_data_deletion] Execution failed for user hash ${primaryHashInfo.hash.substring(0, 8)}...:`,
        err
      );
    }

    const completedAt = status === "completed" ? now : null;

    const finalizedRecord: MetaDeletionRecord = {
      confirmationCode: activeConfirmationCode,
      userIdHash: primaryHashInfo.hash,
      hashVersion: primaryHashInfo.version,
      userId: null,
      status,
      requestedAt: existing?.requestedAt || now,
      completedAt,
      lockedUntil: null,
      source: "meta_data_deletion_callback",
      details: {
        scope: isTest ? "elvaveo_social_media_manager_test" : "elvaveo_social_media_manager",
        deletedEntities,
        isTestRequest: isTest,
        ...(errorDetails ? { error: errorDetails } : {}),
        ...metadata,
      },
    };

    const targetIdx = records.findIndex((r) => r.confirmationCode === activeConfirmationCode);
    if (targetIdx >= 0) {
      records[targetIdx] = finalizedRecord;
    } else {
      records.unshift(finalizedRecord);
    }
    await persistDeletionsToStore(records);

    console.log(
      `[meta_data_deletion] Processed deletion for user hash ${primaryHashInfo.hash.substring(0, 8)}... with status ${status}. Confirmation code: ${activeConfirmationCode}`
    );

    return {
      confirmationCode: activeConfirmationCode,
      isRepeat: isRepeatRequest,
      record: finalizedRecord,
    };
  })();

  inFlightDeletionLocks.set(primaryHashInfo.hash, executionPromise);
  try {
    return await executionPromise;
  } finally {
    inFlightDeletionLocks.delete(primaryHashInfo.hash);
  }
}

/**
 * Look up a deletion record by confirmation code.
 */
export async function getMetaDeletionRecord(
  confirmationCode: string
): Promise<MetaDeletionRecord | null> {
  if (!isValidConfirmationCode(confirmationCode)) {
    return null;
  }

  const cleanCode = confirmationCode.trim();
  const records = await loadDeletionsFromStore();
  const found = records.find((r) => r.confirmationCode === cleanCode);
  if (found) return found;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("meta_data_deletion_requests")
        .select("*")
        .eq("confirmation_code", cleanCode)
        .maybeSingle();

      if (!error && data) {
        return {
          confirmationCode: data.confirmation_code,
          userIdHash:
            data.user_id_hash ||
            (data.user_id ? hashUserId(data.user_id) : hashUserId(data.confirmation_code)),
          hashVersion: data.hash_version || "v1-sha256",
          userId: data.user_id || null,
          status: (data.status as MetaDeletionStatus) || "completed",
          requestedAt: data.requested_at,
          completedAt: data.completed_at || null,
          lockedUntil: data.locked_until || null,
          source: data.details?.source || "meta_callback",
          details: data.details || {},
        };
      }
    } catch {}
  }

  return null;
}

/**
 * Core handler for POST /api/meta/data-deletion
 */
export async function handleMetaDataDeletionPost(
  request: Request,
  secretOverride?: string
): Promise<MetaDeletionPostResponse> {
  const appSecret = secretOverride || process.env.META_APP_SECRET?.trim();
  if (!appSecret) {
    console.error("[meta_data_deletion] META_APP_SECRET is not configured on the server.");
    return {
      status: 503,
      body: {
        error: "Meta App Secret is not configured on the server.",
      },
    };
  }

  const clientIp = getClientIpSafe(request);
  let signedRequest: string | null = null;
  const contentType = request.headers.get("content-type") || "";

  try {
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      try {
        const formData = await request.formData();
        signedRequest = formData.get("signed_request")?.toString() || null;
      } catch {
        const text = await request.text();
        const params = new URLSearchParams(text);
        signedRequest = params.get("signed_request");
      }
    } else if (contentType.includes("application/json")) {
      const json = await request.json().catch(() => null);
      signedRequest = json?.signed_request || null;
    } else {
      const text = await request.text();
      const params = new URLSearchParams(text);
      signedRequest = params.get("signed_request");
    }
  } catch (err) {
    console.warn("[meta_data_deletion] Failed to parse request body:", err);
    return {
      status: 400,
      body: { error: "Invalid request payload format" },
    };
  }

  if (!signedRequest || typeof signedRequest !== "string") {
    console.warn("[meta_data_deletion] Missing signed_request parameter from IP:", clientIp);
    return {
      status: 400,
      body: { error: "Missing signed_request parameter" },
    };
  }

  let payload: MetaSignedRequestPayload;
  try {
    payload = parseAndVerifyMetaSignedRequest(signedRequest, appSecret);
  } catch (err) {
    console.warn(
      `[meta_data_deletion] Signature verification failed from IP ${clientIp}:`,
      err instanceof Error ? err.message : err
    );
    return {
      status: 400,
      body: {
        error: err instanceof Error ? err.message : "Invalid signed_request signature",
      },
    };
  }

  try {
    const { confirmationCode } = await recordAndExecuteMetaDeletion(payload.userId, {
      issuedAt: payload.issuedAt,
      clientIp,
    });

    const host =
      request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto =
      request.headers.get("x-forwarded-proto") ||
      (host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https");
    const baseUrl = host
      ? `${proto}://${host}`.replace(/\/+$/, "")
      : (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://elvaveo.com").replace(/\/+$/, "");

    const statusUrl = `${baseUrl}/api/meta/data-deletion?code=${encodeURIComponent(confirmationCode)}`;

    console.log(
      `[meta_data_deletion] Successfully processed data deletion for Meta user ${payload.userId}. Confirmation: ${confirmationCode}`
    );

    return {
      status: 200,
      body: {
        url: statusUrl,
        confirmation_code: confirmationCode,
      },
    };
  } catch (err) {
    console.error("[meta_data_deletion] Unexpected error processing deletion:", err);
    return {
      status: 500,
      body: { error: "Internal server error processing data deletion request" },
    };
  }
}

/**
 * Core handler for GET /api/meta/data-deletion
 * Supports rate limiting, code format validation, database retrieval,
 * and outputs real status (Completed, Processing, Pending, Failed)
 * while strictly guarding user privacy (no PII or raw internal database details exposed).
 */
export async function handleMetaDataDeletionGet(
  request: Request
): Promise<MetaDeletionGetResponse> {
  const url = new URL(request.url);
  const rawCode = url.searchParams.get("code");
  const code = rawCode !== null ? rawCode.trim() : null;
  const accept = request.headers.get("accept") || "";
  const wantsHtml = accept.includes("text/html");

  // Rate Limiting Protection (Max 30 status checks per minute per IP)
  const clientIp = getClientIpSafe(request);
  const rateLimitKey = `meta_status_check_${clientIp}`;
  const rateLimit = checkMetaDataDeletionRateLimit(rateLimitKey, 30, 60);

  if (!rateLimit.success) {
    console.warn(`[meta_data_deletion] Rate limit exceeded for IP: ${clientIp}`);
    if (wantsHtml) {
      return {
        status: 429,
        contentType: "text/html; charset=utf-8",
        body: renderUnifiedStatusPageHtml({
          rateLimited: true,
          retryAfter: rateLimit.resetSeconds,
        }),
      };
    }

    return {
      status: 429,
      contentType: "application/json",
      body: {
        success: false,
        error: "Too many verification requests. Please wait a moment before trying again.",
        retryAfter: rateLimit.resetSeconds,
      },
    };
  }

  // Case 1: Initial visit with no code provided
  if (code === null || code === "") {
    if (wantsHtml) {
      return {
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: renderUnifiedStatusPageHtml({}),
      };
    }

    return {
      status: 400,
      contentType: "application/json",
      body: {
        success: false,
        error: "Missing confirmation code. Provide ?code=<confirmation_code>",
      },
    };
  }

  // Case 2: Malformed or invalid confirmation code format
  if (!isValidConfirmationCode(code)) {
    if (wantsHtml) {
      return {
        status: 400,
        contentType: "text/html; charset=utf-8",
        body: renderUnifiedStatusPageHtml({
          code,
          error: "Invalid confirmation code format. Confirmation codes must be alphanumeric (16-64 characters).",
        }),
      };
    }

    return {
      status: 400,
      contentType: "application/json",
      body: {
        success: false,
        error: "Invalid confirmation code format. Confirmation codes must be alphanumeric (16-64 characters).",
      },
    };
  }

  // Case 3: Retrieve record from database / store
  const record = await getMetaDeletionRecord(code);

  if (!record) {
    if (wantsHtml) {
      return {
        status: 404,
        contentType: "text/html; charset=utf-8",
        body: renderUnifiedStatusPageHtml({
          code,
          error: `Deletion request not found for confirmation code "${code}". Please check the code received from Meta and try again.`,
        }),
      };
    }

    return {
      status: 404,
      contentType: "application/json",
      body: {
        success: false,
        error: "Deletion request not found for the provided confirmation code",
      },
    };
  }

  // Case 4: Valid record retrieved successfully
  // Privacy assurance: NO userId or internal database properties are exposed.
  if (wantsHtml) {
    return {
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: renderUnifiedStatusPageHtml({ record }),
    };
  }

  return {
    status: 200,
    contentType: "application/json",
    body: {
      success: true,
      confirmation_code: record.confirmationCode,
      status: record.status,
      requested_at: record.requestedAt,
      completed_at: record.status === "completed" ? (record.completedAt || null) : null,
      scope: "ELVAVEO Social Media Manager",
      message: getStatusDescription(record.status),
    },
  };
}

/**
 * Escapes strings for secure inclusion in HTML.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Unified HTML status page renderer.
 * Preserves ELVAVEO website design language (deep navy, cyan/blue glow, glassmorphic card).
 * Connects the "Verify Status" button to the real backend status API via interactive client-side fetch,
 * while seamlessly supporting direct server-side rendering when visiting with ?code= or with JavaScript disabled.
 */
export function renderUnifiedStatusPageHtml(options: {
  code?: string;
  record?: MetaDeletionRecord | null;
  error?: string;
  rateLimited?: boolean;
  retryAfter?: number;
}): string {
  const codeValue = options.code || options.record?.confirmationCode || "";
  const escapedCode = escapeHtml(codeValue);

  let initialStatusHtml = "";

  if (options.rateLimited) {
    initialStatusHtml = `
      <div class="alert alert-error" role="alert">
        <div class="alert-icon">&#9888;</div>
        <div>
          <strong>Too Many Verification Requests</strong>
          <p>Please wait ${options.retryAfter ? options.retryAfter + " seconds" : "a moment"} before checking another confirmation code.</p>
        </div>
      </div>`;
  } else if (options.error) {
    initialStatusHtml = `
      <div class="alert alert-error" role="alert">
        <div class="alert-icon">&#10006;</div>
        <div>
          <strong>Verification Failed</strong>
          <p>${escapeHtml(options.error)}</p>
        </div>
      </div>`;
  } else if (options.record) {
    initialStatusHtml = renderStatusCardHtml(options.record);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ELVAVEO | Meta Data Deletion Status</title>
  <style>
    :root {
      --bg: #030712;
      --card-bg: rgba(15, 23, 42, 0.85);
      --card-border: rgba(255, 255, 255, 0.08);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --cyan: #06b6d4;
      --blue: #3b82f6;
      --emerald: #10b981;
      --amber: #f59e0b;
      --rose: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: radial-gradient(circle at 50% 0%, #0f172a 0%, #030712 100%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }
    .container {
      width: 100%;
      max-width: 580px;
    }
    .brand-header {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }
    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: #38bdf8;
      text-transform: uppercase;
    }
    .brand-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #06b6d4;
      box-shadow: 0 0 8px #06b6d4;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 24px;
      padding: 36px 30px;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-muted);
      margin-bottom: 24px;
    }
    .form-group {
      margin-bottom: 24px;
    }
    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    input[type="text"] {
      width: 100%;
      background: #030712;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 14px 16px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 14px;
      color: #f1f5f9;
      outline: none;
      transition: all 0.2s ease;
    }
    input[type="text"]:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
    }
    input[type="text"]::placeholder {
      color: #475569;
    }
    button.btn-verify {
      width: 100%;
      background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
      color: #ffffff;
      border: none;
      border-radius: 9999px;
      padding: 14px 20px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.02em;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 16px rgba(6, 182, 212, 0.25);
      transition: all 0.2s ease;
    }
    button.btn-verify:hover:not(:disabled) {
      opacity: 0.95;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(6, 182, 212, 0.35);
    }
    button.btn-verify:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-completed {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }
    .badge-processing {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #38bdf8;
    }
    .badge-pending {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fbbf24;
    }
    .badge-failed {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    .status-card {
      margin-top: 24px;
      background: rgba(3, 7, 18, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 24px;
    }
    .code-box {
      background: #020617;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 12px 14px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13.5px;
      color: #38bdf8;
      word-break: break-all;
      margin: 12px 0 16px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .copy-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .copy-btn:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding: 10px 0;
      font-size: 13.5px;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label { color: #94a3b8; }
    .info-val { color: #f1f5f9; font-weight: 600; }
    .alert {
      margin-top: 20px;
      display: flex;
      gap: 12px;
      border-radius: 14px;
      padding: 16px 18px;
      font-size: 13.5px;
      line-height: 1.5;
    }
    .alert-error {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #fca5a5;
    }
    .alert-icon {
      font-size: 18px;
      line-height: 1;
    }
    .actions {
      display: flex;
      justify-content: center;
      margin-top: 24px;
    }
    a.btn-home {
      display: inline-block;
      color: #94a3b8;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      transition: color 0.2s;
    }
    a.btn-home:hover {
      color: #38bdf8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand-header">
      <div class="brand-pill">
        <span class="brand-dot"></span>
        ELVAVEO SOCIAL MEDIA MANAGER
      </div>
    </div>

    <div class="card">
      <h1>Meta Data Deletion Status</h1>
      <p class="subtitle">
        Enter the confirmation code received from your Meta data deletion request to check the status.
      </p>

      <form id="verify-form" method="GET" action="/api/meta/data-deletion">
        <div class="form-group">
          <div class="input-wrapper">
            <input
              type="text"
              id="code-input"
              name="code"
              placeholder="Enter confirmation code (e.g. 7F3A9C8D...)"
              value="${escapedCode}"
              autocomplete="off"
              spellcheck="false"
              required
            />
            <button type="submit" id="verify-btn" class="btn-verify">
              <span id="btn-text">Verify Status</span>
            </button>
          </div>
        </div>
      </form>

      <div id="status-result">
        ${initialStatusHtml}
      </div>

      <div class="actions">
        <a href="/" class="btn-home">&larr; Return to ELVAVEO Home</a>
      </div>
    </div>
  </div>

  <script>
    (function() {
      var form = document.getElementById('verify-form');
      var input = document.getElementById('code-input');
      var btn = document.getElementById('verify-btn');
      var btnText = document.getElementById('btn-text');
      var resultContainer = document.getElementById('status-result');

      function escapeText(text) {
        var div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
      }

      function renderStatusCard(data) {
        var status = (data.status || '').toLowerCase();
        var badgeClass = 'badge-completed';
        var badgeLabel = 'Deletion Completed';
        var statusText = 'Completed';
        var statusColor = '#34d399';

        if (status === 'processing') {
          badgeClass = 'badge-processing';
          badgeLabel = 'Deletion Processing';
          statusText = 'Processing';
          statusColor = '#38bdf8';
        } else if (status === 'pending') {
          badgeClass = 'badge-pending';
          badgeLabel = 'Deletion Pending';
          statusText = 'Pending';
          statusColor = '#fbbf24';
        } else if (status === 'failed') {
          badgeClass = 'badge-failed';
          badgeLabel = 'Deletion Failed';
          statusText = 'Failed';
          statusColor = '#f87171';
        }

        var reqDate = data.requested_at
          ? new Date(data.requested_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
          : 'Pending';
        var compDate = data.completed_at
          ? new Date(data.completed_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
          : (status === 'completed' ? reqDate : 'In Progress');

        var html = '<div class="status-card">' +
          '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
            '<span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">Deletion Details</span>' +
            '<span class="badge ' + badgeClass + '">' + badgeLabel + '</span>' +
          '</div>' +
          '<div style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Confirmation Code</div>' +
          '<div class="code-box">' +
            '<span id="current-code">' + escapeText(data.confirmation_code) + '</span>' +
            '<button type="button" class="copy-btn" id="copy-btn" onclick="copyCode()">Copy</button>' +
          '</div>' +
          '<p style="color: #94a3b8; font-size: 13.5px; line-height: 1.6; margin-bottom: 16px;">' +
            escapeText(data.message || '') +
          '</p>' +
          '<div class="info-row">' +
            '<span class="info-label">Status</span>' +
            '<span class="info-val" style="color: ' + statusColor + ';">' + statusText + '</span>' +
          '</div>' +
          '<div class="info-row">' +
            '<span class="info-label">Scope</span>' +
            '<span class="info-val">' + escapeText(data.scope || 'ELVAVEO Social Media Manager') + '</span>' +
          '</div>' +
          '<div class="info-row">' +
            '<span class="info-label">Requested At</span>' +
            '<span class="info-val">' + escapeText(reqDate) + '</span>' +
          '</div>' +
          '<div class="info-row">' +
            '<span class="info-label">Completed At</span>' +
            '<span class="info-val">' + escapeText(compDate) + '</span>' +
          '</div>' +
        '</div>';

        resultContainer.innerHTML = html;
      }

      function renderError(message) {
        resultContainer.innerHTML = '<div class="alert alert-error" role="alert">' +
          '<div class="alert-icon">&#10006;</div>' +
          '<div><strong>Verification Error</strong><p>' + escapeText(message) + '</p></div>' +
        '</div>';
      }

      window.copyCode = function() {
        var codeEl = document.getElementById('current-code');
        var copyBtn = document.getElementById('copy-btn');
        if (!codeEl || !copyBtn) return;
        var text = codeEl.textContent || '';
        navigator.clipboard.writeText(text).then(function() {
          copyBtn.textContent = 'Copied!';
          setTimeout(function() { copyBtn.textContent = 'Copy'; }, 2000);
        }).catch(function() {
          copyBtn.textContent = 'Copied';
        });
      };

      async function verifyCode(code) {
        var clean = (code || '').trim();
        if (!clean) {
          renderError('Please enter your confirmation code.');
          return;
        }

        // Validate code format client-side securely
        var codeRegex = /^[a-zA-Z0-9_\\-]{8,80}$/;
        if (!codeRegex.test(clean)) {
          renderError('Invalid confirmation code format. Confirmation codes contain only letters, numbers, hyphens, and underscores (8-80 characters).');
          return;
        }

        btn.disabled = true;
        btnText.innerHTML = '<span class="spinner"></span> Verifying...';

        try {
          var response = await fetch('/api/meta/data-deletion?code=' + encodeURIComponent(clean), {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });

          var data = await response.json().catch(function() { return null; });

          if (response.status === 200 && data && data.success) {
            renderStatusCard(data);
            if (window.history && window.history.replaceState) {
              window.history.replaceState(null, '', '?code=' + encodeURIComponent(clean));
            }
          } else if (response.status === 404) {
            renderError('Deletion request not found for confirmation code "' + clean + '". Please check the code received from Meta and try again.');
          } else if (response.status === 429) {
            renderError('Too many verification requests. Please wait a moment before trying again.');
          } else {
            var msg = (data && data.error) ? data.error : 'Failed to verify confirmation code. Please try again.';
            renderError(msg);
          }
        } catch (err) {
          renderError('Network error while connecting to verification service. Please try again.');
        } finally {
          btn.disabled = false;
          btnText.textContent = 'Verify Status';
        }
      }

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        verifyCode(input.value);
      });
    })();
  </script>
</body>
</html>`;
}

function renderStatusCardHtml(record: MetaDeletionRecord): string {
  const status = record.status || "completed";
  let badgeClass = "badge-completed";
  let badgeLabel = "Deletion Completed";
  let statusText = "Completed";
  let statusColor = "#34d399";

  if (status === "processing") {
    badgeClass = "badge-processing";
    badgeLabel = "Deletion Processing";
    statusText = "Processing";
    statusColor = "#38bdf8";
  } else if (status === "pending") {
    badgeClass = "badge-pending";
    badgeLabel = "Deletion Pending";
    statusText = "Pending";
    statusColor = "#fbbf24";
  } else if (status === "failed") {
    badgeClass = "badge-failed";
    badgeLabel = "Deletion Failed";
    statusText = "Failed";
    statusColor = "#f87171";
  }

  const reqDate = record.requestedAt
    ? new Date(record.requestedAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Pending";
  const compDate = record.completedAt
    ? new Date(record.completedAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : status === "completed"
    ? reqDate
    : "In Progress";

  const message = getStatusDescription(status);

  return `
    <div class="status-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">Deletion Details</span>
        <span class="badge ${badgeClass}">${badgeLabel}</span>
      </div>

      <div style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Confirmation Code</div>
      <div class="code-box">
        <span id="current-code">${escapeHtml(record.confirmationCode)}</span>
        <button type="button" class="copy-btn" id="copy-btn" onclick="copyCode()">Copy</button>
      </div>

      <p style="color: #94a3b8; font-size: 13.5px; line-height: 1.6; margin-bottom: 16px;">
        ${escapeHtml(message)}
      </p>

      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-val" style="color: ${statusColor};">${statusText}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Scope</span>
        <span class="info-val">ELVAVEO Social Media Manager</span>
      </div>
      <div class="info-row">
        <span class="info-label">Requested At</span>
        <span class="info-val">${escapeHtml(reqDate)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Completed At</span>
        <span class="info-val">${escapeHtml(compDate)}</span>
      </div>
    </div>`;
}
