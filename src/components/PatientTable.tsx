import ColumnHelp from "./ColumnHelp";
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

export default function PatientTable({ dataset, dictionary, decisions, onReview }: Props) {
  const columnInfo = useMemo(() => new Map(dictionary.map((entry) => [entry.column_name, entry])), [dictionary]);
  const defaultVisibility = useMemo(() => Object.fromEntries(
    dataset.columns.map((name) => {
      const tipo = columnInfo.get(name)?.tipo;
      return [name, tipo === "Valor" || tipo === "Unidades"];
    }),
  ), [dataset.columns, columnInfo]);
  const [visibilityOverride, setVisibilityOverride] = useState<Record<string, boolean> | null>(null);
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

          const StatusIcon = decision?.status === "accepted" ? Check : decision?.status === "rejected" ? X : Clock3;
          const buttonColor = decision?.status === "accepted"
            ? "border-current bg-review-accepted-bg text-review-accepted hover:bg-review-accepted-hover"
            : decision?.status === "rejected"
              ? "border-current bg-review-rejected-bg text-review-rejected hover:bg-review-rejected-hover"
              : "border-current bg-review-pending-bg text-review-pending hover:bg-review-pending-hover";

          return (
            <button
              type="button"
              onClick={() => onReview(rowId)}
              aria-label={`${decision ? "Modificar" : "Revisar"} registro ${rowId + 1}`}
              className={`btn min-h-8 px-3 py-1 ${buttonColor}`}
            >
              <StatusIcon size={14} aria-hidden="true" />
              {decision ? "Modificar" : "Revisar"}
            </button>
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
    [dataset.columns, columnInfo, decisions, onReview],
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
        <h2 className="text-base font-semibold text-content-heading">
          Cohorte de pacientes
        </h2>

        <p className="mt-1 text-sm text-content-subtle">
          {dataset.fileName} · {dataset.rows.length} registros ·{" "}
          {dataset.columns.length} columnas originales
        </p>
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

            <div className="search-control">
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
                className="text-input"
              />
            </div>
          </div>
          <button type="button" onClick={resetView} className="btn ml-auto">
            <RotateCcw size={14} />
            Restablecer vista
          </button>
        </div>

        {/* Selector de columnas */}
        <details className="column-options">
          <summary>
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

        {/* Paginación */}
        <div className="table-footer">
          <p className="text-sm text-content-subtle">
            {filteredCount} registros encontrados
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="btn"
            >
              <ChevronLeft size={14} /> Anterior
            </button>

            <span className="text-sm text-content-muted">
              Página {table.state.pagination.pageIndex + 1} de{" "}
              {Math.max(totalPages, 1)}
            </span>

            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="btn"
            >
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
