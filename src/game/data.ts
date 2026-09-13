// Hollow Realm canonical data layer.
//
// The original monolithic catalog is preserved in data-legacy.ts so the live
// game keeps working while the overworld, regional maps and inventory shell are
// migrated in stages.
export * from "./data-legacy";

import type { RegionDefinition, RegionId } from "./types";

export const CANONICAL_REGION_IDS: RegionId[] = [
  "ironclad",
  "slagtown",
  "blackspire",
  "brasswater",
  "veyra",
];

export const ORIGINS = [
  "Ironclad",
  "Slag Town",
  "Blackspire",
  "Brasswater",
  "Veyra City",
];

export const REGIONS: RegionDefinition[] = [
  {
    id: "ironclad",
    name: "Ironclad",
    short: "Ironclad",
    biome: "industrial-frontier",
    description:
      "A hard northern frontier of iron ridges, rail cuts and fortress works. The first gate into the Hollow still pretends it controls what passes through.",
    danger: 3,
    marker: { lat: 34, lon: -118, altitude: 0.012 },
    mapAsset: "/map/regions/ironclad.jpg",
    accent: "iron",
    points: [
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
