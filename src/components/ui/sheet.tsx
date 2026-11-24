import type { ComponentProps } from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetTitle = SheetPrimitive.Title;

function SheetContent({
  container,
  children,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & { container?: HTMLElement | null }) {
  return (
    <SheetPrimitive.Portal container={container}>
      <SheetPrimitive.Overlay data-slot="sheet-overlay" className="fixed inset-0 z-50" />
      <SheetPrimitive.Content
        {...props}
        data-slot="sheet-content"
        className="fixed inset-y-0 right-0 z-50 flex w-3/4 max-w-sm flex-col border-l border-line bg-surface text-content shadow-lg"
      >
        {children}
        <SheetPrimitive.Close className="btn absolute right-3 top-3 min-h-8 p-2" aria-label="Cerrar documentos">
          <X size={16} />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export { Sheet, SheetContent, SheetTitle, SheetTrigger };
