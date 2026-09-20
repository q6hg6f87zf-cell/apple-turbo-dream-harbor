import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { coupleAmmo, gradeFromLoad, gunQuality, weaponDiceMod } from "./ammo-matrix";
import type { Item } from "./types";

function gun(over: Partial<Item> = {}): Item {
  return {
    id: "g",
    name: "Watchworks M16 Service",
    kind: "weapon",
    rarity: "Uncommon",
    condition: "Pristine",
    effect: "5.56",
    lore: "",
    value: 900,
    ammoType: "5.56",
    accuracy: 1,
    ...over,
  };
}

describe("ammo matrix", () => {
  it("reads grades from box names", () => {
    assert.equal(gradeFromLoad("5.56 Surplus Crate"), "surplus");
    assert.equal(gradeFromLoad("5.56 Box"), "ball");
    assert.equal(gradeFromLoad("Watchworks .308 Match Box"), "match");
    assert.equal(gradeFromLoad("Surplus 2753 .308 AP Box"), "special");
  });

  it("wastes special ammo in a cheap worn gun", () => {
    const cheap = gunQuality({ rarity: "Common", condition: "Worn" });
    const waste = coupleAmmo(cheap, 1, { ap: 2, accuracy: 2, damage: 2 });
    const match = coupleAmmo(0.9, 1, { ap: 2, accuracy: 2, damage: 2 });
    assert.ok(waste.efficiency < 0.25, `cheap+special should be weak, got ${waste.efficiency}`);
    assert.ok(match.efficiency > 0.7, `mythic+special should sing, got ${match.efficiency}`);
    assert.ok(waste.ap < match.ap);
    assert.ok(waste.wasted > match.wasted);
  });

  it("lets a true rifle keep some of a surplus load, but not max", () => {
    const goodBad = coupleAmmo(0.9, 0, { ap: 0, accuracy: 0, damage: 0 });
    const goodGood = coupleAmmo(0.9, 1, { ap: 2, accuracy: 2, damage: 2 });
    assert.ok(goodBad.efficiency < goodGood.efficiency);
    assert.ok(goodBad.accuracy <= 1);
  });

  it("feeds dice from rarity and condition", () => {
    const mythic = weaponDiceMod(gun({ rarity: "Mythic", condition: "Pristine", accuracy: 3 }), "STR");
    const junk = weaponDiceMod(gun({ rarity: "Common", condition: "Damaged", accuracy: 0 }), "STR");
    assert.ok(mythic >= junk + 3, `mythic ${mythic} vs junk ${junk}`);
  });
});
