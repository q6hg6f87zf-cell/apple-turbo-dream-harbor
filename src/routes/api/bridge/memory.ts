import { createFileRoute } from "@tanstack/react-router";
import { cleanDiscordId, json, rateLimit, requireTrustedWriter } from "@/lib/bridge/auth.server";
import { recordMemory, relevantMemories, sanitizeClaim } from "@/lib/bridge/memory.server";
import { publishWorldEvent } from "@/lib/bridge/events.server";
import { createPromise } from "@/lib/bridge/promise.server";
import { parsePromiseFromText } from "@/lib/bridge/continuity-core";
import { bridgeLog } from "@/lib/bridge/log";

const KINDS = ["episode", "fact", "promise", "conversation"] as const;

export const Route = createFileRoute("/api/bridge/memory")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireTrustedWriter(request);
        if (denied) return denied;
        const url = new URL(request.url);
        const id = cleanDiscordId(url.searchParams.get("discord"));
        if (!id) return json({ error: "invalid discord id" }, 400);
        const q = String(url.searchParams.get("q") ?? "").slice(0, 160);
        const memories = await relevantMemories({ discordId: id, query: q, limit: 8 });
        return json({ memories });
      },
      POST: async ({ request }) => {
        const denied = requireTrustedWriter(request);
        if (denied) return denied;
        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ error: "bad json" }, 400);
        }
        const id = cleanDiscordId(body.discord);
        if (!id) return json({ error: "invalid discord id" }, 400);
        if (!rateLimit(`mem:${id}`, 20)) return json({ error: "rate limited" }, 429);
        const parsed = parsePromiseFromText(body.claim);
        let kind = KINDS.includes(body.kind as (typeof KINDS)[number]) ? (body.kind as (typeof KINDS)[number]) : null;
        if (!kind) return json({ error: "unknown memory kind" }, 400);
        if (kind === "conversation" && parsed) kind = "promise";
        const claim = sanitizeClaim(body.claim);
        const result = await recordMemory({
          discordId: id,
          kind,
          claim,
          tags: Array.isArray(body.tags) ? body.tags.map(String) : parsed?.tags ?? [],
          importance: typeof body.importance === "number" ? body.importance : parsed?.importance ?? 4,
          locationId: typeof body.locationId === "string" ? body.locationId : parsed?.locationId ?? null,
          poiId: parsed?.poiId ?? null,
          payload: body.payload && typeof body.payload === "object" ? (body.payload as Record<string, unknown>) : parsed ?? {},
          source: "discord",
        });
        if ("error" in result) return json({ error: result.error }, result.status);
        let promise = null;
        if (kind === "promise") {
          promise = await createPromise({
            discordId: id,
            claim,
            source: "discord",
            relatedMemoryId: result.row.id,
            tags: parsed?.tags,
            regionId: parsed?.regionId,
            locationId: parsed?.locationId,
            poiId: parsed?.poiId,
          });
        }
        if (!result.duplicate && (kind === "promise" || kind === "episode")) {
          await publishWorldEvent({
            type: kind === "promise" ? "tyrone.promise_created" : "tyrone.memory_recorded",
            discordId: id,
            payload: { kind, claim: claim.slice(0, 160) },
            visibility: "private",
            idempotencyKey: `mem:${result.row.id}`,
          });
        }
        bridgeLog("memory.http_write", { discordId: id, duplicate: result.duplicate, kind });
        return json({ ok: true, memory: result.row, duplicate: result.duplicate, promise });
      },
    },
  },
});
