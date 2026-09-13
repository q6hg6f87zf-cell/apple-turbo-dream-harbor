import { residentProgress } from "@/game/resident-progression";
import { useGame } from "@/game/store";
import type { GameState } from "@/game/types";
import { useEffect } from "react";

const DAY_GATE = [1, 7, 21, 45, 85, 140];
const COMMAND_GATE = [1, 2, 4, 6, 8, 10];
const RESIDENT_LEVEL_GATE = [1, 2, 4, 6, 8, 10];
const RESIDENT_COUNT_GATE = [0, 1, 1, 2, 2, 3];

function gateFor(state: GameState, nextLevel: number): string | null {
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

let installed = false;

export function VaultProgressionRuntime() {
  useEffect(() => {
    if (installed) return;
    installed = true;

    const current = useGame.getState();
    const previousUpgradeRoom = current.upgradeRoom;
    const previousUpgradeQuarter = current.upgradeQuarter;

    const upgradeRoom: typeof previousUpgradeRoom = (room) => {
      const state = useGame.getState().s;
      const block = gateFor(state, (state.rooms[room] ?? 0) + 1);
      return block ?? previousUpgradeRoom(room);
    };

    const upgradeQuarter: typeof previousUpgradeQuarter = (quarter) => {
      const state = useGame.getState().s;
      const block = gateFor(state, (state.quarters[quarter] ?? 0) + 1);
      return block ?? previousUpgradeQuarter(quarter);
    };

    useGame.setState({ upgradeRoom, upgradeQuarter });

    return () => {
      installed = false;
      useGame.setState({ upgradeRoom: previousUpgradeRoom, upgradeQuarter: previousUpgradeQuarter });
    };
  }, []);

  return null;
}
