import assert from "node:assert/strict";
import test from "node:test";
import { settleBeatCueId } from "./settle-beat-audio";

test("skips vault_flash on MissionSettled", () => {
    assert.equal(settleBeatCueId({ beatId: "vault_flash", theater: "MissionSettled" }), undefined);
    assert.equal(settleBeatCueId({ beatId: "vault_flash" }, "MissionSettled"), undefined);
  });
test("plays vault_flash on TransferSettled / vault-primary", () => {
    assert.equal(settleBeatCueId({ beatId: "vault_flash", theater: "TransferSettled" }), "vault_flash");
    assert.equal(settleBeatCueId({ beatId: "vault_flash" }), "vault_flash");
  });
test("always plays intel_drop, boss_clear, raid_opened", () => {
    assert.equal(settleBeatCueId({ beatId: "intel_drop", theater: "MissionSettled" }), "intel_drop");
    assert.equal(settleBeatCueId({ beatId: "boss_clear", theater: "BossCleared" }), "boss_clear");
    assert.equal(settleBeatCueId({ beatId: "raid_opened" }), "raid_opened");
  });

