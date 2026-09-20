import { Button } from "@/components/ui/button";
import {
  ARCADE_CATALOG,
  cabinetTotals,
  canPlay,
  knowledgeLeft,
  KNOWLEDGE_DRAWS,
} from "@/game/arcade";
import { sfx } from "@/game/audio";
import { punchClick } from "@/game/juice";
import { useGame } from "@/game/store";
import { plateMember } from "@/game/squad";
import type { ArcadeGameId } from "@/game/types";
import { cn } from "@/lib/cn";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  CreePlay,
  LockpickPlay,
  ScramblePlay,
  SlotsPlay,
  TfPlay,
  TriviaPlay,
  WordSearchPlay,
} from "./arcade-play";
import { BlackjackPlay, PokerPlay, RoulettePlay } from "./casino-tables";

export function ArcadeView() {
  const s = useGame((g) => g.s);
  const setScreen = useGame((g) => g.setScreen);
  const openTerminal = useGame((g) => g.openTerminal);
  const [game, setGame] = useState<ArcadeGameId | null>(null);
  const total = cabinetTotals(s);
  const draws = knowledgeLeft(s);
  const plate = plateMember(s).personalCaps;
  const active = ARCADE_CATALOG.find((c) => c.id === game);

  const launch = (id: ArcadeGameId, x: number, y: number) => {
    punchClick(x, y);
    sfx.click();
    if (id === "hack") {
      const msg = openTerminal();
      if (msg) sfx.hurt();
      return;
    }
    const blocked = canPlay(s, id);
    if (blocked) {
      sfx.hurt();
      return;
    }
    setGame(id);
  };

  return (
    <div className="space-y-5 pb-8" data-casino="1">
      {game && active ? (
        <div className="rounded-[var(--radius-xl)] bg-raised p-4 shadow-[var(--shadow-border)] md:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-display text-xl text-paper">{active.name}</h3>
            <Button size="sm" variant="ghost" onClick={() => setGame(null)}>
              Floor
            </Button>
          </div>
          <HowToPlay steps={active.how} />
          {game === "trivia" && <TriviaPlay onDone={() => setGame(null)} />}
          {game === "truefalse" && <TfPlay onDone={() => setGame(null)} />}
          {game === "scramble" && <ScramblePlay onDone={() => setGame(null)} />}
          {game === "wordsearch" && <WordSearchPlay onDone={() => setGame(null)} />}
          {game === "lockpick" && <LockpickPlay onDone={() => setGame(null)} />}
          {game === "slots" && <SlotsPlay onDone={() => setGame(null)} />}
          {game === "cree" && <CreePlay onDone={() => setGame(null)} />}
          {game === "blackjack" && <BlackjackPlay onDone={() => setGame(null)} />}
          {game === "roulette" && <RoulettePlay onDone={() => setGame(null)} />}
          {game === "poker" && <PokerPlay onDone={() => setGame(null)} />}
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-ink shadow-[var(--shadow-border)]">
            <img
              src="/art/rooms/thirty-eight.jpg"
              alt=""
              className="absolute inset-0 size-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
            <div className="relative px-5 py-6">
              <p className="font-display text-[10px] uppercase tracking-[0.42em] text-moon">T-0888 · penthouse floor</p>
              <h2 className="mt-2 font-display text-3xl tracking-[0.12em] text-paper">The Thirty-Eight</h2>
              <p className="mt-2 max-w-xl text-sm text-moon">
                Felt tables. One green zero. Six-deck shoe. The black card buys the stool. Table games pay the plate in full. Slots still rake a tenth.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="quiet" size="sm" onClick={() => setScreen("hq")}>
                  Compound
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Floor caps" value={total.toLocaleString()} />
            <Stat label="Plate" value={plate.toLocaleString()} />
            <Stat label="Draws" value={`${draws}/${KNOWLEDGE_DRAWS}`} />
          </div>

          <div className="space-y-5">
            <FloorRow
              label="Tables"
              games={ARCADE_CATALOG.filter((c) => c.floor === "table")}
              onLaunch={launch}
            />
            <FloorRow
              label="The pit"
              games={ARCADE_CATALOG.filter((c) => c.floor === "pit")}
              onLaunch={launch}
            />
            <FloorRow
              label="Machines"
              games={ARCADE_CATALOG.filter((c) => c.floor === "machine")}
              onLaunch={launch}
            />
          </div>
        </>
      )}
    </div>
  );
}

function FloorRow({
  label,
  games,
  onLaunch,
}: {
  label: string;
  games: typeof ARCADE_CATALOG;
  onLaunch: (id: ArcadeGameId, x: number, y: number) => void;
}) {
  const s = useGame((g) => g.s);
  return (
    <section>
      <p className="mb-2 font-display text-[10px] uppercase tracking-[0.28em] text-moon">{label}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {games.map((c) => {
          const blocked = c.id === "hack" ? null : canPlay(s, c.id);
          return (
            <button
              key={c.id}
              type="button"
              data-casino-game-tile={c.id}
              onClick={(e) => onLaunch(c.id, e.clientX, e.clientY)}
              className={cn(
                "flex min-h-24 flex-col items-start justify-end rounded-[var(--radius-lg)] bg-raised px-4 py-4 text-left shadow-[var(--shadow-border)]",
                "transition-[transform,box-shadow] hover:shadow-[var(--shadow-border-hover)] active:scale-[0.99]",
                blocked && "opacity-50",
              )}
            >
              <span className="font-display text-lg text-paper">{c.name}</span>
              <span
                className={cn(
                  "mt-1 font-display text-[10px] uppercase tracking-[0.18em]",
                  blocked ? "text-muted" : "text-ember",
                )}
              >
                {blocked ? "Closed" : "Open"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function HowToPlay({ steps }: { steps: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4 rounded-[var(--radius-md)] bg-ink/70">
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-between px-3"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-display text-[10px] uppercase tracking-[0.2em] text-moon">How to play</span>
        {open ? <ChevronUp className="size-4 text-muted" /> : <ChevronDown className="size-4 text-muted" />}
      </button>
      {open ? (
        <ul className="space-y-1.5 px-3 pb-3 text-sm leading-relaxed text-muted">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-ink px-3 py-3">
      <div className="font-display text-lg tabular-nums text-paper">{value}</div>
      <div className="mt-1 font-display text-[9px] uppercase tracking-[0.14em] text-muted">{label}</div>
    </div>
  );
}
