import { Button } from "@/components/ui/button";
import {
  basicStrategy,
  canDouble,
  canSplit,
  deal,
  doubleDown,
  emptyTable,
  handValue,
  hit,
  isBlackjack,
  isBust,
  split,
  stand,
  strategyLine,
  type Card,
  type Table,
} from "@/game/blackjack";
import { sfx } from "@/game/audio";
import { spendPlateBet } from "@/game/arcade";
import { betLabel, pays, pocketColor, spinWheel, type WheelBet } from "@/game/roulette";
import { evaluatePoker, POKER_LABEL, POKER_PAY, pokerDeck, pokerPayout, type PokerHand } from "@/game/video-poker";
import { useGame } from "@/game/store";
import { plateMember } from "@/game/squad";
import { cn } from "@/lib/cn";
import { useEffect, useMemo, useState } from "react";
import { SectionLabel } from "./primitives";

const SUIT: Record<Card["suit"], string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
const BETS = [10, 25, 50, 100, 250];

function PlayingCard({ card, hidden, compact }: { card?: Card; hidden?: boolean; compact?: boolean }) {
  const red = card && (card.suit === "H" || card.suit === "D");
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col justify-between rounded-[var(--radius-sm)] shadow-[var(--shadow-border)]",
        compact ? "h-16 w-11 p-1" : "h-[4.75rem] w-14 p-1.5",
        hidden ? "bg-ink text-ember" : "bg-paper text-ink",
        red && !hidden && "text-danger",
      )}
    >
      {hidden || !card ? (
        <span className="font-display text-[10px] uppercase tracking-[0.14em]">38</span>
      ) : (
        <>
          <span className="font-display text-sm leading-none">{card.rank}</span>
          <span className={cn("self-end", compact ? "text-base" : "text-lg")}>{SUIT[card.suit]}</span>
        </>
      )}
    </div>
  );
}

function StakePicker({ bet, setBet, bank }: { bet: number; setBet: (n: number) => void; bank: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {BETS.map((n) => (
        <button
          key={n}
          type="button"
          disabled={bank < n}
          onClick={() => setBet(n)}
          className={cn(
            "min-h-11 min-w-11 rounded-full border px-3 font-display text-[11px] uppercase tracking-[0.12em] disabled:opacity-35",
            bet === n ? "border-ember bg-ember/15 text-ember" : "border-line text-muted",
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function settleTable(game: "blackjack" | "roulette" | "poker", amount: number, note: string) {
  useGame.getState().settleArcade({ game, caps: amount, xp: Math.max(1, Math.round(amount * 0.04)), note });
}

export function BlackjackPlay({ onDone }: { onDone: () => void }) {
  const plate = useGame((g) => plateMember(g.s).personalCaps);
  const run = useGame((g) => g.mutateArcade);
  const [bet, setBet] = useState(25);
  const [table, setTable] = useState<Table>(() => emptyTable());
  const hand = table.hands[table.active];
  const up = table.dealer[0];
  const hint = hand && up && table.phase === "player" ? strategyLine(basicStrategy(hand.cards, up)) : "";

  const buy = () => {
    let err: string | null = null;
    run((st) => {
      err = spendPlateBet(st, bet);
    });
    if (err) {
      sfx.hurt();
      useGame.setState((store) => ({ s: { ...store.s, toast: err! } }));
      return;
    }
    sfx.dice();
    setTable((t) => {
      const next = deal(t, bet);
      if (next.phase === "settle") {
        settleTable("blackjack", next.payout, next.message);
        if (next.payout > bet) sfx.coin();
      }
      return next;
    });
  };

  const act = (fn: (t: Table) => Table | { error: string }) => {
    setTable((t) => {
      const next = fn(t);
      if ("error" in next) {
        sfx.hurt();
        return t;
      }
      if (next.phase === "settle") {
        settleTable("blackjack", next.payout, next.message);
        if (next.payout > 0) sfx.coin();
        else sfx.hurt();
      } else {
        sfx.click();
      }
      return next;
    });
  };

  return (
    <div className="space-y-4" data-casino-game="blackjack">
      <p className="text-sm text-moon">Six-deck shoe. House stands on soft 17. Naturals pay 3:2. Tyrone whispers the chart — he does not play your hand.</p>
      <div className="rounded-[var(--radius-lg)] bg-ink/55 p-4 shadow-[var(--shadow-border)]">
        <SectionLabel>Dealer {table.dealer.length ? handValue(table.phase === "player" ? table.dealer.slice(0, 1) : table.dealer).total : ""}</SectionLabel>
        <div className="mt-2 flex gap-1.5">
          {table.dealer.map((card, i) => (
            <PlayingCard key={i} card={card} hidden={table.phase === "player" && i === 1} />
          ))}
        </div>
        {table.hands.map((h, i) => (
          <div key={i} className={cn("mt-4", i === table.active && table.phase === "player" && "rounded-[var(--radius-md)] ring-1 ring-ember/40 p-2")}>
            <SectionLabel>
              You · {handValue(h.cards).total}
              {isBlackjack(h.cards) ? " · natural" : isBust(h.cards) ? " · bust" : ""} · {h.bet}c
            </SectionLabel>
            <div className="mt-2 flex gap-1.5">
              {h.cards.map((card, k) => (
                <PlayingCard key={k} card={card} />
              ))}
            </div>
          </div>
        ))}
        {table.message ? <p className="mt-3 text-sm text-paper">{table.message}</p> : null}
        {hint ? <p className="mt-2 text-xs italic text-ember">{hint}</p> : null}
      </div>
      {table.phase === "bet" || table.phase === "settle" ? (
        <div className="space-y-3">
          <StakePicker bet={bet} setBet={setBet} bank={plate} />
          <p className="text-xs text-muted">Plate {plate.toLocaleString()}c</p>
          <Button variant="ember" className="w-full min-h-12" onClick={buy}>
            Deal · {bet}c
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ember" onClick={() => act(hit)}>Hit</Button>
          <Button variant="quiet" onClick={() => act(stand)}>Stay</Button>
          <Button variant="ghost" disabled={!hand || !canDouble(hand) || plate < (hand?.bet ?? 0)} onClick={() => {
            if (!hand) return;
            let err: string | null = null;
            run((st) => { err = spendPlateBet(st, hand.bet); });
            if (err) { sfx.hurt(); return; }
            act(doubleDown);
          }}>Double</Button>
          <Button variant="ghost" disabled={!hand || !canSplit(hand) || plate < (hand?.bet ?? 0)} onClick={() => {
            if (!hand) return;
            let err: string | null = null;
            run((st) => { err = spendPlateBet(st, hand.bet); });
            if (err) { sfx.hurt(); return; }
            act(split);
          }}>Split</Button>
        </div>
      )}
      <Button variant="ghost" className="w-full" onClick={onDone}>Floor</Button>
    </div>
  );
}

export function RoulettePlay({ onDone }: { onDone: () => void }) {
  const plate = useGame((g) => plateMember(g.s).personalCaps);
  const run = useGame((g) => g.mutateArcade);
  const [bet, setBet] = useState(25);
  const [picked, setPicked] = useState<WheelBet>({ kind: "red", stake: 25 });
  const [pocket, setPocket] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    setPicked((p) => ({ ...p, stake: bet }));
  }, [bet]);

  const color = pocket == null ? null : pocketColor(pocket);

  const spin = () => {
    if (spinning) return;
    let err: string | null = null;
    run((st) => { err = spendPlateBet(st, bet); });
    if (err) {
      sfx.hurt();
      useGame.setState((store) => ({ s: { ...store.s, toast: err! } }));
      return;
    }
    setSpinning(true);
    sfx.dice();
    const landed = spinWheel();
    window.setTimeout(() => {
      const win = pays({ ...picked, stake: bet }, landed);
      setPocket(landed);
      setSpinning(false);
      settleTable("roulette", win, win ? `${landed} ${pocketColor(landed)}. ${betLabel(picked)} pays.` : `${landed} ${pocketColor(landed)}. ${betLabel(picked)} dies on zero-edge.`);
      if (win) sfx.coin();
      else sfx.hurt();
    }, 900);
  };

  return (
    <div className="space-y-4" data-casino-game="roulette">
      <p className="text-sm text-moon">Single zero. No double-zero cheat. Outside bets die on 0. Straight pays 35:1 plus the stake.</p>
      <div className="flex flex-col items-center rounded-[var(--radius-lg)] bg-ink/55 py-6 shadow-[var(--shadow-border)]">
        <div
          className={cn(
            "flex size-28 items-center justify-center rounded-full border-4 border-ember/40 bg-ink font-display text-4xl",
            color === "red" && "text-danger",
            color === "black" && "text-paper",
            color === "green" && "text-ok",
            spinning && "animate-pulse",
          )}
        >
          {spinning ? "—" : pocket ?? "0"}
        </div>
        <p className="mt-2 font-display text-[10px] uppercase tracking-[0.18em] text-muted">
          {spinning ? "Ball is live" : color ?? "European wheel"}
        </p>
      </div>
      <StakePicker bet={bet} setBet={setBet} bank={plate} />
      <div className="flex flex-wrap gap-1.5">
        {(["red", "black", "even", "odd", "low", "high"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => setPicked({ kind, stake: bet })}
            className={cn(
              "min-h-11 rounded-full border px-3 font-display text-[10px] uppercase tracking-[0.12em]",
              picked.kind === kind ? "border-ember bg-ember/15 text-ember" : "border-line text-muted",
            )}
          >
            {kind}
          </button>
        ))}
      </div>
      <div>
        <SectionLabel>Straight</SectionLabel>
        <div className="mt-2 grid grid-cols-6 gap-1 sm:grid-cols-12">
          {Array.from({ length: 37 }, (_, n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPicked({ kind: "straight", n, stake: bet })}
              className={cn(
                "min-h-9 rounded-[var(--radius-xs)] font-display text-[11px]",
                n === 0 ? "bg-ok/20 text-ok" : pocketColor(n) === "red" ? "bg-danger/20 text-danger" : "bg-ink text-paper",
                picked.kind === "straight" && picked.n === n && "ring-1 ring-ember",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <Button variant="ember" className="w-full min-h-12" disabled={spinning} onClick={spin}>
        Spin · {bet}c · {betLabel(picked)}
      </Button>
      <p className="text-xs text-muted">Plate {plate.toLocaleString()}c</p>
      <Button variant="ghost" className="w-full" onClick={onDone}>Floor</Button>
    </div>
  );
}

export function PokerPlay({ onDone }: { onDone: () => void }) {
  const plate = useGame((g) => plateMember(g.s).personalCaps);
  const run = useGame((g) => g.mutateArcade);
  const [bet, setBet] = useState(25);
  const [deck, setDeck] = useState<Card[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [drawn, setDrawn] = useState(false);
  const [result, setResult] = useState<PokerHand | null>(null);

  const dealFive = () => {
    let err: string | null = null;
    run((st) => { err = spendPlateBet(st, bet); });
    if (err) {
      sfx.hurt();
      useGame.setState((store) => ({ s: { ...store.s, toast: err! } }));
      return;
    }
    const next = pokerDeck();
    const hand = next.slice(0, 5);
    setDeck(next.slice(5));
    setCards(hand);
    setHeld([false, false, false, false, false]);
    setDrawn(false);
    setResult(null);
    sfx.dice();
  };

  const draw = () => {
    if (drawn || !cards.length) return;
    let remaining = deck.slice();
    const next = cards.map((card, i) => {
      if (held[i]) return card;
      const take = remaining[0]!;
      remaining = remaining.slice(1);
      return take;
    });
    const hand = evaluatePoker(next);
    const win = pokerPayout(hand, bet);
    setCards(next);
    setDeck(remaining);
    setDrawn(true);
    setResult(hand);
    settleTable("poker", win, win ? `${POKER_LABEL[hand]}. Pays ${win}.` : "Nothing. The machine keeps it.");
    if (win) sfx.coin();
    else sfx.hurt();
  };

  const paytable = useMemo(() => (Object.keys(POKER_PAY) as PokerHand[]).filter((k) => k !== "nothing"), []);

  return (
    <div className="space-y-4" data-casino-game="poker">
      <p className="text-sm text-moon">Jacks or Better, 9/6. Hold what you want. One draw. Royal on a 5-unit bet is four thousand on the card.</p>
      <div className="grid grid-cols-2 gap-1 text-[11px] text-muted sm:grid-cols-3">
        {paytable.map((k) => (
          <div key={k} className={cn("flex justify-between rounded-[var(--radius-sm)] bg-ink/40 px-2 py-1", result === k && "text-ember")}>
            <span>{POKER_LABEL[k]}</span>
            <span>{POKER_PAY[k]}x</span>
          </div>
        ))}
      </div>
      {cards.length ? (
        <div className="flex justify-center gap-1.5">
          {cards.map((card, i) => (
            <button
              key={i}
              type="button"
              disabled={drawn}
              onClick={() => {
                sfx.click();
                setHeld((h) => h.map((v, n) => (n === i ? !v : v)));
              }}
              className="flex flex-col items-center gap-1"
            >
              <PlayingCard card={card} />
              <span className={cn("font-display text-[9px] uppercase tracking-[0.14em]", held[i] ? "text-ember" : "text-muted")}>
                {drawn ? "—" : held[i] ? "Held" : "Hold"}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">Deal five. Then choose what lives.</p>
      )}
      {result ? <p className="text-center font-display text-lg text-paper">{POKER_LABEL[result]}</p> : null}
      <StakePicker bet={bet} setBet={setBet} bank={plate} />
      {!cards.length || drawn ? (
        <Button variant="ember" className="w-full min-h-12" onClick={dealFive}>Deal · {bet}c</Button>
      ) : (
        <Button variant="ember" className="w-full min-h-12" onClick={draw}>Draw</Button>
      )}
      <p className="text-xs text-muted">Plate {plate.toLocaleString()}c</p>
      <Button variant="ghost" className="w-full" onClick={onDone}>Floor</Button>
    </div>
  );
}
