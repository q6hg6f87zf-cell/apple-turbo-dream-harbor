import { TICK_SECONDS } from "@/game/data";
import { sfx, startAmbient, toggleMute, unlockAudio } from "@/game/audio";
import { chromeKind, isTaskScreen } from "@/game/shell";
import { useGame } from "@/game/store";
import { cn } from "@/lib/cn";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  CombatOverlay,
  MissionOverlay,
  OperativeSheet,
  RestConfirm,
  ShiftSheet,
  ToastHost,
} from "./overlays";
import { MainMenu, RulesView, TerminalOverlay, VaultView } from "./menu";
import { HelpChrome, TalkOverlay } from "./talk-overlay";
import { CardSwipe } from "./card-swipe";
import { SceneBackdrop } from "./scene-backdrop";
import {
  Briefing,
  CodexView,
  ForgeView,
  HQView,
  LedgerView,
  MapView,
  MarketView,
} from "./views";
import { InventoryView } from "./inventory-view";
import { MoreView } from "./more-view";
import { GalleryView } from "./gallery-view";
import { ArcadeView } from "./arcade-view";
import { FileView } from "./synapse-os";
import { RadioDeckSheet, RadioDirector } from "./radio-deck";
import { Dock, GuidanceRow, HubHeader, Rail, SceneBreath, TaskHeader } from "./chrome";
import { WorkBench } from "./work-bench";
import { RegionMapOverlay } from "./orbit-theater";
import { WorldHUD } from "./world-hud";
import { PauseMenu } from "./pause-menu";

export function GameApp() {
  const hydrate = useGame((g) => g.hydrate);
  const pullArcade = useGame((g) => g.pullArcade);
  const hydrated = useGame((g) => g.hydrated);
  const persist = useGame((g) => g.persist);
  const tick = useGame((g) => g.tick);
  const screen = useGame((g) => g.s.screen);
  const started = useGame((g) => g.s.started);
  const mission = useGame((g) => g.s.mission);
  const combat = useGame((g) => g.s.combat);
  const regionMapOpen = useGame((g) => !!g.s.regionMapOpen);
  const focused = !!mission || !!combat;
  const kind = focused ? "focused" : chromeKind(screen);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pausePane, setPausePane] = useState<"menu" | "journal" | "scenario" | "settings">("menu");

  useLayoutEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

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

  // The shell owns arriving at a screen: drop focus, start at the top. The
  // Inventory scroller is separate and keeps its own place on purpose.
  useEffect(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== document.body) active.blur?.();
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "auto" });
  }, [screen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select")) return;
      const st = useGame.getState();
      if (e.key === "Escape") {
        if (pauseOpen) {
          setPauseOpen(false);
          return;
        }
        if (st.s.term || st.s.hack) {
          st.closeTerminal();
          return;
        }
        if (st.confirmRest) {
          st.cancelRest();
          return;
        }
        if (st.guideOpen) {
          st.closeGuide();
          return;
        }
        if (st.work) {
          st.closeWork();
          return;
        }
        if (st.s.selectedId && !st.s.combat && !st.s.mission) {
          st.selectOp(null);
          return;
        }
        if (isTaskScreen(st.s.screen) && !st.s.combat && !st.s.mission) {
          st.leaveTask();
          return;
        }
        if (st.s.started && !st.s.combat && !st.s.mission) {
          setPausePane("menu");
          setPauseOpen(true);
        }
        return;
      }
      if (e.key === "m" || e.key === "M") {
        const next = toggleMute();
        if (!next) sfx.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pauseOpen]);

  useEffect(() => {
    if (!hydrated) return;
    let t = 0;
    const unsub = useGame.subscribe(() => {
      window.clearTimeout(t);
      t = window.setTimeout(() => useGame.getState().persist(), 450);
    });
    const onHide = () => useGame.getState().persist();
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      unsub();
      window.clearTimeout(t);
      persist();
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [hydrated, persist]);

  useEffect(() => {
    if (!hydrated || !started) return;
    const id = window.setInterval(() => useGame.getState().tick(), TICK_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [hydrated, started, tick]);

  useEffect(() => {
    const onJournal = () => {
      setPausePane("journal");
      setPauseOpen(true);
    };
    const onSituation = () => {
      setPausePane("scenario");
      setPauseOpen(true);
    };
    window.addEventListener("hollow:open-journal", onJournal);
    window.addEventListener("hollow:open-situation", onSituation);
    return () => {
      window.removeEventListener("hollow:open-journal", onJournal);
      window.removeEventListener("hollow:open-situation", onSituation);
    };
  }, []);

  if (!hydrated || screen === "title") return <MainMenu />;
  if (screen === "rules") return <RulesView />;
  if (screen === "gallery")
    return (
      <>
        <GalleryView />
        <RadioDirector />
        <ToastHost />
      </>
    );
  if (screen === "briefing")
    return (
      <>
        <Briefing />
        <RadioDirector />
        <TalkOverlay />
        <HelpChrome />
        <ToastHost />
        <RadioDeckSheet />
      </>
    );

  return (
    <div
      className="relative flex h-dvh min-h-dvh w-full overflow-hidden overflow-x-hidden bg-ink text-paper"
      data-ready="1"
      data-screen={screen}
      data-chrome={kind}
      data-shake="1"
    >
      <SceneBackdrop />
      {kind === "hub" ? <Rail /> : null}
      {kind === "world" ? <Rail /> : null}
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
        {kind === "hub" ? <HubHeader /> : null}
        {kind === "task" ? <TaskHeader /> : null}
        {kind === "hub" ? <GuidanceRow /> : null}
        {kind === "world" ? (
          <WorldHUD
            onJournal={() => {
              setPausePane("journal");
              setPauseOpen(true);
            }}
            onPause={() => {
              setPausePane("menu");
              setPauseOpen(true);
            }}
          />
        ) : null}
        <main
          className={cn(
            "ms-shell-main min-h-0 flex-1 px-4 md:px-8",
            kind === "hub" && "ms-shell-hub-pad",
            kind === "world" && "ms-shell-world-pad",
            (kind === "task" || kind === "focused") && "ms-shell-task-pad",
            screen === "inventory" ? "flex flex-col overflow-hidden" : "ms-scroll overflow-y-auto",
          )}
        >
          {kind === "hub" || kind === "task" || kind === "world" ? <SceneBreath /> : null}
          <div
            key={screen}
            className={cn(
              "ms-rise ms-content-scrim mx-auto w-full max-w-4xl",
              screen === "inventory" && "flex min-h-0 flex-1 flex-col overflow-hidden",
              kind === "world" && "ms-world-scrim",
            )}
          >
            {screen === "hq" && <HQView />}
            {(screen === "file" || screen === "roster" || screen === "squad") && <FileView />}
            {screen === "forge" && <ForgeView />}
            {screen === "map" && <MapView />}
            {screen === "inventory" && <InventoryView />}
            {screen === "more" && <MoreView />}
            {screen === "vault" && <VaultView />}
            {screen === "ledger" && <LedgerView />}
            {screen === "market" && <MarketView />}
            {screen === "codex" && <CodexView />}
            {screen === "arcade" && <ArcadeView />}
          </div>
        </main>
        {kind === "hub" || kind === "world" || kind === "task" ? <Dock /> : null}
      </div>
      <RadioDirector />
      <MissionOverlay />
      <CombatOverlay />
      <OperativeSheet />
      <RestConfirm />
      <ShiftSheet />
      <ToastHost />
      <TerminalOverlay />
      <TalkOverlay />
      <HelpChrome />
      <RadioDeckSheet />
      <CardSwipe />
      <WorkBench />
      {regionMapOpen ? <RegionMapOverlay /> : null}
      <PauseMenu open={pauseOpen} initial={pausePane} onClose={() => setPauseOpen(false)} />
    </div>
  );
}
