import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  Cloud,
  Code2,
  Database,
  Lightbulb,
  Map,
  Palette,
  Rocket,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/constants";
import { faAws } from "@fortawesome/free-brands-svg-icons";
import {
  siDocker,
  siFigma,
  siGooglecloud,
  siMongodb,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siPython,
  siReact,
} from "simple-icons/icons";
import type { SimpleIcon } from "simple-icons";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GradientButton from "@/components/GradientButton";
import Reveal from "@/components/Reveal";
import { stats } from "@/data/stats";

export const metadata: Metadata = createPageMetadata({
  title: "Services",
  description:
    "Explore ELVAVEO's web, software, product design, cloud, CRM, and digital consulting services.",
  path: "/services",
});

const trustPoints = [
  { icon: BadgeCheck, label: "Strategic approach" },
  { icon: Workflow, label: "End-to-end support" },
  { icon: TrendingUp, label: "Real business impact" },
];

const services: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Code2,
    title: "Web Development",
    description: "Modern, scalable web applications built for performance.",
  },
  {
    icon: Boxes,
    title: "Software Development",
    description: "Custom software solutions that solve real business problems.",
  },
  {
    icon: Palette,
    title: "UI/UX Design",
    description: "Beautiful, user-centered designs that create seamless experiences.",
  },
  {
    icon: Users,
    title: "CRM Solutions",
    description: "Tailored CRM systems to manage leads, customers, and growth.",
  },
  {
    icon: Cloud,
    title: "Cloud & DevOps",
    description: "Scalable infrastructure for a faster, more reliable future.",
  },
  {
    icon: Lightbulb,
    title: "Product Strategy",
    description: "Turn your ideas into validated products with clear roadmaps.",
  },
  {
    icon: BarChart3,
    title: "Digital Consulting",
    description: "Strategic guidance to help you innovate, optimize, and scale.",
  },
];

const processSteps: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  { icon: Search, title: "Discover", description: "Understand your goals and challenges." },
  { icon: Map, title: "Plan", description: "Define strategy and roadmap." },
  { icon: Palette, title: "Design", description: "Create intuitive, user-centered designs." },
  { icon: Code2, title: "Build", description: "Develop with quality and agility." },
  { icon: Rocket, title: "Launch", description: "Deploy and ensure a smooth transition." },
  { icon: TrendingUp, title: "Optimize", description: "Monitor, improve, and scale for the future." },
];

type BrandLogo = { viewBox: string; path: string; color: string };

const simpleLogo = (icon: SimpleIcon): BrandLogo => ({
  viewBox: "0 0 24 24",
  path: icon.path,
  color: `#${icon.hex}`,
});

const awsPath = Array.isArray(faAws.icon[4])
  ? faAws.icon[4].join(" ")
  : faAws.icon[4];

const technologies: { logo: BrandLogo; name: string }[] = [
  { logo: simpleLogo(siReact), name: "React" },
  { logo: simpleLogo(siNextdotjs), name: "Next.js" },
  { logo: simpleLogo(siNodedotjs), name: "Node.js" },
  { logo: simpleLogo(siPython), name: "Python" },
  {
    logo: {
      viewBox: `0 0 ${faAws.icon[0]} ${faAws.icon[1]}`,
      path: awsPath,
      color: "#232f3e",
    },
    name: "AWS",
  },
  { logo: simpleLogo(siGooglecloud), name: "Google Cloud" },
  { logo: simpleLogo(siMongodb), name: "MongoDB" },
  { logo: simpleLogo(siPostgresql), name: "PostgreSQL" },
  { logo: simpleLogo(siFigma), name: "Figma" },
  { logo: simpleLogo(siDocker), name: "Docker" },
];

const statIcons: Record<string, LucideIcon> = {
  "Projects Delivered": Boxes,
  "Happy Clients": Users,
  "Years of Experience": TrendingUp,
  "Client Satisfaction": BadgeCheck,
};

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="overflow-hidden bg-ice">
        <section className="relative isolate overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/55 to-ice" />
          </div>

          <div className="mx-auto flex w-full max-w-[1520px] flex-col justify-center px-5 pt-[clamp(101px,18.24vh,181px)] pb-[clamp(73px,11.4vh,141px)] sm:px-8 lg:min-h-[101vh] lg:px-12">
            <Reveal>
              <div className="w-full xl:w-[70%]">
                <p className="eyebrow text-[11px] sm:text-xs">Our Services</p>
                <h1 className="mt-[clamp(22px,4vh,30px)] text-balance text-[38px] font-extrabold leading-[1.04] text-navy sm:text-[56px] xl:text-[60px] 2xl:text-[68px]">
                  Services That Turn Ideas Into
                  <span className="block text-gradient">Scalable Digital Solutions</span>
                </h1>
                <p className="mt-5 max-w-[580px] text-[17px] leading-relaxed text-muted sm:text-lg">
                  From strategy to execution, ELVAVEO helps businesses turn ideas into powerful digital products. We combine technology, design, and business insight to build solutions that create real impact.
                </p>
                <div className="mt-[clamp(24px,4.5vh,32px)] flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <GradientButton href="#contact" size="lg" showArrow className="w-full sm:w-auto">
                    Start Your Project
                  </GradientButton>
                  <GradientButton href="#services" variant="outline" size="lg" className="w-full sm:w-auto">
                    <ArrowDown size={16} className="text-blue" aria-hidden="true" />
                    Watch Our Services
                  </GradientButton>
                </div>
                <ul className="mt-[clamp(28px,5vh,36px)] flex flex-wrap items-center gap-x-3 gap-y-3">
                  {trustPoints.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-1.5 text-[13px] font-semibold text-navy/70">
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
          <section id="services" className="scroll-mt-24 mx-auto w-full max-w-[1520px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
            <div className="glass rounded-[24px] p-5 shadow-card-lg sm:rounded-[26px] sm:p-7 lg:p-9">
              <div className="grid gap-8 xl:grid-cols-[minmax(230px,0.78fr)_minmax(0,2.22fr)] xl:gap-10">
                <div className="max-w-[420px]">
                  <p className="eyebrow">Our Services</p>
                  <h2 className="mt-4 text-balance text-[30px] font-extrabold leading-tight text-navy sm:text-[36px]">
                    Comprehensive Services for Your Digital Growth
                  </h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-[16px]">
                    We offer end-to-end digital services to help you innovate, build, and scale with confidence.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {services.map(({ icon: Icon, title, description }, index) => (
                    <Reveal key={title} delay={index * 0.035}>
                      <article className="glass group flex h-full min-h-[205px] flex-col rounded-[18px] p-4 shadow-card transition duration-300 hover:-translate-y-1 hover:border-blue/30 hover:bg-white/90 sm:p-5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-white/80 bg-gradient-to-br from-white to-blue/10 text-blue shadow-sm">
                          <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                        </span>
                        <h3 className="mt-4 text-[15px] font-bold leading-snug text-navy">{title}</h3>
                        <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">{description}</p>
                        <a href="#contact" className="mt-4 inline-flex items-center gap-1 text-[12px] font-bold text-blue transition-colors hover:text-violet">
                          Learn more <ArrowRight size={14} aria-hidden="true" />
                        </a>
                      </article>
                    </Reveal>
                  ))}
                  <Reveal delay={0.25}>
                    <blockquote className="flex h-full min-h-[205px] flex-col justify-between rounded-[18px] border border-blue/15 bg-gradient-to-br from-white/80 via-sky-50/75 to-blue/10 p-5 shadow-card">
                      <Sparkles size={21} className="text-blue" aria-hidden="true" />
                      <div>
                        <p className="text-[18px] font-extrabold leading-snug text-navy">“More than services. A partner in your journey.”</p>
                        <cite className="mt-3 block text-[12px] font-semibold not-italic text-muted">— The ELVAVEO Team</cite>
                      </div>
                    </blockquote>
                  </Reveal>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[1520px] px-5 pb-12 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
            <div className="glass rounded-[24px] p-5 shadow-card-lg sm:rounded-[26px] sm:p-7 lg:p-9">
              <div className="grid gap-8 xl:grid-cols-[minmax(230px,0.78fr)_minmax(0,2.22fr)] xl:gap-10">
                <div className="max-w-[400px]">
                  <p className="eyebrow">Our Process</p>
                  <h2 className="mt-4 text-balance text-[30px] font-extrabold leading-tight text-navy sm:text-[36px]">From Idea to Impact</h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-[16px]">
                    A proven process that turns your vision into scalable digital solutions.
                  </p>
                </div>

                <ol className="relative grid gap-5 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-blue/15 sm:grid-cols-2 sm:before:hidden xl:grid-cols-6 xl:gap-3">
                  {processSteps.map(({ icon: Icon, title, description }, index) => (
                    <li key={title} className="relative pl-12 sm:pl-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/70 text-blue shadow-sm sm:h-9 sm:w-9">
                          <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                        </span>
                        <span className="text-[12px] font-extrabold text-blue">{String(index + 1).padStart(2, "0")}</span>
                      </div>
                      <h3 className="mt-3 text-[15px] font-bold text-navy">{title}</h3>
                      <p className="mt-1 text-[12px] leading-relaxed text-muted">{description}</p>
                      {index < processSteps.length - 1 && (
                        <ArrowRight className="absolute right-0 top-2 hidden text-blue/30 xl:block" size={15} aria-hidden="true" />
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <section className="border-y border-white/55 bg-white/20">
            <div className="mx-auto w-full max-w-[1520px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
              <div className="max-w-[760px]">
                <p className="eyebrow">Our Technology Stack</p>
                <h2 className="mt-4 text-balance text-[30px] font-extrabold leading-tight text-navy sm:text-[36px]">Built with the Best</h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-[16px]">
                  We use modern technologies and trusted platforms to build secure, scalable, and future-ready solutions.
                </p>
                <p className="mt-3 text-[11px] leading-relaxed text-muted/90">Technologies we use and support; no affiliation implied.</p>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 xl:gap-3">
                {technologies.map(({ logo, name }, index) => (
                  <Reveal key={name} delay={index * 0.025}>
                    <div className="glass flex h-[92px] min-w-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-[16px] px-1.5 text-center shadow-card transition duration-300 hover:-translate-y-0.5 hover:bg-white/90 sm:px-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-blue/10 bg-white/75">
                        <svg viewBox={logo.viewBox} className="h-6 w-6" aria-hidden="true">
                          <path d={logo.path} fill={logo.color} />
                        </svg>
                      </span>
                      <span className="text-[11px] font-bold leading-tight text-navy sm:text-[12px]">{name}</span>
                    </div>
                  </Reveal>
                ))}
                <div className="flex h-[92px] min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-[16px] border border-blue/15 bg-white/55 px-1.5 text-center shadow-card sm:px-2">
                  <span className="text-[11px] font-bold leading-tight text-navy sm:text-[12px]">and more</span>
                  <span className="text-[16px] font-extrabold tracking-[0.12em] text-blue" aria-hidden="true">•••</span>
                </div>
              </div>
            </div>
          </section>

          <section aria-label="ELVAVEO at a glance" className="mx-auto w-full max-w-[1520px] px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
            <Reveal>
              <div className="glass grid gap-5 rounded-[20px] p-5 shadow-card sm:p-7 lg:grid-cols-[1.7fr_1fr] lg:items-center lg:p-8">
                <ul className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 sm:gap-3">
                  {stats.items.map((item) => {
                    const Icon = statIcons[item.label] ?? BadgeCheck;
                    return (
                      <li key={item.label}>
                        <span className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-white/80 bg-white/60 text-blue shadow-sm">
                          <Icon size={17} aria-hidden="true" />
                        </span>
                        <p className="mt-3 text-[25px] font-extrabold leading-none text-blue">{item.value}</p>
                        <p className="mt-1 text-[12px] font-semibold leading-snug text-navy/70">{item.label}</p>
                      </li>
                    );
                  })}
                </ul>
                <blockquote className="border-t border-blue/10 pt-5 text-center lg:border-l lg:border-t-0 lg:py-2 lg:pl-8">
                  <p className="text-balance text-[18px] font-bold leading-snug text-navy sm:text-[20px]">“Ideas, technology, and people for a brighter tomorrow.”</p>
                  <cite className="mt-2 block text-[12px] font-semibold not-italic text-muted">— The ELVAVEO Team</cite>
                </blockquote>
              </div>
            </Reveal>
          </section>

          <section id="contact" className="scroll-mt-24 px-5 pb-12 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
            <Reveal>
              <div className="relative isolate mx-auto max-w-[1280px] overflow-hidden rounded-[26px] border border-white/80 bg-white/65 px-6 py-12 text-center shadow-card-lg backdrop-blur-2xl sm:px-12 sm:py-16">
                <Image
                  src="/images/hero-mountain-lake.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="-z-20 object-cover object-center"
                />
                <div className="absolute inset-0 -z-10 bg-white/65" aria-hidden="true" />
                <div className="relative">
                  <p className="eyebrow justify-center text-[10.5px]">Let’s Build Together</p>
                  <h2 className="mx-auto mt-4 max-w-[780px] text-balance text-[32px] font-extrabold leading-tight text-navy sm:text-[42px]">
                    Ready to turn your ideas into reality?
                  </h2>
                  <p className="mx-auto mt-4 max-w-[600px] text-[15px] leading-relaxed text-muted sm:text-[17px]">
                    Partner with ELVAVEO and let’s create digital solutions that make a real impact.
                  </p>
                  <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    <GradientButton href={`mailto:${CONTACT_EMAIL}?subject=Start%20a%20Project`} size="lg" showArrow className="w-full sm:w-auto">
                      Get Started
                    </GradientButton>
                    <GradientButton href={`mailto:${CONTACT_EMAIL}`} variant="outline" size="lg" className="w-full sm:w-auto">
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
