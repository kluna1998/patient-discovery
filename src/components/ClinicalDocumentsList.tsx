import { Eye, FileText } from "lucide-react";
import type { ClinicalDocument } from "../services/clinicalDocuments";
import type { DocumentEvidenceReference } from "../types/evidence";
import { formatMatchCount, metadataMatchLabel } from "../utils/evidenceLabels";
import DocumentTitle from "./DocumentTitle";

interface Props {
  documents?: readonly ClinicalDocument[];
  indexError: boolean;
  selected?: ClinicalDocument;
  onSelect: (document: ClinicalDocument, button: HTMLButtonElement) => void;
  references?: ReadonlyMap<string, DocumentEvidenceReference>;
}

export default function ClinicalDocumentsList({ documents, indexError, selected, onSelect, references }: Props) {
  if (indexError) return <p role="alert">No s’ha pogut carregar la llista de documents.</p>;
  if (!documents) return <p role="status">S’estan carregant els documents…</p>;
  if (!documents.length) return <p>No hi ha documents per a aquest pacient.</p>;

  return (
    <ul className="space-y-2">
      {documents.map((document) => {
        const isSelected = selected?.id === document.id;
        const Icon = isSelected ? Eye : FileText;
        const reference = references?.get(document.id);
        const summary = [document.date, reference?.matches.length ? formatMatchCount(reference.matches.length) : ""]
          .filter(Boolean).join(" · ");
        return (
          <li key={document.id}>
            <button
              type="button"
              aria-pressed={isSelected}
              className="btn w-full justify-start gap-2 px-3 py-3 text-left hover:bg-document-row-hover aria-pressed:border-document-row-selected-border aria-pressed:bg-document-row-selected motion-safe:transition-colors motion-safe:duration-150"
              onClick={(event) => onSelect(document, event.currentTarget)}
            >
              <Icon
                size={16}
                aria-hidden="true"
                className={`shrink-0 ${isSelected ? "text-primary" : "text-content-subtle"}`}
              />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="wrap-anywhere"><DocumentTitle document={document} /></span>
                {summary && <span className="text-xs font-normal text-content-muted">{summary}</span>}
                {reference?.metadataMatch && (
                  <span className="text-xs font-normal text-content-muted">{metadataMatchLabel}</span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
