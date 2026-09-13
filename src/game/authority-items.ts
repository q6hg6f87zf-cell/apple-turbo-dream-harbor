import { ARMOR, LEDGER_POOLS, WEAPONS } from "./data";
import { HOLLOW_CATALOG } from "./hollow-catalog";
import type { ClassName, Item, ItemKind, Rarity, RegionId } from "./types";

export type AuthorityItemTemplate = {
  key: string;
  name: string;
  kind: ItemKind;
  rarity: Rarity;
  effect: string;
  lore: string;
  value: number;
  slot?: "weapon" | "armor" | "trinket";
  classHint?: ClassName;
  damage?: string;
  defense?: number;
  sourceRegion?: RegionId;
};

const slotFor = (kind: ItemKind): AuthorityItemTemplate["slot"] =>
  kind === "weapon" || kind === "armor" || kind === "trinket" ? kind : undefined;

const keyFor = (kind: ItemKind, name: string) => `${kind}:${name.trim().toLowerCase()}`;

const templates: AuthorityItemTemplate[] = [];

for (const weapon of WEAPONS) {
  templates.push({
    key: keyFor("weapon", weapon.name),
    name: weapon.name,
    kind: "weapon",
    rarity: weapon.rarity,
    effect: weapon.effect,
    lore: weapon.lore,
    value: weapon.value,
    slot: "weapon",
    classHint: weapon.cls,
    damage: weapon.damage,
  });
}

for (const armor of ARMOR) {
  templates.push({
    key: keyFor("armor", armor.name),
    name: armor.name,
    kind: "armor",
    rarity: armor.rarity,
    effect: armor.effect,
    lore: "Vault 13 armor record.",
    value: armor.value,
    slot: "armor",
    classHint: armor.cls,
    defense: armor.defense,
  });
}

for (const pool of Object.values(LEDGER_POOLS)) {
  for (const offer of pool) {
    templates.push({
      key: keyFor(offer.kind, offer.name),
      name: offer.name,
      kind: offer.kind,
      rarity: offer.rarity,
      effect: offer.effect,
      lore: "Quartermaster Exchange record.",
      value: offer.price,
      slot: slotFor(offer.kind),
    });
  }
}

for (const item of HOLLOW_CATALOG) {
  templates.push({
    key: keyFor(item.kind, item.name),
    name: item.name,
    kind: item.kind,
    rarity: item.rarity,
    effect: item.effect,
    lore: item.lore,
    value: item.value,
    slot: slotFor(item.kind),
    classHint: item.classHint,
    damage: item.damage,
    defense: item.defense,
    sourceRegion: item.sourceRegion,
  });
}

const byKey = new Map<string, AuthorityItemTemplate>();
for (const template of templates) if (!byKey.has(template.key)) byKey.set(template.key, template);

export const AUTHORITY_ITEM_CATALOG = [...byKey.values()];
export const AUTHORITY_ITEM_BY_KEY = byKey;

export function authorityTemplate(kind: ItemKind, name: string) {
  return byKey.get(keyFor(kind, name)) ?? null;
}

export function authorityTemplateByKey(key: string) {
  return byKey.get(key) ?? null;
}

export function legacyItemTemplate(raw: Pick<Item, "name" | "kind"> & Partial<Item>) {
  const template = authorityTemplate(raw.kind, raw.name);
  if (!template) return null;
  // Legacy client saves have no trustworthy signature. Only low/mid-tier known
  // templates get one migration path. High-tier prestige gear must be re-earned
  // from server-issued treasure after authority is enabled.
  if (["Legendary", "Mythic", "Cursed"].includes(template.rarity)) return null;
  return template;
}

export function itemFromAuthorityTemplate(
  template: AuthorityItemTemplate,
  instanceId: string,
  opts?: {
    condition?: Item["condition"];
    equipped?: boolean;
    discoveredDay?: number;
    enchantments?: AuthorityItemTemplate[];
  },
): Item {
  const enchantments = opts?.enchantments ?? [];
  const effect = enchantments.length
    ? `${template.effect} • ${enchantments.map((entry) => `${entry.name}: ${entry.effect}`).join(" • ")}`
    : template.effect;
  const value = template.value + enchantments.reduce((sum, entry) => sum + Math.max(1, Math.round(entry.value * 0.5)), 0);
  return {
    id: instanceId,
    name: template.name,
    kind: template.kind,
    rarity: template.rarity,
    condition: opts?.condition ?? "Pristine",
    slot: template.slot,
    classHint: template.classHint,
    damage: template.damage,
    defense: template.defense,
    effect,
    lore: template.lore,
    equipped: !!opts?.equipped,
    value,
    tags: enchantments.flatMap((entry) => [`enchant:${entry.name}`, `enchant-rarity:${entry.rarity}`]),
    sourceRegion: template.sourceRegion,
    discoveredDay: opts?.discoveredDay,
  };
}

export const SERVER_TREASURE_BY_REGION: Record<RegionId, AuthorityItemTemplate[]> = {
  ironclad: AUTHORITY_ITEM_CATALOG.filter((item) => item.sourceRegion === "ironclad"),
  slagtown: AUTHORITY_ITEM_CATALOG.filter((item) => item.sourceRegion === "slagtown"),
  blackspire: AUTHORITY_ITEM_CATALOG.filter((item) => item.sourceRegion === "blackspire"),
  brasswater: AUTHORITY_ITEM_CATALOG.filter((item) => item.sourceRegion === "brasswater"),
  veyra: AUTHORITY_ITEM_CATALOG.filter((item) => item.sourceRegion === "veyra"),
};
