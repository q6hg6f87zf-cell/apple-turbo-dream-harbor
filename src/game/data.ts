// Hollow Realm canonical data layer.
//
// The original monolithic catalog is preserved in data-legacy.ts so weapons,
// armor, classes, rooms, companions, crafting tables and every other existing
// system remain available while the world model is rebuilt underneath them.
export * from "./data-legacy";

import type {
  Bounty,
  LocationId,
  RegionDefinition,
  RegionId,
  Rarity,
} from "./types";
import {
  BOUNTIES as LEGACY_BOUNTIES,
  ENEMIES as LEGACY_ENEMIES,
  NPCS as LEGACY_NPCS,
  VILLAINS as LEGACY_VILLAINS,
} from "./data-legacy";
import type { VillainDef, WorldLoc } from "./data-legacy";

export const SAVE_VERSION = 6;

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

export const WORLD: WorldLoc[] = [
  {
    id: "hq",
    name: "SYNAPSE Compound",
    short: "HQ",
    x: 50,
    y: 52,
    danger: 1,
    desc: "Tyrone's desk, the black card and the only porch light worth trusting.",
    features: ["The Forge", "The Infirmary", "The Ledger", "The Bunkhouse"],
    connectedTo: [...CANONICAL_REGION_IDS],
    hollow: false,
    unlockDay: 1,
    bossId: "",
    bossAfter: 99,
  },
  {
    id: "ironclad",
    name: "Ironclad",
    short: "Ironclad",
    x: 18,
    y: 38,
    danger: 3,
    desc: REGIONS[0].description,
    features: ["Fortress works", "Slag-hound territory", "Rail frontier"],
    connectedTo: ["hq", "slagtown", "veyra"],
    hollow: false,
    unlockDay: 1,
    bossId: "gravenor",
    bossAfter: 3,
  },
  {
    id: "slagtown",
    name: "Slag Town",
    short: "Slag Town",
    x: 39,
    y: 67,
    danger: 3,
    desc: REGIONS[1].description,
    features: ["Foundry Row", "The Glass Yard", "Furnace Court"],
    connectedTo: ["hq", "ironclad", "blackspire", "brasswater"],
    hollow: false,
    unlockDay: 2,
    bossId: "valdris",
    bossAfter: 4,
  },
  {
    id: "blackspire",
    name: "Blackspire",
    short: "Blackspire",
    x: 54,
    y: 22,
    danger: 4,
    desc: REGIONS[2].description,
    features: ["Grand Lift Nine", "The Deepworks", "Cartographer's Crown"],
    connectedTo: ["hq", "slagtown", "brasswater"],
    hollow: true,
    unlockDay: 3,
    bossId: "thessaly",
    bossAfter: 4,
  },
  {
    id: "brasswater",
    name: "Brasswater",
    short: "Brasswater",
    x: 72,
    y: 70,
    danger: 3,
    desc: REGIONS[3].description,
    features: ["Floating docks", "Drowned Archive", "The Sink"],
    connectedTo: ["hq", "slagtown", "blackspire", "veyra"],
    hollow: true,
    unlockDay: 4,
    bossId: "sink",
    bossAfter: 4,
  },
  {
    id: "veyra",
    name: "Veyra City",
    short: "Veyra",
    x: 86,
    y: 31,
    danger: 5,
    desc: REGIONS[4].description,
    features: ["Rift Market", "The Null Line", "Warden's Boundary"],
    connectedTo: ["hq", "ironclad", "brasswater"],
    hollow: true,
    unlockDay: 6,
    bossId: "warden",
    bossAfter: 3,
  },
];

const LOCATION_REMAP: Record<string, RegionId> = {
  kingdom: "slagtown",
  caverns: "blackspire",
  library: "brasswater",
};

function remapLocation(id: LocationId): LocationId {
  return LOCATION_REMAP[id] ?? id;
}

export const VILLAINS: VillainDef[] = LEGACY_VILLAINS.map((villain) => {
  const loc = remapLocation(villain.loc);
  if (villain.id === "valdris") {
    return {
      ...villain,
      loc,
      arc: "Arc II — Slag Town",
      title: "Last Chancellor of the Furnace Court",
      tagline: "The old kingdom is gone. Its debts survived the fire.",
      lore: "Valdris moved his books into Slag Town when the old order burned. He rules from a courthouse wrapped around a dead smelter, collecting obligations nobody remembers agreeing to.",
      lootName: "Furnace Court Master Key",
    };
  }
  if (villain.id === "thessaly") {
    return {
      ...villain,
      loc,
      arc: "Arc III — Blackspire",
      lore: "Her maps are used by every faction. From Blackspire's summit she began drawing tunnels and ridges that did not exist yet. By morning, they did.",
      lootName: "Blackspire Survey Plate",
    };
  }
  if (villain.id === "sink") {
    return {
      ...villain,
      loc,
      arc: "Arc IV — Brasswater",
      tagline: "It did not drown Brasswater. Brasswater was built around it.",
      lore: "The drowned archive was constructed above something that made knowledge easier to reach. Nobody kept a readable copy of what the bargain cost.",
    };
  }
  return { ...villain, loc };
});

export const NPCS = LEGACY_NPCS.map((npc) => {
  const loc = remapLocation(npc.loc as LocationId);
  if (npc.name === "Quartermaster Rudge") {
    return { ...npc, loc, title: "Slag Town Provisioner", quote: "Fuel, food, filters. Nothing here runs on good intentions." };
  }
  if (npc.name === "Nylah the Dredge") {
    return { ...npc, loc, title: "Brasswater Dredger", quote: "The water keeps the best secrets. I charge for bringing them back up." };
  }
  if (npc.name === "Krell the Foreman") {
    return { ...npc, loc, title: "Blackspire Deepworks Smith" };
  }
  return { ...npc, loc };
});

export const BOUNTIES: Bounty[] = LEGACY_BOUNTIES.map((bounty) => ({
  ...bounty,
  location: remapLocation(bounty.location),
}));

export const ENEMIES = {
  hq: LEGACY_ENEMIES.hq,
  ironclad: LEGACY_ENEMIES.ironclad,
  slagtown: LEGACY_ENEMIES.kingdom,
  blackspire: LEGACY_ENEMIES.caverns,
  brasswater: LEGACY_ENEMIES.library,
  veyra: LEGACY_ENEMIES.veyra,
  // Migration aliases. Old in-progress saves may still point here until save.ts
  // rewrites them on load.
  kingdom: LEGACY_ENEMIES.kingdom,
  caverns: LEGACY_ENEMIES.caverns,
  library: LEGACY_ENEMIES.library,
} satisfies Record<LocationId, { name: string; hp: number; atk: number; def: number; dc: number; flavor: string }[]>;

export function locById(id: LocationId) {
  const canonical = id === "hq" ? "hq" : canonicalRegionId(id) ?? "ironclad";
  return WORLD.find((loc) => loc.id === canonical) ?? WORLD[1];
}

export function regionById(id: RegionId) {
  return REGION_BY_ID[id];
}

export function villainById(id: string) {
  return VILLAINS.find((villain) => villain.id === id);
}

// Typed helper for merchant stock until the inventory/catalog refactor lands.
export type CanonicalMerchant = {
  name: string;
  title: string;
  loc: LocationId;
  quote: string;
  stock: { name: string; price: number; rarity: Rarity }[];
};
