import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GradientButton from "@/components/GradientButton";
import Reveal from "@/components/Reveal";
import FinloPhoneMockup from "@/components/products/FinloPhoneMockup";
import FinloNexaMockup from "@/components/products/FinloNexaMockup";
import FinloNexaOverview from "@/components/products/FinloNexaOverview";
import CamviaMockup from "@/components/products/CamviaMockup";
import DynamicProductMockup from "@/components/products/DynamicProductMockup";
import { getProducts } from "@/lib/dataStore";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/constants";
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
  const finlo = currentProducts.find((p) => p.id === "finlo") || currentProducts[0];
  const finlonexa = currentProducts.find((p) => p.id === "finlonexa") || currentProducts[1];
  const otherProducts = currentProducts.filter(
    (p) => p.id !== "finlo" && p.id !== "finlonexa"
  );

  return (
    <>
      <Navbar />
      <main id="main" className="overflow-hidden bg-ice">
        {/* Hero — mirrors the services page hero exactly */}
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
              <div className="w-full xl:w-[70%]">
                <p className="eyebrow text-[10.5px] sm:text-xs">Our Products</p>
                <h1 className="mt-[clamp(16px,3.5vh,30px)] text-balance text-[30px] min-[400px]:text-[34px] font-extrabold leading-[1.08] text-navy sm:text-[50px] sm:leading-[1.04] md:text-[56px] xl:text-[60px] 2xl:text-[68px]">
                  Software We Build
                  <span className="block text-gradient">and Run Ourselves</span>
                </h1>
                <p className="mt-4 max-w-[580px] text-[15px] leading-relaxed text-muted sm:mt-5 sm:text-lg">
                  {SITE_DESCRIPTION} Every product is designed, engineered, and
                  improved in-house.
                </p>
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
              </div>
            </Reveal>
          </div>
        </section>

        <div className="relative bg-[url('/images/background-02.png')] bg-cover bg-center">
          {/* Finlo */}
          {finlo && (
            <section
              id="finlo"
              className="scroll-mt-24 mx-auto w-full max-w-[1520px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20"
            >
              <div className="glass rounded-[24px] p-5 shadow-card-lg sm:rounded-[26px] sm:p-7 lg:p-9">
                <div className="grid items-center gap-8 xl:grid-cols-[minmax(230px,0.9fr)_minmax(0,2.1fr)] xl:gap-10">
                  <Reveal className="max-w-[420px]">
                    <p className="eyebrow">{finlo.badge}</p>
                    <div className="mt-4 flex h-[58px] items-center">
                      <img
                        src={finlo.logo}
                        alt={`${finlo.name} logo`}
                        className="h-full w-auto max-w-[280px] object-contain"
                      />
                    </div>
                    <h2 className="mt-4 text-balance text-[30px] font-extrabold leading-tight text-navy sm:text-[36px]">
                      {finlo.headline[0]}
                      <span className="block text-gradient">{finlo.headline[1]}</span>
                    </h2>
                    <p className="mt-4 text-[17px] leading-relaxed text-muted">
                      {finlo.description}
                    </p>
                    <GradientButton
                      href={finlo.href}
                      target="_blank"
                      rel="noreferrer"
                      size="lg"
                      showArrow
                      className="mt-6"
                    >
                      {finlo.cta}
                    </GradientButton>
                  </Reveal>

                  <Reveal delay={0.1}>
                    <FinloPhoneMockup stats={finlo.stats} />
                  </Reveal>
                </div>
              </div>
            </section>
          )}

          {/* FinloCRM */}
          {finlonexa && (
            <section
              id="finlonexa"
              className="scroll-mt-24 mx-auto w-full max-w-[1520px] px-5 pb-12 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20"
            >
              <div className="glass rounded-[24px] p-5 shadow-card-lg sm:rounded-[26px] sm:p-7 lg:p-9">
                <div className="grid items-center gap-8 xl:grid-cols-[minmax(230px,0.9fr)_minmax(0,2.1fr)] xl:gap-10">
                  <Reveal className="max-w-[420px]">
                    <p className="eyebrow">{finlonexa.badge}</p>
                    <div className="mt-4 flex h-[58px] items-center">
                      <img
                        src={finlonexa.logo}
                        alt={`${finlonexa.name} logo`}
                        className="h-full w-auto max-w-[280px] object-contain"
                      />
                    </div>
                    <h2 className="mt-4 text-balance text-[30px] font-extrabold leading-tight text-navy sm:text-[36px]">
                      {finlonexa.headline[0]}
                      <span className="block text-gradient">
                        {finlonexa.headline[1]}
                      </span>
                    </h2>
                    <p className="mt-4 text-[17px] leading-relaxed text-muted">
                      {finlonexa.description}
                    </p>
                    <GradientButton
                      href={finlonexa.href}
                      target="_blank"
                      rel="noreferrer"
                      size="lg"
                      showArrow
                      className="mt-6"
                    >
                      {finlonexa.cta}
                    </GradientButton>
                  </Reveal>

                  <Reveal delay={0.1}>
                    <FinloNexaMockup stats={finlonexa.stats} />
                  </Reveal>
                </div>
              </div>
            </section>
          )}

          {/* FinloCRM overview strip */}
          {finlonexa && (
            <section className="mx-auto w-full max-w-[1520px] px-5 pb-12 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
              <Reveal>
                <div className="glass-strong rounded-[24px] p-5 shadow-card-lg sm:rounded-[26px] sm:p-7 lg:p-9">
                  <div className="grid items-center gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] xl:gap-10">
                    <div className="max-w-[420px]">
                      <span className="eyebrow">Inside FinloCRM</span>
                      <h2 className="mt-4 text-balance text-[30px] font-extrabold leading-tight text-navy sm:text-[36px]">
                        Every deal, pipeline, and customer in one place
                      </h2>
                      <p className="mt-4 text-[17px] leading-relaxed text-muted">
                        Leads, opportunities, revenue, and pipeline stages stay in
                        sync, so your team always knows exactly where each deal
                        stands.
                      </p>
                      <a
                        href={finlonexa.href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 inline-flex items-center gap-2 text-[15px] font-bold text-blue transition-colors hover:text-violet"
                      >
                        Visit crm.elvaveo.com
                        <ExternalLink
                          size={16}
                          aria-hidden="true"
                          className="transition-transform duration-200 group-hover:translate-x-1"
                        />
                      </a>
                    </div>
                    <div className="flex items-center">
                      <FinloNexaOverview />
                    </div>
                  </div>
                </div>
              </Reveal>
            </section>
          )}

          {/* Dynamic Products Showcase (CAMVIA and custom products from Admin) */}
          {otherProducts.map((prod) => (
            <section
              key={prod.id}
              id={prod.id}
              className="scroll-mt-24 mx-auto w-full max-w-[1520px] px-5 pb-12 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20"
            >
              <div className="glass rounded-[24px] p-5 shadow-card-lg sm:rounded-[26px] sm:p-7 lg:p-9">
                <div className="grid items-center gap-8 xl:grid-cols-[minmax(230px,0.9fr)_minmax(0,2.1fr)] xl:gap-10">
                  <Reveal className="max-w-[420px]">
                    <div className="flex items-center gap-2">
                      <span className="eyebrow">{prod.badge || "An ELVAVEO Product"}</span>
                      <span className="rounded-full bg-cyan/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-700">
                        {prod.category}
                      </span>
                    </div>

                    <div className="mt-4 flex h-[58px] items-center">
                      {prod.logo ? (
                        <img
                          src={prod.logo}
                          alt={`${prod.name} logo`}
                          className="h-full w-auto max-w-[280px] object-contain"
                        />
                      ) : (
                        <h3 className="text-[28px] font-black text-navy">{prod.name}</h3>
                      )}
                    </div>

                    <h2 className="mt-4 text-balance text-[30px] font-extrabold leading-tight text-navy sm:text-[36px]">
                      {prod.headline[0]}
                      {prod.headline[1] && (
                        <span className="block text-gradient">
                          {prod.headline[1]}
                        </span>
                      )}
                    </h2>

                    <p className="mt-4 text-[17px] leading-relaxed text-muted">
                      {prod.description}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
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
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue hover:text-violet"
                      >
                        <span>Visit {prod.name}</span>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </Reveal>

                  <Reveal delay={0.1}>
                    {prod.id === "camvia" ? (
                      <CamviaMockup stats={prod.stats} />
                    ) : (
                      <DynamicProductMockup product={prod} />
                    )}
                  </Reveal>
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
