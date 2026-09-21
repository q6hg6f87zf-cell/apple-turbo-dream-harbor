/** Shared TyroneBot ↔ Hollow Realm bridge contract. Bump when response shapes change. */
export const BRIDGE_CONTRACT_VERSION = "1";

export const SOUL_STATUSES = ["UNLINKED", "LINKED", "NEEDS INITIAL CHARACTER", "ACTIVE"] as const;
export const MEMORY_KINDS = ["episode", "fact", "promise", "conversation"] as const;
export const ERROR_KEYS = ["error"] as const;

export const SOUL_REQUIRED = [
  "linked",
  "status",
  "discordId",
  "handle",
  "displayName",
  "playerName",
  "character",
  "campaign",
  "caps",
  "xp",
  "level",
  "open",
] as const;

export const MEMORY_REQUIRED = ["id", "kind", "claim", "source", "created_at"] as const;
export const EVENT_REQUIRED = ["id", "event_type", "visibility", "idempotency_key", "delivery_status"] as const;

export function hasKeys(row: unknown, keys: readonly string[]) {
  if (!row || typeof row !== "object") return false;
  return keys.every((key) => Object.prototype.hasOwnProperty.call(row, key));
}

export function isSoulResponse(body: unknown) {
  const soul = (body as { soul?: unknown } | null)?.soul;
  return hasKeys(soul, SOUL_REQUIRED);
}

export function isContextResponse(body: unknown) {
  if (!body || typeof body !== "object") return false;
  const row = body as { soul?: unknown; facts?: unknown; memories?: unknown; rule?: unknown };
  return Boolean(row.soul && Array.isArray(row.facts) && Array.isArray(row.memories) && typeof row.rule === "string");
}

export function isMemoryWriteResponse(body: unknown) {
  if (!body || typeof body !== "object") return false;
  const row = body as { ok?: unknown; memory?: { row?: unknown; duplicate?: unknown } | Record<string, unknown> };
  if (row.ok !== true) return false;
  const mem = row.memory && typeof row.memory === "object" && "row" in row.memory ? row.memory.row : row.memory;
  return hasKeys(mem, ["id", "discord_id", "kind", "claim", "source"]);
}

export function isEventFeedResponse(body: unknown) {
  if (!body || typeof body !== "object") return false;
  const events = (body as { events?: unknown }).events;
  return Array.isArray(events);
}

export function isErrorShape(body: unknown) {
  return Boolean(body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string");
}

export const TRUST_BOUNDARY = [
  "/api/bridge/* is TyroneBot-only. Bearer HOLLOW_BRIDGE_KEY. Browser cookies are not accepted.",
  "/api/hollow/chronicle is the signed-in rider cookie. It cannot enumerate other souls.",
  "A missing or malformed secret fails closed.",
].join(" ");
