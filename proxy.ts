import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 Edge Proxy (formerly Middleware)
 * Runs code on the server before requests complete to reject suspicious path traversal,
 * null-byte injection, and disallowed HTTP verbs at the outer edge.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Detect and reject path traversal or null-byte probing
  if (
    pathname.includes("..") ||
    pathname.includes("%2e%2e") ||
    pathname.includes("%2E%2E") ||
    pathname.includes("%00") ||
    pathname.includes("\0")
  ) {
    return new NextResponse("Bad Request: Malformed Path", { status: 400 });
  }

  // 2. Reject dangerous HTTP methods not supported by application
  const method = request.method.toUpperCase();
  const allowedMethods = ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"];
  if (!allowedMethods.includes(method)) {
    return new NextResponse("Method Not Allowed", { status: 405 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (.png, .jpg, .svg, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
