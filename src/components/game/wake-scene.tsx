import { WAKE_REEL } from "@/game/opening-reel";
import { cn } from "@/lib/cn";
import { useEffect, useRef, useState } from "react";

export function WakeScene({
  className,
  sound = false,
  loop = false,
  onTime,
  onEnded,
}: {
  className?: string;
  sound?: boolean;
  loop?: boolean;
  onTime?: (seconds: number) => void;
  onEnded?: () => void;
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
  }, [reduced, sound, loop, armed]);

  const still = failed || reduced;

  return (
    <div
      className={cn("ms-wake-film pointer-events-none absolute inset-0 z-0 overflow-hidden bg-ink", className)}
      data-wake-clip="reel"
      aria-hidden
    >
      <img
        src={WAKE_REEL.poster}
        alt=""
        decoding="async"
        fetchPriority="high"
        className="ms-wake-still absolute inset-0 size-full object-cover object-center"
      />
      {!still && armed ? (
        <video
          ref={videoRef}
          src={WAKE_REEL.src}
          poster={WAKE_REEL.poster}
          autoPlay
          muted={!sound}
          loop={loop}
          playsInline
          preload="metadata"
          className={cn(
            "absolute inset-0 size-full object-cover object-center transition-opacity duration-500 md:object-contain",
            ready ? "opacity-100" : "opacity-0",
          )}
          onError={() => setFailed(true)}
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
      <div className="ms-wake-veil absolute inset-0" />
    </div>
  );
}
