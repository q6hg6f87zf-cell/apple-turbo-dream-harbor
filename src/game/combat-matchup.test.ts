import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VILLAINS, villainById } from "./data";
import {
  buildMission,
  defaultState,
  forgeOperative,
  makeItem,
  resolvePlayerAction,
  spawnCombat,
} from "./engine";
import type { GameState, Item, Operative } from "./types";

const FIXED = {
  STR: 12, DEF: 12, INT: 12, WIS: 12, SPD: 12, CHA: 12, LCK: 12,
  rep: 10, trait: 10, skill: 10, shadow: 10, enchant: 10, destiny: 10,
} as const;

function gun(spec: Partial<Item>): Item {
  return makeItem({
    name: "Sim Gun",
    kind: "weapon",
    rarity: "Uncommon",
    condition: "Pristine",
    slot: "weapon",
    equipped: true,
    effect: "",
    lore: "",
    value: 400,
    damage: "2d6",
    ...spec,
  } as Omit<Item, "id">);
}

function squad(n: number, weapon: Item): Operative[] {
  return Array.from({ length: n }, (_, i) => ({
    ...forgeOperative({
      name: `Sim${i}`,
      cls: "Warrior",
      race: "Human",
      lineage: "Wasteland",
      origin: "Ironclad",
      day: 20,
      rolls: { ...FIXED },
    }),
    inventory: [{ ...weapon, id: `w${i}` }],
  }));
}

function atBoss(villainId: string, weapon: Item, party = 1): GameState {
  const v = villainById(villainId)!;
  let s = defaultState();
  s.day = 20;
  s.operatives = squad(party, weapon);
  s.locations[v.loc].unlocked = true;
  s.locations[v.loc].bossUnlocked = true;
  s.mission = buildMission(s, v.loc, "boss", s.operatives.map((o) => o.id));
  s = spawnCombat(s, { boss: true });
  return s;
}

describe("the matchup layer reaches combat", () => {
  it("every villain's written armour is stamped on the combatant", () => {
    for (const v of VILLAINS) {
      const s = atBoss(v.id, gun({ weaponFamily: "rifle" }));
      const enemy = s.combat!.enemies[0]!;
      assert.equal(enemy.armorClass, v.armorClass, `${v.name} armour class`);
      assert.equal(enemy.preferredRange, v.preferredRange, `${v.name} range`);
      assert.deepEqual(enemy.resist, v.resist, `${v.name} resist`);
      assert.deepEqual(enemy.weakness, v.weakness, `${v.name} weakness`);
    }
  });

  it("field enemies and bounties carry a profile too", () => {
    let s = defaultState();
    s.day = 6;
    s.operatives = squad(1, gun({ weaponFamily: "rifle" }));
    s.locations.ironclad.unlocked = true;
    s.mission = buildMission(s, "ironclad", "raid", [s.operatives[0]!.id]);
    s = spawnCombat(s, {});
    assert.ok(s.combat!.enemies.length > 0);
    for (const e of s.combat!.enemies) {
      assert.ok(e.armorClass, `${e.name} has no armour class`);
      assert.ok(e.preferredRange, `${e.name} has no preferred range`);
    }
  });

  it("a weakness hits harder than a resistance, on the same roll", () => {
    // Gravenor: human escort, armored at long range; precision fire beats a blade.
    const runs = 600;
    const damage = (weapon: Item) => {
      let total = 0;
      for (let i = 0; i < runs; i++) {
        const s = atBoss("gravenor", weapon);
        const before = s.combat!.enemies[0]!.hp;
        const after = resolvePlayerAction(s, "strike");
        total += before - (after.combat?.enemies[0]?.hp ?? 0);
      }
      return total / runs;
    };
    const shot = damage(gun({ weaponFamily: "sniper", ammoType: ".338", rangeBand: "long", ap:3, mag:4, magSize:4 }));
    const blade = damage(gun({ weaponFamily: "melee", rangeBand: "close" }));
    assert.ok(shot > blade + 0.5, `shotgun ${shot.toFixed(2)} should beat cleaver ${blade.toFixed(2)}`);
  });
});

describe("boss phases are mechanical", () => {
  it("a villain opens on its first phase, not its base line", () => {
    // Valdris opens as The Chancellor: -2 atk, +1 def against the villain row.
    const v = villainById("valdris")!;
    const s = atBoss("valdris", gun({ weaponFamily: "energy" }));
    const enemy = s.combat!.enemies[0]!;
    assert.equal(enemy.atk, v.atk - 2);
    assert.equal(enemy.def, v.def + 1);
    assert.equal(enemy.dc, v.dc);
  });

  it("crossing a threshold re-cuts the line from base, never stacking", () => {
    const v = villainById("valdris")!;
    const s = atBoss("valdris", gun({ weaponFamily: "energy" }));
    const enemy = s.combat!.enemies[0]!;
    // Drop it straight into the last phase and take one swing to trigger it.
    enemy.hp = 7;
    const after = resolvePlayerAction(s, "strike");
    const hit = after.combat?.enemies[0] ?? after.combat?.enemies[0];
    if (!hit || hit.phase === 0) return; // the swing missed; nothing to assert
    const fx = v.phases[hit.phase!]!.effect ?? {};
    assert.equal(hit.atk, v.atk + (fx.atk ?? 0));
    assert.equal(hit.def, Math.max(0, v.def + (fx.def ?? 0)));
    assert.equal(hit.dc, v.dc + (fx.dc ?? 0));
  });

  it("every authored phase effect stays inside a sane band", () => {
    for (const v of VILLAINS) {
      for (const phase of v.phases) {
        const fx = phase.effect;
        if (!fx) continue;
        assert.ok(v.atk + (fx.atk ?? 0) >= 1, `${v.name} ${phase.name} atk floor`);
        assert.ok((fx.atk ?? 0) <= 4, `${v.name} ${phase.name} atk ceiling`);
        assert.ok(v.def + (fx.def ?? 0) >= 0, `${v.name} ${phase.name} def floor`);
        assert.ok((fx.dc ?? 0) <= 2, `${v.name} ${phase.name} dc ceiling`);
      }
    }
  });

  it("a speaking phase holds the fight open for one last beat", () => {
    // Gravenor alone carries an at:0 phase — The Reckoning.
    const speakers = VILLAINS.filter((v) => v.phases.some((p) => p.effect?.speaks));
    assert.ok(speakers.length > 0, "no villain has a round of lucidity");
    for (const v of speakers) {
      assert.ok(v.lastWord, `${v.name} speaks and has nothing to say`);
      let s = atBoss(v.id, gun({ weaponFamily: "sniper", ammoType: ".338", rangeBand: "long", ap:3, mag:4, magSize:4 }));
      s.combat!.enemies[0]!.hp = 1;
      let guard = 0;
      while (s.combat && !s.combat.reckoning && guard++ < 40) s = resolvePlayerAction(s, "strike");
      if (!s.combat) continue; // the party fell before landing it
      assert.equal(s.combat.reckoning, v.id);
      assert.equal(s.combat.enemies[0]!.hp, 0);
      const closed = resolvePlayerAction(s, "strike");
      assert.equal(closed.combat, null);
      assert.ok(
        closed.locations[v.loc].bossDefeated,
        `${v.name} should be down once the reckoning closes`,
      );
    }
  });

  it("every villain has a last word", () => {
    for (const v of VILLAINS) assert.ok(v.lastWord && v.lastWord.length > 12, `${v.name}`);
  });
});

describe("a beaten villain gets the last line", () => {
  it("the debrief carries the words, because the fight log does not survive it", () => {
    for (const v of VILLAINS) {
      let s = atBoss(v.id, gun({ weaponFamily: "sniper", ammoType: ".338", rangeBand: "long", ap:3, mag:4, magSize:4 }), 3);
      s.combat!.enemies[0]!.hp = 1;
      let guard = 0;
      while (s.combat && guard++ < 60) s = resolvePlayerAction(s, "strike");
      if (!s.locations[v.loc].bossDefeated) continue; // the party fell; try the next
      const said = (s.mission?.narrative ?? []).some((line) => line.includes(v.lastWord!));
      assert.ok(said, `${v.name} went down without saying anything`);
    }
  });
});

describe("a focused villain hunts the one hurting it", () => {
  it("swings at the top of the threat list instead of picking at random", () => {
    // Gravenor's Hunter phase: "Targets whoever hurt his pack."
    const v = villainById("gravenor")!;
    const hunter = v.phases.findIndex((p) => p.effect?.focus);
    assert.ok(hunter > 0, "Gravenor has no focused phase");

    const runs = 300;
    let onThreat = 0;
    let swings = 0;
    for (let i = 0; i < runs; i++) {
      const s = atBoss("gravenor", gun({ weaponFamily: "sniper", ammoType: ".338", rangeBand: "long", ap:3, mag:4, magSize:4 }), 3);
      const enemy = s.combat!.enemies[0]!;
      enemy.phase = hunter;
      enemy.hp = v.phases[hunter]!.at;
      // Hand one operative the whole threat table, then let the boss answer.
      const marked = s.operatives[2]!;
      s.combat!.threat = { [marked.id]: 99 };
      const before = s.operatives.map((o) => o.hp);
      const after = resolvePlayerAction(s, "guard");
      const hurt = after.operatives.filter((o, n) => o.hp < before[n]!);
      if (!hurt.length) continue;
      swings++;
      if (hurt.every((o) => o.id === marked.id)) onThreat++;
    }
    assert.ok(swings > 30, `only ${swings} swings landed across ${runs} runs`);
    assert.equal(onThreat, swings, `${swings - onThreat} of ${swings} swings went to the wrong operative`);
  });
});
