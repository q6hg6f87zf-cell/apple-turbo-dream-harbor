import { Button } from "@/components/ui/button";
import { creeUnread, spendLockpick, spendSlot } from "@/game/arcade";
import { CREE, SLOT_FACE, SLOT_GLYPHS, SLOT_TRIPLE, SLOT_WEIGHT, type SlotGlyph } from "@/game/arcade-banks";
import { cellId, isDiagonalPath, lineCells, makeWordSearch, samePath } from "@/game/words";
import { pulseDuck, rumble, setHeartBed, setReelMotor, sfx, startHeartBed, startReelMotor, stopHeartBed, stopReelMotor } from "@/game/audio";
import { addTrauma, drainFly, hitstop, payoutFly, punchClick } from "@/game/juice";
import { glyphShift, groupingHalo, lampKind, outcomeLine, outcomeTone, reelIsolation, rowGround, winPeak, celebrates } from "@/game/neuro";
import { plateMember } from "@/game/squad";
import { atRiskLine, dryLine, heatBand, heatLine, holdMs, nearMissLine, needCommit, stakeHeat, tiltLine } from "@/game/stakes";
import { useGame } from "@/game/store";
import { cn } from "@/lib/cn";
import { useEffect, useRef, useState } from "react";

function tap(e: React.MouseEvent | React.PointerEvent, ok?: boolean) {
  punchClick(e.clientX, e.clientY);
  if (ok) sfx.coin();
  else sfx.click();
}

export function WordSearchPlay({ onDone }: { onDone: () => void }) {
  const settle = useGame((g) => g.settleArcade);
  const [board] = useState(() => makeWordSearch(10, 8));
  const [found, setFound] = useState<string[]>([]);
  const [path, setPath] = useState<string[]>([]);
  const [closed, setClosed] = useState(false);
  const [note, setNote] = useState("Drag a straight line through a listed word.");
  const drawing = useRef(false);
  const startRef = useRef<string | null>(null);
  const pathRef = useRef<string[]>([]);
  const foundRef = useRef<string[]>([]);
  const cashed = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const cash = (why: "clear" | "leave") => {
    if (cashed.current) return;
    cashed.current = true;
    setClosed(true);
    const bag = foundRef.current;
    const live = board.words.length;
    const all = bag.length >= live;
    settle({
      game: "wordsearch",
      caps: all ? 70 + bag.length * 12 : bag.length * 14,
      xp: all ? 22 : bag.length * 4,
      pack: all,
      note: all
        ? "Grid cleared. You drew every live word."
        : why === "leave"
          ? `Left the grid. ${bag.length}/${live} found.`
          : `Grid closed. ${bag.length}/${live} found.`,
    });
  };

  const cellFromPoint = (x: number, y: number) => {
    const el = gridRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const c = Math.floor(((x - rect.left) / rect.width) * board.size);
    const r = Math.floor(((y - rect.top) / rect.height) * board.size);
    if (r < 0 || c < 0 || r >= board.size || c >= board.size) return null;
    return cellId(r, c);
  };

  const paintPath = (ids: string[]) => {
    pathRef.current = ids;
    setPath(ids);
  };

  const finishPath = (next: string[]) => {
    drawing.current = false;
    startRef.current = null;
    if (closed || next.length < 3) {
      paintPath([]);
      return;
    }
    const hit = board.words.find((p) => samePath(p.cells, next));
    if (hit && !foundRef.current.includes(hit.word)) {
      sfx.bankPop();
      addTrauma(0.14);
      const bag = [...foundRef.current, hit.word];
      foundRef.current = bag;
      setFound(bag);
      paintPath([]);
      setNote(`${hit.word}. ${bag.length}/${board.words.length} on the list.`);
      if (bag.length >= board.words.length) cash("clear");
      return;
    }
    if (hit) setNote("Already stamped.");
    else setNote("Not on the list.");
    sfx.click();
    paintPath([]);
  };

  const spelling = path
    .map((id) => {
      const at = id.split(":").map(Number);
      return board.grid[at[0]!]?.[at[1]!] ?? "";
    })
    .join("");

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">{note}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1" data-search-list="1">
        {board.words.map((w) => {
          const got = found.includes(w.word);
          return (
            <span
              key={w.word}
              className={cn(
                "font-display text-xs tracking-[0.14em]",
                got ? "text-ember line-through decoration-ember/70" : "text-paper",
              )}
            >
              {w.word}
            </span>
          );
        })}
      </div>
      <div
        ref={gridRef}
        data-wordsearch="1"
        data-search-diag={String(board.words.filter((w) => isDiagonalPath(w.cells)).length)}
        className="ms-search-board"
        style={{ gridTemplateColumns: `repeat(${board.size}, minmax(0, 1fr))` }}
        onPointerDown={(e) => {
          if (closed) return;
          e.preventDefault();
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
          drawing.current = true;
          const id = cellFromPoint(e.clientX, e.clientY);
          startRef.current = id;
          paintPath(id ? [id] : []);
        }}
        onPointerMove={(e) => {
          if (!drawing.current || closed) return;
          const id = cellFromPoint(e.clientX, e.clientY);
          const start = startRef.current;
          if (!id || !start) return;
          const line = lineCells(start, id);
          paintPath(line ?? [start]);
        }}
        onPointerUp={() => finishPath(pathRef.current)}
        onPointerCancel={() => finishPath(pathRef.current)}
      >
        {board.grid.map((row, r) =>
          row.map((ch, c) => {
            const id = cellId(r, c);
            const on = path.includes(id);
            const stamped = board.words.some((p) => found.includes(p.word) && p.cells.includes(id));
            return (
              <div
                key={id}
                data-cell={id}
                data-letter={ch}
                className={cn("ms-search-cell", stamped ? "ms-search-group" : on ? "ms-search-figure" : "ms-search-ground")}
              >
                {ch}
              </div>
            );
          }),
        )}
      </div>
      {spelling ? (
        <p className="text-center font-display text-sm tracking-[0.28em] text-ember">{spelling}</p>
      ) : (
        <p className="text-center font-display text-[10px] uppercase tracking-[0.16em] text-muted" data-search-found={`${found.length}`}>
          {found.length}/{board.words.length} found
        </p>
      )}
      {closed ? (
        <Button variant="quiet" onClick={onDone}>
          Shelf
        </Button>
      ) : (
        <Button variant="quiet" onClick={() => cash("leave")}>
          Leave
        </Button>
      )}
    </div>
  );
}

export function LockpickPlay({ onDone }: { onDone: () => void }) {
  const s = useGame((g) => g.s);
  const settle = useGame((g) => g.settleArcade);
  const run = useGame((g) => g.mutateArcade);
  const spent = useRef(false);
  const angle = useRef(0);
  const [needle, setNeedle] = useState(0);
  const [pin, setPin] = useState(0);
  const [stress, setStress] = useState(0);
  const [zones] = useState(() => [0.18 + Math.random() * 0.2, 0.42 + Math.random() * 0.2, 0.68 + Math.random() * 0.2]);
  const [result, setResult] = useState<"open" | "snap" | null>(null);
  const [hot, setHot] = useState(false);
  const width = 0.055 - pin * 0.008;
  const speed = 0.55 + pin * 0.28;

  useEffect(() => {
    if (spent.current) return;
    spent.current = true;
    run((st) => spendLockpick(st));
  }, [run]);

  useEffect(() => {
    if (result) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      angle.current = (angle.current + dt * speed) % 1;
      const zone = zones[pin] ?? 0;
      const delta = Math.min(Math.abs(angle.current - zone), 1 - Math.abs(angle.current - zone));
      const inZone = delta <= width;
      setNeedle(angle.current);
      setHot(inZone);
      if (inZone && Math.floor(now / 80) !== Math.floor((now - dt * 1000) / 80)) rumble(8);
      if (inZone && Math.floor(now / 240) !== Math.floor((now - dt * 1000) / 240)) sfx.lockTick();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [result, speed, pin, width, zones]);

  const tryPick = (e: React.MouseEvent) => {
    if (result) return;
    const zone = zones[pin]!;
    const delta = Math.min(Math.abs(needle - zone), 1 - Math.abs(needle - zone));
    const ok = delta <= width;
    tap(e, ok);
    if (ok) {
      sfx.pinSet();
      addTrauma(0.16);
      if (pin >= 2) {
        setResult("open");
        addTrauma(0.32);
        settle({
          game: "lockpick",
          caps: 80 + Math.floor(Math.random() * 50),
          xp: 16,
          pack: true,
          packKey: Math.random() < 0.4 ? "bobby_pin" : undefined,
          note: "Three tumblers. The crate is yours.",
        });
      } else {
        setPin((p) => p + 1);
        angle.current = 0;
      }
      return;
    }
    const next = stress + 1;
    setStress(next);
    addTrauma(0.35);
    sfx.hurt();
    if (next >= 2) {
      setResult("snap");
      settle({
        game: "lockpick",
        caps: 0,
        xp: 0,
        note: `Pin snapped on tumbler ${pin + 1}. ${Math.max(0, s.pack.bobby_pin)} left in the kit.`,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-8 rounded-full",
              i < pin ? "bg-ember" : i === pin ? "bg-ember/50" : "bg-line",
            )}
          />
        ))}
      </div>
      <div className={cn("relative mx-auto h-44 w-44", hot ? "ms-lock-figure" : "ms-lock-ground")}>
        <div className="absolute inset-0 rounded-full border border-line bg-ink shadow-[var(--shadow-border)]" />
        <div
          className="absolute inset-3 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, transparent ${Math.max(0, (zones[pin] ?? 0) - width) * 360}deg, color-mix(in oklab, var(--color-ember) ${hot ? 78 : 34}%, transparent) ${(zones[pin] ?? 0) * 360}deg, transparent ${((zones[pin] ?? 0) + width) * 360}deg)`,
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[46%] w-0.5 origin-bottom bg-paper"
          style={{ transform: `translate(-50%, -100%) rotate(${needle * 360}deg)` }}
        />
        <div className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember" />
      </div>
      <p className="text-center text-xs text-muted">
        Tumbler {pin + 1}/3 · stress {stress}/2{hot ? " · window live" : ""}
      </p>
      {!result ? (
        <Button variant="ember" className="min-h-14 w-full" onClick={tryPick}>
          Set pin {pin + 1}
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-ember">{result === "open" ? "Open. All three." : "Snapped."}</p>
          <Button variant="quiet" onClick={onDone}>
            Shelf
          </Button>
        </div>
      )}
    </div>
  );
}

function pickGlyph(): SlotGlyph {
  const total = SLOT_GLYPHS.reduce((n, g) => n + SLOT_WEIGHT[g], 0);
  let roll = Math.random() * total;
  for (const g of SLOT_GLYPHS) {
    roll -= SLOT_WEIGHT[g];
    if (roll <= 0) return g;
  }
  return "PIN";
}

function slotWindow(reels: SlotGlyph[][]): { caps: (bet: number, lines: 1 | 3) => { caps: number; note: string; hits: number[] } } {
  const rowHit = (row: number) => {
    const a = reels[0]![row]!;
    const b = reels[1]![row]!;
    const c = reels[2]![row]!;
    return a === b && b === c ? a : null;
  };
  return {
    caps: (bet, lines) => {
      const rows = lines === 3 ? [0, 1, 2] : [1];
      let total = 0;
      const notes: string[] = [];
      const hits: number[] = [];
      for (const row of rows) {
        const g = rowHit(row);
        if (!g) continue;
        const m = SLOT_TRIPLE[g];
        total += bet * m;
        hits.push(row);
        notes.push(`${["Top", "Mid", "Low"][row]} ${g} ${m}×`);
      }
      const kane = reels.flat().filter((g) => g === "KANE").length;
      if (kane >= 3) {
        total += bet * 6;
        notes.push("Kane scatter");
      } else if (kane === 2) {
        total += Math.round(bet * 0.8);
        notes.push("Two Kane");
      }
      return { caps: total, note: notes.join(" · ") || "Dry reels. The plate didn't move.", hits };
    },
  };
}

const CELL = 64;

function reelEase(t: number) {
  const clamped = Math.max(0, Math.min(1, t));
  const cubic = 1 - Math.pow(1 - clamped, 3);
  if (clamped < 0.86) return cubic;
  const u = (clamped - 0.86) / 0.14;
  const back = 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2);
  return cubic + (back - 1) * 0.18;
}

function reelStrip(land: [SlotGlyph, SlotGlyph, SlotGlyph], spins: number) {
  const strip: SlotGlyph[] = [];
  for (let i = 0; i < spins; i++) strip.push(pickGlyph());
  strip.push(...land);
  strip.push(pickGlyph(), pickGlyph());
  return { strip, rest: spins * CELL };
}

export function SlotsPlay({ onDone }: { onDone: () => void }) {
  const settle = useGame((g) => g.settleArcade);
  const run = useGame((g) => g.mutateArcade);
  const plate = useGame((g) => plateMember(g.s).personalCaps);
  const [bet, setBet] = useState(25);
  const [lines, setLines] = useState<1 | 3>(1);
  const [grid, setGrid] = useState<SlotGlyph[][]>([
    ["CAP", "MOON", "PIN"],
    ["PIN", "CAP", "TAPE"],
    ["STIM", "PIN", "MOON"],
  ]);
  const [offset, setOffset] = useState([0, 0, 0]);
  const [strips, setStrips] = useState<SlotGlyph[][]>([[], [], []]);
  const [spinning, setSpinning] = useState(false);
  const [hits, setHits] = useState<number[]>([]);
  const [last, setLast] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [lamps, setLamps] = useState(false);
  const [landed, setLanded] = useState([false, false, false]);
  const [charge, setCharge] = useState(0);
  const [shownPay, setShownPay] = useState(0);
  const [session, setSession] = useState({ in: 0, out: 0, pulls: 0 });
  const [almost, setAlmost] = useState(false);
  const [hang, setHang] = useState(false);
  const machine = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const holdRef = useRef(0);
  const ahaRef = useRef(0);
  const busy = useRef(false);
  const stake = bet * lines;
  const heat = stakeHeat(stake, plate);
  const band = heatBand(heat);
  const commit = needCommit(heat);
  const maxBet = Math.max(10, Math.min(250, plate || 10));
  const short = plate < stake;

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(holdRef.current);
      window.clearTimeout(ahaRef.current);
      stopReelMotor();
      stopHeartBed();
    };
  }, []);

  const finish = (next: SlotGlyph[][], pay: { caps: number; note: string; hits: number[] }, spent: number) => {
    setGrid(next);
    setSpinning(false);
    setHang(false);
    setHits(pay.hits);
    const miss = !pay.caps && next[0]![1] === next[1]![1];
    const kaneTrip = next.flat().filter((g) => g === "KANE").length >= 3;
    const jack = pay.caps >= spent * 8 || kaneTrip;
    const tone = jack && pay.caps >= spent ? "jack" : outcomeTone(pay.caps, spent, miss);
    const line = miss ? nearMissLine() : pay.caps ? outcomeLine(tone, pay.note) : dryLine(heat);
    setAlmost(miss);
    window.clearTimeout(ahaRef.current);
    if (celebrates(tone)) {
      ahaRef.current = window.setTimeout(() => setLast(line), 280);
    } else {
      setLast(line);
    }
    setSession((cur) => ({ in: cur.in + spent, out: cur.out + pay.caps, pulls: cur.pulls + 1 }));
    setLog((cur) => [`${spent}c → ${pay.caps}c`, ...cur].slice(0, 5));
    const box = machine.current?.getBoundingClientRect();
    const cx = box ? box.left + box.width / 2 : window.innerWidth / 2;
    const cy = box ? box.top + box.height * 0.42 : window.innerHeight / 2;
    stopHeartBed();
    if (celebrates(tone)) {
      setLamps(true);
      if (jack) {
        sfx.jackpot();
        hitstop(120);
        addTrauma(0.78);
      } else {
        sfx.win();
        addTrauma(pay.hits.length > 1 ? 0.42 : 0.24);
        rumble(pay.hits.length > 1 ? 28 : 16);
      }
      payoutFly(pay.caps, cx, cy);
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / (jack ? 980 : 640));
        setShownPay(Math.round(pay.caps * (1 - Math.pow(1 - t, 3))));
        if (t < 1) {
          if (Math.random() > 0.55) sfx.countTick();
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    } else if (tone === "even") {
      sfx.bankPop();
      addTrauma(0.12);
      setShownPay(pay.caps);
    } else if (tone === "ldw") {
      sfx.chip();
      addTrauma(0.08);
      setShownPay(pay.caps);
    } else {
      if (miss) sfx.nearMiss();
      else sfx.dry();
      addTrauma(miss ? 0.22 : 0.12);
      setShownPay(0);
    }
    settle({
      game: "slots",
      caps: pay.caps,
      xp: pay.caps ? (jack ? 10 : 4) : 0,
      pack: next.flat().filter((g) => g === "KANE").length >= 3,
      note: line,
    });
    busy.current = false;
  };

  const pull = (e?: React.MouseEvent | React.PointerEvent) => {
    if (busy.current || spinning) return;
    if (e) tap(e);
    busy.current = true;
    const denied = run((st) => spendSlot(st, stake));
    if (typeof denied === "string" && denied) {
      sfx.hurt();
      setLast(denied);
      setCharge(0);
      busy.current = false;
      return;
    }
    sfx.lever();
    sfx.plateDrain();
    const box = machine.current?.getBoundingClientRect();
    drainFly(stake, box ? box.left + box.width / 2 : window.innerWidth / 2, box ? box.top + 48 : 160);
    startReelMotor();
    pulseDuck(0.38 + heat * 0.48, 2500 + heat * 1400);
    const next: SlotGlyph[][] = [0, 1, 2].map(() => [pickGlyph(), pickGlyph(), pickGlyph()]);
    const midPair = next[0]![1] === next[1]![1];
    const built = next.map((col, i) => reelStrip([col[0]!, col[1]!, col[2]!], 16 + i * 5));
    setStrips(built.map((b) => b.strip));
    setOffset([0, 0, 0]);
    setHits([]);
    setLast(null);
    setLamps(false);
    setAlmost(false);
    setHang(false);
    setShownPay(0);
    setLanded([false, false, false]);
    setSpinning(true);
    setCharge(0);
    const started = performance.now();
    const sweat = midPair ? 980 + heat * 820 : 0;
    const dur = [1080, 1580, 2180 + sweat];
    const rest = built.map((b) => b.rest);
    const stopped = [false, false, false];
    const cells = [0, 0, 0];
    let lastHeart = 0;
    const tick = (now: number) => {
      const live = 1 - Math.min(1, (now - started) / dur[2]!);
      setReelMotor(live);
      if (stopped[0] && stopped[1] && !stopped[2] && midPair) {
        setHang(true);
        setHeartBed(0.45 + heat * 0.5);
        if (now - lastHeart > 380) {
          lastHeart = now;
          sfx.heart();
        }
      }
      const o = built.map((reel, i) => {
        const t = Math.min(1, (now - started) / dur[i]!);
        const ease = reelEase(t);
        const max = rest[i]!;
        const cell = Math.floor((Math.min(1, ease) * max) / CELL);
        if (cell !== cells[i] && t < 1) {
          cells[i] = cell;
          if (Math.random() > 0.32) sfx.reelTick();
        }
        if (t >= 1 && !stopped[i]) {
          stopped[i] = true;
          sfx.reelStop();
          if (i === 1 && midPair) startHeartBed(1.05 + heat * 0.4);
          if (i === 2) stopHeartBed();
          setLanded((cur) => {
            const n = [...cur];
            n[i] = true;
            return n;
          });
        }
        return Math.max(0, ease * max);
      });
      setOffset(o);
      if (!stopped[2]) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      stopReelMotor();
      const pay = slotWindow(next).caps(bet, lines);
      finish(next, pay, stake);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const beginHold = (e: React.PointerEvent) => {
    if (busy.current || spinning || short || !commit) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    sfx.hold();
    const t0 = performance.now();
    const need = holdMs(heat);
    const loop = (now: number) => {
      const u = Math.min(1, (now - t0) / need);
      setCharge(u);
      if (u >= 1) {
        pull(e);
        return;
      }
      holdRef.current = requestAnimationFrame(loop);
    };
    holdRef.current = requestAnimationFrame(loop);
  };

  const cancelHold = () => {
    cancelAnimationFrame(holdRef.current);
    setCharge(0);
  };

  const show: SlotGlyph[][] = spinning && strips[0]!.length ? strips : grid.map((col) => ["PIN", ...col, "CAP"]);
  const delta = session.out - session.in;
  const landedCount = landed.filter(Boolean).length;
  const keepPct = Math.round((1 - heat) * 100);

  return (
    <div className={cn("space-y-3", hang && "ms-mode-hang")} data-heat={band} data-slot-root="1">
      <div className="ms-slot-cabinet" data-slot-cabinet="1">
        <div className="ms-slot-marquee" aria-hidden>
          The Thirty-Eight
        </div>
        <span className="ms-slot-lever-arm" data-pulled={spinning ? "1" : "0"} aria-hidden>
          <span />
          <i />
        </span>
      <div
        ref={machine}
        className={cn(
          "ms-slot-machine ms-slot-glass overflow-hidden p-2",
          band === "plate" ? "border-danger/50" : band === "sweat" ? "border-ember/50" : "border-ember/25",
          hang && "ms-slot-hang",
        )}
        style={{
          boxShadow: `inset 0 0 ${Math.round(28 + heat * 70)}px color-mix(in oklab, black ${Math.round(18 + heat * 42)}%, transparent)`,
        }}
      >
        <div className={cn("ms-slot-vignette pointer-events-none", band === "plate" && "ms-slot-vignette-hot")} />
        <div className="relative z-[1] mb-2 flex items-center justify-center gap-2">
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4].map((i) => {
              const kind = lampKind(i, spinning, lamps, landedCount, hang);
              return (
                <span
                  key={i}
                  className={cn(
                    "size-2 rounded-full transition-all",
                    kind === "pulse" && "ms-slot-lamp bg-ember",
                    kind === "chase" && "ms-slot-chase bg-ember/70",
                    kind === "solid" && "bg-ember",
                    kind === "off" && "bg-line",
                  )}
                  style={kind === "chase" ? { animationDelay: `${i * 90}ms` } : undefined}
                />
              );
            })}
          </div>
        </div>
        <div
          className={cn(
            "ms-slot-window relative overflow-hidden rounded-[var(--radius-md)] bg-ink p-2",
            hang && "ms-slot-window-hang",
            lines === 1 && "ms-generic-view",
          )}
        >
          <div className="grid grid-cols-3 gap-1" style={{ perspective: "520px" }}>
            {show.map((strip, i) => (
              <div
                key={i}
                className={cn(
                  "relative h-[192px] overflow-hidden rounded-[var(--radius-sm)] bg-raised",
                  landed[i] && spinning === false ? "ms-reel-stop" : "",
                  reelIsolation(i, hang, !!landed[i]),
                )}
                style={{ transform: spinning && !landed[i] ? "rotateX(8deg)" : "none" }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-16 border-b border-ember/15 ms-row-band-top" />
                <div
                  className={cn(
                    "pointer-events-none absolute inset-x-0 top-[64px] z-[1] h-16 border-y",
                    hits.includes(1)
                      ? "border-ember/80 bg-ember/15 ms-line-figure"
                      : groupingHalo(hang, !!landed[i], i) || (hang && landed[i] && i < 2)
                        ? "border-moon/80 bg-moon/10"
                        : almost && i < 2
                          ? "border-moon/70"
                          : "border-ember/40",
                    groupingHalo(hang, !!landed[i], i),
                  )}
                />
                <div
                  className={cn(
                    "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 border-t ms-row-band-low",
                    hits.includes(2) ? "border-ember/80 bg-ember/10 ms-line-figure" : "border-ember/15",
                  )}
                />
                <div
                  className="absolute inset-x-0 top-0 will-change-transform"
                  style={{
                    transform: `translate3d(0, ${spinning ? -offset[i]! : -CELL}px, 0)`,
                    filter: spinning && !landed[i] ? `blur(${hang && i === 2 ? 0.45 : 1.15}px)` : "none",
                  }}
                >
                  {strip.map((glyph, k) => {
                    const row = k - 1;
                    const hit = !spinning && hits.includes(row);
                    return (
                      <div
                        key={`${i}-${k}-${glyph}`}
                        className={cn(
                          "flex h-16 flex-col items-center justify-center font-display",
                          glyphShift(glyph),
                          hit ? "ms-slot-hit" : "",
                          winPeak(glyph, hit),
                          rowGround(row, lines, spinning),
                        )}
                      >
                        <span className="ms-glyph-face leading-none">{SLOT_FACE[glyph]}</span>
                        <span className="text-[10px] tracking-[0.14em]">{glyph}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {hits.includes(0) ? <div className="pointer-events-none absolute inset-x-4 top-[18px] h-0.5 bg-ember/80" /> : null}
          {almost && !spinning ? (
            <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-display text-[10px] uppercase tracking-[0.16em] text-moon">
              Two on the rail
            </p>
          ) : null}
          {hang ? (
            <p className="pointer-events-none absolute inset-x-0 top-2 text-center font-display text-[10px] uppercase tracking-[0.18em] text-ember">
              Last reel
            </p>
          ) : null}
        </div>
        {hits.length ? (
          <p className="mt-2 text-center font-display text-[10px] uppercase tracking-[0.16em] text-ember">
            {hits.map((h) => ["Top", "Mid", "Low"][h]).join(" · ")} lit
            {shownPay ? ` · +${shownPay}` : ""}
          </p>
        ) : null}
      </div>
      <div className="ms-slot-tray" aria-hidden />
      </div>
      <div className="ms-plate-balance" aria-hidden>
        <span className="ms-plate-keep" style={{ width: `${keepPct}%` }} />
        <span className="ms-plate-risk" style={{ width: `${100 - keepPct}%` }} />
      </div>
      <div className="ms-fluency-chrome space-y-3">
        <p className="text-center text-[11px] leading-relaxed text-muted">{heatLine(band)}</p>
        <p className="text-center font-display text-[10px] uppercase tracking-[0.14em] text-moon">{atRiskLine(stake, plate)}</p>
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-[0.12em] text-muted">
          <span>3 Kane {SLOT_TRIPLE.KANE}×</span>
          <span>3 Moon {SLOT_TRIPLE.MOON}×</span>
          <span>Plate {plate.toLocaleString()}</span>
        </div>
        <div className="flex flex-wrap gap-2">
        {[10, 25, 50, 100].map((n) => (
          <Button
            key={n}
            size="sm"
            variant={bet === n ? "ember" : "quiet"}
            onClick={() => {
              sfx.chip();
              setBet(n);
            }}
            disabled={spinning || n > plate}
          >
            {n}
          </Button>
        ))}
        <Button
          size="sm"
          variant={bet === maxBet ? "ember" : "quiet"}
          onClick={() => {
            sfx.chip();
            setBet(maxBet);
            setLines(1);
          }}
          disabled={spinning || plate < 10}
        >
          Max
        </Button>
        <Button
          size="sm"
          variant={lines === 3 ? "ember" : "quiet"}
          onClick={() => {
            sfx.chip();
            setLines(lines === 1 ? 3 : 1);
          }}
          disabled={spinning}
        >
          {lines === 1 ? "1 line" : "3 lines"}
        </Button>
      </div>
      </div>
      <Button
        variant="ember"
        className="relative min-h-14 w-full overflow-hidden"
        disabled={spinning || short}
        data-slot-pull="1"
        data-plate={plate}
        data-stake={stake}
        onPointerDown={beginHold}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onPointerLeave={cancelHold}
        onClick={(e) => {
          if (commit || busy.current || spinning || short) return;
          pull(e);
        }}
      >
        {charge > 0 ? (
          <span className="absolute inset-y-0 left-0 bg-ember/30" style={{ width: `${charge * 100}%` }} />
        ) : null}
        <span className="relative">
          {spinning ? "Reels live" : short ? "Plate is short" : commit ? `Hold to pull · ${stake}` : `Pull · ${stake} on the card`}
        </span>
      </Button>
      <div className="ms-fluency-chrome space-y-2">
      <p className="text-center font-mono text-[10px] text-muted">
        Session {delta >= 0 ? "+" : ""}
        {delta} · in {session.in} · out {session.out}
      </p>
      <p className="text-center text-[11px] text-moon">{tiltLine(delta, session.pulls)}</p>
      </div>
      {last ? <p className={cn("text-sm", last.includes("house kept") ? "ms-ldw" : "text-muted")}>{last}</p> : null}
      {log.length ? <p className="font-mono text-[10px] text-muted">{log.join("  ·  ")}</p> : null}
      <Button variant="quiet" onClick={onDone} disabled={spinning}>
        Floor
      </Button>
    </div>
  );
}

export function CreePlay({ onDone }: { onDone: () => void }) {
  const s = useGame((g) => g.s);
  const settle = useGame((g) => g.settleArcade);
  const unread = creeUnread(s);
  const [open, setOpen] = useState<string | null>(null);
  const lesson = CREE.find((l) => l.id === open) ?? null;
  const paid = useRef<string | null>(null);

  useEffect(() => {
    if (!lesson || paid.current === lesson.id) return;
    if (s.arcade.creeRead.includes(lesson.id)) return;
    paid.current = lesson.id;
    sfx.unlock();
    settle({
      game: "cree",
      caps: 12,
      xp: 6,
      note: `Lesson stamped: ${lesson.word}`,
      retireId: lesson.id,
      retireKind: "cree",
    });
  }, [lesson, s.arcade.creeRead, settle]);

  if (lesson) {
    return (
      <div className="space-y-3">
        <p className="font-display text-[10px] uppercase tracking-[0.16em] text-ember">{lesson.title}</p>
        <p className="font-display text-3xl text-paper">{lesson.word}</p>
        <p className="text-sm leading-relaxed text-moon">{lesson.meaning}</p>
        <Button variant="quiet" onClick={() => setOpen(null)}>
          Drawer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {CREE.map((l) => {
        const stamped = s.arcade.creeRead.includes(l.id);
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => {
              sfx.click();
              setOpen(l.id);
            }}
            className="flex min-h-12 w-full items-center justify-between rounded-[var(--radius-sm)] bg-ink px-3 text-left"
          >
            <span className="font-display text-sm">{l.title}</span>
            <span className="text-[11px] text-muted">{stamped ? "stamped" : unread.some((u) => u.id === l.id) ? "new" : ""}</span>
          </button>
        );
      })}
      <Button variant="quiet" onClick={onDone}>
        Shelf
      </Button>
    </div>
  );
}
