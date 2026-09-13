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
  seenTalk: ["briefing", "inventory"],
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

await page.goto(baseURL, { waitUntil: "networkidle", timeout: 60_000 });
await page.getByRole("heading", { name: "Inventory" }).waitFor({ timeout: 20_000 });
await page.getByText(/server-sealed loadout/i).waitFor();
await page.getByText("LOCAL MYTHIC CHEAT CANNON", { exact: true }).waitFor({ state: "detached", timeout: 10_000 });

const rail = page.getByText("Railspike Carbine", { exact: true }).first();
await rail.waitFor({ timeout: 10_000 });
await rail.click();
const unequip = page.getByRole("button", { name: /Unequip/ });
await unequip.waitFor();
await unequip.click();

// UI copy is allowed to evolve. The contract that matters is that both the
// hydrated Zustand cache and the server item ledger settle the Unequip.
await page.waitForFunction(async () => {
  const mod = await import("/src/game/store.ts");
  const rail = mod.useGame.getState().s.operatives.flatMap((op) => op.inventory).find((item) => item.name === "Railspike Carbine");
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
await page.evaluate(async () => {
  const mod = await import("/src/game/store.ts");
  mod.useGame.setState((store) => {
    const op = store.s.operatives.find((entry) => entry.id === "qa-op-ironbound-01");
    if (!op) return store;
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
      value: 999999999
    };
    return {
      s: {
        ...store.s,
        operatives: store.s.operatives.map((entry) => entry.id === op.id ? { ...entry, inventory: [...entry.inventory, fake] } : entry)
      }
    };
  });
});

await page.waitForFunction(async () => {
  const mod = await import("/src/game/store.ts");
  return !mod.useGame.getState().s.operatives.some((op) => op.inventory.some((item) => item.id === "live-forged-cheat-item"));
}, null, { timeout: 5_000 });
await page.getByText(/rejected an unsealed local Inventory change/i).waitFor({ timeout: 5_000 });

const liveState = await page.evaluate(async () => {
  const mod = await import("/src/game/store.ts");
  const s = mod.useGame.getState().s;
  return {
    fakeCount: [...s.vault, ...s.operatives.flatMap((op) => op.inventory)].filter((item) => item.id === "live-forged-cheat-item").length,
    rail: s.operatives.flatMap((op) => op.inventory).find((item) => item.name === "Railspike Carbine") ?? null
  };
});
assert.equal(liveState.fakeCount, 0, "Live forged item survived the server ownership fingerprint.");
assert.equal(liveState.rail?.equipped, false, "Server Unequip action did not settle into the local cache.");
assert.deepEqual(errors, [], `Browser errors detected:\n${errors.join("\n")}`);

console.log("Hollow server Inventory browser smoke passed: durable server UI action settled and live forged gear was rejected immediately.");
await browser.close();
