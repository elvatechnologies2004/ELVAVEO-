import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { navItems, productLinks, siteUrl, socialLinks } from "@/data/navigation";
import { services } from "@/data/services";
import { BRAND_LOGO, CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from "@/components/icons/SocialIcons";

const socialIcons = {
  linkedin: LinkedInIcon,
  x: XIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
};

/** Services all live on one page now, so they link to it directly. */
const serviceLinks = services.map((service) => ({
  label: service.title,
  href: "/services",
}));

/**
 * Glass site footer with navigation, products, services, and contact links.
 */
export default function Footer() {
  // Rendered on the server, so the year is always current without hydration
  // drift between server and client.
  const year = new Date().getFullYear();

  return (
    <footer className="w-full px-5 pb-5 pt-2 sm:px-8 lg:px-12 lg:pb-8">
      <div className="mx-auto w-full max-w-[1520px]">
        <div className="rounded-[24px] border border-white/80 bg-white/70 p-6 shadow-card backdrop-blur-2xl sm:p-8 lg:p-10">
          <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_0.9fr_1.2fr_0.9fr]">
            <div>
              <Link href="/" aria-label={`${SITE_NAME} home`} className="inline-flex">
                <Image
                  src={BRAND_LOGO}
                  alt={SITE_NAME}
                  width={130}
                  height={49}
                  sizes="130px"
                  className="h-[46px] w-auto object-contain"
                />
              </Link>
              <p className="mt-3 max-w-[300px] text-[13px] leading-relaxed text-muted">
                ELVAVEO builds digital products, software solutions, and
                business-driven experiences for a brighter tomorrow.
              </p>
            </div>

            <FooterLinkColumn title="Quick Links" links={navItems} />
            <FooterLinkColumn title="Products" links={productLinks} external />
            <FooterLinkColumn title="Services" links={serviceLinks} />

            <div>
              <h2 className="text-[12px] font-bold uppercase text-navy">
                Connect
              </h2>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-4 block break-words text-[13px] text-muted transition-colors hover:text-blue"
              >
                {CONTACT_EMAIL}
              </a>
              <a
                href={siteUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[13px] text-muted transition-colors hover:text-blue"
              >
                elvaveo.com
                <ArrowUpRight size={13} aria-hidden="true" />
              </a>
              <ul className="mt-4 flex items-center gap-2">
                {socialLinks.map(({ label, href, ariaLabel, icon }) => {
                  const Icon = socialIcons[icon];
                  return (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={ariaLabel}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/55 text-muted shadow-sm transition-colors hover:text-blue"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-col items-center justify-between gap-3 rounded-[16px] border border-white/75 bg-white/60 px-5 py-3.5 backdrop-blur-xl sm:flex-row sm:px-6">
          <p className="text-[12px] text-navy/70">
            &copy; {year} {SITE_NAME}. All rights reserved.
          </p>
          <a
            href="#main"
            className="inline-flex items-center gap-1 text-[12px] text-navy/70 transition-colors hover:text-blue"
          >
            Back to top <ArrowUp size={13} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkColumn({
  title,
  links,
  external = false,
}: {
  title: string;
  links: { label: string; href: string }[];
  external?: boolean;
}) {
  return (
    <nav aria-label={title}>
      <h2 className="text-[12px] font-bold uppercase text-navy">
        {title}
      </h2>
      <ul className="mt-4 grid gap-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              {...(external
                ? { target: "_blank", rel: "noreferrer" }
                : undefined)}
              className="text-[13px] leading-snug text-muted transition-colors hover:text-blue"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
