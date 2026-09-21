export const EVENT_TYPES = [
  "player.joined",
  "player.returned",
  "character.forged",
  "mission.completed",
  "mission.failed",
  "boss.engaged",
  "boss.defeated",
  "region.unlocked",
  "rare_item.found",
  "legendary_item.found",
  "campaign.day_advanced",
  "tyrone.promise_created",
  "tyrone.promise_kept",
  "tyrone.memory_recorded",
] as const;

export type WorldEventType = (typeof EVENT_TYPES)[number];

export type EventVisibility = "private" | "party" | "campaign" | "guild" | "public";

export const FEED_VISIBILITY = new Set<EventVisibility>(["campaign", "guild", "public"]);

export const DEEP_LINKS = {
  home: "/",
  vault: "/vault",
  inventory: "/inventory",
  world: "/world",
  profile: "/profile",
  region: (id: string) => `/region/${id}`,
} as const;

export const ALLOWED_TO = ["vault", "inventory", "map", "hq", "roster", "profile", "market"] as const;
export type DeepTo = (typeof ALLOWED_TO)[number];

export function parseDeepTo(raw: unknown): DeepTo | null {
  const value = String(raw ?? "").trim().toLowerCase();
  return (ALLOWED_TO as readonly string[]).includes(value) ? (value as DeepTo) : null;
}

export function screenForTo(to: DeepTo) {
  if (to === "profile" || to === "hq") return "hq" as const;
  return to;
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
  if (type === "character.forged" || type === "region.unlocked" || type === "boss.engaged") return 7;
  if (type === "mission.completed" || type === "rare_item.found") return 5;
  return 3;
}

export const CANONICAL_ORIGIN = "https://thehollowrealm.com";
