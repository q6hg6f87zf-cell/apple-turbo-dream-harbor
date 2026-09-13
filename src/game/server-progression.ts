import { getBearerToken } from "@/lib/auth/client";
import type { ClassName, MissionKind, QuarterId, RegionId, RoomId } from "./types";

export type ServerResidentProgress = {
  id: string;
  name: string;
  cls: ClassName;
  xpTotal: number;
  level: number;
  xp: number;
  xpToNext: number;
  revision: number;
};

export type ServerProgressionSnapshot = {
  campaignId: string;
  campaign: {
    day: number;
    commandRank: number;
    bossClears: Partial<Record<RegionId, boolean>>;
    missions: Partial<Record<RegionId, number>>;
    intel: Partial<Record<RegionId, number>>;
    materials: Partial<Record<RegionId, number>>;
    unlocked: Partial<Record<RegionId, boolean>>;
    revision: number;
  };
  treasury: {
    caps: number;
    ore: number;
    moonFavor: number;
    rooms: Record<string, number>;
    quarters: Record<string, number>;
    revision: number;
  };
  card: {
    caps: number;
    xp: number;
    level: number;
    revision: number;
    discordId: string;
    name: string;
  };
  residents: ServerResidentProgress[];
  authority: "server";
};

export type ServerMissionTicket = {
  id: string;
  region: RegionId;
  kind: MissionKind;
  partyIds: string[];
  issuedAt: string;
  availableAt: string;
  expiresAt: string;
  settledAt: string | null;
};

export type MissionRewardReceipt = {
  region?: RegionId;
  kind?: MissionKind;
  performanceScore?: number;
  vaultCaps?: number;
  cardCaps?: number;
  ore?: number;
  favor?: number;
  riderXp?: number;
  residentXp?: number;
  intel?: number;
  missionCount?: number;
  materialQty?: number;
  commandRank?: number;
  expired?: boolean;
};

export type ServerUpgradeReceipt = {
  nextLevel: number;
  caps: number;
  ore: number;
  favor: number;
  materialRegion: RegionId;
  materials: number;
  bossClears: number;
  riders: number;
  minDay: number;
  commandRank: number;
  residentLevel: number;
  residentCount: number;
};

type ProgressionResponse = ServerProgressionSnapshot & {
  ok?: boolean;
  duplicate?: boolean;
  ticket?: ServerMissionTicket;
  reward?: MissionRewardReceipt;
  upgrade?: ServerUpgradeReceipt;
  error?: string;
};

function headers(json = false) {
  const h = new Headers({ accept: "application/json" });
  if (json) h.set("content-type", "application/json");
  const bearer = getBearerToken();
  if (bearer) h.set("Authorization", `Bearer ${bearer}`);
  return h;
}

function randomRequestId(prefix: string) {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 16)}`;
  return `${prefix}:${id}`;
}

function stableMissionRequestId(missionId: string) {
  const clean = missionId.replace(/[^A-Za-z0-9._:-]/g, "").slice(0, 72);
  return `mission:${clean || randomRequestId("fallback")}`.slice(0, 96);
}

async function decode(response: Response): Promise<ProgressionResponse> {
  const body = (await response.json().catch(() => ({}))) as ProgressionResponse;
  if (!response.ok) throw new Error(body.error || `Progression request failed (${response.status})`);
  return body;
}

async function command(payload: Record<string, unknown>) {
  const response = await fetch("/api/hollow/progression", {
    method: "POST",
    credentials: "same-origin",
    headers: headers(true),
    body: JSON.stringify(payload),
  });
  return decode(response);
}

export async function pullServerProgression(): Promise<ServerProgressionSnapshot | null> {
  const response = await fetch("/api/hollow/progression", {
    method: "GET",
    credentials: "same-origin",
    headers: headers(),
  });
  if (response.status === 401 || response.status === 404) return null;
  return decode(response);
}

export async function startServerMission(
  region: RegionId,
  kind: MissionKind,
  missionId: string,
  party: Array<{ id: string; name: string; cls: ClassName }>,
) {
  const body = await command({
    command: "start_mission",
    requestId: stableMissionRequestId(missionId),
    region,
    kind,
    party,
  });
  if (!body.ticket) throw new Error("Server did not issue a mission ticket.");
  return body;
}

export async function settleServerMission(ticketId: string, performanceScore: number) {
  return command({
    command: "settle_mission",
    ticketId,
    performanceScore,
  });
}

export async function advanceServerDay() {
  return command({
    command: "advance_day",
    requestId: randomRequestId("day"),
  });
}

export async function upgradeServerRoom(room: RoomId) {
  return command({
    command: "upgrade_room",
    requestId: randomRequestId(`room-${room}`),
    room,
  });
}

export async function upgradeServerQuarter(quarter: QuarterId) {
  return command({
    command: "upgrade_quarter",
    requestId: randomRequestId(`quarter-${quarter}`),
    quarter,
  });
}
