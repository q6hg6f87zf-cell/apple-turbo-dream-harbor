import { SAVE_KEY, SAVE_VERSION, resolveLineage, resolveRaceName } from "./data";
import { applyFloor, readWho, saveKeyFor, writeWho, type DiscordIdentity } from "./discord";
import { defaultState } from "./engine";
import { seedPackIfNeeded } from "./inventory";
import { restoreHack, restoreTalk, restoreTerm } from "./terminal";
import { restoreTyrone } from "./tyrone-mind";
import { ensureSquad } from "./squad";
import type { GameState, LocationId, LocationProgress, Operative } from "./types";

let activeId: string | null = null;

export function activeDiscordId() {
  return activeId;
}

export function setActiveIdentity(who: DiscordIdentity | null) {
  activeId = who?.id ?? null;
  writeWho(who);
}

function key() {
  return saveKeyFor(activeId, SAVE_KEY);
}

function claimAnonymousIfNeeded(id: string) {
  try {
    const slot = saveKeyFor(id, SAVE_KEY);
    if (localStorage.getItem(slot)) return;
    const anon = localStorage.getItem(SAVE_KEY);
    if (anon) localStorage.setItem(slot, anon);
  } catch {
    /* ignore */
  }
}

function migrateLoc(id: string): LocationId {
  if (id === "forest") return "ironclad";
  if (id === "edge") return "veyra";
  return id as LocationId;
}

function migrateLocations(raw: Record<string, LocationProgress> | undefined, base: GameState["locations"]) {
  const next = { ...base };
  if (!raw) return next;
  (Object.keys(raw) as string[]).forEach((k) => {
    const id = migrateLoc(k);
    next[id] = { ...next[id], ...raw[k] };
  });
  return next;
}

export function loadSave(): GameState {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(key());
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<GameState> & { locations?: Record<string, LocationProgress> };
    const merged: GameState = {
      ...base,
      ...parsed,
      rooms: { ...base.rooms, ...parsed.rooms },
      quarters: { ...base.quarters, ...parsed.quarters },
      locations: migrateLocations(parsed.locations, base.locations),
      pack: { ...base.pack, ...parsed.pack },
      clocks: parsed.clocks ?? base.clocks,
      version: SAVE_VERSION,
    };
    merged.combat = parsed.combat ?? null;
    merged.mission = parsed.mission ?? null;
    merged.toast = null;
    merged.hack = restoreHack(parsed.hack);
    merged.term = restoreTerm((parsed as GameState).term);
    if (merged.hack && !merged.term) {
      merged.term = restoreTerm({ page: "lock", booted: true, output: [], sessionId: "restored" });
    }
    merged.lastParty = parsed.lastParty ?? [];
    merged.xp = parsed.xp ?? 0;
    merged.level = parsed.level ?? 1;
    merged.xpToNext = parsed.xpToNext ?? 80;
    merged.mentatsLuck = parsed.mentatsLuck ?? 0;
    merged.hackProbes = parsed.hackProbes ?? 0;
    merged.terminalDrained = parsed.terminalDrained ?? false;
    merged.terminalLockDay = parsed.terminalLockDay ?? 0;
    merged.discordId = parsed.discordId ?? activeId;
    merged.discordName = parsed.discordName ?? readWho()?.name ?? null;
    merged.playerName = parsed.playerName ?? merged.discordName ?? readWho()?.name ?? null;
    merged.playerHandle = parsed.playerHandle ?? null;
    merged.talk = restoreTalk(parsed.talk);
    merged.seenTalk = parsed.seenTalk ?? [];
    merged.talkQueue = Array.isArray(parsed.talkQueue)
      ? parsed.talkQueue.filter((id): id is string => typeof id === "string")
      : [];
    merged.selectedLoc = migrateLoc((parsed.selectedLoc as string) || "ironclad");
    merged.operatives = (parsed.operatives ?? []).map((o: Operative) => {
      const race = resolveRaceName(o.race);
      return {
        ...o,
        location: migrateLoc(o.location),
        race,
        lineage: resolveLineage(race, o.lineage),
      };
    });
    merged.squad = parsed.squad ?? [];
    merged.activeMemberId = parsed.activeMemberId ?? null;
    merged.arc = parsed.arc ?? null;
    merged.kaneHeat = parsed.kaneHeat ?? 0;
    merged.selectedPoiId = parsed.selectedPoiId ?? null;
    merged.regionMapOpen = false;
    merged.openedFrom = null;
    merged.market = (parsed as GameState).market && (parsed as GameState).market?.lots
      ? (parsed as GameState).market
      : base.market;
    merged.poiWatch = (parsed as GameState).poiWatch ?? { day: merged.day, used: [] };
    merged.shift = parsed.shift && parsed.shift.day === merged.day ? parsed.shift : merged.shift;
    merged.arcade = {
      ...base.arcade,
      ...(parsed as GameState).arcade,
      earned: { ...base.arcade.earned, ...(parsed as GameState).arcade?.earned },
      triviaSeen: (parsed as GameState).arcade?.triviaSeen ?? [],
      tfSeen: (parsed as GameState).arcade?.tfSeen ?? [],
      scrambleSeen: (parsed as GameState).arcade?.scrambleSeen ?? [],
      creeRead: (parsed as GameState).arcade?.creeRead ?? [],
    };
    merged.tyrone = restoreTyrone((parsed as GameState).tyrone);
    seedPackIfNeeded(merged);
    ensureSquad(merged);
    return merged;
  } catch {
    return base;
  }
}

export function writeSave(state: GameState) {
  try {
    const slim: GameState = {
      ...state,
      toast: null,
      openedFrom: null,
      hack: state.hack,
      term: state.term,
      talk: state.talk,
      talkQueue: state.talkQueue,
      combat: state.combat,
      mission: state.mission,
    };
    const k = key();
    localStorage.setItem(k, JSON.stringify(slim));
    localStorage.setItem(k + ":bak", JSON.stringify(slim));
  } catch {
    /* private mode / quota */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(key());
  } catch {
    /* ignore */
  }
}

export { claimAnonymousIfNeeded, applyFloor };
