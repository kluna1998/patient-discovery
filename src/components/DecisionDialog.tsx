import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import ColumnHelp from "./ColumnHelp";
import type { PatientRow } from "../types/patient";
import { groupPatientFieldsForDialog } from "../services/columnDictionary";
import type { ColumnInfo } from "../services/columnDictionary";
import { reviewStatusLabels } from "../types/review";
import type { ReviewDecision } from "../types/review";

interface Props {
  rowId: number;
  decision?: ReviewDecision;
  row: PatientRow;
  columns: string[];
  dictionary: ColumnInfo[];
  onSave: (rowId: number, decision: ReviewDecision) => void;
  onClose: () => void;
}

export default function DecisionDialog({ rowId, row, columns, dictionary, decision, onSave, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
      else document.getElementById("workspace")?.focus();
    };
  }, []);
  const knownColumns = new Set(dictionary.map((entry) => entry.column_name));
  const displayValue = (name: string) => row[name]?.trim() ? row[name] : "Sin datos";
  const [reason, setReason] = useState(decision?.reason ?? "");
  const [status, setStatus] = useState<ReviewDecision["status"]>(decision?.status ?? "accepted");

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
      ref={dialogRef}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
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
        onClose();
      }}
      className="decision-dialog patient-document"
    >
      <article>
        <header className="document-header">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow mt-5">{decision ? "MODIFICAR DECISIÓN" : "FICHA DE REVISIÓN"}</p>
              <h2 id="decision-title" tabIndex={-1} autoFocus className="text-2xl font-semibold text-slate-900">Registro #{rowId + 1}</h2>
            </div>
            <button type="button" onClick={onClose} className="btn min-h-8 p-2" aria-label="Cerrar revisión"><X size={16} /></button>
            </div>
          </header>


        <section className="document-section" aria-label="Datos del paciente">
          {groupPatientFieldsForDialog(columns, dictionary).map((section, index) => (
            <section className="clinical-section" key={index} aria-labelledby={`clinical-section-${index}`}>
              <h3 id={`clinical-section-${index}`} className="clinical-section-title">{section.name}</h3>
              <dl className="patient-fields">
                {section.fields.map(({ primary, evidences, units }) => (
                  <div key={primary.column_name} className="patient-field">
                    <dt>
                      <span>{primary.readable_name}</span>
                      {knownColumns.has(primary.column_name) && (
                        <ColumnHelp
                          info={primary}
                          evidences={evidences.map((info) => ({ info, value: displayValue(info.column_name) }))}
                        />
                      )}:
                    </dt>{" "}
                    <dd>
                      {displayValue(primary.column_name)}
                      {units && ` ${displayValue(units.column_name)}`}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </section>

        <section className="document-section document-decision" aria-labelledby="patient-decision-title">
          <h3 id="patient-decision-title" className="text-lg font-semibold text-slate-900">Decisión de revisión</h3>
          {decision && (
            <>
              <dl className="mt-4 space-y-3 text-sm text-slate-700">
                <div><dt className="font-medium">Estado actual</dt><dd>{reviewStatusLabels[decision.status]}</dd></div>
                <div><dt className="font-medium">Justificación registrada</dt><dd className="whitespace-pre-wrap break-words">{decision.reason}</dd></div>
                <div><dt className="font-medium">Fecha de la última decisión</dt><dd><time dateTime={decision.reviewedAt}>{new Date(decision.reviewedAt).toLocaleString("es-ES")}</time></dd></div>
              </dl>
              <label htmlFor="decision-status" className="mt-5 block text-sm font-medium text-slate-700">Estado de la decisión</label>
              <select id="decision-status" value={status} onChange={(event) => setStatus(event.target.value as ReviewDecision["status"])} className="text-input mt-2">
                <option value="accepted">Aceptado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </>
          )}
          <label htmlFor="decision-reason" className="mt-5 block text-sm font-medium text-slate-700">Motivo de la decisión</label>
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
          <p id="reason-help" className="mt-1 text-xs text-slate-500">Opcional · {reason.length}/2000 caracteres</p>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">{decision ? "La fecha se actualizará únicamente si cambia el estado o la justificación." : "Al aceptar o rechazar se guardarán la decisión y el motivo."}</p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} className="btn">Cancelar</button>
            {decision ? (
              <button type="button" onClick={() => handleSave(status)} className="btn btn-primary">Guardar cambios</button>
            ) : (
              <>
                <button type="button" onClick={() => handleSave("rejected")}  className="btn border-red-700 bg-red-50 text-red-800 hover:bg-red-100"><X size={16} />Rechazar</button>
                <button type="button" onClick={() => handleSave("accepted")} className="btn border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800"><Check size={16} />Aceptar</button>
              </>
            )}
          </div>
        </section>
      </article>
    </dialog>
  );
}
