import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/security";
import { z } from "zod";
import {
  getInquiries,
  addInquiry,
  updateInquiryStatus,
  deleteInquiry,
  type InquiryItem,
} from "@/lib/dataStore";

export { type InquiryItem };

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CreateInquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Valid email is required").max(254),
  subject: z.string().trim().max(120).default("General Inquiry"),
  message: z.string().trim().min(1, "Message is required").max(5000),
  company: z.string().trim().max(120).optional(),
  source: z.string().trim().max(80).optional(),
});

const UpdateInquirySchema = z.object({
  id: z.string().trim().min(1, "Inquiry ID is required").max(100),
  status: z.enum(["new", "replied", "archived"]),
});

export async function GET(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.authenticated) return auth.errorResponse;

  const inquiries = await getInquiries(true);
  return NextResponse.json(
    { success: true, inquiries },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
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

    const { name, email, subject, message, company, source } = parsed.data;
    const newInquiry = await addInquiry({
      name,
      email,
      subject,
      message,
      company,
      source: source || "CRM Manual",
    });

    return NextResponse.json({ success: true, inquiry: newInquiry }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create inquiry" },
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
    const updated = await updateInquiryStatus(id, status);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, inquiry: updated }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update inquiry" },
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

    await deleteInquiry(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete inquiry" },
      { status: 500 }
    );
  }
}
