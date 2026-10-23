/**
 * Atlas heat projection — rim / cell intensity + lasting scars from world-pulse beats.
 * Forge tints WorldAtlas / region war-table; Atlas owns the math.
 *
 * Design Bible deepen (1):
 * - Scars + deadZone persist after board cool / boost (those live on the day-board graph).
 * - Heal ONLY via earned settle / DayAdvanced heal mutations (`op: "heal"` or DayAdvanced
 *   heal-flavored reason/copyKey). Cool NEVER reduces scar intensity or clears deadZone.
 */
import type { MissionKind, RegionId } from "./types";
import {
  isScarHealSignal,
  isScarWorthy,
  THEATER_REGIONS,
  type TheaterName,
} from "./world-event-theater";
import type { WorldPulseBeat, WorldPulseState } from "./world-pulse";

export type AtlasHeatScar = {
  /** Cumulative lasting scar score (does not cool with offerMutations). */
  intensity: number;
  theater: TheaterName | string;
  eventId: string;
  at: string;
  kind: MissionKind | null;
  /**
   * Dead zone — BossCleared / high boss scar. Survives board cool forever until
   * an earned heal mutation (or DayAdvanced heal) brings intensity to 0.
   */
  deadZone: boolean;
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

function isDeadZoneWorthy(theater: TheaterName | string, kind: MissionKind | null, intensity: number) {
  if (theater === "BossCleared" || kind === "boss") return true;
  return intensity >= 8;
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
  if (beat.region) {
    const cell = view.cells[beat.region];
    if (cell) {
      cell.heat = clampHeat(cell.heat + beat.heatDelta);
      cell.lastBeatId = beat.eventId;
      cell.lastTheater = beat.theater;
      cell.lastAt = beat.at;

      const scarWorthy =
        beat.scarWorthy || isScarWorthy(beat.theater, beat.kind, beat.heatDelta);
      if (scarWorthy) {
        const bump =
          beat.theater === "BossCleared" || beat.kind === "boss"
            ? Math.max(8, Math.abs(beat.heatDelta))
            : Math.max(3, Math.abs(beat.heatDelta));
        const prev = cell.scar?.intensity ?? 0;
        const intensity = clampScar(prev + bump);
        const deadZone =
          cell.scar?.deadZone === true ||
          isDeadZoneWorthy(beat.theater, beat.kind, intensity);
        cell.scar = {
          intensity,
          theater: beat.theater,
          eventId: beat.eventId,
          at: beat.at,
          kind: beat.kind,
          deadZone,
        };
      }
    }
  }

  // Heal mutations may target any region on the beat — cool never reaches here as heal.
  for (const mut of beat.offerMutations) {
    if (!isScarHealSignal(beat.theater, mut)) continue;
    const cell = view.cells[mut.region];
    if (!cell?.scar) continue;
    const delta =
      typeof mut.weight === "number" && Number.isFinite(mut.weight)
        ? Math.abs(Math.round(mut.weight))
        : Math.max(3, Math.abs(beat.heatDelta) || 3);
    const nextIntensity = clampScar(cell.scar.intensity - delta);
    if (nextIntensity <= 0) {
      cell.scar = null; // earned heal clears deadZone with the scar
    } else {
      cell.scar = {
        ...cell.scar,
        intensity: nextIntensity,
        eventId: beat.eventId,
        at: beat.at,
        theater: beat.theater,
        // deadZone sticks until intensity hits 0
        deadZone: cell.scar.deadZone,
      };
    }
  }
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

/** Dead zone — stays until earned heal clears the scar. */
export function regionIsDeadZone(cell: AtlasHeatCell | undefined): boolean {
  return Boolean(cell?.scar?.deadZone);
}
