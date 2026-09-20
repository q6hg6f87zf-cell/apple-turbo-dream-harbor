import { preloadRoomArt, roomArtFor } from "@/game/rooms";
import { useGame } from "@/game/store";
import { cn } from "@/lib/cn";

export function SceneBackdrop({ className }: { className?: string }) {
  const screen = useGame((g) => g.s.screen);
  const src = roomArtFor(screen);
  const warmNeighbours = () => preloadRoomArt(screen);
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden data-scene-backdrop="1">
      <img
        key={src}
        src={src}
        alt=""
        decoding="async"
        onLoad={warmNeighbours}
        onError={warmNeighbours}
        data-scene-art="1"
        className="ms-scene-photo absolute inset-0 size-full object-cover object-center"
      />
      <div className="ms-scene-veil absolute inset-0" data-scene-veil="1" />
    </div>
  );
}
