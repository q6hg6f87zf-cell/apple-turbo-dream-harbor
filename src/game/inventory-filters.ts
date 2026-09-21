import type { AmmoType, InventoryCategory, ItemKind, RegionId, WeaponFamily } from "./types";

export const INVENTORY_FILTERS: { id: InventoryCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "weapon", label: "Weapons" },
  { id: "ammo", label: "Ammo" },
  { id: "armor", label: "Armor" },
  { id: "trinket", label: "Trinkets" },
  { id: "consumable", label: "Chems" },
  { id: "attachment", label: "Parts" },
  { id: "enchantment", label: "Coils" },
  { id: "material", label: "Stock" },
  { id: "special", label: "Special" },
];

export type WeaponLane = "all" | "rifle" | "melee" | "sidearm" | "shotgun" | "energy" | "heavy";

export const WEAPON_LANES: { id: WeaponLane; label: string }[] = [
  { id: "all", label: "All steel" },
  { id: "rifle", label: "Rifles" },
  { id: "melee", label: "Melee" },
  { id: "sidearm", label: "Sidearms" },
  { id: "shotgun", label: "Shotguns" },
  { id: "energy", label: "Energy" },
  { id: "heavy", label: "Heavy" },
];

export const CALIBERS: AmmoType[] = [
  "9mm",
  ".45",
  "5.56",
  ".30-30",
  ".270",
  ".30-06",
  ".308",
  ".300",
  "12g",
  "bb",
  "rail",
  "bolt",
  "cell",
  "laser",
];

export function isAmmoItem(kind: ItemKind, ammoType?: AmmoType | null): boolean {
  return kind === "consumable" && !!ammoType;
}

export function matchesInventoryCategory(
  kind: ItemKind,
  ammoType: AmmoType | undefined,
  category: InventoryCategory,
): boolean {
  if (category === "all") return true;
  if (category === "ammo") return isAmmoItem(kind, ammoType);
  if (category === "consumable") return kind === "consumable" && !ammoType;
  return kind === category;
}

export function matchesCaliber(ammoType: AmmoType | undefined, caliber: AmmoType | "all"): boolean {
  if (caliber === "all") return true;
  return ammoType === caliber;
}

export function matchesRegion(sourceRegion: RegionId | undefined, region: RegionId | "all"): boolean {
  if (region === "all") return true;
  return sourceRegion === region;
}

export function inferWeaponLane(input: {
  name: string;
  weaponFamily?: WeaponFamily;
  ammoType?: AmmoType;
}): Exclude<WeaponLane, "all"> {
  const n = input.name.toLowerCase();
  const fam = input.weaponFamily;
  if (fam === "melee") return "melee";
  if (fam === "pistol" || fam === "smg") return "sidearm";
  if (fam === "shotgun") return "shotgun";
  if (fam === "energy") return "energy";
  if (fam === "heavy" || fam === "sniper") return "heavy";
  if (fam === "rifle") return "rifle";
  if (/sword|mace|halberd|cleaver|knife|knives|shiv|spike|hook|baton|chain|dagger|staff|axe|spear|lute|harp|flute|stick|scalpel|wand|tome|cane|maul|blade|femur|censer|ledger|scales/.test(n)) {
    return "melee";
  }
  if (/pistol|sidearm|subgun/.test(n)) return "sidearm";
  if (/shotgun|scatter/.test(n)) return "shotgun";
  if (/laser|coilgun|arc lance|phase|l8|l6|l4|l9/.test(n) || input.ammoType === "laser" || input.ammoType === "cell") {
    return "energy";
  }
  if (/rail|cannon|saw|harpoon/.test(n) || input.ammoType === "rail") return "heavy";
  return "rifle";
}

export function matchesWeaponLane(
  input: { name: string; weaponFamily?: WeaponFamily; ammoType?: AmmoType },
  lane: WeaponLane,
): boolean {
  if (lane === "all") return true;
  return inferWeaponLane(input) === lane;
}
