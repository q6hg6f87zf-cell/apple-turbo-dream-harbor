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
    intelSoft: false,
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
    intelSoft: false,
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
  assert.equal(settleSpectacleKitsFor(beat).intelSoft, false);
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
    intelSoft: false,
    bossUpgrade: true,
  });
});

test("null beat fires nothing", () => {
  assert.deepEqual(settleSpectacleKitsFor(null), {
    vaultFlash: false,
    intelTick: false,
    intelSoft: false,
    bossUpgrade: false,
  });
});

test("Forge vault_flash aliases to vault flash kit", () => {
  const beat: SettleSpectacleBeat = {
    theater: "MissionSettled",
    beatId: "vault_flash",
    intelDelta: 0,
  };
  assert.deepEqual(settleSpectacleKitsFor(beat), {
    vaultFlash: true,
    intelTick: false,
    intelSoft: false,
    bossUpgrade: false,
  });
});

test("Forge intel_drop with intelDelta fires intel tick", () => {
  const beat: SettleSpectacleBeat = {
    theater: "MissionSettled",
    beatId: "intel_drop",
    intelDelta: 4,
  };
  assert.deepEqual(settleSpectacleKitsFor(beat), {
    vaultFlash: true,
    intelTick: true,
    intelSoft: false,
    bossUpgrade: false,
  });
});

test("Forge intel_drop without delta uses soft intel (no fake +N)", () => {
  const beat: SettleSpectacleBeat = {
    theater: "MissionSettled",
    beatId: "intel_drop",
    intelDelta: 0,
  };
  const kits = settleSpectacleKitsFor(beat);
  assert.equal(kits.vaultFlash, true);
  assert.equal(kits.intelTick, true);
  assert.equal(kits.intelSoft, true);
});

test("Forge boss_clear aliases to boss upgrade vault flash", () => {
  const beat: SettleSpectacleBeat = {
    theater: "BossCleared",
    beatId: "boss_clear",
    kind: "boss",
  };
  assert.equal(settleSpectacleKitsFor(beat).vaultFlash, true);
  assert.equal(settleSpectacleKitsFor(beat).bossUpgrade, true);
});
