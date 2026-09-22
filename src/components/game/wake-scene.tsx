import { kaneEdgeFade, kaneShotAt, stillSrcAt, WAKE_REEL, type KaneShot, type StillCue } from "@/game/opening-reel";
import { cn } from "@/lib/cn";
import { useEffect, useRef, useState } from "react";

export function WakeScene({
  className,
  sound = false,
  loop = false,
  clip = WAKE_REEL,
  veil = "wake",
  onTime,
  onEnded,
  onFail,
}: {
  className?: string;
  sound?: boolean;
  loop?: boolean;
  clip?: { src: string; poster: string; duration?: number };
  veil?: "wake" | "kane";
  onTime?: (seconds: number) => void;
  onEnded?: () => void;
  onFail?: () => void;
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
    if (reduced) return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const t = window.setTimeout(() => setArmed(true), coarse ? 180 : 40);
    return () => window.clearTimeout(t);
  }, [reduced]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || reduced || !armed) return;
    el.muted = !sound;
    el.defaultMuted = !sound;
    el.loop = loop;
    el.playsInline = true;
    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");
    const kick = () => {
      void el.play().catch(() => {});
    };
    kick();
    document.addEventListener("pointerdown", kick);
    document.addEventListener("touchstart", kick, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", kick);
      document.removeEventListener("touchstart", kick);
    };
  }, [reduced, sound, loop, armed, clip.src]);

  const still = failed || reduced;

  return (
    <div
      className={cn("ms-wake-film pointer-events-none absolute inset-0 z-0 overflow-hidden bg-ink", className)}
      data-wake-clip="reel"
      aria-hidden
    >
      <img
        src={clip.poster}
        alt=""
        decoding="async"
        fetchPriority="high"
        className="ms-wake-still absolute inset-0 size-full object-cover object-center"
      />
      {!still && armed ? (
        <video
          key={clip.src}
          ref={videoRef}
          src={clip.src}
          poster={clip.poster}
          autoPlay
          muted={!sound}
          loop={loop}
          playsInline
          preload="metadata"
          className={cn(
            "absolute inset-0 size-full object-cover object-center transition-opacity duration-500 md:object-contain",
            ready ? "opacity-100" : "opacity-0",
          )}
          onError={() => {
            setFailed(true);
            onFail?.();
          }}
          onPlaying={() => setReady(true)}
          onCanPlay={() => {
            setReady(true);
            void videoRef.current?.play().catch(() => {});
          }}
          onTimeUpdate={() => {
            const t = videoRef.current?.currentTime ?? 0;
            onTime?.(t);
          }}
          onEnded={() => onEnded?.()}
        />
      ) : null}
      <div className={veil === "kane" ? "ms-kane-veil absolute inset-0" : "ms-wake-veil absolute inset-0"} />
    </div>
  );
}

/** Kane chapter picture: timed office + Tyrone clips, stills if a clip 404s. */
export function KaneIntro({ time }: { time: number }) {
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState<Record<string, true>>({});
  const shot = kaneShotAt(time);
  const clipFailed = shot.kind === "clip" && Boolean(failed[shot.src]);
  const showStill = reduced || shot.kind === "still" || clipFailed;
  const stillSrc = shot.kind === "still" ? shot.src : shot.poster;
  const fade = reduced ? 0 : kaneEdgeFade(time);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div
      className="ms-wake-film pointer-events-none absolute inset-0 z-0 overflow-hidden bg-ink"
      data-wake-clip="kane"
      data-kane-subject={shot.subject}
      aria-hidden
    >
      <img
        src={stillSrc}
        alt=""
        decoding="async"
        className="absolute inset-0 size-full object-cover object-center"
      />
      {!showStill ? (
        <KaneShotVideo
          key={`${shot.at}:${shot.src}:${shot.startAt ?? 0}`}
          shot={shot}
          onFail={() => setFailed((map) => ({ ...map, [shot.src]: true }))}
        />
      ) : null}
      <div className="ms-kane-veil absolute inset-0" />
      <div className="ms-kane-shot-black absolute inset-0" style={{ opacity: fade }} />
    </div>
  );
}

function KaneShotVideo({
  shot,
  onFail,
}: {
  shot: KaneShot;
  onFail: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const t = window.setTimeout(() => setArmed(true), coarse ? 180 : 40);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !armed) return;
    el.muted = true;
    el.defaultMuted = true;
    el.loop = false;
    el.playsInline = true;
    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");
    const seek = () => {
      if (shot.startAt && Number.isFinite(shot.startAt)) {
        try {
          el.currentTime = shot.startAt;
        } catch {
          /* seek is best-effort before play */
        }
      }
    };
    const kick = () => {
      seek();
      void el.play().catch(() => {});
    };
    seek();
    kick();
    el.addEventListener("loadedmetadata", seek);
    document.addEventListener("pointerdown", kick);
    document.addEventListener("touchstart", kick, { passive: true });
    return () => {
      el.removeEventListener("loadedmetadata", seek);
      document.removeEventListener("pointerdown", kick);
      document.removeEventListener("touchstart", kick);
    };
  }, [armed, shot.src, shot.startAt]);

  if (!armed) return null;

  return (
    <video
      ref={videoRef}
      src={shot.src}
      poster={shot.poster}
      autoPlay
      muted
      playsInline
      preload="auto"
      className={cn(
        "absolute inset-0 size-full object-cover object-center transition-opacity duration-500 md:object-contain",
        ready ? "opacity-100" : "opacity-0",
      )}
      onError={onFail}
      onPlaying={() => setReady(true)}
      onCanPlay={() => {
        setReady(true);
        void videoRef.current?.play().catch(() => {});
      }}
      onEnded={() => {
        videoRef.current?.pause();
      }}
    />
  );
}

export function OpeningStills({
  stills,
  time,
  className,
  veil = "wake",
}: {
  stills: readonly StillCue[];
  time: number;
  className?: string;
  veil?: "wake" | "kane";
}) {
  const src = stillSrcAt(stills, time);
  const [shown, setShown] = useState(src);
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    if (src === shown) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(src);
      setNext(null);
      return;
    }
    setNext(src);
    const t = window.setTimeout(() => {
      setShown(src);
      setNext(null);
    }, 920);
    return () => window.clearTimeout(t);
  }, [src, shown]);

  return (
    <div
      className={cn("ms-wake-film pointer-events-none absolute inset-0 z-0 overflow-hidden bg-ink", className)}
      data-wake-clip="stills"
      aria-hidden
    >
      <img src={shown} alt="" className="absolute inset-0 size-full object-cover object-[center_18%]" />
      {next ? (
        <img
          src={next}
          alt=""
          className="ms-opening-crossfade absolute inset-0 size-full object-cover object-[center_18%]"
        />
      ) : null}
      <div className={veil === "kane" ? "ms-kane-veil absolute inset-0" : "ms-wake-veil absolute inset-0"} />
    </div>
  );
}
