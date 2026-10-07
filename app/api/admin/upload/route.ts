import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Clean filename
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = path.extname(originalName) || ".png";
    const baseName = path.basename(originalName, ext);
    const fileName = `${baseName}-${Date.now()}${ext}`;

    const filePath = path.join(UPLOADS_DIR, fileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json(
      { success: true, url: publicUrl, fileName },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
