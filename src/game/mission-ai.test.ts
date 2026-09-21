import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { advanceBeat, applyRollToBeat, buildMission, defaultState, forgeOperative } from "./engine";
import { complicationFor, objectiveFor, objectiveMet } from "./mission-ai";
import { liveLeads, sweepSite } from "./recon";
import { emptyShift } from "./shift";
import type { GameState, MissionKind } from "./types";

function started(): GameState {
  const s = defaultState();
  s.started = true;
  s.shift = emptyShift(1);
  s.operatives = [
    forgeOperative({ name: "Ash", cls: "Warrior", race: "Human", lineage: "", origin: "Ironclad", day: 1 }),
  ];
  return s;
}

const KINDS: MissionKind[] = ["scout", "forage", "raid", "trade", "bounty", "boss"];

describe("mission orders", () => {
  it("gives every job a reason to exist and a bonus for closing it", () => {
    const s = started();
    KINDS.forEach((kind) => {
      const obj = objectiveFor(s, "ironclad", kind, null, "ironclad-gate");
      assert.ok(obj.title.length > 6, `${kind} objective has no title`);
      assert.ok(obj.detail.length > 60, `${kind} objective is too thin to read`);
      assert.ok(obj.bonus > 0);
      assert.ok(obj.thread, `${kind} objective is not tied to the region story`);
    });
  });

  it("carries the objective and the beat's reasoning onto the mission", () => {
    const s = started();
    const m = buildMission(s, "ironclad", "scout", [s.operatives[0].id], { approach: "standard" });
    assert.ok(m.objective);
    assert.ok(m.narrative.some((line) => line.startsWith("Orders ·")));
    m.beats.forEach((b) => assert.ok(b.why && b.why.length > 20, `beat ${b.title} has no stated reason`));
  });

  it("a scout lead rewrites the mission it was found for", () => {
    const s = started();
    for (let day = 1; day <= 10 && !liveLeads(s).length; day++) {
      s.day = day;
      s.shift = emptyShift(day);
      sweepSite(s, "ironclad", "ironclad-tower");
    }
    const lead = liveLeads(s)[0];
    assert.ok(lead, "no lead to run");

    const plain = buildMission(s, "ironclad", lead.missionKind, [s.operatives[0].id], { approach: "standard" });
    const run = buildMission(s, "ironclad", lead.missionKind, [s.operatives[0].id], {
      approach: "standard",
      leadId: lead.id,
    });
    assert.equal(run.leadId, lead.id);
    assert.equal(run.leadTitle, lead.title);
    assert.equal(run.objective?.bonus, lead.capsBonus);
    assert.equal(run.poiId, lead.poiId);
    if (lead.dcMod < 0) {
      assert.ok(run.beats[0].dc < plain.beats[0].dc, "a lead should make the ground easier to work");
    }
    assert.ok(run.narrative.some((line) => line.startsWith("Lead ·")));
  });
});

describe("complications", () => {
  it("never fires on the last beat, so a run can always end", () => {
    const s = started();
    const m = buildMission(s, "ironclad", "scout", [s.operatives[0].id], { approach: "breach" });
    m.beatIndex = m.beats.length - 1;
    for (let i = 0; i < 200; i++) {
      const extra = complicationFor({
        state: s,
        mission: m,
        band: "fumble",
        hit: false,
        lead: s.operatives[0],
        heat: 30,
        hurt: true,
        remaining: 0,
      });
      assert.equal(extra, null);
    }
  });

  it("does not repeat one it has already fired inside a run", () => {
    const s = started();
    s.kaneHeat = 30;
    const m = buildMission(s, "ironclad", "raid", [s.operatives[0].id], { approach: "breach" });
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const extra = complicationFor({
        state: s,
        mission: m,
        band: "fumble",
        hit: false,
        lead: s.operatives[0],
        heat: 30,
        hurt: true,
        remaining: 2,
      });
      if (!extra) continue;
      assert.equal(seen.has(extra.title), false, `${extra.title} fired twice in one run`);
      seen.add(extra.title);
      m.fired = [...(m.fired ?? []), specIdFor(extra.title)];
    }
    assert.ok(seen.size > 1, "a hot breach never produced a second kind of complication");
  });

  it("an injected beat explains why it is there", () => {
    const s = started();
    s.kaneHeat = 30;
    const m = buildMission(s, "ironclad", "raid", [s.operatives[0].id], { approach: "breach" });
    let found = null;
    for (let i = 0; i < 400 && !found; i++) {
      found = complicationFor({
        state: s,
        mission: m,
        band: "fumble",
        hit: false,
        lead: s.operatives[0],
        heat: 30,
        hurt: true,
        remaining: 2,
      });
    }
    assert.ok(found);
    assert.equal(found.injected, true);
    assert.ok(found.why && found.why.length > 25);
    assert.ok(found.prompt.length > 60);
  });
});

describe("closing a job", () => {
  it("objective is met on a clean run and missed on a bad one", () => {
    assert.equal(objectiveMet({ hits: 3, misses: 0 } as never), true);
    assert.equal(objectiveMet({ hits: 4, misses: 2 } as never), true);
    assert.equal(objectiveMet({ hits: 1, misses: 3 } as never), false);
    assert.equal(objectiveMet({ hits: 0, misses: 0 } as never), false);
  });

  it("counts hits and misses as the run goes", () => {
    const s = started();
    s.mission = buildMission(s, "ironclad", "scout", [s.operatives[0].id], { approach: "standard" });
    applyRollToBeat(s, 20);
    assert.equal(s.mission?.hits, 1);
    advanceBeat(s);
    applyRollToBeat(s, 1);
    assert.equal(s.mission?.misses, 1);
  });
});

/** Mirrors the private spec ids in mission-ai so the test can mark one fired. */
function specIdFor(title: string): string {
  const map: Record<string, string> = {
    "AEGIS intercept": "aegis-intercept",
    "The Pack counts you": "pack-counter",
    "Cover is blown": "blown-cover",
    "Carry the wounded": "wounded-line",
    "A second cache": "second-cache",
    "Kane's surveyor": "kane-surveyor",
    "They answer the breach": "breach-answer",
  };
  return map[title] ?? title;
}
