/**
 * Atlas world-pulse read model.
 * Applies Vault theater payloads and Pulse live beats into a client projection.
 * No I/O — Forge wires EventSource → applyLiveBeat; Pulse owns the route.
 */
import type { RegionId } from "./types";
import { theaterCopyFor } from "./theater-copy";
import {
  defaultBeatId,
  defaultHeatDelta,
  normalizeTheaterEvent,
  parseLiveBeat,
  theaterFromLiveEventType,
  type LiveBeat,
  type TheaterBeatId,
  type TheaterEventPayload,
  type TheaterEventInput,
  type TheaterName,
} from "./world-event-theater";

export const WORLD_PULSE_BEAT_CAP = 24;

export type WorldPulseBeat = {
  eventId: string;
  theater: TheaterName;
  beatId: TheaterBeatId;
  region: RegionId | null;
  kind: TheaterEventPayload["kind"];
  heatDelta: number;
  intelDelta: number;
  campaignRevision: number;
  memberRevision: number | null;
  at: string;
  headline: string;
  /** Mythos stake line under the strip headline */
  subline: string;
  radio: string;
};

export type WorldPulseState = {
  campaignId: string;
  campaignRevision: number;
  memberRevision: number;
  beats: WorldPulseBeat[];
  /** eventIds already folded — idempotent apply */
  seen: string[];
};

export function emptyWorldPulse(campaignId = "moon-squad"): WorldPulseState {
  return {
    campaignId,
    campaignRevision: 0,
    memberRevision: 0,
    beats: [],
    seen: [],
  };
}

function toPulseBeat(event: TheaterEventPayload): WorldPulseBeat {
  const copy = theaterCopyFor(event);
  return {
    eventId: event.eventId,
    theater: event.theater,
    beatId: event.beatId,
    region: event.region,
    kind: event.kind,
    heatDelta: event.heatDelta,
    intelDelta: event.intelDelta,
    campaignRevision: event.revision.campaign,
    memberRevision: event.revision.member ?? null,
    at: event.at,
    headline: copy.headline,
    subline: copy.subline,
    radio: copy.radio,
  };
}

function bumpWatermark(state: WorldPulseState, campaign: number, member: number): WorldPulseState {
  return {
    ...state,
    campaignRevision: Math.max(state.campaignRevision, campaign),
    memberRevision: Math.max(state.memberRevision, member),
  };
}

function pushBeat(state: WorldPulseState, event: TheaterEventPayload): WorldPulseState {
  if (event.duplicate) {
    return bumpWatermark(state, event.revision.campaign, event.revision.member ?? state.memberRevision);
  }
  if (state.seen.includes(event.eventId)) {
    return bumpWatermark(state, event.revision.campaign, event.revision.member ?? state.memberRevision);
  }
  const next = bumpWatermark(state, event.revision.campaign, event.revision.member ?? state.memberRevision);
  const beats = [toPulseBeat(event), ...next.beats].slice(0, WORLD_PULSE_BEAT_CAP);
  const seen = [event.eventId, ...next.seen].slice(0, WORLD_PULSE_BEAT_CAP * 2);
  return { ...next, beats, seen };
}

/** Apply a full Vault/domain theater payload (or settle snapshot merge). */
export function applyTheaterEvent(state: WorldPulseState, input: TheaterEventInput): WorldPulseState {
  const event = normalizeTheaterEvent(input);
  return pushBeat(state, event);
}

/**
 * Apply one Pulse SSE beat from GET /api/hollow/live.
 * hello/heartbeat → watermark only.
 * revision + eventType → project a theater beat with default heat/beatId.
 * Optional extras (region, kind, …) let Forge merge settle snapshot fields.
 */
export function applyLiveBeat(
  state: WorldPulseState,
  raw: LiveBeat | unknown,
  extras: Partial<TheaterEventInput> = {},
): WorldPulseState {
  const live = parseLiveBeat(raw);
  if (!live) return state;

  let next = bumpWatermark(state, live.campaignRevision, live.memberRevision);

  if (live.type !== "revision" || !live.eventType) {
    return next;
  }

  const theater = theaterFromLiveEventType(live.eventType);
  if (!theater) return next;

  const kind = extras.kind ?? null;
  const region = extras.region ?? null;
  const heatDelta =
    typeof extras.heatDelta === "number" ? extras.heatDelta : defaultHeatDelta(theater, kind);
  const intelDelta =
    typeof extras.intelDelta === "number"
      ? extras.intelDelta
      : theater === "MissionSettled" || theater === "BossCleared"
        ? 1
        : 0;
  const beatId = extras.beatId ?? defaultBeatId(theater, { kind, intelDelta, heatDelta });

  const eventId =
    extras.eventId ??
    `live:${theater}:${live.campaignRevision}:${live.memberRevision}:${region ?? "na"}`;

  return applyTheaterEvent(next, {
    ...extras,
    eventId,
    theater,
    region: region ?? undefined,
    kind: kind ?? undefined,
    heatDelta,
    intelDelta,
    beatId,
    revision: {
      campaign: live.campaignRevision,
      member: live.memberRevision,
    },
    at: extras.at,
    duplicate: extras.duplicate,
  });
}

/** Latest N beats (already newest-first). */
export function selectRecentBeats(state: WorldPulseState, limit = 8): WorldPulseBeat[] {
  return state.beats.slice(0, Math.max(0, Math.min(WORLD_PULSE_BEAT_CAP, limit)));
}

export function selectPulseRevisions(state: WorldPulseState) {
  return {
    campaignRevision: state.campaignRevision,
    memberRevision: state.memberRevision,
  };
}
