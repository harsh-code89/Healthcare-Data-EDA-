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
        <div className="upload-import-card">
          <div className="upload-import-heading"><div><p>Current import</p><span>The latest file is ready for review.</span></div><b><i /> Local session</b></div>
          <div className="upload-import-grid"><div><span>File</span><strong>{dataset.fileName}</strong></div><div><span>Imported at</span><strong>{dataset.importedAt}</strong></div><div><span>Clean rows</span><strong>{dataset.cleaningReport.retainedRows}</strong></div></div>
        </div>
      ) : null}
    </div>
  );
}
