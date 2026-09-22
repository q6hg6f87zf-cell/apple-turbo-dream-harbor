import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
await context.addInitScript(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message || e)));

async function seekKane(t) {
  return page.evaluate((seconds) => {
    const nodes = [...document.querySelectorAll("audio")];
    const el = nodes.find((a) => (a.currentSrc || a.src || "").includes("kane-recording"));
    if (!el) return { ok: false, src: nodes.map((a) => a.currentSrc || a.src) };
    el.currentTime = seconds;
    return { ok: true, src: el.currentSrc, t: el.currentTime };
  }, t);
}

async function shot() {
  const subject = await page.locator("[data-kane-subject]").getAttribute("data-kane-subject").catch(() => "");
  const video = await page
    .locator("[data-wake-clip] video")
    .first()
    .evaluate((el) => el.currentSrc || el.getAttribute("src") || "")
    .catch(() => "");
  return { subject, video };
}

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
const enter = page.locator("[data-enter-hollow]");
await enter.waitFor({ timeout: 20_000 });
await enter.click();
await page.getByRole("button", { name: /Wake up/i }).waitFor({ timeout: 20_000 });

const nameBox = page.getByPlaceholder("Your name");
if (await nameBox.isVisible().catch(() => false)) {
  await nameBox.fill("Brent");
  const handle = page.getByPlaceholder("@callsign");
  if (await handle.isVisible().catch(() => false)) await handle.fill("brenty");
  await page.getByRole("button", { name: /Stamp/i }).click();
  await page.waitForTimeout(400);
}

await page.getByRole("button", { name: /Wake up/i }).click();
await page.waitForTimeout(1400);

const skip = page.getByRole("button", { name: /^Skip$/i });
await skip.waitFor({ timeout: 12_000 });
await skip.click();
await page.locator("[data-wake-clip='kane']").waitFor({ timeout: 12_000 });
await page.waitForTimeout(900);

const clip = await page.locator("[data-wake-clip]").getAttribute("data-wake-clip").catch(() => "");
const open = await shot();
await page.screenshot({ path: "/workspace/screenshots/kane-desk.png" });

const seekLine = await seekKane(21);
await page.waitForTimeout(1400);
const line = await shot();
await page.screenshot({ path: "/workspace/screenshots/kane-tyrone-line.png" });

const seekMarket = await seekKane(62);
await page.waitForTimeout(1400);
const market = await shot();
await page.screenshot({ path: "/workspace/screenshots/kane-tyrone-market.png" });

const seekFound = await seekKane(73);
await page.waitForTimeout(1400);
const found = await shot();
await page.screenshot({ path: "/workspace/screenshots/kane-tyrone-found.png" });

const seekAegis = await seekKane(99);
await page.waitForTimeout(1400);
const aegis = await shot();
await page.screenshot({ path: "/workspace/screenshots/kane-aegis.png" });

const seekVault = await seekKane(136);
await page.waitForTimeout(1400);
const vault = await shot();
await page.screenshot({ path: "/workspace/screenshots/kane-tyrone-vault.png" });

const seekFace = await seekKane(152);
await page.waitForTimeout(1400);
const face = await shot();
await page.screenshot({ path: "/workspace/screenshots/kane-look-face.png" });

const seekLook = await seekKane(194);
await page.waitForTimeout(1400);
const look = await shot();
await page.screenshot({ path: "/workspace/screenshots/kane-look-at-him.png" });

const report = {
  clip,
  open,
  seekLine,
  line,
  seekMarket,
  market,
  seekFound,
  found,
  seekAegis,
  aegis,
  seekVault,
  vault,
  seekFace,
  face,
  seekLook,
  look,
  errors,
};
writeFileSync("/workspace/screenshots/kane-stitch-qa.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();

const fail =
  clip !== "kane" ||
  !/kane-look/.test(open.video || "") ||
  line.subject !== "tyrone" ||
  !/tyrone-line/.test(line.video || "") ||
  market.subject !== "tyrone" ||
  !/tyrone-market/.test(market.video || "") ||
  found.subject !== "tyrone" ||
  !/tyrone-found/.test(found.video || "") ||
  aegis.subject !== "aegis" ||
  !/kane-aegis/.test(aegis.video || "") ||
  vault.subject !== "tyrone" ||
  !/tyrone-vault/.test(vault.video || "") ||
  face.subject !== "kane" ||
  !/kane-look/.test(face.video || "") ||
  look.subject !== "tyrone" ||
  !/tyrone-market/.test(look.video || "") ||
  errors.length > 0;
if (fail) process.exit(1);
