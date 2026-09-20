import type { GameState, Screen } from "./types";
import { nextObjective } from "./engine";

export const HUB_SCREENS = ["hq", "roster", "squad", "map", "arcade", "inventory", "more"] as const;
export const TASK_SCREENS = ["market", "forge", "ledger", "vault", "codex"] as const;

export type HubScreen = (typeof HUB_SCREENS)[number];
export type TaskScreen = (typeof TASK_SCREENS)[number];
export type ChromeKind = "hub" | "task" | "none";
export type GuidanceMode = "guided" | "urgent" | "quiet";

export const TASK_META: Record<TaskScreen, { title: string; plate: boolean }> = {
  market: { title: "Market", plate: true },
  forge: { title: "Forge", plate: false },
  ledger: { title: "Ledger", plate: true },
  vault: { title: "Salvage", plate: false },
  codex: { title: "Archive", plate: false },
};

export function isHubScreen(screen: Screen): screen is HubScreen {
  return (HUB_SCREENS as readonly Screen[]).includes(screen);
}

export function isTaskScreen(screen: Screen): screen is TaskScreen {
  return (TASK_SCREENS as readonly Screen[]).includes(screen);
}

export function chromeKind(screen: Screen): ChromeKind {
  if (isHubScreen(screen)) return "hub";
  if (isTaskScreen(screen)) return "task";
  return "none";
}

export function livingCount(state: GameState): number {
  return state.operatives.filter((o) => o.status !== "dead").length;
}

export function guidanceMode(state: GameState): GuidanceMode {
  if (!state.started) return "quiet";
  if (state.tutorial !== "done") return "guided";
  if (livingCount(state) === 0) return "urgent";
  if (state.operatives.some((o) => o.status === "downed")) return "urgent";
  if (state.operatives.some((o) => o.inventory.some((i) => i.equipped && i.condition === "Broken"))) {
    return "urgent";
  }
  return "quiet";
}

export function guidanceSignal(state: GameState): {
  mode: GuidanceMode;
  text: string;
  screen: Screen;
  cta: string;
  opId?: string;
} | null {
  const mode = guidanceMode(state);
  if (mode === "quiet") return null;
  if (mode === "guided") {
    const obj = nextObjective(state);
    return { mode, ...obj };
  }
  if (livingCount(state) === 0) {
    return { mode, text: "The roster is empty. Forge an operative.", screen: "forge", cta: "Forge" };
  }
  const downed = state.operatives.find((o) => o.status === "downed");
  if (downed) {
    return {
      mode,
      text: `${downed.name} is downed. The Infirmary — or they die at dawn.`,
      screen: "roster",
      cta: "Roster",
      opId: downed.id,
    };
  }
  const broken = state.operatives.find((o) => o.inventory.some((i) => i.equipped && i.condition === "Broken"));
  if (broken) {
    return {
      mode,
      text: `${broken.name}'s weapon is broken. Pay the Forge.`,
      screen: "roster",
      cta: "Repair",
      opId: broken.id,
    };
  }
  return null;
}
