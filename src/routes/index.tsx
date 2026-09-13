import "@/game/balance-bootstrap";
import { GameApp } from "@/components/game/App";
import { CampaignBalancePanel } from "@/components/game/campaign-balance-panel";
import { CampaignBalanceRuntime } from "@/components/game/campaign-balance-runtime";
import { ClassAliasLayer } from "@/components/game/class-alias-layer";
import { HollowRealmVisuals } from "@/components/game/hollow-visuals";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <>
      <GameApp />
      <HollowRealmVisuals />
      <ClassAliasLayer />
      <CampaignBalanceRuntime />
      <CampaignBalancePanel />
    </>
  );
}
