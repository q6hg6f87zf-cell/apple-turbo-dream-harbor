import { TICK_SECONDS } from "@/game/data";
import { incomePerTick, nextObjective } from "@/game/engine";
import { isMuted, sfx, startAmbient, toggleMute, unlockAudio } from "@/game/audio";
import { useGame } from "@/game/store";
import type { Screen } from "@/game/types";
import { cn } from "@/lib/cn";
import {
  CircleHelp,
  Globe2,
  Landmark,
  Moon,
  MoreHorizontal,
  PackageOpen,
  Plus,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  CombatOverlay,
  MissionOverlay,
  OperativeSheet,
  RestConfirm,
  ToastHost,
} from "./overlays";
import { MainMenu, RulesView, TerminalOverlay, VaultView } from "./menu";
import { HelpChrome, TalkOverlay } from "./talk-overlay";
import { LiveCoin, MoonCrest } from "./primitives";
import {
  Briefing,
  CodexView,
  ForgeView,
  HQView,
  LedgerView,
  MapView,
  RosterView,
  SquadView,
} from "./views";
import { InventoryView } from "./inventory-view";
import { MoreView } from "./more-view";

const NAV: { id: Screen; label: string; icon: typeof Landmark; hint?: string }[] = [
  { id: "hq", label: "Vault 13", icon: Landmark },
  { id: "map", label: "World", icon: Globe2, hint: "sortie" },
  { id: "roster", label: "Squad", icon: Users },
  { id: "inventory", label: "Inventory", icon: PackageOpen },
  { id: "more", label: "More", icon: MoreHorizontal },
];

const MORE_SCREENS: Screen[] = ["forge", "ledger", "vault", "codex", "squad"];

export function GameApp() {
  const hydrate = useGame((g) => g.hydrate);
  const pullArcade = useGame((g) => g.pullArcade);
  const hydrated = useGame((g) => g.hydrated);
  const persist = useGame((g) => g.persist);
  const tick = useGame((g) => g.tick);
  const screen = useGame((g) => g.s.screen);
  const started = useGame((g) => g.s.started);

  useLayoutEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    pullArcade();
  }, [hydrated, pullArcade]);

  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      startAmbient();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    const onVis = () => {
      if (!document.hidden) unlockAudio();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0 });
  }, [screen]);

  useEffect(() => {
    if (!hydrated) return;
    let t = 0;
    const unsub = useGame.subscribe(() => {
      window.clearTimeout(t);
      t = window.setTimeout(() => useGame.getState().persist(), 450);
    });
    const onHide = () => useGame.getState().persist();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      unsub();
      window.clearTimeout(t);
      persist();
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [hydrated, persist]);

  useEffect(() => {
    if (!hydrated || !started) return;
    const id = window.setInterval(() => useGame.getState().tick(), TICK_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [hydrated, started, tick]);

  if (!hydrated || screen === "title") return <MainMenu />;
  if (screen === "rules") return <RulesView />;
  if (screen === "briefing")
    return (
      <>
        <Briefing />
        <TalkOverlay />
        <HelpChrome />
        <ToastHost />
      </>
    );

  return (
    <div className="flex h-dvh bg-ink text-paper" data-ready="1" data-screen={screen}>
      <Rail />
      <div className="flex min-w-0 flex-1 flex-col">
        <Hud />
        <ObjectiveBar />
        <main className="ms-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-28 md:px-8 md:pb-8">
          <div key={screen} className="ms-rise mx-auto w-full max-w-4xl">
            {screen === "hq" && <HQView />}
            {screen === "roster" && <RosterView />}
            {screen === "forge" && <ForgeView />}
            {screen === "map" && <MapView />}
            {screen === "inventory" && <InventoryView />}
            {screen === "more" && <MoreView />}
            {screen === "vault" && <VaultView />}
            {screen === "ledger" && <LedgerView />}
            {screen === "squad" && <SquadView />}
            {screen === "codex" && <CodexView />}
          </div>
        </main>
      </div>
      <Dock />
      <MissionOverlay />
      <CombatOverlay />
      <OperativeSheet />
      <RestConfirm />
      <ToastHost />
      <TerminalOverlay />
      <TalkOverlay />
      <HelpChrome />
    </div>
  );
}

function ObjectiveBar() {
  const s = useGame((g) => g.s);
  const setScreen = useGame((g) => g.setScreen);
  const rest = useGame((g) => g.rest);
  const selectOp = useGame((g) => g.selectOp);
  const obj = nextObjective(s);
  if (s.mission || s.combat) return null;
  const here = s.screen === obj.screen || (obj.cta === "Rest" && s.screen === "hq");
  return (
    <button
      type="button"
      onClick={() => {
        sfx.click();
        if (obj.cta === "Rest") {
          rest();
          return;
        }
        if (obj.opId) selectOp(obj.opId);
        setScreen(obj.screen);
      }}
      className={cn(
        "flex min-h-11 w-full items-center justify-between gap-3 border-b border-line/70 bg-raised/90 px-4 text-left md:px-6",
        !here && "text-paper",
      )}
    >
      <span className="min-w-0 truncate text-[13px] text-moon">{obj.text}</span>
      <span
        className={cn(
          "shrink-0 font-display text-[10px] uppercase tracking-[0.16em] text-ember",
          !here && "ms-nudge",
        )}
      >
        {obj.cta}
      </span>
    </button>
  );
}

function Hud() {
  const s = useGame((g) => g.s);
  const rest = useGame((g) => g.rest);
  const setScreen = useGame((g) => g.setScreen);
  const openGuide = useGame((g) => g.openGuide);
  const busy = !!s.mission || !!s.combat;
  const income = incomePerTick(s);
  const forgeNudge = s.tutorial === "forge" || s.operatives.filter((o) => o.status !== "dead").length === 0;
  const [mute, setMute] = useState(isMuted);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select")) return;
      const st = useGame.getState();
      if (e.key === "Escape") {
        if (st.s.hack) {
          st.closeTerminal();
          return;
        }
        if (st.confirmRest) {
          st.cancelRest();
          return;
        }
        if (st.s.selectedId && !st.s.combat && !st.s.mission) {
          st.selectOp(null);
          return;
        }
      }
      if (e.key === "m" || e.key === "M") {
        const next = toggleMute();
        setMute(next);
        if (!next) sfx.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="flex items-center gap-3 border-b border-line/70 bg-surface/90 px-3 py-2.5 backdrop-blur-sm md:px-6">
      <button
        type="button"
        className="flex items-center gap-2"
        onClick={() => {
          sfx.click();
          setScreen("title");
        }}
        aria-label="Main menu"
      >
        <MoonCrest className="size-7" />
        <span className="hidden font-display text-[11px] uppercase tracking-[0.22em] text-ember md:inline">
          VAULT 13
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <div className="font-display text-[11px] uppercase tracking-[0.2em] text-muted">
          Day {s.day}
          <span className="text-ember"> · rank {s.level}</span>
          <span className="text-ember"> · +{income}</span>
          {s.squad.length ? (
            <span className="text-moon">
              {" "}
              · {s.squad.find((m) => m.id === s.activeMemberId)?.name ?? s.discordName ?? "rider"}
              {s.arc && s.arc.turnMemberId !== s.activeMemberId
                ? ` · turn ${s.squad.find((m) => m.id === s.arc?.turnMemberId)?.name ?? ""}`
                : ""}
            </span>
          ) : null}
        </div>
        <LiveCoin n={s.coins} className="font-display text-lg text-paper" />
      </div>
      <button
        type="button"
        aria-label="Ask Tyrone"
        data-help="1"
        onClick={() => {
          sfx.click();
          openGuide();
        }}
        className="hidden size-11 items-center justify-center rounded-[var(--radius-sm)] text-ember shadow-[var(--shadow-border)] hover:text-ember-bright md:inline-flex"
      >
        <CircleHelp className="size-4" />
      </button>
      <button
        type="button"
        aria-label={mute ? "Unmute" : "Mute"}
        onClick={() => {
          const next = toggleMute();
          setMute(next);
          if (!next) sfx.click();
        }}
        className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] text-muted shadow-[var(--shadow-border)] hover:text-paper"
      >
        {mute ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          sfx.click();
          rest();
        }}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 font-display text-[10px] uppercase tracking-[0.16em] text-moon shadow-[var(--shadow-border)] transition-colors hover:text-paper disabled:opacity-40",
          s.tutorial === "rest" && "ms-nudge text-ember",
        )}
      >
        <Moon className="size-4" />
        <span className="hidden sm:inline">Rest until dawn</span>
        <span className="sm:hidden">Dawn</span>
      </button>
      <button
        type="button"
        aria-label="Forge resident"
        onClick={() => {
          unlockAudio();
          sfx.click();
          setScreen("forge");
        }}
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] bg-ember text-ink transition-transform active:scale-[0.96]",
          forgeNudge && "ms-nudge",
        )}
      >
        <Plus className="size-5" />
      </button>
    </header>
  );
}

function NavButtons({ compact }: { compact?: boolean }) {
  const screen = useGame((g) => g.s.screen);
  const setScreen = useGame((g) => g.setScreen);
  const tutorial = useGame((g) => g.s.tutorial);

  return (
    <>
      {NAV.map((n) => {
        const Icon = n.icon;
        const active = screen === n.id || (n.id === "more" && MORE_SCREENS.includes(screen));
        const nudge = n.hint === "sortie" && tutorial === "sortie";
        return (
          <button
            key={n.id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => {
              unlockAudio();
              sfx.click();
              setScreen(n.id);
            }}
            className={cn(
              "flex min-h-12 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left transition-colors",
              compact && "flex-1 flex-col justify-center gap-1 px-1",
              active ? "bg-ember/10 text-ember" : "text-muted hover:text-paper",
              nudge && "ms-nudge text-ember",
            )}
          >
            <Icon className="size-5" />
            <span className={cn("font-display uppercase tracking-[0.16em]", compact ? "text-[9px]" : "text-[10px]")}>
              {n.label}
            </span>
          </button>
        );
      })}
    </>
  );
}

function Rail() {
  const setScreen = useGame((g) => g.setScreen);
  return (
    <aside className="hidden w-[6.25rem] flex-col items-stretch border-r border-line/70 bg-surface py-4 md:flex">
      <button
        type="button"
        className="mx-auto mb-6"
        onClick={() => {
          sfx.click();
          setScreen("title");
        }}
        aria-label="Main menu"
      >
        <MoonCrest className="size-9" />
      </button>
      <nav className="flex flex-1 flex-col gap-1 px-2">
        <NavButtons />
      </nav>
    </aside>
  );
}

function Dock() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line/70 bg-surface/95 px-1 pt-1 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      <NavButtons compact />
    </nav>
  );
}
