import { recordMemory } from "./memory.server";
import { applyEventBond } from "./relationship.server";
import { listPromises, setPromiseStatus } from "./promise.server";
import {
  composeEventMemory,
  eventCallbackLine,
  promiseBrokenByEvent,
  promiseSatisfiedByEvent,
  shouldCreateTyroneMemory,
  type ContinuityTrigger,
} from "./continuity-core";
import { bridgeLog } from "./log";
import type { WorldEventType } from "./catalog";

export type IngestResult = {
  memoryId?: string;
  duplicate?: boolean;
  utterance?: string | null;
  fulfilled?: string[];
  broken?: string[];
};

async function publishPromiseOutcome(
  discordId: string,
  type: "tyrone.promise_fulfilled" | "tyrone.promise_broken",
  row: { id: string; subject: string; regionId: string | null },
) {
  const { publishWorldEvent } = await import("./events.server");
  const key = type === "tyrone.promise_fulfilled" ? `prom-kept:${row.id}` : `prom-broke:${row.id}`;
  await publishWorldEvent({
    type: type as WorldEventType,
    discordId,
    payload: { id: row.id, subject: row.subject, region: row.regionId },
    visibility: "private",
    idempotencyKey: key,
  });
}

export async function resolvePromisesForTrigger(discordId: string, trigger: ContinuityTrigger) {
  const fulfilled: string[] = [];
  try {
    const active = await listPromises(discordId, "active");
    const event = { type: trigger.type, region: trigger.region ?? null, poi: trigger.poi ?? null, tags: trigger.tags ?? [] };
    for (const row of active) {
      if (!promiseSatisfiedByEvent(row, event)) continue;
      const updated = await setPromiseStatus(discordId, row.id, "fulfilled", "system");
      if ("row" in updated) {
        fulfilled.push(row.id);
        await publishPromiseOutcome(discordId, "tyrone.promise_fulfilled", row);
      }
    }
  } catch {
    bridgeLog("event.promise_resolve_failed", { discordId, db: true });
  }
  return { fulfilled };
}

export async function afterEventPublished(input: {
  discordId: string | null;
  eventId: string;
  type: string;
  payload: Record<string, unknown>;
  duplicate: boolean;
  first?: boolean;
}): Promise<IngestResult> {
  const kind = typeof input.payload.kind === "string" ? input.payload.kind : undefined;
  const region = typeof input.payload.region === "string" ? input.payload.region : null;
  const meaningful = shouldCreateTyroneMemory({ type: input.type, kind, region, first: input.first });
  if (input.duplicate || !input.discordId) return {};
  const out: IngestResult = { fulfilled: [], broken: [] };
  try {
    if (meaningful) {
      const draft = composeEventMemory({
        id: input.eventId,
        type: input.type,
        payload: input.payload,
        first: input.first,
      });
      if (draft) {
        const written = await recordMemory({
          discordId: input.discordId,
          kind: "episode",
          claim: draft.summary,
          tags: draft.tags,
          importance: draft.importance,
          locationId: draft.locationId,
          poiId: draft.poiId,
          source: "system",
          id: draft.id,
          visibility: "private",
          relatedEventId: draft.relatedEventId,
          payload: { title: draft.title, consolidationGroup: draft.consolidationGroup, eventType: input.type },
        });
        if (!("error" in written)) {
          out.memoryId = written.row.id;
          out.duplicate = written.duplicate;
          if (!written.duplicate) out.utterance = eventCallbackLine(draft);
        }
      }
    }
  } catch {
    bridgeLog("event.memory_failed", { discordId: input.discordId, db: true });
  }
  try {
    if (meaningful) await applyEventBond(input.discordId, input.type, "game", input.eventId);
  } catch {
    /* relationship never blocks the file */
  }
  try {
    const active = await listPromises(input.discordId, "active");
    const event = {
      type: input.type,
      region: typeof input.payload.region === "string" ? input.payload.region : null,
      poi: typeof input.payload.poi === "string" ? input.payload.poi : null,
    };
    for (const row of active) {
      if (promiseSatisfiedByEvent(row, event)) {
        const updated = await setPromiseStatus(input.discordId, row.id, "fulfilled", "system");
        if ("row" in updated) {
          out.fulfilled?.push(row.id);
          await publishPromiseOutcome(input.discordId, "tyrone.promise_fulfilled", row);
        }
      } else if (promiseBrokenByEvent(row, event)) {
        const updated = await setPromiseStatus(input.discordId, row.id, "broken", "system");
        if ("row" in updated) {
          out.broken?.push(row.id);
          await publishPromiseOutcome(input.discordId, "tyrone.promise_broken", row);
        }
      }
    }
  } catch {
    bridgeLog("event.promise_resolve_failed", { discordId: input.discordId, db: true });
  }
  return out;
}
