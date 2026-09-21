import { createFileRoute } from "@tanstack/react-router";
import {
  discordConfigured,
  exchangeDiscordCode,
  expireCookie,
  fetchDiscordMe,
  homeRedirect,
  OAUTH_COOKIE,
  readOAuthState,
  redirectWithCookies,
  riderCookie,
} from "@/lib/auth/discord-native.server";
import { lookupRider, upsertRiderFromDiscord } from "@/lib/auth/discord-riders.server";

export const Route = createFileRoute("/api/discord/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const error = url.searchParams.get("error");
        const code = url.searchParams.get("code") ?? "";
        const state = url.searchParams.get("state") ?? "";
        const bounce = (reason: string) =>
          redirectWithCookies(homeRedirect(request, { discord: "error", reason }), [expireCookie(OAUTH_COOKIE)]);

        if (error) return bounce(error.slice(0, 40));
        if (!discordConfigured()) return bounce("not-configured");

        const stored = readOAuthState(request);
        if (!stored || !state || stored.s !== state) return bounce("state");
        if (!code) return bounce("code");

        try {
          const token = await exchangeDiscordCode(request, code, stored.v);
          if (!token.access_token) return bounce("token");
          const profile = await fetchDiscordMe(token.access_token);
          if (!profile) return bounce("profile");
          const existing = await lookupRider(profile.id);
          const rider = await upsertRiderFromDiscord(profile, existing);
          return redirectWithCookies(homeRedirect(request, { discord: "ok" }), [
            riderCookie({
              did: rider.discordId,
              handle: rider.handle,
              name: rider.name,
              stamped: rider.stamped,
            }),
            expireCookie(OAUTH_COOKIE),
          ]);
        } catch {
          return bounce("exchange");
        }
      },
    },
  },
});
