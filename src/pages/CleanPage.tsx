import type { CleaningReport } from "../types/data";
import { CleaningSummary } from "../components/CleaningSummary";

interface CleanPageProps {
  report: CleaningReport;
}

export function CleanPage({ report }: CleanPageProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-[1.85rem] border border-white/70 bg-white/84 p-6 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
          Phase 2
        </p>
        <h2 className="mt-2 font-serif text-3xl text-slate-900">Cleaning and validation review</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          This stage checks which columns were recognized, how many records were
          retained, and where data quality issues may influence downstream
          interpretation. Use it as your audit trail before moving into charts
          and statistical relationships.
        </p>
      </div>

      <CleaningSummary report={report} />
    </div>
  );
}
