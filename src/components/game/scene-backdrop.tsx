import { preloadRoomArt, roomArtFor } from "@/game/rooms";
import { useGame } from "@/game/store";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";

export function SceneBackdrop({ className }: { className?: string }) {
  const screen = useGame((g) => g.s.screen);
  const src = roomArtFor(screen);
  const [shown, setShown] = useState(src);

  useEffect(() => {
    if (src === shown) return;
    const img = new Image();
    img.decoding = "async";
    let live = true;
    img.onload = () => {
      if (live) setShown(src);
    };
    img.onerror = () => {
      if (live) setShown(src);
    };
    img.src = src;
    return () => {
      live = false;
    };
  }, [src, shown]);

  const warmNeighbours = () => preloadRoomArt(screen);
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden data-scene-backdrop="1">
      <img
        src={shown}
        alt=""
        decoding="async"
        fetchPriority="high"
        onLoad={warmNeighbours}
        onError={warmNeighbours}
        data-scene-art="1"
        className="ms-scene-photo absolute inset-0 size-full object-cover object-center"
      />
      <div className="ms-scene-veil absolute inset-0" data-scene-veil="1" />
    </div>
  );
}
