import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = process.env.HOLLOW_QA_URL ?? "http://127.0.0.1:8080";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 428, height: 926 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: "en-CA",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});

async function sitTheCrt() {
  await page.getByRole("button", { name: "Sit the SYNAPSE terminal" }).click();
  await page.locator("[data-terminal-session]").waitFor({ timeout: 10_000 });
}

async function skipBootIfNeeded() {
  const boot = page.locator('[data-terminal-page="boot"]');
  if (!(await boot.count())) return;
  // BootView is the phosphor panel button — not the header "Jack out" control,
  // which is also a <button> inside the same CrtShell.
  await boot.locator("button.term-phosphor").click({ force: true });
  await page.locator('[data-terminal-page="home"]').waitFor({ timeout: 10_000 });
}

async function openBlackChannel() {
  await sitTheCrt();
  await skipBootIfNeeded();
  await page.locator('[data-term-choice="6"]').click();
  await page.locator('[data-terminal-page="dump"]').waitFor({ timeout: 10_000 });
  await page.getByText(/No static password dictionary is loaded/i).waitFor({ timeout: 10_000 });
}

async function readHack() {
  return page.evaluate(() => {
    const qa = window.__hollowQa;
    if (!qa?.getState) return null;
    const state = qa.getState();
    const hack = state.hack;
    return {
      started: state.started,
      session: hack?.sessionId ?? null,
      password: hack?.password ?? null,
      coins: state.coins,
      challengeCoin: state.challengeCoin,
      won: !!hack?.won,
    };
  });
}

// `domcontentloaded`, not `networkidle`: Vite keeps an HMR websocket open, so
// networkidle never settles and would burn the whole timeout in CI.
await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.locator('[data-ready="1"]').waitFor({ timeout: 20_000 });

// Auth-off QA uses the Discord-first shell with an explicit development bypass.
// The CRT easter egg must be reachable before Wake up starts a campaign.
await page.getByRole("button", { name: "Wake up", exact: true }).waitFor({ timeout: 20_000 });
await page.getByRole("button", { name: "Sit the SYNAPSE terminal" }).waitFor({ timeout: 10_000 });
assert.ok(
  (await page.getByText(/@sandbox|BLACK CARD/i).count()) >= 1,
  "Dev-bypass main menu did not render the sandbox black card.",
);
await page.waitForFunction(() => !!window.__hollowQa?.getState, null, { timeout: 20_000 });

await openBlackChannel();

const first = await readHack();
assert.ok(first, "Could not read the live game store.");
assert.equal(first.started, false, "Opening the main-menu Easter egg started the campaign.");
assert.ok(first.session, "Procedural terminal did not create a session id.");
assert.ok(
  first.password && /^[A-Z]{6,10}$/.test(first.password),
  `Unexpected generated password: ${first.password}`,
);
assert.notEqual(first.password, "SYNAPSE", "Legacy fixed SYNAPSE password survived the procedural terminal rewrite.");

const tokenLocator = page.locator("[data-terminal-token]");
const tokenCount = await tokenLocator.count();
assert.ok(tokenCount >= 14, `Expected a deep procedural candidate field, got ${tokenCount} tokens.`);
const tokens = await tokenLocator.evaluateAll((nodes) =>
  nodes.map((node) => node.getAttribute("data-terminal-token") ?? ""),
);
assert.equal(new Set(tokens).size, tokens.length, "Terminal generated duplicate candidate tokens.");
assert.ok(tokens.every((token) => /^[A-Z]+$/.test(token)), "Terminal candidate field contains a non-generated token format.");
assert.ok(
  tokens.every((token) => token.length === first.password.length),
  "Terminal candidates do not match the password length.",
);
assert.ok(!tokens.includes("SYNAPSE"), "Legacy SYNAPSE candidate appeared in the generated terminal field.");

// QA inspects the live store so we can prove success cannot counterfeit the
// server-authoritative economy. EliteTerminalRuntime owns hackPick.
const coinsBeforeWin = first.coins;
await page.evaluate((password) => {
  window.__hollowQa.hackPick(password);
}, first.password);
await page.getByText(/T-0880 CHALLENGE COIN RECOVERED/i).waitFor({ timeout: 5_000 });

const afterWin = await readHack();
assert.ok(afterWin);
assert.equal(
  afterWin.coins,
  coinsBeforeWin,
  "Main-menu Easter egg minted client-side bottle caps.",
);
assert.equal(
  afterWin.challengeCoin,
  true,
  "Successful black-channel breach did not unlock its non-economic challenge coin.",
);
assert.equal(afterWin.won, true);

await page.getByRole("button", { name: "Jack out" }).click();
await page.locator("[data-terminal-session]").waitFor({ state: "detached", timeout: 10_000 });

await openBlackChannel();
const second = await readHack();
assert.ok(second?.session && second.session !== first.session, "A new breach reused the previous procedural terminal session.");
assert.match(second.password ?? "", /^[A-Z]{6,10}$/);
assert.notEqual(second.password, "SYNAPSE");
assert.notEqual(second.password, first.password, "A new breach reused the previous procedural password.");

assert.deepEqual(errors, [], `Main-menu/terminal browser errors detected:\n${errors.join("\n")}`);
console.log(
  "Hollow main-menu smoke passed: campaign stays idle, procedural terminal rotates, and Easter egg cannot mint caps.",
);

await browser.close();
