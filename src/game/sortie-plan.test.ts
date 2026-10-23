import assert from "node:assert/strict";
import test from "node:test";
import { buildServerSortiePlan, isSortiePlan } from "./sortie-plan.ts";

test("raid/bounty/boss plans include a crisis beat", () => {
  for (const kind of ["raid", "bounty", "boss"] as const) {
    const plan = buildServerSortiePlan(kind);
    assert.equal(plan.kind, kind);
    assert.ok(plan.beats.some((b) => b.phase === "crisis"), `${kind} missing crisis`);
    assert.equal(plan.beats[0]?.phase, "intel");
    assert.ok(isSortiePlan(plan));
  }
});

test("scout plan is intel → approach → extract without forced crisis", () => {
  const plan = buildServerSortiePlan("scout");
  assert.equal(plan.beats[0]?.phase, "intel");
  assert.equal(plan.beats[1]?.phase, "approach");
  assert.ok(!plan.beats.some((b) => b.phase === "crisis"));
  assert.ok(plan.beats.some((b) => b.phase === "extract"));
});

test("plans are deterministic for a kind", () => {
  assert.deepEqual(buildServerSortiePlan("raid"), buildServerSortiePlan("raid"));
});
