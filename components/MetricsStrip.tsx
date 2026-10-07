import { Briefcase, ThumbsUp, Clock, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { stats } from "@/data/stats";
import Reveal from "./Reveal";

/** Glass icon chip shown above each stat. Keyed by the stat label. */
const statIcons: Record<string, LucideIcon> = {
  "Projects Delivered": Briefcase,
  "Happy Clients": Users,
  "Years of Experience": Clock,
  "Client Satisfaction": ThumbsUp,
};

/**
 * Metrics strip — single editable config object (data/stats.ts).
 * All values are demo placeholders from the design reference.
 * Compact variant (~40% shorter): paddings, gaps and type scaled down.
 */
export default function MetricsStrip() {
  return (
    <section className="scroll-mt-24">
      <div className="mx-auto w-full max-w-[1520px] px-5 py-2 sm:px-8 lg:px-12 lg:py-2.5">
        <Reveal>
          <div className="overflow-hidden rounded-[16px] border border-white/70 bg-gradient-to-b from-white/75 via-white/55 to-white/35 p-3.5 shadow-card backdrop-blur-xl sm:p-4 lg:py-2.5">
            {/* Content block — centered inside the tab */}
            <div className="flex flex-col gap-4 lg:mx-auto lg:w-full lg:max-w-[1424px] lg:grid lg:grid-cols-[repeat(5,minmax(0,1fr))] lg:gap-0">
            {/* Stats */}
            <ul className="grid grid-cols-2 gap-x-4 gap-y-3.5 sm:grid-cols-4 sm:gap-3 lg:col-span-4 lg:grid lg:h-full lg:grid-cols-4 lg:gap-0">
              {stats.items.map((item) => {
                const Icon = statIcons[item.label] ?? Briefcase;
                return (
                  <li key={item.label} className="flex flex-col lg:flex lg:h-full lg:flex-col lg:justify-center lg:px-6 xl:px-8">
                    <div className="flex items-center gap-[6.4px]">
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/70 bg-gradient-to-b from-white/80 to-white/40 text-blue shadow-[0_8px_20px_-10px_rgba(53,109,255,0.45)] backdrop-blur-xl"
                      >
                        <Icon size={16} strokeWidth={2.2} />
                      </span>
                      <p className="text-[22px] font-extrabold leading-none sm:text-[25px]">
                        <span className="text-blue">{item.value}</span>
                      </p>
                    </div>
                    <p className="mt-1 text-[11.5px] font-semibold text-navy/70 sm:mt-0.5 sm:pl-[38px] sm:text-[12px]">
                      {item.label}
                    </p>
                  </li>
                );
              })}
            </ul>

            {/* Quote — vertically centered with border on desktop, top border on mobile */}
            <div className="flex h-full flex-col items-center justify-center border-t border-line/60 pt-3 text-center sm:pt-3.5 lg:border-l lg:border-t-0 lg:pl-6 lg:pr-6 lg:pt-0">
              <blockquote className="text-balance text-[12px] font-bold leading-snug text-navy sm:text-[13px]">
                {stats.quote.lines.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </blockquote>
              <p className="mt-0.5 text-[10px] font-semibold leading-[1.4] text-muted">
                — {stats.quote.author}
              </p>
            </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}