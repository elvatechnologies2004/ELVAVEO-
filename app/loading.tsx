/**
 * Route-level loading state. Deliberately minimal: a soft shimmer that matches
 * the glass aesthetic, with no layout shift and reduced-motion support.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="flex min-h-screen items-center justify-center bg-ice px-5"
    >
      <div className="flex flex-col items-center gap-5">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-blue" />
        <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-muted">
          Loading
        </span>
      </div>
    </div>
  );
}
