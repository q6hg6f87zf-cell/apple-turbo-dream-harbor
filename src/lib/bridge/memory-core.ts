import { queryIntent } from "./continuity-core";

export type MemoryKind = "episode" | "fact" | "promise" | "conversation";

export type MemoryScoreRow = {
  id: string;
  discord_id: string;
  kind: MemoryKind;
  claim: string;
  tags: string[];
  importance: number;
  location_id: string | null;
  source: string;
  created_at: string;
  visibility?: string;
  poi_id?: string | null;
};

export function scoreMemory(
  row: MemoryScoreRow,
  opts: { query?: string; locationId?: string | null; poiId?: string | null },
) {
  let score = row.importance;
  const q = String(opts.query ?? "").toLowerCase();
  const tokens = q.split(/\s+/).filter((token) => token.length > 2);
  const loc = String(opts.locationId || row.location_id || "").toLowerCase();
  const intent = queryIntent(q);
  if (opts.locationId && row.location_id === opts.locationId) score += 3;
  else if (loc && q.includes(loc)) score += 3;
  if (opts.poiId && row.poi_id === opts.poiId) score += 4;
  if (q && row.claim.toLowerCase().includes(q)) score += 4;
  for (const token of tokens) {
    if (row.claim.toLowerCase().includes(token)) score += 4;
  }
  if (q && row.tags.some((tag) => q.includes(String(tag).toLowerCase()) || tokenMatch(tag, tokens))) score += 2;
  if (intent === "promise" && row.kind === "promise") score += 6;
  if (intent === "boss" && (row.tags.includes("boss") || /gravenor|valdris|thessaly|sink|warden/i.test(row.claim))) {
    score += 5;
  }
  if (intent === "place" && row.location_id && q.includes(row.location_id)) score += 3;
  const created = Date.parse(row.created_at);
  if (Number.isFinite(created)) {
    const age = Date.now() - created;
    if (age < 7 * 86400000) score += 2;
    else if (age < 30 * 86400000) score += 1;
  }
  if (row.kind === "conversation") score -= 1;
  return score;
}

function tokenMatch(tag: string, tokens: string[]) {
  const value = String(tag || "").toLowerCase();
  return tokens.some((token) => value.includes(token) || token.includes(value));
}

export function pickRelevant(
  rows: MemoryScoreRow[],
  opts: {
    query?: string;
    locationId?: string | null;
    poiId?: string | null;
    limit?: number;
    discordId: string;
    allowPublic?: boolean;
  },
) {
  const mine = rows.filter((row) => {
    if (row.discord_id === opts.discordId) return true;
    if (opts.allowPublic && (row.visibility === "public" || row.visibility === "guild")) return true;
    return false;
  });
  const scored = mine
    .map((row) => ({ row, score: scoreMemory(row, opts) }))
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.max(1, Math.min(12, opts.limit ?? 6))).map((item) => item.row);
}

export function keepExistingMemory<T extends { id: string; source: string; created_at: string }>(
  existing: T | null,
  incoming: T,
): { row: T; duplicate: boolean } {
  if (existing) return { row: existing, duplicate: true };
  return { row: incoming, duplicate: false };
}
