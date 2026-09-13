import type { MissionKind, QuarterId, RegionId, RoomId } from "./types";

export const AUTHORITY_REGION_ORDER: RegionId[] = [
  "ironclad",
  "slagtown",
  "blackspire",
  "brasswater",
  "veyra",
];

export const AUTHORITY_BOSS_GATES: Record<
  RegionId,
  {
    minRiders: number;
    minRiderXp: number;
    minIntel: number;
    minParty: number;
    minClasses: number;
    minResidentLevel: number;
  }
> = {
  ironclad: { minRiders: 2, minRiderXp: 8, minIntel: 5, minParty: 2, minClasses: 2, minResidentLevel: 2 },
  slagtown: { minRiders: 2, minRiderXp: 20, minIntel: 7, minParty: 3, minClasses: 2, minResidentLevel: 4 },
  blackspire: { minRiders: 3, minRiderXp: 36, minIntel: 9, minParty: 3, minClasses: 3, minResidentLevel: 6 },
  brasswater: { minRiders: 3, minRiderXp: 56, minIntel: 11, minParty: 3, minClasses: 3, minResidentLevel: 8 },
  veyra: { minRiders: 4, minRiderXp: 80, minIntel: 14, minParty: 3, minClasses: 3, minResidentLevel: 10 },
};

export const AUTHORITY_BOSS_REWARDS: Record<
  RegionId,
  { vaultCaps: number; cardCaps: number; ore: number; favor: number; commandRank: number }
> = {
  ironclad: { vaultCaps: 12_000, cardCaps: 1_500, ore: 20, favor: 6, commandRank: 2 },
  slagtown: { vaultCaps: 28_000, cardCaps: 3_000, ore: 40, favor: 12, commandRank: 4 },
  blackspire: { vaultCaps: 65_000, cardCaps: 7_000, ore: 75, favor: 22, commandRank: 6 },
  brasswater: { vaultCaps: 140_000, cardCaps: 15_000, ore: 130, favor: 38, commandRank: 8 },
  veyra: { vaultCaps: 350_000, cardCaps: 35_000, ore: 220, favor: 65, commandRank: 10 },
};

const BASE_MISSION_CAPS: Record<Exclude<MissionKind, "boss">, number> = {
  scout: 180,
  forage: 260,
  trade: 240,
  raid: 480,
  bounty: 760,
};

const REGION_MULTIPLIER: Record<RegionId, number> = {
  ironclad: 1,
  slagtown: 1.25,
  blackspire: 1.6,
  brasswater: 2.05,
  veyra: 2.7,
};

const RIDER_XP: Record<MissionKind, number> = {
  scout: 3,
  forage: 4,
  trade: 4,
  raid: 7,
  bounty: 10,
  boss: 22,
};

export const AUTHORITY_RESIDENT_XP: Record<MissionKind, number> = {
  scout: 18,
  forage: 24,
  trade: 20,
  raid: 42,
  bounty: 58,
  boss: 125,
};

const MIN_SETTLE_MS: Record<MissionKind, number> = {
  scout: 750,
  forage: 900,
  trade: 750,
  raid: 1_200,
  bounty: 1_500,
  boss: 2_500,
};

export type AuthorityMissionReward = {
  vaultCaps: number;
  cardCaps: number;
  ore: number;
  favor: number;
  riderXp: number;
  residentXp: number;
  intel: number;
  missionCount: number;
  materialChance: number;
};

export function regionUnlocked(
  region: RegionId,
  bossClears: Partial<Record<RegionId, boolean>>,
): boolean {
  if (region === "ironclad") return true;
  if (region === "slagtown") return !!bossClears.ironclad;
  if (region === "blackspire") return !!bossClears.slagtown;
  if (region === "brasswater") return !!bossClears.blackspire;
  return !!bossClears.brasswater;
}

export function missionSettleDelayMs(kind: MissionKind): number {
  return MIN_SETTLE_MS[kind];
}

export function authorityMissionReward(
  region: RegionId,
  kind: Exclude<MissionKind, "boss">,
): AuthorityMissionReward {
  const mult = REGION_MULTIPLIER[region];
  const vaultCaps = Math.round(BASE_MISSION_CAPS[kind] * mult);
  const cardCaps = Math.max(15, Math.round(vaultCaps * 0.18));
  const ore = kind === "forage" ? Math.max(1, Math.floor(mult)) : kind === "raid" ? Math.max(0, Math.floor(mult - 0.5)) : 0;
  const favor = 1;
  const intel = kind === "scout" ? 2 : 1;
  const materialChance = kind === "forage" ? 0.68 : kind === "raid" ? 0.5 : kind === "bounty" ? 0.32 : kind === "scout" ? 0.2 : 0.12;
  return {
    vaultCaps,
    cardCaps,
    ore,
    favor,
    riderXp: RIDER_XP[kind],
    residentXp: AUTHORITY_RESIDENT_XP[kind],
    intel,
    missionCount: 1,
    materialChance,
  };
}

export function authorityBossReward(region: RegionId) {
  const boss = AUTHORITY_BOSS_REWARDS[region];
  return {
    vaultCaps: boss.vaultCaps,
    cardCaps: boss.cardCaps,
    ore: boss.ore,
    favor: boss.favor,
    riderXp: RIDER_XP.boss,
    residentXp: AUTHORITY_RESIDENT_XP.boss,
    intel: 1,
    missionCount: 1,
    materialChance: 1,
    commandRank: boss.commandRank,
  };
}

export function normalizePerformanceScore(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 500;
  return Math.max(0, Math.min(1000, Math.round(n)));
}

// Resident level is derived from total authoritative XP. The client may cache
// the display level, but it cannot submit a level value to satisfy raid/Vault
// gates. One curve therefore serves gameplay, persistence and server checks.
export function residentXpRequired(level: number) {
  return Math.round(80 + Math.pow(Math.max(1, level), 1.32) * 34);
}

export function authorityResidentLevel(totalXp: number) {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  while (level < 99) {
    const needed = residentXpRequired(level);
    if (remaining < needed) break;
    remaining -= needed;
    level += 1;
  }
  return { level, xp: remaining, xpToNext: residentXpRequired(level) };
}

// These are the canonical long-campaign construction gates. Higher tiers are
// intentionally achievement-gated as well as resource-gated: spending caps or
// finding ore cannot substitute for campaign age, bosses, riders or training.
const UPGRADE_REGION: RegionId[] = ["ironclad", "ironclad", "slagtown", "blackspire", "brasswater", "veyra"];
const UPGRADE_ORE = [0, 4, 12, 30, 65, 140];
const UPGRADE_FAVOR = [0, 2, 6, 14, 28, 50];
const UPGRADE_MATERIALS = [2, 4, 7, 11, 16, 24];
const UPGRADE_BOSSES = [0, 0, 1, 2, 3, 4];
const UPGRADE_RIDERS = [1, 1, 2, 2, 3, 4];
const UPGRADE_DAY = [1, 7, 21, 45, 85, 140];
const UPGRADE_COMMAND = [1, 2, 4, 6, 8, 10];
const UPGRADE_RESIDENT_LEVEL = [1, 2, 4, 6, 8, 10];
const UPGRADE_RESIDENT_COUNT = [0, 1, 1, 2, 2, 3];

export const AUTHORITY_ROOM_CAPS: Record<RoomId, number[]> = {
  vault: [0, 18_000, 60_000, 175_000, 480_000, 900_000],
  barracks: [7_000, 22_000, 70_000, 210_000, 580_000, 1_050_000],
  forge: [6_500, 21_000, 68_000, 200_000, 560_000, 980_000],
  infirmary: [8_500, 27_000, 85_000, 245_000, 650_000, 1_100_000],
  watchtower: [7_500, 24_000, 76_000, 225_000, 620_000, 1_050_000],
  ledger: [8_000, 26_000, 82_000, 235_000, 640_000, 1_060_000],
};

export const AUTHORITY_QUARTER_CAPS: Record<QuarterId, number[]> = {
  bunk: [4_200, 13_500, 42_000, 125_000, 350_000, 600_000],
  lockbox: [5_000, 16_000, 50_000, 145_000, 390_000, 650_000],
  hearth: [5_500, 17_500, 54_000, 155_000, 420_000, 700_000],
};

export type AuthorityUpgradeQuote = {
  nextLevel: number;
  caps: number;
  ore: number;
  favor: number;
  materialRegion: RegionId;
  materials: number;
  bossClears: number;
  riders: number;
  minDay: number;
  commandRank: number;
  residentLevel: number;
  residentCount: number;
};

function upgradeQuote(nextLevel: number, caps: number): AuthorityUpgradeQuote {
  const i = Math.max(0, Math.min(5, nextLevel - 1));
  return {
    nextLevel,
    caps,
    ore: UPGRADE_ORE[i]!,
    favor: UPGRADE_FAVOR[i]!,
    materialRegion: UPGRADE_REGION[i]!,
    materials: UPGRADE_MATERIALS[i]!,
    bossClears: UPGRADE_BOSSES[i]!,
    riders: UPGRADE_RIDERS[i]!,
    minDay: UPGRADE_DAY[i]!,
    commandRank: UPGRADE_COMMAND[i]!,
    residentLevel: UPGRADE_RESIDENT_LEVEL[i]!,
    residentCount: UPGRADE_RESIDENT_COUNT[i]!,
  };
}

export function authorityRoomUpgradeQuote(room: RoomId, currentLevel: number) {
  const costs = AUTHORITY_ROOM_CAPS[room];
  if (currentLevel >= costs.length) return null;
  return upgradeQuote(currentLevel + 1, costs[currentLevel] ?? costs.at(-1)!);
}

export function authorityQuarterUpgradeQuote(quarter: QuarterId, currentLevel: number) {
  const costs = AUTHORITY_QUARTER_CAPS[quarter];
  if (currentLevel >= costs.length) return null;
  const q = upgradeQuote(currentLevel + 1, costs[currentLevel] ?? costs.at(-1)!);
  return {
    ...q,
    ore: Math.ceil(q.ore * 0.65),
    favor: Math.ceil(q.favor * 0.6),
    materials: Math.ceil(q.materials * 0.7),
    bossClears: Math.max(0, q.bossClears - 1),
    riders: Math.max(1, q.riders - 1),
  };
}
