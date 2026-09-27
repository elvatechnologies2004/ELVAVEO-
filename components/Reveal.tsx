"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds to wait before animating (for staggered lists) */
  delay?: number;
  /** Initial vertical offset in px */
  y?: number;
}

/**
 * Subtle fade-up when the element scrolls into view.
 *
 * Implemented with a plain IntersectionObserver driven by useEffect + state,
 * instead of framer-motion's `whileInView`, so no state update can fire
 * before the component has mounted (avoids the React "state update on a
 * component that hasn't mounted yet" warning at page load).
 * Respects the user's reduced-motion preference.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion: reveal instantly, no animation.
    if (reduceRef.current) {
      setVisible(true);
      return;
    }

    // IntersectionObserver unavailable: show content right away.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "-70px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? undefined : `translate3d(0, ${y}px, 0)`,
    transition: `opacity 0.55s ease-out ${delay}s, transform 0.55s ease-out ${delay}s`,
  };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}