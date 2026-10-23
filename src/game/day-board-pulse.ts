/**
 * Day-board pulse strip — recent campaign theater beats for Forge DayBoard.
 */
import type { TheaterBeatId, TheaterName } from "./world-event-theater";
import type { WorldPulseBeat, WorldPulseState } from "./world-pulse";
import { selectRecentBeats } from "./world-pulse";

export type DayBoardPulseItem = {
  id: string;
  theater: TheaterName;
  beatId: TheaterBeatId;
  headline: string;
  /** Mythos stake under headline */
  subline: string;
  radio: string;
  region: string | null;
  at: string;
  campaignRevision: number;
  /** Ember / danger / muted cue for Forge strip styling */
  tone: "ember" | "danger" | "moon" | "muted";
};

export type DayBoardPulseStrip = {
  items: DayBoardPulseItem[];
  latestBeatId: TheaterBeatId | null;
  campaignRevision: number;
};

function toneFor(beat: WorldPulseBeat): DayBoardPulseItem["tone"] {
  if (beat.theater === "BossCleared" || beat.beatId === "boss_clear") return "danger";
  if (beat.beatId === "vault_flash" || beat.beatId === "intel_drop") return "ember";
  if (beat.theater === "MissionFailed" || beat.theater === "BossFailed") return "muted";
  if (beat.theater === "RaidOpened") return "moon";
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

/** Strip feed for DayBoard — newest first, capped. */
export function selectDayBoardPulse(pulse: WorldPulseState, limit = 6): DayBoardPulseStrip {
  const beats = selectRecentBeats(pulse, limit);
  const items = beats.map(toDayBoardPulseItem);
  return {
    items,
    latestBeatId: items[0]?.beatId ?? null,
    campaignRevision: pulse.campaignRevision,
  };
}

/** True when Forge should prioritize vault flash / intel VFX. */
export function dayBoardNeedsSpectacle(strip: DayBoardPulseStrip): boolean {
  const id = strip.latestBeatId;
  return id === "vault_flash" || id === "intel_drop" || id === "boss_clear";
}
