import type { GameState, Screen } from "./types";
import { characterForged, nextObjective } from "./engine";
import { storyObjective } from "./story-spine";
import { ensureNarrative } from "./narrative-state";
import { locationToRegion } from "./field-ops";
import { regionThemeId } from "./narrative-state";

export const HUB_SCREENS = ["hq", "file", "roster", "squad", "map", "arcade", "inventory", "more"] as const;
export const TASK_SCREENS = ["market", "forge", "ledger", "vault", "codex"] as const;

export type HubScreen = (typeof HUB_SCREENS)[number];
export type TaskScreen = (typeof TASK_SCREENS)[number];
export type ChromeKind = "hub" | "task" | "none" | "world";
export type GuidanceMode = "guided" | "urgent" | "quiet";

/** Diegetic pause menu — progressive disclosure of systems. */
export const GAME_MENU = [
  { id: "file" as Screen, label: "Character", blurb: "S.Y.N.A.P.S.E plate and file" },
  { id: "inventory" as Screen, label: "Inventory", blurb: "Pack and vault steel" },
  { id: "journal" as const, label: "Journal", blurb: "Story, promises, discoveries" },
  { id: "map" as Screen, label: "Map", blurb: "Orbit and regions" },
  { id: "roster" as Screen, label: "Companions", blurb: "People who walk with you" },
  { id: "ledger" as Screen, label: "Ledger", blurb: "Debts, wagers, obligations" },
  { id: "settings" as const, label: "Settings", blurb: "Assist, radio, rest" },
] as const;

export type GameMenuId = (typeof GAME_MENU)[number]["id"];

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

export function chromeKind(screen: Screen, state?: GameState): ChromeKind {
  if (state?.regionMapOpen && screen === "map") return "world";
  if (screen === "map") return "world";
  if (isHubScreen(screen)) return "hub";
  if (isTaskScreen(screen)) return "task";
  return "none";
}

/** World-first: dock stays for reachability but can fade during immersion. */
export function chromeImmersive(state: GameState): boolean {
  return !!state.regionMapOpen || !!state.mission || !!state.combat;
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

/** Compact HUD payload for the world-first overlay. */
export function worldHudModel(state: GameState): {
  day: number;
  objective: string;
  act: string;
  regionTheme: string;
  heat: number;
  tyroneLine: string | null;
  watchesLeft: number;
} {
  ensureNarrative(state);
  const region = locationToRegion(state.selectedLoc ?? "ironclad");
  return {
    day: state.day,
    objective: storyObjective(state),
    act: state.narrative?.act ?? "prologue",
    regionTheme: regionThemeId(region),
    heat: state.kaneHeat ?? 0,
    tyroneLine: state.tyrone?.utterance ?? null,
    watchesLeft: state.shift?.watchesLeft ?? 0,
  };
}
