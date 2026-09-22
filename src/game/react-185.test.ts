import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyBossRegionGates } from "./campaign-balance.ts";
import { defaultState } from "./engine.ts";
import { availableScenarios } from "./scenario.ts";
import { bootstrapNarrative } from "./story-spine.ts";

describe("React #185 launch guards", () => {
  it("applyBossRegionGates is idempotent so a store subscriber cannot nest updates", () => {
    const s = defaultState();
    s.locations.kingdom.unlocked = true;
    s.locations.ironclad.bossDefeated = false;
    assert.equal(applyBossRegionGates(s), true);
    assert.equal(s.locations.kingdom.unlocked, false);
    assert.equal(applyBossRegionGates(s), false);
    assert.equal(applyBossRegionGates(s), false);
  });

  it("does not flip unlocks that already match the boss chain", () => {
    const s = defaultState();
    s.locations.ironclad.unlocked = true;
    s.locations.ironclad.bossDefeated = true;
    s.locations.kingdom.unlocked = true;
    assert.equal(applyBossRegionGates(s), false);
  });

  it("availableScenarios allocates a new array each call (must not be a zustand selector)", () => {
    const s = defaultState();
    s.started = true;
    bootstrapNarrative(s);
    const a = availableScenarios(s);
    const b = availableScenarios(s);
    assert.deepEqual(a.map((row) => row.id), b.map((row) => row.id));
    assert.notEqual(a, b);
  });
});
