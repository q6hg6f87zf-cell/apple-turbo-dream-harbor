import assert from "node:assert/strict";
import test from "node:test";
import {
  dayCycleIdleLead,
  dayCycleOfferStrip,
  isJournalTheater,
  isTheaterCopyKey,
  journalCopyFor,
  theaterCopyByKey,
  theaterCopyFor,
  theaterRegionLabel,
  THEATER_COPY_KEYS,
} from "./theater-copy.ts";
test("region labels use canon short names, never raw ids", () => {
  assert.equal(theaterRegionLabel("ironclad"), "Ironclad");
  assert.equal(theaterRegionLabel("slagtown"), "Slag Town");
  assert.equal(theaterRegionLabel("veyra"), "Veyra");
  assert.equal(theaterRegionLabel(null), "the Hollow");
});
test("MissionSettled intel / vault variants split by kind", () => {
  const intelRaid = theaterCopyFor({
    theater: "MissionSettled",
    beatId: "intel_drop",
    region: "slagtown",
    kind: "raid",
    intelDelta: 1,
    heatDelta: 3,
    performanceScore: 800,
    worldConsequence: null,
  });
  assert.match(intelRaid.headline, /Breach intel · Slag Town/);
  assert.equal(intelRaid.copyKey, "intel_drop_raid");
  assert.match(intelRaid.radio, /^Tyrone · /);
  const intelScout = theaterCopyFor({
    theater: "MissionSettled",
    beatId: "intel_drop",
    region: "ironclad",
    kind: "scout",
    intelDelta: 1,
    heatDelta: 1,
    performanceScore: 600,
    worldConsequence: null,
  });
  assert.match(intelScout.headline, /Scout intel · Ironclad/);
  assert.equal(intelScout.copyKey, "intel_drop_scout");
  const intelBoss = theaterCopyFor({
    theater: "MissionSettled",
    beatId: "intel_drop",
    region: "veyra",
    kind: "boss",
    intelDelta: 1,
    heatDelta: 8,
    performanceScore: 900,
    worldConsequence: null,
  });
  assert.match(intelBoss.headline, /Named intel · Veyra/);
  assert.equal(intelBoss.copyKey, "intel_drop_boss");
  const vaultRaid = theaterCopyFor({
    theater: "MissionSettled",
    beatId: "vault_flash",
    region: "blackspire",
    kind: "raid",
    intelDelta: 0,
    heatDelta: 3,
    performanceScore: 500,
    worldConsequence: null,
  });
  assert.match(vaultRaid.headline, /Vault 13 takes the breach · Blackspire/);
  assert.equal(vaultRaid.copyKey, "vault_flash_raid");
  const vaultBoss = theaterCopyFor({
    theater: "MissionSettled",
    beatId: "vault_flash",
    region: "veyra",
    kind: "boss",
    intelDelta: 0,
    heatDelta: 8,
    performanceScore: 500,
    worldConsequence: null,
  });
  assert.match(vaultBoss.headline, /Vault 13 seals the hill · Veyra/);
  assert.equal(vaultBoss.copyKey, "vault_flash_boss");
  const vaultScout = theaterCopyFor({
    theater: "MissionSettled",
    beatId: "vault_flash",
    region: "brasswater",
    kind: "scout",
    intelDelta: 0,
    heatDelta: 1,
    performanceScore: 400,
    worldConsequence: null,
  });
  assert.match(vaultScout.headline, /Vault 13 pulse · Brasswater/);
  assert.equal(vaultScout.copyKey, "vault_flash_scout");
  const scout = theaterCopyFor({
    theater: "MissionSettled",
    beatId: "mission_settle",
    region: "ironclad",
    kind: "scout",
    intelDelta: 0,
    heatDelta: 1,
    performanceScore: 600,
    worldConsequence: null,
  });
  assert.match(scout.headline, /Scout closed · Ironclad/);
});
test("RaidOpened foreshadow and BossCleared atlas scar / board seal", () => {
  const raid = theaterCopyFor({
    theater: "RaidOpened",
    beatId: "raid_opened",
    region: "blackspire",
    kind: "raid",
    intelDelta: 0,
    heatDelta: 2,
    performanceScore: null,
    worldConsequence: null,
  });
  assert.match(raid.headline, /Raid ticket live · Blackspire/);
  assert.match(raid.subline, /Kane/);
  assert.equal(raid.tone, "moon");
  assert.equal(raid.copyKey, "foreshadow_raid");
  const bossOpen = theaterCopyFor({
    theater: "RaidOpened",
    beatId: "raid_opened",
    region: "veyra",
    kind: "boss",
    intelDelta: 0,
    heatDelta: 4,
    performanceScore: null,
    worldConsequence: null,
  });
  assert.equal(bossOpen.copyKey, "foreshadow_boss");
  assert.match(bossOpen.subline, /hill has a name/i);
  const boss = theaterCopyFor({
    theater: "BossCleared",
    beatId: "boss_clear",
    region: "veyra",
    kind: "boss",
    intelDelta: 1,
    heatDelta: 8,
    performanceScore: 950,
    worldConsequence: null,
  });
  assert.match(boss.headline, /Atlas scar · Veyra/);
  assert.match(boss.subline, /Board seal|does not let you kill it twice/);
  assert.equal(boss.tone, "danger");
  assert.match(boss.radio, /Tyrone · /);
  assert.equal(boss.copyKey, "atlas_scar");
});
test("consequence-aware voice: scarred, grateful vault, colder intel", () => {
  const grateful = theaterCopyFor({
    theater: "MissionSettled",
    beatId: "vault_flash",
    region: "slagtown",
    kind: "forage",
    intelDelta: 0,
    heatDelta: 1,
    performanceScore: 820,
    worldConsequence: null,
  });
  assert.match(grateful.headline, /Vault 13 grateful · Slag Town/);
  assert.equal(grateful.copyKey, "grateful_vault");
  assert.match(grateful.radio, /^SYNAPSE · /);
  const colder = theaterCopyFor({
    theater: "MissionSettled",
    beatId: "intel_drop",
    region: "ironclad",
    kind: "scout",
    intelDelta: 2,
    heatDelta: 1,
    performanceScore: 700,
    worldConsequence: null,
  });
  assert.match(colder.headline, /Colder intel · Ironclad/);
  assert.equal(colder.copyKey, "colder_intel");
  const scarredRaid = theaterCopyFor(
    {
      theater: "MissionSettled",
      beatId: "vault_flash",
      region: "blackspire",
      kind: "raid",
      intelDelta: 0,
      heatDelta: 3,
      performanceScore: 400,
      worldConsequence: null,
    },
    { scarred: true },
  );
  assert.match(scarredRaid.subline, /glowing rim|scar/i);
  const fromCtx = theaterCopyFor(
    {
      theater: "MissionSettled",
      beatId: "mission_settle",
      region: "brasswater",
      kind: "trade",
      intelDelta: 0,
      heatDelta: 0,
      performanceScore: 500,
      worldConsequence: null,
    },
    { copyKey: "next_offer_boost" },
  );
  assert.match(fromCtx.headline, /Board leans hard · Brasswater/);
  assert.equal(fromCtx.copyKey, "next_offer_boost");
  const fromMutation = theaterCopyFor({
    theater: "MissionSettled",
    beatId: "mission_settle",
    region: "slagtown",
    kind: "raid",
    intelDelta: 0,
    heatDelta: 3,
    performanceScore: 500,
    worldConsequence: {
      offerMutations: [
        {
          op: "cool",
          region: "slagtown",
          reason: "post-raid",
          copyKey: "next_offer_cool",
        },
      ],
    },
  });
  assert.match(fromMutation.headline, /Board cools · Slag Town/);
  assert.equal(fromMutation.copyKey, "next_offer_cool");
});
test("theaterCopyByKey covers scar / grateful / colder / board hooks", () => {
  const scar = theaterCopyByKey("scar_sector", "veyra");
  assert.match(scar.headline, /Scarred sector · Veyra/);
  assert.equal(scar.tone, "danger");
  const seal = theaterCopyByKey("board_seal", "ironclad");
  assert.match(seal.headline, /Board seal · Ironclad/);
  const foreshadow = theaterCopyByKey("foreshadow_raid", "blackspire");
  assert.match(foreshadow.radio, /^Tyrone · /);
});

test("THEATER_COPY_KEYS are snake_case only (Canon lock)", () => {
  for (const key of THEATER_COPY_KEYS) {
    assert.equal(key.includes("-"), false, `kebab forbidden: ${key}`);
    assert.ok(isTheaterCopyKey(key));
  }
  assert.equal(isTheaterCopyKey("scarred-sector"), false);
  assert.equal(isTheaterCopyKey("scar_sector"), true);
});

test("journalCopyFor covers four Bible-6 theaters; RaidOpened excluded", () => {
  const settled = journalCopyFor({
    theater: "MissionSettled",
    beatId: "vault_flash",
    region: "slagtown",
    kind: "raid",
    intelDelta: 0,
    heatDelta: 3,
    performanceScore: 500,
    worldConsequence: null,
  });
  assert.ok(settled);
  assert.equal(settled!.copyKey, "vault_flash_raid");
  assert.match(settled!.headline, /Vault 13 takes the breach · Slag Town/);
  assert.match(settled!.radio, /^SYNAPSE · /);
  assert.equal("body" in settled!, false);

  const boss = journalCopyFor({
    theater: "BossCleared",
    beatId: "boss_clear",
    region: "veyra",
    kind: "boss",
    intelDelta: 1,
    heatDelta: 8,
    performanceScore: 950,
    worldConsequence: null,
  });
  assert.ok(boss);
  assert.equal(boss!.copyKey, "atlas_scar");
  assert.match(boss!.radio, /^Tyrone · /);

  const transfer = journalCopyFor({
    theater: "TransferSettled",
    beatId: "transfer_flash",
    region: null,
    kind: null,
    intelDelta: 0,
    heatDelta: 0,
    performanceScore: null,
    worldConsequence: null,
  });
  assert.ok(transfer);
  assert.equal(transfer!.copyKey, null);
  assert.match(transfer!.radio, /Transfer settled/);

  const dawn = journalCopyFor({
    theater: "DayAdvanced",
    beatId: "day_advance",
    region: null,
    kind: null,
    intelDelta: 0,
    heatDelta: 0,
    performanceScore: null,
    worldConsequence: null,
  });
  assert.ok(dawn);
  assert.equal(dawn!.copyKey, null);
  assert.match(dawn!.radio, /board is new/i);

  assert.equal(isJournalTheater("RaidOpened"), false);
  assert.equal(
    journalCopyFor({
      theater: "RaidOpened",
      beatId: "raid_opened",
      region: "blackspire",
      kind: "raid",
      intelDelta: 0,
      heatDelta: 2,
      performanceScore: null,
      worldConsequence: null,
    }),
    null,
  );
});

test("dayCycleIdleLead prioritizes crisis / unanswered / tribute / heat / offer ops", () => {
  const boost = dayCycleIdleLead({ region: "slagtown", offerOp: "boost" });
  assert.equal(boost.copyKey, "next_offer_boost");
  assert.match(boost.headline, /Board leans hard · Slag Town/);
  assert.match(boost.radio, /Kane|boosted/i);

  const unlock = dayCycleOfferStrip("unlock", "blackspire");
  assert.equal(unlock.copyKey, "next_offer_unlock");
  assert.match(unlock.radio, /^Tyrone · /);

  const cool = dayCycleOfferStrip("cool", "veyra");
  assert.equal(cool.copyKey, "next_offer_cool");
  assert.match(cool.radio, /^SYNAPSE · /);

  const crisis = dayCycleIdleLead({ region: "ironclad", hasCrisis: true });
  assert.match(crisis.headline, /Crisis on the board · Ironclad/);
  assert.equal(crisis.tone, "danger");

  const residue = dayCycleIdleLead({ region: "slagtown", crisisResidue: true });
  assert.match(residue.headline, /Crisis residue · Slag Town/);
  assert.match(residue.subline, /rewrote tomorrow/i);

  const unanswered = dayCycleIdleLead({ unansweredWatches: 3 });
  assert.match(unanswered.headline, /Unanswered watches · 3/);

  const tribute = dayCycleIdleLead({ region: "brasswater", hasTribute: true });
  assert.match(tribute.headline, /Kane tribute live · Brasswater/);

  const heat = dayCycleIdleLead({ kaneHeat: 12 });
  assert.match(heat.headline, /Kane heat high · 12/);
});
