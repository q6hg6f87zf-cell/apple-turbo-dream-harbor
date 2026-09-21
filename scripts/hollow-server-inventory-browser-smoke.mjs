import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = process.env.HOLLOW_QA_URL ?? "http://127.0.0.1:8080";
const saveKey = "synaps-t0880-v1";
const discord = "123456789012345678";

const seed = {
  started: true,
  tutorial: "done",
  screen: "inventory",
  day: 2,
  discordId: discord,
  discordName: "QA Rider",
  operatives: [{
    id: "qa-op-ironbound-01",
    name: "QA Ironbound",
    cls: "Warrior",
    race: "Human",
    lineage: "Vault 13",
    origin: "Ironclad",
    hp: 12,
    maxHp: 12,
    repTitle: "QA",
    repPassive: "QA",
    traitLevel: "Standard",
    traitBonus: 0,
    skillName: "QA",
    skillDesc: "QA",
    shadowName: "QA",
    shadowDesc: "QA",
    enchantName: "QA",
    enchantDesc: "QA",
    destiny: "QA",
    destinyFired: false,
    giftUsed: false,
    inventory: [{
      id: "forged-local-weapon",
      name: "LOCAL MYTHIC CHEAT CANNON",
      kind: "weapon",
      rarity: "Mythic",
      condition: "Pristine",
      slot: "weapon",
      damage: "99d99",
      effect: "+999 damage",
      lore: "Should never survive authority hydration.",
      equipped: true,
      value: 99999999
    }],
    companion: null,
    status: "idle",
    location: "hq",
    raids: 1,
    battles: 1,
    isHoF: false,
    curses: [],
    notes: "",
    joinedDay: 1
  }],
  vault: [],
  squad: [{
    id: "qa-rider",
    name: "QA Rider",
    discordId: discord,
    discordHandle: "@qa",
    personalCaps: 0,
    xp: 0,
    note: "",
    joinedDay: 1,
    lastTurnDay: 0
  }],
  activeMemberId: "qa-rider",
  seenTalk: ["briefing", "inventory", "kane", "wake"],
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
await context.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: saveKey, save: seed });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });

// Vite HMR keeps a websocket open — networkidle never settles in CI.
await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 60_000 });
// Inventory is a hub screen now — no page heading. Wait for the pack frame.
await page.locator('[data-inventory="1"]').waitFor({ timeout: 20_000 });
await page.waitForFunction(() => !!window.__hollowQa?.getState && !!window.__hollowQa?.setState, null, {
  timeout: 20_000,
});
// Authority hydration replaces the seeded mythic cheat with the sealed ledger.
const rail = page.getByText("Railspike Carbine", { exact: true }).first();
await rail.waitFor({ timeout: 20_000 });
assert.equal(
  await page.getByText("LOCAL MYTHIC CHEAT CANNON", { exact: true }).count(),
  0,
  "Seeded mythic cheat still visible after Inventory authority hydration.",
);
await rail.click();
const unequip = page.getByRole("button", { name: /Unequip/ });
await unequip.waitFor();
await unequip.click();

// UI copy is allowed to evolve. The contract that matters is that both the
// hydrated Zustand cache and the server item ledger settle the Unequip.
await page.waitForFunction(() => {
  const rail = window.__hollowQa
    .getState()
    .operatives.flatMap((op) => op.inventory)
    .find((item) => item.name === "Railspike Carbine");
  return !!rail && rail.equipped === false;
}, null, { timeout: 10_000 });
const serverRailEquipped = await page.evaluate(async () => {
  const response = await fetch("/api/hollow/inventory", { headers: { accept: "application/json" } });
  const snapshot = await response.json();
  const rail = snapshot.items.find((entry) => entry.item?.name === "Railspike Carbine");
  return rail?.item?.equipped;
});
assert.equal(serverRailEquipped, false, "Server item ledger did not persist the Unequip action.");

// Inject a new fake item directly into live Zustand after authority hydration.
// The runtime must snap it back out without waiting for the 30s poll.
await page.evaluate(() => {
  window.__hollowQa.setState((current) => {
    const op = current.s.operatives.find((entry) => entry.id === "qa-op-ironbound-01");
    if (!op) return current;
    const fake = {
      id: "live-forged-cheat-item",
      name: "LIVE FORGED RELIC",
      kind: "weapon",
      rarity: "Mythic",
      condition: "Pristine",
      slot: "weapon",
      damage: "999d999",
      effect: "+9999 damage",
      lore: "Injected from devtools",
      equipped: true,
      value: 999999999,
    };
    return {
      s: {
        ...current.s,
        operatives: current.s.operatives.map((entry) =>
          entry.id === op.id ? { ...entry, inventory: [...entry.inventory, fake] } : entry,
        ),
      },
    };
  });
});

await page.waitForFunction(() => {
  return !window.__hollowQa
    .getState()
    .operatives.some((op) => op.inventory.some((item) => item.id === "live-forged-cheat-item"));
}, null, { timeout: 5_000 });
await page.getByText(/rejected an unsealed local Inventory change/i).waitFor({ timeout: 5_000 });

const liveState = await page.evaluate(() => {
  const s = window.__hollowQa.getState();
  return {
    fakeCount: [...s.vault, ...s.operatives.flatMap((op) => op.inventory)].filter(
      (item) => item.id === "live-forged-cheat-item",
    ).length,
    rail: s.operatives.flatMap((op) => op.inventory).find((item) => item.name === "Railspike Carbine") ?? null,
  };
});
assert.equal(liveState.fakeCount, 0, "Live forged item survived the server ownership fingerprint.");
assert.equal(liveState.rail?.equipped, false, "Server Unequip action did not settle into the local cache.");
assert.deepEqual(errors, [], `Browser errors detected:\n${errors.join("\n")}`);

console.log("Hollow server Inventory browser smoke passed: durable server UI action settled and live forged gear was rejected immediately.");
await browser.close();
