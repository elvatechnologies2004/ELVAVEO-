import { GraduationCap, Sparkles, BrainCircuit, Users, TrendingUp } from "lucide-react";

export default function CamviaDashboardScreenshot() {
  const summary = [
    { label: "Efficiency", value: "+45%", delta: "Automated", up: true },
    { label: "AI Insights", value: "Real-Time", delta: "Predictive", up: true },
    { label: "Learner Success", value: "99.4%", delta: "+18%", up: true },
  ];

  const streams = [
    { icon: GraduationCap, label: "Smart Attendance", detail: "98.2% Logged", tone: "text-blue" },
    { icon: BrainCircuit, label: "Adaptive Learning", detail: "Active Cohorts", tone: "text-violet" },
    { icon: Users, label: "Campus Staff LMS", detail: "Synced 100%", tone: "text-cyan-700" },
  ];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-b from-white/80 to-white/50 shadow-card-lg ring-1 ring-white/80 backdrop-blur-xl">
      {/* Featured badge */}
      <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan via-blue to-violet px-2.5 py-1 text-[10px] font-bold text-white shadow-[0_8px_16px_-6px_rgba(37,99,255,0.6)]">
        <Sparkles size={10} aria-hidden="true" />
        AI School OS
      </span>

      {/* Slim header */}
      <div className="flex items-center justify-between border-b border-white/70 bg-white/40 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-1.5">
          <BrainCircuit size={13} className="text-blue" />
          <p className="text-[10px] font-extrabold text-navy">CAMVIA Intelligence</p>
        </div>
        <span className="text-[9px] font-semibold text-muted">Spring Term</span>
      </div>

      {/* Summary stat cards */}
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
            <p className="text-[8.5px] font-bold text-emerald-500">
              {s.delta}
            </p>
          </div>
        ))}
      </div>

      {/* Campus Streams */}
      <div className="border-t border-white/60 bg-white/40 px-3 py-2">
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted">
          Campus Operational Pulse
        </p>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {streams.map((stream) => (
            <div
              key={stream.label}
              className="flex flex-col rounded-lg bg-white/60 p-1.5 shadow-2xs"
            >
              <span className={`flex items-center gap-1 text-[9px] font-bold ${stream.tone}`}>
                <stream.icon size={10} />
                <span className="truncate">{stream.label}</span>
              </span>
              <span className="mt-0.5 truncate text-[8px] font-medium text-muted">
                {stream.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
