import { createFileRoute } from "@tanstack/react-router";
import { cleanDiscordId, json, rateLimit, requireTrustedWriter } from "@/lib/bridge/auth.server";
import { soulSummary } from "@/lib/bridge/soul.server";
import { CANONICAL_ORIGIN } from "@/lib/bridge/catalog";

export const Route = createFileRoute("/api/bridge/soul")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireTrustedWriter(request);
        if (denied) return denied;
        const url = new URL(request.url);
        const id = cleanDiscordId(url.searchParams.get("discord"));
        if (!id) return json({ error: "invalid discord id" }, 400);
        if (!rateLimit(`soul:${id}`, 60)) return json({ error: "rate limited" }, 429);
        const origin = CANONICAL_ORIGIN;
        const soul = await soulSummary(id, origin);
        return json({ soul });
      },
    },
  },
});
