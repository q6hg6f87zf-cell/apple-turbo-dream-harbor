import { randomBytes } from "node:crypto";
import { getSql } from "@/lib/db";
import { audit } from "./audit.server";
import { memoryId, sanitizeClaim } from "./memory-id";

export { memoryId, sanitizeClaim };

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
}): Promise<MemoryRow | { error: string; status: number }> {
  if (!KINDS.includes(input.kind)) return { error: "unknown memory kind", status: 400 };
  const claim = sanitizeClaim(input.claim);
  if (claim.length < 4) return { error: "claim too short", status: 400 };
  const id = (input.id || memoryId(input.discordId, input.kind, claim)).slice(0, 64);
  const tags = (input.tags ?? []).map((tag) => String(tag).slice(0, 32)).slice(0, 8);
  const importance = Math.max(0, Math.min(10, Math.floor(input.importance ?? 3)));
  const source = ["game", "discord", "admin", "world"].includes(input.source ?? "") ? input.source! : "game";
  try {
    const sql = await getSql();
    const rows = await sql<MemoryRow>`
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
      on conflict (discord_id, id) do update set
        claim = excluded.claim,
        tags = excluded.tags,
        importance = excluded.importance,
        payload = excluded.payload
      returning id, discord_id, kind, claim, tags, importance, location_id, payload, source, created_at::text as created_at
    `;
    await audit("tyrone memory created", { discordId: input.discordId, actor: source, detail: { id, kind: input.kind } });
    return rows[0]!;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "memory store unavailable", status: 503 };
  }
}

export async function relevantMemories(opts: {
  discordId: string;
  query?: string;
  locationId?: string | null;
  limit?: number;
}): Promise<MemoryRow[]> {
  const sql = await getSql();
  const limit = Math.max(1, Math.min(12, opts.limit ?? 6));
  const q = sanitizeClaim(opts.query ?? "").toLowerCase();
  const rows = await sql<MemoryRow>`
    select id, discord_id, kind, claim, tags, importance, location_id, payload, source, created_at::text as created_at
    from hollow_tyrone_memory
    where discord_id = ${opts.discordId}
    order by importance desc, created_at desc
    limit 40
  `;
  const scored = rows
    .map((row) => {
      let score = row.importance;
      if (opts.locationId && row.location_id === opts.locationId) score += 3;
      if (q && row.claim.toLowerCase().includes(q)) score += 4;
      if (q && row.tags.some((tag) => q.includes(tag.toLowerCase()))) score += 2;
      return { row, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((item) => item.row);
}

export function nidMemory() {
  return `mem-${randomBytes(8).toString("hex")}`;
}
