/**
 * Lumina settle spectacle kits — presentation-only VFX on Forge settle HTTP `beat`.
 * Never mints balances/rewards. Uses existing juice primitives only.
 *
 * Forge settle theater (locked): call `playSettleSpectacle(beat)` with beatIds
 * `vault_flash` / `intel_drop` (plus legacy mission-cleared / intel-spike / boss-cleared).
 */
import {
  addTrauma,
  flashAt,
  hitstop,
  platePulse,
  shockwaveAt,
  sparksAt,
} from "./juice";
import type { MissionKind, RegionId } from "./types";

/** Matches server settle `beat` from progression.ts (~946–969) + Forge theater aliases. */
export type SettleSpectacleBeat = {
  theater?: "MissionSettled" | "BossCleared" | string;
  beatId?: string;
  eventId?: string;
  ticketId?: string;
  requestId?: string | null;
  region?: RegionId | string;
  kind?: MissionKind | string;
  performanceScore?: number | null;
  scaleFactor?: number | null;
  revision?: {
    campaign?: number;
    member?: number;
  };
  intelDelta?: number;
  duplicate?: boolean;
};

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stageCenter(): { x: number; y: number } {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  return {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.42,
  };
}

/** Kit 1 — full-bleed radial ember vault flash (~280–400ms). */
function playVaultFlash() {
  if (typeof document === "undefined") return;
  const node = document.createElement("span");
  node.className = "ms-vault-flash";
  node.setAttribute("aria-hidden", "true");
  document.body.appendChild(node);
  const life = reducedMotion() ? 320 : 400;
  window.setTimeout(() => node.remove(), life);
}

/**
 * Kit 2 — short HUD float `+N intel` near World HUD plate + soft sparks.
 * Imperative (juice-style) so settle path stays presentation-only.
 */
function playIntelTick(intelDelta: number) {
  if (typeof document === "undefined") return;
  const n = Math.max(0, Math.floor(Number(intelDelta) || 0));
  if (n <= 0) return;

  const hud = document.querySelector(".ms-hud-plate") as HTMLElement | null;
  const rect = hud?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width * 0.55 : stageCenter().x;
  const y = rect ? rect.top + rect.height * 0.85 : stageCenter().y + 48;

  if (!reducedMotion()) {
    const node = document.createElement("span");
    node.className = "ms-intel-tick";
    node.textContent = `+${n.toLocaleString()} intel`;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    document.body.appendChild(node);
    window.setTimeout(() => node.remove(), 900);
    sparksAt(x, y, 6);
  } else {
    // Reduced motion: brief static label, no sparks.
    const node = document.createElement("span");
    node.className = "ms-intel-tick ms-intel-tick--static";
    node.textContent = `+${n.toLocaleString()} intel`;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    document.body.appendChild(node);
    window.setTimeout(() => node.remove(), 600);
  }
  platePulse();
}

/**
 * Soft intel cue when Forge sends `intel_drop` without a positive intelDelta —
 * platePulse + sparks + label `intel` (never invents a fake +N).
 */
function playIntelSoft() {
  if (typeof document === "undefined") return;
  const hud = document.querySelector(".ms-hud-plate") as HTMLElement | null;
  const rect = hud?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width * 0.55 : stageCenter().x;
  const y = rect ? rect.top + rect.height * 0.85 : stageCenter().y + 48;

  const node = document.createElement("span");
  node.className = reducedMotion() ? "ms-intel-tick ms-intel-tick--static" : "ms-intel-tick";
  node.textContent = "intel";
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  document.body.appendChild(node);
  window.setTimeout(() => node.remove(), reducedMotion() ? 600 : 900);
  if (!reducedMotion()) sparksAt(x, y, 4);
  platePulse();
}

function playVaultFlashKit(opts: { boss?: boolean }) {
  const { x, y } = stageCenter();
  playVaultFlash();
  flashAt(x, y);
  shockwaveAt(x, y);
  platePulse();
  if (opts.boss) {
    hitstop(110);
    addTrauma(0.16);
  } else {
    addTrauma(0.1);
  }
}

function isIntelDropBeat(beatId: string): boolean {
  return beatId === "intel_drop" || beatId === "intel-spike" || beatId === "intel_spike";
}

function isBossBeat(beatId: string, theater: string, kind: unknown): boolean {
  return (
    theater === "BossCleared" ||
    beatId === "boss-cleared" ||
    beatId === "boss_clear" ||
    kind === "boss"
  );
}

/**
 * Dispatch settle HTTP `beat` → presentation kits.
 * - MissionSettled / vault_flash / mission-cleared → vault flash
 * - intel_drop / intel-spike or intelDelta > 0 → intel tick (soft label if no delta)
 * - BossCleared / boss_clear / boss-cleared → vault flash + light trauma/hitstop upgrade
 */
export function playSettleSpectacle(beat: SettleSpectacleBeat | null | undefined): void {
  if (!beat || typeof document === "undefined") return;

  const kits = settleSpectacleKitsFor(beat);
  if (kits.vaultFlash) {
    playVaultFlashKit({ boss: kits.bossUpgrade });
  }

  if (kits.intelTick) {
    const intelDelta = Number(beat.intelDelta ?? 0);
    if (Number.isFinite(intelDelta) && intelDelta > 0) {
      playIntelTick(intelDelta);
    } else if (kits.intelSoft) {
      playIntelSoft();
    }
  }
}

/** Pure helpers for tests — which kits would fire for a beat. */
export function settleSpectacleKitsFor(beat: SettleSpectacleBeat | null | undefined): {
  vaultFlash: boolean;
  intelTick: boolean;
  intelSoft: boolean;
  bossUpgrade: boolean;
} {
  if (!beat) {
    return { vaultFlash: false, intelTick: false, intelSoft: false, bossUpgrade: false };
  }
  const theater = typeof beat.theater === "string" ? beat.theater : "";
  const beatId = typeof beat.beatId === "string" ? beat.beatId : "";
  const intelDelta = Number(beat.intelDelta ?? 0);
  const intelDrop = isIntelDropBeat(beatId);
  const intelTick = intelDrop || (Number.isFinite(intelDelta) && intelDelta > 0);
  const intelSoft = intelDrop && !(Number.isFinite(intelDelta) && intelDelta > 0);
  const bossUpgrade = isBossBeat(beatId, theater, beat.kind);
  const vaultFlash =
    theater === "MissionSettled" ||
    theater === "BossCleared" ||
    !theater ||
    beatId === "vault_flash" ||
    beatId === "mission-cleared" ||
    beatId === "mission_settle" ||
    intelDrop ||
    beatId === "boss-cleared" ||
    beatId === "boss_clear" ||
    bossUpgrade;
  return { vaultFlash, intelTick, intelSoft, bossUpgrade };
}
