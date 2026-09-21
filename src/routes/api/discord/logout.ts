import { createFileRoute } from "@tanstack/react-router";
import { expireCookie, OAUTH_COOKIE, readRiderSession, RIDER_COOKIE } from "@/lib/auth/discord-native.server";
import { getSql } from "@/lib/db";

const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export const Route = createFileRoute("/api/discord/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = readRiderSession(request);
        if (session?.did) {
          try {
            const sql = await getSql();
            await sql`delete from hollow_porch where discord_id = ${session.did}`;
          } catch {
            /* cookie still dies */
          }
        }
        const headers = new Headers(HEADERS);
        headers.append("Set-Cookie", expireCookie(RIDER_COOKIE));
        headers.append("Set-Cookie", expireCookie(OAUTH_COOKIE));
        return Response.json({ ok: true }, { status: 200, headers });
      },
    },
  },
});
