import type { CleanedPatientRow, CleaningReport, FilterState } from "../types/data";
import {
  buildCategoryCounts,
  buildHistogram,
  buildScatterPoints,
  buildSummaryMetrics,
  getUniqueOptions,
  summarizeNumericColumns,
} from "../utils/eda";
import { DataTable } from "../components/DataTable";
import { FilterPanel } from "../components/FilterPanel";
import { SummaryCards } from "../components/SummaryCards";
import { BarChart } from "../components/charts/BarChart";
import { HistogramChart } from "../components/charts/HistogramChart";
import { ScatterChart } from "../components/charts/ScatterChart";

interface ExplorePageProps {
  rows: CleanedPatientRow[];
  allRows: CleanedPatientRow[];
  cleaningReport: CleaningReport;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onResetFilters: () => void;
}

export function ExplorePage({
  rows,
  allRows,
  cleaningReport,
  filters,
  onFiltersChange,
  onResetFilters,
}: ExplorePageProps) {
  const metrics = buildSummaryMetrics(rows, cleaningReport);
  const numericSummaries = summarizeNumericColumns(rows);
  const diseaseCounts = buildCategoryCounts(rows, "diseaseLabel");
  const glucoseCounts = buildCategoryCounts(rows, "glucoseCategory");
  const ageHistogram = buildHistogram(rows, "age");
  const bmiHistogram = buildHistogram(rows, "bmi");
  const scatterPoints = buildScatterPoints(rows, "bmi", "fastingGlucose");

  return (
    <div className="space-y-6">
      <div className="rounded-[1.85rem] border border-white/70 bg-white/84 p-6 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
          Phase 3
        </p>
        <h2 className="mt-2 font-serif text-3xl text-slate-900">
          Univariate and bivariate analysis
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Explore the current cohort through summary cards, variable
          distributions, diagnosis prevalence, and pairwise relationships. The
          filters below let you isolate specific subgroups before reading the
          charts.
        </p>
      </div>

      <FilterPanel
        filters={filters}
        onChange={onFiltersChange}
        onReset={onResetFilters}
        totalRows={allRows.length}
        filteredRows={rows.length}
        options={{
          genders: getUniqueOptions(allRows, "gender"),
          diseases: getUniqueOptions(allRows, "diseaseLabel"),
          smokingStatuses: getUniqueOptions(allRows, "smokingStatus"),
          bmiCategories: getUniqueOptions(allRows, "bmiCategory"),
          ageGroups: getUniqueOptions(allRows, "ageGroup"),
          glucoseCategories: getUniqueOptions(allRows, "glucoseCategory"),
        }}
      />

      <SummaryCards metrics={metrics} />

      <div className="grid gap-6 xl:grid-cols-2">
        <HistogramChart
          title="Age Distribution"
          subtitle="Frequency of patients across age bins"
          bins={ageHistogram}
        />
        <HistogramChart
          title="BMI Distribution"
          subtitle="Derived body mass index spread in the filtered cohort"
          bins={bmiHistogram}
          accentClassName="from-emerald-500 to-cyan-500"
        />
        <BarChart
          title="Disease prevalence"
          subtitle="Most common diagnoses in the current cohort"
          items={diseaseCounts}
        />
        <BarChart
          title="Glucose risk bands"
          subtitle="Glucose stratification based on fasting glucose and HbA1c"
          items={glucoseCounts}
          accentClassName="from-rose-500 to-amber-500"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ScatterChart
          title="BMI vs fasting glucose"
          subtitle="A quick bivariate view for obesity and glycemic clustering"
          xLabel="BMI"
          yLabel="Fasting Glucose"
          points={scatterPoints}
        />

        <div className="rounded-[1.75rem] border border-white/70 bg-white/84 p-6 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
            Numeric Summary
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Key variable stats</h3>
          <div className="mt-6 overflow-hidden rounded-[1.2rem] border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Variable</th>
                  <th className="px-4 py-3 font-semibold">Mean</th>
                  <th className="px-4 py-3 font-semibold">Median</th>
                  <th className="px-4 py-3 font-semibold">Min</th>
                  <th className="px-4 py-3 font-semibold">Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {numericSummaries.map((summary) => (
                  <tr key={summary.key}>
                    <td className="px-4 py-3 font-medium text-slate-900">{summary.label}</td>
                    <td className="px-4 py-3 text-slate-700">{summary.mean ?? "NA"}</td>
                    <td className="px-4 py-3 text-slate-700">{summary.median ?? "NA"}</td>
                    <td className="px-4 py-3 text-slate-700">{summary.min ?? "NA"}</td>
                    <td className="px-4 py-3 text-slate-700">{summary.max ?? "NA"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DataTable rows={rows} />
    </div>
  );
}
