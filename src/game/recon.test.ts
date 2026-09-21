import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { defaultState, forgeOperative } from "./engine";
import { emptyShift } from "./shift";
import {
  DEPTH_LABELS,
  liveLeads,
  openReport,
  regionMastery,
  spendLead,
  sweepSite,
  sweepsToday,
  threadFor,
  threadStage,
} from "./recon";
import type { GameState } from "./types";

function started(): GameState {
  const s = defaultState();
  s.started = true;
  s.day = 1;
  s.shift = emptyShift(1);
  s.operatives = [
    forgeOperative({ name: "Ash", cls: "Warrior", race: "Human", lineage: "", origin: "Ironclad", day: 1 }),
  ];
  return s;
}

describe("working a site", () => {
  it("files a report with somewhere to go next, every time", () => {
    const s = started();
    const report = sweepSite(s, "ironclad", "ironclad-highway");
    assert.equal(report.poiId, "ironclad-highway");
    // The footer counts the clock the player is looking at, not the one they
    // arrived with: the watch is spent before the steps are written.
    const callTheDay = report.steps.find((step) => step.id === "rest");
    assert.ok(callTheDay);
    assert.match(callTheDay.hint, new RegExp(`\\b${s.shift.watchesLeft}\\b`));
    assert.ok(report.findings.length >= 2, "a report with no findings is the old toast");
    assert.ok(report.steps.length >= 2, "a report must always offer a verb");
    assert.ok(report.tyrone.length > 20);
    assert.ok(report.hollow.length > 20);
    assert.equal(openReport(s)?.id, report.id, "the report opens on the screen");
  });

  it("spends exactly one watch and pays caps for it", () => {
    const s = started();
    const before = s.coins;
    const left = s.shift.watchesLeft;
    const report = sweepSite(s, "ironclad", "ironclad-highway");
    assert.equal(s.shift.watchesLeft, left - 1);
    assert.equal(report.watchSpent, 1);
    assert.equal(s.coins, before + report.caps);
    assert.ok(report.caps > 0);
  });

  // The old rule was a flat refusal on a second visit, which is where a day
  // with nothing left to touch dead-ended. A second sweep is allowed now and
  // simply worth less.
  it("allows a second sweep at a lower rate instead of refusing", () => {
    const s = started();
    const first = sweepSite(s, "ironclad", "ironclad-highway");
    assert.equal(sweepsToday(s, "ironclad-highway"), 1);
    const second = sweepSite(s, "ironclad", "ironclad-highway");
    assert.equal(second.sweep, 2);
    assert.equal(second.blocked, undefined);
    assert.ok(second.caps < first.caps, "a second pass must pay less than the first");
    assert.equal(sweepsToday(s, "ironclad-highway"), 2);
  });

  it("turns a spent shift into a report with Rest on it, not a dead end", () => {
    const s = started();
    s.shift.watchesLeft = 0;
    const report = sweepSite(s, "ironclad", "ironclad-highway");
    assert.equal(report.blocked, true);
    assert.equal(report.caps, 0);
    assert.equal(report.watchSpent, 0);
    assert.ok(report.steps.some((step) => step.id === "rest" && step.primary), "Rest must be the way out");
  });

  it("deepens site knowledge and reports the tier by name", () => {
    const s = started();
    for (let day = 1; day <= 8; day++) {
      s.day = day;
      s.shift = emptyShift(day);
      sweepSite(s, "ironclad", "ironclad-highway");
    }
    const track = s.recon?.sites["ironclad-highway"];
    assert.ok(track);
    assert.ok(track.depth >= 2, `depth stalled at ${track.depth}`);
    assert.ok(DEPTH_LABELS.includes(DEPTH_LABELS[track.depth]));
  });

  it("opens ground: sweeping marks sites the player has not seen", () => {
    const s = started();
    const before = regionMastery(s, "ironclad").known;
    for (let day = 1; day <= 6; day++) {
      s.day = day;
      s.shift = emptyShift(day);
      sweepSite(s, "ironclad", "ironclad-highway");
    }
    assert.ok(regionMastery(s, "ironclad").known > before, "no new pins after six sweeps");
  });
});

describe("leads", () => {
  it("names follow-up jobs, and they expire", () => {
    const s = started();
    for (let day = 1; day <= 10 && !liveLeads(s).length; day++) {
      s.day = day;
      s.shift = emptyShift(day);
      sweepSite(s, "ironclad", "ironclad-tower");
    }
    const leads = liveLeads(s);
    assert.ok(leads.length, "ten tower climbs produced no lead at all");
    const lead = leads[0]!;
    assert.equal(lead.locationId, "ironclad");
    assert.ok(lead.capsBonus > 0);
    assert.ok(lead.title.length > 8 && lead.detail.length > 30);

    s.day = lead.expiresDay + 1;
    assert.equal(liveLeads(s).length, 0, "an expired lead is still on the board");
  });

  it("a spent lead cannot be run twice", () => {
    const s = started();
    for (let day = 1; day <= 10 && !liveLeads(s).length; day++) {
      s.day = day;
      s.shift = emptyShift(day);
      sweepSite(s, "ironclad", "ironclad-tower");
    }
    const lead = liveLeads(s)[0];
    assert.ok(lead);
    spendLead(s, lead.id);
    assert.equal(liveLeads(s).some((l) => l.id === lead.id), false);
  });
});

describe("region story threads", () => {
  it("every region has a thread with real stages", () => {
    (["ironclad", "slagtown", "blackspire", "brasswater", "veyra"] as const).forEach((region) => {
      const thread = threadFor(region);
      assert.ok(thread, `${region} has no thread`);
      assert.equal(thread.stages.length, 5);
      thread.stages.forEach((line) => assert.ok(line.length > 40, `thin stage line in ${region}`));
    });
  });

  it("advances on intel rather than on the calendar", () => {
    const s = started();
    assert.equal(threadStage(s, "ironclad"), 0);
    s.locations.ironclad.intel = 30;
    for (let day = 1; day <= 6; day++) {
      s.day = day;
      s.shift = emptyShift(day);
      sweepSite(s, "ironclad", "ironclad-tower");
    }
    assert.ok(threadStage(s, "ironclad") > 0, "piles of intel never moved the story");
  });
});
