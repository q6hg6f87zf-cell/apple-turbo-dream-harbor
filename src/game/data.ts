// Hollow Realm canonical data layer.
//
// The original monolithic catalog is preserved in data-legacy.ts so the live
// game keeps working while the overworld, regional maps and inventory shell are
// migrated in stages.
export * from "./data-legacy";

import {
  BASE_ROOMS as LEGACY_BASE_ROOMS,
  QUARTERS as LEGACY_QUARTERS,
  WORLD as LEGACY_WORLD,
} from "./data-legacy";
import type { RegionDefinition, RegionId } from "./types";

export const WORLD_NAME = "Hollow Realm";
export const HOME_BASE_NAME = "Vault 13";

export const CANONICAL_REGION_IDS: RegionId[] = [
  "ironclad",
  "slagtown",
  "blackspire",
  "brasswater",
  "veyra",
];

/**
 * Ironclad is home. Every newly forged character originates here and the
 * campaign begins here before the wider Hollow Realm opens up.
 */
export const STARTING_REGION: RegionId = "ironclad";
export const HOME_BASE_REGION: RegionId = STARTING_REGION;
export const ORIGINS = ["Ironclad"];

export const HOME_BASE_DESCRIPTION =
  "Vault 13 is an old sealed shelter cut into the ridgeline beyond Ironclad's outer rail. TyroneBot lives here, and every Moon Squad resident who joins the Hollow Realm is given a bunk, a locker and a place at the table.";

/**
 * Player-facing Vault 13 room names. Internal IDs deliberately stay unchanged
 * so existing saves, upgrade math and gameplay actions remain compatible.
 */
export const BASE_ROOMS = {
  ...LEGACY_BASE_ROOMS,
  vault: {
    ...LEGACY_BASE_ROOMS.vault,
    name: "Salvage Depot",
    desc: "Secure racks, reclamation cages and tagged shelves for weapons, armor, scrap and anything dragged home from the Hollow Realm.",
    tiers: [
      { cost: 0, bonus: "20 item capacity. Reclaimed salvage generates +3 caps/tick." },
      { cost: 2500, bonus: "50 capacity. Climate seals slow gear degradation. +6 caps/tick." },
      { cost: 8000, bonus: "100 capacity. Hardened storage preserves condition. +10 caps/tick." },
    ],
  },
  barracks: {
    ...LEGACY_BASE_ROOMS.barracks,
    name: "Resident Quarters",
    desc: "Bunks, lockers and narrow steel corridors for the people who call Vault 13 home. More beds mean a larger active roster.",
    tiers: [
      { cost: 1800, bonus: "+2 operative beds. Vault perimeter defended on 12+." },
      { cost: 5000, bonus: "+4 operative beds. Vault perimeter defended on 10+." },
      { cost: 12000, bonus: "+6 operative beds. Defended on 8+. Residents can counter-attack." },
    ],
  },
  forge: {
    ...LEGACY_BASE_ROOMS.forge,
    name: "Machine Shop",
    desc: "Welders, lathes, presses and a jury-rigged forge line keep Vault 13's equipment alive long after it should have failed.",
    tiers: [
      { cost: 1400, bonus: "Field repair 400c. Worn gear can be restored." },
      { cost: 4200, bonus: "Repair 220c. Adds one enchantment socket." },
      { cost: 11000, bonus: "Repair 80c. Two sockets. Experimental self-repair on 16+." },
    ],
  },
  infirmary: {
    ...LEGACY_BASE_ROOMS.infirmary,
    name: "Med Bay",
    desc: "Old surgical lamps, scavenged diagnostics and a cabinet Tyrone insists is still within expiration date.",
    tiers: [
      { cost: 2200, bonus: "Treat wounds 80c. Stabilise downed residents." },
      { cost: 6500, bonus: "Treat void infection. Repair companion trauma." },
      { cost: 15000, bonus: "Attempt resurrection on 10+. Full emergency service." },
    ],
  },
  watchtower: {
    ...LEGACY_BASE_ROOMS.watchtower,
    name: "Perimeter Control",
    desc: "Surface cameras, floodlights, motion sensors and patched radar watch the badlands between Vault 13 and Ironclad.",
    tiers: [
      { cost: 2000, bonus: "Mission DC -1. Early warning for night incursions." },
      { cost: 6000, bonus: "Mission DC -2. Track bounty movement across the wastes." },
      { cost: 14000, bonus: "Mission DC -3. Deep-range villain intel unlocked." },
    ],
  },
  ledger: {
    ...LEGACY_BASE_ROOMS.ledger,
    name: "Quartermaster Exchange",
    desc: "Vault 13's ration counter, bounty board and cap ledger. The old daily stall closed. Gear is bought at the Moon Squad Market under the Iron Gate.",
    tiers: [
      { cost: 1600, bonus: "Moon Squad cut: market rumors land cleaner." },
      { cost: 4800, bonus: "Essential routing. Better exchange rates on the card." },
      { cost: 10000, bonus: "Artifact chance. 15% Moon Squad Market discount." },
    ],
  },
};

export const QUARTERS = {
  ...LEGACY_QUARTERS,
  bunk: {
    ...LEGACY_QUARTERS.bunk,
    name: "Resident Bunk",
    tiers: [
      { cost: 800, bonus: "+1 to the first roll after a night in Vault 13." },
      { cost: 2000, bonus: "+2 Max HP from upgraded living conditions." },
      { cost: 4500, bonus: "Full HP restoration after sleeping in the vault." },
    ],
  },
  lockbox: {
    ...LEGACY_QUARTERS.lockbox,
    name: "Personal Footlocker",
    tiers: [
      { cost: 1000, bonus: "25% protection from theft and loss." },
      { cost: 2800, bonus: "50% protection from theft and loss." },
      { cost: 6000, bonus: "75% protection. Vault-grade locking assembly." },
    ],
  },
  hearth: {
    ...LEGACY_QUARTERS.hearth,
    name: "Common Room",
    tiers: [
      { cost: 1200, bonus: "Companions recover 1 HP at dawn." },
      { cost: 2800, bonus: "Companions gain +1 to passive rolls." },
      { cost: 5500, bonus: "Companions fully recover at dawn." },
    ],
  },
};

/**
 * Transitional live-world override. The current flat-map runtime still uses
 * legacy region IDs, but Vault 13 is already placed beside Ironclad and uses
 * the new base identity. The 3D globe/region-map rebuild will eventually make
 * Vault 13 an Ironclad POI rather than a separate overworld pin.
 */
export const WORLD = LEGACY_WORLD.map((loc) => {
  if (loc.id === "hq") {
    return {
      ...loc,
      name: HOME_BASE_NAME,
      short: "Vault 13",
      x: 22,
      y: 48,
      danger: 1,
      desc: HOME_BASE_DESCRIPTION,
      features: [
        "Resident Quarters",
        "Machine Shop",
        "Med Bay",
        "Salvage Depot",
        "Perimeter Control",
        "Quartermaster Exchange",
        "Moon Squad Market",
        "Relay Tower Three",
      ],
    };
  }
  if (loc.id === "ironclad") {
    return {
      ...loc,
      name: "Ironclad",
      short: "Ironclad",
      desc: "First hard town beyond Vault 13. Forged walls, rail cuts, slag lanterns. The Exchange inside the vault is closed. We buy at the Moon Squad Market under the Iron Gate. Relay Tower Three talks over it.",
      features: [
        "The Iron Gate",
        "Moon Squad Market",
        "Relay Tower Three",
        "East Highway",
        "Halo Yard",
        "Rail Cut",
        "Ironclad Works",
        "Ashen Pack hills",
        "Vault 13 ridge",
      ],
    };
  }
  if (loc.id === "kingdom") {
    return {
      ...loc,
      name: "Slag Town",
      short: "Slag Town",
      desc: "A furnace city on cooling slag. Every district owes somebody fuel. Kane pays in refined ore for anything that still burns hot enough to feed a starship stack.",
      features: ["Foundry Row", "The Glass Yard", "Coke Stacks", "Tithe Office", "Pipewalk", "Furnace Court", "Fuel tithe"],
    };
  }
  if (loc.id === "caverns") {
    return {
      ...loc,
      name: "Blackspire",
      short: "Blackspire",
      desc: "A black mountain punched through by mines and lift cages. The ore here is the reason Kane wants the Hollow Realm at all.",
      features: ["Grand Lift Nine", "The Deepworks", "Frost Camp", "Ore Weigh", "Cageworks", "Cartographer's Crown", "Hollow ore veins"],
    };
  }
  if (loc.id === "library") {
    return {
      ...loc,
      name: "Brasswater",
      short: "Brasswater",
      desc: "Drowned industrial coast. Brass towers, pontoon streets, an archive that keeps sinking. Kane's people dive for the old jump tables.",
      features: ["Brasswater Docks", "Tide Market", "Drowned Archive", "Pontoon Chapel", "Floodgate Two", "The Sink", "Tide streets"],
    };
  }
  if (loc.id === "veyra") {
    return {
      ...loc,
      name: "Veyra City",
      short: "Veyra",
      desc: "Human city of AEGIS 2753 super suits. Dr. Vesper Kane built them as successors to the T-0880 line after the shutdown order. Elite pilots. Top-secret intergalactic-travel program. The Hollow Realm is her fuel stop.",
      features: ["Rift Market", "Civic Exchange", "AEGIS Hangar 2753", "Kane Spire", "Signal Mast", "Suit Yards", "Warden's Boundary"],
    };
  }
  return loc;
});

export const REGIONS: RegionDefinition[] = [
  {
    id: "ironclad",
    name: "Ironclad",
    short: "Ironclad",
    continent: "Hollowstead",
    biome: "industrial-frontier",
    description:
      "A hard northern frontier of iron ridges, rail cuts and fortress works. Vault 13 is buried into the ridgeline beyond the outer rail. The Exchange inside the vault is closed. Caps walk to the Moon Squad Market under the Iron Gate. Relay Tower Three still talks, if you climb it.",
    danger: 3,
    marker: { lat: 34, lon: -118, altitude: 0.012 },
    mapAsset: "/map/regions/ironclad.jpg?v=painted1",
    streetAsset: "/art/places/ironclad-street.jpg",
    accent: "iron",
    points: [
      {
        id: "ironclad-vault13",
        regionId: "ironclad",
        name: "Vault 13",
        kind: "facility",
        x: 20,
        y: 72,
        description: "Home. A sealed pre-collapse shelter on Ironclad's outskirts. TyroneBot lives here — the T-0880 that walked off Kane's shutdown list.",
        discovered: true,
        unlocked: true,
        danger: 1,
        action: "home",
      },
      {
        id: "ironclad-highway",
        regionId: "ironclad",
        name: "East Highway",
        kind: "landmark",
        x: 8,
        y: 58,
        description: "Three miles of cracked asphalt. Tyrone found you facedown here. No tracks. No caravan. The Hollow still does not explain it.",
        discovered: true,
        unlocked: true,
        danger: 2,
        action: "scout",
      },
      {
        id: "ironclad-gate",
        regionId: "ironclad",
        name: "The Iron Gate",
        kind: "settlement",
        x: 48,
        y: 55,
        description: "Checkpoint, last warm wall before the slag roads. Kane's surveyors already bought a table at the gatehouse.",
        discovered: true,
        unlocked: true,
        danger: 2,
        action: "scout",
      },
      {
        id: "ironclad-market",
        regionId: "ironclad",
        name: "Moon Squad Market",
        kind: "merchant",
        x: 42,
        y: 64,
        description: "Stalls under the Gate. Limited stock. Dawn reset. Special merchants sit when the Pack is hunting somewhere else. The black card pays. The vault drawer does not.",
        discovered: true,
        unlocked: true,
        danger: 1,
        merchantId: "moon-squad",
        action: "shop",
      },
      {
        id: "ironclad-tower",
        regionId: "ironclad",
        name: "Relay Tower Three",
        kind: "radio",
        x: 58,
        y: 22,
        description: "ICR 88's iron spine. Climb it, listen, and the Realm talks back — Kane frequencies, visiting stalls, sites the board has not named yet.",
        discovered: true,
        unlocked: true,
        danger: 2,
        action: "listen",
      },
      {
        id: "ironclad-halo",
        regionId: "ironclad",
        name: "Halo Yard",
        kind: "facility",
        x: 36,
        y: 40,
        description: "Old AEGIS paint on a drill square. They trained 2753 frames here before Veyra had a hangar. The outlines still scorch the concrete.",
        discovered: false,
        unlocked: true,
        danger: 3,
        action: "salvage",
      },
      {
        id: "ironclad-rail",
        regionId: "ironclad",
        name: "Rail Cut",
        kind: "landmark",
        x: 64,
        y: 70,
        description: "A trench of rail steel Kane wants for jump-stack hulls. Night crews still pull spikes when the tower light is off.",
        discovered: false,
        unlocked: true,
        danger: 3,
        action: "salvage",
      },
      {
        id: "ironclad-works",
        regionId: "ironclad",
        name: "Ironclad Works",
        kind: "facility",
        x: 66,
        y: 39,
        description: "A half-running foundry whose night shift never officially ended.",
        discovered: false,
        unlocked: true,
        danger: 3,
        action: "salvage",
      },
      {
        id: "ironclad-berm",
        regionId: "ironclad",
        name: "West Berm",
        kind: "ruin",
        x: 80,
        y: 48,
        description: "Earth and scrap piled against the slag wind. Good cover. Worse salvage. The Pack watches it from the hills.",
        discovered: false,
        unlocked: true,
        danger: 3,
        action: "scout",
      },
      {
        id: "ironclad-exchange",
        regionId: "ironclad",
        name: "The Exchange",
        kind: "ruin",
        x: 52,
        y: 46,
        description: "Vault 13 used to buy here. Shutters down. A stencil says the market moved under the Gate. Rats kept the ledger.",
        discovered: false,
        unlocked: true,
        danger: 2,
        action: "salvage",
      },
      {
        id: "ironclad-gravenor",
        regionId: "ironclad",
        name: "Ashen Pack Territory",
        kind: "boss",
        x: 29,
        y: 27,
        description: "The hills go quiet here. Gravenor notices trespass long before you notice him.",
        discovered: false,
        unlocked: false,
        danger: 4,
        missionKind: "boss",
        bossId: "gravenor",
        action: "boss",
      },
    ],
  },
  {
    id: "slagtown",
    name: "Slag Town",
    short: "Slag Town",
    continent: "Cinderlands",
    biome: "slag-wastes",
    description:
      "A furnace settlement spread across red waste and cooling slag fields. Pipes cross the streets overhead. Kane's buyers take anything that still burns hot enough to feed a jump stack.",
    danger: 3,
    marker: { lat: -12, lon: -62, altitude: 0.012 },
    mapAsset: "/map/regions/slagtown.jpg?v=painted1",
    streetAsset: "/art/places/slagtown-street.jpg",
    accent: "cinder",
    points: [
      {
        id: "slag-foundry-row",
        regionId: "slagtown",
        name: "Foundry Row",
        kind: "district",
        x: 50,
        y: 58,
        description: "Boilers, union halls, chop shops and ten thousand hot rivets.",
        discovered: true,
        unlocked: true,
        danger: 2,
        action: "scout",
      },
      {
        id: "slag-tithe",
        regionId: "slagtown",
        name: "Tithe Office",
        kind: "merchant",
        x: 38,
        y: 70,
        description: "Fuel tax in a brick box. They sell what the union no longer claims. Limited, ugly, useful.",
        discovered: true,
        unlocked: true,
        danger: 2,
        action: "shop",
        merchantId: "tithe",
      },
      {
        id: "slag-coke",
        regionId: "slagtown",
        name: "Coke Stacks",
        kind: "facility",
        x: 62,
        y: 46,
        description: "Black towers that still breathe. Salvage here costs lungs.",
        discovered: false,
        unlocked: true,
        danger: 3,
        action: "salvage",
      },
      {
        id: "slag-pipewalk",
        regionId: "slagtown",
        name: "Pipewalk",
        kind: "landmark",
        x: 28,
        y: 48,
        description: "A catwalk of steam lines over the slag. Ghost routes, if you do not fall.",
        discovered: false,
        unlocked: true,
        danger: 3,
        action: "scout",
      },
      {
        id: "slag-glass-yard",
        regionId: "slagtown",
        name: "The Glass Yard",
        kind: "ruin",
        x: 73,
        y: 34,
        description: "A blast crater vitrified into black glass and picked clean by scavengers.",
        discovered: false,
        unlocked: true,
        danger: 3,
        action: "salvage",
      },
      {
        id: "slag-valdris",
        regionId: "slagtown",
        name: "The Furnace Court",
        kind: "boss",
        x: 26,
        y: 24,
        description: "Valdris keeps the old debts in a courthouse built around a dead smelter.",
        discovered: false,
        unlocked: false,
        danger: 4,
        missionKind: "boss",
        bossId: "valdris",
        action: "boss",
      },
    ],
  },
  {
    id: "blackspire",
    name: "Blackspire",
    short: "Blackspire",
    continent: "Highspine",
    biome: "volcanic-highlands",
    description:
      "A black mountain range punched through by mines, lift cages and impossible survey lines. Hollow ore from the Deepworks is the resource Kane needs for intergalactic travel. She will not ask politely.",
    danger: 4,
    marker: { lat: 43, lon: 8, altitude: 0.014 },
    mapAsset: "/map/regions/blackspire.jpg?v=painted1",
    streetAsset: "/art/places/blackspire-street.jpg",
    accent: "obsidian",
    points: [
      {
        id: "blackspire-lift",
        regionId: "blackspire",
        name: "Grand Lift Nine",
        kind: "facility",
        x: 42,
        y: 68,
        description: "A freight elevator disappearing into cloud and stone in both directions.",
        discovered: true,
        unlocked: true,
        danger: 3,
        action: "scout",
      },
      {
        id: "blackspire-frost",
        regionId: "blackspire",
        name: "Frost Camp",
        kind: "settlement",
        x: 28,
        y: 54,
        description: "Tents pegged into ice above the cage line. They sell heat and lies about the Deepworks.",
        discovered: true,
        unlocked: true,
        danger: 3,
        action: "scout",
      },
      {
        id: "blackspire-weigh",
        regionId: "blackspire",
        name: "Ore Weigh",
        kind: "merchant",
        x: 54,
        y: 60,
        description: "A scale house that still stamps Kane's buyers. Off-books ore sits under the floor.",
        discovered: false,
        unlocked: true,
        danger: 3,
        action: "shop",
        merchantId: "weigh",
      },
      {
        id: "blackspire-cage",
        regionId: "blackspire",
        name: "Cageworks",
        kind: "facility",
        x: 36,
        y: 38,
        description: "Repair bays for lift cages that should have been condemned. Salvage if the chain holds.",
        discovered: false,
        unlocked: true,
        danger: 4,
        action: "salvage",
      },
      {
        id: "blackspire-deepworks",
        regionId: "blackspire",
        name: "The Deepworks",
        kind: "dungeon",
        x: 70,
        y: 51,
        description: "Ore tunnels that disagree with the mountain above them.",
        discovered: false,
        unlocked: true,
        danger: 4,
        action: "salvage",
      },
      {
        id: "blackspire-thessaly",
        regionId: "blackspire",
        name: "Cartographer's Crown",
        kind: "boss",
        x: 48,
        y: 18,
        description: "Thessaly Vane redraws the world from the summit and sometimes the world listens.",
        discovered: false,
        unlocked: false,
        danger: 5,
        missionKind: "boss",
        bossId: "thessaly",
        action: "boss",
      },
    ],
  },
  {
    id: "brasswater",
    name: "Brasswater",
    short: "Brasswater",
    continent: "Tidefold",
    biome: "metallic-wetlands",
    description:
      "A drowned industrial coast where brass towers rise from dark water and entire streets continue below the tide line. The Drowned Archive still holds pre-collapse jump tables. Kane's divers work at night.",
    danger: 3,
    marker: { lat: -29, lon: 48, altitude: 0.012 },
    mapAsset: "/map/regions/brasswater.jpg?v=painted1",
    streetAsset: "/art/places/brasswater-street.jpg",
    accent: "brass",
    points: [
      {
        id: "brasswater-docks",
        regionId: "brasswater",
        name: "Brasswater Docks",
        kind: "settlement",
        x: 34,
        y: 63,
        description: "Pontoon streets, steam launches and markets tied to whatever still floats.",
        discovered: true,
        unlocked: true,
        danger: 2,
        action: "scout",
      },
      {
        id: "brasswater-tide",
        regionId: "brasswater",
        name: "Tide Market",
        kind: "merchant",
        x: 24,
        y: 48,
        description: "Stalls lashed to the floodline. Stock resets with the tide. The black card still spends.",
        discovered: true,
        unlocked: true,
        danger: 2,
        action: "shop",
        merchantId: "tide",
      },
      {
        id: "brasswater-chapel",
        regionId: "brasswater",
        name: "Pontoon Chapel",
        kind: "landmark",
        x: 48,
        y: 72,
        description: "A bell that rings when the water is about to get worse. Listeners leave offerings. Salvagers leave with them.",
        discovered: false,
        unlocked: true,
        danger: 2,
        action: "scout",
      },
      {
        id: "brasswater-floodgate",
        regionId: "brasswater",
        name: "Floodgate Two",
        kind: "facility",
        x: 58,
        y: 58,
        description: "A gate that forgot which way is shut. Machinery, brine, and a chance at archive brass.",
        discovered: false,
        unlocked: true,
        danger: 3,
        action: "salvage",
      },
      {
        id: "brasswater-archive",
        regionId: "brasswater",
        name: "The Drowned Archive",
        kind: "landmark",
        x: 61,
        y: 46,
        description: "A library complex descending beneath black water one floor at a time.",
        discovered: false,
        unlocked: true,
        danger: 3,
        action: "salvage",
      },
      {
        id: "brasswater-sink",
        regionId: "brasswater",
        name: "The Sink",
        kind: "boss",
        x: 72,
        y: 76,
        description: "The water pulls downward here even when there is nowhere left to fall.",
        discovered: false,
        unlocked: false,
        danger: 5,
        missionKind: "boss",
        bossId: "sink",
        action: "boss",
      },
    ],
  },
  {
    id: "veyra",
    name: "Veyra City",
    short: "Veyra",
    continent: "Veyra",
    biome: "city",
    description:
      "Human city of AEGIS 2753 super suits — Halo-grade combat frames piloted by elite specialists. Dr. Vesper Kane built them as successors to the T-0880 robots after the shutdown order. Her classified mission is intergalactic travel. The Hollow Realm is the last resource map she does not yet own.",
    danger: 5,
    marker: { lat: 7, lon: 116, altitude: 0.016 },
    mapAsset: "/map/regions/veyra.jpg?v=modern2",
    streetAsset: "/art/places/veyra-street.jpg",
    accent: "signal",
    points: [
      {
        id: "veyra-rift-market",
        regionId: "veyra",
        name: "Rift Market",
        kind: "district",
        x: 28,
        y: 68,
        description: "Everything arrives eventually. Kane's quartermasters buy Hollow ore, jump-table fragments and T-0880 serial plates.",
        discovered: true,
        unlocked: true,
        danger: 3,
        action: "scout",
      },
      {
        id: "veyra-civic",
        regionId: "veyra",
        name: "Civic Exchange",
        kind: "merchant",
        x: 18,
        y: 54,
        description: "White counters. Grey stock. Citizen prisms and cleanroom stims if the plate is heavy enough.",
        discovered: true,
        unlocked: true,
        danger: 3,
        action: "shop",
        merchantId: "civic",
      },
      {
        id: "veyra-mast",
        regionId: "veyra",
        name: "Signal Mast",
        kind: "radio",
        x: 40,
        y: 30,
        description: "Kane's city-frequency. Listen if you want to know which 2753 is flying the ridge tonight.",
        discovered: false,
        unlocked: true,
        danger: 4,
        action: "listen",
      },
      {
        id: "veyra-hangar",
        regionId: "veyra",
        name: "AEGIS Hangar 2753",
        kind: "facility",
        x: 48,
        y: 52,
        description: "Human-piloted super suits on gantries. Halo-grade frames. The successors Kane built after she ordered the robots scrapped.",
        discovered: false,
        unlocked: true,
        danger: 4,
        missionKind: "raid",
        action: "salvage",
      },
      {
        id: "veyra-spire",
        regionId: "veyra",
        name: "Kane Spire",
        kind: "landmark",
        x: 62,
        y: 34,
        description: "Dr. Vesper Kane's classified offices. Intergalactic-travel math on one wall. A Hollow Realm resource map on the other.",
        discovered: false,
        unlocked: true,
        danger: 5,
        action: "scout",
      },
      {
        id: "veyra-yards",
        regionId: "veyra",
        name: "Suit Yards",
        kind: "district",
        x: 72,
        y: 58,
        description: "Training ground for AEGIS specialists. They move like the T-0880 line used to, only the pilots bleed.",
        discovered: false,
        unlocked: true,
        danger: 4,
        action: "scout",
      },
      {
        id: "veyra-warden",
        regionId: "veyra",
        name: "Warden's Boundary",
        kind: "boss",
        x: 78,
        y: 20,
        description: "The city ends here. An AEGIS Warden in a 2753 frame keeps Kane's door. Tyrone calls it the appointment he declined.",
        discovered: false,
        unlocked: false,
        danger: 5,
        missionKind: "boss",
        bossId: "warden",
        action: "boss",
      },
    ],
  },
];

export const REGION_BY_ID = Object.fromEntries(REGIONS.map((region) => [region.id, region])) as Record<
  RegionId,
  RegionDefinition
>;

export const LEGACY_REGION_MAP: Record<string, RegionId> = {
  forest: "ironclad",
  kingdom: "slagtown",
  caverns: "blackspire",
  library: "brasswater",
  edge: "veyra",
};

export function canonicalRegionId(id: string): RegionId | null {
  if (CANONICAL_REGION_IDS.includes(id as RegionId)) return id as RegionId;
  return LEGACY_REGION_MAP[id] ?? null;
}

export function regionById(id: RegionId): RegionDefinition {
  return REGION_BY_ID[id];
}
