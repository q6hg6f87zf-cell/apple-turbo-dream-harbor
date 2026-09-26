import { Button } from "@/components/ui/button";
import { BOARD_JOB_ART, BOARD_SEAL, BOARD_STEEL, BOARD_TICKET, regionThumb } from "@/game/art";
import { BOARD_KIND_LABEL, boardStake, boardWatchLabel, liveJobs, unansweredWatches } from "@/game/board-copy";
import { sfx } from "@/game/audio";
import { locById } from "@/game/data";
import { locationToRegion } from "@/game/field-ops";
import { punchClick } from "@/game/juice";
import { availableScenarios } from "@/game/scenario";
import { WATCH_LABEL, WATCH_ORDER } from "@/game/shift";
import { useGame } from "@/game/store";
import type { DayTask, WatchId } from "@/game/types";
import { cn } from "@/lib/cn";

function err(msg: string | null) {
  if (!msg) {
    sfx.coin();
    return;
  }
  sfx.hurt();
  useGame.setState((st) => ({ s: { ...st.s, toast: msg } }));
}

function jobThumb(task: DayTask): string {
  if (task.loc) {
    const region = locationToRegion(task.loc);
    if (region) return regionThumb(region);
  }
  return BOARD_JOB_ART[task.kind];
}

function WatchRibbon({ current, left }: { current: WatchId; left: number }) {
  const spent = Math.max(0, 6 - left);
  return (
    <ol className="ms-board-watch" aria-label={`${left} watches left`}>
      {WATCH_ORDER.map((id, i) => {
        const done = i < spent;
        const now = id === current;
        return (
          <li key={id} className={cn("ms-board-watch-pip", done && "is-spent", now && "is-now")}>
            <span className="ms-board-watch-dot" />
            <span className="ms-board-watch-name">{WATCH_LABEL[id] === "Afternoon" ? "Aft" : WATCH_LABEL[id] === "Morning" ? "Morn" : WATCH_LABEL[id]}</span>
          </li>
        );
      })}
    </ol>
  );
}

function SituationTicket({
  title,
  place,
  setup,
}: {
  title: string;
  place: string;
  setup: string;
}) {
  return (
    <button
      type="button"
      data-board-situation="1"
      onClick={() => {
        sfx.click();
        window.dispatchEvent(new CustomEvent("hollow:open-situation"));
      }}
      className="ms-board-lead ms-board-ticket-hot"
    >
      <img src={BOARD_SEAL} alt="" className="ms-board-lead-art object-contain p-6 opacity-80" />
      <span className="ms-board-lead-shade" />
      <span className="ms-board-lead-copy">
        <span className="font-mono text-label uppercase tracking-[0.2em] text-ember">Situation · open</span>
        <span className="mt-1 block font-display text-xl text-paper">{title}</span>
        <span className="mt-2 block text-secondary leading-relaxed text-moon">{setup}</span>
        <span className="mt-2 block font-mono text-label uppercase tracking-[0.14em] text-muted">{place}</span>
        <span className="mt-3 inline-flex min-h-11 items-center font-display text-label uppercase tracking-[0.18em] text-ember">
          Face it
        </span>
      </span>
    </button>
  );
}

function LeadTicket({ task, left, onTake }: { task: DayTask; left: number; onTake: (id: string) => void }) {
  const closed = task.status === "done" || task.status === "failed";
  const blocked = closed || left < task.watchCost;
  const thumb = jobThumb(task);
  const place = task.loc ? locById(task.loc).name : BOARD_KIND_LABEL[task.kind];
  const stake = boardStake(task);
  return (
    <button
      type="button"
      data-board-lead="1"
      disabled={blocked}
      onClick={(e) => {
        punchClick(e.clientX, e.clientY);
        onTake(task.id);
      }}
      className={cn("ms-board-lead", task.required && !closed && "ms-board-ticket-hot", closed && "opacity-55")}
    >
      <img src={thumb} alt="" className="ms-board-lead-art" />
      <span className="ms-board-lead-shade" />
      {task.required && !closed ? <img src={BOARD_SEAL} alt="" className="ms-board-lead-seal" /> : null}
      <span className="ms-board-lead-copy">
        <span className="font-mono text-label uppercase tracking-[0.2em] text-ember">
          {BOARD_KIND_LABEL[task.kind]}
          {task.required ? " · required" : ""}
        </span>
        <span className="mt-1 block font-display text-xl text-paper">{task.title}</span>
        <span className="mt-2 block text-secondary leading-relaxed text-moon">{task.brief}</span>
        <span className="mt-2 block font-mono text-label uppercase tracking-[0.14em] text-muted">
          {boardWatchLabel(task.watchCost)} · {place}
        </span>
        {stake && !closed ? (
          <span className="mt-2 block text-label italic leading-relaxed text-ember-bright">If you skip: {stake}</span>
        ) : null}
        <span className="mt-3 inline-flex min-h-11 items-center font-display text-label uppercase tracking-[0.18em] text-ember">
          {closed ? task.status : "Take this job"}
        </span>
      </span>
    </button>
  );
}

function Ticket({ task, left, onTake }: { task: DayTask; left: number; onTake: (id: string) => void }) {
  const closed = task.status === "done" || task.status === "failed";
  const blocked = closed || left < task.watchCost;
  const thumb = jobThumb(task);
  const place = task.loc ? locById(task.loc).short : null;
  const stake = boardStake(task);
  return (
    <button
      type="button"
      disabled={blocked}
      onClick={(e) => {
        punchClick(e.clientX, e.clientY);
        onTake(task.id);
      }}
      className={cn(
        "ms-board-ticket relative flex min-h-24 w-full gap-3 overflow-hidden rounded-[var(--radius-sm)] px-3 py-3 text-left",
        closed && "opacity-55",
        task.required && !closed && "ms-board-ticket-hot",
      )}
    >
      <img src={BOARD_TICKET} alt="" className="pointer-events-none absolute inset-0 size-full object-cover opacity-25" />
      <span className="relative size-16 shrink-0 overflow-hidden rounded-[var(--radius-xs)] shadow-[var(--shadow-border)]">
        <img src={thumb} alt="" className="size-full object-cover" />
        {task.required && !closed ? (
          <img src={BOARD_SEAL} alt="" className="absolute -right-1 -bottom-1 size-7 rounded-full object-cover" />
        ) : null}
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-mono text-label uppercase tracking-[0.16em] text-ember">
            {BOARD_KIND_LABEL[task.kind]}
            {task.required ? " · required" : ""}
          </span>
          <span className="shrink-0 font-display text-label uppercase tracking-[0.14em] text-ember">
            {closed ? task.status : "Take"}
          </span>
        </span>
        <span className="mt-0.5 block font-display text-body text-paper">{task.title}</span>
        <span className="mt-1 block text-secondary leading-relaxed text-moon">{task.brief}</span>
        <span className="mt-1 block font-mono text-label text-muted">
          {boardWatchLabel(task.watchCost)}
          {place ? ` · ${place}` : ""}
          {task.report ? ` · ${task.report}` : ""}
        </span>
        {stake && !closed ? (
          <span className="mt-1 block text-label italic leading-relaxed text-ember-bright/90">If you skip: {stake}</span>
        ) : null}
      </span>
    </button>
  );
}

export function DayBoard() {
  const s = useGame((g) => g.s);
  const openTask = useGame((g) => g.openTask);
  const rest = useGame((g) => g.rest);
  const board = s.shift?.board ?? [];
  const left = s.shift?.watchesLeft ?? 6;
  const watch = s.shift?.watch ?? "dawn";
  if (!board.length) return null;

  const live = liveJobs(board);
  const lead = live.find((task) => task.required) ?? live[0] ?? null;
  const restLive = live.filter((task) => task.id !== lead?.id);
  const required = restLive.filter((task) => task.required);
  const optional = restLive.filter((task) => !task.required);
  const closed = board.filter((task) => task.status === "done" || task.status === "failed");
  const dark = unansweredWatches(board, left);
  const take = (id: string) => err(openTask(id));
  const situation = availableScenarios(s)[0] ?? null;
  const opening =
    s.day <= 3 && !s.narrative?.flags?.highway_walked
      ? {
          kicker: "Opening · No Tracks",
          line: "He stopped for you. There were no tracks. Walk the East Highway, then decide what the white visor on the Berm gets to report.",
        }
      : s.day <= 3 && !s.narrative?.flags?.rail_cut_scouted
        ? {
            kicker: "Opening · The Invoice",
            line: "The chit names a weigh-in at the Rail Cut. Read the contract. One line is not about steel.",
          }
        : null;

  return (
    <section className="ms-day-board mt-4 overflow-hidden rounded-[var(--radius-md)]" data-day-board="1">
      <img src={BOARD_STEEL} alt="" className="pointer-events-none absolute inset-0 size-full object-cover opacity-45" />
      <div className="relative p-3 md:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-label uppercase tracking-[0.2em] text-ember">Today's board</p>
            <p className="mt-0.5 font-display text-body text-paper">
              {WATCH_LABEL[watch]} · {boardWatchLabel(left)} left
            </p>
            <p className="mt-1 text-secondary text-moon">
              {live.length} live of {board.length} posted
              {situation ? " · a situation is pinned above the jobs" : ""}
              {dark > 0 ? ` · ${boardWatchLabel(dark)} will go unanswered` : situation ? "" : " · the day can cover the wall"}
            </p>
          </div>
          {left <= 0 ? (
            <Button size="sm" variant="ember" onClick={() => rest()}>
              Rest
            </Button>
          ) : null}
        </div>
        <div className="mt-3">
          <WatchRibbon current={watch} left={left} />
        </div>

        {opening ? (
          <div className="mt-4 rounded-[var(--radius-sm)] border border-ember/40 bg-ink/50 px-3 py-3">
            <p className="font-mono text-label uppercase tracking-[0.2em] text-ember">{opening.kicker}</p>
            <p className="mt-1 text-secondary leading-relaxed text-paper">{opening.line}</p>
          </div>
        ) : null}

        {situation ? (
          <div className="mt-4">
            <p className="mb-2 font-display text-label uppercase tracking-[0.18em] text-danger">
              The road wrote this — not the clerk
            </p>
            <SituationTicket
              title={situation.title}
              place={situation.locationLabel}
              setup={situation.setup.split(".").slice(0, 2).join(".").trim() + "."}
            />
          </div>
        ) : null}

        {lead ? (
          <div className="mt-4">
            <p className="mb-2 font-display text-label uppercase tracking-[0.18em] text-danger">
              {lead.required ? "Sleep on this and it happens to you" : "Posted first"}
            </p>
            <LeadTicket task={lead} left={left} onTake={take} />
          </div>
        ) : null}

        {required.length ? (
          <div className="mt-4">
            <p className="mb-2 font-display text-label uppercase tracking-[0.18em] text-danger">Sealed work</p>
            <div className="space-y-2">
              {required.map((task) => (
                <Ticket key={task.id} task={task} left={left} onTake={take} />
              ))}
            </div>
          </div>
        ) : null}

        {optional.length ? (
          <div className="mt-4">
            <p className="mb-2 font-display text-label uppercase tracking-[0.18em] text-ember">Open work</p>
            <div className="space-y-2">
              {optional.map((task) => (
                <Ticket key={task.id} task={task} left={left} onTake={take} />
              ))}
            </div>
          </div>
        ) : null}

        {closed.length ? (
          <div className="mt-4">
            <p className="mb-2 font-display text-label uppercase tracking-[0.18em] text-muted">Closed</p>
            <div className="space-y-2">
              {closed.map((task) => (
                <Ticket key={task.id} task={task} left={left} onTake={take} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
