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
  seenTalk: ["briefing", "resume", "inventory", "kane", "wake"],
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

// Vite HMR keeps a websocket open — networkidle never settles in CI.
await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.locator('[data-ready="1"]').waitFor({ timeout: 20_000 });
await page.locator('[data-inventory="1"]').waitFor({ timeout: 20_000 });

const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
assert.ok(overflow <= 2, `Mobile page overflows horizontally by ${overflow}px.`);

// Authoritative stack logic: repeated bonuses diminish, specialization creates
// a predictable opposing-stat penalty, buff saturation has a cost, and extreme
// enchantment resonance becomes unstable rather than scaling forever.
const stackProbe = await page.evaluate(async () => {
  const stack = await import("/src/game/loadout-effects.ts");
  const overloaded = {
    id: "stack-op",
    name: "Stack Probe",
    cls: "Rogue",
    race: "Human",
    lineage: "QA",
    origin: "QA",
    hp: 10,
    maxHp: 10,
    repTitle: "QA",
    repPassive: "",
    traitLevel: "Standard",
    traitBonus: 0,
    skillName: "QA",
    skillDesc: "",
    shadowName: "QA",
    shadowDesc: "",
    enchantName: "QA",
    enchantDesc: "",
    destiny: "QA",
    destinyFired: false,
    giftUsed: false,
    inventory: [
      {
        id: "stack-weapon",
        name: "Velocity Blade",
        kind: "weapon",
        rarity: "Mythic",
        condition: "Pristine",
        slot: "weapon",
        damage: "1d8",
        effect: "+4 SPD. +2 damage.",
        lore: "QA",
        equipped: true,
        value: 1,
        tags: ["enchant:a", "enchant:b", "enchant:c"]
      },
      {
        id: "stack-armor",
        name: "Ward Shell",
        kind: "armor",
        rarity: "Legendary",
        condition: "Pristine",
        slot: "armor",
        defense: 2,
        effect: "+4 DEF.",
        lore: "QA",
        equipped: true,
        value: 1,
        tags: ["enchant:d", "enchant:e"]
      },
      {
        id: "stack-trinket",
        name: "Velocity Relay",
        kind: "trinket",
        rarity: "Mythic",
        condition: "Pristine",
        slot: "trinket",
        effect: "+4 SPD.",
        lore: "QA",
        equipped: true,
        value: 1,
        tags: ["enchant:f", "enchant:g"]
      }
    ],
    activeItemEffects: [
      { name: "Stim A", effect: "+2 SPD", expires: "sortie" },
      { name: "Stim B", effect: "+2 SPD", expires: "sortie" },
      { name: "Stim C", effect: "+2 SPD", expires: "sortie" },
      { name: "Stim D", effect: "+2 SPD", expires: "sortie" }
    ],
    companion: null,
    status: "idle",
    location: "hq",
    raids: 0,
    battles: 0,
    isHoF: false,
    curses: [],
    notes: "",
    joinedDay: 1
  };

  const analysis = stack.analyzeLoadout(overloaded);
  const fullRare = {
    id: "rare-full",
    name: "Rare Full",
    kind: "weapon",
    rarity: "Rare",
    condition: "Pristine",
    slot: "weapon",
    effect: "QA",
    lore: "QA",
    equipped: false,
    value: 1,
    tags: ["enchant:first", "enchant:second"]
  };
  const extraEnchant = {
    id: "extra-enchant",
    name: "Third Coil",
    kind: "enchantment",
    rarity: "Rare",
    condition: "Pristine",
    effect: "+1 SPD",
    lore: "QA",
    equipped: false,
    value: 1
  };
  return {
    analysis,
    socket: stack.enchantmentSocketStatus(fullRare),
    block: stack.canAttachEnchantment(fullRare, extraEnchant)
  };
});

assert.ok((stackProbe.analysis.statBonuses.SPD ?? 0) > 4, "SPD stack did not build enough pressure for specialization testing.");
assert.ok((stackProbe.analysis.statBonuses.SPD ?? 0) < 16, "Repeated SPD bonuses are not diminishing.");
assert.ok((stackProbe.analysis.statPenalties.DEF ?? 0) < 0, "SPD specialization did not trade away DEF.");
assert.ok((stackProbe.analysis.statPenalties.WIS ?? 0) < 0, "Buff/enchantment saturation did not penalize WIS.");
assert.ok((stackProbe.analysis.statPenalties.LCK ?? 0) < 0, "Extreme resonance did not penalize LCK.");
assert.ok(["strained", "critical"].includes(stackProbe.analysis.pressure), `Expected strained/critical loadout, got ${stackProbe.analysis.pressure}.`);
assert.equal(stackProbe.socket.used, 2);
assert.equal(stackProbe.socket.capacity, 2);
assert.match(stackProbe.block ?? "", /resonance capacity/i);

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

// Use the same mobile navigation a real player uses rather than mutating save
// data underneath the page. force is intentional because the item sheet is
// still open and changing screens should dismiss that component naturally.
await page.getByRole("button", { name: "World", exact: true }).click({ force: true });
await page.getByRole("heading", { name: "World", exact: true }).waitFor({ timeout: 20_000 });
await page.getByText(/Pick a region to brief the sortie/i).waitFor({ timeout: 10_000 });
await page.getByRole("button", { name: /Orbit the world/i }).click();
await page.waitForTimeout(800);
assert.ok((await page.locator("canvas").count()) >= 1, "Orbit theater did not mount a canvas.");

const worldOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
assert.ok(worldOverflow <= 2, `World screen overflows horizontally by ${worldOverflow}px.`);

fs.mkdirSync("artifacts", { recursive: true });
await page.screenshot({ path: "artifacts/hollow-realm-iphone-smoke.png", fullPage: true });

assert.deepEqual(errors, [], `Browser errors detected:\n${errors.join("\n")}`);
console.log("Hollow Realm iPhone smoke passed: stack pressure, Inventory actions, Tyrone help and World renderer.");

await browser.close();
