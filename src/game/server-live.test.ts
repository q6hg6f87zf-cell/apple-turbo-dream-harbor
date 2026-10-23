import assert from "node:assert/strict";
import test from "node:test";
import {
  formatSseData,
  parseLiveBeat,
  revisionIsNewer,
  type LiveRevisionWatermark,
} from "./server-live.ts";

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
