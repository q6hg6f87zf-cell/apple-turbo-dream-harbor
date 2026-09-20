import { Button } from "@/components/ui/button";
import {
  burnTfLife,
  canPlay,
  knowledgeLeft,
  scrambleCaps,
  SCRAMBLE_MS,
  SCRAMBLE_PAY,
  spendKnowledge,
  spendScrambleBoard,
  triviaPayout,
  unseenScramble,
  unseenTf,
  unseenTrivia,
  fairTriviaChoices,
  TRIVIA_TIMER,
} from "@/game/arcade";
import { TRIVIA_CATS, type TriviaCard, type TfCard } from "@/game/arcade-banks";
import { sfx, startHeartBed, stopHeartBed } from "@/game/audio";
import { addTrauma, punchClick } from "@/game/juice";
import { AHA_MS } from "@/game/neuro";
import { anagramsOf, shuffleLetters } from "@/game/words";
import { useGame } from "@/game/store";
import { cn } from "@/lib/cn";
import { useEffect, useMemo, useRef, useState } from "react";

function tap(e: React.MouseEvent, ok?: boolean) {
  punchClick(e.clientX, e.clientY);
  if (ok) sfx.coin();
  else sfx.click();
}

export function TriviaPlay({ onDone }: { onDone: () => void }) {
  const s = useGame((g) => g.s);
  const settle = useGame((g) => g.settleArcade);
  const run = useGame((g) => g.mutateArcade);
  const [cat, setCat] = useState<string | null>(null);
  const [card, setCard] = useState<TriviaCard | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<"hit" | "miss" | "time" | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [aha, setAha] = useState(false);
  const [streak, setStreak] = useState(0);
  const [endsAt, setEndsAt] = useState(0);
  const [left, setLeft] = useState(0);
  const graded = useRef(false);
  const lastTick = useRef(-1);

  const deal = (id: string) => {
    const blocked = canPlay(s, "trivia");
    if (blocked) return;
    const pool = unseenTrivia(s, id);
    const q = pool[Math.floor(Math.random() * pool.length)];
    if (!q) {
      setCat(id);
      setCard(null);
      return;
    }
    run((st) => {
      spendKnowledge(st);
      if (!st.arcade.triviaSeen.includes(q.id)) st.arcade.triviaSeen.push(q.id);
    });
    setCat(id);
    setCard(q);
    setChoices(fairTriviaChoices(q.pick, q.decoys));
    setVerdict(null);
    setChosen(null);
    setAha(false);
    graded.current = false;
    const ms = TRIVIA_TIMER[q.tier];
    setEndsAt(performance.now() + ms);
    setLeft(Math.ceil(ms / 1000));
    lastTick.current = -1;
  };

  const grade = (label: string | null, e?: React.MouseEvent, why: "hit" | "miss" | "time" = "miss") => {
    if (!card || graded.current) return;
    graded.current = true;
    const ok = label === card.pick;
    stopHeartBed();
    if (e) tap(e, ok);
    else if (ok) sfx.coin();
    else sfx.hurt();
    if (ok) {
      sfx.lockIn();
      addTrauma(0.22);
    } else addTrauma(0.28);
    const result: "hit" | "miss" | "time" = why === "time" ? "time" : ok ? "hit" : "miss";
    setChosen(label);
    setAha(false);
    setVerdict(result);
    setStreak(ok ? streak + 1 : 0);
    const pay = triviaPayout(card.tier);
    const bonus = ok ? Math.min(12, streak * 4) : 0;
    settle({
      game: "trivia",
      caps: ok ? pay.caps + bonus : 0,
      xp: ok ? pay.xp : 0,
      loc: ok ? card.loc : undefined,
      pack: ok && Math.random() < 0.12,
      note: ok
        ? `Trivia T${card.tier} hit.${bonus ? ` Streak +${bonus}.` : ""} File retired.`
        : result === "time"
          ? `Clock ran out. File retired.`
          : `Trivia miss. File still retired.`,
      retireId: card.id,
      retireKind: "trivia",
    });
  };

  useEffect(() => {
    if (!card || verdict) return;
    let raf = 0;
    const loop = (now: number) => {
      const msLeft = endsAt - now;
      const sec = Math.max(0, Math.ceil(msLeft / 1000));
      setLeft(sec);
      if (sec <= 5 && sec !== lastTick.current && sec > 0) {
        lastTick.current = sec;
        if (sec <= 3) {
          sfx.clockWarn();
          if (sec === 3) startHeartBed(1.2);
        } else sfx.clockTick();
      }
      if (now >= endsAt) {
        grade(null, undefined, "time");
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      stopHeartBed();
    };
  }, [card, verdict, endsAt]);

  useEffect(() => {
    if (!verdict) {
      setAha(false);
      return;
    }
    const t = window.setTimeout(() => setAha(true), AHA_MS);
    return () => window.clearTimeout(t);
  }, [verdict]);

  if (!cat) {
    return (
      <div className="space-y-2">
        {TRIVIA_CATS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={(e) => {
              tap(e);
              deal(c.id);
            }}
            className="flex min-h-12 w-full items-center justify-between rounded-[var(--radius-sm)] bg-ink px-3 text-left"
          >
            <span className="font-display text-sm">{c.label}</span>
            <span className="text-[11px] text-muted">{unseenTrivia(s, c.id).length} unseen</span>
          </button>
        ))}
      </div>
    );
  }

  if (!card) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Drawer cleared. Tyrone found empty rails.</p>
        <Button onClick={() => setCat(null)}>Other drawers</Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", left <= 5 && !verdict && "ms-trivia-sweat")}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-[10px] uppercase tracking-[0.16em] text-ember">
          T{card.tier} · {knowledgeLeft(s)} draws left{streak ? ` · streak ${streak}` : ""}
        </p>
        <p className={cn("font-mono text-[11px]", left <= 5 ? "ms-clock-panic text-ember" : "text-muted")}>{left}s</p>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-ink">
        <div
          className="h-full bg-ember transition-[width] duration-200"
          style={{ width: `${Math.max(0, Math.min(100, (left / (TRIVIA_TIMER[card.tier] / 1000)) * 100))}%` }}
        />
      </div>
      <p className="text-[15px] leading-relaxed text-paper">{card.q}</p>
      <div className="grid gap-2">
        {choices.map((label) => (
          <button
            key={label}
            type="button"
            disabled={!!verdict}
            onClick={(e) => grade(label, e)}
            className={cn(
              "min-h-12 rounded-[var(--radius-sm)] bg-ink px-3 text-left font-display text-sm",
              !verdict && "ms-answer-wait",
              verdict && label === card.pick && "ms-answer-figure text-ember",
              verdict && label !== card.pick && label === chosen && "ms-answer-miss",
              verdict && label !== card.pick && label !== chosen && "ms-answer-ground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {verdict ? (
        <div className="space-y-2">
          <p className="text-sm text-ember">
            {verdict === "hit" ? "Lock." : verdict === "time" ? "Clock." : "Miss."}
          </p>
          {aha ? <p className="ms-aha-lore text-sm text-moon">{card.lore}</p> : null}
          <div className="flex gap-2">
            <Button variant="ember" onClick={() => deal(cat)}>
              Another
            </Button>
            <Button variant="quiet" onClick={onDone}>
              Shelf
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TfPlay({ onDone }: { onDone: () => void }) {
  const s = useGame((g) => g.s);
  const settle = useGame((g) => g.settleArcade);
  const run = useGame((g) => g.mutateArcade);
  const [cat, setCat] = useState<string | null>(null);
  const [card, setCard] = useState<TfCard | null>(null);
  const [verdict, setVerdict] = useState<"hit" | "miss" | null>(null);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [aha, setAha] = useState(false);

  const deal = (id: string) => {
    if (canPlay(s, "truefalse")) return;
    const pool = unseenTf(s, id);
    const q = pool[Math.floor(Math.random() * pool.length)];
    if (!q) {
      setCat(id);
      setCard(null);
      return;
    }
    run((st) => {
      spendKnowledge(st);
      if (!st.arcade.tfSeen.includes(q.id)) st.arcade.tfSeen.push(q.id);
    });
    setCat(id);
    setCard(q);
    setVerdict(null);
    setPicked(null);
    setAha(false);
  };

  const grade = (val: boolean, e: React.MouseEvent) => {
    if (!card || verdict) return;
    const ok = val === card.answer;
    tap(e, ok);
    if (ok) {
      sfx.lockIn();
      addTrauma(0.18);
    } else addTrauma(0.28);
    if (!ok) run((st) => burnTfLife(st));
    setPicked(val);
    setAha(false);
    setVerdict(ok ? "hit" : "miss");
    const pay = triviaPayout(card.tier);
    settle({
      game: "truefalse",
      caps: ok ? pay.caps : 0,
      xp: ok ? Math.round(pay.xp * 0.8) : 0,
      loc: ok ? card.loc : undefined,
      note: ok ? `Statement verified. T${card.tier}.` : `Red circuit. Life burned.`,
      retireId: card.id,
      retireKind: "tf",
    });
  };

  useEffect(() => {
    if (!verdict) {
      setAha(false);
      return;
    }
    const t = window.setTimeout(() => setAha(true), AHA_MS);
    return () => window.clearTimeout(t);
  }, [verdict]);

  if (!cat) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-moon">Lives {s.clocks.tfLives}/3 · {knowledgeLeft(s)} shared draws.</p>
        {TRIVIA_CATS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={(e) => {
              tap(e);
              deal(c.id);
            }}
            className="flex min-h-12 w-full items-center justify-between rounded-[var(--radius-sm)] bg-ink px-3 text-left"
          >
            <span className="font-display text-sm">{c.label}</span>
            <span className="text-[11px] text-muted">{unseenTf(s, c.id).length} left</span>
          </button>
        ))}
      </div>
    );
  }

  if (!card) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">No statements left in this drawer.</p>
        <Button onClick={() => setCat(null)}>Drawers</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[15px] leading-relaxed text-paper">{card.q}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          className={cn(
            "min-h-14",
            !verdict && "ms-answer-wait",
            verdict && card.answer === true && "ms-answer-figure",
            verdict && card.answer !== true && picked === true && "ms-answer-miss",
            verdict && card.answer !== true && picked !== true && "ms-answer-ground",
          )}
          variant="ember"
          disabled={!!verdict}
          onClick={(e) => grade(true, e)}
        >
          True
        </Button>
        <Button
          className={cn(
            "min-h-14",
            !verdict && "ms-answer-wait",
            verdict && card.answer === false && "ms-answer-figure",
            verdict && card.answer !== false && picked === false && "ms-answer-miss",
            verdict && card.answer !== false && picked !== false && "ms-answer-ground",
          )}
          variant="quiet"
          disabled={!!verdict}
          onClick={(e) => grade(false, e)}
        >
          False
        </Button>
      </div>
      {verdict ? (
        <div className="space-y-2">
          <p className="text-sm text-ember">{verdict === "hit" ? "Lock." : "Miss."}</p>
          {aha ? <p className="ms-aha-lore text-sm text-moon">{card.lore}</p> : null}
          <div className="flex gap-2">
            <Button variant="ember" onClick={() => deal(cat)}>
              Another
            </Button>
            <Button variant="quiet" onClick={onDone}>
              Shelf
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ScramblePlay({ onDone }: { onDone: () => void }) {
  const s = useGame((g) => g.s);
  const settle = useGame((g) => g.settleArcade);
  const run = useGame((g) => g.mutateArcade);
  const rack = useMemo(() => {
    const pool = unseenScramble(s);
    return pool[Math.floor(Math.random() * pool.length)] ?? null;
  }, [s.arcade.scrambleSeen.length]);
  const tiles = useMemo(() => (rack ? shuffleLetters(rack.letters).split("") : []), [rack?.seed]);
  const answers = useMemo(() => (rack ? anagramsOf(rack.letters) : []), [rack?.letters]);
  const [found, setFound] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [typed, setTyped] = useState("");
  const [used, setUsed] = useState<number[]>([]);
  const [note, setNote] = useState("Tiles are shuffled. Bank real words. The seed stays dark.");
  const [endsAt] = useState(() => Date.now() + SCRAMBLE_MS);
  const [left, setLeft] = useState(60);
  const [closed, setClosed] = useState(false);
  const seated = useRef(false);
  const cashed = useRef(false);
  const lastBeat = useRef(-1);

  useEffect(() => {
    if (!rack || seated.current) return;
    seated.current = true;
    run((st) => spendScrambleBoard(st));
  }, [rack, run]);

  useEffect(() => {
    if (closed) return;
    let raf = 0;
    const loop = () => {
      const sec = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setLeft(sec);
      if (sec !== lastBeat.current) {
        lastBeat.current = sec;
        if (sec === 8) sfx.clockTick();
        if (sec === 3) sfx.clockWarn();
      }
      if (sec <= 0) cash("time");
      else raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [closed, endsAt]);

  const cash = (why: string) => {
    if (cashed.current || !rack) return;
    cashed.current = true;
    setClosed(true);
    settle({
      game: "scramble",
      caps: scrambleCaps(scoreRef.current),
      xp: scoreRef.current,
      pack: scoreRef.current >= 40,
      note:
        why === "time"
          ? `Time. Seed was ${rack.seed.toUpperCase()}.`
          : `Cashed. Seed was ${rack.seed.toUpperCase()}.`,
      retireId: rack.seed,
      retireKind: "scramble",
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rack || closed) return;
    const w = typed.toLowerCase().replace(/[^a-z]/g, "");
    setTyped("");
    setUsed([]);
    if (w.length < 3) {
      setNote("Three letters minimum.");
      sfx.hurt();
      return;
    }
    if (found.includes(w)) {
      setNote("Already banked.");
      sfx.click();
      return;
    }
    if (!answers.includes(w)) {
      setNote("Not a word on this rack.");
      sfx.hurt();
      return;
    }
    const add = (SCRAMBLE_PAY[w.length] ?? 0) + (w === rack.seed ? 25 : 0);
    const next = [...found, w];
    setFound(next);
    scoreRef.current += add;
    setScore(scoreRef.current);
    const seedHit = w === rack.seed;
    setNote(seedHit ? `Seed locked. ${w.toUpperCase()}. +${add}` : `Banked ${w}. +${add}`);
    if (seedHit) {
      sfx.lockIn();
      addTrauma(0.22);
    } else {
      sfx.bankPop();
      addTrauma(0.12);
    }
  };

  if (!rack) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted">Every rack is retired. Come back when we stamp new boards.</p>
        <Button onClick={onDone}>Shelf</Button>
      </div>
    );
  }

  const lengths = [3, 4, 5, 6, 7, 8, 9, 10].filter((n) => answers.some((w) => w.length === n));
  const missed = closed ? answers.filter((w) => !found.includes(w)) : [];

  return (
    <div className={cn("space-y-3", left <= 8 && !closed && "ms-trivia-sweat")}>
      <p className="text-center font-display text-[10px] uppercase tracking-[0.18em] text-moon" data-scramble-meta="1">
        {tiles.length} tiles · {answers.length} words in the bag · {rack.theme}
      </p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {tiles.map((ch, i) => (
          <button
            key={`${ch}-${i}`}
            type="button"
            disabled={closed || used.includes(i)}
            onClick={() => {
              if (closed || used.includes(i)) return;
              sfx.click();
              setUsed((u) => [...u, i]);
              setTyped((t) => t + ch.toLowerCase());
            }}
            className="flex size-11 items-center justify-center rounded-[var(--radius-sm)] bg-ink font-display text-lg text-ember disabled:opacity-30"
            data-scramble-tile="1"
          >
            {ch}
          </button>
        ))}
      </div>
      <p className={cn("text-center text-xs", left <= 8 ? "ms-clock-panic text-ember" : "text-muted")}>
        {left}s · found {found.length}/{answers.length} · score {score}
      </p>
      <div className="flex flex-wrap justify-center gap-2 text-[10px] uppercase tracking-[0.12em] text-muted">
        {lengths.map((n) => {
          const tot = answers.filter((w) => w.length === n).length;
          const got = found.filter((w) => w.length === n).length;
          return (
            <span key={n}>
              {n}s {got}/{tot}
            </span>
          );
        })}
      </div>
      <p className="text-center text-sm text-moon">{note}</p>
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <div className="flex min-h-11 min-w-0 flex-1 items-center rounded-[var(--radius-sm)] border border-line bg-ink px-3 font-display tracking-[0.2em] text-paper">
          {typed || <span className="tracking-normal text-muted">Tap letters</span>}
        </div>
        <Button
          type="button"
          variant="quiet"
          disabled={closed || !typed}
          onClick={() => {
            setTyped((t) => t.slice(0, -1));
            setUsed((u) => u.slice(0, -1));
          }}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="quiet"
          disabled={closed || !typed}
          onClick={() => {
            setTyped("");
            setUsed([]);
          }}
        >
          Clear
        </Button>
        <Button type="submit" disabled={closed || typed.length < 3}>
          Bank
        </Button>
      </form>
      <p className="font-display text-[11px] uppercase tracking-[0.12em] text-ember">{found.map((w) => w.toUpperCase()).join(" · ") || "—"}</p>
      {closed && missed.length ? (
        <p className="text-[11px] text-muted">Missed {missed.slice(0, 24).join(" · ")}{missed.length > 24 ? "…" : ""}</p>
      ) : null}
      {!closed ? (
        <Button variant="ember" className="w-full" onClick={() => cash("cash")}>
          Cash out
        </Button>
      ) : (
        <Button variant="quiet" onClick={onDone}>
          Shelf
        </Button>
      )}
    </div>
  );
}

export { LockpickPlay, SlotsPlay, WordSearchPlay, CreePlay } from "./arcade-cabinets";
