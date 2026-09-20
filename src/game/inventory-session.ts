import type { WeaponLane } from "./inventory-filters";
import type { AmmoType, InventoryCategory, RegionId } from "./types";

/**
 * Where the player had the Inventory pointed, for as long as the tab is open.
 *
 * Kitting and World are a round trip players make constantly, and the shell
 * remounts the screen tree on every change, so filters and scroll used to reset
 * each way. This is deliberately module state: it survives the remount and it
 * never reaches GameState, so it stays out of the save schema.
 */
export type InventorySession = {
  mode: "owned" | "catalogue";
  category: InventoryCategory;
  lane: WeaponLane;
  caliber: AmmoType | "all";
  region: RegionId | "all";
  query: string;
  scrollTop: number;
};

const BLANK: InventorySession = {
  mode: "owned",
  category: "all",
  lane: "all",
  caliber: "all",
  region: "all",
  query: "",
  scrollTop: 0,
};

const sessions = new Map<string, InventorySession>();

export function inventorySession(id: string): InventorySession {
  return sessions.get(id) ?? BLANK;
}

export function rememberInventory(id: string, patch: Partial<InventorySession>) {
  sessions.set(id, { ...inventorySession(id), ...patch });
}

/** A new campaign should open on Owned/all, not the last run's filters. */
export function forgetInventorySessions() {
  sessions.clear();
}
