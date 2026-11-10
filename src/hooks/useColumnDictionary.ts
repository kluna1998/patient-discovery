import { useEffect, useState } from "react";
import { dictionaryStorageKey, parseDictionary, validateDictionary } from "../services/columnDictionary";
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
      let warning = "";
      try {
        try {
          const saved = localStorage.getItem(dictionaryStorageKey);
          if (saved !== null) {
            const stored = validateDictionary(JSON.parse(saved));
            if (!controller.signal.aborted) setEntries(stored);
            return;
          }
        } catch {
          warning = "No se pudo leer la copia local. Se ha cargado el diccionario del proyecto.";
        }
        const response = await fetch(`${import.meta.env.BASE_URL}info_columns_dict.csv`, { signal: controller.signal });
        if (!response.ok) throw new Error("No se pudo cargar public/info_columns_dict.csv.");
        const initial = parseDictionary(await response.text());
        if (!controller.signal.aborted) {
          setEntries(initial);
          setError(warning);
        }
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
    const clean = validateDictionary(next);
    try {
      localStorage.setItem(dictionaryStorageKey, JSON.stringify(clean));
    } catch {
      throw new Error("No se pudieron guardar los cambios en este navegador. Comprueba el espacio disponible y los permisos de almacenamiento.");
    }
    setEntries(clean);
    setError("");
  }

  return { entries, loading, error, save, retry: () => setAttempt((value) => value + 1) };
}
