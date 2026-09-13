import { PACK_KEYS } from "./inventory";
import type { GameState, PackCounts, PackKey } from "./types";

export const WHO_KEY = "synaps-t0880-v1:who";

export interface DiscordIdentity {
  id: string;
  name: string;
}

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

const PACK_PARAM: Record<string, PackKey> = {
  pin: "bobby_pin",
  bobby_pin: "bobby_pin",
  stim: "stimpak",
  stimpak: "stimpak",
  ment: "mentats",
  mentats: "mentats",
  holo: "holotape",
  holotape: "holotape",
  sarsa: "sarsaparilla",
  sarsaparilla: "sarsaparilla",
  probe: "probe_kit",
  probe_kit: "probe_kit",
};

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

function num(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : undefined;
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

export function snapFromParams(q: URLSearchParams): DiscordSnap | null {
  const id = cleanId(q.get("d") || q.get("discord") || q.get("user_id") || q.get("uid"));
  if (!id) return null;
  const pack: Partial<PackCounts> = {};
  const packed = q.get("pack");
  if (packed) {
    try {
      const obj = JSON.parse(packed) as Record<string, number>;
      PACK_KEYS.forEach((k) => {
        if (typeof obj[k] === "number") pack[k] = Math.max(0, Math.floor(obj[k]));
      });
    } catch {
      /* ignore bad json */
    }
  }
  Object.entries(PACK_PARAM).forEach(([param, key]) => {
    const n = num(q.get(param));
    if (n != null) pack[key] = n;
  });
  return {
    id,
    name: cleanName(q.get("n") || q.get("name") || q.get("nick") || q.get("username"), id),
    caps: num(q.get("caps") || q.get("coins") || q.get("coin")),
    xp: num(q.get("xp")),
    level: num(q.get("lvl") || q.get("level")),
    pack: Object.keys(pack).length ? pack : undefined,
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

export function applyFloor(state: GameState, snap: DiscordSnap | null): HandshakeDelta {
  const delta: HandshakeDelta = { caps: 0, xp: 0, pack: {} };
  if (!snap) return delta;
  state.discordId = snap.id;
  state.discordName = snap.name;
  if (snap.caps != null && snap.caps > state.coins) {
    delta.caps = snap.caps - state.coins;
    state.coins = snap.caps;
  }
  if (snap.level != null && snap.level > state.level) {
    state.level = snap.level;
  }
  if (snap.xp != null && snap.xp > state.xp) {
    delta.xp = snap.xp - state.xp;
    state.xp = snap.xp;
  }
  if (snap.pack) {
    PACK_KEYS.forEach((k) => {
      const want = snap.pack?.[k];
      if (want == null) return;
      const have = state.pack[k] ?? 0;
      if (want > have) {
        delta.pack[k] = want - have;
        state.pack[k] = want;
      }
    });
  }
  return delta;
}

export function deltaEmpty(d: HandshakeDelta) {
  return d.caps === 0 && d.xp === 0 && Object.keys(d.pack).length === 0;
}

export function stampedUrl(origin: string, snap: Pick<DiscordSnap, "id" | "name" | "caps" | "xp" | "level">): string {
  const u = new URL(origin);
  u.searchParams.set("d", snap.id);
  u.searchParams.set("n", snap.name);
  if (snap.caps != null) u.searchParams.set("caps", String(snap.caps));
  if (snap.xp != null) u.searchParams.set("xp", String(snap.xp));
  if (snap.level != null) u.searchParams.set("lvl", String(snap.level));
  return u.toString();
}

export async function pullRemote(id: string, timeoutMs = 1200): Promise<DiscordSnap | null> {
  if (typeof window === "undefined" || !id) return null;
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`/api/tyrone/sync?d=${encodeURIComponent(id)}`, {
      signal: ctrl.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      discord?: string;
      name?: string;
      caps?: number;
      xp?: number;
      level?: number;
      pack?: Partial<PackCounts>;
    };
    if (!body || typeof body !== "object") return null;
    return {
      id,
      name: cleanName(body.name ?? null, id),
      caps: typeof body.caps === "number" ? body.caps : undefined,
      xp: typeof body.xp === "number" ? body.xp : undefined,
      level: typeof body.level === "number" ? body.level : undefined,
      pack: body.pack,
      source: "api",
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(t);
  }
}
