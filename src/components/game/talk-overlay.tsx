import { Button } from "@/components/ui/button";
import { sfx } from "@/game/audio";
import { kaneLineAt, replyLineAt, wakeLineAt } from "@/game/opening-reel";
import { getRadioSnapshot, subscribeRadio } from "@/game/radio";
import { TALK, MANUAL, MANUAL_PROMPTS, isPregameTalk, isTalkLocked, renderTalk, scriptForScreen } from "@/game/talk";
import { speakerArt } from "@/game/cast";
import { useGame } from "@/game/store";
import type { TyroneAssist } from "@/game/types";
import { cn } from "@/lib/cn";
import { CircleHelp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function TalkOverlay() {
  const talk = useGame((g) => g.s.talk);
  const state = useGame((g) => g.s);
  const advance = useGame((g) => g.advanceTalk);
  const skip = useGame((g) => g.skipTalk);
  const syncWakeLine = useGame((g) => g.syncWakeLine);
  const line = talk ? TALK[talk.script]?.[talk.i] : null;
  const [shown, setShown] = useState("");
  const shownRef = useRef("");
  const skipType = useRef(false);
  const full = line ? renderTalk(line.text, state) : "";
  const locked = isTalkLocked(state);
  const pregame = isPregameTalk(state);
  const liveTape = talk?.script === "wake" || talk?.script === "kane" || talk?.script === "tyrone-reply";
  const total = talk ? (TALK[talk.script]?.length ?? 1) : 1;
  shownRef.current = shown;

  const revealOrAdvance = () => {
    if (liveTape) {
      const snap = getRadioSnapshot();
      if (snap.mode === "intro" && snap.playing) return;
      sfx.click();
      advance();
      return;
    }
    if (shownRef.current.length < full.length) {
      skipType.current = true;
      setShown(full);
      shownRef.current = full;
      return;
    }
    sfx.click();
    advance();
  };

  useEffect(() => {
    if (!liveTape) return;
    const push = () => {
      const snap = getRadioSnapshot();
      if (snap.mode !== "intro") return;
      const script = useGame.getState().s.talk?.script;
      if (snap.introChapter === "kane" && script === "wake") {
        skip();
        return;
      }
      if (snap.introChapter === "reply" && script === "kane") {
        skip();
        return;
      }
      if (snap.introChapter === "done" && script === "tyrone-reply") {
        skip();
        return;
      }
      if (script === "wake") syncWakeLine(wakeLineAt(snap.currentTime));
      else if (script === "kane") syncWakeLine(kaneLineAt(snap.currentTime));
      else if (script === "tyrone-reply") syncWakeLine(replyLineAt(snap.currentTime));
    };
    push();
    return subscribeRadio(push);
  }, [liveTape, syncWakeLine, skip]);

  useEffect(() => {
    if (!full) {
      setShown("");
      return;
    }
    skipType.current = false;
    if (liveTape) {
      setShown(full);
      shownRef.current = full;
      return;
    }
    setShown("");
    shownRef.current = "";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(full);
      shownRef.current = full;
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      if (skipType.current) {
        window.clearInterval(id);
        return;
      }
      i += 1;
      const next = full.slice(0, i);
      shownRef.current = next;
      setShown(next);
      if (i >= full.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [full, talk?.script, talk?.i, liveTape]);

  useEffect(() => {
    if (!talk) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (liveTape) {
          skip();
          return;
        }
        if (shown.length < full.length) setShown(full);
        else if (!locked || talk?.script === "kane" || talk?.script === "tyrone-reply" || talk?.script === "wing") skip();
        return;
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        revealOrAdvance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [talk, shown, full, advance, skip, locked, liveTape]);

  if (!talk || !line) return null;
  const last = talk.i >= total - 1;
  const art = speakerArt(line.who);
  const portrait =
    line.portrait ||
    art.portrait ||
    (talk.script === "wake" ? "/art/tyrone-wake.jpg" : "/art/tyrone.jpg");
  const still = line.still || art.still;
  const cinematic = talk.script === "wing";

  return (
    <>
      {pregame || cinematic ? (
        <div className={cn("fixed inset-0 z-[44] overflow-hidden", talk.script === "wake" || talk.script === "kane" || talk.script === "tyrone-reply" ? "bg-transparent" : "bg-ink/80")} aria-hidden>
          {still && cinematic ? (
            <img src={still} alt="" className="absolute inset-0 size-full object-cover object-top" />
          ) : null}
          {cinematic ? <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/15" /> : null}
        </div>
      ) : null}
      <div
        className={cn(
          "fixed inset-x-0 z-[45] p-3 pb-[max(12px,env(safe-area-inset-bottom))] md:bottom-0 md:p-6",
          pregame ? "bottom-0" : "bottom-[5.25rem]",
        )}
      >
        <button
          type="button"
          className={cn(
            "mx-auto flex w-full max-w-2xl items-end gap-3 rounded-[var(--radius-xl)] bg-ink/92 p-3 text-left shadow-[var(--shadow-border-hover)] backdrop-blur-md md:p-4",
            talk.script === "wake" && "ms-wake-card",
          )}
          onClick={revealOrAdvance}
          data-wake-auto={liveTape ? "1" : undefined}
        >
          <img
            src={portrait}
            alt=""
            data-wake-portrait={talk.script === "wake" ? "1" : undefined}
            className="size-16 shrink-0 rounded-[var(--radius-md)] object-cover object-top shadow-[var(--shadow-border)] md:size-20"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-[10px] uppercase tracking-[0.28em] text-ember">{line.who}</p>
              <p className="font-mono text-[10px] tabular-nums text-muted">
                {talk.i + 1}/{total}
              </p>
            </div>
            <p className="mt-2 min-h-16 text-[15px] leading-relaxed text-paper">
              {shown}
              {shown.length < full.length ? <span className="term-cursor ml-0.5" /> : null}
            </p>
            <div className="mt-3 flex gap-1">
              {total <= 18
                ? Array.from({ length: total }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full",
                        i < talk.i ? "bg-ember/70" : i === talk.i ? "bg-ember" : "bg-line",
                      )}
                    />
                  ))
                : (
                    <span className="h-1 w-full rounded-full bg-line">
                      <span
                        className="block h-1 rounded-full bg-ember"
                        style={{ width: `${Math.round(((talk.i + 1) / total) * 100)}%` }}
                      />
                    </span>
                  )}
            </div>
            <p className="mt-2 font-display text-[10px] uppercase tracking-[0.18em] text-muted">
              {liveTape
                ? last
                  ? "The reel finishes on its own · tap if it stalls"
                  : "Listening · tap if the reel stalls"
                : locked && last
                  ? talk.script === "welcome"
                    ? "Tap to open Vault 13 · File holds her"
                    : talk.script === "kane"
                      ? "Listening · Kane on the tape"
                      : talk.script === "tyrone-reply"
                        ? "Listening · he is still in the room"
                      : talk.script === "wing"
                        ? "Tap to file the visors"
                        : "Tap to enter the ranch"
                  : last
                    ? "Tap to close"
                    : locked
                      ? "Tap to continue · listen"
                      : "Tap to continue"}
            </p>
          </div>
        </button>
        {!locked || liveTape ? (
          <div className="mx-auto mt-2 flex w-full max-w-2xl justify-end">
            <Button size="sm" variant="quiet" onClick={() => skip()}>
              Skip
            </Button>
          </div>
        ) : null}
      </div>
    </>
  );
}

/**
 * Tyrone's Ask affordance on the porch only.
 *
 * In game it floated over the bottom-right of every hub, where it sat on top of
 * list rows and duplicated both the screen's own help control and the overflow
 * menu — three ways to ask the same question. Inside the shell, Ask now belongs
 * to the header. Out here there is no header, so the button stays.
 */
export function HelpFab() {
  const talk = useGame((g) => g.s.talk);
  const screen = useGame((g) => g.s.screen);
  const named = useGame((g) => Boolean(g.s.playerName?.trim()));
  const started = useGame((g) => g.s.started);
  const open = useGame((g) => g.openGuide);
  if (talk) return null;
  if (!started && !named) return null;
  if (screen !== "title" && screen !== "briefing") return null;
  return (
    <button
      type="button"
      aria-label="Ask Tyrone"
      data-help="1"
      onClick={() => {
        sfx.click();
        open();
      }}
      className="ms-help fixed left-3 top-3 z-[42] inline-flex size-12 touch-manipulation items-center justify-center rounded-full bg-ink text-ember md:left-6 md:top-36"
    >
      <CircleHelp className="size-5" />
    </button>
  );
}

export function FieldManual() {
  const open = useGame((g) => g.guideOpen);
  const close = useGame((g) => g.closeGuide);
  const ask = useGame((g) => g.askTyrone);
  const askLine = useGame((g) => g.askTyroneLine);
  const setAssist = useGame((g) => g.setTyroneAssist);
  const toggleNumbers = useGame((g) => g.toggleTyroneNumbers);
  const state = useGame((g) => g.s);
  const combat = !!state.combat || (!!state.mission && !state.mission.waiting);
  const [question, setQuestion] = useState("");
  const assist = state.tyrone?.settings?.assist ?? "normal";
  const numbers = state.tyrone?.settings?.showNumbers !== false;

  useEffect(() => {
    if (!open) return;
    sfx.manual();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;
  if (isPregameTalk(state) && isTalkLocked(state)) return null;
  const id = state.talk?.script === "wake" ? "wake" : scriptForScreen(state);
  const card = MANUAL[id] ?? MANUAL.hq;
  const prompts = MANUAL_PROMPTS[id] ?? MANUAL_PROMPTS.hq ?? [];

  const submitAsk = () => {
    const text = question.trim();
    if (!text) {
      if (combat) {
        close();
        return;
      }
      ask(id);
      return;
    }
    close();
    askLine(text);
    setQuestion("");
  };

  const cycleAssist = () => {
    const order: TyroneAssist[] = ["off", "minimal", "normal", "helpful", "high"];
    const i = order.indexOf(assist);
    setAssist(order[(i + 1) % order.length]!);
    sfx.click();
  };

  return (
    <div
      className="fixed inset-0 z-[52] flex items-end justify-center bg-ink/70 p-3 md:items-center"
      onClick={close}
      role="presentation"
    >
      <div
        className="ms-pop glass-strong w-full max-w-md rounded-[var(--radius-xl)] p-5 text-left"
        role="dialog"
        aria-modal="true"
        aria-label={card.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <img
            src="/art/tyrone.jpg"
            alt=""
            className="size-14 shrink-0 rounded-[var(--radius-sm)] object-cover shadow-[var(--shadow-border)]"
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[10px] uppercase tracking-[0.28em] text-ember">Tyrone Bot · field manual</p>
            <h2 className="mt-1 font-display text-xl text-paper">{card.title}</h2>
          </div>
          <button
            type="button"
            aria-label="Close Tyrone field manual"
            onClick={close}
            className="inline-flex size-11 touch-manipulation items-center justify-center rounded-[var(--radius-sm)] text-muted hover:text-paper"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-moon">{card.blurb}</p>
        <ul className="mt-4 space-y-2">
          {card.tips.map((tip) => (
            <li
              key={tip}
              className="rounded-[var(--radius-sm)] bg-ink/50 px-3 py-2 text-sm leading-relaxed text-paper shadow-[var(--shadow-border)]"
            >
              {tip}
            </li>
          ))}
        </ul>
        {!combat && prompts.length > 0 ? (
          <div className="mt-4">
            <p className="font-display text-[10px] uppercase tracking-[0.18em] text-muted">Try asking</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setQuestion(prompt);
                  }}
                  className="min-h-10 rounded-[var(--radius-sm)] bg-ink/70 px-3 font-display text-[10px] uppercase tracking-[0.12em] text-ember shadow-[var(--shadow-border)]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <label className="mt-5 block">
          <span className="font-display text-[10px] uppercase tracking-[0.18em] text-muted">Ask him</span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitAsk();
              }
            }}
            rows={2}
            maxLength={180}
            placeholder="What do I do first? Who is Kane? How does a day work?"
            className="mt-2 min-h-16 w-full rounded-[var(--radius-sm)] bg-ink px-3 py-2 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={cycleAssist}
            className="min-h-11 rounded-[var(--radius-sm)] bg-ink px-3 font-display text-[10px] uppercase tracking-[0.16em] text-ember shadow-[var(--shadow-border)]"
          >
            Assist · {assist}
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.click();
              toggleNumbers();
            }}
            className="min-h-11 rounded-[var(--radius-sm)] bg-ink px-3 font-display text-[10px] uppercase tracking-[0.16em] text-muted shadow-[var(--shadow-border)]"
          >
            Numbers · {numbers ? "on" : "off"}
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="ember"
            className="w-full"
            onClick={submitAsk}
          >
            {combat ? "Understood" : question.trim() ? "Ask Tyrone" : "Walk me through it"}
          </Button>
          <Button variant="quiet" className="w-full" onClick={close}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export function HelpChrome() {
  return (
    <>
      <HelpFab />
      <FieldManual />
    </>
  );
}
