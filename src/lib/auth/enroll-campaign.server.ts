import { getSql } from "@/lib/db";

const CAMPAIGN_ID = "moon-squad";

/**
 * Seat a Discord rider on the shared Moon Squad campaign.
 * Identity link + arcade snapshot + campaign member, all idempotent.
 * Login still succeeds if this throws — the cookie is enough to play locally.
 */
export async function enrollMoonSquad(discordId: string, name: string, handle?: string) {
  const snow = discordId.replace(/[^\d]/g, "").slice(0, 22);
  if (snow.length < 17) return null;
  const userId = `discord:${snow}`;
  const display = (name || handle || "Rider").trim().slice(0, 32) || "Rider";
  const sql = await getSql();

  await sql`
    insert into tyrone_arcade_snapshot (discord_id, display_name, updated_at)
    values (${snow}, ${display}, now())
    on conflict (discord_id) do update set
      display_name = case
        when length(trim(tyrone_arcade_snapshot.display_name)) > 1 then tyrone_arcade_snapshot.display_name
        else excluded.display_name
      end,
      updated_at = now()
  `;

  await sql`
    insert into hollow_identity_link (user_id, discord_id, linked_at)
    values (${userId}, ${snow}, now())
    on conflict (user_id) do update set
      discord_id = excluded.discord_id,
      linked_at = hollow_identity_link.linked_at
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
    select ${CAMPAIGN_ID}, ${userId}, s.discord_id, s.caps, s.xp, s.level, now(), now()
    from tyrone_arcade_snapshot s
    where s.discord_id = ${snow}
    on conflict (campaign_id, user_id) do update set
      discord_id = excluded.discord_id,
      updated_at = now()
  `;

  return { userId, discordId: snow };
}
