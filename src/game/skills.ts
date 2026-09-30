import type { DayTaskKind, GameState, SkillId, SkillSheet, StatKey, Stats } from "./types";

export const SKILL_IDS: SkillId[] = [
  "guns",
  "energy",
  "melee",
  "explosives",
  "sneak",
  "lockpick",
  "science",
  "repair",
  "medicine",
  "speech",
  "barter",
  "survival",
];

export const SKILLS: Record<
  SkillId,
  { name: string; short: string; governs: string; stats: [StatKey, StatKey] }
> = {
  guns: {
    name: "Guns",
    short: "Ranged",
    governs: "Pistol, rifle, shotgun, the raid that turns into a gunfight.",
    stats: ["LCK", "SPD"],
  },
  energy: {
    name: "Energy",
    short: "Coil",
    governs: "Lasers and coils. Science tells you what it is. This tells you where it hits.",
    stats: ["INT", "LCK"],
  },
  melee: {
    name: "Melee",
    short: "Close",
    governs: "Pipe, blade, shoulder. STR beats on a site lean here.",
    stats: ["STR", "DEF"],
  },
  explosives: {
    name: "Explosives",
    short: "Charges",
    governs: "Ticking crates and fake shipments. High enough, a trap costs skin, not the watch.",
    stats: ["INT", "LCK"],
  },
  sneak: {
    name: "Sneak",
    short: "Unseen",
    governs: "Perimeter walks, a dark ridge, ghosting a site before the visor paints you.",
    stats: ["SPD", "WIS"],
  },
  lockpick: {
    name: "Lockpick",
    short: "Read it",
    governs: "Which crate is the gift. At 45 you hear the tick. At 65 you know the gift too.",
    stats: ["SPD", "INT"],
  },
  science: {
    name: "Science",
    short: "SYNAPSE",
    governs: "Terminals, the relay tower, any beat that asks a machine a question.",
    stats: ["INT", "WIS"],
  },
  repair: {
    name: "Repair",
    short: "Bench",
    governs: "One watch in the shop. At 55 the condition jumps twice.",
    stats: ["INT", "STR"],
  },
  medicine: {
    name: "Medicine",
    short: "Needle",
    governs: "Med pass. Points here are extra HP, not a speech.",
    stats: ["WIS", "INT"],
  },
  speech: {
    name: "Speech",
    short: "Teeth",
    governs: "The gate, a lie to a visor, any beat that is a conversation with a cost.",
    stats: ["CHA", "WIS"],
  },
  barter: {
    name: "Barter",
    short: "Price",
    governs: "Stall prices under the Gate. Paying Kane without looking poor.",
    stats: ["CHA", "LCK"],
  },
  survival: {
    name: "Survival",
    short: "Road",
    governs: "Supply runs come back unhurt. Forage. Holding a line when the Hollow pushes.",
    stats: ["WIS", "DEF"],
  },
};

/** 2 + primary×2 + secondary. A 10/10 body lands near 32 before tags. */
export function baseSkill(stats: Stats, id: SkillId): number {
  const [a, b] = SKILLS[id].stats;
  const n = 2 + (stats[a] ?? 0) * 2 + (stats[b] ?? 0);
  return clamp(n, 5, 55);
}

/** +15 on a tag, then the die moves once this clears the mid-20s. */
export function skillMod(value: number): number {
  return clamp(Math.floor((value - 25) / 12), -2, 6);
}

export function creationPoints(int: number): number {
  return 8 + Math.floor(Math.max(1, int) / 2);
}

export function rankPoints(int: number): number {
  return 5 + Math.floor(Math.max(1, int) / 2);
}

export function skillValue(state: GameState, id: SkillId): number {
  return state.skillSheet?.values[id] ?? 0;
}

export function skillBonus(state: GameState, id: SkillId): number {
  if (!state.skillSheet) return 0;
  return skillMod(state.skillSheet.values[id] ?? 0);
}

export function buildSheet(stats: Stats, tags: SkillId[], travisTags: SkillId[], banked: number): SkillSheet {
  const picked = uniqueTags(tags);
  const values = {} as Record<SkillId, number>;
  for (const id of SKILL_IDS) {
    let n = baseSkill(stats, id);
    if (picked.includes(id)) n = Math.min(100, n + 15);
    values[id] = n;
  }
  return {
    values,
    tags: picked,
    travisTags: uniqueTags(travisTags),
    points: creationPoints(stats.INT) + Math.max(0, banked),
  };
}

export function spendPoint(sheet: SkillSheet, id: SkillId, n = 1): string | null {
  if (n < 1) return "Nothing to spend.";
  if (sheet.points < 1) return "No points on the bench.";
  const cur = sheet.values[id] ?? 0;
  if (cur >= 100) return `${SKILLS[id].name} is capped.`;
  const gain = Math.min(n, sheet.points, 100 - cur);
  sheet.values[id] = cur + gain;
  sheet.points -= gain;
  return null;
}

export function uniqueTags(tags: SkillId[]): SkillId[] {
  const out: SkillId[] = [];
  for (const id of tags) {
    if (!SKILL_IDS.includes(id) || out.includes(id)) continue;
    out.push(id);
    if (out.length === 3) break;
  }
  return out;
}

/** Top three weights. Ties break on the skill list, not on luck. */
export function recommendTags(weights: Partial<Record<SkillId, number>>): SkillId[] {
  const ranked = [...SKILL_IDS].sort((a, b) => (weights[b] ?? 0) - (weights[a] ?? 0) || SKILL_IDS.indexOf(a) - SKILL_IDS.indexOf(b));
  return ranked.slice(0, 3);
}

export function beatSkill(stat: StatKey, kind: string): SkillId {
  if (kind === "merchant") return "barter";
  if (kind === "loot") return "lockpick";
  if (kind === "combat" || kind === "boss") return "guns";
  switch (stat) {
    case "STR":
      return "melee";
    case "DEF":
      return "survival";
    case "INT":
      return "science";
    case "WIS":
      return "medicine";
    case "SPD":
      return "sneak";
    case "CHA":
      return "speech";
    default:
      return "explosives";
  }
}

export function fightSkill(family: string): SkillId {
  if (family === "melee") return "melee";
  if (family === "energy") return "energy";
  return "guns";
}

export function jobSkill(kind: DayTaskKind): SkillId | null {
  switch (kind) {
    case "crates":
      return "lockpick";
    case "treat":
      return "medicine";
    case "repair":
      return "repair";
    case "scan":
      return "sneak";
    case "run":
      return "survival";
    case "visitor":
    case "aegis":
      return "speech";
    case "tribute":
    case "market":
      return "barter";
    case "tower":
    case "cog":
      return "science";
    case "salvage":
      return "survival";
    case "crisis":
      return "repair";
    default:
      return null;
  }
}

export function taskSkillId(task: { kind: DayTaskKind; skill?: SkillId; missionKind?: string }): SkillId | null {
  if (task.skill) return task.skill;
  if (task.kind === "sortie") {
    if (task.missionKind === "raid" || task.missionKind === "boss" || task.missionKind === "bounty") return "guns";
    if (task.missionKind === "forage") return "survival";
    if (task.missionKind === "trade") return "barter";
    return "sneak";
  }
  return jobSkill(task.kind);
}

export function repairSteps(skill: number): number {
  return skill >= 55 ? 2 : 1;
}

export function medicineHeal(skill: number): number {
  return 6 + Math.max(0, skillMod(skill)) * 2;
}

/** Lockpick names the bad crate. Higher names the good one too. */
export function crateRead(
  state: GameState,
  crates: { id: string; label: string; result: string }[],
): string | null {
  const lock = skillValue(state, "lockpick");
  if (!state.skillSheet || lock < 45) return null;
  const trap = crates.find((c) => c.result === "trap");
  const good = crates.find((c) => c.result === "good");
  if (lock >= 65 && trap && good) {
    return `Lockpick ${lock}. The ticking one is “${trap.label}”. The gift is “${good.label}”.`;
  }
  if (trap) return `Lockpick ${lock}. Leave “${trap.label}” alone. It ticks.`;
  return null;
}

export function skillLine(state: GameState, id: SkillId): string {
  const book = SKILLS[id];
  if (!state.skillSheet) return `${book.name} is unstamped. Sit Bay 13 or this job will not bend.`;
  const n = state.skillSheet.values[id] ?? 0;
  const mod = skillMod(n);
  const bend = mod > 0 ? `+${mod} on the die` : mod < 0 ? `${mod} on the die` : "no bend yet";
  const tagged = state.skillSheet.tags.includes(id) ? " Tagged." : "";
  return `${book.name} ${n}. ${bend}.${tagged} ${book.governs}`;
}

export function barterCut(state: GameState): number {
  const n = skillValue(state, "barter");
  if (n >= 70) return 0.85;
  if (n >= 45) return 0.92;
  return 1;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
