import { useGame } from "@/game/store";
import { useDiscordAccess } from "@/lib/auth/discord-access";
import { useLayoutEffect } from "react";
import { GameApp } from "./App";
import { AuthenticatedMainMenu } from "./main-menu-auth";
import { DiscordRulesView } from "./discord-rules-view";
import { EliteTerminalOverlay, EliteTerminalRuntime } from "./elite-terminal";

export function SecureGameApp() {
  const hydrate = useGame((store) => store.hydrate);
  const hydrated = useGame((store) => store.hydrated);
  const screen = useGame((store) => store.s.screen);
  const { access, pending } = useDiscordAccess();

  useLayoutEffect(() => {
    hydrate();
  }, [hydrate]);

  const allowed = !!access?.allowed;

  return (
    <>
      <EliteTerminalRuntime />
      {screen === "rules" ? (
        <DiscordRulesView />
      ) : !hydrated || pending || screen === "title" || !allowed ? (
        <AuthenticatedMainMenu />
      ) : (
        <GameApp />
      )}
      <EliteTerminalOverlay />
    </>
  );
}
