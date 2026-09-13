import { SAVE_KEY, SAVE_VERSION } from "./data";
import { applyFloor, readWho, saveKeyFor, writeWho, type DiscordIdentity } from "./discord";
import { defaultState } from "./engine";
import { seedPackIfNeeded } from "./inventory";
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
    merged.hack = null;
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
    merged.talk = null;
    merged.seenTalk = parsed.seenTalk ?? [];
    merged.talkQueue = [];
    merged.selectedLoc = migrateLoc((parsed.selectedLoc as string) || "ironclad");
    merged.operatives = (parsed.operatives ?? []).map((o: Operative) => ({
      ...o,
      location: migrateLoc(o.location),
    }));
    merged.squad = parsed.squad ?? [];
    merged.activeMemberId = parsed.activeMemberId ?? null;
    merged.arc = parsed.arc ?? null;
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
      hack: null,
      talk: state.talk,
      combat: state.combat,
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
