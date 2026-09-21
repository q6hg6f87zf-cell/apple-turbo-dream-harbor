/**
 * Mission reasoning.
 *
 * A sortie used to be three fixed beats with a stat bolted to each one. It had
 * no reason to exist beyond the button that started it, and nothing that
 * happened inside it could change what happened next.
 *
 * Two things live here. An **objective** says why the squad was sent and what
 * closing it cleanly is worth, and it is drawn from the region's own story
 * thread rather than from the mission kind alone. A **complication** is the
 * run answering back: a fumble, a hot Kane trail, a breach approach, a wounded
 * line — each of those can inject a beat mid-run that the deploy screen never
 * showed you. Runs stop being the same shape every time.
 */
import { locById, villainById } from "./data";
import { approachById, KANE_STAKES, locationToRegion, poiById, tacticsFor } from "./field-ops";
import { REGION_THREADS, threadStage } from "./recon";
import type {
  GameState,
  LocationId,
  MissionBeat,
  MissionKind,
  MissionObjective,
  MissionState,
  Operative,
  ReconLead,
  RollBand,
  StatKey,
} from "./types";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/* ------------------------------------------------------------------ *
 * Objectives
 * ------------------------------------------------------------------ */

const KIND_OBJECTIVE: Record<
  MissionKind,
  { title: string; detail: (where: string, stake: string) => string; bonus: number }
> = {
  scout: {
    title: "Come home with a picture",
    detail: (where, stake) =>
      `Read ${where} without being read. Every beat hit is one more thing SYNAPSE knows before Kane does — and ${stake.toLowerCase()} is what he is counting.`,
    bonus: 90,
  },
  forage: {
    title: "Fill the racks",
    detail: (where, stake) =>
      `Pull salvage out of ${where} faster than it can object. The forge eats stock, and ${stake.toLowerCase()} is the one thing here with a buyer.`,
    bonus: 120,
  },
  raid: {
    title: "Take it before the receipt clears",
    detail: (where, stake) =>
      `Hit ${where} while the load is still on the ground. ${stake} — take it and Kane's week gets shorter.`,
    bonus: 240,
  },
  trade: {
    title: "Leave with the better half",
    detail: (where) =>
      `Deal at ${where} and walk out ahead. Price is a conversation, and the Realm respects whoever stops talking first.`,
    bonus: 140,
  },
  bounty: {
    title: "Close the contract",
    detail: (where) =>
      `The board named something at ${where}. Names on the board get quieter when somebody collects on them.`,
    bonus: 200,
  },
  boss: {
    title: "End the arc",
    detail: (where) =>
      `${where} has a name holding it. The Realm does not let you kill them twice, so do it once and do it properly.`,
    bonus: 500,
  },
};

export function objectiveFor(
  state: GameState,
  loc: LocationId,
  kind: MissionKind,
  lead: ReconLead | null,
  poiId?: string,
): MissionObjective {
  const L = locById(loc);
  const regionId = locationToRegion(loc);
  const poi = poiById(loc, poiId);
  const where = poi?.name ?? L.short;
  const stake = regionId ? KANE_STAKES[regionId].resource : "The Realm";
  const thread = REGION_THREADS.find((t) => t.regionId === regionId);
  const stage = regionId ? threadStage(state, regionId) : 0;

  if (lead) {
    return {
      id: uid("obj"),
      title: lead.title,
      detail: `${lead.detail} ${lead.read}`,
      thread: thread?.title,
      bonus: lead.capsBonus,
    };
  }

  const shape = KIND_OBJECTIVE[kind];
  const threadLine = thread ? ` ${thread.title}: ${thread.stages[stage]}` : "";
  return {
    id: uid("obj"),
    title: shape.title,
    detail: `${shape.detail(where, stake)}${threadLine}`,
    thread: thread?.title,
    bonus: shape.bonus,
  };
}

/* ------------------------------------------------------------------ *
 * Beat construction
 * ------------------------------------------------------------------ */

/**
 * Why a beat is in the run, in one line. The deploy screen promises a job;
 * this is the part that tells the player which part of the job they are in.
 */
export function beatWhy(kind: MissionKind, title: string, objective: MissionObjective | undefined): string {
  const map: Record<string, string> = {
    Approach: "Get eyes on before anything gets eyes on you.",
    Sweep: "The part that pays. Find what the ground is holding.",
    Report: "Intel is only intel once it is back inside the wire.",
    Range: "Spread out. Cover more ground than the thing watching you can.",
    Haul: "Carrying is the dangerous half. Loaded squads move like targets.",
    Ambush: "This was always going to happen. It is happening now.",
    Breach: "The loud second. Everything after this is a clock.",
    Hold: "Somebody has to be the door. That somebody is standing here.",
    Extract: "Caps do not walk. Neither do the wounded, unaided.",
    Haggle: "Price is a conversation with a knife in the room.",
    "Walk away": "The best deal is the one you can leave.",
    Track: "Find the mark before the mark finds the contract.",
    Engage: "No speeches. The contract is the speech.",
    Threshold: "Cross it and the arc does not rewind.",
    "The name": "Phases are not flavour. They are how it refuses to stop.",
  };
  return map[title] ?? objective?.title ?? `Work ${title.toLowerCase()} and keep the line intact.`;
}

/* ------------------------------------------------------------------ *
 * Complications
 * ------------------------------------------------------------------ */

type ComplicationSpec = {
  id: string;
  title: string;
  prompt: string;
  why: string;
  stat: StatKey;
  dcMod: number;
  kind: MissionBeat["kind"];
  /** Fires only when this returns true. */
  when: (ctx: ComplicationContext) => boolean;
  weight: number;
};

export interface ComplicationContext {
  state: GameState;
  mission: MissionState;
  band: RollBand;
  hit: boolean;
  lead: Operative | undefined;
  heat: number;
  hurt: boolean;
  remaining: number;
}

const COMPLICATIONS: ComplicationSpec[] = [
  {
    id: "aegis-intercept",
    title: "AEGIS intercept",
    prompt:
      "A 2753 frame drops onto the approach road and starts walking the line the squad just used. It is not hunting. It is confirming.",
    why: "Kane's heat is high enough that the program is running intercepts on this frontier.",
    stat: "SPD",
    dcMod: 1,
    kind: "check",
    when: (c) => c.heat >= 12 && c.remaining > 0,
    weight: 3,
  },
  {
    id: "pack-counter",
    title: "The Pack counts you",
    prompt:
      "Ashen sign on the high ground, and it moved when the squad moved. Gravenor's people do not rush. They tally.",
    why: "A loud run in Ironclad gets noticed by whoever already owns the hills.",
    stat: "WIS",
    dcMod: 0,
    kind: "check",
    when: (c) => c.mission.locationId === "ironclad" && !c.hit && c.remaining > 0,
    weight: 2,
  },
  {
    id: "blown-cover",
    title: "Cover is blown",
    prompt:
      "Somebody shouted, and the wrong somebody heard it. The quiet version of this job is over.",
    why: "A fumble on the ground does not stay on the ground.",
    stat: "SPD",
    dcMod: 2,
    kind: "combat",
    when: (c) => c.band === "fumble",
    weight: 4,
  },
  {
    id: "wounded-line",
    title: "Carry the wounded",
    prompt:
      "Someone on the line cannot make the next stretch under their own power. The squad slows to the speed of its worst body.",
    why: "The line is hurt, and the Realm charges interest on hurt.",
    stat: "STR",
    dcMod: 0,
    kind: "check",
    when: (c) => c.hurt && c.remaining > 0,
    weight: 2,
  },
  {
    id: "second-cache",
    title: "A second cache",
    prompt:
      "Under the first one, sealed differently, packed by somebody who expected to be robbed. That is a good sign and a bad sign.",
    why: "A strong sweep finds the thing the first sweep was hiding.",
    stat: "LCK",
    dcMod: -1,
    kind: "loot",
    when: (c) => (c.band === "strong" || c.band === "crit") && c.remaining > 0,
    weight: 3,
  },
  {
    id: "kane-surveyor",
    title: "Kane's surveyor",
    prompt:
      "A surveyor in clean boots is standing where nobody in clean boots should be, writing in a book, entirely unbothered by the squad.",
    why: "Every region on the board is being priced for a jump stack. Here is the person doing the pricing.",
    stat: "CHA",
    dcMod: 0,
    kind: "check",
    when: (c) => c.heat >= 5 && c.remaining > 0,
    weight: 2,
  },
  {
    id: "breach-answer",
    title: "They answer the breach",
    prompt:
      "Kicking a door is a message, and somebody inside has decided to reply in the same language.",
    why: "Breach buys the haul and sells the quiet.",
    stat: "STR",
    dcMod: 1,
    kind: "combat",
    when: (c) => c.mission.approach === "breach" && c.remaining > 0,
    weight: 3,
  },
];

/**
 * Roll for a mid-run complication. At most one per beat, never the same one
 * twice in a run, and never on the last beat — a run has to be able to end.
 */
export function complicationFor(ctx: ComplicationContext): MissionBeat | null {
  const { mission } = ctx;
  if (ctx.remaining <= 0) return null;
  const fired = new Set(mission.fired ?? []);
  const pool = COMPLICATIONS.filter((c) => !fired.has(c.id) && c.when(ctx));
  if (!pool.length) return null;

  const approach = approachById(mission.approach);
  const base = 0.16 + (ctx.band === "fumble" ? 0.4 : 0) + (ctx.heat >= 12 ? 0.12 : 0) + approach.heat * 0.02;
  if (Math.random() > clamp(base, 0, 0.72)) return null;

  const total = pool.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * total;
  const picked = pool.find((c) => (roll -= c.weight) <= 0) ?? pool[0];
  const L = locById(mission.locationId);
  const v = villainById(L.bossId);

  return {
    id: uid("bt"),
    title: picked.title,
    prompt:
      picked.id === "pack-counter" && v
        ? `${picked.prompt} ${v.name} has been letting this ground run for a reason.`
        : picked.prompt,
    why: picked.why,
    stat: picked.stat,
    dc: clamp((mission.beats[mission.beatIndex]?.dc ?? 12) + picked.dcMod, 8, 19),
    kind: picked.kind,
    injected: true,
    tactics: tacticsFor({
      beatKind: picked.kind,
      approach: mission.approach ?? "standard",
      leadStat: (ctx.lead ? picked.stat : picked.stat) as StatKey,
    }),
  };
}

export function markFired(mission: MissionState, beatTitle: string) {
  const spec = COMPLICATIONS.find((c) => c.title === beatTitle);
  if (!spec) return;
  mission.fired = [...(mission.fired ?? []), spec.id];
}

/** Did the run do what it was sent to do? */
export function objectiveMet(mission: MissionState): boolean {
  const hits = mission.hits ?? 0;
  const misses = mission.misses ?? 0;
  if (!hits && !misses) return false;
  return misses === 0 || hits >= misses * 2;
}
