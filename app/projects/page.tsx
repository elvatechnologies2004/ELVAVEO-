import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import Image from "next/image";
import { ArrowDown } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GradientButton from "@/components/GradientButton";
import Reveal from "@/components/Reveal";
import ProjectShowcaseCard from "@/components/projects/ProjectShowcaseCard";
import FeaturedCaseStudy from "@/components/projects/FeaturedCaseStudy";
import {
  caseStudyMetrics,
  projectBenefits,
  projectCapabilities,
  showcaseProjects,
} from "@/data/projectShowcase";
import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = createPageMetadata({
  title: "Projects",
  description:
    "Explore the products ELVAVEO has built — Finlo personal finance and FinloNexa CRM, both live and open to use.",
  path: "/projects",
});

export default function ProjectsPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="overflow-hidden bg-ice">
        {/* ============ 1 — HERO ============ */}
        <section className="relative isolate overflow-hidden">
          {/* Scenic background */}
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <Image
              src="/images/hero-mountain-lake.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              quality={85}
              className="object-cover object-center"
            />
            {/* Icy fade keeps the transition into the next section smooth */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/55 to-ice" />
          </div>

          <div className="mx-auto flex w-full max-w-[1520px] flex-col justify-center px-5 pt-[clamp(101px,18.24vh,181px)] pb-[clamp(73px,11.4vh,141px)] sm:px-8 lg:min-h-[101vh] lg:px-12">
            <Reveal>
              <div className="w-full xl:w-[70%]">
                <p className="eyebrow text-[11px] sm:text-xs">
                  Real Businesses. Real Solutions. Real Impact.
                </p>

                <h1 className="mt-[clamp(22px,4vh,30px)] text-balance text-[38px] font-extrabold leading-[1.04] text-navy sm:text-[56px] xl:text-[60px] 2xl:text-[68px]">
                  Projects That Turn Ideas
                  <span className="block text-gradient">Into Real Impact</span>
                </h1>

                <p className="mt-5 max-w-[580px] text-[17px] leading-relaxed text-muted sm:text-lg">
                  Explore how ELVAVEO transforms ideas into digital products and
                  software solutions designed to solve real problems and create
                  measurable value.
                </p>

                <div className="mt-[clamp(24px,4.5vh,32px)] flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <GradientButton href="#contact" size="lg" showArrow className="w-full sm:w-auto">
                    Start Your Project
                  </GradientButton>
                  <GradientButton
                    href="#projects"
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <ArrowDown size={16} className="text-blue" aria-hidden="true" />
                    See Our Work
                  </GradientButton>
                </div>

                {/* Trust indicators */}
                <ul className="mt-[clamp(28px,5vh,36px)] flex flex-wrap items-center gap-x-3 gap-y-3">
                  {projectBenefits.map(({ icon: Icon, label }) => (
                    <li
                      key={label}
                      className="flex items-center gap-1.5 text-[13px] font-semibold text-navy/70"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue/20 bg-blue/10 text-blue">
                        <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        <div className="relative bg-[url('/images/background-02.png')] bg-cover bg-center">
          {/* ============ 2 + 3 — PROJECT GRID ============ */}
          <section
            id="projects"
            className="scroll-mt-24 mx-auto w-full max-w-[1520px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20"
          >
            <Reveal>
              <div className="max-w-[760px]">
                <p className="eyebrow text-[10.5px]">Our Work</p>
                <h2 className="mt-4 text-balance text-[30px] font-extrabold leading-tight text-navy sm:text-[36px]">
                  Real Products, Built and Shipped
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-[16px]">
                  These are live ELVAVEO products, not mockups. Open either one
                  to see it working.
                </p>
              </div>
            </Reveal>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {showcaseProjects.map((project, index) => (
                <Reveal key={project.id} delay={index * 0.08} className="h-full">
                  <ProjectShowcaseCard project={project} />
                </Reveal>
              ))}
            </div>
          </section>

          {/* ============ 4 — FEATURED CASE STUDY ============ */}
          <FeaturedCaseStudy />

          {/* ============ 5 — CASE STUDY QUALITATIVE METRICS ============ */}
          <section className="mx-auto w-full max-w-[1520px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <Reveal>
              <div className="max-w-[760px]">
                <p className="eyebrow text-[10.5px]">How Finlo Was Built</p>
                <h2 className="mt-4 text-balance text-[28px] font-extrabold leading-tight text-navy sm:text-[34px]">
                  Quality That Shows in the Details
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-[16px]">
                  We publish what we can stand behind. These are the qualities we
                  hold every product to &mdash; no invented numbers.
                </p>
              </div>
            </Reveal>

            <div className="mt-8 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
              {caseStudyMetrics.map(({ icon: Icon, title, description }, index) => (
                <Reveal key={title} delay={index * 0.06} className="h-full">
                  <article className="glass flex h-full min-h-[168px] flex-col rounded-[20px] p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:bg-white/90 sm:p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/80 bg-gradient-to-br from-white to-blue/10 text-blue shadow-sm">
                      <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-[16px] font-bold leading-snug text-navy">
                      {title}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                      {description}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ============ 6 — REAL RESULTS / CAPABILITIES STRIP ============ */}
          <section className="border-y border-white/55 bg-white/20">
            <div className="mx-auto w-full max-w-[1520px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
              <div className="glass grid gap-8 rounded-[24px] p-6 shadow-card-lg sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-10 lg:p-10">
                <Reveal>
                  <div>
                    <p className="eyebrow text-[10.5px]">Real Results</p>
                    <h2 className="mt-4 text-balance text-[28px] font-extrabold leading-tight text-navy sm:text-[34px]">
                      Built for <span className="text-gradient">Real Impact</span>
                    </h2>
                    <p className="mt-4 max-w-[460px] text-[15px] leading-relaxed text-muted sm:text-[16px]">
                      We focus on thoughtful products, practical technology, and
                      experiences that create meaningful value.
                    </p>
                  </div>
                </Reveal>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  {projectCapabilities.map(({ icon: Icon, title, description }, index) => (
                    <Reveal key={title} delay={0.06 * (index + 1)} className="h-full">
                      <article className="flex h-full items-start gap-3.5 rounded-[18px] border border-white/80 bg-white/65 p-5 shadow-card backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/85">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-white/80 bg-gradient-to-br from-white to-blue/10 text-blue shadow-sm">
                          <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                        </span>
                        <span>
                          <span className="block text-[14.5px] font-bold leading-snug text-navy">
                            {title}
                          </span>
                          <span className="mt-1 block text-[12.5px] leading-relaxed text-muted">
                            {description}
                          </span>
                        </span>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ============ 7 — FINAL CTA ============ */}
          <section id="contact" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <Reveal>
              <div className="relative isolate mx-auto max-w-[1280px] overflow-hidden rounded-[24px] border border-white/80 bg-white/65 px-6 py-14 text-center shadow-card-lg backdrop-blur-2xl sm:px-12 sm:py-16">
                <Image
                  src="/images/hero-mountain-lake.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="-z-20 object-cover object-center"
                />
                {/* Soft blue-violet overlay */}
                <div
                  className="absolute inset-0 -z-10 bg-gradient-to-br from-white/70 via-[#dcecff]/60 to-[#6e69ff]/35"
                  aria-hidden="true"
                />

                <div className="relative">
                  <p className="eyebrow justify-center text-[10.5px]">
                    Let&apos;s Build What&apos;s Next
                  </p>
                  <h2 className="mx-auto mt-4 max-w-[820px] text-balance text-[32px] font-extrabold leading-tight text-navy sm:text-[42px]">
                    Have a project in mind?
                  </h2>
                  <p className="mx-auto mt-4 max-w-[620px] text-[15px] leading-relaxed text-muted sm:text-[17px]">
                    Let&apos;s turn your idea into a meaningful digital product
                    and create something extraordinary together.
                  </p>

                  <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
                    <GradientButton
                      href={`mailto:${CONTACT_EMAIL}?subject=Start%20a%20Project`}
                      size="lg"
                      showArrow
                      className="w-full sm:w-auto"
                    >
                      Start Your Project
                    </GradientButton>
                    <GradientButton
                      href={`mailto:${CONTACT_EMAIL}`}
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      Contact Us
                    </GradientButton>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          <Footer />
        </div>
      </main>
    </>
  );
}
