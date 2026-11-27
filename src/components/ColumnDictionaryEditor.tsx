import { useState } from "react";
import { BookOpen, ChevronDown, Download, Plus, Trash2 } from "lucide-react";
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
      <summary className="disclosure-summary font-semibold text-primary">
        <ChevronDown size={14} aria-hidden="true" className="disclosure-chevron" />
        <BookOpen size={16} aria-hidden="true" className="shrink-0" />
        Diccionari de columnes · {entries.length} definicions
      </summary>
      <p className="my-3 text-sm text-content-muted">Edita els títols, les descripcions, les seccions, els criteris i els tipus de dades. Els canvis només s’apliquen durant aquesta sessió i es perden en recarregar la pàgina. Per conservar-los al projecte, baixa el CSV i substitueix el fitxer public/info_columns_dict.csv. Les files d’una mateixa secció han de compartir el mateix ordre.</p>
      <p id="dictionary-synonyms-help" className="my-3 text-sm text-content-muted">A les evidències de text, separa els sinònims amb punt i coma (;).</p>
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={() => { setDraft([...rows, { column_name: "", readable_name: "", meaning: "", section: "", section_order: "", criterion_id: "", criterio: "", tipo: "", value_type: "", explicacion: "" }]); setMessage(""); }}><Plus size={14} />Afegeix una columna</button>
        <button type="button" className="btn" disabled={draft !== null} onClick={() => downloadDictionary(entries)}><Download size={14} />Baixa el diccionari en CSV</button>
      </div>
      <datalist id="dictionary-column-names">{columns.map((name) => <option key={name} value={name} />)}</datalist>
      <div className="dictionary-scroll">
        <table className="dictionary-table">
          <caption className="sr-only">Edita el diccionari de columnes</caption>
          <thead><tr><th scope="col">Nom original</th><th scope="col">Títol llegible</th><th scope="col">Descripció / ajuda</th><th scope="col">Secció</th><th scope="col">Ordre de la secció</th><th scope="col">Identificador del criteri</th><th scope="col">Criteri</th><th scope="col">Tipus</th><th scope="col">Tipus de dada</th><th scope="col">Explicació</th><th scope="col">Sinònims</th><th scope="col">Accions</th></tr></thead>
          <tbody>{rows.map((row, index) => (
            <tr key={index}>
              <td><input className="text-input" aria-label={`Nom original, fila ${index + 1}`} list="dictionary-column-names" value={row.column_name} onChange={(event) => update(index, "column_name", event.target.value)} /></td>
              <td><input className="text-input" aria-label={`Títol llegible, fila ${index + 1}`} value={row.readable_name} onChange={(event) => update(index, "readable_name", event.target.value)} /></td>
              <td><textarea className="text-input" rows={2} aria-label={`Descripció, fila ${index + 1}`} value={row.meaning} onChange={(event) => update(index, "meaning", event.target.value)} /></td>
              <td><input className="text-input" aria-label={`Secció, fila ${index + 1}`} value={row.section} onChange={(event) => update(index, "section", event.target.value)} /></td>
              <td><input type="number" step="1" className="text-input" aria-label={`Ordre de la secció, fila ${index + 1}`} value={row.section_order} onChange={(event) => update(index, "section_order", event.target.value)} /></td>
              <td><input className="text-input" aria-label={`Identificador del criteri, fila ${index + 1}`} value={row.criterion_id ?? ""} onChange={(event) => update(index, "criterion_id", event.target.value)} /></td>
              <td><input className="text-input" aria-label={`Criteri, fila ${index + 1}`} value={row.criterio ?? ""} onChange={(event) => update(index, "criterio", event.target.value)} /></td>
              <td>
                <select className="text-input" aria-label={`Tipus, fila ${index + 1}`} value={row.tipo ?? ""} onChange={(event) => update(index, "tipo", event.target.value)}>
                  <option value="">Sense especificar</option>
                  <option value="Valor">Valor</option>
                  <option value="Evidencia">Evidència</option>
                  <option value="Unidades">Unitats</option>
                </select>
              </td>
              <td>
                <select className="text-input" aria-label={`Tipus de dada, fila ${index + 1}`} value={row.value_type ?? ""} onChange={(event) => update(index, "value_type", event.target.value)}>
                  <option value="">Sense especificar</option>
                  <option value="boolean">Booleà</option>
                  <option value="number">Nombre</option>
                  <option value="text">Text</option>
                  <option value="date">Data</option>
                </select>
              </td>
              <td><textarea className="text-input" rows={2} aria-label={`Explicació, fila ${index + 1}`} value={row.explicacion ?? ""} onChange={(event) => update(index, "explicacion", event.target.value)} /></td>
              <td>
                <input
                  className="text-input"
                  aria-label={`Sinònims, fila ${index + 1}`}
                  aria-describedby="dictionary-synonyms-help"
                  disabled={row.tipo !== "Evidencia" || row.value_type !== "text"}
                  value={row.Sinonimos ?? ""}
                  onChange={(event) => update(index, "Sinonimos", event.target.value)}
                />
              </td>
              <td><button type="button" className="btn" aria-label={`Suprimeix ${row.column_name || `fila ${index + 1}`}`} onClick={() => { setDraft(rows.filter((_, i) => i !== index)); setError(""); setMessage(""); }}><Trash2 size={14} /></button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="py-4">No hi ha definicions. Afegeix una columna per començar.</p>}
      {error && <p role="alert" className="error-message mt-3">{error}</p>}
      <p role="status" className="mt-3 text-sm text-secondary">{message}</p>
      {draft !== null && <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={() => {
          try { onSave(validateDictionary(draft)); setDraft(null); setError(""); setMessage("Els canvis s’han aplicat a aquesta sessió. Baixa el CSV per conservar-los."); }
          catch (cause) { setError(cause instanceof Error ? cause.message : "No s’ha pogut desar el diccionari."); }
        }}>Aplica els canvis</button>
        <button type="button" className="btn" onClick={() => { setDraft(null); setError(""); setMessage(""); }}>Descarta els canvis</button>
        <span className="self-center text-xs text-content-subtle">Canvis pendents de desar</span>
      </div>}
    </details>
  );
}
