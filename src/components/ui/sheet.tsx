import type { ComponentProps } from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetTitle = SheetPrimitive.Title;

function SheetContent({
  container,
  children,
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & { container?: HTMLElement | null }) {
  return (
    <SheetPrimitive.Portal container={container}>
      <SheetPrimitive.Overlay data-slot="sheet-overlay" className="fixed inset-0 z-50" />
      <SheetPrimitive.Content
        {...props}
        data-slot="sheet-content"
        className={`fixed inset-y-0 right-0 z-50 flex w-3/4 max-w-sm border-l border-line bg-surface text-content shadow-lg ${className ?? ""}`}
      >
        {children}
        <SheetPrimitive.Close className="btn btn-ghost absolute right-4 top-4 size-8 min-h-8 p-0" aria-label="Cerrar documentos">
          <X size={16} aria-hidden="true" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export { Sheet, SheetContent, SheetTitle, SheetTrigger };
