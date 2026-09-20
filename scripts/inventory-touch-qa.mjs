import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });

function seedSave() {
  try {
    localStorage.clear();
    localStorage.setItem(
      "synaps-t0880-v1",
      JSON.stringify({
        started: true,
        tutorial: "done",
        screen: "hq",
        openedFrom: null,
        playerName: "Brent",
        seenTalk: ["wake", "welcome", "briefing", "forge", "hq", "inventory", "market", "roster"],
        talk: null,
        talkQueue: [],
        operatives: [
          {
            id: "mira",
            name: "Mira",
            cls: "Warrior",
            race: "Human",
            lineage: "Wasteland",
            origin: "Ironclad",
            hp: 12,
            maxHp: 12,
            repTitle: "Hand",
            repPassive: "",
            traitLevel: "I",
            traitBonus: 0,
            skillName: "Strike",
            skillDesc: "",
            shadowName: "",
            shadowDesc: "",
            enchantName: "",
            enchantDesc: "",
            destiny: "",
            destinyFired: false,
            giftUsed: false,
            inventory: [],
            companion: null,
            status: "idle",
            location: "hq",
            raids: 1,
            battles: 1,
            isHoF: false,
            curses: [],
            notes: "",
            joinedDay: 1,
          },
        ],
        day: 3,
      }),
    );
  } catch {
    /* ignore */
  }
}

async function skipInto(page) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const already = await page.locator("[data-chrome]").waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
  if (already) return;
  const enter = page.locator("[data-enter-hollow]");
  if ((await enter.isVisible().catch(() => false)) && !(await page.locator("[data-chrome]").count())) {
    await enter.click();
    await page.waitForTimeout(400);
  }
  if (await page.locator("[data-chrome]").count()) return;
  const resume = page.getByRole("button", { name: /Resume|Wake up|Assume command/i });
  if (await resume.isVisible({ timeout: 8000 }).catch(() => false)) {
    await resume.click();
    await page.waitForTimeout(400);
  }
  for (let i = 0; i < 24; i++) {
    if (await page.locator("[data-chrome]").count()) break;
    const skip = page.getByRole("button", { name: /^Skip$/i });
    if (await skip.isVisible().catch(() => false)) {
      await skip.click();
      await page.waitForTimeout(160);
      continue;
    }
    const card = page.locator(".ms-wake-card, [data-wake-portrait]");
    if (await card.first().isVisible().catch(() => false)) {
      await card.first().click({ force: true });
      await page.waitForTimeout(120);
      continue;
    }
    break;
  }
  await page.waitForSelector("[data-chrome]", { timeout: 20_000 });
}

async function dismissTalk(page) {
  for (let i = 0; i < 8; i++) {
    const skip = page.getByRole("button", { name: /^Skip$/i });
    if (await skip.isVisible().catch(() => false)) {
      await skip.click();
      await page.waitForTimeout(180);
      continue;
    }
    break;
  }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
await context.addInitScript(seedSave);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

async function swipeOn(el, dy) {
  const box = await el.boundingBox();
  if (!box) throw new Error("no box");
  const listBox = await page.locator("[data-inventory-list]").boundingBox();
  const x = box.x + box.width / 2;
  const minY = listBox ? listBox.y + 12 : box.y;
  const maxY = listBox ? listBox.y + listBox.height - 12 : box.y + box.height;
  const y = Math.min(Math.max(box.y + Math.min(40, box.height / 2), minY), maxY);
  const travel = Math.max(-Math.abs(dy), minY - y);
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, radiusX: 8, radiusY: 8, force: 1, id: 1 }],
  });
  const steps = 16;
  for (let i = 1; i <= steps; i++) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: y + (travel * i) / steps, radiusX: 8, radiusY: 8, force: 1, id: 1 }],
    });
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

await skipInto(page);
await dismissTalk(page);
const invNav = page.locator("[data-dock] [data-nav='inventory']");
await invNav.waitFor({ timeout: 10_000 });
await invNav.click();
await page.waitForTimeout(400);
await dismissTalk(page);
await page.getByRole("button", { name: /Catalogue/i }).click();
await page.waitForTimeout(400);

const list = page.locator("[data-inventory-list]");
await list.waitFor({ timeout: 10_000 });
const row = page.locator("[data-inventory-row]").nth(2);
await row.waitFor();

const touchAction = await row.evaluate((el) => getComputedStyle(el).touchAction);
const headerOutside = await page.locator("[data-inventory-header]").isVisible();
const headerInList = await list.locator("[data-inventory-header]").count();
const hitInventory = await row.evaluate((el) => {
  const r = el.getBoundingClientRect();
  const top = document.elementFromPoint(r.x + r.width / 2, r.y + Math.min(20, r.height / 2));
  return !!(top && (top === el || el.contains(top) || top.closest?.("[data-inventory-list]")));
});

await list.evaluate((el) => {
  el.scrollTop = 0;
});
const before = await list.evaluate((el) => el.scrollTop);
await swipeOn(row, -420);
await page.waitForTimeout(500);
const afterSwipe = await list.evaluate((el) => el.scrollTop);
const inspectAfterSwipe = await page.locator("[data-item-inspect]").count();
await page.screenshot({ path: "/workspace/screenshots/inventory-touch-scroll.png" });

await page.locator("[data-inventory-row]").nth(1).click();
await page.waitForTimeout(300);
const inspectAfterTap = await page.locator("[data-item-inspect]").count();
await page.screenshot({ path: "/workspace/screenshots/inventory-touch-tap.png" });
await page.getByRole("button", { name: /Close item/i }).click().catch(async () => {
  await page.locator("[data-item-inspect]").click({ position: { x: 8, y: 8 } });
});
await page.waitForTimeout(250);
const inspectClosed = await page.locator("[data-item-inspect]").count();

await list.evaluate((el) => {
  el.scrollTop = 0;
});
await swipeOn(page.locator("[data-inventory-row]").nth(3), -380);
await page.waitForTimeout(400);
const afterSecond = await list.evaluate((el) => el.scrollTop);

const result = {
  touchAction,
  headerOutside,
  headerInList,
  hitInventory,
  before,
  afterSwipe,
  inspectAfterSwipe,
  inspectAfterTap,
  inspectClosed,
  afterSecond,
  rowCount: await page.locator("[data-inventory-row]").count(),
  errors,
};
writeFileSync("/workspace/screenshots/inventory-touch-qa.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

const ok =
  touchAction.includes("pan-y") &&
  headerOutside &&
  headerInList === 0 &&
  hitInventory &&
  afterSwipe > 80 &&
  inspectAfterSwipe === 0 &&
  inspectAfterTap === 1 &&
  inspectClosed === 0 &&
  afterSecond > 80 &&
  errors.length === 0;

await browser.close();
process.exit(ok ? 0 : 1);
