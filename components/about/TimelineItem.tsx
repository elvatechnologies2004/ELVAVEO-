interface TimelineItemProps {
  /** Stage label — e.g. "Foundation". Deliberately not a year. */
  label: string;
  title: string;
  description: string;
}

/**
 * One node on the Our Journey timeline.
 *
 * Layout flips with the same breakpoint the track uses: a left rail with a
 * marker on mobile, a top rail with the marker above the card on `lg` and up.
 */
export default function TimelineItem({ label, title, description }: TimelineItemProps) {
  return (
    <article className="relative pl-8 xl:pl-0 xl:pt-9">
      <span
        className="absolute left-[3px] top-[6px] z-10 h-[15px] w-[15px] rounded-full border-[3px] border-white bg-blue shadow-[0_0_0_4px_rgba(53,109,255,0.14),0_0_18px_rgba(53,109,255,0.6)] xl:left-5 xl:top-0"
        aria-hidden="true"
      />

      <div className="glass flex h-full flex-col rounded-[18px] p-4 shadow-card transition duration-300 hover:bg-white/90">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue">
          {label}
        </p>
        <h3 className="mt-1.5 text-[15px] font-bold leading-snug text-navy">{title}</h3>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{description}</p>
      </div>
    </article>
  );
}
