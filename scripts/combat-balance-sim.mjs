/**
 * Drives the real combat engine over every boss, many times, and prints what
 * the fight actually costs.
 *
 * The campaign sim next door models the economy; it never calls
 * resolvePlayerAction, so it cannot see a combat change. This does: it forges a
 * party, hands it a weapon, and fights each villain to a decision.
 *
 * It runs each boss twice — once with a weapon the villain is written to be
 * weak to, once with one it resists — because that gap is the whole point of
 * the matchup layer. Before it was wired in, both columns were the same fight.
 *
 * Usage: node --import ./scripts/register-ts-ext.mjs scripts/combat-balance-sim.mjs [runs]
 */
import { VILLAINS, locById } from "../src/game/data.ts";
import {
  buildMission,
  defaultState,
  forgeOperative,
  makeItem,
  resolvePlayerAction,
  spawnCombat,
} from "../src/game/engine.ts";

const RUNS = Number(process.argv[2] ?? process.env.HOLLOW_COMBAT_RUNS ?? 400);

const GUNS = {
  shotgun: { name: "Pack-Tooth Scattergun", weaponFamily: "shotgun", ammoType: "12g", rangeBand: "close", ap: 0 },
  rifle: { name: "Union Forge Carbine", weaponFamily: "rifle", ammoType: "5.56", rangeBand: "mid", ap: 2 },
  energy: { name: "Coherent L8", weaponFamily: "energy", ammoType: "laser", rangeBand: "mid", ap: 1 },
  // A cell gun with no AP: resisted energy that does not punch through plate.
  arc: { name: "Arc Caster", weaponFamily: "energy", ammoType: "cell", rangeBand: "mid", ap: 0 },
  melee: { name: "Iron-Shod Cleaver", weaponFamily: "melee", rangeBand: "close", ap: 0 },
  pistol: { name: "Service Pistol", weaponFamily: "pistol", ammoType: "9mm", rangeBand: "close", ap: 0 },
};

// A squad that has kept pace. Without this the Arc V party is still carrying
// Arc I guns and the last fight reads 0% whatever it brings, which measures the
// sim's kit rather than the villain.
const ARC_DAMAGE = ["2d6", "2d8", "3d6", "3d8", "4d8"];

// One of these is what the villain was written to fear; the other is what it
// shrugs off. Read straight off the villain rows so the sim cannot drift. The
// resisted pick deliberately avoids an AP weapon, since AP is written to punch
// through resistance — an armour-piercing laser is not a bad matchup, it is the
// system working, and it would hide the gap this sim exists to measure.
function armFor(v) {
  const weak = (v.weakness ?? []).find((w) => GUNS[w] && !GUNS[w].ap) ?? (v.weakness ?? []).find((w) => GUNS[w]) ?? "rifle";
  const resisted = (v.resist ?? []).flatMap((r) => (r === "ballistic" ? ["pistol", "shotgun"] : r === "energy" ? ["arc"] : [r]));
  const hard = resisted.find((r) => GUNS[r] && !GUNS[r].ap) ?? "melee";
  return { weak, hard };
}

function party(gun, day, arc) {
  const damage = ARC_DAMAGE[arc] ?? ARC_DAMAGE[0];
  const kit = () => makeItem({ ...GUNS[gun], damage, kind: "weapon", rarity: "Uncommon", condition: "Pristine", slot: "weapon", equipped: true, effect: "", lore: "", value: 400 });
  return ["Warrior", "Rogue", "Healer"].map((cls, i) =>
    forgeOperative({
      name: `Sim${i}`,
      cls,
      race: "Human",
      lineage: "Wasteland",
      origin: "Ironclad",
      day,
      rolls: { STR: 12, DEF: 12, INT: 12, WIS: 12, SPD: 12, CHA: 12, LCK: 12, rep: 10, trait: 10, skill: 10, shadow: 10, enchant: 10, destiny: 10 },
    }),
  ).map((op) => ({ ...op, inventory: [kit()] }));
}

function fight(v, gun, arc) {
  const loc = v.loc;
  let s = defaultState();
  s.day = 20;
  s.operatives = party(gun, s.day, arc);
  s.locations[loc].unlocked = true;
  s.locations[loc].bossUnlocked = true;
  const ids = s.operatives.map((o) => o.id);
  s.mission = buildMission(s, loc, "boss", ids);
  s = spawnCombat(s, { boss: true });

  let rounds = 0;
  while (s.combat && rounds < 120) {
    rounds++;
    s = resolvePlayerAction(s, "strike");
  }
  const survivors = s.operatives.filter((o) => o.hp > 0).length;
  return {
    won: s.locations[loc].bossDefeated,
    rounds,
    survivors,
    hpLost: s.operatives.reduce((n, o) => n + (o.maxHp - o.hp), 0),
  };
}

function run(v, gun, arc) {
  let wins = 0;
  let rounds = 0;
  let hp = 0;
  let survivors = 0;
  for (let i = 0; i < RUNS; i++) {
    const r = fight(v, gun, arc);
    if (r.won) wins++;
    rounds += r.rounds;
    hp += r.hpLost;
    survivors += r.survivors;
  }
  return {
    win: wins / RUNS,
    rounds: rounds / RUNS,
    hp: hp / RUNS,
    survivors: survivors / RUNS,
  };
}

const pad = (s, n) => String(s).padEnd(n);
const pct = (n) => `${(n * 100).toFixed(1)}%`;
const num = (n) => n.toFixed(1);

console.log(`Boss fights, ${RUNS} runs each, party of 3, strike every round.\n`);
console.log(
  `${pad("villain", 20)}${pad("gun", 10)}${pad("win", 8)}${pad("rounds", 9)}${pad("hp lost", 9)}survivors`,
);
console.log("-".repeat(70));

const spread = [];
VILLAINS.forEach((v, arc) => {
  const { weak, hard } = armFor(v);
  const a = run(v, weak, arc);
  const b = run(v, hard, arc);
  spread.push({ name: v.name, region: locById(v.loc).short, weak, hard, a, b });
  for (const [label, gun, r] of [["weakness", weak, a], ["resisted", hard, b]]) {
    console.log(
      `${pad(label === "weakness" ? v.name : "", 20)}${pad(gun, 10)}${pad(pct(r.win), 8)}${pad(num(r.rounds), 9)}${pad(num(r.hp), 9)}${num(r.survivors)}`,
    );
  }
  console.log("-".repeat(70));
});

// The claim under test is that what the squad carries changes the fight, not
// that the weakness always wins. The Sink is the case that proves the
// difference: it opens passive, so hitting it with the weapon it fears wakes it
// sooner and costs more, and a slow grind is the safer read of the same fiction.
// So this measures how far apart the two fights are, in either direction.
console.log("\nWhat the loadout is worth:");
let flat = 0;
for (const row of spread) {
  const dWin = row.a.win - row.b.win;
  const dRounds = row.b.rounds - row.a.rounds;
  const dHp = row.b.hp - row.a.hp;
  // Under all three of these is noise: the unwired engine scored +2.7%, 0.4
  // rounds and a fraction of a hit point on its widest boss.
  const moved = Math.abs(dWin) >= 0.1 || Math.abs(dRounds) >= 1.2 || Math.abs(dHp) >= 2.5;
  if (!moved) flat++;
  console.log(
    `  ${pad(row.region, 12)}${pad(`${row.weak} vs ${row.hard}`, 22)}` +
      `win ${dWin >= 0 ? "+" : ""}${pct(dWin)} · ` +
      `rounds ${dRounds >= 0 ? "-" : "+"}${num(Math.abs(dRounds))} · ` +
      `hp ${dHp >= 0 ? "-" : "+"}${num(Math.abs(dHp))}${moved ? "" : "   (flat)"}`,
  );
}

const answering = spread.length - flat;
console.log(`\n${answering}/${spread.length} bosses answer to what the squad carries.`);
if (answering < 4) {
  console.error("FAIL the matchup layer is not reaching combat — bringing the wrong weapon costs nothing.");
  process.exit(1);
}
