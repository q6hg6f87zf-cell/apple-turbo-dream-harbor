/**
 * The loop, end to end, in a phone-shaped browser.
 *
 * This exists because the bug it guards was not visible in unit tests: working
 * a site in Ironclad produced a toast that vanished, and once the pins had been
 * touched the day had nothing left to offer and the player was stuck on the
 * region sheet with no next action. The assertions below are about that — a
 * sweep must produce a readable report, the report must always carry a verb,
 * and a spent shift must hand back Rest rather than a refusal.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

const baseURL = process.env.HOLLOW_QA_URL ?? "http://127.0.0.1:8080";
const saveKey = "synaps-t0880-v1";

const rider = {
  id: "qa-op-loop",
  name: "QA Walker",
  cls: "Rogue",
  race: "Human",
  lineage: "Vault 13",
  origin: "Ironclad",
  hp: 9,
  maxHp: 9,
  repTitle: "Runner",
  repPassive: "QA",
  traitLevel: "Standard",
  traitBonus: 0,
  skillName: "Quick Hands",
  skillDesc: "QA",
  shadowName: "Static",
  shadowDesc: "QA",
  enchantName: "None",
  enchantDesc: "QA",
  destiny: "Finish the shift.",
  destinyFired: false,
  giftUsed: false,
  inventory: [
    {
      id: "qa-loop-knife",
      name: "QA Work Knife",
      kind: "weapon",
      rarity: "Common",
      condition: "Pristine",
      slot: "weapon",
      classHint: "Rogue",
      damage: "1d4",
      effect: "Reliable test blade.",
      lore: "QA.",
      equipped: true,
      value: 80,
      sourceRegion: "ironclad",
    },
    {
      id: "qa-loop-bb",
      name: "Vault 13 BB Rifle",
      kind: "weapon",
      rarity: "Common",
      condition: "Worn",
      slot: "weapon",
      classHint: "Rogue",
      damage: "1d3",
      effect: "Spring-air. 1d3.",
      lore: "QA copy of the door rifle.",
      value: 60,
      sourceRegion: "ironclad",
      weaponFamily: "rifle",
      ammoType: "bb",
      rangeBand: "close",
      magSize: 40,
      mag: 40,
    },
  ],
  companion: null,
  status: "idle",
  location: "hq",
  raids: 1,
  battles: 1,
  isHoF: false,
  curses: [],
  notes: "",
  joinedDay: 1,
};

const seedSave = {
  started: true,
  tutorial: "done",
  screen: "map",
  day: 4,
  coins: 150,
  ore: 2,
  moonFavor: 1,
  rooms: { vault: 1, barracks: 1, forge: 0, infirmary: 1, watchtower: 0, ledger: 0 },
  quarters: { bunk: 0, lockbox: 0, hearth: 0 },
  operatives: [rider],
  vault: [],
  selectedLoc: "ironclad",
  selectedPoiId: "ironclad-highway",
  squad: [
    {
      id: "qa-rider",
      name: "QA Rider",
      discordId: null,
      discordHandle: "@qa",
      personalCaps: 300,
      xp: 10,
      note: "",
      joinedDay: 1,
      lastTurnDay: 0,
    },
  ],
  activeMemberId: "qa-rider",
  seenTalk: ["briefing", "resume", "inventory", "map"],
  talk: null,
  talkQueue: [],
};

// CI runs `npx playwright install` and needs no override. Sandboxes that ship a
// pinned Chromium point at it instead of re-downloading one.
const pinned = process.env.HOLLOW_QA_CHROMIUM ?? "/opt/pw-browsers/chromium";
const launch = { headless: true };
if (fs.existsSync(pinned)) launch.executablePath = pinned;
const browser = await chromium.launch(launch);
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: "en-CA",
  ignoreHTTPSErrors: true,
});

await context.addInitScript(
  ({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
  },
  { key: saveKey, save: seedSave },
);

const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  const text = m.text();
  // Blocked outbound fetches are the sandbox proxy, not the game.
  if (m.type() === "error" && !/Failed to load resource|ERR_TUNNEL|ERR_CERT|ERR_TOO_MANY_RETRIES/.test(text)) {
    errors.push(`console: ${text}`);
  }
});

await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.locator('[data-ready="1"]').waitFor({ timeout: 20_000 });

const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
assert.ok(overflow <= 2, `Page overflows horizontally by ${overflow}px.`);

/**
 * The save is the window into game state from out here. It is written on a
 * debounce, so give it a beat before reading. The slot is scoped by identity
 * once a rider is seated, so take whichever slot is furthest along.
 */
const readSave = async () => {
  await page.waitForTimeout(900);
  return page.evaluate((base) => {
    const keys = Object.keys(localStorage).filter(
      (k) => (k === base || k.startsWith(`${base}:`)) && !k.endsWith(":bak"),
    );
    let best = null;
    for (const k of keys) {
      let parsed;
      try {
        parsed = JSON.parse(localStorage.getItem(k) ?? "{}");
      } catch {
        continue;
      }
      const score = (parsed.recon?.reports?.length ?? 0) * 1000 + (parsed.day ?? 0);
      if (!best || score > best.score) best = { score, s: parsed };
    }
    const s = best?.s ?? {};
    return {
      day: s.day ?? 0,
      watches: s.shift?.watchesLeft ?? -1,
      reports: s.recon?.reports?.length ?? 0,
      sites: Object.keys(s.recon?.sites ?? {}).length,
    };
  }, saveKey);
};

const report = page.locator("[data-recon-report]");

/* ---------------- Profile tab ---------------- */

await page.locator("[data-dock] [data-nav='profile']").click();
await page.locator('[data-profile="1"]').waitFor({ timeout: 10_000 });
// innerText comes back with CSS text-transform applied, so match lower-case.
const profileText = (await page.locator('[data-profile="1"]').innerText()).toLowerCase();
for (const needle of ["rider", "equipped", "ground", "records", "synapse rank", "open leads"]) {
  assert.ok(profileText.includes(needle), `Profile is missing the "${needle}" section.`);
}
assert.ok(profileText.includes("qa work knife"), "Profile does not show the equipped weapon.");
assert.ok(/intel\s+\d/.test(profileText), "Profile does not show region intel.");
console.log("· profile tab renders identity, loadout, ground and records");

/* ---------------- Open Ironclad ---------------- */

await page.locator("[data-dock] [data-nav='map']").click();
await page.getByRole("heading", { name: "World" }).waitFor({ timeout: 10_000 });
await page.locator("button", { hasText: "Ironclad" }).first().click();
await page.locator("[data-region-sheet='ironclad']").waitFor({ timeout: 10_000 });

/** Pin a workable site (not home, not the market) and spend a watch on it. */
const sweep = async (poiId = "ironclad-highway") => {
  const chip = page.locator(`[data-chip='${poiId}']`).first();
  if (await chip.count()) {
    await chip.scrollIntoViewIfNeeded();
    await chip.click();
  }
  const act = page.locator("[data-poi-act]").first();
  await act.scrollIntoViewIfNeeded();
  await act.click();
  await report.waitFor({ timeout: 10_000 });
};

const before = await readSave();
await sweep();
const afterFirst = await readSave();
assert.equal(afterFirst.watches, before.watches - 1, "A sweep must cost exactly one watch.");
assert.equal(afterFirst.reports, 1, "The sweep filed no report.");

const reportText = (await report.innerText()).toLowerCase();
assert.ok(/field report · day \d/.test(reportText), "Report has no header.");
assert.ok(reportText.includes("what the ground said"), "Report has no findings section.");
assert.ok(reportText.includes("tyrone ·"), "Report has no read-out from Tyrone.");
assert.ok(reportText.includes("hollow ·"), "Report has no Realm line.");
const stepCount = await page.locator("[data-recon-step]").count();
assert.ok(stepCount >= 2, "Report offers no follow-up actions.");
assert.ok(await page.locator("[data-recon-primary]").count(), "Report has no primary action.");
console.log(`· first sweep files a readable report with ${stepCount} next actions`);

/* ---------------- Chain until the shift is spent ---------------- */

let state = afterFirst;
for (let i = 0; i < 12 && state.watches > 0; i++) {
  const chain = page.locator("[data-recon-step='another']").first();
  assert.ok(
    await chain.count(),
    `No way to keep working at ${state.watches} watches left — this is the stall.`,
  );
  await chain.click();
  await report.waitFor({ timeout: 10_000 });
  const next = await readSave();
  assert.equal(next.watches, state.watches - 1, "Chaining a sweep did not cost a watch.");
  assert.equal(next.reports, state.reports + 1, "Chaining a sweep filed no report.");
  state = next;
}
assert.equal(state.watches, 0, "Could not spend the shift down to zero watches.");
assert.ok(state.sites >= 4, `Only ${state.sites} sites were ever read.`);
console.log(`· six watches spend down to zero, ${state.reports} reports filed, ${state.sites} sites read`);

/* ---------------- A spent shift is not a dead end ---------------- */

assert.equal(
  await page.locator("[data-recon-step='another']").count(),
  0,
  "A spent shift still offers another sweep.",
);
await page.locator("[data-recon-close]").first().click();
await report.waitFor({ state: "detached", timeout: 10_000 });
await sweep();

const spentText = await report.innerText();
assert.ok(
  /light is gone|shift spent/i.test(spentText),
  `A spent shift should still file a report. Got: ${spentText.slice(0, 160)}`,
);
const restButton = page.locator("[data-recon-report] button", { hasText: /Rest until dawn/i });
assert.ok(await restButton.count(), "A spent shift offers no way out. This is the stall.");
console.log("· a spent shift files a report whose primary action is Rest");

await restButton.first().click();
await page.waitForTimeout(700);
// Turning in a shift with required jobs still open is a decision, so the
// confirm sheet is expected here. Take it.
const restAnyway = page.getByRole("button", { name: /Rest anyway/i });
if (await restAnyway.count()) {
  console.log("· Rest asks about the jobs left open before it takes the day");
  await restAnyway.first().click();
}
const afterRest = await readSave();
assert.ok(afterRest.day > state.day, "Rest from the report did not advance the day.");
assert.ok(afterRest.watches > 0, "Dawn did not reprint the watches.");
assert.ok(afterRest.reports >= state.reports, "Dawn threw the field reports away.");
console.log(
  `· Rest advanced to day ${afterRest.day} with ${afterRest.watches} watches, ` +
    `${afterRest.reports} reports kept`,
);

if (errors.length) {
  console.error(errors.join("\n"));
  throw new Error(`${errors.length} console/page errors during the loop.`);
}

await browser.close();
console.log("\nGameplay loop QA passed.");
