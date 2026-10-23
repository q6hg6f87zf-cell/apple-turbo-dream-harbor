import type { MissionBeat, MissionKind, StatKey } from "./types";

/** Ordered phases for the elite multi-beat sortie loop. */
export type SortieBeatPhase = "intel" | "approach" | "crisis" | "extract";

export type SortiePlanBeatKind = "check" | "combat" | "loot" | "merchant" | "boss";

export type SortiePlanBeat = {
  id: string;
  phase: SortieBeatPhase;
  title: string;
  kind: SortiePlanBeatKind;
};

export type SortiePlan = {
  version: 1;
  kind: MissionKind;
  beats: SortiePlanBeat[];
};

function beat(id: string, phase: SortieBeatPhase, title: string, kind: SortiePlanBeatKind): SortiePlanBeat {
  return { id, phase, title, kind };
}

/**
 * Deterministic server sortie plan for a mission kind.
 * Crisis is mandatory for raid / bounty / boss; softer kinds stay intel→approach→extract.
 */
export function buildServerSortiePlan(kind: MissionKind): SortiePlan {
  const intel = beat("intel", "intel", "Intel", "check");
  const approach = beat("approach", "approach", "Approach", kind === "trade" ? "merchant" : "check");
  const extract = beat("extract", "extract", kind === "scout" ? "Report" : "Extract", "loot");

  if (kind === "raid") {
    return {
      version: 1,
      kind,
      beats: [intel, approach, beat("crisis", "crisis", "Hold", "combat"), extract],
    };
  }
  if (kind === "bounty") {
    return {
      version: 1,
      kind,
      beats: [intel, approach, beat("crisis", "crisis", "Engage", "combat"), extract],
    };
  }
  if (kind === "boss") {
    return {
      version: 1,
      kind,
      beats: [intel, approach, beat("crisis", "crisis", "The name", "boss"), extract],
    };
  }
  if (kind === "forage") {
    return {
      version: 1,
      kind,
      beats: [intel, approach, beat("haul", "extract", "Haul", "loot")],
    };
  }
  if (kind === "trade") {
    return {
      version: 1,
      kind,
      beats: [intel, approach, beat("walk", "extract", "Walk away", "loot")],
    };
  }
  return {
    version: 1,
    kind: "scout",
    beats: [intel, approach, beat("sweep", "extract", "Sweep", "loot"), beat("report", "extract", "Report", "check")],
  };
}

export function isSortiePlan(value: unknown): value is SortiePlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as SortiePlan;
  return plan.version === 1 && typeof plan.kind === "string" && Array.isArray(plan.beats) && plan.beats.length > 0;
}

const PHASE_STAT: Record<SortieBeatPhase, StatKey> = {
  intel: "INT",
  approach: "WIS",
  crisis: "STR",
  extract: "LCK",
};

/** Map a server sortie plan onto client MissionBeat rows (Canon can deepen prompts later). */
export function missionBeatsFromSortiePlan(plan: SortiePlan, baseDc = 12): MissionBeat[] {
  return plan.beats.map((row) => ({
    id: row.id,
    title: row.title,
    prompt: `${row.title}.`,
    stat: PHASE_STAT[row.phase],
    dc: baseDc,
    kind: row.kind,
  }));
}
