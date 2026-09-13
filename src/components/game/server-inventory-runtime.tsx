import { cloneState } from "@/game/engine";
import {
  degradeServerItem,
  migrateLegacyServerInventory,
  pullServerInventory,
  setServerInventoryAuthorityActive,
  subscribeServerInventory,
  type ServerInventorySnapshot,
} from "@/game/server-inventory";
import { useGame } from "@/game/store";
import type { Condition, GameState, Item } from "@/game/types";
import { useEffect } from "react";

const CONDITION_RANK: Record<Condition, number> = { Pristine: 0, Worn: 1, Damaged: 2, Broken: 3 };
let applying = false;

type Fingerprint = {
  ownerType: "vault" | "resident";
  residentId: string | null;
  equipped: boolean;
  condition: Condition;
};

function flattenLocalItems() {
  const state = useGame.getState().s;
  const all = [...state.vault, ...state.operatives.flatMap((op) => op.inventory)];
  const seen = new Set<string>();
  return all
    .filter((item) => {
      const key = `${item.kind}:${item.name.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 48)
    .map((item) => ({ name: item.name, kind: item.kind }));
}

function applySnapshot(snapshot: ServerInventorySnapshot, toast?: string) {
  applying = true;
  try {
    useGame.setState((store) => {
      const s = cloneState(store.s);
      s.vault = snapshot.items.filter((entry) => entry.ownerType === "vault").map((entry) => entry.item);
      const byResident = new Map<string, Item[]>();
      for (const entry of snapshot.items) {
        if (entry.ownerType !== "resident" || !entry.residentId) continue;
        const list = byResident.get(entry.residentId) ?? [];
        list.push(entry.item);
        byResident.set(entry.residentId, list);
      }
      // Once Discord authority is active, resident item arrays are only a cache.
      // Unknown local serials are never retained as gameplay gear.
      s.operatives = s.operatives.map((op) => ({ ...op, inventory: byResident.get(op.id) ?? [] }));
      if (toast) s.toast = toast;
      return { s };
    });
  } finally {
    applying = false;
  }
}

function expectedFingerprint(snapshot: ServerInventorySnapshot) {
  return new Map<string, Fingerprint>(snapshot.items.map((entry) => [entry.item.id, {
    ownerType: entry.ownerType,
    residentId: entry.residentId,
    equipped: !!entry.item.equipped,
    condition: entry.item.condition,
  }]));
}

function currentFingerprint(state: GameState) {
  const map = new Map<string, Fingerprint>();
  for (const item of state.vault) {
    map.set(item.id, { ownerType: "vault", residentId: null, equipped: false, condition: item.condition });
  }
  for (const op of state.operatives) {
    for (const item of op.inventory) {
      map.set(item.id, { ownerType: "resident", residentId: op.id, equipped: !!item.equipped, condition: item.condition });
    }
  }
  return map;
}

function unauthorizedMutation(current: Map<string, Fingerprint>, expected: Map<string, Fingerprint>) {
  if (current.size !== expected.size) return true;
  for (const [id, live] of current) {
    const sealed = expected.get(id);
    if (!sealed) return true;
    if (live.ownerType !== sealed.ownerType || live.residentId !== sealed.residentId || live.equipped !== sealed.equipped) return true;
    if (CONDITION_RANK[live.condition] < CONDITION_RANK[sealed.condition]) return true;
  }
  for (const id of expected.keys()) if (!current.has(id)) return true;
  return false;
}

export function ServerInventoryRuntime() {
  const discordId = useGame((store) => store.s.discordId);

  useEffect(() => {
    if (!discordId) {
      setServerInventoryAuthorityActive(false);
      return;
    }
    let cancelled = false;
    let storeUnsub: (() => void) | null = null;
    let lastSnapshot: ServerInventorySnapshot | null = null;
    let expected = new Map<string, Fingerprint>();
    const conditionInFlight = new Set<string>();

    const acceptSnapshot = (snapshot: ServerInventorySnapshot, message?: string) => {
      if (cancelled) return;
      lastSnapshot = snapshot;
      expected = expectedFingerprint(snapshot);
      conditionInFlight.clear();
      setServerInventoryAuthorityActive(true);
      applySnapshot(snapshot, message);
    };

    const snapshotUnsub = subscribeServerInventory((snapshot) => acceptSnapshot(snapshot));

    const boot = async () => {
      let snapshot = await pullServerInventory().catch(() => null);
      if (!snapshot || cancelled) return;
      if (!snapshot.migration.done) {
        const legacy = flattenLocalItems();
        const migratedSnapshot = await migrateLegacyServerInventory(legacy).catch(() => null);
        if (migratedSnapshot) snapshot = migratedSnapshot;
      }
      if (!snapshot || cancelled) return;
      const migrated = snapshot.migrationResult;
      acceptSnapshot(
        snapshot,
        migrated
          ? `Tyrone sealed Inventory authority · ${migrated.accepted} legacy item${migrated.accepted === 1 ? "" : "s"} admitted · ${migrated.rejected} rejected.`
          : undefined,
      );

      storeUnsub = useGame.subscribe((nextStore) => {
        if (applying || !lastSnapshot) return;
        const current = currentFingerprint(nextStore.s);
        if (unauthorizedMutation(current, expected)) {
          acceptSnapshot(lastSnapshot, "Tyrone rejected an unsealed local Inventory change.");
          return;
        }

        for (const [id, live] of current) {
          const sealed = expected.get(id);
          if (!sealed) continue;
          if (CONDITION_RANK[live.condition] <= CONDITION_RANK[sealed.condition]) continue;
          if (conditionInFlight.has(id)) continue;
          conditionInFlight.add(id);
          void degradeServerItem(id, live.condition).catch(() => {
            conditionInFlight.delete(id);
            return pullServerInventory();
          });
        }
      });
    };

    void boot();
    const onFocus = () => void pullServerInventory().catch(() => null);
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(onFocus, 30_000);

    return () => {
      cancelled = true;
      setServerInventoryAuthorityActive(false);
      snapshotUnsub();
      storeUnsub?.();
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [discordId]);

  return null;
}
