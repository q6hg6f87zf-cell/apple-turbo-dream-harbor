import type { AmmoGrade, Condition, Item, Rarity, StatKey } from "./types";

export const AMMO_GRADES: AmmoGrade[] = ["surplus", "ball", "plus", "match", "special"];

export const AMMO_GRADE_META: Record<AmmoGrade, { label: string; rank: number; blurb: string }> = {
  surplus: { label: "Surplus", rank: 0, blurb: "Mixed lot. Dents, moisture, whoever stacked it last." },
  ball: { label: "Ball", rank: 1, blurb: "Factory FMJ. Honest. Does what the stamp says." },
  plus: { label: "Plus", rank: 2, blurb: "Soft point, hollow, hot, tracer. Hits harder if the barrel can hold it." },
  match: { label: "Match", rank: 3, blurb: "Tight lots. Accuracy, if the rifle is true." },
  special: { label: "Special", rank: 4, blurb: "AP, bonded, partition, pulse. Needs a rifle that can stabilize it." },
};

const RARITY_Q: Record<Rarity, number> = {
  Common: 0.18,
  Uncommon: 0.36,
  Rare: 0.55,
  Legendary: 0.78,
  Mythic: 0.94,
  Cursed: 0.62,
};

const COND_Q: Record<Condition, number> = {
  Pristine: 1,
  Worn: 0.72,
  Damaged: 0.42,
  Broken: 0.08,
};

const RARITY_DICE: Record<Rarity, number> = {
  Common: 0,
  Uncommon: 1,
  Rare: 1,
  Legendary: 2,
  Mythic: 3,
  Cursed: 1,
};

export type AmmoCouple = {
  efficiency: number;
  accuracy: number;
  damage: number;
  ap: number;
  wasted: number;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function gunQuality(item: Pick<Item, "rarity" | "condition">): number {
  return clamp01(RARITY_Q[item.rarity] * 0.58 + COND_Q[item.condition] * 0.42);
}

export function ammoQuality(grade: AmmoGrade): number {
  return AMMO_GRADE_META[grade].rank / 4;
}

export function gradeFromLoad(name: string | undefined): AmmoGrade {
  const n = name ?? "";
  if (/\bAP\b|Bonded|Partition|Overcharged|Pulse|Slug|Capacitor/i.test(n)) return "special";
  if (/Match|Focusing/i.test(n)) return "match";
  if (/Soft Point|Hollow|Hot|Tracer|Incendiary/i.test(n)) return "plus";
  if (/surplus/i.test(n)) return "surplus";
  if (/FMJ|^Ball$|Box$/i.test(n) || !n) return "ball";
  return "ball";
}

/**
 * High ammo cannot outrun a cheap gun. Low ammo still hurts a good rifle, but not as badly
 * as the reverse. Matching quality is where the returns live.
 */
export function coupleAmmo(gunQ: number, ammoQ: number, box: { ap?: number; damage?: number; accuracy?: number } = {}): AmmoCouple {
  const g = clamp01(gunQ);
  const a = clamp01(ammoQ);
  const usable = Math.min(a, g + 0.12);
  const efficiency = g * (0.18 + 0.82 * usable);
  const wasted = Math.max(0, a - usable);
  const accCap = box.accuracy ?? 4;
  const dmgCap = box.damage ?? 3;
  const apCap = box.ap ?? 0;
  return {
    efficiency,
    accuracy: Math.round(-1 + efficiency * (2 + accCap)),
    damage: Math.round(-1 + efficiency * (1 + dmgCap)),
    ap: apCap <= 0 ? 0 : Math.max(0, Math.round(apCap * (0.35 + 0.65 * efficiency))),
    wasted,
  };
}

export function coupleFromWeapon(weapon: Item, grade?: AmmoGrade): AmmoCouple {
  const g = grade ?? weapon.ammoGrade ?? gradeFromLoad(weapon.ammoLoad);
  return coupleAmmo(gunQuality(weapon), ammoQuality(g), {
    ap: weapon.loadAp,
    damage: weapon.loadDamage,
    accuracy: weapon.loadAccuracy,
  });
}

export function weaponDiceMod(weapon: Item | undefined, stat: StatKey): number {
  if (!weapon) return 0;
  const rarity = RARITY_DICE[weapon.rarity] ?? 0;
  const cond = weapon.condition === "Pristine" ? 1 : weapon.condition === "Worn" ? 0 : weapon.condition === "Damaged" ? -1 : -4;
  const matrix = coupleFromWeapon(weapon);
  if (stat === "STR" || stat === "SPD") {
    return rarity + cond + Math.round((weapon.accuracy ?? 0) / 2) + Math.round(matrix.accuracy / 2);
  }
  if (stat === "LCK") return Math.max(0, Math.floor(rarity / 2));
  return cond < 0 ? cond : 0;
}

export function weaponCombatBonus(weapon: Item | undefined): { accuracy: number; damage: number } {
  if (!weapon) return { accuracy: 0, damage: 0 };
  const rarity = RARITY_DICE[weapon.rarity] ?? 0;
  const cond = weapon.condition === "Pristine" ? 1 : weapon.condition === "Worn" ? 0 : weapon.condition === "Damaged" ? -1 : -3;
  return { accuracy: rarity + cond, damage: Math.max(0, rarity - 1) };
}

export function gradeLabel(grade: AmmoGrade | string | undefined): string {
  if (!grade) return "Ball";
  const key = grade.toLowerCase() as AmmoGrade;
  if (key in AMMO_GRADE_META) return AMMO_GRADE_META[key].label;
  return String(grade);
}
