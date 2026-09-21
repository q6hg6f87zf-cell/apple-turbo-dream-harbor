import { randomBytes } from "node:crypto";
import { getSql } from "@/lib/db";
import { bridgeLog } from "./log";
import {
  applyBondDelta,
  bondDeltaForEvent,
  cleanBond,
  DEFAULT_BOND,
  type BondField,
  type TyroneBondState,
} from "./continuity-core";

export async function getBond(discordId: string): Promise<TyroneBondState> {
  try {
    const sql = await getSql();
    const rows = await sql<Record<string, number>>`
      select trust, familiarity, respect, conflict, shared_history as "sharedHistory",
             humor, concern, loyalty
      from hollow_tyrone_bond
      where discord_id = ${discordId}
      limit 1
    `;
    if (rows[0]) return cleanBond(rows[0]);
    await sql`
      insert into hollow_tyrone_bond (discord_id) values (${discordId})
      on conflict (discord_id) do nothing
    `;
    return { ...DEFAULT_BOND };
  } catch {
    bridgeLog("bond.read_failed", { discordId, db: true });
    return { ...DEFAULT_BOND };
  }
}

export async function recordRelationshipEvent(input: {
  discordId: string;
  field: BondField;
  delta: number;
  reason: string;
  source?: string;
  eventType?: string;
}) {
  const current = await getBond(input.discordId);
  const applied = applyBondDelta(current, input.field, input.delta, input.reason);
  if (!applied.ok) return applied;
  try {
    const sql = await getSql();
    const b = applied.bond;
    await sql`
      insert into hollow_tyrone_bond (
        discord_id, trust, familiarity, respect, conflict, shared_history, humor, concern, loyalty, updated_at
      ) values (
        ${input.discordId}, ${b.trust}, ${b.familiarity}, ${b.respect}, ${b.conflict},
        ${b.sharedHistory}, ${b.humor}, ${b.concern}, ${b.loyalty}, now()
      )
      on conflict (discord_id) do update set
        trust = excluded.trust,
        familiarity = excluded.familiarity,
        respect = excluded.respect,
        conflict = excluded.conflict,
        shared_history = excluded.shared_history,
        humor = excluded.humor,
        concern = excluded.concern,
        loyalty = excluded.loyalty,
        updated_at = now()
    `;
    await sql`
      insert into hollow_tyrone_bond_event (
        id, discord_id, field, previous, next, reason, source, event_type
      ) values (
        ${`bnd-${randomBytes(8).toString("hex")}`},
        ${input.discordId},
        ${input.field},
        ${applied.previous},
        ${applied.next},
        ${applied.reason},
        ${input.source ?? "system"},
        ${input.eventType ?? null}
      )
    `;
    bridgeLog("bond.write", { discordId: input.discordId, field: input.field });
    return applied;
  } catch {
    bridgeLog("bond.write_failed", { discordId: input.discordId, db: true });
    return { ok: false as const, error: "relationship store unavailable" };
  }
}

export async function applyEventBond(discordId: string, eventType: string, source = "game") {
  const deltas = bondDeltaForEvent(eventType);
  const results = [];
  for (const [field, delta] of Object.entries(deltas) as [BondField, number][]) {
    results.push(
      await recordRelationshipEvent({
        discordId,
        field,
        delta,
        reason: eventType,
        source,
        eventType,
      }),
    );
  }
  return results;
}
