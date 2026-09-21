import type { GameState, Screen } from "./types";
import { characterForged, nextObjective } from "./engine";

export const HUB_SCREENS = ["hq", "roster", "squad", "map", "profile", "arcade", "inventory", "more"] as const;
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

/**
 * Dots on the dock, for the screens where something is genuinely waiting.
 *
 * Only in quiet. Guided and urgent already have the guidance row saying it out
 * loud, and two channels repeating one fact is what the row was taken away for.
 */
export function navSignals(state: GameState): Set<Screen> {
  const out = new Set<Screen>();
  if (guidanceMode(state) !== "quiet") return out;
  if (state.mission || state.combat) return out;

  const living = state.operatives.filter((o) => o.status !== "dead");
  const ready = living.filter((o) => o.status === "idle" && o.location === "hq");

  // Somewhere to go, someone to send, and daylight left to do it in.
  if (ready.length > 0 && (state.shift?.watchesLeft ?? 0) > 0) out.add("map");

  // A visiting stall sits roughly every third dawn and is gone by the next one.
  if (state.market?.visitor) out.add("more");

  // Gear in the vault that someone has an open slot for.
  const openSlots = new Set<string>();
  for (const op of living) {
    for (const slot of ["weapon", "armor", "trinket"]) {
      if (!op.inventory.some((i) => i.slot === slot && i.equipped)) openSlots.add(slot);
    }
  }
  if (openSlots.size && state.vault.some((i) => i.slot && openSlots.has(i.slot))) out.add("inventory");

  return out;
}

/**
 * The same answer as a string, so a store subscription can compare it by value
 * instead of re-rendering the dock on every tick.
 */
export function navSignalKey(state: GameState): string {
  return [...navSignals(state)].sort().join(",");
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
    if (characterForged(state)) {
      return { mode, text: "Your file is closed. The Machine Shop will not cut a second soul.", screen: "hq", cta: "HQ" };
    }
    return { mode, text: "Cut your file in the Machine Shop. Two rerolls. Then it locks.", screen: "forge", cta: "Forge" };
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
