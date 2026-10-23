/**
 * Lumina settle spectacle kits — presentation-only VFX on Forge settle HTTP `beat`.
 * Never mints balances/rewards. Uses existing juice primitives only.
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

/** Matches server settle `beat` from progression.ts (~946–969). */
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

/**
 * Dispatch settle HTTP `beat` → presentation kits.
 * - MissionSettled / default → vault flash
 * - intel-spike or intelDelta > 0 → intel tick (also)
 * - BossCleared / boss-cleared → vault flash + light trauma/hitstop upgrade
 */
export function playSettleSpectacle(beat: SettleSpectacleBeat | null | undefined): void {
  if (!beat || typeof document === "undefined") return;

  const theater = typeof beat.theater === "string" ? beat.theater : "";
  const beatId = typeof beat.beatId === "string" ? beat.beatId : "";
  const intelDelta = Number(beat.intelDelta ?? 0);
  const intelSpike = beatId === "intel-spike" || (Number.isFinite(intelDelta) && intelDelta > 0);
  const boss =
    theater === "BossCleared" || beatId === "boss-cleared" || beat.kind === "boss";

  // Vault flash for mission settle (default) and boss soft-upgrade path.
  if (
    theater === "MissionSettled" ||
    theater === "BossCleared" ||
    !theater ||
    beatId === "mission-cleared" ||
    beatId === "intel-spike" ||
    beatId === "boss-cleared"
  ) {
    playVaultFlashKit({ boss });
  }

  if (intelSpike) {
    playIntelTick(Number.isFinite(intelDelta) ? intelDelta : 0);
  }
}

/** Pure helpers for tests — which kits would fire for a beat. */
export function settleSpectacleKitsFor(beat: SettleSpectacleBeat | null | undefined): {
  vaultFlash: boolean;
  intelTick: boolean;
  bossUpgrade: boolean;
} {
  if (!beat) return { vaultFlash: false, intelTick: false, bossUpgrade: false };
  const theater = typeof beat.theater === "string" ? beat.theater : "";
  const beatId = typeof beat.beatId === "string" ? beat.beatId : "";
  const intelDelta = Number(beat.intelDelta ?? 0);
  const intelTick = beatId === "intel-spike" || (Number.isFinite(intelDelta) && intelDelta > 0);
  const bossUpgrade =
    theater === "BossCleared" || beatId === "boss-cleared" || beat.kind === "boss";
  const vaultFlash =
    theater === "MissionSettled" ||
    theater === "BossCleared" ||
    !theater ||
    beatId === "mission-cleared" ||
    beatId === "intel-spike" ||
    beatId === "boss-cleared";
  return { vaultFlash, intelTick, bossUpgrade };
}
