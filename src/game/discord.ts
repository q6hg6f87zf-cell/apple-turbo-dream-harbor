import type { GameState, PackCounts } from "./types";

export const WHO_KEY = "synaps-t0880-v1:who";

export interface DiscordIdentity {
  id: string;
  name: string;
}

/**
 * Transitional identity envelope.
 *
 * IMPORTANT: `caps`, `xp`, `level`, and `pack` remain optional on the type only
 * so older call sites and trusted server responses can migrate without a flag
 * day. Public URL parsing NEVER fills those fields anymore.
 */
export interface DiscordSnap {
  id: string;
  name: string;
  caps?: number;
  xp?: number;
  level?: number;
  pack?: Partial<PackCounts>;
  source: "url" | "memory" | "api";
}

export interface HandshakeDelta {
  caps: number;
  xp: number;
  pack: Partial<PackCounts>;
}

function params(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  const q = new URLSearchParams(window.location.search);
  const h = window.location.hash.startsWith("#")
    ? new URLSearchParams(window.location.hash.slice(1))
    : new URLSearchParams();
  h.forEach((v, k) => {
    if (!q.has(k)) q.set(k, v);
  });
  return q;
}

function cleanId(raw: string | null): string | null {
  if (!raw) return null;
  const id = raw.trim().replace(/[^\w.-]/g, "").slice(0, 32);
  return id.length >= 2 ? id : null;
}

function cleanName(raw: string | null, fallback: string): string {
  const n = (raw ?? "").trim().replace(/^@/, "").slice(0, 32);
  return n || fallback;
}

export function isSnowflake(raw: string): boolean {
  return /^\d{17,22}$/.test(raw.trim());
}

/**
 * Parse only a display/identity hint from a URL.
 *
 * Older links may still contain `caps`, `xp`, `lvl`, `pack`, `stim`, etc. They
 * are intentionally ignored. A URL is navigation, never an economy authority.
 */
export function snapFromParams(q: URLSearchParams): DiscordSnap | null {
  const id = cleanId(q.get("d") || q.get("discord") || q.get("user_id") || q.get("uid"));
  if (!id) return null;
  return {
    id,
    name: cleanName(q.get("n") || q.get("name") || q.get("nick") || q.get("username"), id),
    source: "url",
  };
}

export function parseStampedLink(raw: string): DiscordSnap | null {
  const t = raw.trim();
  if (!t) return null;
  if (t.includes("?") || t.includes("://") || t.startsWith("/") || t.includes("#")) {
    try {
      const u = new URL(t, "https://hollow.invalid");
      const q = new URLSearchParams(u.search);
      if (u.hash.startsWith("#")) {
        new URLSearchParams(u.hash.slice(1)).forEach((v, k) => {
          if (!q.has(k)) q.set(k, v);
        });
      }
      const snap = snapFromParams(q);
      if (snap) return snap;
    } catch {
      /* fall through */
    }
  }
  if (isSnowflake(t)) return { id: t.trim(), name: t.trim(), source: "memory" };
  return null;
}

export function readWho(): DiscordIdentity | null {
  try {
    const raw = localStorage.getItem(WHO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DiscordIdentity;
    if (!parsed?.id) return null;
    return { id: String(parsed.id).slice(0, 32), name: String(parsed.name || parsed.id).slice(0, 32) };
  } catch {
    return null;
  }
}

export function writeWho(who: DiscordIdentity | null) {
  try {
    if (!who) localStorage.removeItem(WHO_KEY);
    else localStorage.setItem(WHO_KEY, JSON.stringify(who));
  } catch {
    /* private mode */
  }
}

export function saveKeyFor(id: string | null, base: string) {
  return id ? `${base}:d:${id}` : base;
}

export function fromDiscordClient(): boolean {
  if (typeof window === "undefined") return false;
  const q = params();
  if (q.has("frame_id") || q.has("instance_id") || q.get("platform") === "discord") return true;
  try {
    if (/discord\.(com|gg)/i.test(document.referrer)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function snapshotFromSearch(): DiscordSnap | null {
  if (typeof window === "undefined") return null;
  return snapFromParams(params());
}

/**
 * Legacy compatibility shim.
 *
 * This function used to raise local caps/XP/rank/Pack values to client-provided
 * floors. It now applies identity metadata only. Economy authority is moving to
 * authenticated server commands and may never be increased by URL/client data.
 */
export function applyFloor(state: GameState, snap: DiscordSnap | null): HandshakeDelta {
  const delta: HandshakeDelta = { caps: 0, xp: 0, pack: {} };
  if (!snap) return delta;
  state.discordId = snap.id;
  state.discordName = snap.name;
  return delta;
}

export function deltaEmpty(d: HandshakeDelta) {
  return d.caps === 0 && d.xp === 0 && Object.keys(d.pack).length === 0;
}

/**
 * Share links identify a rider for display only. Never serialize economy state
 * into a URL.
 */
export function stampedUrl(
  origin: string,
  snap: Pick<DiscordSnap, "id" | "name"> & Partial<Pick<DiscordSnap, "caps" | "xp" | "level">>,
): string {
  const u = new URL(origin);
  u.searchParams.set("d", snap.id);
  u.searchParams.set("n", snap.name);
  return u.toString();
}

/**
 * Legacy public remote pull is intentionally disabled.
 *
 * Reading a snapshot by an arbitrary Discord id would still let an unverified
 * browser impersonate another rider. The next persistence slice binds a Better
 * Auth user to a Tyrone-issued claim before any authoritative state is returned.
 */
export async function pullRemote(_id: string, _timeoutMs = 1200): Promise<DiscordSnap | null> {
  return null;
}
