import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { CircleCheck, TriangleAlert, CircleHelp, Info } from "lucide-react";
import type { ColumnInfo } from "../services/columnDictionary";

interface Props {
  info: ColumnInfo;
  evidences?: { info: ColumnInfo; value: string; action?: ReactNode }[];
  status?: "yes" | "no" | "unknown";
  variant?: "default" | "dialog";
  documentsOpen?: boolean;
}

export default function ColumnHelp({ info, evidences, status, variant = "default", documentsOpen }: Props) {
  const interactive = variant === "dialog";
  const Icon = status === "yes" ? CircleCheck : status === "no" ? TriangleAlert : status ? CircleHelp : Info;
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

  useEffect(() => {
    if (!interactive || !open || documentsOpen) return;
    function dismissOutside(event: Event) {
      if (!(event.target instanceof Node) || buttonRef.current?.contains(event.target) ||
          tooltipRef.current?.contains(event.target) || (event.target instanceof Element &&
          event.target.closest('[data-slot="sheet-content"], [data-slot="sheet-overlay"]'))) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("focusin", dismissOutside);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("focusin", dismissOutside);
    };
  }, [interactive, open, documentsOpen]);

  useLayoutEffect(() => {
    if (interactive && open) tooltipRef.current?.focus({ preventScroll: true });
  }, [interactive, open]);

  function dismissPopover(event: ReactKeyboardEvent) {
    if (event.key !== "Escape" || !open || documentsOpen) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
    buttonRef.current?.focus({ preventScroll: true });
  }

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
    if (!interactive) window.addEventListener("keydown", dismiss);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("keydown", dismiss);
    };
  }, [open, info, evidences, status, interactive]);

  const help = open && (
    <div
      ref={tooltipRef}
      id={id}
      role={interactive ? "dialog" : "tooltip"}
      aria-labelledby={interactive ? `${id}-title` : undefined}
      tabIndex={interactive ? -1 : undefined}
      className="column-help-tooltip"
      style={position}
      onMouseEnter={interactive ? undefined : cancelClose}
      onMouseLeave={interactive ? undefined : scheduleClose}
      onKeyDown={interactive ? dismissPopover : undefined}
    >
      <div className="column-help-content">
        <strong id={`${id}-title`}>{title}</strong>
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
              {evidences.map(({ info: evidence, value, action }) => (
                <div key={evidence.column_name}>
                  <dt className="font-medium">{evidence.readable_name}</dt>
                  <dd className="flex flex-wrap items-center gap-x-2">
                    <span className="whitespace-pre-wrap break-words">{value}</span>
                    {action}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Información sobre ${title}${status ? `: ${statusLabel}` : ""}`}
        aria-describedby={open && !interactive ? id : undefined}
        aria-haspopup={interactive ? "dialog" : undefined}
        aria-expanded={interactive ? open : undefined}
        aria-controls={interactive && open ? id : undefined}
        onMouseEnter={interactive ? undefined : show}
        onMouseLeave={interactive ? undefined : scheduleClose}
        onFocus={interactive ? undefined : show}
        onBlur={interactive ? undefined : scheduleClose}
        onClick={interactive ? () => setOpen(!open) : show}
        onKeyDown={interactive ? dismissPopover : undefined}
        className={`column-help-button${status ? ` result-help-${status}` : ""}`}
      ><Icon size={status ? 16 : 15} /></button>
      {interactive ? help : help && createPortal(help, portalTarget ?? document.body)}
    </>
  );
}
