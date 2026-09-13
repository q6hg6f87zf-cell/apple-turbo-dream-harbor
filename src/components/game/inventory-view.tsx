import { useGame } from "@/game/store";
import { InventoryFast } from "./inventory-fast";
import { ServerInventoryView } from "./server-inventory-view";

export function InventoryView() {
  const discordId = useGame((store) => store.s.discordId);
  return discordId ? <ServerInventoryView /> : <InventoryFast />;
}
