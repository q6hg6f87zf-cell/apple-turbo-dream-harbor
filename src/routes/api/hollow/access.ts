import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { requireUserId } from "@/lib/auth/verify.server";
import { DISCORD_PROVIDER_ID } from "@/lib/auth/providers";
import {
  discordConfigured,
  readRiderSession,
} from "@/lib/auth/discord-native.server";
import { lookupRider } from "@/lib/auth/discord-riders.server";

const CAMPAIGN_ID = "moon-squad";
const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS });
}

function authDisabled() {
  return String(process.env.VITE_AUTH_ENABLED ?? "").trim() === "false";
}

function looksLikeHandle(value: string) {
  const t = value.trim().replace(/^@/, "");
  return /^[a-z0-9._]{2,32}$/i.test(t) || /^.+#\d{4}$/.test(t);
}

function isSnowflake(value: string) {
  return /^\d{17,22}$/.test(value);
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

async function discordHandleFromToken(accessToken: string | null | undefined, fallbackName: string) {
  const fallback = looksLikeHandle(fallbackName) ? fallbackName.trim().replace(/^@/, "") : "";
  if (!accessToken) return { name: fallbackName, handle: fallback };
  try {
    const response = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(1600),
    });
    if (!response.ok) return { name: fallbackName, handle: fallback };
    const me = (await response.json()) as {
      username?: string;
      global_name?: string | null;
      discriminator?: string;
    };
    const username = (me.username ?? "").trim();
    const handle =
      username && me.discriminator && me.discriminator !== "0"
        ? `${username}#${me.discriminator}`
        : username || fallback;
    return {
      name: (me.global_name || username || fallbackName).trim(),
      handle: handle.replace(/^@/, "").slice(0, 32),
    };
  } catch {
    return { name: fallbackName, handle: fallback };
  }
}

async function bootstrapDiscordIdentity(userId: string, discordId: string, displayName: string) {
  const sql = await getSql();
  await sql`
    insert into tyrone_arcade_snapshot (discord_id, display_name, caps, xp, level, pack, revision, updated_at)
    values (${discordId}, ${displayName}, 0, 0, 1, '{}'::jsonb, 1, now())
    on conflict (discord_id) do update set
      display_name = excluded.display_name,
      updated_at = now()
  `;
  await sql`
    insert into hollow_identity_link (user_id, discord_id, linked_at)
    values (${userId}, ${discordId}, now())
    on conflict (user_id) do nothing
  `;
  await sql`
    insert into hollow_campaign_state (campaign_id)
    values (${CAMPAIGN_ID})
    on conflict (campaign_id) do nothing
  `;
  await sql`
    insert into hollow_campaign_member (
      campaign_id, user_id, discord_id, card_caps, xp, level, joined_at, updated_at
    )
    select ${CAMPAIGN_ID}, l.user_id, l.discord_id, s.caps, s.xp, s.level, now(), now()
    from hollow_identity_link l
    join tyrone_arcade_snapshot s on s.discord_id = l.discord_id
    where l.user_id = ${userId}
    on conflict (campaign_id, user_id) do update set
      discord_id = excluded.discord_id,
      updated_at = now()
  `;
}

async function riderAccess(request: Request) {
  const session = readRiderSession(request);
  if (!session) return null;
  const stored = await lookupRider(session.did);
  const name = stored?.name || session.name;
  const handle = stored?.handle || session.handle;
  const stamped = stored?.stamped ?? session.stamped;
  return json({
    allowed: true,
    authenticated: true,
    discord: true,
    linked: true,
    stamped,
    returning: stamped,
    devBypass: false,
    provider: "discord",
    discordId: session.did,
    name,
    handle,
    stage: stamped ? "ready" : "stamp",
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

        // Preview / local: keep the stamp card without a Discord app.
        if (authDisabled()) return json(DEV_ACCESS);

        let userId: string;
        try {
          assertSameSiteRequest();
          userId = await requireUserId();
        } catch {
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
          }, 401);
        }

        const sql = await getSql();
        const rows = await sql<{ account_id: string; name: string; access_token: string | null }>`
          select a."accountId" as account_id, u."name" as name, a."accessToken" as access_token
          from "account" a
          join "user" u on u."id" = a."userId"
          where a."userId" = ${userId} and a."providerId" = ${DISCORD_PROVIDER_ID}
          order by a."createdAt" desc
          limit 1
        `;
        const discordAccount = rows[0];
        if (!discordAccount) {
          return json({
            allowed: false,
            authenticated: true,
            discord: false,
            linked: false,
            stamped: false,
            returning: false,
            devBypass: false,
            provider: null,
            stage: "discord",
            error: "Hollow Realm requires Discord authentication.",
          }, 403);
        }

        const profile = await discordHandleFromToken(discordAccount.access_token, discordAccount.name || "Moon Squad Rider");

        let links = await sql<{ discord_id: string }>`
          select discord_id from hollow_identity_link where user_id = ${userId} limit 1
        `;

        if (!links[0] && isSnowflake(discordAccount.account_id)) {
          await bootstrapDiscordIdentity(userId, discordAccount.account_id, profile.name || "Moon Squad Rider");
          links = await sql<{ discord_id: string }>`
            select discord_id from hollow_identity_link where user_id = ${userId} limit 1
          `;
        }

        const link = links[0];
        if (!link) {
          return json({
            allowed: false,
            authenticated: true,
            discord: true,
            linked: false,
            stamped: false,
            returning: false,
            devBypass: false,
            provider: DISCORD_PROVIDER_ID,
            stage: "tyrone",
            name: profile.name,
            handle: profile.handle || undefined,
            error: "Discord is signed in. Ask TyroneBot for your one-time Hollow Realm verification link.",
          }, 403);
        }

        return json({
          allowed: true,
          authenticated: true,
          discord: true,
          linked: true,
          stamped: true,
          returning: true,
          devBypass: false,
          provider: DISCORD_PROVIDER_ID,
          discordId: link.discord_id,
          name: profile.name,
          handle: profile.handle || undefined,
          stage: "ready",
        });
      },
    },
  },
});
