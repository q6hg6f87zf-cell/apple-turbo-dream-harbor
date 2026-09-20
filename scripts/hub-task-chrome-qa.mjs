import { chromium } from "playwright";
// Sandboxes whose baked Chromium predates the installed Playwright can point
// this at the binary they do have.
const executablePath = process.env.HOLLOW_QA_CHROMIUM || undefined;
import { mkdirSync, writeFileSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("screenshots", { recursive: true });

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
        seenTalk: ["wake", "welcome", "briefing", "forge"],
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
  if (await enter.isVisible().catch(() => false) && !(await page.locator("[data-chrome]").count())) {
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

async function goMarket(page) {
  const more = page.locator("[data-dock] [data-nav='more']");
  if (await more.count()) {
    await more.click();
    await page.waitForTimeout(220);
  }
  await page.getByText("Moon Squad Market", { exact: true }).click();
  await page.waitForTimeout(350);
}

async function openMoreTool(page, label) {
  if (await page.locator("[data-task-back]").count()) {
    await page.locator("[data-task-back]").click();
    await page.waitForTimeout(250);
  }
  if (await page.locator("[data-dock] [data-nav='more']").count()) {
    await page.locator("[data-dock] [data-nav='more']").click();
    await page.waitForTimeout(200);
  }
  await page.getByText(label, { exact: true }).click();
  await page.waitForTimeout(300);
}

function measureScript() {
  const box = (el) => (el ? el.getBoundingClientRect() : null);
  const header = document.querySelector("[data-hub-header], [data-task-header]");
  const guidance = document.querySelector("[data-guidance]");
  const dock = document.querySelector("[data-dock]");
  const rail = document.querySelector("[data-rail]");
  const breath = document.querySelector("[data-scene-breath]");
  const peek = document.querySelector(".ms-room-peek");
  const back = document.querySelector("[data-task-back]");
  const fab = document.querySelector(".ms-help");
  const art = document.querySelector("[data-scene-art]");
  const veil = document.querySelector("[data-scene-veil]");
  const backdrop = document.querySelector("[data-scene-backdrop]");
  const main = document.querySelector("main");
  const root = document.querySelector("[data-chrome]");
  const breathKids = breath
    ? [...breath.querySelectorAll("h1,h2,h3,p")].map((n) => n.textContent?.trim()).filter(Boolean)
    : [];
  const artStyle = art ? getComputedStyle(art) : null;
  const veilStyle = veil ? getComputedStyle(veil) : null;
  const backStyle = backdrop ? getComputedStyle(backdrop) : null;
  const overflowX = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    chrome: root?.getAttribute("data-chrome"),
    screen: root?.getAttribute("data-screen"),
    header: header ? { h: Math.round(box(header).height), top: Math.round(box(header).top) } : null,
    guidance: guidance ? { h: Math.round(box(guidance).height), mode: guidance.getAttribute("data-guidance") } : null,
    dock: dock && getComputedStyle(dock).display !== "none" ? { h: Math.round(box(dock).height) } : null,
    railDisplay: rail ? getComputedStyle(rail).display : "none",
    breath: breath ? { h: Math.round(box(breath).height), kids: breathKids } : null,
    peek: peek ? { h: Math.round(box(peek).height) } : null,
    back: back ? { top: Math.round(box(back).top), h: Math.round(box(back).height) } : null,
    fabVisible: !!(fab && getComputedStyle(fab).display !== "none" && box(fab)?.width),
    art: art
      ? {
          opacity: artStyle.opacity,
          display: artStyle.display,
          pointer: artStyle.pointerEvents,
          src: art.getAttribute("src"),
        }
      : null,
    veil: veil
      ? {
          opacity: veilStyle.opacity,
          pointer: veilStyle.pointerEvents,
          bg: veilStyle.backgroundImage || veilStyle.background,
        }
      : null,
    backdropPointer: backStyle?.pointerEvents ?? null,
    mainPadBottom: main ? getComputedStyle(main).paddingBottom : null,
    overflowX,
  };
}

const browser = await chromium.launch({ headless: true, executablePath });
const results = {};
const errors = [];

async function shot(page, name) {
  const m = await page.evaluate(measureScript);
  results[name] = m;
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: false });
}

{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  await context.addInitScript(seedSave);
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(String(e)));
  await skipInto(page);
  await shot(page, "chrome-after-hub-quiet");
  await goMarket(page);
  await shot(page, "chrome-after-market");
  await openMoreTool(page, "Resident Forge");
  await shot(page, "chrome-after-forge");
  await openMoreTool(page, "Moon Squad Card");
  await shot(page, "chrome-after-ledger");
  await openMoreTool(page, "Salvage Depot");
  await shot(page, "chrome-after-vault");
  await openMoreTool(page, "Archive Terminal");
  await shot(page, "chrome-after-codex");
  if (await page.locator("[data-task-back]").count()) {
    await page.locator("[data-task-back]").click();
    await page.waitForTimeout(250);
  }
  await page.locator("[data-dock] [data-nav='inventory']").click();
  await page.waitForTimeout(400);
  await shot(page, "chrome-after-inventory");
  await context.close();
}

{
  const context = await browser.newContext({
    viewport: { width: 428, height: 926 },
    hasTouch: true,
    isMobile: true,
  });
  await context.addInitScript(seedSave);
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(String(e)));
  await skipInto(page);
  await shot(page, "chrome-after-hub-428");
  await goMarket(page);
  await shot(page, "chrome-after-market-428");
  await context.close();
}

{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  await context.addInitScript(seedSave);
  const page = await context.newPage();
  await skipInto(page);
  await goMarket(page);
  await page.addStyleTag({
    content: `
      [data-task-header], [data-hub-header] { padding-top: 47px !important; }
      [data-dock] { padding-bottom: 34px !important; }
      .ms-shell-hub-pad { padding-bottom: calc(3.5rem + 34px) !important; }
      .ms-shell-task-pad { padding-bottom: 34px !important; }
    `,
  });
  await page.waitForTimeout(200);
  await shot(page, "chrome-after-safe-area");
  await context.close();
}

{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  await context.addInitScript(seedSave);
  const page = await context.newPage();
  await skipInto(page);
  const reduced = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  await goMarket(page);
  const taskReady = await page.locator("[data-task-back]").isVisible();
  results.reducedMotion = { reduced, taskReady };
  await context.close();
}

writeFileSync("screenshots/hub-task-chrome-qa.json", JSON.stringify({ results, errors }, null, 2));
console.log(JSON.stringify({ results, errors }, null, 2));

const hub = results["chrome-after-hub-quiet"];
const market = results["chrome-after-market"];
const vh = hub?.viewport?.h ?? 844;
const hubChrome = (hub?.header?.h ?? 999) + (hub?.dock?.h ?? 999);
const hubPct = (hubChrome / vh) * 100;
const artOk = (m) =>
  m?.art &&
  m.art.display !== "none" &&
  Number(m.art.opacity) > 0 &&
  m.art.pointer === "none" &&
  m.backdropPointer === "none";
const veilNotOpaque = (m) => m?.veil && !/ink\) 9[5-9]%|ink\) 100%/.test(m.veil.bg || "");

const ok =
  errors.length === 0 &&
  hub?.chrome === "hub" &&
  !hub.guidance &&
  !hub.peek &&
  hub.breath &&
  hub.breath.h >= 40 &&
  hub.breath.kids.length === 0 &&
  hub.dock &&
  hubPct <= 16 &&
  artOk(hub) &&
  veilNotOpaque(hub) &&
  !hub.overflowX &&
  market?.chrome === "task" &&
  !market.dock &&
  market.railDisplay === "none" &&
  !!market.back &&
  !market.fabVisible &&
  !market.guidance &&
  artOk(market) &&
  ["forge", "ledger", "vault", "codex"].every((id) => results[`chrome-after-${id}`]?.chrome === "task" && !results[`chrome-after-${id}`]?.dock) &&
  results["chrome-after-inventory"]?.chrome === "hub" &&
  results["chrome-after-inventory"]?.dock &&
  results["chrome-after-safe-area"]?.back?.top >= 40 &&
  results.reducedMotion?.reduced &&
  results.reducedMotion?.taskReady &&
  !results["chrome-after-hub-428"]?.overflowX &&
  !results["chrome-after-market-428"]?.overflowX;

console.log("HUB_CHROME_PX", hubChrome, "PCT", hubPct.toFixed(1));
await browser.close();
process.exit(ok ? 0 : 1);
