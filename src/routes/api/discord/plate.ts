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
        if (session.guest) {
          return json({
            ok: true,
            stamped: true,
            guest: true,
            discordId: session.did,
            name: session.name,
            handle: session.handle,
          });
        }
        const rider = await stampRider(session, session.name);
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
