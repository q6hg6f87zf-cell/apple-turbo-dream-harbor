import type { ClassName, StatKey } from "./types";
import {
  DESTINY,
  ENCHANTS,
  PRIMARY_STAT,
  REP,
  SHADOW,
  SIGNATURE,
  TRAIT_TIERS,
  pickByRoll,
} from "./data-legacy";

export const STAT_ORDER: StatKey[] = ["STR", "DEF", "INT", "WIS", "SPD", "CHA", "LCK"];

export const FATE_KEYS = ["rep", "trait", "skill", "shadow", "enchant", "destiny"] as const;
export type FateKey = (typeof FATE_KEYS)[number];

/** d20 10 is average. Each 2 points off 10 shifts the class floor by 1. */
export function scoreFromDice(base: number, roll: number): number {
  const n = Math.max(1, Math.min(20, Math.floor(Number(roll) || 10)));
  return Math.max(1, base + Math.trunc((n - 10) / 2));
}

export function bandForRoll(roll: number): { label: string; meaning: string } {
  const n = Math.max(1, Math.min(20, Math.floor(Number(roll) || 0)));
  if (n <= 4) {
    return {
      label: "Cursed",
      meaning: "This number will hurt. Lean on teammates whenever this stat is the beat.",
    };
  }
  if (n <= 8) {
    return {
      label: "Soft",
      meaning: "They can try. Do not bet a raid on it.",
    };
  }
  if (n <= 12) {
    return {
      label: "Steady",
      meaning: "Ranch average. They will do their share and not much more.",
    };
  }
  if (n <= 16) {
    return {
      label: "Hard",
      meaning: "This is a tool. Put them on beats that ask for it.",
    };
  }
  if (n <= 19) {
    return {
      label: "Exceptional",
      meaning: "The Hollow notices. This is a primary, whether the class agrees or not.",
    };
  }
  return {
    label: "Hollow-touched",
    meaning: "Once in a generation. Do not waste it on a locked door you could have walked around.",
  };
}

export function tyroneOnStat(key: StatKey, roll: number, isPrimary: boolean): string {
  const copy = STAT_COPY[key];
  const band = bandForRoll(roll);
  const hook = isPrimary
    ? `This is the class primary. ${copy.name} is the beat they live on.`
    : copy.checks;
  return `d20 ${roll} — ${band.label}. ${band.meaning} ${hook}`;
}

export const STAT_COPY: Record<
  StatKey,
  { key: StatKey; name: string; short: string; does: string; checks: string }
> = {
  STR: {
    key: "STR",
    name: "Strength",
    short: "Muscle and force",
    does: "How hard they hit with a blade or a shoulder. Feeds melee damage, hauls wounded riders, and opens jammed vault doors.",
    checks: "Rolled on force, lift, melee, and holding a line when the Hollow pushes back.",
  },
  DEF: {
    key: "DEF",
    name: "Defense",
    short: "Hide and grit",
    does: "How much of a hit they keep. Armor adds to this. High Defense walks out of a mag-dump. Low Defense drops on the first clean shot.",
    checks: "Rolled when something tries to put them down. Plate, powered shells, and the infirmary all lean on it.",
  },
  INT: {
    key: "INT",
    name: "Intellect",
    short: "SYNAPSE and machines",
    does: "Reading the old systems. Wizards live here. Seats lasers, cracks terminals, and talks to SYNAPSE without getting burned.",
    checks: "Rolled on terminals, coils, puzzles, and any beat that asks a machine a question.",
  },
  WIS: {
    key: "WIS",
    name: "Wisdom",
    short: "Notice and nerve",
    does: "Seeing the trap before it closes. Healers live here. Scouts clean, keeps a downed rider breathing, and hears what the radio is actually saying.",
    checks: "Rolled on scout, treat, track, and 'does this door feel wrong.'",
  },
  SPD: {
    key: "SPD",
    name: "Speed",
    short: "First and gone",
    does: "Who moves first and who is still there when the lights come on. Rogues live here. Wins initiative, slips a lock, and extracts before the Warden finishes turning.",
    checks: "Rolled on stealth, flee, initiative, and anything that says 'before they see you.'",
  },
  CHA: {
    key: "CHA",
    name: "Presence",
    short: "Talk and trade",
    does: "Whether a merchant names a real price. Bards and Merchants live here. Cuts deals, calms a room, and makes Tyrone less likely to call you a damn fool.",
    checks: "Rolled on shop, talk, recruit, and any beat that is a conversation with teeth.",
  },
  LCK: {
    key: "LCK",
    name: "Luck",
    short: "The Hollow's thumb",
    does: "The die the world does not advertise. Fattens crits, sweetens loot, and makes destiny threads fire. Low Luck is how you find the mine.",
    checks: "Rolled on loot, crit range, shop finds, and those quiet moments when the vault door sticks anyway.",
  },
};

export const FATE_COPY: Record<FateKey, { label: string; does: string }> = {
  rep: {
    label: "Reputation",
    does: "Who they were before the Hollow. Stamps the title on the card and a small passive that never turns off.",
  },
  trait: {
    label: "Trait",
    does: "How hard the class primary hits. Weakened through Legendary. A high trait is extra points on Strength, Intellect, Speed, Wisdom, or Presence — whichever the class lives on.",
  },
  skill: {
    label: "Signature",
    does: "The trick only they do. A named move you will actually press in a fight or on a beat.",
  },
  shadow: {
    label: "Shadow",
    does: "The flaw that will cost you. It is not flavor. It will fire.",
  },
  enchant: {
    label: "Enchantment",
    does: "The Machine Shop blessing sitting on their kit. A quiet bonus until the day it is not.",
  },
  destiny: {
    label: "Destiny",
    does: "A thread that fires once. Keep it in mind. The Hollow will cash it.",
  },
};

export function fateLanding(
  cls: ClassName,
  key: FateKey,
  roll: number,
): { title: string; buff: string; band: { label: string; meaning: string } } {
  const n = Math.max(1, Math.min(20, Math.floor(Number(roll) || 0)));
  const band = bandForRoll(n);
  if (!roll) {
    return { title: "Tap to roll", buff: FATE_COPY[key].does, band };
  }
  if (key === "rep") {
    const hit = pickByRoll(REP[cls], n);
    return { title: hit.title ?? "—", buff: hit.passive ?? FATE_COPY.rep.does, band };
  }
  if (key === "trait") {
    const hit = TRAIT_TIERS.find((t) => n >= t.range[0] && n <= t.range[1]) ?? TRAIT_TIERS[2]!;
    const stat = STAT_COPY[PRIMARY_STAT[cls]];
    const signed = hit.bonus > 0 ? `+${hit.bonus}` : `${hit.bonus}`;
    const buff =
      hit.bonus === 0
        ? `${stat.name} stays at the class floor. No extra, no penalty.`
        : hit.bonus < 0
          ? `${signed} ${stat.name}. The class primary hits softer. Every ${stat.name} check starts behind.`
          : `${signed} ${stat.name}. Extra points on the class primary. ${stat.checks}`;
    return { title: hit.level, buff, band };
  }
  if (key === "skill") {
    const hit = pickByRoll(SIGNATURE[cls], n);
    return { title: hit.name ?? "—", buff: hit.desc ?? FATE_COPY.skill.does, band };
  }
  if (key === "shadow") {
    const hit = pickByRoll(SHADOW[cls], n);
    return { title: hit.name ?? hit.title ?? "—", buff: hit.desc ?? hit.passive ?? FATE_COPY.shadow.does, band };
  }
  if (key === "enchant") {
    const hit = pickByRoll(ENCHANTS[cls], n);
    return { title: hit.name ?? hit.title ?? "—", buff: hit.desc ?? FATE_COPY.enchant.does, band };
  }
  const hit = pickByRoll(DESTINY[cls], n);
  return { title: "Fires once", buff: hit.thread ?? hit.desc ?? FATE_COPY.destiny.does, band };
}
