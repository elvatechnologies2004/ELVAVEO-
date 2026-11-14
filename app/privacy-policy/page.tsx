import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { createPageMetadata } from "@/lib/metadata";
import { getPublishedPrivacyPolicyVersion, getPublishedPrivacyPolicy } from "@/lib/dataStore";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "Learn how ELVAVEO handles website contact submissions, business inquiries, security, and related data practices.",
  path: "/privacy-policy",
});

export const dynamic = "force-dynamic";

export default async function PrivacyPolicyPage() {
  let document = null;
  try {
    document = await getPublishedPrivacyPolicy();
  } catch (err) {
    console.warn("[PrivacyPolicyPage] Failed to fetch published privacy policy:", err);
  }
  const published = getPublishedPrivacyPolicyVersion(document);

  const content = published?.content?.trim()
    ? published.content
    : `## Privacy Policy

ELVAVEO respects the privacy of visitors, clients, and business contacts. This policy explains the information we collect through the ELVAVEO website and how we use it.

## Information we collect

We may collect information you provide directly through the ELVAVEO website, including your name, email address, company, and message content when you contact us. We also automatically receive limited technical information such as browser type, operating system, referring page, and approximate usage data needed to keep the website secure and working correctly.

## How we use information

We use the information we collect to respond to inquiries, manage business conversations, provide services, improve the website, and maintain the security of our systems. We do not sell personal data.

## Cookies and analytics

Our site may use basic cookies or session tools that are necessary for basic site operation and security. If non-essential analytics or advertising tools are introduced in the future, we will update this policy and provide appropriate notice and consent controls before activating them for visitors.

## Sharing and third parties

We may share information with trusted service providers that help us operate our site, send email, or support business workflows. We limit sharing to what is necessary for those services and require reasonable safeguards. We may also disclose information when required by law, court order, or to protect legal rights and safety.

## Retention

We retain information only as long as needed to fulfill the purpose for which it was collected, to satisfy legal obligations, to resolve disputes, and to enforce agreements.

## Your rights and contact

You can contact us at hello@elvaveo.com to ask for access, correction, or deletion of personal data you have submitted through our website, to the extent applicable under applicable law. We will review requests in good faith and respond as required by law.

## Updates

This policy may be updated from time to time to reflect changes in our services, legal requirements, or operational practices. The most current version is the version published on this page.`;

  const formattedContent = content
    .replace(/^## /gm, "\n## ")
    .replace(/^### /gm, "\n### ")
    .trim();

  return (
    <>
      <Navbar />
      <main id="main" className="bg-ice text-navy">
        <section className="mx-auto max-w-5xl px-5 pb-16 pt-12 sm:px-8 lg:px-10 lg:pt-20">
          <div className="rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-card backdrop-blur-xl sm:p-8 lg:p-12">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue">
                  ELVAVEO
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">
                  {published?.title || "Privacy Policy"}
                </h1>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan via-blue to-violet px-4 py-2 text-[12px] font-bold text-white shadow-md transition hover:opacity-95"
              >
                Contact us
              </Link>
            </div>

            <p className="mb-8 max-w-3xl text-[15px] leading-7 text-muted">
              {published?.summary ||
                "This notice explains what ELVAVEO collects through its website and how we handle business and contact information in a responsible, limited, and transparent way."}
            </p>

            <div className="prose prose-slate max-w-none text-[15px] leading-8 text-navy prose-headings:font-bold prose-headings:text-navy prose-p:leading-8 prose-a:text-blue prose-a:no-underline hover:prose-a:text-blue/80 prose-strong:text-navy">
              {formattedContent.split(/\n(?=## )/).map((section) => {
                const lines = section.trim();
                if (!lines) return null;
                return (
                  <div key={section.slice(0, 30)} className="mb-8 last:mb-0">
                    <div className="markdown-content whitespace-pre-line">{lines}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 rounded-2xl border border-blue/10 bg-ice/80 p-5">
              <h2 className="text-lg font-bold text-navy">Questions or requests</h2>
              <p className="mt-2 text-[14px] leading-7 text-muted">
                If you want to ask about personal information collected through our website, request an update,
                or exercise a privacy right available under applicable law, contact us at {" "}
                <a href="mailto:hello@elvaveo.com" className="font-semibold text-blue hover:text-blue/80">
                  hello@elvaveo.com
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
