
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
              "No s’ha pogut interpretar el CSV. Comprova el separador, les cometes i el nombre de camps de cada registre."
            )
          );
          return;
        }

        const columns = results.meta.fields ?? [];

        if (columns.length === 0 || results.data.length === 0) {
          reject(new Error("El CSV no conté registres vàlids."));
          return;
        }

        if (
          columns.some((column) => column === "") ||
          new Set(columns).size !== columns.length
        ) {
          reject(
            new Error("Les capçaleres són buides o duplicades.")
          );
          return;
        }

        resolve({
          columns,
          rows: results.data,
          fileName: file.name,
        });
      },

      error: () => {
        reject(new Error("No s’ha pogut llegir el fitxer. Comprova que estigui disponible i que tinguis permís per obrir-lo."));
      },
    });
  });
}
