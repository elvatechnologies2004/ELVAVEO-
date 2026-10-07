import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import { PRODUCT_LINKS } from "@/lib/constants";

/**
 * Software Products strip (3-card version) — copy of the HighlightsStrip
 * pattern with three compact brand cards.
 */
const brands = [
  {
    title: "Finlo",
    description:
      "Personal finance made simple — understand cash flow, manage income and expenses, save automatically, and plan ahead with confidence. Track every rupee in real time.",
    chip: "FinTech",
    cta: "Learn More",
    href: "https://finlo.elvaveo.com",
  },
  {
    title: "FinloCRM",
    description:
      "A modern CRM to manage leads, customers, deals, and sales workflows — built for growing businesses.",
    chip: "SaaS / CRM",
    cta: "Learn More",
    href: "https://crm.elvaveo.com",
  },
  {
    title: "ELVAVEO",
    description:
      "The software studio behind these products — ideas, products, people, and a brighter tomorrow.",
    chip: "Studio",
    cta: "All Products",
    href: "/products",
  },
] as const;

export default function ProductsStrip() {
  return (
    <section id="products-strip" className="scroll-mt-24 w-full pb-6 lg:pb-8">
      <div className="mx-auto w-full max-w-[1520px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <div className="shadow-card relative overflow-hidden rounded-[24px] ring-1 ring-white/70 backdrop-blur-2xl lg:min-h-[240px]">
            <div className="grid lg:grid-cols-[minmax(240px,0.28fr)_minmax(0,0.72fr)]">
              {/* intro block */}
              <div className="flex min-h-[200px] flex-col justify-center border-b border-line p-5 sm:p-7 lg:min-h-[258.3px] lg:border-b-0 lg:border-r">
                <p className="eyebrow text-[10.5px]">Our Products</p>
                <h2 className="mt-2 text-xl font-bold leading-tight text-navy sm:text-[22px]">
                  Software Products for a Smarter Tomorrow
                </h2>
                <p className="mt-2 max-w-[300px] text-[13px] leading-snug text-muted">
                  Three products and platforms — one team building real
                  solutions for real problems.
                </p>
              </div>

              {/* 3 brand cards */}
              <div className="grid grid-cols-1 gap-4 p-3.5 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                {brands.map((b) => (
                  <div
                    key={b.title}
                    className="flex min-h-[220px] flex-col items-start justify-between rounded-[16px] border border-white/70 bg-gradient-to-b from-white/75 via-white/55 to-white/35 p-4 shadow-[0_10px_30px_-16px_rgba(42,83,150,0.3)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(42,83,150,0.45)] sm:min-h-[258px] sm:p-5"
                  >
                    <div>
                      <span className="w-fit rounded-full bg-gradient-main px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                        {b.chip}
                      </span>
                      <h3 className="mt-3.5 text-[17px] font-extrabold text-navy sm:text-[18.5px]">
                        {b.title}
                      </h3>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-muted sm:text-[14px]">
                        {b.description}
                      </p>
                    </div>
                    <Link
                      href={b.href}
                      {...(b.href.startsWith("http")
                        ? { target: "_blank", rel: "noreferrer" }
                        : undefined)}
                      className="group/link mt-4 inline-flex w-fit items-center gap-1.5 text-[13px] font-bold text-blue transition-colors hover:text-violet"
                      aria-label={`${b.title} — ${b.cta}`}
                    >
                      {b.cta}
                      <ArrowRight
                        size={14}
                        aria-hidden="true"
                        className="transition-transform duration-200 group-hover/link:translate-x-1"
                      />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* All products — bottom-right footer row */}
            <div className="flex justify-end border-t border-line/60 px-5 py-3.5 sm:px-6">
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 text-[13px] font-bold text-blue transition-colors hover:text-violet"
              >
                View All Products
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