import { createFileRoute } from "@tanstack/react-router";
import { cleanDiscordId, json, rateLimit, requireTrustedWriter } from "@/lib/bridge/auth.server";
import { soulSummary } from "@/lib/bridge/soul.server";
import { CANONICAL_ORIGIN } from "@/lib/bridge/catalog";
import { bridgeLog } from "@/lib/bridge/log";

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
        const started = Date.now();
        const soul = await soulSummary(id, CANONICAL_ORIGIN);
        bridgeLog("soul.lookup", { discordId: id, status: soul.status, ms: Date.now() - started });
        return json({ soul });
      },
    },
  },
});
