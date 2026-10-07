import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getTeamMembers, saveTeamMembers } from "@/lib/dataStore";
import type { TeamMember } from "@/data/team";

export async function GET() {
  const team = await getTeamMembers();
  return NextResponse.json({ success: true, team }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Supports passing entire array or single member
    let updatedTeam: TeamMember[];

    if (Array.isArray(body)) {
      updatedTeam = body;
    } else if (body.members && Array.isArray(body.members)) {
      updatedTeam = body.members;
    } else if (body.name && body.role) {
      const current = await getTeamMembers();
      updatedTeam = [...current, body];
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

    // Revalidate paths so website immediately shows the changes
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
