import assert from "node:assert/strict";
import test from "node:test";
import {
  applyGhostPieceGlow,
  clearGhostPieceGlow,
  GHOST_PIECE_CLASS,
  moonSpectacleKitSurface,
  NEON_SURFACE_CLASS,
  SPEAKING_RING_CLASS,
  tetrisClearPlan,
  TOWN_TILE_CLASS,
} from "./moon-spectacle.ts";

test("kit surface exports stable class names + event bus ids", () => {
  const s = moonSpectacleKitSurface();
  assert.equal(s.neon, NEON_SURFACE_CLASS);
  assert.equal(s.ghost, GHOST_PIECE_CLASS);
  assert.equal(s.town, TOWN_TILE_CLASS);
  assert.equal(s.speaking, SPEAKING_RING_CLASS);
  assert.deepEqual([...s.events], [
    "hollow:tetris-clear",
    "hollow:speaking-ring",
    "hollow:town-tile-hover",
  ]);
});

test("tetrisClearPlan scales particles with lines (1–4)", () => {
  assert.equal(tetrisClearPlan(0).particles, 0);
  assert.equal(tetrisClearPlan(1).particles, 10);
  assert.equal(tetrisClearPlan(2).flash, true);
  assert.equal(tetrisClearPlan(4).multi, true);
  assert.ok(tetrisClearPlan(4).particles > tetrisClearPlan(1).particles);
  assert.ok(tetrisClearPlan(3).trauma > tetrisClearPlan(1).trauma);
});

test("tetrisClearPlan clamps oversize / non-finite lines", () => {
  assert.equal(tetrisClearPlan(99).particles, tetrisClearPlan(4).particles);
  assert.equal(tetrisClearPlan(Number.NaN).particles, tetrisClearPlan(1).particles);
});

test("applyGhostPieceGlow is idempotent and clearable", () => {
  const adds: string[] = [];
  const removes: string[] = [];
  const el = {
    classList: {
      add: (c: string) => { adds.push(c); },
      remove: (c: string) => { removes.push(c); },
    },
  };
  applyGhostPieceGlow(el as unknown as Element);
  applyGhostPieceGlow(el as unknown as Element);
  assert.deepEqual(adds, [GHOST_PIECE_CLASS, GHOST_PIECE_CLASS]);
  clearGhostPieceGlow(el as unknown as Element);
  assert.deepEqual(removes, [GHOST_PIECE_CLASS]);
});
