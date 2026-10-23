import assert from "node:assert/strict";
import test from "node:test";
import {
  EVENT_TYPE_TO_CUE,
  cueIdForLiveEvent,
  liveEventTypesForCues,
} from "./live-cues.ts";

test("every LIVE_EVENT_TYPE maps to a cue id", () => {
  for (const eventType of liveEventTypesForCues()) {
    assert.ok(EVENT_TYPE_TO_CUE[eventType], `missing cue for ${eventType}`);
    assert.equal(cueIdForLiveEvent(eventType), EVENT_TYPE_TO_CUE[eventType]);
  }
});

test("MissionSettled resolves to mission.settled (first integrated settle SFX)", () => {
  assert.equal(cueIdForLiveEvent("MissionSettled"), "mission.settled");
});

test("unknown or junk eventType does not resolve a cue", () => {
  assert.equal(cueIdForLiveEvent("NotARealEvent"), undefined);
  assert.equal(cueIdForLiveEvent(""), undefined);
  assert.equal(cueIdForLiveEvent(null), undefined);
});
