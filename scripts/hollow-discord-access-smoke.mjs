import assert from "node:assert/strict";

const baseURL = process.env.HOLLOW_QA_URL ?? "http://127.0.0.1:8080";

const response = await fetch(`${baseURL}/api/hollow/access`, {
  headers: { accept: "application/json" },
});
assert.equal(response.status, 200, "Auth-off QA build did not expose the explicit development access gate.");
const access = await response.json();
assert.equal(access.allowed, true);
assert.equal(access.authenticated, true);
assert.equal(access.discord, true);
assert.equal(access.linked, true);
assert.equal(access.devBypass, true, "QA access was not clearly marked as a development bypass.");
assert.equal(access.provider, "dev", "QA bypass masqueraded as a real Discord provider.");
assert.notEqual(access.provider, "grok-discord", "Development access must never claim a Discord OAuth identity.");

console.log("Hollow Discord access smoke passed: explicit auth-off dev bypass is isolated from real Discord identity.");
