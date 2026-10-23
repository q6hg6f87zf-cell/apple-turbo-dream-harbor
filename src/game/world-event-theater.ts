/**
 * Atlas world-event theater catalog.
 * PascalCase theater names alias onto existing bridge dotted types —
 * never rename src/lib/bridge/catalog.ts from here.
 */
import type { MissionKind, RegionId } from "./types";

export const THEATER_NAMES = [
  "MissionSettled",
  "MissionFailed",
  "RaidOpened",
  "BossCleared",
  "BossFailed",
  "TransferSettled",
  "DayAdvanced",
  "IdentityLinked",
] as const;

export type TheaterName = (typeof THEATER_NAMES)[number];

export const THEATER_BEAT_IDS = [
  "vault_flash",
  "intel_drop",
  "boss_clear",
  "raid_opened",
  "day_advance",
  "transfer_flash",
  "mission_settle",
] as const;

export type TheaterBeatId = (typeof THEATER_BEAT_IDS)[number];

/** Bridge outbox dotted types we alias to (subset of catalog EVENT_TYPES). */
export type BridgeOutboxType =
  | "mission.completed"
  | "mission.failed"
  | "boss.engaged"
  | "boss.defeated"
  | "boss.failed"
  | "campaign.day_advanced"
  | "player.joined";

export const THEATER_TO_BRIDGE: Record<TheaterName, BridgeOutboxType | null> = {
  MissionSettled: "mission.completed",
  MissionFailed: "mission.failed",
  RaidOpened: null, // ticket start; boss path may use boss.engaged separately
  BossCleared: "boss.defeated",
  BossFailed: "boss.failed",
  TransferSettled: null,
  DayAdvanced: "campaign.day_advanced",
  IdentityLinked: "player.joined",
};

export const BRIDGE_TO_THEATER: Partial<Record<BridgeOutboxType, TheaterName>> = {
  "mission.completed": "MissionSettled",
  "mission.failed": "MissionFailed",
  "boss.engaged": "RaidOpened",
  "boss.defeated": "BossCleared",
  "boss.failed": "BossFailed",
  "campaign.day_advanced": "DayAdvanced",
  "player.joined": "IdentityLinked",
};

export const THEATER_REGIONS: readonly RegionId[] = [
  "ironclad",
  "slagtown",
  "blackspire",
  "brasswater",
  "veyra",
];

export type TheaterRevision = {
  campaign: number;
  member?: number;
};

/** Vault worldConsequence.offerMutations ops (MissionSettled payload). */
export const OFFER_MUTATION_OPS = ["boost", "unlock", "cool", "heal"] as const;
export type OfferMutationOp = (typeof OFFER_MUTATION_OPS)[number];

const MISSION_KIND_SET = new Set<string>(["scout", "forage", "raid", "trade", "bounty", "boss"]);

export function isMissionKind(raw: unknown): raw is MissionKind {
  return typeof raw === "string" && MISSION_KIND_SET.has(raw);
}

/**
 * One board-consequence mutation Vault may attach on MissionSettled.
 * Heat lives on the event root (heatDelta) — never duplicated here.
 */
export type OfferMutation = {
  op: OfferMutationOp;
  region: RegionId;
  kinds?: MissionKind[];
  weight?: number;
  /** Machine reason for Forge/debug; not player copy. */
  reason: string;
  /** Mythos selectable key — see WORLD_EVENT_THEATER.md copyKeys. */
  copyKey?: string;
};

/** Optional consequence bag on domain payloads (Vault). Heat is NOT here. */
export type WorldConsequence = {
  offerMutations?: OfferMutation[];
};

export type TheaterEventPayload = {
  eventId: string;
  theater: TheaterName;
  bridgeType: BridgeOutboxType | null;
  campaignId: string;
  userId: string | null;
  discordId: string | null;
  ticketId: string | null;
  requestId: string | null;
  region: RegionId | null;
  loc: string | null;
  kind: MissionKind | null;
  partyIds: string[];
  performanceScore: number | null;
  revision: TheaterRevision;
  heatDelta: number;
  intelDelta: number;
  beatId: TheaterBeatId;
  at: string;
  duplicate: boolean;
  /** Vault worldConsequence — offerMutations only; heat stays on heatDelta. */
  worldConsequence: WorldConsequence | null;
};

export type TheaterEventInput = Partial<TheaterEventPayload> & {
  theater: TheaterName;
  eventId?: string;
};

const REGION_SET = new Set<string>(THEATER_REGIONS);

export function isTheaterName(raw: unknown): raw is TheaterName {
  return typeof raw === "string" && (THEATER_NAMES as readonly string[]).includes(raw);
}

export function isTheaterBeatId(raw: unknown): raw is TheaterBeatId {
  return typeof raw === "string" && (THEATER_BEAT_IDS as readonly string[]).includes(raw);
}

/**
 * Vault settle response / domain payload may still emit kebab beat ids
 * (`boss-cleared`, `intel-spike`, `mission-cleared`). Atlas canon is snake.
 * Normalize here so Forge VFX + Mythos copy branch correctly.
 */
export const VAULT_BEAT_ID_ALIASES: Record<string, TheaterBeatId> = {
  "boss-cleared": "boss_clear",
  "intel-spike": "intel_drop",
  "mission-cleared": "mission_settle",
  boss_cleared: "boss_clear",
  intel_spike: "intel_drop",
  mission_cleared: "mission_settle",
};

export function resolveTheaterBeatId(raw: unknown): TheaterBeatId | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const key = raw.trim();
  if (isTheaterBeatId(key)) return key;
  return VAULT_BEAT_ID_ALIASES[key] ?? null;
}

export function bridgeTypeForTheater(theater: TheaterName): BridgeOutboxType | null {
  return THEATER_TO_BRIDGE[theater];
}

export function theaterFromBridgeType(bridgeType: string): TheaterName | null {
  return BRIDGE_TO_THEATER[bridgeType as BridgeOutboxType] ?? null;
}

export function isTheaterRegion(raw: unknown): raw is RegionId {
  return typeof raw === "string" && REGION_SET.has(raw);
}

/** Default heat contribution when Vault omits heatDelta. */
export function defaultHeatDelta(theater: TheaterName, kind: MissionKind | null): number {
  if (theater === "BossCleared") return 8;
  if (theater === "BossFailed") return 3;
  if (theater === "RaidOpened") return kind === "boss" ? 4 : 2;
  if (theater === "MissionFailed") return kind === "raid" || kind === "boss" ? 2 : 0;
  if (theater === "MissionSettled") {
    if (kind === "boss") return 8;
    if (kind === "raid" || kind === "bounty") return 3;
    if (kind === "scout") return 1;
    return 1;
  }
  if (theater === "DayAdvanced") return -1;
  return 0;
}

/** Pick Forge animation key from theater + reward shape. */
export function defaultBeatId(
  theater: TheaterName,
  opts: { kind?: MissionKind | null; intelDelta?: number; heatDelta?: number } = {},
): TheaterBeatId {
  if (theater === "BossCleared") return "boss_clear";
  if (theater === "RaidOpened") return "raid_opened";
  if (theater === "DayAdvanced") return "day_advance";
  if (theater === "TransferSettled") return "transfer_flash";
  if (theater === "MissionSettled") {
    if (opts.kind === "boss") return "boss_clear";
    if ((opts.intelDelta ?? 0) > 0) return "intel_drop";
    return "vault_flash";
  }
  if (theater === "MissionFailed" || theater === "BossFailed") return "mission_settle";
  return "mission_settle";
}

let seq = 0;
function nid(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq.toString(36)}`;
}


export function isOfferMutationOp(raw: unknown): raw is OfferMutationOp {
  return typeof raw === "string" && (OFFER_MUTATION_OPS as readonly string[]).includes(raw);
}

/**
 * Parse Vault worldConsequence.offerMutations (additive, defensive).
 * Drops malformed rows; does not invent heat.
 */
export function parseOfferMutations(raw: unknown): OfferMutation[] {
  if (!Array.isArray(raw)) return [];
  const out: OfferMutation[] = [];
  for (const row of raw.slice(0, 24)) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (!isOfferMutationOp(r.op)) continue;
    if (!isTheaterRegion(r.region)) continue;
    const reason = typeof r.reason === "string" && r.reason.trim() ? r.reason.trim().slice(0, 96) : "vault";
    const mut: OfferMutation = { op: r.op, region: r.region, reason };
    if (Array.isArray(r.kinds)) {
      const kinds = r.kinds.filter(isMissionKind).slice(0, 8);
      if (kinds.length) mut.kinds = kinds;
    }
    if (typeof r.weight === "number" && Number.isFinite(r.weight)) {
      mut.weight = Math.max(-100, Math.min(100, Math.round(r.weight)));
    }
    if (typeof r.copyKey === "string" && r.copyKey.trim()) {
      mut.copyKey = r.copyKey.trim().slice(0, 64);
    }
    out.push(mut);
  }
  return out;
}

export function parseWorldConsequence(raw: unknown): WorldConsequence | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  // Locked schema: offerMutations only nested here. Ignore nested heatDelta/intelDelta/beatId.
  const offerMutations = parseOfferMutations(r.offerMutations);
  if (!offerMutations.length) return null;
  return { offerMutations };
}

/** Pull worldConsequence from a Vault/domain row. Prefers nested bag; does not invent heat. */
export function extractWorldConsequence(raw: unknown): WorldConsequence | null {
  if (!raw || typeof raw !== "object") return null;
  return parseWorldConsequence((raw as Record<string, unknown>).worldConsequence);
}

/** Dense settle that should scar the atlas (raid/bounty/boss or high heat). */
export function isScarWorthy(
  theater: TheaterName,
  kind: MissionKind | null,
  heatDelta: number,
): boolean {
  if (theater === "BossCleared") return true;
  if (theater !== "MissionSettled") return false;
  if (kind === "boss" || kind === "raid" || kind === "bounty") return true;
  return heatDelta >= 3;
}

/**
 * Normalize a partial Vault/Pulse envelope into a projector-ready payload.
 * Additive defaults only — never invent balances.
 */
export function normalizeTheaterEvent(input: TheaterEventInput): TheaterEventPayload {
  const theater = input.theater;
  const kind = input.kind ?? null;
  const heatDelta =
    typeof input.heatDelta === "number" && Number.isFinite(input.heatDelta)
      ? Math.trunc(input.heatDelta)
      : defaultHeatDelta(theater, kind);
  const intelDelta =
    typeof input.intelDelta === "number" && Number.isFinite(input.intelDelta)
      ? Math.trunc(input.intelDelta)
      : theater === "MissionSettled" || theater === "BossCleared"
        ? 1
        : 0;
  const beatId =
    resolveTheaterBeatId(input.beatId) ??
    defaultBeatId(theater, { kind, intelDelta, heatDelta });
  const region = isTheaterRegion(input.region) ? input.region : null;
  const campaign =
    typeof input.revision?.campaign === "number" && Number.isFinite(input.revision.campaign)
      ? Math.max(0, Math.trunc(input.revision.campaign))
      : 0;
  const member =
    typeof input.revision?.member === "number" && Number.isFinite(input.revision.member)
      ? Math.max(0, Math.trunc(input.revision.member))
      : undefined;

  return {
    eventId: String(input.eventId ?? nid("th")).slice(0, 96),
    theater,
    bridgeType: input.bridgeType === undefined ? bridgeTypeForTheater(theater) : input.bridgeType,
    campaignId: String(input.campaignId ?? "moon-squad").slice(0, 64),
    userId: input.userId == null ? null : String(input.userId).slice(0, 96),
    discordId: input.discordId == null ? null : String(input.discordId).slice(0, 32),
    ticketId: input.ticketId == null ? null : String(input.ticketId).slice(0, 96),
    requestId: input.requestId == null ? null : String(input.requestId).slice(0, 96),
    region,
    loc: input.loc == null ? null : String(input.loc).slice(0, 64),
    kind,
    partyIds: Array.isArray(input.partyIds) ? input.partyIds.map(String).slice(0, 12) : [],
    performanceScore:
      typeof input.performanceScore === "number" && Number.isFinite(input.performanceScore)
        ? Math.max(0, Math.min(1000, Math.round(input.performanceScore)))
        : null,
    revision: member === undefined ? { campaign } : { campaign, member },
    heatDelta,
    intelDelta,
    beatId,
    at: typeof input.at === "string" && input.at.length >= 8 ? input.at : new Date().toISOString(),
    duplicate: Boolean(input.duplicate),
    worldConsequence: parseWorldConsequence(input.worldConsequence),
  };
}

/** Whether bridge continuity should consider announcing this beat. */
export function shouldEnqueueBridgeOutbox(event: TheaterEventPayload): boolean {
  if (event.duplicate || !event.bridgeType) return false;
  if (event.theater === "MissionSettled") {
    return event.kind === "raid" || event.kind === "bounty" || event.kind === "boss";
  }
  if (event.theater === "DayAdvanced") return true; // telemetry; memory policy still no-ops
  return event.theater === "BossCleared" || event.theater === "BossFailed" || event.theater === "MissionFailed";
}

/** Pulse SSE beat types from GET /api/hollow/live (Pulse-owned route). */
export const LIVE_BEAT_TYPES = ["hello", "revision", "heartbeat"] as const;
export type LiveBeatType = (typeof LIVE_BEAT_TYPES)[number];

/** Domain eventType strings Pulse may attach to a revision beat. */
export const LIVE_DOMAIN_EVENT_TYPES = ["MissionSettled", "RaidOpened", "BossCleared", "TransferSettled", "DayAdvanced"] as const;
export type LiveDomainEventType = (typeof LIVE_DOMAIN_EVENT_TYPES)[number];

/**
 * Additive Pulse live-beat wire (Canon + Atlas lock, Design Bible v1.3 §3).
 * Optional theater identity fields are soft-parsed; omit when unknown — never invent.
 * eventType alone = watermark only; region (+ theater/eventType) enables atlas paint.
 * Shape: `{ type, campaignRevision, memberRevision, eventType?, theater?, region?,
 *    kind?, heatDelta?, intelDelta?, beatId?, eventId?, worldConsequence? }`
 * worldConsequence = offerMutations ONLY (heat/intel/beatId stay on the beat root).
 */
export type LiveBeat = {
  type: LiveBeatType;
  campaignRevision: number;
  memberRevision: number;
  eventType?: string;
  theater?: TheaterName;
  region?: RegionId;
  kind?: MissionKind;
  heatDelta?: number;
  intelDelta?: number;
  beatId?: TheaterBeatId;
  eventId?: string;
  worldConsequence?: WorldConsequence;
};

export function isLiveBeatType(raw: unknown): raw is LiveBeatType {
  return typeof raw === "string" && (LIVE_BEAT_TYPES as readonly string[]).includes(raw);
}

/** Map Pulse/Vault PascalCase eventType → theater name (null if unknown). */
export function theaterFromLiveEventType(raw: unknown): TheaterName | null {
  if (typeof raw !== "string") return null;
  if (isTheaterName(raw)) return raw;
  return theaterFromBridgeType(raw);
}

function softFiniteInt(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.trunc(raw);
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return undefined;
}


/**
 * Soft-read optional Pulse theater extras from a revision beat.
 * Omits unknown / malformed fields — never invents heat or scars.
 */
export function parseLiveBeatExtras(row: Record<string, unknown>): Partial<LiveBeat> {
  const extras: Partial<LiveBeat> = {};
  const theater = theaterFromLiveEventType(row.theater);
  if (theater) extras.theater = theater;
  if (isTheaterRegion(row.region)) extras.region = row.region;
  if (isMissionKind(row.kind)) extras.kind = row.kind;
  const heatDelta = softFiniteInt(row.heatDelta);
  if (heatDelta !== undefined) extras.heatDelta = heatDelta;
  const intelDelta = softFiniteInt(row.intelDelta);
  if (intelDelta !== undefined) extras.intelDelta = intelDelta;
  const beatId = resolveTheaterBeatId(row.beatId);
  if (beatId) extras.beatId = beatId;
  if (typeof row.eventId === "string" && row.eventId.trim()) {
    extras.eventId = row.eventId.trim().slice(0, 96);
  }
  const wc = parseWorldConsequence(row.worldConsequence);
  if (wc) extras.worldConsequence = wc;
  return extras;
}

/** True when an offer mutation is an earned heal (scar clear path). Cool is never heal. */
export function isHealOfferMutation(mut: OfferMutation): boolean {
  return mut.op === "heal";
}

/**
 * Heal path for atlas scars: explicit `heal` offerMutation, or DayAdvanced with
 * heal-flavored reason/copyKey. Board `cool` never qualifies on its own.
 */
export function isScarHealSignal(
  theater: TheaterName,
  mut: OfferMutation | null | undefined,
): boolean {
  if (mut && isHealOfferMutation(mut)) return true;
  if (!mut || theater !== "DayAdvanced") return false;
  const reason = (mut.reason ?? "").toLowerCase();
  const key = (mut.copyKey ?? "").toLowerCase();
  return reason.includes("heal") || key.includes("heal");
}


/** Parse a wire JSON object into a LiveBeat; reject malformed. Soft-reads Pulse extras. */
export function parseLiveBeat(raw: unknown): LiveBeat | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (!isLiveBeatType(row.type)) return null;
  const campaignRevision = Number(row.campaignRevision);
  const memberRevision = Number(row.memberRevision);
  if (!Number.isFinite(campaignRevision) || !Number.isFinite(memberRevision)) return null;
  const beat: LiveBeat = {
    type: row.type,
    campaignRevision: Math.max(0, Math.trunc(campaignRevision)),
    memberRevision: Math.max(0, Math.trunc(memberRevision)),
  };
  if (typeof row.eventType === "string" && row.eventType.length > 0) {
    beat.eventType = row.eventType.slice(0, 64);
  }
  // Additive Pulse theater extras — omit unknown; never invent.

  Object.assign(beat, parseLiveBeatExtras(row));
  return beat;
}
