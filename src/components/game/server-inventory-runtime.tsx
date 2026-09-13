import { cloneState } from "@/game/engine";
import {
  buyServerExchange,
  buyServerVendor,
  forgeServerResident,
  grantServerBrokerSupply,
  pullServerAcquisition,
  type ServerAcquisitionSnapshot,
} from "@/game/server-acquisition";
import {
  degradeServerItem,
  migrateLegacyServerInventory,
  pullServerInventory,
  repairServerItem,
  setServerInventoryAuthorityActive,
  setServerItemEquipped,
  stashServerItem,
  subscribeServerInventory,
  type ServerInventorySnapshot,
} from "@/game/server-inventory";
import { useGame } from "@/game/store";
import type { Condition, GameState, Item } from "@/game/types";
import { useEffect } from "react";

const CONDITION_RANK: Record<Condition, number> = { Pristine: 0, Worn: 1, Damaged: 2, Broken: 3 };
let applying = false;
let acquisitionPending = false;

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

function applyAcquisition(snapshot: ServerAcquisitionSnapshot, toast?: string) {
  applying = true;
  try {
    useGame.setState((store) => {
      const s = cloneState(store.s);
      s.coins = Math.max(0, Number(snapshot.treasury.caps || 0));
      s.ore = Math.max(0, Number(snapshot.treasury.ore || 0));
      s.shop = {
        bargain: snapshot.exchange.bargain,
        essential: snapshot.exchange.essential,
        artifact: snapshot.exchange.artifact,
        day: snapshot.exchange.day,
        bought: { ...snapshot.exchange.bought },
      };
      if (toast) s.toast = toast;
      return { s };
    });
  } finally {
    applying = false;
  }
}

function setToast(message: string) {
  useGame.setState((store) => ({ s: { ...store.s, toast: message } }));
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
    const brokerInFlight = new Set<string>();
    const itemActionInFlight = new Set<string>();

    const original = useGame.getState();
    const originalForge = original.forge;
    const originalBuyOffer = original.buyOffer;
    const originalBuyNpc = original.buyNpc;
    const originalEquipItem = original.equipItem;
    const originalStashItem = original.stashItem;
    const originalTakeFromVault = original.takeFromVault;
    const originalRepairItem = original.repairItem;

    const syncingForge: typeof originalForge = () => "Tyrone is still sealing the Forge ledger. Give him a second.";
    const syncingOffer: typeof originalBuyOffer = () => "Quartermaster Exchange is syncing its server stock.";
    const syncingNpc: typeof originalBuyNpc = () => "Vendor ledger is syncing with Vault 13.";
    const syncingEquip: typeof originalEquipItem = () => setToast("Inventory authority is still syncing the loadout ledger.");
    const syncingStash: typeof originalStashItem = () => "Inventory authority is still syncing the Vault ledger.";
    const syncingTake: typeof originalTakeFromVault = () => "Inventory authority is still syncing the Vault ledger.";
    const syncingRepair: typeof originalRepairItem = () => "Machine Shop authority is still syncing.";
    useGame.setState({
      forge: syncingForge,
      buyOffer: syncingOffer,
      buyNpc: syncingNpc,
      equipItem: syncingEquip,
      stashItem: syncingStash,
      takeFromVault: syncingTake,
      repairItem: syncingRepair,
    });

    const acceptSnapshot = (snapshot: ServerInventorySnapshot, message?: string) => {
      if (cancelled) return;
      lastSnapshot = snapshot;
      expected = expectedFingerprint(snapshot);
      conditionInFlight.clear();
      setServerInventoryAuthorityActive(true);
      applySnapshot(snapshot, message);
    };

    const snapshotUnsub = subscribeServerInventory((snapshot) => acceptSnapshot(snapshot));

    const refreshInventory = async () => {
      const snapshot = await pullServerInventory().catch(() => null);
      if (snapshot && !cancelled) acceptSnapshot(snapshot);
      return snapshot;
    };

    const refreshAcquisition = async (quiet = true) => {
      const snapshot = await pullServerAcquisition().catch(() => null);
      if (snapshot && !cancelled) applyAcquisition(snapshot, quiet ? undefined : "Tyrone verified Forge and Exchange authority.");
      return snapshot;
    };

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

      const acquisition = await refreshAcquisition(false);
      if (!acquisition || cancelled) return;

      const secureForge: typeof originalForge = (opts) => {
        if (acquisitionPending) return "Tyrone is already settling an acquisition.";
        const before = cloneState(useGame.getState().s);
        const beforeIds = new Set(before.operatives.map((op) => op.id));
        const localError = originalForge(opts);
        if (localError) return localError;

        const forged = useGame.getState().s.operatives.find((op) => !beforeIds.has(op.id));
        if (!forged) {
          useGame.setState({ s: before });
          return "Forge failed to produce a resident record.";
        }

        acquisitionPending = true;
        setToast("Tyrone · sealing resident file and starter loadout…");
        void forgeServerResident(forged.id, forged.name, forged.cls, forged.race)
          .then(async (receipt) => {
            applyAcquisition(
              receipt,
              receipt.forge?.duplicate
                ? `${forged.name} was already sealed by Vault 13.`
                : `${forged.name} sealed · ${receipt.forge?.cost ?? 0} caps · starter loadout serialized.`,
            );
            await refreshInventory();
          })
          .catch(async (error) => {
            applying = true;
            try {
              useGame.setState({ s: before });
            } finally {
              applying = false;
            }
            if (lastSnapshot) acceptSnapshot(lastSnapshot);
            await refreshAcquisition(true);
            setToast(error instanceof Error ? error.message : "Tyrone rejected the resident forge.");
          })
          .finally(() => {
            acquisitionPending = false;
          });
        return null;
      };

      const secureBuyOffer: typeof originalBuyOffer = (tier) => {
        if (acquisitionPending) return "Tyrone is already settling an acquisition.";
        acquisitionPending = true;
        setToast("Quartermaster Exchange · authorizing purchase…");
        void buyServerExchange(tier)
          .then(async (receipt) => {
            const purchase = receipt.purchase;
            const detail = purchase?.oreUnits
              ? `${purchase.name} moved ${purchase.oreUnits} Ore into the Vault reserve.`
              : `${purchase?.name ?? "Stock"} serialized into Vault 13.`;
            applyAcquisition(receipt, purchase?.duplicate ? "That Exchange slot is already sold for this campaign day." : `${detail} -${purchase?.price ?? 0} caps.`);
            await refreshInventory();
          })
          .catch((error) => setToast(error instanceof Error ? error.message : "Quartermaster rejected the purchase."))
          .finally(() => {
            acquisitionPending = false;
          });
        return null;
      };

      const secureBuyNpc: typeof originalBuyNpc = (name) => {
        if (acquisitionPending) return "Tyrone is already settling an acquisition.";
        acquisitionPending = true;
        setToast("Vendor purchase · checking Vault 13 ledger…");
        void buyServerVendor(name)
          .then(async (receipt) => {
            const purchase = receipt.purchase;
            const detail = purchase?.oreUnits
              ? `${purchase.oreUnits} Hollow Ore moved directly into the Vault reserve.`
              : `${purchase?.name ?? name} serialized into Vault 13.`;
            applyAcquisition(receipt, purchase?.duplicate ? "Vendor receipt already settled." : `${detail} -${purchase?.price ?? 0} caps.`);
            await refreshInventory();
          })
          .catch((error) => setToast(error instanceof Error ? error.message : "Vendor settlement failed."))
          .finally(() => {
            acquisitionPending = false;
          });
        return null;
      };

      const secureEquipItem: typeof originalEquipItem = (opId, itemId) => {
        if (itemActionInFlight.has(itemId)) return;
        const item = useGame.getState().s.operatives.find((op) => op.id === opId)?.inventory.find((entry) => entry.id === itemId);
        if (!item?.slot) {
          setToast("That server item does not have an equipment slot.");
          return;
        }
        itemActionInFlight.add(itemId);
        setToast(`${item.name} · ${item.equipped ? "unequipping" : "equipping"} on the server…`);
        void setServerItemEquipped(itemId, !item.equipped)
          .then(() => setToast(`${item.name} ${item.equipped ? "unequipped" : "equipped"}.`))
          .catch((error) => setToast(error instanceof Error ? error.message : "Tyrone rejected the loadout change."))
          .finally(() => itemActionInFlight.delete(itemId));
      };

      const secureStashItem: typeof originalStashItem = (opId, itemId) => {
        if (itemActionInFlight.has(itemId)) return "Tyrone is already moving that item.";
        const item = useGame.getState().s.operatives.find((op) => op.id === opId)?.inventory.find((entry) => entry.id === itemId);
        if (!item) return "Server item not found.";
        if (item.equipped) return "Unequip first.";
        itemActionInFlight.add(itemId);
        setToast(`${item.name} · returning to Vault 13…`);
        void stashServerItem(itemId)
          .then(() => setToast(`${item.name} returned to Vault 13.`))
          .catch((error) => setToast(error instanceof Error ? error.message : "Tyrone rejected the Vault move."))
          .finally(() => itemActionInFlight.delete(itemId));
        return null;
      };

      const secureTakeFromVault: typeof originalTakeFromVault = (_opId, itemId) => {
        const item = useGame.getState().s.vault.find((entry) => entry.id === itemId);
        useGame.getState().selectOp(null);
        useGame.getState().setScreen("inventory");
        setToast(item ? `Open ${item.name} in Inventory to issue it to a resident.` : "Open Inventory to issue server-sealed gear.");
        return null;
      };

      const secureRepairItem: typeof originalRepairItem = (opId, itemId) => {
        if (itemActionInFlight.has(itemId)) return "Machine Shop is already working on that item.";
        const state = useGame.getState().s;
        const item = opId === "vault"
          ? state.vault.find((entry) => entry.id === itemId)
          : state.operatives.find((op) => op.id === opId)?.inventory.find((entry) => entry.id === itemId);
        if (!item) return "Server item not found.";
        if (item.condition === "Pristine") return "Already pristine.";
        itemActionInFlight.add(itemId);
        setToast(`${item.name} · Machine Shop authorizing repair…`);
        void repairServerItem(itemId)
          .then(async (receipt) => {
            setToast(`${item.name} repaired${receipt.repairCost ? ` · ${receipt.repairCost} caps` : ""}.`);
            await refreshAcquisition(true);
          })
          .catch((error) => setToast(error instanceof Error ? error.message : "Machine Shop rejected the repair."))
          .finally(() => itemActionInFlight.delete(itemId));
        return null;
      };

      useGame.setState({
        forge: secureForge,
        buyOffer: secureBuyOffer,
        buyNpc: secureBuyNpc,
        equipItem: secureEquipItem,
        stashItem: secureStashItem,
        takeFromVault: secureTakeFromVault,
        repairItem: secureRepairItem,
      });

      storeUnsub = useGame.subscribe((nextStore, prevStore) => {
        if (applying || !lastSnapshot) return;

        for (const op of nextStore.s.operatives) {
          const before = prevStore.s.operatives.find((candidate) => candidate.id === op.id);
          if (!before || op.cls !== "Merchant" || !op.giftUsed || before.giftUsed) continue;
          if (brokerInFlight.has(op.id)) continue;
          brokerInFlight.add(op.id);
          void grantServerBrokerSupply(op.id)
            .then(async (receipt) => {
              applyAcquisition(receipt, receipt.supply?.duplicate ? "Broker emergency stock was already issued today." : "Tyrone serialized the Broker emergency vial.");
              await refreshInventory();
            })
            .catch((error) => setToast(error instanceof Error ? error.message : "Broker supply could not be sealed."))
            .finally(() => brokerInFlight.delete(op.id));
        }

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
    const onFocus = () => {
      void refreshInventory();
      void refreshAcquisition(true);
    };
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(onFocus, 30_000);

    return () => {
      cancelled = true;
      acquisitionPending = false;
      setServerInventoryAuthorityActive(false);
      snapshotUnsub();
      storeUnsub?.();
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
      useGame.setState({
        forge: originalForge,
        buyOffer: originalBuyOffer,
        buyNpc: originalBuyNpc,
        equipItem: originalEquipItem,
        stashItem: originalStashItem,
        takeFromVault: originalTakeFromVault,
        repairItem: originalRepairItem,
      });
    };
  }, [discordId]);

  return null;
}
