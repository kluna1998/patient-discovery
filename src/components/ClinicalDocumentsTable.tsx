import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useMemo } from "react";
import {
  columnFilteringFeature, createFilteredRowModel, createPaginatedRowModel, createSortedRowModel,
  filterFn_includesString, globalFilteringFeature, rowPaginationFeature,
  rowSortingFeature, sortFn_alphanumeric, tableFeatures, useTable,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { ClinicalDocument, ClinicalDocumentsPatient } from "../services/clinicalDocuments";

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric },
});

interface Props {
  patients: ClinicalDocumentsPatient[];
  selected?: { patientId: string; document: ClinicalDocument };
  onSelect: (patientId: string, document: ClinicalDocument, button: HTMLButtonElement) => void;
}

export default function ClinicalDocumentsTable({ patients, selected, onSelect }: Props) {
  const columns = useMemo<ColumnDef<typeof features, ClinicalDocumentsPatient>[]>(() => [
    { accessorKey: "patientId", header: "Identificador del paciente", sortingFn: "alphanumeric" },
    { id: "documents", header: "Documentos clínicos", enableSorting: false, enableGlobalFilter: false },
  ], []);
  const table = useTable({
    features,
    data: patients,
    columns,
    globalFilterFn: "includesString",
    initialState: { sorting: [{ id: "patientId", desc: false }], pagination: { pageIndex: 0, pageSize: 10 } },
    enableSortingRemoval: false,
  });
  const idColumn = table.getColumn("patientId");
  const descending = idColumn?.getIsSorted() === "desc";
  const rows = table.getRowModel().rows;
  const totalPages = Math.max(table.getPageCount(), 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-5 sm:p-6">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <input
          type="search"
          className="text-input min-w-0 max-w-sm"
          aria-label="Buscar por identificador de paciente"
          placeholder="Buscar por identificador…"
          value={table.state.globalFilter ?? ""}
          onChange={(event) => {
            table.setGlobalFilter(event.target.value);
            table.setPageIndex(0);
          }}
        />
        <nav aria-label="Paginación del explorador" className="flex shrink-0 items-center gap-1">
          <button type="button" className="btn btn-ghost size-8 min-h-8 p-0" aria-label="Página anterior" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <span role="status" className="whitespace-nowrap text-sm tabular-nums text-content-muted">
            <span className="sr-only">Página </span>
            {table.state.pagination.pageIndex + 1}/{totalPages}
          </span>
          <button type="button" className="btn btn-ghost size-8 min-h-8 p-0" aria-label="Página siguiente" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </nav>
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-panel border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th scope="col" aria-sort={descending ? "descending" : "ascending"} className="px-3 py-2">
                <button type="button" className="btn btn-ghost min-h-8 px-2 py-1 text-left text-sm" onClick={() => idColumn?.toggleSorting(!descending)}>
                  Identificador del paciente
                  {descending ? <ArrowDown size={14} aria-hidden="true" /> : <ArrowUp size={14} aria-hidden="true" />}
                </button>
              </th>
              <th scope="col" className="px-3 py-2">Documentos clínicos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ original: patient }) => (
              <tr key={patient.patientId} className="border-t border-line align-top">
                <th scope="row" className="px-3 py-3 font-medium">{patient.patientId}</th>
                <td className="px-3 py-3">
                  <ul className="flex flex-wrap gap-2">
                    {patient.documents.map((document) => (
                      <li key={document.id}>
                        <button
                          type="button"
                          aria-current={selected?.patientId === patient.patientId && selected.document.id === document.id}
                          className="btn min-h-8 border-document-row-selected-border bg-document-row-selected px-2 py-1 text-left text-sm text-content-strong hover:bg-document-row-hover aria-[current=true]:border-primary motion-safe:transition-colors motion-safe:duration-150"
                          onClick={(event) => onSelect(patient.patientId, document, event.currentTarget)}
                        >
                          <FileText size={14} aria-hidden="true" className="shrink-0 text-primary" />
                          <span>{document.type || document.id} · {document.date || "Sin fecha"}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={2} className="p-4">No se encontraron pacientes con ese identificador.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
