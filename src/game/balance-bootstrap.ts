import { BASE_ROOMS, QUARTERS } from "./data";
import { HOLLOW_CATALOG } from "./hollow-catalog";
import { QUARTER_CAPS, RAID_PROFILES, ROOM_CAPS } from "./campaign-balance";
import { TREASURE_CATALOG } from "./treasure-catalog";
import type { QuarterId, RoomId } from "./types";

const ROOM_BONUS: Record<RoomId, string[]> = {
  vault: [
    "Salvage Depot online. Basic tagged storage and reclamation racks.",
    "Sealed storage lanes. Regional materials can be banked for construction.",
    "Armored cages and climate control. Rare salvage retention improves.",
    "Deep-storage level. Vault projects can consume Blackspire-grade components.",
    "Strategic reserve. Brasswater systems and boss relics can be warehoused safely.",
    "Vault 13 Arsenal. Endgame Veyran treasure and raid relic storage unlocked.",
  ],
  barracks: [
    "+2 operative beds. Resident Quarters become a real field rotation.",
    "+4 total expansion beds. Two fireteams can rotate through Vault 13.",
    "+6 expansion beds. Raid rosters stop depending on one perfect squad.",
    "+8 expansion beds. Dedicated class specialists can be maintained.",
    "+10 expansion beds. Multi-rider raid depth becomes sustainable.",
    "+12 expansion beds. Vault 13 supports an endgame expedition roster.",
  ],
  forge: [
    "Machine Shop online. Worn gear can be repaired.",
    "Precision benches. Repair burden falls and enchantment work stabilizes.",
    "Industrial fabrication. Legendary equipment can be maintained reliably.",
    "Blackspire tooling. High-load components and advanced enchantments supported.",
    "Brasswater hydraulic line. Raid gear maintenance becomes much cheaper.",
    "Veyran fabrication cell. Apex gear can be serviced without leaving Vault 13.",
  ],
  infirmary: [
    "Med Bay online. Downed residents can be stabilized.",
    "Trauma ward. Recovery costs fall and longer rotations become viable.",
    "Surgical suite. Severe injuries and contamination can be treated.",
    "Cryo-recovery bay. Blackspire exposure and deep trauma protocols unlocked.",
    "Pressure medicine wing. Brasswater and boss-raid injuries recover faster.",
    "Veyran recovery lab. Vault 13 reaches endgame medical capability.",
  ],
  watchtower: [
    "Perimeter Control online. Early warning and surface cameras reduce mission DC.",
    "Long-range optics. Regional scouting becomes meaningfully safer.",
    "Signal triangulation. Bounty and raid intel acquisition improves.",
    "Orbital telemetry. Blackspire routes can be profiled before deployment.",
    "Storm radar. Brasswater movement and world events are easier to predict.",
    "Deep-space array. Veyra and endgame threats are tracked from Vault 13.",
  ],
  ledger: [
    "Quartermaster Exchange online. Basic stock and Vault treasury access.",
    "Contract desk. Better stock rotation and team transfers.",
    "Artifact brokerage. High-tier exchange pricing improves.",
    "Regional procurement network. Blackspire-grade stock can surface.",
    "Raid logistics office. Boss rewards and communal purchasing scale better.",
    "Hollow Realm exchange node. Endgame procurement reaches maximum depth.",
  ],
};

const QUARTER_BONUS: Record<QuarterId, string[]> = {
  bunk: [
    "+1 to the first roll after a night in Vault 13.",
    "+2 Max HP from improved sleep and recovery.",
    "Full HP restoration after a proper Vault rest.",
    "Veteran berth. First mission check after rest gains a preparation edge.",
    "Raid berth. Recovery rotations support repeated boss attempts.",
    "Command berth. Apex residents recover at maximum efficiency.",
  ],
  lockbox: [
    "25% protection from theft and loss.",
    "50% protection from theft and loss.",
    "75% protection with Vault-grade locking hardware.",
    "Regional relic locker. Legendary salvage is isolated from common stock.",
    "Raid cache. Boss trophies and premium materials receive hardened storage.",
    "Black archive. Apex treasure receives maximum storage protection.",
  ],
  hearth: [
    "Companions recover 1 HP at dawn.",
    "Companions gain +1 to passive rolls.",
    "Companions fully recover at dawn.",
    "Common room network improves squad preparation and morale.",
    "Raid table supports multi-rider planning before boss attempts.",
    "War room. Vault 13 operates as a permanent endgame expedition base.",
  ],
};

let bootstrapped = false;

export function bootstrapCampaignBalance(): void {
  if (bootstrapped) return;
  bootstrapped = true;

  for (const room of Object.keys(ROOM_CAPS) as RoomId[]) {
    BASE_ROOMS[room].tiers = ROOM_CAPS[room].map((cost, i) => ({
      cost,
      bonus: ROOM_BONUS[room][i] ?? ROOM_BONUS[room].at(-1)!,
    }));
  }

  for (const q of Object.keys(QUARTER_CAPS) as QuarterId[]) {
    QUARTERS[q].tiers = QUARTER_CAPS[q].map((cost, i) => ({
      cost,
      bonus: QUARTER_BONUS[q][i] ?? QUARTER_BONUS[q].at(-1)!,
    }));
  }

  // The current field party is capped at three operatives. Keep Veyra nearly
  // perfect, but mathematically achievable with three fully prepared residents.
  RAID_PROFILES.veyra.minReadiness = 785;

  // Keep one shared catalogue so the existing Inventory screen immediately gains
  // the deeper treasure table without duplicating UI logic.
  const known = new Set(HOLLOW_CATALOG.map((item) => `${item.kind}:${item.name}`));
  for (const item of TREASURE_CATALOG) {
    const key = `${item.kind}:${item.name}`;
    if (!known.has(key)) {
      HOLLOW_CATALOG.push(item);
      known.add(key);
    }
  }
}
