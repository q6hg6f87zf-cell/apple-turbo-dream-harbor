import { locationToRegion } from "@/game/field-ops";
import { REGION_STREET } from "@/game/item-art";
import { roomArtFor } from "@/game/rooms";
import type { LocationId } from "@/game/types";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/**
 * The room a fight or a sortie happens in. Focused states used to be a panel on
 * a dimmed screen, which read as an alert rather than a place.
 */
export function EncounterBackdrop({
  locationId,
  tone = "neutral",
}: {
  locationId: LocationId;
  tone?: "neutral" | "danger";
}) {
  const region = locationToRegion(locationId);
  const src = (region && REGION_STREET[region]) || roomArtFor("map");
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden data-encounter-art="1">
      <img src={src} alt="" decoding="async" className="ms-scene-photo absolute inset-0 size-full object-cover" />
      <div
        className={cn(
          "absolute inset-0",
          tone === "danger" ? "ms-encounter-veil-danger" : "ms-encounter-veil",
        )}
      />
    </div>
  );
}

/** One row of committed choices, held against the bottom of the phone. */
export function CommandBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-command-bar="1"
      className={cn(
        "shrink-0 border-t border-line/60 bg-ink/82 px-3 pt-3 backdrop-blur-md",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        className,
      )}
    >
      {children}
    </div>
  );
}
