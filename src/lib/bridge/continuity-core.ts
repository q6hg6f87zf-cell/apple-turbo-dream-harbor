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

export function applyBondDelta(
  bond: TyroneBondState,
  field: unknown,
  delta: number,
  reason: string,
): { ok: true; previous: number; next: number; bond: TyroneBondState; reason: string } | { ok: false; error: string } {
  if (!isBondField(field)) return { ok: false, error: "unknown relationship field" };
  if (!Number.isFinite(delta) || Math.abs(delta) > 12) return { ok: false, error: "delta out of range" };
  if (!String(reason || "").trim()) return { ok: false, error: "reason required" };
  if (field === "humor") return { ok: false, error: "humor is read-only this phase" };
  const previous = bond[field];
  const next = clampBond(previous + delta);
  return { ok: true, previous, next, reason: String(reason).slice(0, 160), bond: { ...bond, [field]: next } };
}

export function bondDeltaForEvent(type: string): Partial<Record<BondField, number>> {
  if (type === "boss.defeated") return { trust: 2, respect: 3, sharedHistory: 4, loyalty: 2 };
  if (type === "character.died" || type === "death") return { concern: 4, conflict: 2, trust: -2 };
  if (type === "tyrone.promise_fulfilled" || type === "promise.fulfilled") {
    return { trust: 3, loyalty: 2, sharedHistory: 2 };
  }
  if (type === "tyrone.promise_broken" || type === "promise.broken") return { trust: -4, conflict: 3 };
  if (type === "character.forged") return { familiarity: 3, trust: 1 };
  return {};
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
