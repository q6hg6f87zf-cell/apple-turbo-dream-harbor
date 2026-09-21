import { beatPorch, leavePorch, PORCH_MAX, watchPorch, type PorchSnapshot } from "@/game/porch";
import { setLiveDiscordIds } from "@/game/presence";
import { useGame } from "@/game/store";
import { useP2PRoom } from "@/lib/multiplayer/use-p2p-room";
import { useEffect, useState } from "react";

const WHERE: Record<string, string> = {
  title: "porch",
  briefing: "briefing",
  hq: "compound",
  inventory: "lockbox",
  more: "more",
  roster: "roster",
  forge: "machine shop",
  map: "the map",
  ledger: "ledger",
  codex: "codex",
  arcade: "cabinet",
  vault: "vault",
  squad: "registry",
  market: "market",
  gallery: "reels",
  rules: "rules",
};

function where(screen: string) {
  return WHERE[screen] ?? screen.replace(/-/g, " ");
}

function initial(name: string) {
  const t = name.trim();
  return (t[0] ?? "?").toUpperCase();
}

function Mesh({
  discordId,
  name,
  enabled,
}: {
  discordId: string;
  name: string;
  enabled: boolean;
}) {
  const room = useP2PRoom({
    room: "vault13-porch",
    selfId: `d${discordId}`.slice(0, 64),
    name: name.slice(0, 64),
    enabled,
  });
  return (
    <span className="sr-only" data-porch-mesh={room.joined ? "live" : "idle"} data-porch-peers={room.peers.length}>
      {room.peers.filter((peer) => peer.connectionState === "failed").length
        ? "Some porch links failed NAT."
        : ""}
    </span>
  );
}

export function PorchPresence() {
  const hydrated = useGame((g) => g.hydrated);
  const screen = useGame((g) => g.s.screen);
  const name = useGame((g) => g.s.playerName || g.s.discordName || "Rider");
  const handle = useGame((g) => g.s.playerHandle || "");
  const discordId = useGame((g) => g.s.discordId);
  const [snap, setSnap] = useState<PorchSnapshot | null>(null);

  useEffect(() => watchPorch(setSnap), []);

  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    const pulse = () => {
      void beatPorch(screen, name, handle);
    };
    pulse();
    const id = window.setInterval(() => {
      if (alive && !document.hidden) pulse();
    }, 8000);
    const onHide = () => {
      if (document.hidden) useGame.getState().persist();
    };
    const onPageHide = () => {
      void leavePorch();
      useGame.getState().persist();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      alive = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      void leavePorch();
    };
  }, [hydrated, screen, name, handle]);

  if (!hydrated) return null;
  return discordId && snap?.seated ? <Mesh discordId={discordId} name={name} enabled /> : null;
}

export function PorchStrip() {
  const [snap, setSnap] = useState<PorchSnapshot | null>(null);
  useEffect(() => watchPorch(setSnap), []);
  if (!snap) return null;
  const live = snap.live;
  const max = snap.max || PORCH_MAX;
  const others = snap.seats.filter((seat) => !seat.self);
  return (
    <div className="rounded-[var(--radius-md)] bg-ink/55 px-3 py-3 shadow-[var(--shadow-border)]" data-porch-strip="1">
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-display text-[10px] uppercase tracking-[0.18em] text-ember">Vault 13 porch</div>
        <div className="font-mono text-[11px] text-ember-bright">
          {live}/{max}
        </div>
      </div>
      <div className="mt-2 flex gap-1" aria-hidden>
        {Array.from({ length: max }, (_, i) => {
          const seat = snap.seats[i];
          return (
            <span
              key={seat?.discordId ?? `empty-${i}`}
              title={seat ? `${seat.name}${seat.handle ? ` @${seat.handle.replace(/^@/, "")}` : ""}` : "empty stool"}
              className={
                seat
                  ? "flex size-6 items-center justify-center rounded-full bg-ember text-[10px] font-display text-ink"
                  : "size-6 rounded-full bg-ink/80 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-line)_70%,transparent)]"
              }
            >
              {seat ? initial(seat.name || "R") : ""}
            </span>
          );
        })}
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-muted">
        {snap.full && !snap.seated
          ? "Ten stools are sat. Wait for one to cool."
          : others.length
            ? `${others.length} other rider${others.length === 1 ? "" : "s"} on the porch. Caps stay on your card.`
            : snap.seated
              ? "You have a stool. The porch is quiet — wait for the others."
              : "Vault 13 holds ten live riders. Sit a stool."}
      </p>
      {snap.seats.length ? (
        <ul className="mt-2 space-y-1 font-mono text-[11px] text-ember-bright">
          {snap.seats.map((seat) => (
            <li key={seat.discordId} className="flex justify-between gap-2">
              <span className="truncate">
                {seat.self ? "> " : ""}
                {seat.name || "Rider"}
                {seat.handle ? ` @${seat.handle.replace(/^@/, "")}` : ""}
              </span>
              <span className="shrink-0 text-ember/70">{where(seat.screen)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
