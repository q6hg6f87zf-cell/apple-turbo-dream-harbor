import { locById } from "./data";
import type { GameState, LocationId, MissionKind, SquadMember } from "./types";

function nid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

export const ARC_ORDER: LocationId[] = ["ironclad", "kingdom", "caverns", "library", "veyra"];

const VACANT_NAMES = /^(commander|unclaimed|rider)$/i;

export function isVacant(m: SquadMember | null | undefined): boolean {
  if (!m) return false;
  if (m.discordId) return false;
  const handle = (m.discordHandle ?? "").replace(/^@/, "");
  if (handle && !VACANT_NAMES.test(handle)) return false;
  return VACANT_NAMES.test(m.name);
}

export function makeMember(opts: {
  name: string;
  discordId?: string | null;
  discordHandle?: string | null;
  day: number;
  personalCaps?: number;
}): SquadMember {
  const handle = opts.discordHandle?.trim()
    ? opts.discordHandle.trim().replace(/^@/, "")
    : opts.discordId
      ? opts.discordId
      : null;
  const rawName = (opts.name || "").trim();
  const vacant = !rawName || VACANT_NAMES.test(rawName);
  return {
    id: opts.discordId?.trim() || nid("sq"),
    name: vacant && !opts.discordId ? "Unclaimed" : (rawName || "Rider").slice(0, 24),
    discordId: opts.discordId ?? null,
    discordHandle: handle ? `@${handle.replace(/^@/, "").slice(0, 24)}` : null,
    personalCaps: opts.personalCaps ?? 0,
    xp: 0,
    note: "",
    joinedDay: opts.day,
    lastTurnDay: 0,
  };
}

function paintChair(m: SquadMember, name: string, handle?: string | null, discordId?: string | null) {
  const hid = (handle || "").trim().replace(/^@/, "").slice(0, 24);
  const did = discordId?.trim() || null;
  m.name = name.trim().slice(0, 24);
  if (did) m.discordId = did;
  if (hid) m.discordHandle = `@${hid}`;
  else if (did && !m.discordHandle) m.discordHandle = `@${name.replace(/^@/, "").slice(0, 24)}`;
}

export function ensureSquad(state: GameState): SquadMember {
  if (!state.squad) state.squad = [];
  if (state.squad.length === 0) {
    const m = makeMember({
      name: state.discordName || "Unclaimed",
      discordId: state.discordId,
      discordHandle: state.discordName,
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
  if (first && isVacant(first) && state.discordName && !VACANT_NAMES.test(state.discordName)) {
    paintChair(first, state.discordName, state.discordName, state.discordId);
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

export function seatedMember(state: GameState): SquadMember {
  return (
    state.squad?.find((m) => m.id === state.activeMemberId) ??
    state.squad?.[0] ??
    makeMember({
      name: state.discordName || "Unclaimed",
      discordId: state.discordId,
      discordHandle: state.discordName,
      day: state.day,
    })
  );
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
  const hid = (handle || "").trim().replace(/^@/, "").slice(0, 24);
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
    paintChair(vacant, cleanName, hid || did, did);
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
  state.discordName = m.name;
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
