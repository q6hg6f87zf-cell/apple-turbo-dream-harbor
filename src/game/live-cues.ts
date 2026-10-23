/**
 * Resonance live theater cues — maps Pulse SSE `eventType` → Web Audio SFX.
 * Fanout only: never invents balances; plays on Forge/Pulse revision path.
 */
import { sfx } from "./audio";
import { LIVE_EVENT_TYPES, type LiveEventType, normalizeLiveEventType } from "./server-live";

/** Stable cue ids for the audio cue map (docs/AUDIO_CUE_MAP.md). */
export const LIVE_CUE_IDS = [
  "mission.settled",
  "transfer.settled",
  "boss.cleared",
  "raid.opened",
  "ui.confirm",
] as const;

export type LiveCueId = (typeof LIVE_CUE_IDS)[number];

export const EVENT_TYPE_TO_CUE: Record<LiveEventType, LiveCueId> = {
  MissionSettled: "mission.settled",
  TransferSettled: "transfer.settled",
  BossCleared: "boss.cleared",
  RaidOpened: "raid.opened",
};

/** Resolve a Pulse revision `eventType` to a cue id (undefined if unknown). */
export function cueIdForLiveEvent(raw: unknown): LiveCueId | undefined {
  const eventType = normalizeLiveEventType(raw);
  return eventType ? EVENT_TYPE_TO_CUE[eventType] : undefined;
}

/**
 * Play the theater SFX for a live revision beat.
 * Safe no-op when muted, AudioContext unavailable, or eventType unknown.
 * First integrated settle: MissionSettled → mission.settled (win + soft lock).
 */
export function playLiveEventCue(raw: unknown): LiveCueId | undefined {
  const cueId = cueIdForLiveEvent(raw);
  if (!cueId) return undefined;
  playCue(cueId);
  return cueId;
}

export function playCue(cueId: LiveCueId): void {
  switch (cueId) {
    case "mission.settled":
      // Elite settle payoff: confirm + soft lock-in (Kenney samples with synth fallback).
      sfx.win();
      window.setTimeout(() => sfx.lockIn(), 90);
      break;
    case "transfer.settled":
      sfx.coin();
      window.setTimeout(() => sfx.lockIn(), 70);
      break;
    case "boss.cleared":
      sfx.jackpot();
      break;
    case "raid.opened":
      sfx.deploy();
      break;
    case "ui.confirm":
      sfx.click();
      break;
    default: {
      const _exhaustive: never = cueId;
      void _exhaustive;
    }
  }
}

/** Allowlist mirror for tests / docs — same order as LIVE_EVENT_TYPES. */
export function liveEventTypesForCues(): readonly LiveEventType[] {
  return LIVE_EVENT_TYPES;
}
