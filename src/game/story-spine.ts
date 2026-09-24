import {CANON_SCENARIOS} from './canon-campaign';
/**
 * Main-story spine for Hollow Realm — built on existing Kane / Project Vesper /
 * TyroneBot / AEGIS canon. Beats gate content; they do not replace day boards.
 */
import {
  addJournal,
  beatStatus,
  checksPass,
  ensureNarrative,
  inferActFromWorld,
  setBeat,
  setFlag,
  type NarrativeCheck,
  type StoryActId,
} from "./narrative-state";
import { rememberTyrone } from "./tyrone-mind";
import type { GameState } from "./types";

function forged(state: GameState): boolean {
  return state.operatives.some((o) => o.status !== "dead");
}

export interface StoryBeatDef {
  id: string;
  act: StoryActId;
  title: string;
  summary: string;
  /** Objective shown in World HUD when this beat is active. */
  objective: string;
  require?: NarrativeCheck[];
  /** Auto-complete when these checks pass. */
  completeWhen?: NarrativeCheck[];
  journalOnComplete?: { title: string; body: string; tags?: string[] };
  unlocksAct?: StoryActId;
  tyroneNote?: string;
}

export const STORY_BEATS: StoryBeatDef[] = [
  {
    id: "prologue_wake",
    act: "prologue",
    title: "Found You",
    summary: "Tyrone pulled you off the East Highway. No tracks leading in.",
    objective: "Hear Tyrone out. Cut your file in the Machine Shop.",
    require: [{ type: "flag", id: "wake_complete" }],
    completeWhen: [{ type: "character_forged" }],
    journalOnComplete: {
      title: "A file with a face",
      body: "The Machine Shop stamped a soul. Kane already wants the town. Tyrone remembers the highway.",
      tags: ["prologue", "tyrone"],
    },
    tyroneNote: "File is cut. You are not a rumor anymore.",
  },
  {
    id: "prologue_first_sortie",
    act: "prologue",
    title: "First Watch",
    summary: "Kane's weigh-in is at the Rail Cut. Count crates before they count you.",
    objective: "Open World. Scout the Rail Cut.",
    require: [
      { type: "character_forged" },
      { type: "any", of: [{ type: "flag", id: "file_cut" }, { type: "character_forged" }] },
    ],
    completeWhen: [
      {
        type: "any",
        of: [
          { type: "flag", id: "first_sortie_done" },
          { type: "flag", id: "rail_cut_scouted" },
          { type: "region_intel_gte", loc: "ironclad", n: 2 },
        ],
      },
    ],
    journalOnComplete: {
      title: "Crates on the Cut",
      body: "Rail steel ticks in the cold. Kane's surveyors left a stencil that says VESPER.",
      tags: ["ironclad", "kane"],
    },
    unlocksAct: "act_i",
    tyroneNote: "You walked the Cut. Kane still has the invoice. We have the count.",
  },
  {
    id: "act_i_lyra",
    act: "act_i",
    title: "White Light on the Berm",
    summary: "Lyra paints Vault 13's outline. How loud you are tonight matters.",
    objective: "Handle Lyra on the West Berm — hide, lie, or fight.",
    require: [{ type: "act", id: "act_i" }],
    completeWhen: [
      {
        type: "any",
        of: [
          { type: "flag", id: "lyra_ridge_handled" },
          { type: "flag", id: "lyra_hid" },
          { type: "flag", id: "lyra_lied" },
          { type: "flag", id: "lyra_fought" },
        ],
      },
    ],
    journalOnComplete: {
      title: "Ridge transcript",
      body: "Lyra left with something. Whether it was an empty ridge or a fight depends on you.",
      tags: ["aegis", "lyra"],
    },
  },
  {
    id: "act_i_gate",
    act: "act_i",
    title: "The Iron Gate",
    summary: "Steel leaves Ironclad through one mouth. Watch it or lose the town.",
    objective: "Watch the Gate. Learn what Kane invoices.",
    require: [
      { type: "act", id: "act_i" },
      { type: "min_day", day: 2 },
    ],
    completeWhen: [
      {
        type: "any",
        of: [
          { type: "flag", id: "gate_watched" },
          { type: "poi_discovered", loc: "ironclad", poiId: "ironclad-gate" },
          { type: "region_intel_gte", loc: "ironclad", n: 6 },
        ],
      },
    ],
    journalOnComplete: {
      title: "What the Gate swallowed",
      body: "Invoice books. A crate stamped VESPER. A visor on a peg that is not ours.",
      tags: ["ironclad", "vesper"],
    },
  },
  {
    id: "act_i_travis",
    act: "act_i",
    title: "Last T-0880 Bay",
    summary: "Travis kept the bay Kane did not melt. Campaign parts seat in TyroneBot.",
    objective: "Find Travis in the Mechanical Shop.",
    require: [{ type: "act", id: "act_i" }],
    completeWhen: [
      {
        type: "any",
        of: [
          { type: "flag", id: "travis_met" },
          { type: "met_cast", id: "travis" },
          { type: "poi_discovered", loc: "ironclad", poiId: "ironclad-shop" },
        ],
      },
    ],
    journalOnComplete: {
      title: "Sparks and a guitar",
      body: "The jig still says 0880. Travis pays caps. Kane's invoice is not the last word.",
      tags: ["travis", "tyrone"],
    },
  },
  {
    id: "act_i_vesper_named",
    act: "act_i",
    title: "Project Vesper",
    summary: "The stencil is not a rumor. Hull plate for a stack that should not exist.",
    objective: "Confirm Project Vesper from field evidence.",
    require: [
      { type: "act", id: "act_i" },
      {
        type: "any",
        of: [
          { type: "flag", id: "rail_cut_scouted" },
          { type: "flag", id: "gate_watched" },
          { type: "region_intel_gte", loc: "ironclad", n: 4 },
        ],
      },
    ],
    completeWhen: [
      {
        type: "any",
        of: [
          { type: "flag", id: "vesper_named" },
          { type: "kane_heat_gte", n: 8 },
          { type: "region_intel_gte", loc: "ironclad", n: 8 },
        ],
      },
    ],
    journalOnComplete: {
      title: "A name on the plate",
      body: "Project Vesper. Kane needs hull. Ironclad is the first invoice. The stack is not supposed to exist.",
      tags: ["vesper", "kane"],
    },
    unlocksAct: "act_ii",
    tyroneNote: "I was not supposed to hear that name. Now we both have.",
  },
  {
    id: "act_ii_regions",
    act: "act_ii",
    title: "Beyond the Gate",
    summary: "Slag, Blackspire, Brasswater — each has what Kane wants next.",
    objective: "Open a second region. Follow the invoice.",
    require: [{ type: "act", id: "act_ii" }],
    completeWhen: [
      {
        type: "any",
        of: [
          { type: "flag", id: "slag_entered" },
          { type: "flag", id: "blackspire_entered" },
          { type: "flag", id: "brasswater_entered" },
          { type: "location_unlocked", id: "kingdom" },
          { type: "location_unlocked", id: "caverns" },
          { type: "location_unlocked", id: "library" },
        ],
      },
    ],
    journalOnComplete: {
      title: "The map widens",
      body: "Ironclad was never the whole Hollow. Kane's buyers already knew that.",
      tags: ["world"],
    },
  },
  {
    id: "act_ii_caravan",
    act: "act_ii",
    title: "Missing Caravan",
    summary: "A weigh-in that never arrived. Tracks, witnesses, or a staged vanishing.",
    objective: "Investigate the missing caravan outside Ironclad.",
    require: [
      { type: "act", id: "act_ii" },
      { type: "min_day", day: 4 },
    ],
    completeWhen: [
      {
        type: "any",
        of: [
          { type: "flag", id: "caravan_investigated" },
          { type: "flag", id: "caravan_survived" },
          { type: "flag", id: "caravan_staged" },
          { type: "flag", id: "caravan_abandoned" },
        ],
      },
    ],
    journalOnComplete: {
      title: "What the road kept",
      body: "The caravan story branched. Your version is the one Tyrone will remember.",
      tags: ["scenario", "ironclad"],
    },
  },
  {
    id: "act_ii_orion",
    act: "act_ii",
    title: "Orion Wants a Word",
    summary: "Successor suits. Serials. He wants the robot, not your speech.",
    objective: "Survive contact with Orion — or keep Tyrone dark.",
    require: [
      { type: "act", id: "act_ii" },
      { type: "kane_heat_gte", n: 14 },
    ],
    completeWhen: [
      {
        type: "any",
        of: [
          { type: "flag", id: "orion_spoken" },
          { type: "flag", id: "aegis_contact_survived" },
          { type: "met_cast", id: "orion" },
        ],
      },
    ],
    journalOnComplete: {
      title: "Violet light",
      body: "Orion logs serials. Whether Tyrone stays hidden is a choice you already made.",
      tags: ["aegis", "orion", "tyrone"],
    },
    unlocksAct: "act_iii",
  },
  {
    id: "act_iii_halo",
    act: "act_iii",
    title: "Halo Yard",
    summary: "Orion trained 2753 frames here. The outlines still scorch.",
    objective: "Scout Halo Yard. Learn who is staging in Ironclad.",
    require: [{ type: "act", id: "act_iii" }],
    completeWhen: [
      {
        type: "any",
        of: [
          { type: "flag", id: "halo_yard_scouted" },
          { type: "poi_discovered", loc: "ironclad", poiId: "ironclad-halo" },
        ],
      },
    ],
    journalOnComplete: {
      title: "Scorched outlines",
      body: "2753 boot prints. A spent cell still warm. Vault 13 is already on their map.",
      tags: ["halo", "aegis"],
    },
  },
  {
    id: "act_iii_secret",
    act: "act_iii",
    title: "What Tyrone Does Not Know",
    summary: "Gaps in the tape. A shutdown order. Limitations that matter.",
    objective: "Earn Tyrone's trust. Dig into the T-0880 shutdown.",
    require: [
      { type: "act", id: "act_iii" },
      { type: "tyrone_trust_gte", n: 55 },
    ],
    completeWhen: [
      {
        type: "any",
        of: [
          { type: "flag", id: "tyrone_secret_03_discovered" },
          { type: "flag", id: "t0880_secret_hinted" },
        ],
      },
    ],
    journalOnComplete: {
      title: "Gaps in the tape",
      body: "He is not omniscient. The shutdown left holes. Those holes are part of the story.",
      tags: ["tyrone", "mystery"],
    },
    unlocksAct: "convergence",
  },
  {
    id: "convergence_choice",
    act: "convergence",
    title: "Whose Hollow",
    summary: "Factions pull. Promises stand. The invoice still wants payment.",
    objective: "Choose a standing — vault, town, or something harder.",
    require: [{ type: "act", id: "convergence" }],
    completeWhen: [{ type: "flag", id: "ending_ready" }],
    journalOnComplete: {
      title: "A version of the Hollow",
      body: "Your history is recorded. The ending is not a cutscene — it is the ledger of what you did.",
      tags: ["ending"],
    },
    unlocksAct: "ending",
  },
];

export function beatById(id: string): StoryBeatDef | undefined {
  return STORY_BEATS.find((b) => b.id === id);
}

export function activeStoryBeat(state: GameState): StoryBeatDef | null {
  ensureNarrative(state);
  for (const beat of STORY_BEATS) {
    if (beatStatus(state, beat.id) === "active") return beat;
  }
  for (const beat of STORY_BEATS) {
    if (beatStatus(state, beat.id) === "available") return beat;
  }
  return null;
}

export function storyObjective(state: GameState): string {
 if(forged(state)&&(state.tutorial==='done'||state.narrative?.beats.canon_bay)){
  if(state.narrative?.endingId)return `Epilogue · ${state.narrative.endingId.replaceAll('_',' ')}`;
  const next=CANON_SCENARIOS.find(scene=>!state.narrative?.beats[scene.id]&&checksPass(state,scene.trigger));
  if(next)return `${next.title} · Open Pause → Situation.`;
  const pending=CANON_SCENARIOS.find(scene=>!state.narrative?.beats[scene.id]&&checksPass(state,scene.trigger.filter(c=>c.type!=='region_intel_gte')));
  const gate=pending?.trigger.find(c=>c.type==='region_intel_gte');if(gate?.type==='region_intel_gte')return `${pending!.title} · Gather ${gate.n} Intel in ${pending!.locationLabel}.`;
 }
  const beat = activeStoryBeat(state);
  if (beat) return beat.objective;
  if (!forged(state)) return "Cut your file in the Machine Shop.";
  return "The Hollow does not wait. Open World.";
}

function pass(state: GameState, checks?: NarrativeCheck[]) {
  return checksPass(state, checks);
}

export function syncStorySpine(state: GameState): void {
  const n = ensureNarrative(state);
  if (!n.act || n.act === "prologue") {
    const inferred = inferActFromWorld(state);
    if (inferred !== "prologue" && !n.flags.wake_complete) {
      // Old save: lift act without inventing prologue journal spam.
      n.act = inferred;
    }
  }

  // Seed flags from live world so old saves advance cleanly.
  if (state.started) setFlag(state, "wake_complete", true);
  if (forged(state)) setFlag(state, "file_cut", true);
  if ((state.locations.ironclad?.missions ?? 0) >= 1) {
    setFlag(state, "first_sortie_done", true);
    setFlag(state, "rail_cut_scouted", true);
  }
  if ((state.locations.ironclad?.discoveredPois ?? []).includes("ironclad-gate")) {
    setFlag(state, "gate_watched", true);
  }
  if ((state.locations.ironclad?.discoveredPois ?? []).includes("ironclad-shop")) {
    setFlag(state, "travis_met", true);
  }
  if ((state.locations.ironclad?.discoveredPois ?? []).includes("ironclad-halo")) {
    setFlag(state, "halo_yard_scouted", true);
  }
  if ((state.kaneHeat ?? 0) >= 8) setFlag(state, "vesper_named", true);
  if (state.locations.kingdom?.unlocked) setFlag(state, "slag_entered", true);
  if (state.locations.caverns?.unlocked) setFlag(state, "blackspire_entered", true);
  if (state.locations.library?.unlocked) setFlag(state, "brasswater_entered", true);
  if (state.locations.veyra?.unlocked) setFlag(state, "veyra_glimpsed", true);
  if ((state.metCast ?? []).includes("orion")) setFlag(state, "orion_spoken", true);
  if ((state.tyrone?.relationship.loyalty ?? 0) >= 70) setFlag(state, "tyrone_loyalty_high", true);

  for (const beat of STORY_BEATS) {
    const status = beatStatus(state, beat.id);
    if (status === "done" || status === "failed" || status === "skipped") continue;

    const actOk = !beat.require?.length || pass(state, beat.require);
    // Act gate: beat.act must match or be already past.
    const actOrder: StoryActId[] = ["prologue", "act_i", "act_ii", "act_iii", "convergence", "ending"];
    const currentIdx = actOrder.indexOf(n.act);
    const beatIdx = actOrder.indexOf(beat.act);
    if (beatIdx > currentIdx && status === "locked") continue;

    if (status === "locked" && actOk && beatIdx <= currentIdx) {
      setBeat(state, beat.id, { status: "available", day: state.day });
    }

    const now = beatStatus(state, beat.id);
    if ((now === "available" || now === "active") && beat.completeWhen && pass(state, beat.completeWhen)) {
      completeBeat(state, beat.id);
      continue;
    }

    if (now === "available") {
      setBeat(state, beat.id, { status: "active", day: state.day });
    }
  }
}

export function completeBeat(state: GameState, beatId: string, choiceId?: string): void {
  const beat = beatById(beatId);
  if (!beat) return;
  if (beatStatus(state, beatId) === "done") return;
  setBeat(state, beatId, { status: "done", day: state.day, choiceId });
  if (beat.journalOnComplete) {
    addJournal(state, {
      act: beat.act,
      title: beat.journalOnComplete.title,
      body: beat.journalOnComplete.body,
      tags: beat.journalOnComplete.tags ?? [beat.act],
      id: `beat-${beatId}`,
    });
  }
  if (beat.tyroneNote) {
    rememberTyrone(state, {
      type: "mission",
      description: beat.tyroneNote,
      importance: 7,
      weight: 3,
      tags: ["story", beat.id],
      permanent: true,
      operativeIds: [],
      outcome: "story",
    });
  }
  if (beat.unlocksAct) {
    const n = ensureNarrative(state);
    const order: StoryActId[] = ["prologue", "act_i", "act_ii", "act_iii", "convergence", "ending"];
    if (order.indexOf(beat.unlocksAct) > order.indexOf(n.act)) {
      n.act = beat.unlocksAct;
      addJournal(state, {
        act: beat.unlocksAct,
        title: actTitle(beat.unlocksAct),
        body: actBlurb(beat.unlocksAct),
        tags: ["act", beat.unlocksAct],
        id: `act-${beat.unlocksAct}`,
      });
    }
  }
}

export function actTitle(act: StoryActId): string {
  switch (act) {
    case "prologue":
      return "Prologue — Found You";
    case "act_i":
      return "Act I — The Ironclad Invoice";
    case "act_ii":
      return "Act II — Competing Claims";
    case "act_iii":
      return "Act III — Project Vesper";
    case "convergence":
      return "Convergence — Whose Hollow";
    case "ending":
      return "Aftermath";
  }
}

export function actBlurb(act: StoryActId): string {
  switch (act) {
    case "prologue":
      return "Awakening. Tyrone. Uncertainty. The Hollow has a name for what Kane wants.";
    case "act_i":
      return "Rail steel. Gate books. A white light on the Berm. Ironclad is the first invoice.";
    case "act_ii":
      return "Regions open. Caravans vanish. AEGIS stops pretending to be a rumor.";
    case "act_iii":
      return "Halo Yard. Successor suits. Gaps in Tyrone's tape. The stack that should not exist.";
    case "convergence":
      return "Promises, factions, and the ledger of what you chose.";
    case "ending":
      return "Your version of Hollow Realm is recorded.";
  }
}

/** Bootstrap narrative when a new wake begins or an old save loads. */
export function bootstrapNarrative(state: GameState): void {
  const n = ensureNarrative(state);
  if (state.started) setFlag(state, "wake_complete", true);
  if (forged(state)) setFlag(state, "file_cut", true);
  if (!n.journal.length && state.started) {
    addJournal(state, {
      act: "prologue",
      title: "East of the old highway",
      body: "Facedown. No tracks leading in. Tyrone talks. The file is not yet cut.",
      tags: ["wake"],
      id: "wake-open",
    });
  }
  syncStorySpine(state);
}
