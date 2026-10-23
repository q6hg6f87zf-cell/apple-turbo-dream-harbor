import assert from "node:assert/strict";
import test from "node:test";
import {
  ATLAS_BEAT_IDS,
  ATLAS_BEAT_ID_TO_CUE,
  EVENT_TYPE_TO_CUE,
  cueIdForAtlasBeat,
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

test("every Atlas beatId maps to a cue id", () => {
  for (const beatId of ATLAS_BEAT_IDS) {
    assert.ok(ATLAS_BEAT_ID_TO_CUE[beatId], `missing cue for ${beatId}`);
    assert.equal(cueIdForAtlasBeat(beatId), ATLAS_BEAT_ID_TO_CUE[beatId]);
  }
});

test("Forge VFX beatIds: vault_flash → vault.flash, intel_drop → intel.drop", () => {
  assert.equal(cueIdForAtlasBeat("vault_flash"), "vault.flash");
  assert.equal(cueIdForAtlasBeat("intel_drop"), "intel.drop");
  assert.equal(cueIdForAtlasBeat("boss_clear"), "boss.cleared");
  assert.equal(cueIdForAtlasBeat("raid_opened"), "raid.opened");
});

test("junk beatId does not resolve a cue", () => {
  assert.equal(cueIdForAtlasBeat("MissionSettled"), undefined);
  assert.equal(cueIdForAtlasBeat("not_a_beat"), undefined);
});
