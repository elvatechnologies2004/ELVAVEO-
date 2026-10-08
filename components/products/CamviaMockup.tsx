import {
  GraduationCap,
  BrainCircuit,
  Users,
  BarChart3,
  Sparkles,
  BookOpen,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import type { ProductStat } from "@/data/products";

export default function CamviaMockup({ stats }: { stats?: ProductStat[] }) {
  const insightMetrics = [
    { label: "Smart Attendance", value: "98.2%", tone: "from-cyan to-blue" },
    { label: "LMS Engagement", value: "94.6%", tone: "from-blue to-violet" },
    { label: "Predictive Interventions", value: "100%", tone: "from-violet to-purple-500" },
    { label: "Staff Scheduling", value: "Optimized", tone: "from-cyan to-emerald-400" },
  ];

  return (
    <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-line bg-white shadow-card-lg transition-transform hover:-translate-y-0.5">
      {/* Browser Chrome Header */}
      <div className="flex items-center gap-2 border-b border-line bg-ice/70 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-[#fca5a5]" />
        <span className="h-2 w-2 rounded-full bg-[#fcd34d]" />
        <span className="h-2 w-2 rounded-full bg-[#86efac]" />
        <span className="ml-1.5 flex-1 truncate rounded-full bg-white px-3 py-0.5 text-center text-[9.5px] font-medium text-muted ring-1 ring-line">
          camvia.elvaveo.com
        </span>
      </div>

      <div className="flex">
        {/* Sidebar Rail */}
        <div className="hidden w-10 flex-col items-center gap-1.5 border-r border-line bg-ice/50 py-2.5 sm:flex">
          {[GraduationCap, BrainCircuit, Users, BarChart3, Sparkles].map((Icon, i) => (
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
                CAMVIA School Intelligence
              </p>
              <p className="text-[9px] text-muted">Spring Term • Academic Year 2026</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan/15 px-2 py-0.5 text-[8.5px] font-bold text-cyan-700">
              <Sparkles size={9} />
              AI Active
            </span>
          </div>

          {/* Stat Tiles */}
          <div className="grid grid-cols-2 gap-1.5">
            {(stats || []).map((s, idx) => (
              <div
                key={s.label || idx}
                className="rounded-xl border border-line bg-white p-2 shadow-[0_6px_18px_-14px_rgba(8,27,61,0.3)]"
              >
                <p className="text-[8.5px] font-semibold uppercase tracking-wide text-muted">
                  {s.label}
                </p>
                <p className="mt-0.5 text-[14px] font-extrabold tracking-tight text-navy">
                  {s.value}
                </p>
                {s.trend && (
                  <p className="flex items-center gap-0.5 text-[7.5px] font-bold text-emerald-600">
                    <TrendingUp size={9} />
                    {s.trend}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* AI Insights & Learning Analytics Banner */}
          <div className="mt-1.5 rounded-xl border border-cyan/20 bg-gradient-to-r from-cyan/10 via-blue/5 to-transparent p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BrainCircuit size={13} className="text-blue" />
                <p className="text-[9.5px] font-bold text-navy">
                  AI Predictive Guidance
                </p>
              </div>
              <span className="text-[8px] font-bold text-blue">99.4% Confidence</span>
            </div>
            <p className="mt-1 text-[8.5px] leading-relaxed text-navy/80">
              Automated resource allocation active. 14 student cohorts dynamically adjusted for peak learning retention.
            </p>
          </div>

          {/* Campus Operations Progress */}
          <div className="mt-1.5 space-y-1">
            {[
              {
                icon: BookOpen,
                name: "Smart Curriculum & LMS",
                detail: "48 Courses in session",
                status: "100% Synced",
              },
              {
                icon: Users,
                name: "Staff & Parent Portal",
                detail: "1,420 Active Connections",
                status: "Online",
              },
            ].map((op) => (
              <div
                key={op.name}
                className="flex items-center gap-2 rounded-xl border border-line bg-white px-2 py-1.5"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue/10 text-blue">
                  <op.icon size={11} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[10px] font-bold text-navy">{op.name}</p>
                  <p className="truncate text-[8px] text-muted">{op.detail}</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[7.5px] font-bold text-emerald-600">
                  <CheckCircle2 size={8} />
                  {op.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
