import Image from "next/image";
import { Quote, Users } from "lucide-react";
import { LinkedInIcon } from "@/components/icons/SocialIcons";

type LeadershipCardProps =
  | {
      variant: "person";
      name: string;
      role: string;
      description: string;
      /** Fallback monogram, used when no portrait asset exists. */
      initials?: string;
      /** Optional portrait. Omit when no verified photo is available. */
      image?: string;
      /** Optional verified profile URL. */
      linkedin?: string;
    }
  | {
      variant: "team";
      title: string;
      quote: string;
    };

/**
 * Landscape Leadership & Team card.
 *
 * Renders in a horizontal landscape format with a visual monogram/portrait block
 * on the left and full member details, role, and bio on the right.
 */
export default function LeadershipCard(props: LeadershipCardProps) {
  if (props.variant === "team") {
    return (
      <article className="glass group relative flex h-full flex-col sm:flex-row items-start sm:items-stretch gap-5 sm:gap-6 rounded-[24px] p-6 sm:p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:bg-white/95 hover:shadow-card-lg border border-white/80">
        <div className="relative flex h-24 w-24 sm:h-auto sm:w-36 sm:min-h-[140px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-white/90 bg-gradient-to-br from-[#d9f4ff] via-[#e9edff] to-[#f1e8ff] shadow-sm">
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_115%,rgba(37,99,255,0.28),transparent_60%)]"
            aria-hidden="true"
          />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-white/60 text-blue shadow-[0_10px_28px_-12px_rgba(53,109,255,0.55)] backdrop-blur-xl">
            <Users size={26} strokeWidth={1.5} aria-hidden="true" />
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div>
            <p className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-blue">
              Our Team
            </p>
            <h3 className="mt-1 text-[18px] sm:text-[21px] font-bold leading-snug text-navy">
              {props.title}
            </h3>
            <blockquote className="mt-3 flex items-start gap-2.5 text-[13.5px] sm:text-[14px] leading-relaxed text-muted">
              <Quote size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-blue/60" aria-hidden="true" />
              <p>{props.quote}</p>
            </blockquote>
          </div>
        </div>
      </article>
    );
  }

  const { name, role, description, initials, image, linkedin } = props;
  const displayInitials =
    initials ||
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);

  return (
    <article className="glass group relative flex h-full flex-col sm:flex-row items-start sm:items-stretch gap-5 sm:gap-6 rounded-[24px] p-6 sm:p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:bg-white/95 hover:shadow-card-lg border border-white/80">
      {/* Left side: Landscape portrait / monogram block */}
      <div className="relative flex h-24 w-24 sm:h-auto sm:w-36 sm:min-h-[140px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-white/90 bg-gradient-to-br from-[#d9f4ff] via-[#e9edff] to-[#f1e8ff] shadow-sm">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(min-width: 640px) 144px, 96px"
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <div
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_115%,rgba(37,99,255,0.28),transparent_60%)]"
              aria-hidden="true"
            />
            <span className="relative text-[26px] sm:text-[32px] font-extrabold tracking-tight text-gradient">
              {displayInitials}
            </span>
          </>
        )}
      </div>

      {/* Right side: Member Information & Bio */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-blue">
              {role}
            </p>

            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label={`${name} on LinkedIn`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue/15 bg-white/70 text-blue shadow-xs transition-colors hover:bg-blue hover:text-white"
              >
                <LinkedInIcon className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <h3 className="mt-1 text-[18px] sm:text-[21px] font-bold leading-snug text-navy">
            {name}
          </h3>

          <p className="mt-2.5 text-[13.5px] sm:text-[14px] leading-relaxed text-muted">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}
