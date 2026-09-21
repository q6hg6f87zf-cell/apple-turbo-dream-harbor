import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const RIDER_COOKIE = "hr_rider";
export const OAUTH_COOKIE = "hr_oauth";
export const RIDER_MAX_AGE = 60 * 60 * 24 * 180;
export const OAUTH_MAX_AGE = 60 * 10;

export type RiderSession = {
  v: 1;
  did: string;
  handle: string;
  name: string;
  stamped: boolean;
  iat: number;
};

export type DiscordProfile = {
  id: string;
  username: string;
  globalName: string;
  handle: string;
  name: string;
};

type OAuthState = {
  s: string;
  v: string;
  iat: number;
};

function env(name: string) {
  return String(process.env[name] ?? "").trim();
}

export function discordClientId() {
  return env("DISCORD_CLIENT_ID");
}

export function discordClientSecret() {
  return env("DISCORD_CLIENT_SECRET");
}

export function discordConfigured() {
  return Boolean(discordClientId() && discordClientSecret());
}

export function isLiveRealmHost(hostHeader: string | null | undefined) {
  const host = String(hostHeader ?? "")
    .split(",")[0]
    .trim()
    .split(":")[0]
    .toLowerCase();
  return (
    host === "thehollowrealm.com" ||
    host === "www.thehollowrealm.com" ||
    host.endsWith(".thehollowrealm.com")
  );
}

export function requestHost(request: Request) {
  return (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    ""
  );
}

export function publicOrigin(request: Request) {
  const host = requestHost(request).split(",")[0].trim();
  const proto = (request.headers.get("x-forwarded-proto") ?? "https").split(",")[0].trim() || "https";
  return `${proto}://${host}`;
}

export function discordRedirectUri(request: Request) {
  return `${publicOrigin(request)}/api/discord/callback`;
}

function sessionSecret() {
  return discordClientSecret() || env("HOLLOW_SESSION_SECRET");
}

function b64url(buf: Buffer | string) {
  return Buffer.from(buf)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromB64url(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

function signPayload(payload: string, secret: string) {
  return b64url(createHmac("sha256", secret).update(payload).digest());
}

function sealed(payload: unknown, secret: string) {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${signPayload(body, secret)}`;
}

function unseal<T>(token: string | null | undefined, secret: string, maxAgeSec: number): T | null {
  if (!token || !secret) return null;
  const [body, sig] = String(token).split(".");
  if (!body || !sig) return null;
  const expected = signPayload(body, secret);
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return null;
  if (!timingSafeEqual(left, right)) return null;
  try {
    const parsed = JSON.parse(fromB64url(body).toString("utf8")) as T & { iat?: number };
    const iat = Number(parsed?.iat ?? 0);
    if (!iat || Math.abs(Date.now() / 1000 - iat) > maxAgeSec) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name: string) {
  const raw = request.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq) !== name) continue;
    return decodeURIComponent(trimmed.slice(eq + 1));
  }
  return "";
}

export function serializeCookie(
  name: string,
  value: string,
  { maxAge, httpOnly = true }: { maxAge: number; httpOnly?: boolean },
) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(maxAge))}`,
  ];
  if (httpOnly) parts.push("HttpOnly");
  parts.push("Secure");
  return parts.join("; ");
}

export function expireCookie(name: string) {
  return serializeCookie(name, "", { maxAge: 0 });
}

export function readRiderSession(request: Request): RiderSession | null {
  const secret = sessionSecret();
  const raw = unseal<RiderSession>(readCookie(request, RIDER_COOKIE), secret, RIDER_MAX_AGE);
  if (!raw || raw.v !== 1) return null;
  if (!/^\d{17,22}$/.test(raw.did)) return null;
  const handle = String(raw.handle ?? "").replace(/^@/, "").trim().slice(0, 32);
  const name = String(raw.name ?? "").trim().slice(0, 24);
  if (handle.length < 2) return null;
  return {
    v: 1,
    did: raw.did,
    handle,
    name: name || handle,
    stamped: !!raw.stamped,
    iat: raw.iat,
  };
}

export function riderCookie(session: Omit<RiderSession, "v" | "iat"> & { iat?: number }) {
  const secret = sessionSecret();
  if (!secret) return "";
  const payload: RiderSession = {
    v: 1,
    did: session.did,
    handle: session.handle.replace(/^@/, "").trim().slice(0, 32),
    name: session.name.trim().slice(0, 24) || session.handle,
    stamped: !!session.stamped,
    iat: session.iat ?? Math.floor(Date.now() / 1000),
  };
  return serializeCookie(RIDER_COOKIE, sealed(payload, secret), { maxAge: RIDER_MAX_AGE });
}

function sha256B64url(value: string) {
  return b64url(createHash("sha256").update(value).digest());
}

export function discordHandleFromUser(me: {
  id?: string;
  username?: string;
  global_name?: string | null;
  discriminator?: string;
}): DiscordProfile | null {
  const id = String(me.id ?? "").trim();
  if (!/^\d{17,22}$/.test(id)) return null;
  const username = String(me.username ?? "").trim();
  const discriminator = String(me.discriminator ?? "").trim();
  const handle =
    username && discriminator && discriminator !== "0"
      ? `${username}#${discriminator}`
      : username;
  if (handle.length < 2) return null;
  const globalName = String(me.global_name ?? "").trim();
  return {
    id,
    username,
    globalName,
    handle: handle.replace(/^@/, "").slice(0, 32),
    name: (globalName || username).slice(0, 24),
  };
}

export function buildAuthorizeUrl(request: Request) {
  const clientId = discordClientId();
  if (!clientId) return null;
  const state = b64url(randomBytes(18));
  const verifier = b64url(randomBytes(32));
  const challenge = sha256B64url(verifier);
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", discordRedirectUri(request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  const secret = sessionSecret();
  const cookie = secret
    ? serializeCookie(OAUTH_COOKIE, sealed({ s: state, v: verifier, iat: Math.floor(Date.now() / 1000) } satisfies OAuthState, secret), {
        maxAge: OAUTH_MAX_AGE,
      })
    : "";
  return { url: url.toString(), cookie };
}

export function readOAuthState(request: Request): OAuthState | null {
  const secret = sessionSecret();
  const raw = unseal<OAuthState>(readCookie(request, OAUTH_COOKIE), secret, OAUTH_MAX_AGE);
  if (!raw?.s || !raw?.v) return null;
  return raw;
}

export async function exchangeDiscordCode(request: Request, code: string, verifier: string) {
  const body = new URLSearchParams({
    client_id: discordClientId(),
    client_secret: discordClientSecret(),
    grant_type: "authorization_code",
    code,
    redirect_uri: discordRedirectUri(request),
    code_verifier: verifier,
  });
  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Discord token exchange failed (${response.status}) ${detail.slice(0, 180)}`);
  }
  return (await response.json()) as { access_token?: string };
}

export async function fetchDiscordMe(accessToken: string): Promise<DiscordProfile | null> {
  const response = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) return null;
  return discordHandleFromUser(
    (await response.json()) as {
      id?: string;
      username?: string;
      global_name?: string | null;
      discriminator?: string;
    },
  );
}

export function homeRedirect(request: Request, query: Record<string, string> = {}) {
  const url = new URL("/", publicOrigin(request));
  for (const [key, value] of Object.entries(query)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

export function redirectWithCookies(location: string, cookies: string[]) {
  const headers = new Headers({
    Location: location,
    "Cache-Control": "no-store",
  });
  for (const cookie of cookies) {
    if (cookie) headers.append("Set-Cookie", cookie);
  }
  return new Response(null, { status: 302, headers });
}
