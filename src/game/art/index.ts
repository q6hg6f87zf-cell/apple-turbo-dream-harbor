import type { RegionId } from "../types";

/** Sharp painted 1600×1200 regional maps. Cache-bust kills the old aerial blur. */
export const REGION_ART: Record<RegionId, string> = {
  ironclad: "/map/regions/ironclad.jpg?v=painted1",
  slagtown: "/map/regions/slagtown.jpg?v=painted1",
  blackspire: "/map/regions/blackspire.jpg?v=painted1",
  brasswater: "/map/regions/brasswater.jpg?v=painted1",
  veyra: "/map/regions/veyra.jpg?v=modern2",
};

export function regionThumb(id: RegionId): string {
  return `/map/regions/thumbs/${id}.jpg`;
}
