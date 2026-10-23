/**
 * Resonance live theater cues — Pulse SSE `eventType` + Forge/Atlas snake beatIds → Web Audio SFX.
 * Fanout only: never invents balances; never owns revision/applySnapshot.
 */
import { sfx } from "./audio";
import { LIVE_EVENT_TYPES, type LiveEventType, normalizeLiveEventType } from "./server-live";

/** Stable cue ids for the audio cue map (docs/AUDIO_CUE_MAP.md). */
export const LIVE_CUE_IDS = [
  "mission.settled",
  "transfer.settled",
  "boss.cleared",
  "raid.opened",
  "vault.flash",
  "intel.drop",
  "ui.confirm",
] as const;

export type LiveCueId = (typeof LIVE_CUE_IDS)[number];

/** Pulse SSE PascalCase eventType → cue (ServerLiveRuntime path — keep for #15). */
export const EVENT_TYPE_TO_CUE: Record<LiveEventType, LiveCueId> = {
  MissionSettled: "mission.settled",
  TransferSettled: "transfer.settled",
  BossCleared: "boss.cleared",
  RaidOpened: "raid.opened",
};

/**
 * Forge VFX queue / Atlas snake beatIds → cue.
 * MissionSettled success stays on SSE eventType (`playLiveEventCue`), not a beatId.
 */
export const ATLAS_BEAT_IDS = ["vault_flash", "intel_drop", "boss_clear", "raid_opened"] as const;
export type AtlasBeatId = (typeof ATLAS_BEAT_IDS)[number];

export const ATLAS_BEAT_ID_TO_CUE: Record<AtlasBeatId, LiveCueId> = {
  vault_flash: "vault.flash",
  intel_drop: "intel.drop",
  boss_clear: "boss.cleared",
  raid_opened: "raid.opened",
};

/** Resolve a Pulse revision `eventType` to a cue id (undefined if unknown). */
export function cueIdForLiveEvent(raw: unknown): LiveCueId | undefined {
  const eventType = normalizeLiveEventType(raw);
  return eventType ? EVENT_TYPE_TO_CUE[eventType] : undefined;
}

/** Resolve a Forge/Atlas snake beatId to a cue id (undefined if unknown). */
export function cueIdForAtlasBeat(raw: unknown): LiveCueId | undefined {
  const id = String(raw ?? "").trim();
  if (!(ATLAS_BEAT_IDS as readonly string[]).includes(id)) return undefined;
  return ATLAS_BEAT_ID_TO_CUE[id as AtlasBeatId];
}

/**
 * Play the theater SFX for a live revision beat (Pulse SSE eventType).
 * Safe no-op when muted, AudioContext unavailable, or eventType unknown.
 * First integrated settle: MissionSettled → mission.settled (win + soft lock).
 */
export function playLiveEventCue(raw: unknown): LiveCueId | undefined {
  const cueId = cueIdForLiveEvent(raw);
  if (!cueId) return undefined;
  playCue(cueId);
  return cueId;
}

/**
 * Play SFX for a Forge VFX-queue Atlas beatId (vault_flash | intel_drop | boss_clear | raid_opened).
 * Call from Forge emit / playSettleSpectacle site — Resonance does not own revision/applySnapshot.
 */
export function playAtlasBeatCue(raw: unknown): LiveCueId | undefined {
  const cueId = cueIdForAtlasBeat(raw);
  if (!cueId) return undefined;
  playCue(cueId);
  return cueId;
}

export function playCue(cueId: LiveCueId): void {
  switch (cueId) {
    case "mission.settled":
      sfx.win();
      window.setTimeout(() => sfx.lockIn(), 90);
      break;
    case "transfer.settled":
      sfx.coin();
      window.setTimeout(() => sfx.lockIn(), 70);
      break;
    case "vault.flash":
      sfx.unlock();
      window.setTimeout(() => sfx.coin(), 60);
      break;
    case "intel.drop":
      sfx.chip();
      window.setTimeout(() => sfx.click(), 40);
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
