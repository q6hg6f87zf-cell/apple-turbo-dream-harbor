import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBossClearedOfferMutations,
  buildMissionSettledOfferMutations,
  heatDeltaFor,
  settleBeatIdSnake,
} from "./authority-world-consequence";

test("settleBeatIdSnake prefers Atlas snake ids", () => {
  assert.equal(settleBeatIdSnake("boss", 0), "boss_clear");
  assert.equal(settleBeatIdSnake("scout", 2), "intel_drop");
  assert.equal(settleBeatIdSnake("raid", 0), "vault_flash");
  assert.equal(settleBeatIdSnake("forage", 0), "mission_settle");
});

test("heatDeltaFor matches Strike/Atlas bands", () => {
  assert.equal(heatDeltaFor("boss"), 8);
  assert.equal(heatDeltaFor("raid"), 3);
  assert.equal(heatDeltaFor("bounty"), 3);
  assert.equal(heatDeltaFor("scout"), 1);
  assert.equal(heatDeltaFor("forage"), 1);
});

test("scout unlocks raid/bounty by post-settle intel; never boss", () => {
  const low = buildMissionSettledOfferMutations({
    region: "ironclad",
    kind: "scout",
    postSettleIntel: 1,
    bossGatesMet: true,
  });
  assert.ok(low.some((m) => m.op === "boost" && m.kinds?.includes("scout")));
  assert.ok(!low.some((m) => m.op === "unlock" && m.kinds?.includes("raid")));
  assert.ok(!low.some((m) => m.kinds?.includes("boss")));

  const mid = buildMissionSettledOfferMutations({
    region: "ironclad",
    kind: "scout",
    postSettleIntel: 3,
    bossGatesMet: true,
  });
  assert.ok(mid.some((m) => m.op === "unlock" && m.kinds?.includes("raid")));
  assert.ok(mid.some((m) => m.op === "unlock" && m.kinds?.includes("bounty")));
  assert.ok(!mid.some((m) => m.kinds?.includes("boss")));
});

test("raid unlocks boss only when gates met; cools scout", () => {
  const locked = buildMissionSettledOfferMutations({
    region: "slagtown",
    kind: "raid",
    postSettleIntel: 9,
    bossGatesMet: false,
  });
  assert.ok(!locked.some((m) => m.op === "unlock" && m.kinds?.includes("boss")));
  assert.ok(locked.some((m) => m.op === "cool" && m.kinds?.includes("scout")));

  const open = buildMissionSettledOfferMutations({
    region: "slagtown",
    kind: "raid",
    postSettleIntel: 9,
    bossGatesMet: true,
  });
  assert.ok(open.some((m) => m.op === "unlock" && m.kinds?.includes("boss")));
});

test("BossCleared unlocks next region and cools cleared raid/bounty", () => {
  const muts = buildBossClearedOfferMutations("ironclad");
  assert.ok(muts.some((m) => m.region === "slagtown" && m.op === "unlock" && m.kinds?.includes("scout")));
  assert.ok(muts.some((m) => m.region === "slagtown" && m.op === "boost" && m.kinds?.includes("scout")));
  assert.ok(
    muts.some(
      (m) =>
        m.region === "ironclad" &&
        m.op === "cool" &&
        m.weight === 2 &&
        m.kinds?.includes("raid") &&
        m.kinds?.includes("bounty"),
    ),
  );
  assert.ok(!muts.some((m) => m.kinds?.includes("boss")));
});
