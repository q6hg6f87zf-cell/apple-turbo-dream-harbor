import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { defaultState, incomePerTick, makeItem, repairCost } from "./engine.ts";
import { CAST, FILE_ORDER, knownCast } from "./cast.ts";
import { defaultPoi, poiActionOf, poiById, workPoi } from "./field-ops.ts";
import {
  deliverTravisPart,
  emptyTravis,
  maybeTravisPart,
  pendingModules,
  restoreTravis,
  TRAVIS_MODULES,
  travisIncomeBonus,
  travisRepairFactor,
} from "./travis.ts";
import type { Item } from "./types.ts";

describe("travis bay", () => {
  it("pins the Mechanical Shop as a free bay on day one", () => {
    const s = defaultState();
    const shop = poiById("ironclad", "ironclad-shop");
    assert.ok(shop);
    assert.equal(shop!.name, "Ironclad Mechanical Shop");
    assert.equal(poiActionOf(shop!), "bay");
    assert.equal(workPoi(s, "ironclad", "ironclad-shop"), "bay");
    assert.notEqual(defaultPoi(s, "ironclad")?.id, "ironclad-shop");
  });

  it("pays caps, seats the part, and remembers the fit", () => {
    const s = defaultState();
    const mod = TRAVIS_MODULES[0]!;
    const item: Item = makeItem({
      name: mod.name,
      kind: "material",
      rarity: "Uncommon",
      condition: "Worn",
      effect: "Travis part",
      lore: mod.lore,
      value: mod.pay,
      tags: ["travis", `travis:${mod.id}`],
    });
    s.vault.push(item);
    const before = s.coins;
    const result = deliverTravisPart(s, item.id);
    assert.equal(typeof result === "string", false);
    if (typeof result === "string") return;
    assert.equal(result.pay, mod.pay);
    assert.equal(s.coins, before + mod.pay);
    assert.deepEqual(s.travis.fitted, [mod.id]);
    assert.equal(s.travis.jobs, 1);
    assert.equal(s.vault.some((it) => it.id === item.id), false);
    assert.equal(pendingModules(s).length, 0);
    assert.ok(s.tyrone.episodic.some((e) => e.type === "fit" && e.description.includes(mod.part)));
  });

  it("pulls a campaign part off an operative and ignores already-fitted modules", () => {
    const s = defaultState();
    const mod = TRAVIS_MODULES[1]!;
    s.operatives = [
      {
        id: "op-1",
        name: "Rider",
        cls: "Warrior",
        hp: 10,
        maxHp: 10,
        status: "idle",
        inventory: [
          makeItem({
            name: mod.name,
            kind: "material",
            rarity: "Uncommon",
            condition: "Worn",
            effect: "Travis part",
            lore: mod.lore,
            value: mod.pay,
            tags: ["travis", `travis:${mod.id}`],
          }),
        ],
      } as never,
    ];
    const first = deliverTravisPart(s);
    assert.equal(typeof first === "string", false);
    assert.equal(s.operatives[0]!.inventory.length, 0);
    s.vault.push(
      makeItem({
        name: mod.name,
        kind: "material",
        rarity: "Uncommon",
        condition: "Worn",
        effect: "Travis part",
        lore: mod.lore,
        value: mod.pay,
        tags: ["travis", `travis:${mod.id}`],
      }),
    );
    const second = deliverTravisPart(s);
    assert.equal(second, "Nothing on the bench. Run a campaign and bring me a part.");
  });

  it("can stamp a campaign part onto a high roll", () => {
    const s = defaultState();
    const hits: string[] = [];
    for (let i = 0; i < 40; i++) {
      const part = maybeTravisPart({
        state: structuredClone(s),
        kind: "forage",
        poiId: "ironclad-rail",
        loc: "ironclad",
        total: 16,
      });
      if (part) hits.push(part.name);
    }
    assert.ok(hits.length > 0);
    assert.ok(hits.every((name) => TRAVIS_MODULES.some((m) => m.name === name)));
  });

  it("cheapens repairs and fattens porch income as fittings land", () => {
    const s = defaultState();
    s.rooms.forge = 1;
    const item = makeItem({
      name: "Worn plate",
      kind: "armor",
      rarity: "Common",
      condition: "Worn",
      effect: "Holds.",
      lore: "Porch steel.",
      value: 40,
    });
    const baseRepair = repairCost(s, item);
    const baseIncome = incomePerTick(s);
    s.travis.fitted = TRAVIS_MODULES.map((m) => m.id);
    assert.equal(travisIncomeBonus(s), 18);
    assert.ok(travisRepairFactor(s) < 1);
    assert.ok(repairCost(s, item) < baseRepair);
    assert.ok(incomePerTick(s) > baseIncome);
  });

  it("restores a bay and drops unknown jigs", () => {
    assert.deepEqual(emptyTravis(), { fitted: [], paid: 0, jobs: 0 });
    const restored = restoreTravis({ fitted: ["crt-tube", "nope"], paid: 95, jobs: 1 });
    assert.deepEqual(restored.fitted, ["crt-tube"]);
    assert.equal(restored.paid, 95);
  });
});

describe("people file", () => {
  it("files Travis, Holt, Vex, Rourke and the bosses after the AEGIS wing", () => {
    const s = defaultState();
    assert.deepEqual(FILE_ORDER.slice(0, 10), [
      "tyrone",
      "kane",
      "lyra",
      "vera",
      "drake",
      "orion",
      "travis",
      "holt",
      "vex",
      "rourke",
    ]);
    const ids = knownCast(s).map((p) => p.id);
    assert.ok(ids.includes("warden"));
    assert.ok(CAST.vex.dossier.includes("Purifier") || CAST.vex.title.includes("Purifier"));
    assert.match(CAST.gravenor.dossier, /Ashen Pack/);
    assert.match(CAST.warden.dossier, /AEGIS 2753/);
  });
});
