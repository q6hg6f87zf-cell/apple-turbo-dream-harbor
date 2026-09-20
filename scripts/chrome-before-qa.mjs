import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
await context.addInitScript(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});
const page = await context.newPage();

async function skipInto() {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(800);
  const enter = page.locator("[data-enter-hollow]");
  if (await enter.isVisible().catch(() => false)) {
    await enter.click();
    await page.waitUntilTimeout?.();
    await page.waitForTimeout(400);
  }
  const profile = page.locator("[data-profile='1']");
  if (await profile.isVisible({ timeout: 12_000 }).catch(() => false)) {
    const name = page.getByPlaceholder("Your name");
    if (await name.isVisible().catch(() => false)) {
      await name.fill("Brent");
      await page.getByRole("button", { name: /Stamp/i }).click();
      await page.waitForTimeout(400);
    }
    const wake = page.getByRole("button", { name: /Wake up|Assume command/i });
    if (await wake.isVisible().catch(() => false)) await wake.click();
    await page.waitForTimeout(600);
  }
  await page.evaluate(async () => {
    const { useGame } = await import("/src/game/store.ts");
    const { TALK } = await import("/src/game/talk.ts");
    const g = useGame.getState();
    const n = (TALK.wake?.length ?? 12) + (TALK.welcome?.length ?? 12);
    for (let i = 0; i < n + 8; i++) useGame.getState().advanceTalk?.();
    useGame.getState().skipTalk?.();
  });
  await page.waitForTimeout(400);
}

await skipInto();
await page.evaluate(async () => {
  const { useGame } = await import("/src/game/store.ts");
  const g = useGame.getState();
  g.s.tutorial = "done";
  g.setScreen("hq");
  g.skipTalk?.();
});
await page.waitForTimeout(500);

const before = await page.evaluate(() => {
  const header = document.querySelector("header");
  const obj = document.querySelector("button.min-h-11.w-full, [data-guidance]");
  const dock = document.querySelector("nav.fixed.inset-x-0.bottom-0");
  const peek = document.querySelector(".ms-room-peek");
  const main = document.querySelector("main");
  const first = main?.querySelector("h1, h2, [data-market], [data-inventory]");
  const box = (el) => (el ? el.getBoundingClientRect() : null);
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    header: header ? { h: Math.round(box(header).height), top: Math.round(box(header).top) } : null,
    objective: obj ? { h: Math.round(box(obj).height) } : null,
    dock: dock ? { h: Math.round(box(dock).height) } : null,
    peek: peek ? { h: Math.round(box(peek).height) } : null,
    mainPadBottom: main ? getComputedStyle(main).paddingBottom : null,
    contentStart: first ? Math.round(box(first).top) : null,
  };
});

await page.screenshot({ path: "/workspace/screenshots/chrome-before-hub.png" });
writeFileSync("/workspace/screenshots/chrome-before.json", JSON.stringify(before, null, 2));
console.log(JSON.stringify(before, null, 2));
await browser.close();
