import * as Dialog from "@radix-ui/react-dialog";
import { FileText, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { listClinicalDocumentsPatients } from "../services/clinicalDocuments";
import type { ClinicalDocument, ClinicalDocumentsPatient } from "../services/clinicalDocuments";
import ClinicalDocumentsTable from "./ClinicalDocumentsTable";
import DocumentViewer from "./DocumentViewer";

export default function ClinicalDocumentsExplorer() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className="btn text-primary hover:bg-surface-accent">
          <FileText size={16} aria-hidden="true" /> Explorar documentos clínicos
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-backdrop" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-2 z-50 mx-auto flex max-w-5xl flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-lg sm:inset-4"
        >
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line p-4">
            <Dialog.Title className="text-lg font-semibold text-primary">Explorar documentos clínicos</Dialog.Title>
            <Dialog.Close className="btn btn-ghost size-8 min-h-8 shrink-0 p-0" aria-label="Cerrar explorador">
              <X size={16} aria-hidden="true" />
            </Dialog.Close>
          </header>
          <ExplorerViews />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ExplorerViews() {
  const [patients, setPatients] = useState<ClinicalDocumentsPatient[]>();
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<{ patientId: string; document: ClinicalDocument }>();
  const [reading, setReading] = useState(false);
  const sourceButton = useRef<HTMLButtonElement>(null);
  const viewer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    listClinicalDocumentsPatients().then(
      (result) => { if (active) setPatients(result); },
      () => { if (active) setError(true); },
    );
    return () => { active = false; };
  }, []);

  useLayoutEffect(() => {
    if (reading) viewer.current?.focus({ preventScroll: true });
    else sourceButton.current?.focus({ preventScroll: true });
  }, [reading]);

  function selectDocument(patientId: string, document: ClinicalDocument, button: HTMLButtonElement) {
    sourceButton.current = button;
    setSelected({ patientId, document });
    setReading(true);
  }

  return (
    <>
      <div hidden={reading} className={reading ? "" : "flex min-h-0 flex-1 flex-col"}>
        {error ? <p className="p-4" role="alert">No se pudo cargar el índice de documentos.</p>
          : !patients ? <p className="p-4" role="status">Cargando documentos…</p>
          : patients.length ? <ClinicalDocumentsTable patients={patients} selected={selected} onSelect={selectDocument} />
          : <p className="p-4">No hay documentos disponibles.</p>}
      </div>
      {reading && selected && (
        <div
          ref={viewer}
          tabIndex={-1}
          role="region"
          aria-label={`Informe del paciente ${selected.patientId}`}
          className="flex min-h-0 min-w-0 flex-1 flex-col"
        >
          <DocumentViewer document={selected.document} onClose={() => setReading(false)} closeLabel="Volver al explorador" />
        </div>
      )}
    </>
  );
}
