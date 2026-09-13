import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "node:crypto";
import { getSql } from "@/lib/db";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { requireUserId } from "@/lib/auth/verify.server";

const HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS });
}

function hashClaim(token: string) {
  return createHash("sha256").update(token).digest("hex");
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
    const message = error instanceof Error ? error.message : "identity unavailable";
    return { response: json({ error: message }, status) };
  }
}

type LinkedSnapshotRow = {
  discord_id: string;
  display_name: string;
  caps: number;
  xp: number;
  level: number;
  pack: Record<string, number> | null;
  revision: number;
  updated_at: string;
};

async function linkedSnapshot(userId: string): Promise<LinkedSnapshotRow | null> {
  const sql = await getSql();
  const rows = await sql<LinkedSnapshotRow>`
    select s.discord_id, s.display_name, s.caps, s.xp, s.level, s.pack, s.revision, s.updated_at
    from hollow_identity_link l
    join tyrone_arcade_snapshot s on s.discord_id = l.discord_id
    where l.user_id = ${userId}
    limit 1
  `;
  return rows[0] ?? null;
}

function snapshotJson(row: LinkedSnapshotRow) {
  return {
    discord: row.discord_id,
    name: row.display_name,
    caps: row.caps,
    xp: row.xp,
    level: row.level,
    pack: row.pack ?? {},
    revision: row.revision,
    updatedAt: row.updated_at,
    authority: "server",
  };
}

export const Route = createFileRoute("/api/tyrone/claim")({
  server: {
    handlers: {
      GET: async () => {
        const identity = await verifiedUser();
        if (identity.response) return identity.response;
        const row = await linkedSnapshot(identity.userId!);
        if (!row) return json({ error: "no linked Tyrone rider" }, 404);
        return json(snapshotJson(row));
      },

      POST: async ({ request }) => {
        const identity = await verifiedUser();
        if (identity.response) return identity.response;

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ error: "bad json" }, 400);
        }
        const token = String(body.claim ?? body.token ?? "").trim();
        if (token.length < 32 || token.length > 128) return json({ error: "invalid claim" }, 400);
        const tokenHash = hashClaim(token);

        const sql = await getSql();
        const claimed = await sql<{ discord_id: string }>`
          delete from tyrone_identity_claim
          where token_hash = ${tokenHash} and expires_at > now()
          returning discord_id
        `;
        const discordId = claimed[0]?.discord_id;
        if (!discordId) return json({ error: "claim expired or already used" }, 410);

        const existing = await sql<{ user_id: string }>`
          select user_id from hollow_identity_link where discord_id = ${discordId} limit 1
        `;
        if (existing[0] && existing[0].user_id !== identity.userId) {
          return json({ error: "that Tyrone rider is already bound to another account" }, 409);
        }

        await sql`
          insert into hollow_identity_link (user_id, discord_id, linked_at)
          values (${identity.userId!}, ${discordId}, now())
          on conflict (user_id) do update set
            discord_id = excluded.discord_id,
            linked_at = now()
        `;

        const row = await linkedSnapshot(identity.userId!);
        if (!row) return json({ error: "claim linked but snapshot missing" }, 500);
        return json({ ok: true, ...snapshotJson(row) });
      },
    },
  },
});
