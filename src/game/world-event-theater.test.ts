import assert from "node:assert/strict";
import test from "node:test";
import {
  bridgeTypeForTheater,
  defaultBeatId,
  extractWorldConsequence,
  isScarWorthy,
  normalizeTheaterEvent,
  parseLiveBeat,
  parseOfferMutations,
  parseWorldConsequence,
  resolveTheaterBeatId,
  shouldEnqueueBridgeOutbox,
  theaterFromLiveEventType,
} from "./world-event-theater.ts";

test("theater aliases onto bridge dotted types without renaming catalog", () => {
  assert.equal(bridgeTypeForTheater("MissionSettled"), "mission.completed");
  assert.equal(bridgeTypeForTheater("BossCleared"), "boss.defeated");
  assert.equal(bridgeTypeForTheater("RaidOpened"), null);
  assert.equal(theaterFromLiveEventType("MissionSettled"), "MissionSettled");
  assert.equal(theaterFromLiveEventType("mission.completed"), "MissionSettled");
  assert.equal(theaterFromLiveEventType("nope"), null);
});

test("MissionSettled defaults beatId from intel / boss kind", () => {
  assert.equal(defaultBeatId("MissionSettled", { kind: "boss" }), "boss_clear");
  assert.equal(defaultBeatId("MissionSettled", { intelDelta: 1 }), "intel_drop");
  assert.equal(defaultBeatId("MissionSettled", { intelDelta: 0 }), "vault_flash");
  assert.equal(defaultBeatId("RaidOpened"), "raid_opened");
});

test("normalizeTheaterEvent fills bridgeType and heat", () => {
  const event = normalizeTheaterEvent({
    theater: "MissionSettled",
    eventId: "ev-test-1",
    region: "ironclad",
    kind: "raid",
    revision: { campaign: 12, member: 4 },
  });
  assert.equal(event.bridgeType, "mission.completed");
  assert.equal(event.heatDelta, 3);
  assert.equal(event.intelDelta, 1);
  assert.equal(event.beatId, "intel_drop");
  assert.equal(shouldEnqueueBridgeOutbox(event), true);
  const scout = normalizeTheaterEvent({
    theater: "MissionSettled",
    kind: "scout",
    revision: { campaign: 1 },
  });
  assert.equal(shouldEnqueueBridgeOutbox(scout), false);
});

test("parseLiveBeat accepts Pulse hello/revision/heartbeat wire shape", () => {
  assert.equal(parseLiveBeat({ type: "hello", campaignRevision: 3, memberRevision: 1 })?.type, "hello");
  const rev = parseLiveBeat({
    type: "revision",
    campaignRevision: 9,
    memberRevision: 2,
    eventType: "MissionSettled",
  });
  assert.equal(rev?.eventType, "MissionSettled");
  assert.equal(parseLiveBeat({ type: "revision", campaignRevision: "x", memberRevision: 1 }), null);
  assert.equal(parseLiveBeat(null), null);
});

test("Vault kebab beat ids alias onto Atlas snake beat ids", () => {
  assert.equal(resolveTheaterBeatId("boss-cleared"), "boss_clear");
  assert.equal(resolveTheaterBeatId("intel-spike"), "intel_drop");
  assert.equal(resolveTheaterBeatId("mission-cleared"), "mission_settle");
  assert.equal(resolveTheaterBeatId("intel_drop"), "intel_drop");
  const event = normalizeTheaterEvent({
    theater: "MissionSettled",
    beatId: "intel-spike" as never,
    region: "ironclad",
    kind: "scout",
    revision: { campaign: 1 },
    intelDelta: 2,
  });
  assert.equal(event.beatId, "intel_drop");
});

test("normalize parses worldConsequence.offerMutations; ignores nested heat", () => {
  const event = normalizeTheaterEvent({
    theater: "MissionSettled",
    eventId: "wc-1",
    region: "slagtown",
    kind: "raid",
    heatDelta: 3,
    intelDelta: 1,
    beatId: "intel_drop",
    revision: { campaign: 7 },
    worldConsequence: {
      heatDelta: 99,
      offerMutations: [
        {
          op: "boost",
          region: "slagtown",
          kinds: ["raid", "not-a-kind", "bounty"],
          weight: 4,
          reason: "dense-settle",
          copyKey: "scarred-sector",
        },
        { op: "nope", region: "slagtown", reason: "bad" },
        { op: "cool", region: "veyra", reason: "colder-intel" },
      ],
    } as never,
  });
  assert.equal(event.heatDelta, 3);
  assert.ok(event.worldConsequence);
  assert.equal(event.worldConsequence!.offerMutations!.length, 2);
  assert.deepEqual(event.worldConsequence!.offerMutations![0]!.kinds, ["raid", "bounty"]);
  assert.equal(event.worldConsequence!.offerMutations![0]!.copyKey, "scarred-sector");
  assert.equal(event.worldConsequence!.offerMutations![1]!.op, "cool");
  assert.equal(isScarWorthy("MissionSettled", "raid", 3), true);
  assert.equal(isScarWorthy("MissionSettled", "scout", 1), false);
  assert.equal(isScarWorthy("BossCleared", "boss", 8), true);
});

test("parseWorldConsequence / extractWorldConsequence locked shape", () => {
  assert.equal(parseWorldConsequence(null), null);
  assert.equal(parseWorldConsequence({ heatDelta: 5 }), null);
  const bag = parseWorldConsequence({
    offerMutations: [{ op: "unlock", region: "blackspire", reason: "boss-path", kinds: ["boss"] }],
  });
  assert.equal(bag?.offerMutations?.[0]?.op, "unlock");
  assert.deepEqual(
    extractWorldConsequence({
      worldConsequence: {
        offerMutations: [{ op: "boost", region: "ironclad", reason: "vault" }],
      },
    })?.offerMutations?.[0]?.region,
    "ironclad",
  );
  assert.equal(parseOfferMutations([{ op: "boost", region: "nope", reason: "x" }]).length, 0);
});
