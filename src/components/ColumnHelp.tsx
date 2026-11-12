import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleCheck, CircleX, CircleHelp, Info } from "lucide-react";
import type { ColumnInfo } from "../services/columnDictionary";

interface Props {
  info: ColumnInfo;
  evidences?: { info: ColumnInfo; value: string }[];
  status?: "SÍ" | "NO" | "Sin datos";
}

export default function ColumnHelp({ info, evidences, status }: Props) {
  const Icon = status === "SÍ" ? CircleCheck : status === "NO" ? CircleX : status ? CircleHelp : Info;
  const title = status ? info.criterio || info.readable_name : info.readable_name;
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  function cancelClose() {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
  }

  function show() {
    cancelClose();
    // Keep modal tooltips in the dialog's top layer.
    setPortalTarget(buttonRef.current?.closest("dialog") ?? document.body);
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
  }, [open, info, evidences, status]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Información sobre ${title}${status ? `: ${status}` : ""}`}
        aria-describedby={open ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={scheduleClose}
        onFocus={show}
        onBlur={scheduleClose}
        onClick={show}
        className={`column-help-button${status ? ` result-help-${status === "SÍ" ? "yes" : status === "NO" ? "no" : "unknown"}` : ""}`}
      ><Icon size={status ? 20 : 15} /></button>
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
            <strong>{title}</strong>
            <p className="my-2 break-all font-mono text-xs text-slate-500">{info.column_name}</p>
            <p className="text-sm font-normal leading-relaxed">{status ? info.explicacion || info.meaning : info.meaning}</p>
            {status && <p className="mt-2 text-sm">Estado: {status}</p>}
            {!!evidences?.length && (
              <dl className="mt-3 space-y-2 text-sm font-normal">
                {evidences.map(({ info: evidence, value }) => (
                  <div key={evidence.column_name}>
                    <dt className="font-medium">{evidence.readable_name}</dt>
                    <dd className="whitespace-pre-wrap break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>,
        portalTarget ?? document.body,
      )}
    </>
  );
}
