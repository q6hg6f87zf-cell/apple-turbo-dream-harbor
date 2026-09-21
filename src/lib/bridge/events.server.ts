import { createHash, randomBytes } from "node:crypto";
import { getSql } from "@/lib/db";
import { audit } from "./audit.server.ts";
import { bridgeLog } from "./log";
import {
  defaultImportance,
  defaultVisibility,
  FEED_VISIBILITY,
  isEventType,
  type EventVisibility,
  type WorldEventType,
} from "./catalog";

export type WorldEventRow = {
  id: string;
  event_type: string;
  discord_id: string | null;
  campaign_id: string;
  importance: number;
  visibility: EventVisibility;
  payload: Record<string, unknown>;
  idempotency_key: string;
  delivery_status: string;
  delivery_attempts?: number;
  last_error?: string | null;
  created_at: string;
};

function nid() {
  return `ev-${randomBytes(10).toString("hex")}`;
}

export function eventKey(type: string, discordId: string | null, extra: string) {
  return createHash("sha256").update(`${type}:${discordId ?? "world"}:${extra}`).digest("hex").slice(0, 40);
}

export async function publishWorldEvent(input: {
  type: WorldEventType;
  discordId?: string | null;
  campaignId?: string;
  payload?: Record<string, unknown>;
  visibility?: EventVisibility;
  importance?: number;
  idempotencyKey: string;
}): Promise<{ id: string; duplicate: boolean } | { error: string }> {
  if (!isEventType(input.type)) return { error: "unknown event" };
  const key = input.idempotencyKey.slice(0, 160);
  if (key.length < 8) return { error: "idempotency key too short" };
  const visibility = input.visibility ?? defaultVisibility(input.type);
  const importance = input.importance ?? defaultImportance(input.type);
  const payload = input.payload ?? {};
  const started = Date.now();
  try {
    const sql = await getSql();
    const inserted = await sql<{ id: string }>`
      insert into hollow_world_event (
        id, event_type, discord_id, campaign_id, importance, visibility, payload, idempotency_key
      ) values (
        ${nid()},
        ${input.type},
        ${input.discordId ?? null},
        ${input.campaignId ?? "moon-squad"},
        ${importance},
        ${visibility},
        ${JSON.stringify(payload)}::jsonb,
        ${key}
      )
      on conflict (idempotency_key) do nothing
      returning id
    `;
    if (!inserted[0]) {
      const existing = await sql<{ id: string }>`
        select id from hollow_world_event where idempotency_key = ${key} limit 1
      `;
      bridgeLog("event.publish", { type: input.type, duplicate: true, ms: Date.now() - started });
      return { id: existing[0]?.id ?? key, duplicate: true };
    }
    await audit("world event published", {
      discordId: input.discordId,
      detail: { type: input.type, visibility, id: inserted[0].id },
    });
    bridgeLog("event.publish", { type: input.type, duplicate: false, visibility, ms: Date.now() - started });
    return { id: inserted[0].id, duplicate: false };
  } catch (error) {
    bridgeLog("event.publish_failed", { type: input.type, db: true });
    return { error: error instanceof Error ? error.message : "event store unavailable" };
  }
}

export async function pendingFeedEvents(limit = 20): Promise<WorldEventRow[]> {
  const sql = await getSql();
  const rows = await sql<WorldEventRow>`
    select id, event_type, discord_id, campaign_id, importance, visibility, payload, idempotency_key,
           delivery_status, delivery_attempts, last_error, created_at::text as created_at
    from hollow_world_event
    where visibility in ('campaign', 'guild', 'public')
      and (
        delivery_status = 'pending'
        or (delivery_status = 'failed' and coalesce(delivery_attempts, 0) < 3)
      )
    order by created_at asc
    limit ${Math.max(1, Math.min(50, limit))}
  `;
  bridgeLog("event.read", { n: rows.length });
  return rows.map((row) => ({
    ...row,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    visibility: row.visibility,
  }));
}

/** Take ownership before Discord send. Restart cannot pull these again. */
export async function claimEvents(ids: string[]) {
  const clean = ids.map((id) => String(id).slice(0, 64)).filter((id) => id.startsWith("ev-")).slice(0, 50);
  if (!clean.length) return [];
  const sql = await getSql();
  const claimed: string[] = [];
  for (const id of clean) {
    const rows = await sql<{ id: string }>`
      update hollow_world_event
      set delivery_status = 'delivering',
          last_error = 'claimed',
          delivered_at = now()
      where id = ${id} and delivery_status in ('pending', 'failed')
      returning id
    `;
    if (rows[0]) claimed.push(rows[0].id);
  }
  bridgeLog("event.claim", { n: claimed.length });
  return claimed;
}

export async function ackEvents(
  ids: string[],
  status: "delivered" | "skipped" | "failed" | "delivering" = "delivered",
  error = "",
) {
  if (status === "delivering") return (await claimEvents(ids)).length;
  const clean = ids.map((id) => String(id).slice(0, 64)).filter((id) => id.startsWith("ev-")).slice(0, 50);
  if (!clean.length) return 0;
  const sql = await getSql();
  let n = 0;
  for (const id of clean) {
    if (status === "failed") {
      const rows = await sql<{ id: string }>`
        update hollow_world_event
        set delivery_status = 'failed',
            delivered_at = now(),
            delivery_attempts = coalesce(delivery_attempts, 0) + 1,
            last_error = ${error.slice(0, 180)}
        where id = ${id} and delivery_status in ('pending', 'delivering', 'failed')
        returning id
      `;
      n += rows.length;
      continue;
    }
    const rows = await sql<{ id: string }>`
      update hollow_world_event
      set delivery_status = ${status}, delivered_at = now()
      where id = ${id} and delivery_status in ('pending', 'delivering', 'failed')
      returning id
    `;
    n += rows.length;
  }
  bridgeLog("event.ack", { status, n });
  return n;
}

export async function recentEventsFor(discordId: string, limit = 8) {
  const sql = await getSql();
  return sql<WorldEventRow>`
    select id, event_type, discord_id, campaign_id, importance, visibility, payload, idempotency_key, delivery_status, created_at::text as created_at
    from hollow_world_event
    where discord_id = ${discordId}
    order by created_at desc
    limit ${Math.max(1, Math.min(24, limit))}
  `;
}

export function canFeed(visibility: string) {
  return FEED_VISIBILITY.has(visibility as EventVisibility);
}
