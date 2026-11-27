import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  ClipboardList,
  Clock3,
  CircleCheck,
  CircleX,
  FileSpreadsheet,
} from "lucide-react";
import ColumnDictionaryEditor from "./components/ColumnDictionaryEditor";
import { useColumnDictionary } from "./hooks/useColumnDictionary";
import { useCurrentDate } from "./hooks/useCurrentDate";
import AppShell from "./components/AppShell";
import ProtocolButton from "./components/ProtocolButton";

import CsvUploader from "./components/CsvUploader";
import PatientTable from "./components/PatientTable";
import DecisionDialog from "./components/DecisionDialog";

import { exportReviewCsv } from "./services/exportService";
import { withPatientAges } from "./services/patientAge";

import type { CsvDataset } from "./types/patient";
import type {
  ReviewDecision,
  ReviewDecisions,
  ReviewStatus,
} from "./types/review";

function App() {
  const showDictionaryEditor = new URLSearchParams(window.location.search).get("debug") === "1";
  const dictionary = useColumnDictionary();
  const [sourceDataset, setDataset] = useState<CsvDataset | null>(null);
  const today = useCurrentDate();
  const dataset = useMemo(
    () => sourceDataset ? withPatientAges(sourceDataset, today) : null,
    [sourceDataset, today],
  );
  const [decisions, setDecisions] = useState<ReviewDecisions>({});
  const [activeTab, setActiveTab] = useState<ReviewStatus>("pending");
  const [visibilityOverride, setVisibilityOverride] = useState<Record<string, boolean> | null>(null);

  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [incomingDataset, setIncomingDataset] = useState<CsvDataset | null>(null);
  const [exportedDecisions, setExportedDecisions] = useState<ReviewDecisions | null>(null);
  const [exportError, setExportError] = useState("");
  const replacementDialog = useRef<HTMLDialogElement>(null);
  const hasUnexportedDecisions =
    decisions !== exportedDecisions && Object.keys(decisions).length > 0;

  useEffect(() => {
    if (!hasUnexportedDecisions) return;

    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = true;
    }

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasUnexportedDecisions]);

  function replaceCohort(newDataset: CsvDataset) {
    setDataset(newDataset);
    setIncomingDataset(null);
    setDecisions({});
    setExportedDecisions(null);
    setExportError("");
    setActiveTab("pending");
    setVisibilityOverride(null);
  }

  if (incomingDataset && selectedRowId === null && !hasUnexportedDecisions) {
    replaceCohort(incomingDataset);
  }

  const confirmReplacement =
    incomingDataset !== null && selectedRowId === null && hasUnexportedDecisions;

  useEffect(() => {
    if (!confirmReplacement) return;

    const dialog = replacementDialog.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, [confirmReplacement]);

  function discardReviewAndReplace() {
    if (incomingDataset) replaceCohort(incomingDataset);
  }

  function cancelReplacement() {
    setIncomingDataset(null);
    setExportError("");
  }

  function handleSaveDecision(rowId: number, decision: ReviewDecision) {
    setDecisions((previous) => {
      const existing = previous[rowId];
      if (existing?.status === decision.status && existing.reason === decision.reason) {
        return previous;
      }

      return { ...previous, [rowId]: decision };
    });

    setSelectedRowId(null);
  }

  const counts = {
    pending: 0,
    accepted: 0,
    rejected: 0,
  };

  dataset?.rows.forEach((_, index) => {
    const status = decisions[index]?.status ?? "pending";
    counts[status]++;
  });

  // Filtramos registros, pero conservamos el índice original.
  const visibleIndices =
    dataset?.rows
      .map((_, index) => index)
      .filter(
        (index) => (decisions[index]?.status ?? "pending") === activeTab,
      ) ?? [];

  const visibleDataset: CsvDataset | null = dataset
    ? {
        ...dataset,
        rows: visibleIndices.map((index) => dataset.rows[index]),
      }
    : null;

  // La tabla filtrada utiliza índices locales.
  const visibleDecisions: ReviewDecisions = {};

  visibleIndices.forEach((originalIndex, localIndex) => {
    if (decisions[originalIndex]) {
      visibleDecisions[localIndex] = decisions[originalIndex];
    }
  });

  function handleReview(localIndex: number) {
    const originalIndex = visibleIndices[localIndex];

    if (originalIndex === undefined) return;

    setSelectedRowId(originalIndex);
  }

  const reviewedCount = counts.accepted + counts.rejected;

  function handleExport() {
    if (!sourceDataset) return;

    try {
      exportReviewCsv(withPatientAges(sourceDataset), decisions);
      setExportedDecisions(decisions);
      setExportError("");
    } catch {
      setExportError("No s’ha pogut iniciar la baixada. Torna a provar d’exportar la revisió.");
    }
  }

  return (
    <AppShell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PATIENT DISCOVERY</p>
          <h1>Revisió de la cohort</h1>

        </div>
        <div className="flex flex-wrap items-start gap-3">
          <ProtocolButton />
          {dataset && <CsvUploader onLoad={setIncomingDataset} compact />}
          <button
            type="button"
            onClick={handleExport}
            disabled={!dataset}
            className="btn btn-primary max-sm:size-10 max-sm:p-0"
            aria-label="Exporta la revisió en CSV"
            title="Exporta la revisió en CSV"
          >
            <Download size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Exporta la revisió en CSV</span>
          </button>
        </div>
      </div>
      {dictionary.loading && <p role="status">S’està carregant el diccionari de columnes…</p>}
      {dictionary.error && <div role="alert" className="error-message my-3">{dictionary.error}<button type="button" className="btn" onClick={dictionary.retry}>Torna a provar de carregar-lo</button></div>}
      {showDictionaryEditor && !dictionary.loading && <ColumnDictionaryEditor entries={dictionary.entries} columns={dataset?.columns ?? []} onSave={dictionary.save} />}
      {!dataset && <CsvUploader onLoad={setIncomingDataset} />}
      {dataset && (
        <section className="panel progress-panel" aria-label="Progrés de la revisió">
          <div className="flex min-w-0 items-center gap-3">
            <span className="icon-tile">
              <FileSpreadsheet size={20} />
            </span>
            <div className="min-w-0">
              <p
                className="truncate font-semibold text-content-heading"
                title={dataset.fileName}
              >
                {dataset.fileName}
              </p>
              <p className="mt-1 text-xs text-content-subtle">
                {dataset.rows.length} registres · {sourceDataset?.columns.length}{" "}
                columnes originals
              </p>
            </div>
          </div>
          <div className="progress-summary">
            <div className="mb-2 flex justify-between gap-6 text-xs">
              <span className="font-medium text-content">
                Progrés de la revisió
              </span>
              <span>
                {reviewedCount} de {dataset.rows.length} revisats
              </span>
            </div>
            <progress
              className="review-progress"
              value={reviewedCount}
              max={Math.max(dataset.rows.length, 1)}
              aria-label="Registres revisats"
            />
          </div>
        </section>
      )}
      {dataset && visibleDataset ? (
        <section className="mt-5" aria-label="Revisió de pacients">
          <div
            className="review-tabs"
            role="tablist"
            aria-label="Estat de la revisió"
            onKeyDown={(event) => {
              const statuses = ["pending", "accepted", "rejected"] as const;
              const current = statuses.indexOf(activeTab);
              const next = event.key === "ArrowRight" ? (current + 1) % statuses.length
                : event.key === "ArrowLeft" ? (current + statuses.length - 1) % statuses.length
                  : event.key === "Home" ? 0
                    : event.key === "End" ? statuses.length - 1 : null;
              if (next === null) return;
              event.preventDefault();
              setActiveTab(statuses[next]);
              event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
            }}
          >
            {(["pending", "accepted", "rejected"] as const).map((status) => {
              const StatusIcon = status === "pending" ? Clock3 : status === "accepted" ? CircleCheck : CircleX;
              const label = status === "pending" ? "Pendents" : status === "accepted" ? "Acceptats" : "Rebutjats";
              return (
                <button
                  key={status}
                  id={`review-tab-${status}`}
                  role="tab"
                  type="button"
                  aria-selected={activeTab === status}
                  aria-controls="review-tab-panel"
                  tabIndex={activeTab === status ? 0 : -1}
                  onClick={() => setActiveTab(status)}
                  className={`review-tab review-tab-${status}`}
                >
                  <StatusIcon size={16} aria-hidden="true" />
                  <span className="min-w-0 truncate">{label}</span>
                  <span className="shrink-0 tabular-nums">({counts[status]})</span>
                </button>
              );
            })}
          </div>
          <div
            id="review-tab-panel"
            className="panel rounded-tl-none overflow-hidden"
            role="tabpanel"
            aria-labelledby={`review-tab-${activeTab}`}
            tabIndex={0}
          >
            <PatientTable
              key={`${dataset.fileName}-${activeTab}`}
              dataset={visibleDataset}
              cohort={sourceDataset ?? dataset}
              dictionary={dictionary.entries}
              decisions={visibleDecisions}
              originalRowIndices={visibleIndices}
              visibilityOverride={visibilityOverride}
              setVisibilityOverride={setVisibilityOverride}
              onReview={handleReview}
            />
          </div>
        </section>
      ) : (
        <section className="panel empty-state">
          <span className="empty-icon">
            <ClipboardList size={28} />
          </span>
          <h2>Carrega una cohort per començar la revisió</h2>
          <p>
            Selecciona un fitxer CSV per consultar els registres
            <br className="hidden sm:block" /> i documentar les decisions de
            revisió.
          </p>
          <div className="workflow-steps">
            <span>01 &nbsp; Carrega el CSV</span>
            <span>02 &nbsp; Revisa els candidats</span>
            <span>03 &nbsp; Exporta les decisions</span>
          </div>
        </section>
      )}

      {!confirmReplacement && exportError && (
        <p role="alert" className="error-message mt-3">{exportError}</p>
      )}

      <dialog
        ref={replacementDialog}
        aria-labelledby="replace-cohort-title"
        aria-describedby="replace-cohort-description"
        className="decision-dialog"
        onCancel={(event) => {
          event.preventDefault();
          cancelReplacement();
        }}
      >
        <div className="p-5 sm:p-6">
          <h2 id="replace-cohort-title" className="text-lg font-semibold text-content-strong">
            Vols substituir la cohort actual?
          </h2>
          <p id="replace-cohort-description" className="mt-2 text-sm text-content">
            Hi ha decisions pendents d’exportar. Si carregues el CSV nou sense exportar-les, es perdran.
          </p>
          {confirmReplacement && exportError && (
            <p role="alert" className="error-message mt-3">{exportError}</p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="btn" autoFocus onClick={cancelReplacement}>
              Torna a la revisió
            </button>
            <button type="button" className="btn btn-primary" onClick={handleExport}>
              Exporta i carrega el CSV
            </button>
            <button type="button" className="btn" onClick={discardReviewAndReplace}>
              Carrega sense exportar
            </button>
          </div>
        </div>
      </dialog>

      {selectedRowId !== null && dataset && sourceDataset && (
        <DecisionDialog
          key={selectedRowId}
          rowId={selectedRowId}
          decision={decisions[selectedRowId]}
          row={dataset.rows[selectedRowId]}
          cohort={sourceDataset}
          columns={dataset.columns}
          dictionary={dictionary.entries}
          onSave={handleSaveDecision}
          onClose={() => setSelectedRowId(null)}
        />
      )}
    </AppShell>
  );
}

export default App;
