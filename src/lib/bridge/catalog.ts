export const EVENT_TYPES = [
  "player.joined",
  "player.returned",
  "character.forged",
  "character.died",
  "mission.completed",
  "mission.failed",
  "boss.engaged",
  "boss.defeated",
  "boss.failed",
  "region.unlocked",
  "rare_item.found",
  "legendary_item.found",
  "campaign.day_advanced",
  "tyrone.promise_created",
  "tyrone.promise_kept",
  "tyrone.promise_fulfilled",
  "tyrone.promise_broken",
  "tyrone.memory_recorded",
] as const;

export type WorldEventType = (typeof EVENT_TYPES)[number];

export type EventVisibility = "private" | "party" | "campaign" | "guild" | "public";

export const FEED_VISIBILITY = new Set<EventVisibility>(["campaign", "guild", "public"]);

export const CANONICAL_ORIGIN = "https://thehollowrealm.com";

export const DEEP_LINKS = {
  home: "/",
  vault: "/vault",
  inventory: "/inventory",
  world: "/world",
  profile: "/profile",
  region: (id: string) => `/region/${id}`,
} as const;

export const ALLOWED_REGIONS = ["ironclad", "slagtown", "blackspire", "brasswater", "veyra", "kingdom", "caverns", "library"] as const;

export const ALLOWED_TO = ["vault", "inventory", "map", "hq", "roster", "profile", "market"] as const;
export type DeepTo = (typeof ALLOWED_TO)[number];

export function parseDeepTo(raw: unknown): DeepTo | null {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "world") return "map";
  return (ALLOWED_TO as readonly string[]).includes(value) ? (value as DeepTo) : null;
}

export function screenForTo(to: DeepTo) {
  if (to === "profile" || to === "hq") return "hq" as const;
  return to;
}

export function parseRegion(raw: unknown) {
  const value = String(raw ?? "").trim().toLowerCase();
  return (ALLOWED_REGIONS as readonly string[]).includes(value) ? value : null;
}

export function absoluteDeepLink(path: string) {
  const dest = path.startsWith("/") ? path : `/${path}`;
  if (dest.startsWith("//") || /^https?:/i.test(path) || /javascript:/i.test(path)) {
    return `${CANONICAL_ORIGIN}/`;
  }
  return `${CANONICAL_ORIGIN}${dest}`;
}

export function isEventType(raw: unknown): raw is WorldEventType {
  return typeof raw === "string" && (EVENT_TYPES as readonly string[]).includes(raw);
}

export function defaultVisibility(type: WorldEventType): EventVisibility {
  if (type === "boss.defeated" || type === "region.unlocked") return "guild";
  if (type === "character.forged" || type === "mission.completed" || type === "campaign.day_advanced") return "campaign";
  return "private";
}

export function defaultImportance(type: WorldEventType) {
  if (type === "boss.defeated" || type === "legendary_item.found") return 9;
  if (type === "character.forged" || type === "region.unlocked" || type === "boss.engaged" || type === "character.died" || type === "boss.failed") return 7;
  if (type === "mission.completed" || type === "rare_item.found" || type === "tyrone.promise_fulfilled" || type === "tyrone.promise_broken" || type === "mission.failed") return 6;
  return 3;
}
