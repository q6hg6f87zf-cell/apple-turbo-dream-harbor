import { createFileRoute } from "@tanstack/react-router";
import { randomBytes, randomInt } from "node:crypto";
import { getSql } from "@/lib/db";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { requireUserId } from "@/lib/auth/verify.server";
import {
  AUTHORITY_BOSS_GATES,
  authorityBossReward,
  authorityMissionReward,
  authorityQuarterUpgradeQuote,
  authorityResidentLevel,
  authorityRoomUpgradeQuote,
  missionSettleDelayMs,
  normalizePerformanceScore,
  regionUnlocked,
  type AuthorityUpgradeQuote,
} from "@/game/authority-rules";
import type { ClassName, MissionKind, QuarterId, RegionId, RoomId } from "@/game/types";

const CAMPAIGN_ID = "moon-squad";
const REGIONS: RegionId[] = ["ironclad", "slagtown", "blackspire", "brasswater", "veyra"];
const KINDS: MissionKind[] = ["scout", "forage", "trade", "raid", "bounty", "boss"];
const CLASSES: ClassName[] = ["Warrior", "Wizard", "Rogue", "Healer", "Merchant", "Bard"];
const ROOMS: RoomId[] = ["vault", "barracks", "forge", "infirmary", "watchtower", "ledger"];
const QUARTERS: QuarterId[] = ["bunk", "lockbox", "hearth"];
const BOSS_DAY_GATE: Record<RegionId, number> = {
  ironclad: 8,
  slagtown: 22,
  blackspire: 40,
  brasswater: 65,
  veyra: 95,
};
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

function cleanRoom(raw: unknown): RoomId | null {
  const value = String(raw ?? "").trim() as RoomId;
  return ROOMS.includes(value) ? value : null;
}

function cleanQuarter(raw: unknown): QuarterId | null {
  const value = String(raw ?? "").trim() as QuarterId;
  return QUARTERS.includes(value) ? value : null;
}

type PartyDescriptor = { id: string; name: string; cls: ClassName };

function cleanParty(raw: unknown): PartyDescriptor[] | null {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 3) return null;
  const out: PartyDescriptor[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const row = entry as Record<string, unknown>;
    const id = String(row.id ?? "").trim();
    const name = String(row.name ?? "").trim().slice(0, 64);
    const cls = String(row.cls ?? "").trim() as ClassName;
    if (!/^[A-Za-z0-9._:-]{2,96}$/.test(id) || !name || !CLASSES.includes(cls) || seen.has(id)) return null;
    seen.add(id);
    out.push({ id, name, cls });
  }
  return out;
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

type ResidentRow = {
  resident_id: string;
  display_name: string;
  class_key: ClassName;
  xp_total: number;
  revision: number;
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

async function readResidents(ids?: string[]): Promise<ResidentRow[]> {
  const sql = await getSql();
  if (ids) {
    const idsJson = JSON.stringify(ids);
    return sql<ResidentRow>`
      select resident_id, display_name, class_key, xp_total, revision
      from hollow_resident_progress
      where campaign_id = ${CAMPAIGN_ID}
        and resident_id in (select jsonb_array_elements_text(${idsJson}::jsonb))
      order by created_at asc
    `;
  }
  return sql<ResidentRow>`
    select resident_id, display_name, class_key, xp_total, revision
    from hollow_resident_progress
    where campaign_id = ${CAMPAIGN_ID}
    order by created_at asc
  `;
}

async function countActiveRiders() {
  const sql = await getSql();
  const rows = await sql<{ count: number }>`
    select count(*)::bigint as count from hollow_campaign_member where campaign_id = ${CAMPAIGN_ID}
  `;
  return Number(rows[0]?.count ?? 0);
}

function progressJson(row: ProgressRow, residents: ResidentRow[]) {
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
    residents: residents.map((resident) => ({
      id: resident.resident_id,
      name: resident.display_name,
      cls: resident.class_key,
      xpTotal: resident.xp_total,
      ...authorityResidentLevel(resident.xp_total),
      revision: resident.revision,
    })),
    authority: "server",
  };
}

async function payloadFor(userId: string, row?: ProgressRow | null) {
  const progress = row ?? (await readProgress(userId));
  if (!progress) return null;
  const residents = await readResidents();
  return progressJson(progress, residents);
}

type MissionTicketRow = {
  ticket_id: string;
  region: RegionId;
  mission_kind: MissionKind;
  party_ids: string[];
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
    partyIds: row.party_ids ?? [],
    issuedAt: row.issued_at,
    availableAt: row.available_at,
    expiresAt: row.expires_at,
    settledAt: row.settled_at,
  };
}

async function registerResidents(userId: string, party: PartyDescriptor[]) {
  const sql = await getSql();
  for (const resident of party) {
    await sql`
      insert into hollow_resident_progress (
        campaign_id, resident_id, created_by_user_id, display_name, class_key, xp_total, revision, created_at, updated_at
      ) values (
        ${CAMPAIGN_ID}, ${resident.id}, ${userId}, ${resident.name}, ${resident.cls}, 0, 1, now(), now()
      )
      on conflict (campaign_id, resident_id) do update set
        -- Class identity is immutable after first server registration. The
        -- browser may rename a resident for display, but cannot flip a trained
        -- Ironbound into another class to satisfy raid-diversity checks.
        display_name = excluded.display_name,
        revision = hollow_resident_progress.revision + 1,
        updated_at = now()
      where hollow_resident_progress.created_by_user_id = ${userId}
    `;
  }
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

async function validateMissionStart(
  row: ProgressRow,
  region: RegionId,
  kind: MissionKind,
  partyIds: string[],
): Promise<string | null> {
  if (!regionUnlocked(region, row.boss_clears ?? {})) return `${region} is locked by the previous regional boss.`;
  if (!partyIds.length) return "A server mission requires at least one registered resident.";
  if (kind !== "boss") return null;
  if (row.boss_clears?.[region]) return `${region} boss has already been cleared.`;

  const gate = AUTHORITY_BOSS_GATES[region];
  if (row.campaign_day < BOSS_DAY_GATE[region]) {
    return `${region} raid window opens on campaign day ${BOSS_DAY_GATE[region]} (day ${row.campaign_day}).`;
  }
  const intel = Number(row.region_intel?.[region] ?? 0);
  if (intel < gate.minIntel) return `Raid intel ${intel}/${gate.minIntel}. Scout and operate in the region first.`;
  if (row.xp < gate.minRiderXp) return `Your Moon Squad card needs ${gate.minRiderXp}+ contribution XP (${row.xp}/${gate.minRiderXp}).`;

  const ready = await eligibleRaidRiders(gate.minRiderXp);
  if (ready < gate.minRiders) {
    return `Raid requires ${gate.minRiders} riders with ${gate.minRiderXp}+ contribution XP (${ready}/${gate.minRiders}).`;
  }
  if (partyIds.length < gate.minParty) return `Raid requires ${gate.minParty} field residents.`;

  const residents = await readResidents(partyIds);
  if (residents.length !== partyIds.length) return "Every raid resident must exist in the authoritative roster.";
  const classes = new Set(residents.map((resident) => resident.class_key));
  if (classes.size < gate.minClasses) return `Raid requires ${gate.minClasses} different Hollow Realm classes.`;
  const qualified = residents.filter((resident) => authorityResidentLevel(resident.xp_total).level >= gate.minResidentLevel).length;
  if (qualified < gate.minParty) {
    return `Raid requires ${gate.minParty} residents at Level ${gate.minResidentLevel}+ (${qualified}/${gate.minParty}).`;
  }
  return null;
}

async function startMission(
  userId: string,
  requestId: string,
  region: RegionId,
  kind: MissionKind,
  party: PartyDescriptor[],
) {
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
    select ticket_id, region, mission_kind, party_ids, issued_at, available_at, expires_at, settled_at, performance_score, reward
    from hollow_mission_ticket
    where user_id = ${userId} and start_request_id = ${requestId}
    limit 1
  `;
  if (existing[0]) return { duplicate: true, ticket: existing[0] };

  const open = await sql<MissionTicketRow>`
    select ticket_id, region, mission_kind, party_ids, issued_at, available_at, expires_at, settled_at, performance_score, reward
    from hollow_mission_ticket
    where campaign_id = ${CAMPAIGN_ID} and user_id = ${userId} and settled_at is null
    limit 1
  `;
  if (open[0]) return { error: "Finish or abandon the current server mission before starting another.", status: 409 as const };

  const progress = await readProgress(userId);
  if (!progress) return { error: "Link TyroneBot before starting authoritative missions.", status: 404 as const };
  await registerResidents(userId, party);
  const partyIds = party.map((resident) => resident.id);
  const blocked = await validateMissionStart(progress, region, kind, partyIds);
  if (blocked) return { error: blocked, status: 409 as const };

  const ticketId = randomBytes(24).toString("hex");
  const now = Date.now();
  const availableAt = new Date(now + missionSettleDelayMs(kind));
  const expiresAt = new Date(now + (kind === "boss" ? 60 : 30) * 60_000);
  const partyJson = JSON.stringify(partyIds);
  await sql`
    insert into hollow_mission_ticket (
      ticket_id, campaign_id, user_id, start_request_id, region, mission_kind,
      party_ids, available_at, expires_at
    ) values (
      ${ticketId}, ${CAMPAIGN_ID}, ${userId}, ${requestId}, ${region}, ${kind},
      ${partyJson}::jsonb, ${availableAt.toISOString()}, ${expiresAt.toISOString()}
    )
    on conflict do nothing
  `;

  const rows = await sql<MissionTicketRow>`
    select ticket_id, region, mission_kind, party_ids, issued_at, available_at, expires_at, settled_at, performance_score, reward
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
  const partyJson = JSON.stringify(ticket.party_ids ?? []);
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
    ), resident_move as (
      update hollow_resident_progress
      set
        xp_total = xp_total + ${reward.residentXp},
        revision = revision + 1,
        updated_at = now()
      where campaign_id = ${CAMPAIGN_ID}
        and resident_id in (select jsonb_array_elements_text(${partyJson}::jsonb))
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
  const partyJson = JSON.stringify(ticket.party_ids ?? []);
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
    ), resident_move as (
      update hollow_resident_progress
      set
        xp_total = xp_total + ${reward.residentXp},
        revision = revision + 1,
        updated_at = now()
      where campaign_id = ${CAMPAIGN_ID}
        and resident_id in (select jsonb_array_elements_text(${partyJson}::jsonb))
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
    select ticket_id, region, mission_kind, party_ids, issued_at, available_at, expires_at, settled_at, performance_score, reward
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
  const blocked = await validateMissionStart(progress, ticket.region, ticket.mission_kind, ticket.party_ids ?? []);
  if (blocked) return { error: blocked, status: 409 as const };

  const score = normalizePerformanceScore(rawScore);
  const chance = ticket.mission_kind === "boss"
    ? 1
    : authorityMissionReward(ticket.region, ticket.mission_kind as Exclude<MissionKind, "boss">).materialChance;
  const materialQty = ticket.mission_kind === "boss"
    ? 2 + REGIONS.indexOf(ticket.region)
    : randomInt(10_000) < Math.round(chance * 10_000) ? 1 : 0;

  const settled = ticket.mission_kind === "boss"
    ? await settleBossMission(userId, ticket, score, materialQty)
    : await settleStandardMission(userId, ticket, score, materialQty);

  if (!settled.result.accepted || !settled.result.moved) {
    const reread = await sql<MissionTicketRow>`
      select ticket_id, region, mission_kind, party_ids, issued_at, available_at, expires_at, settled_at, performance_score, reward
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

function bossClearCount(row: ProgressRow) {
  return REGIONS.filter((region) => !!row.boss_clears?.[region]).length;
}

function upgradeBlock(
  row: ProgressRow,
  quote: AuthorityUpgradeQuote,
  residents: ResidentRow[],
  riderCount: number,
): string | null {
  if (row.campaign_day < quote.minDay) return `Vault protocol: tier ${quote.nextLevel} opens on day ${quote.minDay}.`;
  if (row.command_rank < quote.commandRank) return `Tier ${quote.nextLevel} requires Command Rank ${quote.commandRank} (${row.command_rank}/${quote.commandRank}).`;
  if (row.vault_caps < quote.caps) return `Need ${quote.caps.toLocaleString()} bottle caps.`;
  if (row.hollow_ore < quote.ore) return `Need ${quote.ore} Hollow Ore.`;
  if (row.moon_favor < quote.favor) return `Need ${quote.favor} Moon Favor.`;
  const materials = Number(row.regional_materials?.[quote.materialRegion] ?? 0);
  if (materials < quote.materials) return `Need ${quote.materials} ${quote.materialRegion} material pieces (${materials}/${quote.materials}).`;
  const bosses = bossClearCount(row);
  if (bosses < quote.bossClears) return `Need ${quote.bossClears} boss clears (${bosses}/${quote.bossClears}).`;
  if (riderCount < quote.riders) return `Need ${quote.riders} linked Moon Squad riders (${riderCount}/${quote.riders}).`;
  if (quote.residentCount) {
    const qualified = residents.filter((resident) => authorityResidentLevel(resident.xp_total).level >= quote.residentLevel).length;
    if (qualified < quote.residentCount) {
      return `Need ${quote.residentCount} resident${quote.residentCount === 1 ? "" : "s"} at Level ${quote.residentLevel}+ (${qualified}/${quote.residentCount}).`;
    }
  }
  return null;
}

async function upgradeRoom(userId: string, requestId: string, room: RoomId) {
  const before = await readProgress(userId);
  if (!before) return { error: "authoritative campaign unavailable", status: 503 as const };
  const currentLevel = Math.max(0, Number(before.rooms?.[room] ?? 0));
  const quote = authorityRoomUpgradeQuote(room, currentLevel);
  if (!quote) return { error: "Vault 13 facility is already at maximum tier.", status: 409 as const };
  const residents = await readResidents();
  const riderCount = await countActiveRiders();
  const blocked = upgradeBlock(before, quote, residents, riderCount);
  if (blocked) return { error: blocked, status: 409 as const };

  const sql = await getSql();
  const rows = await sql<SettlementResult>`
    with guard as (
      insert into hollow_command_receipt (user_id, request_id, command_type)
      values (${userId}, ${requestId}, ${`upgrade_room:${room}`})
      on conflict (user_id, request_id) do nothing
      returning 1
    ), move as (
      update hollow_campaign_state
      set
        vault_caps = vault_caps - ${quote.caps},
        hollow_ore = hollow_ore - ${quote.ore},
        moon_favor = moon_favor - ${quote.favor},
        regional_materials = jsonb_set(regional_materials, array[${quote.materialRegion}]::text[], to_jsonb(coalesce((regional_materials ->> ${quote.materialRegion})::int, 0) - ${quote.materials}), true),
        rooms = jsonb_set(rooms, array[${room}]::text[], to_jsonb(${quote.nextLevel}::int), true),
        revision = revision + 1,
        updated_at = now()
      where campaign_id = ${CAMPAIGN_ID}
        and coalesce((rooms ->> ${room})::int, 0) = ${currentLevel}
        and vault_caps >= ${quote.caps}
        and hollow_ore >= ${quote.ore}
        and moon_favor >= ${quote.favor}
        and coalesce((regional_materials ->> ${quote.materialRegion})::int, 0) >= ${quote.materials}
        and exists (select 1 from guard)
      returning 1
    )
    select exists(select 1 from guard) as accepted,
           exists(select 1 from move) as moved
  `;
  return { result: rows[0] ?? { accepted: false, moved: false }, quote };
}

async function upgradeQuarter(userId: string, requestId: string, quarter: QuarterId) {
  const before = await readProgress(userId);
  if (!before) return { error: "authoritative campaign unavailable", status: 503 as const };
  const currentLevel = Math.max(0, Number(before.quarters?.[quarter] ?? 0));
  const quote = authorityQuarterUpgradeQuote(quarter, currentLevel);
  if (!quote) return { error: "Resident quarter is already at maximum tier.", status: 409 as const };
  const residents = await readResidents();
  const riderCount = await countActiveRiders();
  const blocked = upgradeBlock(before, quote, residents, riderCount);
  if (blocked) return { error: blocked, status: 409 as const };

  const sql = await getSql();
  const rows = await sql<SettlementResult>`
    with guard as (
      insert into hollow_command_receipt (user_id, request_id, command_type)
      values (${userId}, ${requestId}, ${`upgrade_quarter:${quarter}`})
      on conflict (user_id, request_id) do nothing
      returning 1
    ), move as (
      update hollow_campaign_state
      set
        vault_caps = vault_caps - ${quote.caps},
        hollow_ore = hollow_ore - ${quote.ore},
        moon_favor = moon_favor - ${quote.favor},
        regional_materials = jsonb_set(regional_materials, array[${quote.materialRegion}]::text[], to_jsonb(coalesce((regional_materials ->> ${quote.materialRegion})::int, 0) - ${quote.materials}), true),
        quarters = jsonb_set(quarters, array[${quarter}]::text[], to_jsonb(${quote.nextLevel}::int), true),
        revision = revision + 1,
        updated_at = now()
      where campaign_id = ${CAMPAIGN_ID}
        and coalesce((quarters ->> ${quarter})::int, 0) = ${currentLevel}
        and vault_caps >= ${quote.caps}
        and hollow_ore >= ${quote.ore}
        and moon_favor >= ${quote.favor}
        and coalesce((regional_materials ->> ${quote.materialRegion})::int, 0) >= ${quote.materials}
        and exists (select 1 from guard)
      returning 1
    )
    select exists(select 1 from guard) as accepted,
           exists(select 1 from move) as moved
  `;
  return { result: rows[0] ?? { accepted: false, moved: false }, quote };
}

export const Route = createFileRoute("/api/hollow/progression")({
  server: {
    handlers: {
      GET: async () => {
        const identity = await verifiedUser();
        if (identity.response) return identity.response;
        const payload = await payloadFor(identity.userId!);
        if (!payload) return json({ error: "Link TyroneBot before using server campaign progression." }, 404);
        return json(payload);
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
          const party = cleanParty(body.party);
          if (!requestId || !region || !kind || !party) return json({ error: "invalid mission contract" }, 400);
          const result = await startMission(userId, requestId, region, kind, party);
          if ("error" in result) return json({ error: result.error }, result.status);
          const payload = await payloadFor(userId);
          if (!payload) return json({ error: "authoritative campaign unavailable" }, 503);
          return json({ ok: true, duplicate: result.duplicate, ticket: ticketJson(result.ticket), ...payload });
        }

        if (command === "settle_mission") {
          const ticketId = cleanTicketId(body.ticketId);
          if (!ticketId) return json({ error: "invalid mission ticket" }, 400);
          const result = await settleMission(userId, ticketId, body.performanceScore);
          if ("error" in result) return json({ error: result.error }, result.status);
          const payload = await payloadFor(userId);
          if (!payload) return json({ error: "authoritative campaign unavailable" }, 503);
          return json({
            ok: true,
            duplicate: result.duplicate,
            reward: result.reward,
            ticket: ticketJson(result.ticket),
            ...payload,
          });
        }

        if (command === "advance_day") {
          const requestId = cleanRequestId(body.requestId);
          if (!requestId) return json({ error: "invalid request id" }, 400);
          const result = await advanceDay(userId, requestId);
          const payload = await payloadFor(userId);
          if (!payload) return json({ error: "authoritative campaign unavailable" }, 503);
          if (!result.accepted) return json({ ok: true, duplicate: true, ...payload });
          if (!result.moved) {
            return json({ error: "Complete at least one server-settled mission before advancing the campaign day.", ...payload }, 409);
          }
          return json({ ok: true, ...payload });
        }

        if (command === "upgrade_room") {
          const requestId = cleanRequestId(body.requestId);
          const room = cleanRoom(body.room);
          if (!requestId || !room) return json({ error: "invalid Vault facility upgrade" }, 400);
          const result = await upgradeRoom(userId, requestId, room);
          if ("error" in result) return json({ error: result.error }, result.status);
          const payload = await payloadFor(userId);
          if (!payload) return json({ error: "authoritative campaign unavailable" }, 503);
          if (!result.result.accepted) return json({ ok: true, duplicate: true, ...payload });
          if (!result.result.moved) return json({ error: "Vault state changed before construction settled. Refresh and retry.", ...payload }, 409);
          return json({ ok: true, upgrade: result.quote, ...payload });
        }

        if (command === "upgrade_quarter") {
          const requestId = cleanRequestId(body.requestId);
          const quarter = cleanQuarter(body.quarter);
          if (!requestId || !quarter) return json({ error: "invalid resident-quarter upgrade" }, 400);
          const result = await upgradeQuarter(userId, requestId, quarter);
          if ("error" in result) return json({ error: result.error }, result.status);
          const payload = await payloadFor(userId);
          if (!payload) return json({ error: "authoritative campaign unavailable" }, 503);
          if (!result.result.accepted) return json({ ok: true, duplicate: true, ...payload });
          if (!result.result.moved) return json({ error: "Vault state changed before construction settled. Refresh and retry.", ...payload }, 409);
          return json({ ok: true, upgrade: result.quote, ...payload });
        }

        return json({ error: "unknown progression command" }, 400);
      },
    },
  },
});
