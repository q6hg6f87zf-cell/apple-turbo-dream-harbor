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
    desc: "Vault 13's ration counter, trade desk, bounty board and cap ledger. If it enters the vault, somebody signs for it.",
    tiers: [
      { cost: 1600, bonus: "Bargain stock delivered each dawn." },
      { cost: 4800, bonus: "Essential stock. Better exchange rates." },
      { cost: 10000, bonus: "Artifact chance. 15% Quartermaster discount." },
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
      ],
    };
  }
  if (loc.id === "ironclad") {
    return {
      ...loc,
      desc: "Ironclad is the first hard settlement beyond Vault 13: forged walls, rail cuts, slag lanterns and a checkpoint that pretends the wasteland stops at the gate.",
    };
  }
  return loc;
});

export const REGIONS: RegionDefinition[] = [
  {
    id: "ironclad",
    name: "Ironclad",
    short: "Ironclad",
    biome: "industrial-frontier",
    description:
      "A hard northern frontier of iron ridges, rail cuts and fortress works. Vault 13 is buried into the ridgeline beyond the outer rail, close enough to trade with Ironclad and far enough away to survive its problems.",
    danger: 3,
    marker: { lat: 34, lon: -118, altitude: 0.012 },
    mapAsset: "/map/regions/ironclad.jpg",
    accent: "iron",
    points: [
      {
        id: "ironclad-vault13",
        regionId: "ironclad",
        name: "Vault 13",
        kind: "facility",
        x: 20,
        y: 72,
        description:
          "Home. A sealed pre-collapse shelter on Ironclad's outskirts where TyroneBot and the residents of the Hollow Realm live between expeditions.",
        discovered: true,
        unlocked: true,
        danger: 1,
      },
      {
        id: "ironclad-gate",
        regionId: "ironclad",
        name: "The Iron Gate",
        kind: "settlement",
        x: 48,
        y: 55,
        description: "Checkpoint, market and last warm wall before the slag roads.",
        discovered: true,
        unlocked: true,
        danger: 2,
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
      },
    ],
  },
  {
    id: "slagtown",
    name: "Slag Town",
    short: "Slag Town",
    biome: "slag-wastes",
    description:
      "A furnace settlement spread across red waste and cooling slag fields. Pipes cross the streets overhead and every district owes somebody fuel.",
    danger: 3,
    marker: { lat: -12, lon: -62, altitude: 0.012 },
    mapAsset: "/map/regions/slagtown.jpg",
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
      },
    ],
  },
  {
    id: "blackspire",
    name: "Blackspire",
    short: "Blackspire",
    biome: "volcanic-highlands",
    description:
      "A black mountain range punched through by mines, lift cages and impossible survey lines. The highest spire is visible from almost anywhere on the planet.",
    danger: 4,
    marker: { lat: 43, lon: 8, altitude: 0.014 },
    mapAsset: "/map/regions/blackspire.jpg",
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
      },
    ],
  },
  {
    id: "brasswater",
    name: "Brasswater",
    short: "Brasswater",
    biome: "metallic-wetlands",
    description:
      "A drowned industrial coast where brass towers rise from dark water and entire streets continue below the tide line.",
    danger: 3,
    marker: { lat: -29, lon: 48, altitude: 0.012 },
    mapAsset: "/map/regions/brasswater.jpg",
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
      },
    ],
  },
  {
    id: "veyra",
    name: "Veyra City",
    short: "Veyra",
    biome: "city",
    description:
      "The last great city on the seam. Wet stone, brass signs, elevated rails and a skyline built around a boundary nobody fully understands.",
    danger: 5,
    marker: { lat: 7, lon: 116, altitude: 0.016 },
    mapAsset: "/map/regions/veyra.jpg",
    accent: "signal",
    points: [
      {
        id: "veyra-rift-market",
        regionId: "veyra",
        name: "Rift Market",
        kind: "district",
        x: 41,
        y: 62,
        description: "Everything arrives eventually. Not everything should be purchased.",
        discovered: true,
        unlocked: true,
        danger: 3,
      },
      {
        id: "veyra-null-line",
        regionId: "veyra",
        name: "The Null Line",
        kind: "landmark",
        x: 65,
        y: 37,
        description: "Streetlights stop casting shadows three blocks before the boundary.",
        discovered: false,
        unlocked: true,
        danger: 5,
      },
      {
        id: "veyra-warden",
        regionId: "veyra",
        name: "Warden's Boundary",
        kind: "boss",
        x: 78,
        y: 20,
        description: "The city ends here. The Null Warden decides whether anything else does.",
        discovered: false,
        unlocked: false,
        danger: 5,
        missionKind: "boss",
        bossId: "warden",
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
