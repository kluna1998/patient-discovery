import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import type { ColumnInfo } from "../services/columnDictionary";

export default function ColumnHelp({ info }: { info: ColumnInfo }) {
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  function cancelClose() {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
  }

  function show() {
    cancelClose();
    setOpen(true);
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  useEffect(() => () => cancelClose(), []);

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const button = buttonRef.current?.getBoundingClientRect();
      const tooltip = tooltipRef.current?.getBoundingClientRect();
      if (!button || !tooltip) return;
      setPosition({
        left: Math.max(8, Math.min(button.left, window.innerWidth - tooltip.width - 8)),
        top: button.bottom + tooltip.height <= window.innerHeight - 8
          ? button.bottom
          : Math.max(8, button.top - tooltip.height),
      });
    }
    function dismiss(event: KeyboardEvent) {
      if (event.key === "Escape") {
        cancelClose();
        setOpen(false);
      }
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    window.addEventListener("keydown", dismiss);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("keydown", dismiss);
    };
  }, [open, info]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Información sobre ${info.readable_name}`}
        aria-describedby={open ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={scheduleClose}
        onFocus={show}
        onBlur={scheduleClose}
        onClick={show}
        className="column-help-button"
      ><Info size={15} /></button>
      {open && createPortal(
        <div
          ref={tooltipRef}
          id={id}
          role="tooltip"
          className="column-help-tooltip"
          style={position}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="column-help-content">
            <strong>{info.readable_name}</strong>
            <p className="my-2 break-all font-mono text-xs text-slate-500">{info.column_name}</p>
            <p className="text-sm font-normal leading-relaxed">{info.meaning}</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
