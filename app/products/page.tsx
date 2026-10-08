import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import Image from "next/image";
import { ExternalLink, ArrowDown, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GradientButton from "@/components/GradientButton";
import Reveal from "@/components/Reveal";
import { getProducts } from "@/lib/dataStore";
import { SITE_DESCRIPTION } from "@/lib/constants";
import type { Product } from "@/data/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Products & SaaS Ecosystem",
  description:
    "Explore the ELVAVEO product lineup — Finlo for personal finance, FinloCRM for customer workflows, and CAMVIA for AI-powered school intelligence.",
  path: "/products",
});

export default async function ProductsPage() {
  const currentProducts = await getProducts();

  return (
    <>
      <Navbar />
      <main id="main" className="overflow-hidden bg-ice">
        {/* Hero Section */}
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

          <div className="mx-auto flex w-full max-w-[1520px] flex-col justify-center px-5 pt-24 pb-12 sm:px-8 sm:pt-[clamp(101px,18.24vh,181px)] sm:pb-[clamp(73px,11.4vh,141px)] lg:min-h-[94vh] lg:px-12 xl:min-h-[100vh]">
            <Reveal>
              <div className="w-full xl:w-[75%]">
                <p className="eyebrow text-[10.5px] sm:text-xs">Our Products</p>
                <h1 className="mt-[clamp(16px,3.5vh,30px)] text-balance text-[30px] min-[400px]:text-[34px] font-extrabold leading-[1.08] text-navy sm:text-[50px] sm:leading-[1.04] md:text-[56px] xl:text-[60px] 2xl:text-[68px]">
                  Software We Build
                  <span className="block text-gradient">and Run Ourselves</span>
                </h1>
                <p className="mt-4 max-w-[620px] text-[15px] leading-relaxed text-muted sm:mt-5 sm:text-lg">
                  {SITE_DESCRIPTION} Every product is designed, engineered, and
                  improved in-house.
                </p>

                {/* Primary Live Product Links */}
                <div className="mt-[clamp(24px,4.5vh,32px)] flex flex-wrap gap-3 sm:gap-4">
                  {currentProducts.map((p, idx) => (
                    <GradientButton
                      key={p.id}
                      href={p.href}
                      target="_blank"
                      rel="noreferrer"
                      variant={idx === 0 ? "primary" : "outline"}
                      size="lg"
                      showArrow={idx === 0}
                      className="w-full sm:w-auto"
                    >
                      {`Open ${p.name}`}
                    </GradientButton>
                  ))}
                </div>

                {/* In-Page Quick Jump Navigation */}
                {currentProducts.length > 1 && (
                  <div className="mt-8 flex flex-wrap items-center gap-2">
                    <span className="text-[11.5px] font-bold text-muted">
                      Explore below:
                    </span>
                    {currentProducts.map((p) => (
                      <a
                        key={p.id}
                        href={`#${p.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-blue/20 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-navy shadow-xs backdrop-blur-md transition-all hover:border-blue hover:bg-white hover:text-blue hover:shadow-sm"
                      >
                        <span>{p.name}</span>
                        <ArrowDown size={11} className="text-muted" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Dynamic Products Showcase — Clean & Spacious without Mockup Dashboards */}
        <div className="relative bg-[url('/images/background-02.png')] bg-cover bg-center">
          {currentProducts.map((prod, index) => {
            const isFirst = index === 0;
            const isViolet = prod.accent === "violet";
            const domainDisplay = (prod.href || "")
              .replace(/^https?:\/\//, "")
              .replace(/\/$/, "");

            return (
              <section
                key={prod.id}
                id={prod.id}
                className={`scroll-mt-24 mx-auto w-full max-w-[1520px] px-5 ${
                  isFirst ? "py-12 sm:py-16 lg:py-20" : "pb-12 sm:pb-16 lg:pb-20"
                } sm:px-8 lg:px-12`}
              >
                <Reveal>
                  <div className="glass group relative overflow-hidden rounded-[26px] p-6 shadow-card-lg sm:rounded-[30px] sm:p-9 lg:p-12 transition-all duration-300 hover:shadow-2xl">
                    {/* Top Header Row with Logo, Brand, and Subdomain */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-blue/10 pb-6 sm:pb-8">
                      {/* Logo and Badges */}
                      <div className="flex items-center gap-4">
                        <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/90 bg-white/90 p-3 shadow-card backdrop-blur-md">
                          {prod.logo ? (
                            <img
                              src={prod.logo}
                              alt={`${prod.name} logo`}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="text-xl font-black text-navy">
                              {prod.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="eyebrow text-[10px] sm:text-[11px]">
                              {prod.badge || "An ELVAVEO Product"}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                isViolet
                                  ? "bg-violet/15 text-violet-700"
                                  : "bg-cyan/15 text-cyan-700"
                              }`}
                            >
                              {prod.category}
                            </span>
                          </div>
                          <h3 className="mt-1 text-[22px] sm:text-[26px] font-extrabold text-navy">
                            {prod.name}
                          </h3>
                        </div>
                      </div>

                      {/* Live Platform Status & Subdomain pill */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          Live Platform
                        </span>
                        {domainDisplay && (
                          <span className="hidden sm:inline-flex rounded-full border border-blue/15 bg-white/70 px-3 py-1 text-xs font-mono font-medium text-navy/70">
                            {domainDisplay}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Headline & Description */}
                    <div className="pt-6 sm:pt-8">
                      <h2 className="text-balance text-[26px] font-extrabold leading-tight text-navy sm:text-[34px] lg:text-[40px] max-w-4xl">
                        {prod.headline?.[0] || prod.name}
                        {prod.headline?.[1] && (
                          <span className="block text-gradient">
                            {prod.headline[1]}
                          </span>
                        )}
                      </h2>

                      <p className="mt-4 text-[16px] sm:text-[18px] leading-relaxed text-muted max-w-4xl">
                        {prod.description}
                      </p>
                    </div>

                    {/* Key Metrics Grid */}
                    {prod.stats && prod.stats.length > 0 && (
                      <div className="mt-8 rounded-2xl border border-white/80 bg-white/50 p-4 sm:p-6 backdrop-blur-md">
                        <p className="text-[10.5px] font-bold uppercase tracking-widest text-muted">
                          Key Performance &amp; Capabilities
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                          {prod.stats.map((stat, sIdx) => (
                            <div
                              key={stat.label || sIdx}
                              className="rounded-xl border border-line bg-white/90 p-3 shadow-xs transition hover:bg-white"
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted truncate">
                                {stat.label}
                              </p>
                              <p className="mt-1 text-[16px] sm:text-[18px] font-black text-navy truncate">
                                {stat.value}
                              </p>
                              {stat.trend && (
                                <p className="mt-0.5 text-[9.5px] font-bold text-emerald-600">
                                  {stat.trend}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CTA Actions */}
                    <div className="mt-8 flex flex-wrap items-center gap-3.5 border-t border-blue/10 pt-6">
                      <GradientButton
                        href={prod.href}
                        target="_blank"
                        rel="noreferrer"
                        size="lg"
                        showArrow
                      >
                        {prod.cta || "Learn More"}
                      </GradientButton>

                      <a
                        href={prod.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-blue/20 bg-white/80 px-4 py-3 text-xs font-bold text-blue hover:bg-blue hover:text-white transition-all shadow-xs"
                      >
                        <span>Visit {prod.name} ({domainDisplay || "Online"})</span>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                </Reveal>
              </section>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
