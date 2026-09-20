import { preloadRoomArt, roomArtFor } from "@/game/rooms";
import { useGame } from "@/game/store";
import { cn } from "@/lib/cn";
import { useEffect } from "react";

export function SceneBackdrop({ className }: { className?: string }) {
  const screen = useGame((g) => g.s.screen);
  const src = roomArtFor(screen);
  useEffect(() => {
    preloadRoomArt();
  }, []);
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden data-scene-backdrop="1">
      <img
        key={src}
        src={src}
        alt=""
        decoding="async"
        data-scene-art="1"
        className="ms-scene-photo absolute inset-0 size-full object-cover object-center"
      />
      <div className="ms-scene-veil absolute inset-0" data-scene-veil="1" />
    </div>
  );
}
