import assert from "node:assert/strict";
import { test } from "node:test";
import { characterForged, defaultState, FORGE_REROLLS, stampPlayerProfile } from "./engine.ts";

test("character is unforged until the first operative exists", () => {
  const s = defaultState();
  assert.equal(characterForged(s), false);
  s.operatives = [{ id: "a", name: "Brent", status: "idle", inventory: [] } as never];
  assert.equal(characterForged(s), true);
});

test("two rerolls is the law", () => {
  assert.equal(FORGE_REROLLS, 2);
});

test("discord plate name and handle lock after the first stamp", () => {
  const s = defaultState();
  assert.equal(stampPlayerProfile(s, "Brent McDonald", "brontosaurus"), null);
  assert.equal(s.playerName, "Brent McDonald");
  assert.equal(s.playerHandle, "brontosaurus");
  assert.equal(stampPlayerProfile(s, "Other Name", "otherhandle"), null);
  assert.equal(s.playerName, "Brent McDonald");
  assert.equal(s.playerHandle, "brontosaurus");
});
