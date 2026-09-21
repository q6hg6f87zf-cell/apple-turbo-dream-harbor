import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BOARD_KIND_LABEL, boardCost, boardStake, liveJobs, unansweredWatches } from "./board-copy";
import type { DayTask } from "./types";

function job(partial: Partial<DayTask> & Pick<DayTask, "id" | "kind" | "title">): DayTask {
  return {
    brief: "Brief.",
    why: "Why.",
    watchCost: 1,
    required: false,
    status: "open",
    ...partial,
  };
}

describe("board copy", () => {
  it("never prints the kind enum as the stake", () => {
    const task = job({
      id: "a",
      kind: "tower",
      title: "Climb Relay Tower Three",
      failNote: "The tower talked to empty air. A site went unmarked.",
    });
    assert.equal(boardStake(task), "The tower talked to empty air. A site went unmarked.");
    assert.equal(BOARD_KIND_LABEL.tower, "Relay");
    assert.notEqual(BOARD_KIND_LABEL.sortie, "sortie");
  });

  it("falls back to why when a job has no fail note", () => {
    const task = job({
      id: "b",
      kind: "scan",
      title: "Walk the perimeter",
      why: "Intel is how Ghost routes open.",
    });
    assert.equal(boardStake(task), "Intel is how Ghost routes open.");
  });

  it("counts watches the day cannot cover", () => {
    const board = [
      job({ id: "1", kind: "sortie", title: "Scout", watchCost: 2, required: true }),
      job({ id: "2", kind: "market", title: "Market", watchCost: 1 }),
      job({ id: "3", kind: "tower", title: "Tower", watchCost: 1 }),
      job({ id: "4", kind: "crates", title: "Crates", watchCost: 1, status: "done" }),
    ];
    assert.equal(liveJobs(board).length, 3);
    assert.equal(boardCost(board), 4);
    assert.equal(unansweredWatches(board, 6), 0);
    assert.equal(unansweredWatches(board, 2), 2);
  });
});
