import { canonicalRegionId, locById } from "./data";
import { isVacant } from "./squad";
import type {
  GameState,
  LocationId,
  MissionKind,
  MissionState,
  QuarterId,
  RegionId,
  Rarity,
  RoomId,
} from "./types";

export const ROOM_CAPS: Record<RoomId, number[]> = {
  vault: [0, 18000, 60000, 175000, 480000, 1200000],
  barracks: [7000, 22000, 70000, 210000, 580000, 1450000],
  forge: [6500, 21000, 68000, 200000, 560000, 1380000],
  infirmary: [8500, 27000, 85000, 245000, 650000, 1550000],
  watchtower: [7500, 24000, 76000, 225000, 620000, 1500000],
  ledger: [8000, 26000, 82000, 235000, 640000, 1520000],
};

export const QUARTER_CAPS: Record<QuarterId, number[]> = {
  bunk: [4200, 13500, 42000, 125000, 350000, 900000],
  lockbox: [5000, 16000, 50000, 145000, 390000, 980000],
  hearth: [5500, 17500, 54000, 155000, 420000, 1050000],
};

const LEVEL_REGION: RegionId[] = ["ironclad", "ironclad", "slagtown", "blackspire", "brasswater", "veyra"];
const LEVEL_ORE = [0, 4, 12, 30, 65, 140];
const LEVEL_FAVOR = [0, 2, 6, 14, 28, 50];
const LEVEL_MATERIALS = [2, 4, 7, 11, 16, 24];
const LEVEL_BOSS_CLEARS = [0, 0, 1, 2, 3, 4];
const LEVEL_RIDERS = [1, 1, 2, 2, 3, 4];
const LEVEL_DAY = [1, 2, 4, 7, 11, 16];

export type UpgradeQuote = {
  nextLevel: number;
  caps: number;
  ore: number;
  moonFavor: number;
  materialRegion: RegionId;
  materials: number;
  bossClears: number;
  riders: number;
  minDay: number;
};

export function bossClearCount(state: GameState): number {
  return Object.values(state.locations).filter((p) => p.bossDefeated).length;
}

export function activeRiders(state: GameState) {
  return (state.squad ?? []).filter((m) => !isVacant(m));
}

export function vaultMaterialCount(state: GameState, region: RegionId): number {
  return state.vault.filter((item) => item.kind === "material" && item.sourceRegion === region).length;
}

function quoteForLevel(state: GameState, nextLevel: number, caps: number): UpgradeQuote {
  const i = Math.max(0, Math.min(LEVEL_REGION.length - 1, nextLevel - 1));
  return {
    nextLevel,
    caps,
    ore: LEVEL_ORE[i]!,
    moonFavor: LEVEL_FAVOR[i]!,
    materialRegion: LEVEL_REGION[i]!,
    materials: LEVEL_MATERIALS[i]!,
    bossClears: LEVEL_BOSS_CLEARS[i]!,
    riders: LEVEL_RIDERS[i]!,
    minDay: LEVEL_DAY[i]!,
  };
}

export function roomUpgradeQuote(state: GameState, room: RoomId): UpgradeQuote | null {
  const current = state.rooms[room];
  const costs = ROOM_CAPS[room];
  if (current >= costs.length) return null;
  const nextLevel = current + 1;
  const caps = costs[current] ?? costs.at(-1)!;
  return quoteForLevel(state, nextLevel, caps);
}

export function quarterUpgradeQuote(state: GameState, q: QuarterId): UpgradeQuote | null {
  const current = state.quarters[q];
  const costs = QUARTER_CAPS[q];
  if (current >= costs.length) return null;
  const nextLevel = current + 1;
  const caps = costs[current] ?? costs.at(-1)!;
  const quote = quoteForLevel(state, nextLevel, caps);
  return {
    ...quote,
    ore: Math.ceil(quote.ore * 0.65),
    moonFavor: Math.ceil(quote.moonFavor * 0.6),
    materials: Math.ceil(quote.materials * 0.7),
    bossClears: Math.max(0, quote.bossClears - 1),
    riders: Math.max(1, quote.riders - 1),
  };
}

export function upgradeBlockReason(state: GameState, q: UpgradeQuote): string | null {
  if (state.day < q.minDay) return `Vault protocol: tier ${q.nextLevel} opens on day ${q.minDay}.`;
  if (state.coins < q.caps) return `Need ${q.caps.toLocaleString()} bottle caps.`;
  if (state.ore < q.ore) return `Need ${q.ore} Hollow Ore.`;
  if (state.moonFavor < q.moonFavor) return `Need ${q.moonFavor} Moon Favor.`;
  const mats = vaultMaterialCount(state, q.materialRegion);
  if (mats < q.materials) return `Need ${q.materials} ${q.materialRegion} material pieces in Vault 13 (${mats}/${q.materials}).`;
  const clears = bossClearCount(state);
  if (clears < q.bossClears) return `Need ${q.bossClears} boss clear${q.bossClears === 1 ? "" : "s"} (${clears}/${q.bossClears}).`;
  const riders = activeRiders(state).length;
  if (riders < q.riders) return `Need ${q.riders} registered Moon Squad riders (${riders}/${q.riders}).`;
  return null;
}

export function consumeUpgradeRequirements(state: GameState, q: UpgradeQuote): void {
  state.ore = Math.max(0, state.ore - q.ore);
  state.moonFavor = Math.max(0, state.moonFavor - q.moonFavor);
  let remaining = q.materials;
  state.vault = state.vault.filter((item) => {
    if (remaining <= 0) return true;
    if (item.kind === "material" && item.sourceRegion === q.materialRegion) {
      remaining -= 1;
      return false;
    }
    return true;
  });
}

export type RaidProfile = {
  region: RegionId;
  minRiders: number;
  minRiderXp: number;
  minParty: number;
  minClasses: number;
  minIntel: number;
  minReadiness: number;
  vaultReward: number;
  cardReward: number;
  oreReward: number;
  favorReward: number;
};

export const RAID_PROFILES: Record<RegionId, RaidProfile> = {
  ironclad: { region: "ironclad", minRiders: 2, minRiderXp: 8, minParty: 2, minClasses: 2, minIntel: 5, minReadiness: 430, vaultReward: 12000, cardReward: 1500, oreReward: 8, favorReward: 4 },
  slagtown: { region: "slagtown", minRiders: 2, minRiderXp: 20, minParty: 3, minClasses: 2, minIntel: 7, minReadiness: 520, vaultReward: 28000, cardReward: 3000, oreReward: 15, favorReward: 7 },
  blackspire: { region: "blackspire", minRiders: 3, minRiderXp: 36, minParty: 3, minClasses: 3, minIntel: 9, minReadiness: 620, vaultReward: 65000, cardReward: 7000, oreReward: 28, favorReward: 12 },
  brasswater: { region: "brasswater", minRiders: 3, minRiderXp: 56, minParty: 3, minClasses: 3, minIntel: 11, minReadiness: 710, vaultReward: 140000, cardReward: 15000, oreReward: 50, favorReward: 20 },
  veyra: { region: "veyra", minRiders: 4, minRiderXp: 80, minParty: 3, minClasses: 3, minIntel: 14, minReadiness: 805, vaultReward: 350000, cardReward: 35000, oreReward: 90, favorReward: 35 },
};

export function raidProfileForLocation(loc: LocationId): RaidProfile | null {
  const region = canonicalRegionId(loc);
  return region ? RAID_PROFILES[region] : null;
}

export function raidReadyRiders(state: GameState, profile: RaidProfile) {
  return activeRiders(state).filter((m) => m.xp >= profile.minRiderXp);
}

const RARITY_POWER: Record<Rarity, number> = {
  Common: 4,
  Uncommon: 8,
  Rare: 14,
  Legendary: 22,
  Mythic: 32,
  Cursed: 18,
};

export function partyReadiness(state: GameState, loc: LocationId, partyIds: string[]): number {
  const profile = raidProfileForLocation(loc);
  if (!profile) return 0;
  const party = partyIds.map((id) => state.operatives.find((o) => o.id === id)).filter(Boolean);
  if (!party.length) return 0;

  const uniqueClasses = new Set(party.map((o) => o!.cls)).size;
  const hp = party.reduce((sum, o) => sum + o!.hp / Math.max(1, o!.maxHp), 0) / party.length;
  const gear = party.reduce((sum, o) => {
    const equipped = o!.inventory.filter((i) => i.equipped);
    return sum + equipped.reduce((n, i) => n + RARITY_POWER[i.rarity] + (i.condition === "Pristine" ? 5 : i.condition === "Worn" ? 2 : i.condition === "Damaged" ? -4 : -12), 0);
  }, 0);
  const experience = party.reduce((sum, o) => sum + Math.min(80, o!.raids * 5 + o!.battles * 3), 0);
  const progress = state.locations[loc];
  const riderScore = Math.min(180, raidReadyRiders(state, profile).length * 55);
  const classScore = Math.min(140, uniqueClasses * 45);
  const partyScore = Math.min(120, party.length * 40);
  const hpScore = Math.round(hp * 150);
  const intelScore = Math.min(140, (progress?.intel ?? 0) * 10);
  const gearScore = Math.min(150, gear * 1.8);
  const expScore = Math.min(120, experience);
  return Math.max(0, Math.min(1000, Math.round(riderScore + classScore + partyScore + hpScore + intelScore + gearScore + expScore - 200)));
}

export function bossBlockReason(state: GameState, loc: LocationId, partyIds: string[]): string | null {
  const profile = raidProfileForLocation(loc);
  if (!profile) return "No raid profile for this region.";
  const ready = raidReadyRiders(state, profile);
  if (ready.length < profile.minRiders) return `Raid requires ${profile.minRiders} riders with ${profile.minRiderXp}+ contribution XP (${ready.length}/${profile.minRiders}).`;
  if (partyIds.length < profile.minParty) return `Raid requires ${profile.minParty} field operatives.`;
  const classes = new Set(partyIds.map((id) => state.operatives.find((o) => o.id === id)?.cls).filter(Boolean));
  if (classes.size < profile.minClasses) return `Raid requires ${profile.minClasses} different Hollow Realm classes.`;
  const intel = state.locations[loc]?.intel ?? 0;
  if (intel < profile.minIntel) return `Raid intel ${intel}/${profile.minIntel}. Scout the region first.`;
  const readiness = partyReadiness(state, loc, partyIds);
  if (readiness < profile.minReadiness) return `Raid Matrix ${readiness}/${profile.minReadiness}. Improve gear, health, experience, intel or team participation.`;
  return null;
}

export type MatrixGrade = "S+" | "S" | "A" | "B" | "C" | "D";
export type MissionMatrix = {
  score: number;
  grade: MatrixGrade;
  multiplier: number;
  execution: number;
  survival: number;
  teamwork: number;
  risk: number;
  preparation: number;
  fortune: number;
};

function gradeFor(score: number): { grade: MatrixGrade; multiplier: number } {
  if (score >= 920) return { grade: "S+", multiplier: 2 };
  if (score >= 850) return { grade: "S", multiplier: 1.65 };
  if (score >= 760) return { grade: "A", multiplier: 1.35 };
  if (score >= 650) return { grade: "B", multiplier: 1 };
  if (score >= 520) return { grade: "C", multiplier: 0.82 };
  return { grade: "D", multiplier: 0.65 };
}

const KIND_RISK: Record<MissionKind, number> = {
  scout: 35,
  forage: 48,
  trade: 42,
  raid: 72,
  bounty: 82,
  boss: 100,
};

export function scoreMission(before: GameState, after: GameState, mission: MissionState): MissionMatrix {
  const partyBefore = mission.partyIds.map((id) => before.operatives.find((o) => o.id === id)).filter(Boolean);
  const partyAfter = mission.partyIds.map((id) => after.operatives.find((o) => o.id === id)).filter(Boolean);
  const text = mission.narrative.join(" ").toLowerCase();
  const strong = (text.match(/inevitable|critical|strong|clean/g) ?? []).length;
  const misses = (text.match(/misses the beat|fumble|downed|fails|nothing takes/g) ?? []).length;
  const execution = Math.max(0, Math.min(100, 62 + strong * 10 - misses * 15));
  const survival = partyAfter.length
    ? Math.round((partyAfter.reduce((n, o) => n + Math.max(0, o!.hp) / Math.max(1, o!.maxHp), 0) / partyAfter.length) * 100)
    : 0;
  const uniqueClasses = new Set(partyBefore.map((o) => o!.cls)).size;
  const teamwork = Math.min(100, partyBefore.length * 20 + uniqueClasses * 16 + Math.min(28, activeRiders(after).length * 7));
  const danger = locById(mission.locationId).danger;
  const risk = Math.min(100, Math.round(KIND_RISK[mission.kind] * 0.65 + danger * 9));
  const intel = before.locations[mission.locationId]?.intel ?? 0;
  const roomTech = before.rooms.watchtower + before.rooms.forge + before.rooms.infirmary;
  const preparation = Math.min(100, 28 + intel * 5 + roomTech * 4);
  const fortune = Math.min(100, 25 + mission.loot.length * 16 + Math.min(35, before.moonFavor));

  // Weighted 1000-point S.Y.N.A.P.S.E matrix.
  const score = Math.round(
    execution * 3.0 +
      survival * 2.1 +
      teamwork * 1.8 +
      risk * 1.1 +
      preparation * 1.2 +
      fortune * 0.8,
  );
  const normalized = Math.max(0, Math.min(1000, score));
  const g = gradeFor(normalized);
  return {
    score: normalized,
    grade: g.grade,
    multiplier: g.multiplier,
    execution,
    survival,
    teamwork,
    risk,
    preparation,
    fortune,
  };
}
