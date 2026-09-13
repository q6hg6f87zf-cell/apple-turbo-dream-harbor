import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

const baseURL = process.env.HOLLOW_QA_URL ?? "http://127.0.0.1:8080";
const saveKey = "synaps-t0880-v1";

const resident = {
  id: "qa-op-1",
  name: "QA Runner",
  cls: "Rogue",
  race: "Human",
  lineage: "Vault 13",
  origin: "Ironclad",
  hp: 8,
  maxHp: 8,
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
  destiny: "Make it through the test.",
  destinyFired: false,
  giftUsed: false,
  inventory: [
    {
      id: "qa-old-knife",
      name: "QA Work Knife",
      kind: "weapon",
      rarity: "Common",
      condition: "Pristine",
      slot: "weapon",
      classHint: "Rogue",
      damage: "1d4",
      effect: "Reliable test blade.",
      lore: "This one exists so replacement preview has something to compare.",
      equipped: true,
      value: 80,
      sourceRegion: "ironclad"
    }
  ],
  companion: null,
  status: "idle",
  location: "hq",
  raids: 3,
  battles: 8,
  isHoF: false,
  curses: ["qa-contamination"],
  notes: "",
  joinedDay: 1
};

const seedSave = {
  started: true,
  tutorial: "done",
  screen: "inventory",
  day: 30,
  coins: 50_000,
  ore: 20,
  moonFavor: 12,
  rooms: { vault: 2, barracks: 2, forge: 1, infirmary: 1, watchtower: 1, ledger: 1 },
  quarters: { bunk: 1, lockbox: 1, hearth: 1 },
  operatives: [resident],
  vault: [
    {
      id: "qa-carbine",
      name: "QA Rail Carbine",
      kind: "weapon",
      rarity: "Rare",
      condition: "Pristine",
      slot: "weapon",
      classHint: "Rogue",
      damage: "1d10+1",
      effect: "Strong hit pins a target.",
      lore: "QA weapon.",
      value: 2100,
      sourceRegion: "ironclad"
    },
    {
      id: "qa-medgel",
      name: "QA Med-Gel",
      kind: "consumable",
      rarity: "Uncommon",
      condition: "Pristine",
      effect: "Restore 4 HP and clear one contamination condition.",
      lore: "QA medicine.",
      value: 420,
      sourceRegion: "ironclad"
    },
    {
      id: "qa-coil",
      name: "QA Ironbound Coil",
      kind: "enchantment",
      rarity: "Rare",
      condition: "Pristine",
      effect: "+1 DEF while below half HP.",
      lore: "QA enchantment.",
      value: 1800,
      sourceRegion: "ironclad"
    },
    {
      id: "qa-scrapsteel",
      name: "QA Scrapsteel Bundle",
      kind: "material",
      rarity: "Common",
      condition: "Pristine",
      effect: "Vault construction stock.",
      lore: "QA material.",
      value: 140,
      sourceRegion: "ironclad"
    }
  ],
  squad: [
    {
      id: "qa-rider",
      name: "QA Rider",
      discordId: null,
      discordHandle: "@qa",
      personalCaps: 2500,
      xp: 35,
      note: "",
      joinedDay: 1,
      lastTurnDay: 0
    },
    {
      id: "qa-rider-2",
      name: "QA Rider Two",
      discordId: null,
      discordHandle: "@qa2",
      personalCaps: 1800,
      xp: 35,
      note: "",
      joinedDay: 1,
      lastTurnDay: 0
    }
  ],
  activeMemberId: "qa-rider",
  seenTalk: ["briefing", "resume", "inventory"],
  talk: null,
  talkQueue: []
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 428, height: 926 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: "en-CA"
});

await context.addInitScript(({ key, save }) => {
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(save));
  }
}, { key: saveKey, save: seedSave });

const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});

await page.goto(baseURL, { waitUntil: "networkidle", timeout: 60_000 });
await page.locator('[data-ready="1"]').waitFor({ timeout: 20_000 });
await page.getByRole("heading", { name: "Inventory" }).waitFor();

const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
assert.ok(overflow <= 2, `Mobile page overflows horizontally by ${overflow}px.`);

// Vault item -> preview -> one-tap issue and equip.
await page.getByRole("button", { name: /QA Rail Carbine/ }).click();
await page.getByText("Power", { exact: true }).waitFor();
await page.getByRole("button", { name: /Issue & Equip to QA Runner/ }).click();
await page.getByRole("button", { name: /QA Rail Carbine/ }).click();
await page.getByRole("button", { name: /Unequip/ }).waitFor();
await page.getByRole("button", { name: /Unequip/ }).click();

// Consumable is targeted and consumed from the real owned list.
const medGel = page.getByText("QA Med-Gel", { exact: true });
await medGel.click();
await page.getByRole("button", { name: /Use on QA Runner/ }).click();
await medGel.waitFor({ state: "detached", timeout: 5_000 });

// Enchantment attaches to resident gear and disappears as a loose item. The
// enchantment name is expected to remain inside the target gear effect text.
const looseCoilTitle = page.getByText("QA Ironbound Coil", { exact: true });
await looseCoilTitle.click();
await page.getByRole("button", { name: /Attach to gear/ }).click();
await looseCoilTitle.waitFor({ state: "detached", timeout: 5_000 });
await page.getByText(/QA Ironbound Coil: \+1 DEF/).waitFor({ timeout: 5_000 });

// Contextual Tyrone explanation.
await page.getByText("QA Scrapsteel Bundle", { exact: true }).click();
await page.getByRole("button", { name: "How to use" }).click();
await page.getByText(/Construction stock, not pocket clutter|Material stays in Vault 13/).waitFor();

// Move the persisted file into World and exercise the orbital renderer.
await page.evaluate((key) => {
  const save = JSON.parse(localStorage.getItem(key) || "{}");
  save.screen = "map";
  save.talk = null;
  localStorage.setItem(key, JSON.stringify(save));
}, saveKey);
await page.reload({ waitUntil: "networkidle" });
await page.getByText(/Orbital Command/).waitFor({ timeout: 20_000 });
assert.ok((await page.locator("canvas").count()) >= 1, "World renderer did not mount a canvas.");

const worldOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
assert.ok(worldOverflow <= 2, `World screen overflows horizontally by ${worldOverflow}px.`);

fs.mkdirSync("artifacts", { recursive: true });
await page.screenshot({ path: "artifacts/hollow-realm-iphone-smoke.png", fullPage: true });

assert.deepEqual(errors, [], `Browser errors detected:\n${errors.join("\n")}`);
console.log("Hollow Realm iPhone smoke passed: Inventory actions, Tyrone help and World renderer.");

await browser.close();
