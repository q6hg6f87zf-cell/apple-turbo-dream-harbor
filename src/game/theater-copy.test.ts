import assert from "node:assert/strict";
import test from "node:test";
import { theaterCopyFor, theaterRegionLabel } from "./theater-copy.ts";

test("region labels use canon short names, never raw ids", () => {
  assert.equal(theaterRegionLabel("ironclad"), "Ironclad");
  assert.equal(theaterRegionLabel("slagtown"), "Slag Town");
  assert.equal(theaterRegionLabel("veyra"), "Veyra");
  assert.equal(theaterRegionLabel(null), "the Hollow");
});

test("MissionSettled intel / vault / raid / scout copy is elite, not placeholder", () => {
  const intel = theaterCopyFor({
    theater: "MissionSettled",
    beatId: "intel_drop",
    region: "slagtown",
    kind: "raid",
    intelDelta: 2,
    performanceScore: 800,
  });
  assert.match(intel.headline, /Intel spike · Slag Town/);
  assert.doesNotMatch(intel.headline, /Mission settled/i);
  assert.ok(intel.subline.length > 20);
  assert.match(intel.radio, /^Tyrone · /);

  const vault = theaterCopyFor({
    theater: "MissionSettled",
    beatId: "vault_flash",
    region: "brasswater",
    kind: "forage",
    intelDelta: 0,
    performanceScore: 500,
  });
  assert.match(vault.headline, /Vault 13 pulse · Brasswater/);

  const scout = theaterCopyFor({
    theater: "MissionSettled",
    beatId: "mission_settle",
    region: "ironclad",
    kind: "scout",
    intelDelta: 0,
    performanceScore: 600,
  });
  assert.match(scout.headline, /Scout closed · Ironclad/);
});

test("RaidOpened and BossCleared speak Moon Squad fantasy-tech", () => {
  const raid = theaterCopyFor({
    theater: "RaidOpened",
    beatId: "raid_opened",
    region: "blackspire",
    kind: "raid",
    intelDelta: 0,
    performanceScore: null,
  });
  assert.match(raid.headline, /Raid ticket live · Blackspire/);
  assert.match(raid.subline, /Kane/);
  assert.equal(raid.tone, "moon");

  const boss = theaterCopyFor({
    theater: "BossCleared",
    beatId: "boss_clear",
    region: "veyra",
    kind: "boss",
    intelDelta: 1,
    performanceScore: 950,
  });
  assert.match(boss.headline, /Named hill falls · Veyra/);
  assert.match(boss.subline, /does not let you kill it twice/);
  assert.equal(boss.tone, "danger");
  assert.match(boss.radio, /Tyrone · /);
});
