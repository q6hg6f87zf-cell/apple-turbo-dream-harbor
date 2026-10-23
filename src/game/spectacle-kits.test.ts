import assert from "node:assert/strict";
import test from "node:test";
import { settleSpectacleKitsFor, type SettleSpectacleBeat } from "./spectacle-kits.ts";

test("MissionSettled default fires vault flash only", () => {
  const beat: SettleSpectacleBeat = {
    theater: "MissionSettled",
    beatId: "mission-cleared",
    intelDelta: 0,
  };
  assert.deepEqual(settleSpectacleKitsFor(beat), {
    vaultFlash: true,
    intelTick: false,
    bossUpgrade: false,
  });
});

test("intel-spike fires vault flash + intel tick", () => {
  const beat: SettleSpectacleBeat = {
    theater: "MissionSettled",
    beatId: "intel-spike",
    intelDelta: 3,
    region: "ironclad",
    kind: "scout",
  };
  assert.deepEqual(settleSpectacleKitsFor(beat), {
    vaultFlash: true,
    intelTick: true,
    bossUpgrade: false,
  });
});

test("intelDelta > 0 without beatId still triggers intel tick", () => {
  const beat: SettleSpectacleBeat = {
    theater: "MissionSettled",
    intelDelta: 2,
  };
  assert.equal(settleSpectacleKitsFor(beat).intelTick, true);
  assert.equal(settleSpectacleKitsFor(beat).vaultFlash, true);
});

test("BossCleared soft-upgrades with vault flash", () => {
  const beat: SettleSpectacleBeat = {
    theater: "BossCleared",
    beatId: "boss-cleared",
    kind: "boss",
    intelDelta: 0,
  };
  assert.deepEqual(settleSpectacleKitsFor(beat), {
    vaultFlash: true,
    intelTick: false,
    bossUpgrade: true,
  });
});

test("null beat fires nothing", () => {
  assert.deepEqual(settleSpectacleKitsFor(null), {
    vaultFlash: false,
    intelTick: false,
    bossUpgrade: false,
  });
});
