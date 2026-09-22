/**
 * Lightweight narrative-state layer for Hollow Realm.
 * Typed flags + journal helpers. Event-driven — never polled every frame.
 * Extends existing kaneHeat / metCast / tyrone.story without replacing them.
 */
import type { GameState, LocationId, RegionId } from "./types";

export const NARRATIVE_FLAG_IDS = [
  // Prologue / awakening
  "wake_complete",
  "tyrone_found_you",
  "file_cut",
  "first_sortie_done",
  "first_dawn_survived",
  // Act I — Ironclad invoice
  "rail_cut_scouted",
  "rail_cut_foraged",
  "kane_weigh_in_seen",
  "lyra_ridge_handled",
  "lyra_fought",
  "lyra_hid",
  "lyra_lied",
  "gate_watched",
  "travis_met",
  "travis_bay_used",
  "ironclad_gate_saved",
  "ironclad_gate_lost",
  // Act II — regional pressure
  "slag_entered",
  "blackspire_entered",
  "brasswater_entered",
  "veyra_glimpsed",
  "caravan_investigated",
  "caravan_survived",
  "caravan_staged",
  "caravan_abandoned",
  "aegis_contact_survived",
  "orion_spoken",
  "vera_manifest_shown",
  "drake_turned_away",
  // Act III — Project Vesper
  "vesper_named",
  "halo_yard_scouted",
  "t0880_secret_hinted",
  "tyrone_secret_03_discovered",
  "kane_invoice_stolen",
  "project_vesper_partial",
  // Late / endings seeds
  "blackspire_alliance",
  "brasswater_debt_unpaid",
  "vault13_power_restored",
  "tyrone_trust_broken",
  "tyrone_loyalty_high",
  "ending_ready",
] as const;

export type NarrativeFlagId = (typeof NARRATIVE_FLAG_IDS)[number];

export type StoryActId =
  | "prologue"
  | "act_i"
  | "act_ii"
  | "act_iii"
  | "convergence"
  | "ending";

export type StoryBeatStatus = "locked" | "available" | "active" | "done" | "failed" | "skipped";

export interface StoryBeatProgress {
  id: string;
  status: StoryBeatStatus;
  day?: number;
  choiceId?: string;
  note?: string;
}

export interface NarrativeJournalEntry {
  id: string;
  day: number;
  title: string;
  body: string;
  act: StoryActId;
  tags: string[];
}

export interface FactionStanding {
  kane: number;
  aegis: number;
  ironclad: number;
  pack: number;
  union: number;
  vault13: number;
}

export interface NarrativeState {
  act: StoryActId;
  flags: Partial<Record<NarrativeFlagId, boolean>>;
  beats: Record<string, StoryBeatProgress>;
  journal: NarrativeJournalEntry[];
  factions: FactionStanding;
  discoveries: string[];
  scenarioLog: string[];
  endingId: string | null;
}

export const DEFAULT_FACTIONS: FactionStanding = {
  kane: 0,
  aegis: -2,
  ironclad: 8,
  pack: 0,
  union: 2,
  vault13: 12,
};

export function emptyNarrative(): NarrativeState {
  return {
    act: "prologue",
    flags: {},
    beats: {},
    journal: [],
    factions: { ...DEFAULT_FACTIONS },
    discoveries: [],
    scenarioLog: [],
    endingId: null,
  };
}

export function restoreNarrative(raw: unknown): NarrativeState {
  const base = emptyNarrative();
  if (!raw || typeof raw !== "object") return base;
  const n = raw as Partial<NarrativeState>;
  const acts: StoryActId[] = ["prologue", "act_i", "act_ii", "act_iii", "convergence", "ending"];
  const act = acts.includes(n.act as StoryActId) ? (n.act as StoryActId) : "prologue";
  const flags: NarrativeState["flags"] = {};
  if (n.flags && typeof n.flags === "object") {
    for (const id of NARRATIVE_FLAG_IDS) {
      if ((n.flags as Record<string, unknown>)[id] === true) flags[id] = true;
    }
  }
  const beats: Record<string, StoryBeatProgress> = {};
  if (n.beats && typeof n.beats === "object") {
    for (const [id, row] of Object.entries(n.beats)) {
      if (!row || typeof row !== "object") continue;
      const r = row as StoryBeatProgress;
      beats[id] = {
        id,
        status: r.status ?? "locked",
        day: typeof r.day === "number" ? r.day : undefined,
        choiceId: typeof r.choiceId === "string" ? r.choiceId : undefined,
        note: typeof r.note === "string" ? r.note : undefined,
      };
    }
  }
  return {
    act,
    flags,
    beats,
    journal: Array.isArray(n.journal)
      ? n.journal
          .filter((e): e is NarrativeJournalEntry => !!e && typeof e === "object" && typeof e.id === "string")
          .slice(-48)
      : [],
    factions: { ...DEFAULT_FACTIONS, ...(n.factions ?? {}) },
    discoveries: Array.isArray(n.discoveries) ? n.discoveries.map(String).slice(-64) : [],
    scenarioLog: Array.isArray(n.scenarioLog) ? n.scenarioLog.map(String).slice(-32) : [],
    endingId: typeof n.endingId === "string" ? n.endingId : null,
  };
}

export function hasFlag(state: GameState, id: NarrativeFlagId): boolean {
  return !!state.narrative?.flags[id];
}

export function setFlag(state: GameState, id: NarrativeFlagId, value = true): boolean {
  const n = ensureNarrative(state);
  const prev = !!n.flags[id];
  if (value) n.flags[id] = true;
  else delete n.flags[id];
  return prev !== value;
}

export function ensureNarrative(state: GameState): NarrativeState {
  if (!state.narrative) state.narrative = emptyNarrative();
  return state.narrative as NarrativeState;
}

export function bumpFaction(
  state: GameState,
  key: keyof FactionStanding,
  delta: number,
): number {
  const n = ensureNarrative(state);
  n.factions[key] = Math.max(-40, Math.min(40, (n.factions[key] ?? 0) + delta));
  return n.factions[key];
}

export function addJournal(
  state: GameState,
  entry: Omit<NarrativeJournalEntry, "id" | "day"> & { id?: string; day?: number },
) {
  const n = ensureNarrative(state);
  const id = entry.id ?? `j-${state.day}-${n.journal.length}-${entry.title.slice(0, 12)}`;
  if (n.journal.some((e) => e.id === id)) return;
  n.journal = [
    {
      id,
      day: entry.day ?? state.day,
      title: entry.title,
      body: entry.body,
      act: entry.act,
      tags: entry.tags ?? [],
    },
    ...n.journal,
  ].slice(0, 48);
}

export function recordDiscovery(state: GameState, label: string) {
  const n = ensureNarrative(state);
  if (n.discoveries.includes(label)) return;
  n.discoveries = [...n.discoveries, label].slice(-64);
}

export function setBeat(
  state: GameState,
  id: string,
  patch: Partial<StoryBeatProgress>,
) {
  const n = ensureNarrative(state);
  const prev = n.beats[id] ?? { id, status: "locked" as StoryBeatStatus };
  n.beats[id] = { ...prev, ...patch, id };
}

export function beatStatus(state: GameState, id: string): StoryBeatStatus {
  const status = state.narrative?.beats[id]?.status;
  if (
    status === "locked" ||
    status === "available" ||
    status === "active" ||
    status === "done" ||
    status === "failed" ||
    status === "skipped"
  ) {
    return status;
  }
  return "locked";
}

export type NarrativeCheck =
  | { type: "flag"; id: NarrativeFlagId; value?: boolean }
  | { type: "not_flag"; id: NarrativeFlagId }
  | { type: "act"; id: StoryActId }
  | { type: "min_day"; day: number }
  | { type: "max_day"; day: number }
  | { type: "kane_heat_gte"; n: number }
  | { type: "kane_heat_lt"; n: number }
  | { type: "faction"; key: keyof FactionStanding; gte?: number; lte?: number }
  | { type: "tyrone_trust_gte"; n: number }
  | { type: "tyrone_loyalty_gte"; n: number }
  | { type: "met_cast"; id: string }
  | { type: "location_unlocked"; id: LocationId }
  | { type: "poi_discovered"; loc: LocationId; poiId: string }
  | { type: "region_intel_gte"; loc: LocationId; n: number }
  | { type: "tutorial_done" }
  | { type: "character_forged" }
  | { type: "beat"; id: string; status: StoryBeatStatus }
  | { type: "all"; of: NarrativeCheck[] }
  | { type: "any"; of: NarrativeCheck[] };

export function checkNarrative(state: GameState, check: NarrativeCheck): boolean {
  switch (check.type) {
    case "flag":
      return hasFlag(state, check.id) === (check.value !== false);
    case "not_flag":
      return !hasFlag(state, check.id);
    case "act":
      return (state.narrative?.act ?? "prologue") === check.id;
    case "min_day":
      return state.day >= check.day;
    case "max_day":
      return state.day <= check.day;
    case "kane_heat_gte":
      return (state.kaneHeat ?? 0) >= check.n;
    case "kane_heat_lt":
      return (state.kaneHeat ?? 0) < check.n;
    case "faction": {
      const v = state.narrative?.factions[check.key] ?? DEFAULT_FACTIONS[check.key];
      if (check.gte != null && v < check.gte) return false;
      if (check.lte != null && v > check.lte) return false;
      return true;
    }
    case "tyrone_trust_gte":
      return (state.tyrone?.relationship.trust ?? 0) >= check.n;
    case "tyrone_loyalty_gte":
      return (state.tyrone?.relationship.loyalty ?? 0) >= check.n;
    case "met_cast":
      return (state.metCast ?? []).includes(check.id);
    case "location_unlocked":
      return !!state.locations[check.id]?.unlocked;
    case "poi_discovered":
      return (state.locations[check.loc]?.discoveredPois ?? []).includes(check.poiId);
    case "region_intel_gte":
      return (state.locations[check.loc]?.intel ?? 0) >= check.n;
    case "tutorial_done":
      return state.tutorial === "done";
    case "character_forged":
      return state.operatives.some((o) => o.status !== "dead");
    case "beat":
      return beatStatus(state, check.id) === check.status;
    case "all":
      return check.of.every((c) => checkNarrative(state, c));
    case "any":
      return check.of.some((c) => checkNarrative(state, c));
    default:
      return false;
  }
}

export function checksPass(state: GameState, checks?: NarrativeCheck[]): boolean {
  if (!checks || !checks.length) return true;
  return checks.every((c) => checkNarrative(state, c));
}

/** Infer act from existing campaign state for old saves without narrative. */
export function inferActFromWorld(state: GameState): StoryActId {
  if (state.narrative?.endingId) return "ending";
  const heat = state.kaneHeat ?? 0;
  const forged = state.operatives.some((o) => o.status !== "dead");
  if (!state.started || !forged) return "prologue";
  if (state.locations.veyra?.unlocked || heat >= 22) return "act_iii";
  if (
    state.locations.kingdom?.unlocked ||
    state.locations.caverns?.unlocked ||
    state.locations.library?.unlocked ||
    heat >= 12
  ) {
    return "act_ii";
  }
  if (state.day >= 2 || (state.locations.ironclad?.missions ?? 0) >= 1) return "act_i";
  return "prologue";
}

export function regionThemeId(region: RegionId | null | undefined): string {
  switch (region) {
    case "ironclad":
      return "ironclad";
    case "slagtown":
      return "slag";
    case "blackspire":
      return "blackspire";
    case "brasswater":
      return "brasswater";
    case "veyra":
      return "veyra";
    default:
      return "vault13";
  }
}
