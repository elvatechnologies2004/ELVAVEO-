import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { ShowcaseProject } from "@/data/projectShowcase";
import FinloDashboardScreenshot from "@/components/products/FinloDashboardScreenshot";
import FinloNexaOverview from "@/components/products/FinloNexaOverview";

interface ProjectShowcaseCardProps {
  project: ShowcaseProject;
}

/**
 * Project card — dashboard preview, category badge, title, short description
 * and CTA inside a frosted glass shell.
 *
 * Every entry here is a real, live ELVAVEO product, so each renders its own
 * dashboard preview and its official logo exactly as supplied.
 */
export default function ProjectShowcaseCard({ project }: ProjectShowcaseCardProps) {
  const categoryText = project.categoryLabel ?? project.category;

  return (
    <article className="glass group flex h-full flex-col overflow-hidden rounded-[22px] shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-lg">
      {/* Visual preview */}
      <div className="relative h-[240px] shrink-0 overflow-hidden border-b border-line bg-gradient-to-br from-[#e9f2ff] via-[#f3f1ff] to-[#e4faff] p-3 sm:h-[270px] sm:p-4">
        <ProjectPreview project={project} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#e9f2ff] to-transparent" aria-hidden="true" />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-blue/15 bg-blue/5 px-2.5 py-1 text-[10.5px] font-bold text-blue">
            {categoryText}
          </span>

          {/* Official brand logo, used exactly as supplied */}
          <span className="relative h-7 w-[86px] shrink-0">
            <Image
              src={project.logo}
              alt={`${project.title} logo`}
              fill
              sizes="86px"
              className="object-contain object-right"
            />
          </span>
        </div>

        <h3 className="mt-3.5 text-[19px] font-extrabold leading-snug text-navy">
          {project.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-muted">
          {project.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <a
            href={project.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-blue transition-colors hover:text-violet"
          >
            {project.cta}
            <ArrowRight
              size={14}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </a>
          {project.isProduct && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              ELVAVEO Product
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Preview art — each product renders its own real dashboard component.
 * No generated or illustrative artwork is used on this page.
 */
function ProjectPreview({ project }: { project: ShowcaseProject }) {
  const wrapper = "h-full w-full overflow-hidden rounded-[12px] [&>div]:h-full";

  switch (project.id) {
    case "finlo":
      return (
        <div className={wrapper}>
          <FinloDashboardScreenshot />
        </div>
      );

    case "finlonexa-crm":
      return (
        <div className={wrapper}>
          <FinloNexaOverview />
        </div>
      );

    default:
      return null;
  }
}
