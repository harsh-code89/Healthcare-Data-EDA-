import { useRef, useState } from "react";
import { ArrowRight, Check, FileSpreadsheet, FolderUp, LockKeyhole, Sparkles, UploadCloud } from "lucide-react";

interface FileUploadProps {
  onTextLoaded: (fileName: string, text: string) => Promise<void> | void;
  onLoadSample: () => Promise<void> | void;
  isBusy: boolean;
  currentFileName?: string;
}

export function FileUpload({ onTextLoaded, onLoadSample, isBusy, currentFileName }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function readFile(file: File) {
    await onTextLoaded(file.name, await file.text());
  }

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) await readFile(file);
  }

  return (
    <div className="upload-grid">
      <div
        className={`upload-card ${dragActive ? "is-dragging" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={async (event) => { event.preventDefault(); setDragActive(false); await handleFiles(event.dataTransfer.files); }}
      >
        <div className="upload-card-header">
          <div><p className="upload-overline"><Sparkles className="h-3.5 w-3.5" /> Data intake</p><h2>Bring your patient data into ViteLens.</h2><p className="upload-description">Start with a CSV and move through schema matching, data quality, cohort exploration, and insight generation in one guided workspace.</p></div>
          <span className="upload-file-badge">CSV / max 50 MB</span>
        </div>
        <button type="button" disabled={isBusy} onClick={() => inputRef.current?.click()} className="upload-dropzone">
          <span className="upload-icon"><UploadCloud className="h-6 w-6" /></span>
          <span className="upload-drop-title">{isBusy ? "Importing your dataset..." : "Drop a CSV here or choose a file"}</span>
          <span className="upload-drop-hint">Include a header row for the best field matching</span>
          {currentFileName ? <span className="upload-current-file"><Check className="h-3.5 w-3.5" /> {currentFileName}</span> : null}
        </button>
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={async (event) => { await handleFiles(event.target.files); event.target.value = ""; }} />
        <div className="upload-actions"><button type="button" disabled={isBusy} onClick={() => inputRef.current?.click()} className="btn btn-solid"><FolderUp className="h-4 w-4" /> Browse files <ArrowRight className="h-3.5 w-3.5" /></button><button type="button" disabled={isBusy} onClick={onLoadSample} className="btn btn-outline"><FileSpreadsheet className="h-4 w-4" /> Use sample data</button></div>
        <div className="upload-local-note"><LockKeyhole className="h-3.5 w-3.5" /> Files are processed locally in this browser and never uploaded by ViteLens.</div>
      </div>

      <aside className="upload-aside">
        <p className="upload-aside-overline">What happens next</p>
        <h3>A guided path to insight.</h3>
        <div className="upload-steps"><div><span>01</span><p><strong>Map</strong><small>Recognize common healthcare fields and aliases.</small></p></div><div><span>02</span><p><strong>Check</strong><small>Surface missing, invalid, duplicate, and outlier values.</small></p></div><div><span>03</span><p><strong>Focus</strong><small>Explore the signals that matter to your cohort.</small></p></div></div>
        <div className="upload-aside-foot">Designed for analysts, students, and health teams who need a reliable starting point before making decisions.</div>
      </aside>
    </div>
  );
}
