import { createFileRoute } from "@tanstack/react-router";
import {
  buildAuthorizeUrl,
  discordConfigured,
  expireCookie,
  homeRedirect,
  OAUTH_COOKIE,
  readRiderSession,
  redirectWithCookies,
} from "@/lib/auth/discord-native.server";

export const Route = createFileRoute("/api/discord/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (readRiderSession(request)) {
          return redirectWithCookies(homeRedirect(request, { discord: "ok" }), []);
        }
        if (!discordConfigured()) {
          return redirectWithCookies(homeRedirect(request, { discord: "error", reason: "not-configured" }), [
            expireCookie(OAUTH_COOKIE),
          ]);
        }
        const start = buildAuthorizeUrl(request);
        if (!start) {
          return redirectWithCookies(homeRedirect(request, { discord: "error", reason: "not-configured" }), []);
        }
        return redirectWithCookies(start.url, [start.cookie]);
      },
    },
  },
});
