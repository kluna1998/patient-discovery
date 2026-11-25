import { useEffect, useMemo, useState } from "react";
import type { ColumnInfo } from "../services/columnDictionary";
import { collectEvidenceQueries, searchPatientEvidence } from "../services/evidenceMatching";
import type { EvidenceSearchState } from "../types/evidence";
import type { PatientRow } from "../types/patient";

export function useEvidenceMatching(cohort: object, row: PatientRow, dictionary: ColumnInfo[], enabled: boolean) {
  const queries = useMemo(() => collectEvidenceQueries(row, dictionary), [row, dictionary]);
  const [attempt, setAttempt] = useState(0);
  const request = useMemo(() => ({
    cohort, dictionary, patientId: row.nhc?.trim(), queries, attempt,
  }), [cohort, dictionary, row.nhc, queries, attempt]);
  const [outcome, setOutcome] = useState<{ request: typeof request; state: EvidenceSearchState }>();

  useEffect(() => {
    if (!enabled || !request.queries.size) return;
    const controller = new AbortController();
    const { signal } = controller;
    searchPatientEvidence(request.cohort, request.dictionary, request.patientId, request.queries, signal).then(
      (report) => {
        if (!signal.aborted) setOutcome({ request, state: { status: "complete", report } });
      },
      () => {
        if (signal.aborted) return;
        const message = request.patientId
          ? "No se pudo completar la búsqueda documental."
          : "Este registro no tiene un identificador de paciente (nhc).";
        setOutcome({ request, state: { status: "error", message } });
      },
    );
    return () => controller.abort();
  }, [enabled, request]);

  const state: EvidenceSearchState = outcome?.request === request ? outcome.state : { status: "loading" };
  return { queries, state, retry: () => setAttempt((current) => current + 1) };
}
