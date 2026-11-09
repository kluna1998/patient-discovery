
import Papa from "papaparse";

import type { CsvDataset } from "../types/patient";
import type { ReviewDecisions } from "../types/review";

export function exportReviewCsv(
  dataset: CsvDataset,
  decisions: ReviewDecisions
): void {
  // Evitamos colisiones con columnas originales del CSV.
  const reservedColumns = [
    "review_status",
    "review_reason",
    "reviewed_at",
  ];

  const usedNames = new Set(dataset.columns);

  const exportNames = reservedColumns.map((name) => {
    let candidate = name;
    let suffix = 1;

    while (usedNames.has(candidate)) {
      candidate = `${name}_${suffix}`;
      suffix++;
    }

    usedNames.add(candidate);
    return candidate;
  });

  // Construimos las filas sin modificar dataset.rows.
  const rows = dataset.rows.map((patient, index) => {
    const decision = decisions[index];

    return [
      ...dataset.columns.map(
        (column) => patient[column] ?? ""
      ),
      decision?.status ?? "pending",
      decision?.reason ?? "",
      decision?.reviewedAt ?? "",
    ];
  });

  const csv = Papa.unparse(
    {
      fields: [...dataset.columns, ...exportNames],
      data: rows,
    },
    {
      delimiter: ",",
      newline: "\r\n",
      quotes: false,
      escapeFormulae: true,
    }
  );

  // Añadimos BOM para mejorar la compatibilidad con Excel.
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const baseName = dataset.fileName
    .replace(/\.csv$/i, "")
    .replace(/[^\w.-]/g, "_");

  link.href = url;
  link.download = `${baseName}_reviewed.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  // Liberamos la URL temporal después de iniciar la descarga.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
