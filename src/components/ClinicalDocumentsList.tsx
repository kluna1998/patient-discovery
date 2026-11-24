import { FileText } from "lucide-react";
import type { ClinicalDocument } from "../services/clinicalDocuments";

interface Props {
  documents?: ClinicalDocument[];
  indexError: boolean;
  selected?: ClinicalDocument;
  onSelect: (document: ClinicalDocument, button: HTMLButtonElement) => void;
}

export default function ClinicalDocumentsList({ documents, indexError, selected, onSelect }: Props) {
  if (indexError) return <p role="alert">No se pudo cargar la lista de documentos.</p>;
  if (!documents) return <p role="status">Cargando documentos…</p>;
  if (!documents.length) return <p>No hay documentos para este paciente.</p>;

  return (
    <ul className="space-y-2">
      {documents.map((document) => (
        <li key={document.id}>
          <button
            type="button"
            aria-pressed={selected?.id === document.id}
            className="btn w-full justify-start gap-2 px-3 py-3 text-left hover:bg-document-row-hover aria-pressed:border-document-row-selected-border aria-pressed:bg-document-row-selected motion-safe:transition-colors motion-safe:duration-150"
            onClick={(event) => onSelect(document, event.currentTarget)}
          >
            <FileText
              size={16}
              aria-hidden="true"
              className={`shrink-0 ${selected?.id === document.id ? "text-primary" : "text-content-subtle"}`}
            />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="wrap-break-word">{document.type || document.id}</span>
              {document.date && <span className="text-xs font-normal text-content-muted">{document.date}</span>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
