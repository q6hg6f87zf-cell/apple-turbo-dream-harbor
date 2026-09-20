import { cn } from "@/lib/cn";
import { useEffect, useRef, useState } from "react";

const VAULT = {
  src: "/art/opening/vault-13.mp4",
  poster: "/art/opening/vault-wake.jpg",
};

const TYRONE = {
  src: "/art/opening/tyrone-roll.mp4",
  poster: "/art/opening/tyrone-arrive.jpg",
};

export function WakeScene({ line = 0, className }: { line?: number; className?: string }) {
  const clip = line >= 4 ? "tyrone" : "vault";
  const pack = clip === "tyrone" ? TYRONE : VAULT;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    setFailed(false);
  }, [pack.src]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || reduced) return;
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");
    const kick = () => {
      void el.play().catch(() => {
        /* poster is the real vault / Tyrone still — never a title plate */
      });
    };
    kick();
    document.addEventListener("pointerdown", kick);
    document.addEventListener("touchstart", kick, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", kick);
      document.removeEventListener("touchstart", kick);
    };
  }, [pack.src, reduced]);

  const still = failed || reduced;

  return (
    <div
      className={cn("ms-wake-film pointer-events-none absolute inset-0 z-0 overflow-hidden bg-ink", className)}
      data-wake-clip={clip}
      aria-hidden
    >
      <img
        src={pack.poster}
        alt=""
        decoding="async"
        className="ms-wake-still absolute inset-0 size-full object-cover object-center"
      />
      {!still ? (
        <video
          ref={videoRef}
          key={pack.src}
          src={pack.src}
          poster={pack.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 size-full object-cover object-center"
          onError={() => setFailed(true)}
          onCanPlay={() => void videoRef.current?.play().catch(() => {})}
        />
      ) : null}
      <div className="ms-wake-veil absolute inset-0" />
    </div>
  );
}
