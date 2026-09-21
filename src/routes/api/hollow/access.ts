import { createFileRoute } from "@tanstack/react-router";
import {
  discordConfigured,
  readRiderSession,
} from "@/lib/auth/discord-native.server";
import { enrollMoonSquad } from "@/lib/auth/enroll-campaign.server";
import { lookupRider } from "@/lib/auth/discord-riders.server";
import { lookupSoul } from "@/lib/auth/hollow-soul.server";
import { isAuthStatus } from "@/game/discord";

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
  const storedName = stored?.name && !isAuthStatus(stored.name) ? stored.name : "";
  const storedHandle = stored?.handle && !isAuthStatus(stored.handle) ? stored.handle : "";
  const name = storedName || session.name;
  const handle = storedHandle || session.handle;
  const stamped = true;
  try {
    await enrollMoonSquad(session.did, name, handle);
  } catch {
    /* porch still seats without the ledger */
  }
  const soul = await lookupSoul(session.did);
  return json({
    allowed: true,
    authenticated: true,
    discord: true,
    linked: true,
    stamped,
    returning: !!stored?.stamped || session.stamped || !!soul,
    devBypass: false,
    provider: "discord",
    discordId: session.did,
    name,
    handle,
    soul: soul?.operative ?? null,
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
