import Papa from "papaparse";

export interface ColumnInfo {
  column_name: string;
  readable_name: string;
  meaning: string;
  section: string;
  section_order: number;
  criterion_id?: string;
  criterio?: string;
  tipo?: "Evidencia" | "Valor" | "Unidades" | "";
  value_type?: "boolean" | "date" | "number" | "text" | "";
  explicacion?: string;
}

const dictionaryFields = ["column_name", "readable_name", "meaning", "section", "section_order"];
const metadataFields = ["criterion_id", "criterio", "tipo", "value_type", "explicacion"] as const;

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
    for (const field of metadataFields) {
      const value = row[field];
      if (value !== undefined && typeof value !== "string") {
        throw new Error(`${field} debe ser texto en la fila ${index + 1}.`);
      }
      const textValue = (value as string | undefined)?.trim() ?? "";
      if (field === "tipo") {
        if (!["", "Evidencia", "Valor", "Unidades"].includes(textValue)) {
          throw new Error(`tipo no válido en la fila ${index + 1}.`);
        }
        clean.tipo = textValue as ColumnInfo["tipo"];
      } else if (field === "value_type") {
        if (!["", "boolean", "date", "number", "text"].includes(textValue)) {
          throw new Error(`value_type no válido en la fila ${index + 1}.`);
        }
        clean.value_type = textValue as ColumnInfo["value_type"];
      } else {
        clean[field] = textValue;
      }
    }
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

export interface DialogField {
  primary: ColumnInfo;
  evidences: ColumnInfo[];
  units?: ColumnInfo;
}

export interface DialogSection {
  name: string;
  order: number;
  fields: DialogField[];
}

export function groupPatientFieldsForDialog(columns: string[], dictionary: ColumnInfo[]): DialogSection[] {
  const byName = new Map(dictionary.map((info) => [info.column_name, info]));
  const dictionaryOrder = new Map(dictionary.map((info, index) => [info.column_name, index]));

  return groupColumnsBySection(columns, dictionary).map((section) => {
    const ordered = section.columns.map((name): ColumnInfo => byName.get(name) ?? {
      column_name: name,
      readable_name: name,
      meaning: "",
      section: section.name,
      section_order: section.order,
    }).sort((a, b) =>
      (dictionaryOrder.get(a.column_name) ?? Infinity) - (dictionaryOrder.get(b.column_name) ?? Infinity),
    );
    const criteria = new Map<string, ColumnInfo[]>();
    for (const info of ordered) {
      if (!info.criterion_id) continue;
      const group = criteria.get(info.criterion_id) ?? [];
      group.push(info);
      criteria.set(info.criterion_id, group);
    }

    const fields = new Map<string, DialogField>();
    const attached = new Set<string>();
    for (const group of criteria.values()) {
      const values = group.filter((info) => info.tipo === "Valor");
      // Without a unique primary, preserve every column independently.
      if (values.length !== 1) continue;
      const primary = values[0];
      const evidences = group.filter((info) => info.tipo === "Evidencia");
      const units = group.filter((info) => info.tipo === "Unidades");
      const field: DialogField = { primary, evidences };
      evidences.forEach((info) => attached.add(info.column_name));
      if (units.length === 1) {
        field.units = units[0];
        attached.add(units[0].column_name);
      }
      fields.set(primary.column_name, field);
    }

    return {
      name: section.name,
      order: section.order,
      fields: ordered.filter((info) => !attached.has(info.column_name))
        .map((info) => fields.get(info.column_name) ?? { primary: info, evidences: [] }),
    };
  });
}

export function downloadDictionary(entries: ColumnInfo[]) {
  const csv = Papa.unparse({ fields: [...dictionaryFields, ...metadataFields], data: validateDictionary(entries) });
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "info_columns_dict.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
