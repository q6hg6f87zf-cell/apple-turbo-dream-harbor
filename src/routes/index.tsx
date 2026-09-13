import { GameApp } from "@/components/game/App";
import { HollowRealmVisuals } from "@/components/game/hollow-visuals";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <>
      <GameApp />
      <HollowRealmVisuals />
    </>
  );
}
