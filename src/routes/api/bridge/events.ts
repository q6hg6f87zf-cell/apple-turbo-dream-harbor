import { createFileRoute } from "@tanstack/react-router";
import { json, rateLimit, requireTrustedWriter } from "@/lib/bridge/auth.server";
import { ackEvents, pendingFeedEvents } from "@/lib/bridge/events.server";
import { audit } from "@/lib/bridge/audit.server";
import { bridgeLog } from "@/lib/bridge/log";

export const Route = createFileRoute("/api/bridge/events")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireTrustedWriter(request);
        if (denied) return denied;
        if (!rateLimit("events:pull", 30)) return json({ error: "rate limited" }, 429);
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") ?? 20);
        const events = await pendingFeedEvents(limit);
        return json({ events });
      },
      POST: async ({ request }) => {
        const denied = requireTrustedWriter(request);
        if (denied) return denied;
        let body: { ids?: unknown; status?: unknown; error?: unknown } = {};
        try {
          body = (await request.json()) as { ids?: unknown; status?: unknown; error?: unknown };
        } catch {
          return json({ error: "bad json" }, 400);
        }
        const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
        const status = body.status === "skipped" || body.status === "failed" ? body.status : "delivered";
        const n = await ackEvents(ids, status, String(body.error ?? ""));
        await audit("discord event delivered", { actor: "tyrone-bot", detail: { n, status } });
        bridgeLog("event.http_ack", { status, n });
        return json({ ok: true, acked: n });
      },
    },
  },
});
