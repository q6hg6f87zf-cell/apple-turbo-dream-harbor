import { getBearerToken } from "@/lib/auth/client";
import type { Condition, Item } from "./types";

export type ServerOwnedItem = {
  item: Item;
  ownerType: "vault" | "resident";
  residentId: string | null;
  revision: number;
  sourceEvent: string;
};

export type ServerInventorySnapshot = {
  authority: "server";
  campaignId: string;
  migration: { done: boolean; accepted: number; rejected: number };
  items: ServerOwnedItem[];
  duplicate?: boolean;
  migrationResult?: { duplicate?: boolean; accepted: number; rejected: number };
  treasure?: { duplicate: boolean; result: { drops?: Array<{ instanceId: string; templateKey: string; name: string; rarity: string }> } };
  effect?: string;
  name?: string;
  repairCost?: number;
  error?: string;
};

type Listener = (snapshot: ServerInventorySnapshot) => void;
const listeners = new Set<Listener>();
let authorityActive = false;

export function serverInventoryAuthorityActive() {
  return authorityActive;
}
export function setServerInventoryAuthorityActive(active: boolean) {
  authorityActive = active;
}
export function subscribeServerInventory(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function publish(snapshot: ServerInventorySnapshot) {
  for (const listener of listeners) listener(snapshot);
  return snapshot;
}

function headers(json = false) {
  const h = new Headers({ accept: "application/json" });
  if (json) h.set("content-type", "application/json");
  const bearer = getBearerToken();
  if (bearer) h.set("Authorization", `Bearer ${bearer}`);
  return h;
}

function requestId(prefix: string) {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 16)}`;
  return `${prefix}:${id}`.slice(0, 96);
}

async function decode(response: Response) {
  const body = (await response.json().catch(() => ({}))) as ServerInventorySnapshot;
  if (!response.ok) throw new Error(body.error || `Inventory request failed (${response.status})`);
  return publish(body);
}

async function post(payload: Record<string, unknown>) {
  const response = await fetch("/api/hollow/inventory", {
    method: "POST",
    credentials: "same-origin",
    headers: headers(true),
    body: JSON.stringify(payload),
  });
  return decode(response);
}

export async function pullServerInventory(): Promise<ServerInventorySnapshot | null> {
  const response = await fetch("/api/hollow/inventory", {
    method: "GET",
    credentials: "same-origin",
    headers: headers(),
  });
  if (response.status === 401 || response.status === 404) return null;
  return decode(response);
}

export function migrateLegacyServerInventory(items: Array<Pick<Item, "name" | "kind">>) {
  return post({ command: "migrate_legacy", items });
}

export function issueEquipServerItem(itemId: string, residentId: string) {
  return post({ command: "issue_equip", requestId: requestId("inv-issue"), itemId, residentId });
}
export function setServerItemEquipped(itemId: string, equipped: boolean) {
  return post({ command: equipped ? "equip" : "unequip", requestId: requestId(equipped ? "inv-equip" : "inv-unequip"), itemId });
}
export function stashServerItem(itemId: string) {
  return post({ command: "stash", requestId: requestId("inv-stash"), itemId });
}
export function consumeServerItem(itemId: string, residentId: string) {
  return post({ command: "consume", requestId: requestId("inv-consume"), itemId, residentId });
}
export function attachServerEnchantment(itemId: string, targetItemId: string, residentId: string) {
  return post({ command: "attach", requestId: requestId("inv-attach"), itemId, targetItemId, residentId });
}
export function degradeServerItem(itemId: string, condition: Condition) {
  return post({ command: "degrade", requestId: requestId("inv-degrade"), itemId, condition });
}
export function repairServerItem(itemId: string) {
  return post({ command: "repair", requestId: requestId("inv-repair"), itemId });
}
export function claimServerMissionTreasure(ticketId: string) {
  return post({ command: "claim_mission_treasure", ticketId });
}
