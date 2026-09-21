import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyFloor,
  isAuthStatus,
  isPlaceholderName,
  isSnowflake,
  snapFromParams,
} from "./discord.ts";
import { defaultState } from "./engine.ts";

test("OAuth bounce discord=ok is not a rider identity", () => {
  const q = new URLSearchParams("discord=ok");
  assert.equal(snapFromParams(q), null);
  assert.equal(isAuthStatus("ok"), true);
  assert.equal(isAuthStatus("error"), true);
  assert.equal(isAuthStatus("brontosaurus"), false);
});

test("auth=ok and discord=error never become a black-card name", () => {
  assert.equal(snapFromParams(new URLSearchParams("auth=ok")), null);
  assert.equal(snapFromParams(new URLSearchParams("discord=error&reason=state")), null);
  assert.equal(isPlaceholderName("ok"), true);
  assert.equal(isPlaceholderName("Ok"), true);
  assert.equal(isPlaceholderName("Brent McDonald"), false);
});

test("real Discord snowflakes still deep-link", () => {
  const q = new URLSearchParams("d=123456789012345678&n=Brent%20McDonald");
  const snap = snapFromParams(q);
  assert.equal(snap?.id, "123456789012345678");
  assert.equal(snap?.name, "Brent McDonald");
  assert.equal(isSnowflake(snap!.id), true);
});

test("applyFloor ignores the OAuth ok token", () => {
  const s = defaultState();
  const delta = applyFloor(s, { id: "ok", name: "ok", source: "url" });
  assert.equal(s.discordId, null);
  assert.equal(s.discordName, null);
  assert.equal(delta.caps, 0);
});
