/** Live-rule queries. Tyrone quotes these; he never invents DCs or matrix copy. */
import { bossBlockReason, roomUpgradeQuote, upgradeBlockReason } from "./campaign-balance";
import { BASE_ROOMS, locById } from "./data";
import { BAND_LABEL, computeStats, missionDc } from "./engine";
import { locationToRegion } from "./field-ops";
import type { GameState, LocationId, MissionKind, RoomId, StatKey } from "./types";

export function currentBeat(state: GameState) {
  const m = state.mission;
  if (!m) return null;
  const beat = m.beats[m.beatIndex];
  if (!beat) return null;
  const lead = m.partyIds.map((id) => state.operatives.find((o) => o.id === id)).find(Boolean);
  const stats = lead ? computeStats(lead) : null;
  const mod = stats ? Math.floor((stats[beat.stat] - 5) / 2) : 0;
  return {
    title: beat.title,
    stat: beat.stat as StatKey,
    dc: beat.dc,
    kind: m.kind,
    locationId: m.locationId,
    location: locById(m.locationId).name,
    lead: lead?.name ?? "the lead",
    cls: lead?.cls,
    mod,
    last: m.lastRoll ?? null,
  };
}

export function quoteMissionDc(
  state: GameState,
  loc: LocationId,
  kind: MissionKind,
) {
  return missionDc(state, loc, kind);
}

export function describeBand(raw: number) {
  if (raw <= 1) return BAND_LABEL.fumble;
  if (raw <= 4) return BAND_LABEL.fail;
  if (raw <= 9) return BAND_LABEL.weak;
  if (raw <= 14) return BAND_LABEL.success;
  if (raw <= 19) return BAND_LABEL.strong;
  return BAND_LABEL.crit;
}

export function raidGate(state: GameState, loc: LocationId, partyIds: string[]) {
  return bossBlockReason(state, loc, partyIds);
}

export function roomGate(state: GameState, room: RoomId) {
  const quote = roomUpgradeQuote(state, room);
  if (!quote) return `${BASE_ROOMS[room].name} is already at peak.`;
  return upgradeBlockReason(state, quote);
}

export function dcPhrase(state: GameState, dc: number, stat: StatKey) {
  if (!state.tyrone.settings.showNumbers) {
    const tone = dc <= 10 ? "a moderate" : dc <= 14 ? "an ugly" : "a mean";
    return `${tone} ${stat} check`;
  }
  return `DC ${dc} ${stat}`;
}

export function defaultPartyIds(state: GameState) {
  if (state.lastParty?.length) return state.lastParty;
  return state.operatives.filter((o) => o.status === "idle" && o.location === "hq").slice(0, 3).map((o) => o.id);
}

export function scoutBeforeRaid(state: GameState) {
  const loc = (state.selectedLoc ?? "ironclad") as LocationId;
  const intel = state.locations[loc]?.intel ?? 0;
  const region = locationToRegion(loc);
  return { loc, intel, region, name: locById(loc).name };
}
