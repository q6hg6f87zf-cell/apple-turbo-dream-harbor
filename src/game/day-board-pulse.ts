/**
 * Day-board pulse strip + next-offer graph — recent campaign theater beats for Forge DayBoard.
 * Offer graph applies Vault worldConsequence.offerMutations (boost | unlock | cool | heal).
 * DayAdvanced + crisis/raid mutations rewrite strip/next-offer in the same projection pass.
 * Copy strings stay in Mythos theaterCopyFor; copyKey is an optional selectable hook only.
 * Board cool never touches atlas scars (Atlas heat owns deadZone / heal).
 */
import type { MissionKind, RegionId } from "./types";
import { THEATER_REGIONS, type OfferMutation, type TheaterBeatId, type TheaterName } from "./world-event-theater";
import type { WorldPulseBeat, WorldPulseState } from "./world-pulse";
import { selectRecentBeats } from "./world-pulse";

export type DayBoardPulseItem = {
  id: string;
  theater: TheaterName;
  beatId: TheaterBeatId;
  headline: string;
  subline: string;
  radio: string;
  region: string | null;
  at: string;
  campaignRevision: number;
  tone: "ember" | "danger" | "moon" | "muted";
};

export type DayBoardPulseStrip = {
  items: DayBoardPulseItem[];
  latestBeatId: TheaterBeatId | null;
  campaignRevision: number;
};

export type DayBoardOfferNode = {
  region: RegionId;
  weight: number;
  unlocked: boolean;
  cooled: boolean;
  kinds: MissionKind[];
  reasons: string[];
  /** Mythos selectable keys only — Forge/Mythos resolve; Atlas does not invent copy. */
  copyKeys: string[];
};

export type DayBoardOfferEdge = {
  op: OfferMutation["op"];
  region: RegionId;
  kinds: MissionKind[] | null;
  weight: number | null;
  reason: string;
  copyKey: string | null;
  sourceEventId: string;
  at: string;
  theater: TheaterName;
};

export type DayBoardOfferGraph = {
  edges: DayBoardOfferEdge[];
  byRegion: Record<RegionId, DayBoardOfferNode>;
  pendingUnlocks: RegionId[];
  cooledRegions: RegionId[];
};

function toneFor(beat: WorldPulseBeat): DayBoardPulseItem["tone"] {
  if (beat.theater === "BossCleared" || beat.beatId === "boss_clear") return "danger";
  if (beat.beatId === "vault_flash" || beat.beatId === "intel_drop") return "ember";
  if (beat.theater === "MissionFailed" || beat.theater === "BossFailed") return "muted";
  if (beat.theater === "RaidOpened") return "moon";
  if (beat.theater === "DayAdvanced" || beat.beatId === "day_advance") return "moon";
  return "ember";
}

export function toDayBoardPulseItem(beat: WorldPulseBeat): DayBoardPulseItem {
  return {
    id: beat.eventId,
    theater: beat.theater,
    beatId: beat.beatId,
    headline: beat.headline,
    subline: beat.subline,
    radio: beat.radio,
    region: beat.region,
    at: beat.at,
    campaignRevision: beat.campaignRevision,
    tone: toneFor(beat),
  };
}

export function selectDayBoardPulse(pulse: WorldPulseState, limit = 6): DayBoardPulseStrip {
  const beats = selectRecentBeats(pulse, limit);
  const items = beats.map(toDayBoardPulseItem);
  return {
    items,
    latestBeatId: items[0]?.beatId ?? null,
    campaignRevision: pulse.campaignRevision,
  };
}

export function dayBoardNeedsSpectacle(strip: DayBoardPulseStrip): boolean {
  const id = strip.latestBeatId;
  return id === "vault_flash" || id === "intel_drop" || id === "boss_clear";
}

function emptyOfferNode(region: RegionId): DayBoardOfferNode {
  return {
    region,
    weight: 0,
    unlocked: false,
    cooled: false,
    kinds: [],
    reasons: [],
    copyKeys: [],
  };
}

function emptyOfferGraph(): DayBoardOfferGraph {
  const byRegion = {} as Record<RegionId, DayBoardOfferNode>;
  for (const region of THEATER_REGIONS) {
    byRegion[region] = emptyOfferNode(region);
  }
  return { edges: [], byRegion, pendingUnlocks: [], cooledRegions: [] };
}

function mergeKinds(into: MissionKind[], add: MissionKind[] | undefined) {
  if (!add?.length) return;
  for (const k of add) {
    if (!into.includes(k)) into.push(k);
  }
}

export function applyOfferMutation(
  graph: DayBoardOfferGraph,
  mut: OfferMutation,
  meta: { sourceEventId: string; at: string; theater: TheaterName },
): void {
  const node = graph.byRegion[mut.region];
  if (!node) return;

  const delta =
    typeof mut.weight === "number" && Number.isFinite(mut.weight)
      ? mut.weight
      : mut.op === "boost"
        ? 2
        : mut.op === "cool"
          ? -2
          : mut.op === "unlock"
            ? 1
            : mut.op === "heal"
              ? 1
              : 0;

  if (mut.op === "boost") {
    node.weight += Math.abs(delta) || 2;
    node.cooled = node.weight < 0;
  } else if (mut.op === "cool") {
    // Board cool only — never clears atlas scars / deadZone (Atlas heat owns that).
    node.weight -= Math.abs(delta) || 2;
    node.cooled = true;
  } else if (mut.op === "unlock") {
    if (!node.unlocked) {
      node.unlocked = true;
      if (!graph.pendingUnlocks.includes(mut.region)) {
        graph.pendingUnlocks.push(mut.region);
      }
    }
    if (delta) node.weight += Math.abs(delta);
  } else if (mut.op === "heal") {
    // Earned heal on the offer graph: lift cool flag + slight weight restore.
    // Scar / deadZone clearing happens in atlas-heat, not here.
    node.cooled = false;
    node.weight += Math.abs(delta) || 1;
  }

  mergeKinds(node.kinds, mut.kinds);
  if (mut.reason && !node.reasons.includes(mut.reason)) {
    node.reasons.push(mut.reason);
  }
  if (mut.copyKey && !node.copyKeys.includes(mut.copyKey)) {
    node.copyKeys.push(mut.copyKey);
  }

  graph.edges.push({
    op: mut.op,
    region: mut.region,
    kinds: mut.kinds ?? null,
    weight: typeof mut.weight === "number" ? mut.weight : null,
    reason: mut.reason,
    copyKey: mut.copyKey ?? null,
    sourceEventId: meta.sourceEventId,
    at: meta.at,
    theater: meta.theater,
  });
}

export function projectDayBoardOfferGraph(pulse: WorldPulseState): DayBoardOfferGraph {
  const graph = emptyOfferGraph();
  const chronological = [...pulse.beats].reverse();
  for (const beat of chronological) {
    for (const mut of beat.offerMutations) {
      applyOfferMutation(graph, mut, {
        sourceEventId: beat.eventId,
        at: beat.at,
        theater: beat.theater,
      });
    }
  }
  graph.cooledRegions = THEATER_REGIONS.filter(
    (r) => graph.byRegion[r].cooled || graph.byRegion[r].weight < 0,
  );
  return graph;
}

export function selectDayBoardOfferGraph(pulse: WorldPulseState): DayBoardOfferGraph {
  return projectDayBoardOfferGraph(pulse);
}

/** Optional Mythos selectable key passthrough — Atlas never rewrites copy strings. */
export function offerCopyKeyHook(copyKey: string | null | undefined): string | null {
  if (typeof copyKey !== "string") return null;
  const key = copyKey.trim();
  return key ? key.slice(0, 64) : null;
}
