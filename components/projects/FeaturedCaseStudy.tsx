import Image from "next/image";
import GradientButton from "@/components/GradientButton";
import Reveal from "@/components/Reveal";
import { finloValuePoints } from "@/data/projectShowcase";

/**
 * Featured case study — Finlo.
 *
 * Finlo is an ELVAVEO product, NOT a client engagement. The copy deliberately
 * avoids any external-client attribution, and the quote is presented as the
 * product's guiding intent with no named author.
 */
export default function FeaturedCaseStudy() {
  return (
    <section
      id="case-study"
      className="scroll-mt-24 border-y border-white/55 bg-white/20"
    >
      <div className="mx-auto w-full max-w-[1520px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.85fr_1fr] lg:items-center lg:gap-12">
          {/* Left — heading + copy + CTA */}
          <Reveal>
            <div>
              <p className="eyebrow text-[10.5px]">Featured Case Study</p>
              <h2 className="mt-4 text-balance text-[30px] font-extrabold leading-tight text-navy sm:text-[38px] lg:text-[42px]">
                From Vision to a Smarter{" "}
                <span className="text-gradient">Financial Future</span>
              </h2>
              <p className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-muted sm:text-[16.5px]">
                Finlo represents ELVAVEO&apos;s approach to turning a real-world
                financial challenge into a simple, modern, user-focused digital
                product.
              </p>
              <GradientButton
                href="https://finlo.elvaveo.com"
                target="_blank"
                size="lg"
                showArrow
                className="mt-7"
                ariaLabel="Open Finlo at finlo.elvaveo.com"
              >
                View Finlo
              </GradientButton>
            </div>
          </Reveal>

          {/* Center — official Finlo branding + quote */}
          <Reveal delay={0.1}>
            <div className="glass relative overflow-hidden rounded-[24px] p-7 text-center shadow-card-lg sm:p-9">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-cyan/20 to-violet/20 blur-2xl"
              />
              <div className="relative">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                  An ELVAVEO Product
                </p>

                {/* Official Finlo logo, used exactly as supplied */}
                <div className="relative mx-auto mt-6 h-14 w-[150px]">
                  <Image
                    src="/brand/finlo-logo.svg"
                    alt="Finlo"
                    fill
                    sizes="150px"
                    className="object-contain"
                  />
                </div>

                <blockquote className="mt-7 border-t border-line pt-6">
                  <p className="text-balance text-[17px] font-semibold italic leading-relaxed text-navy sm:text-[19px]">
                    &ldquo;Built to make personal finance clearer, simpler, and
                    more useful.&rdquo;
                  </p>
                  <footer className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                    Product guiding intent
                  </footer>
                </blockquote>
              </div>
            </div>
          </Reveal>

          {/* Right — value points */}
          <Reveal delay={0.2}>
            <ul className="space-y-3.5">
              {finloValuePoints.map(({ icon: Icon, title, note }) => (
                <li
                  key={title}
                  className="glass flex gap-3.5 rounded-[18px] p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:bg-white/90"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-white/80 bg-gradient-to-br from-white to-blue/10 text-blue shadow-sm">
                    <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[15px] font-bold leading-snug text-navy">
                      {title}
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-muted">
                      {note}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
