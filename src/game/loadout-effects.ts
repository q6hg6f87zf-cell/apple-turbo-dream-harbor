import type { Item, Operative, Rarity, StatKey } from "./types";

const STAT_KEYS: StatKey[] = ["STR", "DEF", "INT", "WIS", "SPD", "CHA", "LCK"];
const DIMINISH = [1, 0.75, 0.5, 0.25, 0.15] as const;

const ENCHANTMENT_CAPACITY: Record<Rarity, number> = {
  Common: 1,
  Uncommon: 1,
  Rare: 2,
  Legendary: 2,
  Mythic: 3,
  Cursed: 3,
};

const OPPOSING_STAT: Record<StatKey, StatKey> = {
  STR: "SPD",
  DEF: "SPD",
  INT: "STR",
  WIS: "LCK",
  SPD: "DEF",
  CHA: "WIS",
  LCK: "WIS",
};

export type LoadoutPressure = "stable" | "loaded" | "strained" | "critical";

export type LoadoutAnalysis = {
  statBonuses: Partial<Record<StatKey, number>>;
  statPenalties: Partial<Record<StatKey, number>>;
  statModifiers: Partial<Record<StatKey, number>>;
  damageBonus: number;
  buffCount: number;
  enchantmentCount: number;
  strain: number;
  pressure: LoadoutPressure;
  warnings: string[];
};

type ActiveEffectCarrier = Operative & {
  activeItemEffects?: Array<{ name: string; effect: string; expires: "sortie" | "encounter" }>;
};

type ParsedEffect = {
  stats: Partial<Record<StatKey, number[]>>;
  damage: number[];
};

function pushStat(target: Partial<Record<StatKey, number[]>>, stat: StatKey, amount: number) {
  target[stat] = [...(target[stat] ?? []), amount];
}

function conditionAllows(effect: string, op: Operative) {
  const lower = effect.toLowerCase();
  const hpRatio = op.maxHp > 0 ? op.hp / op.maxHp : 0;
  if (/while\s+below\s+half\s+hp|below\s+50%\s*hp/.test(lower) && hpRatio >= 0.5) return false;
  if (/while\s+above\s+half\s+hp|above\s+50%\s*hp/.test(lower) && hpRatio <= 0.5) return false;
  if (/at\s+full\s+hp|while\s+at\s+full\s+hp/.test(lower) && op.hp < op.maxHp) return false;
  if (/while\s+wounded|when\s+wounded/.test(lower) && op.hp >= op.maxHp) return false;
  return true;
}

function parseEffect(effect: string, op: Operative): ParsedEffect {
  const parsed: ParsedEffect = { stats: {}, damage: [] };
  if (!conditionAllows(effect, op)) return parsed;

  const statPattern = /([+-]\s*\d+)\s*(STR|DEF|INT|WIS|SPD|CHA|LCK)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = statPattern.exec(effect))) {
    const amount = Number(match[1]!.replace(/\s/g, ""));
    const stat = match[2]!.toUpperCase() as StatKey;
    if (Number.isFinite(amount)) pushStat(parsed.stats, stat, amount);
  }

  const damagePattern = /([+-]\s*\d+)\s*(?:weapon\s+)?damage\b/gi;
  while ((match = damagePattern.exec(effect))) {
    const amount = Number(match[1]!.replace(/\s/g, ""));
    if (Number.isFinite(amount)) parsed.damage.push(amount);
  }
  return parsed;
}

function effectiveStack(values: number[]) {
  const positive = values.filter((n) => n > 0).sort((a, b) => b - a);
  const negative = values.filter((n) => n < 0).reduce((sum, n) => sum + n, 0);
  const positiveEffective = positive.reduce(
    (sum, n, index) => sum + n * (DIMINISH[Math.min(index, DIMINISH.length - 1)] ?? 0.15),
    0,
  );
  return Math.round(positiveEffective + negative);
}

export function enchantmentCount(item: Item) {
  return (item.tags ?? []).filter((tag) => tag.startsWith("enchant:")).length;
}

export function enchantmentCapacity(item: Item) {
  return ENCHANTMENT_CAPACITY[item.rarity];
}

export function enchantmentSocketStatus(item: Item) {
  const used = enchantmentCount(item);
  const capacity = enchantmentCapacity(item);
  return { used, capacity, remaining: Math.max(0, capacity - used) };
}

export function canAttachEnchantment(item: Item, enchantment: Item): string | null {
  if (!item.slot) return "Enchantments need a weapon, armor, or trinket target.";
  if (enchantment.kind !== "enchantment") return "That item is not an enchantment.";
  if (/([+-]\s*\d+)\s*(?:weapon\s+)?damage\b/i.test(enchantment.effect) && item.slot !== "weapon") {
    return "Tyrone: damage resonance needs a weapon. Armor can hold wards, stats and utility, but it cannot fake a sharper barrel.";
  }
  const sockets = enchantmentSocketStatus(item);
  if (sockets.used >= sockets.capacity) {
    return `Tyrone: ${item.name} is at resonance capacity (${sockets.used}/${sockets.capacity}). Replace the gear or build around what is already attached.`;
  }
  if ((item.tags ?? []).includes(`enchant:${enchantment.name}`)) return "That exact enchantment is already attached.";
  return null;
}

function equippedWithCandidate(op: Operative, candidate?: Item | null) {
  const equipped = op.inventory.filter((item) => item.equipped);
  if (!candidate?.slot) return equipped;
  return equipped.filter((item) => item.slot !== candidate.slot).concat({ ...candidate, equipped: true });
}

function addPenalty(target: Partial<Record<StatKey, number>>, stat: StatKey, amount: number) {
  if (amount <= 0) return;
  target[stat] = (target[stat] ?? 0) - amount;
}

function pressureFor(strain: number): LoadoutPressure {
  if (strain >= 75) return "critical";
  if (strain >= 50) return "strained";
  if (strain >= 25) return "loaded";
  return "stable";
}

export function analyzeLoadout(op: Operative, candidate?: Item | null): LoadoutAnalysis {
  const gear = equippedWithCandidate(op, candidate);
  const activeEffects = (op as ActiveEffectCarrier).activeItemEffects ?? [];
  const statSources: Partial<Record<StatKey, number[]>> = {};
  const damageSources: number[] = [];

  for (const item of gear) {
    const parsed = parseEffect(item.effect ?? "", op);
    for (const stat of STAT_KEYS) {
      for (const amount of parsed.stats[stat] ?? []) pushStat(statSources, stat, amount);
    }
    damageSources.push(...parsed.damage);
  }
  for (const effect of activeEffects) {
    const parsed = parseEffect(effect.effect ?? "", op);
    for (const stat of STAT_KEYS) {
      for (const amount of parsed.stats[stat] ?? []) pushStat(statSources, stat, amount);
    }
    damageSources.push(...parsed.damage);
  }

  const statBonuses: Partial<Record<StatKey, number>> = {};
  for (const stat of STAT_KEYS) {
    const effective = effectiveStack(statSources[stat] ?? []);
    if (effective) statBonuses[stat] = effective;
  }
  const damageBonus = effectiveStack(damageSources);
  const statPenalties: Partial<Record<StatKey, number>> = {};
  const warnings: string[] = [];
  let overloadPoints = 0;

  for (const stat of STAT_KEYS) {
    const bonus = Math.max(0, statBonuses[stat] ?? 0);
    if (bonus <= 4) continue;
    const over = bonus - 4;
    const penalty = Math.min(3, Math.ceil(over / 2));
    const opposing = OPPOSING_STAT[stat];
    addPenalty(statPenalties, opposing, penalty);
    overloadPoints += over;
    warnings.push(`${stat} specialization +${bonus} overloads ${opposing} by ${penalty}.`);
  }

  const buffCount = activeEffects.length;
  if (buffCount >= 3) {
    const wisPenalty = Math.min(2, Math.ceil((buffCount - 2) / 2));
    addPenalty(statPenalties, "WIS", wisPenalty);
    warnings.push(`${buffCount} active field buffs cause -${wisPenalty} WIS from saturation.`);
  }
  if (buffCount >= 4) {
    addPenalty(statPenalties, "SPD", 1);
    warnings.push("Four simultaneous field buffs cause -1 SPD until the stack clears.");
  }

  const enchantmentCountTotal = gear.reduce((sum, item) => sum + enchantmentCount(item), 0);
  if (enchantmentCountTotal >= 5) {
    const resonancePenalty = Math.min(2, Math.ceil((enchantmentCountTotal - 4) / 2));
    addPenalty(statPenalties, "WIS", resonancePenalty);
    warnings.push(`${enchantmentCountTotal} live enchantments create resonance feedback: -${resonancePenalty} WIS.`);
  }
  if (enchantmentCountTotal >= 7) {
    addPenalty(statPenalties, "LCK", 1);
    warnings.push("Extreme resonance makes the build less predictable: -1 LCK.");
  }

  const cursedSignals = gear.reduce(
    (sum, item) => sum + (item.rarity === "Cursed" ? 1 : 0) + (item.tags ?? []).filter((tag) => tag === "enchant-rarity:Cursed").length,
    0,
  );
  if (cursedSignals) {
    warnings.push(`${cursedSignals} cursed resonance signal${cursedSignals === 1 ? "" : "s"} increase loadout volatility.`);
  }

  const statModifiers: Partial<Record<StatKey, number>> = {};
  for (const stat of STAT_KEYS) {
    const value = (statBonuses[stat] ?? 0) + (statPenalties[stat] ?? 0);
    if (value) statModifiers[stat] = value;
  }

  const penaltyWeight = Object.values(statPenalties).reduce((sum, n) => sum + Math.abs(n ?? 0), 0);
  const strain = Math.min(
    100,
    Math.round(buffCount * 7 + enchantmentCountTotal * 5 + overloadPoints * 6 + penaltyWeight * 8 + cursedSignals * 12),
  );

  return {
    statBonuses,
    statPenalties,
    statModifiers,
    damageBonus,
    buffCount,
    enchantmentCount: enchantmentCountTotal,
    strain,
    pressure: pressureFor(strain),
    warnings,
  };
}

export function previewEnchantmentLoadout(op: Operative, targetItemId: string, enchantment: Item) {
  const target = op.inventory.find((item) => item.id === targetItemId);
  if (!target) return null;
  const block = canAttachEnchantment(target, enchantment);
  const current = analyzeLoadout(op);
  if (block) return { block, current, projected: current };

  const inventory = op.inventory.map((item) => {
    if (item.id !== targetItemId) return { ...item, tags: [...(item.tags ?? [])] };
    return {
      ...item,
      effect: `${item.effect} • ${enchantment.name}: ${enchantment.effect}`,
      tags: [...(item.tags ?? []), `enchant:${enchantment.name}`, `enchant-rarity:${enchantment.rarity}`],
    };
  });
  const projected = analyzeLoadout({ ...op, inventory });
  return { block: null, current, projected };
}
