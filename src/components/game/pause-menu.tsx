import { sfx } from "@/game/audio";
import {
  availableApproaches,
  availableScenarios,
  scenarioById,
} from "@/game/scenario";
import { GAME_MENU } from "@/game/shell";
import { actTitle, activeStoryBeat } from "@/game/story-spine";
import { useGame } from "@/game/store";
import type { StoryActId } from "@/game/narrative-state";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

type Pane = "menu" | "journal" | "scenario";

/**
 * Diegetic field menu — Character / Inventory / Journal / Map / Ledger /
 * Settings. Replaces dashboard sprawl without removing dock reachability.
 */
export function PauseMenu({ open, onClose, initial = "menu" }: { open: boolean; onClose: () => void; initial?: Pane }) {
  const s = useGame((g) => g.s);
  const setScreen = useGame((g) => g.setScreen);
  const resolveScenario = useGame((g) => g.resolveScenario);
  const [pane, setPane] = useState<Pane>(initial);
  useEffect(() => {
    if (open) setPane(initial);
  }, [open, initial]);

  const scenarios = availableScenarios(s);
  const beat = activeStoryBeat(s);
  const journal = s.narrative?.journal ?? [];
  const openScenario = scenarios[0];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center md:items-center" data-pause-menu="1" role="dialog" aria-label="Field menu">
      <button type="button" className="absolute inset-0 bg-ink/70 backdrop-blur-sm" aria-label="Close menu" onClick={onClose} />
      <div className="relative z-10 flex max-h-[min(88dvh,40rem)] w-full max-w-lg flex-col overflow-hidden border border-line/70 bg-surface/95 shadow-2xl md:rounded-[var(--radius-md)]">
        <header className="flex items-center justify-between gap-2 border-b border-line/60 px-4 py-3">
          <div className="min-w-0">
            <p className="font-display text-[10px] uppercase tracking-[0.16em] text-ember">
              {pane === "journal" ? "Field journal" : pane === "scenario" ? "Situation" : "Field menu"}
            </p>
            <h2 className="truncate font-display text-lg text-paper">
              {pane === "menu"
                ? actTitle((s.narrative?.act ?? "prologue") as StoryActId)
                : pane === "journal"
                  ? "What you know"
                  : (openScenario?.title ?? "Situation")}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="inline-flex size-11 items-center justify-center text-muted"
            onClick={() => {
              sfx.click();
              onClose();
            }}
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="ms-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {pane === "menu" ? (
            <div className="space-y-1">
              {beat ? (
                <p className="mb-3 border-l-2 border-ember/70 pl-3 text-secondary text-muted">
                  <span className="font-display text-label uppercase tracking-[0.12em] text-ember">{beat.title}</span>
                  <br />
                  {beat.objective}
                </p>
              ) : null}
              {GAME_MENU.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  data-pause-item={row.id}
                  className="flex min-h-12 w-full flex-col items-start rounded-[var(--radius-sm)] px-3 py-2 text-left hover:bg-raised"
                  onClick={() => {
                    sfx.click();
                    if (row.id === "journal") {
                      setPane("journal");
                      return;
                    }
                    if (row.id === "settings") {
                      onClose();
                      return;
                    }
                    setScreen(row.id as never);
                    onClose();
                  }}
                >
                  <span className="font-display text-body text-paper">{row.label}</span>
                  <span className="text-label text-muted">{row.blurb}</span>
                </button>
              ))}
              {openScenario ? (
                <button
                  type="button"
                  data-pause-item="scenario"
                  className="mt-2 flex min-h-12 w-full flex-col items-start rounded-[var(--radius-sm)] border border-ember/40 bg-ember/10 px-3 py-2 text-left"
                  onClick={() => {
                    sfx.click();
                    setPane("scenario");
                  }}
                >
                  <span className="font-display text-body text-ember">{openScenario.title}</span>
                  <span className="text-label text-muted">A situation is open. Choices matter.</span>
                </button>
              ) : null}
            </div>
          ) : null}

          {pane === "journal" ? (
            <div className="space-y-3">
              <button type="button" className="text-label uppercase tracking-[0.12em] text-ember" onClick={() => setPane("menu")}>
                ← Menu
              </button>
              {journal.length === 0 ? (
                <p className="text-secondary text-muted">Nothing written yet. Walk the Hollow.</p>
              ) : (
                journal.map((entry) => (
                  <article key={entry.id} className="border-b border-line/40 pb-3">
                    <p className="font-mono text-[10px] text-muted">
                      D{entry.day} · {entry.act}
                    </p>
                    <h3 className="font-display text-body text-paper">{entry.title}</h3>
                    <p className="mt-1 text-secondary text-muted">{entry.body}</p>
                  </article>
                ))
              )}
            </div>
          ) : null}

          {pane === "scenario" && openScenario ? (
            <ScenarioPane
              scenarioId={openScenario.id}
              onBack={() => setPane("menu")}
              onResolved={onClose}
              resolve={resolveScenario}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ScenarioPane({
  scenarioId,
  onBack,
  onResolved,
  resolve,
}: {
  scenarioId: string;
  onBack: () => void;
  onResolved: () => void;
  resolve: (scenarioId: string, approachId: string) => string | null;
}) {
  const s = useGame((g) => g.s);
  const def = scenarioById(scenarioId);
  if (!def) return null;
  const approaches = availableApproaches(s, def);

  return (
    <div className="space-y-3">
      <button type="button" className="text-label uppercase tracking-[0.12em] text-ember" onClick={onBack}>
        ← Menu
      </button>
      <p className="text-secondary text-paper">{def.setup}</p>
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{def.locationLabel}</p>
      <div className="space-y-2">
        {approaches.map((a) => (
          <button
            key={a.id}
            type="button"
            data-scenario-approach={a.id}
            className={cn(
              "flex min-h-12 w-full flex-col items-start rounded-[var(--radius-sm)] border border-line/50 bg-ink/40 px-3 py-2 text-left hover:border-ember/50",
            )}
            onClick={() => {
              sfx.click();
              resolve(scenarioId, a.id);
              onResolved();
            }}
          >
            <span className="font-display text-body text-paper">{a.label}</span>
            {a.reason ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ember">{a.reason}</span>
            ) : null}
            <span className="text-label text-muted">{a.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
