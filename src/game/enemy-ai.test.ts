import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeStats, forgeOperative } from "./engine";
import {
  ROLE_DOCTRINE,
  ROLE_LABEL,
  inferRole,
  planEnemyTurn,
  readMorale,
  startMorale,
  tickEnemy,
} from "./enemy-ai";
import type { Combatant, CombatState, EnemyRole, Operative } from "./types";

function body(name: string, extra: Partial<Combatant> = {}): Combatant {
  const c: Combatant = {
    id: `en-${name}`,
    name,
    hp: 10,
    maxHp: 10,
    atk: 4,
    def: 2,
    dc: 12,
    tags: [],
    flavor: "",
    ...extra,
  };
  c.role = c.role ?? inferRole(c);
  c.morale = c.morale ?? startMorale(c.role);
  return c;
}

function op(name: string, hp: number, maxHp = 12): Operative {
  const o = forgeOperative({ name, cls: "Warrior", race: "Human", lineage: "", origin: "Ironclad", day: 1 });
  return { ...o, hp, maxHp };
}

function field(enemies: Combatant[], party: Operative[]): CombatState {
  return {
    locationId: "ironclad",
    missionKind: "raid",
    partyIds: party.map((p) => p.id),
    enemies,
    turn: 1,
    actorIndex: 0,
    log: [],
    rewardMult: 1,
  };
}

const statsOf = (o: Operative) => computeStats(o);

describe("enemy doctrine", () => {
  it("names a role and a doctrine for every kind of hostile", () => {
    (Object.keys(ROLE_LABEL) as EnemyRole[]).forEach((role) => {
      assert.ok(ROLE_LABEL[role].length > 2);
      assert.ok(ROLE_DOCTRINE[role].length > 30, `${role} has no doctrine worth reading`);
    });
  });

  it("reads a role off the name so old saves still fight properly", () => {
    assert.equal(inferRole({ name: "Slag-Hound", tags: [] }), "pack");
    assert.equal(inferRole({ name: "Ironclad Watch", tags: [] }), "marksman");
    assert.equal(inferRole({ name: "2753 Frame", tags: [] }), "machine");
    assert.equal(inferRole({ name: "Gravenor", tags: [], isBoss: true }), "warden");
    assert.equal(inferRole({ name: "Anyone", tags: ["bounty"] }), "skirmisher");
  });

  it("a marksman settles one round, then shoots through cover", () => {
    const e = body("Ironclad Watch");
    const hurt = op("Ash", 3);
    const whole = op("Bly", 12);
    const combat = field([e], [hurt, whole]);
    combat.guardId = hurt.id;

    const first = planEnemyTurn({ enemy: e, allies: [e], party: [hurt, whole], combat, statsOf });
    assert.equal(first.intent, "aim");
    assert.equal(first.skipsAttack, true);
    tickEnemy(e, first);

    const second = planEnemyTurn({ enemy: e, allies: [e], party: [hurt, whole], combat, statsOf });
    assert.equal(second.skipsAttack, false);
    assert.equal(second.piercesGuard, true, "a settled shot should not care about a guard");
    assert.ok(second.atkMod >= 3);
    assert.equal(second.targetId, hurt.id);
  });

  it("a skirmisher goes around the guard for whoever is bleeding", () => {
    const e = body("Kane Buyer");
    assert.equal(e.role, "skirmisher");
    const hurt = op("Ash", 2);
    const whole = op("Bly", 12);
    const combat = field([e], [hurt, whole]);
    combat.guardId = hurt.id;
    const plan = planEnemyTurn({ enemy: e, allies: [e], party: [hurt, whole], combat, statsOf });
    assert.equal(plan.intent, "flank");
    assert.equal(plan.targetId, whole.id, "guarding the wounded should redirect the flank");
  });

  it("a pack is braver with friends and reckless without them", () => {
    const a = body("Slag-Hound", { id: "a" });
    const b = body("Slag-Hound", { id: "b" });
    const party = [op("Ash", 4), op("Bly", 12)];
    const combat = field([a, b], party);

    const together = planEnemyTurn({ enemy: a, allies: [a, b], party, combat, statsOf });
    assert.equal(together.intent, "press");
    assert.ok(together.atkMod > 0, "a pack should fight better in numbers");

    b.hp = 0;
    const alone = planEnemyTurn({ enemy: a, allies: [a, b], party, combat, statsOf });
    assert.equal(alone.intent, "break");
    assert.ok(alone.dmgMod > together.dmgMod, "the last one should stop being careful");
  });

  it("a controller goes for the one holding the plan", () => {
    const e = body("Survey Shade");
    assert.equal(e.role, "controller");
    const muscle = { ...op("Ash", 12), statDice: { STR: 20, DEF: 12, INT: 2, WIS: 2, SPD: 10, CHA: 8, LCK: 8 } };
    const brains = { ...op("Bly", 12), statDice: { STR: 4, DEF: 8, INT: 20, WIS: 20, SPD: 10, CHA: 8, LCK: 8 } };
    const combat = field([e], [muscle, brains]);
    const plan = planEnemyTurn({ enemy: e, allies: [e], party: [muscle, brains], combat, statsOf });
    assert.equal(plan.intent, "suppress");
    assert.equal(plan.targetId, brains.id);
  });

  it("morale breaks, and a broken hostile shouts once before it runs", () => {
    const e = body("Ashen Briar", { hp: 1, maxHp: 20 });
    const dead = body("Ashen Briar", { id: "dead", hp: 0 });
    e.role = "brawler";
    const party = [op("Ash", 12)];
    const combat = field([e, dead], party);
    assert.ok(readMorale(e, [e, dead]) < 30, "one hp and a dead friend should break a brawler");

    const shout = planEnemyTurn({ enemy: e, allies: [e, dead], party, combat, statsOf });
    assert.equal(shout.intent, "call");
    e.calledFor = true;
    const run = planEnemyTurn({ enemy: e, allies: [e, dead], party, combat, statsOf });
    assert.equal(run.intent, "rout");
  });

  it("a machine does not have morale to lose", () => {
    const e = body("2753 Frame", { hp: 1, maxHp: 30 });
    const dead = body("2753 Frame", { id: "dead", hp: 0 });
    assert.equal(readMorale(e, [e, dead]), 100);
    const party = [op("Ash", 12)];
    const combat = field([e, dead], party);
    const plan = planEnemyTurn({ enemy: e, allies: [e, dead], party, combat, statsOf });
    assert.equal(plan.intent, "press");
    assert.equal(plan.piercesGuard, true);
  });

  it("a focused boss hunts whoever has been hurting it", () => {
    const boss = body("Gravenor", { isBoss: true, hp: 40, maxHp: 40 });
    const quiet = op("Ash", 12);
    const loud = op("Bly", 12);
    const combat = field([boss], [quiet, loud]);
    combat.threat = { [loud.id]: 22, [quiet.id]: 1 };
    const plan = planEnemyTurn({ enemy: boss, allies: [boss], party: [quiet, loud], combat, statsOf, bossFocus: true });
    assert.equal(plan.targetId, loud.id);
    assert.match(plan.note, /remembers/i);
  });

  // The Reckoning only fires while the villain is the last thing standing, so a
  // boss that fled or shouted in a second body would delete its own last phase.
  it("a named villain never routs and never calls for help", () => {
    const boss = body("Gravenor", { isBoss: true, hp: 1, maxHp: 60 });
    const party = [op("Ash", 12)];
    const combat = field([boss], party);
    for (let i = 0; i < 40; i++) {
      const plan = planEnemyTurn({ enemy: boss, allies: [boss], party, combat, statsOf });
      assert.notEqual(plan.intent, "rout");
      assert.notEqual(plan.intent, "call");
      assert.equal(plan.skipsAttack, false);
    }
  });

  it("explains itself: every plan carries the reason in the log line", () => {
    const e = body("Slag Bruiser");
    const party = [op("Ash", 12)];
    const combat = field([e], party);
    const plan = planEnemyTurn({ enemy: e, allies: [e], party, combat, statsOf });
    assert.ok(plan.note.includes(e.name));
    assert.ok(plan.note.length > 25, "a decision the player cannot read is not AI");
  });
});
