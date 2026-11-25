import type { TextMatch } from "./textSearch";

interface HighlightSegment extends TextMatch {
  manualIndex: number;
  evidenceIndex: number;
}

// Each search yields sorted, non-overlapping ranges. Split the original text only
// at their boundaries so a character covered by both searches is still rendered once.
export function documentHighlights(
  length: number,
  manual: readonly TextMatch[],
  evidence: readonly TextMatch[],
): HighlightSegment[] {
  const segments: HighlightSegment[] = [];
  let manualIndex = 0;
  let evidenceIndex = 0;
  let start = 0;
  while (start < length) {
    if (manual[manualIndex]?.end === start) manualIndex++;
    if (evidence[evidenceIndex]?.end === start) evidenceIndex++;
    const manualMatch = manual[manualIndex];
    const evidenceMatch = evidence[evidenceIndex];
    const inManual = manualMatch?.start <= start;
    const inEvidence = evidenceMatch?.start <= start;
    const end = Math.min(length,
      (inManual ? manualMatch.end : manualMatch?.start) ?? length,
      (inEvidence ? evidenceMatch.end : evidenceMatch?.start) ?? length,
    );
    segments.push({ start, end, manualIndex: inManual ? manualIndex : -1, evidenceIndex: inEvidence ? evidenceIndex : -1 });
    start = end;
  }
  return segments;
}
