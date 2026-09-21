/**
 * Tyrone companion memory — lives on GameState, persists with the file.
 * The game is source of truth. He may only recall what is stored here,
 * in compact context, or in live GameState. Never invents shared history.
 */
import { locationToRegion } from "./field-ops";
import { locById } from "./data";
import type {
  GameState,
  LocationId,
  TyroneAssist,
  TyroneBond,
  TyroneEpisode,
  TyroneEventType,
  TyroneFact,
  TyroneMind,
  TyroneWorking,
} from "./types";

export function emptyTyrone(): TyroneMind {
  return {
    episodic: [],
    semantic: [],
    story: [],
    promises: [],
    relationship: {
      trust: 42,
      familiarity: 6,
      respect: 32,
      conflict: 4,
      sharedHistory: 0,
      humor: 18,
      concern: 12,
      loyalty: 48,
    },
    settings: { assist: "normal", showNumbers: true },
    cooldowns: {},
    lastSpeechAt: 0,
    lastSpeechConcept: null,
    lastSilentReason: "cold file",
    lastSpeakReason: "",
    speechCount: 0,
    failedBeats: {},
    working: { actions: [], lastRegion: null, lastPoi: null, lastAsk: null },
    utterance: null,
  };
}

export function restoreTyrone(raw: unknown): TyroneMind {
  const base = emptyTyrone();
  if (!raw || typeof raw !== "object") return base;
  const t = raw as Partial<TyroneMind>;
  const assist = t.settings?.assist;
  const okAssist: TyroneAssist[] = ["off", "minimal", "normal", "helpful", "high"];
  return {
    ...base,
    episodic: Array.isArray(t.episodic) ? t.episodic.filter(isEpisode).slice(-80) : [],
    semantic: Array.isArray(t.semantic) ? t.semantic.filter(isFact).slice(-24) : [],
    story: Array.isArray(t.story) ? t.story.map(String).slice(0, 32) : [],
    promises: Array.isArray(t.promises) ? t.promises.slice(-12) : [],
    relationship: { ...base.relationship, ...(t.relationship ?? {}) },
    settings: {
      assist: okAssist.includes(assist as TyroneAssist) ? (assist as TyroneAssist) : "normal",
      showNumbers: t.settings?.showNumbers !== false,
    },
    cooldowns: t.cooldowns && typeof t.cooldowns === "object" ? { ...t.cooldowns } : {},
    lastSpeechAt: typeof t.lastSpeechAt === "number" ? t.lastSpeechAt : 0,
    lastSpeechConcept: t.lastSpeechConcept ?? null,
    lastSilentReason: t.lastSilentReason ?? base.lastSilentReason,
    lastSpeakReason: t.lastSpeakReason ?? "",
    speechCount: typeof t.speechCount === "number" ? t.speechCount : 0,
    failedBeats: t.failedBeats && typeof t.failedBeats === "object" ? { ...t.failedBeats } : {},
    working: { ...base.working, ...(t.working ?? {}) },
    utterance: typeof t.utterance === "string" ? t.utterance : null,
  };
}

function isEpisode(row: unknown): row is TyroneEpisode {
  return !!row && typeof row === "object" && typeof (row as TyroneEpisode).id === "string" && typeof (row as TyroneEpisode).description === "string";
}

function isFact(row: unknown): row is TyroneFact {
  return !!row && typeof row === "object" && typeof (row as TyroneFact).id === "string" && typeof (row as TyroneFact).claim === "string";
}

export type TyroneSnap = {
  day: number;
  screen: string;
  ticks: number;
  coins: number;
  started: boolean;
  living: { id: string; name: string; status: string; cls: string }[];
  rooms: GameState["rooms"];
  terminalDrained: boolean;
  loc: string | null;
  poi: string | null;
  missionKind: string | null;
  missionLoc: string | null;
  beatKey: string | null;
  lastRollHit: boolean | null;
  combat: boolean;
  logHead: string | null;
  talk: string | null;
  hackWon: boolean;
  hackLocked: boolean;
  vaultLen: number;
};

export function snapshotTyrone(s: GameState): TyroneSnap {
  const beat = s.mission?.beats[s.mission.beatIndex];
  const last = s.mission?.lastRoll;
  const hit = last && beat ? last.total >= beat.dc || last.band === "crit" : null;
  return {
    day: s.day,
    screen: s.screen,
    ticks: s.ticks,
    coins: s.coins,
    started: s.started,
    living: s.operatives.map((o) => ({ id: o.id, name: o.name, status: o.status, cls: o.cls })),
    rooms: { ...s.rooms },
    terminalDrained: s.terminalDrained,
    loc: s.selectedLoc,
    poi: s.selectedPoiId,
    missionKind: s.mission?.kind ?? null,
    missionLoc: s.mission?.locationId ?? null,
    beatKey: beat && s.mission ? `${s.mission.locationId}:${s.mission.kind}:${beat.stat}:${beat.title}` : null,
    lastRollHit: hit,
    combat: !!s.combat,
    logHead: s.log[0] ? `${s.log[0].who}:${s.log[0].what}` : null,
    talk: s.talk?.script ?? null,
    hackWon: !!s.hack?.won,
    hackLocked: !!s.hack?.locked,
    vaultLen: s.vault.length,
  };
}

function remember(
  state: GameState,
  row: Omit<TyroneEpisode, "id" | "ticks" | "day" | "recalled"> & { id?: string },
) {
  const mind = state.tyrone;
  const id = row.id ?? `ep-${state.day}-${state.ticks}-${row.type}`;
  if (mind.episodic.some((e) => e.id === id)) return;
  const episode: TyroneEpisode = {
    id,
    day: state.day,
    ticks: state.ticks,
    type: row.type,
    locationId: row.locationId,
    regionId: row.regionId,
    poiId: row.poiId,
    operativeIds: row.operativeIds,
    missionKind: row.missionKind,
    description: row.description,
    outcome: row.outcome,
    importance: row.importance,
    weight: row.weight,
    tags: row.tags,
    permanent: row.permanent,
    recalled: 0,
  };
  mind.episodic = [...mind.episodic, episode].slice(-80);
  if (row.permanent && !mind.story.includes(row.type + ":" + row.description.slice(0, 40))) {
    mind.story = [...mind.story, row.type + ":" + row.description.slice(0, 40)].slice(0, 32);
  }
  bumpBond(mind.relationship, row.weight);
}

export function rememberTyrone(
  state: GameState,
  row: Omit<TyroneEpisode, "id" | "ticks" | "day" | "recalled"> & { id?: string },
) {
  if (!state.tyrone) state.tyrone = emptyTyrone();
  remember(state, row);
}

function bumpBond(b: TyroneBond, weight: number) {
  const k = Math.max(-8, Math.min(8, weight));
  b.sharedHistory = clamp100(b.sharedHistory + Math.abs(k) * 0.4);
  b.familiarity = clamp100(b.familiarity + 0.35);
  if (k > 0) {
    b.trust = clamp100(b.trust + k * 0.35);
    b.respect = clamp100(b.respect + k * 0.25);
    b.loyalty = clamp100(b.loyalty + k * 0.2);
  } else if (k < -2) {
    b.concern = clamp100(b.concern - k * 0.4);
    b.conflict = clamp100(b.conflict - k * 0.2);
  }
}

function clamp100(n: number) {
  return Math.max(0, Math.min(100, n));
}

function noteAction(state: GameState, label: string) {
  const w: TyroneWorking = state.tyrone.working;
  w.actions = [...w.actions, label].slice(-8);
  w.lastRegion = (state.selectedLoc ? locationToRegion(state.selectedLoc) : null) ?? w.lastRegion;
  w.lastPoi = state.selectedPoiId ?? w.lastPoi;
}

function addFact(state: GameState, id: string, claim: string, tags: string[]) {
  const mind = state.tyrone;
  const existing = mind.semantic.find((f) => f.id === id);
  if (existing) {
    existing.evidence += 1;
    existing.claim = claim;
    return;
  }
  mind.semantic = [...mind.semantic, { id, claim, evidence: 1, tags }].slice(-24);
}

export function ingestTyrone(state: GameState, before: TyroneSnap) {
  if (!state.tyrone) state.tyrone = emptyTyrone();
  const loc = (state.selectedLoc ?? before.loc) as LocationId | null;
  const region = loc ? locationToRegion(loc) : undefined;
  const locName = loc ? locById(loc).name : "Vault 13";

  const nowLiving = state.operatives;
  const was = new Map(before.living.map((o) => [o.id, o]));

  for (const op of nowLiving) {
    const prev = was.get(op.id);
    if (!prev) {
      const first = nowLiving.filter((o) => o.status !== "dead").length === 1;
      remember(state, {
        id: `forge-${op.id}`,
        type: "forge",
        description: first
          ? `First operative forged in the Machine Shop: ${op.name} the ${op.cls}.`
          : `${op.name} forged. ${op.cls}.`,
        operativeIds: [op.id],
        importance: first ? 9 : 5,
        weight: first ? 6 : 2,
        tags: ["forge", op.cls.toLowerCase()],
        permanent: first,
      });
      noteAction(state, `forge ${op.name}`);
      addFact(state, `class-${op.cls}`, `Player forges ${op.cls}s.`, ["class", op.cls]);
    } else if (prev.status !== "downed" && op.status === "downed") {
      remember(state, {
        type: "downed",
        description: `${op.name} went down${loc ? ` in ${locName}` : ""}.`,
        operativeIds: [op.id],
        locationId: loc ?? undefined,
        regionId: region ?? undefined,
        importance: 7,
        weight: -3,
        tags: ["downed"],
        permanent: false,
      });
    } else if (prev.status !== "dead" && op.status === "dead") {
      const medOff = state.rooms.infirmary < 1;
      remember(state, {
        id: `death-${op.id}-${state.day}`,
        type: "death",
        description: medOff
          ? `${op.name} died at dawn because the Med Bay was dark.`
          : `${op.name} is a closed file.`,
        operativeIds: [op.id],
        importance: 10,
        weight: -7,
        tags: ["death", medOff ? "medbay-offline" : "combat"],
        permanent: true,
      });
      if (medOff) addFact(state, "dumps-wounded", "Player lets wounded sit without a Med Bay.", ["medbay"]);
    }
  }

  if (state.day > before.day) {
    remember(state, {
      type: "dawn",
      description: `Dawn of day ${state.day}.`,
      operativeIds: [],
      importance: 3,
      weight: 1,
      tags: ["dawn"],
      permanent: false,
    });
    noteAction(state, `dawn ${state.day}`);
    state.tyrone.relationship.familiarity = clamp100(state.tyrone.relationship.familiarity + 1.5);
  }

  if (!before.missionKind && state.mission) {
    remember(state, {
      type: "deploy",
      description: `${state.mission.kind} into ${locById(state.mission.locationId).name}.`,
      locationId: state.mission.locationId,
      regionId: locationToRegion(state.mission.locationId) ?? undefined,
      poiId: state.mission.poiId,
      missionKind: state.mission.kind,
      operativeIds: state.mission.partyIds,
      importance: state.mission.kind === "boss" ? 8 : 4,
      weight: 1,
      tags: ["deploy", state.mission.kind],
      permanent: state.mission.kind === "boss",
    });
    noteAction(state, `${state.mission.kind} ${locById(state.mission.locationId).short}`);
    addFact(state, `kind-${state.mission.kind}`, `Player runs ${state.mission.kind} jobs.`, ["mission", state.mission.kind]);
  }

  if (before.missionKind && !state.mission && before.missionLoc) {
    remember(state, {
      type: "mission",
      description: `${before.missionKind} at ${locById(before.missionLoc as LocationId).name} came home.`,
      locationId: before.missionLoc,
      regionId: locationToRegion(before.missionLoc as LocationId) ?? undefined,
      missionKind: before.missionKind,
      operativeIds: [],
      importance: 4,
      weight: 2,
      tags: ["return", before.missionKind],
      permanent: false,
    });
  }

  if (before.beatKey && state.mission?.lastRoll && before.lastRollHit === null && state.mission.lastRoll) {
    const beat = state.mission.beats[state.mission.beatIndex];
    const last = state.mission.lastRoll;
    const hit = last.total >= (beat?.dc ?? last.dc) || last.band === "crit";
    if (before.beatKey) {
      if (!hit) {
        state.tyrone.failedBeats[before.beatKey] = (state.tyrone.failedBeats[before.beatKey] ?? 0) + 1;
      } else {
        state.tyrone.failedBeats[before.beatKey] = 0;
      }
    }
    remember(state, {
      type: "roll",
      description: hit
        ? `${beat?.stat ?? "STAT"} beat held. d20 ${last.value}, total ${last.total} vs DC ${last.dc}.`
        : `${beat?.stat ?? "STAT"} beat missed. d20 ${last.value}, total ${last.total} vs DC ${last.dc}.`,
      locationId: state.mission.locationId,
      regionId: locationToRegion(state.mission.locationId) ?? undefined,
      missionKind: state.mission.kind,
      operativeIds: state.mission.partyIds,
      importance: hit ? 3 : 5,
      weight: hit ? 1 : -1,
      tags: ["roll", last.band, beat?.stat ?? ""],
      permanent: false,
    });
  }

  if (!before.combat && state.combat) {
    remember(state, {
      type: "combat",
      description: "Steel came out.",
      locationId: loc ?? undefined,
      operativeIds: state.combat.partyIds ?? [],
      importance: 5,
      weight: 0,
      tags: ["combat"],
      permanent: false,
    });
  }

  for (const room of Object.keys(state.rooms) as (keyof GameState["rooms"])[]) {
    if (state.rooms[room] > (before.rooms[room] ?? 0)) {
      remember(state, {
        type: "upgrade",
        description: `Vault room ${room} to tier ${state.rooms[room]}.`,
        operativeIds: [],
        importance: 4,
        weight: 2,
        tags: ["upgrade", room],
        permanent: state.rooms[room] >= 2,
      });
      noteAction(state, `upgrade ${room}`);
    }
  }

  if (!before.terminalDrained && state.terminalDrained) {
    remember(state, {
      id: "synapse-crack",
      type: "hack",
      description: "Cracked the SYNAPSE terminal. T-0880 challenge coin recovered.",
      operativeIds: [],
      importance: 9,
      weight: 5,
      tags: ["synapse", "hack"],
      permanent: true,
    });
  }

  if (before.coins - state.coins > 800 && state.rooms.watchtower > (before.rooms.watchtower ?? 0)) {
    remember(state, {
      type: "upgrade",
      description: "Caps drained upgrading Perimeter Control.",
      operativeIds: [],
      importance: 4,
      weight: 1,
      tags: ["caps", "watchtower"],
      permanent: false,
    });
  }

  if (state.selectedLoc && state.selectedLoc !== before.loc) {
    noteAction(state, `look ${locById(state.selectedLoc).short}`);
  }

  if (state.vault.length > before.vaultLen && before.coins > state.coins) {
    const gained = state.vault.length - before.vaultLen;
    remember(state, {
      type: "buy",
      description: `Bought ${gained} crate${gained === 1 ? "" : "s"} off the Market. Ledger is lighter.`,
      locationId: loc ?? undefined,
      operativeIds: [],
      importance: 3,
      weight: 1,
      tags: ["buy", "market"],
      permanent: false,
    });
    noteAction(state, "buy market");
  }
}

export function retrieveMemories(
  state: GameState,
  query: { region?: string | null; type?: TyroneEventType; tags?: string[]; limit?: number; touch?: boolean },
) {
  const mind = state.tyrone ?? emptyTyrone();
  const scored = mind.episodic.map((e) => {
    let score = e.importance;
    if (query.region && (e.regionId === query.region || e.locationId === query.region)) score += 6;
    if (query.type && e.type === query.type) score += 4;
    if (query.tags?.some((t) => e.tags.includes(t))) score += 3;
    if (e.permanent) score += 3;
    score += Math.min(4, e.weight);
    score -= e.recalled * 0.8;
    return { e, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const take = scored.slice(0, query.limit ?? 6);
  if (query.touch) {
    take.forEach((row) => {
      row.e.recalled += 1;
    });
  }
  return take.map((row) => row.e);
}

export function knownFact(state: GameState, id: string, minEvidence = 3) {
  const fact = state.tyrone?.semantic.find((f) => f.id === id);
  if (!fact || fact.evidence < minEvidence) return null;
  return fact;
}

export function markCooldown(state: GameState, key: string, untilTick: number) {
  state.tyrone.cooldowns[key] = untilTick;
}

export function onCooldown(state: GameState, key: string) {
  return (state.tyrone.cooldowns[key] ?? 0) > state.ticks;
}

export function cooling(state: GameState, key: string, durationTicks: number) {
  if (onCooldown(state, key)) return true;
  markCooldown(state, key, state.ticks + durationTicks);
  return false;
}
