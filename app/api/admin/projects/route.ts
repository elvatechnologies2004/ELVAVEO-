import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getProjects, saveProjects, type StoredProject } from "@/lib/dataStore";

export async function GET() {
  const projects = await getProjects();
  return NextResponse.json({ success: true, projects }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let updatedProjects: StoredProject[];

    if (Array.isArray(body)) {
      updatedProjects = body;
    } else if (body.projects && Array.isArray(body.projects)) {
      updatedProjects = body.projects;
    } else if (body.title) {
      const current = await getProjects();
      updatedProjects = [...current, body];
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid projects payload" },
        { status: 400 }
      );
    }

    const saved = await saveProjects(updatedProjects);
    if (!saved) {
      return NextResponse.json(
        { success: false, error: "Failed to persist projects data" },
        { status: 500 }
      );
    }

    try {
      revalidatePath("/projects");
      revalidatePath("/admin");
    } catch {}

    return NextResponse.json(
      { success: true, message: "Projects updated successfully", projects: updatedProjects },
      { status: 200 }
    );
  } catch (error) {
    console.error("Projects API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
