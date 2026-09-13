import { scoreMission } from "@/game/campaign-balance";
import { cloneState } from "@/game/engine";
import {
  expireSortieEffects,
  grantResidentXp,
  MISSION_RESIDENT_XP,
  MISSION_RIDER_XP,
} from "@/game/resident-progression";
import { useGame } from "@/game/store";
import type { GameState, LocationId } from "@/game/types";
import { useEffect } from "react";

const LONG_DAY_GATE: Record<number, number> = {
  1: 1,
  2: 4,
  3: 12,
  4: 28,
  5: 55,
  6: 90,
};

const BOSS_DAY_GATE: Partial<Record<LocationId, number>> = {
  ironclad: 8,
  kingdom: 22,
  caverns: 40,
  library: 65,
  veyra: 95,
};

function mutate(fn: (state: GameState) => void) {
  useGame.setState((store) => {
    const next = cloneState(store.s);
    fn(next);
    return { s: next };
  });
}

let installed = false;

export function ResidentProgressionRuntime() {
  useEffect(() => {
    if (installed) return;
    installed = true;

    const current = useGame.getState();
    const previousUpgradeRoom = current.upgradeRoom;
    const previousUpgradeQuarter = current.upgradeQuarter;
    const previousDeploy = current.deploy;

    const upgradeRoom: typeof previousUpgradeRoom = (room) => {
      const state = useGame.getState().s;
      const nextLevel = (state.rooms[room] ?? 0) + 1;
      const gate = LONG_DAY_GATE[nextLevel] ?? LONG_DAY_GATE[6]!;
      if (state.day < gate) return `Vault protocol: tier ${nextLevel} opens on day ${gate}.`;
      return previousUpgradeRoom(room);
    };

    const upgradeQuarter: typeof previousUpgradeQuarter = (quarter) => {
      const state = useGame.getState().s;
      const nextLevel = (state.quarters[quarter] ?? 0) + 1;
      const gate = LONG_DAY_GATE[nextLevel] ?? LONG_DAY_GATE[6]!;
      if (state.day < gate) return `Vault protocol: tier ${nextLevel} opens on day ${gate}.`;
      return previousUpgradeQuarter(quarter);
    };

    const deploy: typeof previousDeploy = (loc, kind, partyIds) => {
      if (kind === "boss") {
        const state = useGame.getState().s;
        const gate = BOSS_DAY_GATE[loc];
        if (gate && state.day < gate) return `Tyrone: that boss is not a day-${state.day} problem. Earliest raid window is day ${gate}. Build intel, XP and gear first.`;
      }
      return previousDeploy(loc, kind, partyIds);
    };

    useGame.setState({ upgradeRoom, upgradeQuarter, deploy });

    const unsubscribe = useGame.subscribe((nextStore, prevStore) => {
      const previousMission = prevStore.s.mission;
      const nextMission = nextStore.s.mission;
      if (!previousMission || nextMission) return;

      const oldCount = prevStore.s.locations[previousMission.locationId]?.missions ?? 0;
      const newCount = nextStore.s.locations[previousMission.locationId]?.missions ?? 0;
      if (newCount <= oldCount) return;

      const matrix = scoreMission(prevStore.s, nextStore.s, previousMission);
      const baseResidentXp = MISSION_RESIDENT_XP[previousMission.kind];
      const residentXp = Math.max(1, Math.round(baseResidentXp * matrix.multiplier));
      const riderXp = Math.max(1, Math.round(MISSION_RIDER_XP[previousMission.kind] * (0.8 + matrix.score / 1000)));

      mutate((state) => {
        const levelUps: string[] = [];
        for (const id of previousMission.partyIds) {
          const op = state.operatives.find((x) => x.id === id);
          if (!op) continue;
          const result = grantResidentXp(op, residentXp);
          if (result.after > result.before) levelUps.push(`${op.name} Lv ${result.after}`);
          expireSortieEffects(op);
        }

        const rider = state.squad.find((x) => x.id === state.activeMemberId);
        if (rider) rider.xp += riderXp;

        state.log = [
          {
            id: `progress-${Date.now().toString(36)}`,
            day: state.day,
            kind: "action",
            who: "Tyrone",
            what: `Training report: +${residentXp} resident XP · +${riderXp} rider contribution XP${levelUps.length ? ` · ${levelUps.join(", ")}` : ""}.`,
          },
          ...state.log,
        ].slice(0, 80);

        if (levelUps.length) state.toast = `${levelUps.join(" · ")} · Tyrone updated the files.`;
      });
    });

    return () => {
      unsubscribe();
      installed = false;
      useGame.setState({
        upgradeRoom: previousUpgradeRoom,
        upgradeQuarter: previousUpgradeQuarter,
        deploy: previousDeploy,
      });
    };
  }, []);

  return null;
}
