import { createFileRoute } from "@tanstack/react-router";
import {
  homeRedirect,
  issueGuestCookie,
  redirectWithCookies,
} from "@/lib/auth/discord-native.server";

export const Route = createFileRoute("/api/guest/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookie = issueGuestCookie(request);
        if (!cookie) {
          return redirectWithCookies(homeRedirect(request, { auth: "error", reason: "guest-unavailable" }), []);
        }
        return redirectWithCookies(homeRedirect(request, { auth: "guest" }), [cookie]);
      },
    },
  },
});
