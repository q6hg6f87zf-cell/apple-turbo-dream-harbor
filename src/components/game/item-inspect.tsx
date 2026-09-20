import { X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "./use-dialog-focus";

export function ItemInspectShell({
  onClose,
  hero,
  heroSrc,
  eyebrow,
  title,
  badges,
  children,
  actions,
}: {
  onClose: () => void;
  hero: ReactNode;
  heroSrc?: string | null;
  eyebrow?: ReactNode;
  title: ReactNode;
  badges?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const [zoom, setZoom] = useState(false);
  const focus = useDialogFocus<HTMLDivElement>();

  // Rendered out of the inventory list on purpose: inside it, the sheet was a
  // "fixed" element within a transformed scroll container, and its commit
  // buttons inherited the list's tap suppression.
  const sheet = (
    <div
      className="fixed inset-0 z-[70] overflow-hidden bg-ink md:bg-ink/85 md:p-6"
      onClick={onClose}
      data-item-inspect="1"
      role="presentation"
    >
      <div
        ref={focus}
        className="relative mx-auto flex h-dvh min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden bg-surface md:h-auto md:max-h-[min(92dvh,52rem)] md:max-w-lg md:rounded-[var(--radius-xl)] md:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="relative min-w-0 shrink-0 overflow-hidden bg-ink">
          <button
            type="button"
            className="block w-full min-w-0 max-w-full text-left"
            onClick={() => setZoom(true)}
            aria-label="View whole item"
            data-item-zoom-open="1"
          >
            {hero}
          </button>
          <p className="pointer-events-none absolute bottom-2 left-3 font-display text-[9px] uppercase tracking-[0.16em] text-moon">
            Tap photo · whole item
          </p>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-[1] flex size-11 items-center justify-center rounded-full bg-ink/80 text-paper shadow-[var(--shadow-border)]"
            aria-label="Close item"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-3 ms-scroll">
          {eyebrow ? <div className="mb-1 min-w-0 break-words">{eyebrow}</div> : null}
          <div className="min-w-0 break-words">{title}</div>
          {badges ? <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">{badges}</div> : null}
          <div className="mt-3 min-w-0 max-w-full break-words [overflow-wrap:anywhere]">{children}</div>
        </div>
        {actions ? (
          <div className="min-w-0 shrink-0 space-y-2 overflow-x-hidden border-t border-line bg-surface px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            {actions}
          </div>
        ) : null}

        {zoom ? (
          <div
            className="absolute inset-0 z-[80] flex flex-col overflow-hidden bg-ink"
            data-item-zoom="1"
            onClick={(e) => {
              e.stopPropagation();
              setZoom(false);
            }}
            role="presentation"
          >
            <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden p-4">
              {heroSrc ? (
                <img
                  src={heroSrc}
                  alt=""
                  data-item-zoom-img="1"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                hero
              )}
            </div>
            <p className="shrink-0 pb-[max(16px,env(safe-area-inset-bottom))] text-center font-display text-[10px] uppercase tracking-[0.18em] text-muted">
              Tap to close
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}
