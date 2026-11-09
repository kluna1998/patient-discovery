
import { useState } from "react";

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
  const [dataset, setDataset] = useState<CsvDataset | null>(null);
  const [decisions, setDecisions] = useState<ReviewDecisions>({});
  const [activeTab, setActiveTab] =
    useState<ReviewStatus>("pending");

  const [selectedRowId, setSelectedRowId] =
    useState<number | null>(null);

  function handleLoad(newDataset: CsvDataset) {
    setDataset(newDataset);
    setDecisions({});
    setActiveTab("pending");
    setSelectedRowId(null);
  }

  function handleSaveDecision(
    rowId: number,
    decision: ReviewDecision
  ) {
    if (decisions[rowId]) return;

    setDecisions((previous) => ({
      ...previous,
      [rowId]: decision,
    }));

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
        (index) =>
          (decisions[index]?.status ?? "pending") === activeTab
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
    if (decisions[originalIndex]) return;

    setSelectedRowId(originalIndex);
  }

  const reviewedCount =  counts.accepted + counts.rejected;

  function handleExport() {
    if (!dataset) return;

    exportReviewCsv(dataset, decisions);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Patient Discovery
          </h1>
          <p className="mt-2 text-slate-500">
            Clinical cohort review platform
          </p>
        </header>

        <CsvUploader onLoad={handleLoad} />

        {dataset && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <p className="font-medium text-slate-800">
                Review progress
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {reviewedCount} de {dataset.rows.length} registros revisados
              </p>

              <div className="mt-2 h-2 w-56 max-w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${
                      dataset.rows.length > 0
                        ? (reviewedCount / dataset.rows.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Export review CSV
            </button>
          </div>
        )}


        {dataset && visibleDataset ? (
          <>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {(
                ["pending", "accepted", "rejected"] as const
              ).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setActiveTab(status)}
                  className={`rounded-xl border p-4 text-left ${
                    activeTab === status
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-2xl font-bold">
                    {counts[status]}
                  </p>
                  <p className="mt-1 text-sm capitalize text-slate-600">
                    {status}
                  </p>
                </button>
              ))}
            </div>

            <PatientTable
              key={`${dataset.fileName}-${activeTab}`}
              dataset={visibleDataset}
              decisions={visibleDecisions}
              onReview={handleReview}
            />
          </>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            No dataset loaded.
          </div>
        )}

        {selectedRowId !== null && (
          <DecisionDialog
            rowId={selectedRowId}
            onSave={handleSaveDecision}
            onClose={() => setSelectedRowId(null)}
          />
        )}
      </div>
    </main>
  );
}

export default App;
