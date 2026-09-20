import { compactTyroneContext } from "@/game/tyrone-voice";
import { currentBeat, raidGate, defaultPartyIds } from "@/game/tyrone-rules";
import { useGame } from "@/game/store";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export function TyroneDebugPanel() {
  const s = useGame((g) => g.s);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "`" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!import.meta.env.DEV) return null;
  if (!s.started) return null;

  const mind = s.tyrone;
  const beat = currentBeat(s);
  const loc = s.selectedLoc ?? "ironclad";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[5.8rem] left-3 z-30 hidden min-h-10 items-center rounded-full border border-line bg-surface/90 px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-muted md:inline-flex"
      >
        T-0880 mind
      </button>
      {open ? (
        <div className="fixed inset-0 z-[96] flex items-end bg-ink/70 p-3 md:items-center md:justify-center" onClick={() => setOpen(false)}>
          <div
            className="ms-pop max-h-[88vh] w-full overflow-y-auto rounded-[var(--radius-xl)] border border-line bg-surface p-4 text-left shadow-2xl md:max-w-lg ms-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-[10px] uppercase tracking-[0.2em] text-ember">Tyrone intelligence</p>
                <p className="mt-1 font-mono text-[11px] text-muted">DEV · Ctrl-`</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex size-10 items-center justify-center rounded-full text-muted">
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-3 text-sm text-paper">
              {mind.lastSpeakReason ? `SPOKE BECAUSE: ${mind.lastSpeakReason}` : `STAYED SILENT BECAUSE: ${mind.lastSilentReason}`}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2 font-mono text-[10px] text-muted">
              <div>assist {mind.settings.assist}</div>
              <div>speech {mind.speechCount}</div>
              <div>trust {Math.round(mind.relationship.trust)}</div>
              <div>concern {Math.round(mind.relationship.concern)}</div>
              <div>episodes {mind.episodic.length}</div>
              <div>facts {mind.semantic.length}</div>
              <div>beat {beat ? `${beat.stat} DC ${beat.dc}` : "none"}</div>
              <div>matrix {raidGate(s, loc, defaultPartyIds(s)) ? "blocked" : "open"}</div>
            </dl>
            <pre className="mt-3 max-h-48 overflow-auto rounded-[var(--radius-sm)] bg-ink p-2 font-mono text-[10px] leading-relaxed text-ember-bright ms-scroll">
              {JSON.stringify(compactTyroneContext(s), null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </>
  );
}
