export interface TextMatch {
  start: number;
  end: number;
}

export function textSearch(text: string, query: string): TextMatch[] {
  const term = query.trim();
  if (!term) return [];

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Array.from(text.matchAll(new RegExp(escaped, "giu")), (match) => ({
    start: match.index,
    end: match.index + match[0].length,
  }));
}
