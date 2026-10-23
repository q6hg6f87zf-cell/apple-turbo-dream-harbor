/**
 * Atlas heat projection — rim / cell intensity + lasting scars from world-pulse beats.
 * Forge tints WorldAtlas / region war-table; Atlas owns the math.
 * Scars persist after cool/boost offer mutations (those live on the day-board graph).
 */
import type { MissionKind, RegionId } from "./types";
import { isScarWorthy, THEATER_REGIONS, type TheaterName } from "./world-event-theater";
import type { WorldPulseBeat, WorldPulseState } from "./world-pulse";

export type AtlasHeatScar = {
  /** Cumulative lasting scar score (does not cool with offerMutations). */
  intensity: number;
  theater: TheaterName | string;
  eventId: string;
  at: string;
  kind: MissionKind | null;
};

export type AtlasHeatCell = {
  region: RegionId;
  heat: number;
  lastBeatId: string | null;
  lastTheater: string | null;
  lastAt: string | null;
  /** Lasting scar from BossCleared / dense MissionSettled; null until first scar. */
  scar: AtlasHeatScar | null;
};

export type AtlasHeatView = {
  cells: Record<RegionId, AtlasHeatCell>;
  hottest: RegionId | null;
  /** Region with the deepest lasting scar, if any. */
  mostScarred: RegionId | null;
  totalHeat: number;
  totalScar: number;
};

const DECAY_FLOOR = 0;

export function emptyAtlasHeat(): AtlasHeatView {
  const cells = {} as Record<RegionId, AtlasHeatCell>;
  for (const region of THEATER_REGIONS) {
    cells[region] = {
      region,
      heat: 0,
      lastBeatId: null,
      lastTheater: null,
      lastAt: null,
      scar: null,
    };
  }
  return { cells, hottest: null, mostScarred: null, totalHeat: 0, totalScar: 0 };
}

function clampHeat(n: number) {
  return Math.max(DECAY_FLOOR, Math.min(100, Math.round(n)));
}

function clampScar(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Project heat cells + lasting scars from pulse history (newest-first beats). */
export function projectAtlasHeat(pulse: WorldPulseState): AtlasHeatView {
  const view = emptyAtlasHeat();
  const chronological = [...pulse.beats].reverse();
  for (const beat of chronological) {
    applyBeatToHeat(view, beat);
  }
  return finalize(view);
}

function applyBeatToHeat(view: AtlasHeatView, beat: WorldPulseBeat) {
  if (!beat.region) return;
  const cell = view.cells[beat.region];
  if (!cell) return;
  cell.heat = clampHeat(cell.heat + beat.heatDelta);
  cell.lastBeatId = beat.eventId;
  cell.lastTheater = beat.theater;
  cell.lastAt = beat.at;

  const scarWorthy =
    beat.scarWorthy || isScarWorthy(beat.theater, beat.kind, beat.heatDelta);
  if (!scarWorthy) return;

  const bump =
    beat.theater === "BossCleared" || beat.kind === "boss"
      ? Math.max(8, Math.abs(beat.heatDelta))
      : Math.max(3, Math.abs(beat.heatDelta));
  const prev = cell.scar?.intensity ?? 0;
  cell.scar = {
    intensity: clampScar(prev + bump),
    theater: beat.theater,
    eventId: beat.eventId,
    at: beat.at,
    kind: beat.kind,
  };
}

function finalize(view: AtlasHeatView): AtlasHeatView {
  let hottest: RegionId | null = null;
  let mostScarred: RegionId | null = null;
  let bestHeat = -1;
  let bestScar = -1;
  let total = 0;
  let totalScar = 0;
  for (const region of THEATER_REGIONS) {
    const cell = view.cells[region];
    const h = cell.heat;
    total += h;
    if (h > bestHeat) {
      bestHeat = h;
      hottest = region;
    }
    const s = cell.scar?.intensity ?? 0;
    totalScar += s;
    if (s > bestScar) {
      bestScar = s;
      mostScarred = region;
    }
  }
  if (bestHeat <= 0) hottest = null;
  if (bestScar <= 0) mostScarred = null;
  return { ...view, hottest, mostScarred, totalHeat: total, totalScar };
}

export function selectAtlasHeat(pulse: WorldPulseState): AtlasHeatView {
  return projectAtlasHeat(pulse);
}

/** Intensity 0–1 for rim shaders / CSS. */
export function atlasHeatIntensity(cell: AtlasHeatCell | undefined): number {
  if (!cell || cell.heat <= 0) return 0;
  return Math.max(0, Math.min(1, cell.heat / 24));
}

/** Scar intensity 0–1 for lasting rim burns / atlas scars. */
export function atlasScarIntensity(cell: AtlasHeatCell | undefined): number {
  if (!cell?.scar || cell.scar.intensity <= 0) return 0;
  return Math.max(0, Math.min(1, cell.scar.intensity / 24));
}

export function regionIsScarred(cell: AtlasHeatCell | undefined): boolean {
  return Boolean(cell?.scar && cell.scar.intensity > 0);
}
