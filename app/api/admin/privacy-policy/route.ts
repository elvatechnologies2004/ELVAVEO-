import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getPrivacyPolicyForAdmin,
  sanitizePrivacyPolicyContent,
  savePrivacyPolicyFallback,
  type PrivacyPolicyDocument,
} from "@/lib/dataStore";
import { getClientIp } from "@/lib/rateLimit";
import { requireAdminAuth } from "@/lib/security";
import { getSupabaseClient } from "@/lib/supabase";

const PrivacyPolicySchema = z.object({
  action: z.enum(["save", "publish", "restore"]),
  title: z.string().trim().max(200).default("Privacy Policy"),
  summary: z.string().trim().max(500).default("Updated privacy policy draft."),
  content: z.string().trim().max(20000).default(""),
  versionId: z.string().uuid().optional().nullable(),
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.authenticated) return auth.errorResponse;

  try {
    const policy = await getPrivacyPolicyForAdmin();
    return NextResponse.json(
      { success: true, policy },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Failed to load privacy policy from Supabase:", error);
    return NextResponse.json(
      { success: false, error: "Privacy policy storage is unavailable or not migrated." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.authenticated) return auth.errorResponse;

  const supabase = getSupabaseClient();

  try {
    const raw: unknown = await request.json();
    const parsed = PrivacyPolicySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid privacy policy input" },
        { status: 400 }
      );
    }

    const { action, title, summary, content, versionId } = parsed.data;
    const ipAddress = getClientIp(request);
    let versionIdToReturn: string | null = null;
    let savedPolicy: PrivacyPolicyDocument | null = null;

    if (supabase) {
      try {
        if (action === "restore") {
          if (!versionId) {
            return NextResponse.json(
              { success: false, error: "A version ID is required to restore a policy version." },
              { status: 400 }
            );
          }

          const { data, error } = await supabase.rpc("restore_privacy_policy_version", {
            p_version_id: versionId,
            p_actor: auth.user,
            p_ip_address: ipAddress,
          });
          if (!error && data) {
            versionIdToReturn = data;
          }
        } else {
          const sanitizedContent = sanitizePrivacyPolicyContent(content);
          if (sanitizedContent) {
            const { data: savedVersionId, error: saveError } = await supabase.rpc(
              "save_privacy_policy_draft",
              {
                p_title: title,
                p_summary: summary,
                p_content: sanitizedContent,
                p_actor: auth.user,
                p_ip_address: ipAddress,
                p_version_id: versionId ?? null,
              }
            );
            if (!saveError && savedVersionId) {
              versionIdToReturn = savedVersionId;
              if (action === "publish") {
                const { error: pubErr } = await supabase.rpc("publish_privacy_policy_version", {
                  p_version_id: savedVersionId,
                  p_actor: auth.user,
                  p_ip_address: ipAddress,
                });
                if (pubErr) {
                  console.warn("[privacy-policy] publish RPC error:", pubErr);
                }
              }
            }
          }
        }
      } catch (rpcErr) {
        console.warn("[privacy-policy] Supabase RPC not available, using storage fallback:", rpcErr);
      }
    }

    // Fallback: If Supabase RPC was not available or failed
    if (!versionIdToReturn) {
      const sanitizedContent = sanitizePrivacyPolicyContent(content) || content;
      const fallbackResult = await savePrivacyPolicyFallback({
        action,
        title,
        summary,
        content: sanitizedContent,
        actor: auth.user,
        versionId,
      });
      versionIdToReturn = fallbackResult.versionId;
      savedPolicy = fallbackResult.policy;
    } else {
      savedPolicy = await getPrivacyPolicyForAdmin();
    }

    if (action === "publish") {
      revalidatePath("/privacy-policy");
      revalidatePath("/");
    }

    return NextResponse.json(
      { success: true, versionId: versionIdToReturn, policy: savedPolicy },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Privacy policy update failed:", error);
    return NextResponse.json(
      { success: false, error: "Privacy policy update failed; could not save changes." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
