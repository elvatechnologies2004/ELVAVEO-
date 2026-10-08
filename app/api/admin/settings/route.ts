import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSiteSettings, saveSiteSettings, type SiteSettings } from "@/lib/dataStore";
import { requireAdminAuth, sanitizeSafeUrl } from "@/lib/security";
import { z } from "zod";

const SettingsSchema = z.object({
  siteName: z.string().trim().min(1).max(100).optional(),
  siteUrl: z.string().trim().max(300).optional(),
  contactEmail: z.string().trim().email("Invalid contact email format").max(254).optional(),
  tagline: z.string().trim().max(300).optional(),
});

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json(
    { success: true, settings },
    {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    }
  );
}

export async function POST(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.authenticated) return auth.errorResponse;

  try {
    const raw = await request.json();
    const parsed = SettingsSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid settings input" },
        { status: 400 }
      );
    }

    const current = await getSiteSettings();
    const body = parsed.data;

    const updated: SiteSettings = {
      siteName: body.siteName || current.siteName,
      siteUrl: body.siteUrl ? sanitizeSafeUrl(body.siteUrl, current.siteUrl) : current.siteUrl,
      contactEmail: body.contactEmail || current.contactEmail,
      tagline: body.tagline || current.tagline,
    };

    const saved = await saveSiteSettings(updated);
    if (!saved) {
      return NextResponse.json(
        { success: false, error: "Failed to persist settings" },
        { status: 500 }
      );
    }

    try {
      revalidatePath("/", "layout");
      revalidatePath("/admin");
    } catch {}

    return NextResponse.json(
      { success: true, message: "Settings saved successfully", settings: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Settings API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
