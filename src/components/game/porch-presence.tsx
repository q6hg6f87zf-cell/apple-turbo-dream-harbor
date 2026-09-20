import { beatPorch, leavePorch, PORCH_MAX, watchPorch, type PorchSnapshot } from "@/game/porch";
import { useGame } from "@/game/store";
import { useP2PRoom } from "@/lib/multiplayer/use-p2p-room";
import { useEffect, useState } from "react";

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
  return (
    <div className="rounded-[var(--radius-md)] bg-ink/55 px-3 py-3 shadow-[var(--shadow-border)]" data-porch-strip="1">
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-display text-[10px] uppercase tracking-[0.18em] text-ember">Porch occupancy</div>
        <div className="font-mono text-[11px] text-ember-bright">
          {live}/{max}
        </div>
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-muted">
        {snap.full && !snap.seated
          ? "Ten stools are sat. Your file stays private until one cools."
          : snap.seated
            ? "You have a stool. Caps stay on your card. The porch is presence."
            : "Vault 13 holds ten live riders. Sit a stool — the eleventh waits."}
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
              <span className="shrink-0 text-ember/70">{seat.screen}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
