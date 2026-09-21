import { locationToRegion } from "@/game/field-ops";
import { parseEventLine, type EventChip } from "@/game/event-theater";
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

export function EventChips({ chips }: { chips: EventChip[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span
          key={`${chip.label}-${chip.value}`}
          className={cn(
            "rounded-full bg-ink/70 px-2 py-1 font-display text-[10px] uppercase tracking-[0.14em]",
            chip.warn ? "text-ember" : "text-muted",
          )}
        >
          {chip.label} {chip.value}
        </span>
      ))}
    </div>
  );
}

export function EventLog({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <div className={cn("ms-scroll min-h-0 flex-1 overflow-y-auto px-4", className)} aria-live="polite">
      <div className="flex min-h-full flex-col justify-end space-y-2 py-2">
        {lines.map((line, i, all) => {
          const parsed = parseEventLine(line);
          const last = i === all.length - 1;
          return (
            <p key={`${i}-${line.slice(0, 24)}`} className={last ? "text-paper" : "text-muted"}>
              {parsed.speaker ? (
                <>
                  <span className="font-display text-[10px] uppercase tracking-[0.16em] text-ember">
                    {parsed.speaker}
                  </span>
                  <span className="mt-0.5 block text-secondary leading-relaxed">{parsed.text}</span>
                </>
              ) : (
                <span className="text-secondary leading-relaxed">{parsed.text}</span>
              )}
            </p>
          );
        })}
      </div>
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
