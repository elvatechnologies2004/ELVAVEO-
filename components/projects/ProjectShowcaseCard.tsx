import Image from "next/image";
import { ArrowRight, Layers, Sparkles } from "lucide-react";
import type { ShowcaseProject } from "@/data/projectShowcase";
import FinloDashboardScreenshot from "@/components/products/FinloDashboardScreenshot";
import FinloNexaOverview from "@/components/products/FinloNexaOverview";
import CamviaDashboardScreenshot from "@/components/products/CamviaDashboardScreenshot";

interface ProjectShowcaseCardProps {
  project: ShowcaseProject;
}

/**
 * Project card — dashboard preview, category badge, title, short description
 * and CTA inside a frosted glass shell.
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

          {/* Official brand logo */}
          <span className="relative h-7 w-[86px] shrink-0 flex items-center justify-end">
            {project.logo ? (
              <img
                src={project.logo}
                alt={`${project.title} logo`}
                className="h-full w-auto max-w-[86px] object-contain object-right"
              />
            ) : (
              <span className="text-xs font-bold text-navy">{project.title}</span>
            )}
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
            {project.cta || "View Project"}
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
 * Preview art — each product renders its real dashboard component.
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

    case "camvia":
      return (
        <div className={wrapper}>
          <CamviaDashboardScreenshot />
        </div>
      );

    default:
      return (
        <div className="flex h-full w-full flex-col justify-between rounded-[12px] border border-white/80 bg-white/70 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue">
              <Sparkles size={11} />
              Live SaaS Solution
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
              Active
            </span>
          </div>

          <div className="my-auto flex flex-col items-center justify-center text-center">
            {project.logo ? (
              <img
                src={project.logo}
                alt={project.title}
                className="h-10 max-w-[140px] object-contain mb-2"
              />
            ) : (
              <Layers size={32} className="text-blue mb-2" />
            )}
            <p className="text-[14px] font-bold text-navy">{project.title}</p>
            <p className="text-[11px] text-muted">{project.category}</p>
          </div>

          <div className="flex items-center justify-between border-t border-line/60 pt-2 text-[10px] text-muted">
            <span>Production Release</span>
            <span className="font-mono text-blue">{project.href.replace(/^https?:\/\//, "")}</span>
          </div>
        </div>
      );
  }
}
