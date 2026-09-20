import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CLASS_BASE } from "./data-legacy";
import { computeStats, forgeOperative } from "./engine";
import { bandForRoll, fateLanding, scoreFromDice, STAT_COPY, STAT_ORDER, tyroneOnStat } from "./stats-copy";

describe("body dice", () => {
  it("maps a 10 to the class floor and swings two points per modifier", () => {
    assert.equal(scoreFromDice(8, 10), 8);
    assert.equal(scoreFromDice(8, 20), 13);
    assert.equal(scoreFromDice(8, 1), 4);
    assert.equal(scoreFromDice(2, 1), 1);
  });

  it("names every roll so the forge never assumes the player knows", () => {
    for (const key of STAT_ORDER) {
      const copy = STAT_COPY[key];
      assert.ok(copy.name.length > 2);
      assert.ok(copy.does.length > 24);
      assert.ok(copy.checks.length > 12);
    }
    assert.equal(bandForRoll(3).label, "Cursed");
    assert.equal(bandForRoll(10).label, "Steady");
    assert.equal(bandForRoll(20).label, "Hollow-touched");
    assert.match(tyroneOnStat("STR", 20, true), /Hollow-touched|primary|Strength/i);
  });

  it("prints the landed fate buff instead of category flavor", () => {
    const warlord = fateLanding("Warrior", "rep", 17);
    assert.equal(warlord.title, "The Warlord of Ash");
    assert.match(warlord.buff, /command allies/i);
    const weak = fateLanding("Warrior", "trait", 2);
    assert.equal(weak.title, "Weakened");
    assert.match(weak.buff, /Strength/);
    assert.match(weak.buff, /-1/);
    const skill = fateLanding("Warrior", "skill", 16);
    assert.equal(skill.title, "Execution Strike");
    assert.match(skill.buff, /below half HP/i);
    const shadow = fateLanding("Warrior", "shadow", 12);
    assert.equal(shadow.title, "The War Fatigue");
    assert.match(shadow.buff, /Extended combat/i);
    const enchant = fateLanding("Warrior", "enchant", 9);
    assert.equal(enchant.title, "The Unbreaking");
    assert.match(enchant.buff, /destroyed|disarmed/i);
  });

  it("stamps statDice on a new rider and leaves old saves on the class floor", () => {
    const rolled = forgeOperative({
      name: "Rook",
      cls: "Warrior",
      race: "Ironclad-born",
      lineage: "Gate-Warden",
      origin: "Ironclad",
      day: 1,
      rolls: {
        rep: 10,
        trait: 10,
        skill: 10,
        shadow: 10,
        enchant: 10,
        destiny: 10,
        STR: 20,
        DEF: 10,
        INT: 10,
        WIS: 10,
        SPD: 10,
        CHA: 10,
        LCK: 10,
      },
    });
    assert.equal(rolled.statDice?.STR, 20);
    const stats = computeStats(rolled);
    const floor = CLASS_BASE.Warrior.STR;
    assert.equal(stats.STR >= floor + 5, true);

    const legacy = forgeOperative({
      name: "Old",
      cls: "Warrior",
      race: "Ironclad-born",
      lineage: "Gate-Warden",
      origin: "Ironclad",
      day: 1,
      rolls: { rep: 10, trait: 10, skill: 10, shadow: 10, enchant: 10, destiny: 10 },
    });
    delete (legacy as { statDice?: unknown }).statDice;
    const plain = computeStats(legacy);
    assert.equal(plain.STR, CLASS_BASE.Warrior.STR + 1 + 1);
  });
});
