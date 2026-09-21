import { getSql } from "@/lib/db";
import type { ClassName, Operative } from "@/game/types";

const CLASSES: ClassName[] = ["Warrior", "Wizard", "Rogue", "Healer", "Merchant", "Bard"];
const CAMPAIGN_ID = "moon-squad";
const MAX_JSON = 48_000;

export type StoredSoul = {
  discordId: string;
  operative: Operative;
  forgedAt: string;
};

function asClass(raw: unknown): ClassName | null {
  const value = String(raw ?? "").trim() as ClassName;
  return CLASSES.includes(value) ? value : null;
}

export function sanitizeOperative(raw: unknown): Operative | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = String(row.id ?? "").trim();
  const name = String(row.name ?? "").trim().slice(0, 24);
  const cls = asClass(row.cls);
  if (!/^[A-Za-z0-9._:-]{2,96}$/.test(id) || name.length < 2 || !cls) return null;
  const json = JSON.stringify(raw);
  if (json.length > MAX_JSON) return null;
  return {
    ...(row as unknown as Operative),
    id,
    name,
    cls,
  };
}

export async function lookupSoul(discordId: string): Promise<StoredSoul | null> {
  try {
    const sql = await getSql();
    const rows = await sql<{ operative: Operative; forged_at: string }>`
      select operative, forged_at::text as forged_at
      from hollow_souls
      where discord_id = ${discordId}
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    const operative = sanitizeOperative(row.operative);
    if (!operative) return null;
    return { discordId, operative, forgedAt: row.forged_at };
  } catch {
    return null;
  }
}

export async function stampSoul(discordId: string, userId: string, raw: unknown): Promise<StoredSoul | { error: string; status: number }> {
  const operative = sanitizeOperative(raw);
  if (!operative) return { error: "That file will not stamp.", status: 400 };
  const sql = await getSql();
  const inserted = await sql<{ operative: Operative; forged_at: string }>`
    insert into hollow_souls (discord_id, operative, forged_at, updated_at)
    values (${discordId}, ${JSON.stringify(operative)}::jsonb, now(), now())
    on conflict (discord_id) do update set
      operative = excluded.operative,
      updated_at = now()
    where hollow_souls.operative ->> 'id' = ${operative.id}
    returning operative, forged_at::text as forged_at
  `;
  if (!inserted[0]) {
    return { error: "Your file is already cut. The Machine Shop will not stamp a second soul.", status: 409 };
  }
  try {
    await sql`
      insert into hollow_resident_progress (
        campaign_id, resident_id, created_by_user_id, display_name, class_key, xp_total, revision, created_at, updated_at
      ) values (
        ${CAMPAIGN_ID}, ${operative.id}, ${userId}, ${operative.name}, ${operative.cls}, 0, 1, now(), now()
      )
      on conflict (campaign_id, resident_id) do update set
        display_name = excluded.display_name,
        updated_at = now()
      where hollow_resident_progress.created_by_user_id = ${userId}
    `;
  } catch {
    /* soul still locks even if the campaign roster is not seated yet */
  }
  return { discordId, operative: sanitizeOperative(inserted[0].operative) ?? operative, forgedAt: inserted[0].forged_at };
}
