import { RACES, resolveRaceName } from "@/game/data";
import { cloneState } from "@/game/engine";
import { analyzeLoadout } from "@/game/loadout-effects";
import { residentProgress } from "@/game/resident-progression";
import { useGame } from "@/game/store";
import type { GameState, Operative, StatKey, Stats } from "@/game/types";
import { useEffect } from "react";

const STAT_KEYS: StatKey[] = ["STR", "DEF", "INT", "WIS", "SPD", "CHA", "LCK"];
const DAY_GATE = [1, 7, 21, 45, 85, 140];
const COMMAND_GATE = [1, 2, 4, 6, 8, 10];
const RESIDENT_LEVEL_GATE = [1, 2, 4, 6, 8, 10];
const RESIDENT_COUNT_GATE = [0, 1, 1, 2, 2, 3];

type RuntimeRace = { stats: Stats } & Record<string, unknown>;
type ProgressOperative = Operative & {
  activeItemEffects?: Array<{ name: string; effect: string; expires: "sortie" | "encounter" }>;
};

type RestoreRow = {
  opId: string;
  race: string;
  weaponId?: string;
  weaponDamage?: string;
};

function addDamageBonus(damage: string | undefined, bonus: number) {
  if (!damage || bonus === 0) return damage;
  const match = damage.match(/^(\d+d\d+)(?:\s*\+\s*(\d+))?$/i);
  if (!match) return damage;
  const current = Number(match[2] ?? 0);
  const next = Math.max(0, current + bonus);
  return next ? `${match[1]}+${next}` : match[1];
}

function vaultProgressionBlock(state: GameState, nextLevel: number): string | null {
  const index = Math.max(0, Math.min(5, nextLevel - 1));
  const day = DAY_GATE[index]!;
  if (state.day < day) return `Vault protocol: tier ${nextLevel} opens on day ${day}.`;

  const command = COMMAND_GATE[index]!;
  if (state.level < command) return `Tyrone: tier ${nextLevel} needs Command Rank ${command}. Current rank ${state.level}.`;

  const requiredLevel = RESIDENT_LEVEL_GATE[index]!;
  const requiredCount = RESIDENT_COUNT_GATE[index]!;
  if (requiredCount) {
    const qualified = state.operatives.filter(
      (op) => op.status !== "dead" && residentProgress(op).level >= requiredLevel,
    ).length;
    if (qualified < requiredCount) {
      return `Tyrone: tier ${nextLevel} needs ${requiredCount} resident${requiredCount === 1 ? "" : "s"} at Level ${requiredLevel}+ (${qualified}/${requiredCount}).`;
    }
  }
  return null;
}

function patchRuntimeLoadouts() {
  const restore: RestoreRow[] = [];
  const tempRaceKeys: string[] = [];
  const raceTable = RACES as unknown as Record<string, RuntimeRace>;

  useGame.setState((store) => {
    const s = cloneState(store.s);
    s.operatives = s.operatives.map((op) => {
      const analysis = analyzeLoadout(op);
      const raceKey = op.race.startsWith("__stack_") ? op.race : resolveRaceName(op.race);
      const baseRace = raceTable[raceKey];
      const weapon = op.inventory.find((item) => item.equipped && item.slot === "weapon");
      const hasStats = Object.values(analysis.statModifiers).some((n) => !!n);
      const hasDamage = !!analysis.damageBonus;
      if ((!hasStats && !hasDamage) || !baseRace?.stats) return op;

      const tempRace = `__stack_${op.id}`;
      const stats = { ...baseRace.stats };
      for (const stat of STAT_KEYS) stats[stat] += analysis.statModifiers[stat] ?? 0;
      raceTable[tempRace] = { ...baseRace, stats };
      tempRaceKeys.push(tempRace);
      restore.push({ opId: op.id, race: op.race, weaponId: weapon?.id, weaponDamage: weapon?.damage });

      return {
        ...op,
        race: tempRace,
        inventory: op.inventory.map((item) =>
          item.id === weapon?.id && hasDamage
            ? { ...item, damage: addDamageBonus(item.damage, analysis.damageBonus) }
            : item,
        ),
      };
    });
    return { s };
  });

  return () => {
    useGame.setState((store) => {
      const s = cloneState(store.s);
      s.operatives = s.operatives.map((op) => {
        const row = restore.find((entry) => entry.opId === op.id);
        if (!row) return op;
        return {
          ...op,
          race: row.race,
          inventory: op.inventory.map((item) =>
            item.id === row.weaponId ? { ...item, damage: row.weaponDamage } : item,
          ),
        };
      });
      return { s };
    });
    for (const key of tempRaceKeys) delete raceTable[key];
  };
}

let installed = false;

export function LoadoutEffectsRuntime() {
  useEffect(() => {
    if (installed) return;
    installed = true;

    const current = useGame.getState();
    const originalRollBeat = current.rollBeat;
    const originalCombatAct = current.combatAct;
    const originalUpgradeRoom = current.upgradeRoom;
    const originalUpgradeQuarter = current.upgradeQuarter;

    const rollBeat: typeof originalRollBeat = () => {
      const restore = patchRuntimeLoadouts();
      try {
        originalRollBeat();
      } finally {
        restore();
      }
    };

    const combatAct: typeof originalCombatAct = (action) => {
      const restore = patchRuntimeLoadouts();
      try {
        originalCombatAct(action);
      } finally {
        restore();
      }
    };

    const upgradeRoom: typeof originalUpgradeRoom = (room) => {
      const state = useGame.getState().s;
      const block = vaultProgressionBlock(state, (state.rooms[room] ?? 0) + 1);
      return block ?? originalUpgradeRoom(room);
    };

    const upgradeQuarter: typeof originalUpgradeQuarter = (quarter) => {
      const state = useGame.getState().s;
      const block = vaultProgressionBlock(state, (state.quarters[quarter] ?? 0) + 1);
      return block ?? originalUpgradeQuarter(quarter);
    };

    useGame.setState({ rollBeat, combatAct, upgradeRoom, upgradeQuarter });

    const unsubscribe = useGame.subscribe((next, prev) => {
      if (!prev.s.combat || next.s.combat) return;
      const hadEncounterEffects = next.s.operatives.some((op) =>
        ((op as ProgressOperative).activeItemEffects ?? []).some((effect) => effect.expires === "encounter"),
      );
      if (!hadEncounterEffects) return;
      useGame.setState((store) => {
        const s = cloneState(store.s);
        s.operatives = s.operatives.map((op) => {
          const p = op as ProgressOperative;
          if (!p.activeItemEffects?.length) return op;
          p.activeItemEffects = p.activeItemEffects.filter((effect) => effect.expires !== "encounter");
          return p;
        });
        return { s };
      });
    });

    return () => {
      unsubscribe();
      installed = false;
      useGame.setState({
        rollBeat: originalRollBeat,
        combatAct: originalCombatAct,
        upgradeRoom: originalUpgradeRoom,
        upgradeQuarter: originalUpgradeQuarter,
      });
    };
  }, []);

  return null;
}
