import type { LocationId } from "@/game/types";
import { HollowGlobe } from "./globe";

/**
 * WorldAtlas keeps the legacy component contract used by MapView while the
 * actual presentation is now the live Hollow Realm orbital globe.
 */
export function WorldAtlas({
  loc,
  onSelect,
}: {
  loc: LocationId;
  onSelect: (id: LocationId) => void;
}) {
  return <HollowGlobe loc={loc} onSelect={onSelect} />;
}
