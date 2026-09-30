import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSheet, crateRead, medicineHeal, recommendTags, repairSteps, skillMod, spendPoint, beatSkill } from "./skills.ts";
import { travisTagsFrom, travisVerdict } from "./travis-cog.ts";
import type { SkillId, Stats } from "./types.ts";
import type { GameState } from "./types.ts";

const stats: Stats = { STR: 14, DEF: 10, INT: 12, WIS: 8, SPD: 11, CHA: 9, LCK: 10 };

describe("skill sheet", () => {
  it("builds from the body and pays fifteen for a tag", () => {
    const sheet = buildSheet(stats, ["guns", "repair", "speech"], ["guns", "repair", "speech"], 0);
    assert.equal(sheet.tags.length, 3);
    assert.ok(sheet.values.guns > sheet.values.energy);
    assert.equal(sheet.values.guns - buildSheet(stats, ["repair", "speech", "sneak"], [], 0).values.guns, 15);
    assert.equal(sheet.points, 8 + Math.floor(stats.INT / 2));
  });

  it("banks earlier ranks onto the bench", () => {
    const sheet = buildSheet(stats, ["melee", "sneak", "barter"], ["melee", "sneak", "barter"], 7);
    assert.equal(sheet.points, 8 + Math.floor(stats.INT / 2) + 7);
  });

  it("spends one point and will not pass 100", () => {
    const sheet = buildSheet(stats, ["guns", "repair", "speech"], [], 0);
    sheet.values.guns = 100;
    sheet.points = 4;
    assert.match(spendPoint(sheet, "guns") ?? "", /capped/);
    assert.equal(sheet.points, 4);
    const msg = spendPoint(sheet, "repair", 3);
    assert.equal(msg, null);
    assert.equal(sheet.points, 1);
  });

  it("moves the die every twelve past 25", () => {
    assert.equal(skillMod(25), 0);
    assert.equal(skillMod(37), 1);
    assert.equal(skillMod(13), -1);
    assert.equal(skillMod(100), 6);
  });

  it("maps a merchant beat to Barter and a STR beat to Melee", () => {
    assert.equal(beatSkill("CHA", "merchant"), "barter");
    assert.equal(beatSkill("STR", "check"), "melee");
    assert.equal(beatSkill("INT", "check"), "science");
  });

  it("lets Lockpick name the ticking crate", () => {
    const sheet = buildSheet(stats, ["lockpick", "guns", "speech"], [], 0);
    sheet.values.lockpick = 46;
    const state = { skillSheet: sheet } as GameState;
    const line = crateRead(state, [
      { id: "a", label: "Warm", result: "trap" },
      { id: "b", label: "Quiet", result: "good" },
      { id: "c", label: "Named", result: "junk" },
    ]);
    assert.match(line ?? "", /Warm/);
    assert.doesNotMatch(line ?? "", /Quiet/);
    sheet.values.lockpick = 66;
    const both = crateRead(state, [
      { id: "a", label: "Warm", result: "trap" },
      { id: "b", label: "Quiet", result: "good" },
    ]);
    assert.match(both ?? "", /Quiet/);
  });

  it("repairs twice and heals harder when the number is high", () => {
    assert.equal(repairSteps(30), 1);
    assert.equal(repairSteps(55), 2);
    assert.ok(medicineHeal(60) > medicineHeal(10));
  });
});

describe("Travis cognitive", () => {
  it("stamps the skills you actually answered toward", () => {
    const picks: Record<string, string> = {
      tick: "cut",
      wheel: "pull",
      price: "gun",
      shepherd: "burn",
      berm: "light",
      crates: "warm",
      guitar: "tune",
      watch: "pays",
    };
    const tags = travisTagsFrom(picks);
    assert.equal(tags.length, 3);
    assert.ok(tags.includes("explosives"));
    assert.match(travisVerdict(tags), /bend toward/);
  });

  it("breaks ties on the skill list, not on a coin flip", () => {
    const tags = recommendTags({ guns: 2, energy: 2, melee: 2, speech: 1 } as Partial<Record<SkillId, number>>);
    assert.deepEqual(tags, ["guns", "energy", "melee"]);
  });
});
