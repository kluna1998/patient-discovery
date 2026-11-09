
import { useMemo } from "react";

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
  decisions: ReviewDecisions;
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

export default function PatientTable({
  dataset,
  decisions,
  onReview,
}: Props) {
  // Generamos las columnas dinámicamente a partir del CSV.
  const columns = useMemo<
    ColumnDef<typeof features, PatientRow>[]
  >(
    () => [
      // Columnas originales del CSV.
      ...dataset.columns.map(
        (name): ColumnDef<typeof features, PatientRow> => ({
          id: name,
          accessorFn: (row) => row[name] ?? "",
          header: name,

          // TypeScript infiere el tipo de info desde ColumnDef.
          cell: (info) => String(info.getValue() ?? ""),

          sortFn: "alphanumeric",
        })
      ),

      // Columna de revisión.
      {
        id: "__review_actions",
        header: "Review",
        enableSorting: false,
        enableGlobalFilter: false,
        enableHiding: false,

        cell: ({ row }) => {
          // Índice de la fila en el dataset recibido.
          const rowId = row.index;
          const decision = decisions[rowId];

          return (
            <div className="flex items-center gap-3">
              <span
                className={
                  decision?.status === "accepted"
                    ? "font-medium text-emerald-700"
                    : decision?.status === "rejected"
                      ? "font-medium text-red-700"
                      : "text-slate-500"
                }
              >
                {decision?.status ?? "pending"}
              </span>

              <button
                type="button"
                onClick={() => onReview(rowId)}
                disabled={Boolean(decision)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Review
              </button>
            </div>
          );
        },
      },

      // Columna de justificación.
      {
        id: "__review_reason",
        header: "Justification",
        enableSorting: false,
        enableGlobalFilter: false,
        enableHiding: false,

        cell: ({ row }) => {
          const decision = decisions[row.index];

          return (
            <span
              title={decision?.reason ?? ""}
              className="block max-w-80 truncate text-slate-600"
            >
              {decision?.reason ?? "—"}
            </span>
          );
        },
      },
    ],
    [dataset.columns, decisions, onReview]
  );

  const table = useTable({
    features,
    data: dataset.rows,
    columns,

    globalFilterFn: "includesString",

    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  function resetView() {
    table.resetGlobalFilter(true);
    table.resetSorting(true);
    table.resetColumnVisibility(true);
    table.setPageIndex(0);
  }

  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalPages = table.getPageCount();

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Cabecera */}
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-xl font-semibold text-slate-800">
          Patient cohort
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {dataset.fileName} · {dataset.rows.length} registros ·{" "}
          {dataset.columns.length} columnas originales
        </p>
      </div>

      <div className="space-y-5 p-5">
        {/* Búsqueda global */}
        <div>
          <label
            htmlFor="patient-search"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Buscar registros
          </label>

          <input
            id="patient-search"
            type="search"
            value={table.state.globalFilter ?? ""}
            onChange={(event) =>
              table.setGlobalFilter(event.target.value)
            }
            placeholder="Buscar pacientes..."
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* Selector de columnas */}
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-700">
              Columnas visibles
            </h3>

            <button
              type="button"
              onClick={resetView}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Restablecer vista
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <label
                  key={column.id}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                    className="accent-blue-600"
                  />

                  {column.id}
                </label>
              ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="max-h-[600px] overflow-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort =
                      header.column.getCanSort();

                    const sortDirection =
                      header.column.getIsSorted();

                    return (
                      <th
                        key={header.id}
                        className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-semibold text-slate-700"
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={
                              header.column.getToggleSortingHandler()
                            }
                            className="flex items-center gap-2 hover:text-blue-600"
                          >
                            <table.FlexRender header={header} />

                            <span className="text-slate-400">
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
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 hover:bg-blue-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="max-w-80 px-4 py-3 text-slate-600"
                    >
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {table.getRowModel().rows.length === 0 && (
            <p className="p-8 text-center text-slate-500">
              No se encontraron registros.
            </p>
          )}
        </div>

        {/* Paginación */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            {filteredCount} registros encontrados
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>

            <span className="text-sm text-slate-600">
              Página {table.state.pagination.pageIndex + 1} de{" "}
              {Math.max(totalPages, 1)}
            </span>

            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
