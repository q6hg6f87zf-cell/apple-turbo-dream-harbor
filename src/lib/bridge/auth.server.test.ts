import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanDiscordId, json, rateLimit, requireTrustedWriter, resetRateLimitForTests, trustedWriter } from "./auth.server.ts";
import { BRIDGE_CONTRACT_VERSION, isErrorShape, TRUST_BOUNDARY } from "./contract.ts";

function req(headers: Record<string, string> = {}, url = "https://thehollowrealm.com/api/bridge/soul") {
  return new Request(url, { headers });
}

test("missing and malformed secrets fail closed", () => {
  const prevA = process.env.HOLLOW_BRIDGE_KEY;
  const prevB = process.env.TYRONE_SYNC_WRITE_KEY;
  delete process.env.HOLLOW_BRIDGE_KEY;
  delete process.env.TYRONE_SYNC_WRITE_KEY;
  assert.equal(trustedWriter(req({ authorization: "Bearer abc" })), "disabled");
  process.env.HOLLOW_BRIDGE_KEY = "bridge-secret-value-aaaaaaaa";
  assert.equal(trustedWriter(req()), "denied");
  assert.equal(trustedWriter(req({ authorization: "Basic nope" })), "denied");
  assert.equal(trustedWriter(req({ authorization: "Bearer wrong-secret-value-bbbbbbbb" })), "denied");
  assert.equal(trustedWriter(req({ authorization: "Bearer bridge-secret-value-aaaaaaaa" })), "ok");
  assert.equal(trustedWriter(req({ cookie: "hr_rider=fake" })), "denied");
  if (prevA === undefined) delete process.env.HOLLOW_BRIDGE_KEY;
  else process.env.HOLLOW_BRIDGE_KEY = prevA;
  if (prevB === undefined) delete process.env.TYRONE_SYNC_WRITE_KEY;
  else process.env.TYRONE_SYNC_WRITE_KEY = prevB;
});

test("unauthorized responses do not enumerate souls or leak secrets", async () => {
  const prev = process.env.HOLLOW_BRIDGE_KEY;
  process.env.HOLLOW_BRIDGE_KEY = "bridge-secret-value-aaaaaaaa";
  resetRateLimitForTests();
  const denied = requireTrustedWriter(req({ authorization: "Bearer no" }));
  assert.ok(denied);
  assert.equal(denied.status, 401);
  const body = await denied.json();
  assert.equal(isErrorShape(body), true);
  assert.equal("soul" in body, false);
  assert.doesNotMatch(JSON.stringify(body), /bridge-secret/);
  assert.doesNotMatch(TRUST_BOUNDARY, /cookie is accepted on \/api\/bridge/i);
  assert.match(BRIDGE_CONTRACT_VERSION, /^\d+$/);
  if (prev === undefined) delete process.env.HOLLOW_BRIDGE_KEY;
  else process.env.HOLLOW_BRIDGE_KEY = prev;
});

test("discord ids and rate limits fail closed", () => {
  resetRateLimitForTests();
  assert.equal(cleanDiscordId("123456789012345678"), "123456789012345678");
  assert.equal(cleanDiscordId("nope"), null);
  assert.equal(cleanDiscordId("../../etc"), null);
  assert.equal(rateLimit("t", 2, 60_000), true);
  assert.equal(rateLimit("t", 2, 60_000), true);
  assert.equal(rateLimit("t", 2, 60_000), false);
  const res = json({ error: "unauthorized" }, 401);
  assert.equal(res.headers.get("cache-control"), "no-store");
});
