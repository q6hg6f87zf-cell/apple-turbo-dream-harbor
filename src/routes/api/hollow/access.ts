import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { requireUserId } from "@/lib/auth/verify.server";
import { DISCORD_PROVIDER_ID } from "@/lib/auth/providers";

const CAMPAIGN_ID = "moon-squad";
const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS });
}

function authDisabled() {
  return String(process.env.VITE_AUTH_ENABLED ?? "").trim() === "false";
}

function isSnowflake(value: string) {
  return /^\d{17,22}$/.test(value);
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

export const Route = createFileRoute("/api/hollow/access")({
  server: {
    handlers: {
      GET: async () => {
        // CI/local development intentionally keeps auth off. This bypass never
        // runs in a real auth-enabled deployment.
        if (authDisabled()) {
          return json({
            allowed: true,
            authenticated: true,
            discord: true,
            linked: true,
            devBypass: true,
            provider: "dev",
          });
        }

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
            devBypass: false,
            provider: null,
            stage: "discord",
          }, 401);
        }

        const sql = await getSql();
        const rows = await sql<{ account_id: string; name: string }>`
          select a."accountId" as account_id, u."name" as name
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
            devBypass: false,
            provider: null,
            stage: "discord",
            error: "Hollow Realm requires Discord authentication.",
          }, 403);
        }

        let links = await sql<{ discord_id: string }>`
          select discord_id from hollow_identity_link where user_id = ${userId} limit 1
        `;

        // If the broker exposes the raw Discord snowflake, the entire first-run
        // path becomes one click. If it does not, Tyrone's one-time claim remains
        // the trusted bridge instead of guessing at identity.
        if (!links[0] && isSnowflake(discordAccount.account_id)) {
          await bootstrapDiscordIdentity(userId, discordAccount.account_id, discordAccount.name || "Moon Squad Rider");
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
            devBypass: false,
            provider: DISCORD_PROVIDER_ID,
            stage: "tyrone",
            name: discordAccount.name,
            error: "Discord is signed in. Ask TyroneBot for your one-time Hollow Realm verification link.",
          }, 403);
        }

        return json({
          allowed: true,
          authenticated: true,
          discord: true,
          linked: true,
          devBypass: false,
          provider: DISCORD_PROVIDER_ID,
          discordId: link.discord_id,
          name: discordAccount.name,
          stage: "ready",
        });
      },
    },
  },
});
