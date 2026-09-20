import { inventorySession, rememberInventory } from "@/game/inventory-session";
import { cn } from "@/lib/cn";
import { useLayoutEffect, useRef, type ReactNode } from "react";

export function InventoryFrame({
  header,
  children,
  sessionId,
}: {
  header: ReactNode;
  children: ReactNode;
  sessionId?: string;
}) {
  const list = useRef<HTMLDivElement>(null);

  // The frame owns the scroller, so it owns putting the player back where they
  // were when they return from World.
  useLayoutEffect(() => {
    const el = list.current;
    if (!el || !sessionId) return;
    const top = inventorySession(sessionId).scrollTop;
    if (top) el.scrollTop = top;
    return () => rememberInventory(sessionId, { scrollTop: el.scrollTop });
  }, [sessionId]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden" data-inventory="1">
      {/* Controls are chrome, not content: they get their own surface so the
          room does not read through the filters. */}
      <div
        className="ms-inv-header shrink-0 space-y-2.5 rounded-[var(--radius-lg)] bg-ink/72 p-2.5 pb-3 backdrop-blur-sm"
        data-inventory-header="1"
      >
        {header}
      </div>
      <div
        ref={list}
        className="ms-inv-list ms-scroll min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain"
        data-inventory-list="1"
      >
        {children}
      </div>
    </div>
  );
}

/**
 * One row, scrolled sideways. Wrapping ten filters onto three rows cost the
 * list most of the screen; the list is the screen.
 */
export function ChipScroller({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("ms-chip-rail flex min-w-0 flex-nowrap gap-2 overflow-x-auto", className)}
      data-inventory-chips="1"
    >
      {children}
    </div>
  );
}

export function ModeToggle({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string; count: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-sm)] border border-line bg-ink/50 p-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          aria-pressed={value === opt.id}
          className={cn(
            "flex min-h-9 items-center justify-center gap-1.5 truncate rounded-[var(--radius-xs)] px-2",
            value === opt.id ? "bg-ember/15 text-ember" : "text-muted",
          )}
        >
          <span className="truncate font-display text-label uppercase tracking-[0.06em]">{opt.label}</span>
          <span className="shrink-0 text-label tabular-nums opacity-70">{opt.count}</span>
        </button>
      ))}
    </div>
  );
}

export function FilterChip({
  active,
  onClick,
  children,
  compact,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border font-display uppercase tracking-[0.11em]",
        compact ? "px-2.5 py-1.5 text-[9px]" : "px-3 py-2 text-[10px]",
        active ? "border-ember bg-ember/15 text-ember" : "border-line bg-ink/60 text-muted",
      )}
    >
      {children}
    </button>
  );
}

export function InventoryRow({
  onOpen,
  children,
  className,
}: {
  onOpen: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-inventory-row="1"
      className={cn("ms-inv-row cursor-pointer", className)}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      {children}
    </div>
  );
}
