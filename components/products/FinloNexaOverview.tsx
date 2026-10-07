import { Users, Building2, Sparkles } from "lucide-react";

/**
 * FinloCRM compact overview panel — mirrors the Finlo SaaS panel style.
 * Featured badge (top-right), summary stat cards, deals table and a donut
 * chart with legend. Fills available height (h-full) so the card's overall
 * size does not change. All values are placeholder demo data.
 */
export default function FinloNexaOverview() {
  const summary = [
    { label: "Leads", value: "1,248", delta: "+8.2%", up: true },
    { label: "Won", value: "96", delta: "+14", up: true },
    { label: "Revenue", value: "$284K", delta: "+22%", up: true },
  ];

  const rows = [
    { icon: Building2, label: "Acme", amount: "+$48,000", tag: "Won" },
    { icon: Users, label: "Nova", amount: "+$21,500", tag: "Proposal" },
  ];

  const legend = [
    { label: "Lead", pct: "34%", tone: "bg-cyan" },
    { label: "Qualified", pct: "26%", tone: "bg-blue" },
    { label: "Won", pct: "40%", tone: "bg-violet" },
  ];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-b from-white/75 to-white/40 shadow-card-lg ring-1 ring-white/80 backdrop-blur-xl">
      {/* Featured badge — top right */}
      <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-main px-2.5 py-1 text-[10px] font-bold text-white shadow-[0_8px_16px_-6px_rgba(37,99,255,0.6)]">
        <Sparkles size={10} aria-hidden="true" />
        Featured
      </span>

      {/* slim header */}
      <div className="flex items-center justify-between border-b border-white/70 bg-white/40 px-3 py-2 backdrop-blur">
        <p className="text-[10px] font-extrabold text-navy">CRM Overview</p>
        <span className="text-[9px] font-semibold text-muted">Live</span>
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

      {/* deals table + analytics (donut) */}
      <div className="grid min-w-0 grid-cols-1 gap-2 px-3 pb-3">
        {/* recent deals table */}
        <div className="rounded-xl border border-white/70 bg-white/60 p-2 backdrop-blur-sm">
          <p className="mb-1.5 text-[10px] font-bold text-navy">Recent deals</p>
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
                  className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
                    r.tag === "Won" ? "bg-emerald-50 text-emerald-600" : "bg-violet/10 text-violet"
                  }`}
                >
                  {r.tag}
                </span>
                <span className="text-[10px] font-bold text-navy">{r.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* analytics — donut chart */}
        <div className="flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/60 p-2 backdrop-blur-sm">
          <div className="relative h-16 w-16 shrink-0 rounded-full bg-[conic-gradient(#8b5cf6_0%_34%,#2563eb_34%_60%,#22d3ee_60%_100%)]">
            <div className="absolute inset-[22%] rounded-full bg-gradient-to-b from-white/90 to-white/40 shadow-[inset_0_2px_8px_rgba(255,255,255,0.9),0_1px_4px_rgba(8,27,61,0.15)] ring-1 ring-white/80 backdrop-blur-md" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[9px] font-extrabold text-navy">$92K</p>
              <p className="text-[8px] font-semibold text-muted">pipeline</p>
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