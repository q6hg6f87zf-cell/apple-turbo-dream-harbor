import { getBearerToken } from "@/lib/auth/client";

export const PORCH_MAX = 10;

export type PorchSeat = {
  discordId: string;
  name: string;
  handle: string;
  screen: string;
  self?: boolean;
};

export type PorchSnapshot = {
  ok: boolean;
  seated: boolean;
  full: boolean;
  live: number;
  max: number;
  seats: PorchSeat[];
  error?: string;
};

function headers() {
  const h = new Headers({ accept: "application/json", "content-type": "application/json" });
  const bearer = getBearerToken();
  if (bearer) h.set("Authorization", `Bearer ${bearer}`);
  return h;
}

export async function fetchPorch(): Promise<PorchSnapshot> {
  try {
    const res = await fetch("/api/hollow/porch", { method: "GET", credentials: "same-origin", headers: headers() });
    const body = (await res.json().catch(() => ({}))) as Partial<PorchSnapshot>;
    const snap = normalize(body, res.ok);
    publishPorch(snap);
    return snap;
  } catch {
    return { ok: false, seated: false, full: false, live: 0, max: PORCH_MAX, seats: [] };
  }
}

export async function beatPorch(screen: string, name?: string, handle?: string): Promise<PorchSnapshot> {
  try {
    const res = await fetch("/api/hollow/porch", {
      method: "POST",
      credentials: "same-origin",
      headers: headers(),
      body: JSON.stringify({
        screen,
        name: name?.trim().slice(0, 32) ?? "",
        handle: (handle ?? "").replace(/^@/, "").slice(0, 32),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as Partial<PorchSnapshot>;
    const snap = normalize(body, res.ok || res.status === 409);
    publishPorch(snap);
    return snap;
  } catch {
    return { ok: false, seated: false, full: false, live: 0, max: PORCH_MAX, seats: [] };
  }
}

export async function leavePorch() {
  try {
    await fetch("/api/hollow/porch", { method: "DELETE", credentials: "same-origin", headers: headers() });
  } catch {
    /* ignore */
  }
}

const EMPTY: PorchSnapshot = { ok: false, seated: false, full: false, live: 0, max: PORCH_MAX, seats: [] };

let cache: PorchSnapshot = EMPTY;
const listeners = new Set<(snap: PorchSnapshot) => void>();

export function currentPorch() {
  return cache;
}

export function watchPorch(fn: (snap: PorchSnapshot) => void) {
  listeners.add(fn);
  fn(cache);
  return () => {
    listeners.delete(fn);
  };
}

export function publishPorch(snap: PorchSnapshot) {
  cache = snap;
  listeners.forEach((fn) => fn(snap));
}

function normalize(body: Partial<PorchSnapshot>, ok: boolean): PorchSnapshot {
  return {
    ok,
    seated: !!body.seated,
    full: !!body.full,
    live: typeof body.live === "number" ? body.live : body.seats?.length ?? 0,
    max: typeof body.max === "number" ? body.max : PORCH_MAX,
    seats: Array.isArray(body.seats) ? body.seats : [],
    error: body.error,
  };
}
