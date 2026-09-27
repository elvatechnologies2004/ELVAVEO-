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
      initials: string;
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
 * Leadership card.
 *
 * `variant="person"` renders one real, named person — a portrait when a
 * verified asset is supplied, otherwise a typographic monogram. `image` is
 * rendered with `object-contain` at the asset's own aspect ratio so the
 * official ELVAVEO/brand assets are never cropped or distorted.
 *
 * `variant="team"` is the honest fallback for roles that are not yet filled:
 * it states the team is growing instead of inventing a person.
 */
export default function LeadershipCard(props: LeadershipCardProps) {
  if (props.variant === "team") {
    return (
      <article className="glass flex h-full flex-col rounded-[20px] p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:bg-white/90 sm:p-7">
        <div className="relative flex aspect-[2.1/1] items-center justify-center overflow-hidden rounded-[16px] border border-white/80 bg-gradient-to-br from-[#d9f4ff] via-[#e9edff] to-[#f1e8ff]">
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_115%,rgba(37,99,255,0.24),transparent_58%)]"
            aria-hidden="true"
          />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/80 bg-white/50 text-blue shadow-[0_14px_38px_-16px_rgba(53,109,255,0.55)] backdrop-blur-xl">
            <Users size={34} strokeWidth={1.35} aria-hidden="true" />
          </div>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-blue">
          Our Team
        </p>
        <h3 className="mt-1.5 text-[20px] font-bold leading-snug text-navy">
          {props.title}
        </h3>

        <blockquote className="mt-4 flex flex-1 items-start gap-2.5 border-t border-blue/10 pt-4 text-[14px] leading-relaxed text-muted">
          <Quote size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-blue/60" aria-hidden="true" />
          <p>{props.quote}</p>
        </blockquote>
      </article>
    );
  }

  const { name, role, description, initials, image, linkedin } = props;

  return (
    <article className="glass flex h-full flex-col rounded-[20px] p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:bg-white/90 sm:p-7">
      <div className="flex items-start gap-4">
        <div className="relative flex h-[74px] w-[74px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-white/80 bg-gradient-to-br from-[#d9f4ff] via-[#e9edff] to-[#f1e8ff] shadow-sm">
          {image ? (
            <Image
              src={image}
              alt={name}
              width={74}
              height={74}
              sizes="74px"
              className="h-full w-full object-contain"
            />
          ) : (
            <>
              <div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_115%,rgba(37,99,255,0.24),transparent_58%)]"
                aria-hidden="true"
              />
              <span className="relative text-[24px] font-extrabold tracking-tight text-gradient">
                {initials}
              </span>
            </>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue">
            {role}
          </p>
          <h3 className="mt-1.5 text-[20px] font-bold leading-snug text-navy">{name}</h3>
        </div>

        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label={`${name} on LinkedIn`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue/15 bg-white/65 text-blue transition-colors hover:bg-white"
          >
            <LinkedInIcon className="h-[17px] w-[17px]" />
          </a>
        )}
      </div>

      <p className="mt-5 border-t border-blue/10 pt-5 text-[14px] leading-relaxed text-muted">
        {description}
      </p>
    </article>
  );
}
