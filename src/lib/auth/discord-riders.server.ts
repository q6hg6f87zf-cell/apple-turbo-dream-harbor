import { getSql } from "@/lib/db";
import type { DiscordProfile, RiderSession } from "./discord-native.server";

const globalRef = globalThis as typeof globalThis & { __hollowRidersSchema__?: Promise<void> };

async function ensureRiders() {
  const sql = await getSql();
  globalRef.__hollowRidersSchema__ ??= (async () => {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS hollow_riders (
        discord_id text PRIMARY KEY,
        handle text NOT NULL,
        display_name text NOT NULL,
        stamped boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  })().catch((err) => {
    globalRef.__hollowRidersSchema__ = undefined;
    throw err;
  });
  await globalRef.__hollowRidersSchema__;
  return sql;
}

export type StoredRider = {
  discordId: string;
  handle: string;
  name: string;
  stamped: boolean;
};

export async function lookupRider(discordId: string): Promise<StoredRider | null> {
  try {
    const sql = await ensureRiders();
    const rows = await sql<{ discord_id: string; handle: string; display_name: string; stamped: boolean }>`
      select discord_id, handle, display_name, stamped
      from hollow_riders
      where discord_id = ${discordId}
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      discordId: row.discord_id,
      handle: row.handle,
      name: row.display_name,
      stamped: !!row.stamped,
    };
  } catch {
    return null;
  }
}

export async function upsertRiderFromDiscord(profile: DiscordProfile, existing?: StoredRider | null) {
  if (existing?.stamped) {
    return existing;
  }
  const next: StoredRider = {
    discordId: profile.id,
    handle: profile.handle,
    name: profile.name || profile.handle,
    stamped: true,
  };
  try {
    const sql = await ensureRiders();
    await sql`
      insert into hollow_riders (discord_id, handle, display_name, stamped, created_at, updated_at)
      values (${next.discordId}, ${next.handle}, ${next.name}, ${next.stamped}, now(), now())
      on conflict (discord_id) do update set
        handle = case when hollow_riders.stamped then hollow_riders.handle else excluded.handle end,
        display_name = case when hollow_riders.stamped then hollow_riders.display_name else excluded.display_name end,
        stamped = true,
        updated_at = now()
    `;
  } catch {
    // Cookie session still seats the rider when the database is unavailable.
  }
  return next;
}

export async function stampRider(session: RiderSession, name: string): Promise<StoredRider> {
  const next: StoredRider = {
    discordId: session.did,
    handle: session.handle,
    name: name.trim().slice(0, 24) || session.name,
    stamped: true,
  };
  try {
    const sql = await ensureRiders();
    await sql`
      insert into hollow_riders (discord_id, handle, display_name, stamped, created_at, updated_at)
      values (${next.discordId}, ${next.handle}, ${next.name}, true, now(), now())
      on conflict (discord_id) do update set
        display_name = excluded.display_name,
        stamped = true,
        updated_at = now()
    `;
  } catch {
    // Cookie is enough to skip the stamp card on this device.
  }
  return next;
}
