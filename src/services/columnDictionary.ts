import Papa from "papaparse";

export interface ColumnInfo {
  column_name: string;
  readable_name: string;
  meaning: string;
  section: string;
  section_order: number;
}

const dictionaryFields = ["column_name", "readable_name", "meaning", "section", "section_order"];

export function validateDictionary(value: unknown): ColumnInfo[] {
  if (!Array.isArray(value)) throw new Error("El diccionario debe contener una lista de columnas.");
  const names = new Set<string>();
  const sectionOrders = new Map<string, number>();
  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new Error(`La fila ${index + 1} no es válida.`);
    const row = entry as Record<string, unknown>;
    const text = (field: string) => {
      if (typeof row[field] !== "string" || !row[field].trim()) {
        throw new Error(`Completa ${field} en la fila ${index + 1}.`);
      }
      return row[field].trim();
    };
    const order = row.section_order;
    if ((typeof order !== "number" && typeof order !== "string") ||
        (typeof order === "string" && !/^[+-]?\d+$/.test(order.trim())) ||
        !Number.isSafeInteger(Number(order))) {
      throw new Error(`section_order debe ser un entero válido en la fila ${index + 1}.`);
    }
    const clean: ColumnInfo = {
      column_name: text("column_name"),
      readable_name: text("readable_name"),
      meaning: text("meaning"),
      section: text("section"),
      section_order: Number(order),
    };
    if (names.has(clean.column_name)) throw new Error(`La columna «${clean.column_name}» está duplicada.`);
    if (sectionOrders.has(clean.section) && sectionOrders.get(clean.section) !== clean.section_order) {
      throw new Error(`Las filas de la sección «${clean.section}» deben compartir section_order.`);
    }
    names.add(clean.column_name);
    sectionOrders.set(clean.section, clean.section_order);
    return clean;
  });
}

export function parseDictionary(csv: string): ColumnInfo[] {
  const result = Papa.parse(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
  });
  if (result.errors.length || !dictionaryFields.every((field) => result.meta.fields?.includes(field))) {
    throw new Error("El CSV del diccionario debe contener column_name, readable_name, meaning, section y section_order y filas válidas.");
  }
  return validateDictionary(result.data);
}

export function groupColumnsBySection(columns: string[], dictionary: ColumnInfo[]) {
  const byName = new Map(dictionary.map((entry) => [entry.column_name, entry]));
  const sections = new Map<string, { name: string; order: number; columns: string[] }>();
  // Map insertion order preserves the dictionary's first appearance for ties.
  dictionary.forEach((entry) => {
    if (!sections.has(entry.section)) {
      sections.set(entry.section, { name: entry.section, order: entry.section_order, columns: [] });
    }
  });
  const unclassified: string[] = [];
  columns.forEach((name) => {
    const info = byName.get(name);
    if (info) sections.get(info.section)!.columns.push(name);
    else unclassified.push(name);
  });
  const grouped = [...sections.values()].filter((section) => section.columns.length > 0)
    .sort((a, b) => a.order - b.order);
  // Unknown columns always follow all defined sections, even one named Sin clasificar.
  if (unclassified.length) grouped.push({ name: "Sin clasificar", order: Infinity, columns: unclassified });
  return grouped;
}

export function downloadDictionary(entries: ColumnInfo[]) {
  const csv = Papa.unparse({ fields: dictionaryFields, data: validateDictionary(entries) });
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "info_columns_dict.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
