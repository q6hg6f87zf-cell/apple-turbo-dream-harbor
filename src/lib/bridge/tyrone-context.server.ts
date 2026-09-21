import { soulSummary } from "./soul.server";
import { relevantMemories } from "./memory.server";
import { recentEventsFor } from "./events.server";
import { getBond } from "./relationship.server";
import { listPromises, matchPromises } from "./promise.server";
import { bondLabel, promiseCallbackLine, type ContinuityTrigger } from "./continuity-core";
import { bridgeLog } from "./log";

export async function getTyroneContext(discordId: string, query = "") {
  const started = Date.now();
  const [soul, relationship, memories, promises, events] = await Promise.all([
    soulSummary(discordId).catch(() => null),
    getBond(discordId),
    relevantMemories({ discordId, query, limit: 6 }).catch(() => []),
    listPromises(discordId).catch(() => []),
    recentEventsFor(discordId, 6).catch(() => []),
  ]);
  const active = promises.filter((row) => row.status === "active");
  const facts: { key: string; value: string }[] = [];
  if (soul?.playerName) facts.push({ key: "name", value: soul.playerName });
  if (soul?.handle) facts.push({ key: "handle", value: `@${soul.handle.replace(/^@/, "")}` });
  if (soul?.character) {
    facts.push({ key: "character", value: soul.character.name });
    facts.push({ key: "class", value: soul.character.classKey });
    facts.push({ key: "status", value: soul.character.status });
  }
  if (soul) {
    facts.push({ key: "campaign", value: "Moon Squad" });
    facts.push({ key: "caps", value: String(soul.caps) });
    facts.push({ key: "xp", value: String(soul.xp) });
    facts.push({ key: "level", value: String(soul.level) });
    facts.push({ key: "link", value: soul.status });
  }
  facts.push({ key: "relationship", value: bondLabel(relationship) });
  facts.push({ key: "relationship.trust", value: String(Math.round(relationship.trust)) });
  facts.push({ key: "relationship.familiarity", value: String(Math.round(relationship.familiarity)) });
  facts.push({ key: "activePromises", value: String(active.length) });
  for (const row of active.slice(0, 4)) facts.push({ key: "promise", value: row.subject });
  for (const mem of memories) facts.push({ key: `memory.${mem.kind}`, value: mem.claim });

  const unknown: string[] = [];
  if (!soul?.character) unknown.push("character");
  if (!soul?.region) unknown.push("region");
  if (!soul?.inventory.length) unknown.push("inventory");
  if (!soul?.bosses.length) unknown.push("bosses");
  if (!active.length) unknown.push("promises");

  bridgeLog("context.assemble", { discordId, facts: facts.length, ms: Date.now() - started });
  return {
    soul: soul ?? { linked: false, status: "UNLINKED" as const, discordId, memories: 0, open: "https://thehollowrealm.com" },
    relationship,
    relationshipLabel: bondLabel(relationship),
    facts,
    unknown,
    memories: memories.map((row) => ({
      id: row.id,
      kind: row.kind,
      claim: row.claim,
      importance: row.importance,
      source: row.source,
      at: row.created_at,
      locationId: row.location_id,
      visibility: "private",
    })),
    promises: promises.map((row) => ({
      id: row.id,
      kind: row.kind,
      subject: row.subject,
      status: row.status,
      source: row.source,
      regionId: row.regionId,
      locationId: row.locationId,
      poiId: row.poiId,
      tags: row.tags,
      importance: row.importance,
      createdAt: row.createdAt,
      resolvedAt: row.resolvedAt,
    })),
    events: events.map((row) => ({
      type: row.event_type,
      visibility: row.visibility,
      at: row.created_at,
      payload: row.payload,
    })),
    summary: {
      relationship: bondLabel(relationship),
      activePromises: active.length,
      importantMemories: memories.filter((row) => row.importance >= 5).length,
      lastMeaningful: memories[0]?.claim ?? null,
    },
    rule: "Only state values present in facts, memories, or promises. If a key is missing or listed in unknown, say you do not have that information. Do not invent inventory, deaths, bosses, caps, promises, or relationship numbers.",
  };
}

export async function getTyroneSummary(discordId: string) {
  const ctx = await getTyroneContext(discordId, "");
  return ctx.summary;
}

export async function surfaceForTrigger(discordId: string, trigger: ContinuityTrigger) {
  const hits = await matchPromises(discordId, trigger).catch(() => []);
  return hits.map((hit) => ({
    id: hit.row.id,
    text: promiseCallbackLine(hit.row),
    fulfillOnSpeak: hit.row.kind === "return" || hit.row.kind === "intention",
    score: hit.score,
  }));
}
