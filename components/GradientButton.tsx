import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type GradientButtonVariant = "primary" | "white" | "outline" | "ghost";
type GradientButtonSize = "sm" | "md" | "lg";

interface GradientButtonProps {
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: GradientButtonVariant;
  size?: GradientButtonSize;
  showArrow?: boolean;
  className?: string;
  ariaLabel?: string;
  /** Optional link target, e.g. "_blank" for external product sites. */
  target?: "_blank" | "_self";
  /** Optional link rel. Defaults to "noreferrer" when target is "_blank". */
  rel?: string;
  /** Disables the button and dims it. Ignored on links. */
  disabled?: boolean;
  children: ReactNode;
}

const sizeClasses: Record<GradientButtonSize, string> = {
  sm: "px-6 py-2.5 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-3.5 text-[15px]",
};

const variantClasses: Record<GradientButtonVariant, string> = {
  primary:
    "border border-white/80 bg-gradient-to-b from-white/90 via-white/60 to-white/40 text-navy shadow-[0_10px_26px_-14px_rgba(53,109,255,0.5),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl hover:from-white hover:via-white/75 hover:to-white/55 hover:shadow-[0_16px_34px_-14px_rgba(53,109,255,0.6),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-0.5",
  white:
    "border border-white/80 bg-gradient-to-b from-white/90 via-white/60 to-white/40 text-navy shadow-[0_10px_26px_-16px_rgba(8,27,61,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl hover:-translate-y-0.5 hover:from-white hover:via-white/75 hover:to-white/55 hover:shadow-[0_16px_34px_-18px_rgba(8,27,61,0.4),inset_0_1px_0_rgba(255,255,255,0.9)]",
  outline:
    "border border-white/80 bg-gradient-to-b from-white/70 via-white/40 to-white/25 text-navy backdrop-blur-xl hover:border-blue/40 hover:from-white hover:via-white/65 hover:to-white/45",
  ghost:
    "border border-white/50 bg-white/25 text-white backdrop-blur-xl hover:border-white/75 hover:bg-white/40",
};

/**
 * Shared action button. Renders a <Link> when `href` is provided,
 * otherwise a <button> — so interactivity and accessibility stay correct.
 */
export default function GradientButton({
  href,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  showArrow = false,
  className,
  ariaLabel,
  target,
  rel,
  disabled = false,
  children,
}: GradientButtonProps) {
  const classes = cn(
    "group inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold leading-none transition-all duration-200 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
    sizeClasses[size],
    variantClasses[variant],
    disabled && "pointer-events-none cursor-not-allowed opacity-60",
    className
  );

  const inner = (
    <>
      <span className="inline-flex items-center gap-2">{children}</span>
      {showArrow && (
        <ArrowRight
          size={16}
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-label={ariaLabel}
        target={target}
        rel={rel ?? (target === "_blank" ? "noreferrer" : undefined)}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={classes}
      aria-label={ariaLabel}
      disabled={disabled}
      aria-busy={disabled || undefined}
    >
      {inner}
    </button>
  );
}