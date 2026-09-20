import { useGame } from "@/game/store";
import { InventoryFast } from "./inventory-fast";
import { ServerInventoryView } from "./server-inventory-view";

export function InventoryView() {
  const discordId = useGame((store) => store.s.discordId);
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden" data-inventory-root="1">
      {discordId ? <ServerInventoryView /> : <InventoryFast />}
    </div>
  );
}
