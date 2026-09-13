import { analyzeLoadout } from "./loadout-effects";
import type { Item, MissionKind, Operative, Rarity } from "./types";

export type ActiveItemEffect = {
  name: string;
  effect: string;
  expires: "sortie" | "encounter";
};

export type ProgressiveOperative = Operative & {
  residentLevel?: number;
  residentXp?: number;
  residentXpToNext?: number;
  masteredItems?: string[];
  activeItemEffects?: ActiveItemEffect[];
};

export const MISSION_RESIDENT_XP: Record<MissionKind, number> = {
  scout: 18,
  forage: 24,
  trade: 20,
  raid: 42,
  bounty: 58,
  boss: 125,
};

export const MISSION_RIDER_XP: Record<MissionKind, number> = {
  scout: 3,
  forage: 4,
  trade: 4,
  raid: 7,
  bounty: 10,
  boss: 22,
};

const RARITY_POWER: Record<Rarity, number> = {
  Common: 8,
  Uncommon: 14,
  Rare: 24,
  Legendary: 38,
  Mythic: 56,
  Cursed: 42,
};

const RARITY_MASTERY_XP: Record<Rarity, number> = {
  Common: 3,
  Uncommon: 5,
  Rare: 8,
  Legendary: 13,
  Mythic: 20,
  Cursed: 14,
};

function requiredXp(level: number) {
  return Math.round(80 + Math.pow(Math.max(1, level), 1.32) * 34);
}

export function ensureResidentProgress(op: Operative): ProgressiveOperative {
  const p = op as ProgressiveOperative;
  if (!Number.isFinite(p.residentLevel)) p.residentLevel = 1;
  if (!Number.isFinite(p.residentXp)) p.residentXp = 0;
  if (!Number.isFinite(p.residentXpToNext)) p.residentXpToNext = requiredXp(p.residentLevel!);
  if (!Array.isArray(p.masteredItems)) p.masteredItems = [];
  if (!Array.isArray(p.activeItemEffects)) p.activeItemEffects = [];
  return p;
}

export function residentProgress(op: Operative) {
  const p = op as ProgressiveOperative;
  const level = Number.isFinite(p.residentLevel) ? Math.max(1, p.residentLevel!) : 1;
  const xp = Number.isFinite(p.residentXp) ? Math.max(0, p.residentXp!) : 0;
  const xpToNext = Number.isFinite(p.residentXpToNext) ? Math.max(1, p.residentXpToNext!) : requiredXp(level);
  return { level, xp, xpToNext };
}

export function grantResidentXp(op: Operative, amount: number) {
  const p = ensureResidentProgress(op);
  const before = p.residentLevel!;
  p.residentXp! += Math.max(0, Math.round(amount));
  let guard = 0;
  while (p.residentXp! >= p.residentXpToNext! && guard++ < 12) {
    p.residentXp! -= p.residentXpToNext!;
    p.residentLevel! += 1;
    p.residentXpToNext = requiredXp(p.residentLevel!);
    p.maxHp += 1;
    p.hp = Math.min(p.maxHp, p.hp + 1);
  }
  return { before, after: p.residentLevel!, gained: Math.max(0, Math.round(amount)) };
}

export function itemMasteryKey(item: Item) {
  return `${item.kind}:${item.name.toLowerCase()}`;
}

export function masteryXpFor(item: Item) {
  return RARITY_MASTERY_XP[item.rarity] + (item.kind === "enchantment" ? 5 : item.kind === "special" ? 3 : 0);
}

export function hasMastered(op: Operative, item: Item) {
  const p = op as ProgressiveOperative;
  return !!p.masteredItems?.includes(itemMasteryKey(item));
}

export function grantItemMastery(op: Operative, item: Item) {
  const p = ensureResidentProgress(op);
  const key = itemMasteryKey(item);
  if (p.masteredItems!.includes(key)) return { xp: 0, before: p.residentLevel!, after: p.residentLevel! };
  p.masteredItems!.push(key);
  const xp = masteryXpFor(item);
  const result = grantResidentXp(op, xp);
  return { xp, before: result.before, after: result.after };
}

function damageAverage(damage?: string) {
  if (!damage) return 0;
  const m = damage.match(/(\d+)d(\d+)(?:\s*\+\s*(\d+))?/i);
  if (!m) return 0;
  return Number(m[1]) * (Number(m[2]) + 1) * 0.5 + Number(m[3] ?? 0);
}

function conditionFactor(item: Item) {
  if (item.condition === "Broken") return 0.25;
  if (item.condition === "Damaged") return 0.62;
  if (item.condition === "Worn") return 0.82;
  return 1;
}

export function itemPower(item: Item) {
  const base = RARITY_POWER[item.rarity];
  const combat = damageAverage(item.damage) * 3.2 + (item.defense ?? 0) * 9;
  const attachments = (item.tags ?? []).filter((tag) => tag.startsWith("enchant:")).length * 4;
  return Math.round((base + combat + attachments) * conditionFactor(item));
}

export function residentPower(op: Operative, candidate?: Item | null) {
  const progress = residentProgress(op);
  const equipped = op.inventory.filter((item) => item.equipped);
  let gear = equipped;
  if (candidate?.slot) {
    gear = equipped.filter((item) => item.slot !== candidate.slot).concat(candidate);
  }
  const gearPower = gear.reduce((sum, item) => sum + itemPower(item), 0);
  const loadout = analyzeLoadout(op, candidate);
  const modifierPower = Object.values(loadout.statModifiers).reduce((sum, n) => sum + (n ?? 0) * 9, 0);
  const damagePower = loadout.damageBonus * 7;
  const strainCost = Math.round(loadout.strain * 0.35);
  const experience = Math.min(90, op.battles * 2 + op.raids * 5);
  return Math.max(1, Math.round(70 + progress.level * 17 + op.maxHp * 2 + gearPower + experience + modifierPower + damagePower - strainCost));
}

export function previewItem(op: Operative, item: Item) {
  const current = residentProgress(op);
  const currentPower = residentPower(op);
  const masteryXp = hasMastered(op, item) ? 0 : masteryXpFor(item);
  let projectedLevel = current.level;
  let xp = current.xp + masteryXp;
  let next = current.xpToNext;
  while (xp >= next && projectedLevel < 99) {
    xp -= next;
    projectedLevel += 1;
    next = requiredXp(projectedLevel);
  }
  const projectedPower = item.slot ? residentPower(op, item) : currentPower;
  const replaced = item.slot ? op.inventory.find((x) => x.equipped && x.slot === item.slot) ?? null : null;
  const fit = item.classHint ? (item.classHint === op.cls ? "best" : "off-class") : "universal";
  const loadout = item.slot ? analyzeLoadout(op, item) : analyzeLoadout(op);
  return {
    currentLevel: current.level,
    projectedLevel,
    currentXp: current.xp,
    xpToNext: current.xpToNext,
    masteryXp,
    currentPower,
    projectedPower,
    powerDelta: projectedPower - currentPower,
    replaced,
    fit,
    loadout,
  } as const;
}

export function expireSortieEffects(op: Operative) {
  const p = op as ProgressiveOperative;
  if (!p.activeItemEffects?.length) return;
  p.activeItemEffects = p.activeItemEffects.filter((effect) => effect.expires !== "sortie" && effect.expires !== "encounter");
}
