import { ARSENAL_CATALOG } from "./arsenal";
import type { ClassName, ItemKind, Rarity, RegionId, WeaponSpec } from "./types";

export interface CatalogItem extends WeaponSpec {
  name: string;
  kind: ItemKind;
  rarity: Rarity;
  effect: string;
  lore: string;
  value: number;
  sourceRegion: RegionId;
  classHint?: ClassName;
  damage?: string;
  defense?: number;
  /** Market / field loot will not seat this before this campaign day. */
  unlockDay?: number;
  /** Laser / late gear waits on this region being open, not a calendar day. */
  unlockRegion?: RegionId;
}

export const HOLLOW_FIELD_CATALOG: CatalogItem[] = [
  // IRONCLAD · practical, heavy, repairable.
  { name: "Vault 13 Work Knife", kind: "weapon", rarity: "Common", damage: "1d4", effect: "+1 on salvage checks involving cable, cloth or seals.", lore: "Issued from a drawer that has been labelled TEMPORARY since before anyone remembers.", value: 85, sourceRegion: "ironclad", classHint: "Rogue", weaponFamily: "melee", rangeBand: "close" },
  { name: "Rivetguard Vest", kind: "armor", rarity: "Common", defense: 1, effect: "First environmental chip damage each sortie is ignored.", lore: "Leather, boiler plate and enough rivets to offend an engineer.", value: 180, sourceRegion: "ironclad", classHint: "Warrior" },
  { name: "Ash Filter Respirator", kind: "trinket", rarity: "Uncommon", effect: "+1 against smoke, dust and airborne industrial hazards.", lore: "The filter date is unreadable. It still beats breathing Ironclad raw.", value: 360, sourceRegion: "ironclad" },
  { name: "Med-Gel Ampoule", kind: "consumable", rarity: "Uncommon", effect: "Restore 4 HP and suppress bleed for one encounter.", lore: "Sawbones call it medicine. Everyone else calls it cold glue.", value: 420, sourceRegion: "ironclad", classHint: "Healer" },
  { name: "Scrapsteel Bundle", kind: "material", rarity: "Common", effect: "Machine Shop repair stock. Reduces one repair bill when consumed.", lore: "Bent brackets, rail teeth and two pieces nobody can identify.", value: 140, sourceRegion: "ironclad" },
  { name: "Ironbound Coil", kind: "enchantment", rarity: "Rare", effect: "Socketed armor gains +1 DEF while below half HP.", lore: "A copper coil wound around a tooth of black steel. It gets warm before a fight.", value: 1800, sourceRegion: "ironclad", classHint: "Warrior" },
  { name: "Overseer Keycard 13-A", kind: "special", rarity: "Rare", effect: "Opens selected sealed Vault 13 maintenance routes.", lore: "The portrait has been scratched away. The magnetic strip still knows more than Tyrone admits.", value: 2400, sourceRegion: "ironclad" },
  { name: "Railspike Carbine", kind: "weapon", rarity: "Rare", damage: "1d10+1", effect: "Retired maintenance launcher. Pin on a strong hit. Not corridor issue.", lore: "Archive only. A Vesper yard gun that taught a bad habit. The useful idea moved into weapons with a receipt. Do not buy this off a stall.", value: 2100, sourceRegion: "ironclad", classHint: "Rogue", weaponFamily: "rifle", ammoType: "rail", rangeBand: "mid", ap: 1, accuracy: 1, recoil: 1, magSize: 8, mag: 8, unlockDay: 99 },

  // SLAG TOWN · heat, chemicals, brutal improvised industry.
  { name: "Furnace Cleaver", kind: "weapon", rarity: "Uncommon", damage: "1d8", effect: "Heat-resistant chop. Strong hit vs machinery or plate joints.", lore: "Slag-cutting blade from a furnace floor. Ugly, practical, and happier in a spark shower than a duel.", value: 280, sourceRegion: "slagtown", classHint: "Warrior", weaponFamily: "melee", rangeBand: "close" },
  { name: "Foundry Apron", kind: "armor", rarity: "Uncommon", defense: 1, effect: "Fire and heat damage -1.", lore: "Too heavy for comfort, too useful to leave behind.", value: 440, sourceRegion: "slagtown" },
  { name: "Redline Injector", kind: "consumable", rarity: "Rare", effect: "+2 SPD for one encounter, then lose 1 HP.", lore: "The label says INDUSTRIAL USE ONLY. Slag Town considers that a serving suggestion.", value: 850, sourceRegion: "slagtown", classHint: "Rogue" },
  { name: "Furnace Heart", kind: "enchantment", rarity: "Legendary", effect: "Weapon gains +2 damage on the first strike of combat.", lore: "A ceramic core that pulses long after the furnace around it died.", value: 4800, sourceRegion: "slagtown", classHint: "Warrior" },
  { name: "Coke-Brick Bundle", kind: "material", rarity: "Common", effect: "Fuel for high-temperature crafting and field fires.", lore: "Dirty fuel in dirtier paper.", value: 110, sourceRegion: "slagtown" },
  { name: "Smelter's Eye", kind: "trinket", rarity: "Rare", effect: "+2 when judging metal quality, heat or structural weakness.", lore: "A smoked monocle etched with temperature marks nobody uses anymore.", value: 1200, sourceRegion: "slagtown", classHint: "Merchant" },
  { name: "Foreman Punchcard", kind: "special", rarity: "Uncommon", effect: "Bypasses selected Slag Town worker gates and lift controls.", lore: "Clocked out seventeen years ago. The machinery never got the message.", value: 620, sourceRegion: "slagtown" },
  { name: "Helios Thermal Regulator", kind: "material", rarity: "Rare", effect: "T-0888 heat mount. Sustained high load without cooking an old chassis.", lore: "Slag Town furnace output, sized wrong for a courier and exactly right for Bay 13. Travis will say it is too good, then start designing the bracket.", value: 2200, sourceRegion: "slagtown", unlockDay: 12 },

  // BLACKSPIRE · cold, vertical, occult machinery.
  { name: "Route Throwers", kind: "weapon", rarity: "Uncommon", damage: "1d4", effect: "Quiet throw. Last resort, or a light, or a line.", lore: "Balanced field knives from Ashen scouts. They replaced the fantasy throwing steel. They still do not win a gunfight.", value: 240, sourceRegion: "ironclad", classHint: "Rogue", weaponFamily: "melee", rangeBand: "close" },
  { name: "Black-Ice Mantle", kind: "armor", rarity: "Rare", defense: 2, effect: "Cold damage -2 and +1 stealth in darkness.", lore: "The fabric reflects almost no light and refuses to stay warm.", value: 1900, sourceRegion: "blackspire", classHint: "Rogue" },
  { name: "Cryo-Salt Vial", kind: "material", rarity: "Uncommon", effect: "Crafting reagent for cooling, preservation and freeze effects.", lore: "Blue crystals scraped from lift machinery above the frost line.", value: 430, sourceRegion: "blackspire" },
  { name: "Echo Lantern", kind: "trinket", rarity: "Rare", effect: "Reveals hidden movement within short range when stationary.", lore: "It does not cast light. It shows what interrupted the dark.", value: 1500, sourceRegion: "blackspire", classHint: "Wizard" },
  { name: "Nightblood Tonic", kind: "consumable", rarity: "Uncommon", effect: "Ignore darkness penalties for one sortie.", lore: "Tastes like pennies and wintergreen. The pupils stay wrong for hours.", value: 560, sourceRegion: "blackspire" },
  { name: "Gravity Knot", kind: "enchantment", rarity: "Mythic", effect: "Once per sortie, ignore forced movement or a lethal fall.", lore: "A loop of wire that always hangs toward Blackspire no matter how you turn it.", value: 7600, sourceRegion: "blackspire", classHint: "Wizard" },
  { name: "Lift Nine Override", kind: "special", rarity: "Rare", effect: "Authorizes access to sealed Blackspire transit shafts.", lore: "The brass teeth are worn smooth from hands that never came back down.", value: 2700, sourceRegion: "blackspire" },
  { name: "Blackglass Cognition Lattice", kind: "material", rarity: "Rare", effect: "Lets damaged memory sectors reconnect instead of being routed around.", lore: "Blackspire deep-rock wafer. Radiation-stable. Soren wrote that persistent relational memory might be the constraint CIVITAS never had. Thessaly will not hand this to Kane.", value: 3400, sourceRegion: "blackspire", unlockDay: 16 },
  { name: "Obsidian Coilgun", kind: "weapon", rarity: "Legendary", damage: "2d8", effect: "Retired archive coil. Not shop stock. AP 2 if someone is foolish enough to feed it.", lore: "Kept on the record so it is not mistaken for a gun the corridor issues. Energy weapons with a real owner live in Veyra and on AEGIS slings.", value: 5200, sourceRegion: "blackspire", classHint: "Rogue", weaponFamily: "energy", ammoType: "cell", rangeBand: "mid", ap: 2, accuracy: 1, recoil: 1, magSize: 10, mag: 10, unlockDay: 99 },

  // BRASSWATER · flooded machinery, pressure systems, salvage diving.
  { name: "Dredger Hook", kind: "weapon", rarity: "Common", damage: "1d6", effect: "+1 to pull, climb, or snag a line from a boat.", lore: "A Brasswater boat hook. Salvage first. Argument second. Not a sci-fi spear.", value: 120, sourceRegion: "brasswater", classHint: "Warrior", weaponFamily: "melee", rangeBand: "close" },
  { name: "Tidecoat", kind: "armor", rarity: "Uncommon", defense: 1, effect: "Ignore the first movement penalty from water or mud each sortie.", lore: "Waxed canvas over thin brass scales. Smells permanently of low tide.", value: 480, sourceRegion: "brasswater" },
  { name: "Brasswater Capacitor", kind: "material", rarity: "Rare", effect: "High-density charge component for advanced crafting.", lore: "Still holds enough current to make your teeth hurt.", value: 1300, sourceRegion: "brasswater" },
  { name: "Gutter Pearl", kind: "trinket", rarity: "Uncommon", effect: "+1 trade with Brasswater salvagers and dock crews.", lore: "Not a pearl. Nobody corrects the dockmaster.", value: 390, sourceRegion: "brasswater", classHint: "Merchant" },
  { name: "Purifier Ampoule", kind: "consumable", rarity: "Rare", effect: "Clear poison, contamination or one environmental debuff.", lore: "The cleanest thing in Brasswater is kept in a filthy syringe.", value: 920, sourceRegion: "brasswater", classHint: "Healer" },
  { name: "Tidecoil", kind: "enchantment", rarity: "Rare", effect: "Equipped weapon gains +1 damage while wet or during storms.", lore: "A spiral of brass wire sealed around something that keeps moving.", value: 2100, sourceRegion: "brasswater", classHint: "Wizard" },
  { name: "Drowned Archive Plate", kind: "special", rarity: "Legendary", effect: "Contains coordinates and fragments of pre-flood Brasswater records.", lore: "Etched brass text appears only when the plate is submerged.", value: 5000, sourceRegion: "brasswater" },
  { name: "Bottom Key", kind: "special", rarity: "Legendary", effect: "A bounded copy of old flood-control and navigation data. Invaluable. Catastrophic if copied whole.", lore: "The Sink does not drop loot. This is the bounded key it can be made to give up: CIVITAS-era tables, not a personality.", value: 5000, sourceRegion: "brasswater", unlockDay: 99 },

  // VEYRA CITY · clean lines, phase tech, expensive lies.
  { name: "Gate Spear", kind: "weapon", rarity: "Rare", damage: "1d10", effect: "Stops a vehicle or a powered suit at a boundary. Not a backpack trick.", lore: "Veyra Warden polearm. Electromagnetic head, human hands. The city that sealed itself still posts people at the door.", value: 2600, sourceRegion: "veyra", classHint: "Warrior", weaponFamily: "melee", rangeBand: "close", ap: 1, unlockRegion: "veyra" },
  { name: "Nullweave Suit", kind: "armor", rarity: "Legendary", defense: 2, effect: "+1 SPD and resistance to rift effects.", lore: "A seamless black layer that never seems to crease.", value: 5600, sourceRegion: "veyra", classHint: "Rogue" },
  { name: "Veyran Signal Cell", kind: "material", rarity: "Legendary", effect: "Core component for high-tier Riftwright devices and Vault 13 upgrades.", lore: "Transparent casing, blue charge, absolutely no screws.", value: 4100, sourceRegion: "veyra" },
  { name: "Skyline Lens", kind: "trinket", rarity: "Rare", effect: "+2 to spotting drones, signals and long-range movement.", lore: "Projects distances directly onto the wearer's vision. The ads were removed with a soldering iron.", value: 1800, sourceRegion: "veyra" },
  { name: "Cleanroom Stim", kind: "consumable", rarity: "Rare", effect: "Restore 6 HP with no secondary penalty.", lore: "Sterile, measured and wildly expensive. Everyone distrusts it on principle.", value: 1250, sourceRegion: "veyra", classHint: "Healer" },
  { name: "Phase-Lattice", kind: "enchantment", rarity: "Mythic", effect: "Once per sortie, turn one successful enemy hit into a miss.", lore: "A geometric field that exists a fraction of a second before the object wearing it.", value: 8200, sourceRegion: "veyra", classHint: "Wizard" },
  { name: "Citizen Prism", kind: "special", rarity: "Rare", effect: "Stores a fragmentary Veyra identity credential and transit history.", lore: "It insists its owner is still alive. Veyra elections do not cover the emergency Kane never ended.", value: 3100, sourceRegion: "veyra" },
  { name: "Black Key", kind: "special", rarity: "Mythic", effect: "Emergency sovereign authority over Project Vesper. The ending turns on whether it is destroyed, limited, transferred, or kept.", lore: "Kane carries this, not a secret map. Continuity Mandate made physical. A starving city did not vote for it.", value: 9000, sourceRegion: "veyra", unlockDay: 99 },
  { name: "Deadman Key", kind: "special", rarity: "Legendary", effect: "Opens old T-0880 service infrastructure. Required before Bay 13 can rewrite Tyrone's limits.", lore: "Travis kept this when the recall teams came. Privileged maintenance, offline. Not a weapon. The upgrade does not happen without it.", value: 0, sourceRegion: "ironclad", unlockDay: 99 },
  { name: "Grey Guitar", kind: "trinket", rarity: "Rare", effect: "Memory anchor. After T-0888, Tyrone should name the song, the room, the year, and who laughed.", lore: "Not a weapon. Travis plays the recording Tyrone once refused to delete. The test is not a combat diagnostic.", value: 400, sourceRegion: "ironclad", unlockDay: 99 },
  { name: "Bay 13 Roll", kind: "trinket", rarity: "Uncommon", effect: "Manual gauges, bearing puller, patch cable. One bench job ignores network diagnostics.", lore: "Travis works without Veyra service servers. The roll smells like solvent and guitar strings.", value: 360, sourceRegion: "ironclad" },
];

export const HOLLOW_CATALOG: CatalogItem[] = [...HOLLOW_FIELD_CATALOG, ...ARSENAL_CATALOG];
