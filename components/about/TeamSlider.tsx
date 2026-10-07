"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles } from "lucide-react";
import type { TeamMember } from "@/data/team";
import LeadershipCard from "@/components/about/LeadershipCard";

interface TeamSliderProps {
  members: TeamMember[];
  autoPlayInterval?: number; // default 3500ms
}

export default function TeamSlider({
  members,
  autoPlayInterval = 3500,
}: TeamSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Detect screen size for 2 cards per view (desktop) vs 1 card (mobile)
  useEffect(() => {
    const checkScreen = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const totalCards = members.length;
  // On desktop, 2 cards are visible, so max index is total - 2 (or total - 1 with wrap)
  const maxIndex = isDesktop ? Math.max(0, totalCards - 2) : totalCards - 1;

  // Next Slide handler
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  // Prev Slide handler
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // Autoplay timer
  useEffect(() => {
    if (isPaused || totalCards <= (isDesktop ? 2 : 1)) return;

    const timer = setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isPaused, handleNext, autoPlayInterval, totalCards, isDesktop]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;

    if (diff > 50) {
      // Swiped left -> next
      handleNext();
    } else if (diff < -50) {
      // Swiped right -> prev
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Ensure current index stays within valid bounds on resize
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  return (
    <div
      className="relative mx-auto w-full max-w-[1360px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Slider Navigation & Controls Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 px-2">
        {/* Status Counter Pill */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue/20 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue backdrop-blur-md shadow-xs">
            <Sparkles size={12} className="text-cyan" />
            <span>
              {String(currentIndex + 1).padStart(2, "0")} /{" "}
              {String(maxIndex + 1).padStart(2, "0")}
            </span>
          </span>
          <span className="text-[12px] font-medium text-muted hidden sm:inline">
            Slide to explore our team
          </span>
        </div>

        {/* Action Controls: Play/Pause + Arrows */}
        <div className="flex items-center gap-2.5">
          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            title={isPaused ? "Resume Auto-Slide" : "Pause Auto-Slide"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-blue/15 bg-white/70 text-muted shadow-sm transition hover:bg-white hover:text-blue backdrop-blur-md"
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
          </button>

          {/* Previous Arrow */}
          <button
            onClick={handlePrev}
            aria-label="Previous team slide"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white/80 text-navy shadow-card transition-all hover:-translate-x-0.5 hover:bg-white hover:text-blue active:scale-95 backdrop-blur-md"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Next Arrow */}
          <button
            onClick={handleNext}
            aria-label="Next team slide"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white/80 text-navy shadow-card transition-all hover:translate-x-0.5 hover:bg-white hover:text-blue active:scale-95 backdrop-blur-md"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Slider Viewport (Overflow Hidden) */}
      <div
        className="overflow-hidden py-2"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Sliding Track */}
        <div
          className="flex transition-transform duration-600 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{
            transform: `translateX(-${currentIndex * (isDesktop ? 50 : 100)}%)`,
          }}
        >
          {members.map((member, index) => (
            <div
              key={`${member.name}-${index}`}
              className="w-full shrink-0 px-2 sm:px-3 md:w-1/2"
            >
              <div className="h-full">
                <LeadershipCard variant="person" {...member} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Indicator Dots */}
      <div className="mt-8 flex items-center justify-center gap-2">
        {Array.from({ length: maxIndex + 1 }).map((_, idx) => {
          const isActive = currentIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Jump to slide ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                isActive
                  ? "w-8 bg-gradient-to-r from-cyan via-blue to-violet shadow-sm"
                  : "w-2.5 bg-blue/20 hover:bg-blue/40"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
