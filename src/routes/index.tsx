import { GameApp } from "@/components/game/App";
import { CampaignBalancePanel } from "@/components/game/campaign-balance-panel";
import { CampaignBalanceRuntime } from "@/components/game/campaign-balance-runtime";
import { ClassAliasLayer } from "@/components/game/class-alias-layer";
import { HollowRealmVisuals } from "@/components/game/hollow-visuals";
import { ResidentProgressionRuntime } from "@/components/game/resident-progression-runtime";
import { bootstrapCampaignBalance } from "@/game/balance-bootstrap";
import { createFileRoute } from "@tanstack/react-router";

bootstrapCampaignBalance();

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <>
      <GameApp />
      <HollowRealmVisuals />
      <ClassAliasLayer />
      <CampaignBalanceRuntime />
      <ResidentProgressionRuntime />
      <CampaignBalancePanel />
    </>
  );
}
