import { createFileRoute } from "@tanstack/react-router";
import { cleanDiscordId, json, rateLimit, requireTrustedWriter } from "@/lib/bridge/auth.server";
import { tyroneContext } from "@/lib/bridge/soul.server";

export const Route = createFileRoute("/api/bridge/context")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireTrustedWriter(request);
        if (denied) return denied;
        const url = new URL(request.url);
        const id = cleanDiscordId(url.searchParams.get("discord"));
        if (!id) return json({ error: "invalid discord id" }, 400);
        if (!rateLimit(`ctx:${id}`, 40)) return json({ error: "rate limited" }, 429);
        const query = String(url.searchParams.get("q") ?? "").slice(0, 160);
        const context = await tyroneContext(id, query);
        return json(context);
      },
    },
  },
});
