import { getSql } from "@/lib/db";

export async function audit(action: string, opts: { discordId?: string | null; actor?: string; detail?: unknown } = {}) {
  try {
    const sql = await getSql();
    await sql`
      insert into hollow_bridge_audit (action, discord_id, actor, detail)
      values (
        ${action.slice(0, 64)},
        ${opts.discordId ?? null},
        ${(opts.actor ?? "system").slice(0, 64)},
        ${JSON.stringify(opts.detail ?? {})}::jsonb
      )
    `;
  } catch {
    /* audit never blocks the world */
  }
}
