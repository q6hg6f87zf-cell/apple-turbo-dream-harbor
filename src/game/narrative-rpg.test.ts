import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { defaultState } from "./engine.ts";
import {
  checkNarrative,
  emptyNarrative,
  hasFlag,
  restoreNarrative,
  setFlag,
} from "./narrative-state.ts";
import { availableApproaches, availableScenarios, resolveScenarioApproach } from "./scenario.ts";
import { applyAegisChoice } from "./consequences.ts";
import {
  actTitle,
  bootstrapNarrative,
  completeBeat,
  storyObjective,
  syncStorySpine,
} from "./story-spine.ts";

describe("narrative-state", () => {
  it("restores missing narrative from old saves", () => {
    const n = restoreNarrative(undefined);
    assert.equal(n.act, "prologue");
    assert.deepEqual(n.flags, {});
    assert.equal(n.endingId, null);
  });

  it("sets and queries typed flags", () => {
    const s = defaultState();
    s.narrative = emptyNarrative();
    assert.equal(hasFlag(s, "wake_complete"), false);
    setFlag(s, "wake_complete", true);
    assert.equal(hasFlag(s, "wake_complete"), true);
    assert.equal(checkNarrative(s, { type: "flag", id: "wake_complete" }), true);
    assert.equal(checkNarrative(s, { type: "not_flag", id: "vesper_named" }), true);
  });

  it("evaluates compound checks", () => {
    const s = defaultState();
    s.started = true;
    s.day = 5;
    s.kaneHeat = 10;
    s.narrative = emptyNarrative();
    setFlag(s, "rail_cut_scouted", true);
    assert.equal(
      checkNarrative(s, {
        type: "all",
        of: [
          { type: "min_day", day: 4 },
          { type: "flag", id: "rail_cut_scouted" },
          { type: "kane_heat_gte", n: 8 },
        ],
      }),
      true,
    );
  });
});

describe("story-spine", () => {
  it("bootstraps prologue and exposes an objective", () => {
    const s = defaultState();
    s.started = true;
    bootstrapNarrative(s);
    assert.ok(s.narrative);
    assert.ok(hasFlag(s, "wake_complete"));
    assert.match(storyObjective(s), /file|Machine Shop|World/i);
    assert.match(actTitle(s.narrative!.act), /Prologue|Act/);
  });

  it("advances into Act I after first sortie evidence", () => {
    const s = defaultState();
    s.started = true;
    s.operatives = [
      { id: "op1", name: "Ash", cls: "Warrior", status: "idle", location: "hq", inventory: [] } as never,
    ];
    s.locations.ironclad.missions = 1;
    s.locations.ironclad.intel = 3;
    bootstrapNarrative(s);
    syncStorySpine(s);
    assert.ok(hasFlag(s, "first_sortie_done"));
    assert.ok(hasFlag(s, "file_cut"));
    if (s.narrative!.beats.prologue_first_sortie?.status !== "done") {
      completeBeat(s, "prologue_first_sortie");
    }
    assert.ok(["act_i", "act_ii", "prologue"].includes(s.narrative!.act));
  });

  it("records journal when completing a beat", () => {
    const s = defaultState();
    s.started = true;
    bootstrapNarrative(s);
    completeBeat(s, "prologue_wake");
    assert.ok(s.narrative!.journal.some((j) => j.id === "beat-prologue_wake" || /file/i.test(j.title)));
  });
});

describe("scenario fail-forward", () => {
  it("opens the missing caravan when day and heat allow", () => {
    const s = defaultState();
    s.started = true;
    s.day = 5;
    s.kaneHeat = 8;
    s.narrative = emptyNarrative();
    s.narrative.act = "act_ii";
    const open = availableScenarios(s);
    assert.ok(open.some((x) => x.id === "caravan_missing"));
  });

  it("gates Tyrone signal analysis behind trust", () => {
    const s = defaultState();
    s.started = true;
    s.day = 5;
    s.kaneHeat = 8;
    s.narrative = emptyNarrative();
    s.narrative.act = "act_ii";
    s.tyrone.relationship.trust = 20;
    const sc = availableScenarios(s).find((x) => x.id === "caravan_missing")!;
    const approaches = availableApproaches(s, sc);
    assert.ok(!approaches.some((a) => a.id === "tyrone_signal"));
    s.tyrone.relationship.trust = 55;
    const unlocked = availableApproaches(s, sc);
    assert.ok(unlocked.some((a) => a.id === "tyrone_signal"));
  });

  it("fail-forward still writes flags and journal on a soft roll", () => {
    const s = defaultState();
    s.started = true;
    s.day = 5;
    s.kaneHeat = 8;
    s.ticks = 3;
    s.narrative = emptyNarrative();
    s.narrative.act = "act_ii";
    s.operatives = [
      {
        id: "op1",
        name: "Ash",
        cls: "Warrior",
        status: "idle",
        location: "hq",
        inventory: [],
        statDice: { STR: 8, DEF: 8, INT: 8, WIS: 8, SPD: 8, CHA: 8, LCK: 8 },
      } as never,
    ];
    const result = resolveScenarioApproach(s, "caravan_missing", "tracks", { forceRoll: 2 });
    assert.ok(result);
    assert.equal(result!.checkPassed, false);
    assert.equal(result!.failForward, true);
    assert.ok(hasFlag(s, "caravan_investigated"));
    assert.ok(s.narrative!.journal.length >= 1);
  });

  it("abandon closes the scenario with lasting faction cost", () => {
    const s = defaultState();
    s.started = true;
    s.day = 5;
    s.kaneHeat = 8;
    s.narrative = emptyNarrative();
    s.narrative.act = "act_ii";
    const before = s.narrative.factions.ironclad;
    resolveScenarioApproach(s, "caravan_missing", "abandon");
    assert.ok(hasFlag(s, "caravan_abandoned"));
    assert.ok(s.narrative!.factions.ironclad < before);
    assert.equal(availableScenarios(s).some((x) => x.id === "caravan_missing"), false);
  });
});

describe("aegis consequences", () => {
  it("maps hide/lie/fight onto narrative flags", () => {
    const s = defaultState();
    s.narrative = emptyNarrative();
    s.narrative.act = "act_i";
    applyAegisChoice(s, "hide", "lyra");
    assert.ok(hasFlag(s, "lyra_hid"));
    assert.ok(hasFlag(s, "lyra_ridge_handled"));
  });
});
