import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getTeamMembers, saveTeamMembers } from "@/lib/dataStore";
import { requireAdminAuth, sanitizeSafeUrl } from "@/lib/security";
import type { TeamMember } from "@/data/team";
import { z } from "zod";

const TeamMemberSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  role: z.string().trim().min(1, "Role is required").max(100),
  description: z.string().trim().max(3000).default("").nullable().optional(),
  initials: z.string().trim().max(20).nullable().optional(),
  image: z.string().trim().nullable().optional(),
  imagePosition: z.string().trim().max(100).nullable().optional(),
  imageScale: z.number().min(0.5).max(3).nullable().optional(),
  linkedin: z.string().trim().max(1000).nullable().optional(),
});

function sanitizeMember(m: z.infer<typeof TeamMemberSchema>): TeamMember {
  const cleanName = m.name.trim();
  const cleanRole = m.role.trim();
  const cleanDesc = (m.description || "").trim();

  // Compute initials if not provided
  const cleanInitials =
    (m.initials && m.initials.trim()) ||
    cleanName
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 3) ||
    "EL";

  // Normalize LinkedIn URL
  let cleanLinkedin = m.linkedin ? m.linkedin.trim() : undefined;
  if (cleanLinkedin && !cleanLinkedin.startsWith("http://") && !cleanLinkedin.startsWith("https://")) {
    cleanLinkedin = `https://${cleanLinkedin}`;
  }

  const cleanImage = m.image && m.image.trim() ? m.image.trim() : undefined;

  return {
    name: cleanName,
    role: cleanRole,
    description: cleanDesc,
    initials: cleanInitials,
    image: cleanImage ? sanitizeSafeUrl(cleanImage, "/brand/placeholder.png") : undefined,
    imagePosition: m.imagePosition?.trim() || undefined,
    imageScale: typeof m.imageScale === "number" ? m.imageScale : undefined,
    linkedin: cleanLinkedin ? sanitizeSafeUrl(cleanLinkedin, "https://www.linkedin.com/") : undefined,
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const team = await getTeamMembers();
  return NextResponse.json(
    { success: true, team },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
}

export async function POST(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.authenticated) return auth.errorResponse;

  try {
    const body = await request.json();
    let updatedTeam: TeamMember[];

    if (Array.isArray(body)) {
      const parsed = z.array(TeamMemberSchema).safeParse(body);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return NextResponse.json(
          {
            success: false,
            error: issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid team array format",
          },
          { status: 400 }
        );
      }
      updatedTeam = parsed.data.map(sanitizeMember);
    } else if (body.members && Array.isArray(body.members)) {
      const parsed = z.array(TeamMemberSchema).safeParse(body.members);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return NextResponse.json(
          {
            success: false,
            error: issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid team members format",
          },
          { status: 400 }
        );
      }
      updatedTeam = parsed.data.map(sanitizeMember);
    } else if (body.member && typeof body.member === "object") {
      const parsed = TeamMemberSchema.safeParse(body.member);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message || "Invalid member data" },
          { status: 400 }
        );
      }
      const current = await getTeamMembers();
      updatedTeam = [...current, sanitizeMember(parsed.data)];
    } else if (body.name && body.role) {
      const parsed = TeamMemberSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message || "Invalid member data" },
          { status: 400 }
        );
      }
      const current = await getTeamMembers();
      updatedTeam = [...current, sanitizeMember(parsed.data)];
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid payload. Provide an array of members or a single member." },
        { status: 400 }
      );
    }

    const saved = await saveTeamMembers(updatedTeam);
    if (!saved) {
      return NextResponse.json(
        { success: false, error: "Failed to persist team data to filesystem" },
        { status: 500 }
      );
    }

    try {
      revalidatePath("/about");
      revalidatePath("/admin");
      revalidatePath("/");
    } catch {}

    return NextResponse.json(
      { success: true, message: "Team updated successfully", team: updatedTeam },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Team API Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.authenticated) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const indexParam = searchParams.get("index");
    const nameParam = searchParams.get("name");

    const current = await getTeamMembers();
    let updatedTeam: TeamMember[];

    if (indexParam !== null) {
      const idx = parseInt(indexParam, 10);
      if (isNaN(idx) || idx < 0 || idx >= current.length) {
        return NextResponse.json(
          { success: false, error: "Invalid member index for deletion" },
          { status: 400 }
        );
      }
      const memberName = current[idx]?.name || "Member";
      updatedTeam = current.filter((_, i) => i !== idx);

      const saved = await saveTeamMembers(updatedTeam);
      if (!saved) {
        return NextResponse.json(
          { success: false, error: "Failed to delete team member from storage" },
          { status: 500 }
        );
      }

      try {
        revalidatePath("/about");
        revalidatePath("/admin");
        revalidatePath("/");
      } catch {}

      return NextResponse.json({
        success: true,
        message: `Removed ${memberName} successfully`,
        team: updatedTeam,
      });
    } else if (nameParam) {
      updatedTeam = current.filter((m) => m.name.toLowerCase() !== nameParam.toLowerCase());
      const saved = await saveTeamMembers(updatedTeam);
      if (!saved) {
        return NextResponse.json(
          { success: false, error: "Failed to delete team member from storage" },
          { status: 500 }
        );
      }

      try {
        revalidatePath("/about");
        revalidatePath("/admin");
        revalidatePath("/");
      } catch {}

      return NextResponse.json({
        success: true,
        message: `Removed ${nameParam} successfully`,
        team: updatedTeam,
      });
    }

    return NextResponse.json(
      { success: false, error: "Missing index or name parameter" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Team API DELETE Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
