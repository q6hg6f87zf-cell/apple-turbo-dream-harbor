import type { CatalogItem } from "./hollow-catalog";

/**
 * Deep treasure table layered on top of the base field catalogue.
 * These are intentionally region-authored so later zones feel materially
 * different instead of sharing one generic loot pool.
 */
const LEGACY_TREASURE_CATALOG: CatalogItem[] = [
  // IRONCLAD
  { name: "Railmaster's Torque", kind: "trinket", rarity: "Rare", effect: "+2 to rail, gate and heavy machinery checks.", lore: "Stamped with three defunct rail companies and one fresh bloodstain.", value: 1450, sourceRegion: "ironclad", classHint: "Merchant" },
  { name: "Pressure-Seal Plate", kind: "material", rarity: "Uncommon", effect: "Vault-grade plate used by higher-tier Vault 13 expansions.", lore: "Cut from a bunker door that lost the argument with time.", value: 620, sourceRegion: "ironclad" },
  { name: "Rivet Crown", kind: "armor", rarity: "Rare", defense: 2, effect: "First stagger each combat is ignored.", lore: "A welded brow guard worn by Ironclad breach crews.", value: 2200, sourceRegion: "ironclad", classHint: "Warrior" },
  { name: "Signalman's Crank Radio", kind: "trinket", rarity: "Uncommon", effect: "+1 to signal recovery and distress-call checks.", lore: "The handle squeals louder than the speaker.", value: 740, sourceRegion: "ironclad", classHint: "Bard" },
  { name: "Black Rail Grease", kind: "consumable", rarity: "Common", effect: "Prevent one weapon condition loss this sortie.", lore: "Smells like hot pennies and old engines.", value: 280, sourceRegion: "ironclad" },
  { name: "Founder's Rivet", kind: "special", rarity: "Legendary", effect: "Counts as an Ironclad relic for Vault 13 expansion requirements.", lore: "Pulled from the first wall Ironclad ever raised.", value: 6800, sourceRegion: "ironclad" },
  { name: "Gatekeeper Shotcaster", kind: "weapon", rarity: "Legendary", damage: "2d8+1", effect: "+2 damage while defending a location or ally.", lore: "Built to make the gate somebody else's problem.", value: 7200, sourceRegion: "ironclad", classHint: "Warrior" },
  { name: "Copper Vein Bundle", kind: "material", rarity: "Common", effect: "Conductive salvage used by Vault 13 power upgrades.", lore: "Stripped by hand from a tunnel nobody wants to revisit.", value: 240, sourceRegion: "ironclad" },
  { name: "Tyrone's Spare Relay", kind: "special", rarity: "Mythic", effect: "Massively improves one Vault 13 systems upgrade when consumed by a future system.", lore: "He insists it is not a spare. He also knows exactly which drawer it was in.", value: 12000, sourceRegion: "ironclad" },
  { name: "Warden-Pattern Bulwark", kind: "armor", rarity: "Mythic", defense: 4, effect: "At full HP, reduce the first incoming hit each fight by 3.", lore: "Too heavy for sane people. Ironbound call that a feature.", value: 14800, sourceRegion: "ironclad", classHint: "Warrior" },

  // SLAG TOWN
  { name: "Furnace Brick Core", kind: "material", rarity: "Common", effect: "Heat-resistant structural material used by advanced Vault 13 fabrication.", lore: "Still warm despite being nowhere near a furnace.", value: 310, sourceRegion: "slagtown" },
  { name: "Red Ash Canister", kind: "material", rarity: "Uncommon", effect: "Reactive powder for explosives, coatings and high-temperature crafting.", lore: "Do not breathe what comes off it. Slag Town labels are unusually sincere.", value: 690, sourceRegion: "slagtown" },
  { name: "Boiler Saint Medallion", kind: "trinket", rarity: "Rare", effect: "+1 DEF and +1 morale while below half HP.", lore: "A saint nobody outside Slag Town recognizes.", value: 1700, sourceRegion: "slagtown" },
  { name: "Kilnrunner Boots", kind: "armor", rarity: "Rare", defense: 1, effect: "+2 SPD against fire, collapsing floors and industrial hazards.", lore: "The soles are made from something that should not bend.", value: 2100, sourceRegion: "slagtown", classHint: "Rogue" },
  { name: "Blast-Vent Maul", kind: "weapon", rarity: "Legendary", damage: "2d10", effect: "Critical hits damage enemy armor for the encounter.", lore: "A pressure valve became a hammer because Slag Town got tired of pretending.", value: 7600, sourceRegion: "slagtown", classHint: "Warrior" },
  { name: "Cinderlung Serum", kind: "consumable", rarity: "Rare", effect: "Ignore smoke, heat and toxic-air penalties for one sortie.", lore: "Hurts more going in than the smoke does.", value: 1150, sourceRegion: "slagtown", classHint: "Healer" },
  { name: "Glass Yard Prism", kind: "enchantment", rarity: "Legendary", effect: "Critical hits gain +1 damage die against armored targets.", lore: "Cut from crater glass that bends flame into black rainbows.", value: 5900, sourceRegion: "slagtown", classHint: "Wizard" },
  { name: "Union Foreman's Seal", kind: "special", rarity: "Legendary", effect: "Counts as a Slag Town relic for major Vault 13 projects.", lore: "The union died. The seal still opens doors.", value: 7200, sourceRegion: "slagtown" },
  { name: "Molten Gospel", kind: "special", rarity: "Mythic", effect: "Unlocks a future Slag Town lore chain and counts as premium raid treasure.", lore: "Metal pages. Raised letters. Impossible to read until they glow.", value: 13800, sourceRegion: "slagtown" },
  { name: "Smelter King Harness", kind: "armor", rarity: "Mythic", defense: 3, effect: "Fire immunity for the first two rounds of combat and +1 STR.", lore: "Every buckle is stamped with a different owner's name.", value: 15400, sourceRegion: "slagtown", classHint: "Warrior" },

  // BLACKSPIRE
  { name: "Obsidian Survey Rod", kind: "material", rarity: "Uncommon", effect: "Precision structural component used in advanced Vault 13 projects.", lore: "Always points a few degrees away from magnetic north.", value: 830, sourceRegion: "blackspire" },
  { name: "Deepworks Bearing", kind: "material", rarity: "Rare", effect: "High-load machine component for late Vault upgrades.", lore: "Turns without friction. Nobody has found the lubricant.", value: 1600, sourceRegion: "blackspire" },
  { name: "Spirewalker Crampons", kind: "trinket", rarity: "Uncommon", effect: "+2 to climb, ice and vertical movement checks.", lore: "The spikes retract when the wearer panics. Nobody knows why.", value: 820, sourceRegion: "blackspire" },
  { name: "Cold-Sun Lens", kind: "trinket", rarity: "Legendary", effect: "Reveal weak points on a strong WIS or INT check.", lore: "Shows heat where none exists and darkness where it should not.", value: 5400, sourceRegion: "blackspire", classHint: "Wizard" },
  { name: "Grav-Shear Knife", kind: "weapon", rarity: "Legendary", damage: "2d8+2", effect: "Ignore 2 DEF on attacks made from higher ground.", lore: "The blade feels heavier at the tip and lighter at the hand.", value: 8200, sourceRegion: "blackspire", classHint: "Rogue" },
  { name: "White Static Ampoule", kind: "consumable", rarity: "Rare", effect: "Gain +2 INT and WIS for one encounter, then become Worn in spirit if not in gear.", lore: "The injection sounds like radio snow inside the skull.", value: 1300, sourceRegion: "blackspire", classHint: "Wizard" },
  { name: "Cartographer's Nail", kind: "special", rarity: "Legendary", effect: "Counts as a Blackspire relic for Vault 13 expansion gates.", lore: "Driven through a map into a place that is not on the map anymore.", value: 7800, sourceRegion: "blackspire" },
  { name: "Abyssal Counterweight", kind: "enchantment", rarity: "Mythic", effect: "Once per sortie, cancel forced movement, knockback or a lethal fall for the whole party.", lore: "It weighs nothing until something tries to move you.", value: 14800, sourceRegion: "blackspire" },
  { name: "Liftmaster's Black Key", kind: "special", rarity: "Mythic", effect: "Opens a future Blackspire deep-route and counts as apex treasure.", lore: "Every tooth on the key is a different length. One is warm.", value: 16400, sourceRegion: "blackspire" },
  { name: "Nightglass Carapace", kind: "armor", rarity: "Mythic", defense: 4, effect: "Reduce ranged damage by 2 and gain +1 SPD in darkness.", lore: "Looks brittle. Has survived three elevator collapses.", value: 17600, sourceRegion: "blackspire", classHint: "Rogue" },

  // BRASSWATER
  { name: "Floodgate Gear", kind: "material", rarity: "Common", effect: "Corrosion-resistant machinery part used by Vault 13 water systems.", lore: "Three teeth missing. Still better than anything made topside.", value: 360, sourceRegion: "brasswater" },
  { name: "Pressure Pearl Bearing", kind: "material", rarity: "Rare", effect: "Precision hydraulic component for late Vault 13 upgrades.", lore: "Perfectly smooth until submerged, when tiny symbols appear.", value: 1750, sourceRegion: "brasswater" },
  { name: "Diver's Bell Charm", kind: "trinket", rarity: "Uncommon", effect: "+1 WIS underwater and +1 against panic effects.", lore: "Rings once when the water is about to get worse.", value: 890, sourceRegion: "brasswater" },
  { name: "Undertow Harness", kind: "armor", rarity: "Rare", defense: 2, effect: "Water cannot slow the wearer and grapple resistance +2.", lore: "Weighted correctly enough to be dangerous in a very specific way.", value: 2600, sourceRegion: "brasswater", classHint: "Warrior" },
  { name: "Stormcoil Pistol", kind: "weapon", rarity: "Legendary", damage: "2d8", effect: "During storms or wet conditions, chain 2 damage to a nearby target.", lore: "Fires cleanest when everything else is soaked.", value: 7900, sourceRegion: "brasswater", classHint: "Wizard" },
  { name: "Brineblood Injector", kind: "consumable", rarity: "Rare", effect: "Restore 5 HP and ignore drowning/pressure penalties for one encounter.", lore: "The body hates it. The lungs hate drowning more.", value: 1400, sourceRegion: "brasswater", classHint: "Healer" },
  { name: "Archive Brass Seal", kind: "special", rarity: "Legendary", effect: "Counts as a Brasswater relic for major Vault 13 construction.", lore: "Pressed with a library crest from before the first flood.", value: 8500, sourceRegion: "brasswater" },
  { name: "Leviathan Capacitor", kind: "enchantment", rarity: "Mythic", effect: "Once per boss fight, overcharge a weapon for +50% damage on one hit.", lore: "The charge meter has no maximum marking.", value: 15200, sourceRegion: "brasswater" },
  { name: "Tide King's Ledger", kind: "special", rarity: "Mythic", effect: "Future trade-chain key and apex treasure for Brasswater.", lore: "Every debt is written in waterproof ink. Some names are still alive.", value: 17000, sourceRegion: "brasswater", classHint: "Merchant" },
  { name: "Drowned Knight Plate", kind: "armor", rarity: "Mythic", defense: 4, effect: "First critical hit received each sortie becomes a normal hit.", lore: "Recovered from a street six floors below the current shoreline.", value: 18200, sourceRegion: "brasswater", classHint: "Warrior" },

  // VEYRA CITY
  { name: "Prismatic Conduit", kind: "material", rarity: "Rare", effect: "High-density Veyran power conduit required by apex Vault 13 projects.", lore: "Carries power without heat, sound or any obvious respect for physics.", value: 2400, sourceRegion: "veyra" },
  { name: "Null Ceramic Stack", kind: "material", rarity: "Legendary", effect: "Late-game shielding material for Vault 13 and Riftwright equipment.", lore: "Radar, heat and common sense all slide off it.", value: 4800, sourceRegion: "veyra" },
  { name: "Transit Halo", kind: "trinket", rarity: "Rare", effect: "+2 to navigation and drone detection inside Veyra City.", lore: "A ticketing device hacked until it became useful.", value: 2300, sourceRegion: "veyra" },
  { name: "Phaseguard Mantle", kind: "armor", rarity: "Legendary", defense: 3, effect: "Once per combat, phase through one successful ranged hit.", lore: "It flickers half a heartbeat behind the person wearing it.", value: 9200, sourceRegion: "veyra", classHint: "Rogue" },
  { name: "2753 Rail", kind: "weapon", rarity: "Mythic", damage: "3d8", effect: "Critical hits ignore armor and strike a second target for half damage.", lore: "The projectile leaves before the trigger finishes moving.", value: 18800, sourceRegion: "veyra", classHint: "Wizard", weaponFamily: "heavy", ammoType: "rail", rangeBand: "long", ap: 3, accuracy: 2, recoil: 3, magSize: 4, mag: 4 },
  { name: "Civic Reboot Dose", kind: "consumable", rarity: "Legendary", effect: "Restore full HP and clear one curse or contamination effect.", lore: "Government medicine from a government that no longer answers calls.", value: 4200, sourceRegion: "veyra", classHint: "Healer" },
  { name: "Warden's White Token", kind: "special", rarity: "Legendary", effect: "Counts as a Veyra relic for final Vault 13 expansion gates.", lore: "A blank credential recognized by doors with no visible readers.", value: 11000, sourceRegion: "veyra" },
  { name: "Zero-Point Rosary", kind: "enchantment", rarity: "Mythic", effect: "Once per sortie, reroll any failed check and keep the better result.", lore: "Each bead floats a millimeter from the string.", value: 19200, sourceRegion: "veyra", classHint: "Bard" },
  { name: "Null Warden Memory Shard", kind: "special", rarity: "Mythic", effect: "Apex boss treasure. Future endgame systems may consume it.", lore: "Contains twelve seconds of memory from something that should not remember being human.", value: 24000, sourceRegion: "veyra" },
  { name: "Skyline Exoshell", kind: "armor", rarity: "Mythic", defense: 5, effect: "+1 STR, +1 SPD and resistance to rift damage.", lore: "Designed for city security teams that expected the skyline itself to attack.", value: 26000, sourceRegion: "veyra", classHint: "Warrior" },
];

export const TREASURE_CATALOG=LEGACY_TREASURE_CATALOG.filter(row=>row.kind==="material"&&row.rarity!=="Cursed");
