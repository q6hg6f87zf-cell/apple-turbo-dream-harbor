import type { RegionId } from "../types";
import { IRONCLAD_ART } from "./ironclad";
import { SLAGTOWN_ART } from "./slagtown";
import { BLACKSPIRE_ART } from "./blackspire";
import { BRASSWATER_ART } from "./brasswater";
import { VEYRA_ART } from "./veyra";
export { MAIN_MENU_ART } from "./main-menu";

export const REGION_ART: Record<RegionId, string> = {
  ironclad: IRONCLAD_ART,
  slagtown: SLAGTOWN_ART,
  blackspire: BLACKSPIRE_ART,
  brasswater: BRASSWATER_ART,
  veyra: VEYRA_ART,
};
