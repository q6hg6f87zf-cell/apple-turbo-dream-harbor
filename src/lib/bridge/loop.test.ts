import assert from "node:assert/strict";
import { test } from "node:test";
import { keepExistingMemory, pickRelevant, type MemoryScoreRow } from "./memory-core.ts";
import { memoryId, sanitizeClaim } from "./memory-id.ts";
import { absoluteDeepLink, parseDeepTo, parseRegion } from "./catalog.ts";
import { isContextResponse, isEventFeedResponse, isMemoryWriteResponse, isSoulResponse } from "./contract.ts";
import { bridgeLog } from "./log.ts";

const A = "111111111111111111";
const B = "222222222222222222";

function row(partial: Partial<MemoryScoreRow> & { claim: string; discord_id: string }): MemoryScoreRow {
  const kind = partial.kind ?? "promise";
  return {
    id: partial.id ?? memoryId(partial.discord_id, kind, sanitizeClaim(partial.claim)),
    discord_id: partial.discord_id,
    kind,
    claim: sanitizeClaim(partial.claim),
    tags: partial.tags ?? [],
    importance: partial.importance ?? 5,
    location_id: partial.location_id ?? null,
    source: partial.source ?? "discord",
    created_at: partial.created_at ?? "2026-09-20T00:00:00.000Z",
  };
}

class Ledger {
  rows = new Map<string, MemoryScoreRow>();
  events = new Map<string, { id: string; type: string; attempts: number; status: string }>();

  write(input: { discordId: string; kind: MemoryScoreRow["kind"]; claim: string; source: string; importance?: number }) {
    const incoming = row({
      discord_id: input.discordId,
      kind: input.kind,
      claim: input.claim,
      source: input.source,
      importance: input.importance,
    });
    const existing = this.rows.get(`${incoming.discord_id}:${incoming.id}`) ?? null;
    const result = keepExistingMemory(existing, incoming);
    if (!result.duplicate) this.rows.set(`${incoming.discord_id}:${incoming.id}`, result.row);
    return result;
  }

  read(discordId: string, query = "") {
    return pickRelevant([...this.rows.values()], { discordId, query, limit: 6 });
  }

  publish(type: string, discordId: string, extra: string) {
    const key = `${type}:${discordId}:${extra}`;
    const existing = this.events.get(key);
    if (existing) return { id: existing.id, duplicate: true };
    const id = `ev-${this.events.size + 1}`;
    this.events.set(key, { id, type, attempts: 0, status: "pending" });
    return { id, duplicate: false };
  }

  ack(id: string, status: "delivered" | "failed") {
    for (const event of this.events.values()) {
      if (event.id !== id) continue;
      if (status === "failed") {
        event.attempts += 1;
        event.status = event.attempts >= 3 ? "failed-capped" : "failed";
      } else event.status = "delivered";
      return event;
    }
    return null;
  }

  claim(ids: string[]) {
    const claimed: string[] = [];
    for (const event of this.events.values()) {
      if (!ids.includes(event.id)) continue;
      if (event.status === "pending" || event.status === "failed") {
        event.status = "delivering";
        claimed.push(event.id);
      }
    }
    return claimed;
  }

  pending() {
    return [...this.events.values()].filter((event) => event.status === "pending" || event.status === "failed");
  }
}

test("cross-platform memory loop is canonical, private, and idempotent", () => {
  const ledger = new Ledger();
  const claim = "USER A will walk Ironclad after the raid";
  const first = ledger.write({ discordId: A, kind: "promise", claim, source: "discord", importance: 6 });
  assert.equal(first.duplicate, false);
  assert.equal(first.row.source, "discord");

  const dup = ledger.write({ discordId: A, kind: "promise", claim, source: "game", importance: 9 });
  assert.equal(dup.duplicate, true);
  assert.equal(dup.row.id, first.row.id);
  assert.equal(dup.row.source, "discord");
  assert.equal(dup.row.created_at, first.row.created_at);
  assert.equal(dup.row.importance, 6);

  assert.ok(ledger.read(A, "Ironclad").some((mem) => mem.claim.includes("Ironclad") && mem.source === "discord"));
  assert.equal(ledger.read(B, "Ironclad").some((mem) => mem.claim.includes("Ironclad")), false);

  const fromGame = ledger.write({
    discordId: A,
    kind: "episode",
    claim: "Hollow Realm recorded the porch sit",
    source: "game",
  });
  assert.equal(fromGame.duplicate, false);
  assert.ok(ledger.read(A, "porch sit").some((mem) => mem.id === fromGame.row.id && mem.source === "game"));
  assert.equal(ledger.read(B, "porch sit").some((mem) => mem.id === fromGame.row.id), false);
});

test("relevance ranking does not dump the whole ledger", () => {
  const rows = Array.from({ length: 20 }, (_, i) =>
    row({
      id: `mem-${i}`,
      discord_id: A,
      kind: "fact",
      claim: i === 3 ? "Gravenor is down in Ironclad" : `noise ${i}`,
      tags: i === 3 ? ["boss"] : ["noise"],
      importance: i === 3 ? 2 : 9,
      location_id: i === 3 ? "ironclad" : null,
      source: "game",
    }),
  );
  const picked = pickRelevant(rows, { discordId: A, query: "gravenor ironclad", limit: 4 });
  assert.equal(picked.length <= 4, true);
  assert.equal(picked[0]?.claim.includes("Gravenor"), true);
  assert.equal(pickRelevant(rows, { discordId: B, query: "gravenor" }).length, 0);
});

test("event publish is idempotent and failed delivery is not success", () => {
  const ledger = new Ledger();
  const first = ledger.publish("boss.defeated", A, "gravenor");
  const again = ledger.publish("boss.defeated", A, "gravenor");
  assert.equal(again.duplicate, true);
  assert.equal(again.id, first.id);
  assert.equal(ledger.pending().filter((event) => event.id === first.id).length, 1);

  const unlocked = ledger.publish("region.unlocked", A, "ironclad");
  ledger.ack(unlocked.id, "failed");
  assert.equal(ledger.pending().some((event) => event.id === unlocked.id), true);
  ledger.ack(unlocked.id, "failed");
  ledger.ack(unlocked.id, "failed");
  assert.equal(ledger.pending().some((event) => event.id === unlocked.id), false);
  assert.notEqual(ledger.ack(unlocked.id, "failed")?.status, "delivered");
});

test("claim-before-send restart cannot pull the event again", () => {
  const ledger = new Ledger();
  const first = ledger.publish("boss.defeated", A, "gravenor-chaos");
  assert.deepEqual(ledger.claim([first.id]), [first.id]);
  assert.equal(ledger.pending().some((event) => event.id === first.id), false);
  assert.deepEqual(ledger.claim([first.id]), []);
});

test("deep links refuse open redirects", () => {
  assert.equal(parseDeepTo("vault"), "vault");
  assert.equal(parseDeepTo("world"), "map");
  assert.equal(parseDeepTo("https://evil.example"), null);
  assert.equal(parseDeepTo("javascript:alert(1)"), null);
  assert.equal(parseRegion("ironclad"), "ironclad");
  assert.equal(parseRegion("../admin"), null);
  assert.equal(absoluteDeepLink("/vault"), "https://thehollowrealm.com/vault");
  assert.equal(absoluteDeepLink("https://evil.example"), "https://thehollowrealm.com/");
  assert.equal(absoluteDeepLink("//evil.example"), "https://thehollowrealm.com/");
});

test("contract shapes and log redaction", () => {
  assert.equal(
    isSoulResponse({
      soul: {
        linked: false,
        status: "UNLINKED",
        discordId: A,
        handle: null,
        displayName: null,
        playerName: null,
        character: null,
        campaign: "moon-squad",
        caps: 0,
        xp: 0,
        level: 1,
        open: "https://thehollowrealm.com",
      },
    }),
    true,
  );
  assert.equal(isContextResponse({ soul: {}, facts: [], memories: [], rule: "x" }), true);
  assert.equal(
    isMemoryWriteResponse({
      ok: true,
      memory: { id: "mem-1", discord_id: A, kind: "fact", claim: "x", source: "discord" },
    }),
    true,
  );
  assert.equal(isEventFeedResponse({ events: [] }), true);
  const lines: string[] = [];
  const orig = console.info;
  console.info = (msg?: unknown) => {
    lines.push(String(msg));
  };
  try {
    bridgeLog("auth.denied", {
      authorization: "Bearer super-secret",
      cookie: "hr_rider=abc",
      claim: "private memory text that is long",
    });
  } finally {
    console.info = orig;
  }
  assert.match(lines[0] || "", /\[redacted\]/);
  assert.doesNotMatch(lines[0] || "", /super-secret/);
  assert.doesNotMatch(lines[0] || "", /hr_rider=abc/);
});
