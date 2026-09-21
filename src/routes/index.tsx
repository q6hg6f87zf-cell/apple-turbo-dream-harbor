import { createFileRoute } from '@tanstack/react-router'
import { AuthorityClaimRuntime } from "@/components/game/authority-claim-runtime";
import { CampaignBalancePanel } from "@/components/game/campaign-balance-panel";
import { CampaignBalanceRuntime } from "@/components/game/campaign-balance-runtime";
import { ClassAliasLayer } from "@/components/game/class-alias-layer";
import { InteractionPolishRuntime } from "@/components/game/interaction-polish-runtime";
import { LoadoutEffectsRuntime } from "@/components/game/loadout-effects-runtime";
import { ResidentProgressionRuntime } from "@/components/game/resident-progression-runtime";
import { SecureGameApp } from "@/components/game/secure-game-app";
import { ServerEconomyRuntime } from "@/components/game/server-economy-runtime";
import { ServerInventoryRuntime } from "@/components/game/server-inventory-runtime";
import { ServerProgressionRuntime } from "@/components/game/server-progression-runtime";
import { WorldBridgeRuntime } from "@/components/game/world-bridge-runtime";
import { TyroneDebugPanel } from "@/components/game/tyrone-debug";
import { bootstrapCampaignBalance } from "@/game/balance-bootstrap";
import { bootstrapTyroneHelp } from "@/game/tyrone-help-bootstrap";
import { parseDeepTo } from "@/lib/bridge/catalog";

bootstrapCampaignBalance();
bootstrapTyroneHelp();

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): {
    to?: "map" | "vault" | "hq" | "inventory" | "roster" | "market" | "profile";
    region?: string;
    discord?: string;
    auth?: string;
    reason?: string;
    claim?: string;
  } => ({
    to: parseDeepTo(search.to) ?? undefined,
    region: typeof search.region === "string" ? search.region.slice(0, 24) : undefined,
    discord: typeof search.discord === "string" ? search.discord.slice(0, 24) : undefined,
    auth: typeof search.auth === "string" ? search.auth.slice(0, 24) : undefined,
    reason: typeof search.reason === "string" ? search.reason.slice(0, 40) : undefined,
    claim: typeof search.claim === "string" ? search.claim.slice(0, 128) : undefined,
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <SecureGameApp />
      <WorldBridgeRuntime />
      <AuthorityClaimRuntime />
      <ServerEconomyRuntime />
      <ServerProgressionRuntime />
      <ServerInventoryRuntime />
      <ClassAliasLayer />
      <CampaignBalanceRuntime />
      <ResidentProgressionRuntime />
      <LoadoutEffectsRuntime />
      <InteractionPolishRuntime />
      <CampaignBalancePanel />
      <TyroneDebugPanel />
    </>
  );
}
