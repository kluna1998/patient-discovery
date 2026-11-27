import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, Search, X } from "lucide-react";
import ColumnHelp from "./ColumnHelp";
import ClinicalDocumentsSheet from "./ClinicalDocumentsSheet";
import type { PatientRow } from "../types/patient";
import { groupPatientFieldsForDialog } from "../services/columnDictionary";
import type { ColumnInfo } from "../services/columnDictionary";
import { reviewStatusLabels } from "../types/review";
import type { ReviewDecision } from "../types/review";
import { useEvidenceMatching } from "../hooks/useEvidenceMatching";
import { partialEvidenceLabel } from "../utils/evidenceLabels";

interface Props {
  rowId: number;
  decision?: ReviewDecision;
  row: PatientRow;
  cohort: object;
  columns: string[];
  dictionary: ColumnInfo[];
  onSave: (rowId: number, decision: ReviewDecision) => void;
  onClose: () => void;
}

export default function DecisionDialog({ rowId, row, cohort, columns, dictionary, decision, onSave, onClose }: Props) {
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [readingDocument, setReadingDocument] = useState(false);
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 64rem)").matches);
  const [referenceColumn, setReferenceColumn] = useState<string>();
  const [referenceVisit, setReferenceVisit] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { queries, state: evidenceState, retry } = useEvidenceMatching(cohort, row, dictionary, dialog !== null);
  const referenceQuery = referenceColumn ? queries.get(referenceColumn) : undefined;
  const blockRecord = documentsOpen && (!desktop || readingDocument);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 64rem)");
    const update = () => setDesktop(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  function changeDocumentsOpen(open: boolean) {
    if (!open) setReadingDocument(false);
    setDocumentsOpen(open);
  }

  useEffect(() => {
    if (!dialog) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
      else document.getElementById("workspace")?.focus();
    };
  }, [dialog]);
  const knownColumns = new Set(dictionary.map((entry) => entry.column_name));
  const parseBooleanValue = (value: string | undefined) => {
    if (value?.trim() === "1") return "yes";
    if (value?.trim() === "0") return "no";
    return "unknown";
  };
  const booleanLabels = { yes: "Sí", no: "Revisar", unknown: "Sin datos" };
  const displayValue = (info: ColumnInfo) => info.value_type === "boolean"
    ? booleanLabels[parseBooleanValue(row[info.column_name])]
    : row[info.column_name]?.trim() ? row[info.column_name] : "Sin datos";
  const [reason, setReason] = useState(decision?.reason ?? "");
  const [status, setStatus] = useState<ReviewDecision["status"]>(decision?.status ?? "accepted");

  function evidenceAction(info: ColumnInfo) {
    const column = info.column_name;
    if (!queries.has(column)) return;
    const loading = evidenceState.status === "loading";
    const loadingLabel = `Buscando referencias de ${info.readable_name}`;
    const report = evidenceState.status === "complete" ? evidenceState.report : undefined;
    const count = report?.results.get(column)?.references.length ?? 0;
    const partial = !!report?.failedDocuments;
    const showCount = !!report && (count > 0 || !partial);
    const error = evidenceState.status === "error";
    const detail = error ? "Error de búsqueda" : partial ? partialEvidenceLabel : "";
    const colors = error ? "border-error/20 bg-error-bg text-error hover:bg-error/10 hover:text-error"
      : count > 0 ? "bg-document-row-selected hover:bg-brand-accent hover:text-white text-primary"
      : loading ? "text-content-muted"
      : "bg-surface-hover text-primary hover:bg-line-soft";

    return (
      <button
        type="button"
        className={`btn btn-ghost min-h-8 gap-1 px-2 py-0 text-xs aria-disabled:cursor-default aria-disabled:hover:bg-surface-hover ${colors}`}
        aria-haspopup={loading ? undefined : "dialog"}
        aria-disabled={loading || undefined}
        tabIndex={loading ? -1 : undefined}
        aria-label={loading ? loadingLabel : [`Referencias de ${info.readable_name}`,
          showCount ? `${count} ${count === 1 ? "documento" : "documentos"}` : "", detail].filter(Boolean).join(" · ")}
        onClick={loading ? undefined : () => {
          setReferenceColumn(column);
          setReferenceVisit((visit) => visit + 1);
          setDocumentsOpen(true);
        }}
      >
        {loading ? (
          <span role="status" aria-label={loadingLabel}>
            <LoaderCircle size={14} aria-hidden="true" className="motion-safe:animate-spin" />
          </span>
        ) : <Search size={14} aria-hidden="true" />}
        {showCount && count}
        {detail && <span>{partial ? "Parcial" : "Error"}</span>}
      </button>
    );
  }

  function handleSave(status: "accepted" | "rejected") {
    const cleanReason = reason.trim();

    onSave(rowId, {
      status,
      reason: cleanReason,
      reviewedAt: new Date().toISOString(),
    });
  }

  return (
    <dialog
      ref={setDialog}
      onKeyDown={(event) => {
        if (event.key !== "Tab" || documentsOpen) return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), textarea, input:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]',
          ),
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      aria-labelledby="decision-title"
      aria-describedby="decision-description"
      onCancel={(event) => {
        event.preventDefault();
        if (documentsOpen) changeDocumentsOpen(false);
        else onClose();
      }}
      className="decision-dialog patient-document"
    >
      <article inert={desktop && blockRecord}>
        <header className="document-header">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow mt-5">{decision ? "MODIFICAR DECISIÓN" : "FICHA DE REVISIÓN"}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h2 ref={titleRef} id="decision-title" tabIndex={-1} autoFocus className="text-2xl font-semibold text-content-strong">Registro #{rowId + 1}</h2>
                <ClinicalDocumentsSheet
                  open={documentsOpen}
                  onOpenChange={changeDocumentsOpen}
                  container={dialog}
                  embedded={desktop}
                  referenceVisit={referenceVisit}
                  onReadingChange={desktop ? setReadingDocument : undefined}
                  patientId={row.nhc}
                  evidenceSearch={referenceQuery ? undefined : { queries, state: evidenceState, retry }}
                  evidence={referenceQuery && {
                    field: referenceQuery.field,
                    pattern: referenceQuery.regex.toString(),
                    state: evidenceState,
                    retry,
                  }}
                  onCloseAutoFocus={(event) => {
                    if (referenceColumn && titleRef.current?.isConnected) {
                      event.preventDefault();
                      titleRef.current.focus({ preventScroll: true });
                    }
                  }}
                >
                  <button type="button" className="btn min-h-8 px-3 py-1 text-sm text-primary hover:bg-surface-accent" onClick={() => {
                    setReferenceColumn(undefined);
                  }}>Ver documentos</button>
                </ClinicalDocumentsSheet>
              </div>
            </div>
            <button type="button" onClick={onClose} className="btn min-h-8 p-2" aria-label="Cerrar revisión"><X size={16} /></button>
            </div>
          </header>


        <section className="document-section" aria-label="Datos del paciente">
          {groupPatientFieldsForDialog(columns, dictionary).map((section, index) => (
            <section className="clinical-section" key={index} aria-labelledby={`clinical-section-${index}`}>
              <h3 id={`clinical-section-${index}`} className="clinical-section-title">{section.name}</h3>
              <dl className="patient-fields">
                {section.fields.map(({ primary, evidences, units }) => {
                  const status = primary.value_type === "boolean" ? parseBooleanValue(row[primary.column_name]) : undefined;
                  const rawValue = row[primary.column_name]?.trim() ?? "";
                  const unit = units ? row[units.column_name]?.trim() ?? "" : "";
                  const displayedValue = displayValue(primary);
                  const helper = knownColumns.has(primary.column_name) ? (
                    <ColumnHelp
                      key={referenceVisit}
                      info={primary}
                      variant="dialog"
                      status={status}
                      documentsOpen={blockRecord}
                      evidences={(primary.tipo === "Evidencia" ? [primary] : evidences)
                        .map((info) => ({ info, value: displayValue(info), action: evidenceAction(info) }))}
                    />
                  ) : null;
                  return (
                    <div key={primary.column_name} className="patient-field">
                      <dt>
                        <span>{primary.readable_name}</span>
                        {!status && helper}:
                      </dt>{" "}
                      <dd>
                        {displayedValue}
                        {rawValue && unit && (!status || status !== "unknown") ? ` ${unit}` : ""}
                        {status && helper}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
        </section>

        <section className="document-section document-decision" aria-labelledby="patient-decision-title">
          {decision && (
            <>
              <dl className="mt-4 space-y-3 text-sm text-content">
                <div><dt className="font-medium">Estado actual</dt><dd>{reviewStatusLabels[decision.status]}</dd></div>
                <div><dt className="font-medium">Justificación registrada</dt><dd className="whitespace-pre-wrap break-words">{decision.reason}</dd></div>
                <div><dt className="font-medium">Fecha de la última decisión</dt><dd><time dateTime={decision.reviewedAt}>{new Date(decision.reviewedAt).toLocaleString("es-ES")}</time></dd></div>
              </dl>
              <label htmlFor="decision-status" className="mt-5 block text-sm font-medium text-content">Estado de la decisión</label>
              <select id="decision-status" value={status} onChange={(event) => setStatus(event.target.value as ReviewDecision["status"])} className="text-input mt-2">
                <option value="accepted">Aceptado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </>
          )}
          <label htmlFor="decision-reason" className="mt-5 block text-sm font-medium text-content">Motivo de la decisión</label>
          <textarea
            id="decision-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            aria-describedby="reason-help"
            rows={4}
            maxLength={2000}
            placeholder="Escribe el motivo para aceptar o rechazar este candidato…"
            className="text-input mt-2 resize-y"
          />
          <p id="reason-help" className="mt-1 text-xs text-content-subtle">Opcional · {reason.length}/2000 caracteres</p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} className="btn">Cancelar</button>
            {decision ? (
              <button type="button" onClick={() => handleSave(status)} className="btn btn-primary">Guardar cambios</button>
            ) : (
              <>
                <button type="button" onClick={() => handleSave("rejected")} aria-label="Rechazar"
                  className="btn border-review-rejected-action bg-review-rejected-bg text-review-rejected hover:bg-review-rejected-hover max-sm:size-11 max-sm:p-0">
                  <X size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">Rechazar</span>
                </button>
                <button type="button" onClick={() => handleSave("accepted")} aria-label="Aceptar"
                  className="btn border-review-accepted-action bg-review-accepted-bg text-review-accepted max-sm:size-11 max-sm:p-0 hover:bg-review-accepted-hover sm:bg-review-accepted-action sm:text-content-inverse sm:hover:bg-review-accepted">
                  <Check size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">Aceptar</span>
                </button>
              </>
            )}
          </div>
        </section>
      </article>
    </dialog>
  );
}
