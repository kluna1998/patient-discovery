import type { ComponentProps, MouseEvent, ReactElement } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getClinicalDocuments } from "../services/clinicalDocuments";
import type { ClinicalDocument } from "../services/clinicalDocuments";
import type { EvidenceField, EvidenceSearchState } from "../types/evidence";
import { formatMatchCount, partialEvidenceLabel } from "../utils/evidenceLabels";
import ClinicalDocumentsList from "./ClinicalDocumentsList";
import DocumentViewer from "./DocumentViewer";
import EvidenceRegexField from "./EvidenceRegexField";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";

interface EvidenceMode {
  field: EvidenceField;
  pattern: string;
  state: EvidenceSearchState;
  retry: () => void;
}

type Props = Pick<ComponentProps<typeof Sheet>, "open" | "onOpenChange"> & {
  children: ReactElement;
  container?: HTMLElement | null;
  patientId: string | undefined;
  evidence?: EvidenceMode;
  onCloseAutoFocus?: ComponentProps<typeof SheetContent>["onCloseAutoFocus"];
};

export default function ClinicalDocumentsSheet({ children, container, patientId, evidence, onCloseAutoFocus, ...props }: Props) {
  const id = patientId?.trim();

  return (
    <Sheet {...props}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent container={container} className="clinical-documents-sheet" aria-describedby={undefined} onCloseAutoFocus={onCloseAutoFocus}>
        <ClinicalDocumentsPanels
          key={evidence ? `evidence:${evidence.field.columnName}:${evidence.state.status}` : `patient:${id}`}
          patientId={id}
          evidence={evidence}
        />
      </SheetContent>
    </Sheet>
  );
}

function ClinicalDocumentsPanels({ patientId, evidence }: { patientId?: string; evidence?: EvidenceMode }) {
  const report = evidence?.state.status === "complete" ? evidence.state.report : undefined;
  const references = evidence && report?.results.get(evidence.field.columnName)?.references;
  const unmatchedDocuments = references?.length === 0 && report?.failedDocuments === 0 ? report.documents : undefined;
  const byId = references && new Map(references.map((reference) => [reference.document.id, reference]));
  const direct = references?.length === 1 ? references[0].document : unmatchedDocuments?.[0];
  const [selected, setSelected] = useState<ClinicalDocument | undefined>(direct);
  const [reading, setReading] = useState(!!direct);
  const selectedButton = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLElement>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const focusAfterChange = useRef<"list" | "viewer" | null>(null);

  useLayoutEffect(() => {
    const target = focusAfterChange.current;
    focusAfterChange.current = null;
    if (target === "list") {
      (selectedButton.current ?? list.current?.querySelector("button"))?.focus({ preventScroll: true });
    }
    if (target === "viewer") viewer.current?.focus({ preventScroll: true });
  }, [reading, selected]);

  const [documents, setDocuments] = useState<ClinicalDocument[]>();
  const [indexError, setIndexError] = useState(false);
  const evidenceMode = !!evidence;

  useEffect(() => {
    if (!patientId || evidenceMode) return;
    let active = true;
    getClinicalDocuments(patientId).then(
      (result) => { if (active) setDocuments(result); },
      () => { if (active) setIndexError(true); },
    );
    return () => { active = false; };
  }, [patientId, evidenceMode]);

  function selectDocument(document: ClinicalDocument, button: HTMLButtonElement) {
    selectedButton.current = button;
    if (window.matchMedia("(width < 64rem)").matches) focusAfterChange.current = "viewer";
    setSelected(document);
    setReading(true);
  }

  function showList() {
    focusAfterChange.current = "list";
    setReading(false);
  }

  function closeViewer() {
    showList();
    setSelected(undefined);
  }

  function retryEvidence(event: MouseEvent<HTMLButtonElement>) {
    event.currentTarget.closest<HTMLElement>('[data-slot="sheet-content"]')?.focus();
    evidence?.retry();
  }

  return (
    <>
      <section
        ref={list}
        aria-label="Listado de documentos"
        className={`clinical-documents-drawer min-h-0 min-w-0 flex-1 flex-col bg-surface ${reading ? "hidden lg:flex" : "flex"}`}
      >
        <header className="shrink-0 border-b border-line bg-surface py-4 pl-4 pr-14">
          <SheetTitle className="text-lg font-semibold text-primary">{evidence ? "Referencias documentales" : "Documentos clínicos"}</SheetTitle>
          {evidence && (
            <>
              <p className="mt-2 break-words text-sm font-semibold">{evidence.field.name}</p>
              <p className="whitespace-pre-wrap break-words text-sm text-content-muted">{evidence.field.value}</p>
              {references && (references.length > 0 || !report?.failedDocuments) && (
                <p className="mt-1 text-xs text-content-muted">
                  {unmatchedDocuments
                    ? "0 documentos con coincidencias"
                    : `${references.length} ${references.length === 1 ? "documento" : "documentos"} · ${formatMatchCount(references.reduce((total, ref) => total + ref.matches.length, 0))}`}
                </p>
              )}
            </>
          )}
          {!evidence && documents && (
            <p className="mt-1 text-xs text-content-muted">
              {documents.length} {documents.length === 1 ? "documento" : "documentos"}
            </p>
          )}
          {selected && !reading && (
            <button
              type="button"
              className="btn btn-ghost mt-2 min-h-8 px-3 py-1 lg:hidden"
              onClick={() => {
                focusAfterChange.current = "viewer";
                setReading(true);
              }}
            >
              Volver a lectura
            </button>
          )}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 text-sm">
          {evidence ? (
            <>
              {evidence.state.status === "loading" && <p role="status">Buscando referencias documentales…</p>}
              {evidence.state.status === "error" && (
                <>
                  <p role="alert">{evidence.state.message}</p>
                  <button type="button" className="btn mt-2" onClick={retryEvidence}>Reintentar búsqueda</button>
                </>
              )}
              {!!report?.failedDocuments && (
                <div className="mb-3">
                  <p role="status">{partialEvidenceLabel}. Algunos informes no se pudieron leer.</p>
                  {!references?.length && <button type="button" className="btn mt-2" onClick={retryEvidence}>Reintentar búsqueda</button>}
                </div>
              )}
              {!!references?.length && (
                <ClinicalDocumentsList documents={references.map((ref) => ref.document)} references={byId}
                  indexError={false} selected={selected} onSelect={selectDocument} />
              )}
              {unmatchedDocuments && (
                <>
                  <h3 className="mb-2 font-medium text-primary">Documentos del paciente</h3>
                  <ClinicalDocumentsList documents={unmatchedDocuments} indexError={false}
                    selected={selected} onSelect={selectDocument} />
                  {unmatchedDocuments.length === 0 && (
                    <div className="mt-4"><EvidenceRegexField pattern={evidence.pattern} /></div>
                  )}
                </>
              )}
            </>
          ) : patientId ? (
            <ClinicalDocumentsList documents={documents} indexError={indexError} selected={selected} onSelect={selectDocument} />
          ) : (
            <p>Este registro no tiene un identificador de paciente (nhc).</p>
          )}
        </div>
      </section>
      {selected && (
        <div
          ref={viewer}
          tabIndex={-1}
          role="region"
          aria-label="Lectura del informe"
          data-document-viewer=""
          className={`min-h-0 min-w-0 flex-1 flex-col ${reading ? "flex" : "hidden lg:flex"}`}
        >
          <DocumentViewer key={selected.id} document={selected} onClose={closeViewer} onShowList={showList}
            evidence={byId?.get(selected.id)} evidencePattern={evidence?.pattern} partialEvidence={!!report?.failedDocuments} />
        </div>
      )}
    </>
  );
}
