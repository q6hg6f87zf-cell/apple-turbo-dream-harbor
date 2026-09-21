/**
 * QA: wake, open Ironclad war table via __hollowQa, screenshot.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = process.argv[2] ?? "http://127.0.0.1:8080/";
mkdirSync("/workspace/screenshots", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(1200);

for (const label of [/tap to enter/i, /wake up/i, /^SKIP$/i]) {
  const b = page.getByRole("button", { name: label });
  if (await b.count()) {
    await b.first().click().catch(() => {});
    await page.waitForTimeout(500);
  }
}
for (let i = 0; i < 10; i++) {
  const skip = page.getByRole("button", { name: /^SKIP$/i });
  if (!(await skip.count())) break;
  await skip.first().click().catch(() => {});
  await page.waitForTimeout(200);
}

await page.waitForFunction(() => !!(window).__hollowQa?.openRegionMap, null, { timeout: 20000 });
await page.evaluate(() => (window).__hollowQa.openRegionMap("ironclad"));
await page.waitForTimeout(2800);

const stage = await page.locator("[data-region-map]").count();
const ready = await page.locator('[data-region-stage="ready"]').count();
const fallback = await page.locator("[data-region-fallback]").count();
const canvas = await page.locator("[data-region-map] canvas").count();
const warTable = await page.getByRole("heading", { name: /Ironclad/i }).count();
const heightSource = await page.locator("[data-height-source]").first().getAttribute("data-height-source");
await page.screenshot({ path: "/workspace/screenshots/region-war-table-mobile.png" });

await page.setViewportSize({ width: 1280, height: 800 });
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/region-war-table.png" });

console.log(
  JSON.stringify(
    {
      stage,
      ready,
      fallback,
      canvas,
      warTable,
      heightSource,
      errors: errors.slice(0, 10),
    },
    null,
    2,
  ),
);

await browser.close();
