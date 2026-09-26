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
    summary: "Tyrone stopped. Three miles east of the old highway. No tracks. No mission reason.",
    objective: "Hear why he stopped. Cut your file in the Machine Shop.",
    require: [{ type: "flag", id: "wake_complete" }],
    completeWhen: [{ type: "character_forged" }],
    journalOnComplete: {
      title: "A file with a face",
      body: "The Machine Shop stamped a soul. Kane already wants the chassis that stopped. Tyrone will not explain the war to a person who is still thirsty.",
      tags: ["prologue", "tyrone"],
    },
    tyroneNote: "File is cut. I stopped for you. I do not have a clean reason yet.",
  },
  {
    id: "prologue_first_sortie",
    act: "prologue",
    title: "No Tracks",
    summary: "Walk the East Highway. The dirt is still clean. The chit was not there when he stopped.",
    objective: "Walk the East Highway. Find what Tyrone did not.",
    require: [
      { type: "character_forged" },
      { type: "any", of: [{ type: "flag", id: "file_cut" }, { type: "character_forged" }] },
    ],
    completeWhen: [
      {
        type: "any",
        of: [
          { type: "flag", id: "highway_walked" },
          { type: "flag", id: "first_sortie_done" },
          { type: "flag", id: "rail_cut_scouted" },
          { type: "region_intel_gte", loc: "ironclad", n: 2 },
        ],
      },
    ],
    journalOnComplete: {
      title: "The chit was new",
      body: "No tracks in. A fresh Vesper weigh-chit on the mile marker. Tyrone says it was not there when he stopped. He remembers, and he does not want to talk yet. The paper names the Rail Cut.",
      tags: ["ironclad", "kane", "tyrone"],
    },
    unlocksAct: "act_i",
    tyroneNote: "I stopped because you were breathing. The chit is new. That is all I am saying.",
  },
  {
    id: "act_i_lyra",
    act: "act_i",
    title: "White Light on the Berm",
    summary: "Lyra paints Vault 13 from the West Berm. Hide, lie, fight, or give her a reason to doubt the report.",
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
      body: "Lyra is a person in a suit, not old equipment. She left with an empty ridge, a fight, or a report she may not trust. Ridge Glass remembers what she looked at.",
      tags: ["aegis", "lyra"],
    },
  },
  {
    id: "act_i_gate",
    act: "act_i",
    title: "The Iron Gate",
    summary: "Vesper is buying rail steel on a contract the Compact signed in a bad winter. Legal. Predatory.",
    objective: "Watch the Gate. Read what the Compact signed.",
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
      body: "Invoice books. Rail steel leaving under a winter contract. Vera is not here yet. Her doctrine already is: if the paper is clean, the taking is not a raid.",
      tags: ["ironclad", "vesper"],
    },
  },
  {
    id: "act_i_travis",
    act: "act_i",
    title: "Bay 13",
    summary: "Travis looks at you, looks at Tyrone, and says you dent him, you pay for him.",
    objective: "Find Travis in the Mechanical Shop. Bay 13.",
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
      body: "Twelve bays and one awkward corner. This is where the recall chime ended and Tyrone did not. The guitar stays on the wall. The speech does not.",
      tags: ["travis", "tyrone"],
    },
    tyroneNote: "He said you dent me, you pay for me. That is Travis being kind.",
  },
  {
    id: "act_i_vesper_named",
    act: "act_i",
    title: "The Black-Tag Ledger",
    summary: "Not just steel. Atlas cores, old T-0880 bays, machine-war salvage. Reeve's mark.",
    objective: "Confirm the black-tag ledger. Watch Tyrone go quiet.",
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
      title: "Reeve's pattern",
      body: "Project Vesper was mapping Atlas industrial cores and the courier bays it shut down. Tyrone knows the authorization mark. He will not lecture. Gravenor is already taking their cargo. The Compact calls that banditry. The radio calls it weather.",
      tags: ["vesper", "kane"],
    },
    unlocksAct: "act_ii",
    tyroneNote: "I remember that stamp. I am not ready to say from where.",
  },
  {
    id: "act_ii_regions",
    act: "act_ii",
    title: "What the Furnace Owes",
    summary: "Slag Town sells Helios heat. The Union says the contract is written on people who cannot refuse.",
    objective: "Open the furnace road. Learn who owns the heat.",
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
      title: "Value model incomplete",
      body: "A damaged manifest says SHEPHERD, then VALUE MODEL INCOMPLETE. Vera arrives polite, armed, and over-documented. Valdris calls Tyrone the courier who kept receipts nobody asked for. The Helios regulator is too good for an old delivery machine. Travis starts designing the mount anyway.",
      tags: ["world", "slagtown"],
    },
    tyroneNote: "Those two words feel familiar. I cannot tell you why. That is different from not wanting to.",
  },
  {
    id: "act_ii_caravan",
    act: "act_ii",
    title: "The Hound's Road",
    summary: "A weigh-in that never arrived. Gravenor's old route whistle. Tyrone goes quiet on purpose.",
    objective: "Investigate the missing caravan. Decide if Tyrone has to talk about the old route.",
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
      body: "The Ashen Pack hits Vesper cargo. Tyrone recognizes the route marks. He walked beside the Hound once. Whether he says so is your call, not a lore button.",
      tags: ["scenario", "ironclad"],
    },
  },
  {
    id: "act_ii_orion",
    act: "act_ii",
    title: "Orion Wants a Word",
    summary: "Not paperwork. He wants the serial, and a look at whether the courier is an asset or a risk.",
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
      body: "Orion does not pretend this is administration. Halo Lance opens a room. His hands close it. He is here for the serial. The mountain maps are next, if Kane's heat stays this high.",
      tags: ["aegis", "orion", "tyrone"],
    },
    unlocksAct: "act_iii",
  },
  {
    id: "act_iii_halo",
    act: "act_iii",
    title: "Halo Yard",
    summary: "AEGIS staging, not a robot nest. A servo ring off one of these frames is how Bay 13 starts T-0888.",
    objective: "Scout Halo Yard. Learn what the suits left that Travis can use.",
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
      body: "2753 boot prints. Human pilots, not a second Tyrone. A servo ring will torque the old wheel without replacing it. Blackspire still has to give up the lattice, and Thessaly does not trust couriers.",
      tags: ["halo", "aegis"],
    },
  },
  {
    id: "act_iii_secret",
    act: "act_iii",
    title: "The Map That Lied",
    summary: "Shutdown gaps. A falsified survey. Soren's note: relational memory, the constraint CIVITAS lacked.",
    objective: "Earn the trust. Let the shutdown come back as a place, not a speech.",
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
      title: "Persistent relational memory",
      body: "He carried the revised Blackspire report because he was given it. He does not defend that. Most of the T-0880 line obeyed the recall. Travis kept Bay 13, the Deadman Key, and a guitar recording Tyrone once refused to delete. The plate that comes next will say T-0888. Still the same wheel.",
      tags: ["tyrone", "mystery"],
    },
    unlocksAct: "convergence",
    tyroneNote: "I remember the chime. RETURN FOR SERVICE. I went because I trusted the word service. I do not want to talk about the units that stayed.",
  },
  {
    id: "convergence_choice",
    act: "convergence",
    title: "Whose Future",
    summary: "Not a Kane duel. The jump stack, SHEPHERD, and who is allowed to own a mind.",
    objective: "Carry the ledger into Veyra. Decide whose future the stack serves.",
    require: [{ type: "act", id: "convergence" }],
    completeWhen: [{ type: "flag", id: "ending_ready" }],
    journalOnComplete: {
      title: "A version of the future",
      body: "Brasswater still hates the city that sealed the flood. Veyra still runs on an emergency that never ended. Kane does not need a secret map inside Tyrone. She needs the pattern of how he became himself. The ending is who lived, what you promised, and what you refused to copy.",
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
    // Files already past the opening should not be walked back to the highway.
    if (state.day >= 3 && !n.flags.highway_walked) {
      setFlag(state, "highway_walked", true);
      setFlag(state, "rail_cut_scouted", true);
    }
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
      return "Act I — Ironclad: The Invoice";
    case "act_ii":
      return "Act II — Slag Town: What the Furnace Owes";
    case "act_iii":
      return "Act III — Blackspire: The Map That Lied";
    case "convergence":
      return "Convergence — Whose Future";
    case "ending":
      return "Aftermath";
  }
}

export function actBlurb(act: StoryActId): string {
  switch (act) {
    case "prologue":
      return "He found you east of the old highway. The question is why a courier with no mission stopped.";
    case "act_i":
      return "West Berm. A winter steel contract. Bay 13. A black-tag ledger with Reeve's mark. Gravenor already knows the road.";
    case "act_ii":
      return "Helios heat, a union that will not sign, and a manifest that says SHEPHERD. VALUE MODEL INCOMPLETE.";
    case "act_iii":
      return "Thessaly's real survey. Orion, if the heat is high. Soren already wrote down the memory Kane is afraid of. T-0888 is the same wheel.";
    case "convergence":
      return "Veyra kept the lights on by sealing the delta. The jump stack and SHEPHERD are the argument, not a boss with a secret map.";
    case "ending":
      return "Who lived, what was promised, and what nobody was allowed to copy.";
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
      body: "Facedown. No tracks leading in. No supplies. Tyrone stopped anyway. The file is not yet cut, and he will not explain the war until you can stand.",
      tags: ["wake"],
      id: "wake-open",
    });
  }
  syncStorySpine(state);
}
