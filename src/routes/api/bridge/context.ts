import { createFileRoute } from "@tanstack/react-router";
import { cleanDiscordId, json, rateLimit, requireTrustedWriter } from "@/lib/bridge/auth.server";
import { getTyroneContext } from "@/lib/bridge/tyrone-context.server";
import { bridgeLog } from "@/lib/bridge/log";

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
        const started = Date.now();
        const context = await getTyroneContext(id, query);
        bridgeLog("context.lookup", { discordId: id, facts: context.facts.length, ms: Date.now() - started });
        return json(context);
      },
    },
  },
});
