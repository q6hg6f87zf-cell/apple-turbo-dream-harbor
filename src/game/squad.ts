import { locById } from "./data";
import { ensureClocks } from "./inventory";
import { CARD_CLOCK_BASE, STARTER_PLATE } from "./rooms";
import type { GameState, LocationId, MissionKind, SquadMember } from "./types";

function nid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

export const ARC_ORDER: LocationId[] = ["ironclad", "kingdom", "caverns", "library", "veyra"];

export const VACANT_NAMES = /^(commander|unclaimed|rider)$/i;

export function isVacant(m: SquadMember | null | undefined): boolean {
  if (!m) return false;
  return VACANT_NAMES.test(m.name);
}

export function normalizeHandle(raw?: string | null): string | null {
  const h = (raw ?? "").trim().replace(/^@/, "").replace(/\s+/g, "").slice(0, 24);
  if (h.length < 2) return null;
  if (/\s/.test((raw ?? "").trim())) return null;
  return h;
}

export function looksLikeHandle(raw?: string | null): boolean {
  const t = (raw ?? "").trim().replace(/^@/, "");
  return /^[a-z0-9._]{2,32}$/i.test(t) || /^.+#\d{4}$/.test(t);
}

export function plateHandle(m: SquadMember | null | undefined): string {
  if (!m) return "unlinked rider";
  const hid = normalizeHandle(m.discordHandle);
  if (hid) return `@${hid}`;
  if (m.discordId) return "linked rider";
  if (isVacant(m)) return "claim this plate";
  return "unlinked rider";
}


export function makeMember(opts: {
  name: string;
  discordId?: string | null;
  discordHandle?: string | null;
  day: number;
  personalCaps?: number;
}): SquadMember {
  const handle = normalizeHandle(opts.discordHandle);
  const rawName = (opts.name || "").trim();
  const vacant = !rawName || VACANT_NAMES.test(rawName);
  return {
    id: opts.discordId?.trim() || nid("sq"),
    name: vacant ? "Unclaimed" : rawName.slice(0, 24),
    discordId: opts.discordId ?? null,
    discordHandle: handle ? `@${handle}` : null,
    personalCaps: opts.personalCaps ?? 0,
    xp: 0,
    note: "",
    joinedDay: opts.day,
    lastTurnDay: 0,
  };
}

function paintChair(m: SquadMember, name: string, handle?: string | null, discordId?: string | null) {
  const hid = normalizeHandle(handle);
  const did = discordId?.trim() || null;
  m.name = name.trim().slice(0, 24);
  if (did) m.discordId = did;
  if (hid) m.discordHandle = `@${hid}`;
}

export function stampSeatedPlate(state: GameState): string | null {
  ensureSquad(state);
  const name = (state.playerName ?? "").trim();
  if (name.length < 2) return "Stamp a name first.";
  const handle = normalizeHandle(state.playerHandle) ?? normalizeHandle(state.discordName);
  const msg = registerMember(state, name, handle, state.discordId);
  const me = seatedMember(state);
  if (!msg && me.personalCaps === 0 && me.joinedDay === state.day) me.personalCaps = STARTER_PLATE;
  return msg;
}

export function clockPlate(state: GameState): string | null {
  ensureSquad(state);
  ensureClocks(state);
  const me = seatedMember(state);
  if (isVacant(me)) return "Stamp the black card first.";
  if (state.clocks.cardTap) return "Plate already clocked this Mountain day.";
  const pay = CARD_CLOCK_BASE + Math.max(0, state.level) * 8;
  state.clocks.cardTap = 1;
  me.personalCaps += pay;
  state.toast = `${me.name} clocked the plate. +${pay} personal caps.`;
  return null;
}

export function bindDiscordIdentity(state: GameState, id: string, handle?: string | null) {
  const snow = id.trim().replace(/[^\w.-]/g, "").slice(0, 32);
  let hid = normalizeHandle(handle);
  if (hid && /^\d{17,22}$/.test(hid)) hid = null;
  if (snow.length < 2 && !hid) return;
  if (snow.length >= 2) state.discordId = snow;
  if (hid) {
    state.discordName = hid;
    if (!normalizeHandle(state.playerHandle)) state.playerHandle = hid;
  }
  const seated = ensureSquad(state);
  if (snow.length >= 2 && !seated.discordId) seated.discordId = snow;
  if (hid) seated.discordHandle = `@${hid}`;
  if (state.playerName?.trim()) stampSeatedPlate(state);
}


export function ensureSquad(state: GameState): SquadMember {
  if (!state.squad) state.squad = [];
  if (state.squad.length === 0) {
    const m = makeMember({
      name: state.playerName || "Unclaimed",
      discordId: state.discordId,
      discordHandle: state.playerHandle || state.discordName,
      day: state.day,
    });
    state.squad = [m];
    state.activeMemberId = m.id;
    state.arc = {
      chapter: 1,
      turn: 1,
      turnMemberId: m.id,
      log: ["Arc I — Ironclad. First gate on the seam."],
    };
  }
  for (const m of state.squad) {
    if (isVacant(m) && m.name === "Commander") m.name = "Unclaimed";
  }
  const first = state.squad[0];
  if (first) {
    if (state.discordId && !first.discordId) first.discordId = state.discordId;
    const hid = normalizeHandle(state.playerHandle) ?? normalizeHandle(state.discordName);
    if (hid && !normalizeHandle(first.discordHandle)) first.discordHandle = `@${hid}`;
    if (isVacant(first) && state.playerName?.trim()) {
      paintChair(first, state.playerName.trim(), hid, state.discordId);
    }
  }
  if (!state.activeMemberId || !state.squad.some((m) => m.id === state.activeMemberId)) {
    state.activeMemberId = state.squad[0].id;
  }
  if (!state.arc) {
    state.arc = {
      chapter: 1,
      turn: 1,
      turnMemberId: state.squad[0].id,
      log: [],
    };
  }
  const arc = state.arc;
  if (!state.squad.some((m) => m.id === arc.turnMemberId)) {
    arc.turnMemberId = state.squad[0].id;
  }
  return state.squad.find((m) => m.id === state.activeMemberId)!;
}

const EMPTY_PLATE: SquadMember = {
  id: "plate-empty",
  name: "Unclaimed",
  discordId: null,
  discordHandle: null,
  personalCaps: 0,
  xp: 0,
  note: "",
  joinedDay: 1,
  lastTurnDay: 0,
};

export function seatedMember(state: GameState): SquadMember {
  return state.squad?.find((m) => m.id === state.activeMemberId) ?? state.squad?.[0] ?? EMPTY_PLATE;
}

/** The plate the HUD and the floor both spend. Never invent a fresh 0-cap rider. */
export function plateMember(state: GameState): SquadMember {
  const seated = seatedMember(state);
  if (!state.squad?.length) return seated;
  if (!isVacant(seated) && (Number(seated.personalCaps) || 0) > 0) return seated;
  const named = (state.playerName ?? "").trim().toLowerCase();
  const stamped = state.squad.filter((m) => !isVacant(m));
  const match = named ? stamped.find((m) => m.name.toLowerCase() === named) : undefined;
  if (match) return match;
  const richest = [...stamped].sort((a, b) => (b.personalCaps || 0) - (a.personalCaps || 0))[0];
  return richest ?? seated;
}

export function currentArcLoc(state: GameState): LocationId {
  for (const id of ARC_ORDER) {
    const p = state.locations[id];
    if (p && !p.bossDefeated) return id;
  }
  return "veyra";
}

export function arcChapter(state: GameState): number {
  return ARC_ORDER.indexOf(currentArcLoc(state)) + 1;
}

export function isArcAction(loc: LocationId, kind: MissionKind): boolean {
  return (kind === "raid" || kind === "boss" || kind === "bounty") && ARC_ORDER.includes(loc);
}

export function canTakeArcTurn(state: GameState, loc: LocationId, kind: MissionKind): boolean {
  ensureSquad(state);
  if (!(kind === "raid" || kind === "boss" || kind === "bounty")) return true;
  if (loc !== currentArcLoc(state)) return true;
  return state.arc!.turnMemberId === state.activeMemberId;
}

export function spendArcTurn(state: GameState, note: string) {
  const who = ensureSquad(state);
  const loc = currentArcLoc(state);
  const i = Math.max(
    0,
    state.squad.findIndex((m) => m.id === state.arc!.turnMemberId),
  );
  const actor = state.squad[i] ?? who;
  const next = state.squad[(i + 1) % state.squad.length];
  actor.lastTurnDay = state.day;
  state.arc!.chapter = arcChapter(state);
  state.arc!.turn += 1;
  state.arc!.turnMemberId = next.id;
  const line = `${actor.name} closed a beat in ${locById(loc).short}. Turn passes to ${next.name}. ${note}`;
  state.arc!.log = [line, ...state.arc!.log].slice(0, 24);
  if (state.squad.length > 1) {
    state.toast = `ARC turn → ${next.name}`;
  }
}

export function registerMember(
  state: GameState,
  name: string,
  handle?: string | null,
  discordId?: string | null,
): string | null {
  ensureSquad(state);
  const cleanName = name.trim().replace(/^@/, "").slice(0, 24);
  if (cleanName.length < 2) return "They need a name on the card.";
  const hid = normalizeHandle(handle);
  const did = discordId?.trim() || null;
  const exists = state.squad.find(
    (m) =>
      (did && m.discordId === did) ||
      (did && m.id === did) ||
      (hid && m.discordHandle && m.discordHandle.replace(/^@/, "").toLowerCase() === hid.toLowerCase()) ||
      (!isVacant(m) && m.name.toLowerCase() === cleanName.toLowerCase()),
  );
  if (exists) {
    paintChair(exists, cleanName, hid || exists.discordHandle, did);
    switchMember(state, exists.id);
    return null;
  }
  const vacant = state.squad.find(isVacant);
  if (vacant) {
    paintChair(vacant, cleanName, hid, did);
    switchMember(state, vacant.id);
    return null;
  }
  const m = makeMember({
    name: cleanName,
    discordId: did,
    discordHandle: hid || null,
    day: state.day,
  });
  state.squad = [...state.squad, m];
  switchMember(state, m.id);
  return null;
}

export function switchMember(state: GameState, id: string) {
  ensureSquad(state);
  if (!state.squad.some((m) => m.id === id)) return;
  state.activeMemberId = id;
  const m = state.squad.find((x) => x.id === id)!;
  if (m.discordId) state.discordId = m.discordId;
  const hid = normalizeHandle(m.discordHandle);
  if (hid) state.discordName = hid;
}

export function giftCaps(state: GameState, toId: string, amount: number): string | null {
  const from = ensureSquad(state);
  const to = state.squad.find((m) => m.id === toId);
  if (!to) return "No rider on this file.";
  if (to.id === from.id) return "That is already your card.";
  const n = Math.floor(amount);
  if (n < 1) return "Send at least 1 cap.";
  if (from.personalCaps < n) return "Not enough on the card.";
  from.personalCaps -= n;
  to.personalCaps += n;
  to.note = `${from.name} sent ${n} caps. ${to.note}`.slice(0, 160);
  return null;
}

export function depositToCard(state: GameState, amount: number): string | null {
  const m = ensureSquad(state);
  const n = Math.floor(amount);
  if (n < 1) return "Deposit at least 1 cap.";
  if (state.coins < n) return "Compound vault is short.";
  state.coins -= n;
  m.personalCaps += n;
  return null;
}

export function withdrawFromCard(state: GameState, amount: number): string | null {
  const m = ensureSquad(state);
  const n = Math.floor(amount);
  if (n < 1) return "Withdraw at least 1 cap.";
  if (m.personalCaps < n) return "Card is short.";
  m.personalCaps -= n;
  state.coins += n;
  return null;
}

export function cardNumber(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  const a = String(h % 10000).padStart(4, "0");
  const b = String((h >>> 8) % 10000).padStart(4, "0");
  const c = String((h >>> 16) % 10000).padStart(4, "0");
  return `MS ${a} ${b} ${c}`;
}

export function maybeSpendArcTurn(state: GameState, loc: LocationId, kind: MissionKind, note: string) {
  if (!(kind === "raid" || kind === "boss" || kind === "bounty")) return;
  ensureSquad(state);
  const current = currentArcLoc(state);
  const i = ARC_ORDER.indexOf(loc);
  const nextId = i >= 0 ? ARC_ORDER[i + 1] : undefined;
  const justCleared = kind === "boss" && state.locations[loc].bossDefeated && nextId === current;
  if (loc !== current && !justCleared) return;
  spendArcTurn(state, note);
}

export function passArcTurn(state: GameState) {
  ensureSquad(state);
  if (state.arc!.turnMemberId !== state.activeMemberId) {
    state.toast = "ARC turn belongs to someone else.";
    return;
  }
  spendArcTurn(state, "Passed from the porch.");
}
