import type { DatasetBundle } from "../types/data";
import { FileUpload } from "../components/FileUpload";

interface UploadPageProps {
  dataset: DatasetBundle | null;
  isBusy: boolean;
  onTextLoaded: (fileName: string, text: string) => Promise<void> | void;
  onLoadSample: () => Promise<void> | void;
}

export function UploadPage({
  dataset,
  isBusy,
  onTextLoaded,
  onLoadSample,
}: UploadPageProps) {
  return (
    <div className="space-y-6">
      <FileUpload
        onTextLoaded={onTextLoaded}
        onLoadSample={onLoadSample}
        isBusy={isBusy}
        currentFileName={dataset?.fileName}
      />

      {dataset ? (
        <div className="rounded-[1.85rem] border border-white/70 bg-white/84 p-6 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
            Current import
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">File</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{dataset.fileName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Imported at</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{dataset.importedAt}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Clean rows</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {dataset.cleaningReport.retainedRows}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
