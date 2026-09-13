import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = process.env.HOLLOW_QA_URL ?? "http://127.0.0.1:8080";
const saveKey = "synaps-t0880-v1";

const resident = {
  id: "ux-op-1",
  name: "UX Runner",
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
  destiny: "Close every sticky panel.",
  destinyFired: false,
  giftUsed: false,
  inventory: [],
  companion: null,
  status: "idle",
  location: "hq",
  raids: 3,
  battles: 8,
  isHoF: false,
  curses: [],
  notes: "",
  joinedDay: 1,
};

const seed = {
  started: true,
  tutorial: "done",
  screen: "roster",
  day: 12,
  coins: 12_000,
  ore: 4,
  moonFavor: 3,
  rooms: { vault: 1, barracks: 1, forge: 1, infirmary: 0, watchtower: 0, ledger: 0 },
  quarters: { bunk: 0, lockbox: 0, hearth: 0 },
  operatives: [resident],
  vault: [{
    id: "ux-carbine",
    name: "UX Rail Carbine",
    kind: "weapon",
    rarity: "Rare",
    condition: "Pristine",
    slot: "weapon",
    classHint: "Rogue",
    damage: "1d10",
    effect: "UX fixture.",
    lore: "Exists to exercise the item detail sheet.",
    equipped: false,
    value: 1200,
    sourceRegion: "ironclad",
  }],
  squad: [{
    id: "ux-rider",
    name: "UX Rider",
    discordId: null,
    discordHandle: "@ux",
    personalCaps: 0,
    xp: 0,
    note: "",
    joinedDay: 1,
    lastTurnDay: 0,
  }],
  activeMemberId: "ux-rider",
  seenTalk: ["briefing", "resume", "inventory", "roster"],
  talk: null,
  talkQueue: [],
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 428, height: 926 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: "en-CA",
});
await context.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: saveKey, save: seed });

const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });

await page.goto(baseURL, { waitUntil: "networkidle", timeout: 60_000 });
await page.locator('[data-ready="1"]').waitFor({ timeout: 20_000 });

// Resident drawer: open from a real roster control, then dismiss by tapping the
// backdrop rather than hunting for an X.
await page.getByText("UX Runner", { exact: true }).first().click();
const dossierClose = page.getByRole("button", { name: "Close dossier" });
await dossierClose.waitFor();
const sheet = page.locator("aside.ms-sheet");
await sheet.waitFor();
const sheetBackdrop = sheet.locator("..");
await sheetBackdrop.click({ position: { x: 8, y: 120 } });
await dossierClose.waitFor({ state: "detached", timeout: 5_000 });

// Tyrone field manual: backdrop tap must close it.
const help = page.getByRole("button", { name: "Ask Tyrone" }).last();
await help.click();
const dialog = page.getByRole("dialog");
await dialog.waitFor();
const helpBackdrop = page.locator("div.fixed.inset-0").filter({ has: dialog });
await helpBackdrop.click({ position: { x: 8, y: 8 } });
await dialog.waitFor({ state: "detached", timeout: 5_000 });

// Dangerous-rest confirmation: outside tap is a cancel, never an accidental
// destructive confirmation.
await page.evaluate(async () => {
  const mod = await import("/src/game/store.ts");
  mod.useGame.setState((store) => ({
    s: {
      ...store.s,
      rooms: { ...store.s.rooms, infirmary: 0 },
      operatives: store.s.operatives.map((op) => op.id === "ux-op-1" ? { ...op, hp: 0, status: "downed" } : op),
    },
  }));
});
await page.getByRole("button", { name: /Dawn|Rest until dawn/ }).click();
const dawnHeading = page.getByRole("heading", { name: "Dawn is a decision" });
await dawnHeading.waitFor();
const restBackdrop = page.locator("div.fixed.inset-0").filter({ has: dawnHeading });
await restBackdrop.click({ position: { x: 8, y: 8 } });
await dawnHeading.waitFor({ state: "detached", timeout: 5_000 });

// Restore the resident so other screens stay usable.
await page.evaluate(async () => {
  const mod = await import("/src/game/store.ts");
  mod.useGame.setState((store) => ({
    s: {
      ...store.s,
      operatives: store.s.operatives.map((op) => op.id === "ux-op-1" ? { ...op, hp: op.maxHp, status: "idle" } : op),
    },
  }));
});

// Primary navigation should be actual thumb-sized controls, not decorative
// labels. Walk every destination and verify the screen state moves with it.
const destinations = [
  ["Vault 13", "hq"],
  ["World", "map"],
  ["Squad", "roster"],
  ["Inventory", "inventory"],
  ["More", "more"],
];
for (const [label, expected] of destinations) {
  const button = page.getByRole("button", { name: label, exact: true }).last();
  const box = await button.boundingBox();
  assert.ok(box && box.height >= 44 && box.width >= 44, `${label} is smaller than a 44px mobile touch target.`);
  await button.click();
  await page.locator(`[data-screen="${expected}"]`).waitFor({ timeout: 5_000 });
}

// Inventory local detail sheets must dismiss with Escape as well as backdrop/X.
await page.getByRole("button", { name: "Inventory", exact: true }).last().click();
await page.getByRole("heading", { name: "Inventory" }).waitFor();
await page.getByRole("button", { name: /UX Rail Carbine/ }).click();
const inventoryModal = page.locator("div.fixed.inset-0").filter({ hasText: "UX Rail Carbine" });
await inventoryModal.waitFor();
await page.keyboard.press("Escape");
await inventoryModal.waitFor({ state: "detached", timeout: 5_000 });

const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
assert.ok(overflow <= 2, `AAA interaction pass introduced ${overflow}px horizontal overflow.`);
assert.deepEqual(errors, [], `Browser errors detected:\n${errors.join("\n")}`);

console.log("Hollow UX smoke passed: backdrop dismissal, Escape dismissal, nav switching and 44px primary touch targets.");
await browser.close();
