import {
  Layers,
  Cpu,
  Sparkles,
  BarChart2,
  Globe,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import type { Product } from "@/data/products";

export default function DynamicProductMockup({ product }: { product: Product }) {
  const displayUrl = (product.href || "elvaveo.com").replace(/^https?:\/\//, "");

  return (
    <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-line bg-white shadow-card-lg transition-transform hover:-translate-y-0.5">
      {/* Browser Chrome Header */}
      <div className="flex items-center gap-2 border-b border-line bg-ice/70 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-[#fca5a5]" />
        <span className="h-2 w-2 rounded-full bg-[#fcd34d]" />
        <span className="h-2 w-2 rounded-full bg-[#86efac]" />
        <span className="ml-1.5 flex-1 truncate rounded-full bg-white px-3 py-0.5 text-center text-[9.5px] font-medium text-muted ring-1 ring-line">
          {displayUrl}
        </span>
      </div>

      <div className="flex">
        {/* Sidebar Rail */}
        <div className="hidden w-10 flex-col items-center gap-1.5 border-r border-line bg-ice/50 py-2.5 sm:flex">
          {[Layers, Cpu, Sparkles, BarChart2].map((Icon, i) => (
            <span
              key={i}
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                i === 0
                  ? "bg-gradient-to-r from-cyan via-blue to-violet text-white shadow-xs"
                  : "text-muted hover:text-navy"
              }`}
            >
              <Icon size={13} strokeWidth={2} aria-hidden="true" />
            </span>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-2.5 sm:p-3">
          {/* Header row */}
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-navy">
                {product.name || "Product"} Cloud Platform
              </p>
              <p className="text-[9px] text-muted">{product.category || "AI & Software"} • Live Enterprise Suite</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue/10 px-2 py-0.5 text-[8.5px] font-bold text-blue">
              <ShieldCheck size={9} />
              Production
            </span>
          </div>

          {/* Stat Tiles */}
          <div className="grid grid-cols-2 gap-1.5">
            {(product.stats || []).map((s, idx) => (
              <div
                key={s.label || idx}
                className="rounded-xl border border-line bg-white p-2 shadow-[0_6px_18px_-14px_rgba(8,27,61,0.3)]"
              >
                <p className="text-[8.5px] font-semibold uppercase tracking-wide text-muted truncate">
                  {s.label}
                </p>
                <p className="mt-0.5 text-[14px] font-extrabold tracking-tight text-navy truncate">
                  {s.value}
                </p>
                {s.trend && (
                  <p className="text-[7.5px] font-bold text-emerald-600">
                    {s.trend}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Live System Banner */}
          <div className="mt-1.5 rounded-xl border border-blue/15 bg-gradient-to-r from-blue/5 to-cyan/5 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-blue" />
                <p className="text-[9.5px] font-bold text-navy">
                  Integrated ELVAVEO Technology
                </p>
              </div>
              <span className="text-[8px] font-bold text-emerald-600">99.9% Uptime</span>
            </div>
            <p className="mt-1 text-[8.5px] leading-relaxed text-muted line-clamp-2">
              {product.description || "Proprietary ELVAVEO platform solution engineered for scalability."}
            </p>
          </div>

          {/* Live Link action */}
          <div className="mt-1.5 flex items-center justify-between rounded-xl border border-line bg-white px-2.5 py-1.5">
            <span className="flex items-center gap-1.5 text-[9.5px] font-bold text-navy">
              <Globe size={11} className="text-blue" />
              <span>{displayUrl}</span>
            </span>
            <a
              href={product.href || "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[8.5px] font-bold text-blue hover:text-violet"
            >
              <span>Visit Portal</span>
              <ArrowUpRight size={10} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
