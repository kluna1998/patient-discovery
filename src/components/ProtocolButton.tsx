import { useEffect, useRef, useState } from "react";
import { BookOpen, X } from "lucide-react";

function ProtocolDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [criteria, setCriteria] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}criterios.txt`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("No s’ha pogut carregar el protocol.");
        return response.text();
      })
      .then((text) => setCriteria(text.trim()))
      .catch(() => {
        if (!controller.signal.aborted) setError("No s’ha pogut carregar el protocol. Tanca aquesta finestra i torna-ho a provar.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="decision-dialog protocol-dialog"
      aria-labelledby="protocol-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="flex items-start justify-between gap-4 border-b border-line p-6">
        <div>
          <h2 id="protocol-title" className="text-xl font-semibold text-content-strong">Protocol</h2>
          <p className="mt-1 text-sm text-content-muted">Criteris d’inclusió i exclusió</p>
        </div>
        <button type="button" className="btn min-h-8 p-2" onClick={onClose} aria-label="Tanca el protocol" autoFocus>
          <X size={16} />
        </button>
      </header>
      <div className="whitespace-pre-wrap break-words p-6 text-sm leading-relaxed">
        {loading ? <p role="status">S’està carregant el protocol…</p>
          : error ? <p role="alert">{error}</p>
          : criteria || "Els criteris del protocol encara no estan disponibles."}
      </div>
    </dialog>
  );
}

export default function ProtocolButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn border-brand-accent text-brand-accent" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <BookOpen size={16} aria-hidden="true" />
        Protocol
      </button>
      {open && <ProtocolDialog onClose={() => setOpen(false)} />}
    </>
  );
}
