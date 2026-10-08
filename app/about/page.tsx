import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  Compass,
  Globe,
  HeartHandshake,
  Lightbulb,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GradientButton from "@/components/GradientButton";
import Reveal from "@/components/Reveal";
import ValueCard from "@/components/about/ValueCard";
import TimelineItem from "@/components/about/TimelineItem";
import LeadershipCard from "@/components/about/LeadershipCard";
import TeamSlider from "@/components/about/TeamSlider";
import { getTeamMembers } from "@/lib/dataStore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description:
    "ELVAVEO is a software development and technology company turning ideas into powerful digital products and a brighter tomorrow.",
  path: "/about",
});

/* ------------------------------------------------------------------ *
 * Section content. Editable in one place per section.
 * ------------------------------------------------------------------ */

// 1 — Hero
const heroTrustPoints = [
  { icon: Lightbulb, label: "Innovation at the core" },
  { icon: ShieldCheck, label: "Built to be reliable" },
  { icon: HeartHandshake, label: "People first" },
];

// 2 — Why We Exist
const reasons: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Lightbulb,
    title: "Build Innovative Solutions",
    description: "Turn ideas into powerful digital products.",
  },
  {
    icon: Target,
    title: "Deliver Real Value",
    description:
      "Create practical solutions that help people and businesses move forward.",
  },
  {
    icon: HeartHandshake,
    title: "Empower People & Businesses",
    description: "Technology designed around real needs.",
  },
  {
    icon: Sparkles,
    title: "Create a Brighter Tomorrow",
    description: "Build a more connected, innovative, and inclusive future.",
  },
];

// 4 — Mission & Vision
const purposeCards: { icon: LucideIcon; eyebrow: string; title: string; body: string }[] = [
  {
    icon: Rocket,
    eyebrow: "Our Mission",
    title: "Empower Business Through Technology",
    body: "To build innovative digital products and software solutions that help individuals and businesses unlock their potential and create lasting positive impact.",
  },
  {
    icon: Compass,
    eyebrow: "Our Vision",
    title: "A More Connected Brighter Tomorrow",
    body: "To become a trusted technology brand known for thoughtful innovation, reliable products, and people-centered digital experiences.",
  },
];

// 5 — Core Values
const values: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Users,
    title: "People First",
    description: "Our people, users, and communities matter.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "We embrace new ideas and better ways.",
  },
  {
    icon: ShieldCheck,
    title: "Integrity",
    description: "We do the right thing, always.",
  },
  {
    icon: BadgeCheck,
    title: "Excellence",
    description: "We strive for outstanding results.",
  },
  {
    icon: TrendingUp,
    title: "Impact",
    description: "We build for a better tomorrow.",
  },
];

/**
 * 6 — Our Journey.
 *
 * Stage labels only. No founding years or dated milestones are claimed,
 * because none are verified — add a `year` field here only once a date is
 * confirmed, and render it in TimelineItem.
 */
const journey: { label: string; title: string; description: string }[] = [
  {
    label: "Foundation",
    title: "The Beginning",
    description: "A clear belief that technology should make life and business better.",
  },
  {
    label: "First Product",
    title: "Early product development",
    description: "Turning early ideas into working, usable software.",
  },
  {
    label: "Growing Together",
    title: "Expanding capabilities",
    description: "Broadening what the team can design, build, and support.",
  },
  {
    label: "Product Ecosystem",
    title: "Finlo and FinloCRM",
    description: "A growing family of products under one company.",
  },
  {
    label: "Today",
    title: "Building and refining",
    description: "Improving digital products around real user needs.",
  },
  {
    label: "Future",
    title: "A Brighter Tomorrow",
    description: "Continuing to innovate and create lasting impact.",
  },
];

// 7 — Team is loaded from "@/data/team"

// 8 — Trust / capabilities
const capabilities: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Lightbulb,
    title: "Innovative Products",
    description: "Practical digital solutions",
  },
  {
    icon: Users,
    title: "People Focused",
    description: "Built around real needs",
  },
  {
    icon: ShieldCheck,
    title: "Reliable & Secure",
    description: "Thoughtful product foundations",
  },
  {
    icon: Globe,
    title: "Global Vision",
    description: "Built for broader opportunities",
  },
  {
    icon: TrendingUp,
    title: "Continuous Growth",
    description: "Always improving",
  },
];

export default async function AboutPage() {
  const members = await getTeamMembers();
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
              <div className="max-w-[640px]">
                <p className="eyebrow text-[10.5px] sm:text-xs">
                  People • Ideas • Technology • A Brighter Tomorrow
                </p>

                <h1 className="mt-[clamp(16px,3.5vh,30px)] text-balance text-[30px] min-[400px]:text-[34px] font-extrabold leading-[1.08] text-navy sm:text-[50px] sm:leading-[1.04] md:text-[56px] xl:text-[60px] 2xl:text-[68px]">
                  About <span className="text-gradient">ELVAVEO</span>
                </h1>

                <p className="mt-4 max-w-[600px] text-balance text-[17px] font-semibold leading-snug text-navy/90 sm:mt-5 sm:text-[22px]">
                  We build digital products, software, and modern business
                  solutions that turn ideas into real impact.
                </p>

                <p className="mt-4 max-w-[600px] text-[15px] leading-relaxed text-muted sm:text-[17px]">
                  ELVAVEO is a technology company focused on creating meaningful
                  digital products and software solutions for individuals and
                  businesses. We combine ideas, design, and technology to build
                  practical experiences for a smarter, more connected future.
                </p>

                <div className="mt-[clamp(24px,4.5vh,32px)] flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <GradientButton
                    href="#story"
                    size="lg"
                    showArrow
                    className="w-full sm:w-auto"
                  >
                    Our Story
                  </GradientButton>
                  <GradientButton
                    href="#journey"
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                    ariaLabel="See the ELVAVEO journey"
                  >
                    <Play
                      size={16}
                      className="fill-current text-blue"
                      aria-hidden="true"
                    />
                    Our Journey
                  </GradientButton>
                </div>

                {/* Trust indicators */}
                <ul className="mt-[clamp(28px,5vh,36px)] flex flex-wrap items-center gap-x-3 gap-y-3">
                  {heroTrustPoints.map(({ icon: Icon, label }) => (
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
          {/* ============ 2 — WHY WE EXIST ============ */}
          <section className="mx-auto w-full max-w-[1520px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <SectionHeading
              eyebrow="Why We Exist"
              title={
                <>
                  Technology for a{" "}
                  <span className="text-gradient">Better Tomorrow</span>
                </>
              }
            />
            <p className="mx-auto mt-4 max-w-[760px] text-center text-[15px] leading-relaxed text-muted sm:text-[17px]">
              We believe in the power of technology to solve real problems,
              create opportunities, and make a positive impact on people and
              businesses.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {reasons.map(({ icon: Icon, title, description }, index) => (
                <Reveal key={title} delay={index * 0.06}>
                  <article className="glass group flex h-full flex-col rounded-[20px] p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-blue/30 hover:bg-white/90">
                    <Icon
                      className="text-blue"
                      size={25}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                    <h3 className="mt-5 text-[17px] font-bold leading-snug text-navy">
                      {title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted">
                      {description}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ============ 3 — OUR STORY ============ */}
          <section
            id="story"
            className="scroll-mt-24 border-y border-white/55 bg-white/20"
          >
            <div className="mx-auto grid w-full max-w-[1520px] items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:py-24">
              <Reveal>
                <div>
                  <p className="eyebrow">Our Story</p>
                  <h2 className="mt-5 text-balance text-[34px] font-extrabold leading-tight text-navy sm:text-[46px]">
                    From Ideas to <span className="text-gradient">Impact</span>
                  </h2>
                  <p className="mt-5 max-w-[610px] text-[15px] leading-relaxed text-muted sm:text-[17px]">
                    ELVAVEO was created around a simple belief: technology should
                    make life and business better. What started as a vision to
                    build useful digital products is growing into a broader
                    ecosystem of software solutions designed to solve real-world
                    problems.
                  </p>
                  <GradientButton
                    href="#journey"
                    variant="outline"
                    className="mt-7"
                    showArrow
                  >
                    Read Our Story
                  </GradientButton>
                </div>
              </Reveal>

              <Reveal delay={0.12}>
                <StoryVisual />
              </Reveal>
            </div>
          </section>

          {/* ============ 4 — MISSION & VISION ============ */}
          <section
            id="mission"
            className="scroll-mt-24 mx-auto w-full max-w-[1520px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24"
          >
            <div className="grid gap-5 lg:grid-cols-2">
              {purposeCards.map(({ icon: Icon, eyebrow, title, body }, index) => (
                <Reveal key={eyebrow} delay={index * 0.08}>
                  <article className="glass relative h-full overflow-hidden rounded-[22px] p-7 shadow-card-lg sm:p-9">
                    <div
                      className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-cyan/20 to-violet/20 blur-2xl"
                      aria-hidden="true"
                    />
                    <div className="relative">
                      <Icon
                        size={34}
                        strokeWidth={1.6}
                        className="text-blue"
                        aria-hidden="true"
                      />
                      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-blue">
                        {eyebrow}
                      </p>
                      <h3 className="mt-2 max-w-[460px] text-balance text-[24px] font-extrabold leading-tight text-navy sm:text-[30px]">
                        {title}
                      </h3>
                      <p className="mt-4 max-w-[560px] text-[14px] leading-relaxed text-muted sm:text-[16px]">
                        {body}
                      </p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ============ 5 — CORE VALUES ============ */}
          <section
            id="values"
            className="scroll-mt-24 border-y border-white/55 bg-white/25"
          >
            <div className="mx-auto w-full max-w-[1520px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
              <SectionHeading eyebrow="Our Core Values" title="What Drives Us" />
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {values.map(({ icon, title, description }, index) => (
                  <Reveal key={title} delay={index * 0.05}>
                    <ValueCard
                      icon={icon}
                      title={title}
                      description={description}
                    />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ============ 6 — OUR JOURNEY ============ */}
          <section
            id="journey"
            className="scroll-mt-24 mx-auto w-full max-w-[1520px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24"
          >
            <SectionHeading eyebrow="Our Journey" title="A Story of Growth" />

            {/* Horizontal track on desktop, vertical rail on mobile/tablet */}
            <div className="relative mt-12 grid gap-5 before:absolute before:bottom-4 before:left-[10px] before:top-2 before:w-px before:bg-gradient-to-b before:from-cyan before:via-blue before:to-violet xl:grid-cols-6 xl:gap-3 xl:before:bottom-auto xl:before:left-0 xl:before:right-0 xl:before:top-[11px] xl:before:h-px xl:before:w-auto xl:before:bg-gradient-to-r">
              {journey.map((stage, index) => (
                <Reveal key={stage.label} delay={index * 0.05}>
                  <TimelineItem {...stage} />
                </Reveal>
              ))}
            </div>
          </section>

          {/* ============ 7 — TEAM ============ */}
          <section
            id="team"
            className="scroll-mt-24 border-y border-white/55 bg-white/25"
          >
            <div className="mx-auto w-full max-w-[1520px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
              <SectionHeading
                eyebrow="Our Team"
                title="Meet Our Team"
                description="The dedicated minds building ELVAVEO, driving innovation, and shaping modern digital solutions."
              />

              <div className="mt-10">
                <Reveal>
                  <TeamSlider members={members} />
                </Reveal>
              </div>
            </div>
          </section>

          {/* ============ 8 — TRUST / CAPABILITIES STRIP ============ */}
          <section
            aria-label="What ELVAVEO brings"
            className="mx-auto w-full max-w-[1520px] px-5 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20"
          >
            <Reveal>
              <div className="glass rounded-[22px] p-6 shadow-card-lg sm:p-8 lg:p-10">
                <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
                  {capabilities.map(({ icon: Icon, title, description }) => (
                    <div key={title}>
                      <span className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/80 bg-white/65 text-blue shadow-sm">
                        <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                      </span>
                      <h3 className="mt-3 text-[14px] font-bold leading-snug text-navy">
                        {title}
                      </h3>
                      <p className="mt-1 text-[12.5px] leading-snug text-muted">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </section>

          {/* ============ 9 — FINAL CTA ============ */}
          <section className="px-5 pb-16 pt-8 sm:px-8 sm:pb-20 lg:px-12 lg:pb-24">
            <Reveal>
              <div className="relative isolate mx-auto max-w-[1280px] overflow-hidden rounded-[24px] border border-white/80 bg-white/65 px-6 py-12 text-center shadow-card-lg backdrop-blur-2xl sm:px-12 sm:py-16">
                <div
                  className="pointer-events-none absolute -inset-x-20 -top-36 z-0 h-72 rounded-full bg-gradient-to-r from-cyan/30 via-blue/25 to-violet/30 blur-3xl"
                  aria-hidden="true"
                />
                <div className="relative z-10">
                  <p className="eyebrow justify-center">Let&apos;s Build Together</p>
                  <h2 className="mx-auto mt-5 max-w-[780px] text-balance text-[34px] font-extrabold leading-tight text-navy sm:text-[48px]">
                    Ready to create a{" "}
                    <span className="text-gradient">brighter tomorrow?</span>
                  </h2>
                  <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-relaxed text-muted sm:text-[17px]">
                    Partner with ELVAVEO and turn your ideas into meaningful
                    digital products and software solutions.
                  </p>
                  <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <GradientButton
                      href="/contact"
                      size="lg"
                      showArrow
                      className="w-full sm:w-auto"
                    >
                      Get Started
                    </GradientButton>
                    <GradientButton
                      href="/contact"
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      Contact Us
                      <ArrowUpRight size={16} aria-hidden="true" />
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

/* ------------------------------------------------------------------ *
 * Local presentational helpers
 * ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-[760px] text-center">
      <p className="eyebrow justify-center">{eyebrow}</p>
      <h2 className="mt-4 text-balance text-[32px] font-extrabold leading-tight text-navy sm:text-[42px]">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-4 max-w-[640px] text-[15px] leading-relaxed text-muted sm:text-[17px]">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Our Story visual — the mountain/lake atmosphere with a software window
 * mockup, plus the "Ideas With Purpose" glass overlay.
 */
function StoryVisual() {
  const sidebarRows = [70, 52, 62, 44];
  const contentRows = [
    { w: "58%", h: "h-4" },
    { w: "100%", h: "h-2.5" },
    { w: "86%", h: "h-2.5" },
  ];

  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-[24px] border border-white/80 shadow-card-lg sm:min-h-[460px]">
      <Image
        src="/images/hero-mountain-lake.jpg"
        alt="A calm mountain lake at sunrise"
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0b2a65]/50 via-[#0b2a65]/10 to-[#8a2be2]/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b2a65]/55 via-transparent to-white/10" />

      {/* Software window mockup */}
      <div className="absolute inset-x-4 top-5 sm:inset-x-10 sm:top-10">
        <div className="overflow-hidden rounded-[16px] border border-white/70 bg-white/35 shadow-[0_26px_60px_-28px_rgba(11,42,101,0.6)] backdrop-blur-2xl">
          {/* Window chrome */}
          <div className="flex items-center gap-1.5 border-b border-white/60 bg-white/40 px-3.5 py-2.5 backdrop-blur-xl">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-2.5 h-1.5 w-20 rounded-full bg-navy/12" />
          </div>

          {/* App body */}
          <div className="grid grid-cols-[58px_1fr] gap-3 p-3.5 sm:grid-cols-[78px_1fr] sm:gap-4 sm:p-4">
            <div className="space-y-2.5">
              {sidebarRows.map((w, i) => (
                <span
                  key={i}
                  className="block h-2 rounded-full bg-navy/12"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
            <div className="space-y-3">
              {contentRows.map((row, i) => (
                <span
                  key={i}
                  className={`block rounded-full bg-navy/12 ${row.h}`}
                  style={{ width: row.w }}
                />
              ))}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="block h-11 rounded-[10px] border border-white/60 bg-white/40"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay glass card */}
      <div className="absolute inset-x-4 bottom-4 rounded-[18px] border border-white/55 bg-white/70 px-5 py-4 shadow-card backdrop-blur-xl sm:inset-x-8 sm:bottom-8 sm:px-6">
        <p className="eyebrow">Ideas With Purpose</p>
        <p className="mt-2 text-balance text-[17px] font-bold leading-snug text-navy sm:text-[21px]">
          Built for people. Designed for what&apos;s next.
        </p>
      </div>
    </div>
  );
}
