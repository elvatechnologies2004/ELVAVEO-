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
import { products } from "@/data/products";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/constants";

export const metadata: Metadata = createPageMetadata({
  title: "Products",
  description:
    "Explore the ELVAVEO product lineup — Finlo for personal finance and FinloNexa CRM for managing leads, customers, and sales workflows.",
  path: "/products",
});

const [finlo, finlonexa] = products;

export default function ProductsPage() {
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

          <div className="mx-auto flex w-full max-w-[1520px] flex-col justify-center px-5 pt-[clamp(101px,18.24vh,181px)] pb-[clamp(73px,11.4vh,141px)] sm:px-8 lg:min-h-[101vh] lg:px-12">
            <Reveal>
              <div className="w-full xl:w-[70%]">
                <p className="eyebrow text-[11px] sm:text-xs">Our Products</p>
                <h1 className="mt-[clamp(22px,4vh,30px)] text-balance text-[38px] font-extrabold leading-[1.04] text-navy sm:text-[56px] xl:text-[60px] 2xl:text-[68px]">
                  Software We Build
                  <span className="block text-gradient">and Run Ourselves</span>
                </h1>
                <p className="mt-5 max-w-[580px] text-[17px] leading-relaxed text-muted sm:text-lg">
                  {SITE_DESCRIPTION} Every product is designed, engineered, and
                  improved in-house.
                </p>
                <div className="mt-[clamp(24px,4.5vh,32px)] flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <GradientButton
                    href={finlo.href}
                    target="_blank"
                    rel="noreferrer"
                    size="lg"
                    showArrow
                    className="w-full sm:w-auto"
                  >
                    Open Finlo
                  </GradientButton>
                  <GradientButton
                    href={finlonexa.href}
                    target="_blank"
                    rel="noreferrer"
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Open FinloNexa CRM
                  </GradientButton>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <div className="relative bg-[url('/images/background-02.png')] bg-cover bg-center">
          {/* Finlo */}
          <section
            id="finlo"
            className="scroll-mt-24 mx-auto w-full max-w-[1520px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20"
          >
            <div className="glass rounded-[24px] p-5 shadow-card-lg sm:rounded-[26px] sm:p-7 lg:p-9">
              <div className="grid items-center gap-8 xl:grid-cols-[minmax(230px,0.9fr)_minmax(0,2.1fr)] xl:gap-10">
                <Reveal className="max-w-[420px]">
                  <p className="eyebrow">{finlo.badge}</p>
                  <Image
                    src={finlo.logo}
                    alt="Finlo logo"
                    width={286}
                    height={114}
                    sizes="200px"
                    className="mt-4 h-[58px] w-auto object-contain"
                  />
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

          {/* FinloNexa CRM */}
          <section
            id="finlonexa"
            className="scroll-mt-24 mx-auto w-full max-w-[1520px] px-5 pb-12 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20"
          >
            <div className="glass rounded-[24px] p-5 shadow-card-lg sm:rounded-[26px] sm:p-7 lg:p-9">
              <div className="grid items-center gap-8 xl:grid-cols-[minmax(230px,0.9fr)_minmax(0,2.1fr)] xl:gap-10">
                <Reveal className="max-w-[420px]">
                  <p className="eyebrow">{finlonexa.badge}</p>
                  <Image
                    src={finlonexa.logo}
                    alt="FinloNexa CRM logo"
                    width={286}
                    height={114}
                    sizes="200px"
                    className="mt-4 h-[58px] w-auto object-contain"
                  />
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

          {/* FinloNexa overview strip */}
          <section className="mx-auto w-full max-w-[1520px] px-5 pb-12 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
            <Reveal>
              <div className="glass-strong rounded-[24px] p-5 shadow-card-lg sm:rounded-[26px] sm:p-7 lg:p-9">
                <div className="grid items-center gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] xl:gap-10">
                  <div className="max-w-[420px]">
                    <span className="eyebrow">Inside FinloNexa</span>
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
        </div>
      </main>
      <Footer />
    </>
  );
}
