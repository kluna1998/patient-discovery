import { ChevronLeft, ChevronRight, FileText, Search } from "lucide-react";
import ClinicalDocumentsSheet from "./ClinicalDocumentsSheet";
import type { CsvDataset } from "../types/patient";
import type { ColumnInfo } from "../services/columnDictionary";
import { useId, useMemo } from "react";
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
  cohort?: CsvDataset;
  dictionary?: ColumnInfo[];
  selected?: { patientId: string; document: ClinicalDocument };
  onSelect: (patientId: string, document: ClinicalDocument, button: HTMLButtonElement) => void;
}

export default function ClinicalDocumentsTable({ patients, selected, onSelect, cohort, dictionary }: Props) {
  const searchId = useId();
  const recordsByPatient = useMemo(() => {
    const records = new Map<string, number[]>();
    cohort?.rows.forEach((record, index) => {
      const id = record.nhc?.trim();
      if (!id) return;
      const indexes = records.get(id) ?? [];
      indexes.push(index);
      records.set(id, indexes);
    });
    return records;
  }, [cohort]);
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="table-tools shrink-0 justify-between">
        <div className="min-w-0 max-w-md flex-1 basis-36">

          <div className="search-control">
            <Search size={16} aria-hidden="true" />
            <input
              id={searchId}
              type="search"
              className="text-input h-10"
              placeholder="Buscar por identificador…"
              value={table.state.globalFilter ?? ""}
              onChange={(event) => {
                table.setGlobalFilter(event.target.value);
                table.setPageIndex(0);
              }}
            />
          </div>
        </div>
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
      <div className="table-scroll min-h-0 flex-1" tabIndex={0} role="region" aria-label="Tabla de documentos clínicos">
        <table className="cohort-table">
          <caption>Documentos clínicos por paciente</caption>
          <thead>
            <tr>
              <th scope="col" aria-sort={descending ? "descending" : "ascending"} className="w-1/4">
                <button type="button" onClick={() => idColumn?.toggleSorting(!descending)}>
                  Identificador del paciente
                  <span aria-hidden="true" className="text-content-faint">{descending ? "↓" : "↑"}</span>
                </button>
              </th>
              <th scope="col">Documentos clínicos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ original: patient }) => (
              <tr key={patient.patientId}>
                <th scope="row" className="font-medium">{patient.patientId}</th>
                <td>
                  <ul className="flex flex-wrap gap-2">
                    {cohort && dictionary && (
                      <li>
                        <ClinicalDocumentsSheet patientId={patient.patientId} cohortEvidence={{ cohort, dictionary, indexes: recordsByPatient.get(patient.patientId) ?? [] }}>
                          <button type="button" className="btn min-h-8 px-2 py-1 text-primary" aria-label="Buscar evidencias" title="Buscar evidencias">
                            
                            <Search size={14} aria-hidden="true" /> Buscar Evidencias
                          </button>
                        </ClinicalDocumentsSheet>
                      </li>
                    )}
                    {patient.documents.map((document) => (
                      <li key={document.id}>
                        <button
                          type="button"
                          aria-current={selected?.patientId === patient.patientId && selected.document.id === document.id}
                          className="btn min-h-8 border-document-row-selected-border bg-document-row-selected px-2 py-1 text-left text-sm text-content-strong hover:bg-document-row-hover aria-[current=true]:border-primary motion-safe:transition-colors motion-safe:duration-150"
                          onClick={(event) => onSelect(patient.patientId, document, event.currentTarget)}
                        >
                          <FileText size={14} aria-hidden="true" className="shrink-0 text-primary" />
                          <span className={`wrap-anywhere text-xs ${document.type ? "capitalize" : "normal-case"}`}>
                            {document.type.toLocaleLowerCase("es") || document.id}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="p-8 text-center text-content-subtle">No se encontraron pacientes con ese identificador.</p>
        )}
      </div>
    </div>
  );
}
