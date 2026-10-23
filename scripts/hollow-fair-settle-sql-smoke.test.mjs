import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { pendingMigrations } from "./migration-plan.mjs";

/**
 * Milestone 1 fair settle: migrations through 0018, scaled rewards in the same
 * TX as ticket_guard + MissionSettled, and request/ticket retry cannot double-credit.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS = join(ROOT, "migrations");
const CAMPAIGN = "moon-squad";
const DISCORD = "333333333333333333";
const USER = "user-fair-settle-1";
const RESIDENT = "res-fair-1";

function scaleAuthorityAmount(base, score) {
  if (!base) return 0;
  const n = Math.max(0, Math.min(1000, Math.round(Number(score))));
  const factor = Math.round((0.55 + (n / 1000) * 0.9) * 1000) / 1000;
  return Math.max(0, Math.round(base * factor));
}

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
     values ($1, 'Fair Settle Rider', 0, 0, 1)
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
  return (`a`.repeat(48) + suffix).slice(0, 64);
}

async function insertOpenTicket(pg, id, kind = "scout") {
  await pg.query(
    `insert into hollow_mission_ticket (
       ticket_id, campaign_id, user_id, start_request_id, region, mission_kind,
       issued_at, available_at, expires_at, party_ids
     ) values (
       $1, $2, $3, $4, 'ironclad', $5,
       now() - interval '2 minutes', now() - interval '1 minute', now() + interval '1 hour',
       $6::jsonb
     )`,
    [id, CAMPAIGN, USER, `start-req-${id.slice(-20)}`, kind, JSON.stringify([RESIDENT])],
  );
}

async function runSettleCte(pg, {
  ticket,
  score,
  vaultCaps,
  cardCaps,
  ore,
  favor,
  riderXp,
  residentXp,
  intel,
  materialQty,
  requestId = null,
}) {
  const reward = {
    region: "ironclad",
    kind: "scout",
    performanceScore: score,
    scaleFactor: Math.round((0.55 + (score / 1000) * 0.9) * 1000) / 1000,
    vaultCaps,
    cardCaps,
    ore,
    favor,
    riderXp,
    residentXp,
    intel,
    missionCount: 1,
    materialQty,
  };
  const rewardJson = JSON.stringify(reward);
  const eventId = `mse-${ticket}`;
  const idemKey = `mission-settled:${ticket}`;
  const eventPayload = JSON.stringify({ ...reward, theater: "MissionSettled", idempotencyKey: idemKey });
  const partyJson = JSON.stringify([RESIDENT]);
  const req = requestId ?? "";

  return pg.query(
    `with ticket_guard as (
       update hollow_mission_ticket
       set settled_at = now(), performance_score = $1, reward = $2::jsonb
       where ticket_id = $3
         and campaign_id = $4
         and user_id = $5
         and settled_at is null
         and available_at <= now()
         and expires_at > now()
       returning 1
     ), campaign_move as (
       update hollow_campaign_state
       set
         vault_caps = vault_caps + $6,
         hollow_ore = hollow_ore + $7,
         moon_favor = moon_favor + $8,
         missions_since_day = missions_since_day + 1,
         region_missions = jsonb_set(region_missions, array['ironclad']::text[], to_jsonb(coalesce((region_missions ->> 'ironclad')::int, 0) + 1), true),
         region_intel = jsonb_set(region_intel, array['ironclad']::text[], to_jsonb(coalesce((region_intel ->> 'ironclad')::int, 0) + $9), true),
         regional_materials = jsonb_set(regional_materials, array['ironclad']::text[], to_jsonb(coalesce((regional_materials ->> 'ironclad')::int, 0) + $10), true),
         revision = revision + 1,
         updated_at = now()
       where campaign_id = $4 and exists (select 1 from ticket_guard)
       returning 1
     ), member_move as (
       update hollow_campaign_member
       set
         card_caps = card_caps + $11,
         xp = xp + $12,
         revision = revision + 1,
         updated_at = now()
       where campaign_id = $4 and user_id = $5
         and exists (select 1 from campaign_move)
       returning 1
     ), resident_move as (
       update hollow_resident_progress
       set
         xp_total = xp_total + $13,
         revision = revision + 1,
         updated_at = now()
       where campaign_id = $4
         and resident_id in (select jsonb_array_elements_text($14::jsonb))
         and exists (select 1 from campaign_move)
       returning 1
     ), receipt as (
       insert into hollow_command_receipt (user_id, request_id, command_type)
       select $5, $15, 'settle_mission'
       where $15 <> ''
         and exists (select 1 from ticket_guard)
       on conflict (user_id, request_id) do nothing
       returning 1
     ), domain_event as (
       insert into hollow_domain_event (
         event_id, campaign_id, user_id, event_type, payload, request_id, ticket_id, idempotency_key
       )
       select
         $16, $4, $5, 'MissionSettled', $17::jsonb, nullif($15, ''), $3, $18
       where exists (select 1 from campaign_move)
       on conflict (idempotency_key) do nothing
       returning 1
     )
     select exists(select 1 from ticket_guard) as accepted,
            exists(select 1 from member_move) as moved,
            exists(select 1 from domain_event) as evented`,
    [
      score,
      rewardJson,
      ticket,
      CAMPAIGN,
      USER,
      vaultCaps,
      ore,
      favor,
      intel,
      materialQty,
      cardCaps,
      riderXp,
      residentXp,
      partyJson,
      req,
      eventId,
      eventPayload,
      idemKey,
    ],
  );
}

async function balances(pg) {
  const campaign = await pg.query(
    `select vault_caps, hollow_ore, moon_favor, revision,
            region_intel->>'ironclad' as intel,
            regional_materials->>'ironclad' as materials
     from hollow_campaign_state where campaign_id = $1`,
    [CAMPAIGN],
  );
  const member = await pg.query(
    `select card_caps, xp, revision from hollow_campaign_member
     where campaign_id = $1 and user_id = $2`,
    [CAMPAIGN, USER],
  );
  return { campaign: campaign.rows[0], member: member.rows[0] };
}

test("fair settle: 0018 applies, scaled credit once, retry is inert", { timeout: 90_000 }, async () => {
  const pg = new PGlite();
  await pg.waitReady;
  const applied = await applyAll(pg);
  assert.ok(
    applied.includes("0018_hollow_domain_event.sql") ||
      (await pg.query("select name from _migrations where name = '0018_hollow_domain_event.sql'")).rows.length === 1,
    "0018_hollow_domain_event.sql must apply",
  );

  const tables = await pg.query(
    `select table_name from information_schema.tables
     where table_schema = 'public' and table_name = 'hollow_domain_event'`,
  );
  assert.equal(tables.rows.length, 1);

  // Deterministic scores for this smoke (production still seals via 0008 trigger).
  await pg.exec("drop trigger if exists hollow_mission_performance_authority on hollow_mission_ticket");

  await seedIdentity(pg);

  const baseVault = 180; // ironclad scout
  const baseCard = Math.max(15, Math.round(baseVault * 0.18));
  const baseIntel = 2;
  const baseRiderXp = 3;
  const baseResidentXp = 18;
  const baseMaterial = 1;

  const low = {
    score: 0,
    vaultCaps: scaleAuthorityAmount(baseVault, 0),
    cardCaps: scaleAuthorityAmount(baseCard, 0),
    ore: 0,
    favor: scaleAuthorityAmount(2, 0),
    riderXp: scaleAuthorityAmount(baseRiderXp, 0),
    residentXp: scaleAuthorityAmount(baseResidentXp, 0),
    intel: scaleAuthorityAmount(baseIntel, 0),
    materialQty: scaleAuthorityAmount(baseMaterial, 0),
  };
  const high = {
    score: 1000,
    vaultCaps: scaleAuthorityAmount(baseVault, 1000),
    cardCaps: scaleAuthorityAmount(baseCard, 1000),
    ore: 0,
    favor: scaleAuthorityAmount(2, 1000),
    riderXp: scaleAuthorityAmount(baseRiderXp, 1000),
    residentXp: scaleAuthorityAmount(baseResidentXp, 1000),
    intel: scaleAuthorityAmount(baseIntel, 1000),
    materialQty: scaleAuthorityAmount(baseMaterial, 1000),
  };

  assert.notEqual(low.vaultCaps, baseVault);
  assert.notEqual(high.vaultCaps, baseVault);
  assert.ok(low.vaultCaps < baseVault);
  assert.ok(high.vaultCaps > baseVault);
  assert.equal(low.vaultCaps, 99);
  assert.equal(high.vaultCaps, 261);

  // Mission favor base 2 → scale band visible: floor/mid/ceil differ ([1,2,3]).
  assert.equal(scaleAuthorityAmount(2, 500), 2);
  assert.equal(low.favor, 1);
  assert.equal(high.favor, 3);
  assert.notEqual(low.favor, high.favor);


  const before = await balances(pg);
  const startVault = Number(before.campaign.vault_caps);
  const startCard = Number(before.member.card_caps);
  const startRev = Number(before.campaign.revision);
  const startMemberRev = Number(before.member.revision);

  const t1 = ticketId("lowscore01");
  await insertOpenTicket(pg, t1);
  const first = await runSettleCte(pg, { ticket: t1, requestId: "settle-req-low-001", ...low });
  assert.equal(first.rows[0].accepted, true);
  assert.equal(first.rows[0].moved, true);
  assert.equal(first.rows[0].evented, true);

  const mid = await balances(pg);
  assert.equal(Number(mid.campaign.vault_caps), startVault + low.vaultCaps);
  assert.equal(Number(mid.member.card_caps), startCard + low.cardCaps);
  assert.equal(Number(mid.campaign.revision), startRev + 1);
  assert.equal(Number(mid.member.revision), startMemberRev + 1);

  const events = await pg.query(
    `select event_type, ticket_id, idempotency_key, payload->>'scaleFactor' as scale
     from hollow_domain_event where ticket_id = $1`,
    [t1],
  );
  assert.equal(events.rows.length, 1);
  assert.equal(events.rows[0].event_type, "MissionSettled");
  assert.equal(events.rows[0].idempotency_key, `mission-settled:${t1}`);
  assert.equal(Number(events.rows[0].scale), 0.55);

  // Retry same ticket — ticket_guard no-ops; balances and event count unchanged.
  const retry = await runSettleCte(pg, { ticket: t1, requestId: "settle-req-low-002", ...low });
  assert.equal(retry.rows[0].accepted, false);
  assert.equal(retry.rows[0].moved, false);
  assert.equal(retry.rows[0].evented, false);

  const afterRetry = await balances(pg);
  assert.equal(Number(afterRetry.campaign.vault_caps), Number(mid.campaign.vault_caps));
  assert.equal(Number(afterRetry.member.card_caps), Number(mid.member.card_caps));
  assert.equal(Number(afterRetry.campaign.revision), Number(mid.campaign.revision));
  assert.equal(Number(afterRetry.member.revision), Number(mid.member.revision));

  const eventCount = await pg.query(`select count(*)::int as n from hollow_domain_event where ticket_id = $1`, [t1]);
  assert.equal(eventCount.rows[0].n, 1);

  // Unique settle identity rejects a forged second MissionSettled for the same ticket.
  await assert.rejects(
    () =>
      pg.query(
        `insert into hollow_domain_event (
           event_id, campaign_id, user_id, event_type, payload, ticket_id, idempotency_key
         ) values ($1, $2, $3, 'MissionSettled', '{}'::jsonb, $4, $5)`,
        ["mse-forged-duplicate-row", CAMPAIGN, USER, t1, `mission-settled:${t1}`],
      ),
    /unique|duplicate/i,
  );

  // High score path credits a different scaled amount on a fresh ticket.
  const t2 = ticketId("highscore1");
  await insertOpenTicket(pg, t2);
  const beforeHigh = await balances(pg);
  const highResult = await runSettleCte(pg, { ticket: t2, requestId: "settle-req-high-001", ...high });
  assert.equal(highResult.rows[0].accepted, true);
  assert.equal(highResult.rows[0].moved, true);
  const afterHigh = await balances(pg);
  assert.equal(Number(afterHigh.campaign.vault_caps), Number(beforeHigh.campaign.vault_caps) + high.vaultCaps);
  assert.equal(Number(afterHigh.member.card_caps), Number(beforeHigh.member.card_caps) + high.cardCaps);
  assert.notEqual(high.vaultCaps, low.vaultCaps);

  const highEvent = await pg.query(
    `select payload->>'scaleFactor' as scale from hollow_domain_event where ticket_id = $1`,
    [t2],
  );
  assert.equal(Number(highEvent.rows[0].scale), 1.45);

  await pg.close();
});
