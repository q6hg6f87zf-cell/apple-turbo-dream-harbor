import { sfx, startAmbient, unlockAudio } from "@/game/audio";
import {
  bootLoadPercent,
  bootStageLabel,
  bootStageName,
  dismissSynapseSplash,
  enterPorch,
  useOpeningBeat,
} from "@/game/opening";
import { preloadRoomArt } from "@/game/rooms";
import { useGame } from "@/game/store";
import { cn } from "@/lib/cn";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

function gearPath(teeth: number, outer = 46, inner = 34, hole = 11, depth = 7) {
  const tw = Math.PI / teeth;
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * 2 * tw - Math.PI / 2;
    const polar = (r: number, ang: number) => `${(50 + r * Math.cos(ang)).toFixed(2)},${(50 + r * Math.sin(ang)).toFixed(2)}`;
    pts.push(polar(outer, a - tw * 0.32));
    pts.push(polar(outer + depth, a - tw * 0.16));
    pts.push(polar(outer + depth, a + tw * 0.16));
    pts.push(polar(outer, a + tw * 0.32));
  }
  return `M ${pts.join(" L ")} Z M ${50 + hole},50 A ${hole} ${hole} 0 1 0 ${50 - hole},50 A ${hole} ${hole} 0 1 0 ${50 + hole},50 Z`;
}

const GEARS = [
  { teeth: 16, size: "42vmin", left: "18%", top: "40%", duration: "36s", reverse: false, opacity: 0.42 },
  { teeth: 12, size: "22vmin", left: "42%", top: "52%", duration: "22s", reverse: true, opacity: 0.38 },
  { teeth: 10, size: "14vmin", left: "12%", top: "22%", duration: "14s", reverse: true, opacity: 0.34 },
  { teeth: 8, size: "11vmin", left: "58%", top: "44%", duration: "11s", reverse: false, opacity: 0.3 },
  { teeth: 9, size: "13vmin", left: "34%", top: "68%", duration: "18s", reverse: true, opacity: 0.28 },
];

function GearField() {
  const paths = useMemo(() => {
    const cache = new Map<number, string>();
    return GEARS.map((g) => {
      let d = cache.get(g.teeth);
      if (!d) {
        d = gearPath(g.teeth);
        cache.set(g.teeth, d);
      }
      return { ...g, d };
    });
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" data-gears="1" aria-hidden>
      {paths.map((g, i) => (
        <svg
          key={i}
          viewBox="0 0 100 100"
          className={cn("ms-gear absolute", g.reverse && "ms-gear-rev")}
          style={{
            width: g.size,
            height: g.size,
            left: g.left,
            top: g.top,
            opacity: g.opacity,
            animationDuration: g.duration,
          }}
        >
          <path d={g.d} fill="currentColor" fillRule="evenodd" />
          <circle cx="50" cy="50" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        </svg>
      ))}
      <div className="ms-title-lamps absolute inset-0" />
    </div>
  );
}

function DustField() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} className="ms-dust" style={{ "--dust-i": String(i) } as CSSProperties} />
      ))}
    </div>
  );
}

export function TitleBackdrop({
  className,
  live = true,
}: {
  className?: string;
  live?: boolean;
}) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-ink", className)} data-title-scene="1">
      <img src="/art/title-plate.jpg" alt="" aria-hidden className="title-fill absolute inset-0 size-full" />
      <img
        src="/art/title-plate.jpg"
        alt="The Hollow Realm"
        fetchPriority="high"
        decoding="async"
        className="title-plate-hero absolute inset-0 size-full"
      />
      {live ? <GearField /> : null}
      {live ? <DustField /> : null}
    </div>
  );
}

export function SynapseLoadBar({
  value,
  label,
}: {
  value: number | null;
  label: string;
}) {
  const pct = value == null ? null : Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="ms-boot-meter" data-boot-bar="1" data-boot-label={label}>
      <div
        className={cn("ms-boot-track", pct == null && "is-indet")}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct ?? undefined}
        aria-label={label}
      >
        <div className="ms-boot-fill" style={pct == null ? undefined : { width: `${pct}%` }} />
      </div>
      <div className="ms-boot-meta">
        <span>{label}</span>
        <span>{pct == null ? "…" : `${pct}%`}</span>
      </div>
    </div>
  );
}

export function OpeningBoot({
  children,
  gateReady = true,
}: {
  children: ReactNode;
  gateReady?: boolean;
}) {
  const beat = useOpeningBeat();
  const hydrated = useGame((store) => store.hydrated);
  const startedAt = useRef(Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [porchLit, setPorchLit] = useState(false);

  useEffect(() => {
    preloadRoomArt();
    dismissSynapseSplash();
  }, []);

  useEffect(() => {
    if (beat !== "boot") return;
    const t = window.setInterval(() => setNow(Date.now()), 90);
    return () => window.clearInterval(t);
  }, [beat]);

  useEffect(() => {
    if (beat !== "boot" || !hydrated || !gateReady) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setPorchLit(true), reduced ? 40 : 420);
    return () => window.clearTimeout(t);
  }, [beat, gateReady, hydrated]);

  useEffect(() => {
    if (beat !== "boot" || !porchLit) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => enterPorch(), reduced ? 60 : 380);
    return () => window.clearTimeout(t);
  }, [beat, porchLit]);

  const stage = bootStageName({ hydrated, uplinkReady: gateReady && hydrated, porchLit });
  const pct = bootLoadPercent({
    hydrated,
    uplinkReady: gateReady && hydrated,
    porchLit,
    startedAt: startedAt.current,
    now,
  });

  const open = () => {
    try {
      unlockAudio();
      startAmbient();
      sfx.machine();
    } finally {
      enterPorch();
    }
  };

  return (
    <>
      <div
        className={cn("fixed inset-0 z-40 bg-ink transition-opacity duration-700", beat !== "boot" && "pointer-events-none opacity-0")}
        data-opening={beat}
        aria-hidden
      />
      {beat === "boot" ? (
        <button
          type="button"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink"
          onClick={open}
          data-enter-hollow="1"
        >
          <span className="font-display text-[11px] uppercase tracking-[0.48em] text-ember">Moon Squad HQ</span>
          <span className="mt-3 font-display text-3xl text-paper md:text-4xl">The Hollow Realm</span>
          <span className="mt-2 font-display text-[11px] uppercase tracking-[0.28em] text-ember">S.Y.N.A.P.S.E T-0880</span>
          <div className="mt-8 w-[min(18rem,70vw)]" data-boot-stage={stage} data-boot-pct={Math.round(pct)}>
            <SynapseLoadBar value={pct} label={bootStageLabel(stage)} />
          </div>
          <span className="mt-4 font-display text-[11px] uppercase tracking-[0.28em] text-muted">
            {porchLit ? "Porch open" : "Tap to enter"}
          </span>
        </button>
      ) : null}
      <div
        className={cn(
          "relative z-[2] flex min-h-0 flex-1 flex-col",
          beat === "boot" ? "hidden" : "ms-title-panel-in",
        )}
      >
        {children}
      </div>
    </>
  );
}
