/**
 * Lumina settle spectacle kits — presentation-only VFX on Forge settle HTTP `beat`
 * and Atlas projection land hooks. Never mints balances/rewards. Uses juice + CSS only.
 *
 * Forge settle theater (locked): call `playSettleSpectacle(beat)` with beatIds
 * `vault_flash` / `intel_drop` (plus legacy mission-cleared / intel-spike / boss-cleared).
 *
 * Atlas / Forge land hooks (call when projections land — do not invent SSE balances):
 *   playAtlasScarSpectacle({ region, x?, y? })
 *   playAtlasHealSpectacle({ region, x?, y? })
 *   playDayBoardPulseSpectacle({ tone? })
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
  /** Atlas heat contribution when Vault/Forge attaches it (optional). */
  heatDelta?: number;
  /**
   * Vault worldConsequence.offerMutations ops when present on the beat.
   * `cool` → atlas heal; otherwise MissionSettled + region defaults to scar.
   */
  offerMutations?: Array<{ op?: string; region?: string }>;
  duplicate?: boolean;
};

export type AtlasSpectacleAnchor = {
  region?: RegionId | string | null;
  x?: number;
  y?: number;
};

export type DayBoardPulseTone = "ember" | "danger" | "moon" | "muted" | string;

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

function resolveAnchor(opts: AtlasSpectacleAnchor | undefined): { x: number; y: number } {
  if (opts && Number.isFinite(opts.x) && Number.isFinite(opts.y)) {
    return { x: Number(opts.x), y: Number(opts.y) };
  }
  if (typeof document !== "undefined" && opts?.region) {
    const region = String(opts.region);
    const el =
      (document.querySelector(`[data-region="${region}"]`) as HTMLElement | null) ||
      (document.querySelector(`[data-atlas-region="${region}"]`) as HTMLElement | null) ||
      (document.querySelector(`.ms-atlas-region[data-id="${region}"]`) as HTMLElement | null);
    const rect = el?.getBoundingClientRect();
    if (rect && rect.width + rect.height > 0) {
      return { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 };
    }
  }
  return stageCenter();
}

function spawnRing(className: string, x: number, y: number, lifeMs: number) {
  if (typeof document === "undefined") return;
  const node = document.createElement("span");
  node.className = className;
  node.setAttribute("aria-hidden", "true");
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  document.body.appendChild(node);
  window.setTimeout(() => node.remove(), lifeMs);
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

function hasCoolMutation(beat: SettleSpectacleBeat): boolean {
  const ops = beat.offerMutations;
  if (!Array.isArray(ops)) return false;
  return ops.some((m) => m && String(m.op ?? "").toLowerCase() === "cool");
}

function isVaultFlashBeat(beatId: string, theater: string): boolean {
  return (
    beatId === "vault_flash" ||
    beatId === "mission-cleared" ||
    beatId === "mission_settle" ||
    theater === "MissionSettled" ||
    theater === "BossCleared" ||
    !theater
  );
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
 * Ember heat ring / flash near region (or stage). CSS + juice only.
 * Call when Atlas heat projections land scar-side, or from settle with region.
 */
export function playAtlasScarSpectacle(opts: AtlasSpectacleAnchor = {}): void {
  if (typeof document === "undefined") return;
  const { x, y } = resolveAnchor(opts);
  spawnRing("ms-atlas-scar", x, y, reducedMotion() ? 420 : 720);
  if (!reducedMotion()) {
    flashAt(x, y);
    sparksAt(x, y, 5);
    shockwaveAt(x, y);
  }
  addTrauma(0.06);
}

/**
 * Cooler restore pulse near region (or stage). CSS + juice only.
 * Call when Atlas heat cools / offerMutation `cool` lands.
 */
export function playAtlasHealSpectacle(opts: AtlasSpectacleAnchor = {}): void {
  if (typeof document === "undefined") return;
  const { x, y } = resolveAnchor(opts);
  spawnRing("ms-atlas-heal", x, y, reducedMotion() ? 420 : 720);
  if (!reducedMotion()) {
    sparksAt(x, y, 3);
  }
  platePulse();
}

/**
 * Pulse `[data-day-board]` / `.ms-day-board` via platePulse + CSS class.
 * Call when Atlas day-board strip projections land (or settle theater fires).
 */
export function playDayBoardPulseSpectacle(opts: { tone?: DayBoardPulseTone } = {}): void {
  if (typeof document === "undefined") return;
  const board =
    (document.querySelector("[data-day-board]") as HTMLElement | null) ||
    (document.querySelector(".ms-day-board") as HTMLElement | null);
  if (board) {
    const tone = typeof opts.tone === "string" && opts.tone ? opts.tone : "ember";
    board.classList.remove(
      "ms-day-board-pulse",
      "ms-day-board-pulse--ember",
      "ms-day-board-pulse--danger",
      "ms-day-board-pulse--moon",
      "ms-day-board-pulse--muted",
    );
    // force reflow so repeated pulses retrigger
    void board.offsetWidth;
    board.classList.add("ms-day-board-pulse", `ms-day-board-pulse--${tone}`);
    window.setTimeout(() => {
      board.classList.remove("ms-day-board-pulse", `ms-day-board-pulse--${tone}`);
    }, reducedMotion() ? 320 : 680);
  }
  platePulse();
}

/**
 * Dispatch settle HTTP `beat` → presentation kits.
 * - MissionSettled / vault_flash / mission-cleared → vault flash
 * - intel_drop / intel-spike or intelDelta > 0 → intel tick (soft label if no delta)
 * - BossCleared / boss_clear / boss-cleared → vault flash + light trauma/hitstop upgrade
 * - region present → atlas scar (default) or heal when heatDelta < 0 / cool mutation
 * - any fired settle kit → day-board pulse (world must change on actions)
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

  if (kits.atlasHeal) {
    playAtlasHealSpectacle({ region: beat.region });
  } else if (kits.atlasScar) {
    playAtlasScarSpectacle({ region: beat.region });
  }

  if (kits.dayBoardPulse) {
    const tone: DayBoardPulseTone = kits.bossUpgrade
      ? "danger"
      : kits.intelTick
        ? "ember"
        : "ember";
    playDayBoardPulseSpectacle({ tone });
  }
}

/** Pure helpers for tests — which kits would fire for a beat. */
export function settleSpectacleKitsFor(beat: SettleSpectacleBeat | null | undefined): {
  vaultFlash: boolean;
  intelTick: boolean;
  intelSoft: boolean;
  bossUpgrade: boolean;
  atlasScar: boolean;
  atlasHeal: boolean;
  dayBoardPulse: boolean;
} {
  if (!beat) {
    return {
      vaultFlash: false,
      intelTick: false,
      intelSoft: false,
      bossUpgrade: false,
      atlasScar: false,
      atlasHeal: false,
      dayBoardPulse: false,
    };
  }
  const theater = typeof beat.theater === "string" ? beat.theater : "";
  const beatId = typeof beat.beatId === "string" ? beat.beatId : "";
  const intelDelta = Number(beat.intelDelta ?? 0);
  const heatDelta = Number(beat.heatDelta ?? NaN);
  const intelDrop = isIntelDropBeat(beatId);
  const intelTick = intelDrop || (Number.isFinite(intelDelta) && intelDelta > 0);
  const intelSoft = intelDrop && !(Number.isFinite(intelDelta) && intelDelta > 0);
  const bossUpgrade = isBossBeat(beatId, theater, beat.kind);
  const vaultFlash =
    isVaultFlashBeat(beatId, theater) ||
    intelDrop ||
    bossUpgrade ||
    beatId === "boss-cleared" ||
    beatId === "boss_clear" ||
    beatId === "intel-spike";

  const hasRegion = typeof beat.region === "string" && beat.region.length > 0;
  const cool = hasCoolMutation(beat) || (Number.isFinite(heatDelta) && heatDelta < 0);
  const atlasHeal = hasRegion && cool;
  // MissionSettled / vault settle with region scars the atlas (world changes on actions).
  const atlasScar =
    hasRegion &&
    !atlasHeal &&
    (theater === "MissionSettled" ||
      theater === "BossCleared" ||
      beatId === "vault_flash" ||
      beatId === "mission-cleared" ||
      beatId === "mission_settle" ||
      intelDrop ||
      bossUpgrade ||
      (!theater && vaultFlash));

  const dayBoardPulse = vaultFlash || intelTick || atlasScar || atlasHeal;

  return {
    vaultFlash,
    intelTick,
    intelSoft,
    bossUpgrade,
    atlasScar,
    atlasHeal,
    dayBoardPulse,
  };
}
