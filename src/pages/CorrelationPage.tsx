import type { CleanedPatientRow, CorrelationMatrix } from "../types/data";
import { CorrelationHeatmap } from "../components/charts/CorrelationHeatmap";

interface CorrelationPageProps {
  rows: CleanedPatientRow[];
  matrix: CorrelationMatrix;
}

export function CorrelationPage({ rows, matrix }: CorrelationPageProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-[1.85rem] border border-white/70 bg-white/84 p-6 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
          Phase 4
        </p>
        <h2 className="mt-2 font-serif text-3xl text-slate-900">Correlation analysis</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          This grid highlights linear relationships among the numeric variables
          that survived cleaning. Stronger green cells indicate positive
          movement together, while stronger rose cells indicate an inverse
          relationship.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {matrix.strongestPairs.map((pair) => (
          <div
            key={`${pair.leftKey}-${pair.rightKey}`}
            className="rounded-[1.5rem] border border-white/70 bg-white/84 p-5 shadow-[0_18px_45px_rgba(27,64,76,0.08)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
              Strong pair
            </p>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">
              {pair.leftLabel} vs {pair.rightLabel}
            </h3>
            <p className="mt-3 font-serif text-4xl text-slate-900">{pair.value}</p>
            <p className="mt-3 text-sm text-slate-500">Based on {pair.sampleSize} paired rows</p>
          </div>
        ))}
      </div>

      <CorrelationHeatmap matrix={matrix} />

      <div className="rounded-[1.75rem] border border-white/70 bg-white/84 p-6 text-sm leading-7 text-slate-600 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
        The current matrix is calculated from <strong>{rows.length}</strong>{" "}
        filtered patient rows. Correlation does not imply causation, but it
        helps surface variables that move together and deserve closer
        explanation in the final insight layer.
      </div>
    </div>
  );
}
