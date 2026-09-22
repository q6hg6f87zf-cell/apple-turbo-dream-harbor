/**
 * Apply structured consequences from choices, scenarios, and story beats.
 * Keeps flag / faction / Tyrone / heat mutations in one place.
 */
import { meetCast } from "./cast";
import {
  addJournal,
  bumpFaction,
  ensureNarrative,
  setFlag,
  type NarrativeFlagId,
  type StoryActId,
} from "./narrative-state";
import { completeBeat, syncStorySpine } from "./story-spine";
import { rememberTyrone } from "./tyrone-mind";
import type { GameState } from "./types";

export interface ConsequenceSpec {
  flags?: NarrativeFlagId[];
  clearFlags?: NarrativeFlagId[];
  faction?: Partial<Record<"kane" | "aegis" | "ironclad" | "pack" | "union" | "vault13", number>>;
  heat?: number;
  meet?: string[];
  journal?: { title: string; body: string; act?: StoryActId; tags?: string[]; id?: string };
  tyrone?: { text: string; weight?: number; permanent?: boolean; tags?: string[] };
  completeBeat?: string;
  toast?: string;
  discovery?: string;
}

export function applyConsequence(state: GameState, spec: ConsequenceSpec): void {
  ensureNarrative(state);
  for (const f of spec.flags ?? []) setFlag(state, f, true);
  for (const f of spec.clearFlags ?? []) setFlag(state, f, false);
  if (spec.faction) {
    for (const [k, v] of Object.entries(spec.faction)) {
      if (typeof v === "number") bumpFaction(state, k as keyof NonNullable<typeof spec.faction>, v);
    }
  }
  if (spec.heat) {
    state.kaneHeat = Math.max(0, Math.min(40, (state.kaneHeat ?? 0) + spec.heat));
  }
  for (const id of spec.meet ?? []) meetCast(state, id as never);
  if (spec.journal) {
    addJournal(state, {
      act: spec.journal.act ?? state.narrative?.act ?? "act_i",
      title: spec.journal.title,
      body: spec.journal.body,
      tags: spec.journal.tags ?? [],
      id: spec.journal.id,
    });
  }
  if (spec.tyrone) {
    rememberTyrone(state, {
      type: "mission",
      description: spec.tyrone.text,
      importance: 5,
      weight: spec.tyrone.weight ?? 1,
      tags: spec.tyrone.tags ?? ["consequence"],
      permanent: !!spec.tyrone.permanent,
      operativeIds: [],
    });
    state.tyrone.utterance = spec.tyrone.text;
  }
  if (spec.discovery) {
    const n = ensureNarrative(state);
    if (!n.discoveries.includes(spec.discovery)) {
      n.discoveries = [...n.discoveries, spec.discovery].slice(-64);
    }
  }
  if (spec.completeBeat) completeBeat(state, spec.completeBeat);
  if (spec.toast) state.toast = spec.toast;
  syncStorySpine(state);
}

/** Map AEGIS board choice ids onto lasting narrative consequences. */
export function applyAegisChoice(state: GameState, choiceId: string, npcId?: string): void {
  if (choiceId === "hide") {
    applyConsequence(state, {
      flags: ["lyra_hid", "lyra_ridge_handled"],
      faction: { aegis: -1, vault13: 1 },
      journal: {
        title: "Dark porch",
        body: "The lamps went out. Someone on the ridge painted an empty outline — or pretended to.",
        tags: ["aegis", "choice"],
        id: `aegis-hide-${state.day}`,
      },
      tyrone: { text: "Quiet was the right call. For now.", weight: 2, tags: ["aegis"] },
      completeBeat: "act_i_lyra",
    });
    return;
  }
  if (choiceId === "lie") {
    applyConsequence(state, {
      flags: ["lyra_lied", "lyra_ridge_handled"],
      faction: { aegis: 0, ironclad: 1 },
      journal: {
        title: "Busy foundry",
        body: "You looked like a mill. They are listening for a T-0880. The lie bought a night.",
        tags: ["aegis", "choice"],
        id: `aegis-lie-${state.day}`,
      },
      tyrone: { text: "They bought the foundry story. I did not.", weight: 1, tags: ["aegis"] },
      completeBeat: "act_i_lyra",
    });
    return;
  }
  if (choiceId === "fight") {
    applyConsequence(state, {
      flags: ["lyra_fought", "lyra_ridge_handled", "aegis_contact_survived"],
      faction: { aegis: -3, vault13: -1 },
      meet: npcId ? [npcId] : ["lyra"],
      journal: {
        title: "Armed ridge",
        body: "Steel met visor. The wing will remember the volume.",
        tags: ["aegis", "combat", "choice"],
        id: `aegis-fight-${state.day}`,
      },
      tyrone: { text: "Loud. Drake hears loud.", weight: -2, tags: ["aegis"] },
      completeBeat: "act_i_lyra",
    });
  }
}
