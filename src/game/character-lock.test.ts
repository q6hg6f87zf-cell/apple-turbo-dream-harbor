import assert from "node:assert/strict";
import { test } from "node:test";
import { characterForged, defaultState, FORGE_REROLLS, reviseGuestPlate, seatSoul, stampPlayerProfile } from "./engine.ts";
import type { Operative } from "./types.ts";

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

test("guest plate name and handle can be rewritten", () => {
  const s = defaultState();
  assert.equal(stampPlayerProfile(s, "Guest", "guest1044"), null);
  assert.equal(reviseGuestPlate(s, "Brent", "brontosaurus"), null);
  assert.equal(s.playerName, "Brent");
  assert.equal(s.playerHandle, "brontosaurus");
  assert.equal(s.squad[0]?.name, "Brent");
  assert.equal(s.squad[0]?.discordHandle, "@brontosaurus");
});

test("OAuth ok tokens do not lock the black card", () => {
  const s = defaultState();
  s.playerName = "ok";
  s.playerHandle = "ok";
  s.discordId = "ok";
  assert.equal(stampPlayerProfile(s, "Brent McDonald", "brontosaurus"), null);
  assert.equal(s.playerName, "Brent McDonald");
  assert.equal(s.playerHandle, "brontosaurus");
});

const soul = {
  id: "op-soul-1",
  name: "Brontosaurus",
  cls: "Warrior",
  race: "Human",
  lineage: "Dust",
  origin: "Vault",
  hp: 12,
  maxHp: 12,
  status: "idle",
  inventory: [],
} as unknown as Operative;

test("remote soul seats on an empty file", () => {
  const s = defaultState();
  assert.equal(seatSoul(s, soul), true);
  assert.equal(s.operatives[0]?.id, "op-soul-1");
  assert.equal(characterForged(s), true);
});

test("remote soul replaces a second local character", () => {
  const s = defaultState();
  s.operatives = [{ id: "local-other", name: "Impostor", status: "idle", inventory: [] } as never];
  assert.equal(seatSoul(s, soul), true);
  assert.equal(s.operatives.length, 1);
  assert.equal(s.operatives[0]?.id, "op-soul-1");
});

test("the same soul does not reshuffle an already seated file", () => {
  const s = defaultState();
  assert.equal(seatSoul(s, soul), true);
  assert.equal(seatSoul(s, soul), false);
  assert.equal(s.operatives.length, 1);
});
