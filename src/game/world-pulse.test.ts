import assert from "node:assert/strict";
import test from "node:test";
import { selectAtlasHeat, atlasHeatIntensity } from "./atlas-heat.ts";
import { dayBoardNeedsSpectacle, selectDayBoardPulse } from "./day-board-pulse.ts";
import { applyLiveBeat, applyTheaterEvent, emptyWorldPulse } from "./world-pulse.ts";

test("live revision MissionSettled bumps watermark and board strip", () => {
  let pulse = emptyWorldPulse();
  pulse = applyLiveBeat(pulse, { type: "hello", campaignRevision: 5, memberRevision: 1 });
  assert.equal(pulse.campaignRevision, 5);
  assert.equal(pulse.beats.length, 0);

  pulse = applyLiveBeat(
    pulse,
    { type: "revision", campaignRevision: 6, memberRevision: 2, eventType: "MissionSettled" },
    { region: "slagtown", kind: "raid" },
  );
  assert.equal(pulse.campaignRevision, 6);
  assert.equal(pulse.memberRevision, 2);
  assert.equal(pulse.beats.length, 1);
  assert.equal(pulse.beats[0]?.theater, "MissionSettled");
  assert.equal(pulse.beats[0]?.beatId, "intel_drop");
  assert.equal(pulse.beats[0]?.region, "slagtown");

  const strip = selectDayBoardPulse(pulse);
  assert.equal(strip.items.length, 1);
  assert.equal(strip.latestBeatId, "intel_drop");
  assert.equal(dayBoardNeedsSpectacle(strip), true);
  assert.match(strip.items[0]!.headline, /Intel spike · Slag Town/);
  assert.ok(strip.items[0]!.subline.length > 12);
  assert.match(strip.items[0]!.radio, /^Tyrone · /);
});

test("atlas heat accumulates from MissionSettled and BossCleared", () => {
  let pulse = emptyWorldPulse();
  pulse = applyTheaterEvent(pulse, {
    theater: "MissionSettled",
    eventId: "s1",
    region: "ironclad",
    kind: "scout",
    revision: { campaign: 1 },
  });
  pulse = applyTheaterEvent(pulse, {
    theater: "BossCleared",
    eventId: "b1",
    region: "ironclad",
    kind: "boss",
    revision: { campaign: 2 },
  });
  const heat = selectAtlasHeat(pulse);
  assert.ok(heat.cells.ironclad.heat >= 9);
  assert.equal(heat.hottest, "ironclad");
  assert.ok(atlasHeatIntensity(heat.cells.ironclad) > 0);
  assert.equal(heat.cells.veyra.heat, 0);
});

test("duplicate live eventId does not double heat", () => {
  let pulse = emptyWorldPulse();
  const beat = {
    type: "revision" as const,
    campaignRevision: 10,
    memberRevision: 3,
    eventType: "BossCleared",
  };
  pulse = applyLiveBeat(pulse, beat, { eventId: "same", region: "blackspire", kind: "boss" });
  pulse = applyLiveBeat(pulse, beat, { eventId: "same", region: "blackspire", kind: "boss" });
  assert.equal(pulse.beats.length, 1);
  const heat = selectAtlasHeat(pulse);
  assert.equal(heat.cells.blackspire.heat, 8);
});

test("heartbeat only advances watermark", () => {
  let pulse = applyLiveBeat(emptyWorldPulse(), {
    type: "heartbeat",
    campaignRevision: 4,
    memberRevision: 4,
  });
  assert.equal(pulse.beats.length, 0);
  assert.equal(pulse.campaignRevision, 4);
});
