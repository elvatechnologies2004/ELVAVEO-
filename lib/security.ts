import crypto from "crypto";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "elvaveo_admin_token";

function getRequiredSecret(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length >= 32 ? value : null;
}

export function isAdminSessionSecretConfigured(): boolean {
  return getRequiredSecret("ADMIN_SESSION_SECRET") !== null;
}

/**
 * Validate request origin for state-changing requests to defend against CSRF attacks
 */
export function validateRequestOrigin(request: Request): boolean {
  const method = request.method.toUpperCase();
  // Safe HTTP methods do not change state
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host") || request.headers.get("x-forwarded-host");

  const parseHost = (raw: string | null): string => {
    if (!raw) return "";
    try {
      const url = raw.includes("://") ? new URL(raw) : new URL(`http://${raw}`);
      return url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    } catch {
      return raw.split(":")[0].replace(/^\[|\]$/g, "").toLowerCase();
    }
  };

  const isLocal = (h: string) =>
    h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "";

  if (!origin) {
    const referer = request.headers.get("referer");
    if (!referer) return true; // Non-browser API caller or direct curl
    try {
      const refHost = parseHost(referer);
      const serverHost = parseHost(host);
      if (serverHost && refHost) {
        if (serverHost === refHost || (isLocal(serverHost) && isLocal(refHost))) {
          return true;
        }
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  try {
    const originHost = parseHost(origin);
    const serverHost = parseHost(host);

    if (serverHost && originHost) {
      if (serverHost === originHost) return true;
      if (isLocal(serverHost) && isLocal(originHost)) return true;
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically signed session token: payload.hmacSignature
 */
export function createSignedSessionToken(userEmail: string, role: "admin" | "superadmin" = "admin"): string {
  const serverSecret = getRequiredSecret("ADMIN_SESSION_SECRET");
  if (!serverSecret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured. Authentication is unavailable.");
  }

  const payload = {
    role,
    user: userEmail,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", serverSecret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${signature}`;
}

/**
 * Verify a signed session token. Returns null if invalid or expired.
 */
export function verifySessionToken(token: string | undefined): { role: string; user: string } | null {
  const serverSecret = getRequiredSecret("ADMIN_SESSION_SECRET");
  if (!serverSecret) return null;
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSignature = crypto.createHmac("sha256", serverSecret).update(payloadB64).digest("base64url");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp <= now) {
      return null;
    }
    if (payload.role !== "admin" && payload.role !== "superadmin") {
      return null;
    }
    if (typeof payload.user !== "string" || !payload.user.includes("@")) {
      return null;
    }
    return { role: payload.role, user: payload.user };
  } catch {
    return null;
  }
}

/**
 * Verify administrator authentication from request cookies or Authorization header
 * Also enforces CSRF origin validation on state-changing requests.
 */
export async function requireAdminAuth(request: Request): Promise<
  { authenticated: true; user: string } | { authenticated: false; errorResponse: NextResponse }
> {
  if (!isAdminSessionSecretConfigured()) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "Authentication is not configured. Set ADMIN_SESSION_SECRET in the environment.",
          code: "AUTH_SECRET_MISSING",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      ),
    };
  }

  // CSRF Origin Check
  if (!validateRequestOrigin(request)) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "Forbidden: Cross-site request rejected (CSRF Protection)",
          code: "CSRF_ORIGIN_MISMATCH",
        },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      ),
    };
  }

  let token: string | undefined;

  // 1. Check HTTP-only cookie
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [k, ...v] = c.split("=");
        try {
          return [k, decodeURIComponent(v.join("="))];
        } catch {
          return [k, v.join("=")];
        }
      })
    );
    token = cookies[ADMIN_COOKIE_NAME];
  }

  // 2. Check Authorization Bearer header
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  const session = verifySessionToken(token);
  if (!session) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Valid administrator session required",
          code: "UNAUTHORIZED",
        },
        {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Bearer error="invalid_token"',
            "Cache-Control": "no-store",
          },
        }
      ),
    };
  }

  return { authenticated: true, user: session.user };
}

/**
 * URL sanitizer to prevent javascript: or malformed injection attacks.
 * Allows valid https?, relative paths, and safe base64 image data URLs.
 */
export function sanitizeSafeUrl(rawUrl: string, fallback: string = "#"): string {
  if (!rawUrl || typeof rawUrl !== "string") return fallback;
  const trimmed = rawUrl.trim();
  if (
    /^https?:\/\//i.test(trimmed) ||
    /^\/[a-zA-Z0-9_\-./]*$/i.test(trimmed) ||
    /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)
  ) {
    return trimmed;
  }
  return fallback;
}
