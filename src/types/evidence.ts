import type { ClinicalDocument } from "../services/clinicalDocuments";
import type { TextMatch } from "../utils/textSearch";

export interface EvidenceMatch extends TextMatch {
  matchedText: string;
}

export interface DocumentEvidenceReference {
  document: ClinicalDocument;
  matches: readonly EvidenceMatch[];
  metadataMatch: boolean;
  text?: string;
}

export interface EvidenceField {
  criterionId: string;
  columnName: string;
  name: string;
  value: string;
}

export interface EvidenceSearchResult extends EvidenceField {
  references: readonly DocumentEvidenceReference[];
}

export interface EvidenceReport {
  results: ReadonlyMap<string, EvidenceSearchResult>;
  failedDocuments: number;
}

export type EvidenceSearchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "complete"; report: EvidenceReport };
