/**
 * The upstream identity providers this app offers for sign-in (via the broker).
 *
 * Source of truth for BOTH the server (`server.ts`, one `genericOAuth` provider
 * per entry) and the client (`client.ts` / sign-in buttons). Kept in its own
 * dependency-free module so the client can import it without pulling the
 * server-only Better Auth instance (and `pg`) into the browser bundle.
 */
export type GrokProvider = {
  /** This app's local provider id; also the callback path segment. */
  providerId: string;
  /** Upstream hint the broker forwards to (Better Auth social id). */
  idp: string;
  /** Human label for the sign-in button. */
  label: string;
};

export const DISCORD_PROVIDER_ID = "grok-discord";

export const GROK_PROVIDERS: readonly GrokProvider[] = [
  // Hollow Realm uses Discord as its player-facing front door. Google/X remain
  // available to the shared auth layer for admin/template compatibility, but
  // the game access gate explicitly requires DISCORD_PROVIDER_ID.
  { providerId: DISCORD_PROVIDER_ID, idp: "discord", label: "Discord" },
  { providerId: "grok-google", idp: "google", label: "Google" },
  { providerId: "grok-x", idp: "twitter", label: "X" },
];
