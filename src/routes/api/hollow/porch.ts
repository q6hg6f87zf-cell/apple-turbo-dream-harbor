import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { hollowVerifiedUser } from "@/lib/hollow-identity.server";

const MAX = 10;
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

function cleanScreen(raw: unknown) {
  const value = String(raw ?? "hq").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
  return value || "hq";
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

function user(request?: Request) {
  return hollowVerifiedUser(request);
}

export const Route = createFileRoute("/api/hollow/porch")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const who = user(request);
        if (who.response) return who.response;
        const sql = await getSql();
        await ensurePorch(sql);
        return json(await snapshot(sql, who.discordId!));
      },
      POST: async ({ request }) => {
        const who = user(request);
        if (who.response) return who.response;
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
      DELETE: async ({ request }) => {
        const who = user(request);
        if (who.response) return who.response;
        const sql = await getSql();
        await ensurePorch(sql);
        await sql`delete from hollow_porch where discord_id = ${who.discordId}`;
        return json(await snapshot(sql, who.discordId!));
      },
    },
  },
});
