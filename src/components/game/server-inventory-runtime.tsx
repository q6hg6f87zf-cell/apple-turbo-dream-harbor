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
import type { Condition, Item } from "@/game/types";
import { useEffect } from "react";

const CONDITION_RANK: Record<Condition, number> = { Pristine: 0, Worn: 1, Damaged: 2, Broken: 3 };
let applying = false;

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
      s.operatives = s.operatives.map((op) => ({ ...op, inventory: byResident.get(op.id) ?? [] }));
      if (toast) s.toast = toast;
      return { s };
    });
  } finally {
    applying = false;
  }
}

function itemConditions() {
  const state = useGame.getState().s;
  return new Map(
    [...state.vault, ...state.operatives.flatMap((op) => op.inventory)].map((item) => [item.id, item.condition] as const),
  );
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
    let previousConditions = itemConditions();

    const snapshotUnsub = subscribeServerInventory((snapshot) => {
      if (cancelled) return;
      setServerInventoryAuthorityActive(true);
      applySnapshot(snapshot);
      previousConditions = itemConditions();
    });

    const boot = async () => {
      let snapshot = await pullServerInventory().catch(() => null);
      if (!snapshot || cancelled) return;
      if (!snapshot.migration.done) {
        const legacy = flattenLocalItems();
        snapshot = await migrateLegacyServerInventory(legacy).catch(() => snapshot);
      }
      if (cancelled) return;
      setServerInventoryAuthorityActive(true);
      const migrated = snapshot.migrationResult;
      applySnapshot(
        snapshot,
        migrated
          ? `Tyrone sealed Inventory authority · ${migrated.accepted} legacy item${migrated.accepted === 1 ? "" : "s"} admitted · ${migrated.rejected} rejected.`
          : undefined,
      );
      previousConditions = itemConditions();

      storeUnsub = useGame.subscribe((nextStore) => {
        if (applying) return;
        const current = new Map(
          [...nextStore.s.vault, ...nextStore.s.operatives.flatMap((op) => op.inventory)].map((item) => [item.id, item.condition] as const),
        );
        for (const [id, condition] of current) {
          const before = previousConditions.get(id);
          if (!before || CONDITION_RANK[condition] <= CONDITION_RANK[before]) continue;
          void degradeServerItem(id, condition).catch(() => void pullServerInventory());
        }
        previousConditions = current;
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
