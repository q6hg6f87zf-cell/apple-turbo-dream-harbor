import { sfx, unlockAudio } from "@/game/audio";
import { cloneState } from "@/game/engine";
import { currentPorch, watchPorch, type PorchSnapshot } from "@/game/porch";
import { useGame } from "@/game/store";
import {
  BOOT_LINES,
  emptyTerm,
  homeChoices,
  pageBody,
  pageChoices,
  termLog,
  type TermChoice,
} from "@/game/terminal";
import type { GameState, HackState, LogEntry, TermPage } from "@/game/types";
import { Cpu, ShieldAlert, Terminal, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

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
      state.coins += 3000;
      pushLog(state, "Hidden terminal breach: T-0880 challenge coin recovered. +3,000 bottle caps.");
      state.toast = "Terminal cracked. +3,000 bottle caps.";
      h.log = [...h.log, "ACCOUNT OVERRIDE", "+3,000 BOTTLE CAPS TRANSFERRED", "EASTER EGG // T-0880 CHALLENGE COIN RECOVERED"];
    } else {
      const drip = 40 + Math.floor(Math.random() * 25);
      state.coins += drip;
      state.toast = `Already drained. +${drip} caps in the tray.`;
      h.log = [...h.log, "VAULT ACCOUNT: MOSTLY EMPTY", `TYRONE: "You already cleaned that crate."`, `+${drip} CAPS IN THE TRAY`];
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

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let installed = false;

export function EliteTerminalRuntime() {
  useEffect(() => {
    if (installed) return;
    installed = true;
    const original = useGame.getState();
    const originalPick = original.hackPick;
    const originalBracket = original.hackBracket;
    const originalBreach = original.termBreach;

    useGame.setState({
      termBreach: () => {
        let message: string | null = null;
        useGame.setState((store) => {
          const s = cloneState(store.s);
          if (!s.term) s.term = emptyTerm();
          message = openEliteHack(s);
          if (message) {
            s.toast = message;
            termLog(s, message);
            s.term.page = "home";
            s.term.booted = true;
          } else {
            s.term.page = "lock";
            s.term.booted = true;
          }
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
      useGame.setState({ termBreach: originalBreach, hackPick: originalPick, hackBracket: originalBracket });
    };
  }, []);
  return null;
}

function usePorchSnap() {
  const [snap, setSnap] = useState<PorchSnapshot>(currentPorch);
  useEffect(() => watchPorch(setSnap), []);
  return snap;
}

function CrtShell({
  children,
  session,
  page,
  onClose,
}: {
  children: ReactNode;
  session: string;
  page: TermPage | "dump";
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-ink/92 p-2 backdrop-blur-[2px] md:items-center md:p-4"
      data-terminal-session={session}
      data-terminal-page={page}
    >
      <div className="term-bezel relative flex h-[min(96dvh,840px)] w-full max-w-2xl flex-col overflow-hidden">
        <div className="term-screen relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="crt-scan pointer-events-none absolute inset-0 opacity-50" />
          <div className="term-flicker pointer-events-none absolute inset-0" />
          <header className="relative z-[1] flex items-start justify-between gap-3 border-b border-ember/25 px-4 py-3">
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ember">S.Y.N.A.P.S.E ACCESS PROTOCOL</div>
              <div className="mt-1 font-mono text-[11px] text-ember-bright">Vault 13 · SYNAPSE · T-0880</div>
            </div>
            <button
              type="button"
              aria-label="Jack out"
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-[var(--radius-xs)] border border-ember/25 text-ember/70 hover:text-ember"
            >
              <X className="size-4" />
            </button>
          </header>
          <div className="relative z-[1] min-h-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

function BootView({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<string[]>(reducedMotion() ? [...BOOT_LINES] : []);
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (reducedMotion()) {
      onDoneRef.current();
      return;
    }
    let i = 0;
    let timer = 0;
    const tick = () => {
      if (done.current) return;
      if (i >= BOOT_LINES.length) {
        timer = window.setTimeout(() => onDoneRef.current(), 280);
        return;
      }
      const line = BOOT_LINES[i++] ?? "";
      sfx.termType(Math.max(2, line.length));
      setLines((prev) => [...prev, line]);
      timer = window.setTimeout(tick, line ? 70 + Math.min(160, line.length * 9) : 160);
    };
    timer = window.setTimeout(tick, 120);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <button
      type="button"
      className="term-phosphor flex h-full w-full flex-col justify-start px-5 py-5 text-left font-mono text-[13px] leading-relaxed text-ember-bright"
      onClick={() => {
        done.current = true;
        setLines([...BOOT_LINES]);
        sfx.termType(8);
        onDone();
      }}
    >
      {lines.map((line, i) => (
        <div key={`${i}-${line}`} className="min-h-5">
          {line || "\u00a0"}
        </div>
      ))}
      <span className="term-cursor mt-1" />
    </button>
  );
}

function FileList({
  choices,
  onPick,
}: {
  choices: TermChoice[];
  onPick: (choice: TermChoice) => void;
}) {
  return (
    <div className="mt-3 space-y-1">
      {choices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          data-term-choice={choice.id}
          onClick={() => onPick(choice)}
          className="term-choice flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-xs)] px-2 text-left font-mono text-[13px] tracking-[0.04em] text-ember-bright"
        >
          <span className="w-7 shrink-0 text-ember">[{choice.id}]</span>
          <span>{choice.label}</span>
        </button>
      ))}
    </div>
  );
}

function ShellView({ page }: { page: TermPage }) {
  const state = useGame((store) => store.s);
  const output = state.term?.output ?? [];
  const pick = useGame((store) => store.termSelect);
  const breach = useGame((store) => store.termBreach);
  const go = useGame((store) => store.termGo);
  const close = useGame((store) => store.closeTerminal);
  const porch = usePorchSnap();
  const logRef = useRef<HTMLDivElement>(null);
  const body = pageBody(state, page);
  const choices = page === "home" ? homeChoices(state) : pageChoices(page);
  const porchLines =
    page === "porch"
      ? porch.seats.length
        ? porch.seats.map(
            (seat) =>
              `${seat.self ? ">" : " "} ${(seat.name || "Rider").slice(0, 14).padEnd(14)} ${seat.handle ? `@${seat.handle.replace(/^@/, "")}` : ""}  ${seat.screen}`,
          )
        : [`Live stools ${porch.live}/${porch.max}`, porch.full ? "THE PORCH HOLDS TEN. WAIT." : "No other riders on the wire."]
      : [];

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [output.length, page]);

  const run = (choice: TermChoice) => {
    unlockAudio();
    sfx.termType(Math.max(3, choice.label.length));
    const result = pick(choice);
    if (result === "logoff") {
      sfx.machine();
      return;
    }
    if (result === "breach") {
      const message = breach();
      if (message) sfx.deny();
      else sfx.hack();
      return;
    }
    if (result === "nav") sfx.click();
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (page === "home" || page === "boot") close();
        else go("home");
        sfx.termKey();
        return;
      }
      const hit = choices.find((choice) => choice.id === event.key);
      if (hit) {
        event.preventDefault();
        run(hit);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div ref={logRef} className="term-phosphor ms-scroll flex h-full flex-col overflow-y-auto px-5 py-4 font-mono text-[13px] leading-relaxed text-ember-bright">
      <div className="text-ember">{BOOT_LINES[0]}</div>
      <div className="text-ember/80">{BOOT_LINES[1]}</div>
      <div className="mb-3 text-ember/70">{BOOT_LINES[2]}</div>
      {body.map((line, i) => (
        <div key={`b-${i}`}>{line || "\u00a0"}</div>
      ))}
      {porchLines.map((line, i) => (
        <div key={`p-${i}`} className="whitespace-pre">
          {line}
        </div>
      ))}
      {output.length ? <div className="mt-3 text-ember/70">{output.slice(-6).map((line, i) => <div key={`o-${i}`}>{line}</div>)}</div> : null}
      <div className="term-prompt mt-3 text-ember">{">"}</div>
      <FileList choices={choices} onPick={run} />
      <span className="term-cursor mt-2" />
    </div>
  );
}

function DumpView({ hack }: { hack: EliteHack }) {
  const close = useGame((store) => store.closeTerminal);
  const go = useGame((store) => store.termGo);
  const pick = useGame((store) => store.hackPick);
  const bracket = useGame((store) => store.hackBracket);
  const logRef = useRef<HTMLDivElement>(null);
  const elite = typeof hack.difficulty === "number";
  const difficulty = hack.difficulty ?? 1;
  const trace = hack.trace ?? 0;
  const brackets = hack.bracketsLeft ?? (hack.dudsLeft.length ? 1 : 0);
  const guessed = hack.guessed ?? [];
  const rows = elite
    ? hack.dumpRows
    : hack.words.map((word, i) => ({
        address: `0x${(0xf100 + i * 13).toString(16).toUpperCase()}`,
        prefix: garbage(8),
        word,
        suffix: garbage(8),
      }));

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [hack.log.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        sfx.termKey();
        go("home");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const choose = (word: string) => {
    if (hack.won || hack.locked || guessed.includes(word)) return;
    unlockAudio();
    navigator.vibrate?.(8);
    sfx.hack();
    sfx.termType(word.length);
    const result = pick(word);
    if (result === "won") sfx.unlock();
    else if (result === "denied" || result === "lock") sfx.deny();
  };

  return (
    <div className="flex h-full min-h-0 flex-col" data-terminal-difficulty={difficulty} data-hack-session={hack.sessionId ?? "legacy"}>
      <div className="relative z-[1] border-b border-ember/20 px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 items-center justify-center rounded border border-ember/30 bg-ember/5 text-ember">
            <Terminal className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ember">S.Y.N.A.P.S.E // BLACK CHANNEL</div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-ember-bright">
              <span>DEPTH {difficulty}/5</span>
              <span>{hack.password.length}-CHAR TOKEN</span>
              <span>{hack.won ? "ACCESS GRANTED" : hack.locked ? "HARD LOCK" : `${hack.tries}/${hack.triesMax} PROBES`}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <ShieldAlert className="size-3.5 text-ember" />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink shadow-inner">
            <div className="h-full bg-ember transition-[width] duration-500" style={{ width: `${trace}%` }} />
          </div>
          <span className="w-20 text-right font-mono text-[10px] text-ember">TRACE {trace}%</span>
        </div>
      </div>

      <div ref={logRef} className="relative z-[1] max-h-40 overflow-y-auto border-b border-ember/15 bg-ink/30 px-4 py-3 font-mono text-[11px] leading-relaxed text-ember-bright ms-scroll">
        {hack.log.map((line, index) => (
          <div key={`${index}-${line}`}>{line}</div>
        ))}
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
                className="group grid min-h-12 grid-cols-[4.5rem_1fr] items-center gap-2 rounded border border-ember/15 bg-ink/20 px-2 text-left font-mono transition-colors hover:border-ember/45 hover:bg-ember/10 disabled:opacity-35"
              >
                <span className="text-[9px] text-ember/55">{row.address}</span>
                <span className="min-w-0 overflow-hidden whitespace-nowrap text-[10px] tracking-[0.08em] text-ember/50">
                  {row.prefix}
                  <strong className="mx-1 text-xs tracking-[0.15em] text-ember-bright group-hover:text-paper">{row.word}</strong>
                  {row.suffix}
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
            sfx.termKey();
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
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              sfx.termType(4);
              go("home");
            }}
            className="flex min-h-11 items-center justify-center rounded border border-ember/20 font-mono text-[10px] uppercase tracking-[0.16em] text-ember"
          >
            Return to root
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.machine();
              close();
            }}
            className="flex min-h-11 items-center justify-center rounded border border-ember/20 font-mono text-[10px] uppercase tracking-[0.16em] text-ember"
          >
            Log off
          </button>
        </div>
      </div>
    </div>
  );
}

export function EliteTerminalOverlay() {
  const term = useGame((store) => store.s.term);
  const hack = useGame((store) => store.s.hack) as EliteHack | null;
  const close = useGame((store) => store.closeTerminal);
  const go = useGame((store) => store.termGo);

  if (!term && !hack) return null;

  const session = term?.sessionId ?? hack?.sessionId ?? "legacy";
  const page = term?.page ?? "lock";
  const jackOut = () => {
    unlockAudio();
    sfx.machine();
    close();
  };

  if (page === "boot" && term && !term.booted) {
    return (
      <CrtShell session={session} page="boot" onClose={jackOut}>
        <BootView onDone={() => go("home")} />
      </CrtShell>
    );
  }

  if ((page === "lock" || !term) && hack) {
    return (
      <CrtShell session={hack.sessionId ?? session} page="dump" onClose={jackOut}>
        <DumpView hack={hack} />
      </CrtShell>
    );
  }

  return (
    <CrtShell session={session} page={page} onClose={jackOut}>
      <ShellView page={page === "boot" ? "home" : page} />
    </CrtShell>
  );
}
