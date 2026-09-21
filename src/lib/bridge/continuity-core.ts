/** Browser-safe Tyrone continuity: promises, bond, retrieval, anti-spam. No node:crypto. */

export const BOND_FIELDS = [
  "trust",
  "familiarity",
  "respect",
  "conflict",
  "sharedHistory",
  "humor",
  "concern",
  "loyalty",
] as const;

export type BondField = (typeof BOND_FIELDS)[number];

export type TyroneBondState = Record<BondField, number>;

export const DEFAULT_BOND: TyroneBondState = {
  trust: 42,
  familiarity: 6,
  respect: 32,
  conflict: 4,
  sharedHistory: 0,
  humor: 18,
  concern: 12,
  loyalty: 48,
};

export const PROMISE_STATUSES = ["active", "fulfilled", "broken", "cancelled", "expired"] as const;
export type PromiseStatus = (typeof PROMISE_STATUSES)[number];

export const PROMISE_KINDS = ["return", "intention", "keep", "warning"] as const;
export type PromiseKind = (typeof PROMISE_KINDS)[number];

export const MEMORY_SCOPES = ["private", "campaign", "guild", "public"] as const;
export type MemoryScope = (typeof MEMORY_SCOPES)[number];

export const TRIGGER_TYPES = [
  "player.entered_region",
  "player.entered_poi",
  "mission.started",
  "mission.completed",
  "boss.defeated",
  "item.acquired",
  "story_flag_changed",
] as const;
export type TriggerType = (typeof TRIGGER_TYPES)[number];

export type CanonicalPromise = {
  id: string;
  discordId: string;
  kind: PromiseKind;
  subject: string;
  status: PromiseStatus;
  source: string;
  regionId: string | null;
  locationId: string | null;
  poiId: string | null;
  tags: string[];
  importance: number;
  createdAt: string;
  resolvedAt: string | null;
  lastSurfacedAt?: string | null;
};

export type ContinuityTrigger = {
  type: TriggerType;
  region?: string | null;
  poi?: string | null;
  tags?: string[];
  combat?: boolean;
  assist?: string;
  dialogue?: boolean;
  lastSpeechConcept?: string | null;
  now?: number;
};

const REGION_MARKERS: [string, RegExp][] = [
  ["ironclad", /ironclad/i],
  ["slagtown", /slag(\s*town)?/i],
  ["blackspire", /blackspire/i],
  ["brasswater", /brasswater/i],
  ["veyra", /veyra/i],
  ["hq", /vault\s*13|\bhq\b/i],
];

const INTENT_RE =
  /(going back|go back|come back|we'?ll (be )?back|we will (come|go) back|i'?ll (come|go) back|remind me|i promise|we should (go|head)|heading (back )?to|meet me (in|at)|return to)/i;

export function clampBond(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function isBondField(raw: unknown): raw is BondField {
  return typeof raw === "string" && (BOND_FIELDS as readonly string[]).includes(raw);
}

export function cleanBond(raw: unknown): TyroneBondState {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out = { ...DEFAULT_BOND };
  for (const field of BOND_FIELDS) {
    const n = Number(src[field]);
    if (Number.isFinite(n)) out[field] = clampBond(n);
  }
  return out;
}

export type MemoryTier = "none" | "minor" | "notable" | "major" | "critical";

export const REGION_BOSSES: Record<string, { id: string; name: string; region: string }> = {
  ironclad: { id: "gravenor", name: "Gravenor", region: "ironclad" },
  hq: { id: "gravenor", name: "Gravenor", region: "ironclad" },
  kingdom: { id: "valdris", name: "Valdris the Unmourned", region: "slagtown" },
  slagtown: { id: "valdris", name: "Valdris the Unmourned", region: "slagtown" },
  caverns: { id: "thessaly", name: "Thessaly Vane", region: "blackspire" },
  blackspire: { id: "thessaly", name: "Thessaly Vane", region: "blackspire" },
  library: { id: "sink", name: "The Sink", region: "brasswater" },
  brasswater: { id: "sink", name: "The Sink", region: "brasswater" },
  veyra: { id: "warden", name: "AEGIS Warden 2753", region: "veyra" },
};

export const RELATIONSHIP_RULES: Record<string, { delta: Partial<Record<BondField, number>>; reason: string }> = {
  "boss.defeated": { delta: { respect: 1, sharedHistory: 1, familiarity: 1 }, reason: "shared victory" },
  "boss.failed": { delta: { concern: 1, sharedHistory: 1 }, reason: "shared failure" },
  "character.died": { delta: { concern: 1 }, reason: "named death" },
  "character.forged": { delta: { familiarity: 1 }, reason: "file cut" },
  "mission.completed": { delta: { sharedHistory: 1 }, reason: "major sortie returned" },
  "mission.failed": { delta: { concern: 1 }, reason: "major sortie failed" },
  "tyrone.promise_fulfilled": { delta: { trust: 1, respect: 1 }, reason: "promise kept" },
  "tyrone.promise_kept": { delta: { trust: 1, respect: 1 }, reason: "promise kept" },
  "tyrone.promise_broken": { delta: { trust: -2, conflict: 1 }, reason: "promise broken" },
  "legendary_item.found": { delta: { sharedHistory: 1 }, reason: "rare discovery" },
  "region.unlocked": { delta: { familiarity: 1 }, reason: "new ground" },
  "player.returned": { delta: { concern: 1, familiarity: 1 }, reason: "returned after absence" },
};

export type EventMemoryDraft = {
  id: string;
  title: string;
  summary: string;
  importance: number;
  tags: string[];
  locationId: string | null;
  poiId: string | null;
  relatedEventId: string;
  consolidationGroup: string;
  visibility: "private";
};

export function applyBondDelta(
  bond: TyroneBondState,
  field: unknown,
  delta: number,
  reason: string,
): { ok: true; previous: number; next: number; bond: TyroneBondState; reason: string } | { ok: false; error: string } {
  if (!isBondField(field)) return { ok: false, error: "unknown relationship field" };
  if (!Number.isFinite(delta) || Math.abs(delta) > 4) return { ok: false, error: "delta out of range" };
  if (!String(reason || "").trim()) return { ok: false, error: "reason required" };
  if (field === "humor") return { ok: false, error: "humor is read-only this phase" };
  const previous = bond[field];
  const next = clampBond(previous + delta);
  return { ok: true, previous, next, reason: String(reason).slice(0, 160), bond: { ...bond, [field]: next } };
}

export function bondDeltaForEvent(type: string): Partial<Record<BondField, number>> {
  const rule = RELATIONSHIP_RULES[type];
  return rule ? { ...rule.delta } : {};
}

export function bondLabel(bond: TyroneBondState) {
  const score = bond.familiarity * 0.45 + bond.trust * 0.35 + bond.sharedHistory * 0.2;
  if (score >= 70) return "Partner";
  if (score >= 45) return "Trail hand";
  if (score >= 25) return "Familiar";
  if (score >= 12) return "New hand";
  return "Greenhorn";
}

export function parseRegionFromText(text: string) {
  for (const [id, re] of REGION_MARKERS) {
    if (re.test(text)) return id;
  }
  return null;
}

export function parsePromiseFromText(raw: unknown) {
  const text = String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
  if (text.length < 8) return null;
  if (!INTENT_RE.test(text)) return null;
  const regionId = parseRegionFromText(text);
  const tags: string[] = ["promise"];
  if (/radio/i.test(text)) tags.push("radio");
  if (/tower/i.test(text)) tags.push("tower");
  if (/gate/i.test(text)) tags.push("gate");
  if (/foundry|furnace/i.test(text)) tags.push("foundry");
  if (/gravenor|valdris|thessaly|sink|warden/i.test(text)) tags.push("boss");
  const kind: PromiseKind = /come back|going back|go back|return|we'?ll (be )?back/i.test(text)
    ? "return"
    : "intention";
  const place =
    text.match(/to (?:the )?([A-Za-z][A-Za-z0-9 '\-]{2,40})/)?.[1] ||
    text.match(/in (?:the )?([A-Za-z][A-Za-z0-9 '\-]{2,40})/)?.[1] ||
    (regionId ? regionId : text.slice(0, 80));
  return {
    kind,
    subject: String(place).replace(/[.?!,]+$/, "").trim().slice(0, 120),
    regionId,
    locationId: regionId,
    poiId: /radio/i.test(text) && regionId === "ironclad" ? "ironclad-radio" : null,
    tags: [...new Set(tags)].slice(0, 8),
    importance: regionId ? 6 : 5,
    claim: text,
  };
}

export function promiseCallbackLine(row: Pick<CanonicalPromise, "subject" | "tags" | "regionId">) {
  const tags = row.tags || [];
  const subject = String(row.subject || "");
  if (tags.includes("tower") || tags.includes("radio") || /tower|radio/i.test(subject)) {
    return "Told you I'd remember the tower.";
  }
  if (row.regionId === "ironclad" || /ironclad/i.test(subject)) return "You said we'd come back to Ironclad.";
  if (row.regionId) return `You said we'd come back to ${row.regionId}.`;
  if (subject) return `You said we'd come back. ${subject}.`;
  return "You said we'd come back.";
}

export function matchPromiseToTrigger(row: CanonicalPromise, trigger: ContinuityTrigger) {
  if (row.status !== "active") return 0;
  let score = 0;
  const region = trigger.region || "";
  if (region && (row.regionId === region || row.locationId === region)) score += 6;
  if (trigger.poi && row.poiId && trigger.poi === row.poiId) score += 8;
  const tags = new Set((trigger.tags || []).map((tag) => tag.toLowerCase()));
  if (row.tags.some((tag) => tags.has(String(tag).toLowerCase()))) score += 3;
  if (trigger.type === "player.entered_region" && row.kind === "return") score += 2;
  if (trigger.type === "boss.defeated" && row.tags.includes("boss")) score += 4;
  return score;
}

export function shouldSurfacePromise(
  row: CanonicalPromise,
  trigger: ContinuityTrigger,
  score: number,
) {
  if (score < 6) return false;
  if (row.importance < 4) return false;
  if (trigger.combat) return false;
  if (trigger.assist === "off") return false;
  if (trigger.dialogue) return false;
  if (trigger.lastSpeechConcept === `promise-${row.id}`) return false;
  if (row.lastSurfacedAt) {
    const then = Date.parse(row.lastSurfacedAt);
    const now = trigger.now ?? Date.now();
    if (Number.isFinite(then) && now - then < 45 * 60 * 1000) return false;
  }
  return true;
}

export function queryIntent(query: string) {
  const q = String(query || "").toLowerCase();
  if (/been through|what happened|worst mission|keep my word|did i keep|why do you trust|bosses have we|fought/.test(q)) {
    return "history";
  }
  if (/promise|did i (say|tell)|remind|you said|hold you/.test(q)) return "promise";
  if (/trust|respect|loyalty|why don't you/.test(q)) return "relationship";
  if (/gravenor|valdris|thessaly|the sink|warden/.test(q)) return "boss";
  if (/ironclad|slag|blackspire|brasswater|veyra|tower/.test(q)) return "place";
  return "general";
}

export function majorMemory(importance: number, permanent?: boolean, type?: string) {
  if (permanent) return true;
  if (importance >= 5) return true;
  if (type && ["boss", "death", "forge", "promise", "hack"].includes(type)) return true;
  return false;
}

export function privateLeak(row: { discord_id: string; visibility?: string }, viewerId: string, guildPublic = false) {
  if (row.discord_id !== viewerId) {
    if (row.visibility === "public" || (guildPublic && row.visibility === "guild")) return false;
    return true;
  }
  return false;
}

export function inventedNumbers(spoken: string, allowed: string[]) {
  const ok = new Set(allowed);
  const numbers = String(spoken || "").match(/\d{2,}/g) || [];
  return numbers.some((n) => !ok.has(n));
}

export function inventedPromise(spoken: string, promises: { subject?: string; claim?: string }[]) {
  if (!/promis|you said we'd|hold you to/i.test(spoken)) return false;
  if (!promises.length) return true;
  const hay = promises.map((row) => `${row.subject || ""} ${row.claim || ""}`.toLowerCase()).join(" ");
  const tokens = String(spoken || "")
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 4);
  return tokens.filter((token) => hay.includes(token)).length === 0 && /radio|tower|ironclad|gravenor|blackspire/.test(spoken);
}

const MEMORY_EXCLUDE = new Set([
  "campaign.day_advanced",
  "player.joined",
  "tyrone.memory_recorded",
  "tyrone.promise_created",
  "boss.engaged",
]);

export function eventMemoryId(eventId: string) {
  return `mem-evt-${String(eventId).slice(0, 48)}`;
}

export function placeName(raw: unknown) {
  const id = String(raw || "").toLowerCase();
  if (id === "kingdom" || id === "slagtown") return "Slag Town";
  if (id === "caverns" || id === "blackspire") return "Blackspire";
  if (id === "library" || id === "brasswater") return "Brasswater";
  if (id === "hq") return "Vault 13";
  if (id === "veyra") return "Veyra";
  if (id === "ironclad") return "Ironclad";
  return id || null;
}

function payloadString(payload: Record<string, unknown> | undefined, keys: string[]) {
  if (!payload) return "";
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 80);
  }
  return "";
}

export function memoryTierForEvent(
  type: string,
  opts: { kind?: string; first?: boolean; region?: string | null } = {},
): MemoryTier {
  if (MEMORY_EXCLUDE.has(type)) return "none";
  if (type === "boss.defeated") return opts.first ? "critical" : "major";
  if (type === "boss.failed" || type === "character.died" || type === "tyrone.promise_broken") return "major";
  if (type === "character.forged" || type === "tyrone.promise_fulfilled" || type === "legendary_item.found") return "major";
  if (type === "mission.failed") {
    if (opts.kind === "boss" || opts.kind === "raid") return "major";
    return "none";
  }
  if (type === "mission.completed") {
    if (opts.kind === "boss") return "major";
    if (opts.kind === "raid" || opts.kind === "bounty") return "notable";
    if (opts.first && opts.kind === "scout") return "notable";
    return "none";
  }
  if (type === "region.unlocked") {
    if (opts.region === "ironclad" || opts.region === "hq") return "none";
    return "notable";
  }
  if (type === "rare_item.found" || type === "player.returned") return "notable";
  return "none";
}

export function shouldCreateTyroneMemory(event: {
  type: string;
  kind?: string;
  first?: boolean;
  region?: string | null;
  importance?: number;
}) {
  return memoryTierForEvent(event.type, event) !== "none";
}

const TIER_IMPORTANCE: Record<MemoryTier, number> = {
  none: 0,
  minor: 3,
  notable: 5,
  major: 7,
  critical: 9,
};

export function composeEventMemory(event: {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
  first?: boolean;
}): EventMemoryDraft | null {
  const payload = event.payload ?? {};
  const region = payloadString(payload, ["region", "locationId", "loc"]) || null;
  const kind = payloadString(payload, ["kind", "missionKind"]).toLowerCase();
  const tier = memoryTierForEvent(event.type, { kind, first: event.first, region });
  if (tier === "none") return null;
  const named = payloadString(payload, ["boss", "bossName", "name"]);
  const boss = named || (region ? REGION_BOSSES[region]?.name : "") || "";
  const place = placeName(region) || region;
  const subject = payloadString(payload, ["subject", "claim"]);
  let title = "Something that mattered";
  let summary = "";
  const tags = ["event", event.type.split(".")[0]];
  if (region) tags.push(region);
  if (event.first) tags.push("first");

  if (event.type === "boss.defeated") {
    tags.push("boss");
    title = boss ? `${boss} is down` : "Named raid closed";
    summary = boss && place ? `We put ${boss} down in ${place}.` : place ? `A named raid closed in ${place}.` : "A named raid closed.";
  } else if (event.type === "boss.failed") {
    tags.push("boss");
    title = boss ? `${boss} still stands` : "Named raid failed";
    summary = boss && place ? `We did not walk ${boss} off the hill in ${place}.` : "The named raid went against us.";
  } else if (event.type === "character.died") {
    tags.push("death");
    const who = named || "Someone on the file";
    title = `${who} did not wake`;
    summary = `${who} did not wake.`;
  } else if (event.type === "character.forged") {
    tags.push("forge", "character");
    const who = named || "A rider";
    title = `${who} cut a file`;
    summary = `${who} cut their file. The Machine Shop closed.`;
  } else if (event.type === "mission.completed") {
    tags.push("mission", kind || "sortie");
    title = place ? `Sortie returned from ${place}` : "Sortie returned";
    summary = kind && place ? `We closed a ${kind} in ${place}.` : "A major sortie came home.";
  } else if (event.type === "mission.failed") {
    tags.push("mission", kind || "sortie");
    title = place ? `Sortie failed in ${place}` : "Sortie failed";
    summary = kind && place ? `A ${kind} in ${place} went sideways. We walked out.` : "We walked out. That's enough for tonight.";
  } else if (event.type === "tyrone.promise_fulfilled" || event.type === "tyrone.promise_kept") {
    tags.push("promise", "fulfilled");
    title = "Word kept";
    summary = subject ? `You kept your word about ${subject}.` : "You kept your word.";
  } else if (event.type === "tyrone.promise_broken") {
    tags.push("promise", "broken");
    title = "Word broken";
    summary = subject ? `That word about ${subject} did not hold.` : "A promise on the file did not hold.";
  } else if (event.type === "region.unlocked") {
    tags.push("region");
    title = place ? `${place} opened` : "New ground";
    summary = place ? `${place} opened on the map.` : "New ground opened.";
  } else if (event.type === "legendary_item.found" || event.type === "rare_item.found") {
    tags.push("item");
    title = named ? `${named} came home` : "Rare find";
    summary = named ? `We found ${named}.` : "A rare thing came home.";
  } else if (event.type === "player.returned") {
    title = "You came back";
    summary = "You came back. I kept the porch.";
  } else {
    return null;
  }

  return {
    id: eventMemoryId(event.id),
    title: title.slice(0, 80),
    summary: summary.slice(0, 280),
    importance: Math.min(10, TIER_IMPORTANCE[tier] + (event.first ? 1 : 0)),
    tags: [...new Set(tags)].slice(0, 8),
    locationId: region,
    poiId: payloadString(payload, ["poi", "poiId"]) || null,
    relatedEventId: event.id,
    consolidationGroup: `${event.type}:${region || "world"}`,
    visibility: "private",
  };
}

export function promiseSatisfiedByEvent(
  row: CanonicalPromise,
  event: { type: string; region?: string | null; poi?: string | null },
) {
  if (row.status !== "active") return false;
  const region = event.region || "";
  const sameGround = Boolean(region && (row.regionId === region || row.locationId === region));
  if (event.type === "boss.defeated" || event.type === "mission.completed") return sameGround;
  if (event.type === "player.entered_poi") return Boolean(event.poi && row.poiId && event.poi === row.poiId);
  return false;
}

export function promiseBrokenByEvent(
  row: CanonicalPromise,
  event: { type: string; region?: string | null },
) {
  if (row.status !== "active") return false;
  if (row.kind !== "keep") return false;
  if (event.type !== "mission.failed") return false;
  const region = event.region || "";
  return Boolean(region && (row.regionId === region || row.locationId === region));
}

export function shouldRecallMemory(opts: {
  importance: number;
  recallCount?: number;
  lastRecalledAt?: string | null;
  combat?: boolean;
  assist?: string;
  lastSpeechConcept?: string | null;
  id?: string;
  now?: number;
}) {
  if (opts.combat) return false;
  if (opts.assist === "off") return false;
  if (opts.id && opts.lastSpeechConcept === `memory-${opts.id}`) return false;
  if ((opts.recallCount ?? 0) >= 3 && opts.importance < 8) return false;
  if (opts.lastRecalledAt) {
    const then = Date.parse(opts.lastRecalledAt);
    const now = opts.now ?? Date.now();
    if (Number.isFinite(then) && now - then < 45 * 60 * 1000) return false;
  }
  return opts.importance >= 5;
}

export function eventCallbackLine(draft: Pick<EventMemoryDraft, "summary" | "tags" | "importance">) {
  if (draft.importance < 7) return null;
  return draft.summary;
}

export function explainRelationship(input: {
  bond: TyroneBondState;
  events?: { field: string; reason: string; eventType?: string | null }[];
  memories?: { claim: string; tags?: string[] }[];
  promises?: { subject: string; status: string }[];
}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (line: string) => {
    const text = line.trim();
    if (!text || seen.has(text)) return;
    seen.add(text);
    out.push(text);
  };
  for (const row of input.promises ?? []) {
    if (row.status === "fulfilled") push(`You kept your word about ${row.subject}.`);
  }
  for (const mem of input.memories ?? []) {
    const claim = String(mem.claim || "").trim();
    if (!claim) continue;
    if ((mem.tags || []).includes("boss") || /gravenor|valdris|thessaly|sink|warden/i.test(claim)) push(claim);
    else if ((mem.tags || []).includes("fulfilled") || /kept your word/i.test(claim)) push(claim);
    else if ((mem.tags || []).includes("death") || /did not wake/i.test(claim)) push(claim);
    else if ((mem.tags || []).includes("mission") && /sideways|failed|walked out/i.test(claim)) push(claim);
  }
  for (const event of input.events ?? []) {
    if (event.reason === "promise kept") push("You kept a word you gave me.");
    if (event.reason === "shared victory") push("We closed a named raid together.");
    if (event.reason === "shared failure") push("We walked out of a fight that did not go our way.");
  }
  return out.slice(0, 4);
}

export function inventedHistory(spoken: string, allowed: string[]) {
  const hay = allowed.join(" ").toLowerCase();
  if (!hay) {
    return /gravenor|valdris|thessaly|blackspire|kept your word|tower/i.test(spoken);
  }
  const claims = String(spoken || "").split(/(?<=\.)\s+/);
  return claims.some((claim) => {
    const tokens = claim.toLowerCase().split(/\s+/).filter((token) => token.length > 4);
    if (!tokens.length) return false;
    if (/gravenor|valdris|thessaly|warden|tower/.test(claim) && !hay.includes(tokens.find((t) => /gravenor|valdris|thessaly|warden|tower/.test(t)) || "___")) {
      return !tokens.some((token) => hay.includes(token));
    }
    return false;
  });
}
