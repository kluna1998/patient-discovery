
import { useState } from "react";
import type { ReviewDecision } from "../types/review";

interface Props {
  rowId: number;
  onSave: (rowId: number, decision: ReviewDecision) => void;
  onClose: () => void;
}

export default function DecisionDialog({
  rowId,
  onSave,
  onClose,
}: Props) {
  const [status, setStatus] = useState<"accepted" | "rejected">(
    "accepted"
  );
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2
          id="decision-title"
          className="text-xl font-semibold text-slate-900"
        >
          Review candidate
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Registro #{rowId + 1}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setStatus("accepted")}
            className={`rounded-lg border px-4 py-3 font-medium ${
              status === "accepted"
                ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                : "border-slate-200 text-slate-600"
            }`}
          >
            Accept
          </button>

          <button
            type="button"
            onClick={() => setStatus("rejected")}
            className={`rounded-lg border px-4 py-3 font-medium ${
              status === "rejected"
                ? "border-red-600 bg-red-50 text-red-700"
                : "border-slate-200 text-slate-600"
            }`}
          >
            Reject
          </button>
        </div>

        <label
          htmlFor="decision-reason"
          className="mt-6 block text-sm font-medium text-slate-700"
        >
          Justification
        </label>

        <textarea
          id="decision-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Explain the reason for this decision..."
          className="mt-2 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500"
        />

        <p className="mt-1 text-xs text-slate-400">
          Required · {reason.length}/2000 characters
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!reason.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save decision
          </button>
        </div>
      </div>
    </div>
  );
}
