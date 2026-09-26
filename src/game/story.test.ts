import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CAST, aegisOnDuty, knownCast } from "./cast.ts";
import { defaultState } from "./engine.ts";
import { defaultPoi, knownPois } from "./field-ops.ts";
import { generateBoard } from "./shift.ts";
import { TALK, skipTalk, advanceTalk } from "./talk.ts";
import { eventBriefing } from "./event-theater.ts";
import { pickFieldSite, siteCopyFor, sortieJob, dawnDispatch } from "./story.ts";
import { rarityCap, rarityFromRoll, rollLoot, weaponsAllowed } from "./loot.ts";

describe("campaign cast", () => {
  it("names Kane and the AEGIS wing", () => {
    assert.equal(CAST.kane.name, "Dr. Vesper Kane");
    assert.equal(CAST.vera.callsign, "VERA-3");
    assert.equal(CAST.orion.visor, "violet");
    assert.equal(CAST.vera.visor, "amber");
    assert.equal(CAST.drake.visor, "crimson");
    assert.equal(CAST.lyra.visor, "white");
    assert.ok(CAST.kane.dossier.includes("Project Vesper"));
  });

  it("sends Lyra first and Orion when Kane is hunting", () => {
    assert.equal(aegisOnDuty(1, 0).id, "lyra");
    assert.equal(aegisOnDuty(2, 0).id, "vera");
    assert.equal(aegisOnDuty(4, 12).id, "drake");
    assert.equal(aegisOnDuty(4, 18).id, "orion");
  });

  it("day one walks the highway, not a crate count", () => {
    const s = defaultState();
    s.day = 1;
    s.locations.ironclad.unlocked = true;
    const { poi } = pickFieldSite(s);
    assert.equal(poi.id, "ironclad-highway");
    const copy = siteCopyFor(poi, "scout");
    assert.match(copy.title, /No Tracks/);
    assert.match(copy.brief, /Kane|Tyrone/);
    const job = sortieJob(s);
    assert.equal(job.poiId, "ironclad-highway");
    assert.match(job.brief, /tracks|Tyrone|highway/i);
    assert.match(dawnDispatch(s), /East Highway|No tracks/);
    assert.equal(s.selectedPoiId, "ironclad-highway");
  });

  it("follows the chit to the Rail Cut once the highway is walked", () => {
    const s = defaultState();
    s.day = 2;
    s.locations.ironclad.unlocked = true;
    s.narrative = { ...(s.narrative ?? { act: "act_i", beats: {}, flags: {}, journal: [], endingId: null, promises: [] }), flags: { highway_walked: true } } as never;
    const { poi } = pickFieldSite(s);
    assert.equal(poi.id, "ironclad-rail");
    const copy = siteCopyFor(poi, "scout");
    assert.match(copy.title, /Invoice/);
    assert.match(copy.brief, /Rail Cut/);
    assert.match(copy.brief, /black-tag|T-0880/);
  });

  it("does not post a cabinet job on the vault board", () => {
    const s = defaultState();
    s.day = 1;
    s.locations.ironclad.unlocked = true;
    const shift = generateBoard(s);
    assert.equal(shift.board.some((t) => t.kind === "cabinet"), false);
    assert.ok(shift.board.some((t) => t.kind === "sortie"));
    assert.equal(shift.board.filter((t) => t.required).length, 2);
    assert.equal(shift.board.some((t) => t.kind === "market"), false);
    assert.match(shift.board.find((t) => t.kind === "sortie")?.title ?? "", /No Tracks/);
  });

  it("posts Lyra on day one so Kane has a face", () => {
    const s = defaultState();
    s.day = 1;
    s.locations.ironclad.unlocked = true;
    const shift = generateBoard(s);
    const aegis = shift.board.find((t) => t.kind === "aegis");
    assert.ok(aegis);
    assert.equal(aegis!.npcId, "lyra");
    assert.match(aegis!.brief, /Lyra|white/i);
    assert.ok(knownCast(s).some((p) => p.id === "kane"));
  });

  it("introduces Kane by name before the first forge", () => {
    assert.ok(TALK.kane?.length);
    assert.equal(TALK.kane[0]?.castId, "kane");
    assert.ok(TALK.kane.every((line) => line.castId === "kane"));
    assert.match(TALK.kane.map((l) => l.text).join(" "), /T-0880|deliver tasks|super suits/i);
    assert.match(TALK.kane.map((l) => l.text).join(" "), /Orion-7|Vera-3|Lyra-4|Drake-6/);
    assert.ok(TALK.wing.some((line) => /Vera-3/.test(line.text)));
    assert.equal(CAST.vera.callsign, "VERA-3");
  });

  it("lands Kane on the opening tape, then the porch after Tyrone replies", () => {
    const s = defaultState();
    s.talk = { script: "wake", i: 0 };
    skipTalk(s);
    assert.equal(s.screen, "briefing");
    assert.equal(s.talk?.script, "kane");
    skipTalk(s);
    assert.equal(s.screen, "briefing");
    assert.equal(s.talk?.script, "tyrone-reply");
    skipTalk(s);
    assert.equal(s.screen, "hq");
    assert.equal(s.talk?.script, "welcome");
    while (s.talk) advanceTalk(s);
    assert.equal(s.screen, "hq");
    assert.equal(s.tutorial, "forge");
    assert.ok(knownCast(s).some((p) => p.id === "kane"));
    assert.ok(knownCast(s).some((p) => p.id === "tyrone"));
    assert.ok(knownCast(s).some((p) => p.id === "vera"));
    assert.deepEqual(
      knownCast(s).map((p) => p.id).slice(0, 6),
      ["tyrone", "kane", "lyra", "vera", "drake", "orion"],
    );
  });

  it("briefs a named site instead of a generic region", () => {
    const s = defaultState();
    s.playerName = "Rider";
    s.operatives = [{ id: "op-1", name: "Rider", cls: "Warrior", hp: 10, maxHp: 10, status: "idle" } as never];
    const brief = eventBriefing(s, "ironclad", "scout", ["op-1"], "ironclad-rail");
    assert.match(brief.briefing, /Rail Cut/);
    assert.match(brief.open.join(" "), /Rail Cut|rail steel|Kane/i);
  });

  it("pins Rail Cut on the map even without an explicit poi id", () => {
    const s = defaultState();
    s.day = 1;
    s.locations.ironclad.unlocked = true;
    s.playerName = "Rider";
    s.operatives = [
      {
        id: "op-1",
        name: "Rider",
        cls: "Warrior",
        hp: 10,
        maxHp: 10,
        status: "idle",
        inventory: [],
      } as never,
    ];
    s.shift = generateBoard(s);
    const poi = defaultPoi(s, "ironclad");
    assert.equal(poi?.id, "ironclad-highway");
    assert.ok(knownPois(s, "ironclad").some((p) => p.id === "ironclad-highway"));
    const brief = eventBriefing(s, "ironclad", "scout", ["op-1"]);
    assert.match(brief.briefing, /No Tracks|East Highway/);
    assert.doesNotMatch(brief.briefing, /Scout in Ironclad/);
  });

  it("keeps PEOPLE ordered TyroneBot, Kane, then AEGIS", () => {
    const s = defaultState();
    s.seenTalk = ["wake", "kane"];
    assert.deepEqual(
      knownCast(s).map((p) => p.id).slice(0, 6),
      ["tyrone", "kane", "lyra", "vera", "drake", "orion"],
    );
    assert.equal(CAST.tyrone.name, "TyroneBot");
    assert.match(TALK.kane.map((l) => l.text).join(" "), /never meant to hear|TyroneBot|stay retired/);
    assert.ok(knownCast(s).some((p) => p.id === "travis"));
    assert.ok(knownCast(s).some((p) => p.id === "holt"));
    assert.ok(knownCast(s).some((p) => p.id === "vex"));
    assert.ok(knownCast(s).some((p) => p.id === "rourke"));
    assert.ok(knownCast(s).some((p) => p.id === "gravenor"));
    assert.equal(CAST.travis.name, "Travis");
    assert.ok(CAST.holt.banner);
    assert.ok(CAST.vex.banner);
    assert.ok(CAST.kane.banner);
    assert.match(CAST.travis.dossier, /Mechanical Shop|T-0880/);
    assert.match(CAST.holt.dossier, /Moon Squad Market/);
    assert.match(CAST.rourke.dossier, /Relay Tower Three/);
  });
});

describe("loot economy", () => {
  it("caps early scout drops below legendary", () => {
    assert.equal(rarityCap("scout", 1), "Uncommon");
    assert.equal(rarityFromRoll(20, "Uncommon"), "Uncommon");
    assert.equal(weaponsAllowed("scout", 1, 20), false);
    const drops = rollLoot({ loc: "ironclad", kind: "scout", total: 20, day: 1, poiId: "ironclad-rail" });
    assert.ok(drops.length >= 1);
    assert.ok(drops.every((item) => item.rarity !== "Legendary" && item.rarity !== "Mythic"));
    assert.ok(drops.every((item) => item.kind !== "weapon"));
    assert.ok(drops.some((item) => /Rail Cut|weigh|spike|ribbon|Kane|Vesper/i.test(`${item.name} ${item.lore}`)));
  });
});
