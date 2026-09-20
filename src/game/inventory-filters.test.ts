import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { inferWeaponLane, isAmmoItem, matchesCaliber, matchesInventoryCategory, matchesRegion, matchesWeaponLane } from "./inventory-filters";

describe("inventory filters", () => {
  it("splits ammo boxes out of chems", () => {
    assert.equal(isAmmoItem("consumable", ".308"), true);
    assert.equal(isAmmoItem("consumable", undefined), false);
    assert.equal(matchesInventoryCategory("consumable", ".308", "ammo"), true);
    assert.equal(matchesInventoryCategory("consumable", ".308", "consumable"), false);
    assert.equal(matchesInventoryCategory("consumable", undefined, "consumable"), true);
    assert.equal(matchesInventoryCategory("weapon", ".308", "weapon"), true);
    assert.equal(matchesInventoryCategory("weapon", ".308", "ammo"), false);
  });

  it("matches cartridge and continent", () => {
    assert.equal(matchesCaliber(".308", "all"), true);
    assert.equal(matchesCaliber(".308", ".308"), true);
    assert.equal(matchesCaliber(".308", "5.56"), false);
    assert.equal(matchesRegion("ironclad", "all"), true);
    assert.equal(matchesRegion("ironclad", "ironclad"), true);
    assert.equal(matchesRegion("veyra", "ironclad"), false);
  });

  it("splits weapons into rifles, melee, sidearms, shotguns, energy, heavy", () => {
    assert.equal(inferWeaponLane({ name: "Ironhide Broadsword", weaponFamily: "melee" }), "melee");
    assert.equal(inferWeaponLane({ name: "Chipped Throwing Knives" }), "melee");
    assert.equal(inferWeaponLane({ name: "Watchworks M14 Battle", weaponFamily: "rifle" }), "rifle");
    assert.equal(inferWeaponLane({ name: "Watchworks Service Pistol", weaponFamily: "pistol" }), "sidearm");
    assert.equal(inferWeaponLane({ name: "2753 Rail", weaponFamily: "heavy", ammoType: "rail" }), "heavy");
    assert.equal(inferWeaponLane({ name: "Surplus 2753 L8 Rifle", weaponFamily: "energy" }), "energy");
    assert.equal(matchesWeaponLane({ name: "Scuffed Lute" }, "melee"), true);
    assert.equal(matchesWeaponLane({ name: "Scuffed Lute" }, "rifle"), false);
  });
});
