import { createHash, randomBytes } from "node:crypto";
import { getSql } from "@/lib/db";
import { audit } from "./audit.server";
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
    if (!inserted[0]) return { id: key, duplicate: true };
    await audit("world event published", {
      discordId: input.discordId,
      detail: { type: input.type, visibility, id: inserted[0].id },
    });
    return { id: inserted[0].id, duplicate: false };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "event store unavailable" };
  }
}

export async function pendingFeedEvents(limit = 20): Promise<WorldEventRow[]> {
  const sql = await getSql();
  const rows = await sql<WorldEventRow>`
    select id, event_type, discord_id, campaign_id, importance, visibility, payload, idempotency_key, delivery_status, created_at::text as created_at
    from hollow_world_event
    where delivery_status = 'pending'
      and visibility in ('campaign', 'guild', 'public')
    order by created_at asc
    limit ${Math.max(1, Math.min(50, limit))}
  `;
  return rows.map((row) => ({
    ...row,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    visibility: row.visibility,
  }));
}

export async function ackEvents(ids: string[], status: "delivered" | "skipped" | "failed" = "delivered") {
  const clean = ids.map((id) => String(id).slice(0, 64)).filter((id) => id.startsWith("ev-")).slice(0, 50);
  if (!clean.length) return 0;
  const sql = await getSql();
  let n = 0;
  for (const id of clean) {
    const rows = await sql<{ id: string }>`
      update hollow_world_event
      set delivery_status = ${status}, delivered_at = now()
      where id = ${id} and delivery_status = 'pending'
      returning id
    `;
    n += rows.length;
  }
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
