import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BOARD_JOB_ART } from "./art/index.ts";
import { RIDER_AVATARS } from "./avatars.ts";
import { BB_GUN, BB_TIN, YARD_ENEMIES, starterWeapon } from "./data.ts";
import {
  buildMission,
  defaultState,
  finishCombat,
  forgeOperative,
  spawnCombat,
} from "./engine.ts";
import { hackGuess, openHack } from "./inventory.ts";
import { itemArt } from "./item-art.ts";

const FIXED = {
  STR: 12, DEF: 12, INT: 12, WIS: 12, SPD: 12, CHA: 12, LCK: 12,
  rep: 10, trait: 10, skill: 10, shadow: 10, enchant: 10, destiny: 10,
} as const;

describe("early field contacts", () => {
  it("issues a BB gun and a tin, not a class relic", () => {
    const gun = starterWeapon("Warrior");
    assert.equal(gun.name, "Vault 13 BB Gun");
    assert.equal(gun.ammoType, "bb");
    const op = forgeOperative({
      name: "Ash",
      cls: "Warrior",
      race: "Human",
      lineage: "Wasteland",
      origin: "Ironclad",
      day: 1,
      rolls: { ...FIXED },
      portraitId: "f-ash",
    });
    assert.equal(op.portraitId, "f-ash");
    assert.ok(op.inventory.some((item) => item.name === BB_GUN.name && item.equipped));
    assert.ok(op.inventory.some((item) => item.name === BB_TIN.name));
    assert.equal(itemArt({ kind: "weapon", name: BB_GUN.name }), "/art/items/bb-gun.jpg");
  });

  it("scouts and forage spawn yard enemies a BB gun can drop", () => {
    const names = new Set(YARD_ENEMIES.map((e) => e.name));
    let s = defaultState();
    s.day = 1;
    s.operatives = [
      forgeOperative({
        name: "Ash",
        cls: "Rogue",
        race: "Human",
        lineage: "Wasteland",
        origin: "Ironclad",
        day: 1,
        rolls: { ...FIXED },
        portraitId: "f-kite",
      }),
    ];
    s.locations.ironclad.unlocked = true;
    s.mission = buildMission(s, "ironclad", "scout", [s.operatives[0]!.id]);
    s = spawnCombat(s, {});
    assert.ok(s.combat);
    assert.equal(s.combat!.enemies.length, 1);
    assert.ok(names.has(s.combat!.enemies[0]!.name));
    assert.ok(s.combat!.enemies[0]!.tags?.includes("yard"));
    assert.ok((s.combat!.enemies[0]!.hp ?? 0) <= 6);
  });

  it("killing a yard contact pays XP and can drop kit", () => {
    let s = defaultState();
    s.day = 1;
    s.operatives = [
      forgeOperative({
        name: "Ash",
        cls: "Warrior",
        race: "Human",
        lineage: "Wasteland",
        origin: "Ironclad",
        day: 1,
        rolls: { ...FIXED },
        portraitId: "f-ash",
      }),
    ];
    s.locations.ironclad.unlocked = true;
    s.mission = buildMission(s, "ironclad", "forage", [s.operatives[0]!.id]);
    s = spawnCombat(s, {});
    assert.ok(s.combat);
    s.combat!.enemies[0]!.hp = 0;
    const xpBefore = s.xp;
    s = finishCombat(s, true);
    assert.equal(s.combat, null);
    assert.ok(s.xp > xpBefore);
    assert.ok(s.operatives[0]!.battles >= 1);
  });
});

describe("rider faces and board stills", () => {
  it("offers women and men at the Machine Shop", () => {
    assert.ok(RIDER_AVATARS.some((row) => row.gender === "female"));
    assert.ok(RIDER_AVATARS.some((row) => row.gender === "male"));
    assert.equal(RIDER_AVATARS.length, 12);
    assert.ok(RIDER_AVATARS.some((row) => row.id === "f-rhea"));
    assert.ok(RIDER_AVATARS.some((row) => /blonde/i.test(row.hair)));
    assert.ok(RIDER_AVATARS.every((row) => row.eyes && row.hair));
  });

  it("gives HQ jobs a still instead of a three-letter tile", () => {
    assert.equal(BOARD_JOB_ART.crates, "/art/board/jobs/crates.jpg");
    assert.equal(BOARD_JOB_ART.cabinet, "/art/board/jobs/cabinet.jpg");
    assert.equal(BOARD_JOB_ART.scan, "/art/board/jobs/perimeter.jpg");
    assert.equal(BOARD_JOB_ART.run, "/art/board/jobs/supply.jpg");
  });
});

describe("SYNAPSE terminal payout", () => {
  it("pays 3,000 caps the first time you crack it", () => {
    const s = defaultState();
    assert.equal(openHack(s), null);
    const before = s.coins;
    assert.equal(hackGuess(s, "SYNAPSE"), "won");
    assert.equal(s.terminalDrained, true);
    assert.equal(s.coins, before + 3000);
  });
});
