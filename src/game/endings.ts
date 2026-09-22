/**
 * Ending evaluation — earned epilogue states from flags, factions, and Tyrone.
 * Not cutscene swaps: journal + endingId the world can react to.
 */
import {
  addJournal,
  ensureNarrative,
  hasFlag,
  setFlag,
  type StoryActId,
} from "./narrative-state";
import { rememberTyrone } from "./tyrone-mind";
import { completeBeat, syncStorySpine } from "./story-spine";
import type { GameState } from "./types";

export type EndingId =
  | "vault_hold"
  | "kane_collaborator"
  | "open_road"
  | "aegis_shadow"
  | "bay_keeper";

export interface EndingDef {
  id: EndingId;
  title: string;
  epilogue: string;
  tyroneLine: string;
}

export const ENDINGS: Record<EndingId, EndingDef> = {
  vault_hold: {
    id: "vault_hold",
    title: "Door 13 Holds",
    epilogue:
      "Vault 13 stays a roof. Tyrone stays a witness. Kane's invoice is incomplete. The Hollow still has a version of itself that is not hers.",
    tyroneLine: "We held. That is enough for a porch light.",
  },
  kane_collaborator: {
    id: "kane_collaborator",
    title: "Invoice Partner",
    epilogue:
      "You sold pages and quiet. Heat eased. Caps arrived. Project Vesper has a friend in Vault 13 — whether the town knows or not.",
    tyroneLine: "I remember the sale. The porch does too.",
  },
  open_road: {
    id: "open_road",
    title: "East Highway Again",
    epilogue:
      "You left carts and bays and ridges to their owners. The road that found you is still empty of answers. That is also a choice.",
    tyroneLine: "I will walk it with you. I will not pretend we looked.",
  },
  aegis_shadow: {
    id: "aegis_shadow",
    title: "Painted Outline",
    epilogue:
      "The wing has your serials. Lyra's transcript is complete. Orion knows the door. Survival is still possible — quiet is not.",
    tyroneLine: "They have my outline. Stay loud only when you mean it.",
  },
  bay_keeper: {
    id: "bay_keeper",
    title: "Last Bay Lit",
    epilogue:
      "Travis kept the jig full. Tyrone lists true. Ironclad still has a mechanic Kane did not melt. That is a smaller ending — and a real one.",
    tyroneLine: "He kept me upright. You kept him paid. Good.",
  },
};

/** Hard gate: convergence-ready campaign, not a day-1 epilogue. */
export function endingEligible(state: GameState): boolean {
  const n = ensureNarrative(state);
  if (n.endingId) return false;
  if (state.day < 8) return false;
  const actOk: StoryActId[] = ["act_iii", "convergence", "ending"];
  if (!actOk.includes(n.act) && (state.kaneHeat ?? 0) < 14 && !hasFlag(state, "vesper_named")) {
    return false;
  }
  // Need enough authored pressure resolved.
  const pressure =
    Number(hasFlag(state, "lyra_ridge_handled")) +
    Number(hasFlag(state, "caravan_investigated") || hasFlag(state, "caravan_abandoned")) +
    Number(hasFlag(state, "halo_reported") || hasFlag(state, "halo_ambushed")) +
    Number(hasFlag(state, "invoice_copied") || hasFlag(state, "invoice_burned") || hasFlag(state, "invoice_sold")) +
    Number(hasFlag(state, "travis_jig_filled") || hasFlag(state, "travis_refused"));
  return pressure >= 3 || n.act === "convergence";
}

export function pickEndingId(state: GameState): EndingId {
  const n = ensureNarrative(state);
  const trust = state.tyrone?.relationship.trust ?? 0;
  const loyalty = state.tyrone?.relationship.loyalty ?? 0;
  const f = n.factions;

  if (hasFlag(state, "invoice_sold") || f.kane >= 8) return "kane_collaborator";
  if (hasFlag(state, "lyra_fought") || (state.kaneHeat ?? 0) >= 18 || hasFlag(state, "orion_spoken")) {
    return "aegis_shadow";
  }
  if (hasFlag(state, "travis_jig_filled") && loyalty >= 55) return "bay_keeper";
  if (
    hasFlag(state, "caravan_abandoned") &&
    hasFlag(state, "travis_refused") &&
    trust < 45
  ) {
    return "open_road";
  }
  if (f.vault13 >= 10 && loyalty >= 50 && !hasFlag(state, "invoice_sold")) return "vault_hold";
  if (hasFlag(state, "invoice_copied") && f.vault13 >= 6) return "vault_hold";
  return "open_road";
}

export function applyEnding(state: GameState, id?: EndingId): EndingDef | null {
  if (!endingEligible(state) && !id) return null;
  const n = ensureNarrative(state);
  if (n.endingId) return ENDINGS[n.endingId as EndingId] ?? null;
  const endingId = id ?? pickEndingId(state);
  const def = ENDINGS[endingId];
  n.endingId = endingId;
  n.act = "ending";
  setFlag(state, "ending_ready", true);
  addJournal(state, {
    act: "ending",
    title: def.title,
    body: def.epilogue,
    tags: ["ending", endingId],
    id: `ending-${endingId}`,
  });
  rememberTyrone(state, {
    type: "mission",
    description: def.tyroneLine,
    importance: 9,
    weight: 4,
    tags: ["ending", endingId],
    permanent: true,
    operativeIds: [],
    outcome: endingId,
  });
  state.tyrone.utterance = def.tyroneLine;
  completeBeat(state, "convergence_choice");
  syncStorySpine(state);
  state.toast = `Epilogue · ${def.title}`;
  return def;
}

/** Soft check at dawn — never blindsides early game. */
export function considerEndingAtDawn(state: GameState): EndingDef | null {
  if (!endingEligible(state)) return null;
  // Only auto-close once the player has finished the invoice or halo branch.
  if (
    !hasFlag(state, "invoice_copied") &&
    !hasFlag(state, "invoice_burned") &&
    !hasFlag(state, "invoice_sold") &&
    !hasFlag(state, "halo_reported") &&
    !hasFlag(state, "halo_ambushed")
  ) {
    return null;
  }
  return applyEnding(state);
}
