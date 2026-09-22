import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { defaultState, makeItem, improve } from "./engine.ts";
import {
  conditionStory,
  inventoryStoryPulse,
  showTravisItem,
  travisCanFavorWeld,
  travisFavorRepair,
  travisReadItem,
  tyroneExplainItem,
  tyroneHowToUse,
} from "./item-story.ts";
import { deliverTravisPart, TRAVIS_MODULES } from "./travis.ts";
import type { Item } from "./types.ts";

function file() {
  const s = defaultState();
  s.started = true;
  s.coins = 50_000;
  s.playerName = "Brent";
  return s;
}

function travisPart(s: ReturnType<typeof file>, modId = "crt-tube"): Item {
  const mod = TRAVIS_MODULES.find((m) => m.id === modId)!;
  const item = makeItem({
    name: mod.name,
    kind: "material",
    rarity: "Uncommon",
    condition: "Worn",
    effect: `Travis part · ${mod.slot}`,
    lore: mod.lore,
    value: mod.pay,
    tags: ["travis", `travis:${mod.id}`],
  });
  s.vault.push(item);
  return item;
}

describe("item story + Travis bay", () => {
  it("explains Travis parts as chassis work, not resident kit", () => {
    const s = file();
    const part = travisPart(s);
    const line = tyroneExplainItem(part, null);
    assert.match(line, /Travis|Mechanical Shop|chassis/i);
    assert.match(tyroneHowToUse(part), /Do not Issue|Mechanical Shop/i);
  });

  it("lets Travis read steel differently by family and condition", () => {
    const s = file();
    const rifle = makeItem({
      name: "Service Rifle",
      kind: "weapon",
      rarity: "Common",
      condition: "Damaged",
      effect: "Ironclad issue.",
      lore: "Gate stock.",
      value: 200,
      weaponFamily: "rifle",
      ammoType: "5.56",
    });
    const beat = travisReadItem(s, rifle);
    assert.equal(beat.speaker, "travis");
    assert.match(beat.lines.join(" "), /weld|jig|rifle|Damaged|crack/i);
  });

  it("blocks favor weld until a fitting is seated, then improves condition", () => {
    const s = file();
    const rifle = makeItem({
      name: "Gate Carbine",
      kind: "weapon",
      rarity: "Uncommon",
      condition: "Damaged",
      effect: "Carbine.",
      lore: "Berm dust.",
      value: 240,
      weaponFamily: "rifle",
    });
    s.vault.push(rifle);
    assert.equal(travisCanFavorWeld(s), false);
    const blocked = travisFavorRepair(s, rifle.id);
    assert.match(String(blocked), /Seat a T-0880|trust/i);

    const part = travisPart(s, "drive-wheel");
    const fit = deliverTravisPart(s, part.id);
    assert.equal(typeof fit === "object", true);
    assert.equal(travisCanFavorWeld(s), true);

    const before = rifle.condition;
    const result = travisFavorRepair(s, rifle.id);
    assert.equal(typeof result === "object", true);
    if (typeof result !== "object") return;
    assert.equal(result.item.condition, improve(before));
    assert.match(result.line, /favor-weld/i);
  });

  it("journals Kane steel when shown to Travis", () => {
    const s = file();
    const plate = makeItem({
      name: "AEGIS scrap plate",
      kind: "armor",
      rarity: "Rare",
      condition: "Worn",
      effect: "Visor paint.",
      lore: "Kane warehouse leftover.",
      value: 400,
      tags: ["kane", "aegis"],
      defense: 2,
    });
    s.vault.push(plate);
    const beat = showTravisItem(s, plate.id);
    assert.equal(typeof beat === "object", true);
    assert.ok(s.narrative?.journal.some((j) => /Kane steel|Travis spat/i.test(j.title) || /Kane steel/i.test(j.body)));
  });

  it("pulses Travis and damaged counts for inventory lanes", () => {
    const s = file();
    travisPart(s);
    s.vault.push(
      makeItem({
        name: "Bent blade",
        kind: "weapon",
        rarity: "Common",
        condition: "Broken",
        effect: "Melee.",
        lore: "Porch scrap.",
        value: 40,
        weaponFamily: "melee",
      }),
    );
    const pulse = inventoryStoryPulse(s);
    assert.ok(pulse.travis >= 1);
    assert.ok(pulse.damaged >= 1);
    assert.match(conditionStory("Broken"), /Broken/);
  });
});
