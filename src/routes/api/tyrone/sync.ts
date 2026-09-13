import { createFileRoute } from "@tanstack/react-router";

const mem = new Map<
  string,
  { name: string; caps?: number; xp?: number; level?: number; pack?: Record<string, number> }
>();

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: CORS });
}

function contract(origin: string) {
  return {
    handshake:
      "A generic Discord click cannot name a browser. Tyrone stamps a personal URL with the rider's snowflake, display name, and arcade totals. That URL is the login.",
    open: `${origin}/?d={discordId}&n={username}&caps={caps}&xp={xp}`,
    params: {
      d: "Discord snowflake (required)",
      n: "Display name / handle",
      caps: "Bottle caps floor",
      xp: "XP floor",
      lvl: "Rank floor",
      pack: "Optional JSON of vault items",
    },
    post: {
      url: `${origin}/api/tyrone/sync`,
      body: { discord: "<snowflake>", name: "<username>", caps: 0, xp: 0, level: 1, pack: {} },
    },
    get: `${origin}/api/tyrone/sync?d={discordId}`,
  };
}

export const Route = createFileRoute("/api/tyrone/sync")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = `${url.protocol}//${url.host}`;
        const id = (url.searchParams.get("d") || url.searchParams.get("discord") || "").slice(0, 32);
        if (!id) return json(contract(origin));
        const row = mem.get(id);
        if (!row) {
          return json({
            discord: id,
            open: `${origin}/?d=${encodeURIComponent(id)}`,
            note: "No arcade row yet. Stamp caps on the URL or POST them here, then send the rider the open link.",
          });
        }
        return json({
          discord: id,
          ...row,
          open: `${origin}/?d=${encodeURIComponent(id)}&n=${encodeURIComponent(row.name)}${
            row.caps != null ? `&caps=${row.caps}` : ""
          }${row.xp != null ? `&xp=${row.xp}` : ""}`,
        });
      },
      POST: async ({ request }) => {
        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ error: "bad json" }, 400);
        }
        const id = String(body.discord ?? body.d ?? body.id ?? "").slice(0, 32);
        if (id.length < 2) return json({ error: "missing discord" }, 400);
        const name = String(body.name ?? body.username ?? body.n ?? id).slice(0, 32);
        const row = {
          name,
          caps: typeof body.caps === "number" ? Math.max(0, Math.floor(body.caps)) : undefined,
          xp: typeof body.xp === "number" ? Math.max(0, Math.floor(body.xp)) : undefined,
          level: typeof body.level === "number" ? Math.max(1, Math.floor(body.level)) : undefined,
          pack: body.pack && typeof body.pack === "object" ? (body.pack as Record<string, number>) : undefined,
        };
        mem.set(id, row);
        const url = new URL(request.url);
        const origin = `${url.protocol}//${url.host}`;
        const open = `${origin}/?d=${encodeURIComponent(id)}&n=${encodeURIComponent(name)}${
          row.caps != null ? `&caps=${row.caps}` : ""
        }${row.xp != null ? `&xp=${row.xp}` : ""}`;
        return json({ ok: true, discord: id, name, open });
      },
    },
  },
});
