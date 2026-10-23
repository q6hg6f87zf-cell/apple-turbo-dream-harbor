/**
 * Mythos elite theater copy pack (consequence-aware).
 * Player-facing settle / intel / boss / raid / day-board / war-journal voice.
 * Pure strings + selectors — no economy math, no tyrone-bot, no profile cards.
 *
 * Partners: Atlas (pulse / heat / strip), Vault (journal projections), Canon (lore lock),
 * Chrome/Forge (cite eventId + revision; never fabricate rows).
 *
 * Bible v1.3 — Mythos voice on:
 * - 6 War journal: MissionSettled | BossCleared | TransferSettled | DayAdvanced
 *   → headline + radio one-liners via journalCopyFor (no cozy body).
 * - 7 Day-cycle drama: idle lead + strip/next-offer for heat / crisis / tribute /
 *   unanswered watches + boost|unlock|cool (next_offer_* keys).
 *
 * Consequence contract (Atlas → Mythos):
 * - Event fields already carry heatDelta / intelDelta / performanceScore / worldConsequence.
 * - Optional TheaterCopyContext lets Atlas pass scar / grateful / colder / copyKey overrides
 *   (regionHeat ≥ 8, regionIntel ≥ 3, or explicit flags / offerMutations[].copyKey).
 * - Selectable copyKeys (THEATER_COPY_KEYS) — snake_case ONLY; no kebab aliases.
 */
import { regionById } from "./data";
import type { MissionKind, RegionId } from "./types";
import {
  isScarWorthy,
  type TheaterBeatId,
  type TheaterEventPayload,
  type TheaterName,
} from "./world-event-theater";

export type TheaterCopyTone = "ember" | "danger" | "moon" | "muted";

export type TheaterCopyLines = {
  /** Day-board strip / atlas toast headline */
  headline: string;
  /** One-breath stake under the headline */
  subline: string;
  /** Optional Moon Squad radio (Tyrone · … / SYNAPSE · …) for log / chatter */
  radio: string;
  tone: TheaterCopyTone;
  /** Selectable Mythos key for Atlas next-offer / heat-scar hooks */
  copyKey?: string | null;
};

/**
 * Optional Atlas projector context. Prefer deriving flags from the event;
 * pass ctx when heat/intel memory lives on the pulse cell, not the beat.
 */
export type TheaterCopyContext = {
  copyKey?: string | null;
  scarred?: boolean;
  gratefulVault?: boolean;
  colderIntel?: boolean;
  /** Atlas heat cell intensity for the region (scar when ≥ 8). */
  regionHeat?: number;
  /** Atlas intel memory for the region (colder when ≥ 3). */
  regionIntel?: number;
};

/** Stable keys Atlas may pin on offerMutations / strip projections. */
export const THEATER_COPY_KEYS = [
  "scar_sector",
  "grateful_vault",
  "colder_intel",
  "atlas_scar",
  "board_seal",
  "foreshadow_raid",
  "foreshadow_boss",
  "next_offer_boost",
  "next_offer_unlock",
  "next_offer_cool",
  "vault_flash_scout",
  "vault_flash_raid",
  "vault_flash_boss",
  "intel_drop_scout",
  "intel_drop_raid",
  "intel_drop_boss",
] as const;

export type TheaterCopyKey = (typeof THEATER_COPY_KEYS)[number];

type TheaterCopyEvent = Pick<
  TheaterEventPayload,
  | "theater"
  | "beatId"
  | "region"
  | "kind"
  | "intelDelta"
  | "heatDelta"
  | "performanceScore"
  | "worldConsequence"
>;

type ConsequenceFlags = {
  scarred: boolean;
  gratefulVault: boolean;
  colderIntel: boolean;
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

function firstCopyKey(event: TheaterCopyEvent, ctx?: TheaterCopyContext | null): string | null {
  if (ctx?.copyKey && ctx.copyKey.trim()) return ctx.copyKey.trim().slice(0, 64);
  const muts = event.worldConsequence?.offerMutations;
  if (!muts) return null;
  for (const m of muts) {
    if (m.copyKey && m.copyKey.trim()) return m.copyKey.trim().slice(0, 64);
  }
  return null;
}

function resolveFlags(
  event: TheaterCopyEvent,
  ctx: TheaterCopyContext | null | undefined,
  key: string | null,
): ConsequenceFlags {
  const scarred =
    ctx?.scarred === true ||
    (typeof ctx?.regionHeat === "number" && ctx.regionHeat >= 8) ||
    key === "scar_sector" ||
    key === "atlas_scar" ||
    isScarWorthy(event.theater, event.kind ?? null, event.heatDelta ?? 0);
  const gratefulVault =
    ctx?.gratefulVault === true ||
    key === "grateful_vault" ||
    (event.beatId === "vault_flash" && (event.performanceScore ?? 0) >= 750);
  const colderIntel =
    ctx?.colderIntel === true ||
    key === "colder_intel" ||
    (typeof ctx?.regionIntel === "number" && ctx.regionIntel >= 3) ||
    (event.intelDelta ?? 0) >= 2;
  return { scarred, gratefulVault, colderIntel };
}

function withKey(lines: Omit<TheaterCopyLines, "copyKey">, copyKey: string | null): TheaterCopyLines {
  return { ...lines, copyKey };
}

/**
 * Direct key lookup for Atlas next-offer / heat-scar projections.
 * Prefer theaterCopyFor when a full event is available.
 */
export function theaterCopyByKey(
  copyKey: string,
  region: RegionId | string | null = null,
): TheaterCopyLines {
  const place = theaterRegionLabel(region);
  const key = copyKey.trim().slice(0, 64);
  switch (key) {
    case "scar_sector":
    case "atlas_scar":
      return withKey(
        {
          headline: `Scarred sector · ${place}`,
          subline: "The rim still glows. Heat does not forget who opened it.",
          radio: "Tyrone · Walk soft. That cell has teeth now.",
          tone: "danger",
        },
        key,
      );
    case "grateful_vault":
      return withKey(
        {
          headline: `Vault 13 grateful · ${place}`,
          subline: "Fair weigh, clean seal. The treasury keeps your name warm.",
          radio: "SYNAPSE · Settle locked. Vault remembers the hand.",
          tone: "ember",
        },
        key,
      );
    case "colder_intel":
      return withKey(
        {
          headline: `Colder intel · ${place}`,
          subline: "The map thickens. Routes get quiet. Speak less.",
          radio: "Tyrone · Visor down. You are counting ghosts.",
          tone: "moon",
        },
        key,
      );
    case "board_seal":
      return withKey(
        {
          headline: `Board seal · ${place}`,
          subline: "The named hill is ink. Tomorrow's offers shift around the scar.",
          radio: "Tyrone · Phases are over. The board reprints around what you killed.",
          tone: "danger",
        },
        key,
      );
    case "foreshadow_raid":
      return withKey(
        {
          headline: `Raid foreshadow · ${place}`,
          subline: "Heat climbs the ribbon. Breach is coming whether you book it or not.",
          radio: "Tyrone · Hold the door or do not open it. Halfway is a grave.",
          tone: "moon",
        },
        key,
      );
    case "foreshadow_boss":
      return withKey(
        {
          headline: `Named foreshadow · ${place}`,
          subline: "The hill has a name on the day-board. Everything else was practice.",
          radio: "Tyrone · This is the name on the map. Do not wave.",
          tone: "moon",
        },
        key,
      );
    case "next_offer_boost":
      return withKey(
        {
          headline: `Board leans hard · ${place}`,
          subline: "Next watch reprints heavier here. Crisis residue still on the ribbon.",
          radio: "Tyrone · Take the boosted ticket or Kane prices it for someone else.",
          tone: "ember",
        },
        key,
      );
    case "next_offer_unlock":
      return withKey(
        {
          headline: `Board unlocks · ${place}`,
          subline: "A new watch appears where the scar cooled. Read it twice before dawn.",
          radio: "Tyrone · New ink after the settle. Idle is still work.",
          tone: "moon",
        },
        key,
      );
    case "next_offer_cool":
      return withKey(
        {
          headline: `Board cools · ${place}`,
          subline: "Offers thin. Heat bled out. Tomorrow reprints quieter — for now.",
          radio: "SYNAPSE · Region cooled. Weight redistributed. Watch the strip.",
          tone: "muted",
        },
        key,
      );
    default:
      return withKey(
        {
          headline: `World pulse · ${place}`,
          subline: "The Hollow shifted. Read the board before you boast.",
          radio: "Tyrone · Do the job in front of you.",
          tone: "ember",
        },
        key || null,
      );
  }
}

function vaultFlashByKind(
  place: string,
  kind: MissionKind | null | undefined,
  flags: ConsequenceFlags,
): TheaterCopyLines {
  if (flags.gratefulVault) {
    return withKey(
      {
        headline: `Vault 13 grateful · ${place}`,
        subline: "Fair weigh, clean seal. The treasury keeps your name warm.",
        radio: "SYNAPSE · Settle locked. Vault remembers the hand.",
        tone: "ember",
      },
      "grateful_vault",
    );
  }
  if (kind === "boss") {
    return withKey(
      {
        headline: `Vault 13 seals the hill · ${place}`,
        subline: flags.scarred
          ? "Named haul lands on a scarred cell. Caps do not erase heat."
          : "Named haul lands. Treasury takes the weigh; the arc does not rewind.",
        radio: "SYNAPSE · Boss settle locked. Revision on the rail.",
        tone: "ember",
      },
      "vault_flash_boss",
    );
  }
  if (kind === "raid" || kind === "bounty") {
    return withKey(
      {
        headline: `Vault 13 takes the breach · ${place}`,
        subline: flags.scarred
          ? "Breach pay on a glowing rim. Stow it before the cell bites back."
          : "Breach pay hits the vault. Noise already bought the next fight.",
        radio: "SYNAPSE · Fair settle locked. Revision on the rail.",
        tone: "ember",
      },
      "vault_flash_raid",
    );
  }
  if (kind === "scout") {
    return withKey(
      {
        headline: `Vault 13 pulse · ${place}`,
        subline: "Scout weigh is light. Routes paid more than ore.",
        radio: "SYNAPSE · Scout settle locked. Intel outruns the haul.",
        tone: "ember",
      },
      "vault_flash_scout",
    );
  }
  return withKey(
    {
      headline: `Vault 13 pulse · ${place}`,
      subline: "Treasury takes the weigh. Caps do not walk themselves.",
      radio: "SYNAPSE · Fair settle locked. Revision on the rail.",
      tone: "ember",
    },
    "vault_flash_scout",
  );
}

function intelDropByKind(
  place: string,
  kind: MissionKind | null | undefined,
  flags: ConsequenceFlags,
): TheaterCopyLines {
  if (flags.colderIntel) {
    return withKey(
      {
        headline: `Colder intel · ${place}`,
        subline: flags.scarred
          ? "Thick map on a scarred sector. Count quiet. Do not claim."
          : "The map thickens. Routes get quiet. Speak less.",
        radio: "Tyrone · Visor down. You are counting ghosts.",
        tone: "moon",
      },
      "colder_intel",
    );
  }
  if (kind === "boss") {
    return withKey(
      {
        headline: `Named intel · ${place}`,
        subline: "The hill left a ledger. SYNAPSE already priced the next watch.",
        radio: "Tyrone · Keep the visor down. Names are currency now.",
        tone: "ember",
      },
      "intel_drop_boss",
    );
  }
  if (kind === "raid" || kind === "bounty") {
    return withKey(
      {
        headline: `Breach intel · ${place}`,
        subline: flags.scarred
          ? "Cheap blood on a glowing rim. The map remembers the hinge."
          : "Cheap blood spent well. The map thickens before the haul does.",
        radio: "Tyrone · Keep the visor down. You are counting, not claiming.",
        tone: "ember",
      },
      "intel_drop_raid",
    );
  }
  if (kind === "scout") {
    return withKey(
      {
        headline: `Scout intel · ${place}`,
        subline: "A picture for SYNAPSE, not a hero. Routes marked colder.",
        radio: "Tyrone · Intel is the cheap blood. Spend it before you spend a body.",
        tone: "ember",
      },
      "intel_drop_scout",
    );
  }
  return withKey(
    {
      headline: `Intel spike · ${place}`,
      subline: "Cheap blood spent well. The map thickens before the haul does.",
      radio: "Tyrone · Keep the visor down. You are counting, not claiming.",
      tone: "ember",
    },
    "intel_drop_scout",
  );
}

const SPECIALIZED_KEYS = new Set<string>([
  "scar_sector",
  "atlas_scar",
  "grateful_vault",
  "colder_intel",
  "board_seal",
  "vault_flash_scout",
  "vault_flash_raid",
  "vault_flash_boss",
  "intel_drop_scout",
  "intel_drop_raid",
  "intel_drop_boss",
  "foreshadow_raid",
  "foreshadow_boss",
]);

function applyConsequenceOverlay(
  lines: TheaterCopyLines,
  flags: ConsequenceFlags,
  theater: TheaterName,
): TheaterCopyLines {
  if (lines.copyKey && SPECIALIZED_KEYS.has(lines.copyKey)) return lines;
  if (flags.scarred && (theater === "MissionSettled" || theater === "RaidOpened")) {
    return {
      ...lines,
      subline: `${lines.subline} Scarred sector — heat still on the rim.`,
      radio: lines.radio.startsWith("Tyrone")
        ? lines.radio
        : `Tyrone · ${lines.radio.replace(/^SYNAPSE · /, "")} Walk the scar soft.`,
    };
  }
  return lines;
}

const KEYED_SHORTCUTS = new Set([
  "scar_sector",
  "atlas_scar",
  "grateful_vault",
  "colder_intel",
  "board_seal",
  "foreshadow_raid",
  "foreshadow_boss",
  "next_offer_boost",
  "next_offer_unlock",
  "next_offer_cool",
]);

function bossSealLines(place: string, flags: ConsequenceFlags): TheaterCopyLines {
  return withKey(
    {
      headline: flags.scarred ? `Atlas scar · ${place}` : `Named hill falls · ${place}`,
      subline: flags.scarred
        ? "Board seal inked. The Realm does not let you kill it twice. Stow the story."
        : "The Realm does not let you kill it twice. Stow the story.",
      radio: "Tyrone · Phases are over. The arc does not rewind.",
      tone: "danger",
    },
    flags.scarred ? "atlas_scar" : "board_seal",
  );
}

/**
 * Elite copy for one normalized theater payload.
 * Headlines stay short enough for the day-board strip; sublines carry stakes.
 * Optional ctx / copyKey lets Atlas pin consequence voice without inventing economy.
 */
export function theaterCopyFor(
  event: TheaterCopyEvent,
  ctx?: TheaterCopyContext | null,
): TheaterCopyLines {
  const place = theaterRegionLabel(event.region);
  const kind = event.kind;
  const beatId = event.beatId;
  const theater = event.theater;
  const tone = toneFor(theater, beatId);
  const key = firstCopyKey(event, ctx);
  const flags = resolveFlags(event, ctx, key);

  if (key && KEYED_SHORTCUTS.has(key)) {
    const keyed = theaterCopyByKey(key, event.region);
    if (event.region) {
      return withKey(
        {
          headline: keyed.headline.includes("·")
            ? keyed.headline.replace(/· .*$/, `· ${place}`)
            : keyed.headline,
          subline: keyed.subline,
          radio: keyed.radio,
          tone: keyed.tone,
        },
        keyed.copyKey ?? key,
      );
    }
    return keyed;
  }

  // BossCleared theater always seals the board (intel on the clear is flavor, not intel_drop).
  if (theater === "BossCleared") {
    return bossSealLines(place, flags);
  }

  // Vault flash / intel drop BEFORE MissionSettled+boss catch-all so kind-split beats survive.
  if (beatId === "intel_drop" || (event.intelDelta ?? 0) > 0) {
    return applyConsequenceOverlay(intelDropByKind(place, kind, flags), flags, theater);
  }

  if (beatId === "vault_flash") {
    return applyConsequenceOverlay(vaultFlashByKind(place, kind, flags), flags, theater);
  }

  if (theater === "MissionSettled" && (kind === "boss" || beatId === "boss_clear")) {
    return bossSealLines(place, flags);
  }

  if (theater === "RaidOpened") {
    const raidKind = kind === "boss" ? "Named raid" : kindNoun(kind);
    const foreshadowKey = kind === "boss" ? "foreshadow_boss" : "foreshadow_raid";
    return applyConsequenceOverlay(
      withKey(
        {
          headline: `${raidKind} ticket live · ${place}`,
          subline:
            kind === "boss"
              ? flags.scarred
                ? "Day-board foreshadow on a scarred rim. The hill has a name."
                : "The hill has a name. Everything else was practice."
              : flags.scarred
                ? "Day-board foreshadow. Breach is a promise to Kane — and the rim still glows."
                : "Breach is a promise to Kane. She keeps receipts.",
          radio:
            kind === "boss"
              ? "Tyrone · This is the name on the map. Do not wave. Do not run until I say."
              : "Tyrone · Hold the door or do not open it. Halfway is a grave.",
          tone: "moon",
        },
        foreshadowKey,
      ),
      flags,
      theater,
    );
  }

  if (theater === "MissionFailed" || theater === "BossFailed") {
    return withKey(
      {
        headline: `${kindNoun(kind)} wiped · ${place}`,
        subline: flags.scarred
          ? "Come home with a map, not a speech. The scar still reprints."
          : "Come home with a map, not a speech. The board still reprints.",
        radio: "Tyrone · Idle is still work. Read the next watch.",
        tone: "muted",
      },
      null,
    );
  }

  if (theater === "DayAdvanced") {
    return withKey(
      {
        headline: "Dawn reprints the board",
        subline: "Six watches. Crisis residue and unanswered ink still price the ribbon.",
        radio: "Tyrone · The board is new. Idle is still work. Read the strip before you boast.",
        tone: "moon",
      },
      null,
    );
  }

  if (theater === "TransferSettled") {
    return withKey(
      {
        headline: "Vault 13 transfer sealed",
        subline: "Card and treasury agree. No second weigh. The journal keeps the stamp.",
        radio: "SYNAPSE · Transfer settled. Revision advanced. Receipt on the rail.",
        tone: "ember",
      },
      null,
    );
  }

  if (theater === "IdentityLinked") {
    return withKey(
      {
        headline: "Rider linked · Moon Squad",
        subline: "Porch seat claimed. The campaign already knows your name.",
        radio: "Tyrone · Welcome to the watch. Read the board before you boast.",
        tone: "moon",
      },
      null,
    );
  }

  if (kind === "raid" || kind === "bounty") {
    return applyConsequenceOverlay(
      withKey(
        {
          headline: `${kindNoun(kind)} sealed · ${place}`,
          subline:
            kind === "bounty"
              ? "The board named a shadow. Contract closed."
              : "Extract means walking. Noise already bought the fight.",
          radio:
            kind === "bounty"
              ? "Tyrone · No speeches. The contract was the speech."
              : "Tyrone · Hold what you took. Kane heard the hinge.",
          tone,
        },
        null,
      ),
      flags,
      theater,
    );
  }

  if (kind === "scout") {
    return applyConsequenceOverlay(
      withKey(
        {
          headline: `Scout closed · ${place}`,
          subline: "A picture for SYNAPSE, not a hero. Routes marked.",
          radio: "Tyrone · Intel is the cheap blood. Spend it before you spend a body.",
          tone,
        },
        null,
      ),
      flags,
      theater,
    );
  }

  if (kind === "forage") {
    return withKey(
      {
        headline: `Forage sealed · ${place}`,
        subline: "Take what the Hollow dropped. Leave what it is still holding.",
        radio: "Tyrone · Heavy packs make slow exits. Count the watches.",
        tone,
      },
      null,
    );
  }

  return applyConsequenceOverlay(
    withKey(
      {
        headline: `${kindNoun(kind)} settled · ${place}`,
        subline: "Fair settle on the rail. The Hollow remembers the weigh.",
        radio: "Tyrone · Do the job in front of you. Then read the board.",
        tone,
      },
      null,
    ),
    flags,
    theater,
  );
}

/** Bible 6 — journal-eligible domain theaters. RaidOpened is foreshadow/strip only. */
export const JOURNAL_THEATERS = [
  "MissionSettled",
  "BossCleared",
  "TransferSettled",
  "DayAdvanced",
] as const;

export type JournalTheater = (typeof JOURNAL_THEATERS)[number];

export function isJournalTheater(theater: string | null | undefined): theater is JournalTheater {
  return (
    theater === "MissionSettled" ||
    theater === "BossCleared" ||
    theater === "TransferSettled" ||
    theater === "DayAdvanced"
  );
}

/** Locked snake_case catalog membership (Canon — no kebab aliases). */
export function isTheaterCopyKey(key: string | null | undefined): key is TheaterCopyKey {
  if (!key) return false;
  return (THEATER_COPY_KEYS as readonly string[]).includes(key);
}

/**
 * War journal framing (Bible 6).
 * Vault projects the row; Mythos owns headline + radio only — no body, no fabricated rows.
 * copyKey is a THEATER_COPY_KEYS value when known, else null (DayAdvanced / TransferSettled).
 */
export type JournalCopyLines = {
  copyKey: string | null;
  headline: string;
  radio: string;
};

export function journalCopyFor(
  event: TheaterCopyEvent,
  ctx?: TheaterCopyContext | null,
): JournalCopyLines | null {
  if (!isJournalTheater(event.theater)) return null;
  const lines = theaterCopyFor(event, ctx);
  return {
    copyKey: lines.copyKey ?? null,
    headline: lines.headline,
    radio: lines.radio,
  };
}

/**
 * Day-cycle idle lead + strip voice (Bible 7).
 * Consumes Kane heat / crisis / tribute / unanswered watches and optional offer op.
 * When offerOp or a next_offer_* copyKey is set, reuses theaterCopyByKey (Atlas strip tone).
 */
export type DayCycleIdleContext = {
  region?: RegionId | string | null;
  kaneHeat?: number;
  hasCrisis?: boolean;
  hasTribute?: boolean;
  unansweredWatches?: number;
  /** Crisis/raid just settled — board should feel the residue before next login. */
  crisisResidue?: boolean;
  dayAdvanced?: boolean;
  /** Vault offerMutations op → next_offer_* key. */
  offerOp?: "boost" | "unlock" | "cool" | null;
  copyKey?: string | null;
};

function nextOfferKeyForOp(op: "boost" | "unlock" | "cool"): TheaterCopyKey {
  if (op === "boost") return "next_offer_boost";
  if (op === "unlock") return "next_offer_unlock";
  return "next_offer_cool";
}

export function dayCycleIdleLead(ctx: DayCycleIdleContext = {}): TheaterCopyLines {
  const place = theaterRegionLabel(ctx.region ?? null);
  const pinned =
    (ctx.copyKey && isTheaterCopyKey(ctx.copyKey) ? ctx.copyKey : null) ||
    (ctx.offerOp ? nextOfferKeyForOp(ctx.offerOp) : null);
  if (pinned === "next_offer_boost" || pinned === "next_offer_unlock" || pinned === "next_offer_cool") {
    return theaterCopyByKey(pinned, ctx.region ?? null);
  }
  if (pinned) {
    return theaterCopyByKey(pinned, ctx.region ?? null);
  }

  const unanswered = Math.max(0, ctx.unansweredWatches ?? 0);
  const heat = Math.max(0, ctx.kaneHeat ?? 0);

  if (ctx.hasCrisis || ctx.crisisResidue) {
    return withKey(
      {
        headline: ctx.crisisResidue
          ? `Crisis residue · ${place}`
          : `Crisis on the board · ${place}`,
        subline: ctx.crisisResidue
          ? "The settle rewrote tomorrow. At least one offer or strip line already moved."
          : "The compound is telling the truth. Handle it before the next watch.",
        radio: "Tyrone · Crisis first. Boast never. Read the strip.",
        tone: "danger",
      },
      null,
    );
  }

  if (unanswered > 0) {
    return withKey(
      {
        headline: `Unanswered watches · ${unanswered}`,
        subline: "Posted work outruns the ribbon. Something goes cold overnight.",
        radio: "Tyrone · Six watches. Choose. The rest is Kane's receipt.",
        tone: "muted",
      },
      null,
    );
  }

  if (ctx.hasTribute) {
    return withKey(
      {
        headline: `Kane tribute live · ${place}`,
        subline: "Pay, stall, or make her work for it. The board keeps the invoice.",
        radio: "Tyrone · Kane collects. Idle does not erase the cut.",
        tone: "ember",
      },
      null,
    );
  }

  if (heat >= 10) {
    return withKey(
      {
        headline: `Kane heat high · ${heat}`,
        subline: "Visors thicken. Crisis and tribute price themselves onto the ribbon.",
        radio: "Tyrone · Heat that high reprints the board whether you ask or not.",
        tone: "danger",
      },
      null,
    );
  }

  if (heat >= 5) {
    return withKey(
      {
        headline: `Kane heat climbing · ${heat}`,
        subline: "Quiet doors get shorter. Breach noise gets louder.",
        radio: "Tyrone · Heat is a receipt. Spend watches like you mean it.",
        tone: "ember",
      },
      null,
    );
  }

  if (ctx.dayAdvanced) {
    return withKey(
      {
        headline: "Dawn reprints the board",
        subline: "Six watches. Most jobs are decisions. The sortie still uses a die.",
        radio: "Tyrone · The board is new. Idle is still work.",
        tone: "moon",
      },
      null,
    );
  }

  return withKey(
    {
      headline: `Day board · ${place}`,
      subline: "Six watches. Most jobs are decisions. The sortie still uses a die.",
      radio: "Tyrone · Idle is still work. Read the board before you boast.",
      tone: "moon",
    },
    null,
  );
}

/** Strip / next-offer voice from a Vault offer mutation op (Bible 7). */
export function dayCycleOfferStrip(
  op: "boost" | "unlock" | "cool",
  region: RegionId | string | null = null,
): TheaterCopyLines {
  return theaterCopyByKey(nextOfferKeyForOp(op), region);
}

/** Convenience: headline only (world-pulse / strip). */
export function theaterHeadline(
  event: TheaterCopyEvent,
  ctx?: TheaterCopyContext | null,
): string {
  return theaterCopyFor(event, ctx).headline;
}

/** Convenience: subline only. */
export function theaterSubline(
  event: TheaterCopyEvent,
  ctx?: TheaterCopyContext | null,
): string {
  return theaterCopyFor(event, ctx).subline;
}
