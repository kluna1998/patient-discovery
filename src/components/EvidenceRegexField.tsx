import { Search } from "lucide-react";

export default function EvidenceRegexField({ pattern }: { pattern: string }) {
  return (
    <label className="block min-w-0 flex-1">
      <span className="mb-1 block text-xs text-content-muted">Regex de la evidencia</span>
      <span className="relative block">
        <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-2 left-3 text-content-muted" />
        <input
          type="text"
          readOnly
          dir="ltr"
          spellCheck={false}
          className="text-input h-8 min-w-0 bg-surface-muted py-1 pl-9 font-mono text-xs"
          value={pattern}
          title={pattern}
        />
      </span>
    </label>
  );
}
