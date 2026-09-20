import type { LocationId } from "@/game/types";
import { HollowGlobeWebGL } from "./globe-webgl";

/**
 * WorldAtlas keeps the legacy component contract used by MapView while the
 * presentation is handled by the WebGL Hollow Realm orbital renderer.
 */
export function WorldAtlas({
  loc,
  onSelect,
  theater = false,
}: {
  loc: LocationId;
  onSelect: (id: LocationId) => void;
  theater?: boolean;
}) {
  return <HollowGlobeWebGL loc={loc} onSelect={onSelect} theater={theater} />;
}
