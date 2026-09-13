import { canonicalRegionId, regionById } from "@/game/data";
import { HOLLOW_CATALOG } from "@/game/hollow-catalog";
import { useGame } from "@/game/store";
import type { Item, MissionKind, Rarity } from "@/game/types";
import { useEffect } from "react";

const DROP_CHANCE: Record<MissionKind, number> = {
  scout: 0.22,
  forage: 0.42,
  raid: 0.62,
  trade: 0.18,
  bounty: 0.72,
  boss: 1,
};

const RARITY_WEIGHT: Record<Rarity, number> = {
  Common: 38,
  Uncommon: 30,
  Rare: 20,
  Legendary: 8,
  Mythic: 3,
  Cursed: 1,
};

function weightedPick<T extends { rarity: Rarity }>(rows: T[], missionKind: MissionKind): T | null {
  if (!rows.length) return null;
  const bonus = missionKind === "boss" ? 3 : missionKind === "bounty" ? 2 : missionKind === "raid" ? 1.35 : 1;
  const weighted = rows.map((row) => {
    const tierBoost = row.rarity === "Legendary" || row.rarity === "Mythic" ? bonus : 1;
    return { row, weight: RARITY_WEIGHT[row.rarity] * tierBoost };
  });
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll <= 0) return entry.row;
  }
  return weighted.at(-1)?.row ?? null;
}

function makeRegionalItem(def: (typeof HOLLOW_CATALOG)[number]): Item {
  return {
    id: `regional-${def.sourceRegion}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
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
    discoveredDay: useGame.getState().s.day,
    tags: ["regional", def.sourceRegion],
  };
}

/**
 * Migration bridge for regional loot.
 *
 * The legacy mission engine still owns its original tables. Until that engine
 * is split by feature, this listener watches the authoritative mission-complete
 * transition (regional mission count increases and the mission clears) and
 * places one region-authored find in Vault 13 when the regional drop roll hits.
 */
export function RegionalLootRuntime() {
  useEffect(() => {
    const unsubscribe = useGame.subscribe((next, prev) => {
      const before = prev.s.mission;
      if (!before || next.s.mission) return;

      const loc = before.locationId;
      const oldCount = prev.s.locations[loc]?.missions ?? 0;
      const newCount = next.s.locations[loc]?.missions ?? 0;
      if (newCount <= oldCount) return;

      const regionId = canonicalRegionId(loc);
      if (!regionId) return;
      if (Math.random() > DROP_CHANCE[before.kind]) return;

      const allOwnedNames = new Set([
        ...next.s.vault.map((item) => item.name),
        ...next.s.operatives.flatMap((op) => op.inventory.map((item) => item.name)),
      ]);
      const candidates = HOLLOW_CATALOG.filter(
        (item) => item.sourceRegion === regionId && (item.kind !== "special" || !allOwnedNames.has(item.name)),
      );
      const picked = weightedPick(candidates, before.kind);
      if (!picked) return;

      const item = makeRegionalItem(picked);
      const region = regionById(regionId);
      useGame.setState((current) => ({
        s: {
          ...current.s,
          vault: [...current.s.vault, item],
          log: [
            {
              id: `log-regional-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
              day: current.s.day,
              kind: "loot",
              who: region.name,
              what: `${item.name} recovered and tagged into the Vault 13 Inventory.`,
            },
            ...current.s.log,
          ].slice(0, 80),
          toast: `${region.name} find: ${item.name} → Vault 13`,
        },
      }));
    });
    return unsubscribe;
  }, []);

  return null;
}
