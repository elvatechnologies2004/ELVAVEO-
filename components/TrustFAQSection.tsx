import { Plus, Quote } from "lucide-react";
import Reveal from "./Reveal";

const testimonials = [
  {
    initials: "AM",
    name: "Alex Morgan",
    role: "Founder, SaaS Company",
    quote:
      "ELVAVEO delivered a clean and scalable product experience for our business.",
  },
  {
    initials: "PS",
    name: "Priya Shah",
    role: "Operations Lead, Growing Team",
    quote:
      "Professional design, smooth communication, and high-quality execution.",
  },
  {
    initials: "JL",
    name: "Jordan Lee",
    role: "Founder, Digital Startup",
    quote:
      "Their team helped transform our idea into a polished digital solution.",
  },
];

const faqs = [
  {
    question: "What services does ELVAVEO offer?",
    answer:
      "We provide web and mobile development, UI/UX design, cloud and DevOps, and digital consulting.",
  },
  {
    question: "Do you build custom software products?",
    answer:
      "Yes. We plan and build custom digital products and software around your users, workflows, and business goals.",
  },
  {
    question: "Can you help with UI/UX and product design?",
    answer:
      "Yes. We can help shape the product experience, from early discovery and user flows through interface design and prototyping.",
  },
  {
    question: "Do you provide post-launch support?",
    answer:
      "Yes. We can continue supporting your product with maintenance, improvements, and technical guidance after launch.",
  },
];

export default function TrustFAQSection() {
  return (
    <section className="w-full py-8 lg:py-10">
      <div className="mx-auto grid w-full max-w-[1520px] gap-12 px-5 sm:px-8 lg:gap-14 lg:px-12">
        <Reveal>
          <div>
            <div className="mb-6 flex flex-col gap-2 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow text-[10.5px]">Client Feedback</p>
                <h2 className="mt-2 text-[25px] font-extrabold leading-tight text-navy sm:text-[30px]">
                  Good work speaks for itself
                </h2>
              </div>
              <p className="max-w-md text-[14px] leading-relaxed text-muted">
                Thoughtful collaboration, dependable delivery, and digital
                products built to grow.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <article
                  key={testimonial.name}
                  className="flex min-h-[220px] flex-col rounded-[18px] border border-white/80 bg-white/65 p-5 shadow-[0_14px_34px_-22px_rgba(42,83,150,0.35)] backdrop-blur-xl sm:p-6"
                >
                  <Quote size={20} className="text-blue/70" aria-hidden="true" />
                  <p className="mt-4 flex-1 text-[15px] font-medium leading-relaxed text-navy">
                    “{testimonial.quote}”
                  </p>
                  <div className="mt-5 flex items-center gap-3 border-t border-line/70 pt-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white bg-gradient-to-br from-sky-100 to-blue-100 text-[12px] font-bold text-blue shadow-sm">
                      {testimonial.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-navy">
                        {testimonial.name}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-muted">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div>
            <div className="mb-6">
              <p className="eyebrow text-[10.5px]">FAQ</p>
              <h2 className="mt-2 text-[25px] font-extrabold leading-tight text-navy sm:text-[30px]">
                A few things you may be wondering
              </h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-[16px] border border-white/80 bg-white/60 p-5 shadow-[0_10px_28px_-22px_rgba(42,83,150,0.4)] backdrop-blur-xl open:bg-white/75 sm:p-5"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-[14px] font-bold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <Plus
                      size={18}
                      className="shrink-0 text-blue transition-transform duration-200 group-open:rotate-45"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="mt-3 max-w-2xl pr-7 text-[13px] leading-relaxed text-muted">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}