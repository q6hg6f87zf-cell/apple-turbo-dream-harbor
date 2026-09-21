import { randomBytes } from "node:crypto";
import { getSql } from "@/lib/db";
import { audit } from "./audit.server.ts";
import { bridgeLog } from "./log";
import { pickRelevant } from "./memory-core";
import { memoryId, sanitizeClaim } from "./memory-id";

export { memoryId, sanitizeClaim };
export { pickRelevant } from "./memory-core";

export type MemoryKind = "episode" | "fact" | "promise" | "conversation";

export type MemoryRow = {
  id: string;
  discord_id: string;
  kind: MemoryKind;
  claim: string;
  tags: string[];
  importance: number;
  location_id: string | null;
  payload: Record<string, unknown>;
  source: string;
  created_at: string;
};

export type MemoryWrite =
  | { row: MemoryRow; duplicate: boolean }
  | { error: string; status: number };

const KINDS: MemoryKind[] = ["episode", "fact", "promise", "conversation"];

export async function recordMemory(input: {
  discordId: string;
  kind: MemoryKind;
  claim: string;
  tags?: string[];
  importance?: number;
  locationId?: string | null;
  payload?: Record<string, unknown>;
  source?: string;
  id?: string;
}): Promise<MemoryWrite> {
  if (!KINDS.includes(input.kind)) return { error: "unknown memory kind", status: 400 };
  const claim = sanitizeClaim(input.claim);
  if (claim.length < 4) return { error: "claim too short", status: 400 };
  const id = (input.id || memoryId(input.discordId, input.kind, claim)).slice(0, 64);
  const tags = (input.tags ?? []).map((tag) => String(tag).slice(0, 32)).slice(0, 8);
  const importance = Math.max(0, Math.min(10, Math.floor(input.importance ?? 3)));
  const source = ["game", "discord", "admin", "world"].includes(input.source ?? "") ? input.source! : "game";
  const started = Date.now();
  try {
    const sql = await getSql();
    const inserted = await sql<MemoryRow>`
      insert into hollow_tyrone_memory (
        id, discord_id, kind, claim, tags, importance, location_id, payload, source
      ) values (
        ${id},
        ${input.discordId},
        ${input.kind},
        ${claim},
        ${tags},
        ${importance},
        ${input.locationId ?? null},
        ${JSON.stringify(input.payload ?? {})}::jsonb,
        ${source}
      )
      on conflict (discord_id, id) do nothing
      returning id, discord_id, kind, claim, tags, importance, location_id, payload, source, created_at::text as created_at
    `;
    if (inserted[0]) {
      await audit("tyrone memory created", { discordId: input.discordId, actor: source, detail: { id, kind: input.kind } });
      bridgeLog("memory.write", { discordId: input.discordId, kind: input.kind, duplicate: false, ms: Date.now() - started });
      return { row: inserted[0], duplicate: false };
    }
    const existing = await sql<MemoryRow>`
      select id, discord_id, kind, claim, tags, importance, location_id, payload, source, created_at::text as created_at
      from hollow_tyrone_memory
      where discord_id = ${input.discordId} and id = ${id}
      limit 1
    `;
    if (!existing[0]) return { error: "memory store unavailable", status: 503 };
    bridgeLog("memory.write", { discordId: input.discordId, kind: input.kind, duplicate: true, ms: Date.now() - started });
    return { row: existing[0], duplicate: true };
  } catch (error) {
    bridgeLog("memory.write_failed", { discordId: input.discordId, db: true });
    return { error: error instanceof Error ? error.message : "memory store unavailable", status: 503 };
  }
}

export async function relevantMemories(opts: {
  discordId: string;
  query?: string;
  locationId?: string | null;
  limit?: number;
}): Promise<MemoryRow[]> {
  const started = Date.now();
  try {
    const sql = await getSql();
    const rows = await sql<MemoryRow>`
      select id, discord_id, kind, claim, tags, importance, location_id, payload, source, created_at::text as created_at
      from hollow_tyrone_memory
      where discord_id = ${opts.discordId}
      order by importance desc, created_at desc
      limit 40
    `;
    const picked = pickRelevant(rows, opts);
    bridgeLog("memory.read", { discordId: opts.discordId, n: picked.length, ms: Date.now() - started });
    return pickRelevant(rows, opts) as MemoryRow[];
  } catch (error) {
    bridgeLog("memory.read_failed", { discordId: opts.discordId, db: true });
    throw error;
  }
}

export function nidMemory() {
  return `mem-${randomBytes(8).toString("hex")}`;
}
