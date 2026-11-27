import type { ComponentProps, MouseEvent, ReactElement, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useEvidenceMatching } from "../hooks/useEvidenceMatching";
import type { CsvDataset } from "../types/patient";
import type { ColumnInfo } from "../services/columnDictionary";
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

type EvidenceSearch = ReturnType<typeof useEvidenceMatching>;

interface CohortEvidence {
  cohort: CsvDataset;
  dictionary: ColumnInfo[];
  indexes: number[];
}

type Props = Pick<ComponentProps<typeof Sheet>, "open" | "onOpenChange"> & {
  children: ReactElement;
  container?: HTMLElement | null;
  patientId: string | undefined;
  evidence?: EvidenceMode;
  evidenceSearch?: EvidenceSearch;
  cohortEvidence?: CohortEvidence;
  embedded?: boolean;
  referenceVisit?: number;
  onReadingChange?: (reading: boolean) => void;
  onCloseAutoFocus?: ComponentProps<typeof SheetContent>["onCloseAutoFocus"];
};

export default function ClinicalDocumentsSheet({ children, container, patientId, evidence, evidenceSearch, cohortEvidence, embedded = false, referenceVisit, onReadingChange, onCloseAutoFocus, ...props }: Props) {
  const id = patientId?.trim();

  return (
    <Sheet {...props} modal={!embedded}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent container={container} showOverlay={!embedded} className="clinical-documents-sheet" aria-describedby={undefined}
        onInteractOutside={embedded ? (event) => event.preventDefault() : undefined} onCloseAutoFocus={onCloseAutoFocus}>
        {cohortEvidence ? (
          <CohortEvidencePanel patientId={id} {...cohortEvidence} />
        ) : evidenceSearch ? (
          <EvidencePanels patientId={id} search={evidenceSearch} onReadingChange={onReadingChange} />
        ) : (
          <ClinicalDocumentsPanels
            key={evidence ? `evidence:${evidence.field.columnName}:${evidence.state.status}:${referenceVisit}` : `patient:${id}`}
            patientId={id}
            evidence={evidence}
            onReadingChange={onReadingChange}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function CohortEvidencePanel({ patientId, cohort, dictionary, indexes }: CohortEvidence & { patientId?: string }) {
  const [recordIndex, setRecordIndex] = useState<number>();
  const index = recordIndex ?? indexes[0];
  const [expanded, setExpanded] = useState(true);
  const chooser = indexes.length > 1 && (
    <label className="mb-3 block text-sm">
      Registro de la cohorte
      <select className="text-input mt-1" value={index} onChange={(event) => setRecordIndex(Number(event.target.value))}>
        {indexes.map((item) => <option key={item} value={item}>Registro #{item + 1}</option>)}
      </select>
    </label>
  );

  if (index === undefined) {
    return <ClinicalDocumentsPanels patientId={patientId} controls={<p role="status" className="mb-3">Sin registro en la cohorte</p>} />;
  }
  return <RecordEvidencePanels key={index} patientId={patientId} cohort={cohort} dictionary={dictionary} index={index}
    chooser={chooser} expanded={expanded} onExpandedChange={setExpanded} />;
}

function RecordEvidencePanels({ patientId, cohort, dictionary, index, chooser, expanded, onExpandedChange }: {
  patientId?: string;
  cohort: CsvDataset;
  dictionary: ColumnInfo[];
  index: number;
  chooser: ReactNode;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}) {
  const search = useEvidenceMatching(cohort, cohort.rows[index], dictionary, expanded);
  return <EvidencePanels patientId={patientId} search={search} chooser={chooser} expanded={expanded} onExpandedChange={onExpandedChange} />;
}

function EvidencePanels({ patientId, search, chooser, expanded: controlledExpanded, onExpandedChange, onReadingChange }: {
  patientId?: string;
  search: EvidenceSearch;
  chooser?: ReactNode;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onReadingChange?: (reading: boolean) => void;
}) {
  const [localExpanded, setExpanded] = useState(false);
  const expanded = controlledExpanded ?? localExpanded;
  const [column, setColumn] = useState("");
  const { queries, state, retry } = search;
  const query = expanded ? queries.get(column) : undefined;
  const report = state.status === "complete" ? state.report : undefined;
  const controls = (
    <>
      {chooser}
      <details className="mb-3 rounded-panel border border-line p-3" open={expanded}
        onToggle={(event) => (onExpandedChange ?? setExpanded)(event.currentTarget.open)}>
        <summary className="disclosure-summary font-semibold text-primary">
          <ChevronDown size={14} aria-hidden="true" className="disclosure-chevron" />
          Evidencias
        </summary>
        {expanded && <div className="mt-2 space-y-2">
          {queries.size === 0 ? <p role="status">Sin evidencias configuradas</p>
            : state.status === "loading" ? <p role="status">Buscando referencias documentales…</p>
            : state.status === "error" ? (
              <>
                <p role="alert">{state.message}</p>
                <button type="button" className="btn" onClick={retry}>Reintentar búsqueda</button>
              </>
            ) : report && (
              <>
                <p role="status" className="hidden">{report.failedDocuments ? partialEvidenceLabel
                  : [...report.results.values()].some((result) => result.references.length)
                    ? "Se han encontrado evidencias" : "No se han encontrado evidencias"}</p>
                {report.failedDocuments > 0 && <button type="button" className="btn" onClick={retry}>Reintentar búsqueda</button>}
                <label className="block">
                  <select className="text-input mt-1" value={column} onChange={(event) => setColumn(event.target.value)}>
                    <option value="">Todos los documentos</option>
                    {[...report.results].map(([key, result]) => {
                      const count = result.references.length;
                      if (count === 0) return null;
                      const label = `${count}`;
                      return <option key={key} value={key}>({label}) - {result.name}</option>;
                    })}
                  </select>
                </label>
              </>
            )}
        </div>}
      </details>
    </>
  );

  return <ClinicalDocumentsPanels patientId={patientId} controls={controls} onReadingChange={onReadingChange}
    evidence={query && report ? { field: query.field, pattern: query.regex.toString(), state, retry } : undefined} />;
}

function ClinicalDocumentsPanels({ patientId, evidence, controls, onReadingChange }: {
  patientId?: string;
  evidence?: EvidenceMode;
  controls?: ReactNode;
  onReadingChange?: (reading: boolean) => void;
}) {
  const report = evidence?.state.status === "complete" ? evidence.state.report : undefined;
  const references = evidence && report?.results.get(evidence.field.columnName)?.references;
  const unmatchedDocuments = !controls && references?.length === 0 && report?.failedDocuments === 0 ? report.documents : undefined;
  const byId = references && new Map(references.map((reference) => [reference.document.id, reference]));
  const direct = !controls && references?.length === 1 ? references[0].document : unmatchedDocuments?.[0];
  const [selected, setSelected] = useState<ClinicalDocument | undefined>(direct);
  const [reading, setReading] = useState(!!direct);
  const columnName = evidence?.field.columnName;
  const [previousColumn, setPreviousColumn] = useState(columnName);
  if (previousColumn !== columnName) {
    setPreviousColumn(columnName);
    setSelected(undefined);
    setReading(false);
  }
  const selectedButton = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLElement>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const focusAfterChange = useRef<"list" | "viewer" | null>(direct && onReadingChange ? "viewer" : null);

  useLayoutEffect(() => {
    onReadingChange?.(reading);
  }, [onReadingChange, reading]);

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
    if (onReadingChange || window.matchMedia("(width < 64rem)").matches) focusAfterChange.current = "viewer";
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
          {controls}
          {evidence ? (
            <>
              {evidence.state.status === "loading" && <p role="status">Buscando referencias documentales…</p>}
              {evidence.state.status === "error" && (
                <>
                  <p role="alert">{evidence.state.message}</p>
                  <button type="button" className="btn mt-2" onClick={retryEvidence}>Reintentar búsqueda</button>
                </>
              )}
              {!controls && !!report?.failedDocuments && (
                <div className="mb-3">
                  <p role="status">{partialEvidenceLabel}. Algunos informes no se pudieron leer.</p>
                  {!references?.length && <button type="button" className="btn mt-2" onClick={retryEvidence}>Reintentar búsqueda</button>}
                </div>
              )}
              {!!references?.length && (
                <ClinicalDocumentsList documents={references.map((ref) => ref.document)} references={byId}
                  indexError={false} selected={selected} onSelect={selectDocument} />
              )}
              {controls && references?.length === 0 && <p>Sin referencias en los documentos leídos.</p>}
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
