/**
 * Pulse live-revision rail — transport helpers + Vault-locked beat contract.
 * Atlas also parses beats via world-event-theater.parseLiveBeat / applyLiveBeat.
 * Fanout only: never invents balances; clients refresh authoritative snapshots.
 */

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

export type LiveRevisionBeat = {
  type: "revision";
  campaignRevision: number;
  memberRevision: number;
  eventType?: LiveEventType;
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
