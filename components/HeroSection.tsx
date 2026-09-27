import Image from "next/image";
import { BadgeCheck, Layers, Play, Sparkles } from "lucide-react";
import Reveal from "./Reveal";
import GradientButton from "./GradientButton";

const trustIndicators = [
  { icon: BadgeCheck, label: "Trusted by growing businesses" },
  { icon: Layers, label: "End-to-end solutions" },
  { icon: Sparkles, label: "Built for what's next" },
];

/**
 * Hero — scenic mountain lake background with a centered, left-aligned
 * headline block. Content-only (no dashboard visual).
 */
export default function HeroSection() {
  return (
    <section id="home" className="relative isolate overflow-hidden">
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
              Ideas&nbsp;•&nbsp;Products&nbsp;•&nbsp;People&nbsp;•&nbsp;A Brighter Tomorrow
            </p>

            <h1 className="mt-[clamp(22px,4vh,30px)] text-balance text-[38px] font-extrabold leading-[1.04] text-navy sm:text-[56px] xl:text-[60px] 2xl:text-[68px]">
              We Build Digital Products
              <span className="block text-gradient">and Software Solutions</span>
            </h1>

            <p className="mt-5 max-w-[580px] text-[17px] leading-relaxed text-muted sm:text-lg">
              ELVAVEO helps businesses turn ideas into powerful digital
              products. We design, build, and scale software solutions that
              create real impact and a brighter tomorrow.
            </p>

            <div className="mt-[clamp(24px,4.5vh,32px)] flex flex-col gap-3 sm:flex-row sm:gap-4">
              <GradientButton href="#contact" size="lg" showArrow className="w-full sm:w-auto">
                Start Your Project
              </GradientButton>
              <GradientButton
                href="/projects"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                ariaLabel="See work ELVAVEO has delivered"
              >
                <Play size={16} className="fill-current text-blue" aria-hidden="true" />
                See Our Work
              </GradientButton>
            </div>

            {/* Trust indicators */}
            <ul className="mt-[clamp(28px,5vh,36px)] flex flex-wrap items-center gap-x-3 gap-y-3">
              {trustIndicators.map((t) => (
                <li
                  key={t.label}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-navy/70"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue/20 bg-blue/10 text-blue">
                    <t.icon size={14} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  {t.label}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}