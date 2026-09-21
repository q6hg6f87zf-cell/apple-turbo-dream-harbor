import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultState } from "./engine.ts";
import { eventBriefing, KIND_LABEL, parseEventLine, rollLines } from "./event-theater.ts";
import { canTakeArcTurn, registerMember, ridersOnDuty } from "./squad.ts";
import { setLiveDiscordIds } from "./presence.ts";

test("every job has a label and a briefing", () => {
  const s = defaultState();
  s.playerName = "Brent";
  s.operatives = [{ id: "op-1", name: "Brent", cls: "Warrior", hp: 10, maxHp: 10, status: "idle" } as never];
  for (const kind of Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]) {
    const brief = eventBriefing(s, "ironclad", kind, ["op-1"]);
    assert.ok(brief.briefing.length > 12, kind);
    assert.ok(brief.open.some((line) => line.startsWith("Tyrone · ")), kind);
    assert.ok(brief.open.some((line) => line.startsWith("SYNAPSE · ")), kind);
  }
});

test("roll lines keep a speaker so the log can paint them", () => {
  const lines = rollLines({
    lead: "Brent",
    title: "Breach",
    band: "Strong Hit",
    hit: true,
    strong: true,
    kind: "raid",
    beatKind: "check",
    dc: 12,
    total: 16,
  });
  assert.ok(lines[0].includes("Brent"));
  const parsed = parseEventLine("Tyrone · Keep the visor down.");
  assert.equal(parsed.speaker, "Tyrone");
  assert.equal(parsed.text, "Keep the visor down.");
});

test("a solo rider is never stalled by a ghost chair", () => {
  const s = defaultState();
  s.playerName = "Brent";
  registerMember(s, "Brent", "brontosaurus", "123456789012345678");
  s.activeMemberId = s.squad[0].id;
  s.arc = { chapter: 1, turn: 1, turnMemberId: "someone-else", log: [] };
  setLiveDiscordIds([]);
  assert.equal(canTakeArcTurn(s, "ironclad", "raid"), true);
  assert.equal(ridersOnDuty(s).length, 1);
});

test("two live porch riders rotate loud jobs", () => {
  const s = defaultState();
  registerMember(s, "Brent", "brontosaurus", "123456789012345678");
  registerMember(s, "Mara", "mara", "223456789012345678");
  setLiveDiscordIds(["123456789012345678", "223456789012345678"]);
  s.activeMemberId = s.squad[0].id;
  s.arc = { chapter: 1, turn: 1, turnMemberId: s.squad[1].id, log: [] };
  assert.equal(canTakeArcTurn(s, "ironclad", "raid"), false);
  assert.equal(canTakeArcTurn(s, "ironclad", "scout"), true);
  s.activeMemberId = s.squad[1].id;
  assert.equal(canTakeArcTurn(s, "ironclad", "raid"), true);
  setLiveDiscordIds(["123456789012345678"]);
  s.activeMemberId = s.squad[0].id;
  assert.equal(canTakeArcTurn(s, "ironclad", "raid"), true);
});
