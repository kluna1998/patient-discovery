export const metadataMatchLabel = "Coincidencia en fecha del informe";
export const partialEvidenceLabel = "Búsqueda parcial";

export function formatMatchCount(count: number) {
  return `${count} ${count === 1 ? "coincidencia" : "coincidencias"}`;
}
