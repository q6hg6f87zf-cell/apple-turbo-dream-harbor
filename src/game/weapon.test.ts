import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ARSENAL_CATALOG, arsenalByName, arsenalUnlocked, CALIBER_ROSTER, campaignOpenRegions } from "./arsenal";
import { defaultState, forgeOperative, makeItem, syncWorldUnlocks } from "./engine";
import { HOLLOW_CATALOG } from "./hollow-catalog";
import { rollMarket } from "./market";
import { VILLAINS } from "./data-legacy";
import {
  applyArmor,
  attachPart,
  canAttachPart,
  magLine,
  rangeHitMod,
  reloadWeapon,
  resolveWeapon,
  spendShot,
} from "./weapon-ops";
import type { Combatant, GameState, Item, Operative } from "./types";

function file(): GameState {
  const s = defaultState();
  s.started = true;
  s.screen = "hq";
  s.playerName = "Brent";
  s.rooms.forge = 1;
  return s;
}

function rider(s: GameState): Operative {
  const op = forgeOperative({
    name: "Rook",
    cls: "Warrior",
    race: "Human",
    lineage: "",
    origin: "Ironclad",
    day: s.day,
    rolls: { rep: 10, trait: 10, skill: 10, shadow: 10, enchant: 10, destiny: 10 },
  });
  s.operatives = [op, ...s.operatives];
  return op;
}

function gun(name = "Watchworks M16 Service"): Item {
  const cat = arsenalByName(name)!;
  return makeItem({
    ...cat,
    condition: "Pristine",
    slot: "weapon",
    equipped: true,
    mag: cat.magSize,
    magSize: cat.magSize,
  });
}

function part(name: string): Item {
  const cat = arsenalByName(name)!;
  return makeItem({
    ...cat,
    condition: "Pristine",
  });
}

function foe(partial: Partial<Combatant>): Combatant {
  return {
    id: "e1",
    name: "Plate",
    hp: 20,
    maxHp: 20,
    atk: 4,
    def: 4,
    dc: 12,
    tags: [],
    flavor: "",
    ...partial,
  };
}

describe("arsenal catalog", () => {
  it("expands well past the old field list", () => {
    assert.ok(ARSENAL_CATALOG.length >= 150, `got ${ARSENAL_CATALOG.length}`);
    assert.ok(HOLLOW_CATALOG.length > 180, `got ${HOLLOW_CATALOG.length}`);
    assert.ok(ARSENAL_CATALOG.some((r) => r.kind === "weapon" && r.weaponFamily === "rifle"));
    assert.ok(ARSENAL_CATALOG.some((r) => r.kind === "attachment" && r.attachmentSlot === "optic"));
    assert.ok(ARSENAL_CATALOG.some((r) => r.ammoType === "5.56" && r.kind === "consumable"));
  });

  it("does not clone the named legendaries already in the field catalog", () => {
    assert.equal(HOLLOW_CATALOG.filter((r) => r.name === "Railspike Carbine").length, 1);
    assert.equal(HOLLOW_CATALOG.filter((r) => r.name === "Obsidian Coilgun").length, 1);
  });

  it("chambers real rifle models and hunting calibers", () => {
    assert.ok(arsenalByName("Watchworks M4 Carbine"));
    assert.ok(arsenalByName("Watchworks M16 Service"));
    assert.ok(arsenalByName("Watchworks M94 Lever")?.ammoType === ".30-30");
    assert.ok(arsenalByName("Watchworks M336 Brush")?.ammoType === ".30-30");
    assert.ok(arsenalByName("Watchworks M700 Survey")?.ammoType === ".270");
    assert.ok(arsenalByName("Watchworks M70 Springfield")?.ammoType === ".30-06");
    assert.ok(arsenalByName("Watchworks M14 Battle")?.ammoType === ".308");
    assert.ok(arsenalByName("Watchworks M10 Battle")?.ammoType === ".308");
    assert.ok(arsenalByName("Watchworks M24 Marksman")?.ammoType === ".308");
    assert.ok(arsenalByName("Watchworks M70 Magnum")?.ammoType === ".300");
    assert.ok(ARSENAL_CATALOG.some((r) => r.kind === "consumable" && r.ammoType === ".30-06"));
    assert.ok(ARSENAL_CATALOG.some((r) => r.name.includes("Bonded") && r.ammoType === ".308"));
    assert.ok(ARSENAL_CATALOG.some((r) => r.name.includes("Hot Load") && r.ammoType === ".30-30"));
  });

  it("hydrates old Service Rifle names onto M16", () => {
    assert.equal(arsenalByName("Watchworks Service Rifle")?.name, "Watchworks M16 Service");
    assert.equal(arsenalByName("Furnace Court Service Rifle")?.name, "Furnace Court M14");
  });

  it("keeps lasers locked to later arcs, not a ten-day calendar", () => {
    const pulse = arsenalByName("Nine-Lift L4 Pulse")!;
    const carbine = arsenalByName("Dockcoil L6 Carbine")!;
    const long = arsenalByName("Surplus 2753 L8 Rifle")!;
    const l9 = arsenalByName("Surplus 2753 L9 Long")!;
    assert.equal(pulse.ammoType, "laser");
    const early = { day: 10, open: campaignOpenRegions(10) };
    assert.equal(arsenalUnlocked(pulse, early), false);
    assert.equal(arsenalUnlocked(carbine, early), false);
    assert.equal(arsenalUnlocked(long, early), false);
    assert.equal(arsenalUnlocked(l9, early), false);
    assert.ok(!early.open.includes("veyra"));
    assert.ok(!early.open.includes("blackspire"));

    const afterSlag = { day: 20, open: ["ironclad", "slagtown", "blackspire"] as const };
    assert.equal(arsenalUnlocked(pulse, { day: 20, open: [...afterSlag.open] }), true);
    assert.equal(arsenalUnlocked(carbine, { day: 20, open: [...afterSlag.open] }), false);

    const afterBrass = { day: 30, open: ["ironclad", "slagtown", "blackspire", "brasswater"] as const };
    assert.equal(arsenalUnlocked(carbine, { day: 30, open: [...afterBrass.open] }), true);
    assert.equal(arsenalUnlocked(long, { day: 30, open: [...afterBrass.open] }), false);

    const veyra = { day: 40, open: ["ironclad", "slagtown", "blackspire", "brasswater", "veyra"] as const };
    assert.equal(arsenalUnlocked(long, { day: 40, open: [...veyra.open] }), true);
    assert.equal(arsenalUnlocked(l9, { day: 40, open: [...veyra.open] }), true);

    const dayOne = rollMarket(1);
    assert.ok(!dayOne.lots.some((l) => l.ammoType === "laser"));
    const dayTen = rollMarket(10);
    assert.ok(!dayTen.lots.some((l) => l.ammoType === "laser"), JSON.stringify(dayTen.lots.map((l) => l.name)));
  });

  it("does not open Veyra by resting ten days", () => {
    const s = file();
    s.day = 10;
    syncWorldUnlocks(s);
    assert.equal(s.locations.ironclad.unlocked, true);
    assert.equal(s.locations.kingdom.unlocked, false);
    assert.equal(s.locations.veyra.unlocked, false);
    s.day = 40;
    s.locations.library.bossDefeated = true;
    syncWorldUnlocks(s);
    assert.equal(s.locations.veyra.unlocked, true);
  });

  it("lists every roster model", () => {
    assert.equal(CALIBER_ROSTER.length, 14);
    assert.ok(CALIBER_ROSTER.every((row) => FRAMES_HAVE(row.model)));
  });
});

function FRAMES_HAVE(model: string) {
  return ARSENAL_CATALOG.some((r) => r.kind === "weapon" && r.name.includes(model));
}

describe("attachments", () => {
  it("rejects a rifle optic on a blade", () => {
    const blade = makeItem({
      name: "Ironhide Broadsword",
      kind: "weapon",
      rarity: "Common",
      condition: "Pristine",
      slot: "weapon",
      effect: "None.",
      lore: "",
      value: 120,
      weaponFamily: "melee",
      rangeBand: "close",
    });
    const optic = part("Watchworks Reflex");
    const block = canAttachPart(blade, optic);
    assert.ok(block);
    assert.match(block!, /bayonet|does not fit|Blades/i);
  });

  it("seats a matching optic and writes the socket", () => {
    const s = file();
    const op = rider(s);
    const rifle = gun();
    const optic = part("Watchworks Reflex");
    op.inventory = [rifle];
    s.vault = [optic];
    const msg = attachPart(s, { kind: "vault" }, optic.id, op.id, rifle.id);
    assert.equal(msg, `${optic.name} seated in the optic of ${rifle.name}.`);
    assert.equal(rifle.sockets?.optic, optic.name);
    assert.ok(resolveWeapon(rifle).accuracy >= 3);
  });
});

describe("ammo and dry fire", () => {
  it("dry-fires when the mag is empty and no box is packed", () => {
    const s = file();
    const op = rider(s);
    const rifle = gun();
    rifle.mag = 0;
    op.inventory = [rifle];
    const shot = spendShot(op, rifle);
    assert.equal(shot.dry, true);
    assert.match(shot.log, /Dry click/);
  });

  it("spends mag rounds and can rush-reload from a box", () => {
    const s = file();
    const op = rider(s);
    const rifle = gun();
    rifle.mag = 0;
    const box = makeItem({
      name: "Watchworks 5.56 Box",
      kind: "consumable",
      rarity: "Common",
      condition: "Pristine",
      effect: "30 rounds of 5.56. M4, M16 and SAW feed.",
      lore: "",
      value: 140,
      ammoType: "5.56",
      ammoCount: 30,
    });
    op.inventory = [rifle, box];
    const shot = spendShot(op, rifle);
    assert.equal(shot.dry, false);
    assert.equal(shot.rushed, true);
    assert.ok((rifle.mag ?? 0) < (rifle.magSize ?? 20));
    assert.ok((box.ammoCount ?? 0) < 30);
  });

  it("stamps improved .308 AP onto the mag so the bonus survives the empty box", () => {
    const s = file();
    const op = rider(s);
    const rifle = gun("Watchworks M14 Battle");
    rifle.mag = 0;
    const box = makeItem({
      name: "Watchworks .308 AP Box",
      kind: "consumable",
      rarity: "Rare",
      condition: "Pristine",
      effect: "10 AP .308. +2 AP when spent from this box.",
      lore: "",
      value: 420,
      ammoType: ".308",
      ammoCount: 10,
      ap: 2,
    });
    op.inventory = [rifle, box];
    const reload = reloadWeapon(op, rifle);
    assert.ok(reload);
    assert.equal(rifle.ammoLoad, "AP");
    assert.equal(rifle.loadAp, 2);
    op.inventory = [rifle];
    const shot = spendShot(op, rifle);
    assert.equal(shot.dry, false);
    assert.equal(shot.apBonus, 2);
    assert.match(magLine(rifle), /\.308 AP/);
  });

  it("will not seat coil cells in a laser rifle", () => {
    const s = file();
    const op = rider(s);
    const laser = gun("Surplus 2753 L8 Rifle");
    laser.mag = 0;
    const coil = makeItem({
      name: "Surplus 2753 Charge Cell Pack",
      kind: "consumable",
      rarity: "Uncommon",
      condition: "Pristine",
      effect: "16 cell charges. Coil and arc weapons feed.",
      lore: "",
      value: 400,
      ammoType: "cell",
      ammoCount: 16,
    });
    op.inventory = [laser, coil];
    const shot = spendShot(op, laser);
    assert.equal(shot.dry, true);
  });
});

describe("armor and bosses", () => {
  it("plate resists a rifle without AP and yields to AP 2", () => {
    const plate = foe({ armorClass: "plate", resist: ["pistol", "rifle"], resistAmt: 1 });
    const soft = applyArmor(8, {
      family: "rifle",
      rangeBand: "mid",
      ap: 0,
      accuracy: 0,
      recoil: 0,
      mag: 10,
      magSize: 10,
      damageBonus: 0,
      roundsPerShot: 1,
      dry: false,
    }, plate);
    const punched = applyArmor(8, {
      family: "rifle",
      rangeBand: "mid",
      ap: 2,
      accuracy: 0,
      recoil: 0,
      mag: 10,
      magSize: 10,
      damageBonus: 0,
      roundsPerShot: 1,
      dry: false,
    }, plate);
    assert.equal(soft, 7);
    assert.equal(punched, 8);
  });

  it("lasers extra-punch powered AEGIS plate", () => {
    const aegis = foe({
      name: "AEGIS Specialist",
      armorClass: "powered",
      resist: ["ballistic"],
      weakness: ["energy", "rail", "laser"],
      resistAmt: 1,
    });
    const laser = applyArmor(8, {
      family: "energy",
      ammoType: "laser",
      rangeBand: "long",
      ap: 2,
      accuracy: 3,
      recoil: 0,
      mag: 18,
      magSize: 18,
      damageBonus: 0,
      roundsPerShot: 1,
      dry: false,
    }, aegis);
    assert.ok(laser >= 12, `got ${laser}`);
  });

  it("Gravenor is beast/close and weak to shotgun", () => {
    const g = VILLAINS.find((v) => v.id === "gravenor")!;
    assert.equal(g.armorClass, "beast");
    assert.equal(g.preferredRange, "close");
    assert.ok(g.weakness?.includes("shotgun"));
    const dmg = applyArmor(6, {
      family: "shotgun",
      rangeBand: "close",
      ap: 1,
      accuracy: 0,
      recoil: 2,
      mag: 6,
      magSize: 6,
      damageBonus: 0,
      roundsPerShot: 1,
      dry: false,
    }, foe({ armorClass: g.armorClass, preferredRange: g.preferredRange, resist: g.resist, weakness: g.weakness }));
    assert.ok(dmg >= 8);
  });

  it("quotes range: shotgun close vs long is a problem", () => {
    assert.equal(rangeHitMod("close", "close", "shotgun"), 1);
    assert.equal(rangeHitMod("close", "long", "shotgun"), -3);
    assert.equal(rangeHitMod("long", "close", "sniper"), -2);
  });
});

describe("market", () => {
  it("tries to seat a gun, a part and a box on day one", () => {
    const m = rollMarket(1);
    assert.ok(m.lots.some((l) => l.kind === "weapon"), JSON.stringify(m.lots.map((l) => l.kind)));
    assert.ok(m.lots.some((l) => l.kind === "attachment"));
    assert.ok(m.lots.some((l) => l.ammoType));
  });
});

describe("mag line", () => {
  it("prints chamber and caliber", () => {
    const rifle = gun();
    assert.match(magLine(rifle), /20\/20 · 5\.56/);
  });
});
