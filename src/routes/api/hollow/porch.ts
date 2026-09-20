import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { requireUserId } from "@/lib/auth/verify.server";
import { DISCORD_PROVIDER_ID } from "@/lib/auth/providers";

const MAX = 10;
const STALE_SECONDS = 45;
const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

const globalRef = globalThis as typeof globalThis & { __porchSchemaPromise__?: Promise<void> };

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS });
}

async function ensurePorch(sql: Awaited<ReturnType<typeof getSql>>) {
  globalRef.__porchSchemaPromise__ ??= (async () => {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS hollow_porch (
        discord_id text PRIMARY KEY,
        user_id text NOT NULL,
        name text NOT NULL,
        handle text NOT NULL DEFAULT '',
        screen text NOT NULL DEFAULT 'hq',
        last_seen timestamptz NOT NULL DEFAULT now()
      )
    `);
    await sql.query(`CREATE INDEX IF NOT EXISTS hollow_porch_seen ON hollow_porch (last_seen desc)`);
  })().catch((err) => {
    globalRef.__porchSchemaPromise__ = undefined;
    throw err;
  });
  return globalRef.__porchSchemaPromise__;
}

function authDisabled() {
  return String(process.env.VITE_AUTH_ENABLED ?? "").trim() === "false";
}

function cleanScreen(raw: unknown) {
  const value = String(raw ?? "hq").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
  return value || "hq";
}

async function identity(userId: string) {
  const sql = await getSql();
  const links = await sql<{ discord_id: string }>`
    select discord_id from hollow_identity_link where user_id = ${userId} limit 1
  `;
  if (links[0]) return { discordId: links[0].discord_id, name: "Rider" };
  const accounts = await sql<{ account_id: string; name: string }>`
    select a."accountId" as account_id, u."name" as name
    from "account" a
    join "user" u on u."id" = a."userId"
    where a."userId" = ${userId} and a."providerId" = ${DISCORD_PROVIDER_ID}
    order by a."createdAt" desc
    limit 1
  `;
  const account = accounts[0];
  if (account && /^\d{17,22}$/.test(account.account_id)) {
    return { discordId: account.account_id, name: account.name || "Rider" };
  }
  return null;
}

async function snapshot(sql: Awaited<ReturnType<typeof getSql>>, selfId: string) {
  const seats = await sql<{ discord_id: string; name: string; handle: string; screen: string }>`
    select discord_id, name, handle, screen
    from hollow_porch
    where last_seen > now() - interval '45 seconds'
    order by last_seen desc
    limit ${MAX}
  `;
  return {
    ok: true,
    seated: seats.some((row) => row.discord_id === selfId),
    full: seats.length >= MAX && !seats.some((row) => row.discord_id === selfId),
    live: seats.length,
    max: MAX,
    seats: seats.map((row) => ({
      discordId: row.discord_id,
      name: row.name,
      handle: row.handle,
      screen: row.screen,
      self: row.discord_id === selfId,
    })),
  };
}

async function user() {
  if (authDisabled()) return { userId: "dev-preview", discordId: "dev-preview", name: "Preview" };
  try {
    assertSameSiteRequest();
    const userId = await requireUserId();
    const who = await identity(userId);
    if (!who) return { response: json({ error: "Discord file not linked", seated: false, full: false, live: 0, max: MAX, seats: [] }, 403) };
    return { userId, discordId: who.discordId, name: who.name };
  } catch {
    return { response: json({ error: "unauthorized", seated: false, full: false, live: 0, max: MAX, seats: [] }, 401) };
  }
}

export const Route = createFileRoute("/api/hollow/porch")({
  server: {
    handlers: {
      GET: async () => {
        const who = await user();
        if ("response" in who && who.response) return who.response;
        const sql = await getSql();
        await ensurePorch(sql);
        return json(await snapshot(sql, who.discordId!));
      },
      POST: async ({ request }) => {
        const who = await user();
        if ("response" in who && who.response) return who.response;
        let screen = "hq";
        let handle = "";
        let name = who.name ?? "Rider";
        try {
          const body = (await request.json()) as { screen?: string; handle?: string; name?: string };
          screen = cleanScreen(body.screen);
          handle = String(body.handle ?? "").replace(/^@/, "").slice(0, 32);
          if (body.name?.trim()) name = body.name.trim().slice(0, 32);
        } catch {
          /* empty body is a heartbeat */
        }
        const sql = await getSql();
        await ensurePorch(sql);
        const live = await snapshot(sql, who.discordId!);
        if (live.full) {
          return json({ ...live, error: "The porch holds ten. Wait for a stool." }, 409);
        }
        await sql`
          insert into hollow_porch (discord_id, user_id, name, handle, screen, last_seen)
          values (${who.discordId}, ${who.userId}, ${name}, ${handle}, ${screen}, now())
          on conflict (discord_id) do update set
            user_id = excluded.user_id,
            name = excluded.name,
            handle = excluded.handle,
            screen = excluded.screen,
            last_seen = now()
        `;
        return json(await snapshot(sql, who.discordId!));
      },
      DELETE: async () => {
        const who = await user();
        if ("response" in who && who.response) return who.response;
        const sql = await getSql();
        await ensurePorch(sql);
        await sql`delete from hollow_porch where discord_id = ${who.discordId}`;
        return json(await snapshot(sql, who.discordId!));
      },
    },
  },
});
