import type { LocationId } from "@/game/types";
import { HollowGlobeAAA } from "./globe-aaa";

/**
 * WorldAtlas keeps the legacy component contract used by MapView while the
 * presentation is handled by the cinematic Hollow Realm orbital renderer.
 */
export function WorldAtlas({
  loc,
  onSelect,
}: {
  loc: LocationId;
  onSelect: (id: LocationId) => void;
}) {
  return <HollowGlobeAAA loc={loc} onSelect={onSelect} />;
}
