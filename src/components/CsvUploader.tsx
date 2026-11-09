import { useRef, useState } from "react";
import { Upload, FileUp, AlertCircle, LoaderCircle } from "lucide-react";
import { parseCsv } from "../services/csvService";
import type { CsvDataset } from "../types/patient";

interface Props {
  onLoad: (dataset: CsvDataset) => void;
  compact?: boolean;
}

export default function CsvUploader({ onLoad, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleFile(file?: File) {
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      onLoad(await parseCsv(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido cargar el archivo.");
    } finally {
      setLoading(false);
    }
  }
  if (compact) {
    return (
      <div className="relative" aria-busy={loading}>
        <input
          ref={inputRef}
          id="cohort-file"
          type="file"
          accept=".csv,text/csv"
          disabled={loading}
          aria-label="Cargar otro CSV"
          hidden
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          className="btn"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? (
            <LoaderCircle
              size={16}
              className="animate-spin motion-reduce:animate-none"
            />
          ) : (
            <Upload size={16} />
          )}
          {loading ? "Procesando archivo..." : "Cargar otro CSV"}
        </button>
        <div aria-live="polite">
          {error && (
            <p role="alert" className="error-message mt-2 max-w-sm">
              <AlertCircle size={16} />
              {error} Selecciona otro archivo e inténtalo de nuevo.
            </p>
          )}
        </div>
      </div>
    );
  }
  return (
    <section
      className="panel upload-panel"
      aria-labelledby="upload-title"
      aria-busy={loading}
    >
      <div className="upload-intro">
        <span className="icon-tile">
          <Upload size={21} />
        </span>
        <div>
          <h2 id="upload-title" className="font-semibold text-slate-900">
            Cargar resultados
          </h2>
          <p id="upload-help" className="mt-1 text-sm text-slate-600">
            Selecciona un archivo CSV con los registros de la cohorte.
          </p>
        </div>
      </div>
      <div className="upload-control">
        <label
          htmlFor="cohort-file"
          className="mb-2 block text-xs font-medium text-slate-600"
        >
          <FileUp size={14} className="mr-1 inline" /> Archivo de resultados ·
          CSV
        </label>
        <input
          id="cohort-file"
          type="file"
          accept=".csv,text/csv"
          disabled={loading}
          aria-describedby="upload-help upload-status"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
          className="file-input"
        />
      </div>
      <div
        id="upload-status"
        className={loading || error ? "upload-feedback" : "sr-only"}
        aria-live="polite"
      >
        {loading && (
          <p className="flex items-center gap-2 text-sm text-blue-800">
            <LoaderCircle
              size={16}
              className="animate-spin motion-reduce:animate-none"
            />
            Procesando archivo...
          </p>
        )}
        {error && (
          <p role="alert" className="error-message">
            <AlertCircle size={16} />
            {error} Selecciona otro archivo e inténtalo de nuevo.
          </p>
        )}
      </div>
    </section>
  );
}
