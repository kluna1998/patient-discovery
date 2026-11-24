import { Fragment, useEffect, useState } from "react";
import { getClinicalDocumentText } from "../services/clinicalDocuments";
import type { ClinicalDocument } from "../services/clinicalDocuments";

export default function DocumentViewer({ document }: { document: ClinicalDocument }) {
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
    <section className="mt-4 border-t border-line pt-4" aria-label="Contenido del informe">
      {error ? <p role="alert">No se pudo cargar el informe.</p> : text === undefined ? (
        <p role="status">Cargando informe…</p>
      ) : text ? (
        <>
          <label className="mb-3 block">
            <span className="mb-1 block font-medium text-content-strong">Buscar en este informe</span>
            <input
              type="search"
              className="text-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <p role="status" className="text-content-subtle">
            {term && matches.length === 0 ? "Sin coincidencias" : ""}
          </p>
          <pre className="whitespace-pre-wrap break-words font-sans leading-relaxed">
            {matches.map((match, index) => {
              const previous = matches[index - 1];
              const start = previous ? previous.index + previous[0].length : 0;
              return (
                <Fragment key={match.index}>
                  {text.slice(start, match.index)}
                  <mark className="rounded-sm bg-amber-200 text-content-strong">{match[0]}</mark>
                </Fragment>
              );
            })}
            {lastMatch ? text.slice(lastMatch.index + lastMatch[0].length) : text}
          </pre>
        </>
      ) : (
        <pre className="whitespace-pre-wrap break-words font-sans leading-relaxed">El informe está vacío.</pre>
      )}
    </section>
  );
}
