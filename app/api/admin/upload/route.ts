import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requireAdminAuth } from "@/lib/security";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Maximum upload size: 5 MB
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Allowed extensions and corresponding mime types
const ALLOWED_MIME_EXT_MAP: Record<string, string[]> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "image/svg+xml": [".svg"],
};

/**
 * Validates magic numbers of binary image formats
 */
function validateImageMagicBytes(buffer: Buffer, mime: string): boolean {
  if (mime === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  if (mime === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mime === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }

  if (mime === "image/svg+xml") {
    // Validated separately in sanitizeAndValidateSvg
    return true;
  }

  return false;
}

/**
 * Deep inspection and sanitization of SVG content to prevent Stored XSS / XXE
 */
function sanitizeAndValidateSvg(content: string): boolean {
  // Disallow XML DOCTYPE external entity expansion (XXE)
  if (/<!ENTITY/i.test(content) || /<!DOCTYPE[^>]*\[/i.test(content)) {
    return false;
  }

  // Disallow scripts, embedded objects, and foreign DOM wrappers
  const dangerousTags = [
    /<script[\s>]/i,
    /<\/script>/i,
    /<foreignobject[\s>]/i,
    /<iframe[\s>]/i,
    /<embed[\s>]/i,
    /<object[\s>]/i,
    /<meta[\s>]/i,
  ];

  for (const tagPattern of dangerousTags) {
    if (tagPattern.test(content)) {
      return false;
    }
  }

  // Disallow event handler attributes: onclick, onload, onerror, onmouseover, etc.
  if (/\son[a-zA-Z]+\s*=/i.test(content)) {
    return false;
  }

  // Disallow javascript: or data: URIs in xlink:href or href
  if (/href\s*=\s*['"]\s*(?:javascript|data):/i.test(content)) {
    return false;
  }

  // Disallow CSS url(javascript:...) or expression(...)
  if (/expression\s*\(|url\s*\(\s*['"]?javascript:/i.test(content)) {
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  // 1. Strict Server Authentication
  const auth = await requireAdminAuth(request);
  if (!auth.authenticated) return auth.errorResponse;

  // 2. Sliding Window Rate Limiting (15 uploads per minute)
  const ip = getClientIp(request);
  const rateLimitResult = checkRateLimit(`upload:${ip}`, 15, 60);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: `Upload rate limit exceeded. Try again in ${rateLimitResult.resetSeconds}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": rateLimitResult.resetSeconds.toString() },
      }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided for upload" },
        { status: 400 }
      );
    }

    // 3. File Size Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the 5MB limit (received ${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
        },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: "Empty file cannot be uploaded" },
        { status: 400 }
      );
    }

    // 4. Validate MIME Type
    const mime = (file.type || "").toLowerCase().trim();
    const allowedExts = ALLOWED_MIME_EXT_MAP[mime];
    if (!allowedExts) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported file type. Only PNG, JPEG, WebP, and SVG images are allowed.",
        },
        { status: 400 }
      );
    }

    // 5. Validate file extension matches MIME type
    const originalExt = path.extname(file.name || "").toLowerCase();
    if (!allowedExts.includes(originalExt)) {
      return NextResponse.json(
        {
          success: false,
          error: `File extension (${originalExt || "none"}) does not match MIME type (${mime}).`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 6. Magic Bytes Verification
    if (!validateImageMagicBytes(buffer, mime)) {
      return NextResponse.json(
        {
          success: false,
          error: "File signature header mismatch. File appears corrupted or disguised.",
        },
        { status: 400 }
      );
    }

    // 7. SVG Deep Content Sanitization
    if (mime === "image/svg+xml") {
      const svgText = buffer.toString("utf-8");
      const isSafe = sanitizeAndValidateSvg(svgText);
      if (!isSafe) {
        return NextResponse.json(
          {
            success: false,
            error: "SVG contains disallowed active scripts or unsafe attributes.",
          },
          { status: 400 }
        );
      }
    }

    // 8. Safe Cryptographic File Naming (Prevents Path Traversal & Overwrite)
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    const safeExt = allowedExts[0];
    const randomHex = crypto.randomBytes(8).toString("hex");
    const safeFileName = `asset_${Date.now()}_${randomHex}${safeExt}`;
    const targetFilePath = path.join(UPLOADS_DIR, safeFileName);

    await fs.writeFile(targetFilePath, buffer);

    const publicUrl = `/uploads/${safeFileName}`;

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        fileName: safeFileName,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during upload" },
      { status: 500 }
    );
  }
}
