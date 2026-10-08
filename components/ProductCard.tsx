import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/data/products";
import FinloDashboardScreenshot from "./products/FinloDashboardScreenshot";
import { cn } from "@/lib/cn";

interface ProductCardProps {
  product: Product;
}

/**
 * Product showcase card. Finlo renders a compact SaaS dashboard on the RIGHT
 * side (copy on the left); FinloCRM is copy-only. Card padding and outer
 * dimensions stay unchanged.
 */
export default function ProductCard({ product }: ProductCardProps) {
  const isFinlo = product.id === "finlo";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-white/70 bg-gradient-to-b from-white/75 via-white/55 to-white/35 shadow-[0_10px_30px_-16px_rgba(42,83,150,0.3)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(42,83,150,0.45)]">
      <div
        className={cn(
          "grid gap-[14px] p-3.5 sm:p-5 md:gap-4 lg:p-6",
          isFinlo && "items-center xl:grid-cols-[0.5fr_0.5fr]"
        )}
      >
        {/* Copy */}
        <div className="flex flex-col self-stretch">
          <div className="flex flex-wrap items-center gap-3">
            <Image
              src={product.logo}
              alt={`${product.name} logo`}
              width={isFinlo ? 286 : 151}
              height={isFinlo ? 114 : 40}
              sizes="200px"
              className={cn(
                "object-contain",
                isFinlo
                  ? "mt-0 h-10 w-auto sm:h-12 xl:mt-[30px] xl:h-[58px]"
                  : "h-9 w-auto sm:h-10"
              )}
            />
          </div>

          <div className="flex flex-1 flex-col justify-center">
            <p className="mt-3 max-w-[460px] text-[15px] leading-relaxed text-muted sm:text-[16px] xl:text-[17px]">
              {product.description}
            </p>

            <Link
              href={product.href || "#"}
              target={product.href?.startsWith("http") ? "_blank" : undefined}
              rel={product.href?.startsWith("http") ? "noreferrer" : undefined}
              className="group/link mt-[14px] inline-flex w-fit items-center gap-2 text-[14px] font-bold text-blue transition-colors hover:text-violet focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue sm:text-[15px]"
              aria-label={`${product.name} — ${product.cta}`}
            >
              {product.cta}
              <ArrowRight
                size={17}
                aria-hidden="true"
                className="transition-transform duration-200 group-hover/link:translate-x-1"
              />
            </Link>
          </div>
        </div>

        {/* Finlo — dashboard on the right side */}
        {isFinlo && (
          <div>
            <FinloDashboardScreenshot />
          </div>
        )}
      </div>
    </article>
  );
}