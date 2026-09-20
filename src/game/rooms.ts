import type { Screen } from "./types";

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

/** The rooms a player can reach in one dock tap. */
const DOCK_ROOMS: Screen[] = ["hq", "map", "arcade", "inventory", "more"];

let warmed = false;

/**
 * Warm only the rooms one tap away, and only once the room on screen has
 * painted. Streets, regional maps, the terminal and every thumbnail used to
 * ride along here — roughly 13MB on entry — and now load when the screen that
 * needs them asks.
 */
export function preloadRoomArt(current?: Screen | string) {
  if (typeof window === "undefined" || warmed) return;
  warmed = true;
  const here = current ? roomArtFor(current) : "";
  const queue = [...new Set(DOCK_ROOMS.map((id) => roomArtFor(id)))].filter((src) => src !== here);
  const run = () => {
    for (const src of queue) {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    }
  };
  const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
    .requestIdleCallback;
  if (idle) idle(run, { timeout: 3000 });
  else window.setTimeout(run, 1200);
}

export function roomArtFor(screen: Screen | string) {
  return ROOM_ART[screen] ?? ROOM_FALLBACK;
}

export const STARTER_PLATE = 80;
export const CARD_CLOCK_BASE = 28;
