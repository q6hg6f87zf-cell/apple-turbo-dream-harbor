import assert from "node:assert/strict";
import { test } from "node:test";
import {
  absoluteDeepLink,
  defaultVisibility,
  DEEP_LINKS,
  isEventType,
  parseDeepTo,
  parseRegion,
  screenForTo,
} from "./catalog.ts";
import { IDENTITY_INVARIANT, isCommunityField } from "./identity.ts";
import { memoryId, sanitizeClaim } from "./memory-id.ts";
import { BRIDGE_CONTRACT_VERSION, TRUST_BOUNDARY } from "./contract.ts";

test("deep links only accept known destinations", () => {
  assert.equal(parseDeepTo("vault"), "vault");
  assert.equal(parseDeepTo("world"), "map");
  assert.equal(parseDeepTo("https://evil.example"), null);
  assert.equal(parseDeepTo("../../admin"), null);
  // Profile is its own screen now, so the deep link lands on it rather than
  // bouncing to the Vault.
  assert.equal(screenForTo("profile"), "profile");
  assert.equal(screenForTo("hq"), "hq");
  assert.equal(screenForTo("inventory"), "inventory");
  assert.equal(parseRegion("ironclad"), "ironclad");
  assert.equal(DEEP_LINKS.vault, "/vault");
  assert.equal(DEEP_LINKS.inventory, "/inventory");
  assert.equal(DEEP_LINKS.world, "/world");
  assert.equal(DEEP_LINKS.profile, "/profile");
  assert.equal(DEEP_LINKS.region("ironclad"), "/region/ironclad");
  assert.equal(absoluteDeepLink("/region/ironclad"), "https://thehollowrealm.com/region/ironclad");
  assert.match("/?to=map&region=ironclad", /to=map&region=ironclad/);
});

test("event types and visibility are locked", () => {
  assert.equal(isEventType("boss.defeated"), true);
  assert.equal(isEventType("boss.failed"), true);
  assert.equal(isEventType("tyrone.promise_broken"), true);
  assert.equal(isEventType("drop_table"), false);
  assert.equal(defaultVisibility("boss.defeated"), "guild");
  assert.equal(defaultVisibility("tyrone.promise_created"), "private");
});

test("memory claims are sanitized and idempotent", () => {
  assert.equal(sanitizeClaim("  hello\nworld  "), "hello world");
  assert.ok(sanitizeClaim("x".repeat(800)).length <= 480);
  const a = memoryId("123456789012345678", "episode", "Gravenor is down.");
  const b = memoryId("123456789012345678", "episode", "Gravenor is down.");
  const c = memoryId("223456789012345678", "episode", "Gravenor is down.");
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test("Hollow Soul is not a Moon Squad community profile", () => {
  assert.match(IDENTITY_INVARIANT, /never replace or destroy/i);
  assert.equal(isCommunityField("tiktok"), true);
  assert.equal(isCommunityField("ethera"), true);
  assert.equal(isCommunityField("caps"), false);
  assert.equal(isCommunityField("operative"), false);
  assert.match(TRUST_BOUNDARY, /Bearer/);
  assert.equal(BRIDGE_CONTRACT_VERSION, "1");
});
