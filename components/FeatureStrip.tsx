import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { services } from "@/data/services";
import Reveal from "./Reveal";

/**
 * Featured Services — one wide rounded glass container split into a compact
 * intro block (≈22%) and four equal, individually-boxed service cards (≈78%),
 * with a "View All Services" link at the top-right. Matches hero container width.
 */
export default function FeatureStrip() {
  return (
    <section id="services" className="scroll-mt-24 w-full pb-6 lg:pb-8">
      <div className="w-full">
        <Reveal>
          <div className="shadow-card relative overflow-hidden rounded-[24px] bg-sky-100/40 ring-1 ring-white/70 backdrop-blur-2xl">
            <div className="grid lg:grid-cols-[minmax(250px,0.28fr)_minmax(0,0.72fr)]">
              {/* Left intro block */}
              <div className="border-b border-line p-5 sm:p-6 lg:border-b-0 lg:border-r lg:p-6">
                <p className="eyebrow text-[10.5px]">What We Do</p>
                <h2 className="mt-2 text-xl font-bold leading-tight text-navy sm:text-[22px]">
                  Our Featured Services
                </h2>
                <p className="mt-2 max-w-[300px] text-[13px] leading-snug text-muted">
                  From strategy to scale, we provide end-to-end digital
                  solutions that help businesses grow in the digital world.
                </p>
              </div>

              {/* Right — 4 equal rectangle service cards */}
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
                {services.map((service) => (
                  <div
                    key={service.title}
                    className="group flex min-h-[128px] flex-col gap-2 rounded-[16px] border border-white/70 bg-gradient-to-b from-white/75 via-white/55 to-white/35 p-4 shadow-[0_10px_30px_-16px_rgba(42,83,150,0.3)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(42,83,150,0.45)]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue/10 to-violet/10 text-blue ring-1 ring-blue/15 transition-all duration-300 group-hover:bg-gradient-main group-hover:text-white group-hover:shadow-[0_8px_20px_-8px_rgba(53,109,255,0.75)]">
                      <service.icon size={18} strokeWidth={2.2} aria-hidden="true" />
                    </span>
                    <h3 className="text-[14px] font-bold leading-snug text-navy">
                      {service.title}
                    </h3>
                    <p className="text-[12.5px] leading-snug text-muted">
                      {service.description}
                    </p>
                    <Link
                      href={service.href}
                      className="mt-auto inline-flex items-center gap-1 self-start text-[12px] font-semibold text-blue transition-colors hover:text-violet"
                    >
                      Learn more
                      <ArrowRight
                        size={13}
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* View All Services — bottom-right footer row */}
            <div className="flex justify-end border-t border-line/60 px-5 py-3.5 sm:px-6">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[13px] font-bold text-blue transition-colors hover:text-violet"
              >
                View All Services
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}