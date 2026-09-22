import {
  arriveRegion,
  bedFromGame,
  closeRadioDeck,
  enterCasinoRadio,
  isRegionBed,
  getRadioSnapshot,
  openRadioDeck,
  pauseRadio,
  playNext,
  playPrev,
  playScore,
  playTape,
  RADIO_TAPES,
  resumeRadio,
  scoreCueForGame,
  seekRadio,
  setFollow,
  setRadioBed,
  setRadioMusic,
  setRadioSfx,
  stopScore,
  subscribeRadio,
  toggleRadioMute,
  toggleRadioPlay,
  type RadioSnapshot,
} from "@/game/radio";
import { sfx, unlockAudio } from "@/game/audio";
import { locationToRegion } from "@/game/field-ops";
import { useGame } from "@/game/store";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  AudioLines,
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { SectionLabel } from "./primitives";

export function useRadio(): RadioSnapshot {
  return useSyncExternalStore(subscribeRadio, getRadioSnapshot, getRadioSnapshot);
}

function fmt(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RadioDirector() {
  const screen = useGame((g) => g.s.screen);
  const loc = useGame((g) => g.s.selectedLoc);
  const region = useGame((g) => g.s.worldView?.selectedRegion ?? (g.s.selectedLoc ? locationToRegion(g.s.selectedLoc) : null) ?? null);
  const mission = useGame((g) => !!g.s.mission);
  const combat = useGame((g) => g.s.combat);
  const inCombat = !!combat;
  const boss = !!(combat?.bossId || combat?.enemies?.some((e) => e.isBoss || e.tags?.includes("boss")));
  const watch = useGame((g) => g.s.shift?.watch);
  useEffect(() => {
    const cue = scoreCueForGame({ screen, boss });
    if (cue === "hold") return;
    if (getRadioSnapshot().mode === "intro") return;
    if (cue === "boss") {
      void playScore("boss");
      return;
    }
    if (cue === "title") {
      void playScore("title");
      return;
    }
    stopScore({ resume: screen !== "arcade" });
  }, [boss, screen]);
  useEffect(() => {
    if (screen === "arcade") void enterCasinoRadio();
  }, [screen]);
  useEffect(() => {
    const next = bedFromGame({ screen, region, loc, mission, combat: inCombat, watch });
    setRadioBed(next);
    if (screen !== "arcade" && isRegionBed(next)) arriveRegion(next);
  }, [screen, region, loc, mission, inCombat, watch]);
  return null;
}

export function RadioChip({ className }: { className?: string }) {
  const radio = useRadio();
  return (
    <button
      type="button"
      onClick={() => {
        unlockAudio();
        sfx.click();
        useGame.getState().closeGuide();
        openRadioDeck();
      }}
      aria-label="Porch radio"
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-md)] bg-ink/70 px-3 text-left shadow-[var(--shadow-border)] transition-[box-shadow,transform] hover:shadow-[var(--shadow-border-hover)] active:scale-[0.99]",
        className,
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ember/15 text-ember">
        <AudioLines className={cn("size-4", radio.playing && "animate-pulse")} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[9px] uppercase tracking-[0.18em] text-ember">
          {radio.mode === "spot"
            ? "Station break"
            : radio.mode === "intro"
              ? "T-0880"
              : radio.unlocked
                ? radio.playing
                  ? "On air"
                  : "Paused"
                : "Porch radio"}
        </span>
        <span className="block truncate font-display text-sm text-paper">
          {radio.headline}
        </span>
      </span>
      <span className="shrink-0 font-display text-[10px] uppercase tracking-[0.14em] text-moon">
        {radio.unlocked ? fmt(radio.currentTime) : "Tap"}
      </span>
    </button>
  );
}

export function RadioDeckSheet() {
  const radio = useRadio();
  const closeGuide = useGame((g) => g.closeGuide);

  useEffect(() => {
    if (radio.deckOpen) closeGuide();
  }, [radio.deckOpen, closeGuide]);

  useEffect(() => {
    if (!radio.deckOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRadioDeck();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [radio.deckOpen]);

  if (!radio.deckOpen || typeof document === "undefined") return null;

  const tape = radio.tape;
  const progress = radio.duration > 0 ? radio.currentTime / radio.duration : 0;

  const sheet = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/80 p-3 md:items-center"
      onClick={closeRadioDeck}
      role="presentation"
    >
      <div
        className="ms-pop relative max-h-[min(92dvh,44rem)] w-full max-w-md overflow-y-auto rounded-[var(--radius-xl)] bg-surface shadow-[var(--shadow-border-hover)] ms-scroll"
        role="dialog"
        aria-modal="true"
        aria-label="Tyrone's radio"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,color-mix(in_oklab,var(--color-moon)_18%,transparent),transparent_52%)]" />
        <div className="relative z-[1] flex items-start justify-between gap-3 px-4 pt-4">
          <div>
            <SectionLabel>Tyrone's radio</SectionLabel>
            <h2 className="font-display text-xl text-paper">Holotape deck</h2>
            <p className="mt-1 text-xs text-muted">Original Hollow Realm tapes. ICR 88 sits between songs. You cannot request those.</p>
          </div>
          <button
            type="button"
            aria-label="Close radio"
            onClick={closeRadioDeck}
            className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] text-muted shadow-[var(--shadow-border)] hover:text-paper"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="relative z-[1] px-4 pt-4">
          <div className="rounded-[var(--radius-lg)] bg-ink px-4 py-4 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-moon)_22%,transparent)]">
            <p className="font-display text-[10px] uppercase tracking-[0.22em] text-ember">
              {radio.mode === "spot"
                ? "Ironclad Civic Radio"
                : radio.mode === "intro"
                  ? "T-0880"
                  : radio.mode === "score"
                    ? radio.score === "boss"
                      ? "Boss fight"
                      : "Title"
                    : (tape?.place ?? "Vault 13")}
            </p>
            <p className="mt-1 font-display text-2xl text-paper">{radio.headline}</p>
            <p className="mt-1 text-xs text-moon">{radio.mode === "tape" ? tape?.by : radio.subline}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {radio.mode === "spot"
                ? "A word from Market Square. Relay Tower Three. These spots are not on the deck. You cannot request them."
                : radio.mode === "intro"
                  ? "He found you east of the highway. Listen. Then the porch radio lights."
                  : radio.mode === "score"
                    ? radio.score === "boss"
                      ? "Chronicles of the Unseen. It loops until you flee the field. Not a holotape. The porch radio cannot request this."
                      : "Chronicles of the Unseen. Title bed. The porch radio cannot request this."
                    : (tape?.blurb ?? "")}
            </p>

            <input
              type="range"
              min={0}
              max={Math.max(1, radio.duration)}
              step={1}
              value={Math.min(radio.currentTime, radio.duration || 0)}
              aria-label="Seek"
              disabled={radio.mode !== "tape"}
              onChange={(e) => seekRadio(Number(e.target.value))}
              className="radio-fader mt-4"
              style={{ ["--radio-fill" as string]: `${Math.round(progress * 100)}%` }}
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-muted">
              <span>{fmt(radio.currentTime)}</span>
              <span>{fmt(radio.duration)}</span>
            </div>

            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                aria-label="Previous tape"
                onClick={() => {
                  unlockAudio();
                  sfx.click();
                  void playPrev();
                }}
                className="inline-flex size-11 items-center justify-center rounded-full text-moon shadow-[var(--shadow-border)] hover:text-paper"
              >
                <SkipBack className="size-4" />
              </button>
              <button
                type="button"
                aria-label={radio.playing ? "Pause" : "Play"}
                onClick={() => {
                  unlockAudio();
                  sfx.click();
                  toggleRadioPlay();
                }}
                className="inline-flex size-14 items-center justify-center rounded-full bg-ember text-ink shadow-[0_0_24px_color-mix(in_oklab,var(--color-ember)_40%,transparent)]"
              >
                {radio.playing ? <Pause className="size-6" /> : <Play className="size-6 translate-x-0.5" />}
              </button>
              <button
                type="button"
                aria-label="Next tape"
                onClick={() => {
                  unlockAudio();
                  sfx.click();
                  void playNext();
                }}
                className="inline-flex size-11 items-center justify-center rounded-full text-moon shadow-[var(--shadow-border)] hover:text-paper"
              >
                <SkipForward className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-[1] px-4 pt-4">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Tapes</SectionLabel>
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setFollow(!radio.follow);
              }}
              className={cn(
                "rounded-full px-3 py-1 font-display text-[9px] uppercase tracking-[0.16em]",
                radio.follow ? "bg-ember/15 text-ember" : "bg-ink text-muted",
              )}
            >
              {radio.follow ? "Follow the Hollow" : "Pinned tape"}
            </button>
          </div>
          <ul className="mt-2 space-y-1.5">
            {RADIO_TAPES.map((row) => {
              const on = radio.mode === "tape" && row.id === tape?.id;
              const locked = radio.mode === "score" && radio.score === "boss";
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => {
                      unlockAudio();
                      sfx.click();
                      void playTape(row.id, true);
                    }}
                    className={cn(
                      "flex min-h-12 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left transition-colors",
                      locked
                        ? "cursor-not-allowed text-muted/70"
                        : on
                          ? "bg-ember/10 text-paper"
                          : "text-moon hover:bg-ink hover:text-paper",
                    )}
                  >
                    <Radio className={cn("size-4 shrink-0", on && radio.playing ? "text-ember" : "text-muted")} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-sm">{row.title}</span>
                      <span className="block truncate text-[11px] text-muted">{row.place}</span>
                    </span>
                    <span className="font-mono text-[10px] text-muted">{fmt(row.duration)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative z-[1] space-y-3 px-4 py-4">
          <label className="block">
            <span className="flex items-center justify-between font-display text-[10px] uppercase tracking-[0.16em] text-muted">
              Music <span>{Math.round(radio.music * 100)}</span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={radio.music}
              aria-label="Music volume"
              onChange={(e) => setRadioMusic(Number(e.target.value))}
              className="radio-fader mt-1"
              style={{ ["--radio-fill" as string]: `${Math.round(radio.music * 100)}%` }}
            />
          </label>
          <label className="block">
            <span className="flex items-center justify-between font-display text-[10px] uppercase tracking-[0.16em] text-muted">
              Effects <span>{Math.round(radio.sfx * 100)}</span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={radio.sfx}
              aria-label="Effects volume"
              onChange={(e) => setRadioSfx(Number(e.target.value))}
              className="radio-fader mt-1"
              style={{ ["--radio-fill" as string]: `${Math.round(radio.sfx * 100)}%` }}
            />
          </label>
          <div className="flex gap-2">
            <Button
              variant="quiet"
              className="flex-1"
              onClick={() => {
                toggleRadioMute();
              }}
            >
              {radio.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              {radio.muted ? "Unmute" : "Mute"}
            </Button>
            <Button
              variant="ember"
              className="flex-1"
              onClick={() => {
                unlockAudio();
                if (radio.playing) pauseRadio();
                else void resumeRadio();
              }}
            >
              {radio.playing ? "Kill the signal" : "Light the porch"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
