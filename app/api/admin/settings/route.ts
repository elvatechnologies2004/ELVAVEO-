import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSiteSettings, saveSiteSettings, type SiteSettings } from "@/lib/dataStore";

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json({ success: true, settings }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SiteSettings>;
    const current = await getSiteSettings();

    const updated: SiteSettings = {
      siteName: body.siteName?.trim() || current.siteName,
      siteUrl: body.siteUrl?.trim() || current.siteUrl,
      contactEmail: body.contactEmail?.trim() || current.contactEmail,
      tagline: body.tagline?.trim() || current.tagline,
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
