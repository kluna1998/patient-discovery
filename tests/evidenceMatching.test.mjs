import assert from "node:assert/strict";
import test from "node:test";
import { runnerImport } from "vite";
import { documentHighlights } from "../src/utils/documentHighlights.ts";
import { parseDictionary } from "../src/services/columnDictionary.ts";

const { module: { collectEvidenceQueries, searchPatientEvidence } } =
  await runnerImport("./src/services/evidenceMatching.ts");

const column = (column_name, value_type, criterion_id = "synthetic", tipo = "Evidencia") =>
  ({ column_name, readable_name: column_name, value_type, criterion_id, tipo });

const dictionary = [
  column("extraction", "date"),
  column("code", "text"),
  column("sameCode", "text", "other"),
  column("absent", "text"),
  column("empty", "text"),
  column("invalid", "date"),
  column("flag", "boolean"),
  column("value", "number", "synthetic", "Valor"),
  column("units", "text", "synthetic", "Unidades"),
];
const row = {
  extraction: "2025-09-10T23:59:00-02:00", code: "DEMO+1", sameCode: "DEMO+1",
  absent: "Unmentioned", empty: "  ", invalid: "2025-02-29", flag: "1", value: "42", units: "demo",
};

const indexHeader = "nhc_pseudo,doc_id_pseudo,tipo_informe,fecha_informe,archivo_txt";
const indexRows = [
  "DEMO,alpha,Informe A,10.09.2025,fixture/alpha.txt",
  "DEMO,alpha,Informe duplicado,10.09.2025,fixture/alpha.txt",
  "DEMO,beta,Informe B,11.09.2025,fixture/beta.txt",
  "DEMO,gamma,Informe C,10.09.2025,fixture/gamma.txt",
  "DEMO,emptyDoc,Informe vacío,10.08.2025,fixture/empty.txt",
  "OTHER,otherDoc,Otro informe,30.09.2025,fixture/other.txt",
];

const fixtures = new Map([
  ["alpha", "📄 10.9.25 y 2025-09-10 DEMO+1 demo+1 DEMO+10"],
  ["beta", "DEMO+1"],
  ["gamma", "Solo metadatos"],
  ["empty", ""],
  ["other", "Otro paciente DEMO+1"],
]);

test("CSV synonyms scope matching to the configured textual evidence column", async (t) => {
  const { run } = prepare(t);
  const config = parseDictionary([
    "column_name,readable_name,meaning,section,section_order,tipo,value_type,Sinonimos",
    "withAlias,Con sinónimos,Descripción,Prueba,1,Evidencia,text,DEMO+1; demo+1",
    "withoutAlias,Sin sinónimos,Descripción,Prueba,1,Evidencia,text,",
    "date,Fecha,Descripción,Prueba,1,Evidencia,date,DEMO+1",
    "value,Valor,Descripción,Prueba,1,Valor,text,DEMO+1",
  ].join("\n"));
  const { results } = await run({
    config, data: { withAlias: "Nombre original", withoutAlias: "Nombre original", date: "2025-10-01", value: "Nombre original" },
  });
  assert.equal(results.get("withAlias").value, "Nombre original");
  assert.deepEqual(results.get("withAlias").references.flatMap(({ matches }) => matches.map(({ matchedText }) => matchedText)), [
    "DEMO+1", "DEMO+1", "demo+1",
  ]);
  assert.deepEqual(results.get("withoutAlias").references, []);
  assert.deepEqual(results.get("date").references, []);
  assert.equal(results.has("value"), false);
});

function prepare(t) {
  let index = [indexHeader, ...indexRows].join("\n");
  const reads = [];
  const failed = new Set();
  t.mock.method(globalThis, "fetch", async (url, { signal } = {}) => {
    signal?.throwIfAborted();
    const key = /([^/]+)\.(?:txt|csv)$/.exec(url)?.[1];
    assert.ok(key === "indice_pacientes" || fixtures.has(key), `Unexpected request: ${url}`);
    reads.push(key);
    if (failed.has(key)) return new Response(null, { status: 503 });
    return new Response(key === "indice_pacientes" ? index : fixtures.get(key));
  });
  const cohort = {};
  const run = ({
    patient = "DEMO", data = row, config = dictionary, scope = cohort, signal = new AbortController().signal,
  } = {}) => searchPatientEvidence(scope, config, patient, collectEvidenceQueries(data, config), signal);
  return { reads, failed, run, setIndex: (rows) => { index = [indexHeader, ...rows].join("\n"); } };
}

test("groups text and metadata by document and shares scans across equivalent evidence", async (t) => {
  const { run, reads } = prepare(t);
  const { results, documents, failedDocuments } = await run();
  assert.equal(failedDocuments, 0);
  assert.deepEqual(documents.map(({ id }) => id), ["beta", "alpha", "gamma", "emptyDoc"]);
  assert.deepEqual([...results.keys()], ["extraction", "code", "sameCode", "absent"]);
  const dates = results.get("extraction").references;
  assert.deepEqual(dates.map(({ document, metadataMatch, matches }) =>
    [document.id, metadataMatch, matches.map(({ matchedText }) => matchedText)]), [
    ["alpha", true, ["10.9.25", "2025-09-10"]], ["gamma", true, []],
  ]);
  for (const reference of dates) {
    for (const { start, end, matchedText } of reference.matches) {
      assert.equal(reference.text.slice(start, end), matchedText);
    }
  }
  const code = results.get("code");
  const sameCode = results.get("sameCode");
  assert.deepEqual(code.references.map(({ document, matches }) => [document.id, matches.length]), [["beta", 1], ["alpha", 2]]);
  assert.equal(code.references, sameCode.references);
  assert.equal(sameCode.criterionId, "other");
  assert.equal(sameCode.columnName, "sameCode");
  assert.equal(sameCode.value, "DEMO+1");
  assert.deepEqual(results.get("absent").references, []);
  assert.deepEqual(reads.sort(), ["alpha", "beta", "empty", "gamma", "indice_pacientes"]);
});

test("caches results by patient, evidence values, dictionary, cohort and associated reports", async (t) => {
  const { run, reads, setIndex } = prepare(t);
  const first = await run();
  assert.equal(await run(), first);
  assert.equal(reads.filter((read) => read === "alpha").length, 1);
  const other = await run({ patient: "OTHER" });
  assert.deepEqual(other.results.get("code").references.map((ref) => ref.document.id), ["otherDoc"]);
  assert.notEqual(await run({ data: { ...row, code: "changed" } }), first);
  assert.notEqual(await run({ config: [...dictionary] }), first);
  assert.notEqual(await run({ scope: {} }), first);
  setIndex(indexRows.filter((line) => !line.includes("fixture/beta.txt")));
  const changed = await run();
  assert.notEqual(changed, first);
  assert.deepEqual(changed.results.get("code").references.map((ref) => ref.document.id), ["alpha"]);
  const readCount = reads.length;
  assert.equal((await run({ data: {} })).results.size, 0);
  assert.equal(reads.length, readCount);
});

test("keeps partial references, retries failed reports, and surfaces index errors", async (t) => {
  const { run, failed } = prepare(t);
  failed.add("alpha");
  const partial = await run();
  assert.equal(partial.failedDocuments, 1);
  assert.equal(partial.results.get("code").references.length, 1);
  const date = partial.results.get("extraction").references.find((ref) => ref.document.id === "alpha");
  assert.equal(date.metadataMatch, true);
  assert.deepEqual(date.matches, []);
  assert.equal(date.text, undefined);
  failed.delete("alpha");
  assert.equal((await run()).failedDocuments, 0);
  failed.add("indice_pacientes");
  await assert.rejects(run(), /índice/);
});

test("aborts pending processing without caching incomplete work", async (t) => {
  const { run, reads } = prepare(t);
  const controller = new AbortController();
  const request = run({ signal: controller.signal });
  setTimeout(() => controller.abort(), 0);
  await assert.rejects(request, { name: "AbortError" });
  const completed = await run();
  assert.equal(completed.results.get("code").references.length, 2);
  assert.equal(reads.filter((read) => read === "alpha").length, 2);
});

test("splits overlaps once while keeping the original text and both navigation indices", () => {
  const text = "0123456789";
  const segments = documentHighlights(text.length, [{ start: 2, end: 6 }, { start: 7, end: 9 }],
    [{ start: 1, end: 3 }, { start: 4, end: 7 }]);
  assert.equal(segments.map(({ start, end }) => text.slice(start, end)).join(""), text);
  assert.deepEqual(segments.map(({ start, end, manualIndex, evidenceIndex }) => [start, end, manualIndex, evidenceIndex]), [
    [0, 1, -1, -1], [1, 2, -1, 0], [2, 3, 0, 0], [3, 4, 0, -1],
    [4, 6, 0, 1], [6, 7, -1, 1], [7, 9, 1, -1], [9, 10, -1, -1],
  ]);
});
