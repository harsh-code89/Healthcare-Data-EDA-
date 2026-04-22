import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Database, Rows4 } from "lucide-react";
import type { CleaningReport } from "../types/data";

interface CleaningSummaryProps {
  report: CleaningReport;
}

function SummaryStat({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function IssueBars({
  title,
  items,
  tone,
}: {
  title: string;
  items: CleaningReport["missingByColumn"];
  tone: "cyan" | "amber" | "rose";
}) {
  const palette = {
    cyan: "from-cyan-500 to-teal-500",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-red-500",
  };

  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/82 p-6 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="mt-5 space-y-4">
        {items.length ? (
          items.slice(0, 6).map((item) => (
            <div key={item.key}>
              <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-slate-700">{item.label}</span>
                <span className="text-slate-500">
                  {item.count} rows ({item.percentage}%)
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${palette[tone]}`}
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No issues detected in this category.</p>
        )}
      </div>
    </div>
  );
}

export function CleaningSummary({ report }: CleaningSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryStat
          icon={<Rows4 className="h-5 w-5" />}
          label="Imported rows"
          value={report.totalRows.toString()}
          helper="Original records found in the CSV"
        />
        <SummaryStat
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Retained rows"
          value={report.retainedRows.toString()}
          helper={`${report.duplicateRowsRemoved} duplicates removed`}
        />
        <SummaryStat
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Invalid values"
          value={report.invalidValueCount.toString()}
          helper={`${report.outlierCount} values flagged as outliers`}
        />
        <SummaryStat
          icon={<Database className="h-5 w-5" />}
          label="Avg completeness"
          value={`${report.averageCompleteness}%`}
          helper="Across the core EDA columns"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <IssueBars title="Missing values by column" items={report.missingByColumn} tone="cyan" />
          <IssueBars title="Invalid numeric values" items={report.invalidByColumn} tone="amber" />
          <IssueBars title="Outlier flags" items={report.outlierByColumn} tone="rose" />
        </div>

        <div className="rounded-[1.75rem] border border-white/70 bg-white/82 p-6 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
          <h3 className="text-lg font-semibold text-slate-900">Recognized columns</h3>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            These fields were successfully matched to the app&apos;s healthcare schema.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {report.recognizedColumns.length ? (
              report.recognizedColumns.map((column) => (
                <span
                  key={column}
                  className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700"
                >
                  {column}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                No expected columns were detected
              </span>
            )}
          </div>

          <div className="mt-8 rounded-[1.35rem] bg-[linear-gradient(135deg,#0f172a,#164e63)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-100">Cleaning note</p>
            <p className="mt-3 text-sm leading-7 text-slate-100">
              Duplicate rows and fully empty rows are removed before analysis.
              Numeric values outside plausible clinical ranges are converted to
              null so they do not distort charts or correlations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
