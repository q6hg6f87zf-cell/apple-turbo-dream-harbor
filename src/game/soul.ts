import { getBearerToken } from "@/lib/auth/client";
import type { Operative } from "./types";

export type SoulSnapshot = {
  soul: Operative | null;
  forgedAt?: string | null;
  error?: string;
};

function headers(json = false) {
  const h = new Headers({ accept: "application/json" });
  if (json) h.set("content-type", "application/json");
  const bearer = getBearerToken();
  if (bearer) h.set("Authorization", `Bearer ${bearer}`);
  return h;
}

export async function fetchSoul(): Promise<Operative | null> {
  try {
    const res = await fetch("/api/hollow/soul", {
      method: "GET",
      credentials: "same-origin",
      headers: headers(),
    });
    if (!res.ok) return null;
    const body = (await res.json().catch(() => ({}))) as SoulSnapshot;
    return body.soul ?? null;
  } catch {
    return null;
  }
}

export async function postSoul(operative: Operative): Promise<Operative | null> {
  try {
    const res = await fetch("/api/hollow/soul", {
      method: "POST",
      credentials: "same-origin",
      headers: headers(true),
      body: JSON.stringify({ operative }),
    });
    const body = (await res.json().catch(() => ({}))) as SoulSnapshot & { ok?: boolean };
    if (res.status === 409) return body.soul ?? null;
    if (!res.ok) return null;
    return body.soul ?? operative;
  } catch {
    return null;
  }
}
