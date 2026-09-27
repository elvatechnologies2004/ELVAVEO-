import Link from "next/link";
import GradientButton from "@/components/GradientButton";
import { APP_ROUTES, SITE_NAME } from "@/lib/constants";

export const metadata = {
  // Bare title: the root layout's "%s | ELVAVEO" template adds the suffix.
  title: "Page not found",
  robots: { index: false, follow: false },
};

/**
 * Branded 404. Uses the same glass card, gradient text, and typography as the
 * rest of the site, and links to every real page so a lost visitor is never
 * stranded on a dead end.
 */
export default function NotFound() {
  return (
    <main
      id="main"
      className="flex min-h-screen flex-col items-center justify-center bg-ice px-5 py-28 sm:px-8"
    >
      <div className="glass w-full max-w-[680px] rounded-[24px] p-7 text-center shadow-card-lg sm:rounded-[26px] sm:p-10">
        <p className="eyebrow justify-center">Error 404</p>

        <h1 className="mt-5 text-balance text-[44px] font-extrabold leading-[1.05] tracking-tight text-navy sm:text-[64px]">
          This page took a
          <span className="block text-gradient">wrong turn</span>
        </h1>

        <p className="mx-auto mt-5 max-w-[460px] text-[17px] leading-relaxed text-muted">
          The page you are looking for does not exist or has been moved. Here is
          everything {SITE_NAME} has.
        </p>

        <nav
          aria-label="Site pages"
          className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
        >
          {APP_ROUTES.map((route) => (
            <Link
              key={route.path}
              href={route.path}
              className="rounded-full border border-line bg-white/70 px-4 py-2 text-[13px] font-semibold text-navy transition-colors hover:border-blue/40 hover:text-blue"
            >
              {route.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 flex justify-center">
          <GradientButton href="/" size="lg" showArrow>
            Back to Home
          </GradientButton>
        </div>
      </div>
    </main>
  );
}
