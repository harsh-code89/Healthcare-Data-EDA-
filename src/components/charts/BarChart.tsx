import type { CategoryCount } from "../../types/data";

interface BarChartProps {
  title: string;
  subtitle: string;
  items: CategoryCount[];
  accentClassName?: string;
}

export function BarChart({
  title,
  subtitle,
  items,
  accentClassName = "from-amber-500 to-orange-500",
}: BarChartProps) {
  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/84 p-6 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-500">{subtitle}</p>

      <div className="mt-6 space-y-4">
        {items.length ? (
          items.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-slate-700">{item.label}</span>
                <span className="text-slate-500">
                  {item.count} rows ({item.percentage}%)
                </span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${accentClassName}`}
                  style={{ width: `${Math.max(item.percentage, 6)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[1.25rem] bg-slate-50 p-6 text-sm text-slate-500">
            No rows available for this comparison.
          </div>
        )}
      </div>
    </div>
  );
}
