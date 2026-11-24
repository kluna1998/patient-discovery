import type { ComponentProps, ReactElement } from "react";
import { useEffect, useState } from "react";
import { getClinicalDocuments } from "../services/clinicalDocuments";
import type { ClinicalDocument } from "../services/clinicalDocuments";
import DocumentViewer from "./DocumentViewer";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";

type Props = Pick<ComponentProps<typeof Sheet>, "open" | "onOpenChange"> & {
  children: ReactElement;
  container?: HTMLElement | null;
  patientId: string | undefined;
};

export default function ClinicalDocumentsSheet({ children, container, patientId, ...props }: Props) {
  const id = patientId?.trim();

  return (
    <Sheet {...props}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent container={container} aria-describedby={undefined}>
        <header className="py-4 pl-4 pr-14">
          <SheetTitle className="text-base font-semibold text-content-strong">Documentos clínicos</SheetTitle>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 text-sm">
          {id ? <PatientDocuments key={id} patientId={id} /> : (
            <p>Este registro no tiene un identificador de paciente (nhc).</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PatientDocuments({ patientId }: { patientId: string }) {
  const [documents, setDocuments] = useState<ClinicalDocument[]>();
  const [indexError, setIndexError] = useState(false);
  const [selected, setSelected] = useState<ClinicalDocument>();

  useEffect(() => {
    let active = true;
    getClinicalDocuments(patientId).then(
      (result) => { if (active) setDocuments(result); },
      () => { if (active) setIndexError(true); },
    );
    return () => { active = false; };
  }, [patientId]);

  if (indexError) return <p role="alert">No se pudo cargar la lista de documentos.</p>;
  if (!documents) return <p role="status">Cargando documentos…</p>;
  if (!documents.length) return <p>No hay documentos para este paciente.</p>;

  return (
    <>
      <ul className="space-y-2">
        {documents.map((document) => (
          <li key={document.id}>
            <button
              type="button"
              aria-pressed={selected === document}
              className="btn w-full justify-between gap-3 text-left aria-pressed:border-primary aria-pressed:bg-surface-accent"
              onClick={() => setSelected(document)}
            >
              <span>{document.type || document.id}</span>
              {document.date && <span className="shrink-0 font-normal">{document.date}</span>}
            </button>
          </li>
        ))}
      </ul>
      {selected && <DocumentViewer key={selected.id} document={selected} />}
    </>
  );
}
