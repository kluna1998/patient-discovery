
import { useState } from "react";
import { parseCsv } from "../services/csvService";
import type { CsvDataset } from "../types/patient";

interface Props {
  onLoad: (dataset: CsvDataset) => void;
}

export default function CsvUploader({ onLoad }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;

    setError("");
    setLoading(true);

    try {
      const dataset = await parseCsv(file);
      onLoad(dataset);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error desconocido"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">
        Cargar resultados de pipeline
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        Selecciona un CSV con datos sintéticos.
      </p>

      <input
        type="file"
        accept=".csv,text/csv"
        disabled={loading}
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        className="mt-4 block w-full text-sm text-slate-600
                   file:mr-4 file:rounded-lg file:border-0
                   file:bg-blue-600 file:px-4 file:py-2
                   file:font-medium file:text-white
                   hover:file:bg-blue-700"
      />

      {loading && (
        <p className="mt-3 text-sm text-blue-600">
          Procesando archivo...
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
