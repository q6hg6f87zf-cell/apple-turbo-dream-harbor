import { cloneState } from "@/game/engine";
import { pullServerEconomy, sendEconomyCommand, type ServerEconomySnapshot } from "@/game/server-economy";
import { STARTER_PLATE } from "@/game/rooms";
import { useGame } from "@/game/store";
import { useEffect } from "react";

let transactionPending = false;

function applySnapshot(snapshot: ServerEconomySnapshot, toast?: string) {
  useGame.setState((store) => {
    const s = cloneState(store.s);
    s.coins = snapshot.treasury.caps;
    s.ore = snapshot.treasury.ore;
    s.moonFavor = snapshot.treasury.moonFavor;

    const r = snapshot.treasury.rooms;
    s.rooms.vault = Math.max(0, Number(r.vault ?? s.rooms.vault));
    s.rooms.barracks = Math.max(0, Number(r.barracks ?? s.rooms.barracks));
    s.rooms.forge = Math.max(0, Number(r.forge ?? s.rooms.forge));
    s.rooms.infirmary = Math.max(0, Number(r.infirmary ?? s.rooms.infirmary));
    s.rooms.watchtower = Math.max(0, Number(r.watchtower ?? s.rooms.watchtower));
    s.rooms.ledger = Math.max(0, Number(r.ledger ?? s.rooms.ledger));

    const q = snapshot.treasury.quarters;
    s.quarters.bunk = Math.max(0, Number(q.bunk ?? s.quarters.bunk));
    s.quarters.lockbox = Math.max(0, Number(q.lockbox ?? s.quarters.lockbox));
    s.quarters.hearth = Math.max(0, Number(q.hearth ?? s.quarters.hearth));

    const rider = s.squad.find((member) => member.discordId === snapshot.card.discordId);
    if (rider) {
      const incoming = Math.max(0, Math.floor(Number(snapshot.card.caps) || 0));
      const local = Math.max(0, Math.floor(Number(rider.personalCaps) || 0));
      const keepStarter =
        incoming === 0 &&
        local >= STARTER_PLATE &&
        rider.joinedDay === s.day &&
        (s.clocks?.slots ?? 8) >= 7;
      rider.personalCaps = keepStarter ? local : incoming;
      rider.xp = snapshot.card.xp;
    }
    if (s.discordId === snapshot.card.discordId) {
      s.xp = snapshot.card.xp;
      s.level = snapshot.card.level;
    }
    if (toast) s.toast = toast;
    return { s };
  });
}

function setToast(message: string) {
  useGame.setState((store) => ({ s: { ...store.s, toast: message } }));
}

async function transact(
  command: Parameters<typeof sendEconomyCommand>[0],
  success: (snapshot: ServerEconomySnapshot) => string,
) {
  if (transactionPending) {
    setToast("Moon Squad card is already settling a transaction.");
    return;
  }
  transactionPending = true;
  setToast("Moon Squad terminal · authorizing…");
  try {
    const snapshot = await sendEconomyCommand(command);
    applySnapshot(snapshot, success(snapshot));
  } catch (error) {
    setToast(error instanceof Error ? error.message : "Moon Squad terminal rejected the transaction.");
  } finally {
    transactionPending = false;
  }
}

export function ServerEconomyRuntime() {
  const discordId = useGame((store) => store.s.discordId);

  useEffect(() => {
    if (!discordId) return;
    let cancelled = false;
    let installed = false;
    const original = useGame.getState();
    const originalDeposit = original.depositCard;
    const originalWithdraw = original.withdrawCard;
    const originalGift = original.giftRider;

    const refresh = async (quiet = true) => {
      try {
        const snapshot = await pullServerEconomy();
        if (cancelled || !snapshot || snapshot.card.discordId !== discordId) return false;
        applySnapshot(snapshot, quiet ? undefined : "Moon Squad terminal synced to server authority.");
        return true;
      } catch {
        return false;
      }
    };

    void (async () => {
      const active = await refresh(false);
      if (!active || cancelled) return;

      const depositCard: typeof originalDeposit = (amount) => {
        const n = Math.floor(Number(amount));
        const state = useGame.getState().s;
        if (!Number.isFinite(n) || n <= 0) return "Enter a positive cap amount.";
        if (state.coins < n) return "Vault 13 does not have enough caps.";
        void transact(
          { command: "deposit_card", amount: n },
          (snapshot) => `Server settled. Card ${snapshot.card.caps.toLocaleString()} · Vault ${snapshot.treasury.caps.toLocaleString()} caps.`,
        );
        return null;
      };

      const withdrawCard: typeof originalWithdraw = (amount) => {
        const n = Math.floor(Number(amount));
        const state = useGame.getState().s;
        const rider = state.squad.find((member) => member.discordId === discordId);
        if (!Number.isFinite(n) || n <= 0) return "Enter a positive cap amount.";
        if (!rider || rider.personalCaps < n) return "Moon Squad card does not have enough caps.";
        void transact(
          { command: "withdraw_card", amount: n },
          (snapshot) => `Server settled. Card ${snapshot.card.caps.toLocaleString()} · Vault ${snapshot.treasury.caps.toLocaleString()} caps.`,
        );
        return null;
      };

      const giftRider: typeof originalGift = (toId, amount) => {
        const n = Math.floor(Number(amount));
        const state = useGame.getState().s;
        const target = state.squad.find((member) => member.id === toId);
        const sender = state.squad.find((member) => member.discordId === discordId);
        if (!Number.isFinite(n) || n <= 0) return "Enter a positive cap amount.";
        if (!sender || sender.personalCaps < n) return "Moon Squad card does not have enough caps.";
        if (!target?.discordId) return "That rider needs to verify with TyroneBot before card transfers can settle.";
        if (target.discordId === discordId) return "That is already your Moon Squad card.";
        void transact(
          { command: "transfer_card", amount: n, recipientDiscordId: target.discordId },
          (snapshot) => `Transfer settled. Your card now holds ${snapshot.card.caps.toLocaleString()} caps.`,
        );
        return null;
      };

      installed = true;
      useGame.setState({ depositCard, withdrawCard, giftRider });
    })();

    const onFocus = () => void refresh(true);
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(() => void refresh(true), 20_000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
      if (installed) {
        useGame.setState({
          depositCard: originalDeposit,
          withdrawCard: originalWithdraw,
          giftRider: originalGift,
        });
      }
    };
  }, [discordId]);

  return null;
}
