import type { HistogramBin } from "../../types/data";

interface HistogramChartProps {
  title: string;
  subtitle: string;
  bins: HistogramBin[];
  accentClassName?: string;
}

export function HistogramChart({
  title,
  subtitle,
  bins,
  accentClassName = "from-cyan-500 to-teal-500",
}: HistogramChartProps) {
  const maxCount = Math.max(...bins.map((bin) => bin.count), 1);

  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/84 p-6 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-500">{subtitle}</p>

      {bins.length ? (
        <div className="mt-8">
          <div className="flex h-52 items-end gap-3">
            {bins.map((bin) => (
              <div key={bin.label} className="flex min-w-0 flex-1 flex-col items-center gap-3">
                <div className="text-xs font-medium text-slate-400">{bin.count}</div>
                <div className="flex h-40 w-full items-end rounded-t-[1.2rem] bg-slate-100 p-1">
                  <div
                    className={`w-full rounded-[1rem] bg-gradient-to-t ${accentClassName}`}
                    style={{ height: `${(bin.count / maxCount) * 100}%` }}
                  />
                </div>
                <div className="text-center text-[11px] text-slate-500">{bin.label}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-[1.25rem] bg-slate-50 p-6 text-sm text-slate-500">
          Not enough valid values to build this histogram.
        </div>
      )}
    </div>
  );
}
