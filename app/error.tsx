"use client";

import { useEffect } from "react";
import GradientButton from "@/components/GradientButton";
import { SITE_NAME } from "@/lib/constants";

/**
 * Route-level error boundary.
 *
 * Visitors see a branded message only. The real error is logged to the server
 * console and never rendered into the page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side diagnostic only. Not shown to the visitor.
    console.error("[elvaveo] route error:", error);
  }, [error]);

  return (
    <main
      id="main"
      className="flex min-h-screen flex-col items-center justify-center bg-ice px-5 py-28 sm:px-8"
    >
      <div className="glass w-full max-w-[620px] rounded-[24px] p-7 text-center shadow-card-lg sm:rounded-[26px] sm:p-10">
        <p className="eyebrow justify-center">Something went wrong</p>

        <h1 className="mt-5 text-balance text-[34px] font-extrabold leading-[1.08] tracking-tight text-navy sm:text-[46px]">
          We hit a snag loading this page
        </h1>

        <p className="mx-auto mt-5 max-w-[440px] text-[17px] leading-relaxed text-muted">
          This is on our side, not yours. Try again, and if it keeps happening,
          just email us and we will sort it out.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <GradientButton onClick={reset} size="lg" showArrow>
            Try Again
          </GradientButton>
          <GradientButton href="/contact" variant="outline" size="lg">
            Contact {SITE_NAME}
          </GradientButton>
        </div>
      </div>
    </main>
  );
}
