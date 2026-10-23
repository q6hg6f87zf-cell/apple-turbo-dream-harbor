import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { pendingMigrations } from "./migration-plan.mjs";

/**
 * World-consequence settle: migrations through 0019, MissionSettled payload
 * carries heatDelta/intelDelta/beatId/worldConsequence.offerMutations, boss
 * path appends BossCleared companion, retry cannot double-append.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS = join(ROOT, "migrations");
const CAMPAIGN = "moon-squad";
const DISCORD = "444444444444444444";
const USER = "user-world-consequence-1";
const RESIDENT = "res-wc-1";

async function applyAll(pg) {
  await pg.exec(
    "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const entries = await readdir(MIGRATIONS);
  const done = (await pg.query("select name from _migrations")).rows.map((r) => r.name);
  const pending = pendingMigrations(entries, done);
  for (const { name } of pending) {
    const text = await readFile(join(MIGRATIONS, name), "utf8");
    await pg.transaction(async (tx) => {
      await tx.exec(text);
      await tx.query("insert into _migrations (name) values ($1)", [name]);
    });
  }
  return pending.map((row) => row.name);
}

async function seedIdentity(pg) {
  await pg.query(
    `insert into tyrone_arcade_snapshot (discord_id, display_name, caps, xp, level)
     values ($1, 'World Consequence Rider', 0, 0, 1)
     on conflict (discord_id) do nothing`,
    [DISCORD],
  );
  await pg.query(
    `insert into hollow_identity_link (user_id, discord_id)
     values ($1, $2)
     on conflict (user_id) do nothing`,
    [USER, DISCORD],
  );
  await pg.query(
    `insert into hollow_campaign_member (campaign_id, user_id, discord_id, card_caps, xp, level, revision)
     values ($1, $2, $3, 0, 50, 1, 1)
     on conflict (campaign_id, user_id) do nothing`,
    [CAMPAIGN, USER, DISCORD],
  );
  await pg.query(
    `insert into hollow_resident_progress (
       campaign_id, resident_id, created_by_user_id, display_name, class_key, xp_total, revision, forge_sealed
     ) values ($1, $2, $3, 'Scout', 'Rogue', 40, 1, true)
     on conflict (campaign_id, resident_id) do nothing`,
    [CAMPAIGN, RESIDENT, USER],
  );
}

function ticketId(suffix) {
  return (`b`.repeat(48) + suffix).slice(0, 64);
}

async function insertOpenTicket(pg, id, kind = "scout", region = "ironclad") {
  await pg.query(
    `insert into hollow_mission_ticket (
       ticket_id, campaign_id, user_id, start_request_id, region, mission_kind,
       issued_at, available_at, expires_at, party_ids
     ) values (
       $1, $2, $3, $4, $5, $6,
       now() - interval '2 minutes', now() - interval '1 minute', now() + interval '1 hour',
       $7::jsonb
     )`,
    [id, CAMPAIGN, USER, `start-req-${id.slice(-20)}`, region, kind, JSON.stringify([RESIDENT])],
  );
}

async function runStandardSettle(pg, { ticket, score, intel, requestId, payloadExtra }) {
  const reward = {
    region: "ironclad",
    kind: "scout",
    performanceScore: score,
    scaleFactor: 1,
    vaultCaps: 180,
    cardCaps: 32,
    ore: 0,
    favor: 1,
    riderXp: 3,
    residentXp: 18,
    intel,
    missionCount: 1,
    materialQty: 0,
  };
  const eventPayload = {
    ...reward,
    theater: "MissionSettled",
    beatId: intel > 0 ? "intel_drop" : "mission_settle",
    heatDelta: 1,
    intelDelta: intel,
    region: "ironclad",
    kind: "scout",
    worldConsequence: {
      offerMutations: [
        { op: "boost", region: "ironclad", kinds: ["scout", "forage"], weight: 1, reason: "intel_drop" },
      ],
    },
    idempotencyKey: `mission-settled:${ticket}`,
    ...payloadExtra,
  };
  const rewardJson = JSON.stringify(reward);
  const partyJson = JSON.stringify([RESIDENT]);
  const req = requestId ?? "";
  const eventId = `mse-${ticket}`;
  const idemKey = `mission-settled:${ticket}`;

  return pg.query(
    `with ticket_guard as (
       update hollow_mission_ticket
       set settled_at = now(), performance_score = $1, reward = $2::jsonb
       where ticket_id = $3 and campaign_id = $4 and user_id = $5
         and settled_at is null and available_at <= now() and expires_at > now()
       returning 1
     ), campaign_move as (
       update hollow_campaign_state
       set
         vault_caps = vault_caps + 180,
         region_intel = jsonb_set(region_intel, array['ironclad']::text[], to_jsonb(coalesce((region_intel ->> 'ironclad')::int, 0) + $6), true),
         missions_since_day = missions_since_day + 1,
         revision = revision + 1,
         updated_at = now()
       where campaign_id = $4 and exists (select 1 from ticket_guard)
       returning 1
     ), member_move as (
       update hollow_campaign_member
       set card_caps = card_caps + 32, xp = xp + 3, revision = revision + 1, updated_at = now()
       where campaign_id = $4 and user_id = $5 and exists (select 1 from campaign_move)
       returning 1
     ), receipt as (
       insert into hollow_command_receipt (user_id, request_id, command_type)
       select $5, $7, 'settle_mission'
       where $7 <> '' and exists (select 1 from ticket_guard)
       on conflict (user_id, request_id) do nothing
       returning 1
     ), domain_event as (
       insert into hollow_domain_event (
         event_id, campaign_id, user_id, event_type, payload, request_id, ticket_id, idempotency_key
       )
       select $8, $4, $5, 'MissionSettled', $9::jsonb, nullif($7, ''), $3, $10
       where exists (select 1 from campaign_move)
       on conflict (idempotency_key) do nothing
       returning 1
     )
     select exists(select 1 from ticket_guard) as accepted,
            exists(select 1 from domain_event) as evented`,
    [score, rewardJson, ticket, CAMPAIGN, USER, intel, req, eventId, JSON.stringify(eventPayload), idemKey],
  );
}

async function runBossSettle(pg, { ticket, requestId }) {
  const reward = {
    region: "ironclad",
    kind: "boss",
    performanceScore: 500,
    scaleFactor: 1,
    vaultCaps: 12000,
    cardCaps: 1500,
    ore: 20,
    favor: 6,
    riderXp: 22,
    residentXp: 125,
    intel: 1,
    missionCount: 1,
    materialQty: 2,
    commandRank: 2,
  };
  const msePayload = {
    ...reward,
    theater: "MissionSettled",
    beatId: "boss_clear",
    heatDelta: 8,
    intelDelta: 1,
    region: "ironclad",
    kind: "boss",
    worldConsequence: { offerMutations: [] },
    idempotencyKey: `mission-settled:${ticket}`,
  };
  const bcePayload = {
    region: "ironclad",
    kind: "boss",
    theater: "BossCleared",
    beatId: "boss_clear",
    heatDelta: 8,
    intelDelta: 1,
    worldConsequence: {
      offerMutations: [
        { op: "unlock", region: "ironclad", kinds: ["trade", "forage"], reason: "boss_clear_followup" },
        { op: "cool", region: "ironclad", kinds: ["raid", "bounty"], weight: 2, reason: "boss_clear_exhale" },
        { op: "unlock", region: "slagtown", kinds: ["scout", "forage"], reason: "authority_region_unlocked" },
        { op: "boost", region: "slagtown", kinds: ["scout"], weight: 1, reason: "authority_region_unlocked" },
      ],
    },
    idempotencyKey: `boss-cleared:${ticket}`,
  };
  const req = requestId ?? "";
  return pg.query(
    `with ticket_guard as (
       update hollow_mission_ticket
       set settled_at = now(), performance_score = 500, reward = $1::jsonb
       where ticket_id = $2 and campaign_id = $3 and user_id = $4
         and settled_at is null and available_at <= now() and expires_at > now()
       returning 1
     ), campaign_move as (
       update hollow_campaign_state
       set
         vault_caps = vault_caps + 12000,
         command_rank = greatest(command_rank, 2),
         boss_clears = jsonb_set(boss_clears, array['ironclad']::text[], 'true'::jsonb, true),
         region_intel = jsonb_set(region_intel, array['ironclad']::text[], to_jsonb(coalesce((region_intel ->> 'ironclad')::int, 0) + 1), true),
         missions_since_day = missions_since_day + 1,
         revision = revision + 1,
         updated_at = now()
       where campaign_id = $3
         and coalesce((boss_clears ->> 'ironclad')::boolean, false) = false
         and exists (select 1 from ticket_guard)
       returning 1
     ), domain_event as (
       insert into hollow_domain_event (
         event_id, campaign_id, user_id, event_type, payload, request_id, ticket_id, idempotency_key
       )
       select $5, $3, $4, 'MissionSettled', $6::jsonb, nullif($7, ''), $2, $8
       where exists (select 1 from campaign_move)
       on conflict (idempotency_key) do nothing
       returning 1
     ), boss_cleared_event as (
       insert into hollow_domain_event (
         event_id, campaign_id, user_id, event_type, payload, request_id, ticket_id, idempotency_key
       )
       select $9, $3, $4, 'BossCleared', $10::jsonb, nullif($7, ''), $2, $11
       where exists (select 1 from campaign_move)
       on conflict (idempotency_key) do nothing
       returning 1
     )
     select exists(select 1 from ticket_guard) as accepted,
            exists(select 1 from domain_event) as mission_evented,
            exists(select 1 from boss_cleared_event) as boss_evented`,
    [
      JSON.stringify(reward),
      ticket,
      CAMPAIGN,
      USER,
      `mse-${ticket}`,
      JSON.stringify(msePayload),
      req,
      `mission-settled:${ticket}`,
      `bce-${ticket}`,
      JSON.stringify(bcePayload),
      `boss-cleared:${ticket}`,
    ],
  );
}

test("world consequence: 0019, MissionSettled payload, BossCleared companion, retry inert", { timeout: 90_000 }, async () => {
  const pg = new PGlite();
  await pg.waitReady;
  const applied = await applyAll(pg);
  assert.ok(
    applied.includes("0019_hollow_boss_cleared_event.sql") ||
      (await pg.query("select name from _migrations where name = '0019_hollow_boss_cleared_event.sql'")).rows.length === 1,
    "0019_hollow_boss_cleared_event.sql must apply",
  );

  await pg.exec("drop trigger if exists hollow_mission_performance_authority on hollow_mission_ticket");
  await seedIdentity(pg);

  const t1 = ticketId("scoutwc01");
  await insertOpenTicket(pg, t1, "scout");
  const first = await runStandardSettle(pg, {
    ticket: t1,
    score: 500,
    intel: 2,
    requestId: "settle-wc-scout-001",
  });
  assert.equal(first.rows[0].accepted, true);
  assert.equal(first.rows[0].evented, true);

  const mse = await pg.query(
    `select payload from hollow_domain_event where ticket_id = $1 and event_type = 'MissionSettled'`,
    [t1],
  );
  assert.equal(mse.rows.length, 1);
  const payload = mse.rows[0].payload;
  assert.equal(payload.theater, "MissionSettled");
  assert.equal(payload.beatId, "intel_drop");
  assert.equal(payload.heatDelta, 1);
  assert.equal(payload.intelDelta, 2);
  assert.equal(payload.region, "ironclad");
  assert.equal(payload.kind, "scout");
  assert.ok(Array.isArray(payload.worldConsequence?.offerMutations));
  assert.ok(payload.worldConsequence.offerMutations.length >= 1);
  assert.equal(payload.worldConsequence.heatDelta, undefined);

  // Retry — no second MissionSettled
  const retry = await runStandardSettle(pg, {
    ticket: t1,
    score: 500,
    intel: 2,
    requestId: "settle-wc-scout-002",
  });
  assert.equal(retry.rows[0].accepted, false);
  assert.equal(retry.rows[0].evented, false);
  const count1 = await pg.query(`select count(*)::int as n from hollow_domain_event where ticket_id = $1`, [t1]);
  assert.equal(count1.rows[0].n, 1);

  // Boss path: MissionSettled + BossCleared in same TX
  const t2 = ticketId("bosswc001");
  await insertOpenTicket(pg, t2, "boss");
  const boss = await runBossSettle(pg, { ticket: t2, requestId: "settle-wc-boss-001" });
  assert.equal(boss.rows[0].accepted, true);
  assert.equal(boss.rows[0].mission_evented, true);
  assert.equal(boss.rows[0].boss_evented, true);

  const bossEvents = await pg.query(
    `select event_type, idempotency_key, payload from hollow_domain_event where ticket_id = $1 order by event_type`,
    [t2],
  );
  assert.equal(bossEvents.rows.length, 2);
  const types = bossEvents.rows.map((r) => r.event_type).sort();
  assert.deepEqual(types, ["BossCleared", "MissionSettled"]);

  const bce = bossEvents.rows.find((r) => r.event_type === "BossCleared");
  assert.equal(bce.idempotency_key, `boss-cleared:${t2}`);
  assert.equal(bce.payload.theater, "BossCleared");
  assert.equal(bce.payload.beatId, "boss_clear");
  assert.equal(bce.payload.heatDelta, 8);
  assert.ok(bce.payload.worldConsequence.offerMutations.some((m) => m.region === "slagtown"));
  assert.ok(!bce.payload.worldConsequence.offerMutations.some((m) => m.kinds?.includes("boss")));

  // Retry boss settle — no double append
  const bossRetry = await runBossSettle(pg, { ticket: t2, requestId: "settle-wc-boss-002" });
  assert.equal(bossRetry.rows[0].accepted, false);
  assert.equal(bossRetry.rows[0].mission_evented, false);
  assert.equal(bossRetry.rows[0].boss_evented, false);
  const count2 = await pg.query(`select count(*)::int as n from hollow_domain_event where ticket_id = $1`, [t2]);
  assert.equal(count2.rows[0].n, 2);

  // Unique BossCleared index rejects forged duplicate
  await assert.rejects(
    () =>
      pg.query(
        `insert into hollow_domain_event (
           event_id, campaign_id, user_id, event_type, payload, ticket_id, idempotency_key
         ) values ($1, $2, $3, 'BossCleared', '{}'::jsonb, $4, $5)`,
        ["bce-forged-duplicate-rowxx", CAMPAIGN, USER, t2, `boss-cleared:forged-${t2}`],
      ),
    /unique|duplicate/i,
  );

  await pg.close();
});
