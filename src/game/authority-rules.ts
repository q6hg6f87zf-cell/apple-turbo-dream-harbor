import type { MissionKind, RegionId } from "./types";

export const AUTHORITY_REGION_ORDER: RegionId[] = [
  "ironclad",
  "slagtown",
  "blackspire",
  "brasswater",
  "veyra",
];

export const AUTHORITY_BOSS_GATES: Record<
  RegionId,
  { minRiders: number; minRiderXp: number; minIntel: number }
> = {
  ironclad: { minRiders: 2, minRiderXp: 8, minIntel: 5 },
  slagtown: { minRiders: 2, minRiderXp: 20, minIntel: 7 },
  blackspire: { minRiders: 3, minRiderXp: 36, minIntel: 9 },
  brasswater: { minRiders: 3, minRiderXp: 56, minIntel: 11 },
  veyra: { minRiders: 4, minRiderXp: 80, minIntel: 14 },
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
