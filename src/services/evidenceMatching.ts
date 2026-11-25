import type { ColumnInfo } from "./columnDictionary";
import { getClinicalDocuments, getClinicalDocumentText } from "./clinicalDocuments";
import type { ClinicalDocument } from "./clinicalDocuments";
import type { PatientRow } from "../types/patient";
import type { DocumentEvidenceReference, EvidenceField, EvidenceMatch, EvidenceReport, EvidenceSearchResult } from "../types/evidence";
import { generateEvidenceRegex, parseEvidenceDate } from "../utils/evidenceRegex";

interface EvidenceQuery {
  field: EvidenceField;
  regex: RegExp;
  date: ReturnType<typeof parseEvidenceDate>;
}

export function collectEvidenceQueries(row: PatientRow, dictionary: ColumnInfo[]) {
  const queries = new Map<string, EvidenceQuery>();
  const compiled = new Map<string, Pick<EvidenceQuery, "regex" | "date">>();
  for (const column of dictionary) {
    if (column.tipo !== "Evidencia") continue;
    const value = row[column.column_name];
    const key = JSON.stringify([column.value_type, value?.trim()]);
    let strategy = compiled.get(key);
    if (!strategy) {
      const regex = generateEvidenceRegex(value, column.value_type);
      if (!regex) continue;
      strategy = { regex, date: column.value_type === "date" ? parseEvidenceDate(value) : null };
      compiled.set(key, strategy);
    }
    queries.set(column.column_name, {
      ...strategy,
      field: {
        criterionId: column.criterion_id ?? "",
        columnName: column.column_name,
        name: column.readable_name,
        value,
      },
    });
  }
  return queries;
}

interface CacheEntry {
  signature: string;
  report: EvidenceReport;
}

const sessionCache = new WeakMap<object, WeakMap<ColumnInfo[], Map<string, CacheEntry>>>();
const cacheLimit = 20;

function getCache(cohort: object, dictionary: ColumnInfo[]) {
  let cohortCache = sessionCache.get(cohort);
  if (!cohortCache) {
    cohortCache = new WeakMap();
    sessionCache.set(cohort, cohortCache);
  }
  let cache = cohortCache.get(dictionary);
  if (!cache) {
    cache = new Map();
    cohortCache.set(dictionary, cache);
  }
  return cache;
}

function sameDate(a: NonNullable<EvidenceQuery["date"]>, b: EvidenceQuery["date"]) {
  return a.year === b?.year && a.month === b.month && a.day === b.day;
}

function findMatches(text: string, regex: RegExp): EvidenceMatch[] {
  // A single global scan produces one match per position, including when alternatives overlap.
  return Array.from(text.matchAll(regex), (match) => ({
    start: match.index,
    end: match.index + match[0].length,
    matchedText: match[0],
  }));
}

async function matchDocuments(
  documents: readonly ClinicalDocument[],
  queries: ReadonlyMap<string, EvidenceQuery>,
  signal: AbortSignal,
): Promise<EvidenceReport> {
  const strategies = new Map<string, {
    query: EvidenceQuery;
    references: DocumentEvidenceReference[];
  }>();
  const results = new Map<string, EvidenceSearchResult>();
  for (const [column, query] of queries) {
    const key = query.regex.toString();
    let strategy = strategies.get(key);
    if (!strategy) {
      strategy = { query, references: [] };
      strategies.set(key, strategy);
    }
    results.set(column, { ...query.field, references: strategy.references });
  }

  // Process a bounded group of downloads and share each path across the patient's documents.
  const byPath = new Map<string, ClinicalDocument[]>();
  for (const document of documents) {
    const entries = byPath.get(document.textPath) ?? [];
    entries.push(document);
    byPath.set(document.textPath, entries);
  }

  let failedDocuments = 0;
  const entries = [...byPath];
  for (let offset = 0; offset < entries.length; offset += 4) {
    signal.throwIfAborted();
    const batch = entries.slice(offset, offset + 4);
    const texts = await Promise.allSettled(batch.map(([path]) => getClinicalDocumentText(path, signal)));
    signal.throwIfAborted();
    for (const [index, [, group]] of batch.entries()) {
      const result = texts[index];
      const text = result.status === "fulfilled" ? result.value : undefined;
      if (text === undefined) failedDocuments += group.length;
      // Give the browser a chance to render and handle closing between files and strategy batches.
      let processed = 0;
      const dated = group.map((document) => ({ document, date: parseEvidenceDate(document.date) }));
      for (const { query, references } of strategies.values()) {
        if (processed++ % 16 === 0) {
          await new Promise<void>((resolve) => setTimeout(resolve, 0));
          signal.throwIfAborted();
        }
        const matches = text ? findMatches(text, query.regex) : [];
        for (const { document, date } of dated) {
          const metadataMatch = query.date !== null && sameDate(query.date, date);
          if (matches.length || metadataMatch) references.push({ document, matches, metadataMatch, text });
        }
      }
    }
  }

  const order = new Map(documents.map((document, index) => [document.id, index]));
  for (const { references } of strategies.values()) {
    references.sort((a, b) => order.get(a.document.id)! - order.get(b.document.id)!);
  }
  return { results, failedDocuments };
}

export async function searchPatientEvidence(
  cohort: object,
  dictionary: ColumnInfo[],
  patientId: string | undefined,
  queries: ReadonlyMap<string, EvidenceQuery>,
  signal: AbortSignal,
): Promise<EvidenceReport> {
  signal.throwIfAborted();
  if (!queries.size) return { results: new Map(), failedDocuments: 0 };
  if (!patientId) throw new Error("Este registro no tiene un identificador de paciente (nhc).");

  const uniqueDocuments = new Map<string, ClinicalDocument>();
  for (const document of await getClinicalDocuments(patientId, signal)) {
    if (!uniqueDocuments.has(document.id)) uniqueDocuments.set(document.id, document);
  }
  signal.throwIfAborted();
  const documents = [...uniqueDocuments.values()];
  const signature = JSON.stringify([
    [...queries.values()].map(({ field, regex }) => [field, regex.toString()]),
    documents,
  ]);
  const cache = getCache(cohort, dictionary);
  const cached = cache.get(patientId);
  cache.delete(patientId);
  if (cached?.signature === signature) {
    cache.set(patientId, cached);
    return cached.report;
  }

  const report = await matchDocuments(documents, queries, signal);
  signal.throwIfAborted();
  if (!report.failedDocuments) {
    cache.set(patientId, { signature, report });
    if (cache.size > cacheLimit) cache.delete(cache.keys().next().value!);
  }
  return report;
}
