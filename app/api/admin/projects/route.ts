import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getProjects, saveProjects, type StoredProject } from "@/lib/dataStore";
import { requireAdminAuth, sanitizeSafeUrl } from "@/lib/security";
import { z } from "zod";

const ProjectItemSchema = z.object({
  id: z.string().trim().max(100).optional(),
  title: z.string().trim().min(1, "Title is required").max(150),
  category: z.string().trim().max(100).default("AI Development"),
  categoryLabel: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).default(""),
  logo: z.string().trim().max(500).default("/brand/camvia-logo.svg"),
  href: z.string().trim().max(500).default("https://elvaveo.com"),
  cta: z.string().trim().max(100).default("Explore Platform"),
  iconName: z.string().trim().max(100).optional(),
  isProduct: z.boolean().default(true),
});

function sanitizeProject(p: z.infer<typeof ProjectItemSchema>): StoredProject {
  return {
    id: p.id || `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: p.title,
    category: p.category,
    categoryLabel: p.categoryLabel,
    description: p.description,
    logo: sanitizeSafeUrl(p.logo, "/brand/camvia-logo.svg"),
    href: sanitizeSafeUrl(p.href, "https://elvaveo.com"),
    cta: p.cta,
    iconName: p.iconName,
    isProduct: p.isProduct,
  };
}

export async function GET() {
  const projects = await getProjects();
  return NextResponse.json(
    { success: true, projects },
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
    let updatedProjects: StoredProject[];

    if (Array.isArray(body)) {
      const parsed = z.array(ProjectItemSchema).safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message || "Invalid projects array" },
          { status: 400 }
        );
      }
      updatedProjects = parsed.data.map(sanitizeProject);
    } else if (body.projects && Array.isArray(body.projects)) {
      const parsed = z.array(ProjectItemSchema).safeParse(body.projects);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message || "Invalid projects list" },
          { status: 400 }
        );
      }
      updatedProjects = parsed.data.map(sanitizeProject);
    } else if (body.title) {
      const parsed = ProjectItemSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message || "Invalid project item" },
          { status: 400 }
        );
      }
      const current = await getProjects();
      updatedProjects = [...current, sanitizeProject(parsed.data)];
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
