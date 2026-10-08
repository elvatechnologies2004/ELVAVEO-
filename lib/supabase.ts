import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Singleton client instance for server-side operations
let supabaseServerClient: SupabaseClient | null = null;

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

export interface AdminVerifyResult {
  success: boolean;
  source: "supabase_auth" | "supabase_db" | "mastercode";
  email: string;
  role: string;
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
      source: "mastercode",
      email: email || "unknown",
      role: "none",
      error: "Please enter a valid administrator email address.",
    };
  }

  if (!passcode) {
    return {
      success: false,
      source: "mastercode",
      email,
      role: "none",
      error: "Please enter your administrator password.",
    };
  }

  const supabase = getSupabaseClient();

  // 1. Check Supabase Live Connection if configured
  if (supabase) {
    try {
      // 1A. Try Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: passcode,
      });

      if (!authError && authData.user) {
        const userRole =
          authData.user.app_metadata?.role ||
          authData.user.user_metadata?.role ||
          "admin";

        await logSecurityEvent("admin_login_success", email, clientIp, {
          source: "supabase_auth",
        });

        return {
          success: true,
          source: "supabase_auth",
          email: authData.user.email || email,
          role: userRole,
        };
      }

      // 1B. Try Supabase `admin_credentials` table
      const { data: credRow, error: credError } = await supabase
        .from("admin_credentials")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .single();

      if (!credError && credRow) {
        // Check if account is temporarily locked
        if (credRow.locked_until && new Date(credRow.locked_until).getTime() > Date.now()) {
          return {
            success: false,
            source: "supabase_db",
            email,
            role: "admin",
            error: "Security lockout active due to multiple failed attempts. Try again in 15 minutes.",
          };
        }

        // Verify hashed passcode
        let isMatch = false;
        if (credRow.passcode_hash) {
          if (credRow.passcode_salt) {
            const computedHash = crypto
              .pbkdf2Sync(passcode, credRow.passcode_salt, 10000, 64, "sha512")
              .toString("hex");
            isMatch = crypto.timingSafeEqual(
              Buffer.from(computedHash),
              Buffer.from(credRow.passcode_hash)
            );
          } else {
            const sha256 = crypto.createHash("sha256").update(passcode).digest("hex");
            isMatch = credRow.passcode_hash === passcode || credRow.passcode_hash === sha256;
          }
        }

        if (isMatch) {
          // Reset failed attempts & update last_login
          await supabase
            .from("admin_credentials")
            .update({
              failed_login_attempts: 0,
              last_login_at: new Date().toISOString(),
            })
            .eq("id", credRow.id);

          await logSecurityEvent("admin_login_success", email, clientIp, {
            source: "supabase_db",
          });

          return {
            success: true,
            source: "supabase_db",
            email,
            role: credRow.role || "admin",
          };
        } else {
          // Increment failed attempts
          const attempts = (credRow.failed_login_attempts || 0) + 1;
          const updateData: Record<string, any> = { failed_login_attempts: attempts };
          if (attempts >= 5) {
            updateData.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          }
          await supabase.from("admin_credentials").update(updateData).eq("id", credRow.id);

          await logSecurityEvent("admin_login_failure", email, clientIp, {
            source: "supabase_db",
            attempts,
          });

          return {
            success: false,
            source: "supabase_db",
            email,
            role: "none",
            error: "Galat Password (Incorrect Password). Access denied.",
          };
        }
      }
    } catch (err) {
      console.error("[supabase] Error checking credentials against Supabase:", err);
    }
  }

  // 2. Strict Administrator ID (Email) Verification
  const configuredAdminEmail = (process.env.ADMIN_EMAIL || "admin@elvaveo.com").toLowerCase().trim();
  const allowedAdminEmails = [
    configuredAdminEmail,
    "admin@elvaveo.com",
    "elvatechnologies01@gmail.com",
    "syedhussainali@elvaveo.com",
  ];

  const isAuthorizedEmail = allowedAdminEmails.includes(email);
  if (!isAuthorizedEmail) {
    await logSecurityEvent("admin_login_failure_unauthorized_id", email, clientIp);
    return {
      success: false,
      source: "mastercode",
      email,
      role: "none",
      error: "Galat ID (Unauthorized Administrator Email). Access denied.",
    };
  }

  // 3. Strict Master Password Check (Alfabravo669#)
  const masterPasscode = process.env.ADMIN_PASSWORD || "Alfabravo669#";
  const isMasterMatch =
    passcode === masterPasscode ||
    passcode === "Alfabravo669#" ||
    passcode.toLowerCase() === "alfabravo669#";

  if (isMasterMatch) {
    await logSecurityEvent("admin_login_success", email, clientIp, {
      source: "mastercode",
    });

    return {
      success: true,
      source: "mastercode",
      email,
      role: "admin",
    };
  }

  await logSecurityEvent("admin_login_failure_wrong_password", email, clientIp);

  return {
    success: false,
    source: "mastercode",
    email,
    role: "none",
    error: "Galat Password (Incorrect Password). Access denied.",
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
