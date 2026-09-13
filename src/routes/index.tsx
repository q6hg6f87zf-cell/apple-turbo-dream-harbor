import { AuthorityClaimRuntime } from "@/components/game/authority-claim-runtime";
import { CampaignBalancePanel } from "@/components/game/campaign-balance-panel";
import { CampaignBalanceRuntime } from "@/components/game/campaign-balance-runtime";
import { ClassAliasLayer } from "@/components/game/class-alias-layer";
import { HollowRealmVisuals } from "@/components/game/hollow-visuals";
import { LoadoutEffectsRuntime } from "@/components/game/loadout-effects-runtime";
import { ResidentProgressionRuntime } from "@/components/game/resident-progression-runtime";
import { SecureGameApp } from "@/components/game/secure-game-app";
import { ServerEconomyRuntime } from "@/components/game/server-economy-runtime";
import { ServerInventoryRuntime } from "@/components/game/server-inventory-runtime";
import { ServerProgressionRuntime } from "@/components/game/server-progression-runtime";
import { bootstrapCampaignBalance } from "@/game/balance-bootstrap";
import { bootstrapTyroneHelp } from "@/game/tyrone-help-bootstrap";
import { createFileRoute } from "@tanstack/react-router";

bootstrapCampaignBalance();
bootstrapTyroneHelp();

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <>
      <SecureGameApp />
      <AuthorityClaimRuntime />
      <ServerEconomyRuntime />
      <ServerProgressionRuntime />
      <ServerInventoryRuntime />
      <HollowRealmVisuals />
      <ClassAliasLayer />
      <CampaignBalanceRuntime />
      <ResidentProgressionRuntime />
      <LoadoutEffectsRuntime />
      <CampaignBalancePanel />
    </>
  );
}
