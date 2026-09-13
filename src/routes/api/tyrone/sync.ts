import { createFileRoute } from "@tanstack/react-router";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";

const PACK_KEYS = [
  "bobby_pin",
  "stimpak",
  "mentats",
  "holotape",
  "sarsaparilla",
  "probe_kit",
] as const;

const RESPONSE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: RESPONSE_HEADERS });
}

function cleanDiscordId(raw: unknown): string | null {
  const id = String(raw ?? "").trim();
  return /^\d{17,22}$/.test(id) ? id : null;
}

function cleanName(raw: unknown, fallback: string) {
  const name = String(raw ?? "").trim().replace(/^@/, "").slice(0, 32);
  return name || fallback;
}

function safeInt(raw: unknown, fallback: number, min: number, max: number) {
  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function cleanPack(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const source = raw as Record<string, unknown>;
  const pack: Record<string, number> = {};
  for (const key of PACK_KEYS) {
    if (!(key in source)) continue;
    pack[key] = safeInt(source[key], 0, 0, 100000);
  }
  return pack;
}

function trustedWriter(request: Request): "ok" | "disabled" | "denied" {
  const secret = env("TYRONE_SYNC_WRITE_KEY");
  if (!secret) return "disabled";
  const header = request.headers.get("authorization") ?? "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!supplied) return "denied";
  const expectedBytes = Buffer.from(secret);
  const suppliedBytes = Buffer.from(supplied);
  if (expectedBytes.length !== suppliedBytes.length) return "denied";
  return timingSafeEqual(expectedBytes, suppliedBytes) ? "ok" : "denied";
}

function requireTrustedWriter(request: Request): Response | null {
  const result = trustedWriter(request);
  if (result === "ok") return null;
  if (result === "disabled") {
    return json(
      {
        error: "trusted sync disabled",
        note: "Set TYRONE_SYNC_WRITE_KEY on the server before TyroneBot can write arcade state.",
      },
      503,
    );
  }
  return json({ error: "unauthorized" }, 401);
}

function contract(origin: string) {
  return {
    authority: "server",
    handshake:
      "TyroneBot writes arcade totals over an authenticated server-to-server request and receives a short-lived one-time claim URL. Player URLs never contain caps, XP, rank, or Pack balances.",
    open: `${origin}/?claim={oneTimeToken}`,
    trustedPost: {
      url: `${origin}/api/tyrone/sync`,
      auth: "Authorization: Bearer <TYRONE_SYNC_WRITE_KEY>",
      body: { discord: "<snowflake>", name: "<username>", caps: 0, xp: 0, level: 1, pack: {} },
    },
    publicRead: "disabled; authoritative state is exposed only after an authenticated claim",
  };
}

type SnapshotRow = {
  discord_id: string;
  display_name: string;
  caps: number;
  xp: number;
  level: number;
  pack: Record<string, number> | null;
  revision: number;
  updated_at: string;
};

function hashClaim(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export const Route = createFileRoute("/api/tyrone/sync")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: { ...RESPONSE_HEADERS, Allow: "GET, POST, OPTIONS" },
        }),

      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = `${url.protocol}//${url.host}`;
        const rawId = url.searchParams.get("d") || url.searchParams.get("discord");
        if (!rawId) return json(contract(origin));

        const denied = requireTrustedWriter(request);
        if (denied) return denied;

        const id = cleanDiscordId(rawId);
        if (!id) return json({ error: "invalid discord id" }, 400);
        const sql = await getSql();
        const rows = await sql<SnapshotRow>`
          select discord_id, display_name, caps, xp, level, pack, revision, updated_at
          from tyrone_arcade_snapshot
          where discord_id = ${id}
          limit 1
        `;
        const row = rows[0];
        if (!row) return json({ error: "not found" }, 404);
        return json({
          discord: row.discord_id,
          name: row.display_name,
          caps: row.caps,
          xp: row.xp,
          level: row.level,
          pack: row.pack ?? {},
          revision: row.revision,
          updatedAt: row.updated_at,
        });
      },

      POST: async ({ request }) => {
        const denied = requireTrustedWriter(request);
        if (denied) return denied;

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ error: "bad json" }, 400);
        }

        const id = cleanDiscordId(body.discord ?? body.d ?? body.id);
        if (!id) return json({ error: "invalid discord id" }, 400);
        const name = cleanName(body.name ?? body.username ?? body.n, id);
        const caps = safeInt(body.caps, 0, 0, 2000000000);
        const xp = safeInt(body.xp, 0, 0, 2000000000);
        const level = safeInt(body.level ?? body.lvl, 1, 1, 1000);
        const pack = cleanPack(body.pack);

        const sql = await getSql();
        const rows = await sql<SnapshotRow>`
          insert into tyrone_arcade_snapshot (
            discord_id, display_name, caps, xp, level, pack, revision, updated_at
          ) values (
            ${id}, ${name}, ${caps}, ${xp}, ${level}, ${JSON.stringify(pack)}::jsonb, 1, now()
          )
          on conflict (discord_id) do update set
            display_name = excluded.display_name,
            caps = excluded.caps,
            xp = excluded.xp,
            level = excluded.level,
            pack = excluded.pack,
            revision = tyrone_arcade_snapshot.revision + 1,
            updated_at = now()
          returning discord_id, display_name, caps, xp, level, pack, revision, updated_at
        `;
        const row = rows[0]!;

        await sql`delete from tyrone_identity_claim where expires_at <= now()`;
        const claim = randomBytes(32).toString("base64url");
        const claimHash = hashClaim(claim);
        await sql`
          insert into tyrone_identity_claim (token_hash, discord_id, expires_at)
          values (${claimHash}, ${id}, now() + interval '10 minutes')
        `;

        const url = new URL(request.url);
        const origin = `${url.protocol}//${url.host}`;
        const open = `${origin}/?claim=${encodeURIComponent(claim)}`;
        return json({
          ok: true,
          discord: row.discord_id,
          name: row.display_name,
          revision: row.revision,
          claimExpiresInSeconds: 600,
          open,
        });
      },
    },
  },
});
