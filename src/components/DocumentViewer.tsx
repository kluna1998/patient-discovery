import DocumentSearchToolbar from "./DocumentSearchToolbar";
import { useDocumentSearch } from "../hooks/useDocumentSearch";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { getClinicalDocumentText } from "../services/clinicalDocuments";
import type { ClinicalDocument } from "../services/clinicalDocuments";

interface Props {
  document: ClinicalDocument;
  onClose: () => void;
  onShowList?: () => void;
  closeLabel?: string;
}

export default function DocumentViewer({ document, onClose, onShowList, closeLabel }: Props) {
  const [text, setText] = useState<string>();
  const [error, setError] = useState(false);
  const { query, changeQuery, matches, activeIndex, navigate } = useDocumentSearch(text ?? "");
  const readingArea = useRef<HTMLDivElement>(null);
  const activeMark = useRef<HTMLElement>(null);
  const activeMatch = matches[activeIndex];

  useEffect(() => {
    const controller = new AbortController();
    getClinicalDocumentText(document.textPath, controller.signal).then(
      (result) => { if (!controller.signal.aborted) setText(result); },
      () => { if (!controller.signal.aborted) setError(true); },
    );
    return () => controller.abort();
  }, [document.textPath]);

  useEffect(() => {
    const area = readingArea.current;
    const mark = activeMark.current;
    if (!activeMatch || !area || !mark) return;

    const viewport = area.getBoundingClientRect();
    const match = mark.getBoundingClientRect();
    const top = viewport.top + area.clientTop;
    const bottom = top + area.clientHeight;
    if (match.top < top || match.bottom > bottom) {
      const offset = match.top - top - Math.max(0, (area.clientHeight - match.height) / 2);
      area.scrollTo({ top: area.scrollTop + offset });
    }
  }, [activeMatch, query]);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-document-workspace text-sm" aria-label="Contenido del informe">
      <header className={`relative flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line bg-surface py-4 pl-4 lg:pr-4 ${onShowList ? "pr-24" : "pr-14"}`}>
        <div className="flex min-w-0 items-start gap-2">
          <span className="relative mt-1 size-6 shrink-0 text-primary sm:mt-0 sm:h-auto sm:w-11 sm:self-stretch">
            <FileText aria-hidden="true" className="absolute inset-0 size-full" />
          </span>
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
          {onShowList && (
            <button
              type="button"
              className="btn btn-ghost absolute top-4 right-14 size-8 min-h-8 p-0 lg:hidden"
              aria-label="Volver al listado de documentos"
              onClick={onShowList}
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className={closeLabel ? "btn btn-ghost size-8 min-h-8 p-0 sm:w-auto sm:px-3 sm:py-1" : `btn btn-ghost size-8 min-h-8 p-0 ${onShowList ? "hidden lg:inline-flex" : ""}`}
            aria-label={closeLabel ?? "Cerrar visor"}
            onClick={onClose}
          >
            {closeLabel ? (
              <>
                <ArrowLeft size={16} aria-hidden="true" className="sm:hidden" />
                <span className="hidden sm:inline">{closeLabel}</span>
              </>
            ) : <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </div>
      </header>
      {!error && text && (
        <DocumentSearchToolbar
          query={query}
          count={matches.length}
          activeIndex={activeIndex}
          onQueryChange={changeQuery}
          onNavigate={navigate}
        />
      )}
      <div className="flex min-h-0 flex-1 flex-col bg-document-workspace p-4">
        <div ref={readingArea} className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-panel border border-line bg-surface p-6 lg:p-8">
          {error ? <p role="alert">No se pudo cargar el informe.</p> : text === undefined ? (
            <p role="status">Cargando informe…</p>
          ) : text ? (
            <pre className="whitespace-pre-wrap break-words font-sans text-clinical-body text-document-content">
              {matches.map((match, index) => {
                const start = matches[index - 1]?.end ?? 0;
                const active = index === activeIndex;
                return (
                  <Fragment key={match.start}>
                    {text.slice(start, match.start)}
                    <mark
                    ref={active ? activeMark : undefined}
                    className={`rounded-sm text-content-strong ${active ? "bg-document-search-match-active" : "bg-document-search-match"}`}
                  >
                    {text.slice(match.start, match.end)}
                  </mark>
                  </Fragment>
                );
              })}
              {text.slice(matches.at(-1)?.end ?? 0)}
            </pre>
          ) : (
            <pre className="whitespace-pre-wrap break-words font-sans text-clinical-body text-document-content">El informe está vacío.</pre>
          )}
        </div>
      </div>
    </section>
  );
}
