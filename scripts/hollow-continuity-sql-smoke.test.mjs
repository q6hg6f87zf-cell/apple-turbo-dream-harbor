import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { pendingMigrations } from "./migration-plan.mjs";

/**
 * Proves migration 0016 (and every earlier file) on real Postgres SQL.
 * Node unit tests cannot call getSql() — Vite's import.meta.glob is missing —
 * so this applies migrations from the filesystem the same way production does.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS = join(ROOT, "migrations");
const A = "111111111111111111";
const B = "222222222222222222";
const PROMISE_COLS = `id, discord_id, kind, subject, status, source, region_id, location_id, poi_id, tags, importance,
  created_at::text as created_at, resolved_at::text as resolved_at, last_surfaced_at::text as last_surfaced_at`;

function promiseId(discordId, kind, subject) {
  return `prm-${createHash("sha256").update(`${discordId}:${kind}:${subject}`).digest("hex").slice(0, 20)}`;
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

test("filesystem migrations apply through 0016 and the promise/bond SQL path holds", { timeout: 60_000 }, async () => {
  const pg = new PGlite();
  await pg.waitReady;
  const applied = await applyAll(pg);
  assert.ok(
    applied.includes("0016_tyrone_continuity.sql") ||
      (await pg.query("select name from _migrations where name = '0016_tyrone_continuity.sql'")).rows.length === 1,
    "0016_tyrone_continuity.sql must apply",
  );

  const tables = await pg.query(
    `select table_name from information_schema.tables
     where table_schema = 'public'
       and table_name in ('hollow_tyrone_bond','hollow_tyrone_bond_event','hollow_tyrone_promise')
     order by table_name`,
  );
  assert.deepEqual(
    tables.rows.map((r) => r.table_name),
    ["hollow_tyrone_bond", "hollow_tyrone_bond_event", "hollow_tyrone_promise"],
  );

  const id = promiseId(A, "return", "Ironclad radio tower");
  const insertSql = `insert into hollow_tyrone_promise (
      id, discord_id, kind, subject, status, source, region_id, location_id, poi_id, tags, importance, related_memory_id
    ) values ($1,$2,$3,$4,'active',$5,$6,$7,$8,$9,$10,$11)
    on conflict (discord_id, id) do nothing
    returning ${PROMISE_COLS}`;
  const first = await pg.query(insertSql, [
    id,
    A,
    "return",
    "Ironclad radio tower",
    "discord",
    "ironclad",
    "ironclad",
    "ironclad-radio",
    ["promise", "radio", "tower"],
    6,
    null,
  ]);
  assert.equal(first.rows.length, 1);
  assert.equal(first.rows[0].source, "discord");
  assert.equal(first.rows[0].status, "active");

  const dup = await pg.query(insertSql, [
    id,
    A,
    "return",
    "Ironclad radio tower",
    "game",
    "ironclad",
    "ironclad",
    "ironclad-radio",
    ["promise", "radio", "tower"],
    9,
    null,
  ]);
  assert.equal(dup.rows.length, 0, "duplicate insert must DO NOTHING");
  const kept = await pg.query(
    `select ${PROMISE_COLS} from hollow_tyrone_promise where discord_id = $1 and id = $2`,
    [A, id],
  );
  assert.equal(kept.rows[0].source, "discord");
  assert.equal(Number(kept.rows[0].importance), 6);

  const bId = promiseId(B, "return", "Ironclad radio tower");
  await pg.query(insertSql, [
    bId,
    B,
    "return",
    "Ironclad radio tower",
    "discord",
    "ironclad",
    "ironclad",
    "ironclad-radio",
    ["promise", "radio", "tower"],
    6,
    null,
  ]);
  const onlyA = await pg.query(
    `select ${PROMISE_COLS} from hollow_tyrone_promise where discord_id = $1 and status = $2`,
    [A, "active"],
  );
  assert.equal(onlyA.rows.length, 1);
  assert.equal(onlyA.rows[0].id, id);
  const onlyB = await pg.query(`select id from hollow_tyrone_promise where discord_id = $1`, [B]);
  assert.equal(onlyB.rows.length, 1);
  assert.notEqual(onlyB.rows[0].id, id);

  const fulfilled = await pg.query(
    `update hollow_tyrone_promise
     set status = $1,
         resolved_at = case when $1 = 'active' then null else now() end
     where discord_id = $2 and id = $3
     returning ${PROMISE_COLS}`,
    ["fulfilled", A, id],
  );
  assert.equal(fulfilled.rows[0].status, "fulfilled");
  assert.ok(fulfilled.rows[0].resolved_at);
  const miss = await pg.query(
    `update hollow_tyrone_promise set status = $1 where discord_id = $2 and id = $3 returning id`,
    ["fulfilled", B, id],
  );
  assert.equal(miss.rows.length, 0, "USER B cannot fulfill USER A's promise");

  await pg.query(`insert into hollow_tyrone_bond (discord_id) values ($1) on conflict (discord_id) do nothing`, [A]);
  const bond0 = await pg.query(
    `select trust, familiarity, respect, conflict, shared_history as "sharedHistory", humor, concern, loyalty
     from hollow_tyrone_bond where discord_id = $1`,
    [A],
  );
  assert.equal(Number(bond0.rows[0].trust), 42);
  assert.equal(Number(bond0.rows[0].humor), 18);
  const nextTrust = 45;
  await pg.query(
    `insert into hollow_tyrone_bond (
      discord_id, trust, familiarity, respect, conflict, shared_history, humor, concern, loyalty, updated_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
    on conflict (discord_id) do update set
      trust = excluded.trust,
      familiarity = excluded.familiarity,
      respect = excluded.respect,
      conflict = excluded.conflict,
      shared_history = excluded.shared_history,
      humor = excluded.humor,
      concern = excluded.concern,
      loyalty = excluded.loyalty,
      updated_at = now()`,
    [A, nextTrust, 6, 32, 4, 2, 18, 12, 48],
  );
  await pg.query(
    `insert into hollow_tyrone_bond_event (
      id, discord_id, field, previous, next, reason, source, event_type
    ) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    ["bnd-sqlsmoke01", A, "trust", 42, nextTrust, "tyrone.promise_fulfilled", "game", "tyrone.promise_fulfilled"],
  );
  const bondA = await pg.query(`select trust, humor from hollow_tyrone_bond where discord_id = $1`, [A]);
  assert.equal(Number(bondA.rows[0].trust), 45);
  assert.equal(Number(bondA.rows[0].humor), 18, "humor stays the stored default");
  const bondB = await pg.query(`select discord_id from hollow_tyrone_bond where discord_id = $1`, [B]);
  assert.equal(bondB.rows.length, 0, "USER B has no bond row from USER A's write");

  const mem = await pg.query(
    `insert into hollow_tyrone_memory (
      id, discord_id, kind, claim, tags, importance, location_id, payload, source, visibility, related_event_id, poi_id
    ) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12)
    on conflict (discord_id, id) do nothing
    returning id, source, visibility, created_at::text as created_at`,
    [
      "mem-tower-a",
      A,
      "promise",
      "We're going back to the Ironclad radio tower.",
      ["promise", "radio", "tower"],
      6,
      "ironclad",
      "{}",
      "system",
      "private",
      null,
      "ironclad-radio",
    ],
  );
  assert.equal(mem.rows[0].source, "system");
  assert.equal(mem.rows[0].visibility, "private");
  const memDup = await pg.query(
    `insert into hollow_tyrone_memory (
      id, discord_id, kind, claim, tags, importance, location_id, payload, source, visibility, related_event_id, poi_id
    ) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12)
    on conflict (discord_id, id) do nothing
    returning source`,
    [
      "mem-tower-a",
      A,
      "promise",
      "We're going back to the Ironclad radio tower.",
      ["promise"],
      9,
      "ironclad",
      "{}",
      "game",
      "public",
      null,
      null,
    ],
  );
  assert.equal(memDup.rows.length, 0);
  const memKept = await pg.query(
    `select source, visibility from hollow_tyrone_memory where discord_id = $1 and id = $2`,
    [A, "mem-tower-a"],
  );
  assert.equal(memKept.rows[0].source, "system");
  assert.equal(memKept.rows[0].visibility, "private");
  const leak = await pg.query(`select id from hollow_tyrone_memory where discord_id = $1`, [B]);
  assert.equal(leak.rows.length, 0);

  await assert.rejects(
    () =>
      pg.query(
        `insert into hollow_tyrone_promise (
          id, discord_id, kind, subject, status, source, tags, importance
        ) values ($1,$2,'invented','nope','active','game','{}',5)`,
        ["prm-bad-kind", A],
      ),
    /kind|check/i,
  );

  await pg.close();
});
