import Papa from "papaparse";

export interface ClinicalDocument {
  id: string;
  type: string;
  date: string;
  textPath: string;
}

type DocumentIndex = Map<string, ClinicalDocument[]>;

let indexRequest: Promise<DocumentIndex> | undefined;

function dateKey(date: string) {
  const [day, month, year] = date.split(".");
  return year && month && day ? `${year}${month}${day}` : "";
}

async function loadIndex(): Promise<DocumentIndex> {
  const response = await fetch(`${import.meta.env.BASE_URL}indice_pacientes.csv`);
  if (!response.ok) throw new Error("No se pudo cargar el índice.");

  const { data, errors } = Papa.parse<Record<string, string>>(await response.text(), {
    header: true,
    skipEmptyLines: "greedy",
  });
  if (errors.length) throw new Error("No se pudo leer el índice.");

  const index: DocumentIndex = new Map();
  for (const row of data) {
    const patientId = row.nhc_pseudo?.trim();
    const id = row.doc_id_pseudo?.trim();
    if (!patientId || !id) continue;

    const documents = index.get(patientId) ?? [];
    documents.push({
      id,
      type: row.tipo_informe?.trim() ?? "",
      date: row.fecha_informe?.trim() ?? "",
      textPath: row.archivo_txt?.trim() ?? "",
    });
    index.set(patientId, documents);
  }

  for (const documents of index.values()) {
    documents.sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)));
  }
  return index;
}

function getIndex() {
  indexRequest ??= loadIndex().catch((error: unknown) => {
    indexRequest = undefined;
    throw error;
  });
  return indexRequest;
}

export async function getClinicalDocuments(patientId: string) {
  return (await getIndex()).get(patientId) ?? [];
}

export interface ClinicalDocumentsPatient {
  patientId: string;
  documents: readonly ClinicalDocument[];
}

export async function listClinicalDocumentsPatients(): Promise<ClinicalDocumentsPatient[]> {
  return Array.from(await getIndex(), ([patientId, documents]) => ({ patientId, documents }));
}

export async function getClinicalDocumentText(path: string, signal: AbortSignal) {
  const segments = path.split("/");
  if (!path.endsWith(".txt") || segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error("Ruta de informe no válida.");
  }

  const url = import.meta.env.BASE_URL + segments.map(encodeURIComponent).join("/");
  const response = await fetch(url, { signal });
  if (!response.ok || response.headers.get("content-type")?.includes("text/html")) {
    throw new Error("No se pudo cargar el informe.");
  }
  return response.text();
}
