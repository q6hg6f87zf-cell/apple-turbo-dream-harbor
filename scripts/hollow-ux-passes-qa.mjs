/**
 * Gates for the surfaces UX passes 2-6 introduced.
 *
 * hub-task-chrome-qa covers the Pass 1 shell and inventory-touch-qa covers the
 * pan; this covers what sits inside them: Market lots carrying the facts a
 * purchase needs, World briefing on its own sheet, combat standing in a room,
 * one Tyrone control per screen, restrained tap feedback, and the quiet dots.
 *
 * HOLLOW_QA_CHROMIUM overrides the browser binary for sandboxes whose baked
 * Chromium does not match the installed Playwright.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = process.env.HOLLOW_QA_URL ?? "http://127.0.0.1:8080";
const executablePath = process.env.HOLLOW_QA_CHROMIUM || undefined;
mkdirSync("screenshots", { recursive: true });

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "ok  " : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const RESIDENT = {
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
};

function baseSave(extra) {
  return {
    started: true,
    tutorial: "done",
    playerName: "Brent",
    seenTalk: ["wake", "welcome", "briefing", "forge", "market", "map", "inventory"],
    talk: null,
    talkQueue: [],
    day: 4,
    coins: 6000,
    squad: [
      {
        id: "r1",
        name: "Brent",
        discordId: null,
        discordHandle: "@b",
        personalCaps: 5000,
        xp: 20,
        note: "",
        joinedDay: 1,
        lastTurnDay: 0,
      },
    ],
    activeMemberId: "r1",
    operatives: [RESIDENT],
    ...extra,
  };
}

async function open(browser, save) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await ctx.addInitScript((payload) => {
    try {
      localStorage.clear();
      localStorage.setItem("synaps-t0880-v1", JSON.stringify(payload));
    } catch {
      /* private mode */
    }
  }, save);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.googleapis|ERR_TUNNEL|ERR_CERT/.test(m.text())) errors.push(m.text());
  });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("[data-chrome]", { timeout: 25_000 });
  for (let i = 0; i < 8; i++) {
    const skip = page.getByRole("button", { name: /^Skip$/i });
    if (await skip.isVisible().catch(() => false)) {
      await skip.click();
      await page.waitForTimeout(180);
      continue;
    }
    break;
  }
  await page.waitForTimeout(1600);
  return { ctx, page, errors };
}

const browser = await chromium.launch({ headless: true, executablePath });

// ---------------------------------------------------------------- Market
{
  const { ctx, page, errors } = await open(browser, baseSave({ screen: "market", openedFrom: "more" }));
  const market = await page.evaluate(() => {
    const lots = [...document.querySelectorAll("[data-lot]")];
    return {
      lots: lots.length,
      withArt: lots.filter((l) => l.querySelector("img")).length,
      withBuy: lots.filter((l) => l.querySelector("[data-juice='commit']")).length,
      inspectable: document.querySelectorAll("[data-lot-inspect]").length,
    };
  });
  check("market lists lots", market.lots > 0, `${market.lots}`);
  check("every lot shows its item", market.withArt === market.lots, `${market.withArt}/${market.lots}`);
  check("every lot has one commit", market.withBuy === market.lots, `${market.withBuy}/${market.lots}`);

  if (market.inspectable) {
    await page.locator("[data-lot-inspect]").first().click();
    await page.waitForTimeout(600);
    const sheet = await page.evaluate(() => {
      const el = document.querySelector("[data-item-inspect]");
      return el
        ? { portaled: el.parentElement === document.body, commit: el.querySelectorAll("[data-juice='commit']").length }
        : null;
    });
    check("lot opens an inspect sheet", !!sheet);
    check("inspect is a real viewport overlay", !!sheet?.portaled);
    check("inspect offers one commit", sheet?.commit === 1, `${sheet?.commit}`);
  }
  await page.screenshot({ path: "screenshots/ux-market.png" });
  check("market is quiet in the console", errors.length === 0, errors[0]);
  await ctx.close();
}

// ----------------------------------------------------------------- World
{
  const { ctx, page, errors } = await open(browser, baseSave({ screen: "map" }));
  const hub = await page.evaluate(() => ({
    sheet: !!document.querySelector("[data-region-sheet]"),
    dock: !!document.querySelector("[data-dock]"),
  }));
  check("world opens on the chooser", !hub.sheet && hub.dock);

  await page.getByRole("button", { name: /Ironclad/i }).first().click();
  await page.waitForTimeout(800);
  const sheet = await page.evaluate(() => {
    const el = document.querySelector("[data-region-sheet]");
    const bar = el?.querySelector("[data-command-bar]");
    return el
      ? {
          portaled: el.parentElement === document.body,
          dialog: el.getAttribute("role") === "dialog" && el.getAttribute("aria-modal") === "true",
          back: !!el.querySelector("[data-region-back]"),
          barPinned: bar ? Math.round(bar.getBoundingClientRect().bottom) === window.innerHeight : false,
        }
      : null;
  });
  check("a region opens its briefing", !!sheet);
  check("briefing is a viewport overlay", !!sheet?.portaled);
  check("briefing announces itself as a dialog", !!sheet?.dialog);
  check("briefing has Back", !!sheet?.back);
  check("Deploy is pinned to the bottom", !!sheet?.barPinned);
  await page.screenshot({ path: "screenshots/ux-world-sheet.png" });

  await page.locator("[data-region-back]").click();
  await page.waitForTimeout(500);
  check(
    "Back returns to the chooser",
    await page.evaluate(() => !document.querySelector("[data-region-sheet]") && !!document.querySelector("[data-dock]")),
  );
  check("world is quiet in the console", errors.length === 0, errors[0]);
  await ctx.close();
}

// ---------------------------------------------------------------- Combat
{
  const combat = {
    locationId: "ironclad",
    missionKind: "raid",
    partyIds: ["mira"],
    enemies: [
      { id: "e1", name: "Slag-Hound", hp: 7, maxHp: 7, atk: 3, def: 1, dc: 11, tags: [], flavor: "Low, patient." },
    ],
    turn: 1,
    actorIndex: 0,
    log: ["Slag-Hound closes."],
    rewardMult: 1,
  };
  const { ctx, page, errors } = await open(browser, baseSave({ screen: "map", combat }));
  const fight = await page.evaluate(() => {
    const bar = document.querySelector("[data-combat] [data-command-bar]");
    const art = document.querySelector("[data-encounter-art] img");
    return {
      open: !!document.querySelector("[data-combat]"),
      chrome: document.querySelector("[data-chrome]")?.getAttribute("data-chrome"),
      dock: !!document.querySelector("[data-dock]"),
      hull: !!document.querySelector(".ms-hull-fill"),
      art: art ? art.getAttribute("src") : null,
      barPinned: bar ? Math.round(bar.getBoundingClientRect().bottom) === window.innerHeight : false,
      commit: document.querySelectorAll("[data-combat] [data-juice='commit']").length,
    };
  });
  check("combat takes the screen", fight.open && fight.chrome === "focused");
  check("combat drops the dock", !fight.dock);
  check("combat stands in the region", /places\//.test(fight.art ?? ""), fight.art ?? "none");
  check("the enemy has a hull bar", fight.hull);
  check("actions are pinned to the bottom", fight.barPinned);
  check("one action carries the commit tier", fight.commit === 1, `${fight.commit}`);
  await page.screenshot({ path: "screenshots/ux-combat.png" });
  check("combat is quiet in the console", errors.length === 0, errors[0]);
  await ctx.close();
}

// ------------------------------------------- Tyrone, tiers and quiet dots
{
  const save = baseSave({
    screen: "inventory",
    shift: { watchesLeft: 3 },
    vault: [
      {
        id: "v1",
        name: "Rail Carbine",
        kind: "weapon",
        rarity: "Rare",
        condition: "Pristine",
        slot: "weapon",
        effect: "Strong hit pins a target.",
        lore: "QA",
        value: 900,
        sourceRegion: "ironclad",
      },
    ],
  });
  const { ctx, page, errors } = await open(browser, save);

  const tyrone = await page.evaluate(() => ({
    controls: document.querySelectorAll("[data-help]").length,
    floating: [...document.querySelectorAll(".ms-help")].filter((el) => getComputedStyle(el).display !== "none").length,
  }));
  check("one Tyrone control on screen", tyrone.controls === 1, `${tyrone.controls}`);
  check("nothing floats over the list", tyrone.floating === 0, `${tyrone.floating}`);

  const space = await page.evaluate(() => {
    const h = (s) => {
      const el = document.querySelector(s);
      return el ? Math.round(el.getBoundingClientRect().height) : 0;
    };
    return { list: h("[data-inventory-list]"), header: h("[data-inventory-header]"), vh: window.innerHeight };
  });
  check(
    "the list owns the phone",
    space.list / space.vh >= 0.45,
    `${space.list}px of ${space.vh} (header ${space.header})`,
  );

  const dots = await page.evaluate(() => [...document.querySelectorAll("[data-nav-dot]")].map((d) => d.getAttribute("data-nav-dot")));
  check("quiet marks the World", dots.includes("map"), dots.join(",") || "none");

  await page.locator("[data-inventory-header] button").first().click();
  await page.waitForTimeout(150);
  const tap = await page.evaluate(() => ({
    sparks: document.querySelectorAll(".ms-spark, .ms-ripple").length,
    shake: document.querySelector("main")?.style.translate || "",
  }));
  check("an ordinary tap stays quiet", tap.sparks === 0, `${tap.sparks} particles`);
  check("an ordinary tap never shakes the scroller", tap.shake === "", tap.shake);

  await page.screenshot({ path: "screenshots/ux-inventory.png" });
  check("inventory is quiet in the console", errors.length === 0, errors[0]);
  await ctx.close();
}

// urgent state must silence the dots, or they duplicate the guidance row
{
  const downed = { ...RESIDENT, status: "downed" };
  const { ctx, page } = await open(browser, baseSave({ screen: "inventory", operatives: [downed], shift: { watchesLeft: 3 } }));
  const urgent = await page.evaluate(() => ({
    guidance: document.querySelector("[data-guidance]")?.getAttribute("data-guidance") ?? null,
    dots: document.querySelectorAll("[data-nav-dot]").length,
  }));
  check("a downed resident is urgent", urgent.guidance === "urgent", urgent.guidance ?? "none");
  check("urgent silences the dots", urgent.dots === 0, `${urgent.dots}`);
  await ctx.close();
}

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} UX pass gates held`);
if (failed.length) {
  for (const f of failed) console.error(` - ${f.name}${f.detail ? ` (${f.detail})` : ""}`);
  process.exit(1);
}
