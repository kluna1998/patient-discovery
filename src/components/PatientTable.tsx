import ColumnHelp from "./ColumnHelp";
import ClinicalDocumentsExplorer, { ClinicalDocumentsBrowser } from "./ClinicalDocumentsExplorer";
import ClinicalDocumentsSheet from "./ClinicalDocumentsSheet";
import type { ColumnInfo } from "../services/columnDictionary";
import { useMemo, useState } from "react";
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Check,
  X,
  Clock3,
  FileText,
} from "lucide-react";

import {
  useTable,
  tableFeatures,
  columnVisibilityFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  createFilteredRowModel,
  createSortedRowModel,
  createPaginatedRowModel,
  filterFn_includesString,
  sortFn_alphanumeric,
} from "@tanstack/react-table";

import type { ColumnDef } from "@tanstack/react-table";
import type { CsvDataset, PatientRow } from "../types/patient";
import type { ReviewDecisions } from "../types/review";

interface Props {
  dataset: CsvDataset;
  dictionary: ColumnInfo[];
  decisions: ReviewDecisions;
  originalRowIndices: number[];
  onReview: (rowId: number) => void;
}

// TanStack Table v9: funcionalidades utilizadas por la tabla.
const features = tableFeatures({
  columnVisibilityFeature,

  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),

  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),

  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),

  filterFns: {
    includesString: filterFn_includesString,
  },

  sortFns: {
    alphanumeric: sortFn_alphanumeric,
  },
});

export default function PatientTable({ dataset, dictionary, decisions, originalRowIndices, onReview }: Props) {
  const columnInfo = useMemo(() => new Map(dictionary.map((entry) => [entry.column_name, entry])), [dictionary]);
  const defaultVisibility = useMemo(() => {
    const visible = new Set(dataset.columns.filter((name) => {
      const tipo = columnInfo.get(name)?.tipo;
      return name === "patient_ref" || tipo === "Valor" || tipo === "Unidades";
    }));
    if (visible.size === 0) {
      for (const name of dataset.columns.slice(0, 3)) visible.add(name);
    }

    return Object.fromEntries(dataset.columns.map((name) => [name, visible.has(name)]));
  }, [dataset.columns, columnInfo]);
  const [visibilityOverride, setVisibilityOverride] = useState<Record<string, boolean> | null>(null);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  // Generamos las columnas dinámicamente a partir del CSV.
  const columns = useMemo<ColumnDef<typeof features, PatientRow>[]>(
    () => [
      // Columna de revisión.
      {
        id: "__review_actions",
        header: "Revisión",
        enableSorting: false,
        enableGlobalFilter: false,
        enableHiding: false,

        cell: ({ row }) => {
          // Índice de la fila en el dataset recibido.
          const rowId = row.index;
          const decision = decisions[rowId];
          const recordNumber = originalRowIndices[rowId] + 1;

          const StatusIcon = decision?.status === "accepted" ? Check : decision?.status === "rejected" ? X : Clock3;
          const buttonColor = decision?.status === "accepted"
            ? "border-current bg-review-accepted-bg text-review-accepted hover:bg-review-accepted-hover"
            : decision?.status === "rejected"
              ? "border-current bg-review-rejected-bg text-review-rejected hover:bg-review-rejected-hover"
              : "border-current bg-review-pending-bg text-review-pending hover:bg-review-pending-hover";

          return (
            <div className="flex  items-center gap-2">
              <button
                type="button"
                onClick={() => onReview(rowId)}
                aria-label={`${decision ? "Modificar" : "Revisar"} registro #${recordNumber}`}
                className={`btn min-h-8 min-w-18 gap-1.5 whitespace-nowrap px-3 py-1 ${buttonColor}`}
              >
                <StatusIcon size={14} aria-hidden="true" />
                {decision ? "Modificar" : "Revisar"}
              </button>
              <ClinicalDocumentsSheet patientId={row.original.nhc}>
                <button
                  type="button"
                  aria-label={`Abrir documentos del registro #${recordNumber}`}
                  className="btn min-h-8 gap-1.5 whitespace-nowrap px-3 py-1 text-primary hover:bg-surface-accent"
                >
                  <FileText size={14} aria-hidden="true" />
                </button>
              </ClinicalDocumentsSheet>
            </div>
          );
        },
      },

      // Columnas originales del CSV.
      ...dataset.columns.map(
        (name): ColumnDef<typeof features, PatientRow> => ({
          id: name,
          accessorFn: (row) => row[name] ?? "",
          header: columnInfo.get(name)?.readable_name ?? name,

          // TypeScript infiere el tipo de info desde ColumnDef.
          cell: (info) => String(info.getValue() ?? ""),

          sortFn: "alphanumeric",
        }),
      ),

      // Columna de justificación.
      {
        id: "__review_reason",
        header: "Justificación",
        enableSorting: false,
        enableGlobalFilter: false,
        enableHiding: false,

        cell: ({ row }) => {
          const decision = decisions[row.index];

          return (
            <span
              title={decision?.reason ?? ""}
              className="block max-w-80 truncate text-content-muted"
            >
              {decision?.reason ?? "—"}
            </span>
          );
        },
      },
    ],
    [dataset.columns, columnInfo, decisions, originalRowIndices, onReview],
  );

  const table = useTable({
    features,
    data: dataset.rows,
    columns,
    // Follow dictionary loading until the user makes a manual selection.
    state: { columnVisibility: visibilityOverride ?? defaultVisibility },
    onColumnVisibilityChange: (updater) => {
      setVisibilityOverride((previous) => typeof updater === "function"
        ? updater(previous ?? defaultVisibility)
        : updater);
    },

    globalFilterFn: "includesString",

    initialState: {
      columnVisibility: defaultVisibility,
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  function resetView() {
    table.resetGlobalFilter(true);
    table.resetSorting(true);
    setVisibilityOverride(null);
    table.setPageIndex(0);
  }

  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalPages = table.getPageCount();

  return (
    <section aria-label="Cohorte de pacientes">
      {/* Cabecera */}
      <div className="table-heading">
        <h2 className="text-base font-semibold text-content-heading mr-3">
          Cohorte de pacientes
        </h2>
        <ClinicalDocumentsExplorer />
      </div>

      <div>
        {/* Búsqueda global */}
        <div className="table-tools">
          <div className="w-full max-w-md">
            <label
              htmlFor="patient-search"
              className="block text-xs font-medium text-content"
            >
              Buscar registros
            </label>

            <div className="flex items-end gap-2">
              <div className="search-control min-w-0 flex-1">
                <Search size={16} />
                <input
                  id="patient-search"
                  type="search"
                  value={table.state.globalFilter ?? ""}
                  onChange={(event) => {
                    table.setGlobalFilter(event.target.value);
                    table.setPageIndex(0);
                  }}
                  placeholder="Buscar en los registros…"
                  className="text-input h-10"
                />
              </div>
              <button
                type="button"
                className="btn size-10 shrink-0 p-0"
                aria-label="Restablecer vista"
                title="Restablecer vista"
                onClick={resetView}
              >
                <RotateCcw size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <details
          className="column-options px-0 open:pb-0"
          open={documentsOpen}
          onToggle={(event) => setDocumentsOpen(event.currentTarget.open)}
        >
          <summary className="ml-4 leading-8">
            <FileText size={14} aria-hidden="true" className="mr-1 inline" /> Todos los documentos
          </summary>
          {documentsOpen && (
            <div className="mt-3 flex h-[65dvh] min-w-0 flex-col overflow-hidden border-t border-line bg-surface">
              <ClinicalDocumentsBrowser closeLabel="Volver a todos los documentos" />
            </div>
          )}
        </details>

        <div className="column-options flex items-start justify-between gap-2">
          <details className="min-w-0 flex-1">
            <summary className="leading-8">
              <Columns3 size={14} className="mr-1 inline" /> Columnas visibles ·{" "}
              {
                table
                  .getVisibleLeafColumns()
                  .filter((column) => column.getCanHide()).length
              }{" "}
              de {dataset.columns.length}
            </summary>
            <div className="mt-3 flex flex-wrap gap-2">
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center gap-2 text-sm text-content-muted"
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className="accent-interactive"
                    />

                    {columnInfo.get(column.id)?.readable_name ?? column.id}
                  </label>
                ))}
            </div>
          </details>
          <nav aria-label="Paginación de pacientes" className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="btn btn-ghost size-8 min-h-8 p-0"
              aria-label="Página anterior"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <span role="status" className="whitespace-nowrap text-sm tabular-nums text-content-muted">
              <span className="sr-only">Página </span>
              {table.state.pagination.pageIndex + 1}/{Math.max(totalPages, 1)}
            </span>
            <button
              type="button"
              className="btn btn-ghost size-8 min-h-8 p-0"
              aria-label="Página siguiente"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </nav>
        </div>

        {/* Tabla */}
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Tabla de la cohorte de pacientes"
        >
          <table className="cohort-table">
            <caption>Cohorte de pacientes — {dataset.fileName}</caption>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const info = columnInfo.get(header.column.id);
                    const canSort = header.column.getCanSort();

                    const sortDirection = header.column.getIsSorted();

                    return (
                      <th
                        key={header.id}
                        scope="col"
                        aria-sort={
                          sortDirection === "asc"
                            ? "ascending"
                            : sortDirection === "desc"
                              ? "descending"
                              : canSort
                                ? "none"
                                : undefined
                        }
                      >
                        <div className="flex items-center gap-2">
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex items-center gap-2 hover:text-interactive"
                          >
                            <table.FlexRender header={header} />

                            <span className="text-content-faint">
                              {sortDirection === "asc"
                                ? "↑"
                                : sortDirection === "desc"
                                  ? "↓"
                                  : "↕"}
                            </span>
                          </button>
                        ) : (
                          <table.FlexRender header={header} />
                        )}
                        {!header.isPlaceholder && info && <ColumnHelp info={info} />}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {table.getRowModel().rows.length === 0 && (
            <p className="p-8 text-center text-content-subtle">
              No se encontraron registros. Cambia el estado de revisión o
              restablece la búsqueda.
            </p>
          )}
        </div>

        <div className="table-footer">
          <p className="text-sm text-content-subtle">
            {filteredCount} registros encontrados
          </p>
        </div>
      </div>
    </section>
  );
}
