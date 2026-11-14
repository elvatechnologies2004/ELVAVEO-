import { NextResponse } from "next/server";
import {
  handleMetaDataDeletionGet,
  handleMetaDataDeletionPost,
} from "@/lib/metaDataDeletion";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/meta/data-deletion
 *
 * Official Meta User Data Deletion Callback endpoint.
 * Validates Meta's signed_request using HMAC-SHA256 and META_APP_SECRET,
 * records and executes deletion of user data for ELVAVEO Social Media Manager,
 * and responds with Meta's required JSON format containing url and confirmation_code.
 */
export async function POST(request: Request) {
  const result = await handleMetaDataDeletionPost(request);
  return NextResponse.json(result.body, {
    status: result.status,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * GET /api/meta/data-deletion
 *
 * User-facing deletion status verification endpoint.
 * Returns the status of the deletion request via HTML (in browser) or JSON (API).
 */
export async function GET(request: Request) {
  const result = await handleMetaDataDeletionGet(request);

  if (result.contentType.includes("text/html")) {
    return new Response(result.body as string, {
      status: result.status,
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(result.body, {
    status: result.status,
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "no-store",
    },
  });
}
