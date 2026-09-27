import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import Image from "next/image";
import { Handshake, Mail, MailOpen, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GradientButton from "@/components/GradientButton";
import Reveal from "@/components/Reveal";
import ContactForm from "@/components/forms/ContactForm";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from "@/components/icons/SocialIcons";
import { socialLinks } from "@/data/navigation";
import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description:
    "Get in touch with ELVAVEO about a new project, a product, or a partnership. Tell us what you are building.",
  path: "/contact",
});

/** Brand glyph per social label, kept in step with `socialLinks`. */
const socialIconByLabel = {
  LinkedIn: LinkedInIcon,
  X: XIcon,
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
} as const;

/** "https://x.com/ELVAVEO" -> "x.com/ELVAVEO", for the card action line. */
function channelHandle(href: string) {
  return href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

const channels: {
  title: string;
  description: string;
  href: string;
  action: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  {
    title: "Email",
    description: "The fastest way to reach us. We read every message.",
    href: `mailto:${CONTACT_EMAIL}`,
    action: CONTACT_EMAIL,
    Icon: Mail,
  },
  ...socialLinks.map(({ label, href }) => ({
    title: label,
    description: `Follow ELVAVEO on ${label}.`,
    href,
    action: channelHandle(href),
    Icon: socialIconByLabel[label as keyof typeof socialIconByLabel],
  })),
];

const steps: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Send,
    title: "Send the details",
    description:
      "Share what you are building, the problem it solves, and any timeline you have in mind.",
  },
  {
    icon: MailOpen,
    title: "We reply by email",
    description:
      "You will hear back from a person at ELVAVEO with a real answer, not an auto-response.",
  },
  {
    icon: Handshake,
    title: "We agree on scope",
    description:
      "If it looks like a fit, we agree on scope, timeline, and next steps together.",
  },
];

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="overflow-hidden bg-ice">
        {/* ============ HERO ============ */}
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
              <div className="w-full xl:w-[70%]">
                <p className="eyebrow text-[11px] sm:text-xs">
                  Contact&nbsp;•&nbsp;Let&apos;s&nbsp;Talk&nbsp;•&nbsp;Start&nbsp;a&nbsp;Project
                </p>

                <h1 className="mt-[clamp(22px,4vh,30px)] text-balance text-[38px] font-extrabold leading-[1.04] text-navy sm:text-[56px] xl:text-[60px] 2xl:text-[68px]">
                  Let&apos;s Build Something
                  <span className="block text-gradient">Together</span>
                </h1>

                <p className="mt-5 max-w-[580px] text-[17px] leading-relaxed text-muted sm:text-lg">
                  Have an idea, a product, or a business challenge? Tell us what
                  you are building and ELVAVEO will help turn it into a real,
                  working digital product.
                </p>

                <div className="mt-[clamp(24px,4.5vh,32px)] flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <GradientButton
                    href="#message"
                    size="lg"
                    showArrow
                    className="w-full sm:w-auto"
                  >
                    Send a Message
                  </GradientButton>
                  <GradientButton
                    href={`mailto:${CONTACT_EMAIL}?subject=Start%20a%20Project`}
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <Mail size={16} className="text-blue" aria-hidden="true" />
                    Email Us
                  </GradientButton>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <div className="relative bg-[url('/images/background-02.png')] bg-cover bg-center">
          {/* ============ REACH US ============ */}
          <section className="mx-auto w-full max-w-[1520px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <SectionHeading
              eyebrow="Reach Us"
              title="Pick the channel that suits you"
            />

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {channels.map(({ Icon, title, description, href, action }, index) => (
                <Reveal key={title} delay={index * 0.06}>
                  <a
                    href={href}
                    {...(href.startsWith("mailto:")
                      ? {}
                      : { target: "_blank", rel: "noreferrer" })}
                    className="glass group flex h-full flex-col rounded-[20px] p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-blue/30 hover:bg-white/90"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/80 bg-gradient-to-br from-white to-blue/10 text-blue shadow-sm">
                      <Icon className="h-[19px] w-[19px]" />
                    </span>
                    <h3 className="mt-4 text-[17px] font-bold leading-snug text-navy">
                      {title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted">
                      {description}
                    </p>
                    <span className="mt-4 break-words text-[13px] font-semibold text-blue">
                      {action}
                    </span>
                  </a>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ============ MESSAGE FORM ============ */}
          <section
            id="message"
            className="scroll-mt-24 border-y border-white/55 bg-white/20"
          >
            <div className="mx-auto grid w-full max-w-[1520px] items-start gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-12 lg:py-24">
              <Reveal>
                <div>
                  <p className="eyebrow">Send a Message</p>
                  <h2 className="mt-5 text-balance text-[32px] font-extrabold leading-tight text-navy sm:text-[42px]">
                    Tell us about your <span className="text-gradient">idea</span>
                  </h2>
                  <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-muted sm:text-[17px]">
                    Share a few details and we will get back to you by email. The
                    more context you give, the more useful our first reply will
                    be.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.12}>
                <div className="glass rounded-[22px] p-6 shadow-card-lg sm:p-8">
                  <ContactForm />
                </div>
              </Reveal>
            </div>
          </section>

          {/* ============ WHAT HAPPENS NEXT ============ */}
          <section className="mx-auto w-full max-w-[1520px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <SectionHeading
              eyebrow="What Happens Next"
              title="A simple, human process"
            />

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {steps.map(({ icon: Icon, title, description }, index) => (
                <Reveal key={title} delay={index * 0.07}>
                  <article className="glass group relative h-full overflow-hidden rounded-[20px] p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-blue/30 hover:bg-white/90 sm:p-7">
                    <div
                      className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-cyan/20 to-violet/20 blur-2xl"
                      aria-hidden="true"
                    />
                    <div className="relative">
                      <span className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/80 bg-gradient-to-br from-white to-blue/10 text-blue shadow-sm">
                        <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
                      </span>
                      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-blue">
                        Step {index + 1}
                      </p>
                      <h3 className="mt-1.5 text-[18px] font-bold leading-snug text-navy">
                        {title}
                      </h3>
                      <p className="mt-2 text-[14px] leading-relaxed text-muted">
                        {description}
                      </p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ============ FINAL CTA ============ */}
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
                      href={`mailto:${CONTACT_EMAIL}?subject=Start%20a%20Project`}
                      size="lg"
                      showArrow
                      className="w-full sm:w-auto"
                    >
                      Get Started
                    </GradientButton>
                    <GradientButton
                      href={`mailto:${CONTACT_EMAIL}`}
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
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

/* ------------------------------------------------------------------ *
 * Local presentational helper (mirrors the About page)
 * ------------------------------------------------------------------ */

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mx-auto max-w-[760px] text-center">
      <p className="eyebrow justify-center">{eyebrow}</p>
      <h2 className="mt-4 text-balance text-[32px] font-extrabold leading-tight text-navy sm:text-[42px]">
        {title}
      </h2>
    </div>
  );
}
