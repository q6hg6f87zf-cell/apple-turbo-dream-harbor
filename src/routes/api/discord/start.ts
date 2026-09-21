import { createFileRoute } from "@tanstack/react-router";
import {
  buildAuthorizeUrl,
  CANONICAL_ORIGIN,
  discordConfigured,
  discordStartUrl,
  expireCookie,
  homeRedirect,
  OAUTH_COOKIE,
  publicOrigin,
  readRiderSession,
  redirectWithCookies,
  requestHost,
  usesCanonicalDiscord,
} from "@/lib/auth/discord-native.server";

export const Route = createFileRoute("/api/discord/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (readRiderSession(request)) {
          return redirectWithCookies(homeRedirect(request, { auth: "ok" }), []);
        }
        const host = (requestHost(request).split(",")[0] ?? "").trim().split(":")[0].toLowerCase();
        if (usesCanonicalDiscord(host) && publicOrigin(request) === CANONICAL_ORIGIN && host !== "thehollowrealm.com") {
          return redirectWithCookies(discordStartUrl(request), []);
        }
        if (!discordConfigured()) {
          return redirectWithCookies(homeRedirect(request, { auth: "error", reason: "not-configured" }), [
            expireCookie(OAUTH_COOKIE),
          ]);
        }
        const start = buildAuthorizeUrl(request);
        if (!start) {
          return redirectWithCookies(homeRedirect(request, { auth: "error", reason: "not-configured" }), []);
        }
        return redirectWithCookies(start.url, [start.cookie]);
      },
    },
  },
});
