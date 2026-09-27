import { Briefcase, ShoppingCart, Sparkles, TrendingUp } from "lucide-react";

/**
 * Finlo small SaaS dashboard "screenshot" — compact summary panel rendered on
 * the LEFT side of the Finlo card. Included: Featured badge (top-right),
 * summary stat cards, a recent-transactions style table, and a donut chart
 * with legend + analytics. All values are placeholder demo data.
 */
export default function FinloDashboardScreenshot() {
  const summary = [
    { label: "Balance", value: "₹24,860", delta: "+12.4%", up: true },
    { label: "Income", value: "₹42,800", delta: "+8.1%", up: true },
    { label: "Savings", value: "32%", delta: "+4.6%", up: true },
  ];

  const rows = [
    { icon: Briefcase, label: "Salary", amount: "+₹42,800", up: true },
    { icon: TrendingUp, label: "Freelance", amount: "+₹12,400", up: true },
    { icon: ShoppingCart, label: "Groceries", amount: "−₹1,240", up: false },
  ];

  const legend = [
    { label: "Essentials", pct: "46%", tone: "bg-blue" },
    { label: "Lifestyle", pct: "32%", tone: "bg-cyan" },
    { label: "Savings", pct: "22%", tone: "bg-violet" },
  ];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-b from-white/75 to-white/40 shadow-card-lg ring-1 ring-white/80 backdrop-blur-xl">
      {/* Featured badge — top right */}
      <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-main px-2.5 py-1 text-[10px] font-bold text-white shadow-[0_8px_16px_-6px_rgba(37,99,255,0.6)]">
        <Sparkles size={10} aria-hidden="true" />
        Featured
      </span>

      {/* slim header */}
      <div className="flex items-center justify-between border-b border-white/70 bg-white/40 px-3 py-2 backdrop-blur">
        <p className="text-[10px] font-extrabold text-navy">Finlo Overview</p>
        <span className="text-[9px] font-semibold text-muted">This week</span>
      </div>

      {/* summary stat cards */}
      <div className="grid grid-cols-3 gap-2 p-3">
        {summary.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/70 bg-white/60 p-2 shadow-[0_4px_12px_-10px_rgba(8,27,61,0.35)] backdrop-blur-sm"
          >
            <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-muted">
              {s.label}
            </p>
            <p className="mt-0.5 truncate text-[13px] font-extrabold text-navy">
              {s.value}
            </p>
            <p className={`text-[9px] font-bold ${s.up ? "text-emerald-500" : "text-rose-500"}`}>
              {s.delta}
            </p>
          </div>
        ))}
      </div>

      {/* recent table + analytics (donut) */}
      <div className="grid grid-cols-1 gap-2 px-3 pb-3">
        {/* recent data table */}
        <div className="rounded-xl border border-white/70 bg-white/60 p-2 backdrop-blur-sm">
          <p className="mb-1.5 text-[10px] font-bold text-navy">Recent transactions</p>
          <div className="space-y-1">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue/10 text-blue">
                  <r.icon size={11} aria-hidden="true" />
                </span>
                <span className="flex-1 truncate text-[10px] font-medium text-navy">
                  {r.label}
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    r.up ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {r.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* analytics — donut chart */}
        <div className="flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/60 p-2 backdrop-blur-sm">
          <div className="relative h-16 w-16 shrink-0 rounded-full bg-[conic-gradient(#2563eb_0%_46%,#22d3ee_46%_78%,#8b5cf6_78%_100%)]">
            <div className="absolute inset-[22%] rounded-full bg-gradient-to-b from-white/90 to-white/40 shadow-[inset_0_2px_8px_rgba(255,255,255,0.9),0_1px_4px_rgba(8,27,61,0.15)] ring-1 ring-white/80 backdrop-blur-md" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[9px] font-extrabold text-navy">₹24.8K</p>
              <p className="text-[8px] font-semibold text-muted">spent</p>
            </div>
          </div>
          <div className="flex-1 space-y-1">
            {legend.map((l) => (
              <div key={l.label} className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className={`h-2 w-2 rounded-full ${l.tone}`} />
                  <span className="text-[9px] font-medium text-muted">{l.label}</span>
                </span>
                <span className="text-[9px] font-bold text-navy">{l.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}