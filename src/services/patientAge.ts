import type { CsvDataset } from "../types/patient";

// Read calendar components explicitly: ISO date-only strings must not shift timezone.
export function calculate_age(birthDate: string | undefined, referenceDate = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate?.trim() ?? "");
  if (!match || Number.isNaN(referenceDate.getTime())) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return null;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > daysInMonth[month - 1]) return null;

  const currentMonth = referenceDate.getMonth() + 1;
  const birthdayPending = month > currentMonth || (month === currentMonth && day > referenceDate.getDate());
  const age = referenceDate.getFullYear() - year - Number(birthdayPending);
  return age < 0 ? null : age;
}

export function withPatientAges(dataset: CsvDataset, referenceDate = new Date()): CsvDataset {
  // Legacy files containing only age retain their imported values.
  if (!dataset.columns.includes("birth_date")) return dataset;
  const columns = [...dataset.columns];
  if (!columns.includes("age")) columns.splice(columns.indexOf("birth_date") + 1, 0, "age");
  return {
    ...dataset,
    columns,
    rows: dataset.rows.map((row) => {
      const age = calculate_age(row.birth_date, referenceDate);
      return { ...row, age: age === null ? "" : String(age) };
    }),
  };
}
