
import Papa from "papaparse";
import type { CsvDataset, PatientRow } from "../types/patient";

export function parseCsv(file: File): Promise<CsvDataset> {
  return new Promise((resolve, reject) => {
    Papa.parse<PatientRow>(file, {
      header: true,
      skipEmptyLines: "greedy",
      dynamicTyping: false,
      transformHeader: (header) => header.trim(),

      complete: (results) => {
        if (results.errors.length > 0) {
          reject(
            new Error(
              `Error al leer CSV: ${results.errors[0].message}`
            )
          );
          return;
        }

        const columns = results.meta.fields ?? [];

        if (columns.length === 0 || results.data.length === 0) {
          reject(new Error("El CSV no contiene registros válidos."));
          return;
        }

        if (
          columns.some((column) => column === "") ||
          new Set(columns).size !== columns.length
        ) {
          reject(
            new Error("Los encabezados están vacíos o duplicados.")
          );
          return;
        }

        resolve({
          columns,
          rows: results.data,
          fileName: file.name,
        });
      },

      error: (error: Error) => {
        reject(error);
      },
    });
  });
}
