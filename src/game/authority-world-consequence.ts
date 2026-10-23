import type { MissionKind, RegionId } from "./types";
import { AUTHORITY_BOSS_GATES, AUTHORITY_REGION_ORDER } from "./authority-rules";

/** Atlas-canonical snake beat ids for settle theaters (prefer snake over kebab). */
export type SettleBeatIdSnake =
  | "vault_flash"
  | "intel_drop"
  | "boss_clear"
  | "mission_settle";

export type OfferMutationOp = "boost" | "unlock" | "cool";

export type OfferMutation = {
  op: OfferMutationOp;
  region: RegionId;
  kinds?: MissionKind[];
  weight?: number;
  reason: string;
  copyKey?: string;
};

export type WorldConsequence = {
  offerMutations: OfferMutation[];
};

/** Map settle kind + intel delta to Atlas snake beatId. */
export function settleBeatIdSnake(kind: string, intelDelta: number): SettleBeatIdSnake {
  if (kind === "boss") return "boss_clear";
  if (intelDelta > 0) return "intel_drop";
  if (kind === "raid" || kind === "bounty") return "vault_flash";
  return "mission_settle";
}

/** Top-level heatDelta canon (not nested under worldConsequence). */
export function heatDeltaFor(kind: string): number {
  if (kind === "boss") return 8;
  if (kind === "raid" || kind === "bounty") return 3;
  if (kind === "scout") return 1;
  return 1;
}

function nextRegion(region: RegionId): RegionId | null {
  const idx = AUTHORITY_REGION_ORDER.indexOf(region);
  if (idx < 0 || idx >= AUTHORITY_REGION_ORDER.length - 1) return null;
  return AUTHORITY_REGION_ORDER[idx + 1]!;
}

/**
 * Strike combat rules for MissionSettled.offerMutations.
 * Scoped to settled region unless noted. Never unlocks boss from scout alone.
 */
export function buildMissionSettledOfferMutations(args: {
  region: RegionId;
  kind: MissionKind | string;
  /** Region intel after this settle's scaled intel is applied. */
  postSettleIntel: number;
  /** True when AUTHORITY_BOSS_GATES (intel/day/rider xp at minimum) already met. */
  bossGatesMet: boolean;
}): OfferMutation[] {
  const { region, kind, postSettleIntel, bossGatesMet } = args;
  const gate = AUTHORITY_BOSS_GATES[region];
  const out: OfferMutation[] = [];

  if (kind === "scout") {
    out.push({
      op: "boost",
      region,
      kinds: ["scout", "forage"],
      weight: 1,
      reason: "intel_drop",
    });
    const raidUnlockAt = region === "ironclad" ? 3 : Math.floor(gate.minIntel / 2);
    if (postSettleIntel >= raidUnlockAt) {
      out.push({
        op: "unlock",
        region,
        kinds: ["raid"],
        reason: "intel_drop",
      });
    }
    if (postSettleIntel >= gate.minIntel - 2) {
      out.push({
        op: "unlock",
        region,
        kinds: ["bounty"],
        reason: "intel_drop",
      });
    }
    // NEVER unlock boss from scout alone
    return out;
  }

  if (kind === "forage" || kind === "trade") {
    out.push({
      op: "boost",
      region,
      kinds: [kind as MissionKind, "forage"],
      weight: 1,
      reason: `${kind}_settle`,
    });
    return out;
  }

  if (kind === "raid") {
    out.push({
      op: "boost",
      region,
      kinds: ["raid", "bounty"],
      weight: 1,
      reason: "raid_settle",
    });
    out.push({
      op: "unlock",
      region,
      kinds: ["bounty"],
      reason: "raid_settle",
    });
    if (bossGatesMet) {
      out.push({
        op: "unlock",
        region,
        kinds: ["boss"],
        reason: "raid_gates_met",
      });
    }
    out.push({
      op: "cool",
      region,
      kinds: ["scout"],
      weight: 1,
      reason: "raid_settle",
    });
    return out;
  }

  if (kind === "bounty") {
    out.push({
      op: "boost",
      region,
      kinds: ["bounty", "raid"],
      weight: 1,
      reason: "bounty_settle",
    });
    if (bossGatesMet) {
      out.push({
        op: "unlock",
        region,
        kinds: ["boss"],
        reason: "bounty_gates_met",
      });
    }
    return out;
  }

  // boss MissionSettled row keeps empty mutations; BossCleared companion owns them
  return out;
}

/**
 * Strike rules for BossCleared companion event (same TX as MissionSettled).
 * Never boosts boss in cleared region; never unlocks boss in next region.
 */
export function buildBossClearedOfferMutations(region: RegionId): OfferMutation[] {
  const out: OfferMutation[] = [];
  const opened = nextRegion(region);

  // in-region recovery
  out.push({
    op: "unlock",
    region,
    kinds: ["trade", "forage"],
    reason: "boss_clear_followup",
  });
  out.push({
    op: "cool",
    region,
    kinds: ["raid", "bounty"],
    weight: 2,
    reason: "boss_clear_exhale",
  });

  if (opened) {
    out.push({
      op: "unlock",
      region: opened,
      kinds: ["scout", "forage"],
      reason: "authority_region_unlocked",
    });
    out.push({
      op: "boost",
      region: opened,
      kinds: ["scout"],
      weight: 1,
      reason: "authority_region_unlocked",
    });
  }

  return out;
}

export function bossClearedIdempotencyKey(ticketId: string) {
  return `boss-cleared:${ticketId}`;
}

export function bossClearedEventId(ticketId: string) {
  return `bce-${ticketId.slice(0, 40)}`;
}
