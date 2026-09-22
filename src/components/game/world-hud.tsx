import { sfx } from "@/game/audio";
import { worldHudModel } from "@/game/shell";
import { actTitle } from "@/game/story-spine";
import { useGame } from "@/game/store";
import type { StoryActId } from "@/game/narrative-state";
import { cn } from "@/lib/cn";
import { BookOpen, CircleHelp } from "lucide-react";

/**
 * Minimal world HUD — objective + day + situation + ICR bulletin + Tyrone whisper.
 */
export function WorldHUD({ onJournal, onPause }: { onJournal?: () => void; onPause?: () => void }) {
  const s = useGame((g) => g.s);
  const openGuide = useGame((g) => g.openGuide);
  const selectPoi = useGame((g) => g.selectPoi);
  if (s.mission || s.combat) return null;
  const hud = worldHudModel(s);
  const actLabel = actTitle(hud.act as StoryActId);

  return (
    <div
      data-world-hud="1"
      data-hub-header="1"
      data-region-theme={hud.regionTheme}
      className="pointer-events-none absolute inset-x-0 top-0 z-[25] flex flex-col gap-2 px-3 pt-[max(0.35rem,env(safe-area-inset-top))] md:px-5"
    >
      <div className="pointer-events-auto flex items-start justify-between gap-2">
        <div className="ms-world-hud-plate min-w-0 max-w-[min(28rem,78vw)] px-3 py-2">
          <p className="font-display text-[10px] uppercase tracking-[0.16em] text-ember/90">{actLabel}</p>
          <p className="mt-0.5 truncate text-secondary text-paper">{hud.objective}</p>
          <p className="mt-1 flex gap-3 font-mono text-[10px] tabular-nums text-muted">
            <span>D{hud.day}</span>
            <span>{hud.watchesLeft}w</span>
            {hud.heat > 0 ? <span className="text-ember">Heat {hud.heat}</span> : null}
          </p>
          {hud.situation ? (
            <button
              type="button"
              data-world-situation="1"
              className="mt-2 flex w-full flex-col items-start border-t border-ember/30 pt-2 text-left"
              onClick={() => {
                sfx.click();
                if (hud.situation?.poiId) selectPoi(hud.situation.poiId);
                window.dispatchEvent(new CustomEvent("hollow:open-situation"));
              }}
            >
              <span className="font-display text-[10px] uppercase tracking-[0.14em] text-ember">Situation</span>
              <span className="truncate font-display text-body text-paper">{hud.situation.title}</span>
              <span className="truncate font-mono text-[10px] text-muted">{hud.situation.place}</span>
            </button>
          ) : null}
          {hud.bulletin ? (
            <p
              data-world-bulletin="1"
              className="mt-2 border-t border-line/40 pt-2 font-mono text-[10px] leading-relaxed text-moon"
            >
              {hud.bulletin}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            data-world-journal="1"
            aria-label="Open journal"
            className="pointer-events-auto inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] border border-line/60 bg-ink/70 text-ember backdrop-blur-md"
            onClick={() => {
              sfx.click();
              onJournal?.();
            }}
          >
            <BookOpen className="size-5" />
          </button>
          <button
            type="button"
            data-help="1"
            aria-label="Ask Tyrone"
            className="pointer-events-auto inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] border border-line/60 bg-ink/70 text-ember backdrop-blur-md"
            onClick={() => {
              sfx.click();
              openGuide();
            }}
          >
            <CircleHelp className="size-5" />
          </button>
        </div>
      </div>
      {hud.tyroneLine ? (
        <p
          data-tyrone-whisper="1"
          className={cn(
            "pointer-events-none ms-world-whisper max-w-[min(32rem,92vw)] px-3 py-2 text-secondary text-moon",
          )}
        >
          <span className="font-display text-[10px] uppercase tracking-[0.14em] text-ember">Tyrone · </span>
          {hud.tyroneLine}
        </p>
      ) : null}
      {onPause ? (
        <button type="button" className="sr-only" onClick={onPause} aria-label="Open field menu">
          Menu
        </button>
      ) : null}
    </div>
  );
}
