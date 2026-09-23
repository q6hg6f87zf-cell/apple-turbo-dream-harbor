import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import {
  discordConfigured,
  readRiderSession,
} from "@/lib/auth/discord-native.server";

const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS });
}

export type HollowUser = {
  userId: string;
  discordId?: string;
  name?: string;
  response?: undefined;
};

export type HollowIdentity = HollowUser | { response: Response };

/**
 * Rider identity for Hollow APIs.
 *
 * Native Discord cookie first. Never call requireUserId() here: auth is off,
 * and that helper fail-closes against DATABASE_URL, which would brick HQ the
 * moment Neon is attached.
 *
 * No Discord app yet: keep the stamp/play path on preview (no DATABASE_URL).
 * A real database without a Discord session is unauthorized so visitors do
 * not share one Neon row.
 */
export function hollowVerifiedUser(request?: Request): HollowIdentity {
  try {
    assertSameSiteRequest();
  } catch (error) {
    const status =
      typeof error === "object" && error && "status" in error && typeof error.status === "number"
        ? error.status
        : 403;
    return {
      response: json(
        { error: error instanceof Error ? error.message : "identity unavailable" },
        status,
      ),
    };
  }

  if (request) {
    const session = readRiderSession(request);
    if (session?.guest) {
      return { response: json({ error: "guest" }, 401) };
    }
    if (session) {
      return {
        userId: `discord:${session.did}`,
        discordId: session.did,
        name: session.name,
      };
    }
    if (discordConfigured()) {
      return { response: json({ error: "unauthorized" }, 401) };
    }
  }

  if (String(process.env.DATABASE_URL ?? "").trim()) {
    return { response: json({ error: "unauthorized" }, 401) };
  }

  return { userId: "dev-user", discordId: "dev-preview", name: "Preview" };
}
