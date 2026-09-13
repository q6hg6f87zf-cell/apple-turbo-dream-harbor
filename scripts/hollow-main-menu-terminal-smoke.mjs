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

await page.goto(baseURL, { waitUntil: "networkidle", timeout: 60_000 });
await page.locator('[data-ready="1"]').waitFor({ timeout: 20_000 });

// CI runs with auth explicitly disabled. The secure shell must still render its
// development authority state without silently starting a save.
await page.getByRole("button", { name: "Assume command", exact: true }).waitFor();
assert.equal(await page.getByText(/Development authority is active/).count(), 1);

// The Easter egg is available from the authenticated/dev-authorized main menu,
// before Assume command is pressed.
await page.getByRole("button", { name: "Black channel", exact: true }).click();
const terminal = page.locator("[data-terminal-session]");
await terminal.waitFor({ timeout: 10_000 });
await page.getByText(/No static password dictionary is loaded/i).waitFor();

const first = await page.evaluate(async () => {
  const { useGame } = await import("/src/game/store.ts");
  const state = useGame.getState().s;
  const hack = state.hack;
  return {
    started: state.started,
    session: hack?.sessionId,
    password: hack?.password,
    coins: state.coins,
    challengeCoin: state.challengeCoin,
  };
});
assert.equal(first.started, false, "Opening the main-menu Easter egg started the campaign.");
assert.ok(first.session, "Procedural terminal did not create a session id.");
assert.ok(first.password && /^[A-Z]{6,10}$/.test(first.password), `Unexpected generated password: ${first.password}`);
assert.notEqual(first.password, "SYNAPSE", "Legacy fixed SYNAPSE password survived the procedural terminal rewrite.");

const tokenLocator = page.locator("[data-terminal-token]");
const tokenCount = await tokenLocator.count();
assert.ok(tokenCount >= 14, `Expected a deep procedural candidate field, got ${tokenCount} tokens.`);
const tokens = await tokenLocator.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-terminal-token") ?? ""));
assert.equal(new Set(tokens).size, tokens.length, "Terminal generated duplicate candidate tokens.");
assert.ok(tokens.every((token) => /^[A-Z]+$/.test(token)), "Terminal candidate field contains a non-generated token format.");
assert.ok(tokens.every((token) => token.length === first.password.length), "Terminal candidates do not match the password length.");
assert.ok(!tokens.includes("SYNAPSE"), "Legacy SYNAPSE candidate appeared in the generated terminal field.");

// QA is allowed to inspect the store so we can prove success cannot counterfeit
// the new server-authoritative economy.
await page.evaluate(async (password) => {
  const { useGame } = await import("/src/game/store.ts");
  useGame.getState().hackPick(password);
}, first.password);
await page.getByText(/T-0880 CHALLENGE COIN RECOVERED/i).waitFor({ timeout: 5_000 });

const afterWin = await page.evaluate(async () => {
  const { useGame } = await import("/src/game/store.ts");
  const state = useGame.getState().s;
  return { coins: state.coins, challengeCoin: state.challengeCoin, won: state.hack?.won };
});
assert.equal(afterWin.coins, first.coins, "Main-menu Easter egg minted client-side bottle caps.");
assert.equal(afterWin.challengeCoin, true, "Successful black-channel breach did not unlock its non-economic challenge coin.");
assert.equal(afterWin.won, true);

await page.getByRole("button", { name: "Jack out" }).click();
await terminal.waitFor({ state: "detached" });
await page.getByRole("button", { name: "Black channel", exact: true }).click();
const secondTerminal = page.locator("[data-terminal-session]");
await secondTerminal.waitFor();
const secondSession = await secondTerminal.getAttribute("data-terminal-session");
assert.ok(secondSession && secondSession !== first.session, "A new breach reused the previous procedural terminal session.");

const secondPassword = await page.evaluate(async () => {
  const { useGame } = await import("/src/game/store.ts");
  return useGame.getState().s.hack?.password ?? "";
});
assert.match(secondPassword, /^[A-Z]{6,10}$/);
assert.notEqual(secondPassword, "SYNAPSE");

assert.deepEqual(errors, [], `Main-menu/terminal browser errors detected:\n${errors.join("\n")}`);
console.log("Hollow main-menu smoke passed: campaign stays idle, procedural terminal rotates, and Easter egg cannot mint caps.");

await browser.close();
