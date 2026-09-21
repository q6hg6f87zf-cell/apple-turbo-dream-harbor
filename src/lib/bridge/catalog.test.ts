import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defaultVisibility,
  isEventType,
  parseDeepTo,
  screenForTo,
} from "./catalog.ts";
import { memoryId, sanitizeClaim } from "./memory-id.ts";

test("deep links only accept known destinations", () => {
  assert.equal(parseDeepTo("vault"), "vault");
  assert.equal(parseDeepTo("https://evil.example"), null);
  assert.equal(parseDeepTo("../../admin"), null);
  assert.equal(screenForTo("profile"), "hq");
  assert.equal(screenForTo("inventory"), "inventory");
});

test("event types and visibility are locked", () => {
  assert.equal(isEventType("boss.defeated"), true);
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
