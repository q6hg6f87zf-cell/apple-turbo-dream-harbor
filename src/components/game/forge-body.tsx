import { Button } from "@/components/ui/button";
import { CLASS_BASE, PRIMARY_STAT } from "@/game/data";
import { className } from "@/game/presentation";
import { bandForRoll, scoreFromDice, STAT_COPY, STAT_ORDER, tyroneOnStat } from "@/game/stats-copy";
import type { ClassName, StatKey, Stats } from "@/game/types";
import { cn } from "@/lib/cn";
import { Dice20 } from "./dice";
import { Panel, SectionLabel } from "./primitives";

export function ForgeBody({
  cls,
  raceStats,
  rolls,
  spinKey,
  spinAll,
  bodyI,
  setBodyI,
  onRoll,
  onRollAll,
}: {
  cls: ClassName;
  raceStats: Stats;
  rolls: Record<string, number>;
  spinKey: string | null;
  spinAll: boolean;
  bodyI: number;
  setBodyI: (n: number) => void;
  onRoll: (k: string) => void;
  onRollAll: () => void;
}) {
  const recap = bodyI >= STAT_ORDER.length;
  const current = recap ? null : STAT_ORDER[bodyI]!;
  const primary = PRIMARY_STAT[cls];

  return (
    <div data-forge-body="1">
    <Panel className="bg-raised">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel>{recap ? "Body · recap" : `Body · ${bodyI + 1} of 7`}</SectionLabel>
        <Button size="sm" variant="ghost" onClick={onRollAll}>
          Roll all
        </Button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-moon">
        A 10 is ranch average for this class. Every two points off 10 shifts the score by 1. Blood still adds its own
        number. {className(cls)} lives on {STAT_COPY[primary].name}.
      </p>

      {current ? (
        <StatCeremony
          k={current}
          cls={cls}
          raceBonus={raceStats[current] ?? 0}
          roll={rolls[current]}
          spinning={spinAll || spinKey === current}
          onRoll={() => onRoll(current)}
        />
      ) : (
        <div className="mt-3 space-y-2">
          {STAT_ORDER.map((k) => (
            <StatRow
              key={k}
              k={k}
              cls={cls}
              raceBonus={raceStats[k] ?? 0}
              roll={rolls[k]}
              spinning={spinAll || spinKey === k}
              onRoll={() => onRoll(k)}
            />
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {recap ? (
          <Button variant="quiet" className="flex-1" onClick={() => setBodyI(0)}>
            Walk them again
          </Button>
        ) : (
          <>
            <Button variant="quiet" className="flex-1" disabled={bodyI === 0} onClick={() => setBodyI(Math.max(0, bodyI - 1))}>
              Back
            </Button>
            <Button
              variant="ember"
              className="flex-1"
              disabled={typeof rolls[current!] !== "number"}
              onClick={() => setBodyI(bodyI + 1)}
            >
              {bodyI >= STAT_ORDER.length - 1 ? "See the recap" : "Next stat"}
            </Button>
          </>
        )}
      </div>
    </Panel>
    </div>
  );
}

function StatCeremony({
  k,
  cls,
  raceBonus,
  roll,
  spinning,
  onRoll,
}: {
  k: StatKey;
  cls: ClassName;
  raceBonus: number;
  roll?: number;
  spinning: boolean;
  onRoll: () => void;
}) {
  const copy = STAT_COPY[k];
  const isPrimary = PRIMARY_STAT[cls] === k;
  const floor = CLASS_BASE[cls][k];
  const band = typeof roll === "number" ? bandForRoll(roll) : null;
  const score = typeof roll === "number" ? scoreFromDice(floor, roll) + raceBonus : null;
  return (
    <div className="mt-3 rounded-[var(--radius-md)] bg-ink px-3 py-3 shadow-[var(--shadow-border-hover)]" data-forge-stat={k}>
      <p className="font-display text-[10px] uppercase tracking-[0.2em] text-ember">
        {k} · {copy.name}
        {isPrimary ? " · primary" : ""}
      </p>
      <p className="mt-1 font-display text-lg text-paper">{copy.short}</p>
      <p className="mt-2 text-sm leading-relaxed text-paper">{copy.does}</p>
      <p className="mt-2 text-xs leading-relaxed text-moon">{copy.checks}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        Class floor {floor}
        {raceBonus ? ` · blood ${raceBonus >= 0 ? "+" : ""}${raceBonus}` : ""}. Tap the die. 10 is average. 1 is cursed. 20 is once in a generation.
      </p>
      <button type="button" onClick={onRoll} className="mx-auto mt-4 flex flex-col items-center gap-2">
        <Dice20 value={roll} spinning={spinning} size={92} />
        <span className="font-display text-[10px] uppercase tracking-[0.18em] text-muted">
          {typeof roll === "number" ? `d20 ${roll}` : "Tap to roll"}
        </span>
      </button>
      {band && typeof roll === "number" && score != null ? (
        <div className="mt-3 rounded-[var(--radius-sm)] bg-raised px-3 py-3">
          <p className="font-display text-[10px] uppercase tracking-[0.16em] text-ember">
            {band.label} · score {score}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-paper">{tyroneOnStat(k, roll, isPrimary)}</p>
        </div>
      ) : (
        <p className="mt-3 text-center text-xs text-muted">Tyrone will tell you what the number actually does.</p>
      )}
    </div>
  );
}

function StatRow({
  k,
  cls,
  raceBonus,
  roll,
  spinning,
  onRoll,
}: {
  k: StatKey;
  cls: ClassName;
  raceBonus: number;
  roll?: number;
  spinning: boolean;
  onRoll: () => void;
}) {
  const copy = STAT_COPY[k];
  const isPrimary = PRIMARY_STAT[cls] === k;
  const floor = CLASS_BASE[cls][k];
  const band = typeof roll === "number" ? bandForRoll(roll) : null;
  const score = typeof roll === "number" ? scoreFromDice(floor, roll) + raceBonus : null;
  return (
    <button
      type="button"
      data-forge-stat={k}
      onClick={onRoll}
      className={cn(
        "w-full min-h-[5.5rem] rounded-[var(--radius-md)] bg-ink px-3 py-2.5 text-left shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
        isPrimary && "shadow-[var(--shadow-border-hover)]",
      )}
    >
      <span className="flex items-start gap-3">
        <Dice20 value={roll} spinning={spinning} size={52} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-display text-[10px] uppercase tracking-wider text-ember">
              {k} · {copy.name}
              {isPrimary ? " · primary" : ""}
            </span>
            <span className="font-display text-sm tabular-nums text-paper">{score ?? "—"}</span>
          </span>
          <span className="mt-0.5 block text-xs text-muted">{copy.short}</span>
          <span className="mt-1 block text-xs leading-relaxed text-paper">{copy.does}</span>
          {band && typeof roll === "number" ? (
            <span className="mt-1 block text-[11px] leading-relaxed text-ember">
              d20 {roll} · {band.label}. {band.meaning}
            </span>
          ) : (
            <span className="mt-1 block text-[11px] text-muted">Tap the die. 10 is average.</span>
          )}
        </span>
      </span>
    </button>
  );
}
