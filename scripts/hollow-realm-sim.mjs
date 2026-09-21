import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const progressionSource = fs.readFileSync(path.join(root, "src/components/game/resident-progression-runtime.tsx"), "utf8");
const balanceSource = fs.readFileSync(path.join(root, "src/game/balance-bootstrap.ts"), "utf8");

function numberAfter(source, pattern, label) {
  const m = source.match(pattern);
  if (!m) throw new Error(`Could not read ${label} from source.`);
  return Number(m[1].replaceAll("_", ""));
}

const bossGate = [
  numberAfter(progressionSource, /ironclad:\s*(\d+)/, "Ironclad boss gate"),
  numberAfter(progressionSource, /kingdom:\s*(\d+)/, "Slag Town boss gate"),
  numberAfter(progressionSource, /caverns:\s*(\d+)/, "Blackspire boss gate"),
  numberAfter(progressionSource, /library:\s*(\d+)/, "Brasswater boss gate"),
  numberAfter(progressionSource, /veyra:\s*(\d+)/, "Veyra boss gate"),
];

const tier6VaultCost = numberAfter(balanceSource, /ROOM_CAPS\.vault\[5\]\s*=\s*([\d_]+)/, "tier 6 Vault cost");

const REGIONS = ["Ironclad", "Slag Town", "Blackspire", "Brasswater", "Veyra City"];
const PROFILE = [
  { riders: 2, xp: 8, intel: 5, caps: 12_000, ore: 20, favor: 6 },
  { riders: 2, xp: 20, intel: 7, caps: 28_000, ore: 40, favor: 12 },
  { riders: 3, xp: 36, intel: 9, caps: 65_000, ore: 75, favor: 22 },
  { riders: 3, xp: 56, intel: 11, caps: 140_000, ore: 130, favor: 38 },
  { riders: 4, xp: 80, intel: 14, caps: 350_000, ore: 220, favor: 65 },
];
const UPGRADE_DAYS = [1, 4, 12, 28, 55, 90];
const VAULT_COST = [0, 18_000, 60_000, 175_000, 480_000, tier6VaultCost];
const MATERIAL_REQ = [2, 4, 7, 11, 16, 24];
const ORE_REQ = [0, 4, 12, 30, 65, 140];
const FAVOR_REQ = [0, 2, 6, 14, 28, 50];
const BOSS_REQ = [0, 0, 1, 2, 3, 4];
const RIDER_REQ = [1, 1, 2, 2, 3, 4];
const MATERIAL_REGION = [0, 0, 1, 2, 3, 4];
const MISSION_CAPS = { scout: 300, forage: 450, raid: 800, bounty: 1150 };
const RIDER_XP = { scout: 3, forage: 4, raid: 7, bounty: 10 };
const MISSION_TYPES = ["scout", "forage", "raid", "bounty"];
const MISSION_WEIGHTS = [0.30, 0.30, 0.28, 0.12];
const MATERIAL_CHANCE = { scout: 0.14, forage: 0.52, raid: 0.38, bounty: 0.32 };

function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(rand, mean, sd) {
  const u = Math.max(1e-9, rand());
  const v = Math.max(1e-9, rand());
  return mean + Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v) * sd;
}

function weighted(rand, values, weights) {
  let x = rand();
  for (let i = 0; i < values.length; i += 1) {
    x -= weights[i];
    if (x <= 0) return values[i];
  }
  return values.at(-1);
}

function gradeMultiplier(score) {
  if (score >= 920) return 2;
  if (score >= 850) return 1.65;
  if (score >= 760) return 1.35;
  if (score >= 650) return 1;
  if (score >= 520) return 0.82;
  return 0.65;
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  if (lo === hi) return sorted[lo];
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (index - lo));
}

function simulate(seed, horizon = 180) {
  const rand = mulberry32(seed);
  // Matches defaultState().coins — the campaign starts broke.
  let caps = 150;
  let ore = 0;
  let favor = 0;
  let region = 0;
  let vaultLevel = 1;
  const vaultDays = { 1: 1 };
  const bossDays = Array(5).fill(null);
  const riderXp = [0, 0, 0, 0];
  const intel = [0, 0, 0, 0, 0];
  const materials = [0, 0, 0, 0, 0];
  const drought = [0, 0, 0, 0, 0];
  const thirdRiderDay = 24 + Math.floor(rand() * 11);
  const fourthRiderDay = 52 + Math.floor(rand() * 15);
  let worstMaterialDrought = 0;

  for (let day = 1; day <= horizon; day += 1) {
    const riders = day < thirdRiderDay ? 2 : day < fourthRiderDay ? 3 : 4;
    const current = Math.min(region, 4);
    const missions = 3 + Math.floor(rand() * 4);

    for (let m = 0; m < missions; m += 1) {
      const kind = weighted(rand, MISSION_TYPES, MISSION_WEIGHTS);
      const score = Math.max(360, Math.min(980, Math.round(normal(rand, 705 + current * 12, 125))));
      const mult = gradeMultiplier(score);
      caps += Math.round(MISSION_CAPS[kind] * (1 + current * 0.38) * mult);
      const rider = (day + m) % riders;
      riderXp[rider] += Math.max(1, Math.round(RIDER_XP[kind] * (0.8 + score / 1000)));

      if (kind === "scout") intel[current] += 1 + (score >= 850 && rand() < 0.3 ? 1 : 0);

      const materialChance = Math.min(
        0.88,
        MATERIAL_CHANCE[kind] + drought[current] * 0.035 + (score >= 850 ? 0.08 : 0),
      );
      if (rand() < materialChance) {
        materials[current] += 1;
        drought[current] = 0;
        if (rand() < 0.12) ore += 1;
      } else {
        drought[current] += 1;
        worstMaterialDrought = Math.max(worstMaterialDrought, drought[current]);
      }
      if (rand() < 0.08 + score / 5000) favor += 1;
    }

    // Approximate a focused 25-minute daily session. Passive income is a drip,
    // not the engine driving the campaign.
    caps += 25 * (5 + vaultLevel * 2);

    if (region < 5) {
      const profile = PROFILE[region];
      const readyRiders = riderXp.slice(0, riders).filter((xp) => xp >= profile.xp).length;
      if (day >= bossGate[region] && readyRiders >= profile.riders && intel[region] >= profile.intel) {
        const overXp = riderXp.slice(0, riders).reduce((sum, xp) => sum + Math.max(0, xp - profile.xp), 0) / riders;
        const chance = Math.min(0.82, 0.42 + Math.min(20, overXp) * 0.012 + Math.max(0, intel[region] - profile.intel) * 0.015);
        if (rand() < chance) {
          bossDays[region] = day;
          caps += profile.caps;
          ore += profile.ore;
          favor += profile.favor;
          region += 1;
        }
      }
    }

    if (vaultLevel < 6) {
      const nextLevel = vaultLevel + 1;
      const i = nextLevel - 1;
      const materialRegion = MATERIAL_REGION[i];
      const clears = bossDays.filter(Boolean).length;
      if (
        day >= UPGRADE_DAYS[i] &&
        caps >= VAULT_COST[vaultLevel] &&
        ore >= ORE_REQ[i] &&
        favor >= FAVOR_REQ[i] &&
        materials[materialRegion] >= MATERIAL_REQ[i] &&
        clears >= BOSS_REQ[i] &&
        riders >= RIDER_REQ[i]
      ) {
        caps -= VAULT_COST[vaultLevel];
        ore -= ORE_REQ[i];
        favor -= FAVOR_REQ[i];
        materials[materialRegion] -= MATERIAL_REQ[i];
        vaultLevel += 1;
        vaultDays[vaultLevel] = day;
      }
    }
  }

  return { bossDays, vaultDays, worstMaterialDrought, caps, riderXp };
}

const runs = Number(process.env.HOLLOW_SIM_RUNS ?? 2500);
const results = Array.from({ length: runs }, (_, i) => simulate(i + 1337));

const bossSummary = REGIONS.map((name, i) => {
  const days = results.map((r) => r.bossDays[i]).filter((x) => x != null);
  return {
    region: name,
    clearRate180: days.length / runs,
    p10: percentile(days, 0.10),
    p50: percentile(days, 0.50),
    p90: percentile(days, 0.90),
    earliest: days.length ? Math.min(...days) : null,
  };
});

const vaultSummary = [2, 3, 4, 5, 6].map((level) => {
  const days = results.map((r) => r.vaultDays[level]).filter((x) => x != null);
  return {
    level,
    completionRate180: days.length / runs,
    p10: percentile(days, 0.10),
    p50: percentile(days, 0.50),
    p90: percentile(days, 0.90),
    earliest: days.length ? Math.min(...days) : null,
  };
});

const output = {
  runs,
  bossGate,
  tier6VaultCost,
  bossSummary,
  vaultSummary,
  worstMaterialDrought: Math.max(...results.map((r) => r.worstMaterialDrought)),
};
console.log(JSON.stringify(output, null, 2));

const failures = [];
for (let i = 0; i < bossSummary.length; i += 1) {
  if (bossSummary[i].earliest != null && bossSummary[i].earliest < bossGate[i]) failures.push(`${REGIONS[i]} cleared before its hard gate.`);
}
const veyra = bossSummary[4];
if (veyra.clearRate180 < 0.97) failures.push(`Veyra clear rate by day 180 is only ${(veyra.clearRate180 * 100).toFixed(1)}%.`);
if (veyra.p50 != null && veyra.p50 < 95) failures.push(`Median Veyra clear is too early: day ${veyra.p50}.`);
const tier5 = vaultSummary.find((x) => x.level === 5);
if (!tier5 || tier5.completionRate180 < 0.95) failures.push("Vault tier 5 deadlocks too often by day 180.");
if (tier5?.p50 != null && tier5.p50 < 55) failures.push(`Vault tier 5 is too fast: day ${tier5.p50}.`);
const tier6 = vaultSummary.find((x) => x.level === 6);
if (tier6?.earliest != null && tier6.earliest < 90) failures.push(`Vault tier 6 appeared before day 90: day ${tier6.earliest}.`);
if (output.worstMaterialDrought > 24) failures.push(`Material pity failed: observed ${output.worstMaterialDrought} consecutive misses.`);

if (failures.length) {
  console.error("\nSIMULATION FAILED\n" + failures.map((x) => `- ${x}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nSimulation gates passed.");
}
