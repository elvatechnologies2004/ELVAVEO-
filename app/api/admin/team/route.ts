import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getTeamMembers, saveTeamMembers } from "@/lib/dataStore";
import { requireAdminAuth, sanitizeSafeUrl } from "@/lib/security";
import type { TeamMember } from "@/data/team";
import { z } from "zod";

const TeamMemberSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  role: z.string().trim().min(1, "Role is required").max(100),
  description: z.string().trim().max(1000).default(""),
  initials: z.string().trim().max(10).optional(),
  image: z.string().trim().max(500).optional(),
  linkedin: z.string().trim().max(500).optional(),
});

function sanitizeMember(m: z.infer<typeof TeamMemberSchema>): TeamMember {
  return {
    name: m.name,
    role: m.role,
    description: m.description,
    initials: m.initials,
    image: m.image ? sanitizeSafeUrl(m.image, "/brand/placeholder.png") : undefined,
    linkedin: m.linkedin ? sanitizeSafeUrl(m.linkedin, "https://www.linkedin.com/") : undefined,
  };
}

export async function GET() {
  const team = await getTeamMembers();
  return NextResponse.json(
    { success: true, team },
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
    const body = await request.json();
    let updatedTeam: TeamMember[];

    if (Array.isArray(body)) {
      const parsed = z.array(TeamMemberSchema).safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message || "Invalid team array" },
          { status: 400 }
        );
      }
      updatedTeam = parsed.data.map(sanitizeMember);
    } else if (body.members && Array.isArray(body.members)) {
      const parsed = z.array(TeamMemberSchema).safeParse(body.members);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message || "Invalid team members" },
          { status: 400 }
        );
      }
      updatedTeam = parsed.data.map(sanitizeMember);
    } else if (body.name && body.role) {
      const parsed = TeamMemberSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message || "Invalid team member" },
          { status: 400 }
        );
      }
      const current = await getTeamMembers();
      updatedTeam = [...current, sanitizeMember(parsed.data)];
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid team payload" },
        { status: 400 }
      );
    }

    const saved = await saveTeamMembers(updatedTeam);
    if (!saved) {
      return NextResponse.json(
        { success: false, error: "Failed to persist team data" },
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
  } catch (error) {
    console.error("Team API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
