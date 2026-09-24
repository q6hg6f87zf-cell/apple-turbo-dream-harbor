import { CREE, SCRAMBLE, TRUEFALSE, TRIVIA } from "./arcade-banks";
import { grantXp, pushLog } from "./engine";
import { addPack, ensureClocks, grantPackLoot } from "./inventory";
import { finishCabinetJob } from "./shift";
import { ensureSquad, isVacant, plateMember } from "./squad";
import type { ArcadeGameId, ArcadePayout, ArcadeState, GameState, LocationId, PackKey } from "./types";

export const KNOWLEDGE_DRAWS = 12;
export const SCRAMBLE_BOARDS = 3;
export const LOCKPICKS_DAY = 4;
export const SLOTS_DAY = 8;
export const SCRAMBLE_MS = 60_000;
export const SCRAMBLE_PAY: Record<number, number> = { 3: 2, 4: 4, 5: 8, 6: 14, 7: 22, 8: 40, 9: 58, 10: 80 };

export const ARCADE_CATALOG: {
  id: ArcadeGameId;
  name: string;
  floor: "pit" | "machine" | "table";
  how: string[];
}[] = [
  {
    id: "trivia",
    name: "Trivia",
    floor: "pit",
    how: [
      "Four answers. One is clean.",
      "The file retires the instant it is served.",
      "Hits pay caps and regional intel. The clock shrinks by tier.",
    ],
  },
  {
    id: "truefalse",
    name: "True / False",
    floor: "pit",
    how: [
      "Two lamps. Wrong burns a life.",
      "Shares the twelve daily knowledge draws with Trivia.",
      "Kane writes contracts this tight. Read twice.",
    ],
  },
  {
    id: "scramble",
    name: "Unscramble",
    floor: "pit",
    how: [
      "Letters arrive shuffled. The seed stays dark until you bank it.",
      "Only real words. Three letters minimum. Tap tiles, then Bank.",
      "Three boards a Mountain day. Sixty seconds. Longer words pay more.",
    ],
  },
  {
    id: "wordsearch",
    name: "Word search",
    floor: "pit",
    how: [
      "The list is on the rail. The grid is the work.",
      "Drag a straight line — finger or cursor — through a word. Eight directions. Reverse counts.",
      "Clear every listed word for the bonus.",
    ],
  },
  {
    id: "lockpick",
    name: "Lockpick",
    floor: "machine",
    how: [
      "Tap when the sweeper is in the ember window.",
      "Three tumblers. Two misses snap a bobby pin.",
      "The window shrinks as you work.",
    ],
  },
  {
    id: "slots",
    name: "Slots",
    floor: "machine",
    how: [
      "Three reels. Mid line is always live.",
      "The black card pays the stool. High sits need a hold.",
      "Two on the rail holds the last reel. House takes a tenth.",
      "A miss after two matching is louder on purpose. Odds never change.",
      "The mid line is the true picture unless you buy three.",
      "A small pay that does not cover the stool is not a win.",
    ],
  },
  {
    id: "hack",
    name: "SYNAPSE",
    floor: "machine",
    how: [
      "Fallout dump. Four tries.",
      "Likeness is how many letters sit in the right chair.",
      "First crack is three thousand. After that, crumbs.",
    ],
  },
  {
    id: "cree",
    name: "Plains Cree",
    floor: "pit",
    how: [
      "Y-dialect, SRO. Sourced lessons only.",
      "First read of a card pays a small stamp.",
      "He does not invent the rest.",
    ],
  },
  {
    id: "blackjack",
    name: "Blackjack",
    floor: "table",
    how: [
      "Six-deck shoe. House stands on soft 17.",
      "Naturals pay 3:2. Split once. Double any two.",
      "Tyrone whispers the chart. He does not play the hand.",
    ],
  },
  {
    id: "roulette",
    name: "Roulette",
    floor: "table",
    how: [
      "European wheel. One green zero.",
      "Outside even-money dies on zero.",
      "Straight-up pays 35:1 plus your stake back.",
    ],
  },
  {
    id: "poker",
    name: "Jacks or Better",
    floor: "table",
    how: [
      "Five cards. Hold any. One draw.",
      "9/6 full house and flush.",
      "Jacks or better is the floor. Royal is the moon.",
    ],
  },
];

export function emptyArcade(): ArcadeState {
  return {
    triviaSeen: [],
    tfSeen: [],
    scrambleSeen: [],
    creeRead: [],
    earned: { trivia: 0, truefalse: 0, scramble: 0, wordsearch: 0, lockpick: 0, slots: 0, hack: 0, cree: 0, blackjack: 0, roulette: 0, poker: 0 },
    lastGame: null,
  };
}

export function ensureArcade(state: GameState): ArcadeState {
  if (!state.arcade) state.arcade = emptyArcade();
  const a = state.arcade;
  a.triviaSeen ??= [];
  a.tfSeen ??= [];
  a.scrambleSeen ??= [];
  a.creeRead ??= [];
  a.earned ??= emptyArcade().earned;
  const zero = emptyArcade().earned;
  for (const k of Object.keys(zero) as (keyof typeof zero)[]) {
    a.earned[k] ??= 0;
  }
  return a;
}

export function canPlay(state: GameState, game: ArcadeGameId): string | null {
  ensureClocks(state);
  ensureArcade(state);
  if (isVacant(ensureSquad(state))) return "Stamp the black card before you sit.";
  const c = state.clocks;
  if (game === "trivia" || game === "truefalse") {
    if ((c.knowledgeDraws ?? 0) >= KNOWLEDGE_DRAWS) return "Trivia and True / False are dark until midnight Mountain.";
    if (game === "truefalse" && (c.tfLives ?? 0) <= 0) return "True / False lives are spent. Midnight Mountain.";
  }
  if (game === "scramble" && (c.unscramble ?? 0) <= 0) return "All three word boards are used. Midnight Mountain.";
  if (game === "lockpick") {
    if ((c.lockpicks ?? 0) <= 0) return "Lockpick cabinet is tired. Midnight Mountain.";
    if ((state.pack?.bobby_pin ?? 0) <= 0) return "No bobby pins. Forge a night or win one off a board.";
  }
  if (game === "slots" && (c.slots ?? 0) <= 0) return "Slots are dark until midnight Mountain.";
  return null;
}

export function unseenTrivia(state: GameState, cat: string) {
  const seen = new Set(ensureArcade(state).triviaSeen);
  return TRIVIA.filter((q) => q.cat === cat && !seen.has(q.id));
}

export function fairTriviaChoices(pick: string, decoys: string[]) {
  const letters = (s: string) => s.replace(/[^a-z0-9]/gi, "").length;
  const tokens = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
  const want = letters(pick);
  const words = tokens(pick);
  const used: string[] = [];
  const take = (d: string, slack: number) => {
    if (used.length >= 3) return;
    if (!d || d.toLowerCase() === pick.toLowerCase()) return;
    if (used.some((u) => u.toLowerCase() === d.toLowerCase())) return;
    if (tokens(d) !== words) return;
    if (Math.abs(letters(d) - want) > slack) return;
    used.push(d);
  };
  for (const d of decoys) take(d, 1);
  for (const d of SHAPE_DECOYS) take(d, 0);
  for (const d of SHAPE_DECOYS) take(d, 1);
  for (const d of decoys) take(d, 2);
  const a = [pick, ...used.slice(0, 3)];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export const TRIVIA_TIMER: Record<1 | 2 | 3, number> = { 1: 22000, 2: 16000, 3: 11000 };

const SHAPE_DECOYS = [
  "SYNAPSE",
  "SIGNALS",
  "SYSTEMS",
  "SERIALS",
  "CIRCUIT",
  "WARDENS",
  "OVERLAY",
  "HALCYON",
  "AEGISES",
  "HOLLERS",
  "MOONLIT",
  "VAULTED",
  "TERMINI",
  "IRONING",
  "PORCHES",
  "RAIDERS",
  "GHOST",
  "SCOUT",
  "SNEAK",
  "QUIET",
  "BREACH",
  "STANDARD",
  "TERMINUS",
  "BLACKSPIRE",
  "BRASSWATER",
  "IRONCLAD",
  "SLAG TOWN",
  "VEYRA CITY",
  "HALO YARD",
  "IRON GATE",
  "VAULT 13",
  "VAULT 12",
  "VAULT 76",
  "VAULT 11",
  "T-0880",
  "Thirty-Eight",
  "T-2753",
  "T-0013",
  "AEGIS 2753",
  "AEGIS 0880",
  "HALO 2753",
  "T-LINE 13",
  "Dr. Vesper Kane",
  "Dr. Elias Varn",
  "Dr. Victor Halo",
  "Silas Mercer",
  "Victor Halo",
  "Master Brent",
  "The chassis",
  "The hangar",
  "The porch",
  "The wallet",
  "Bottle caps",
  "Hollow ore",
  "Kane scrip",
  "Halo chits",
  "America/Edmonton",
  "America/Denver",
  "America/Phoenix",
  "America/Boise",
  "One quarter",
  "One seventh",
  "One hundred",
  "Medical Bay",
  "Machine Shop",
  "Salvage Bay",
  "Quarters Bay",
  "A human combat pilot",
  "A leftover T-0880",
  "An unmanned Halo",
  "Kane in the cockpit",
  "Intergalactic travel",
  "Mass robot production",
  "Second vault founding",
  "Civilian halo tourism",
  "He walked out of a shutdown",
  "He stole the Halo plates",
  "He minted a crate of caps",
  "He burned the Ironclad gate",
  "Keep your head down, cowboy, go",
  "Trails clear now, wanderer, go",
  "Sleep well then, wanderer, stay",
  "Hold the line, transmission ends",
];

export function unseenTf(state: GameState, cat: string) {
  const seen = new Set(ensureArcade(state).tfSeen);
  return TRUEFALSE.filter((q) => q.cat === cat && !seen.has(q.id));
}

export function unseenScramble(state: GameState) {
  const seen = new Set(ensureArcade(state).scrambleSeen);
  return SCRAMBLE.filter((r) => !seen.has(r.seed));
}

export function spendKnowledge(state: GameState) {
  ensureClocks(state);
  state.clocks.knowledgeDraws = (state.clocks.knowledgeDraws ?? 0) + 1;
}

export function burnTfLife(state: GameState) {
  ensureClocks(state);
  state.clocks.tfLives = Math.max(0, (state.clocks.tfLives ?? 3) - 1);
}

export function spendScrambleBoard(state: GameState) {
  ensureClocks(state);
  state.clocks.unscramble = Math.max(0, (state.clocks.unscramble ?? SCRAMBLE_BOARDS) - 1);
}

export function spendLockpick(state: GameState) {
  ensureClocks(state);
  state.clocks.lockpicks = Math.max(0, (state.clocks.lockpicks ?? LOCKPICKS_DAY) - 1);
  if (state.pack) state.pack.bobby_pin = Math.max(0, state.pack.bobby_pin - 1);
}

export function spendSlot(state: GameState, bet: number): string | null {
  ensureClocks(state);
  if ((state.clocks.slots ?? 0) <= 0) return "Machine is dark.";
  ensureSquad(state);
  const rider = plateMember(state);
  if (isVacant(rider)) return "The floor needs a stamped black card.";
  const n = Math.max(0, Math.floor(Number(rider.personalCaps) || 0));
  rider.personalCaps = n;
  if (n < bet) return `Need ${bet} on the black card.`;
  if (state.activeMemberId !== rider.id) state.activeMemberId = rider.id;
  state.clocks.slots = Math.max(0, (state.clocks.slots ?? SLOTS_DAY) - 1);
  rider.personalCaps = n - bet;
  return null;
}

export function spendPlateBet(state: GameState, bet: number): string | null {
  ensureArcade(state);
  ensureSquad(state);
  const rider = plateMember(state);
  if (isVacant(rider)) return "Stamp the black card before you sit.";
  const n = Math.max(0, Math.floor(Number(rider.personalCaps) || 0));
  rider.personalCaps = n;
  if (n < bet) return `Need ${bet} on the black card.`;
  if (state.activeMemberId !== rider.id) state.activeMemberId = rider.id;
  rider.personalCaps = n - bet;
  return null;
}

function addIntel(state: GameState, loc?: LocationId) {
  if (!loc || !state.locations[loc]) return;
  state.locations[loc].intel = Math.min(6, (state.locations[loc].intel ?? 0) + 1);
}

export function settleArcade(state: GameState, pay: ArcadePayout): void {
  ensureArcade(state);
  ensureClocks(state);
  const caps = Math.max(0, Math.floor(pay.caps));
  const xp = Math.max(0, Math.floor(pay.xp));
  const rider = plateMember(state);
  if (caps) {
    if (pay.game === "slots") {
      const rake = Math.max(1, Math.round(caps * 0.1));
      const net = Math.max(0, caps - rake);
      rider.personalCaps += net;
      state.coins += rake;
      rider.xp += Math.max(1, Math.round(xp * 0.35));
    } else if (pay.game === "blackjack" || pay.game === "roulette" || pay.game === "poker") {
      rider.personalCaps += caps;
      rider.xp += Math.max(1, Math.round(xp * 0.35));
    } else {
      state.coins += caps;
      const cut = Math.max(1, Math.round(caps * 0.25));
      rider.personalCaps += cut;
      rider.xp += Math.max(1, Math.round(xp * 0.35));
    }
  }
  if (xp) grantXp(state, xp);
  if (pay.loc) addIntel(state, pay.loc);
  if (pay.moonFavor) state.moonFavor += pay.moonFavor;
  if (pay.pack) grantPackLoot(state, { source: "Thirty-Eight" });
  if (pay.packKey && !pay.pack) addPack(state, pay.packKey as PackKey, 1);
  const a = state.arcade;
  if (pay.retireId && pay.retireKind === "trivia" && !a.triviaSeen.includes(pay.retireId)) a.triviaSeen.push(pay.retireId);
  if (pay.retireId && pay.retireKind === "tf" && !a.tfSeen.includes(pay.retireId)) a.tfSeen.push(pay.retireId);
  if (pay.retireId && pay.retireKind === "scramble" && !a.scrambleSeen.includes(pay.retireId)) a.scrambleSeen.push(pay.retireId);
  if (pay.retireId && pay.retireKind === "cree" && !a.creeRead.includes(pay.retireId)) a.creeRead.push(pay.retireId);
  a.earned[pay.game] = (a.earned[pay.game] ?? 0) + caps;
  a.lastGame = pay.game;
  const card =
    pay.game === "slots" && caps
      ? ` · +${Math.max(0, caps - Math.max(1, Math.round(caps * 0.1)))} on the card · house ${Math.max(1, Math.round(caps * 0.1))}`
      : (pay.game === "blackjack" || pay.game === "roulette" || pay.game === "poker") && caps
        ? ` · +${caps} on the card`
        : caps
          ? ` · +${Math.max(1, Math.round(caps * 0.25))} on the card`
          : "";
  const line = pay.note + (caps ? ` +${caps} caps${card}` : "") + (xp ? ` · +${xp} XP` : "");
  pushLog(state, "loot", "Thirty-Eight", line);
  state.toast = line;
  if (caps > 0) finishCabinetJob(state, line);
}

export function stampHackWin(state: GameState, caps: number) {
  ensureArcade(state);
  const rider = plateMember(state);
  const cut = Math.max(1, Math.round(Math.max(0, caps) * 0.25));
  rider.personalCaps += cut;
  state.arcade.earned.hack += Math.max(0, caps);
  state.arcade.lastGame = "hack";
  finishCabinetJob(state, `SYNAPSE cracked. +${caps} caps · +${cut} on the card.`);
}

export function triviaPayout(tier: number) {
  return { caps: 16 * tier, xp: 8 * tier };
}

export function scrambleCaps(score: number) {
  return Math.max(0, Math.round(score * 0.7));
}

export function knowledgeLeft(state: GameState) {
  const used = state.clocks?.knowledgeDraws ?? 0;
  return Math.max(0, KNOWLEDGE_DRAWS - used);
}

export function cabinetTotals(state: GameState) {
  const e = ensureArcade(state).earned;
  return (Object.values(e) as number[]).reduce((n, v) => n + v, 0);
}

export function canSpell(word: string, letters: string) {
  const bag = letters.toLowerCase().replace(/[^a-z]/g, "").split("");
  for (const ch of word.toLowerCase()) {
    const i = bag.indexOf(ch);
    if (i < 0) return false;
    bag.splice(i, 1);
  }
  return true;
}

export function creeUnread(state: GameState) {
  const read = new Set(ensureArcade(state).creeRead);
  return CREE.filter((l) => !read.has(l.id));
}
