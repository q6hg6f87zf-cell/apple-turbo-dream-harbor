import assert from "node:assert/strict";
import test from "node:test";
import { atlasScarIntensity, regionIsScarred, selectAtlasHeat, atlasHeatIntensity } from "./atlas-heat.ts";
import {
  dayBoardNeedsSpectacle,
  offerCopyKeyHook,
  selectDayBoardOfferGraph,
  selectDayBoardPulse,
} from "./day-board-pulse.ts";
import { applyLiveBeat, applyTheaterEvent, emptyWorldPulse } from "./world-pulse.ts";

test("live revision MissionSettled bumps watermark and board strip", () => {
  let pulse = emptyWorldPulse();
  pulse = applyLiveBeat(pulse, { type: "hello", campaignRevision: 5, memberRevision: 1 });
  assert.equal(pulse.campaignRevision, 5);
  assert.equal(pulse.beats.length, 0);

  pulse = applyLiveBeat(
    pulse,
    { type: "revision", campaignRevision: 6, memberRevision: 2, eventType: "MissionSettled" },
    { region: "slagtown", kind: "raid" },
  );
  assert.equal(pulse.campaignRevision, 6);
  assert.equal(pulse.memberRevision, 2);
  assert.equal(pulse.beats.length, 1);
  assert.equal(pulse.beats[0]?.theater, "MissionSettled");
  assert.equal(pulse.beats[0]?.beatId, "intel_drop");
  assert.equal(pulse.beats[0]?.region, "slagtown");
  assert.equal(pulse.beats[0]?.scarWorthy, true);

  const strip = selectDayBoardPulse(pulse);
  assert.equal(strip.items.length, 1);
  assert.equal(strip.latestBeatId, "intel_drop");
  assert.equal(dayBoardNeedsSpectacle(strip), true);
  assert.match(strip.items[0]!.headline, /Breach intel · Slag Town/);
  assert.ok(strip.items[0]!.subline.length > 12);
  assert.match(strip.items[0]!.radio, /^Tyrone · /);
});

test("atlas heat accumulates from MissionSettled and BossCleared", () => {
  let pulse = emptyWorldPulse();
  pulse = applyTheaterEvent(pulse, {
    theater: "MissionSettled",
    eventId: "s1",
    region: "ironclad",
    kind: "scout",
    revision: { campaign: 1 },
  });
  pulse = applyTheaterEvent(pulse, {
    theater: "BossCleared",
    eventId: "b1",
    region: "ironclad",
    kind: "boss",
    revision: { campaign: 2 },
  });
  const heat = selectAtlasHeat(pulse);
  assert.ok(heat.cells.ironclad.heat >= 9);
  assert.equal(heat.hottest, "ironclad");
  assert.ok(atlasHeatIntensity(heat.cells.ironclad) > 0);
  assert.equal(heat.cells.veyra.heat, 0);
});

test("duplicate live eventId does not double heat", () => {
  let pulse = emptyWorldPulse();
  const beat = {
    type: "revision" as const,
    campaignRevision: 10,
    memberRevision: 3,
    eventType: "BossCleared",
  };
  pulse = applyLiveBeat(pulse, beat, { eventId: "same", region: "blackspire", kind: "boss" });
  pulse = applyLiveBeat(pulse, beat, { eventId: "same", region: "blackspire", kind: "boss" });
  assert.equal(pulse.beats.length, 1);
  const heat = selectAtlasHeat(pulse);
  assert.equal(heat.cells.blackspire.heat, 8);
});

test("heartbeat only advances watermark", () => {
  let pulse = applyLiveBeat(emptyWorldPulse(), {
    type: "heartbeat",
    campaignRevision: 4,
    memberRevision: 4,
  });
  assert.equal(pulse.beats.length, 0);
  assert.equal(pulse.campaignRevision, 4);
});

test("BossCleared and dense MissionSettled leave lasting atlas scars", () => {
  let pulse = emptyWorldPulse();
  pulse = applyTheaterEvent(pulse, {
    theater: "MissionSettled",
    eventId: "scout-soft",
    region: "veyra",
    kind: "scout",
    heatDelta: 1,
    revision: { campaign: 1 },
  });
  pulse = applyTheaterEvent(pulse, {
    theater: "MissionSettled",
    eventId: "raid-dense",
    region: "slagtown",
    kind: "raid",
    heatDelta: 3,
    revision: { campaign: 2 },
  });
  pulse = applyTheaterEvent(pulse, {
    theater: "BossCleared",
    eventId: "boss-1",
    region: "ironclad",
    kind: "boss",
    heatDelta: 8,
    revision: { campaign: 3 },
  });

  const heat = selectAtlasHeat(pulse);
  assert.equal(regionIsScarred(heat.cells.veyra), false);
  assert.equal(regionIsScarred(heat.cells.slagtown), true);
  assert.equal(regionIsScarred(heat.cells.ironclad), true);
  assert.ok((heat.cells.ironclad.scar?.intensity ?? 0) >= 8);
  assert.ok(atlasScarIntensity(heat.cells.ironclad) > 0);
  assert.equal(heat.mostScarred, "ironclad");
  assert.ok(heat.totalScar >= 11);
});

test("day-board next-offer graph applies boost unlock cool mutations", () => {
  let pulse = emptyWorldPulse();
  pulse = applyTheaterEvent(pulse, {
    theater: "MissionSettled",
    eventId: "settle-offer",
    region: "slagtown",
    kind: "raid",
    heatDelta: 3,
    intelDelta: 1,
    beatId: "intel_drop",
    revision: { campaign: 11, member: 2 },
    worldConsequence: {
      offerMutations: [
        {
          op: "boost",
          region: "slagtown",
          kinds: ["raid", "bounty"],
          weight: 4,
          reason: "dense-settle",
          copyKey: "scar_sector",
        },
        { op: "unlock", region: "blackspire", kinds: ["boss"], reason: "boss-foreshadow", copyKey: "grateful_vault" },
        { op: "cool", region: "veyra", reason: "colder-intel", weight: 3, copyKey: "colder-intel" },
      ],
    },
  });

  assert.equal(pulse.beats[0]?.offerMutations.length, 3);
  const graph = selectDayBoardOfferGraph(pulse);
  assert.equal(graph.byRegion.slagtown.weight, 4);
  assert.deepEqual(graph.byRegion.slagtown.kinds, ["raid", "bounty"]);
  assert.equal(graph.byRegion.slagtown.copyKeys[0], "scar_sector");
  assert.equal(graph.byRegion.blackspire.unlocked, true);
  assert.ok(graph.pendingUnlocks.includes("blackspire"));
  assert.equal(graph.byRegion.veyra.cooled, true);
  assert.ok(graph.byRegion.veyra.weight < 0);
  assert.ok(graph.cooledRegions.includes("veyra"));
  assert.equal(graph.edges.length, 3);
  assert.equal(offerCopyKeyHook("  scar_sector  "), "scar_sector");
  assert.equal(offerCopyKeyHook(""), null);
});

test("wire revision with region paints shared scar without extras", () => {
  let pulse = emptyWorldPulse();
  pulse = applyLiveBeat(pulse, {
    type: "revision",
    campaignRevision: 30,
    memberRevision: 9,
    eventType: "BossCleared",
    theater: "BossCleared",
    region: "blackspire",
    kind: "boss",
    heatDelta: 8,
    intelDelta: 2,
    beatId: "boss_clear",
    eventId: "boss-cleared:wire-1",
  });
  assert.equal(pulse.beats.length, 1);
  assert.equal(pulse.beats[0]?.region, "blackspire");
  const heat = selectAtlasHeat(pulse);
  assert.equal(heat.cells.blackspire.heat, 8);
  assert.equal(regionIsScarred(heat.cells.blackspire), true);
});

test("revision eventType without region is watermark only", () => {
  let pulse = applyLiveBeat(emptyWorldPulse(), {
    type: "revision",
    campaignRevision: 31,
    memberRevision: 1,
    eventType: "MissionSettled",
  });
  assert.equal(pulse.beats.length, 0);
  assert.equal(pulse.campaignRevision, 31);
});
