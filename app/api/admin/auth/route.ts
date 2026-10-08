import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createSignedSessionToken,
  requireAdminAuth,
} from "@/lib/security";
import { checkRateLimit, getClientIp, resetRateLimit } from "@/lib/rateLimit";
import { verifyAdminWithSupabase, logSecurityEvent } from "@/lib/supabase";
import { z } from "zod";

const AuthActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("login"),
    email: z.string().trim().email().optional(),
    passcode: z.string().min(1, "Passcode is required").max(100),
  }),
  z.object({
    action: z.literal("login_step1"),
    email: z.string().trim().email().optional(),
    passcode: z.string().min(1, "Passcode is required").max(100),
  }),
  z.object({
    action: z.literal("logout"),
  }),
]);

/**
 * GET: Check admin authentication status server-side
 */
export async function GET(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { authenticated: false },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  return NextResponse.json(
    { authenticated: true, user: auth.user },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}

/**
 * POST: Single-step direct authentication linked with Supabase & Mastercode
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Rate limit: 8 login attempts per 10 minutes per IP
  const rateLimitResult = checkRateLimit(`auth:${ip}`, 8, 600);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many login attempts. Please try again in ${rateLimitResult.resetSeconds} seconds.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimitResult.resetSeconds.toString(),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  const parsed = AuthActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid authentication request payload",
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Direct 1-Step Login (ID & Password Verified via Supabase & Mastercode Alfabravo669#)
  if (data.action === "login" || data.action === "login_step1") {
    const adminEmail = data.email || "admin@elvaveo.com";
    const verifyResult = await verifyAdminWithSupabase(adminEmail, data.passcode, ip);

    if (!verifyResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: verifyResult.error || "Galat ID ya Password. Access denied.",
        },
        { status: 401 }
      );
    }

    // Direct Login Successful — Issue Cryptographic Session Token & Cookie
    const userEmail = verifyResult.email || adminEmail;
    const sessionToken = createSignedSessionToken(userEmail);

    await logSecurityEvent("admin_login_success", userEmail, ip, {
      source: verifyResult.source,
      directLogin: true,
    });

    // Reset rate limit for this IP on successful authentication
    resetRateLimit(`auth:${ip}`);

    const response = NextResponse.json({
      success: true,
      authenticated: true,
      token: sessionToken,
      user: userEmail,
      message: "Authentication successful. Admin session active.",
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  }

  // LOGOUT
  if (data.action === "logout") {
    await logSecurityEvent("admin_logout", "admin@elvaveo.com", ip);

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  }

  return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
}

/**
 * DELETE: Direct session termination
 */
export async function DELETE(request: Request) {
  const ip = getClientIp(request);
  await logSecurityEvent("admin_logout_session_destroyed", "admin@elvaveo.com", ip);

  const response = NextResponse.json({
    success: true,
    message: "Admin session destroyed",
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
