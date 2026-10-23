/**
 * Lumina Moon Squad spectacle — presentation-only neon / Tetris / town / talk VFX.
 * Pure client kits. Never mints balances. Never touches tyrone-bot / profile cards.
 *
 * Strike: call playTetrisClearSpectacle on line clear; mark ghost cells with
 *   GHOST_PIECE_CLASS / applyGhostPieceGlow.
 * Atlas: mark town tiles with TOWN_TILE_CLASS (hover CSS + optional helper).
 * Pulse: optional SPEAKING_* → setSpeakingRing / playSpeakingRingWhoosh.
 * Chrome: neon surfaces use NEON_SURFACE_CLASS on arcade / Moon Squad shells.
 *
 * CustomEvents (optional, no import required):
 *   hollow:tetris-clear  detail: { lines?, x?, y? }
 *   hollow:speaking-ring detail: { active?: boolean, x?, y? }
 */
import { addTrauma, flashAt, sparksAt } from "./juice";

export const NEON_SURFACE_CLASS = "ms-neon-surface";
export const GHOST_PIECE_CLASS = "ms-ghost-piece";
export const TOWN_TILE_CLASS = "ms-town-tile";
export const SPEAKING_RING_CLASS = "ms-speaking-ring";
export const SPEAKING_RING_HOST_CLASS = "ms-speaking-ring-host";

export type TetrisClearSpectacleOpts = {
  /** Lines cleared this beat (1–4). Scales particle count. */
  lines?: number;
  x?: number;
  y?: number;
  /** Board / clear-row element — center is used when x/y omitted. */
  boardEl?: Element | null;
};

export type SpeakingRingOpts = {
  /** Avatar / portrait host. When omitted, first [data-speaking-avatar] or .ms-speaking-ring-host. */
  host?: Element | null;
  active?: boolean;
};

export type TownTileHoverOpts = {
  tile?: Element | null;
  /** clientX/Y for a one-shot highlight pulse when no tile given. */
  x?: number;
  y?: number;
};

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stageCenter(): { x: number; y: number } {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  return { x: window.innerWidth * 0.5, y: window.innerHeight * 0.45 };
}

function elCenter(el: Element | null | undefined): { x: number; y: number } | null {
  if (!el || typeof document === "undefined") return null;
  const rect = (el as HTMLElement).getBoundingClientRect?.();
  if (!rect || rect.width + rect.height <= 0) return null;
  return { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 };
}

function resolvePoint(
  opts: { x?: number; y?: number; el?: Element | null },
): { x: number; y: number } {
  if (Number.isFinite(opts.x) && Number.isFinite(opts.y)) {
    return { x: Number(opts.x), y: Number(opts.y) };
  }
  return elCenter(opts.el) ?? stageCenter();
}

function spawn(className: string, x: number, y: number, lifeMs: number, extra?: (node: HTMLElement) => void) {
  if (typeof document === "undefined") return;
  const node = document.createElement("span");
  node.className = className;
  node.setAttribute("aria-hidden", "true");
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  extra?.(node);
  document.body.appendChild(node);
  window.setTimeout(() => node.remove(), lifeMs);
}

/** Pure plan — which neon clear intensity for N lines. */
export function tetrisClearPlan(lines: number | undefined): {
  particles: number;
  trauma: number;
  flash: boolean;
  multi: boolean;
} {
  const raw = Number(lines);
  const n = !Number.isFinite(raw) || raw <= 0
    ? (raw === 0 ? 0 : 1)
    : Math.max(0, Math.min(4, Math.floor(raw)));
  if (n <= 0) {
    return { particles: 0, trauma: 0, flash: false, multi: false };
  }
  return {
    particles: 6 + n * 4,
    trauma: 0.04 + n * 0.03,
    flash: n >= 2,
    multi: n >= 4,
  };
}

/**
 * Tetris line-clear particle burst (neon cyan/ember shards + optional flash).
 * Strike should call this from the real clear path. Word-search board clear
 * may also call it as a stand-in until Tetris lands.
 */
export function playTetrisClearSpectacle(opts: TetrisClearSpectacleOpts = {}): void {
  if (typeof document === "undefined") return;
  const lines = Math.max(1, Math.min(4, Math.floor(Number(opts.lines) || 1)));
  const plan = tetrisClearPlan(lines);
  const { x, y } = resolvePoint({ x: opts.x, y: opts.y, el: opts.boardEl ?? null });

  spawn("ms-tetris-clear-flash", x, y, reducedMotion() ? 280 : 420, (node) => {
    if (plan.multi) node.classList.add("ms-tetris-clear-flash--quad");
  });

  if (!reducedMotion() && plan.particles > 0) {
    for (let i = 0; i < plan.particles; i++) {
      const angle = (Math.PI * 2 * i) / plan.particles + (Math.random() - 0.5) * 0.4;
      const dist = 28 + Math.random() * (36 + lines * 10);
      const tone = i % 3 === 0 ? "ember" : i % 3 === 1 ? "cyan" : "moon";
      spawn("ms-tetris-shard", x, y, 520, (node) => {
        node.classList.add(`ms-tetris-shard--${tone}`);
        node.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
        node.style.setProperty("--dy", `${Math.sin(angle) * dist - 12}px`);
      });
    }
    if (plan.flash) flashAt(x, y);
    sparksAt(x, y, Math.min(10, 4 + lines));
  }
  if (plan.trauma > 0) addTrauma(plan.trauma);
}

/** Mark a ghost tetromino cell / layer with neon ghost glow. Idempotent. */
export function applyGhostPieceGlow(el: Element | null | undefined): void {
  if (!el) return;
  el.classList.add(GHOST_PIECE_CLASS);
  if (typeof HTMLElement !== "undefined" && el instanceof HTMLElement) el.dataset.ghostPiece = "1";
}

export function clearGhostPieceGlow(el: Element | null | undefined): void {
  if (!el) return;
  el.classList.remove(GHOST_PIECE_CLASS);
  if (typeof HTMLElement !== "undefined" && el instanceof HTMLElement) delete el.dataset.ghostPiece;
}

/**
 * Town / atlas tile hover highlight. Prefer CSS via TOWN_TILE_CLASS on the tile;
 * this helper fires a one-shot pulse for non-hover paths (touch / Atlas projection).
 */
export function playTownTileHoverSpectacle(opts: TownTileHoverOpts = {}): void {
  if (typeof document === "undefined") return;
  const tile = opts.tile as HTMLElement | null | undefined;
  if (tile) {
    tile.classList.add(TOWN_TILE_CLASS);
    tile.classList.remove("ms-town-tile--pulse");
    void tile.offsetWidth;
    tile.classList.add("ms-town-tile--pulse");
    window.setTimeout(() => tile.classList.remove("ms-town-tile--pulse"), reducedMotion() ? 280 : 520);
    return;
  }
  const { x, y } = resolvePoint({ x: opts.x, y: opts.y });
  spawn("ms-town-tile-pulse", x, y, reducedMotion() ? 280 : 480);
}

/** Ensure tile has hover CSS class (Atlas town grid / region POI pins). */
export function markTownTile(el: Element | null | undefined): void {
  if (!el) return;
  el.classList.add(TOWN_TILE_CLASS);
  if (typeof HTMLElement !== "undefined" && el instanceof HTMLElement) el.dataset.townTile = "1";
}

/**
 * Speaking ring around an avatar while talk / SPEAKING_* is active.
 * When active=false, removes the ring. Returns the ring element if created.
 */
export function setSpeakingRing(opts: SpeakingRingOpts = {}): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const host =
    (opts.host as HTMLElement | null) ||
    (document.querySelector("[data-speaking-avatar]") as HTMLElement | null) ||
    (document.querySelector(`.${SPEAKING_RING_HOST_CLASS}`) as HTMLElement | null);
  if (!host) return null;

  host.classList.add(SPEAKING_RING_HOST_CLASS);
  let ring = host.querySelector(`.${SPEAKING_RING_CLASS}`) as HTMLElement | null;
  const active = opts.active !== false;

  if (!active) {
    host.classList.remove("is-speaking");
    host.removeAttribute("data-speaking");
    ring?.remove();
    return null;
  }

  if (!ring) {
    ring = document.createElement("span");
    ring.className = SPEAKING_RING_CLASS;
    ring.setAttribute("aria-hidden", "true");
    const style = getComputedStyle(host);
    if (style.position === "static") host.style.position = "relative";
    host.appendChild(ring);
  }
  host.classList.add("is-speaking");
  host.dataset.speaking = "1";
  return ring;
}

/** One-shot whoosh ring burst (advance / Pulse SPEAKING_* edge). */
export function playSpeakingRingWhoosh(opts: { host?: Element | null; x?: number; y?: number } = {}): void {
  if (typeof document === "undefined") return;
  const host = opts.host as HTMLElement | null | undefined;
  const point = resolvePoint({ x: opts.x, y: opts.y, el: host ?? null });
  setSpeakingRing({ host: host ?? undefined, active: true });
  spawn("ms-speaking-whoosh", point.x, point.y, reducedMotion() ? 320 : 560);
  if (!reducedMotion()) sparksAt(point.x, point.y, 3);
}

/** Neon shader surface class for arcade / Moon Squad shells. */
export function applyNeonSurface(el: Element | null | undefined): void {
  if (!el) return;
  el.classList.add(NEON_SURFACE_CLASS);
  if (typeof HTMLElement !== "undefined" && el instanceof HTMLElement) el.dataset.neonSurface = "1";
}

let busBound = false;

/**
 * Optional event bus so Strike / Pulse can fire kits without a hard import.
 * Safe to call once from App / arcade shell.
 */
export function mountMoonSpectacleBus(): () => void {
  if (typeof window === "undefined") return () => {};
  if (busBound) return () => {};
  busBound = true;

  const onClear = (ev: Event) => {
    const d = (ev as CustomEvent<TetrisClearSpectacleOpts>).detail ?? {};
    playTetrisClearSpectacle(d);
  };
  const onSpeak = (ev: Event) => {
    const d = (ev as CustomEvent<SpeakingRingOpts & { x?: number; y?: number }>).detail ?? {};
    if (d.active === false) {
      setSpeakingRing({ host: d.host, active: false });
      return;
    }
    playSpeakingRingWhoosh({ host: d.host, x: d.x, y: d.y });
  };
  const onTile = (ev: Event) => {
    const d = (ev as CustomEvent<TownTileHoverOpts>).detail ?? {};
    playTownTileHoverSpectacle(d);
  };

  window.addEventListener("hollow:tetris-clear", onClear);
  window.addEventListener("hollow:speaking-ring", onSpeak);
  window.addEventListener("hollow:town-tile-hover", onTile);

  return () => {
    window.removeEventListener("hollow:tetris-clear", onClear);
    window.removeEventListener("hollow:speaking-ring", onSpeak);
    window.removeEventListener("hollow:town-tile-hover", onTile);
    busBound = false;
  };
}

/** Test helper — kit surface contract. */
export function moonSpectacleKitSurface() {
  return {
    neon: NEON_SURFACE_CLASS,
    ghost: GHOST_PIECE_CLASS,
    town: TOWN_TILE_CLASS,
    speaking: SPEAKING_RING_CLASS,
    events: ["hollow:tetris-clear", "hollow:speaking-ring", "hollow:town-tile-hover"] as const,
  };
}
