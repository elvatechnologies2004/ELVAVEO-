"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { navItems } from "@/data/navigation";
import GradientButton from "@/components/GradientButton";
import { cn } from "@/lib/cn";
import { BRAND_LOGO } from "@/lib/constants";

/**
 * Top navigation — soft glass bar, ~72px tall, underline on the active page.
 */

/** Routes that render their own in-page contact section. */
const routesWithContactSection = new Set(["/", "/services", "/projects"]);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState<string>("");
  const pathname = usePathname();
  // Pages without their own contact block send people to the dedicated route.
  const contactHref = routesWithContactSection.has(pathname) ? "#contact" : "/contact";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" && !hash;
    if (href.startsWith("/#")) return pathname === "/" && hash === href.slice(1);
    return pathname === href;
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-line bg-white/70 shadow-[0_1px_0_rgba(133,166,225,0.2)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-[64px] w-full max-w-[1520px] items-center justify-between px-5 sm:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6 lg:px-12">
        {/* Logo */}
        <Link
          href="/"
          aria-label="ELVAVEO home"
          className="flex shrink-0 items-center justify-self-start"
        >
          <Image
            src={BRAND_LOGO}
            alt="ELVAVEO"
            width={142}
            height={52}
            priority
            sizes="142px"
            className="h-[44px] w-auto object-contain sm:h-[52px]"
          />
        </Link>

        {/* Desktop navigation */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-0.5 lg:flex lg:justify-self-center"
        >
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors hover:text-blue",
                  active ? "text-blue" : "text-navy/80"
                )}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-4 -bottom-px h-[2px] rounded-full bg-gradient-main"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3 lg:justify-self-end">
          <GradientButton href={contactHref} className="hidden lg:inline-flex">
            Get Started
          </GradientButton>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/40 text-navy backdrop-blur-xl transition-colors hover:bg-white/70 hover:text-blue lg:hidden"
          >
            {open ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <Menu size={20} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-b border-line bg-white/95 backdrop-blur-xl lg:hidden"
          >
            <div className="max-h-[calc(100dvh-64px)] space-y-1 overflow-y-auto px-5 py-5 sm:px-8">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-xl px-4 py-3 text-[15px] font-medium transition-colors",
                      active
                        ? "bg-blue/10 text-blue"
                        : "text-navy hover:bg-ice hover:text-blue"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="flex items-center gap-3 pt-3">
                <GradientButton
                  href={contactHref}
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Get Started
                </GradientButton>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
