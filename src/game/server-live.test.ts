import assert from "node:assert/strict";
import test from "node:test";
import {
  attachTheaterIdentity,
  formatSseData,
  parseLiveBeat,
  revisionIsNewer,
  softParseDomainEvent,
  type LiveRevisionWatermark,
} from "./server-live.ts";
import { applyLiveBeat, emptyWorldPulse } from "./world-pulse.ts";
import { regionIsScarred, selectAtlasHeat } from "./atlas-heat.ts";

test("hello beat carries campaign and member revisions", () => {
  const beat = parseLiveBeat({
    type: "hello",
    campaignRevision: 12,
    memberRevision: 4,
    at: "2026-10-23T08:00:00.000Z",
  });
  assert.ok(beat);
  assert.equal(beat.type, "hello");
  if (beat.type === "hello") {
    assert.equal(beat.campaignRevision, 12);
    assert.equal(beat.memberRevision, 4);
    assert.equal(beat.at, "2026-10-23T08:00:00.000Z");
  }
});

test("higher revision triggers refresh; equal or lower stays quiet", () => {
  const last: LiveRevisionWatermark = { campaignRevision: 10, memberRevision: 3 };
  assert.equal(revisionIsNewer({ campaignRevision: 11, memberRevision: 3 }, last), true);
  assert.equal(revisionIsNewer({ campaignRevision: 10, memberRevision: 4 }, last), true);
  assert.equal(revisionIsNewer({ campaignRevision: 10, memberRevision: 3 }, last), false);
  assert.equal(revisionIsNewer({ campaignRevision: 9, memberRevision: 2 }, last), false);
  assert.equal(revisionIsNewer({ campaignRevision: 1, memberRevision: 1 }, null), true);
});

test("revision beat accepts MissionSettled / TransferSettled eventType only from allowlist", () => {
  const settled = parseLiveBeat({
    type: "revision",
    campaignRevision: 11,
    memberRevision: 4,
    eventType: "MissionSettled",
  });
  assert.ok(settled && settled.type === "revision");
  if (settled?.type === "revision") assert.equal(settled.eventType, "MissionSettled");

  const transfer = parseLiveBeat({
    type: "revision",
    campaignRevision: 11,
    memberRevision: 5,
    eventType: "TransferSettled",
  });
  assert.ok(transfer && transfer.type === "revision");
  if (transfer?.type === "revision") assert.equal(transfer.eventType, "TransferSettled");

  const junk = parseLiveBeat({
    type: "revision",
    campaignRevision: 11,
    memberRevision: 5,
    eventType: "NotARealEvent",
  });
  assert.ok(junk && junk.type === "revision");
  if (junk?.type === "revision") assert.equal(junk.eventType, undefined);
});

test("revision beat soft-parses theater identity allowlists", () => {
  const beat = parseLiveBeat({
    type: "revision",
    campaignRevision: 20,
    memberRevision: 8,
    eventType: "MissionSettled",
    theater: "MissionSettled",
    region: "slagtown",
    kind: "raid",
    heatDelta: 3,
    intelDelta: 1,
    beatId: "intel_drop",
    eventId: "mission-settled:ticket-1",
    worldConsequence: {
      offerMutations: [
        { op: "boost", region: "slagtown", kinds: ["raid"], reason: "dense-settle", weight: 2 },
      ],
    },
  });
  assert.ok(beat && beat.type === "revision");
  if (beat?.type !== "revision") return;
  assert.equal(beat.theater, "MissionSettled");
  assert.equal(beat.region, "slagtown");
  assert.equal(beat.kind, "raid");
  assert.equal(beat.heatDelta, 3);
  assert.equal(beat.intelDelta, 1);
  assert.equal(beat.beatId, "intel_drop");
  assert.equal(beat.eventId, "mission-settled:ticket-1");
  assert.equal(beat.worldConsequence?.offerMutations?.length, 1);

  const junkRegion = parseLiveBeat({
    type: "revision",
    campaignRevision: 21,
    memberRevision: 8,
    eventType: "MissionSettled",
    region: "not-a-region",
    kind: "laser",
    beatId: "nope",
    theater: "NotATheater",
  });
  assert.ok(junkRegion && junkRegion.type === "revision");
  if (junkRegion?.type === "revision") {
    assert.equal(junkRegion.region, undefined);
    assert.equal(junkRegion.kind, undefined);
    assert.equal(junkRegion.beatId, undefined);
    assert.equal(junkRegion.theater, undefined);
  }
});

test("softParseDomainEvent + attachTheaterIdentity maps Vault payload columns", () => {
  const soft = softParseDomainEvent({
    event_id: "boss-cleared:t1",
    event_type: "BossCleared",
    region: "ironclad",
    theater: "BossCleared",
    kind: "boss",
    beat_id: "boss_clear",
    heat_delta: 8,
    intel_delta: "2",
    world_consequence: {
      offerMutations: [{ op: "unlock", region: "blackspire", kinds: ["boss"], reason: "boss-foreshadow" }],
    },
  });
  assert.equal(soft.eventType, "BossCleared");
  assert.equal(soft.region, "ironclad");
  assert.equal(soft.heatDelta, 8);
  assert.equal(soft.intelDelta, 2);
  assert.equal(soft.beatId, "boss_clear");

  const beat = attachTheaterIdentity(
    { type: "revision", campaignRevision: 9, memberRevision: 3 },
    soft,
  );
  assert.equal(beat.eventType, "BossCleared");
  assert.equal(beat.region, "ironclad");
  assert.equal(beat.kind, "boss");
  assert.equal(beat.eventId, "boss-cleared:t1");
});

test("SSE data frame is EventSource-compatible JSON", () => {
  const frame = formatSseData({
    type: "hello",
    campaignRevision: 1,
    memberRevision: 1,
    at: "t",
  });
  assert.ok(frame.startsWith("data: "));
  assert.equal(frame.slice(-2), "\n\n");
  const parsed = JSON.parse(frame.slice(6).trim());
  assert.equal(parsed.type, "hello");
});

test("double-connect does not mint — same hello watermark is not a refresh", () => {
  const watermark: LiveRevisionWatermark = { campaignRevision: 7, memberRevision: 2 };
  assert.equal(revisionIsNewer(watermark, watermark), false);
});

test("heartbeat carries revision watermark for Atlas parseLiveBeat", () => {
  const beat = parseLiveBeat({
    type: "heartbeat",
    campaignRevision: 7,
    memberRevision: 2,
    at: "2026-10-23T08:00:00.000Z",
  });
  assert.ok(beat && beat.type === "heartbeat");
  if (beat?.type === "heartbeat") {
    assert.equal(beat.campaignRevision, 7);
    assert.equal(beat.memberRevision, 2);
  }
});

test("wire theater identity alone (no extras) scars region via applyLiveBeat", () => {
  let pulse = emptyWorldPulse();
  pulse = applyLiveBeat(pulse, {
    type: "revision",
    campaignRevision: 14,
    memberRevision: 5,
    eventType: "MissionSettled",
    theater: "MissionSettled",
    region: "slagtown",
    kind: "raid",
    heatDelta: 3,
    intelDelta: 1,
    beatId: "intel_drop",
    eventId: "mission-settled:shared-1",
  });
  assert.equal(pulse.campaignRevision, 14);
  assert.equal(pulse.beats.length, 1);
  assert.equal(pulse.beats[0]?.region, "slagtown");
  assert.equal(pulse.beats[0]?.scarWorthy, true);
  const heat = selectAtlasHeat(pulse);
  assert.ok(heat.cells.slagtown.heat >= 3);
  assert.equal(regionIsScarred(heat.cells.slagtown), true);
});

test("eventType alone does not paint atlas (watermark only)", () => {
  let pulse = emptyWorldPulse();
  pulse = applyLiveBeat(pulse, {
    type: "revision",
    campaignRevision: 15,
    memberRevision: 6,
    eventType: "MissionSettled",
  });
  assert.equal(pulse.campaignRevision, 15);
  assert.equal(pulse.memberRevision, 6);
  assert.equal(pulse.beats.length, 0);
});
