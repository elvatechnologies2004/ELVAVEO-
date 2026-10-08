/**
 * Production-hardened Sliding Window In-Memory Rate Limiter
 * Provides request rate limiting per IP / key to prevent brute-force and DoS.
 */

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory rate limiting store
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup interval every 5 minutes to avoid memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeExpiredRecords(now: number, maxWindowMs: number) {
  for (const [key, record] of rateLimitStore.entries()) {
    const valid = record.timestamps.filter((ts) => now - ts < maxWindowMs);
    if (valid.length === 0) {
      rateLimitStore.delete(key);
    } else {
      record.timestamps = valid;
    }
  }
}

/**
 * Manually reset rate limit for a key, or clear all records
 */
export function resetRateLimit(key?: string): void {
  if (key) {
    rateLimitStore.delete(key);
  } else {
    rateLimitStore.clear();
  }
}

/**
 * Extract client IP reliably from standard forwarding headers
 */
export function getClientIp(request: Request): string {
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
 * Sliding window rate limit check.
 * Localhost / development requests receive a high limit (100) to avoid locking out the developer.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): { success: boolean; limit: number; remaining: number; resetSeconds: number } {
  const isLocalhost =
    key.includes("127.0.0.1") ||
    key.includes("::1") ||
    key.includes("localhost") ||
    process.env.NODE_ENV !== "production";

  // In local development or for localhost, allow up to 100 attempts
  const effectiveLimit = isLocalhost ? Math.max(maxRequests, 100) : maxRequests;

  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Periodic garbage collection
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    purgeExpiredRecords(now, windowMs);
    lastCleanup = now;
  }

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps within current window
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

  // Append current request
  record.timestamps.push(now);
  const remaining = effectiveLimit - record.timestamps.length;

  return {
    success: true,
    limit: effectiveLimit,
    remaining,
    resetSeconds: windowSeconds,
  };
}
