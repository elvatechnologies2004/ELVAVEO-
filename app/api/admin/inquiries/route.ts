import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { requireAdminAuth } from "@/lib/security";
import { z } from "zod";

export interface InquiryItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "replied" | "archived";
  createdAt: string;
}

const INQUIRIES_PATH = path.join(process.cwd(), "data", "inquiries.json");

async function readInquiries(): Promise<InquiryItem[]> {
  try {
    const raw = await fs.readFile(INQUIRIES_PATH, "utf-8");
    return JSON.parse(raw) as InquiryItem[];
  } catch (error) {
    console.error("Error reading inquiries:", error);
    return [];
  }
}

async function writeInquiries(inquiries: InquiryItem[]): Promise<boolean> {
  try {
    // Keep list bounded to prevent unbounded storage growth
    const bounded = inquiries.slice(0, 500);
    await fs.writeFile(INQUIRIES_PATH, JSON.stringify(bounded, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing inquiries:", error);
    return false;
  }
}

const CreateInquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Valid email is required").max(254),
  subject: z.string().trim().max(120).default("General Inquiry"),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

const UpdateInquirySchema = z.object({
  id: z.string().trim().min(1, "Inquiry ID is required").max(100),
  status: z.enum(["new", "replied", "archived"]),
});

export async function GET(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.authenticated) return auth.errorResponse;

  const inquiries = await readInquiries();
  return NextResponse.json(
    { success: true, inquiries },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}

export async function POST(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.authenticated) return auth.errorResponse;

  try {
    const raw = await request.json();
    const parsed = CreateInquirySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parsed.data;
    const inquiries = await readInquiries();

    const newInquiry: InquiryItem = {
      id: `inq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      email,
      subject,
      message,
      status: "new",
      createdAt: new Date().toISOString(),
    };

    inquiries.unshift(newInquiry);
    await writeInquiries(inquiries);

    return NextResponse.json({ success: true, inquiry: newInquiry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create inquiry" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.authenticated) return auth.errorResponse;

  try {
    const raw = await request.json();
    const parsed = UpdateInquirySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid update data" },
        { status: 400 }
      );
    }

    const { id, status } = parsed.data;
    const inquiries = await readInquiries();
    const index = inquiries.findIndex((i) => i.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found" },
        { status: 404 }
      );
    }

    inquiries[index].status = status;
    await writeInquiries(inquiries);

    return NextResponse.json({ success: true, inquiry: inquiries[index] }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update inquiry" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.authenticated) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid inquiry id" },
        { status: 400 }
      );
    }

    const inquiries = await readInquiries();
    const filtered = inquiries.filter((i) => i.id !== id);
    await writeInquiries(filtered);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete inquiry" },
      { status: 500 }
    );
  }
}
