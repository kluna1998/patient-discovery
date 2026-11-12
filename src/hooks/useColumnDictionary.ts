import { useEffect, useState } from "react";
import { parseDictionary, validateDictionary } from "../services/columnDictionary";
import type { ColumnInfo } from "../services/columnDictionary";

export function useColumnDictionary() {
  const [entries, setEntries] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}info_columns_dict.csv`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("No se pudo cargar public/info_columns_dict.csv.");
        const initial = parseDictionary(await response.text());
        if (!controller.signal.aborted) setEntries(initial);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudo cargar el diccionario.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  function save(next: ColumnInfo[]) {
    setEntries(validateDictionary(next));
  }

  return { entries, loading, error, save, retry: () => setAttempt((value) => value + 1) };
}
