import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import ProductCard from "./ProductCard";
import FinloNexaOverview from "./products/FinloNexaOverview";
import { products } from "@/data/products";

/**
 * Highlights Strip — two brand/product cards.
 * First card shows the full Finlo product card (same size/content as in the
 * Products section). Second card is a FinloCRM brand card.
 */
export default function HighlightsStrip() {
  return (
    <section id="highlights" className="scroll-mt-24 w-full pb-6 lg:pb-8">
      <div className="mx-auto w-full max-w-[1520px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <div className="shadow-card relative overflow-hidden rounded-[24px] ring-1 ring-white/70 backdrop-blur-2xl lg:min-h-[240px]">
            <div className="grid lg:grid-cols-[minmax(240px,0.28fr)_minmax(0,0.72fr)]">
              {/* Left intro block */}
              <div className="flex min-h-[200px] flex-col justify-center border-b border-line p-5 sm:p-7 lg:min-h-[287px] lg:border-b-0 lg:border-r">
                <p className="eyebrow text-[10.5px]">Our Products</p>
                <h2 className="mt-2 text-xl font-bold leading-tight text-navy sm:text-[22px]">
                  Software Products for a Smarter Tomorrow
                </h2>
                <p className="mt-2 max-w-[300px] text-[13px] leading-snug text-muted">
                  Two reasons teams keep building with us — replaced with your
                  own line whenever you paste real copy here.
                </p>
              </div>

              {/* Right — 2 cards: Finlo full product card + FinloCRM brand card */}
              <div className="grid grid-cols-1 gap-4 p-3.5 sm:p-5 lg:p-6 xl:grid-cols-2">
                <ProductCard product={products[0]} />

                <div className="flex min-h-[240px] items-center rounded-[16px] border border-white/70 bg-gradient-to-b from-white/75 via-white/55 to-white/35 p-4 shadow-[0_10px_30px_-16px_rgba(42,83,150,0.3)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(42,83,150,0.45)] sm:min-h-[287px] sm:p-6">
                  <div className="grid w-full gap-5 xl:grid-cols-2 xl:gap-4">
                    {/* Left — logo + description */}
                    <div className="flex flex-col items-start justify-start">
                      <Image
                        src="/brand/finlocrm-logo.png"
                        alt="FinloCRM logo"
                        width={151}
                        height={40}
                        sizes="151px"
                        className="h-10 w-auto max-w-full object-contain sm:mt-[7px] sm:h-12"
                      />
                      <p className="mt-3 max-w-[460px] text-[15px] leading-relaxed text-muted sm:text-[16px] xl:text-[17px]">
                        A modern CRM solution to manage leads, customers, and
                        sales — built for growing businesses.
                      </p>
                    </div>

                    {/* Right — CRM overview panel */}
                    <div className="flex items-center">
                      <FinloNexaOverview />
                    </div>
                  </div>
                </div>
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