import { useRef, useState } from "react";
import { FileSpreadsheet, FolderUp, Sparkles, UploadCloud } from "lucide-react";

interface FileUploadProps {
  onTextLoaded: (fileName: string, text: string) => Promise<void> | void;
  onLoadSample: () => Promise<void> | void;
  isBusy: boolean;
  currentFileName?: string;
}

export function FileUpload({
  onTextLoaded,
  onLoadSample,
  isBusy,
  currentFileName,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function readFile(file: File) {
    const text = await file.text();
    await onTextLoaded(file.name, text);
  }

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) {
      return;
    }

    await readFile(file);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={async (event) => {
          event.preventDefault();
          setDragActive(false);
          await handleFiles(event.dataTransfer.files);
        }}
        className={`relative overflow-hidden rounded-[2rem] border p-8 shadow-[0_30px_80px_rgba(27,64,76,0.12)] transition-all ${
          dragActive
            ? "border-cyan-400 bg-cyan-50/80"
            : "border-white/70 bg-white/85"
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-cyan-200/50 via-teal-100/40 to-amber-100/40" />
        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
            <Sparkles className="h-3.5 w-3.5" />
            Data Intake
          </div>

          <div className="space-y-3">
            <h2 className="font-serif text-3xl text-slate-900">Upload a patient dataset</h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              Drop in a CSV of patient records to kick off the full EDA flow:
              schema matching, cleaning review, univariate analysis, bivariate
              analysis, correlation mapping, and insight generation.
            </p>
          </div>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
            className="flex min-h-64 w-full flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-dashed border-slate-300 bg-[radial-gradient(circle_at_top,#ffffff,#eef8fa)] px-8 text-center transition hover:border-cyan-400 hover:bg-[radial-gradient(circle_at_top,#ffffff,#e2f5f8)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl bg-slate-900 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
              <UploadCloud className="h-8 w-8" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {isBusy ? "Importing dataset..." : "Choose or drop a CSV file"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Supported format: comma-separated values with a header row
              </p>
            </div>
            {currentFileName ? (
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
                Current dataset: {currentFileName}
              </div>
            ) : null}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (event) => {
              await handleFiles(event.target.files);
              event.target.value = "";
            }}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FolderUp className="h-4 w-4" />
              Browse CSV
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={onLoadSample}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Load bundled sample dataset
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/70 bg-white/82 p-8 shadow-[0_30px_80px_rgba(27,64,76,0.08)]">
        <h3 className="font-serif text-2xl text-slate-900">Expected columns</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          The importer accepts common healthcare field names and aliases. The
          cleanest results come from a dataset that includes a disease label and
          at least a few numeric health markers.
        </p>

        <div className="mt-6 space-y-4 text-sm text-slate-700">
          <div>
            <p className="font-semibold text-slate-900">Demographics</p>
            <p className="mt-1">`patient_id`, `age`, `gender`, `height_cm`, `weight_kg`</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Vitals and labs</p>
            <p className="mt-1">
              `systolic_bp`, `diastolic_bp`, `fasting_glucose`, `hba1c`,
              `total_cholesterol`, `ldl`, `hdl`, `triglycerides`, `vitamin_d`
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Lifestyle and outcome</p>
            <p className="mt-1">
              `smoking_status`, `alcohol_use`, `exercise_frequency`,
              `sleep_duration`, `family_history`, `disease_label`
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
