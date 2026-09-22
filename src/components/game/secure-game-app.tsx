import { ShellErrorBoundary } from "@/lib/error-component";
import { useGame } from "@/game/store";
import { dismissSynapseSplash } from "@/game/opening";
import { useDiscordAccess } from "@/lib/auth/discord-access";
import { useEffect, useLayoutEffect } from "react";
import { GameApp } from "./App";
import { AuthenticatedMainMenu } from "./main-menu-auth";
import { DiscordRulesView } from "./discord-rules-view";
import { EliteTerminalOverlay, EliteTerminalRuntime } from "./elite-terminal";
import { PorchPresence } from "./porch-presence";

function PersistRuntime() {
  const hydrated = useGame((store) => store.hydrated);
  const persist = useGame((store) => store.persist);
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
  return null;
}

export function SecureGameApp() {
  const hydrate = useGame((store) => store.hydrate);
  const hydrated = useGame((store) => store.hydrated);
  const screen = useGame((store) => store.s.screen);
  const adoptVerifiedDiscord = useGame((store) => store.adoptVerifiedDiscord);
  const { access, pending } = useDiscordAccess();

  useLayoutEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    dismissSynapseSplash();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !access?.allowed || !access.discordId) return;
    adoptVerifiedDiscord(access.discordId, access.name ?? "", access.handle ?? "");
  }, [hydrated, access?.allowed, access?.discordId, access?.name, access?.handle, adoptVerifiedDiscord]);

  const allowed = !!access?.allowed;

  return (
    <>
      <EliteTerminalRuntime />
      <PersistRuntime />
      <PorchPresence />
      {screen === "rules" ? (
        <DiscordRulesView />
      ) : !hydrated || pending || screen === "title" || !allowed ? (
        <ShellErrorBoundary label="The porch flickered">
          <AuthenticatedMainMenu />
        </ShellErrorBoundary>
      ) : (
        <ShellErrorBoundary label="The war table flickered">
          <GameApp />
        </ShellErrorBoundary>
      )}
      <EliteTerminalOverlay />
    </>
  );
}