import {
  bossBlockReason,
  consumeUpgradeRequirements,
  RAID_PROFILES,
  raidProfileForLocation,
  roomUpgradeQuote,
  scoreMission,
  upgradeBlockReason,
  quarterUpgradeQuote,
} from "@/game/campaign-balance";
import { canonicalRegionId, regionById } from "@/game/data";
import { HOLLOW_CATALOG, type CatalogItem } from "@/game/hollow-catalog";
import { isVacant } from "@/game/squad";
import { useGame } from "@/game/store";
import type { GameState, Item, LocationId, MissionKind, Rarity, RegionId } from "@/game/types";
import { useEffect } from "react";

const PAYOUT_TICKS = 43; // 43 × the legacy 1.4s heartbeat ≈ one economy payout/minute.

const KIND_DRAWS: Record<MissionKind, number> = {
  scout: 0,
  forage: 1,
  trade: 0,
  raid: 1,
  bounty: 2,
  boss: 3,
};

const GRADE_BONUS = { "S+": 2, S: 1, A: 1, B: 0, C: 0, D: 0 } as const;
const RARITY_RANK: Record<Rarity, number> = { Common: 0, Uncommon: 1, Rare: 2, Legendary: 3, Mythic: 4, Cursed: 3 };

function cloneForMutation(state: GameState): GameState {
  return {
    ...state,
    rooms: { ...state.rooms },
    quarters: { ...state.quarters },
    locations: Object.fromEntries(Object.entries(state.locations).map(([k, v]) => [k, { ...v }])) as GameState["locations"],
    vault: [...state.vault],
    operatives: state.operatives.map((o) => ({ ...o, inventory: [...o.inventory] })),
    squad: state.squad.map((m) => ({ ...m })),
    log: [...state.log],
  };
}

function mutateState(fn: (state: GameState) => void) {
  useGame.setState((store) => {
    const s = cloneForMutation(store.s);
    fn(s);
    return { s };
  });
}

function pushLog(state: GameState, who: string, what: string) {
  state.log = [
    {
      id: `matrix-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      day: state.day,
      kind: "loot",
      who,
      what,
    },
    ...state.log,
  ].slice(0, 80);
}

function ownedNames(state: GameState) {
  return new Set([
    ...state.vault.map((i) => i.name),
    ...state.operatives.flatMap((o) => o.inventory.map((i) => i.name)),
  ]);
}

function rarityFromQuality(quality: number): Rarity {
  if (quality >= 126) return "Mythic";
  if (quality >= 108) return "Legendary";
  if (quality >= 88) return "Rare";
  if (quality >= 64) return "Uncommon";
  return "Common";
}

function recentDrought(state: GameState): number {
  let n = 0;
  for (const row of state.log) {
    if (row.what.includes("MATRIX TREASURE")) break;
    if (row.who === "S.Y.N.A.P.S.E Matrix") n += 1;
  }
  return Math.min(12, n);
}

function pickCatalogItem(state: GameState, region: RegionId, score: number, kind: MissionKind): CatalogItem | null {
  const drought = recentDrought(state);
  const advantage = kind === "boss" ? 3 : kind === "bounty" ? 2 : 1;
  let luck = 0;
  for (let i = 0; i < advantage + 1; i++) luck = Math.max(luck, Math.random() * 100);
  const quality = luck + score / 24 + drought * 2.4 + (kind === "boss" ? 16 : kind === "raid" ? 7 : 0);
  const target = rarityFromQuality(quality);
  const targetRank = RARITY_RANK[target];
  const names = ownedNames(state);
  const pool = HOLLOW_CATALOG.filter((x) => x.sourceRegion === region && (x.kind !== "special" || !names.has(x.name)));
  if (!pool.length) return null;

  const weighted = pool.map((item) => {
    const distance = Math.abs(RARITY_RANK[item.rarity] - targetRank);
    const duplicatePenalty = names.has(item.name) && item.kind !== "material" && item.kind !== "consumable" ? 0.22 : 1;
    const materialAssist = item.kind === "material" && score < 760 ? 1.45 : 1;
    return { item, weight: Math.max(0.05, 8 / Math.pow(2.25, distance)) * duplicatePenalty * materialAssist };
  });
  let roll = Math.random() * weighted.reduce((n, row) => n + row.weight, 0);
  for (const row of weighted) {
    roll -= row.weight;
    if (roll <= 0) return row.item;
  }
  return weighted.at(-1)?.item ?? null;
}

function makeItem(def: CatalogItem, day: number): Item {
  return {
    id: `matrix-${def.sourceRegion}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: def.name,
    kind: def.kind,
    rarity: def.rarity,
    condition: "Pristine",
    slot: def.kind === "weapon" ? "weapon" : def.kind === "armor" ? "armor" : def.kind === "trinket" ? "trinket" : undefined,
    classHint: def.classHint,
    damage: def.damage,
    defense: def.defense,
    effect: def.effect,
    lore: def.lore,
    equipped: false,
    value: def.value,
    sourceRegion: def.sourceRegion,
    discoveredDay: day,
    tags: ["matrix", "treasure", def.sourceRegion],
  };
}

function enforceRegionGates(state: GameState): boolean {
  const desired: Partial<Record<LocationId, boolean>> = {
    ironclad: true,
    kingdom: !!state.locations.ironclad?.bossDefeated,
    caverns: !!state.locations.kingdom?.bossDefeated,
    library: !!state.locations.caverns?.bossDefeated,
    veyra: !!state.locations.library?.bossDefeated,
  };
  let changed = false;
  for (const [id, unlocked] of Object.entries(desired) as [LocationId, boolean][]) {
    if (state.locations[id] && state.locations[id].unlocked !== unlocked) {
      state.locations[id] = { ...state.locations[id], unlocked };
      changed = true;
    }
  }
  return changed;
}

function rewardBoss(state: GameState, loc: LocationId) {
  const profile = raidProfileForLocation(loc);
  if (!profile) return;
  const region = regionById(profile.region);
  const riders = state.squad.filter((m) => !isVacant(m) && m.xp >= profile.minRiderXp);
  state.coins += profile.vaultReward;
  state.ore += profile.oreReward;
  state.moonFavor += profile.favorReward;
  riders.forEach((m) => {
    m.personalCaps += profile.cardReward;
    m.xp += Math.round(profile.minRiderXp * 0.35);
    m.note = `${region.name} raid dividend +${profile.cardReward.toLocaleString()} caps. ${m.note}`.slice(0, 180);
  });
  state.challengeCoin = true;
  pushLog(
    state,
    "Moon Squad Raid",
    `${region.name} boss cleared. Vault +${profile.vaultReward.toLocaleString()} caps · ${riders.length} raid-ready bank cards +${profile.cardReward.toLocaleString()} each · +${profile.oreReward} ore · +${profile.favorReward} favor.`,
  );
}

let installed = false;

export function CampaignBalanceRuntime() {
  useEffect(() => {
    if (installed) return;
    installed = true;

    const initial = useGame.getState();
    const originalTick = initial.tick;
    const originalUpgradeRoom = initial.upgradeRoom;
    const originalUpgradeQuarter = initial.upgradeQuarter;
    const originalDeploy = initial.deploy;
    let heartbeat = 0;

    const tick = () => {
      heartbeat += 1;
      if (heartbeat < PAYOUT_TICKS) return;
      heartbeat = 0;
      originalTick();
    };

    const upgradeRoom: typeof originalUpgradeRoom = (room) => {
      const before = useGame.getState().s;
      const quote = roomUpgradeQuote(before, room);
      if (!quote) return "Vault 13 facility is at maximum tier.";
      const block = upgradeBlockReason(before, quote);
      if (block) return block;
      const result = originalUpgradeRoom(room);
      if (result) return result;
      mutateState((state) => {
        consumeUpgradeRequirements(state, quote);
        pushLog(state, "Vault 13 Expansion", `${room} tier ${quote.nextLevel} consumed ${quote.materials} ${quote.materialRegion} materials, ${quote.ore} ore and ${quote.moonFavor} favor.`);
      });
      return null;
    };

    const upgradeQuarter: typeof originalUpgradeQuarter = (q) => {
      const before = useGame.getState().s;
      const quote = quarterUpgradeQuote(before, q);
      if (!quote) return "Vault 13 quarter is at maximum tier.";
      const block = upgradeBlockReason(before, quote);
      if (block) return block;
      const result = originalUpgradeQuarter(q);
      if (result) return result;
      mutateState((state) => {
        consumeUpgradeRequirements(state, quote);
        pushLog(state, "Vault 13 Expansion", `${q} tier ${quote.nextLevel} completed after material and campaign requirements were met.`);
      });
      return null;
    };

    const deploy: typeof originalDeploy = (loc, kind, partyIds) => {
      const state = useGame.getState().s;
      if (kind === "boss") {
        const block = bossBlockReason(state, loc, partyIds);
        if (block) return block;
      }
      return originalDeploy(loc, kind, partyIds);
    };

    useGame.setState({ tick, upgradeRoom, upgradeQuarter, deploy });

    const unsubscribe = useGame.subscribe((nextStore, prevStore) => {
      const next = nextStore.s;
      const prev = prevStore.s;
      let needsGatePass = false;

      // A completed mission gets a 1000-point S.Y.N.A.P.S.E performance grade.
      const mission = prev.mission;
      if (mission && !next.mission) {
        const oldCount = prev.locations[mission.locationId]?.missions ?? 0;
        const newCount = next.locations[mission.locationId]?.missions ?? 0;
        if (newCount > oldCount) {
          const matrix = scoreMission(prev, next, mission);
          mutateState((state) => {
            const desiredCaps = Math.max(0, Math.round(mission.coins * matrix.multiplier));
            const delta = desiredCaps - mission.coins;
            state.coins = Math.max(0, state.coins + delta);
            const seated = state.squad.find((m) => m.id === state.activeMemberId);
            if (seated && delta > 0) seated.personalCaps += Math.round(delta * 0.2);

            const regionId = canonicalRegionId(mission.locationId);
            let draws = KIND_DRAWS[mission.kind] + GRADE_BONUS[matrix.grade];
            if (mission.kind === "scout" && matrix.score >= 760) draws = 1;
            if (mission.kind === "trade" && matrix.score >= 850) draws = 1;
            const recovered: string[] = [];
            if (regionId) {
              for (let i = 0; i < draws; i++) {
                const def = pickCatalogItem(state, regionId, matrix.score, mission.kind);
                if (!def) continue;
                const item = makeItem(def, state.day);
                state.vault.push(item);
                recovered.push(item.name);
              }
            }

            pushLog(
              state,
              "S.Y.N.A.P.S.E Matrix",
              `Grade ${matrix.grade} · ${matrix.score}/1000 · execution ${matrix.execution} · survival ${matrix.survival} · teamwork ${matrix.teamwork} · preparation ${matrix.preparation} · reward ×${matrix.multiplier.toFixed(2)}${recovered.length ? ` · MATRIX TREASURE: ${recovered.join(", ")}` : ""}.`,
            );
            state.toast = `${matrix.grade} · ${matrix.score}/1000${recovered.length ? ` · ${recovered.length} treasure` : ""}`;
          });
        }
      }

      // Boss transitions pay both the communal Vault treasury and qualifying
      // riders' 3D Moon Squad bank cards.
      const bossLocs: LocationId[] = ["ironclad", "kingdom", "caverns", "library", "veyra"];
      for (const loc of bossLocs) {
        if (!prev.locations[loc]?.bossDefeated && next.locations[loc]?.bossDefeated) {
          mutateState((state) => rewardBoss(state, loc));
          needsGatePass = true;
        }
      }

      // Legacy engine unlocks regions by day. Long-form mode overrides that:
      // the next region opens only after the preceding boss is actually down.
      if (!needsGatePass) {
        const snapshot = useGame.getState().s;
        const test = cloneForMutation(snapshot);
        if (enforceRegionGates(test)) mutateState((state) => void enforceRegionGates(state));
      } else {
        mutateState((state) => void enforceRegionGates(state));
      }
    });

    // Apply the boss-chain lock immediately for existing saves as well.
    mutateState((state) => void enforceRegionGates(state));

    return () => {
      unsubscribe();
      installed = false;
      useGame.setState({
        tick: originalTick,
        upgradeRoom: originalUpgradeRoom,
        upgradeQuarter: originalUpgradeQuarter,
        deploy: originalDeploy,
      });
    };
  }, []);

  return null;
}

export function raidStatusFor(state: GameState, loc: LocationId, partyIds: string[] = []) {
  const profile = raidProfileForLocation(loc);
  if (!profile) return null;
  return {
    ...profile,
    regionName: regionById(profile.region).name,
    block: bossBlockReason(state, loc, partyIds),
  };
}
