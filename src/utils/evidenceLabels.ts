export const metadataMatchLabel = "Coincidència en la data de l’informe";
export const partialEvidenceLabel = "Cerca parcial";

export function formatMatchCount(count: number) {
  return `${count} ${count === 1 ? "coincidència" : "coincidències"}`;
}
