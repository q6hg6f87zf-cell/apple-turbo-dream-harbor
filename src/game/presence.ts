/**
 * Who is actually on the Vault 13 porch right now.
 * Empty list means "no signal" — never stall a solo rider on a ghost chair.
 */
export type PorchName = { discordId: string; name: string; self?: boolean };

let liveIds: string[] = [];
let seats: PorchName[] = [];

export function setLiveDiscordIds(ids: string[]) {
  liveIds = ids.filter(Boolean);
}

export function setPorchSeats(next: PorchName[]) {
  seats = next;
  setLiveDiscordIds(next.map((seat) => seat.discordId));
}

export function porchSeats() {
  return seats;
}

export function liveDiscordIds() {
  return liveIds;
}

export function porchSignalLive() {
  return liveIds.length > 0;
}

export function isDiscordOnPorch(discordId?: string | null) {
  if (!discordId) return false;
  return liveIds.includes(discordId);
}
