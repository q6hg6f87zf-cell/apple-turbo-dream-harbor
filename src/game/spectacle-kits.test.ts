import assert from "node:assert/strict";
import test from "node:test";
import { settleSpectacleKitsFor, type SettleSpectacleBeat } from "./spectacle-kits.ts";

test("MissionSettled default fires vault flash + day-board (no region → no scar)", () => {
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
    atlasScar: false,
    atlasHeal: false,
    dayBoardPulse: true,
  });
});

test("intel-spike fires vault flash + intel tick + scar when region set", () => {
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
    atlasScar: true,
    atlasHeal: false,
    dayBoardPulse: true,
  });
});

test("intelDelta > 0 without beatId still triggers intel tick", () => {
  const beat: SettleSpectacleBeat = {
    theater: "MissionSettled",
    intelDelta: 2,
  };
  const kits = settleSpectacleKitsFor(beat);
  assert.equal(kits.intelTick, true);
  assert.equal(kits.vaultFlash, true);
  assert.equal(kits.intelSoft, false);
});

test("BossCleared soft-upgrades with vault flash", () => {
  const beat: SettleSpectacleBeat = {
    theater: "BossCleared",
    beatId: "boss-cleared",
    kind: "boss",
    intelDelta: 0,
  };
  assert.equal(settleSpectacleKitsFor(beat).vaultFlash, true);
  assert.equal(settleSpectacleKitsFor(beat).bossUpgrade, true);
  assert.equal(settleSpectacleKitsFor(beat).dayBoardPulse, true);
});

test("null beat fires nothing", () => {
  assert.deepEqual(settleSpectacleKitsFor(null), {
    vaultFlash: false,
    intelTick: false,
    intelSoft: false,
    bossUpgrade: false,
    atlasScar: false,
    atlasHeal: false,
    dayBoardPulse: false,
  });
});

test("Forge vault_flash aliases to vault flash kit", () => {
  const beat: SettleSpectacleBeat = {
    theater: "MissionSettled",
    beatId: "vault_flash",
    intelDelta: 0,
  };
  assert.equal(settleSpectacleKitsFor(beat).vaultFlash, true);
  assert.equal(settleSpectacleKitsFor(beat).intelTick, false);
});

test("Forge intel_drop with intelDelta fires intel tick", () => {
  const beat: SettleSpectacleBeat = {
    theater: "MissionSettled",
    beatId: "intel_drop",
    intelDelta: 4,
  };
  const kits = settleSpectacleKitsFor(beat);
  assert.equal(kits.vaultFlash, true);
  assert.equal(kits.intelTick, true);
  assert.equal(kits.intelSoft, false);
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

test("MissionSettled with region scars atlas + day-board pulse", () => {
  const beat: SettleSpectacleBeat = {
    theater: "MissionSettled",
    beatId: "vault_flash",
    region: "slagtown",
    intelDelta: 0,
  };
  const kits = settleSpectacleKitsFor(beat);
  assert.equal(kits.atlasScar, true);
  assert.equal(kits.atlasHeal, false);
  assert.equal(kits.dayBoardPulse, true);
});

test("cool offerMutation with region heals atlas instead of scar", () => {
  const beat: SettleSpectacleBeat = {
    theater: "MissionSettled",
    beatId: "vault_flash",
    region: "veyra",
    offerMutations: [{ op: "cool", region: "veyra" }],
  };
  const kits = settleSpectacleKitsFor(beat);
  assert.equal(kits.atlasHeal, true);
  assert.equal(kits.atlasScar, false);
  assert.equal(kits.dayBoardPulse, true);
});

test("negative heatDelta with region heals atlas", () => {
  const beat: SettleSpectacleBeat = {
    theater: "MissionSettled",
    beatId: "vault_flash",
    region: "brasswater",
    heatDelta: -2,
  };
  const kits = settleSpectacleKitsFor(beat);
  assert.equal(kits.atlasHeal, true);
  assert.equal(kits.atlasScar, false);
});
