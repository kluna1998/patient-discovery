import { useMemo, useState } from "react";
import { textSearch } from "../utils/textSearch";

export function useDocumentSearch(text: string) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const matches = useMemo(() => textSearch(text, query), [text, query]);
  const activeIndex = matches.length ? index % matches.length : -1;

  function changeQuery(value: string) {
    setQuery(value);
    setIndex(0);
  }

  function navigate(direction: -1 | 1) {
    if (!matches.length) return;
    setIndex((current) => (current % matches.length + direction + matches.length) % matches.length);
  }

  return { query, changeQuery, matches, activeIndex, navigate };
}
