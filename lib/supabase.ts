import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "") || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

// Singleton client instance for server-side operations
let supabaseServerClient: SupabaseClient | null = null;
let supabasePublicClient: SupabaseClient | null = null;

const LEGACY_ADMIN_EMAILS = [
  "admin@elvaveo.com",
  "elvatechnologies01@gmail.com",
  "syedhussainali@elvaveo.com",
  "founder@elvaveo.ai",
];

export function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return null;
  }
  if (!supabaseServerClient) {
    supabaseServerClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseServerClient;
}

export function isSupabaseServerConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

export function getSupabasePublicClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  if (!supabasePublicClient) {
    supabasePublicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabasePublicClient;
}

function isAuthorizedAdminEmail(email: string): boolean {
  const configuredEmails = [
    process.env.ADMIN_EMAIL,
    ...(process.env.ADMIN_ALLOWED_EMAILS || "").split(","),
    ...LEGACY_ADMIN_EMAILS,
  ]
    .map((value) => value?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value));

  return configuredEmails.includes(email);
}

export interface AdminVerifyResult {
  success: boolean;
  source: "supabase_auth" | "supabase_db";
  email: string;
  role: "admin" | "superadmin" | "none";
  error?: string;
}

/**
 * Strict Real-Time Verification of Administrator Credentials against Supabase & Server Guard.
 * Ensures that NEITHER a wrong ID NOR a wrong password can ever log in.
 */
export async function verifyAdminWithSupabase(
  enteredEmail: string,
  enteredPasscode: string,
  clientIp: string = "unknown"
): Promise<AdminVerifyResult> {
  const email = enteredEmail.trim().toLowerCase();
  const passcode = enteredPasscode.trim();

  // Basic sanity validation
  if (!email || !email.includes("@")) {
    return {
      success: false,
      source: "supabase_auth",
      email: email || "unknown",
      role: "none",
      error: "Please enter a valid administrator email address.",
    };
  }

  if (!passcode) {
    return {
      success: false,
      source: "supabase_auth",
      email,
      role: "none",
      error: "Please enter your administrator password.",
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      source: "supabase_auth",
      email,
      role: "none",
      error: "Supabase administrator authentication is not configured.",
    };
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: passcode,
    });

    if (!authError && authData.user) {
      const metadataRole = authData.user.app_metadata?.role;
      const role =
        metadataRole === "superadmin"
          ? "superadmin"
          : metadataRole === "admin" || isAuthorizedAdminEmail(email)
            ? "admin"
            : null;

      if (role) {
        await logSecurityEvent("admin_login_success", email, clientIp, {
          source: "supabase_auth",
        });

        return {
          success: true,
          source: "supabase_auth",
          email: authData.user.email || email,
          role,
        };
      }
    }
  } catch (error) {
    console.error("[supabase] Administrator Auth verification failed:", error);
  }

  const { data: credRow, error: credError } = await supabase
    .from("admin_credentials")
    .select("id,email,role,passcode_hash,passcode_salt,failed_login_attempts,locked_until,is_active")
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle();

  if (credError) {
    console.error("[supabase] Administrator credential lookup failed:", credError);
  }

  if (!credError && credRow) {
    if (credRow.locked_until && new Date(credRow.locked_until).getTime() > Date.now()) {
      return {
        success: false,
        source: "supabase_db",
        email,
        role: "none",
        error: "Security lockout active due to multiple failed attempts. Try again later.",
      };
    }

    let isMatch = false;
    if (credRow.passcode_salt && credRow.passcode_hash) {
      const computedHash = crypto
        .pbkdf2Sync(passcode, credRow.passcode_salt, 10000, 64, "sha512")
        .toString("hex");
      const actual = Buffer.from(computedHash);
      const expected = Buffer.from(credRow.passcode_hash);
      isMatch = actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
    } else {
      const { data, error } = await supabase.rpc("verify_admin_passcode", {
        p_email: email,
        p_passcode: passcode,
      });
      if (error) {
        console.error("[supabase] Bcrypt administrator verification failed:", error);
      } else {
        isMatch = data === true;
      }
    }

    if (isMatch) {
      const role = credRow.role === "superadmin" ? "superadmin" : credRow.role === "admin" ? "admin" : null;
      if (!role) {
        return {
          success: false,
          source: "supabase_db",
          email,
          role: "none",
          error: "This account is not authorized for administrator access.",
        };
      }

      if (credRow.passcode_salt) {
        await supabase
          .from("admin_credentials")
          .update({
            failed_login_attempts: 0,
            last_login_at: new Date().toISOString(),
          })
          .eq("id", credRow.id);
      }

      await logSecurityEvent("admin_login_success", email, clientIp, {
        source: "supabase_db",
      });

      return { success: true, source: "supabase_db", email, role };
    }

    if (credRow.passcode_salt) {
      const attempts = (credRow.failed_login_attempts || 0) + 1;
      await supabase
        .from("admin_credentials")
        .update({
          failed_login_attempts: attempts,
          ...(attempts >= 5
            ? { locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString() }
            : {}),
        })
        .eq("id", credRow.id);
    }
  }

  await logSecurityEvent("admin_login_failure", email, clientIp);
  return {
    success: false,
    source: "supabase_auth",
    email,
    role: "none",
    error: "Administrator credentials were not accepted.",
  };
}

/**
 * Log security event to Supabase `security_audit_logs` (if connected) and console
 */
export async function logSecurityEvent(
  action: string,
  actor: string,
  ip: string,
  details: Record<string, any> = {}
): Promise<void> {
  const supabase = getSupabaseClient();
  const timestamp = new Date().toISOString();

  if (supabase) {
    try {
      await supabase.from("security_audit_logs").insert([
        {
          action,
          actor_email: actor,
          ip_address: ip,
          details,
          timestamp,
        },
      ]);
    } catch (err) {
      console.error("[supabase] Failed to write security audit log:", err);
    }
  }

  if (process.env.NODE_ENV !== "production" || action.includes("failure")) {
    console.log(`[security_audit] ${timestamp} | ${action} | ${actor} | ${ip}`);
  }
}
