import type { Screen } from "./types";
import { REGION_ART, regionThumb } from "./art";

export const ROOM_ART: Record<string, string> = {
  hq: "/art/rooms/command.jpg",
  arcade: "/art/rooms/thirty-eight.jpg",
  forge: "/art/rooms/forge.jpg",
  ledger: "/art/rooms/ledger.jpg",
  roster: "/art/rooms/squad.jpg",
  squad: "/art/rooms/squad.jpg",
  inventory: "/art/rooms/armory.jpg",
  vault: "/art/rooms/vault.jpg",
  map: "/art/rooms/war-room.jpg",
  market: "/art/rooms/market.jpg",
  tower: "/art/rooms/tower.jpg",
  codex: "/art/rooms/archive.jpg",
  more: "/art/rooms/corridor.jpg",
};

export const ROOM_FALLBACK = "/art/rooms/corridor.jpg";

const EXTRA_ART = [
  "/art/title-plate.jpg",
  "/art/tyrone.jpg",
  "/art/terminal.jpg",
  "/art/tunnel.jpg",
  "/map/overworld.jpg",
  "/art/places/ironclad-street.jpg",
  "/art/places/slagtown-street.jpg",
  "/art/places/blackspire-street.jpg",
  "/art/places/brasswater-street.jpg",
  "/art/places/veyra-street.jpg",
  "/art/places/vault-13-exterior.jpg",
  "/art/places/ironclad-market.jpg",
  "/art/places/thirty-eight.jpg",
  "/art/rooms/squad.jpg",
];

let warmed = false;

export function preloadRoomArt() {
  if (typeof window === "undefined" || warmed) return;
  warmed = true;
  const urls = [
    ...Object.values(ROOM_ART),
    ROOM_FALLBACK,
    ...(Object.keys(REGION_ART) as (keyof typeof REGION_ART)[]).map((id) => regionThumb(id)),
    ...EXTRA_ART,
  ];
  for (const src of urls) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}

export function roomArtFor(screen: Screen | string) {
  return ROOM_ART[screen] ?? ROOM_FALLBACK;
}

export const STARTER_PLATE = 80;
export const CARD_CLOCK_BASE = 28;
