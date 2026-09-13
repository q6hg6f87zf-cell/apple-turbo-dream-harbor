// Canonical ARC ordering layered over the existing squad/card system.
export * from "./squad-legacy";

import { locById } from "./data";
import type { GameState, MissionKind, RegionId } from "./types";
import { ensureSquad } from "./squad-legacy";

export const ARC_ORDER: RegionId[] = [
  "ironclad",
  "slagtown",
  "blackspire",
  "brasswater",
  "veyra",
];

export function currentArcLoc(state: GameState): RegionId {
  for (const id of ARC_ORDER) {
    const progress = state.locations[id];
    if (progress && !progress.bossDefeated) return id;
  }
  return "veyra";
}

export function arcChapter(state: GameState): number {
  return ARC_ORDER.indexOf(currentArcLoc(state)) + 1;
}

export function isArcAction(loc: RegionId | "hq", kind: MissionKind): boolean {
  return (kind === "raid" || kind === "boss" || kind === "bounty") && ARC_ORDER.includes(loc as RegionId);
}

export function canTakeArcTurn(state: GameState, loc: RegionId | "hq", kind: MissionKind): boolean {
  ensureSquad(state);
  if (!(kind === "raid" || kind === "boss" || kind === "bounty")) return true;
  if (loc !== currentArcLoc(state)) return true;
  return state.arc!.turnMemberId === state.activeMemberId;
}

export function spendArcTurn(state: GameState, note: string) {
  const who = ensureSquad(state);
  const loc = currentArcLoc(state);
  const index = Math.max(
    0,
    state.squad.findIndex((member) => member.id === state.arc!.turnMemberId),
  );
  const actor = state.squad[index] ?? who;
  const next = state.squad[(index + 1) % state.squad.length];
  actor.lastTurnDay = state.day;
  state.arc!.chapter = arcChapter(state);
  state.arc!.turn += 1;
  state.arc!.turnMemberId = next.id;
  const line = `${actor.name} closed a beat in ${locById(loc).short}. Turn passes to ${next.name}. ${note}`;
  state.arc!.log = [line, ...state.arc!.log].slice(0, 24);
  if (state.squad.length > 1) state.toast = `ARC turn → ${next.name}`;
}

export function maybeSpendArcTurn(
  state: GameState,
  loc: RegionId | "hq",
  kind: MissionKind,
  note: string,
) {
  if (!(kind === "raid" || kind === "boss" || kind === "bounty")) return;
  ensureSquad(state);
  const current = currentArcLoc(state);
  const index = ARC_ORDER.indexOf(loc as RegionId);
  const nextId = index >= 0 ? ARC_ORDER[index + 1] : undefined;
  const justCleared =
    kind === "boss" &&
    loc !== "hq" &&
    !!state.locations[loc]?.bossDefeated &&
    nextId === current;
  if (loc !== current && !justCleared) return;
  spendArcTurn(state, note);
}

export function passArcTurn(state: GameState) {
  ensureSquad(state);
  if (state.arc!.turnMemberId !== state.activeMemberId) {
    state.toast = "ARC turn belongs to someone else.";
    return;
  }
  spendArcTurn(state, "Passed from the porch.");
}
