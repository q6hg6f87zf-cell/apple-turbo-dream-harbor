import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyBondDelta,
  bondDeltaForEvent,
  bondLabel,
  composeEventMemory,
  DEFAULT_BOND,
  eventMemoryId,
  explainRelationship,
  inventedHistory,
  inventedPromise,
  matchPromiseToTrigger,
  memoryTierForEvent,
  parsePromiseFromText,
  privateLeak,
  promiseBrokenByEvent,
  promiseCallbackLine,
  promiseSatisfiedByEvent,
  shouldCreateTyroneMemory,
  shouldRecallMemory,
  shouldSurfacePromise,
  type CanonicalPromise,
} from "./continuity-core.ts";
import { keepExistingMemory, pickRelevant, type MemoryScoreRow } from "./memory-core.ts";
import { memoryId, sanitizeClaim } from "./memory-id.ts";
import { IDENTITY_INVARIANT } from "./identity.ts";

const A = "111111111111111111";
const B = "222222222222222222";

function promiseRow(partial: Partial<CanonicalPromise> & { subject: string }): CanonicalPromise {
  return {
    id: partial.id ?? "prm-a",
    discordId: partial.discordId ?? A,
    kind: partial.kind ?? "return",
    subject: partial.subject,
    status: partial.status ?? "active",
    source: partial.source ?? "discord",
    regionId: partial.regionId ?? "ironclad",
    locationId: partial.locationId ?? "ironclad",
    poiId: partial.poiId ?? "ironclad-radio",
    tags: partial.tags ?? ["promise", "radio", "tower"],
    importance: partial.importance ?? 6,
    createdAt: partial.createdAt ?? "2026-09-20T00:00:00.000Z",
    resolvedAt: partial.resolvedAt ?? null,
    lastSurfacedAt: partial.lastSurfacedAt ?? null,
  };
}

test("relationship mutations are validated and humor stays read-only", () => {
  const badField = applyBondDelta(DEFAULT_BOND, "caps" as never, 2, "nope");
  assert.equal(badField.ok, false);
  const noReason = applyBondDelta(DEFAULT_BOND, "trust", 2, "");
  assert.equal(noReason.ok, false);
  const humor = applyBondDelta(DEFAULT_BOND, "humor", 2, "joke");
  assert.equal(humor.ok, false);
  const trust = applyBondDelta(DEFAULT_BOND, "trust", 3, "promise fulfilled");
  assert.equal(trust.ok, true);
  if (trust.ok) {
    assert.equal(trust.previous, 42);
    assert.equal(trust.next, 45);
  }
  assert.ok(bondDeltaForEvent("boss.defeated").respect);
  assert.equal(bondLabel(DEFAULT_BOND).length > 2, true);
});

test("Discord text becomes a structured promise only when intent is explicit", () => {
  const hit = parsePromiseFromText("We're going back to the Ironclad radio tower.");
  assert.ok(hit);
  assert.equal(hit?.kind, "return");
  assert.equal(hit?.regionId, "ironclad");
  assert.ok(hit?.tags.includes("tower"));
  assert.equal(parsePromiseFromText("how many caps do I have?"), null);
  assert.equal(parsePromiseFromText("nice weather"), null);
});

test("end-to-end: Discord promise, Ironclad trigger, Discord recall, USER B isolated", () => {
  const parsed = parsePromiseFromText("We're going back to the Ironclad radio tower.");
  assert.ok(parsed);
  const ledger = new Map<string, MemoryScoreRow>();
  const promises = new Map<string, CanonicalPromise>();
  const claim = sanitizeClaim(parsed!.claim);
  const mem: MemoryScoreRow = {
    id: memoryId(A, "promise", claim),
    discord_id: A,
    kind: "promise",
    claim,
    tags: parsed!.tags,
    importance: 6,
    location_id: "ironclad",
    source: "discord",
    created_at: "2026-09-20T21:00:00.000Z",
  };
  ledger.set(`${A}:${mem.id}`, keepExistingMemory(null, mem).row);
  const again = keepExistingMemory(ledger.get(`${A}:${mem.id}`) ?? null, { ...mem, source: "game" });
  assert.equal(again.duplicate, true);
  assert.equal(again.row.source, "discord");

  const row = promiseRow({ subject: parsed!.subject, source: "discord" });
  promises.set(row.id, row);

  const trigger = { type: "player.entered_region" as const, region: "ironclad", combat: false, assist: "normal" };
  const score = matchPromiseToTrigger(row, trigger);
  assert.ok(score >= 6);
  assert.equal(shouldSurfacePromise(row, trigger, score), true);
  assert.equal(shouldSurfacePromise(row, { ...trigger, combat: true }, score), false);
  const line = promiseCallbackLine(row);
  assert.match(line, /tower/i);
  promises.set(row.id, { ...row, status: "fulfilled", resolvedAt: "2026-09-20T22:00:00.000Z" });

  const kept: MemoryScoreRow = {
    id: memoryId(A, "episode", "Tyrone remembered: Ironclad radio tower."),
    discord_id: A,
    kind: "episode",
    claim: "Tyrone remembered: Ironclad radio tower.",
    tags: ["promise", "fulfilled", "tower"],
    importance: 7,
    location_id: "ironclad",
    source: "game",
    created_at: "2026-09-20T22:00:00.000Z",
  };
  ledger.set(`${A}:${kept.id}`, kept);

  const recalled = pickRelevant([...ledger.values()], { discordId: A, query: "what did we say about the tower?", limit: 4 });
  assert.ok(recalled.some((item) => /tower/i.test(item.claim)));
  assert.equal(pickRelevant([...ledger.values()], { discordId: B, query: "tower", limit: 4 }).length, 0);
  assert.equal(privateLeak({ discord_id: A, visibility: "private" }, B), true);
  assert.equal(privateLeak({ discord_id: A, visibility: "private" }, A), false);
  assert.equal(inventedPromise("You promised me 88000 caps and a mythic rifle.", []), true);
  assert.equal(inventedPromise("Caps on the file: 1200.", [row]), false);
  assert.match(IDENTITY_INVARIANT, /never replace or destroy/i);
});

test("duplicate promises keep the original source", () => {
  const first = promiseRow({ subject: "Ironclad radio tower", source: "discord" });
  const asMem = {
    id: first.id,
    source: first.source,
    created_at: first.createdAt,
  };
  const dup = keepExistingMemory(asMem, { ...asMem, source: "game" });
  assert.equal(dup.duplicate, true);
  assert.equal(dup.row.source, "discord");
});

test("meaningful-memory policy keeps telemetry out of the ledger", () => {
  assert.equal(shouldCreateTyroneMemory({ type: "campaign.day_advanced" }), false);
  assert.equal(shouldCreateTyroneMemory({ type: "player.joined" }), false);
  assert.equal(shouldCreateTyroneMemory({ type: "boss.engaged" }), false);
  assert.equal(shouldCreateTyroneMemory({ type: "mission.completed", kind: "scout" }), false);
  assert.equal(shouldCreateTyroneMemory({ type: "mission.completed", kind: "boss" }), true);
  assert.equal(shouldCreateTyroneMemory({ type: "boss.defeated" }), true);
  assert.equal(shouldCreateTyroneMemory({ type: "region.unlocked", region: "ironclad" }), false);
  assert.equal(shouldCreateTyroneMemory({ type: "region.unlocked", region: "blackspire" }), true);
  assert.equal(memoryTierForEvent("boss.defeated", { first: true }), "critical");
});

test("boss event composes one grounded memory and retries share the id", () => {
  const event = { id: "ev-gravenor-1", type: "boss.defeated", payload: { region: "ironclad", boss: "Gravenor" } };
  const first = composeEventMemory(event);
  const again = composeEventMemory(event);
  assert.ok(first);
  assert.equal(first?.id, eventMemoryId("ev-gravenor-1"));
  assert.equal(first?.id, again?.id);
  assert.match(first?.summary || "", /Gravenor/);
  assert.match(first?.summary || "", /Ironclad/);
  assert.equal(composeEventMemory({ id: "ev-day", type: "campaign.day_advanced", payload: { day: 4 } }), null);
});

test("deferred promise recall is not consumed, then a real objective fulfills once", () => {
  const row = promiseRow({ subject: "Ironclad radio tower" });
  const combat = { type: "player.entered_region" as const, region: "ironclad", combat: true, assist: "normal" };
  const open = { type: "player.entered_region" as const, region: "ironclad", combat: false, assist: "normal" };
  const score = matchPromiseToTrigger(row, open);
  assert.equal(shouldSurfacePromise(row, combat, score), false);
  assert.equal(row.status, "active");
  assert.equal(shouldSurfacePromise(row, open, score), true);
  assert.equal(promiseSatisfiedByEvent(row, { type: "player.entered_region", region: "ironclad" }), false);
  assert.equal(promiseSatisfiedByEvent(row, { type: "mission.completed", region: "ironclad" }), true);
  assert.equal(promiseBrokenByEvent(row, { type: "mission.failed", region: "ironclad" }), false);
  const keep = promiseRow({ kind: "keep", subject: "hold the line in Blackspire", regionId: "blackspire", locationId: "caverns" });
  assert.equal(promiseBrokenByEvent(keep, { type: "mission.failed", region: "blackspire" }), true);
});

test("story_flag_changed fulfills promises tagged with that flag", () => {
  const row = promiseRow({
    subject: "come back when the Rail Cut is scouted",
    tags: ["rail_cut_scouted", "ironclad"],
  });
  assert.equal(promiseSatisfiedByEvent(row, { type: "story_flag_changed", tags: ["vesper_named"] }), false);
  assert.equal(promiseSatisfiedByEvent(row, { type: "story_flag_changed", tags: ["rail_cut_scouted"] }), true);
  assert.equal(
    promiseSatisfiedByEvent(row, { type: "story_flag_changed", tags: ["flag:rail_cut_scouted"] }),
    true,
  );
});

test("relationship deltas stay small and repeat farming is a no-op at the rule layer", () => {
  const delta = bondDeltaForEvent("boss.defeated");
  assert.ok(Object.values(delta).every((n) => Math.abs(n) <= 1));
  const kept = bondDeltaForEvent("tyrone.promise_fulfilled");
  assert.equal(kept.trust, 1);
  assert.equal(kept.respect, 1);
  const tooBig = applyBondDelta(DEFAULT_BOND, "trust", 9, "farm");
  assert.equal(tooBig.ok, false);
});

test("relationship explanation uses real events and refuses invented history", () => {
  const why = explainRelationship({
    bond: DEFAULT_BOND,
    memories: [{ claim: "We put Gravenor down in Ironclad.", tags: ["boss", "ironclad"] }],
    promises: [{ subject: "Ironclad radio tower", status: "fulfilled" }],
    events: [{ field: "trust", reason: "promise kept", eventType: "tyrone.promise_fulfilled" }],
  });
  assert.ok(why.some((line) => /tower|word/i.test(line)));
  assert.ok(why.some((line) => /Gravenor/i.test(line)));
  assert.equal(explainRelationship({ bond: DEFAULT_BOND, memories: [], promises: [], events: [] }).length, 0);
  assert.equal(inventedHistory("We put Gravenor down in Ironclad.", []), true);
  assert.equal(inventedHistory("We put Gravenor down in Ironclad.", ["We put Gravenor down in Ironclad."]), false);
});

test("memory recall does not spam", () => {
  assert.equal(shouldRecallMemory({ importance: 9, combat: true }), false);
  assert.equal(shouldRecallMemory({ importance: 9, assist: "off" }), false);
  assert.equal(shouldRecallMemory({ importance: 6, recallCount: 3 }), false);
  assert.equal(shouldRecallMemory({ importance: 9, lastRecalledAt: new Date().toISOString() }), false);
  assert.equal(shouldRecallMemory({ importance: 9, recallCount: 0 }), true);
});

test("USER A event memory never reaches USER B", () => {
  const mem: MemoryScoreRow = {
    id: "mem-evt-ev-1",
    discord_id: A,
    kind: "episode",
    claim: "We put Gravenor down in Ironclad.",
    tags: ["boss", "ironclad"],
    importance: 9,
    location_id: "ironclad",
    source: "system",
    created_at: "2026-09-20T22:00:00.000Z",
    visibility: "private",
  };
  assert.equal(pickRelevant([mem], { discordId: A, query: "Gravenor", limit: 4 }).length, 1);
  assert.equal(pickRelevant([mem], { discordId: B, query: "Gravenor", limit: 4 }).length, 0);
  assert.equal(privateLeak({ discord_id: A, visibility: "private" }, B), true);
});

