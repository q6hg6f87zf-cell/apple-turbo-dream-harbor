import { createHash } from "node:crypto";
import { getSql } from "@/lib/db";
import { bridgeLog } from "./log";
import { sanitizeClaim } from "./memory-id";
import {
  matchPromiseToTrigger,
  parsePromiseFromText,
  PROMISE_KINDS,
  PROMISE_STATUSES,
  shouldSurfacePromise,
  type CanonicalPromise,
  type ContinuityTrigger,
  type PromiseKind,
  type PromiseStatus,
} from "./continuity-core";

export function promiseId(discordId: string, kind: string, subject: string) {
  return `prm-${createHash("sha256").update(`${discordId}:${kind}:${sanitizeClaim(subject)}`).digest("hex").slice(0, 20)}`;
}

const COLS = `id, discord_id, kind, subject, status, source, region_id, location_id, poi_id, tags, importance,
  created_at::text as created_at, resolved_at::text as resolved_at, last_surfaced_at::text as last_surfaced_at`;

function asRow(row: Record<string, unknown>): CanonicalPromise {
  return {
    id: String(row.id),
    discordId: String(row.discord_id),
    kind: row.kind as PromiseKind,
    subject: String(row.subject),
    status: row.status as PromiseStatus,
    source: String(row.source),
    regionId: (row.region_id as string) ?? null,
    locationId: (row.location_id as string) ?? null,
    poiId: (row.poi_id as string) ?? null,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    importance: Number(row.importance) || 5,
    createdAt: String(row.created_at),
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
    lastSurfacedAt: row.last_surfaced_at ? String(row.last_surfaced_at) : null,
  };
}

export async function createPromise(input: {
  discordId: string;
  claim?: string;
  kind?: PromiseKind;
  subject?: string;
  source: "game" | "discord" | "system" | "admin";
  regionId?: string | null;
  locationId?: string | null;
  poiId?: string | null;
  tags?: string[];
  importance?: number;
  relatedMemoryId?: string | null;
}): Promise<{ row: CanonicalPromise; duplicate: boolean } | { error: string }> {
  const parsed = input.claim ? parsePromiseFromText(input.claim) : null;
  const kind = (PROMISE_KINDS as readonly string[]).includes(input.kind ?? "")
    ? input.kind!
    : parsed?.kind ?? "intention";
  const subject = sanitizeClaim(input.subject || parsed?.subject || input.claim || "").slice(0, 160);
  if (subject.length < 2) return { error: "promise subject too short" };
  const id = promiseId(input.discordId, kind, subject);
  const tags = (input.tags ?? parsed?.tags ?? []).map((tag) => String(tag).slice(0, 32)).slice(0, 8);
  const importance = Math.max(0, Math.min(10, Math.floor(input.importance ?? parsed?.importance ?? 6)));
  try {
    const sql = await getSql();
    const inserted = await sql.query<Record<string, unknown>>(
      `insert into hollow_tyrone_promise (
        id, discord_id, kind, subject, status, source, region_id, location_id, poi_id, tags, importance, related_memory_id
      ) values ($1,$2,$3,$4,'active',$5,$6,$7,$8,$9,$10,$11)
      on conflict (discord_id, id) do nothing
      returning ${COLS}`,
      [
        id,
        input.discordId,
        kind,
        subject,
        input.source,
        input.regionId ?? parsed?.regionId ?? null,
        input.locationId ?? parsed?.locationId ?? null,
        input.poiId ?? parsed?.poiId ?? null,
        tags,
        importance,
        input.relatedMemoryId ?? null,
      ],
    );
    if (inserted[0]) {
      bridgeLog("promise.write", { discordId: input.discordId, duplicate: false });
      return { row: asRow(inserted[0]), duplicate: false };
    }
    const existing = await sql.query<Record<string, unknown>>(
      `select ${COLS} from hollow_tyrone_promise where discord_id = $1 and id = $2 limit 1`,
      [input.discordId, id],
    );
    if (!existing[0]) return { error: "promise store unavailable" };
    bridgeLog("promise.write", { discordId: input.discordId, duplicate: true });
    return { row: asRow(existing[0]), duplicate: true };
  } catch {
    bridgeLog("promise.write_failed", { discordId: input.discordId, db: true });
    return { error: "promise store unavailable" };
  }
}

export async function listPromises(discordId: string, status?: PromiseStatus) {
  try {
    const sql = await getSql();
    const rows = status
      ? await sql.query<Record<string, unknown>>(
          `select ${COLS} from hollow_tyrone_promise where discord_id = $1 and status = $2 order by created_at desc limit 24`,
          [discordId, status],
        )
      : await sql.query<Record<string, unknown>>(
          `select ${COLS} from hollow_tyrone_promise where discord_id = $1 order by created_at desc limit 24`,
          [discordId],
        );
    return rows.map(asRow);
  } catch {
    bridgeLog("promise.read_failed", { discordId, db: true });
    return [];
  }
}

export async function setPromiseStatus(discordId: string, id: string, status: PromiseStatus, source = "game") {
  if (!(PROMISE_STATUSES as readonly string[]).includes(status)) return { error: "unknown status" };
  try {
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      `update hollow_tyrone_promise
       set status = $1,
           resolved_at = case when $1 = 'active' then null else now() end
       where discord_id = $2 and id = $3
       returning ${COLS}`,
      [status, discordId, id],
    );
    if (!rows[0]) return { error: "promise not found" };
    bridgeLog("promise.status", { discordId, status, source });
    return { row: asRow(rows[0]) };
  } catch {
    return { error: "promise store unavailable" };
  }
}

export async function markSurfaced(discordId: string, id: string) {
  try {
    const sql = await getSql();
    await sql.query(`update hollow_tyrone_promise set last_surfaced_at = now() where discord_id = $1 and id = $2`, [
      discordId,
      id,
    ]);
  } catch {
    /* never stall the file */
  }
}

export async function matchPromises(discordId: string, trigger: ContinuityTrigger) {
  const active = await listPromises(discordId, "active");
  return active
    .map((row) => ({ row, score: matchPromiseToTrigger(row, trigger) }))
    .filter((item) => shouldSurfacePromise(item.row, trigger, item.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, 1);
}
