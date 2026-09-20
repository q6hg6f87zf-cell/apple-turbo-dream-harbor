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
      <div className="shrink-0 space-y-3 pb-3" data-inventory-header="1">
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

export function ChipScroller({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-wrap gap-2", className)} data-inventory-chips="1">
      {children}
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
