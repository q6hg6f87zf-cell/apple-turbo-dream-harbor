import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env.server";

const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS });
}

/** Shared secret TyroneBot uses for server-to-server reads/writes. */
export function bridgeSecret() {
  return env("HOLLOW_BRIDGE_KEY") || env("TYRONE_SYNC_WRITE_KEY");
}

export function trustedWriter(request: Request): "ok" | "disabled" | "denied" {
  const secret = bridgeSecret();
  if (!secret) return "disabled";
  const header = request.headers.get("authorization") ?? "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!supplied) return "denied";
  const expectedBytes = Buffer.from(secret);
  const suppliedBytes = Buffer.from(supplied);
  if (expectedBytes.length !== suppliedBytes.length) return "denied";
  return timingSafeEqual(expectedBytes, suppliedBytes) ? "ok" : "denied";
}

export function requireTrustedWriter(request: Request, note?: string): Response | null {
  const result = trustedWriter(request);
  if (result === "ok") return null;
  if (result === "disabled") {
    return json(
      {
        error: "trusted sync disabled",
        note: note ?? "Set HOLLOW_BRIDGE_KEY or TYRONE_SYNC_WRITE_KEY before TyroneBot can read Hollow Realm.",
      },
      503,
    );
  }
  return json({ error: "unauthorized" }, 401);
}

export function cleanDiscordId(raw: unknown): string | null {
  const id = String(raw ?? "").trim();
  return /^\d{17,22}$/.test(id) ? id : null;
}

const hits = new Map<string, { n: number; t: number }>();

export function rateLimit(key: string, max = 30, windowMs = 60_000) {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || now - row.t > windowMs) {
    hits.set(key, { n: 1, t: now });
    return true;
  }
  if (row.n >= max) return false;
  row.n += 1;
  return true;
}
