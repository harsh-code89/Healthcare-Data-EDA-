import { Fragment } from "react";
import type { CorrelationMatrix } from "../../types/data";

interface CorrelationHeatmapProps {
  matrix: CorrelationMatrix;
}

function cellColor(value: number) {
  if (value >= 0.75) {
    return "bg-emerald-600 text-white";
  }

  if (value >= 0.45) {
    return "bg-emerald-200 text-emerald-950";
  }

  if (value >= 0.15) {
    return "bg-emerald-50 text-emerald-900";
  }

  if (value <= -0.75) {
    return "bg-rose-600 text-white";
  }

  if (value <= -0.45) {
    return "bg-rose-200 text-rose-950";
  }

  if (value <= -0.15) {
    return "bg-rose-50 text-rose-900";
  }

  return "bg-slate-100 text-slate-700";
}

export function CorrelationHeatmap({ matrix }: CorrelationHeatmapProps) {
  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/84 p-6 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
        Correlation Matrix
      </p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">Pearson relationships</h3>

      <div className="mt-6 overflow-x-auto">
        <div
          className="grid min-w-[760px] gap-2"
          style={{ gridTemplateColumns: `180px repeat(${matrix.keys.length}, minmax(72px, 1fr))` }}
        >
          <div />
          {matrix.rows.map((column) => (
            <div
              key={column.key}
              className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              {column.label}
            </div>
          ))}

          {matrix.rows.map((row) => (
            <Fragment key={row.key}>
              <div
                className="flex items-center rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
              >
                {row.label}
              </div>
              {row.cells.map((cell) => (
                <div
                  key={`${row.key}-${cell.key}`}
                  className={`flex min-h-18 flex-col items-center justify-center rounded-2xl text-sm font-semibold ${cellColor(cell.value)}`}
                >
                  <span>{cell.value.toFixed(2)}</span>
                  <span className="mt-1 text-[10px] font-medium opacity-75">n={cell.sampleSize}</span>
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
