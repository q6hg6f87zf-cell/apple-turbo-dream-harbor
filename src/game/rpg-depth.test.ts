import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { defaultState } from "./engine.ts";
import { emptyNarrative, hasFlag, setFlag } from "./narrative-state.ts";
import { availableScenarios, resolveScenarioApproach } from "./scenario.ts";
import { applyEnding, endingEligible, pickEndingId } from "./endings.ts";
import { radioBulletinFor } from "./radio-world.ts";
import { advanceTalk } from "./talk.ts";

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
