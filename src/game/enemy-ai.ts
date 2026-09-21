/**
 * Enemy doctrine.
 *
 * The old enemy turn was one loop: pick a random living operative, roll, apply
 * damage. Every hostile in the Realm fought identically, nothing they did was
 * legible, and there was no reason to change what the squad brought.
 *
 * Hostiles now have a **role**, and a role wants something specific out of a
 * round. A marksman spends one round aiming and the next one making that
 * matter. A skirmisher hunts whoever is already bleeding. Pack animals get
 * braver in numbers and reckless when the numbers drop. A controller goes for
 * whoever is holding the plan. Machines do not care how the fight is going.
 *
 * Every decision is logged as a decision — "breaks off to flank the one who is
 * bleeding" — so the player can see the reasoning and counter it. That is the
 * difference between a fight with a health bar and a fight with an opponent.
 */
import type {
  Combatant,
  CombatState,
  EnemyIntent,
  EnemyRole,
  Operative,
  Stats,
} from "./types";

export const ROLE_LABEL: Record<EnemyRole, string> = {
  brawler: "Brawler",
  skirmisher: "Skirmisher",
  marksman: "Marksman",
  controller: "Controller",
  pack: "Pack",
  machine: "Machine",
  warden: "Warden",
};

export const ROLE_DOCTRINE: Record<EnemyRole, string> = {
  brawler: "Walks at the strongest thing in the room and keeps walking.",
  skirmisher: "Hunts the wounded. Will not trade with anyone still standing straight.",
  marksman: "Spends a round setting up and cashes it on the next one. Guarding does not help.",
  controller: "Goes for whoever is holding the plan, then makes the next order cost more.",
  pack: "Brave in numbers, reckless without them. Fights better with friends alive.",
  machine: "No morale, no flinch, no interest in whether this is going well.",
  warden: "Named. Reads the field, marks whoever hurt it most, and changes shape when it drops.",
};

const NAME_ROLES: { match: RegExp; role: EnemyRole }[] = [
  { match: /hound|briar|leech|beast|horror|pack/i, role: "pack" },
  { match: /watch|guard|interceptor|specialist/i, role: "marksman" },
  { match: /bruiser|debtman|brawl|maul/i, role: "brawler" },
  { match: /shade|page|warden|survey/i, role: "controller" },
  { match: /frame|aegis|2753|drone|t-0880/i, role: "machine" },
  { match: /buyer|diver|broker|surveyor/i, role: "skirmisher" },
];

export function inferRole(c: Pick<Combatant, "name" | "tags" | "isBoss">): EnemyRole {
  if (c.isBoss) return "warden";
  if (c.tags?.includes("bounty")) return "skirmisher";
  const hit = NAME_ROLES.find((r) => r.match.test(c.name));
  return hit?.role ?? "brawler";
}

export function roleOf(c: Combatant): EnemyRole {
  return c.role ?? inferRole(c);
}

/**
 * Morale floor per role. Machines and named wardens never break: a boss that
 * ran, or shouted in a second body, would take its own last phase away from it
 * — the Reckoning only fires while the villain is the last thing standing.
 */
function moraleFloor(role: EnemyRole): number {
  if (role === "machine" || role === "warden") return -999;
  if (role === "pack") return 35;
  return 25;
}

export function startMorale(role: EnemyRole): number {
  return role === "pack" ? 80 : role === "machine" ? 100 : 90;
}

/**
 * Morale after the field has changed. Called once per enemy turn, before
 * anything decides what to do.
 */
export function readMorale(enemy: Combatant, allies: Combatant[]): number {
  const role = roleOf(enemy);
  if (role === "machine") return 100;
  const alive = allies.filter((a) => a.hp > 0).length;
  const total = allies.length || 1;
  const lost = 1 - alive / total;
  const hurt = 1 - enemy.hp / Math.max(1, enemy.maxHp);
  const packBonus = role === "pack" ? alive * 12 : 0;
  return Math.round(
    Math.max(0, Math.min(100, startMorale(role) + packBonus - lost * 55 - hurt * 45)),
  );
}

export interface EnemyPlan {
  intent: EnemyIntent;
  targetId: string | null;
  /** Added to the attack roll this round. */
  atkMod: number;
  /** Added to damage this round. */
  dmgMod: number;
  /** Ignores the target's guard bonus. */
  piercesGuard: boolean;
  /** Spends the round instead of attacking. */
  skipsAttack: boolean;
  /** The line that explains the decision. */
  note: string;
}

function weakest(party: Operative[]): Operative | null {
  let best: Operative | null = null;
  for (const op of party) {
    if (!best || op.hp / Math.max(1, op.maxHp) < best.hp / Math.max(1, best.maxHp)) best = op;
  }
  return best;
}

function strongest(party: Operative[]): Operative | null {
  let best: Operative | null = null;
  for (const op of party) if (!best || op.hp > best.hp) best = op;
  return best;
}

function brains(party: Operative[], stats: (op: Operative) => Stats): Operative | null {
  let best: Operative | null = null;
  for (const op of party) {
    if (!best) {
      best = op;
      continue;
    }
    const a = stats(op);
    const b = stats(best);
    if (a.INT + a.WIS > b.INT + b.WIS) best = op;
  }
  return best;
}

export function topThreatOf(combat: CombatState, party: Operative[]): Operative | null {
  const threat = combat.threat ?? {};
  let best: Operative | null = null;
  for (const member of party) {
    if (!best || (threat[member.id] ?? 0) > (threat[best.id] ?? 0)) best = member;
  }
  return best && (threat[best.id] ?? 0) > 0 ? best : null;
}

/**
 * Decide the round. Pure: it reads the field and returns intent, it never
 * mutates. The caller applies it and writes the log.
 */
export function planEnemyTurn(opts: {
  enemy: Combatant;
  allies: Combatant[];
  party: Operative[];
  combat: CombatState;
  statsOf: (op: Operative) => Stats;
  bossFocus?: boolean;
}): EnemyPlan {
  const { enemy, allies, party, combat, statsOf, bossFocus } = opts;
  const role = roleOf(enemy);
  const up = party.filter((p) => p.hp > 0);
  const morale = readMorale(enemy, allies);
  const aliveAllies = allies.filter((a) => a.hp > 0 && a.id !== enemy.id).length;
  const guarded = combat.guardId;

  const none: EnemyPlan = {
    intent: "press",
    targetId: null,
    atkMod: 0,
    dmgMod: 0,
    piercesGuard: false,
    skipsAttack: true,
    note: `${enemy.name} finds nothing left to fight.`,
  };
  if (!up.length) return none;

  // Broken. Run, or call for help once, before anything else is considered.
  // A named villain is never either: its phases are how it refuses to stop.
  if (!enemy.isBoss && morale <= moraleFloor(role)) {
    if (!enemy.calledFor && aliveAllies === 0 && role !== "pack") {
      return {
        intent: "call",
        targetId: null,
        atkMod: 0,
        dmgMod: 0,
        piercesGuard: false,
        skipsAttack: true,
        note: `${enemy.name} stops fighting and starts shouting. Something answers.`,
      };
    }
    return {
      intent: "rout",
      targetId: null,
      atkMod: 0,
      dmgMod: 0,
      piercesGuard: false,
      skipsAttack: true,
      note: `${enemy.name} breaks. It decided this was not worth dying over.`,
    };
  }

  // A boss in a focus phase hunts whoever has hurt it most.
  if (bossFocus) {
    const mark = topThreatOf(combat, up) ?? strongest(up);
    return {
      intent: "press",
      targetId: mark?.id ?? null,
      atkMod: 1,
      dmgMod: 1,
      piercesGuard: false,
      skipsAttack: false,
      note: `${enemy.name} marks ${mark?.name ?? "the line"} — it remembers who has been hurting it.`,
    };
  }

  switch (role) {
    case "marksman": {
      // Spend a round aiming; cash it next round through cover.
      if ((enemy.charge ?? 0) <= 0 && (enemy.cooldown ?? 0) <= 0 && up.length > 0) {
        return {
          intent: "aim",
          targetId: null,
          atkMod: 0,
          dmgMod: 0,
          piercesGuard: false,
          skipsAttack: true,
          note: `${enemy.name} stops moving and settles the sights. Cover will not matter next round.`,
        };
      }
      const mark = weakest(up);
      return {
        intent: "press",
        targetId: mark?.id ?? null,
        atkMod: 3 + (enemy.charge ?? 0),
        dmgMod: 2,
        piercesGuard: true,
        skipsAttack: false,
        note: `${enemy.name} takes the settled shot at ${mark?.name ?? "the line"}. Guarding buys nothing.`,
      };
    }
    case "skirmisher": {
      const mark = weakest(up);
      const unguarded = up.filter((p) => p.id !== guarded);
      const pick = unguarded.length ? (weakest(unguarded) ?? mark) : mark;
      return {
        intent: "flank",
        targetId: pick?.id ?? null,
        atkMod: 2,
        dmgMod: 0,
        piercesGuard: false,
        skipsAttack: false,
        note: `${enemy.name} breaks off and goes around — it wants ${pick?.name ?? "whoever is bleeding"}, not a fair trade.`,
      };
    }
    case "controller": {
      const mark = brains(up, statsOf);
      return {
        intent: "suppress",
        targetId: mark?.id ?? null,
        atkMod: 0,
        dmgMod: 1,
        piercesGuard: false,
        skipsAttack: false,
        note: `${enemy.name} goes for ${mark?.name ?? "the one talking"} — kill the plan and the rest is noise.`,
      };
    }
    case "pack": {
      const bold = aliveAllies > 0;
      const mark = bold ? weakest(up) : strongest(up);
      return {
        intent: bold ? "press" : "break",
        targetId: mark?.id ?? null,
        atkMod: bold ? aliveAllies : -1,
        dmgMod: bold ? 0 : 2,
        piercesGuard: false,
        skipsAttack: false,
        note: bold
          ? `${enemy.name} presses with the pack — ${aliveAllies} still up and it can feel them.`
          : `${enemy.name} is the last one and stops being careful about it.`,
      };
    }
    case "machine": {
      const mark = topThreatOf(combat, up) ?? strongest(up);
      return {
        intent: "press",
        targetId: mark?.id ?? null,
        atkMod: 1,
        dmgMod: 1,
        piercesGuard: true,
        skipsAttack: false,
        note: `${enemy.name} recalculates and walks at ${mark?.name ?? "the line"}. Nothing about this is personal.`,
      };
    }
    case "warden":
    case "brawler":
    default: {
      const mark = strongest(up);
      const desperate = morale < 45;
      return {
        intent: desperate ? "break" : "press",
        targetId: mark?.id ?? null,
        atkMod: desperate ? -1 : 0,
        dmgMod: desperate ? 2 : 0,
        piercesGuard: false,
        skipsAttack: false,
        note: desperate
          ? `${enemy.name} swings like it has stopped planning on tomorrow.`
          : `${enemy.name} walks straight at ${mark?.name ?? "the biggest thing standing"}.`,
      };
    }
  }
}

/** Bookkeeping the runtime applies after a plan resolves. */
export function tickEnemy(enemy: Combatant, plan: EnemyPlan) {
  if (plan.intent === "aim") {
    enemy.charge = (enemy.charge ?? 0) + 3;
    enemy.cooldown = 0;
  } else if (!plan.skipsAttack) {
    enemy.charge = 0;
    enemy.cooldown = Math.max(0, (enemy.cooldown ?? 0) - 1);
  }
  enemy.intent = plan.intent;
  enemy.markId = plan.targetId ?? undefined;
}
