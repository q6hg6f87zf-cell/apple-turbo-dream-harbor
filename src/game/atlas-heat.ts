/**
 * Atlas heat projection — rim / cell intensity from world-pulse beats.
 * Forge tints WorldAtlas / region war-table; Atlas owns the math.
 */
import type { RegionId } from "./types";
import { THEATER_REGIONS } from "./world-event-theater";
import type { WorldPulseBeat, WorldPulseState } from "./world-pulse";

export type AtlasHeatCell = {
  region: RegionId;
  heat: number;
  lastBeatId: string | null;
  lastTheater: string | null;
  lastAt: string | null;
};

export type AtlasHeatView = {
  cells: Record<RegionId, AtlasHeatCell>;
  hottest: RegionId | null;
  totalHeat: number;
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
    };
  }
  return { cells, hottest: null, totalHeat: 0 };
}

function clampHeat(n: number) {
  return Math.max(DECAY_FLOOR, Math.min(100, Math.round(n)));
}

/** Project heat cells from pulse history (newest-first beats). */
export function projectAtlasHeat(pulse: WorldPulseState): AtlasHeatView {
  const view = emptyAtlasHeat();
  // Apply oldest → newest so latest metadata wins while summing deltas.
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
}

function finalize(view: AtlasHeatView): AtlasHeatView {
  let hottest: RegionId | null = null;
  let best = -1;
  let total = 0;
  for (const region of THEATER_REGIONS) {
    const h = view.cells[region].heat;
    total += h;
    if (h > best) {
      best = h;
      hottest = region;
    }
  }
  if (best <= 0) hottest = null;
  return { ...view, hottest, totalHeat: total };
}

export function selectAtlasHeat(pulse: WorldPulseState): AtlasHeatView {
  return projectAtlasHeat(pulse);
}

/** Intensity 0–1 for rim shaders / CSS. */
export function atlasHeatIntensity(cell: AtlasHeatCell | undefined): number {
  if (!cell || cell.heat <= 0) return 0;
  return Math.max(0, Math.min(1, cell.heat / 24));
}
