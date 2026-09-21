import type { DayTask, DayTaskKind } from "./types";

export const BOARD_KIND_LABEL: Record<DayTaskKind, string> = {
  sortie: "Field job",
  crates: "Depot",
  visitor: "Gate",
  aegis: "AEGIS",
  treat: "Med Bay",
  scan: "Perimeter",
  repair: "Shop",
  run: "Supply",
  tribute: "Kane",
  crisis: "Crisis",
  cabinet: "T-0888",
  market: "Market",
  tower: "Relay",
  salvage: "Site",
};

export function boardStake(task: DayTask): string {
  return (task.failNote || task.why || "").trim();
}

export function boardWatchLabel(n: number): string {
  return `${n} watch${n === 1 ? "" : "es"}`;
}

export function liveJobs(board: DayTask[]): DayTask[] {
  return board.filter((task) => task.status === "open" || task.status === "active");
}

export function boardCost(board: DayTask[]): number {
  return liveJobs(board).reduce((sum, task) => sum + task.watchCost, 0);
}

/** Watches of posted work that six watches cannot cover. */
export function unansweredWatches(board: DayTask[], watchesLeft: number): number {
  return Math.max(0, boardCost(board) - Math.max(0, watchesLeft));
}
