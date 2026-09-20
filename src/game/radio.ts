import {
  ac,
  addMuteHook,
  addUnlockHook,
  duckAmbient,
  getMusicBus,
  isMuted,
  musicMix,
  setMusicMix,
  setSfxMix,
  sfxMix,
  toggleMute,
} from "./audio";
import { SCORE } from "./opening-reel";
import type { RegionId, Screen } from "./types";

export type RadioBed =
  | "title"
  | "hq"
  | "night"
  | "map"
  | "orbit"
  | "mission"
  | "arcade"
  | RegionId;

export interface RadioTape {
  id: string;
  title: string;
  by: string;
  src: string;
  duration: number;
  beds: RadioBed[];
  blurb: string;
  place: string;
}

/** Drop a file in /public/audio and add a row. Beds pick the tape when follow is on. */
export const RADIO_TAPES: RadioTape[] = [
  {
    id: "keep-the-radio-on",
    title: "Keep the Radio On",
    by: "Vault 13 Radio",
    src: "/audio/keep-the-radio-on.mp3",
    duration: 432,
    beds: ["title", "hq", "night"],
    blurb: "Tyrone on the air. The porch light. Don't touch that dial.",
    place: "Vault 13 porch",
  },
  {
    id: "stranger-of-ironclad",
    title: "The Stranger of Ironclad",
    by: "Vault 13 Radio",
    src: "/audio/the-stranger-of-ironclad.mp3",
    duration: 317,
    beds: ["ironclad", "map", "orbit", "mission"],
    blurb: "A man with a radio and a gun. Dust on a long coat. Silas Mercer in the sand.",
    place: "Ironclad",
  },
  {
    id: "glowin-in-slag-town",
    title: "Glowin' in Slag Town",
    by: "Vault 13 Radio",
    src: "/audio/glowin-in-slag-town.mp3",
    duration: 254,
    beds: ["slagtown", "arcade"],
    blurb: "Friday night by the furnace. Radiation socially unacceptable. Carry on.",
    place: "Slag Town",
  },
  {
    id: "welcome-to-the-thirty-eight",
    title: "Welcome to the Thirty-Eight",
    by: "Vault 13 Radio",
    src: "/audio/welcome-to-the-thirty-eight.mp3",
    duration: 287,
    beds: ["arcade"],
    blurb: "Ladies and gentlemen, wanderers, drifters, scavengers. Step inside and tempt your fate.",
    place: "The Thirty-Eight",
  },
  {
    id: "meet-me-in-veyra",
    title: "Meet Me in Veyra",
    by: "Vault 13 Radio",
    src: "/audio/meet-me-in-veyra.mp3",
    duration: 242,
    beds: ["veyra"],
    blurb: "Silver train, quarter after nine. Neon that never dies. Smile for the observation lens.",
    place: "Veyra City",
  },
  {
    id: "dont-look-up-blackspire",
    title: "Don't Look Up at Blackspire",
    by: "Vault 13 Radio",
    src: "/audio/dont-look-up-at-blackspire.mp3",
    duration: 222,
    beds: ["blackspire"],
    blurb: "No birds. No dogs. The radio knows your name. Keep walking toward the sunrise.",
    place: "Blackspire",
  },
  {
    id: "brasswater-keeps-rollin",
    title: "Brasswater Keeps Rollin'",
    by: "Vault 13 Radio",
    src: "/audio/brasswater-keeps-rollin.mp3",
    duration: 300,
    beds: ["brasswater"],
    blurb: "Lanterns on the boardwalk. A bell under the water. Don't ask questions if you really want to know.",
    place: "Brasswater",
  },
];

const FALLBACK_TAPE: Record<RadioBed, string> = {
  title: "keep-the-radio-on",
  hq: "keep-the-radio-on",
  night: "keep-the-radio-on",
  brasswater: "brasswater-keeps-rollin",
  veyra: "meet-me-in-veyra",
  ironclad: "stranger-of-ironclad",
  map: "stranger-of-ironclad",
  orbit: "stranger-of-ironclad",
  mission: "stranger-of-ironclad",
  blackspire: "dont-look-up-blackspire",
  slagtown: "glowin-in-slag-town",
  arcade: "glowin-in-slag-town",
};

type RadioMode = "tape" | "spot" | "intro" | "score";

interface RadioSpot {
  id: string;
  src: string;
  duration: number;
  beds: RadioBed[];
  label: string;
}

/** Station IDs. Never catalogued. They only fire between songs. */
const RADIO_SPOTS: RadioSpot[] = [
  {
    id: "icr-morning",
    src: "/audio/icr-market-morning.mp3",
    duration: 80,
    beds: ["title", "hq", "ironclad", "map"],
    label: "ICR 88 · Market Square",
  },
  {
    id: "icr-buy",
    src: "/audio/icr-market-buy.mp3",
    duration: 75,
    beds: ["orbit", "mission", "arcade", "slagtown", "brasswater"],
    label: "ICR 88 · Buying salvage",
  },
  {
    id: "icr-night",
    src: "/audio/icr-market-night.mp3",
    duration: 76,
    beds: ["night", "blackspire", "veyra"],
    label: "ICR 88 · Night window",
  },
];

const INTRO_SRC = "/audio/tyrone-found-you.mp3";
const INTRO_DURATION = 94;

const FOLLOW_KEY = "hollow-radio-follow-v1";

type Deck = {
  el: HTMLAudioElement;
  srcNode: MediaElementAudioSourceNode;
  fade: GainNode;
};

let live: Deck | null = null;
let wait: Deck | null = null;
let currentId: string | null = null;
let bed: RadioBed = "title";
let follow = true;
let playing = false;
let unlocked = false;
let deckOpen = false;
let currentTime = 0;
let duration = 0;
let switching = false;
let lastTick = 0;
let mode: RadioMode = "tape";
let pendingTapeId: string | null = null;
let lastSpotId: string | null = null;
let spotLabel = "ICR 88 · Market Square";
let scoreReason: "title" | "boss" | null = null;
let swapGen = 0;
const heardPlaces = new Set<string>();
const REGION_BEDS: RadioBed[] = ["ironclad", "slagtown", "blackspire", "brasswater", "veyra"];

const listeners = new Set<() => void>();
let snapshot: RadioSnapshot = {
  tape: RADIO_TAPES[0],
  bed: "title",
  follow: true,
  playing: false,
  unlocked: false,
  deckOpen: false,
  currentTime: 0,
  duration: RADIO_TAPES[0].duration,
  muted: false,
  music: 0.58,
  sfx: 0.85,
  mode: "tape",
  headline: RADIO_TAPES[0].title,
  subline: RADIO_TAPES[0].place,
  score: null,
};

function applyLoop(on: boolean) {
  if (live) live.el.loop = on;
  if (wait) wait.el.loop = on;
}

function readSnapshot(): RadioSnapshot {
  const tape = tapeById(currentId) ?? (unlocked && mode === "tape" ? tapeForBed(bed) : RADIO_TAPES[0]);
  if (mode === "intro") {
    return {
      tape: null,
      bed,
      follow,
      playing,
      unlocked,
      deckOpen,
      currentTime,
      duration: duration || INTRO_DURATION,
      muted: isMuted(),
      music: musicMix(),
      sfx: sfxMix(),
      mode,
      headline: "Tyrone",
      subline: "East of the highway",
      score: null,
    };
  }
  if (mode === "score") {
    return {
      tape: null,
      bed,
      follow,
      playing,
      unlocked,
      deckOpen,
      currentTime,
      duration: duration || SCORE.duration,
      muted: isMuted(),
      music: musicMix(),
      sfx: sfxMix(),
      mode,
      headline: SCORE.title,
      subline: scoreReason === "boss" ? "Boss fight" : "Title",
      score: scoreReason,
    };
  }
  if (mode === "spot") {
    return {
      tape,
      bed,
      follow,
      playing,
      unlocked,
      deckOpen,
      currentTime,
      duration,
      muted: isMuted(),
      music: musicMix(),
      sfx: sfxMix(),
      mode,
      headline: "Station break",
      subline: spotLabel,
      score: null,
    };
  }
  return {
    tape,
    bed,
    follow,
    playing,
    unlocked,
    deckOpen,
    currentTime,
    duration: duration || (tape?.duration ?? 0),
    muted: isMuted(),
    music: musicMix(),
    sfx: sfxMix(),
    mode,
    headline: tape?.title ?? "Keep the Radio On",
    subline: tape?.place ?? "Vault 13 porch",
    score: null,
  };
}

function emit() {
  snapshot = readSnapshot();
  listeners.forEach((fn) => fn());
}

function loadFollow() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(FOLLOW_KEY);
    if (raw === "0") follow = false;
    if (raw === "1") follow = true;
  } catch {
    /* ignore */
  }
}

if (typeof window !== "undefined") loadFollow();
if (typeof window !== "undefined") snapshot = readSnapshot();

export function tapeById(id: string | null | undefined) {
  return RADIO_TAPES.find((t) => t.id === id) ?? null;
}

export function tapeForBed(next: RadioBed) {
  const hit = RADIO_TAPES.find((t) => t.beds.includes(next));
  if (hit) return hit;
  return tapeById(FALLBACK_TAPE[next]) ?? RADIO_TAPES[0];
}

export function subscribeRadio(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export interface RadioSnapshot {
  tape: RadioTape | null;
  bed: RadioBed;
  follow: boolean;
  playing: boolean;
  unlocked: boolean;
  deckOpen: boolean;
  currentTime: number;
  duration: number;
  muted: boolean;
  music: number;
  sfx: number;
  mode: "tape" | "spot" | "intro" | "score";
  headline: string;
  subline: string;
  score: "title" | "boss" | null;
}

export function getRadioSnapshot(): RadioSnapshot {
  return snapshot;
}

function makeDeck(c: AudioContext, bus: GainNode): Deck {
  const el = new Audio();
  // Beds are 5-10MB. Assigning a src should cost a header, not the whole tape;
  // play() pulls the audio when the player actually hears it.
  el.preload = "metadata";
  el.crossOrigin = "anonymous";
  el.loop = false;
  el.setAttribute("playsinline", "");
  el.setAttribute("webkit-playsinline", "");
  el.setAttribute("aria-hidden", "true");
  el.style.display = "none";
  document.body.appendChild(el);
  const srcNode = c.createMediaElementSource(el);
  const fade = c.createGain();
  fade.gain.value = 0.0001;
  srcNode.connect(fade);
  fade.connect(bus);
  el.addEventListener("timeupdate", () => {
    if (el !== live?.el) return;
    currentTime = el.currentTime;
    if (el.duration && Number.isFinite(el.duration)) duration = el.duration;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - lastTick < 220) return;
    lastTick = now;
    emit();
  });
  el.addEventListener("ended", () => {
    if (el !== live?.el) return;
    void onLiveEnded();
  });
  el.addEventListener("playing", () => {
    if (el !== live?.el) return;
    playing = true;
    duckAmbient(true);
    emit();
  });
  el.addEventListener("pause", () => {
    if (el !== live?.el) return;
    playing = false;
    emit();
  });
  return { el, srcNode, fade };
}

function ensureGraph() {
  const c = ac();
  const bus = getMusicBus();
  if (!c || !bus) return null;
  if (!live) live = makeDeck(c, bus);
  if (!wait) wait = makeDeck(c, bus);
  return { c, live, wait };
}

function fadeTo(node: GainNode, value: number, seconds: number) {
  const c = ac();
  if (!c) return;
  node.gain.cancelScheduledValues(c.currentTime);
  node.gain.setValueAtTime(Math.max(0.0001, node.gain.value), c.currentTime);
  node.gain.exponentialRampToValueAtTime(Math.max(0.0001, value), c.currentTime + seconds);
}

/** Fade a deck out, then pause it — unless a later swap reused it as live. */
function laterPause(deck: Deck | null, ms: number) {
  if (!deck) return;
  const el = deck.el;
  window.setTimeout(() => {
    if (deck === live && playing) return;
    try {
      el.pause();
    } catch {
      /* ignore */
    }
  }, ms);
}

async function readyDeck(el: HTMLAudioElement) {
  if (el.readyState >= 1) return;
  await new Promise<void>((resolve) => {
    const done = () => resolve();
    el.addEventListener("loadedmetadata", done, { once: true });
    el.addEventListener("error", done, { once: true });
    window.setTimeout(done, 1800);
  });
}

async function startDeck(deck: Deck, src: string, volume: number, offset = 0) {
  const abs = new URL(src, window.location.origin).href;
  if (deck.el.src !== abs) {
    deck.el.src = src;
  }
  await readyDeck(deck.el);
  try {
    if (Number.isFinite(offset)) deck.el.currentTime = offset;
  } catch {
    /* ignore */
  }
  fadeTo(deck.fade, volume, offset > 0 ? 0.08 : 0.9);
  deck.el.loop = mode === "score";
  try {
    await deck.el.play();
  } catch {
    playing = false;
  }
}

async function swapTo(src: string, nextDuration: number, force = false) {
  const graph = ensureGraph();
  if (!graph || isMuted()) return;
  if (switching && !force) return;
  const my = ++swapGen;
  switching = true;
  const from = live;
  const to = wait;
  if (!from || !to) {
    switching = false;
    return;
  }
  currentTime = 0;
  duration = nextDuration;
  live = to;
  wait = from;
  fadeTo(from.fade, 0.0001, 1.05);
  laterPause(from, 1100);
  await startDeck(to, src, 1);
  if (my !== swapGen) return;
  duckAmbient(true);
  playing = !to.el.paused;
  unlocked = true;
  switching = false;
  emit();
}

async function crossfade(tape: RadioTape) {
  if (currentId === tape.id && playing && live && mode === "tape") {
    return;
  }
  mode = "tape";
  pendingTapeId = null;
  currentId = tape.id;
  await swapTo(tape.src, tape.duration);
}

function nextTapeId() {
  const idx = Math.max(0, RADIO_TAPES.findIndex((t) => t.id === currentId));
  return RADIO_TAPES[(idx + 1) % RADIO_TAPES.length]!.id;
}

function pickSpot() {
  const ranked = RADIO_SPOTS.filter((s) => s.beds.includes(bed));
  const pool = ranked.length ? ranked : RADIO_SPOTS;
  const avoid = pool.filter((s) => s.id !== lastSpotId);
  const list = avoid.length ? avoid : pool;
  return list[Math.floor(Math.random() * list.length)] ?? null;
}

async function playSpot(spot: RadioSpot) {
  mode = "spot";
  lastSpotId = spot.id;
  spotLabel = spot.label;
  await swapTo(spot.src, spot.duration);
}

async function onLiveEnded() {
  if (mode === "intro") {
    playing = false;
    emit();
    return;
  }
  if (mode === "score") {
    if (live?.el) {
      try {
        live.el.currentTime = 0;
        await live.el.play();
        playing = true;
      } catch {
        playing = false;
      }
      emit();
    }
    return;
  }
  if (mode === "spot") {
    const next = pendingTapeId ?? tapeForBed(bed).id;
    pendingTapeId = null;
    mode = "tape";
    await playTape(next, false);
    return;
  }
  const nextId = follow ? tapeForBed(bed).id : nextTapeId();
  const spot = pickSpot();
  if (spot && !isMuted()) {
    pendingTapeId = nextId;
    await playSpot(spot);
    return;
  }
  await playTape(nextId, false);
}

export async function playTape(id: string, lock = true) {
  if (mode === "score" && scoreReason === "boss") return;
  const tape = tapeById(id);
  if (!tape) return;
  if (lock) {
    follow = false;
    persistFollow();
  }
  unlocked = true;
  scoreReason = null;
  applyLoop(false);
  mode = "tape";
  pendingTapeId = null;
  await crossfade(tape);
}

export function armIntro() {
  applyLoop(false);
  scoreReason = null;
  mode = "intro";
  unlocked = true;
  pendingTapeId = null;
}

export async function playFoundYou() {
  applyLoop(false);
  scoreReason = null;
  unlocked = true;
  mode = "intro";
  pendingTapeId = null;
  currentId = null;
  await swapTo(INTRO_SRC, INTRO_DURATION, true);
}

export function stopFoundYou() {
  if (mode !== "intro") return;
  const dying = live;
  if (dying) {
    fadeTo(dying.fade, 0.0001, 0.6);
    laterPause(dying, 650);
  }
  playing = false;
  mode = "tape";
  emit();
}

export function armScore(reason: "title" | "boss") {
  mode = "score";
  scoreReason = reason;
  unlocked = true;
}

export function getScoreReason() {
  return scoreReason;
}

export async function playScore(reason: "title" | "boss") {
  if (mode === "intro") return;
  if (mode === "score" && scoreReason === reason && playing) return;
  scoreReason = reason;
  mode = "score";
  pendingTapeId = null;
  currentId = null;
  unlocked = true;
  applyLoop(true);
  await swapTo(SCORE.src, SCORE.duration, true);
}

export function stopScore(opts?: { resume?: boolean }) {
  if (mode !== "score") return;
  scoreReason = null;
  applyLoop(false);
  const dying = live;
  if (dying) {
    fadeTo(dying.fade, 0.0001, 0.45);
    laterPause(dying, 500);
  }
  playing = false;
  mode = "tape";
  emit();
  if (opts?.resume) void resumeRadio();
}

export async function startPorchRadio() {
  stopFoundYou();
  stopScore();
  follow = true;
  persistFollow();
  applyLoop(false);
  scoreReason = null;
  const tape = tapeForBed("hq");
  unlocked = true;
  mode = "tape";
  pendingTapeId = null;
  currentId = tape.id;
  await swapTo(tape.src, tape.duration, true);
}

/** QA helper: treat the live cut as finished. */
export async function radioSongEnded() {
  await onLiveEnded();
}

export function pauseRadio() {
  if (live?.el) live.el.pause();
  playing = false;
  duckAmbient(false);
  emit();
}

export async function resumeRadio() {
  if (isMuted()) return;
  if (mode === "intro") {
    if (live && live.el.src) {
      try {
        await live.el.play();
        playing = true;
        duckAmbient(true);
      } catch {
        playing = false;
      }
      emit();
    }
    return;
  }
  if (mode === "score") {
    if (live && live.el.src) {
      applyLoop(true);
      try {
        await live.el.play();
        playing = true;
        duckAmbient(true);
      } catch {
        playing = false;
      }
      emit();
    } else if (scoreReason) {
      await playScore(scoreReason);
    }
    return;
  }
  const tape = tapeById(currentId) ?? tapeForBed(bed);
  unlocked = true;
  if (live && mode === "tape" && currentId === tape.id && live.el.src) {
    fadeTo(live.fade, 1, 0.25);
    try {
      await live.el.play();
      playing = true;
      duckAmbient(true);
    } catch {
      playing = false;
    }
    emit();
    return;
  }
  await playTape(tape.id, false);
}

export function toggleRadioPlay() {
  if (playing) pauseRadio();
  else void resumeRadio();
}

export async function playNext(fromEnd = false) {
  if (mode === "intro" || mode === "score") return;
  if (mode === "spot") {
    const next = pendingTapeId ?? (follow ? tapeForBed(bed).id : nextTapeId());
    pendingTapeId = null;
    await playTape(next, !fromEnd || !follow);
    return;
  }
  if (fromEnd) {
    await onLiveEnded();
    return;
  }
  await playTape(nextTapeId(), true);
}

export async function playPrev() {
  if (mode === "intro" || mode === "score") return;
  if (mode === "spot") {
    const tape = tapeById(currentId);
    if (tape) {
      pendingTapeId = null;
      await playTape(tape.id, true);
      return;
    }
  }
  const idx = Math.max(0, RADIO_TAPES.findIndex((t) => t.id === currentId));
  const prev = RADIO_TAPES[(idx - 1 + RADIO_TAPES.length) % RADIO_TAPES.length];
  await playTape(prev.id, true);
}

export function seekRadio(seconds: number) {
  if (!live || mode !== "tape") return;
  live.el.currentTime = Math.max(0, Math.min(seconds, live.el.duration || duration));
  currentTime = live.el.currentTime;
  emit();
}

export function setRadioBed(next: RadioBed) {
  if (bed === next) return;
  bed = next;
  emit();
}

/** First visit to a region cuts to that tape. Menus never skip the live song. */
export function arriveRegion(region: RadioBed) {
  bed = region;
  emit();
  if (mode === "intro" || mode === "spot" || mode === "score") return;
  if (!follow || !unlocked) return;
  if (heardPlaces.has(region)) return;
  heardPlaces.add(region);
  const tape = tapeForBed(region);
  if (tape.id !== currentId) void playTape(tape.id, false);
}

export function isRegionBed(next: RadioBed) {
  return REGION_BEDS.includes(next);
}

/** Door sting for the casino. Manual deck still lists the tape. */
export async function enterCasinoRadio() {
  const tape = tapeById("welcome-to-the-thirty-eight");
  if (!tape) return;
  bed = "arcade";
  emit();
  if (mode === "intro" || mode === "score") return;
  if (currentId === tape.id && playing) return;
  unlocked = true;
  await playTape(tape.id, false);
}

export function setFollow(next: boolean) {
  follow = next;
  persistFollow();
  emit();
}

function persistFollow() {
  try {
    localStorage.setItem(FOLLOW_KEY, follow ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function openRadioDeck() {
  deckOpen = true;
  emit();
}

export function closeRadioDeck() {
  deckOpen = false;
  emit();
}

export function toggleRadioDeck() {
  deckOpen = !deckOpen;
  emit();
}

export function setRadioMusic(value: number) {
  setMusicMix(value);
  emit();
}

export function setRadioSfx(value: number) {
  setSfxMix(value);
  emit();
}

export function toggleRadioMute() {
  const next = toggleMute();
  emit();
  return next;
}

export function bedFromGame(input: {
  screen: Screen;
  region: RegionId | null;
  loc?: string | null;
  mission: boolean;
  combat: boolean;
  watch?: string;
}): RadioBed {
  if (input.combat || input.mission) return "mission";
  if (input.screen === "title" || input.screen === "rules" || input.screen === "briefing") return "title";
  if (input.screen === "arcade") return "arcade";
  if (input.screen === "map") {
    if (input.region) return input.region;
    if (input.loc && input.loc in FALLBACK_TAPE) return input.loc as RadioBed;
    return "orbit";
  }
  if (input.watch === "night") return "night";
  return "hq";
}

/** Title and boss share one score. The porch radio never catalogs it. */
export type ScoreCue = "title" | "boss" | "hold" | "stop";

export function scoreCueForGame(input: { screen: Screen; boss: boolean }): ScoreCue {
  if (input.boss) return "boss";
  if (input.screen === "briefing" || input.screen === "gallery") return "hold";
  if (input.screen === "title" || input.screen === "rules") return "title";
  return "stop";
}

if (typeof window !== "undefined") {
  addUnlockHook(() => {
    unlocked = true;
    if (live?.el && playing && live.el.paused) void resumeRadio();
  });
  addMuteHook((next) => {
    if (next) {
      if (live?.el) live.el.pause();
      playing = false;
    } else if (unlocked) {
      void resumeRadio();
    }
    emit();
  });
}
