import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env.server";
import { bridgeLog } from "./log";

const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS });
}

/** Shared secret TyroneBot uses for server-to-server reads/writes. Never send to browsers. */
export function bridgeSecret() {
  return env("HOLLOW_BRIDGE_KEY") || env("TYRONE_SYNC_WRITE_KEY");
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function trustedWriter(request: Request): "ok" | "disabled" | "denied" {
  const secret = bridgeSecret();
  if (!secret) return "disabled";
  const header = request.headers.get("authorization") ?? "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!supplied) return "denied";
  try {
    return timingSafeEqual(digest(secret), digest(supplied)) ? "ok" : "denied";
  } catch {
    return "denied";
  }
}

export function requireTrustedWriter(request: Request, note?: string): Response | null {
  const started = Date.now();
  const result = trustedWriter(request);
  if (result === "ok") {
    if (!rateLimit(`ok:${clientKey(request)}`, 120)) {
      bridgeLog("auth.rate_limited", { ip: "redacted-count", route: request.url.split("?")[0] });
      return json({ error: "rate limited" }, 429);
    }
    return null;
  }
  const ip = clientKey(request);
  if (!rateLimit(`authfail:${ip}`, 20)) {
    bridgeLog("auth.rate_limited", { reason: result });
    return json({ error: "rate limited" }, 429);
  }
  bridgeLog(result === "disabled" ? "auth.disabled" : "auth.denied", {
    ms: Date.now() - started,
    path: new URL(request.url).pathname,
  });
  if (result === "disabled") {
    return json({ error: "trusted sync disabled", note: note ?? "bridge unavailable" }, 503);
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

export function resetRateLimitForTests() {
  hits.clear();
}
