import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bossBlockReason, upgradeBlockReason, roomUpgradeQuote } from "./campaign-balance";
import { defaultState, forgeOperative, missionDc } from "./engine";
import { emptyTyrone, ingestTyrone, restoreTyrone, snapshotTyrone } from "./tyrone-mind";
import { quoteMissionDc, raidGate, dcPhrase, roomGate } from "./tyrone-rules";
import {
  answerTyroneQuestion,
  considerTyroneHint,
  speakTyrone,
  tyroneBlocked,
} from "./tyrone-voice";
import { queueTalk } from "./talk";
import type { GameState, Operative } from "./types";

function file(): GameState {
  const s = defaultState();
  s.started = true;
  s.screen = "hq";
  s.playerName = "Brent";
  s.tyrone = emptyTyrone();
  return s;
}

function rider(s: GameState, name: string, cls: Operative["cls"] = "Rogue"): Operative {
  const op = forgeOperative({
    name,
    cls,
    race: "Human",
    lineage: "",
    origin: "Ironclad",
    day: s.day,
    rolls: { rep: 10, trait: 10, skill: 10, shadow: 10, enchant: 10, destiny: 10 },
  });
  s.operatives = [op, ...s.operatives];
  return op;
}

function waitingMission(s: GameState, stat: "WIS" | "STR" = "WIS") {
  s.mission = {
    id: "m-test",
    locationId: "ironclad",
    kind: "scout",
    partyIds: s.operatives.slice(0, 1).map((o) => o.id),
    beats: [
      {
        id: "b1",
        title: "Approach",
        prompt: "Sweep the gate.",
        stat,
        dc: 11,
        kind: "check",
      },
    ],
    beatIndex: 0,
    coins: 0,
    ore: 0,
    loot: [],
    narrative: [],
    waiting: true,
  };
}

describe("Tyrone companion intelligence", () => {
  it("quotes missionDc from the live engine", () => {
    const s = file();
    s.rooms.watchtower = 1;
    assert.equal(quoteMissionDc(s, "ironclad", "scout"), missionDc(s, "ironclad", "scout"));
    assert.equal(quoteMissionDc(s, "ironclad", "raid"), missionDc(s, "ironclad", "raid"));
    assert.equal(quoteMissionDc(s, "veyra", "boss"), missionDc(s, "veyra", "boss"));
  });

  it("sources Raid Matrix and upgrade copy from campaign-balance", () => {
    const s = file();
    const party: string[] = [];
    assert.equal(raidGate(s, "ironclad", party), bossBlockReason(s, "ironclad", party));
    const quote = roomUpgradeQuote(s, "forge");
    assert.ok(quote);
    assert.equal(roomGate(s, "forge"), upgradeBlockReason(s, quote!));
    const line = raidGate(s, "ironclad", party) ?? "";
    assert.match(line, /Raid requires|Raid intel|Raid Matrix|No raid profile/);
    assert.doesNotMatch(line, /Engineering check|credits|Service Rifle/i);
  });

  it("does not invent shared history", () => {
    const s = file();
    const reply = answerTyroneQuestion(s, "Remember Mara from Blackspire Lower District?");
    assert.match(reply, /nothing in my records|don't remember/i);
    assert.doesNotMatch(reply, /Mara was with us|I forged Mara/i);
  });

  it("persists memories across save restore and does not leak on a fresh file", () => {
    const s = file();
    const before = snapshotTyrone(s);
    rider(s, "Rook Hale", "Rogue");
    ingestTyrone(s, before);
    assert.ok(s.tyrone.episodic.some((e) => /Rook Hale/.test(e.description)));
    const restored = restoreTyrone(JSON.parse(JSON.stringify(s.tyrone)));
    assert.ok(restored.episodic.some((e) => /Rook Hale/.test(e.description)));
    const fresh = defaultState();
    assert.equal(fresh.tyrone.episodic.length, 0);
    assert.equal(emptyTyrone().episodic.length, 0);
    assert.ok(!restoreTyrone(undefined).episodic.some((e) => /Rook Hale/.test(e.description)));
  });

  it("stays silent in combat, during a spinning die, and when assistance is off", () => {
    const s = file();
    s.combat = {
      locationId: "ironclad",
      missionKind: "raid",
      partyIds: [],
      enemies: [],
      turn: 0,
      actorIndex: 0,
      log: [],
      rewardMult: 1,
    };
    assert.equal(tyroneBlocked(s), "combat live");
    assert.equal(speakTyrone(s, { text: "Nope.", concept: "x", priority: 3, reason: "test" }), false);

    s.combat = null;
    waitingMission(s);
    s.mission!.waiting = false;
    assert.equal(tyroneBlocked(s), "die in the air");

    s.mission = null;
    s.tyrone.settings.assist = "off";
    const op = rider(s, "Mira Quill", "Healer");
    op.status = "downed";
    s.rooms.infirmary = 0;
    s.screen = "hq";
    considerTyroneHint(s, snapshotTyrone(s));
    assert.equal(s.talk?.script, undefined);
    assert.equal(s.tyrone.lastSilentReason, "assistance off");
  });

  it("escalates after the same beat fails three times", () => {
    const s = file();
    s.tyrone.settings.assist = "normal";
    const op = rider(s, "Rook Hale", "Rogue");
    waitingMission(s);
    s.mission!.partyIds = [op.id];
    const key = "ironclad:scout:WIS:Approach";
    s.tyrone.failedBeats[key] = 3;
    const before = snapshotTyrone(s);
    considerTyroneHint(s, before);
    assert.equal(s.talk?.script, "companion");
    assert.match(s.tyrone.utterance ?? "", /failed Approach|WIS haul|Perimeter Control/i);
  });

  it("respects the number toggle", () => {
    const s = file();
    s.tyrone.settings.showNumbers = true;
    assert.equal(dcPhrase(s, 11, "WIS"), "DC 11 WIS");
    s.tyrone.settings.showNumbers = false;
    assert.match(dcPhrase(s, 11, "WIS"), /WIS check/);
    assert.doesNotMatch(dcPhrase(s, 11, "WIS"), /DC 11/);
    waitingMission(s);
    const withNumbers = answerTyroneQuestion({ ...s, tyrone: { ...s.tyrone, settings: { assist: "normal", showNumbers: true } } }, "What do I roll?");
    const without = answerTyroneQuestion(s, "What do I roll?");
    assert.match(withNumbers, /DC 11/);
    assert.doesNotMatch(without, /DC 11/);
  });

  it("recalls a promise at the same site", () => {
    const s = file();
    s.screen = "map";
    s.selectedLoc = "kingdom";
    const held = answerTyroneQuestion(s, "We'll come back for her.");
    assert.match(held, /hold you to that/i);
    assert.equal(s.tyrone.promises.length, 1);
    const before = snapshotTyrone(s);
    before.loc = "ironclad";
    s.selectedLoc = "kingdom";
    considerTyroneHint(s, before);
    assert.match(s.tyrone.utterance ?? "", /come back/i);
  });

  it("can put companion talk on a waiting sortie without inventing a second overlay", () => {
    const s = file();
    rider(s, "Rook Hale");
    waitingMission(s);
    s.tyrone.utterance = "WIS check. Approach. DC 11 WIS.";
    queueTalk(s, "companion", true);
    assert.equal(s.talk?.script, "companion");
    queueTalk(s, "hq", true);
    assert.notEqual(s.talk?.script, "hq");
  });

  it("answers caps, SYNAPSE, and roster from live state", () => {
    const s = file();
    s.coins = 2340;
    s.ore = 2;
    s.moonFavor = 1;
    assert.match(answerTyroneQuestion(s, "How many caps do I have?"), /2,340 bottle caps/);
    assert.match(answerTyroneQuestion(s, "Who are you?"), /T-0880/);
    const op = rider(s, "Mira Quill", "Healer");
    assert.match(answerTyroneQuestion(s, "What happened to Mira?"), /Mira Quill/);
    op.status = "dead";
    assert.match(answerTyroneQuestion(s, "What happened to Mira?"), /closed file/);
    s.terminalDrained = true;
    assert.match(answerTyroneQuestion(s, "Remember the SYNAPSE box?"), /S\.Y\.N\.A\.P\.S\.E/);
  });
});
