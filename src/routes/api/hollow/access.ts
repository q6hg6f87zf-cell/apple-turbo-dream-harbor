import { createFileRoute } from "@tanstack/react-router";
import {
  discordConfigured,
  readRiderSession,
} from "@/lib/auth/discord-native.server";
import { lookupRider } from "@/lib/auth/discord-riders.server";

const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS });
}

const DEV_ACCESS = {
  allowed: true,
  authenticated: true,
  discord: true,
  linked: true,
  stamped: true,
  returning: false,
  devBypass: true,
  provider: "dev",
  stage: "ready" as const,
};

async function riderAccess(request: Request) {
  const session = readRiderSession(request);
  if (!session) return null;
  const stored = await lookupRider(session.did);
  const name = stored?.name || session.name;
  const handle = stored?.handle || session.handle;
  const stamped = true;
  return json({
    allowed: true,
    authenticated: true,
    discord: true,
    linked: true,
    stamped,
    returning: !!stored?.stamped || session.stamped,
    devBypass: false,
    provider: "discord",
    discordId: session.did,
    name,
    handle,
    stage: "ready" as const,
  });
}

export const Route = createFileRoute("/api/hollow/access")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (request) {
          const native = await riderAccess(request);
          if (native) return native;
          if (discordConfigured()) {
            return json({
              allowed: false,
              authenticated: false,
              discord: false,
              linked: false,
              stamped: false,
              returning: false,
              devBypass: false,
              provider: null,
              stage: "discord",
            });
          }
        }

        // No Discord app on this host: stamp card only. A real database does
        // not flip this into Better Auth — native Discord is the rider door.
        return json(DEV_ACCESS);
      },
    },
  },
});
