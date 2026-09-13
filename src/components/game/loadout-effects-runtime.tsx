import { RACES } from "@/game/data";
import { cloneState } from "@/game/engine";
import { analyzeLoadout } from "@/game/loadout-effects";
import { useGame } from "@/game/store";
import type { Operative, StatKey, Stats } from "@/game/types";
import { useEffect } from "react";

const STAT_KEYS: StatKey[] = ["STR", "DEF", "INT", "WIS", "SPD", "CHA", "LCK"];

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

function patchRuntimeLoadouts() {
  const restore: RestoreRow[] = [];
  const tempRaceKeys: string[] = [];
  const raceTable = RACES as unknown as Record<string, RuntimeRace>;

  useGame.setState((store) => {
    const s = cloneState(store.s);
    s.operatives = s.operatives.map((op) => {
      const analysis = analyzeLoadout(op);
      const baseRace = raceTable[op.race];
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

/**
 * Compatibility bridge for the legacy monolithic combat engine.
 *
 * The authoritative loadout model lives in loadout-effects.ts. The old engine
 * derives combat stats from race data, so this runtime temporarily projects
 * each operative's calculated modifiers into a private race record for the
 * duration of a synchronous roll/action, then restores the save immediately.
 * No temporary race or inflated weapon damage is persisted.
 */
export function LoadoutEffectsRuntime() {
  useEffect(() => {
    if (installed) return;
    installed = true;

    const current = useGame.getState();
    const originalRollBeat = current.rollBeat;
    const originalCombatAct = current.combatAct;

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

    useGame.setState({ rollBeat, combatAct });

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
      useGame.setState({ rollBeat: originalRollBeat, combatAct: originalCombatAct });
    };
  }, []);

  return null;
}
