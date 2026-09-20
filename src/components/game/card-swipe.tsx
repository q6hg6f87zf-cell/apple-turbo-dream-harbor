import { seatedMember } from "@/game/squad";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import { useEffect, useState } from "react";
import { MoonCrest } from "./primitives";

export function CardSwipe() {
  const screen = useGame((g) => g.s.screen);
  const me = useGame((g) => seatedMember(g.s));
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (screen !== "arcade" && screen !== "ledger") return;
    setShow(true);
    sfx.swipe();
    const t = window.setTimeout(() => setShow(false), 920);
    return () => window.clearTimeout(t);
  }, [screen]);

  if (!show) return null;
  return (
    <div className="ms-swipe-stage" aria-hidden>
      <div className="ms-swipe-plate">
        <p className="font-display text-[10px] uppercase tracking-[0.32em] text-moon">Moon Squad</p>
        <p className="mt-2 font-display text-xl text-paper">{me.name}</p>
        <p className="font-mono text-[12px] text-ember">{me.discordHandle ?? "unlinked"}</p>
        <MoonCrest className="mt-3 ml-auto size-7 text-moon" />
      </div>
    </div>
  );
}
