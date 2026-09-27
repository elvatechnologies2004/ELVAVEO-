import { LayoutGrid, Users, Target, DollarSign, Settings } from "lucide-react";
import type { ProductStat } from "@/data/products";

/**
 * FinloNexa CRM desktop-window mockup — demo dashboard.
 * All values are placeholder demo data from data/products.ts.
 */
export default function FinloNexaMockup({ stats }: { stats: ProductStat[] }) {
  const pipeline = [
    { label: "Lead", width: "34%", tone: "from-cyan to-sky-400" },
    { label: "Qualified", width: "26%", tone: "from-blue to-indigo-400" },
    { label: "Proposal", width: "20%", tone: "from-violet to-purple-400" },
    { label: "Won", width: "20%", tone: "from-fuchsia to-violet" },
  ];

  return (
    <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-line bg-white shadow-card-lg">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-line bg-ice/70 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-[#fca5a5]" />
        <span className="h-2 w-2 rounded-full bg-[#fcd34d]" />
        <span className="h-2 w-2 rounded-full bg-[#86efac]" />
        <span className="ml-1.5 flex-1 truncate rounded-full bg-white px-3 py-0.5 text-center text-[9.5px] font-medium text-muted ring-1 ring-line">
          app.finlonexa.com
        </span>
      </div>

      <div className="flex">
        {/* sidebar rail */}
        <div className="hidden w-10 flex-col items-center gap-1.5 border-r border-line bg-ice/50 py-2.5 sm:flex">
          {[LayoutGrid, Users, Target, DollarSign, Settings].map((Icon, i) => (
            <span
              key={i}
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                i === 0 ? "bg-gradient-main text-white" : "text-muted hover:text-navy"
              }`}
            >
              <Icon size={13} strokeWidth={2} aria-hidden="true" />
            </span>
          ))}
        </div>

        {/* main content */}
        <div className="flex-1 p-2.5 sm:p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-navy">Sales Overview</p>
              <p className="text-[9px] text-muted">Good morning, Alex!</p>
            </div>
            <span className="rounded-full bg-violet/10 px-2 py-0.5 text-[8.5px] font-bold text-violet">
              Live
            </span>
          </div>

          {/* stat tiles */}
          <div className="grid grid-cols-2 gap-1.5">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-line bg-white p-2 shadow-[0_6px_18px_-14px_rgba(8,27,61,0.3)]"
              >
                <p className="text-[8.5px] font-semibold uppercase tracking-wide text-muted">
                  {s.label}
                </p>
                <p className="mt-0.5 text-[14px] font-extrabold tracking-tight text-navy">
                  {s.value}
                </p>
                {s.trend && (
                  <p className="text-[7.5px] font-bold text-emerald-500">{s.trend}</p>
                )}
              </div>
            ))}
          </div>

          {/* pipeline */}
          <div className="mt-1.5 rounded-xl border border-line bg-white p-2">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[9.5px] font-bold text-navy">Sales Pipeline</p>
              <span className="text-[8.5px] font-semibold text-muted">4 stages</span>
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-ice">
              {pipeline.map((stage) => (
                <span
                  key={stage.label}
                  style={{ width: stage.width }}
                  className={`bg-gradient-to-r ${stage.tone}`}
                  aria-label={`${stage.label}: ${stage.width}`}
                />
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-4 gap-1">
              {pipeline.map((stage) => (
                <div key={stage.label}>
                  <span
                    aria-hidden="true"
                    className={`mb-1 block h-1 w-1 rounded-full bg-gradient-to-r ${stage.tone}`}
                  />
                  <p className="truncate text-[7.5px] font-semibold text-muted">{stage.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* deals */}
          <div className="mt-1.5 space-y-1">
            {[
              { initials: "AC", name: "Acme Corp", amount: "$48,000", tag: "Won" },
              { initials: "NV", name: "Nova Design", amount: "$21,500", tag: "Proposal" },
            ].map((deal) => (
              <div
                key={deal.name}
                className="flex items-center gap-2 rounded-xl border border-line bg-white px-2 py-1.5"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet to-blue text-[8.5px] font-bold text-white">
                  {deal.initials}
                </span>
                <span className="flex-1 text-[10.5px] font-medium text-navy">{deal.name}</span>
                <span className="text-[10.5px] font-bold text-navy">{deal.amount}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[7.5px] font-bold ${
                    deal.tag === "Won" ? "bg-emerald-50 text-emerald-600" : "bg-violet/10 text-violet"
                  }`}
                >
                  {deal.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}