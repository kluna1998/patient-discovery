
export type PatientRow = Record<string, string>;

export interface CsvDataset {
  columns: string[];
  rows: PatientRow[];
  fileName: string;
}
