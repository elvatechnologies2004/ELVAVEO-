import { Wallet } from "lucide-react";
import type { ProductStat } from "@/data/products";

/**
 * Finlo dashboard — compact single-row mockup.
 *
 * Balance + cash flow + stat tiles sit in ONE row so the product showcase
 * card stays short. The recent-transactions list was removed for the same
 * reason. All values are placeholder demo data.
 */
export default function FinloPhoneMockup({ stats }: { stats?: ProductStat[] }) {
  const balance = stats?.[0]?.value ?? "Rs. 24,860.50";
  // Fixed pixel heights (px) so bars render reliably inside flexible chart area.
  const bars = [18, 25, 16, 28, 22, 33, 27];

  return (
    <div className="@container flex h-full w-full flex-col overflow-hidden rounded-[16px] border border-line bg-gradient-to-b from-white to-ice shadow-card-lg">
      {/* top bar */}
      <div className="flex items-center justify-between border-b border-line bg-white/80 px-3 py-1.5 backdrop-blur">
        <span className="text-[11.5px] font-extrabold tracking-tight text-navy">Finlo</span>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-line bg-ice px-2 py-0.5 text-[8px] font-bold text-navy/70">
            Dashboard
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-blue text-white">
            <Wallet size={11} strokeWidth={2.4} aria-hidden="true" />
          </span>
        </div>
      </div>

      {/* single row — balance + cash flow + stat tiles */}
      <div className="grid grid-cols-1 gap-2 p-2.5 @[22rem]:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] @[34rem]:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)_auto]">
        {/* balance */}
        <div className="rounded-xl bg-gradient-to-br from-blue to-cyan p-2.5 text-white shadow-[0_14px_30px_-12px_rgba(37,99,255,0.7)]">
          <p className="text-[8.5px] font-semibold uppercase tracking-widest text-white/80">
            Total Balance
          </p>
          <p className="mt-0.5 text-[18px] font-extrabold tracking-tight">{balance}</p>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1">
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[7.5px] font-bold">
              ▲ +12.4% this month
            </span>
            <span className="text-[7.5px] text-white/80">Updated just now</span>
          </div>
        </div>

        {/* cash flow */}
        <div className="flex flex-col rounded-xl border border-line bg-white p-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[8.5px] font-bold text-navy">Cash Flow</p>
            <span className="text-[7.5px] font-semibold text-muted">Last 7 days</span>
          </div>
          <div className="mt-1.5 flex min-h-[38px] flex-1 items-end gap-1.5">
            {bars.map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}px` }}
                aria-hidden="true"
                className="flex-1 rounded-t-md bg-gradient-to-t from-blue/80 to-cyan"
              />
            ))}
          </div>
        </div>

        {/* stat tiles */}
        <div className="grid grid-cols-3 gap-1.5 @[22rem]:col-span-2 @[34rem]:col-span-1">
          {(stats || []).slice(1).map((s, idx) => (
            <div
              key={s.label || idx}
              className="rounded-xl border border-line bg-white p-1.5"
            >
              <p className="text-[7.5px] font-semibold uppercase tracking-wide text-muted">
                {s.label}
              </p>
              <p className="mt-0.5 text-[11px] font-extrabold text-navy">{s.value}</p>
              {s.trend && (
                <p
                  className={`text-[7.5px] font-bold ${
                    s.trend.startsWith("−") ? "text-rose-500" : "text-emerald-500"
                  }`}
                >
                  {s.trend}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
