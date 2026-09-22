import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { defaultState } from "./engine.ts";
import { bumpFaction, emptyNarrative, hasFlag, setFlag } from "./narrative-state.ts";
import { availableScenarios, resolveScenarioApproach, scenarioAtPoi } from "./scenario.ts";
import { applyEnding, endingEligible, pickEndingId } from "./endings.ts";
import { radioBulletinFor } from "./radio-world.ts";
import { advanceTalk } from "./talk.ts";
import { discoverNextPoi, discoverPoi, poisForLocation } from "./field-ops.ts";
import { worldHudModel } from "./shell.ts";
import { answerTyroneQuestion } from "./tyrone-voice.ts";
import { spawnScenarioCombat } from "./engine.ts";
import { pickCastScript } from "./cast-presence.ts";

describe("authored scenarios pass 2", () => {
  it("opens Travis bay when the file is cut", () => {
    const s = defaultState();
    s.started = true;
    s.day = 3;
    s.narrative = emptyNarrative();
    s.narrative.act = "act_i";
    setFlag(s, "file_cut", true);
    s.operatives = [{ id: "op1", name: "Ash", status: "idle" } as never];
    assert.ok(availableScenarios(s).some((x) => x.id === "travis_bay"));
  });

  it("opens Halo Yard under heat after Vesper is named", () => {
    const s = defaultState();
    s.started = true;
    s.day = 6;
    s.kaneHeat = 10;
    s.narrative = emptyNarrative();
    s.narrative.act = "act_ii";
    setFlag(s, "vesper_named", true);
    assert.ok(availableScenarios(s).some((x) => x.id === "halo_yard"));
  });

  it("resolves the Vesper invoice sell path into Kane allegiance pressure", () => {
    const s = defaultState();
    s.started = true;
    s.day = 7;
    s.narrative = emptyNarrative();
    s.narrative.act = "act_ii";
    setFlag(s, "vesper_named", true);
    setFlag(s, "gate_watched", true);
    s.locations.ironclad.intel = 6;
    resolveScenarioApproach(s, "vesper_invoice", "sell_page");
    assert.ok(hasFlag(s, "invoice_sold"));
    assert.ok(s.narrative!.factions.kane > 0);
  });
});

describe("radio world bulletins", () => {
  it("reads ICR copy from active flags", () => {
    const s = defaultState();
    s.narrative = emptyNarrative();
    setFlag(s, "invoice_copied", true);
    const line = radioBulletinFor(s);
    assert.ok(line);
    assert.match(line!, /Vesper|ICR|serial/i);
  });
});

describe("endings", () => {
  it("does not epilogue a fresh file", () => {
    const s = defaultState();
    s.started = true;
    s.day = 2;
    s.narrative = emptyNarrative();
    assert.equal(endingEligible(s), false);
  });

  it("picks Kane collaborator after selling the invoice", () => {
    const s = defaultState();
    s.started = true;
    s.day = 10;
    s.kaneHeat = 16;
    s.narrative = emptyNarrative();
    s.narrative.act = "act_iii";
    setFlag(s, "lyra_ridge_handled", true);
    setFlag(s, "caravan_investigated", true);
    setFlag(s, "halo_reported", true);
    setFlag(s, "invoice_sold", true);
    assert.equal(pickEndingId(s), "kane_collaborator");
    const ending = applyEnding(s);
    assert.ok(ending);
    assert.equal(s.narrative!.endingId, "kane_collaborator");
    assert.ok(hasFlag(s, "ending_ready"));
    assert.ok(s.narrative!.journal.some((j) => j.act === "ending"));
  });
});

describe("resume lands World", () => {
  it("sends a forged rider to map after resume talk", () => {
    const s = defaultState();
    s.started = true;
    s.tutorial = "done";
    s.day = 2;
    s.operatives = [{ id: "op1", name: "Ash", status: "idle" } as never];
    s.talk = { script: "resume", i: 0 };
    // Drain resume lines
    let guard = 0;
    while (s.talk?.script === "resume" && guard++ < 40) advanceTalk(s);
    assert.equal(s.screen, "map");
  });
});

describe("oblivion depth hardenings", () => {
  it("surfaces open situations on the World HUD model", () => {
    const s = defaultState();
    s.started = true;
    s.day = 3;
    s.narrative = emptyNarrative();
    s.narrative.act = "act_i";
    setFlag(s, "file_cut", true);
    s.operatives = [{ id: "op1", name: "Ash", status: "idle" } as never];
    const hud = worldHudModel(s);
    assert.ok(hud.situation);
    assert.equal(hud.situation!.id, "travis_bay");
  });

  it("lets Tyrone answer story questions about Vesper and situations", () => {
    const s = defaultState();
    s.started = true;
    s.day = 4;
    s.narrative = emptyNarrative();
    s.narrative.act = "act_i";
    setFlag(s, "vesper_named", true);
    setFlag(s, "file_cut", true);
    s.operatives = [{ id: "op1", name: "Ash", status: "idle" } as never];
    assert.match(answerTyroneQuestion(s, "What is Project Vesper?"), /Vesper|invoice|Kane/i);
    assert.match(answerTyroneQuestion(s, "What's open?"), /Travis|situation|bay|jig/i);
    assert.match(answerTyroneQuestion(s, "How is our standing?"), /Ironclad|Kane|AEGIS/i);
  });

  it("writes a journal mark when a POI is newly discovered", () => {
    const s = defaultState();
    s.started = true;
    s.narrative = emptyNarrative();
    s.locations.ironclad.discoveredPois = [];
    const hidden = poisForLocation("ironclad").find((p) => !p.discovered && p.kind !== "boss");
    assert.ok(hidden, "expected at least one undiscovered Ironclad POI in canon");
    discoverPoi(s, "ironclad", hidden!.id);
    assert.ok(s.narrative!.journal.some((j) => j.tags.includes("discovery")));
    assert.ok(s.narrative!.discoveries.some((d) => d.includes(hidden!.id)));
    // Second call is idempotent — no duplicate journal noise.
    const before = s.narrative!.journal.length;
    discoverPoi(s, "ironclad", hidden!.id);
    assert.equal(s.narrative!.journal.length, before);
    // discoverNextPoi path also journals when it finds something new.
    const found = discoverNextPoi(s, "ironclad");
    if (found) {
      assert.ok(s.narrative!.journal.some((j) => j.title.includes(found.name)));
    }
  });

  it("whispers faction standing into the journal on threshold crosses", () => {
    const s = defaultState();
    s.narrative = emptyNarrative();
    s.narrative.factions.kane = 0;
    bumpFaction(s, "kane", 7);
    assert.ok(s.narrative!.journal.some((j) => j.id === "fac-kane-6"));
    bumpFaction(s, "kane", -20);
    assert.ok(s.narrative!.journal.some((j) => j.id === "fac-kane--6"));
  });
});

describe("immersion depth pass", () => {
  it("anchors Travis bay to the shop pin", () => {
    const s = defaultState();
    s.started = true;
    s.day = 3;
    s.narrative = emptyNarrative();
    s.narrative.act = "act_i";
    setFlag(s, "file_cut", true);
    s.operatives = [{ id: "op1", name: "Ash", status: "idle" } as never];
    const sit = scenarioAtPoi(s, "ironclad", "ironclad-shop");
    assert.ok(sit);
    assert.equal(sit!.id, "travis_bay");
  });

  it("spawns combat from a combat-outcome approach", () => {
    const s = defaultState();
    s.started = true;
    s.day = 6;
    s.kaneHeat = 10;
    s.narrative = emptyNarrative();
    s.narrative.act = "act_ii";
    setFlag(s, "vesper_named", true);
    s.operatives = [
      {
        id: "op1",
        name: "Ash",
        status: "idle",
        location: "hq",
        hp: 20,
        maxHp: 20,
        battles: 0,
        cls: "Warrior",
        statDice: { STR: 14, SPD: 10, INT: 10, WIS: 10, CHA: 10, LCK: 10 },
      } as never,
    ];
    const result = resolveScenarioApproach(s, "halo_yard", "kick_the_nest", { forceRoll: 20 });
    assert.ok(result?.spawnCombat);
    spawnScenarioCombat(s, "halo_yard");
    assert.ok(s.combat);
    assert.ok(s.combat!.enemies.length >= 1);
  });

  it("chains caravan tracks into culvert follow-up toast", () => {
    const s = defaultState();
    s.started = true;
    s.day = 5;
    s.narrative = emptyNarrative();
    s.narrative.act = "act_ii";
    setFlag(s, "vesper_named", true);
    s.kaneHeat = 6;
    s.operatives = [
      {
        id: "op1",
        name: "Ash",
        status: "idle",
        location: "hq",
        hp: 20,
        maxHp: 20,
        battles: 0,
        cls: "Ranger",
        statDice: { STR: 10, SPD: 12, INT: 10, WIS: 14, CHA: 10, LCK: 10 },
      } as never,
    ];
    const result = resolveScenarioApproach(s, "caravan_missing", "tracks", { forceRoll: 20 });
    assert.equal(result?.followUpId, "caravan_culvert");
    assert.match(result!.toast, /Culvert/i);
    assert.ok(availableScenarios(s).some((x) => x.id === "caravan_culvert"));
  });

  it("queues ending talk when an epilogue applies", () => {
    const s = defaultState();
    s.started = true;
    s.day = 10;
    s.kaneHeat = 16;
    s.narrative = emptyNarrative();
    s.narrative.act = "act_iii";
    setFlag(s, "lyra_ridge_handled", true);
    setFlag(s, "caravan_investigated", true);
    setFlag(s, "halo_reported", true);
    setFlag(s, "invoice_sold", true);
    const ending = applyEnding(s);
    assert.ok(ending);
    assert.equal(s.talk?.script, "ending");
  });

  it("picks reactive Travis presence from flags", () => {
    const s = defaultState();
    s.narrative = emptyNarrative();
    setFlag(s, "travis_jig_filled", true);
    assert.equal(pickCastScript(s, "travis"), "travis_filled");
  });

  it("exposes ICR bulletin on the World HUD", () => {
    const s = defaultState();
    s.narrative = emptyNarrative();
    setFlag(s, "invoice_copied", true);
    const hud = worldHudModel(s);
    assert.ok(hud.bulletin);
    assert.match(hud.bulletin!, /ICR|Vesper|serial/i);
  });
});
