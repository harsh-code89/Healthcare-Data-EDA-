import { startTransition, useDeferredValue, useState } from "react";
import { BarChart3, ClipboardCheck, DatabaseZap, FileUp, Lightbulb, Sparkles } from "lucide-react";
import { CleanPage } from "./pages/CleanPage";
import { CorrelationPage } from "./pages/CorrelationPage";
import { ExplorePage } from "./pages/ExplorePage";
import { InsightsPage } from "./pages/InsightsPage";
import { UploadPage } from "./pages/UploadPage";
import { DEFAULT_FILTERS, type DatasetBundle, type FilterState } from "./types/data";
import { cleanDataset, parseCsvText } from "./utils/dataCleaner";
import { applyFilters, buildCorrelationMatrix, buildInsights } from "./utils/eda";

type StepKey = "upload" | "clean" | "explore" | "correlation" | "insights";

const steps: Array<{
  key: StepKey;
  title: string;
  subtitle: string;
  icon: typeof FileUp;
}> = [
  { key: "upload", title: "Load Data", subtitle: "Import and map a patient dataset", icon: FileUp },
  { key: "clean", title: "Clean Data", subtitle: "Validate, deduplicate, and profile quality", icon: ClipboardCheck },
  { key: "explore", title: "Explore", subtitle: "Univariate and bivariate analysis", icon: BarChart3 },
  { key: "correlation", title: "Correlations", subtitle: "Inspect numeric feature relationships", icon: DatabaseZap },
  { key: "insights", title: "Insights", subtitle: "Extract the key factors and findings", icon: Lightbulb },
];

export function App() {
  const [dataset, setDataset] = useState<DatasetBundle | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activeStep, setActiveStep] = useState<StepKey>("upload");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(filters.search);

  const effectiveFilters = {
    ...filters,
    search: deferredSearch,
  };

  const filteredRows = applyFilters(dataset?.cleanedRows ?? [], effectiveFilters);
  const correlationMatrix = buildCorrelationMatrix(filteredRows);
  const insights = dataset
    ? buildInsights(filteredRows, dataset.cleaningReport, correlationMatrix)
    : [];

  async function ingestText(fileName: string, text: string) {
    setError(null);
    setIsBusy(true);

    try {
      const rawRows = parseCsvText(text);
      if (!rawRows.length) {
        throw new Error("No patient rows were found in the uploaded CSV.");
      }

      const { cleanedRows, cleaningReport } = cleanDataset(rawRows);
      if (!cleanedRows.length) {
        throw new Error("The file loaded, but no rows remained after cleaning.");
      }

      const importedAt = new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date());

      startTransition(() => {
        setDataset({
          fileName,
          importedAt,
          rawRows,
          cleanedRows,
          cleaningReport,
        });
        setFilters(DEFAULT_FILTERS);
        setActiveStep("clean");
      });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unable to import the dataset.";
      setError(message);
    } finally {
      setIsBusy(false);
    }
  }

  async function loadSampleDataset() {
    setError(null);
    setIsBusy(true);

    try {
      const response = await fetch("/sample-healthcare-data.csv");
      if (!response.ok) {
        throw new Error("The bundled sample dataset could not be loaded.");
      }

      const text = await response.text();
      await ingestText("sample-healthcare-data.csv", text);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unable to load the sample dataset.";
      setError(message);
      setIsBusy(false);
    }
  }

  function renderCurrentStep() {
    if (activeStep === "upload") {
      return (
        <UploadPage
          dataset={dataset}
          isBusy={isBusy}
          onTextLoaded={ingestText}
          onLoadSample={loadSampleDataset}
        />
      );
    }

    if (!dataset) {
      return (
        <div className="rounded-[1.85rem] border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-900">
          Upload a dataset first to unlock the rest of the workflow.
        </div>
      );
    }

    if (activeStep === "clean") {
      return <CleanPage report={dataset.cleaningReport} />;
    }

    if (activeStep === "explore") {
      return (
        <ExplorePage
          rows={filteredRows}
          allRows={dataset.cleanedRows}
          cleaningReport={dataset.cleaningReport}
          filters={filters}
          onFiltersChange={setFilters}
          onResetFilters={() => setFilters(DEFAULT_FILTERS)}
        />
      );
    }

    if (activeStep === "correlation") {
      return <CorrelationPage rows={filteredRows} matrix={correlationMatrix} />;
    }

    return (
      <InsightsPage
        rows={filteredRows}
        cleaningReport={dataset.cleaningReport}
        insights={insights}
      />
    );
  }

  return (
    <div className="app-shell min-h-screen bg-[linear-gradient(180deg,#f7fbfc_0%,#eef7f9_45%,#f8f5ef_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="relative overflow-hidden rounded-[2.3rem] border border-white/70 bg-[linear-gradient(135deg,#0f172a_0%,#164e63_45%,#115e59_100%)] px-6 py-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:px-10">
          <div className="absolute inset-y-0 right-0 w-72 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_58%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                Healthcare Data EDA
              </div>
              <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight text-white sm:text-5xl">
                Dataset-first disease and risk factor analysis workspace
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-200 sm:text-base">
                Import patient records, clean the dataset, review missingness,
                inspect distributions, compare subgroups, calculate
                correlations, and surface presentation-ready findings from one
                unified dashboard.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                  Dataset
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  {dataset?.fileName ?? "No file loaded"}
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  {dataset ? `${dataset.cleaningReport.retainedRows} cleaned rows ready` : "Upload a CSV to begin"}
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                  Active view
                </p>
                <p className="mt-3 text-lg font-semibold text-white">{filteredRows.length} rows</p>
                <p className="mt-2 text-sm text-slate-200">
                  Filtered cohort available for charts and insights
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                  Workflow
                </p>
                <p className="mt-3 text-lg font-semibold text-white">5 phases</p>
                <p className="mt-2 text-sm text-slate-200">
                  From upload and cleaning through insights
                </p>
              </div>
            </div>
          </div>
        </header>

        <nav className="mt-8 grid gap-4 xl:grid-cols-5">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep === step.key;
            const isLocked = step.key !== "upload" && !dataset;

            return (
              <button
                key={step.key}
                type="button"
                disabled={isLocked}
                onClick={() => setActiveStep(step.key)}
                className={`group rounded-[1.6rem] border p-5 text-left transition ${
                  isActive
                    ? "border-cyan-300 bg-white shadow-[0_20px_45px_rgba(27,64,76,0.12)]"
                    : "border-white/70 bg-white/72 hover:border-cyan-200 hover:bg-white"
                } ${isLocked ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white transition group-hover:bg-cyan-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    0{index + 1}
                  </span>
                </div>
                <h2 className="mt-5 text-lg font-semibold text-slate-900">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{step.subtitle}</p>
              </button>
            );
          })}
        </nav>

        {error ? (
          <div className="mt-6 rounded-[1.6rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        <main className="mt-8">{renderCurrentStep()}</main>
      </div>
    </div>
  );
}
