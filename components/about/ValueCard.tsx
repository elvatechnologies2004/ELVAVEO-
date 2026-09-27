import type { LucideIcon } from "lucide-react";

interface ValueCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Compact glass card for the Core Values grid.
 *
 * `h-full` plus the flex column keeps all five cards the same height even when
 * the copy lengths differ.
 */
export default function ValueCard({ icon: Icon, title, description }: ValueCardProps) {
  return (
    <article className="glass group flex h-full flex-col rounded-[20px] p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:border-blue/30 hover:bg-white/90 sm:p-6">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/80 bg-gradient-to-br from-white to-blue/10 text-blue shadow-sm">
        <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-[16px] font-bold leading-snug text-navy">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">{description}</p>
    </article>
  );
}
