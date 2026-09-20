import { resolveLineage, resolveRaceName } from "./data-legacy";
import type { ClassName, ItemKind } from "./types";

export const CLASS_PRESENTATION: Record<
  ClassName,
  { name: string; role: string; description: string }
> = {
  Warrior: {
    name: "Ironbound",
    role: "Frontline / Breach",
    description: "Vault-bred bruisers in patched plate and pressure steel. They go through the door first and usually leave a wider door behind.",
  },
  Wizard: {
    name: "Riftwright",
    role: "SYNAPSE / Control",
    description: "Technicians who learned the Hollow answers back. They bend unstable energy, broken machines and rift phenomena into weapons.",
  },
  Rogue: {
    name: "Ghostrunner",
    role: "Scout / Infiltration",
    description: "Fast hands, quiet boots, bad intentions. Ghostrunners map dead zones, crack sealed places and disappear before the bill arrives.",
  },
  Healer: {
    name: "Sawbones",
    role: "Field Medic / Recovery",
    description: "Medics who work with whatever still has a pulse and whatever tools are clean enough. In Hollow Realm, clean enough is a generous phrase.",
  },
  Merchant: {
    name: "Broker",
    role: "Trade / Logistics",
    description: "Quartermasters, fixers and dealmakers. A Broker knows who owns the part, who stole the part and what it costs to stop asking questions.",
  },
  Bard: {
    name: "Signalist",
    role: "Signal / Morale",
    description: "Radio operators and frequency scavengers who weaponize sound, stories and battlefield comms. If the wasteland is listening, they talk louder.",
  },
};

export function className(cls: ClassName | string): string {
  const meta = CLASS_PRESENTATION[cls as ClassName];
  return meta?.name ?? cls;
}

export function classLabel(cls: ClassName): string {
  return CLASS_PRESENTATION[cls].name;
}

export function displayRace(name: string): string {
  if (name.startsWith("__stack_")) return "Signal-marked";
  return resolveRaceName(name);
}

export function displayLineage(race: string, lineage: string): string {
  return resolveLineage(race, lineage);
}

export const ITEM_KIND_PRESENTATION: Record<
  ItemKind,
  { label: string; emoji: string; plural: string }
> = {
  weapon: { label: "Weapon", plural: "Weapons", emoji: "🗡️" },
  armor: { label: "Armor", plural: "Armor", emoji: "🛡️" },
  trinket: { label: "Trinket", plural: "Trinkets", emoji: "🧿" },
  consumable: { label: "Consumable", plural: "Consumables", emoji: "💉" },
  enchantment: { label: "Enchantment", plural: "Enchantments", emoji: "✨" },
  attachment: { label: "Attachment", plural: "Attachments", emoji: "🔧" },
  material: { label: "Material", plural: "Materials", emoji: "🔩" },
  special: { label: "Special", plural: "Special", emoji: "📼" },
};

export function itemEmoji(kind: ItemKind): string {
  return ITEM_KIND_PRESENTATION[kind].emoji;
}
