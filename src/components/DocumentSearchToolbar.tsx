import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useRef } from "react";

interface Props {
  query: string;
  count: number;
  activeIndex: number;
  onQueryChange: (value: string) => void;
  onNavigate: (direction: -1 | 1) => void;
}

export default function DocumentSearchToolbar({ query, count, activeIndex, onQueryChange, onNavigate }: Props) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-surface px-4 py-2">
      <label className="relative block min-w-40 flex-1">
        <span className="sr-only">Buscar en este informe</span>
        <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-2 left-3 text-content-muted" />
        <input
          ref={input}
          type="search"
          className="text-input h-8 py-1 pl-9 [&::-webkit-search-cancel-button]:appearance-none"
          placeholder="Buscar en este informe…"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
            event.preventDefault();
            onNavigate(event.shiftKey ? -1 : 1);
          }}
        />
      </label>
      <div className="flex flex-wrap items-center gap-1">
        <p role="status" className="px-1 text-xs text-content-muted tabular-nums">
          {count ? `${activeIndex + 1} de ${count}` : query.trim() ? "Sin coincidencias" : ""}
        </p>
        <button type="button" className="btn btn-ghost size-8 min-h-8 p-0" aria-label="Coincidencia anterior" disabled={!count} onClick={() => onNavigate(-1)}>
          <ChevronUp size={16} aria-hidden="true" />
        </button>
        <button type="button" className="btn btn-ghost size-8 min-h-8 p-0" aria-label="Coincidencia siguiente" disabled={!count} onClick={() => onNavigate(1)}>
          <ChevronDown size={16} aria-hidden="true" />
        </button>
        <button type="button" className="btn btn-ghost size-8 min-h-8 p-0" aria-label="Limpiar búsqueda" disabled={!query} onClick={() => {
          onQueryChange("");
          input.current?.focus();
        }}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
