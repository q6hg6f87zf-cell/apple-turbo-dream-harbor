import type { ClassName, DayTaskKind, RegionId, RoomId } from "../types";

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

export const CLASS_PORTRAIT: Record<ClassName, string> = {
  Warrior: "/art/portraits/warrior.jpg",
  Wizard: "/art/portraits/wizard.jpg",
  Rogue: "/art/portraits/rogue.jpg",
  Healer: "/art/portraits/healer.jpg",
  Merchant: "/art/portraits/merchant.jpg",
  Bard: "/art/portraits/bard.jpg",
};

export const BOARD_STEEL = "/art/board/steel.jpg";
export const BOARD_SEAL = "/art/board/seal.jpg";
export const BOARD_TICKET = "/art/board/ticket.jpg";
export const OS_PHOSPHOR = "/art/os/phosphor.jpg";

export const BOARD_JOB_ART: Record<DayTaskKind, string> = {
  crates: "/art/board/jobs/crates.jpg",
  visitor: "/art/board/jobs/gate.jpg",
  aegis: "/art/npcs/aegis-line.jpg",
  treat: "/art/board/jobs/medbay.jpg",
  scan: "/art/board/jobs/perimeter.jpg",
  repair: "/art/board/jobs/repair.jpg",
  run: "/art/board/jobs/supply.jpg",
  tribute: "/art/rooms/market.jpg",
  crisis: "/art/rooms/command.jpg",
  cabinet: "/art/board/jobs/cabinet.jpg",
  market: "/art/rooms/market.jpg",
  tower: "/art/rooms/tower.jpg",
  salvage: "/art/board/jobs/salvage.jpg",
  sortie: "/art/rooms/war-room.jpg",
};

export const FACILITY_ART: Record<RoomId, string> = {
  vault: "/art/rooms/vault.jpg",
  barracks: "/art/rooms/barracks.jpg",
  forge: "/art/rooms/forge.jpg",
  infirmary: "/art/rooms/med-bay.jpg",
  watchtower: "/art/rooms/tower.jpg",
  ledger: "/art/rooms/ledger.jpg",
};

export const WORK_ART = {
  bench: "/art/rooms/workbench.jpg",
  vaultRaise: "/art/rooms/vault-raise.jpg",
  t0880: "/art/npcs/t0880-line.jpg",
  aegisSuit: "/art/npcs/aegis-suit.jpg",
} as const;
