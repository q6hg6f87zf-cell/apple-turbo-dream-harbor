/**
 * Pulse live-revision rail — transport helpers + Vault-locked beat contract.
 * Atlas also parses beats via world-event-theater.parseLiveBeat / applyLiveBeat.
 * Fanout only: never invents balances; clients refresh authoritative snapshots.
 *
 * Design Bible v1.3 priority 3 — shared campaign pulses:
 * revision beats may carry theater identity from hollow_domain_event so other
 * riders' MissionSettled / BossCleared paint as shared scars (not local-only).
 */
import type { MissionKind, RegionId } from "./types";
import {
  isMissionKind,
  isTheaterBeatId,
  isTheaterName,
  isTheaterRegion,
  parseWorldConsequence,
  resolveTheaterBeatId,
  type TheaterBeatId,
  type TheaterName,
  type WorldConsequence,
} from "./world-event-theater";

export const LIVE_SSE_PATH = "/api/hollow/live";

/** Vault theater eventTypes Pulse may attach on revision beats (locked + TransferSettled). */
export const LIVE_EVENT_TYPES = ["MissionSettled", "TransferSettled", "RaidOpened", "BossCleared"] as const;
export type LiveEventType = (typeof LIVE_EVENT_TYPES)[number];

export type LiveHelloBeat = {
  type: "hello";
  campaignRevision: number;
  memberRevision: number;
  at: string;
};

/**
 * Additive revision wire shape (Canon + Atlas lock).
 * Omit any optional field when unknown — never invent.
 * eventType alone = watermark only; region/theater extras enable atlas paint.
 */
export type LiveRevisionBeat = {
  type: "revision";
  campaignRevision: number;
  memberRevision: number;
  eventType?: LiveEventType;
  /** PascalCase TheaterName when Vault payload knows it (often same as eventType). */
  theater?: TheaterName;
  region?: RegionId;
  kind?: MissionKind;
  heatDelta?: number;
  intelDelta?: number;
  beatId?: TheaterBeatId;
  eventId?: string;
  /** offerMutations ONLY — heat/intel/beatId stay on the beat root. */
  worldConsequence?: WorldConsequence;
  reason?: string;
  at?: string;
};

export type LiveHeartbeatBeat = {
  type: "heartbeat";
  campaignRevision: number;
  memberRevision: number;
  at: string;
};

export type LiveBeat = LiveHelloBeat | LiveRevisionBeat | LiveHeartbeatBeat;

export type LiveRevisionWatermark = {
  campaignRevision: number;
  memberRevision: number;
};

/** Soft-read row from hollow_domain_event (+ payload) for revision fanout. */
export type LiveDomainEventSoft = {
  eventId?: string;
  eventType?: LiveEventType;
  theater?: TheaterName;
  region?: RegionId;
  kind?: MissionKind;
  heatDelta?: number;
  intelDelta?: number;
  beatId?: TheaterBeatId;
  worldConsequence?: WorldConsequence;
};

/** True when either rail is strictly ahead of the last applied watermark. */
export function revisionIsNewer(
  next: LiveRevisionWatermark,
  last: LiveRevisionWatermark | null | undefined,
): boolean {
  if (!last) return true;
  return (
    Number(next.campaignRevision) > Number(last.campaignRevision) ||
    Number(next.memberRevision) > Number(last.memberRevision)
  );
}

export function normalizeLiveEventType(raw: unknown): LiveEventType | undefined {
  const value = String(raw ?? "").trim();
  return (LIVE_EVENT_TYPES as readonly string[]).includes(value)
    ? (value as LiveEventType)
    : undefined;
}

function normalizeFiniteInt(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.trunc(raw);
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return undefined;
}

function normalizeEventId(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const id = raw.trim().slice(0, 96);
  return id.length > 0 ? id : undefined;
}

/**
 * Soft-parse Vault domain-event columns + jsonb payload into optional theater identity.
 * Never invents missing fields.
 */
export function softParseDomainEvent(raw: {
  event_id?: unknown;
  event_type?: unknown;
  region?: unknown;
  theater?: unknown;
  kind?: unknown;
  beat_id?: unknown;
  heat_delta?: unknown;
  intel_delta?: unknown;
  world_consequence?: unknown;
}): LiveDomainEventSoft {
  const out: LiveDomainEventSoft = {};
  const eventType = normalizeLiveEventType(raw.event_type);
  if (eventType) out.eventType = eventType;

  const eventId = normalizeEventId(raw.event_id);
  if (eventId) out.eventId = eventId;

  if (isTheaterName(raw.theater)) out.theater = raw.theater;
  else if (eventType && isTheaterName(eventType)) out.theater = eventType;

  if (isTheaterRegion(raw.region)) out.region = raw.region;
  if (isMissionKind(raw.kind)) out.kind = raw.kind;

  const beatId = resolveTheaterBeatId(raw.beat_id);
  if (beatId) out.beatId = beatId;

  const heatDelta = normalizeFiniteInt(raw.heat_delta);
  if (heatDelta !== undefined) out.heatDelta = heatDelta;

  const intelDelta = normalizeFiniteInt(raw.intel_delta);
  if (intelDelta !== undefined) out.intelDelta = intelDelta;

  const wc = parseWorldConsequence(raw.world_consequence);
  if (wc) out.worldConsequence = wc;

  return out;
}

/** Attach soft-read theater identity onto a revision beat (omit unknowns). */
export function attachTheaterIdentity(
  beat: LiveRevisionBeat,
  soft: LiveDomainEventSoft | null | undefined,
): LiveRevisionBeat {
  if (!soft) return beat;
  if (soft.eventType) beat.eventType = soft.eventType;
  if (soft.theater) beat.theater = soft.theater;
  if (soft.region) beat.region = soft.region;
  if (soft.kind) beat.kind = soft.kind;
  if (soft.heatDelta !== undefined) beat.heatDelta = soft.heatDelta;
  if (soft.intelDelta !== undefined) beat.intelDelta = soft.intelDelta;
  if (soft.beatId) beat.beatId = soft.beatId;
  if (soft.eventId) beat.eventId = soft.eventId;
  if (soft.worldConsequence) beat.worldConsequence = soft.worldConsequence;
  return beat;
}

export function parseLiveBeat(raw: unknown): LiveBeat | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const type = String(row.type ?? "");
  const campaignRevision = Math.max(0, Number(row.campaignRevision) || 0);
  const memberRevision = Math.max(0, Number(row.memberRevision) || 0);
  const at = typeof row.at === "string" ? row.at : new Date().toISOString();

  if (type === "hello") {
    return { type: "hello", campaignRevision, memberRevision, at };
  }
  if (type === "revision") {
    const beat: LiveRevisionBeat = {
      type: "revision",
      campaignRevision,
      memberRevision,
    };
    const eventType = normalizeLiveEventType(row.eventType);
    if (eventType) beat.eventType = eventType;

    if (isTheaterName(row.theater)) beat.theater = row.theater;
    if (isTheaterRegion(row.region)) beat.region = row.region;
    if (isMissionKind(row.kind)) beat.kind = row.kind;

    const beatId = resolveTheaterBeatId(row.beatId) ?? (isTheaterBeatId(row.beatId) ? row.beatId : null);
    if (beatId) beat.beatId = beatId;

    const heatDelta = normalizeFiniteInt(row.heatDelta);
    if (heatDelta !== undefined) beat.heatDelta = heatDelta;
    const intelDelta = normalizeFiniteInt(row.intelDelta);
    if (intelDelta !== undefined) beat.intelDelta = intelDelta;

    const eventId = normalizeEventId(row.eventId);
    if (eventId) beat.eventId = eventId;

    const wc = parseWorldConsequence(row.worldConsequence);
    if (wc) beat.worldConsequence = wc;

    if (typeof row.reason === "string" && row.reason.trim()) beat.reason = row.reason.trim().slice(0, 64);
    if (typeof row.at === "string") beat.at = row.at;
    return beat;
  }
  if (type === "heartbeat") {
    return { type: "heartbeat", campaignRevision, memberRevision, at };
  }
  return null;
}

/** Format one SSE data frame (EventSource default message event). */
export function formatSseData(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export function formatSseComment(text: string): string {
  return `: ${text}\n\n`;
}
