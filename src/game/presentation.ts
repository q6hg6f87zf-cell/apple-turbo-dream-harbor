import type { ClassName, ItemKind } from "./types";

export const CLASS_PRESENTATION: Record<
  ClassName,
  { name: string; emoji: string; role: string; description: string }
> = {
  Warrior: {
    name: "Ironbound",
    emoji: "⚙️",
    role: "Frontline / Breach",
    description: "Vault-bred bruisers in patched plate and pressure steel. They go through the door first and usually leave a wider door behind.",
  },
  Wizard: {
    name: "Riftwright",
    emoji: "⚡",
    role: "Aether / Control",
    description: "Technicians who learned the Hollow answers back. They bend unstable energy, broken machines and rift phenomena into weapons.",
  },
  Rogue: {
    name: "Ghostrunner",
    emoji: "🗡️",
    role: "Scout / Infiltration",
    description: "Fast hands, quiet boots, bad intentions. Ghostrunners map dead zones, crack sealed places and disappear before the bill arrives.",
  },
  Healer: {
    name: "Sawbones",
    emoji: "🩹",
    role: "Field Medic / Recovery",
    description: "Medics who work with whatever still has a pulse and whatever tools are clean enough. In Hollow Realm, clean enough is a generous phrase.",
  },
  Merchant: {
    name: "Broker",
    emoji: "🪙",
    role: "Trade / Logistics",
    description: "Quartermasters, fixers and dealmakers. A Broker knows who owns the part, who stole the part and what it costs to stop asking questions.",
  },
  Bard: {
    name: "Signalist",
    emoji: "📻",
    role: "Signal / Morale",
    description: "Radio operators and frequency scavengers who weaponize sound, stories and battlefield comms. If the wasteland is listening, they talk louder.",
  },
};

export function className(cls: ClassName): string {
  return CLASS_PRESENTATION[cls].name;
}

export function classLabel(cls: ClassName): string {
  const m = CLASS_PRESENTATION[cls];
  return `${m.emoji} ${m.name}`;
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
  material: { label: "Material", plural: "Materials", emoji: "🔩" },
  special: { label: "Special", plural: "Special", emoji: "📼" },
};

export function itemEmoji(kind: ItemKind): string {
  return ITEM_KIND_PRESENTATION[kind].emoji;
}
