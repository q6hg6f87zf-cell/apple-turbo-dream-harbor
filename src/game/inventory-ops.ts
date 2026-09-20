import type { GameState, Item, StatKey } from "./types";
import {
  analyzeLoadout,
  canAttachEnchantment,
  enchantmentSocketStatus,
} from "./loadout-effects";
import {
  ensureResidentProgress,
  grantItemMastery,
  type ActiveItemEffect,
} from "./resident-progression";
import { isAmmoConsumable } from "./weapon-ops";

export type ItemSource =
  | { kind: "vault" }
  | { kind: "operative"; opId: string };

function findSourceItem(state: GameState, source: ItemSource, itemId: string) {
  if (source.kind === "vault") return state.vault.find((item) => item.id === itemId) ?? null;
  return state.operatives.find((op) => op.id === source.opId)?.inventory.find((item) => item.id === itemId) ?? null;
}

function removeSourceItem(state: GameState, source: ItemSource, itemId: string) {
  if (source.kind === "vault") {
    state.vault = state.vault.filter((item) => item.id !== itemId);
    return;
  }
  const i = state.operatives.findIndex((op) => op.id === source.opId);
  if (i < 0) return;
  state.operatives[i] = {
    ...state.operatives[i],
    inventory: state.operatives[i].inventory.filter((item) => item.id !== itemId),
  };
}

function appendEffect(op: ReturnType<typeof ensureResidentProgress>, item: Item) {
  const effect: ActiveItemEffect = {
    name: item.name,
    effect: item.effect,
    expires: item.effect.toLowerCase().includes("encounter") ? "encounter" : "sortie",
  };
  op.activeItemEffects = [...(op.activeItemEffects ?? []), effect].slice(-6);
}

function parseHealing(item: Item) {
  const text = item.effect.toLowerCase();
  if (text.includes("restore full hp")) return Infinity;
  const match = text.match(/restore\s+(\d+)\s+hp/);
  return match ? Number(match[1]) : 0;
}

function clearOneCurse(op: ReturnType<typeof ensureResidentProgress>, effect: string) {
  const lower = effect.toLowerCase();
  if (!lower.includes("clear") || !op.curses.length) return false;
  op.curses = op.curses.slice(1);
  return true;
}

function loadoutFeedback(itemOwner: ReturnType<typeof ensureResidentProgress>) {
  const loadout = analyzeLoadout(itemOwner);
  if (loadout.pressure === "stable") return "";
  const warning = loadout.warnings[0] ? ` · ${loadout.warnings[0]}` : "";
  return ` · Strain ${loadout.strain}% ${loadout.pressure.toUpperCase()}${warning}`;
}

export function useConsumable(
  state: GameState,
  source: ItemSource,
  itemId: string,
  targetOpId: string,
): string | null {
  const item = findSourceItem(state, source, itemId);
  const op = state.operatives.find((x) => x.id === targetOpId);
  if (!item || !op) return "Tyrone cannot find that item or resident.";
  if (item.kind !== "consumable") return "That is not a consumable.";
  if (isAmmoConsumable(item)) return "Load it through the rifle. That is not a sandwich.";
  if (op.status === "dead") return "That file is closed. Consumables cannot change it.";

  const p = ensureResidentProgress(op);
  const heal = parseHealing(item);
  const beforeHp = p.hp;
  if (heal === Infinity) p.hp = p.maxHp;
  else if (heal > 0) p.hp = Math.min(p.maxHp, p.hp + heal);

  const cleared = clearOneCurse(p, item.effect);
  const temporary = /[+-]\s*\d+\s*(str|def|int|wis|spd|cha|lck|(?:weapon\s+)?damage)|ignore|resistance|immunity|prevent|bonus|penalt/i.test(item.effect);
  if (temporary) appendEffect(p, item);

  const mastery = grantItemMastery(p, item);
  removeSourceItem(state, source, itemId);

  const healed = p.hp - beforeHp;
  const levelText = mastery.after > mastery.before ? ` Level ${mastery.before} → ${mastery.after}.` : "";
  const pieces = [
    healed > 0 ? `+${healed} HP` : "",
    cleared ? "1 condition cleared" : "",
    temporary ? "field effect prepared" : "",
    mastery.xp ? `+${mastery.xp} mastery XP` : "",
  ].filter(Boolean);
  const pressure = temporary ? loadoutFeedback(p) : "";
  return `${item.name} used on ${p.name}. ${pieces.join(" · ") || "Consumed."}.${levelText}${pressure}`.replace("..", ".");
}

export function attachEnchantment(
  state: GameState,
  source: ItemSource,
  enchantmentId: string,
  targetOpId: string,
  targetItemId: string,
): string | null {
  const enchantment = findSourceItem(state, source, enchantmentId);
  const op = state.operatives.find((x) => x.id === targetOpId);
  const target = op?.inventory.find((item) => item.id === targetItemId);
  if (!enchantment || !op || !target) return "Tyrone cannot find the enchantment or target gear.";

  const block = canAttachEnchantment(target, enchantment);
  if (block) return block;

  target.tags = [...(target.tags ?? []), `enchant:${enchantment.name}`, `enchant-rarity:${enchantment.rarity}`];
  target.effect = `${target.effect} • ${enchantment.name}: ${enchantment.effect}`;
  target.value += Math.max(1, Math.round(enchantment.value * 0.5));

  const mastery = grantItemMastery(op, enchantment);
  removeSourceItem(state, source, enchantmentId);
  const sockets = enchantmentSocketStatus(target);
  const levelText = mastery.after > mastery.before ? ` Level ${mastery.before} → ${mastery.after}.` : "";
  const pressure = loadoutFeedback(ensureResidentProgress(op));
  return `${enchantment.name} attached to ${target.name}. Resonance ${sockets.used}/${sockets.capacity} · +${mastery.xp} mastery XP.${levelText}${pressure}`.replace("..", ".");
}

export function supportedConsumableSummary(item: Item) {
  const heal = parseHealing(item);
  const temporary = /[+-]\s*\d+\s*(str|def|int|wis|spd|cha|lck|(?:weapon\s+)?damage)|ignore|resistance|immunity|prevent|bonus|penalt/i.test(item.effect);
  const clear = item.effect.toLowerCase().includes("clear");
  if (heal === Infinity) return "Fully restores HP.";
  if (heal > 0 && clear) return `Restores ${heal} HP and can clear a condition.`;
  if (heal > 0) return `Restores ${heal} HP.`;
  if (clear) return "Clears one current negative condition when possible.";
  if (temporary) return "Prepares its listed effect for the next sortie or encounter. Stacking several field buffs increases strain.";
  return "Consumes the item and records mastery XP for the resident.";
}

function numericBonus(effect: string, label: string) {
  const match = effect.match(new RegExp(`([+-]\\s*\\d+)\\s+${label}`, "i"));
  return match ? Number(match[1]!.replace(/\s/g, "")) : 0;
}

export function statHints(item: Item): Partial<Record<StatKey, number>> {
  const out: Partial<Record<StatKey, number>> = {};
  for (const key of ["STR", "DEF", "INT", "WIS", "SPD", "CHA", "LCK"] as StatKey[]) {
    const n = numericBonus(item.effect, key);
    if (n) out[key] = n;
  }
  return out;
}
