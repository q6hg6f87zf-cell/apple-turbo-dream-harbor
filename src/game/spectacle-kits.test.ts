import assert from "node:assert/strict";
import test from "node:test";
import { settleSpectacleKitsFor, type SettleSpectacleBeat } from "./spectacle-kits.ts";

test("MissionSettled default fires vault flash only", () => {
  const beat: SettleSpectacleBeat = {
    theater: "MissionSettled",
    beatId: "mission-cleared",
    intelDelta: 0,
  };
  const kits = settleSpectacleKitsFor(beat);
  assert.equal(kits.vaultFlash, true);
  assert.equal(kits.intelTick, false);
  assert.equal(kits.bossUpgrade, false);
  assert.equal(kits.dayBoardPulse, true);
});

test("intel-spike fires vault flash + intel tick", () => {
  const beat: SettleSpectacleBeat = {
    theater: "MissionSettled",
    beatId: "intel-spike",
    intelDelta: 3,
    region: "ironclad",
    kind: "scout",
  };
  const kits = settleSpectacleKitsFor(beat);
  assert.equal(kits.vaultFlash, true);
  assert.equal(kits.intelTick, true);
  assert.equal(kits.bossUpgrade, false);
  assert.equal(kits.atlasScar, true);
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
  const kits = settleSpectacleKitsFor(beat);
  assert.equal(kits.vaultFlash, true);
  assert.equal(kits.intelTick, false);
  assert.equal(kits.bossUpgrade, true);
});

test("null beat fires nothing", () => {
  const kits = settleSpectacleKitsFor(null);
  assert.equal(kits.vaultFlash, false);
  assert.equal(kits.intelTick, false);
  assert.equal(kits.bossUpgrade, false);
  assert.equal(kits.dayBoardPulse, false);
});

test("vault_flash alias fires vault flash", () => {
  const beat: SettleSpectacleBeat = {
    theater: "MissionSettled",
    beatId: "vault_flash",
    intelDelta: 0,
  };
  assert.equal(settleSpectacleKitsFor(beat).vaultFlash, true);
  assert.equal(settleSpectacleKitsFor(beat).dayBoardPulse, true);
});

test("intel_drop alias fires vault flash + soft intel tick", () => {
  const beat: SettleSpectacleBeat = {
    theater: "MissionSettled",
    beatId: "intel_drop",
  };
  const kits = settleSpectacleKitsFor(beat);
  assert.equal(kits.vaultFlash, true);
  assert.equal(kits.intelTick, true);
  assert.equal(kits.intelSoft, true);
});

test("boss_clear alias upgrades boss kit", () => {
  const beat: SettleSpectacleBeat = {
    theater: "BossCleared",
    beatId: "boss_clear",
    kind: "boss",
  };
  assert.equal(settleSpectacleKitsFor(beat).bossUpgrade, true);
  assert.equal(settleSpectacleKitsFor(beat).vaultFlash, true);
});
