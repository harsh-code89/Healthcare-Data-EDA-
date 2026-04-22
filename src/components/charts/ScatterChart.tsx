import type { ScatterPoint } from "../../types/data";

interface ScatterChartProps {
  title: string;
  subtitle: string;
  xLabel: string;
  yLabel: string;
  points: ScatterPoint[];
}

function colorForGroup(group: string) {
  const palette = [
    "#0f766e",
    "#0891b2",
    "#f97316",
    "#dc2626",
    "#7c3aed",
    "#65a30d",
  ];

  let hash = 0;
  for (let index = 0; index < group.length; index += 1) {
    hash += group.charCodeAt(index);
  }

  return palette[hash % palette.length];
}

export function ScatterChart({
  title,
  subtitle,
  xLabel,
  yLabel,
  points,
}: ScatterChartProps) {
  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);
  const minX = Math.min(...xValues, 0);
  const maxX = Math.max(...xValues, 1);
  const minY = Math.min(...yValues, 0);
  const maxY = Math.max(...yValues, 1);

  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;
  const uniqueGroups = Array.from(new Set(points.map((point) => point.group))).slice(0, 5);

  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/84 p-6 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-500">{subtitle}</p>

      {points.length ? (
        <>
          <div className="mt-6 rounded-[1.25rem] bg-slate-50 p-4">
            <svg viewBox="0 0 100 100" className="h-72 w-full overflow-visible">
              <line x1="10" y1="90" x2="92" y2="90" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="10" y1="10" x2="10" y2="90" stroke="#94a3b8" strokeWidth="1.5" />
              {points.map((point) => {
                const x = 10 + ((point.x - minX) / xRange) * 82;
                const y = 90 - ((point.y - minY) / yRange) * 80;

                return (
                  <circle
                    key={`${point.label}-${point.x}-${point.y}`}
                    cx={x}
                    cy={y}
                    r="2.2"
                    fill={colorForGroup(point.group)}
                    fillOpacity="0.82"
                  />
                );
              })}
            </svg>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
            <span>{xLabel}</span>
            <span>{yLabel}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {uniqueGroups.map((group) => (
              <span
                key={group}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: colorForGroup(group) }}
                />
                {group}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-8 rounded-[1.25rem] bg-slate-50 p-6 text-sm text-slate-500">
          Not enough paired numeric values to build this scatterplot.
        </div>
      )}
    </div>
  );
}
