import type { GameState, HackState, LogKind, PackCounts, PackKey } from "./types";

export const PACK_KEYS: PackKey[] = [
  "bobby_pin",
  "stimpak",
  "mentats",
  "holotape",
  "sarsaparilla",
  "probe_kit",
];

export const PACK_CATALOG: Record<
  PackKey,
  {
    name: string;
    useName: string;
    rarity: "Common" | "Uncommon" | "Rare";
    blurb: string;
    use: string;
    usable: boolean;
  }
> = {
  bobby_pin: {
    name: "Bobby pin",
    useName: "bobby_pin",
    rarity: "Common",
    blurb: "Old lockpick leftover. New files start with 3.",
    use: "Lockpick is gone. Flavor until we retie it.",
    usable: true,
  },
  stimpak: {
    name: "Stimpak",
    useName: "stimpak",
    rarity: "Rare",
    blurb: "Pride patch, not HP. Rare clean-win drop.",
    use: "Tyrone patches the streak talk. You still have to win.",
    usable: true,
  },
  mentats: {
    name: "Mentats",
    useName: "mentats",
    rarity: "Rare",
    blurb: "Brain chems. Rare raid drop.",
    use: "Next loot roll +3 Luck.",
    usable: true,
  },
  holotape: {
    name: "Holotape",
    useName: "holotape",
    rarity: "Uncommon",
    blurb: "Workshop noise. Hack and scored boards can drop one.",
    use: "A porch line. No blueprint.",
    usable: true,
  },
  sarsaparilla: {
    name: "Sunset Sarsaparilla",
    useName: "sarsaparilla",
    rarity: "Uncommon",
    blurb: "Bottle. Trivia and lucky rolls.",
    use: "Tyrone toasts you.",
    usable: true,
  },
  probe_kit: {
    name: "Probe kit",
    useName: "probe_kit",
    rarity: "Rare",
    blurb: "Hack extra. Memory probes in a battered case.",
    use: "Next hack +1 memory probe.",
    usable: true,
  },
};

const BOBBY_LINES = [
  "You bend it. It doesn't pick anything. Yet.",
  "Lockpick's gone. You just spent a pin on the aesthetic.",
  "Three was the starter kit. You're down one. Tyrone shrugs.",
];

const STIMPAK_LINES = [
  "Pride patch. I fixed the talk. I didn't fix the streak.",
  "You still have to win. This just makes the loss sound better.",
  "Patched. Now go do something that deserves it.",
];

const MENTATS_LINES = [
  "Brain's loud now. Next crate you crack is luckier.",
  "+3 Luck on the next loot roll. Don't waste it on a fumble.",
  "Chems are a loan. Pay it back with a clean win.",
];

const HOLO_LINES = [
  "Workshop's loud tonight. That's a holotape, not a plan.",
  "You want a blueprint, steal one. This is porch talk.",
  "Static, a laugh, somebody welding at 2 a.m. That's the tape.",
];

const SARS_LINES = [
  "To the ones who made it back. Drink.",
  "Sunset in a bottle. Don't waste it.",
  "Tyrone toasts you. The CRT flickers like it agrees.",
];

const PROBE_LINES = [
  "One extra memory probe on the next CRT. Don't fry it.",
  "Kit's open. Next hack remembers one more thing.",
  "Probe seated. The terminal's going to hate you slightly less.",
];

function pickLine(lines: string[]) {
  return lines[Math.floor(Math.random() * lines.length)]!;
}

function note(state: GameState, kind: LogKind, who: string, what: string) {
  const e = {
    id: `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    day: state.day,
    kind,
    who,
    what,
  };
  state.log = [e, ...state.log].slice(0, 80);
}

export function emptyPack(): PackCounts {
  return {
    bobby_pin: 0,
    stimpak: 0,
    mentats: 0,
    holotape: 0,
    sarsaparilla: 0,
    probe_kit: 0,
  };
}

export function starterPack(): PackCounts {
  return { ...emptyPack(), bobby_pin: 3 };
}

export function mountainDateKey(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function freshClocks(dateKey = mountainDateKey()) {
  return { dateKey, triviaLives: 3, tfLives: 3, unscramble: 10 };
}

export function ensureClocks(state: GameState): void {
  const key = mountainDateKey();
  if (!state.clocks || state.clocks.dateKey !== key) {
    state.clocks = freshClocks(key);
  }
}

export function addPack(state: GameState, key: PackKey, n = 1): void {
  if (!state.pack) state.pack = emptyPack();
  state.pack[key] = Math.max(0, (state.pack[key] ?? 0) + n);
}

const DROP_WEIGHTS: { key: PackKey; w: number }[] = [
  { key: "bobby_pin", w: 34 },
  { key: "sarsaparilla", w: 22 },
  { key: "holotape", w: 16 },
  { key: "stimpak", w: 12 },
  { key: "mentats", w: 10 },
  { key: "probe_kit", w: 6 },
];

function rollWeighted(): PackKey {
  const total = DROP_WEIGHTS.reduce((a, x) => a + x.w, 0);
  let r = Math.random() * total;
  for (const row of DROP_WEIGHTS) {
    r -= row.w;
    if (r <= 0) return row.key;
  }
  return "bobby_pin";
}

/** Clean win: chance at a pack item. Mentats fatten the table. */
export function grantPackLoot(state: GameState, opts?: { sure?: boolean; source?: string }): PackKey | null {
  const luck = state.mentatsLuck > 0 ? 3 : 0;
  if (state.mentatsLuck > 0) state.mentatsLuck -= 1;
  const chance = (opts?.sure ? 1 : 0.38) + luck * 0.08;
  if (Math.random() > chance) return null;
  const key = rollWeighted();
  addPack(state, key, 1);
  const cat = PACK_CATALOG[key];
  const src = opts?.source ?? "Sortie";
  note(state, "loot", src, `${cat.name} hits the vault.`);
  return key;
}

export function usePackItem(state: GameState, key: PackKey): string | null {
  ensureClocks(state);
  if (!state.pack) state.pack = emptyPack();
  if ((state.pack[key] ?? 0) <= 0) return `No ${PACK_CATALOG[key].name} in the vault.`;
  state.pack[key] -= 1;
  let line = "";
  if (key === "bobby_pin") {
    line = pickLine(BOBBY_LINES);
  } else if (key === "stimpak") {
    line = pickLine(STIMPAK_LINES);
    state.moonFavor += 1;
  } else if (key === "mentats") {
    state.mentatsLuck += 1;
    line = pickLine(MENTATS_LINES);
  } else if (key === "holotape") {
    line = pickLine(HOLO_LINES);
  } else if (key === "sarsaparilla") {
    line = pickLine(SARS_LINES);
    state.moonFavor += 1;
  } else if (key === "probe_kit") {
    state.hackProbes += 1;
    if (state.terminalLockDay > state.day) state.terminalLockDay = 0;
    line = pickLine(PROBE_LINES);
  }
  note(state, "action", "Tyrone", `${PACK_CATALOG[key].name}: ${line}`);
  state.toast = line;
  return null;
}

const HACK_WORDS = [
  "STIMPAK",
  "MENTATS",
  "SYNAPSE",
  "FALLOUT",
  "NUCLEAR",
  "LOCKPIN",
  "PROBING",
  "BOTTLES",
  "SUNSETS",
  "HOLOTAP",
  "WASTREL",
  "GLOWING",
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function likeness(a: string, b: string): number {
  let n = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) if (a[i] === b[i]) n++;
  return n;
}

export function openHack(state: GameState): string | null {
  ensureClocks(state);
  if (state.hack) return null;
  if (state.terminalLockDay > state.day && state.hackProbes <= 0) {
    return "Terminal locked. Wait for dawn, or spend a probe kit.";
  }
  const rest = shuffle(HACK_WORDS.filter((w) => w !== "SYNAPSE")).slice(0, 11);
  const words = shuffle(["SYNAPSE", ...rest]);
  const password = "SYNAPSE";
  const extra = state.hackProbes;
  if (extra > 0) state.hackProbes = 0;
  const triesMax = 4 + extra;
  const hack: HackState = {
    words,
    password,
    tries: triesMax,
    triesMax,
    dudsLeft: words.filter((w) => w !== password),
    log: [
      "SYNAPSE TERMINAL · T-0880",
      extra ? `PROBE KIT SEATED · ${triesMax} ATTEMPT(S) LEFT` : `${triesMax} ATTEMPT(S) LEFT`,
      "S.Y.N.A.P.S.E TERMLINK PROTOCOL",
      "Enter password now.",
    ],
    lastLikeness: null,
    locked: false,
    won: false,
  };
  state.hack = hack;
  state.terminalLockDay = 0;
  return null;
}

export function closeHack(state: GameState): void {
  state.hack = null;
}

export function hackGuess(state: GameState, word: string): "ok" | "denied" | "lock" | "won" | "idle" {
  const h = state.hack;
  if (!h || h.locked || h.won) return "idle";
  const w = word.toUpperCase();
  if (!h.words.includes(w)) return "idle";
  if (w === h.password) {
    h.won = true;
    h.log = [...h.log, `>${w}`, "Exact match!", "Please wait while system is accessed..."];
    if (!state.terminalDrained) {
      state.terminalDrained = true;
      state.coins += 3000;
      h.log = [...h.log, "ACCOUNT OVERRIDE", "+3,000 BOTTLE CAPS TRANSFERRED"];
      note(state, "loot", "Terminal", "Easter egg. +3,000 bottle caps.");
      state.toast = "Terminal cracked. +3,000 bottle caps.";
      if (Math.random() < 0.55) {
        addPack(state, "holotape", 1);
        h.log = [...h.log, "HOLOTAPE DUMPED TO VAULT"];
      }
    } else {
      const drip = 40 + Math.floor(Math.random() * 25);
      state.coins += drip;
      h.log = [
        ...h.log,
        "VAULT ACCOUNT: MOSTLY EMPTY",
        `TYRONE: "You already cleaned that crate."`,
        `+${drip} CAPS IN THE TRAY`,
      ];
      state.toast = `Already drained. +${drip} caps in the tray.`;
    }
    return "won";
  }
  h.tries -= 1;
  const like = likeness(w, h.password);
  h.lastLikeness = like;
  h.log = [...h.log, `>${w}`, "Entry denied.", `Likeness=${like}`];
  if (h.tries <= 0) {
    h.locked = true;
    state.terminalLockDay = state.day + 1;
    h.log = [...h.log, "TERMINAL LOCKED", "Wait for dawn — or seat a probe kit."];
    state.toast = "Lockout. Dawn, or a probe kit.";
    return "lock";
  }
  h.log = [...h.log, `${h.tries} ATTEMPT(S) LEFT`];
  return "denied";
}

export function hackDud(state: GameState): string | null {
  const h = state.hack;
  if (!h || h.locked || h.won) return "Nothing to pry.";
  if (!h.dudsLeft.length) return "No duds left in the dump.";
  const idx = Math.floor(Math.random() * h.dudsLeft.length);
  const gone = h.dudsLeft.splice(idx, 1)[0]!;
  h.words = h.words.filter((w) => w !== gone);
  h.log = [...h.log, ">()", `Dud removed: ${gone}`];
  return null;
}

export function seedPackIfNeeded(state: GameState): void {
  if (!state.pack) state.pack = starterPack();
  else {
    for (const k of PACK_KEYS) if (typeof state.pack[k] !== "number") state.pack[k] = 0;
  }
  if (typeof state.mentatsLuck !== "number") state.mentatsLuck = 0;
  if (typeof state.hackProbes !== "number") state.hackProbes = 0;
  if (typeof state.terminalDrained !== "boolean") state.terminalDrained = false;
  if (typeof state.terminalLockDay !== "number") state.terminalLockDay = 0;
  ensureClocks(state);
}
