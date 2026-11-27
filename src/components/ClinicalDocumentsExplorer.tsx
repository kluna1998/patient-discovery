import * as Dialog from "@radix-ui/react-dialog";
import { FileText, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { listClinicalDocumentsPatients } from "../services/clinicalDocuments";
import type { ClinicalDocument, ClinicalDocumentsPatient } from "../services/clinicalDocuments";
import type { CsvDataset } from "../types/patient";
import type { ColumnInfo } from "../services/columnDictionary";
import ClinicalDocumentsTable from "./ClinicalDocumentsTable";
import DocumentViewer from "./DocumentViewer";

export default function ClinicalDocumentsExplorer() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="hidden btn btn-primary size-10 shrink-0 p-0 sm:w-auto sm:px-4 sm:py-2"
          aria-label="Explora els documents clínics"
          title="Explora els documents clínics"
        >
          <FileText size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Explora els documents clínics</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-backdrop" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-2 z-50 mx-auto flex max-w-5xl flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-lg sm:inset-4"
        >
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line p-5 sm:p-6">
            <Dialog.Title className="text-lg font-semibold text-primary">Explora els documents clínics</Dialog.Title>
            <Dialog.Close className="btn btn-ghost size-8 min-h-8 shrink-0 p-0" aria-label="Tanca l’explorador">
              <X size={16} aria-hidden="true" />
            </Dialog.Close>
          </header>
          <ClinicalDocumentsBrowser />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ClinicalDocumentsBrowser({ openDocumentInDialog = false, cohort, dictionary }: {
  openDocumentInDialog?: boolean;
  cohort?: CsvDataset;
  dictionary?: ColumnInfo[];
}) {
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
    if (openDocumentInDialog) return;
    if (reading) viewer.current?.focus({ preventScroll: true });
    else sourceButton.current?.focus({ preventScroll: true });
  }, [openDocumentInDialog, reading]);

  function selectDocument(patientId: string, document: ClinicalDocument, button: HTMLButtonElement) {
    sourceButton.current = button;
    setSelected({ patientId, document });
    setReading(true);
  }

  const readingInline = reading && !openDocumentInDialog;

  return (
    <>
      <div hidden={readingInline} className={readingInline ? "" : "flex min-h-0 flex-1 flex-col"}>
        {error ? <p className="p-4" role="alert">No s’ha pogut carregar l’índex de documents.</p>
          : !patients ? <p className="p-4" role="status">S’estan carregant els documents…</p>
          : patients.length ? <ClinicalDocumentsTable patients={patients} selected={selected} onSelect={selectDocument} cohort={cohort} dictionary={dictionary} />
          : <p className="p-4">No hi ha documents disponibles.</p>}
      </div>
      {openDocumentInDialog && (
        <Dialog.Root open={reading} onOpenChange={setReading}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-backdrop" />
            <Dialog.Content
              aria-describedby={undefined}
              className="fixed inset-2 z-50 mx-auto flex max-w-5xl flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-lg sm:inset-4"
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                sourceButton.current?.focus({ preventScroll: true });
              }}
            >
              <Dialog.Title className="sr-only">Visor de documents clínics</Dialog.Title>
              {selected && (
                <DocumentViewer key={selected.document.id} document={selected.document} onClose={() => setReading(false)} closeLabel="Tanca el visor" />
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
      {readingInline && selected && (
        <div
          ref={viewer}
          tabIndex={-1}
          role="region"
          aria-label={`Informe del pacient ${selected.patientId}`}
          className="flex min-h-0 min-w-0 flex-1 flex-col"
        >
          <DocumentViewer document={selected.document} onClose={() => setReading(false)} closeLabel="Torna a l’explorador" />
        </div>
      )}
    </>
  );
}
