import GradientButton from "./GradientButton";
import Reveal from "./Reveal";
import { CONTACT_EMAIL } from "@/lib/constants";

/**
 * Light glass call-to-action panel above the footer.
 */
export default function CTASection() {
  return (
    <section id="contact" className="scroll-mt-24 pb-8 pt-8 lg:pb-10 lg:pt-10">
      <div className="mx-auto w-full max-w-[1520px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <div className="rounded-[24px] border border-white/80 bg-gradient-to-br from-white/85 via-sky-100/70 to-blue-100/60 px-5 py-8 text-center shadow-card-lg backdrop-blur-2xl sm:px-10 sm:py-12 lg:px-16 lg:py-14">
            <p className="eyebrow justify-center text-[10.5px]">Let&apos;s Build Together</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-balance text-[26px] min-[400px]:text-[30px] font-extrabold leading-tight text-navy sm:text-[38px] lg:text-[44px]">
              Let&apos;s Build Something Great Together
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-[15px] leading-relaxed text-muted sm:text-[17px]">
              Have an idea, product, or business challenge? ELVAVEO helps turn
              ideas into modern digital products and scalable software solutions.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <GradientButton
                href={`mailto:${CONTACT_EMAIL}?subject=Start%20a%20Project`}
                variant="primary"
                size="lg"
                showArrow
                ariaLabel="Start a project with ELVAVEO"
                className="w-full sm:w-auto"
              >
                Start a Project
              </GradientButton>
              <GradientButton
                href={`mailto:${CONTACT_EMAIL}`}
                variant="outline"
                size="lg"
                ariaLabel="Contact ELVAVEO"
                className="w-full sm:w-auto"
              >
                Contact Us
              </GradientButton>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
