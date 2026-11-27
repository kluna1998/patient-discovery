import type { ClinicalDocument } from "../services/clinicalDocuments";

export default function DocumentTitle({ document, fallback }: { document: ClinicalDocument; fallback?: string }) {
  return document.type
    ? <span className="capitalize">{document.type.toLocaleLowerCase("es")}</span>
    : fallback ?? document.id;
}
