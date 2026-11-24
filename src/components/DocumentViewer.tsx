import { FileText, Search, X } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { getClinicalDocumentText } from "../services/clinicalDocuments";
import type { ClinicalDocument } from "../services/clinicalDocuments";

interface Props {
  document: ClinicalDocument;
  onClose: () => void;
  onShowList: () => void;
}

export default function DocumentViewer({ document, onClose, onShowList }: Props) {
  const [text, setText] = useState<string>();
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getClinicalDocumentText(document.textPath, controller.signal).then(
      (result) => { if (!controller.signal.aborted) setText(result); },
      () => { if (!controller.signal.aborted) setError(true); },
    );
    return () => controller.abort();
  }, [document.textPath]);

  const term = query.trim();
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = text && term ? Array.from(text.matchAll(new RegExp(escapedTerm, "giu"))) : [];
  const lastMatch = matches.at(-1);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-document-workspace text-sm" aria-label="Contenido del informe">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line bg-surface py-4 pl-4 pr-14 lg:pr-4">
        <div className="flex min-w-0 items-start gap-2">
          <FileText size={20} aria-hidden="true" className="mt-1 shrink-0 text-primary" />
          <div className="min-w-0">
            <h3 className="wrap-break-word text-lg font-semibold text-primary">
              {document.type || "Informe clínico"}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-content-muted">
              {document.date && <span>{document.date}</span>}
              <span className="rounded-md border border-line bg-surface-muted px-2">Solo lectura</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost min-h-8 px-3 py-1 lg:hidden" onClick={onShowList}>
            Ver lista
          </button>
          <button type="button" className="btn btn-ghost size-8 min-h-8 p-0" aria-label="Cerrar visor" onClick={onClose}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </header>
      {!error && text && (
        <div className="shrink-0 border-b border-line bg-surface px-4 py-2">
          <label className="relative block">
            <span className="sr-only">Buscar en este informe</span>
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-2 left-3 text-content-muted" />
            <input
              type="search"
              className="text-input h-8 py-1 pl-9"
              placeholder="Buscar en este informe…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <p role="status" className="text-content-subtle">
            {term && matches.length === 0 ? "Sin coincidencias" : ""}
          </p>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col bg-document-workspace p-4">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-panel border border-line bg-surface p-6 lg:p-8">
          {error ? <p role="alert">No se pudo cargar el informe.</p> : text === undefined ? (
            <p role="status">Cargando informe…</p>
          ) : text ? (
            <pre className="whitespace-pre-wrap break-words font-sans text-clinical-body text-document-content">
              {matches.map((match, index) => {
                const previous = matches[index - 1];
                const start = previous ? previous.index + previous[0].length : 0;
                return (
                  <Fragment key={match.index}>
                    {text.slice(start, match.index)}
                    <mark className="rounded-sm bg-document-search-match text-content-strong">{match[0]}</mark>
                  </Fragment>
                );
              })}
              {lastMatch ? text.slice(lastMatch.index + lastMatch[0].length) : text}
            </pre>
          ) : (
            <pre className="whitespace-pre-wrap break-words font-sans text-clinical-body text-document-content">El informe está vacío.</pre>
          )}
        </div>
      </div>
    </section>
  );
}
