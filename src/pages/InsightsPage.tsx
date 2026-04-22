import type { CleanedPatientRow, CleaningReport, Insight } from "../types/data";

interface InsightsPageProps {
  rows: CleanedPatientRow[];
  cleaningReport: CleaningReport;
  insights: Insight[];
}

function emphasisStyle(emphasis: Insight["emphasis"]) {
  if (emphasis === "high") {
    return "border-rose-200 bg-rose-50";
  }

  if (emphasis === "medium") {
    return "border-amber-200 bg-amber-50";
  }

  return "border-cyan-200 bg-cyan-50";
}

export function InsightsPage({
  rows,
  cleaningReport,
  insights,
}: InsightsPageProps) {
  const riskCounts = new Map<string, number>();

  rows.forEach((row) => {
    row.riskFlags.forEach((flag) => {
      riskCounts.set(flag, (riskCounts.get(flag) ?? 0) + 1);
    });
  });

  const rankedFlags = Array.from(riskCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.85rem] border border-white/70 bg-white/84 p-6 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
          Phase 5
        </p>
        <h2 className="mt-2 font-serif text-3xl text-slate-900">Key findings and factors</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          This final layer turns the dataset patterns into concise analytical
          observations you can lift into a presentation, notebook summary, or
          project report.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={`${insight.category}-${insight.title}`}
              className={`rounded-[1.6rem] border p-5 shadow-[0_18px_45px_rgba(27,64,76,0.08)] ${emphasisStyle(insight.emphasis)}`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
                {insight.category.replace("-", " ")}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{insight.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">{insight.detail}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-white/70 bg-white/84 p-6 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
              Key factors
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Most frequent risk signals</h3>
            <div className="mt-6 space-y-4">
              {rankedFlags.length ? (
                rankedFlags.map(([flag, count]) => (
                  <div key={flag}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-slate-700">{flag}</span>
                      <span className="text-slate-500">
                        {count} patients ({((count / rows.length) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"
                        style={{ width: `${Math.max((count / rows.length) * 100, 6)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No derived risk flags in the current view.</p>
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/70 bg-[linear-gradient(145deg,#0f172a,#0f766e)] p-6 text-white shadow-[0_18px_45px_rgba(27,64,76,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100">
              Presentation-ready snapshot
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-100">
              <li>Cleaned cohort size: {cleaningReport.retainedRows} patients</li>
              <li>Rows dropped for duplication/emptiness: {cleaningReport.duplicateRowsRemoved + cleaningReport.removedEmptyRows}</li>
              <li>Average data completeness: {cleaningReport.averageCompleteness}%</li>
              <li>Rows in the active filtered view: {rows.length}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
