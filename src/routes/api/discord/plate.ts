import { createFileRoute } from "@tanstack/react-router";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { readRiderSession, riderCookie } from "@/lib/auth/discord-native.server";
import { stampRider } from "@/lib/auth/discord-riders.server";

const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function json(data: unknown, status = 200, cookies: string[] = []) {
  const headers = new Headers(HEADERS);
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return Response.json(data, { status, headers });
}

export const Route = createFileRoute("/api/discord/plate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          assertSameSiteRequest();
        } catch {
          return json({ error: "cross-site" }, 403);
        }
        const session = readRiderSession(request);
        if (!session) return json({ error: "Sign in with Discord first." }, 401);
        let name = session.name;
        try {
          const body = (await request.json()) as { name?: string };
          name = String(body.name ?? session.name).trim();
        } catch {
          name = session.name;
        }
        if (name.length < 2) return json({ error: "Stamp a name first, partner." }, 400);
        const rider = await stampRider(session, name);
        return json(
          {
            ok: true,
            stamped: true,
            discordId: rider.discordId,
            name: rider.name,
            handle: rider.handle,
          },
          200,
          [
            riderCookie({
              did: rider.discordId,
              handle: rider.handle,
              name: rider.name,
              stamped: true,
            }),
          ],
        );
      },
    },
  },
});
