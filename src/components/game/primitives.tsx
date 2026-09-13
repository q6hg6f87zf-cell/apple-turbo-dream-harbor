import { cn } from "@/lib/cn";
import { sfx } from "@/game/audio";
import type { ClassName, Item, Operative, Rarity, Stats } from "@/game/types";
import {
  Crosshair,
  HeartPulse,
  Music,
  Scale,
  Sparkles,
  Sword,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function MoonCrest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("text-ember", className)} aria-hidden>
      <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M38 12c10 4 16 14 16 24 0 14-12 26-26 26-6 0-12-2-16-6 8 2 18-2 22-10 5-10 4-22 4-34z"
        fill="currentColor"
      />
      <circle cx="44" cy="20" r="2.2" fill="currentColor" />
    </svg>
  );
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Portrait({
  op,
  size = 40,
  className,
}: {
  op: Pick<Operative, "id" | "name" | "cls" | "status">;
  size?: number;
  className?: string;
}) {
  const h = hashStr(op.id + op.name);
  const ox = ((h % 9) - 4) * 1.7;
  const oy = (((h >> 3) % 7) - 3) * 1.3;
  const initials = op.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const tone =
    op.status === "dead"
      ? "text-muted"
      : op.status === "downed"
        ? "text-danger"
        : op.status === "deployed"
          ? "text-ember-bright"
          : "text-ember";
  const ring =
    op.status === "dead"
      ? "shadow-[0_0_0_1px_var(--color-line)]"
      : op.status === "downed"
        ? "shadow-[0_0_0_1px_var(--color-danger)]"
        : op.status === "deployed"
          ? "shadow-[0_0_0_1px_var(--color-ember)]"
          : "shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-ok)_65%,transparent)]";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-visible",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className={cn("flex size-full items-center justify-center overflow-hidden rounded-full bg-ink", ring)}>
        <svg viewBox="0 0 48 48" className={cn("absolute inset-0 size-full", tone)}>
          <circle cx="24" cy="24" r="22" fill="var(--color-raised)" />
          <circle cx={28 + ox} cy={20 + oy} r="13" fill="currentColor" opacity="0.88" />
          <circle cx={20 + ox * 0.35} cy={22 + oy * 0.35} r="11" fill="var(--color-ink)" />
        </svg>
        <span
          className="relative z-[1] font-display tracking-wider text-paper"
          style={{ fontSize: Math.max(10, size * 0.28) }}
        >
          {initials}
        </span>
      </span>
      <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-surface text-ember shadow-[var(--shadow-border)]">
        <ClassGlyph cls={op.cls} className="size-2.5" />
      </span>
    </span>
  );
}

export function FloatNum({
  n,
  kind = "dmg",
  tick,
}: {
  n: number;
  kind?: "dmg" | "heal" | "coin";
  tick: number;
}) {
  if (!n) return null;
  const tone = kind === "heal" || (kind === "coin" && n > 0) ? "text-ok" : "text-danger";
  const sign = kind === "dmg" ? "−" : "+";
  return (
    <span
      key={tick}
      className={cn(
        "ms-dmg pointer-events-none absolute left-1/2 top-1 z-10 font-display text-xl tabular-nums",
        tone,
      )}
    >
      {sign}
      {Math.abs(n)}
    </span>
  );
}

export function ClassGlyph({
  cls,
  className,
}: {
  cls: ClassName;
  className?: string;
}) {
  const I = {
    Warrior: Sword,
    Wizard: Sparkles,
    Rogue: Crosshair,
    Healer: HeartPulse,
    Merchant: Scale,
    Bard: Music,
  }[cls];
  return <I className={cn("size-4", className)} />;
}

export function HpBar({
  hp,
  max,
  className,
}: {
  hp: number;
  max: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (hp / Math.max(1, max)) * 100));
  const tone = pct > 60 ? "bg-ok" : pct > 30 ? "bg-ember" : "bg-danger";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-ink", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-300 ease-out", tone)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function StatGrid({ stats, primary }: { stats: Stats; primary?: keyof Stats }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {(Object.keys(stats) as (keyof Stats)[]).map((k) => (
        <div
          key={k}
          className={cn(
            "rounded-[var(--radius-xs)] bg-ink/60 px-1 py-1.5 text-center",
            primary === k && "shadow-[var(--shadow-border-hover)]",
          )}
        >
          <div className="font-display text-[9px] tracking-wider text-muted">{k}</div>
          <div className="font-display text-sm tabular-nums text-paper">{stats[k]}</div>
        </div>
      ))}
    </div>
  );
}

export function RarityMark({ rarity }: { rarity: Rarity }) {
  const map: Record<Rarity, string> = {
    Common: "text-muted",
    Uncommon: "text-ok",
    Rare: "text-moon",
    Legendary: "text-ember",
    Mythic: "text-void",
    Cursed: "text-danger",
  };
  return (
    <span className={cn("font-display text-[10px] uppercase tracking-[0.16em]", map[rarity])}>
      {rarity}
    </span>
  );
}

export function ItemLine({ item }: { item: Item }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <div className="truncate text-sm text-paper">
          {item.name}
          {item.equipped ? (
            <span className="ml-2 text-[10px] uppercase tracking-wider text-ember">equipped</span>
          ) : null}
        </div>
        <div className="text-xs text-muted">
          {item.kind} · {item.condition}
          {item.damage ? ` · ${item.damage}` : ""}
          {item.defense ? ` · +${item.defense} DEF` : ""}
        </div>
      </div>
      <RarityMark rarity={item.rarity} />
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)] md:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 font-display text-[10px] uppercase tracking-[0.22em] text-ember">
      {children}
    </div>
  );
}

export { Dice20 as DiceFace } from "./dice";

export function StatusPill({ status }: { status: Operative["status"] }) {
  const tone =
    status === "idle"
      ? "text-ok"
      : status === "deployed"
        ? "text-ember"
        : status === "downed"
          ? "text-danger"
          : status === "dead"
            ? "text-muted"
            : "text-moon";
  return (
    <span className={cn("font-display text-[10px] uppercase tracking-[0.16em]", tone)}>
      {status}
    </span>
  );
}

export function OpChip({
  op,
  active,
  onClick,
}: {
  op: Operative;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        sfx.click();
        onClick?.();
      }}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-[box-shadow,background-color] duration-150",
        active
          ? "bg-ember/10 shadow-[var(--shadow-border-hover)]"
          : "bg-raised shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
        op.status === "dead" && "opacity-50",
      )}
    >
      <Portrait op={op} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate font-display text-sm">{op.name}</div>
          <StatusPill status={op.status} />
        </div>
        <div className="truncate text-[11px] text-muted">
          {op.cls} · {op.race}
        </div>
        <HpBar hp={op.hp} max={op.maxHp} className="mt-1" />
      </div>
    </button>
  );
}

export function CapMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("inline-block size-3.5 shrink-0", className)} aria-hidden>
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M8 1.4l.7 1.6M8 14.6l.7-1.6M1.4 8l1.6.7M14.6 8l-1.6.7M3.1 3.1l1.3 1.1M12.9 12.9l-1.3-1.1M3.1 12.9l1.3-1.1M12.9 3.1l-1.3 1.1"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Coin({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <CapMark className="text-ember" />
      {n.toLocaleString()}
    </span>
  );
}

export function LiveCoin({ n, className }: { n: number; className?: string }) {
  const prev = useRef(n);
  const [delta, setDelta] = useState(0);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    const d = n - prev.current;
    prev.current = n;
    if (!d) return;
    setDelta(d);
    setBump((b) => b + 1);
    const t = window.setTimeout(() => setDelta(0), 700);
    return () => window.clearTimeout(t);
  }, [n]);
  return (
    <span className={cn("relative inline-flex items-baseline gap-1 tabular-nums", className)}>
      <CapMark className="translate-y-[1px] text-ember" />
      <span key={bump} className="inline-block animate-[ms-coin_220ms_var(--ease-smooth-out)]">
        {n.toLocaleString()}
      </span>
      {delta ? (
        <span
          className={cn(
            "ms-float pointer-events-none absolute -top-3 right-0 font-display text-[10px]",
            delta > 0 ? "text-ok" : "text-danger",
          )}
        >
          {delta > 0 ? "+" : ""}
          {delta}
        </span>
      ) : null}
    </span>
  );
}

export function LevelPips({ level, max = 3 }: { level: number; max?: number }) {
  return (
    <span className="inline-flex gap-1" aria-label={`Level ${level} of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "size-1.5 rounded-full",
            i < level ? "bg-ember" : "bg-line",
          )}
        />
      ))}
    </span>
  );
}

export function Chip({
  active,
  children,
  onClick,
  disabled,
  className,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        sfx.click();
        onClick?.();
      }}
      className={cn(
        "min-h-11 rounded-full px-3.5 font-display text-[10px] uppercase tracking-[0.16em] transition-colors duration-150 disabled:opacity-30",
        active ? "bg-ember text-ink" : "bg-ink text-muted hover:text-paper",
        className,
      )}
    >
      {children}
    </button>
  );
}
