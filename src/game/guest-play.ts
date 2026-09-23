const GUEST_KEY = "hollow:guest";
const DISCARD_KEY = "hollow:discard";

function storage(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

/** A guest walk is memory only. It must not read or write the Discord file. */
export function isGuestPlay(): boolean {
  return storage()?.getItem(GUEST_KEY) === "1";
}

export function guestPlayRequested(): boolean {
  if (isGuestPlay()) return true;
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("auth") === "guest";
  } catch {
    return false;
  }
}

export function beginGuestPlay() {
  storage()?.setItem(GUEST_KEY, "1");
  storage()?.removeItem(DISCARD_KEY);
}

export function discardGuestPlay() {
  const box = storage();
  box?.removeItem(GUEST_KEY);
  box?.setItem(DISCARD_KEY, "1");
}

export function isDiscardingPlay(): boolean {
  return storage()?.getItem(DISCARD_KEY) === "1";
}

export function finishDiscard() {
  storage()?.removeItem(DISCARD_KEY);
}
