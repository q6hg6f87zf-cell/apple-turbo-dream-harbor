/**
 * Mythos elite theater copy pack.
 * Player-facing settle / intel / boss / raid / day-board voice for Atlas projectors.
 * Pure strings + selectors — no economy math, no tyrone-bot, no profile cards.
 *
 * Partners: Atlas (pulse / heat / strip), Canon (lore lock), Forge (UI consume).
 */
import { regionById } from "./data";
import type { MissionKind, RegionId } from "./types";
import type { TheaterBeatId, TheaterEventPayload, TheaterName } from "./world-event-theater";

export type TheaterCopyTone = "ember" | "danger" | "moon" | "muted";

export type TheaterCopyLines = {
  /** Day-board strip / atlas toast headline */
  headline: string;
  /** One-breath stake under the headline */
  subline: string;
  /** Optional Moon Squad radio (Tyrone · …) for log / chatter */
  radio: string;
  tone: TheaterCopyTone;
};

/** Canon short place-name for theater chrome (never raw region ids in UI). */
export function theaterRegionLabel(region: RegionId | string | null | undefined): string {
  if (!region) return "the Hollow";
  try {
    if (
      region === "ironclad" ||
      region === "slagtown" ||
      region === "blackspire" ||
      region === "brasswater" ||
      region === "veyra"
    ) {
      return regionById(region).short;
    }
  } catch {
    /* fall through */
  }
  if (region === "slagtown") return "Slag Town";
  if (region === "veyra") return "Veyra";
  return String(region);
}

const KIND_NOUN: Record<MissionKind, string> = {
  scout: "Scout",
  forage: "Forage",
  raid: "Raid",
  trade: "Trade",
  bounty: "Bounty",
  boss: "Named raid",
};

function kindNoun(kind: MissionKind | null | undefined): string {
  if (!kind) return "Sortie";
  return KIND_NOUN[kind] ?? "Sortie";
}

function toneFor(theater: TheaterName, beatId: TheaterBeatId): TheaterCopyTone {
  if (theater === "BossCleared" || beatId === "boss_clear") return "danger";
  if (theater === "MissionFailed" || theater === "BossFailed") return "muted";
  if (theater === "RaidOpened" || beatId === "raid_opened") return "moon";
  if (beatId === "vault_flash" || beatId === "intel_drop") return "ember";
  return "ember";
}

/**
 * Elite copy for one normalized theater payload.
 * Headlines stay short enough for the day-board strip; sublines carry stakes.
 */
export function theaterCopyFor(event: Pick<
  TheaterEventPayload,
  "theater" | "beatId" | "region" | "kind" | "intelDelta" | "performanceScore"
>): TheaterCopyLines {
  const place = theaterRegionLabel(event.region);
  const kind = event.kind;
  const beatId = event.beatId;
  const theater = event.theater;
  const tone = toneFor(theater, beatId);

  if (theater === "BossCleared" || (theater === "MissionSettled" && (kind === "boss" || beatId === "boss_clear"))) {
    return {
      headline: `Named hill falls · ${place}`,
      subline: "The Realm does not let you kill it twice. Stow the story.",
      radio: "Tyrone · Phases are over. The arc does not rewind.",
      tone: "danger",
    };
  }

  if (theater === "RaidOpened") {
    const raidKind = kind === "boss" ? "Named raid" : kindNoun(kind);
    return {
      headline: `${raidKind} ticket live · ${place}`,
      subline:
        kind === "boss"
          ? "The hill has a name. Everything else was practice."
          : "Breach is a promise to Kane. She keeps receipts.",
      radio:
        kind === "boss"
          ? "Tyrone · This is the name on the map. Do not wave. Do not run until I say."
          : "Tyrone · Hold the door or do not open it. Halfway is a grave.",
      tone: "moon",
    };
  }

  if (theater === "MissionFailed" || theater === "BossFailed") {
    return {
      headline: `${kindNoun(kind)} wiped · ${place}`,
      subline: "Come home with a map, not a speech. The board still reprints.",
      radio: "Tyrone · Idle is still work. Read the next watch.",
      tone: "muted",
    };
  }

  if (theater === "DayAdvanced") {
    return {
      headline: "Dawn reprints the board",
      subline: "Six watches. Most jobs are decisions. The sortie still uses a die.",
      radio: "Tyrone · The board is new. Idle is still work.",
      tone: "moon",
    };
  }

  if (theater === "TransferSettled") {
    return {
      headline: "Vault 13 transfer sealed",
      subline: "Card and treasury agree. No second weigh.",
      radio: "SYNAPSE · Transfer settled. Revision advanced.",
      tone: "ember",
    };
  }

  if (theater === "IdentityLinked") {
    return {
      headline: "Rider linked · Moon Squad",
      subline: "Porch seat claimed. The campaign already knows your name.",
      radio: "Tyrone · Welcome to the watch. Read the board before you boast.",
      tone: "moon",
    };
  }

  // MissionSettled — intel / vault / generic by beatId
  if (beatId === "intel_drop" || (event.intelDelta ?? 0) > 0) {
    return {
      headline: `Intel spike · ${place}`,
      subline: "Cheap blood spent well. The map thickens before the haul does.",
      radio: "Tyrone · Keep the visor down. You are counting, not claiming.",
      tone: "ember",
    };
  }

  if (beatId === "vault_flash") {
    return {
      headline: `Vault 13 pulse · ${place}`,
      subline: "Treasury takes the weigh. Caps do not walk themselves.",
      radio: "SYNAPSE · Fair settle locked. Revision on the rail.",
      tone: "ember",
    };
  }

  if (kind === "raid" || kind === "bounty") {
    return {
      headline: `${kindNoun(kind)} sealed · ${place}`,
      subline: kind === "bounty" ? "The board named a shadow. Contract closed." : "Extract means walking. Noise already bought the fight.",
      radio: kind === "bounty" ? "Tyrone · No speeches. The contract was the speech." : "Tyrone · Hold what you took. Kane heard the hinge.",
      tone,
    };
  }

  if (kind === "scout") {
    return {
      headline: `Scout closed · ${place}`,
      subline: "A picture for SYNAPSE, not a hero. Routes marked.",
      radio: "Tyrone · Intel is the cheap blood. Spend it before you spend a body.",
      tone,
    };
  }

  if (kind === "forage") {
    return {
      headline: `Forage sealed · ${place}`,
      subline: "Take what the Hollow dropped. Leave what it is still holding.",
      radio: "Tyrone · Heavy packs make slow exits. Count the watches.",
      tone,
    };
  }

  return {
    headline: `${kindNoun(kind)} settled · ${place}`,
    subline: "Fair settle on the rail. The Hollow remembers the weigh.",
    radio: "Tyrone · Do the job in front of you. Then read the board.",
    tone,
  };
}

/** Convenience: headline only (world-pulse / strip). */
export function theaterHeadline(event: Parameters<typeof theaterCopyFor>[0]): string {
  return theaterCopyFor(event).headline;
}

/** Convenience: subline only. */
export function theaterSubline(event: Parameters<typeof theaterCopyFor>[0]): string {
  return theaterCopyFor(event).subline;
}
