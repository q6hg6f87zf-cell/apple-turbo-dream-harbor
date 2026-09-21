import { Button } from "@/components/ui/button";
import { sfx } from "@/game/audio";
import { locById } from "@/game/data";
import { DEPTH_BLURB, leadById, openReport, threadFor, threadStage } from "@/game/recon";
import { WATCH_LABEL } from "@/game/shift";
import { useGame } from "@/game/store";
import type { ReconFinding, ReconStep, SiteReport } from "@/game/types";
import { cn } from "@/lib/cn";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import { CommandBar, EncounterBackdrop } from "./encounter-scene";
import { SectionLabel } from "./primitives";
import { useDialogFocus } from "./use-dialog-focus";

const TONE: Record<ReconFinding["tone"], string> = {
  good: "text-ok",
  warn: "text-ember",
  bad: "text-danger",
  neutral: "text-moon",
};

const TONE_RAIL: Record<ReconFinding["tone"], string> = {
  good: "bg-ok/70",
  warn: "bg-ember/70",
  bad: "bg-danger/70",
  neutral: "bg-line",
};

/**
 * What a sweep found, as a place you stand in rather than a toast that scrolls
 * past. The old flow put the entire result of working a site into one sentence
 * that vanished in under three seconds, and once every pin had been touched it
 * had nothing left to say at all — which is where players got stuck.
 *
 * The rule here is that no report closes without a verb on it. Even a spent
 * shift is a report, and its primary button is Rest.
 */
export function ReconReportOverlay() {
  const report = useGame((g) => openReport(g.s));
  const dismiss = useGame((g) => g.dismissReport);
  const follow = useGame((g) => g.followStep);
  const focus = useDialogFocus<HTMLDivElement>();

  useEffect(() => {
    if (!report) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.repeat) return;
      e.preventDefault();
      e.stopPropagation();
      dismiss();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [report, dismiss]);

  if (!report) return null;

  const body = <ReportBody report={report} focus={focus} onClose={dismiss} onStep={follow} />;
  if (typeof document === "undefined") return body;
  return createPortal(body, document.body);
}

function ReportBody({
  report,
  focus,
  onClose,
  onStep,
}: {
  report: SiteReport;
  focus: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onStep: (step: ReconStep) => string | null;
}) {
  // One state selector, then derive. `.map().filter()` inside a selector builds
  // a new array on every store tick and re-renders without end.
  const s = useGame((g) => g.s);
  const leads = report.leadIds.map((id) => leadById(s, id)).filter(Boolean);
  const stage = threadStage(s, report.regionId);
  const thread = threadFor(report.regionId);
  const L = locById(report.locationId);
  const primary = report.steps.find((s) => s.primary) ?? report.steps[0];
  const rest = report.steps.filter((s) => s !== primary);

  return (
    <div
      ref={focus}
      role="dialog"
      aria-modal="true"
      aria-label={`${report.poiName} report`}
      className="fixed inset-0 z-[62] flex flex-col bg-ink"
      data-recon-report={report.poiId}
    >
      <EncounterBackdrop
        locationId={report.locationId}
        tone={report.findings.some((f) => f.tone === "bad") ? "danger" : "neutral"}
      />

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <header className="shrink-0 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-label uppercase tracking-[0.22em] text-ember">
                Field report · day {report.day} · {WATCH_LABEL[report.watch]} · {L.short}
              </p>
              <h2 className="mt-1 font-display text-2xl leading-tight text-paper">{report.headline}</h2>
              <p className="mt-1 text-secondary text-moon">
                {report.depthLabel} · sweep {report.sweep}
                {report.watchSpent ? ` · ${report.watchSpent} watch` : " · no watch spent"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sfx.click();
                onClose();
              }}
              aria-label="Close report"
              data-recon-close="1"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-muted"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {report.caps > 0 ? <Stat label="Caps" value={`+${report.caps}`} tone="text-ok" /> : null}
            {report.intel > 0 ? <Stat label="Intel" value={`+${report.intel}`} tone="text-ok" /> : null}
            {report.items.length ? <Stat label="Stowed" value={String(report.items.length)} tone="text-ok" /> : null}
            <Stat label="Kane" value={String(report.heat)} tone={report.heat >= 10 ? "text-danger" : "text-muted"} />
          </div>
        </header>

        <div className="ms-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <section>
            <SectionLabel>What the ground said</SectionLabel>
            <ul className="space-y-2">
              {report.findings.map((f) => (
                <li
                  key={f.key}
                  className="flex gap-3 rounded-[var(--radius-md)] bg-ink/70 px-3 py-2.5 shadow-[var(--shadow-border)] backdrop-blur-sm"
                >
                  <span className={cn("mt-0.5 w-1 shrink-0 rounded-full", TONE_RAIL[f.tone])} aria-hidden />
                  <span className="min-w-0">
                    <span className={cn("block font-display text-label uppercase tracking-[0.14em]", TONE[f.tone])}>
                      {f.label}
                    </span>
                    <span className="mt-0.5 block text-secondary leading-relaxed text-moon">{f.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {leads.length ? (
            <section>
              <SectionLabel>Leads</SectionLabel>
              {leads.map((lead) =>
                lead ? (
                  <div
                    key={lead.id}
                    className="mb-2 rounded-[var(--radius-md)] bg-ember/10 px-3 py-3 shadow-[var(--shadow-border-hover)]"
                    data-lead={lead.id}
                  >
                    <p className="font-display text-body text-paper">{lead.title}</p>
                    <p className="mt-1 text-secondary leading-relaxed text-moon">{lead.detail}</p>
                    <p className="mt-1 text-secondary leading-relaxed text-ember">{lead.read}</p>
                    <p className="mt-1 font-display text-label uppercase tracking-[0.14em] text-muted">
                      {lead.missionKind} · DC {lead.dcMod >= 0 ? "+" : ""}
                      {lead.dcMod} · +{lead.capsBonus} caps
                      {lead.lootRolls ? ` · +${lead.lootRolls} loot roll${lead.lootRolls === 1 ? "" : "s"}` : ""} · good
                      until day {lead.expiresDay}
                    </p>
                  </div>
                ) : null,
              )}
            </section>
          ) : null}

          <section>
            <SectionLabel>Read</SectionLabel>
            <p className="text-body leading-relaxed text-paper">{report.tyrone}</p>
            <p className="mt-2 text-body leading-relaxed text-moon">{report.hollow}</p>
            <p className="mt-2 text-secondary leading-relaxed text-muted">
              {DEPTH_BLURB[Math.max(0, Math.min(4, report.depth))]}
            </p>
          </section>

          {report.threadLine ? (
            <section className="rounded-[var(--radius-md)] bg-ink/75 px-3 py-3 shadow-[var(--shadow-border-hover)]">
              <SectionLabel>The thread moves</SectionLabel>
              <p className="text-body leading-relaxed text-paper">{report.threadLine}</p>
            </section>
          ) : thread ? (
            <section>
              <SectionLabel>{thread.title}</SectionLabel>
              <p className="text-secondary leading-relaxed text-moon">{thread.stages[stage]}</p>
              <p className="mt-1 font-display text-label uppercase tracking-[0.14em] text-muted">
                Stage {stage + 1} of {thread.stages.length} · intel opens the next one
              </p>
            </section>
          ) : null}
        </div>

        <CommandBar>
          <div className="space-y-2">
            {primary ? (
              <Button
                className="w-full"
                variant="ember"
                sound="none"
                autoFocus
                data-recon-step={primary.id}
                data-recon-primary="1"
                onClick={() => {
                  sfx.click();
                  onStep(primary);
                }}
              >
                {primary.label}
              </Button>
            ) : null}
            {primary ? <p className="text-label text-muted">{primary.hint}</p> : null}
            {rest.length ? (
              <div className="grid grid-cols-2 gap-2">
                {rest.map((step, i) => (
                  <button
                    key={`${step.id}-${i}`}
                    type="button"
                    data-recon-step={step.id}
                    onClick={() => {
                      sfx.click();
                      onStep(step);
                    }}
                    className="flex min-h-14 flex-col items-start justify-center rounded-[var(--radius-md)] bg-ink/80 px-3 py-2 text-left shadow-[var(--shadow-border)] backdrop-blur-sm"
                  >
                    <span className="w-full truncate font-display text-label uppercase tracking-[0.14em] text-paper">
                      {step.label}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-secondary leading-snug text-muted">{step.hint}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </CommandBar>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <span className={cn("rounded-full bg-ink/70 px-2.5 py-1 font-display text-label uppercase tracking-[0.14em]", tone)}>
      {label} {value}
    </span>
  );
}
