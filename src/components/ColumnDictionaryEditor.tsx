import { useState } from "react";
import { BookOpen, Download, Plus, Trash2 } from "lucide-react";
import { downloadDictionary, validateDictionary } from "../services/columnDictionary";
import type { ColumnInfo } from "../services/columnDictionary";

interface Props {
  entries: ColumnInfo[];
  columns: string[];
  onSave: (entries: ColumnInfo[]) => void;
}

export default function ColumnDictionaryEditor({ entries, columns, onSave }: Props) {
  const [draft, setDraft] = useState<(Omit<ColumnInfo, "section_order"> & { section_order: number | string })[] | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const rows = draft ?? entries;

  function update(index: number, field: keyof ColumnInfo, value: string) {
    setDraft(rows.map((row, i) => i === index ? { ...row, [field]: value } : row));
    setError("");
    setMessage("");
  }

  return (
    <details className="panel my-5 p-5">
      <summary className="font-semibold text-primary"><BookOpen size={16} className="mr-2 inline" />Diccionario de columnas · {entries.length} definiciones</summary>
      <p className="my-3 text-sm text-slate-600">Edita los títulos, las descripciones, las secciones y su orden. Los cambios se aplican solo durante esta sesión y se pierden al recargar. Descarga el CSV y sustituye public/info_columns_dict.csv para conservarlos en el proyecto. Las filas de una misma sección deben compartir el mismo orden.</p>
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={() => { setDraft([...rows, { column_name: "", readable_name: "", meaning: "", section: "", section_order: "" }]); setMessage(""); }}><Plus size={14} />Añadir columna</button>
        <button type="button" className="btn" disabled={draft !== null} onClick={() => downloadDictionary(entries)}><Download size={14} />Descargar diccionario CSV</button>
      </div>
      <datalist id="dictionary-column-names">{columns.map((name) => <option key={name} value={name} />)}</datalist>
      <div className="dictionary-scroll">
        <table className="dictionary-table">
          <caption className="sr-only">Editar nombres, descripciones y secciones de columnas</caption>
          <thead><tr><th scope="col">Nombre original</th><th scope="col">Título legible</th><th scope="col">Descripción / ayuda</th><th scope="col">Sección</th><th scope="col">Orden de sección</th><th scope="col">Acciones</th></tr></thead>
          <tbody>{rows.map((row, index) => (
            <tr key={index}>
              <td><input className="text-input" aria-label={`Nombre original, fila ${index + 1}`} list="dictionary-column-names" value={row.column_name} onChange={(event) => update(index, "column_name", event.target.value)} /></td>
              <td><input className="text-input" aria-label={`Título legible, fila ${index + 1}`} value={row.readable_name} onChange={(event) => update(index, "readable_name", event.target.value)} /></td>
              <td><textarea className="text-input" rows={2} aria-label={`Descripción, fila ${index + 1}`} value={row.meaning} onChange={(event) => update(index, "meaning", event.target.value)} /></td>
              <td><input className="text-input" aria-label={`Sección, fila ${index + 1}`} value={row.section} onChange={(event) => update(index, "section", event.target.value)} /></td>
              <td><input type="number" step="1" className="text-input" aria-label={`Orden de sección, fila ${index + 1}`} value={row.section_order} onChange={(event) => update(index, "section_order", event.target.value)} /></td>
              <td><button type="button" className="btn" aria-label={`Eliminar ${row.column_name || `fila ${index + 1}`}`} onClick={() => { setDraft(rows.filter((_, i) => i !== index)); setError(""); setMessage(""); }}><Trash2 size={14} /></button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="py-4">No hay definiciones. Añade una columna para empezar.</p>}
      {error && <p role="alert" className="error-message mt-3">{error}</p>}
      <p role="status" className="mt-3 text-sm text-secondary">{message}</p>
      {draft !== null && <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={() => {
          try { onSave(validateDictionary(draft)); setDraft(null); setError(""); setMessage("Cambios aplicados a esta sesión. Descarga el CSV para conservarlos."); }
          catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar el diccionario."); }
        }}>Aplicar cambios</button>
        <button type="button" className="btn" onClick={() => { setDraft(null); setError(""); setMessage(""); }}>Descartar cambios</button>
        <span className="self-center text-xs text-slate-500">Cambios pendientes de guardar</span>
      </div>}
    </details>
  );
}
