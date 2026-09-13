import { sfx, unlockAudio } from "@/game/audio";
import { cloneState } from "@/game/engine";
import { useGame } from "@/game/store";
import type { GameState, HackState, LogEntry } from "@/game/types";
import { Cpu, ShieldAlert, Terminal, X } from "lucide-react";
import { useEffect, useRef } from "react";

type DumpRow = {
  address: string;
  prefix: string;
  word: string;
  suffix: string;
};

type EliteHack = HackState & {
  difficulty: number;
  trace: number;
  bracketsLeft: number;
  guessed: string[];
  dumpRows: DumpRow[];
  sessionId: string;
};

type ExtendedState = GameState & { terminalLockUntil?: number };

const CONSONANTS = "BCDFGHJKLMNPQRSTVWXYZ";
const VOWELS = "AEIOU";
const GARBAGE = "()[]{}<>!@#$%^&*-+=?/\\|:;~.";

function randomInt(max: number) {
  return Math.floor(Math.random() * Math.max(1, max));
}

function randomFrom(chars: string) {
  return chars[randomInt(chars.length)]!;
}

function shuffle<T>(source: T[]) {
  const a = source.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function synthWord(length: number) {
  let out = "";
  let vowel = Math.random() < 0.42;
  for (let i = 0; i < length; i++) {
    const pool = vowel ? VOWELS : CONSONANTS;
    out += randomFrom(pool);
    const flip = Math.random();
    vowel = vowel ? flip > 0.2 : flip < 0.68;
  }
  return out;
}

function mutateToLikeness(password: string, target: number) {
  const indexes = shuffle([...password].map((_, i) => i));
  const keep = new Set(indexes.slice(0, Math.max(0, Math.min(password.length - 1, target))));
  return [...password]
    .map((char, i) => {
      if (keep.has(i)) return char;
      const pool = VOWELS.includes(char) ? VOWELS : CONSONANTS;
      let next = char;
      while (next === char) next = randomFrom(pool);
      return next;
    })
    .join("");
}

function likeness(a: string, b: string) {
  let score = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] === b[i]) score += 1;
  return score;
}

function garbage(length: number) {
  let out = "";
  for (let i = 0; i < length; i++) out += randomFrom(GARBAGE);
  return out;
}

function buildCandidates(password: string, difficulty: number) {
  const count = 12 + difficulty * 2;
  const words = new Set<string>([password]);
  const maxClue = Math.min(password.length - 1, 3 + difficulty);
  const targets = shuffle([
    ...Array.from({ length: maxClue + 1 }, (_, i) => i),
    ...Array.from({ length: count * 2 }, () => randomInt(maxClue + 1)),
  ]);
  let cursor = 0;
  while (words.size < count && cursor < 300) {
    const target = targets[cursor % targets.length] ?? randomInt(maxClue + 1);
    words.add(mutateToLikeness(password, target));
    cursor += 1;
  }
  while (words.size < count) words.add(synthWord(password.length));
  return shuffle([...words]);
}

function buildDumpRows(words: string[]) {
  const base = 0xf000 + randomInt(0x800);
  return words.map((word, i) => ({
    address: `0x${(base + i * 0x0d).toString(16).toUpperCase()}`,
    prefix: garbage(7 + randomInt(5)),
    word,
    suffix: garbage(7 + randomInt(5)),
  }));
}

function difficultyFor(state: GameState) {
  const campaign = Math.floor(Math.max(0, state.day - 1) / 22);
  const command = Math.floor(Math.max(0, state.level - 1) / 3);
  return Math.max(1, Math.min(5, 1 + campaign + command));
}

function pushLog(state: GameState, what: string) {
  const row: LogEntry = {
    id: `term-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    day: state.day,
    kind: "note",
    who: "T-0880",
    what,
  };
  state.log = [row, ...state.log].slice(0, 80);
}

function openEliteHack(state: GameState): string | null {
  const extended = state as ExtendedState;
  if (state.hack) return null;
  const now = Date.now();
  const lockedByTime = (extended.terminalLockUntil ?? 0) > now;
  const lockedByDay = state.started && state.terminalLockDay > state.day;
  if ((lockedByTime || lockedByDay) && state.hackProbes <= 0) {
    const seconds = Math.max(0, Math.ceil(((extended.terminalLockUntil ?? now) - now) / 1000));
    return state.started
      ? "Terminal trace lock. Wait for dawn or seat a probe kit."
      : `Terminal trace lock. Cooldown ${Math.max(1, Math.ceil(seconds / 60))}m.`;
  }

  const difficulty = difficultyFor(state);
  const length = 6 + Math.min(4, difficulty - 1);
  const password = synthWord(length);
  const words = buildCandidates(password, difficulty);
  const extra = Math.min(2, Math.max(0, state.hackProbes));
  if (state.hackProbes > 0) state.hackProbes = Math.max(0, state.hackProbes - extra);
  const triesMax = Math.max(3, 5 - Math.floor(difficulty / 2)) + extra;
  const hack: EliteHack = {
    words,
    password,
    tries: triesMax,
    triesMax,
    dudsLeft: words.filter((word) => word !== password),
    log: [
      "S.Y.N.A.P.S.E // T-0880 BLACK CHANNEL",
      `SECURITY DEPTH ${difficulty}/5 · TOKEN LENGTH ${length}`,
      `${triesMax} MEMORY PROBE${triesMax === 1 ? "" : "S"} AVAILABLE`,
      "Select a token. LIKENESS = exact-position matches.",
      "Delimiter exploits may erase a dud or recover a probe.",
    ],
    lastLikeness: null,
    locked: false,
    won: false,
    difficulty,
    trace: 0,
    bracketsLeft: Math.max(1, 4 - Math.floor(difficulty / 2)),
    guessed: [],
    dumpRows: buildDumpRows(words),
    sessionId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
  };
  state.hack = hack;
  state.terminalLockDay = 0;
  extended.terminalLockUntil = 0;
  return null;
}

function guessElite(state: GameState, raw: string): "ok" | "denied" | "lock" | "won" | "idle" {
  const h = state.hack as EliteHack | null;
  if (!h || h.locked || h.won) return "idle";
  const word = raw.toUpperCase();
  if (!h.words.includes(word) || h.guessed.includes(word)) return "idle";
  h.guessed = [...h.guessed, word];

  if (word === h.password) {
    h.won = true;
    h.trace = Math.min(100, h.trace);
    h.log = [...h.log, `>${word}`, "EXACT MATCH", "BLACK CHANNEL OPEN", "T-0880 ARCHIVE HANDSHAKE ACCEPTED"];
    if (!state.terminalDrained) {
      state.terminalDrained = true;
      state.challengeCoin = true;
      pushLog(state, "Hidden terminal breach: T-0880 challenge coin recovered.");
      state.toast = "Black channel cracked. T-0880 challenge coin unlocked.";
      h.log = [...h.log, "EASTER EGG // T-0880 CHALLENGE COIN RECOVERED", "NO ECONOMY MUTATION AUTHORIZED"];
    } else {
      state.toast = "Black channel reopened. The archive remembers you.";
      h.log = [...h.log, "ARCHIVE RECOGNIZES PRIOR BREACH", "CACHE ALREADY RECOVERED"];
    }
    return "won";
  }

  h.tries -= 1;
  const like = likeness(word, h.password);
  h.lastLikeness = like;
  const pressure = Math.round(15 + h.difficulty * 5 + (1 - h.tries / Math.max(1, h.triesMax)) * 8);
  h.trace = Math.min(99, h.trace + pressure);
  h.log = [...h.log, `>${word}`, "ENTRY DENIED", `LIKENESS ${like}/${h.password.length}`, `TRACE ${h.trace}%`];

  if (h.tries <= 0) {
    h.locked = true;
    const extended = state as ExtendedState;
    const minutes = 2 + h.difficulty * 2;
    extended.terminalLockUntil = Date.now() + minutes * 60_000;
    if (state.started) state.terminalLockDay = state.day + 1;
    h.trace = 100;
    h.log = [...h.log, "TRACE COMPLETE", "TERMINAL HARD LOCK", state.started ? "DAWN RESET OR PROBE OVERRIDE REQUIRED" : `COOLDOWN ${minutes} MINUTES`];
    state.toast = state.started ? "Terminal hard-lock. Dawn or probe kit." : `Terminal hard-lock. ${minutes} minute cooldown.`;
    return "lock";
  }

  h.log = [...h.log, `${h.tries} PROBE${h.tries === 1 ? "" : "S"} REMAIN`];
  return "denied";
}

function exploitElite(state: GameState): string | null {
  const h = state.hack as EliteHack | null;
  if (!h || h.locked || h.won) return "No live terminal exploit.";
  if (h.bracketsLeft <= 0) return "No delimiter pairs remain.";
  h.bracketsLeft -= 1;

  const canRestore = h.tries < h.triesMax;
  const restoreChance = Math.max(0.12, 0.3 - h.difficulty * 0.035);
  if (canRestore && Math.random() < restoreChance) {
    h.tries += 1;
    h.trace = Math.max(0, h.trace - 8);
    h.log = [...h.log, ">[ ]", "MEMORY PROBE RESTORED", `TRACE ${h.trace}%`];
    return null;
  }

  const candidates = h.dudsLeft.filter((word) => h.words.includes(word) && !h.guessed.includes(word));
  if (!candidates.length) {
    h.trace = Math.max(0, h.trace - 5);
    h.log = [...h.log, ">{ }", "BUFFER SCRUBBED", `TRACE ${h.trace}%`];
    return null;
  }
  const gone = candidates[randomInt(candidates.length)]!;
  h.dudsLeft = h.dudsLeft.filter((word) => word !== gone);
  h.words = h.words.filter((word) => word !== gone);
  h.dumpRows = h.dumpRows.filter((row) => row.word !== gone);
  h.log = [...h.log, ">< >", `DUD PURGED // ${gone}`];
  return null;
}

let installed = false;

export function EliteTerminalRuntime() {
  useEffect(() => {
    if (installed) return;
    installed = true;
    const original = useGame.getState();
    const originalOpen = original.openTerminal;
    const originalPick = original.hackPick;
    const originalBracket = original.hackBracket;

    useGame.setState({
      openTerminal: () => {
        let message: string | null = null;
        useGame.setState((store) => {
          const s = cloneState(store.s);
          message = openEliteHack(s);
          if (message) s.toast = message;
          return { s };
        });
        return message;
      },
      hackPick: (word) => {
        let result: "ok" | "denied" | "lock" | "won" | "idle" = "idle";
        useGame.setState((store) => {
          const s = cloneState(store.s);
          result = guessElite(s, word);
          return { s };
        });
        return result;
      },
      hackBracket: () => {
        let message: string | null = null;
        useGame.setState((store) => {
          const s = cloneState(store.s);
          message = exploitElite(s);
          return { s };
        });
        return message;
      },
    });

    return () => {
      installed = false;
      useGame.setState({ openTerminal: originalOpen, hackPick: originalPick, hackBracket: originalBracket });
    };
  }, []);
  return null;
}

export function EliteTerminalOverlay() {
  const hack = useGame((store) => store.s.hack) as EliteHack | null;
  const close = useGame((store) => store.closeTerminal);
  const pick = useGame((store) => store.hackPick);
  const bracket = useGame((store) => store.hackBracket);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [hack?.log.length]);

  useEffect(() => {
    if (!hack) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hack, close]);

  if (!hack) return null;
  const elite = typeof hack.difficulty === "number";
  const difficulty = hack.difficulty ?? 1;
  const trace = hack.trace ?? 0;
  const brackets = hack.bracketsLeft ?? (hack.dudsLeft.length ? 1 : 0);
  const guessed = hack.guessed ?? [];
  const rows = elite
    ? hack.dumpRows
    : hack.words.map((word, i) => ({ address: `0x${(0xf100 + i * 13).toString(16).toUpperCase()}`, prefix: garbage(8), word, suffix: garbage(8) }));

  const choose = (word: string) => {
    if (hack.won || hack.locked || guessed.includes(word)) return;
    unlockAudio();
    navigator.vibrate?.(8);
    sfx.hack();
    const result = pick(word);
    if (result === "won") sfx.unlock();
    else if (result === "denied" || result === "lock") sfx.deny();
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/90 p-2 backdrop-blur-sm md:items-center md:p-4"
      data-terminal-session={hack.sessionId ?? "legacy"}
      data-terminal-difficulty={difficulty}
    >
      <div className="term-screen relative flex h-[min(96dvh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-ember/30 shadow-2xl">
        <div className="crt-scan pointer-events-none absolute inset-0 opacity-45" />
        <header className="relative z-[1] border-b border-ember/25 bg-ink/85 px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 items-center justify-center rounded border border-ember/30 bg-ember/5 text-ember"><Terminal className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ember">S.Y.N.A.P.S.E // BLACK CHANNEL</div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-ember-bright">
                <span>DEPTH {difficulty}/5</span>
                <span>{hack.password.length}-CHAR TOKEN</span>
                <span>{hack.won ? "ACCESS GRANTED" : hack.locked ? "HARD LOCK" : `${hack.tries}/${hack.triesMax} PROBES`}</span>
              </div>
            </div>
            <button type="button" aria-label="Jack out" onClick={close} className="flex size-10 items-center justify-center rounded border border-ember/20 text-ember/70 hover:text-ember"><X className="size-4" /></button>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <ShieldAlert className="size-3.5 text-ember" />
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink shadow-inner">
              <div className="h-full bg-ember transition-[width] duration-500" style={{ width: `${trace}%` }} />
            </div>
            <span className="w-20 text-right font-mono text-[10px] text-ember">TRACE {trace}%</span>
          </div>
        </header>

        <div ref={logRef} className="relative z-[1] max-h-44 overflow-y-auto border-b border-ember/15 bg-black/25 px-4 py-3 font-mono text-[11px] leading-relaxed text-ember-bright ms-scroll">
          {hack.log.map((line, index) => <div key={`${index}-${line}`}>{line}</div>)}
          <span className="term-cursor" />
        </div>

        <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto p-3 ms-scroll">
          <div className="grid gap-1.5 sm:grid-cols-2">
            {rows.map((row) => {
              const disabled = hack.won || hack.locked || guessed.includes(row.word) || !hack.words.includes(row.word);
              return (
                <button
                  key={`${row.address}-${row.word}`}
                  type="button"
                  disabled={disabled}
                  data-terminal-token={row.word}
                  onClick={() => choose(row.word)}
                  className="group grid min-h-12 grid-cols-[4.5rem_1fr] items-center gap-2 rounded border border-ember/15 bg-black/20 px-2 text-left font-mono transition-colors hover:border-ember/45 hover:bg-ember/10 disabled:opacity-35"
                >
                  <span className="text-[9px] text-ember/55">{row.address}</span>
                  <span className="min-w-0 overflow-hidden whitespace-nowrap text-[10px] tracking-[0.08em] text-ember/50">
                    {row.prefix}<strong className="mx-1 text-xs tracking-[0.15em] text-ember-bright group-hover:text-paper">{row.word}</strong>{row.suffix}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={hack.won || hack.locked || brackets <= 0}
            onClick={() => {
              navigator.vibrate?.(6);
              sfx.click();
              const message = bracket();
              if (message) useGame.setState((store) => ({ s: { ...store.s, toast: message } }));
              else sfx.hack();
            }}
            className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded border border-ember/20 bg-ember/5 font-mono text-[10px] uppercase tracking-[0.18em] text-ember transition-colors hover:bg-ember/10 disabled:opacity-35"
          >
            <Cpu className="size-3.5" /> Exploit delimiter · {brackets} remaining
          </button>
          <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-ember/55">
            Tokens are synthesized per breach. No static password dictionary is loaded.
          </p>
        </div>
      </div>
    </div>
  );
}
