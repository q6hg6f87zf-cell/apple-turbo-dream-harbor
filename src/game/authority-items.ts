import {CANON_EQUIPMENT} from './canon-equipment';
import {RETIRED_EQUIPMENT} from './retired-equipment';
import { ARMOR, BB_GUN, BB_TIN, LEDGER_POOLS, RACES, WEAPONS, resolveRaceName } from "./data";
import { HOLLOW_CATALOG } from "./hollow-catalog";
import { TREASURE_CATALOG } from "./treasure-catalog";
import type { ClassName, Item, ItemKind, Rarity, RegionId, WeaponSpec } from "./types";

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
} & WeaponSpec;

export type AuthorityVendorOffer = {
  vendor: string;
  name: string;
  price: number;
  kind: ItemKind;
  rarity: Rarity;
  effect: string;
  lore: string;
  oreUnits?: number;
};

const slotFor = (kind: ItemKind): AuthorityItemTemplate["slot"] =>
  kind === "weapon" || kind === "armor" || kind === "trinket" ? kind : undefined;

const keyFor = (kind: ItemKind, name: string) => `${kind}:${name.trim().toLowerCase()}`;

function starterKind(name: string): ItemKind {
  const lower = name.toLowerCase();
  if (/ore|fragment|cloth|whetstone|chisel/.test(lower)) return "material";
  if (/ration|vial|moss/.test(lower)) return "consumable";
  if (/map|ledger/.test(lower)) return "special";
  return "trinket";
}

function starterEffect(name: string, kind: ItemKind) {
  const lower = name.toLowerCase();
  if (lower.includes("ration")) return "Restore 2 HP.";
  if (lower.includes("moss")) return "Restore 2 HP and ignore the next minor environmental penalty.";
  if (lower.includes("vial")) return "Restore 3 HP.";
  if (kind === "material") return "Starter salvage stock for repairs, crafting or field work.";
  if (kind === "trinket") return "Starter field kit. No combat bonus unless another system specifically calls for it.";
  return "Starter record or key item. Keep it until a system specifically calls for it.";
}

export const NPC_VENDOR_OFFERS: AuthorityVendorOffer[] = [
  {
    vendor: "Voss",
    name: "Pure Void-Essence",
    price: 2000,
    kind: "material",
    rarity: "Rare",
    effect: "Advanced Riftwright reagent for late crafting and resonance work.",
    lore: "Voss sells it in sealed black glass and refuses to say what it was before bottling.",
  },
  {
    vendor: "Voss",
    name: "Rift Shard",
    price: 800,
    kind: "material",
    rarity: "Uncommon",
    effect: "Rift-reactive crafting stock used by the Machine Shop and Signalists.",
    lore: "A sharp little argument with local physics.",
  },
  {
    vendor: "Quartermaster Rudge",
    name: "Standard Rations",
    price: 150,
    kind: "consumable",
    rarity: "Common",
    effect: "Restore 2 HP.",
    lore: "Dense, salty and officially edible.",
  },
  {
    vendor: "Quartermaster Rudge",
    name: "Garrison Whetstone",
    price: 220,
    kind: "material",
    rarity: "Common",
    effect: "Machine Shop maintenance stock for edged weapons.",
    lore: "A flat stone worn smooth by soldiers who had more time than steel.",
  },
  {
    vendor: "Quartermaster Rudge",
    name: "Union Forge M4 Carbine",
    price: 810,
    kind: "weapon",
    rarity: "Uncommon",
    effect: "M4 pattern. Short 5.56. Handy in alleys.",
    lore: "Union Forge heat-treat. Chambered 5.56.",
  },
  {
    vendor: "Quartermaster Rudge",
    name: "Watchworks 5.56 Box",
    price: 140,
    kind: "consumable",
    rarity: "Common",
    effect: "30 rounds of 5.56. M4, M16 and SAW feed.",
    lore: "Sealed crate. Stamped Watchworks.",
  },
  {
    vendor: "Nylah the Dredge",
    name: "Focus Crystal",
    price: 300,
    kind: "trinket",
    rarity: "Uncommon",
    effect: "+1 INT on rift, ritual and archive checks.",
    lore: "Pulled from a drowned instrument panel and polished until it started answering questions.",
  },
  {
    vendor: "Nylah the Dredge",
    name: "Waterlogged Grimoire",
    price: 1200,
    kind: "trinket",
    rarity: "Rare",
    effect: "+2 INT on archive and ritual checks. -1 SPD while carried in the field.",
    lore: "The pages are still wet. Nobody has found the water source.",
  },
  {
    vendor: "Sister Vex",
    name: "Field Gel",
    price: 250,
    kind: "consumable",
    rarity: "Uncommon",
    effect: "Restore 4 HP and clear bleed when present.",
    lore: "Silver-thread gauze that tightens when it tastes blood.",
  },
  {
    vendor: "Sister Vex",
    name: "Holy Salt",
    price: 500,
    kind: "consumable",
    rarity: "Uncommon",
    effect: "Clear one curse or contamination condition when possible.",
    lore: "Vex insists the blessing matters more than the mineral. Tyrone remains unconvinced.",
  },
  {
    vendor: "Krell the Foreman",
    name: "Hollow Ore",
    price: 400,
    kind: "material",
    rarity: "Uncommon",
    effect: "Adds 1 Hollow Ore directly to the Vault 13 upgrade reserve.",
    lore: "Dense black ore with a faint violet seam. Krell weighs every gram twice.",
    oreUnits: 1,
  },
  {
    vendor: "Krell the Foreman",
    name: "Deep-Blast Charge",
    price: 800,
    kind: "consumable",
    rarity: "Rare",
    effect: "+2 weapon damage for one encounter, then add strain from the blast shock.",
    lore: "Mining explosive in a steel sleeve. The warning label has become more warning than label.",
  },
];

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
    weaponFamily: "melee",
    rangeBand: "close",
  });
}

templates.push({
  key: keyFor("weapon", BB_GUN.name),
  name: BB_GUN.name,
  kind: "weapon",
  rarity: BB_GUN.rarity,
  effect: BB_GUN.effect,
  lore: BB_GUN.lore,
  value: BB_GUN.value,
  slot: "weapon",
  damage: BB_GUN.damage,
  weaponFamily: BB_GUN.weaponFamily,
  ammoType: BB_GUN.ammoType,
  rangeBand: BB_GUN.rangeBand,
  mag: BB_GUN.mag,
  magSize: BB_GUN.magSize,
  accuracy: BB_GUN.accuracy,
  recoil: BB_GUN.recoil,
});

templates.push({
  key: keyFor("consumable", BB_TIN.name),
  name: BB_TIN.name,
  kind: "consumable",
  rarity: BB_TIN.rarity,
  effect: BB_TIN.effect,
  lore: BB_TIN.lore,
  value: BB_TIN.value,
  ammoType: BB_TIN.ammoType,
  ammoCount: BB_TIN.ammoCount,
  ammoGrade: BB_TIN.ammoGrade,
});

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
      damage: offer.damage,
      weaponFamily: offer.weaponFamily,
      ammoType: offer.ammoType,
      rangeBand: offer.rangeBand,
      ap: offer.ap,
      accuracy: offer.accuracy,
      recoil: offer.recoil,
      attachmentSlot: offer.attachmentSlot,
      fitsFamilies: offer.fitsFamilies,
      ammoCount: offer.ammoCount,
      magSize: offer.magSize,
      mag: offer.mag,
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
    weaponFamily: item.weaponFamily,
    ammoType: item.ammoType,
    rangeBand: item.rangeBand,
    ap: item.ap,
    accuracy: item.accuracy,
    recoil: item.recoil,
    attachmentSlot: item.attachmentSlot,
    fitsFamilies: item.fitsFamilies,
    ammoCount: item.ammoCount,
    magSize: item.magSize,
    mag: item.mag,
  });
}

for (const item of TREASURE_CATALOG) {
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
    weaponFamily: item.weaponFamily,
    ammoType: item.ammoType,
    rangeBand: item.rangeBand,
    ap: item.ap,
    accuracy: item.accuracy,
    recoil: item.recoil,
    attachmentSlot: item.attachmentSlot,
    fitsFamilies: item.fitsFamilies,
    ammoCount: item.ammoCount,
    magSize: item.magSize,
    mag: item.mag,
  });
}

for (const [raceName, race] of Object.entries(RACES)) {
  for (const name of race.kit) {
    const kind = starterKind(name);
    templates.push({
      key: keyFor(kind, name),
      name,
      kind,
      rarity: "Common",
      effect: starterEffect(name, kind),
      lore: `${raceName} starting issue, sealed by Vault 13 intake.`,
      value: 40,
      slot: slotFor(kind),
    });
  }
}

for (const offer of NPC_VENDOR_OFFERS) {
  templates.push({
    key: keyFor(offer.kind, offer.name),
    name: offer.name,
    kind: offer.kind,
    rarity: offer.rarity,
    effect: offer.effect,
    lore: offer.lore,
    value: offer.price,
    slot: slotFor(offer.kind),
  });
}

templates.push({
  key: keyFor("consumable", "Contact's Vial"),
  name: "Contact's Vial",
  kind: "consumable",
  rarity: "Uncommon",
  effect: "Restore 4 HP.",
  lore: "Broker emergency stock. The provenance is deliberately unhelpful.",
  value: 0,
});

for(const row of CANON_EQUIPMENT)templates.push({...row,key:keyFor(row.kind,row.name),slot:slotFor(row.kind)});
const byKey = new Map<string, AuthorityItemTemplate>();
for (const template of templates) if (!byKey.has(template.key)) byKey.set(template.key, template);

export const AUTHORITY_ITEM_CATALOG = [...byKey.values()];
export const AUTHORITY_ITEM_BY_KEY = byKey;

export function authorityTemplate(kind: ItemKind, name: string) {
  return byKey.get(keyFor(kind, name)) ?? null;
}

export function authorityTemplateByKey(key: string) {
  return byKey.get(key) ?? RETIRED_EQUIPMENT.find(row=>row.key===key) ?? null;
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

export function starterAuthorityTemplates(_cls: ClassName, raceName: string) {
  const race = RACES[resolveRaceName(raceName)];
  if (!race) return [];
  const rows: AuthorityItemTemplate[] = [];
  const gun = authorityTemplate("weapon", BB_GUN.name);
  if (gun) rows.push(gun);
  const tin = authorityTemplate("consumable", BB_TIN.name);
  if (tin) rows.push(tin);
  for (const name of race.kit) {
    const kind = starterKind(name);
    const template = authorityTemplate(kind, name);
    if (template) rows.push(template);
  }
  return rows;
}

export function npcVendorOffer(name: string) {
  return NPC_VENDOR_OFFERS.find((offer) => offer.name === name) ?? null;
}

export function itemFromAuthorityTemplate(
  template: AuthorityItemTemplate,
  instanceId: string,
  opts?: {
    condition?: Item["condition"];
    equipped?: boolean;
    discoveredDay?: number;
    enchantments?: AuthorityItemTemplate[];
    attachments?: AuthorityItemTemplate[];
  },
): Item {
  const enchantments = opts?.enchantments ?? [];
  const attachments = opts?.attachments ?? [];
  const extras = [...enchantments, ...attachments];
  const effect = extras.length
    ? `${template.effect} • ${extras.map((entry) => `${entry.name}: ${entry.effect}`).join(" • ")}`
    : template.effect;
  const value = template.value + extras.reduce((sum, entry) => sum + Math.max(1, Math.round(entry.value * 0.5)), 0);
  const sockets: Item["sockets"] = {};
  for (const part of attachments) {
    if (part.attachmentSlot) sockets[part.attachmentSlot] = part.name;
  }
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
    tags: [
      ...(CANON_EQUIPMENT.some(row=>row.name===template.name)?["canon:v3","unique",`owner:${CANON_EQUIPMENT.find(row=>row.name===template.name)!.owner}`]:[]),
      ...enchantments.flatMap((entry) => [`enchant:${entry.name}`, `enchant-rarity:${entry.rarity}`]),
      ...attachments.flatMap((entry) => [`socket:${entry.attachmentSlot}:${entry.name}`]),
    ],
    sourceRegion: template.sourceRegion,
    discoveredDay: opts?.discoveredDay,
    weaponFamily: template.weaponFamily,
    ammoType: template.ammoType,
    rangeBand: template.rangeBand,
    ap: template.ap,
    accuracy: template.accuracy,
    recoil: template.recoil,
    attachmentSlot: template.attachmentSlot,
    fitsFamilies: template.fitsFamilies,
    ammoCount: template.ammoCount,
    magSize: template.magSize,
    mag: template.mag ?? template.magSize,
    sockets: Object.keys(sockets).length ? sockets : undefined,
  };
}

export const SERVER_TREASURE_BY_REGION: Record<RegionId, AuthorityItemTemplate[]> = {
  ironclad: AUTHORITY_ITEM_CATALOG.filter((item) => !CANON_EQUIPMENT.some(row=>row.name===item.name) && item.sourceRegion === "ironclad"),
  slagtown: AUTHORITY_ITEM_CATALOG.filter((item) => !CANON_EQUIPMENT.some(row=>row.name===item.name) && item.sourceRegion === "slagtown"),
  blackspire: AUTHORITY_ITEM_CATALOG.filter((item) => !CANON_EQUIPMENT.some(row=>row.name===item.name) && item.sourceRegion === "blackspire"),
  brasswater: AUTHORITY_ITEM_CATALOG.filter((item) => !CANON_EQUIPMENT.some(row=>row.name===item.name) && item.sourceRegion === "brasswater"),
  veyra: AUTHORITY_ITEM_CATALOG.filter((item) => !CANON_EQUIPMENT.some(row=>row.name===item.name) && item.sourceRegion === "veyra"),
};