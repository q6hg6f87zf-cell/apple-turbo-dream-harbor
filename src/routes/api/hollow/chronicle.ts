import { createFileRoute } from "@tanstack/react-router";
import { hollowVerifiedUser } from "@/lib/hollow-identity.server";
import { json, rateLimit } from "@/lib/bridge/auth.server";
import { isEventType, type WorldEventType } from "@/lib/bridge/catalog";
import { eventKey, publishWorldEvent, recentEventsFor } from "@/lib/bridge/events.server";
import { recordMemory, relevantMemories, sanitizeClaim } from "@/lib/bridge/memory.server";
import { getBond, applyEventBond } from "@/lib/bridge/relationship.server";
import { createPromise, listPromises, markSurfaced, setPromiseStatus } from "@/lib/bridge/promise.server";
import { getTyroneContext, surfaceForTrigger } from "@/lib/bridge/tyrone-context.server";
import { bondLabel, type ContinuityTrigger, type TriggerType, TRIGGER_TYPES } from "@/lib/bridge/continuity-core";

export const Route = createFileRoute("/api/hollow/chronicle")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const who = hollowVerifiedUser(request);
        if (who.response) return who.response;
        if (!who.discordId) return json({ memories: [], events: [], promises: [], relationship: null, summary: null });
        const ctx = await getTyroneContext(who.discordId, "");
        const events = await recentEventsFor(who.discordId, 8).catch(() => []);
        return json({
          memories: ctx.memories,
          events,
          promises: ctx.promises,
          relationship: ctx.relationship,
          summary: ctx.summary,
        });
      },
      POST: async ({ request }) => {
        const who = hollowVerifiedUser(request);
        if (who.response) return who.response;
        if (!who.discordId) return json({ error: "unauthorized" }, 401);
        if (!rateLimit(`chron:${who.discordId}`, 40)) return json({ error: "rate limited" }, 429);
        let body: {
          event?: { type?: unknown; payload?: unknown; key?: unknown };
          memory?: { kind?: unknown; claim?: unknown; tags?: unknown; importance?: unknown; id?: unknown; locationId?: unknown };
          promise?: { action?: unknown; id?: unknown; claim?: unknown };
          trigger?: { type?: unknown; region?: unknown; poi?: unknown; combat?: unknown; assist?: unknown };
          spoken?: { promiseId?: unknown };
        } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return json({ error: "bad json" }, 400);
        }
        const out: Record<string, unknown> = { ok: true };
        if (body.event && isEventType(body.event.type)) {
          const key = String(body.event.key ?? eventKey(body.event.type, who.discordId, JSON.stringify(body.event.payload ?? {})));
          out.event = await publishWorldEvent({
            type: body.event.type as WorldEventType,
            discordId: who.discordId,
            payload: body.event.payload && typeof body.event.payload === "object" ? (body.event.payload as Record<string, unknown>) : {},
            idempotencyKey: key,
          });
          if (body.event.type === "boss.defeated" || body.event.type === "character.forged" || body.event.type === "character.died") {
            await applyEventBond(who.discordId, String(body.event.type), "game");
          }
        }
        if (body.memory && typeof body.memory.claim === "string") {
          const kind =
            body.memory.kind === "promise" || body.memory.kind === "fact" || body.memory.kind === "conversation"
              ? body.memory.kind
              : "episode";
          const written = await recordMemory({
            discordId: who.discordId,
            kind,
            claim: sanitizeClaim(body.memory.claim),
            tags: Array.isArray(body.memory.tags) ? body.memory.tags.map(String) : [],
            importance: typeof body.memory.importance === "number" ? body.memory.importance : 5,
            locationId: typeof body.memory.locationId === "string" ? body.memory.locationId : null,
            source: "game",
            id: typeof body.memory.id === "string" ? body.memory.id : undefined,
          });
          out.memory = "error" in written ? written : { ...written.row, duplicate: written.duplicate };
          if (kind === "promise" && !("error" in written)) {
            out.promise = await createPromise({
              discordId: who.discordId,
              claim: written.row.claim,
              source: "game",
              relatedMemoryId: written.row.id,
            });
          }
        }
        if (body.promise?.action === "fulfill" && typeof body.promise.id === "string") {
          const updated = await setPromiseStatus(who.discordId, body.promise.id, "fulfilled", "game");
          out.promise = updated;
          if ("row" in updated) {
            await applyEventBond(who.discordId, "tyrone.promise_fulfilled", "game");
            await publishWorldEvent({
              type: "tyrone.promise_fulfilled",
              discordId: who.discordId,
              payload: { id: updated.row.id, subject: updated.row.subject },
              visibility: "private",
              idempotencyKey: `prom-kept:${updated.row.id}`,
            });
            await recordMemory({
              discordId: who.discordId,
              kind: "episode",
              claim: `Tyrone remembered: ${updated.row.subject}.`,
              tags: ["promise", "fulfilled", ...(updated.row.tags || [])],
              importance: 7,
              locationId: updated.row.locationId,
              source: "game",
              id: `kept-${updated.row.id}`,
            });
          }
        }
        if (body.promise?.action === "cancel" && typeof body.promise.id === "string") {
          out.promise = await setPromiseStatus(who.discordId, body.promise.id, "cancelled", "game");
        }
        if (body.trigger && (TRIGGER_TYPES as readonly string[]).includes(String(body.trigger.type))) {
          const trigger: ContinuityTrigger = {
            type: body.trigger.type as TriggerType,
            region: typeof body.trigger.region === "string" ? body.trigger.region : null,
            poi: typeof body.trigger.poi === "string" ? body.trigger.poi : null,
            combat: Boolean(body.trigger.combat),
            assist: typeof body.trigger.assist === "string" ? body.trigger.assist : "normal",
          };
          out.surface = await surfaceForTrigger(who.discordId, trigger);
        }
        if (typeof body.spoken?.promiseId === "string") {
          await markSurfaced(who.discordId, body.spoken.promiseId);
        }
        const bond = await getBond(who.discordId);
        out.relationship = { ...bond, label: bondLabel(bond) };
        out.promises = await listPromises(who.discordId);
        return json(out);
      },
    },
  },
});
