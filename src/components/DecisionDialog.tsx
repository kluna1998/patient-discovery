import { useEffect, useRef, useState } from "react";
import { Check, X, ClipboardCheck } from "lucide-react";
import type { ReviewDecision } from "../types/review";

interface Props {
  rowId: number;
  onSave: (rowId: number, decision: ReviewDecision) => void;
  onClose: () => void;
}

export default function DecisionDialog({ rowId, onSave, onClose }: Props) {
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
  const [status, setStatus] = useState<"accepted" | "rejected">("accepted");
  const [reason, setReason] = useState("");

  function handleSave() {
    const cleanReason = reason.trim();

    if (!cleanReason) return;

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
      className="decision-dialog"
    >
      <div className="border-b border-line p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="icon-tile">
            <ClipboardCheck size={20} />
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn min-h-8 p-2"
            aria-label="Cerrar revisión"
          >
            <X size={16} />
          </button>
        </div>
        <h2
          id="decision-title"
          className="text-xl font-semibold text-slate-900"
        >
          Revisar candidato
        </h2>

        <p id="decision-description" className="mt-1 text-sm text-slate-500">
          Registro #{rowId + 1}
        </p>
      </div>
      <div className="p-5">
        <p className="text-xs text-slate-500">
          Las decisiones guardadas no se pueden modificar en esta sesión.
        </p>
        <div
          role="group"
          aria-label="Decisión de revisión"
          className="mt-4 grid grid-cols-2 gap-3"
        >
          <button
            type="button"
            onClick={() => setStatus("accepted")}
            aria-pressed={status === "accepted"}
            className={`rounded-lg border px-4 py-3 font-medium ${
              status === "accepted"
                ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                : "border-slate-200 text-slate-600"
            }`}
          >
            <Check size={16} className="mr-2 inline" />
            Aceptar
          </button>

          <button
            type="button"
            onClick={() => setStatus("rejected")}
            aria-pressed={status === "rejected"}
            className={`rounded-lg border px-4 py-3 font-medium ${
              status === "rejected"
                ? "border-red-600 bg-red-50 text-red-700"
                : "border-slate-200 text-slate-600"
            }`}
          >
            <X size={16} className="mr-2 inline" />
            Rechazar
          </button>
        </div>

        <label
          htmlFor="decision-reason"
          className="mt-6 block text-sm font-medium text-slate-700"
        >
          Justificación
        </label>

        <textarea
          id="decision-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
          aria-describedby="reason-help"
          rows={4}
          maxLength={2000}
          placeholder="Describe el motivo de la decisión…"
          className="text-input mt-2 resize-y"
        />

        <p id="reason-help" className="mt-1 text-xs text-slate-500">
          Obligatorio · {reason.length}/2000 caracteres
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn">
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!reason.trim()}
            className="btn btn-primary"
          >
            Guardar decisión
          </button>
        </div>
      </div>
    </dialog>
  );
}
