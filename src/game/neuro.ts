/** Presentation-only. Odds, weights, clocks, and payouts never live here. */

import type { SlotGlyph } from "./arcade-banks";

/**
 * Ramachandran & Hirstein 1999 (eight laws) + Reith 2003 extras,
 * Reber processing fluency, Graf & Landwehr PIA (pleasure vs interest),
 * nested reward-prediction error (Schultz / EGM literature).
 *
 * Applied as chrome. Never as a cheat: no inflated near-miss rate,
 * no losses-disguised-as-wins sting, no weight changes.
 */

export type LampKind = "off" | "chase" | "solid" | "pulse";
export type OutcomeTone = "jack" | "win" | "even" | "ldw" | "near" | "dry";

/** Peak-shift: caricature value, not frequency. KANE/MOON supernormal; PIN recedes. */
export function glyphShift(g: SlotGlyph) {
  if (g === "KANE") return "ms-glyph-kane";
  if (g === "MOON") return "ms-glyph-moon";
  if (g === "PIN") return "ms-glyph-pin";
  return "ms-glyph-mid";
}

/** Isolation of a single cue during last-reel hang. */
export function reelIsolation(col: number, hang: boolean, landed: boolean) {
  if (!hang) return "";
  if (landed && col < 2) return "ms-reel-dim";
  if (col === 2) return "ms-reel-focus";
  return "";
}

/** Grouping / binding: matching mid-pair reads as one object during hang. */
export function groupingHalo(hang: boolean, landed: boolean, col: number) {
  return hang && landed && col < 2 ? "ms-group-halo" : "";
}

/**
 * Generic viewpoint (abhorrence of coincidence): mid-line is the canonical
 * picture on a one-line sit. Off-payline matches must not look meaningful.
 */
export function rowGround(row: number, lines: 1 | 3, spinning: boolean) {
  if (spinning) return "";
  if (lines === 3) return "";
  if (row === 1) return "ms-row-figure";
  if (row === 0 || row === 2) return "ms-row-ground";
  return "";
}

/** Extra peak-shift on a paid supernormal, not on PIN. */
export function winPeak(glyph: SlotGlyph, hit: boolean) {
  return hit && (glyph === "KANE" || glyph === "MOON") ? "ms-glyph-peak" : "";
}

/** Rhythm / orderliness: five lamps phrase three reel-stops. */
export function lampKind(i: number, spinning: boolean, lamps: boolean, landedCount: number, hang: boolean): LampKind {
  if (lamps) return "pulse";
  if (!spinning) return "off";
  if (hang) return i < 3 ? "solid" : "pulse";
  if (landedCount <= 0) return "chase";
  if (landedCount === 1) return i < 2 ? "solid" : "chase";
  if (landedCount === 2) return i < 3 ? "solid" : "chase";
  return "chase";
}

/**
 * Honest outcome voice. A credit that does not cover the stool is not a win.
 * UK-style: never celebrate a net loss. Math of the pay is unchanged.
 */
export function outcomeTone(paid: number, spent: number, near: boolean): OutcomeTone {
  if (paid >= spent * 8) return "jack";
  if (paid > spent) return "win";
  if (paid > 0 && paid === spent) return "even";
  if (paid > 0) return "ldw";
  if (near) return "near";
  return "dry";
}

export function outcomeLine(tone: OutcomeTone, note: string) {
  if (tone === "ldw") return `${note}. The house kept the rest.`;
  if (tone === "even") return `${note}. Even. The glass didn't blink.`;
  return note;
}

export function celebrates(tone: OutcomeTone) {
  return tone === "jack" || tone === "win";
}

/** Perceptual problem-solving: meaning after the click, not during it. */
export const AHA_MS = 340;
