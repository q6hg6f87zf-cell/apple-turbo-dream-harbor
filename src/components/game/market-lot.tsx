import { gradeFromLoad, gradeLabel } from "@/game/ammo-matrix";
import { regionById } from "@/game/data";
import { isAmmoItem } from "@/game/inventory-filters";
import { classLabel } from "@/game/presentation";
import type { GameState, MarketLot } from "@/game/types";
import { cn } from "@/lib/cn";
import { Coin, RarityMark } from "./primitives";
import { ItemThumb } from "./item-thumb";
import { Button } from "@/components/ui/button";

export type LotFit = { text: string; tone: "good" | "warn" | "soft" | "plain" };

/**
 * The one line that decides whether a purchase is a mistake.
 *
 * Ammo nobody can chamber and gear nobody can carry are the two ways to waste a
 * plate here, so both get answered on the row rather than two taps deep.
 */
export function lotFit(state: GameState, lot: MarketLot): LotFit {
  const roster = state.operatives.filter((op) => op.status !== "dead");

  if (isAmmoItem(lot.kind, lot.ammoType)) {
    const holder = roster.find((op) =>
      op.inventory.some((item) => item.kind === "weapon" && item.ammoType === lot.ammoType),
    );
    if (holder) return { text: `Feeds ${holder.name}`, tone: "good" };
    return { text: "No weapon takes this", tone: "warn" };
  }

  if (lot.classHint) {
    const match = roster.find((op) => op.cls === lot.classHint);
    if (match) return { text: `Built for ${match.name}`, tone: "good" };
    // Not a mistake, just not for anyone yet — a class you have not forged is
    // still a class you might. Ammo nobody can chamber is the real waste.
    return { text: `No ${classLabel(lot.classHint)} on the roster`, tone: "soft" };
  }

  if (lot.slot) return { text: "Universal kit", tone: "plain" };
  return { text: "", tone: "plain" };
}

/** The short mechanical facts a player needs before paying. */
export function lotSpecs(lot: MarketLot): string[] {
  const out: string[] = [];
  if (lot.ammoType) out.push(lot.ammoType);
  if (isAmmoItem(lot.kind, lot.ammoType)) {
    out.push(gradeLabel(lot.ammoGrade ?? gradeFromLoad(lot.name)));
    if (lot.ammoCount) out.push(`${lot.ammoCount} rounds`);
  } else {
    if (lot.weaponFamily) out.push(lot.weaponFamily);
    else if (lot.slot) out.push(lot.slot);
    if (lot.damage) out.push(lot.damage);
    if (lot.defense) out.push(`+${lot.defense} DEF`);
    if (lot.rangeBand) out.push(lot.rangeBand);
  }
  return out;
}

export const FIT_TONE: Record<LotFit["tone"], string> = {
  good: "text-ok",
  warn: "text-danger",
  soft: "text-moon",
  plain: "text-muted",
};

export function MarketLotCard({
  lot,
  price,
  fit,
  affordable,
  onBuy,
  onInspect,
}: {
  lot: MarketLot;
  price: number;
  fit: LotFit;
  affordable: boolean;
  onBuy: () => void;
  onInspect: () => void;
}) {
  const sold = lot.qty <= 0;
  const specs = lotSpecs(lot);

  return (
    <div
      data-lot={lot.id}
      className="flex gap-3 rounded-[var(--radius-lg)] border border-line/70 bg-raised/85 p-3"
    >
      <button
        type="button"
        onClick={onInspect}
        className="shrink-0"
        aria-label={`Inspect ${lot.name}`}
        data-lot-inspect={lot.id}
      >
        <ItemThumb
          kind={lot.kind}
          name={lot.name}
          ammoType={lot.ammoType}
          weaponFamily={lot.weaponFamily}
          size="lg"
          className={cn(sold && "opacity-40")}
        />
      </button>

      <div className="min-w-0 flex-1">
        <button type="button" onClick={onInspect} className="block w-full min-w-0 text-left">
          <span className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 truncate font-display text-body text-paper">{lot.name}</span>
            <RarityMark rarity={lot.rarity} />
          </span>
          <span className="mt-0.5 block truncate text-label text-muted">
            {specs.length ? specs.join(" · ") : regionById(lot.sourceRegion).name}
          </span>
        </button>

        {fit.text ? <p className={cn("mt-1 text-label", FIT_TONE[fit.tone])}>{fit.text}</p> : null}

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className={cn("text-label", sold ? "text-danger" : "text-moon")}>
            {sold ? "Sold out until dawn" : `${lot.qty} in crate`}
          </span>
          <Button size="sm" variant="ember" disabled={sold || !affordable} onClick={onBuy}>
            {sold ? "Sold" : <Coin n={price} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
