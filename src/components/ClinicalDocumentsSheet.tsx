import type { ComponentProps, ReactElement } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getClinicalDocuments } from "../services/clinicalDocuments";
import type { ClinicalDocument } from "../services/clinicalDocuments";
import ClinicalDocumentsList from "./ClinicalDocumentsList";
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
      <SheetContent container={container} className="clinical-documents-sheet" aria-describedby={undefined}>
        <ClinicalDocumentsPanels key={id} patientId={id} />
      </SheetContent>
    </Sheet>
  );
}

function ClinicalDocumentsPanels({ patientId }: { patientId?: string }) {
  const [selected, setSelected] = useState<ClinicalDocument>();
  const [reading, setReading] = useState(false);
  const selectedButton = useRef<HTMLButtonElement>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const focusAfterChange = useRef<"list" | "viewer" | null>(null);

  useLayoutEffect(() => {
    const target = focusAfterChange.current;
    focusAfterChange.current = null;
    if (target === "list") selectedButton.current?.focus({ preventScroll: true });
    if (target === "viewer") viewer.current?.focus({ preventScroll: true });
  }, [reading, selected]);

  const [documents, setDocuments] = useState<ClinicalDocument[]>();
  const [indexError, setIndexError] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    let active = true;
    getClinicalDocuments(patientId).then(
      (result) => { if (active) setDocuments(result); },
      () => { if (active) setIndexError(true); },
    );
    return () => { active = false; };
  }, [patientId]);

  function selectDocument(document: ClinicalDocument, button: HTMLButtonElement) {
    selectedButton.current = button;
    if (window.matchMedia("(width < 64rem)").matches) focusAfterChange.current = "viewer";
    setSelected(document);
    setReading(true);
  }

  function showList() {
    focusAfterChange.current = "list";
    setReading(false);
  }

  function closeViewer() {
    showList();
    setSelected(undefined);
  }

  return (
    <>
      <section
        aria-label="Listado de documentos"
        className={`clinical-documents-drawer min-h-0 min-w-0 flex-1 flex-col bg-surface ${reading ? "hidden lg:flex" : "flex"}`}
      >
        <header className="shrink-0 border-b border-line bg-surface py-4 pl-4 pr-14">
          <SheetTitle className="text-lg font-semibold text-primary">Documentos clínicos</SheetTitle>
          {documents && (
            <p className="mt-1 text-xs text-content-muted">
              {documents.length} {documents.length === 1 ? "documento" : "documentos"}
            </p>
          )}
          {selected && !reading && (
            <button
              type="button"
              className="btn btn-ghost mt-2 min-h-8 px-3 py-1 lg:hidden"
              onClick={() => {
                focusAfterChange.current = "viewer";
                setReading(true);
              }}
            >
              Volver a lectura
            </button>
          )}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 text-sm">
          {patientId ? (
            <ClinicalDocumentsList documents={documents} indexError={indexError} selected={selected} onSelect={selectDocument} />
          ) : (
            <p>Este registro no tiene un identificador de paciente (nhc).</p>
          )}
        </div>
      </section>
      {selected && (
        <div
          ref={viewer}
          tabIndex={-1}
          role="region"
          aria-label="Lectura del informe"
          data-document-viewer=""
          className={`min-h-0 min-w-0 flex-1 flex-col ${reading ? "flex" : "hidden lg:flex"}`}
        >
          <DocumentViewer key={selected.id} document={selected} onClose={closeViewer} onShowList={showList} />
        </div>
      )}
    </>
  );
}
