import { reviewStatusLabels } from "./types/review";
import { useState } from "react";
import {
  Download,
  ClipboardList,
  Clock3,
  Check,
  X,
  FileSpreadsheet,
} from "lucide-react";
import ColumnDictionaryEditor from "./components/ColumnDictionaryEditor";
import { useColumnDictionary } from "./hooks/useColumnDictionary";
import AppShell from "./components/AppShell";

import CsvUploader from "./components/CsvUploader";
import PatientTable from "./components/PatientTable";
import DecisionDialog from "./components/DecisionDialog";

import { exportReviewCsv } from "./services/exportService";

import type { CsvDataset } from "./types/patient";
import type {
  ReviewDecision,
  ReviewDecisions,
  ReviewStatus,
} from "./types/review";

function App() {
  const showDictionaryEditor = new URLSearchParams(window.location.search).get("debug") === "1";
  const dictionary = useColumnDictionary();
  const [dataset, setDataset] = useState<CsvDataset | null>(null);
  const [decisions, setDecisions] = useState<ReviewDecisions>({});
  const [activeTab, setActiveTab] = useState<ReviewStatus>("pending");

  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  function handleLoad(newDataset: CsvDataset) {
    setDataset(newDataset);
    setDecisions({});
    setActiveTab("pending");
    setSelectedRowId(null);
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
    if (!dataset) return;

    exportReviewCsv(dataset, decisions);
  }

  return (
    <AppShell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PATIENT DISCOVERY</p>
          <h1>Revisión de cohorte</h1>
          <p className="mt-2 text-sm text-slate-600">
            Revisa los registros de la cohorte y documenta las decisiones sobre cada candidato.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          {dataset && <CsvUploader onLoad={handleLoad} compact />}
          <button
            type="button"
            onClick={handleExport}
            disabled={!dataset}
            className="btn btn-primary"
          >
            <Download size={16} />
            Exportar revisión en CSV
          </button>
        </div>
      </div>
      {dictionary.loading && <p role="status">Cargando diccionario de columnas…</p>}
      {dictionary.error && <div role="alert" className="error-message my-3">{dictionary.error}<button type="button" className="btn" onClick={dictionary.retry}>Reintentar carga</button></div>}
      {showDictionaryEditor && !dictionary.loading && <ColumnDictionaryEditor entries={dictionary.entries} columns={dataset?.columns ?? []} onSave={dictionary.save} />}
      {!dataset && <CsvUploader onLoad={handleLoad} />}
      {dataset && (
        <section className="panel progress-panel" aria-label="Progreso de revisión">
          <div className="flex min-w-0 items-center gap-3">
            <span className="icon-tile">
              <FileSpreadsheet size={20} />
            </span>
            <div className="min-w-0">
              <p
                className="truncate font-semibold text-slate-800"
                title={dataset.fileName}
              >
                {dataset.fileName}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {dataset.rows.length} registros · {dataset.columns.length}{" "}
                columnas originales
              </p>
            </div>
          </div>
          <div className="progress-summary">
            <div className="mb-2 flex justify-between gap-6 text-xs">
              <span className="font-medium text-slate-700">
                Progreso de revisión
              </span>
              <span>
                {reviewedCount} de {dataset.rows.length} revisados
              </span>
            </div>
            <progress
              className="review-progress"
              value={reviewedCount}
              max={Math.max(dataset.rows.length, 1)}
              aria-label="Registros revisados"
            />
          </div>
        </section>
      )}
      {dataset && visibleDataset ? (
        <>
          <div
            className="status-grid"
            role="group"
            aria-label="Filtrar por estado de revisión"
          >
            {(["pending", "accepted", "rejected"] as const).map((status) => {
              const StatusIcon =
                status === "pending"
                  ? Clock3
                  : status === "accepted"
                    ? Check
                    : X;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setActiveTab(status)}
                  aria-pressed={activeTab === status}
                  className={`status-card ${activeTab === status ? "active" : ""}`}
                >
                  <span className={`status-icon ${status}`}>
                    <StatusIcon size={18} />
                  </span>
                  <span className="flex-1 text-left">
                    <span className="block text-xs font-medium capitalize text-slate-600">
                      {reviewStatusLabels[status]}
                    </span>
                    <span className="mt-1 block text-2xl font-semibold tabular-nums text-slate-900">
                      {counts[status]}
                    </span>
                  </span>
                  <span className="status-indicator" />
                </button>
              );
            })}
          </div>
          <PatientTable
            key={`${dataset.fileName}-${activeTab}`}
            dataset={visibleDataset}
            dictionary={dictionary.entries}
            decisions={visibleDecisions}
            onReview={handleReview}
          />
        </>
      ) : (
        <section className="panel empty-state">
          <span className="empty-icon">
            <ClipboardList size={28} />
          </span>
          <h2>Carga una cohorte para iniciar la revisión</h2>
          <p>
            Selecciona un archivo CSV para consultar los registros
            <br className="hidden sm:block" /> y documentar las decisiones de
            revisión.
          </p>
          <div className="workflow-steps">
            <span>01 &nbsp; Cargar CSV</span>
            <span>02 &nbsp; Revisar candidatos</span>
            <span>03 &nbsp; Exportar decisiones</span>
          </div>
        </section>
      )}

      {selectedRowId !== null && dataset && (
        <DecisionDialog
          key={selectedRowId}
          rowId={selectedRowId}
          decision={decisions[selectedRowId]}
          row={dataset.rows[selectedRowId]}
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
