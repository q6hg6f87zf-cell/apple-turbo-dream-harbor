import { createFileRoute } from "@tanstack/react-router";
import { hollowVerifiedUser } from "@/lib/hollow-identity.server";
import { json, rateLimit } from "@/lib/bridge/auth.server";
import { isEventType, type WorldEventType } from "@/lib/bridge/catalog";
import { eventKey, publishWorldEvent, recentEventsFor } from "@/lib/bridge/events.server";
import { recordMemory, relevantMemories, sanitizeClaim } from "@/lib/bridge/memory.server";

export const Route = createFileRoute("/api/hollow/chronicle")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const who = hollowVerifiedUser(request);
        if (who.response) return who.response;
        if (!who.discordId) return json({ memories: [], events: [] });
        const memories = await relevantMemories({ discordId: who.discordId, limit: 10 });
        const events = await recentEventsFor(who.discordId, 8);
        return json({ memories, events });
      },
      POST: async ({ request }) => {
        const who = hollowVerifiedUser(request);
        if (who.response) return who.response;
        if (!who.discordId) return json({ error: "unauthorized" }, 401);
        if (!rateLimit(`chron:${who.discordId}`, 40)) return json({ error: "rate limited" }, 429);
        let body: {
          event?: { type?: unknown; payload?: unknown; key?: unknown };
          memory?: { kind?: unknown; claim?: unknown; tags?: unknown; importance?: unknown; id?: unknown };
        } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return json({ error: "bad json" }, 400);
        }
        const out: { event?: unknown; memory?: unknown } = {};
        if (body.event && isEventType(body.event.type)) {
          const key = String(body.event.key ?? eventKey(body.event.type, who.discordId, JSON.stringify(body.event.payload ?? {})));
          out.event = await publishWorldEvent({
            type: body.event.type as WorldEventType,
            discordId: who.discordId,
            payload: body.event.payload && typeof body.event.payload === "object" ? (body.event.payload as Record<string, unknown>) : {},
            idempotencyKey: key,
          });
        }
        if (body.memory && typeof body.memory.claim === "string") {
          const kind =
            body.memory.kind === "promise" || body.memory.kind === "fact" || body.memory.kind === "conversation"
              ? body.memory.kind
              : "episode";
          out.memory = await recordMemory({
            discordId: who.discordId,
            kind,
            claim: sanitizeClaim(body.memory.claim),
            tags: Array.isArray(body.memory.tags) ? body.memory.tags.map(String) : [],
            importance: typeof body.memory.importance === "number" ? body.memory.importance : 5,
            source: "game",
            id: typeof body.memory.id === "string" ? body.memory.id : undefined,
          });
        }
        return json({ ok: true, ...out });
      },
    },
  },
});
