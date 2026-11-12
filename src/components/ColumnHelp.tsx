import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleCheck, CircleX, CircleHelp, Info } from "lucide-react";
import type { ColumnInfo } from "../services/columnDictionary";

interface Props {
  info: ColumnInfo;
  evidences?: { info: ColumnInfo; value: string }[];
  status?: "yes" | "no" | "unknown";
  variant?: "default" | "dialog";
}

export default function ColumnHelp({ info, evidences, status, variant = "default" }: Props) {
  const Icon = status === "yes" ? CircleCheck : status === "no" ? CircleX : status ? CircleHelp : Info;
  const title = variant === "dialog" ? info.criterio?.trim() || info.readable_name : info.readable_name;
  const explanation = info.explicacion?.trim();
  const meaning = info.meaning.trim();
  const statusLabel = status === "yes" ? "SÍ" : status === "no" ? "NO" : "Sin datos";
  const showDefinition = meaning && !explanation;
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
  }, [open, info, evidences, status, variant]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Información sobre ${title}${status ? `: ${statusLabel}` : ""}`}
        aria-describedby={open ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={scheduleClose}
        onFocus={show}
        onBlur={scheduleClose}
        onClick={show}
        className={`column-help-button${status ? ` result-help-${status}` : ""}`}
      ><Icon size={status ? 16 : 15} /></button>
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
            {variant === "dialog" ? (
              <>
                {explanation && <p className="mt-2 text-sm font-normal leading-relaxed">{explanation}</p>}
                {showDefinition && (
                  <div className="mt-3 text-sm font-normal leading-relaxed">
                    <p className="font-medium">Definición del dato</p>
                    <p>{meaning}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="my-2 break-all font-mono text-xs text-content-subtle">{info.column_name}</p>
                <p className="text-sm font-normal leading-relaxed">{info.meaning}</p>
              </>
            )}
            {!!evidences?.length && (
              <div className="mt-3 text-sm font-normal">
                <p className="mb-2 font-medium">Evidencias</p>
                <dl className="space-y-2">
                {evidences.map(({ info: evidence, value }) => (
                  <div key={evidence.column_name}>
                    <dt className="font-medium">{evidence.readable_name}</dt>
                    <dd className="whitespace-pre-wrap break-words">{value}</dd>
                  </div>
                ))}
                </dl>
              </div>
            )}
          </div>
        </div>,
        portalTarget ?? document.body,
      )}
    </>
  );
}
