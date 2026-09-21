import { sfx, startAmbient, unlockAudio } from "@/game/audio";
import {
  bootLoadPercent,
  bootStageLabel,
  bootStageName,
  dismissSynapseSplash,
  enterPorch,
  useOpeningBeat,
} from "@/game/opening";
import { TITLE_REEL } from "@/game/opening-reel";
import { armScore, getRadioSnapshot, playScore, resumeRadio } from "@/game/radio";
import { preloadRoomArt } from "@/game/rooms";
import { useGame } from "@/game/store";
import { cn } from "@/lib/cn";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function TitleBackdrop({
  className,
  live = true,
}: {
  className?: string;
  live?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!live) return;
    armScore("title");
    void playScore("title");
  }, [live]);

  useEffect(() => {
    if (!live || reduced) return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const t = window.setTimeout(() => setArmed(true), coarse ? 900 : 280);
    return () => window.clearTimeout(t);
  }, [live, reduced]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || reduced || !live || !armed) return;
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    const kick = () => {
      void el.play().catch(() => {});
      const snap = getRadioSnapshot();
      if (snap.mode === "score" && !snap.playing) void resumeRadio();
    };
    kick();
    document.addEventListener("pointerdown", kick);
    document.addEventListener("touchstart", kick, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", kick);
      document.removeEventListener("touchstart", kick);
    };
  }, [live, reduced, armed]);

  const still = failed || reduced || !live;

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-ink", className)} data-title-scene="1">
      <img
        src={TITLE_REEL.poster}
        alt=""
        aria-hidden
        className="title-fill absolute inset-0 size-full"
      />
      <img
        src={TITLE_REEL.poster}
        alt="The Hollow Realm"
        fetchPriority="high"
        decoding="async"
        className="title-plate-hero absolute inset-0 size-full object-cover object-[center_28%] md:object-contain"
      />
      {!still && armed ? (
        <video
          ref={videoRef}
          src={TITLE_REEL.src}
          poster={TITLE_REEL.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          data-title-reel="1"
          className={cn(
            "absolute inset-0 size-full object-cover object-[center_28%] transition-opacity duration-500 md:object-contain",
            ready ? "opacity-100" : "opacity-0",
          )}
          onError={() => setFailed(true)}
          onPlaying={() => setReady(true)}
          onCanPlay={() => {
            setReady(true);
            void videoRef.current?.play().catch(() => {});
          }}
        />
      ) : null}
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
      armScore("title");
      unlockAudio();
      void playScore("title");
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
