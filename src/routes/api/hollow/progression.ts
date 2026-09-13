import { createFileRoute } from "@tanstack/react-router";
import { randomBytes, randomInt } from "node:crypto";
import { getSql } from "@/lib/db";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { requireUserId } from "@/lib/auth/verify.server";
import {
  AUTHORITY_BOSS_GATES,
  AUTHORITY_BOSS_REWARDS,
  authorityBossReward,
  authorityMissionReward,
  missionSettleDelayMs,
  normalizePerformanceScore,
  regionUnlocked,
} from "@/game/authority-rules";
import type { MissionKind, RegionId } from "@/game/types";

const CAMPAIGN_ID = "moon-squad";
const REGIONS: RegionId[] = ["ironclad", "slagtown", "blackspire", "brasswater", "veyra"];
const KINDS: MissionKind[] = ["scout", "forage", "trade", "raid", "bounty", "boss"];
const HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS });
}

async function verifiedUser(): Promise<{ userId?: string; response?: Response }> {
  try {
    assertSameSiteRequest();
    return { userId: await requireUserId() };
  } catch (error) {
    const status =
      typeof error === "object" && error && "status" in error && typeof error.status === "number"
        ? error.status
        : 503;
    return { response: json({ error: error instanceof Error ? error.message : "identity unavailable" }, status) };
  }
}

function cleanRequestId(raw: unknown) {
  const value = String(raw ?? "").trim();
  return /^[A-Za-z0-9._:-]{12,96}$/.test(value) ? value : null;
}

function cleanTicketId(raw: unknown) {
  const value = String(raw ?? "").trim();
  return /^[a-f0-9]{48,96}$/i.test(value) ? value : null;
}

function cleanRegion(raw: unknown): RegionId | null {
  const value = String(raw ?? "").trim() as RegionId;
  return REGIONS.includes(value) ? value : null;
}

function cleanKind(raw: unknown): MissionKind | null {
  const value = String(raw ?? "").trim() as MissionKind;
  return KINDS.includes(value) ? value : null;
}

type ProgressRow = {
  campaign_day: number;
  command_rank: number;
  vault_caps: number;
  hollow_ore: number;
  moon_favor: number;
  rooms: Record<string, number>;
  quarters: Record<string, number>;
  boss_clears: Partial<Record<RegionId, boolean>>;
  region_missions: Partial<Record<RegionId, number>>;
  region_intel: Partial<Record<RegionId, number>>;
  regional_materials: Partial<Record<RegionId, number>>;
  campaign_revision: number;
  card_caps: number;
  xp: number;
  level: number;
  member_revision: number;
  discord_id: string;
  display_name: string;
};

async function readProgress(userId: string): Promise<ProgressRow | null> {
  const sql = await getSql();
  const rows = await sql<ProgressRow>`
    select
      c.campaign_day,
      c.command_rank,
      c.vault_caps,
      c.hollow_ore,
      c.moon_favor,
      c.rooms,
      c.quarters,
      c.boss_clears,
      c.region_missions,
      c.region_intel,
      c.regional_materials,
      c.revision as campaign_revision,
      m.card_caps,
      m.xp,
      m.level,
      m.revision as member_revision,
      m.discord_id,
      s.display_name
    from hollow_campaign_member m
    join hollow_campaign_state c on c.campaign_id = m.campaign_id
    join tyrone_arcade_snapshot s on s.discord_id = m.discord_id
    where m.campaign_id = ${CAMPAIGN_ID} and m.user_id = ${userId}
    limit 1
  `;
  return rows[0] ?? null;
}

function progressJson(row: ProgressRow) {
  const unlocked = Object.fromEntries(
    REGIONS.map((region) => [region, regionUnlocked(region, row.boss_clears ?? {})]),
  );
  return {
    campaignId: CAMPAIGN_ID,
    campaign: {
      day: row.campaign_day,
      commandRank: row.command_rank,
      bossClears: row.boss_clears ?? {},
      missions: row.region_missions ?? {},
      intel: row.region_intel ?? {},
      materials: row.regional_materials ?? {},
      unlocked,
      revision: row.campaign_revision,
    },
    treasury: {
      caps: row.vault_caps,
      ore: row.hollow_ore,
      moonFavor: row.moon_favor,
      rooms: row.rooms,
      quarters: row.quarters,
      revision: row.campaign_revision,
    },
    card: {
      caps: row.card_caps,
      xp: row.xp,
      level: row.level,
      revision: row.member_revision,
      discordId: row.discord_id,
      name: row.display_name,
    },
    authority: "server",
  };
}

type MissionTicketRow = {
  ticket_id: string;
  region: RegionId;
  mission_kind: MissionKind;
  issued_at: string;
  available_at: string;
  expires_at: string;
  settled_at: string | null;
  performance_score: number | null;
  reward: Record<string, unknown> | null;
};

function ticketJson(row: MissionTicketRow) {
  return {
    id: row.ticket_id,
    region: row.region,
    kind: row.mission_kind,
    issuedAt: row.issued_at,
    availableAt: row.available_at,
    expiresAt: row.expires_at,
    settledAt: row.settled_at,
  };
}

async function eligibleRaidRiders(minXp: number): Promise<number> {
  const sql = await getSql();
  const rows = await sql<{ count: number }>`
    select count(*)::bigint as count
    from hollow_campaign_member
    where campaign_id = ${CAMPAIGN_ID} and xp >= ${minXp}
  `;
  return Number(rows[0]?.count ?? 0);
}

async function validateMissionStart(row: ProgressRow, region: RegionId, kind: MissionKind): Promise<string | null> {
  if (!regionUnlocked(region, row.boss_clears ?? {})) return `${region} is locked by the previous regional boss.`;
  if (kind !== "boss") return null;
  if (row.boss_clears?.[region]) return `${region} boss has already been cleared.`;
  const gate = AUTHORITY_BOSS_GATES[region];
  const intel = Number(row.region_intel?.[region] ?? 0);
  if (intel < gate.minIntel) return `Raid intel ${intel}/${gate.minIntel}. Scout and operate in the region first.`;
  const ready = await eligibleRaidRiders(gate.minRiderXp);
  if (ready < gate.minRiders) {
    return `Raid requires ${gate.minRiders} riders with ${gate.minRiderXp}+ contribution XP (${ready}/${gate.minRiders}).`;
  }
  return null;
}

async function startMission(userId: string, requestId: string, region: RegionId, kind: MissionKind) {
  const sql = await getSql();
  await sql`
    update hollow_mission_ticket
    set settled_at = now(), reward = coalesce(reward, '{"expired":true}'::jsonb)
    where campaign_id = ${CAMPAIGN_ID}
      and user_id = ${userId}
      and settled_at is null
      and expires_at <= now()
  `;

  const existing = await sql<MissionTicketRow>`
    select ticket_id, region, mission_kind, issued_at, available_at, expires_at, settled_at, performance_score, reward
    from hollow_mission_ticket
    where user_id = ${userId} and start_request_id = ${requestId}
    limit 1
  `;
  if (existing[0]) return { duplicate: true, ticket: existing[0] };

  const open = await sql<MissionTicketRow>`
    select ticket_id, region, mission_kind, issued_at, available_at, expires_at, settled_at, performance_score, reward
    from hollow_mission_ticket
    where campaign_id = ${CAMPAIGN_ID} and user_id = ${userId} and settled_at is null
    limit 1
  `;
  if (open[0]) return { error: "Finish or abandon the current server mission before starting another.", status: 409 as const };

  const progress = await readProgress(userId);
  if (!progress) return { error: "Link TyroneBot before starting authoritative missions.", status: 404 as const };
  const blocked = await validateMissionStart(progress, region, kind);
  if (blocked) return { error: blocked, status: 409 as const };

  const ticketId = randomBytes(24).toString("hex");
  const now = Date.now();
  const availableAt = new Date(now + missionSettleDelayMs(kind));
  const expiresAt = new Date(now + (kind === "boss" ? 60 : 30) * 60_000);
  await sql`
    insert into hollow_mission_ticket (
      ticket_id, campaign_id, user_id, start_request_id, region, mission_kind,
      available_at, expires_at
    ) values (
      ${ticketId}, ${CAMPAIGN_ID}, ${userId}, ${requestId}, ${region}, ${kind},
      ${availableAt.toISOString()}, ${expiresAt.toISOString()}
    )
    on conflict do nothing
  `;

  const rows = await sql<MissionTicketRow>`
    select ticket_id, region, mission_kind, issued_at, available_at, expires_at, settled_at, performance_score, reward
    from hollow_mission_ticket
    where user_id = ${userId} and start_request_id = ${requestId}
    limit 1
  `;
  if (!rows[0]) {
    return { error: "Another mission started first. Finish it before opening a new contract.", status: 409 as const };
  }
  return { duplicate: false, ticket: rows[0] };
}

type SettlementResult = { accepted: boolean; moved: boolean };

async function settleStandardMission(
  userId: string,
  ticket: MissionTicketRow,
  score: number,
  materialQty: number,
) {
  const reward = authorityMissionReward(ticket.region, ticket.mission_kind as Exclude<MissionKind, "boss">);
  const rewardBody = {
    region: ticket.region,
    kind: ticket.mission_kind,
    performanceScore: score,
    ...reward,
    materialQty,
  };
  const rewardJson = JSON.stringify(rewardBody);
  const sql = await getSql();
  const rows = await sql<SettlementResult>`
    with ticket_guard as (
      update hollow_mission_ticket
      set settled_at = now(), performance_score = ${score}, reward = ${rewardJson}::jsonb
      where ticket_id = ${ticket.ticket_id}
        and campaign_id = ${CAMPAIGN_ID}
        and user_id = ${userId}
        and settled_at is null
        and available_at <= now()
        and expires_at > now()
      returning 1
    ), campaign_move as (
      update hollow_campaign_state
      set
        vault_caps = vault_caps + ${reward.vaultCaps},
        hollow_ore = hollow_ore + ${reward.ore},
        moon_favor = moon_favor + ${reward.favor},
        missions_since_day = missions_since_day + 1,
        region_missions = jsonb_set(region_missions, array[${ticket.region}]::text[], to_jsonb(coalesce((region_missions ->> ${ticket.region})::int, 0) + ${reward.missionCount}), true),
        region_intel = jsonb_set(region_intel, array[${ticket.region}]::text[], to_jsonb(coalesce((region_intel ->> ${ticket.region})::int, 0) + ${reward.intel}), true),
        regional_materials = jsonb_set(regional_materials, array[${ticket.region}]::text[], to_jsonb(coalesce((regional_materials ->> ${ticket.region})::int, 0) + ${materialQty}), true),
        revision = revision + 1,
        updated_at = now()
      where campaign_id = ${CAMPAIGN_ID} and exists (select 1 from ticket_guard)
      returning 1
    ), member_move as (
      update hollow_campaign_member
      set
        card_caps = card_caps + ${reward.cardCaps},
        xp = xp + ${reward.riderXp},
        revision = revision + 1,
        updated_at = now()
      where campaign_id = ${CAMPAIGN_ID} and user_id = ${userId}
        and exists (select 1 from campaign_move)
      returning 1
    )
    select exists(select 1 from ticket_guard) as accepted,
           exists(select 1 from member_move) as moved
  `;
  return { result: rows[0] ?? { accepted: false, moved: false }, reward: rewardBody };
}

async function settleBossMission(userId: string, ticket: MissionTicketRow, score: number, materialQty: number) {
  const reward = authorityBossReward(ticket.region);
  const gate = AUTHORITY_BOSS_GATES[ticket.region];
  const rewardBody = {
    region: ticket.region,
    kind: "boss" as const,
    performanceScore: score,
    ...reward,
    materialQty,
  };
  const rewardJson = JSON.stringify(rewardBody);
  const sql = await getSql();
  const rows = await sql<SettlementResult>`
    with ticket_guard as (
      update hollow_mission_ticket
      set settled_at = now(), performance_score = ${score}, reward = ${rewardJson}::jsonb
      where ticket_id = ${ticket.ticket_id}
        and campaign_id = ${CAMPAIGN_ID}
        and user_id = ${userId}
        and settled_at is null
        and available_at <= now()
        and expires_at > now()
      returning 1
    ), campaign_move as (
      update hollow_campaign_state
      set
        vault_caps = vault_caps + ${reward.vaultCaps},
        hollow_ore = hollow_ore + ${reward.ore},
        moon_favor = moon_favor + ${reward.favor},
        command_rank = greatest(command_rank, ${reward.commandRank}),
        missions_since_day = missions_since_day + 1,
        boss_clears = jsonb_set(boss_clears, array[${ticket.region}]::text[], 'true'::jsonb, true),
        region_missions = jsonb_set(region_missions, array[${ticket.region}]::text[], to_jsonb(coalesce((region_missions ->> ${ticket.region})::int, 0) + ${reward.missionCount}), true),
        region_intel = jsonb_set(region_intel, array[${ticket.region}]::text[], to_jsonb(coalesce((region_intel ->> ${ticket.region})::int, 0) + ${reward.intel}), true),
        regional_materials = jsonb_set(regional_materials, array[${ticket.region}]::text[], to_jsonb(coalesce((regional_materials ->> ${ticket.region})::int, 0) + ${materialQty}), true),
        revision = revision + 1,
        updated_at = now()
      where campaign_id = ${CAMPAIGN_ID}
        and coalesce((boss_clears ->> ${ticket.region})::boolean, false) = false
        and exists (select 1 from ticket_guard)
      returning 1
    ), member_move as (
      update hollow_campaign_member
      set
        card_caps = card_caps + ${reward.cardCaps},
        xp = xp + case when user_id = ${userId} then ${reward.riderXp} else 0 end,
        revision = revision + 1,
        updated_at = now()
      where campaign_id = ${CAMPAIGN_ID}
        and xp >= ${gate.minRiderXp}
        and exists (select 1 from campaign_move)
      returning 1
    )
    select exists(select 1 from ticket_guard) as accepted,
           exists(select 1 from campaign_move) as moved
  `;
  return { result: rows[0] ?? { accepted: false, moved: false }, reward: rewardBody };
}

async function settleMission(userId: string, ticketId: string, rawScore: unknown) {
  const sql = await getSql();
  const rows = await sql<MissionTicketRow>`
    select ticket_id, region, mission_kind, issued_at, available_at, expires_at, settled_at, performance_score, reward
    from hollow_mission_ticket
    where ticket_id = ${ticketId} and campaign_id = ${CAMPAIGN_ID} and user_id = ${userId}
    limit 1
  `;
  const ticket = rows[0];
  if (!ticket) return { error: "mission ticket not found", status: 404 as const };
  if (ticket.settled_at) return { duplicate: true, reward: ticket.reward ?? {}, ticket };

  const now = Date.now();
  const availableAt = new Date(ticket.available_at).getTime();
  const expiresAt = new Date(ticket.expires_at).getTime();
  if (now < availableAt) return { error: "mission contract is not ready to settle yet", status: 425 as const };
  if (now >= expiresAt) {
    await sql`
      update hollow_mission_ticket
      set settled_at = now(), reward = '{"expired":true}'::jsonb
      where ticket_id = ${ticket.ticket_id} and settled_at is null
    `;
    return { error: "mission contract expired", status: 410 as const };
  }

  const progress = await readProgress(userId);
  if (!progress) return { error: "authoritative campaign unavailable", status: 503 as const };
  const blocked = await validateMissionStart(progress, ticket.region, ticket.mission_kind);
  if (blocked) return { error: blocked, status: 409 as const };

  const score = normalizePerformanceScore(rawScore);
  const chance = ticket.mission_kind === "boss" ? 1 : authorityMissionReward(ticket.region, ticket.mission_kind as Exclude<MissionKind, "boss">).materialChance;
  const materialQty = ticket.mission_kind === "boss"
    ? 2 + REGIONS.indexOf(ticket.region)
    : randomInt(10_000) < Math.round(chance * 10_000) ? 1 : 0;

  const settled = ticket.mission_kind === "boss"
    ? await settleBossMission(userId, ticket, score, materialQty)
    : await settleStandardMission(userId, ticket, score, materialQty);

  if (!settled.result.accepted || !settled.result.moved) {
    const reread = await sql<MissionTicketRow>`
      select ticket_id, region, mission_kind, issued_at, available_at, expires_at, settled_at, performance_score, reward
      from hollow_mission_ticket where ticket_id = ${ticket.ticket_id} limit 1
    `;
    if (reread[0]?.settled_at) return { duplicate: true, reward: reread[0].reward ?? {}, ticket: reread[0] };
    return { error: "authoritative reward settlement was rejected", status: 409 as const };
  }
  return { duplicate: false, reward: settled.reward, ticket: { ...ticket, settled_at: new Date().toISOString() } };
}

async function advanceDay(userId: string, requestId: string) {
  const sql = await getSql();
  const rows = await sql<SettlementResult>`
    with guard as (
      insert into hollow_command_receipt (user_id, request_id, command_type)
      values (${userId}, ${requestId}, 'advance_day')
      on conflict (user_id, request_id) do nothing
      returning 1
    ), day_move as (
      update hollow_campaign_state
      set
        campaign_day = campaign_day + 1,
        missions_since_day = 0,
        revision = revision + 1,
        updated_at = now()
      where campaign_id = ${CAMPAIGN_ID}
        and missions_since_day > 0
        and exists (select 1 from guard)
      returning 1
    )
    select exists(select 1 from guard) as accepted,
           exists(select 1 from day_move) as moved
  `;
  return rows[0] ?? { accepted: false, moved: false };
}

export const Route = createFileRoute("/api/hollow/progression")({
  server: {
    handlers: {
      GET: async () => {
        const identity = await verifiedUser();
        if (identity.response) return identity.response;
        const row = await readProgress(identity.userId!);
        if (!row) return json({ error: "Link TyroneBot before using server campaign progression." }, 404);
        return json(progressJson(row));
      },

      POST: async ({ request }) => {
        const identity = await verifiedUser();
        if (identity.response) return identity.response;
        const userId = identity.userId!;
        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ error: "bad json" }, 400);
        }

        const command = String(body.command ?? "").trim();
        if (command === "start_mission") {
          const requestId = cleanRequestId(body.requestId);
          const region = cleanRegion(body.region);
          const kind = cleanKind(body.kind);
          if (!requestId || !region || !kind) return json({ error: "invalid mission contract" }, 400);
          const result = await startMission(userId, requestId, region, kind);
          if ("error" in result) return json({ error: result.error }, result.status);
          const progress = await readProgress(userId);
          if (!progress) return json({ error: "authoritative campaign unavailable" }, 503);
          return json({ ok: true, duplicate: result.duplicate, ticket: ticketJson(result.ticket), ...progressJson(progress) });
        }

        if (command === "settle_mission") {
          const ticketId = cleanTicketId(body.ticketId);
          if (!ticketId) return json({ error: "invalid mission ticket" }, 400);
          const result = await settleMission(userId, ticketId, body.performanceScore);
          if ("error" in result) return json({ error: result.error }, result.status);
          const progress = await readProgress(userId);
          if (!progress) return json({ error: "authoritative campaign unavailable" }, 503);
          return json({
            ok: true,
            duplicate: result.duplicate,
            reward: result.reward,
            ticket: ticketJson(result.ticket),
            ...progressJson(progress),
          });
        }

        if (command === "advance_day") {
          const requestId = cleanRequestId(body.requestId);
          if (!requestId) return json({ error: "invalid request id" }, 400);
          const result = await advanceDay(userId, requestId);
          const progress = await readProgress(userId);
          if (!progress) return json({ error: "authoritative campaign unavailable" }, 503);
          if (!result.accepted) return json({ ok: true, duplicate: true, ...progressJson(progress) });
          if (!result.moved) {
            return json({ error: "Complete at least one server-settled mission before advancing the campaign day.", ...progressJson(progress) }, 409);
          }
          return json({ ok: true, ...progressJson(progress) });
        }

        return json({ error: "unknown progression command" }, 400);
      },
    },
  },
});
