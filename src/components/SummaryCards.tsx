import type { DashboardMetric } from "../types/data";

interface SummaryCardsProps {
  metrics: DashboardMetric[];
}

export function SummaryCards({ metrics }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-[1.65rem] border border-white/70 bg-white/84 p-5 shadow-[0_18px_45px_rgba(27,64,76,0.08)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
            {metric.label}
          </p>
          <p className="mt-3 font-serif text-4xl text-slate-900">{metric.value}</p>
          <p className="mt-3 text-sm leading-7 text-slate-500">{metric.helper}</p>
        </div>
      ))}
    </div>
  );
}
