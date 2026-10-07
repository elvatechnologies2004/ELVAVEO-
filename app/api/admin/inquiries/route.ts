import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

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
    await fs.writeFile(INQUIRIES_PATH, JSON.stringify(inquiries, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing inquiries:", error);
    return false;
  }
}

export async function GET() {
  const inquiries = await readInquiries();
  return NextResponse.json({ success: true, inquiries }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const inquiries = await readInquiries();
    const newInquiry: InquiryItem = {
      id: `inq-${Date.now()}`,
      name: String(name).trim(),
      email: String(email).trim(),
      subject: String(subject || "General Inquiry").trim(),
      message: String(message).trim(),
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
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Missing id or status" },
        { status: 400 }
      );
    }

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
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id" },
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
