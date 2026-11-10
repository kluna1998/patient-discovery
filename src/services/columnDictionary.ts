import Papa from "papaparse";

export interface ColumnInfo {
  column_name: string;
  readable_name: string;
  meaning: string;
}

export const dictionaryStorageKey = "patient-discovery.column-dictionary.v1";

export function validateDictionary(value: unknown): ColumnInfo[] {
  if (!Array.isArray(value)) throw new Error("El diccionario debe contener una lista de columnas.");
  const names = new Set<string>();
  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new Error(`La fila ${index + 1} no es válida.`);
    const row = entry as Record<string, unknown>;
    const fields = ["column_name", "readable_name", "meaning"] as const;
    const clean = {} as ColumnInfo;
    for (const field of fields) {
      if (typeof row[field] !== "string" || !row[field].trim()) {
        throw new Error(`Completa el nombre original, el título y la descripción de la fila ${index + 1}.`);
      }
      clean[field] = row[field].trim();
    }
    if (names.has(clean.column_name)) throw new Error(`La columna «${clean.column_name}» está duplicada.`);
    names.add(clean.column_name);
    return clean;
  });
}

export function parseDictionary(csv: string): ColumnInfo[] {
  const result = Papa.parse<ColumnInfo>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
  });
  if (result.errors.length || !["column_name", "readable_name", "meaning"].every((field) => result.meta.fields?.includes(field))) {
    throw new Error("El CSV del diccionario debe tener las columnas column_name, readable_name y meaning y filas válidas.");
  }
  return validateDictionary(result.data);
}

export function downloadDictionary(entries: ColumnInfo[]) {
  const csv = Papa.unparse({ fields: ["column_name", "readable_name", "meaning"], data: entries });
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "info_columns_dict.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
