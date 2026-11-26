import assert from "node:assert/strict";
import test from "node:test";
import { generateEvidenceRegex } from "../src/utils/evidenceRegex.ts";

const find = (value, type, text) =>
  Array.from(text.matchAll(generateEvidenceRegex(value, type)), (match) => match[0]);

test("dates match calendar formats and preserve offsets across time zones", () => {
  const text = "📄 2025-09-10T03:00 10/09/2025 10.09.2025 10-09-2025 10/9/2025 10/9/25";
  const regex = generateEvidenceRegex("2025-09-10T23:50:00-11:00", "date");
  assert.deepEqual(find("2025-09-10", "date", text), [
    "2025-09-10", "10/09/2025", "10.09.2025", "10-09-2025", "10/9/2025", "10/9/25",
  ]);
  const first = regex.exec(text);
  assert.equal(first.index, text.indexOf("2025"));
  assert.deepEqual(find("2024-02-09", "date", "09/02/2024 9/2/24 109/2/24 9/2/2400 9/2/24/2 9/2-24 12024-02-09"), [
    "09/02/2024", "9/2/24",
  ]);
  assert.ok(generateEvidenceRegex("2024-02-29", "date"));
  for (const value of ["2025-02-29", "1900-02-29", "2025-00-10", "0000-01-01", "2025-01-01T25:00:00"]) {
    assert.equal(generateEvidenceRegex(value, "date"), null);
  }
});

test("numbers accept equivalent decimal forms without partial values", () => {
  assert.deepEqual(find("152.0", "number", "152 152.0 152,0 152.00 152,00 +152 -152 1152 1520 152.5 152,5 1.152 152.01"), [
    "152", "152.0", "152,0", "152.00", "152,00", "+152",
  ]);
  assert.deepEqual(find("-0,50", "number", "-0.5 −.5 -00,500 0.5 -0.51 -0.5.2"), ["-0.5", "−.5", "-00,500"]);
  assert.deepEqual(find("000.000", "number", "0 -0.0 +0,00 0.0001"), ["0", "-0.0", "+0,00"]);
  for (const value of ["NaN", "Infinity", "1,2.3", "1e3", "-"]) {
    assert.equal(generateEvidenceRegex(value, "number"), null);
  }
});

test("text is literal, case insensitive and bounded", () => {
  assert.deepEqual(find("  A+B (x)  ", "text", "a+b\n (X) AA+B (x) a+b (x)-extra aab (x)"), ["a+b\n (X)"]);
  assert.deepEqual(find("DEMO-01", "text", "DEMO-01. demo-01, X-DEMO-01 DEMO-01-a DEMO-010 ÁDEMO-01"), ["DEMO-01", "demo-01"]);
  for (const [value, type] of [["   ", "text"], [null, "text"], ["1", "boolean"], ["a", ""], ["a", undefined]]) {
    assert.equal(generateEvidenceRegex(value, type), null);
  }
});

test("text synonyms are literal alternatives and prefer the longest match", () => {
  const regex = generateEvidenceRegex("Lipoproteína(a)", "text", " Lp(a); ; lp (a); LPA; lpa; Lp(a) libre; A+B ");
  const text = "Lipoproteína(a), LP(A) libre, lp\t(a), lpa, palpar, LPA2, x-LPA, A+B, AAB";
  assert.deepEqual([...text.matchAll(regex)].map((match) => match[0]), [
    "Lipoproteína(a)", "LP(A) libre", "lp\t(a)", "lpa", "A+B",
  ]);
  assert.equal(generateEvidenceRegex("", "text", "LPA"), null);
  assert.equal(generateEvidenceRegex("5", "number", "LPA").source, generateEvidenceRegex("5", "number").source);
});
