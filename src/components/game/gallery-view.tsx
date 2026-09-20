import { Button } from "@/components/ui/button";
import { pauseRadio, resumeRadio } from "@/game/radio";
import { GALLERY, wakeCaption, wakeLineAt, type GalleryItem } from "@/game/opening-reel";
import { useGame } from "@/game/store";
import { cn } from "@/lib/cn";
import { ChevronLeft, Film, Image as ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function GalleryView() {
  const setScreen = useGame((g) => g.setScreen);
  const [active, setActive] = useState<GalleryItem | null>(null);

  useEffect(() => {
    pauseRadio();
    return () => {
      void resumeRadio();
    };
  }, []);

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-ink text-paper" data-gallery="1">
      <header
        className="flex shrink-0 items-center gap-2 border-b border-line/50 bg-ink/70 px-2 pb-1 backdrop-blur-md"
        style={{ paddingTop: "max(0.25rem, env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          onClick={() => setScreen("more")}
          className="inline-flex min-h-11 min-w-11 items-center gap-1 rounded-[var(--radius-sm)] px-2"
          aria-label="Back"
        >
          <ChevronLeft className="size-5" />
          <span className="font-display text-label uppercase tracking-[0.12em]">Back</span>
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center font-display text-body">Vault Reels</h1>
        <span className="w-16" />
      </header>

      <div className="ms-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <p className="text-sm text-muted">
          The opening is not a one-shot. Sit it again. Stills from the east highway stay on the wall.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {GALLERY.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item)}
              className="overflow-hidden rounded-[var(--radius-lg)] border border-line/80 bg-raised text-left shadow-[var(--shadow-border)]"
            >
              <span className="relative block aspect-[9/16] max-h-72 w-full overflow-hidden bg-ink">
                <img
                  src={item.kind === "reel" ? item.poster : item.src}
                  alt=""
                  className="size-full object-cover object-center"
                  onError={(e) => {
                    e.currentTarget.style.visibility = "hidden";
                  }}
                />
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink/80 px-2 py-1 font-display text-[9px] uppercase tracking-[0.16em] text-ember">
                  {item.kind === "reel" ? <Film className="size-3" /> : <ImageIcon className="size-3" />}
                  {item.eyebrow}
                </span>
                {item.kind === "reel" ? (
                  <span className="absolute bottom-2 right-2 font-mono text-[10px] text-paper/80">{fmt(item.duration)}</span>
                ) : null}
              </span>
              <span className="block p-3">
                <span className="block font-display text-base text-paper">{item.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">{item.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {active ? <GalleryStage item={active} onClose={() => setActive(null)} /> : null}
    </div>
  );
}

function GalleryStage({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [line, setLine] = useState(0);
  const caption = item.kind === "reel" && item.captions ? wakeCaption(line) : "";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink" data-gallery-stage={item.id}>
      {item.kind === "still" ? (
        <img src={item.src} alt={item.title} className="absolute inset-0 size-full object-contain" />
      ) : (
        <video
          ref={videoRef}
          src={item.src}
          poster={item.poster}
          autoPlay
          controls
          playsInline
          className="absolute inset-0 size-full object-contain"
          onTimeUpdate={() => {
            if (!item.captions) return;
            setLine(wakeLineAt(videoRef.current?.currentTime ?? 0));
          }}
        />
      )}
      <div className="relative z-[1] flex items-start justify-between gap-3 p-3" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <div>
          <p className="font-display text-[10px] uppercase tracking-[0.2em] text-ember">{item.eyebrow}</p>
          <p className="font-display text-lg text-paper">{item.title}</p>
        </div>
        <Button size="sm" variant="quiet" onClick={onClose}>
          Close
        </Button>
      </div>
      {caption ? (
        <div className="relative z-[1] mt-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="mx-auto max-w-xl rounded-[var(--radius-lg)] bg-ink/85 p-3 text-sm leading-relaxed text-paper shadow-[var(--shadow-border)]">
            {caption.replaceAll("{name}", "partner")}
          </p>
        </div>
      ) : null}
    </div>
  );
}