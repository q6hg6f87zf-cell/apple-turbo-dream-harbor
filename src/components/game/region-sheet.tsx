import { locationToRegion } from "@/game/field-ops";
import { REGION_STREET } from "@/game/item-art";
import { roomArtFor } from "@/game/rooms";
import type { LocationId } from "@/game/types";
import { ChevronLeft } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CommandBar } from "./encounter-scene";
import { useDialogFocus } from "./use-dialog-focus";

/**
 * Briefing a sortie, over the region chooser rather than below it.
 *
 * World used to stack five decisions — site, kind, approach, party, deploy — on
 * the same scroll as the chooser, so picking a region and reading its intel were
 * the same surface. This is a local sheet, not a Screen: the hub underneath
 * keeps its state, and Back is honest because there is only one way in.
 */
export function RegionSheet({
  title,
  locationId,
  art,
  onClose,
  command,
  children,
}: {
  title: string;
  locationId: LocationId;
  art?: string | null;
  onClose: () => void;
  command: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.repeat) return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const focus = useDialogFocus<HTMLDivElement>();
  const region = locationToRegion(locationId);
  const plate = art || (region && REGION_STREET[region]) || roomArtFor("map");

  const sheet = (
    <div
      ref={focus}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} briefing`}
      className="fixed inset-0 z-[60] flex flex-col bg-ink"
      data-region-sheet={locationId}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <img src={plate} alt="" decoding="async" className="ms-scene-photo absolute inset-0 size-full object-cover" />
        <div className="ms-encounter-veil absolute inset-0" />
      </div>

      <header
        className="relative z-[1] flex shrink-0 items-center gap-2 border-b border-line/50 bg-ink/55 px-2 pb-1 backdrop-blur-md md:px-4"
        style={{ paddingTop: "max(0.25rem, env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          data-region-back="1"
          onClick={onClose}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center gap-1 rounded-[var(--radius-sm)] px-2 text-paper"
          aria-label="Back to regions"
        >
          <ChevronLeft className="size-5" />
          <span className="font-display text-label uppercase tracking-[0.12em]">Back</span>
        </button>
        <h2 className="min-w-0 flex-1 truncate text-center font-display text-body text-paper">{title}</h2>
        <span className="w-11 shrink-0" aria-hidden />
      </header>

      <div className="ms-scroll relative z-[1] min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">{children}</div>

      <div className="relative z-[1]">
        <CommandBar>{command}</CommandBar>
      </div>
    </div>
  );

  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}
