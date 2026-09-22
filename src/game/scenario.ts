/**
 * Scenario architecture — authored situations with multiple approaches and
 * fail-forward outcomes. Options derive from narrative + world state.
 */
import {
  addJournal,
  bumpFaction,
  checksPass,
  ensureNarrative,
  setFlag,
  type NarrativeCheck,
  type NarrativeFlagId,
} from "./narrative-state";
import { rememberTyrone } from "./tyrone-mind";
import type { GameState, StatKey } from "./types";
export type ScenarioApproachId = string;

export type ScenarioOutcomeKind =
  | "full_success"
  | "partial_success"
  | "fail_forward"
  | "combat"
  | "retreat"
  | "unexpected";

export interface ScenarioApproach {
  id: ScenarioApproachId;
  label: string;
  blurb: string;
  /** Diegetic reason this option exists (shown to player). */
  reason?: string;
  require?: NarrativeCheck[];
  /** Optional d20-style check; uncertainty only when interesting. */
  check?: { stat: StatKey; dc: number; label: string };
  tyroneAssist?: boolean;
  outcome: ScenarioOutcomeKind;
  flagsSet?: NarrativeFlagId[];
  flagsClear?: NarrativeFlagId[];
  faction?: Partial<Record<"kane" | "aegis" | "ironclad" | "pack" | "union" | "vault13", number>>;
  heatDelta?: number;
  journal?: { title: string; body: string; tags?: string[] };
  tyroneLine?: string;
  followUpScenarioId?: string;
  toast?: string;
}

export interface ScenarioDef {
  id: string;
  title: string;
  setup: string;
  locationLabel: string;
  hidden?: string;
  trigger: NarrativeCheck[];
  /** Once resolved (any terminal flag), do not re-offer. */
  resolvedWhen: NarrativeCheck[];
  approaches: ScenarioApproach[];
  storyBeatId?: string;
}

export const SCENARIOS: ScenarioDef[] = [
  {
    id: "caravan_missing",
    title: "Missing Caravan",
    setup:
      "A weigh-in never arrived outside Ironclad. Tracks in the slag. Witnesses who will not meet your eye. Kane's buyers are already asking who took the steel.",
    locationLabel: "East of the Iron Gate",
    hidden: "The caravan may have staged its own vanishing — or AEGIS painted the route.",
    trigger: [
      { type: "min_day", day: 4 },
      { type: "not_flag", id: "caravan_investigated" },
      { type: "not_flag", id: "caravan_abandoned" },
      {
        type: "any",
        of: [
          { type: "act", id: "act_ii" },
          { type: "act", id: "act_iii" },
          { type: "kane_heat_gte", n: 6 },
        ],
      },
    ],
    resolvedWhen: [
      {
        type: "any",
        of: [
          { type: "flag", id: "caravan_survived" },
          { type: "flag", id: "caravan_staged" },
          { type: "flag", id: "caravan_abandoned" },
        ],
      },
    ],
    storyBeatId: "act_ii_caravan",
    approaches: [
      {
        id: "tracks",
        label: "Follow the tracks",
        blurb: "Slag prints. A broken axle. Something was dragged, or something wanted you to think so.",
        reason: "WIS — field craft",
        check: { stat: "WIS", dc: 11, label: "Track" },
        outcome: "partial_success",
        flagsSet: ["caravan_investigated"],
        heatDelta: 1,
        journal: {
          title: "Tracks that lie",
          body: "The trail doubles back toward the Gate. Either the caravan fled home, or someone staged a loop.",
          tags: ["scenario", "investigation"],
        },
        tyroneLine: "Those prints were walked twice. Once with a load. Once without.",
        toast: "Tracks lead toward a culvert. Partial picture.",
        followUpScenarioId: "caravan_culvert",
      },
      {
        id: "witnesses",
        label: "Question witnesses",
        blurb: "Foundry hands saw lamps. They will talk for caps — or for fear.",
        reason: "CHA — persuasion",
        check: { stat: "CHA", dc: 12, label: "Press" },
        outcome: "partial_success",
        flagsSet: ["caravan_investigated"],
        faction: { ironclad: 1, kane: -1 },
        journal: {
          title: "What the hands saw",
          body: "White light on the ridge the night before. Lyra's color. The hands will not say her name.",
          tags: ["scenario", "aegis"],
        },
        tyroneLine: "They are afraid of a visor, not of you.",
        toast: "Witnesses point at the Berm. Heat ticks.",
      },
      {
        id: "tyrone_signal",
        label: "Ask Tyrone to analyze the signal",
        blurb: "A burst on ICR 88 the night the caravan went dark.",
        reason: "[Tyrone: Signal Analysis]",
        require: [{ type: "tyrone_trust_gte", n: 40 }],
        tyroneAssist: true,
        outcome: "full_success",
        flagsSet: ["caravan_investigated", "caravan_staged"],
        faction: { aegis: -2, vault13: 2 },
        journal: {
          title: "Staged vanishing",
          body: "The transmission did not originate on the road. Someone wanted Kane to think the steel was stolen.",
          tags: ["scenario", "tyrone", "unexpected"],
        },
        tyroneLine: "That burst did not come from the caravan. Someone wanted a missing invoice.",
        toast: "Tyrone cracked the burst. The disappearance was staged.",
      },
      {
        id: "bribe",
        label: "Bribe a gate clerk",
        blurb: "Caps open books Kane's people already stamped.",
        reason: "Caps in hand",
        require: [{ type: "faction", key: "ironclad", gte: 4 }],
        outcome: "partial_success",
        flagsSet: ["caravan_investigated"],
        faction: { ironclad: -1, kane: 1 },
        heatDelta: 2,
        journal: {
          title: "Bought page",
          body: "The clerk sold a weigh-chit. Kane already has a copy. You bought the rumor, not the truth.",
          tags: ["scenario", "fail_forward"],
        },
        toast: "You have a chit. Kane has the real book. Heat climbs.",
      },
      {
        id: "raid",
        label: "Hit the raider camp",
        blurb: "If it was theft, the camp on the slag berm has the crates.",
        reason: "STR — direct force",
        check: { stat: "STR", dc: 13, label: "Breach" },
        outcome: "combat",
        flagsSet: ["caravan_investigated", "caravan_survived"],
        faction: { pack: -2, ironclad: 2 },
        heatDelta: 3,
        journal: {
          title: "Steel recovered",
          body: "Half the crates were real. Half were rocks painted as plate. The caravan still lies about something.",
          tags: ["scenario", "combat"],
        },
        toast: "Camp cleared. Some steel home. Some questions louder.",
      },
      {
        id: "negotiate",
        label: "Negotiate with the raiders",
        blurb: "Talked steel is cheaper than bled steel.",
        reason: "CHA + Ironclad standing",
        require: [{ type: "faction", key: "ironclad", gte: 6 }],
        check: { stat: "CHA", dc: 14, label: "Deal" },
        outcome: "full_success",
        flagsSet: ["caravan_investigated", "caravan_survived"],
        faction: { pack: 1, ironclad: 1 },
        journal: {
          title: "Bought back",
          body: "The Pack sold what they took. They also sold a name — Vera asked for manifests the night before.",
          tags: ["scenario", "negotiation"],
        },
        toast: "Deal struck. Vera's name surfaces.",
      },
      {
        id: "abandon",
        label: "Leave it",
        blurb: "Not every missing cart is your war.",
        outcome: "retreat",
        flagsSet: ["caravan_abandoned"],
        faction: { ironclad: -2, kane: 2 },
        heatDelta: 1,
        journal: {
          title: "Abandoned weigh-in",
          body: "Kane's buyers filled the silence with their own story. You are in it as the ones who did not look.",
          tags: ["scenario", "consequence"],
        },
        tyroneLine: "Understood. I will not mention the carts again unless you ask.",
        toast: "The road keeps its secret. Kane writes yours.",
      },
    ],
  },
  {
    id: "caravan_culvert",
    title: "Culvert Cache",
    setup: "The doubled tracks end at a culvert stuffed with empty plate crates and a white cell.",
    locationLabel: "Highway culvert",
    trigger: [
      { type: "flag", id: "caravan_investigated" },
      { type: "not_flag", id: "caravan_survived" },
      { type: "not_flag", id: "caravan_staged" },
      { type: "not_flag", id: "caravan_abandoned" },
    ],
    resolvedWhen: [
      {
        type: "any",
        of: [
          { type: "flag", id: "caravan_survived" },
          { type: "flag", id: "caravan_staged" },
        ],
      },
    ],
    approaches: [
      {
        id: "open_cache",
        label: "Crack the crates",
        blurb: "Empty plate. A stencil. A frequency slip Lyra should not have printed.",
        outcome: "unexpected",
        flagsSet: ["caravan_staged", "lyra_ridge_handled"],
        faction: { aegis: -1 },
        heatDelta: 2,
        journal: {
          title: "Empty plate, real signal",
          body: "The vanishing was theater. The frequency slip is not. Lyra was listening for a T-0880, not for steel.",
          tags: ["scenario", "lyra"],
        },
        tyroneLine: "She was not hunting crates. She was hunting me.",
        toast: "Staged theft. Real surveillance.",
      },
      {
        id: "leave_cache",
        label: "Leave the culvert alone",
        blurb: "Walk away. Report empty tracks.",
        outcome: "fail_forward",
        flagsSet: ["caravan_survived"],
        faction: { kane: 1 },
        journal: {
          title: "Wrong lead kept",
          body: "You told SYNAPSE the road was clean. Kane believes the steel is still missing. So does half the Gate.",
          tags: ["scenario", "fail_forward"],
        },
        toast: "Wrong story sticks. World reacts to the lie.",
      },
    ],
  },
  {
    id: "travis_bay",
    title: "Empty Jig",
    setup:
      "Travis keeps the last T-0880 bay Kane did not melt. The jig is empty. He will seat campaign parts — or lock the bay if you waste his time.",
    locationLabel: "Ironclad Mechanical Shop",
    hidden: "Travis still tunes the guitar. He is not asking for charity. He is asking whether Tyrone stays a customer.",
    trigger: [
      { type: "min_day", day: 2 },
      { type: "flag", id: "file_cut" },
      { type: "not_flag", id: "travis_jig_filled" },
      { type: "not_flag", id: "travis_refused" },
      {
        type: "any",
        of: [
          { type: "poi_discovered", loc: "ironclad", poiId: "ironclad-shop" },
          { type: "met_cast", id: "travis" },
          { type: "flag", id: "travis_met" },
          { type: "min_day", day: 3 },
        ],
      },
    ],
    resolvedWhen: [
      {
        type: "any",
        of: [
          { type: "flag", id: "travis_jig_filled" },
          { type: "flag", id: "travis_refused" },
        ],
      },
    ],
    storyBeatId: "act_i_travis",
    approaches: [
      {
        id: "seat_parts",
        label: "Bring him campaign parts",
        blurb: "Whatever the Field dropped. He pays caps and seats TyroneBot.",
        reason: "Inventory — Travis parts",
        outcome: "full_success",
        flagsSet: ["travis_jig_filled", "travis_met", "travis_bay_used"],
        faction: { ironclad: 2, vault13: 1, kane: -1 },
        journal: {
          title: "Bay lit",
          body: "Sparks. Solder. A named chassis is still a customer. Kane's invoice is not the last word.",
          tags: ["travis", "tyrone"],
        },
        tyroneLine: "He keeps me upright. I keep the serial quiet.",
        toast: "Travis seats the bay. Tyrone lists less to port.",
      },
      {
        id: "promise_later",
        label: "Promise a return with steel",
        blurb: "He will wait once. Not twice.",
        reason: "CHA — a kept word",
        check: { stat: "CHA", dc: 11, label: "Promise" },
        outcome: "partial_success",
        flagsSet: ["travis_met"],
        faction: { ironclad: 1 },
        journal: {
          title: "One watch of credit",
          body: "Travis nodded at the guitar. The jig stays empty until you fill it. He will remember if you do not.",
          tags: ["travis", "promise"],
        },
        tyroneLine: "He believes you. I am keeping the receipt.",
        toast: "Promise logged. The bay waits.",
      },
      {
        id: "walk_out",
        label: "Walk out empty-handed",
        blurb: "No parts. No speech. The sign still says Ironclad Mechanical Shop.",
        outcome: "fail_forward",
        flagsSet: ["travis_refused", "travis_met"],
        faction: { ironclad: -2 },
        journal: {
          title: "Bay stays dark",
          body: "Travis crosses his arms. Kane's buyers never needed his permission. You just declined the last bay that would take Tyrone.",
          tags: ["travis", "consequence"],
        },
        tyroneLine: "I list harder without him. That is on us.",
        toast: "Travis closes the conversation. Heat elsewhere.",
      },
    ],
  },
  {
    id: "halo_yard",
    title: "Halo Yard Staging",
    setup:
      "Scorched outlines of 2753 frames. A spent cell still warm. Someone is drilling where Orion trained the wing that replaced Tyrone.",
    locationLabel: "Halo Yard",
    trigger: [
      { type: "min_day", day: 5 },
      { type: "kane_heat_gte", n: 8 },
      { type: "not_flag", id: "halo_reported" },
      { type: "not_flag", id: "halo_ambushed" },
      {
        type: "any",
        of: [
          { type: "flag", id: "vesper_named" },
          { type: "act", id: "act_ii" },
          { type: "act", id: "act_iii" },
        ],
      },
    ],
    resolvedWhen: [
      {
        type: "any",
        of: [
          { type: "flag", id: "halo_reported" },
          { type: "flag", id: "halo_ambushed" },
        ],
      },
    ],
    storyBeatId: "act_iii_halo",
    approaches: [
      {
        id: "count_prints",
        label: "Count the prints and leave",
        blurb: "Scout only. Bring the outline home.",
        reason: "WIS — sweep",
        check: { stat: "WIS", dc: 12, label: "Sweep" },
        outcome: "full_success",
        flagsSet: ["halo_reported", "halo_yard_scouted"],
        faction: { vault13: 2, aegis: -1 },
        heatDelta: 1,
        journal: {
          title: "Warm cell",
          body: "Boot prints the size of a 2753. Vault 13 is already on their map. You have the count before they have yours.",
          tags: ["halo", "aegis"],
        },
        tyroneLine: "Those frames used to be my job. Count them. Do not salute.",
        toast: "Halo Yard reported. SYNAPSE has the outline.",
      },
      {
        id: "tyrone_scan",
        label: "Let Tyrone sniff the cell",
        blurb: "Residual charge. Serial ghosts. He may recognize a line.",
        reason: "[Tyrone: Residual Analysis]",
        require: [{ type: "tyrone_trust_gte", n: 48 }],
        tyroneAssist: true,
        outcome: "unexpected",
        flagsSet: ["halo_reported", "halo_yard_scouted", "t0880_secret_hinted"],
        faction: { vault13: 1, aegis: -2 },
        heatDelta: 2,
        journal: {
          title: "A serial that almost fits",
          body: "The cell remembers a line Kane shut down. Tyrone will not say the full number. The gap is the story.",
          tags: ["halo", "tyrone", "mystery"],
        },
        tyroneLine: "I know that charge. I do not know why I am not supposed to.",
        toast: "Tyrone found a gap. Halo is worse than a drill square.",
      },
      {
        id: "kick_the_nest",
        label: "Walk the square armed",
        blurb: "If the wing is here, they will answer.",
        reason: "STR — loud",
        check: { stat: "STR", dc: 13, label: "Contact" },
        outcome: "combat",
        flagsSet: ["halo_ambushed", "halo_yard_scouted", "aegis_contact_survived"],
        faction: { aegis: -3 },
        heatDelta: 4,
        journal: {
          title: "Violet answer",
          body: "The square was not empty. Heat climbs. Orion will have the transcript.",
          tags: ["halo", "combat"],
        },
        toast: "Halo went hot. The wing knows you now.",
      },
      {
        id: "ignore_yard",
        label: "Ignore the scorch",
        blurb: "Not every old drill square is your problem.",
        outcome: "retreat",
        flagsSet: ["halo_ambushed"],
        faction: { aegis: 1, vault13: -1 },
        heatDelta: 1,
        journal: {
          title: "Unwatched square",
          body: "Orion drills without an audience. Kane treats silence as permission.",
          tags: ["halo", "consequence"],
        },
        toast: "Halo stays theirs. The map gets sharper without you.",
      },
    ],
  },
  {
    id: "vesper_invoice",
    title: "Project Vesper Invoice",
    setup:
      "A weigh-chit and a page of hull serials sit on a gatehouse table Kane's people left warm. The stencil says VESPER. What you do with the page becomes the story Kane tells about Vault 13.",
    locationLabel: "Iron Gate gatehouse",
    trigger: [
      { type: "flag", id: "vesper_named" },
      { type: "min_day", day: 6 },
      { type: "not_flag", id: "invoice_copied" },
      { type: "not_flag", id: "invoice_burned" },
      { type: "not_flag", id: "invoice_sold" },
      {
        type: "any",
        of: [
          { type: "flag", id: "gate_watched" },
          { type: "region_intel_gte", loc: "ironclad", n: 6 },
        ],
      },
    ],
    resolvedWhen: [
      {
        type: "any",
        of: [
          { type: "flag", id: "invoice_copied" },
          { type: "flag", id: "invoice_burned" },
          { type: "flag", id: "invoice_sold" },
        ],
      },
    ],
    approaches: [
      {
        id: "copy_page",
        label: "Copy the serials for SYNAPSE",
        blurb: "Leave the original. Steal the truth.",
        reason: "INT — quiet theft",
        check: { stat: "INT", dc: 12, label: "Copy" },
        outcome: "full_success",
        flagsSet: ["invoice_copied", "kane_invoice_stolen", "project_vesper_partial"],
        faction: { vault13: 3, kane: -2 },
        heatDelta: 2,
        journal: {
          title: "Two copies of one lie",
          body: "Hull plate for a stack that should not exist. SYNAPSE has the numbers. Kane still has the paper — and a reason to look harder.",
          tags: ["vesper", "choice"],
        },
        tyroneLine: "I can hold numbers. I cannot hold her off forever.",
        toast: "Invoice copied. Project Vesper has a paper trail now.",
      },
      {
        id: "burn_page",
        label: "Burn the page",
        blurb: "Deny her the weigh-in. Deny yourself the proof.",
        outcome: "partial_success",
        flagsSet: ["invoice_burned"],
        faction: { kane: -1, ironclad: 1 },
        heatDelta: 3,
        journal: {
          title: "Ash on the table",
          body: "The gatehouse smells like burned ink. Kane will invent a new page. You bought a night, not a war.",
          tags: ["vesper", "fail_forward"],
        },
        tyroneLine: "Fire is honest. It is also loud.",
        toast: "Page gone. Heat climbs. Proof is ash.",
      },
      {
        id: "sell_page",
        label: "Sell it back to Kane's buyer",
        blurb: "Caps now. Allegiance implied.",
        reason: "Faction — Kane standing",
        require: [{ type: "faction", key: "kane", gte: -2 }],
        outcome: "unexpected",
        flagsSet: ["invoice_sold"],
        faction: { kane: 3, vault13: -3, ironclad: -1 },
        heatDelta: -2,
        journal: {
          title: "Bought silence",
          body: "You sold the town's outline for plate money. ICR will call it cooperation. Tyrone will not.",
          tags: ["vesper", "kane", "consequence"],
        },
        tyroneLine: "I remember who you sold. Do not ask me to forget.",
        toast: "Buyer pays. Loyalty shifts. Heat eases for now.",
      },
    ],
  },
];

export function scenarioById(id: string): ScenarioDef | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export function availableScenarios(state: GameState): ScenarioDef[] {
  ensureNarrative(state);
  return SCENARIOS.filter((s) => {
    if (!checksPass(state, s.trigger)) return false;
    if (checksPass(state, s.resolvedWhen)) return false;
    return true;
  });
}

export function availableApproaches(state: GameState, scenario: ScenarioDef): ScenarioApproach[] {
  return scenario.approaches.filter((a) => checksPass(state, a.require));
}

export interface ScenarioResolveResult {
  approachId: string;
  outcome: ScenarioOutcomeKind;
  checkPassed?: boolean;
  total?: number;
  dc?: number;
  toast: string;
  failForward: boolean;
}

function leadStat(state: GameState, stat: StatKey): number {
  const lead =
    state.operatives.find((o) => o.id === state.selectedId && o.status !== "dead") ??
    state.operatives.find((o) => o.status === "idle") ??
    state.operatives.find((o) => o.status !== "dead");
  if (!lead) return 10;
  const dice = lead.statDice?.[stat];
  if (typeof dice === "number") return dice;
  return 10;
}

function rollD20(state: GameState): number {
  // Deterministic-ish for tests: day + ticks + heat.
  const seed = state.day * 97 + state.ticks * 13 + (state.kaneHeat ?? 0) * 7 + state.level * 3;
  return 1 + (Math.abs(seed) % 20);
}

export function resolveScenarioApproach(
  state: GameState,
  scenarioId: string,
  approachId: string,
  opts?: { forceRoll?: number },
): ScenarioResolveResult | null {
  const scenario = scenarioById(scenarioId);
  if (!scenario) return null;
  const approach = availableApproaches(state, scenario).find((a) => a.id === approachId);
  if (!approach) return null;

  let checkPassed: boolean | undefined;
  let total: number | undefined;
  let dc: number | undefined;
  let outcome = approach.outcome;

  if (approach.check) {
    const roll = opts?.forceRoll ?? rollD20(state);
    const mod = Math.floor((leadStat(state, approach.check.stat) - 10) / 2);
    const assist = approach.tyroneAssist || (state.tyrone?.relationship.trust ?? 0) >= 60 ? 1 : 0;
    total = roll + mod + assist;
    dc = approach.check.dc;
    checkPassed = total >= dc;
    if (!checkPassed) {
      // Fail-forward: degrade outcome instead of hard stop.
      if (outcome === "full_success") outcome = "partial_success";
      else if (outcome === "partial_success") outcome = "fail_forward";
      else if (outcome === "combat") outcome = "fail_forward";
      else outcome = "fail_forward";
    }
  }

  const n = ensureNarrative(state);
  n.scenarioLog = [`${scenarioId}:${approachId}:${outcome}`, ...n.scenarioLog].slice(0, 32);

  for (const f of approach.flagsSet ?? []) setFlag(state, f, true);
  for (const f of approach.flagsClear ?? []) setFlag(state, f, false);

  if (approach.faction) {
    for (const [k, v] of Object.entries(approach.faction)) {
      if (typeof v === "number") bumpFaction(state, k as keyof typeof approach.faction, v);
    }
  }
  if (approach.heatDelta) {
    state.kaneHeat = Math.max(0, Math.min(40, (state.kaneHeat ?? 0) + approach.heatDelta));
  }

  // Failed checks still apply softer consequences.
  if (checkPassed === false) {
    bumpFaction(state, "kane", 1);
    state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 1);
  }

  if (approach.journal) {
    addJournal(state, {
      act: state.narrative?.act ?? "act_ii",
      title: approach.journal.title,
      body:
        checkPassed === false
          ? `${approach.journal.body} The roll went soft — the world noticed.`
          : approach.journal.body,
      tags: approach.journal.tags ?? ["scenario"],
      id: `sc-${scenarioId}-${approachId}`,
    });
  }

  if (approach.tyroneLine) {
    rememberTyrone(state, {
      type: "mission",
      description: approach.tyroneLine,
      importance: 6,
      weight: checkPassed === false ? -1 : 2,
      tags: ["scenario", scenarioId],
      permanent: outcome === "full_success" || outcome === "unexpected",
      operativeIds: [],
      outcome,
    });
    state.tyrone.utterance = approach.tyroneLine;
  }

  const toast =
    approach.toast ??
    (checkPassed === false ? "It went sideways. The story continues." : "Resolved.");

  state.toast = toast;
  return {
    approachId,
    outcome: checkPassed === false && outcome === approach.outcome ? "fail_forward" : outcome,
    checkPassed,
    total,
    dc,
    toast,
    failForward: checkPassed === false || outcome === "fail_forward",
  };
}
