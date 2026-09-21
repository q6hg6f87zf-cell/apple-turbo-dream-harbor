/**
 * Recon — reading the ground, and what reading it buys you.
 *
 * Working a site used to be a one-line toast: caps landed, a pin sometimes
 * appeared, and the sentence was gone before the player finished it. There was
 * nothing to look at, nothing to decide, and once every pin had been touched
 * once the day simply refused. The loop ended there.
 *
 * A sweep now produces a `SiteReport`: what was found, what is hunting, what it
 * costs, and a short list of things to do about it — including the one thing
 * the old code never offered, which is a way out of a spent shift. Reports are
 * kept, so the Profile tab can show the campaign as a record and not a feeling.
 *
 * The other half is `ReconLead`. A good sweep names something worth a sortie,
 * and deploying on that lead builds the mission around it: easier beats, a
 * richer haul, and a story line that belongs to that ground rather than a
 * generic one. Intel stops being a number that goes up.
 */
import { locById, regionById, villainById } from "./data";
import {
  discoverNextPoi,
  KANE_STAKES,
  knownPois,
  locationToRegion,
  poiActionOf,
  poiById,
  poisForLocation,
} from "./field-ops";
import { rumorFor } from "./market";
import type {
  GameState,
  LocationId,
  MissionKind,
  PoiAction,
  ReconFinding,
  ReconLead,
  ReconState,
  ReconStep,
  RegionId,
  RegionPointOfInterest,
  SiteReport,
  SiteTrack,
  WatchId,
} from "./types";

export const MAX_REPORTS = 40;
export const MAX_LEADS = 12;
export const LEAD_LIFE = 4;

/** Depth is how well the squad knows a site, not how rich it is. */
export const DEPTH_LABELS = ["Unread", "Marked", "Mapped", "Read", "Owned"] as const;

export const DEPTH_BLURB: Record<number, string> = {
  0: "Nobody here has walked it. Everything it says is a first impression.",
  1: "Marked on the board. You know the approach and roughly who holds it.",
  2: "Mapped. Entrances, watch rotations, where the ground drops away.",
  3: "Read. You know what it keeps, who comes for it, and when they stop looking.",
  4: "Owned. It does not surprise you any more. It might still kill you.",
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function emptyRecon(): ReconState {
  return { reports: [], leads: [], sites: {}, openReportId: null, threads: {} };
}

export function ensureRecon(state: GameState): ReconState {
  if (!state.recon) state.recon = emptyRecon();
  const r = state.recon;
  if (!Array.isArray(r.reports)) r.reports = [];
  if (!Array.isArray(r.leads)) r.leads = [];
  if (!r.sites) r.sites = {};
  if (!r.threads) r.threads = {};
  if (r.openReportId === undefined) r.openReportId = null;
  return r;
}

export function siteTrack(state: GameState, poiId: string): SiteTrack {
  const recon = ensureRecon(state);
  const found = recon.sites[poiId];
  if (found) return found;
  const fresh: SiteTrack = { poiId, sweeps: 0, lastDay: 0, depth: 0, totalCaps: 0, cleared: false };
  recon.sites[poiId] = fresh;
  return fresh;
}

/** Sweeps of this site already spent today. */
export function sweepsToday(state: GameState, poiId: string): number {
  const track = siteTrack(state, poiId);
  return track.lastDay === state.day ? track.sweeps : 0;
}

/* ------------------------------------------------------------------ *
 * Region story threads
 * ------------------------------------------------------------------ */

export interface RegionThread {
  id: string;
  regionId: RegionId;
  title: string;
  /** Five stages. Intel and sorties push the region along it. */
  stages: string[];
  /** Intel needed for each stage after the first. */
  gates: number[];
}

export const REGION_THREADS: RegionThread[] = [
  {
    id: "thread-ironclad",
    regionId: "ironclad",
    title: "The Gate Ledger",
    stages: [
      "Kane's surveyors bought a table at the gatehouse. Nobody at the Iron Gate will say what they are writing down.",
      "The table is a ledger. Rail tonnage, night crews, which watch sleeps. Someone inside the Gate is feeding it.",
      "The hand is a gate clerk who owes Slag Town money. The Ashen Pack knows, and has been letting it run.",
      "Gravenor lets the ledger run because it tells him when the rail cut is unguarded. He is not Kane's. He is using Kane's.",
      "The ledger is a map of every hour Ironclad is blind. Whoever holds it holds the frontier. Right now that is a dog in the hills.",
    ],
    gates: [4, 10, 18, 28],
  },
  {
    id: "thread-slagtown",
    regionId: "slagtown",
    title: "The Tithe That Never Ended",
    stages: [
      "The furnaces pay a fuel tithe to an office nobody voted for. The union stopped asking who collects it.",
      "The tithe leaves Slag Town on Kane's trucks. The receipts say 'civic heat'. The trucks say Veyra.",
      "Slag is being cooked down into stack fuel. A jump stack burns a district a week.",
      "The Tithe Office is not collecting for the union. It is a Kane forward depot wearing a union brick.",
      "Shut the office and Veyra loses a week of burn. Shut it wrong and the furnaces go out for good.",
    ],
    gates: [4, 10, 18, 28],
  },
  {
    id: "thread-blackspire",
    regionId: "blackspire",
    title: "What Lift Nine Found",
    stages: [
      "Lift Nine runs deeper than the cage chart admits. The brokers will not price a ride down.",
      "Hollow ore below nine does not behave. It holds a charge, and it holds a grudge.",
      "Kane's survey team went down nine and came back up with a different accent. Thessaly signed the manifest.",
      "The ore is the whole reason the Realm is on a star map. Everything else is freight.",
      "Something below nine has been answering the survey pings. It is using Kane's own call sign.",
    ],
    gates: [4, 10, 18, 28],
  },
  {
    id: "thread-brasswater",
    regionId: "brasswater",
    title: "The Drowned Math",
    stages: [
      "The Archive keeps sinking and the divers keep going back. They are not after books.",
      "Pre-collapse jump tables. Paper, waxed, still legible. Kane pays per page.",
      "Half the tables are wrong. Deliberately. Someone salted the Archive before the flood.",
      "The salt is in Vault 13's hand. A T-0880 wrote it. Tyrone will not say which one.",
      "Kane has been jumping on poisoned math for two years. That is why the program keeps losing frames.",
    ],
    gates: [4, 10, 18, 28],
  },
  {
    id: "thread-veyra",
    regionId: "veyra",
    title: "Successors",
    stages: [
      "The 2753 frames walk like people because people are inside them. That is the whole upgrade.",
      "Kane built them after the T-0880 shutdown order. Machines that argued were replaced with people who cannot.",
      "The pilots are on a rotation nobody returns from. The suits are fine. The suits are always fine.",
      "Vesper Kane is not building an army. She is building a crew, and the Realm is the fuel stop.",
      "The shutdown order had one refusal on file. It is sitting in Vault 13 telling you to keep your visor down.",
    ],
    gates: [4, 10, 18, 28],
  },
];

export function threadFor(regionId: RegionId): RegionThread | undefined {
  return REGION_THREADS.find((t) => t.regionId === regionId);
}

export function threadStage(state: GameState, regionId: RegionId): number {
  const thread = threadFor(regionId);
  if (!thread) return 0;
  return clamp(ensureRecon(state).threads[thread.id] ?? 0, 0, thread.stages.length - 1);
}

/**
 * Push the region story if this region's intel has crossed the next gate.
 * Returns the newly readable line, or null when nothing moved.
 */
export function advanceThread(state: GameState, loc: LocationId): string | null {
  const regionId = locationToRegion(loc);
  if (!regionId) return null;
  const thread = threadFor(regionId);
  if (!thread) return null;
  const recon = ensureRecon(state);
  const at = clamp(recon.threads[thread.id] ?? 0, 0, thread.stages.length - 1);
  if (at >= thread.stages.length - 1) return null;
  const intel = state.locations[loc]?.intel ?? 0;
  const need = thread.gates[at] ?? Infinity;
  if (intel < need) return null;
  recon.threads[thread.id] = at + 1;
  return `${thread.title} · ${thread.stages[at + 1]}`;
}

/* ------------------------------------------------------------------ *
 * Leads
 * ------------------------------------------------------------------ */

export function liveLeads(state: GameState, loc?: LocationId): ReconLead[] {
  const recon = ensureRecon(state);
  return recon.leads.filter(
    (l) => !l.spent && l.expiresDay >= state.day && (!loc || l.locationId === loc),
  );
}

export function leadById(state: GameState, id: string | null | undefined): ReconLead | undefined {
  if (!id) return undefined;
  return ensureRecon(state).leads.find((l) => l.id === id);
}

export function spendLead(state: GameState, id: string | null | undefined) {
  const lead = leadById(state, id);
  if (lead) lead.spent = true;
}

function pruneLeads(state: GameState) {
  const recon = ensureRecon(state);
  recon.leads = recon.leads
    .filter((l) => !l.spent && l.expiresDay >= state.day)
    .slice(-MAX_LEADS);
}

const LEAD_SHAPES: {
  kind: ReconLead["kind"];
  missionKind: MissionKind;
  title: (poi: RegionPointOfInterest) => string;
  detail: (poi: RegionPointOfInterest, region: string) => string;
  read: string;
  dcMod: number;
  capsBonus: number;
  lootRolls: number;
  minDepth: number;
}[] = [
  {
    kind: "cache",
    missionKind: "forage",
    title: (poi) => `Buried stock under ${poi.name}`,
    detail: (poi, region) =>
      `Somebody cached hard goods below ${poi.name} and did not live to come back for them. ${region} weather has been kind to the seals.`,
    read: "Low noise, real haul. This is the kind of job that pays for the loud ones.",
    dcMod: -2,
    capsBonus: 180,
    lootRolls: 1,
    minDepth: 0,
  },
  {
    kind: "threat",
    missionKind: "bounty",
    title: (poi) => `Something is denning at ${poi.name}`,
    detail: (poi) =>
      `Tracks in and none out. Whatever holds ${poi.name} has been eating the people who work it, and the board has not caught up yet.`,
    read: "Clear it before it learns our rotation. It already knows theirs.",
    dcMod: -1,
    capsBonus: 140,
    lootRolls: 1,
    minDepth: 1,
  },
  {
    kind: "mission",
    missionKind: "raid",
    title: (poi) => `Kane's people are lifting from ${poi.name}`,
    detail: (poi, region) =>
      `A survey crew has been running night loads out of ${poi.name}. ${region} stock, Kane's manifest, nobody's permission.`,
    read: "Loud, rich, and he will remember the hinge. Take it while the crew is still small.",
    dcMod: 0,
    capsBonus: 260,
    lootRolls: 2,
    minDepth: 1,
  },
  {
    kind: "story",
    missionKind: "scout",
    title: (poi) => `The quiet side of ${poi.name}`,
    detail: (poi) =>
      `There is a face of ${poi.name} that nothing walks on. Not ruined. Not guarded. Just avoided, by everything, for a reason nobody has written down.`,
    read: "I want this one read before it is touched. Bring back a picture, not a body.",
    dcMod: -3,
    capsBonus: 90,
    lootRolls: 0,
    minDepth: 2,
  },
  {
    kind: "merchant",
    missionKind: "trade",
    title: (poi) => `A fence is sitting at ${poi.name}`,
    detail: (poi) =>
      `Someone with real stock is holding court at ${poi.name} for a day or two. They buy high on salvage and they do not ask.`,
    read: "Money talks here. Bring the ugly stuff — they pay for ugly.",
    dcMod: -2,
    capsBonus: 200,
    lootRolls: 1,
    minDepth: 0,
  },
];

function makeLead(state: GameState, loc: LocationId, poi: RegionPointOfInterest, depth: number): ReconLead | null {
  const pool = LEAD_SHAPES.filter((s) => depth >= s.minDepth);
  const shape = pool[Math.floor(Math.random() * pool.length)];
  if (!shape) return null;
  const regionId = poi.regionId;
  const regionName = regionById(regionId).name;
  const thread = threadFor(regionId);
  const danger = poi.danger ?? 2;
  return {
    id: uid("lead"),
    kind: shape.kind,
    title: shape.title(poi),
    detail: shape.detail(poi, regionName),
    read: shape.read,
    locationId: loc,
    regionId,
    poiId: poi.id,
    poiName: poi.name,
    missionKind: shape.missionKind,
    dcMod: shape.dcMod,
    capsBonus: Math.round(shape.capsBonus * (0.8 + danger * 0.12)),
    lootRolls: shape.lootRolls,
    day: state.day,
    expiresDay: state.day + LEAD_LIFE,
    thread: thread?.id,
  };
}

/* ------------------------------------------------------------------ *
 * Findings
 * ------------------------------------------------------------------ */

const GROUND_READS: Record<PoiAction, string[]> = {
  scout: [
    "Boot prints in two directions and only one set coming back.",
    "A watch rotation that changes on the hour, which means somebody is paying for it.",
    "Wire strung at ankle height where nothing should need wire.",
    "Fresh scoring on the stone. Something dragged, recently, and downhill.",
  ],
  salvage: [
    "Stock stacked to be moved, not to be kept. Someone is coming back for it.",
    "Torch cuts on the plate. Clean, steady, professional hands.",
    "A crate stencil half scraped off. The half left says a name you have seen on a manifest.",
    "Rust patterns that say this was under water for a decade and out of it for a month.",
  ],
  listen: [
    "Three carrier tones where the chart says there should be one.",
    "A voice reading numbers, stopping, and starting the sequence over.",
    "Somebody broadcasting a market list that includes items nobody sells here.",
    "Dead air, then a click, then dead air. On a schedule.",
  ],
  shop: ["Stalls are open and the prices moved overnight."],
  home: ["Vault 13 holds. The light is on."],
  boss: ["The ground goes quiet in a circle, and the circle has a centre."],
};

const THREAT_READS = [
  "Something is watching the approach and not closing. Patient is worse than hungry.",
  "Kane's people have been through here inside the week. The tread is stamped.",
  "Ashen Pack sign on the high ground. They are counting you back.",
  "A second set of eyes that moved when you moved. Not an animal.",
];

function findingsFor(opts: {
  action: PoiAction;
  poi: RegionPointOfInterest;
  depth: number;
  sweep: number;
  heat: number;
  caps: number;
  intel: number;
  found: RegionPointOfInterest[];
  items: string[];
  threat: boolean;
}): ReconFinding[] {
  const { action, poi, depth, sweep, heat, caps, intel, found, items, threat } = opts;
  const out: ReconFinding[] = [];
  const reads = GROUND_READS[action] ?? GROUND_READS.scout;
  out.push({
    key: "ground",
    label: "Ground",
    detail: reads[Math.floor(Math.random() * reads.length)] ?? reads[0],
    tone: "neutral",
  });
  out.push({
    key: "depth",
    label: `${DEPTH_LABELS[clamp(depth, 0, 4)]} · site knowledge`,
    detail: DEPTH_BLURB[clamp(depth, 0, 4)] ?? DEPTH_BLURB[0],
    tone: depth >= 3 ? "good" : "neutral",
  });
  if (intel > 0) {
    out.push({
      key: "intel",
      label: `Intel +${intel}`,
      detail: "Filed against the region. Intel lowers what the next sortie has to roll.",
      tone: "good",
    });
  }
  if (caps > 0) {
    out.push({
      key: "caps",
      label: `+${caps} caps`,
      detail:
        sweep > 1
          ? "Second pass over ground you already read. It pays less because it owes less."
          : "Pocket money off a site that was not being watched closely enough.",
      tone: "good",
    });
  }
  items.forEach((name) =>
    out.push({
      key: `item-${name}`,
      label: name,
      detail: "Carried back and racked in the Salvage Depot.",
      tone: "good",
    }),
  );
  found.forEach((p) =>
    out.push({
      key: `pin-${p.id}`,
      label: `Marked · ${p.name}`,
      detail: p.description,
      tone: "good",
    }),
  );
  if (threat) {
    out.push({
      key: "threat",
      label: "Contact sign",
      detail: THREAT_READS[Math.floor(Math.random() * THREAT_READS.length)] ?? THREAT_READS[0],
      tone: "bad",
    });
  }
  if (heat >= 10) {
    out.push({
      key: "heat",
      label: "Kane is listening",
      detail:
        "Heat is high enough that AEGIS is running intercepts on this frontier. Ghost approaches only, until it cools.",
      tone: "warn",
    });
  }
  if (poi.danger && poi.danger >= 3) {
    out.push({
      key: "danger",
      label: `Danger ${poi.danger}`,
      detail: "This is not a walk. Send somebody who can carry themselves out.",
      tone: "warn",
    });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * The sweep
 * ------------------------------------------------------------------ */

function watchFromLeft(n: number): WatchId {
  if (n >= 6) return "dawn";
  if (n === 5) return "morning";
  if (n === 4) return "midday";
  if (n === 3) return "afternoon";
  if (n === 2) return "dusk";
  return "night";
}

function salvageName(regionId: RegionId): string {
  switch (regionId) {
    case "ironclad":
      return "Rail spike bundle";
    case "slagtown":
      return "Coke-brick scrap";
    case "blackspire":
      return "Lift-cage tooth";
    case "brasswater":
      return "Brine-cut brass";
    default:
      return "Signal-cell shard";
  }
}

function stashSalvage(state: GameState, poi: RegionPointOfInterest, depth: number): string {
  const name = salvageName(poi.regionId);
  state.vault.push({
    id: uid("salv"),
    name,
    kind: "material",
    rarity: depth >= 3 ? "Uncommon" : "Common",
    condition: depth >= 2 ? "Pristine" : "Worn",
    effect: "Salvage pulled off a marked site. Forge stock.",
    lore: `${poi.name}. ${poi.description}`,
    value: 40 + (poi.danger ?? 1) * 12 + depth * 15,
    sourceRegion: poi.regionId,
    discoveredDay: state.day,
  });
  return name;
}

/**
 * The next sites worth walking, so a report can hand the player the button
 * rather than sending them back to hunt for it.
 */
function nextSiteSuggestion(state: GameState, loc: LocationId, skipId: string) {
  const known = knownPois(state, loc).filter((p) => {
    if (p.id === skipId) return false;
    const act = poiActionOf(p);
    return act !== "home" && act !== "shop" && act !== "boss";
  });
  const fresh = known.find((p) => sweepsToday(state, p.id) === 0);
  return fresh ?? known[0];
}

function stepsFor(state: GameState, loc: LocationId, poi: RegionPointOfInterest, leads: ReconLead[]): ReconStep[] {
  const steps: ReconStep[] = [];
  const left = state.shift?.watchesLeft ?? 0;
  const lead = leads[0];
  if (lead) {
    steps.push({
      id: "deploy",
      label: `Run the lead · ${lead.poiName}`,
      hint: `${lead.title}. DC ${lead.dcMod >= 0 ? "+" : ""}${lead.dcMod}, +${lead.capsBonus} caps on the close.`,
      primary: true,
      leadId: lead.id,
      poiId: lead.poiId,
    });
  }
  const next = left > 0 ? nextSiteSuggestion(state, loc, poi.id) : undefined;
  if (next) {
    steps.push({
      id: "another",
      label: `Work ${next.name}`,
      hint:
        sweepsToday(state, next.id) === 0
          ? "Untouched today. One watch."
          : "Already swept once today. It will pay less.",
      primary: !lead,
      poiId: next.id,
    });
  }
  if (state.locations[loc]?.bossUnlocked && !state.locations[loc]?.bossDefeated) {
    const v = villainById(locById(loc).bossId);
    steps.push({
      id: "boss",
      label: v ? `The hill has a name · ${v.name}` : "The hill has a name",
      hint: "Brief the named raid from the region sheet.",
    });
  }
  steps.push({
    id: "deploy",
    label: "Brief a sortie here",
    hint: "Pick the job, the approach and who walks.",
    primary: !lead && !next,
  });
  if (left <= 0) {
    steps.push({
      id: "rest",
      label: "Rest until dawn",
      hint: "The shift is spent. Dawn reprints the watches and the board.",
      primary: true,
    });
  } else {
    steps.push({ id: "rest", label: "Call the day", hint: `${left} watch${left === 1 ? "" : "es"} still on the clock.` });
  }
  return steps;
}

/**
 * Work one site and file the report. Never refuses without handing back
 * something to do — a spent shift is a report with a Rest button on it, not a
 * dead toast.
 */
export function sweepSite(state: GameState, loc: LocationId, poiId: string): SiteReport {
  const recon = ensureRecon(state);
  const poi = poiById(loc, poiId) ?? poisForLocation(loc)[0]!;
  const regionId = poi.regionId;
  const action = poiActionOf(poi);
  const left = state.shift?.watchesLeft ?? 0;
  const track = siteTrack(state, poi.id);
  const sweep = (track.lastDay === state.day ? track.sweeps : 0) + 1;

  const base: Omit<SiteReport, "headline" | "findings" | "steps" | "tyrone" | "hollow"> = {
    id: uid("rep"),
    day: state.day,
    watch: state.shift?.watch ?? "dawn",
    locationId: loc,
    regionId,
    poiId: poi.id,
    poiName: poi.name,
    action,
    sweep,
    depth: track.depth,
    depthLabel: DEPTH_LABELS[clamp(track.depth, 0, 4)],
    leadIds: [],
    caps: 0,
    intel: 0,
    items: [],
    heat: state.kaneHeat ?? 0,
    watchSpent: 0,
  };

  if (left <= 0) {
    const report: SiteReport = {
      ...base,
      blocked: true,
      headline: `${poi.name} · the light is gone`,
      findings: [
        {
          key: "spent",
          label: "Shift spent",
          detail:
            "Six watches burned. Anything read now is read badly, and the Realm charges for bad reading in blood.",
          tone: "warn",
        },
        {
          key: "dawn",
          label: "Dawn resets everything",
          detail:
            "Watches reprint, the board prints new jobs, the market restocks and every site pays full again.",
          tone: "neutral",
        },
      ],
      tyrone: "Tyrone · You are done. Go inside. The ground keeps.",
      hollow: `Hollow · ${regionById(regionId).name} does not care that you are tired. It notices that you stayed.`,
      steps: [
        { id: "rest", label: "Rest until dawn", hint: "Reprint the watches.", primary: true },
        { id: "home", label: "Back to Vault 13", hint: "Repair, heal, re-equip before the next shift." },
      ],
    };
    fileReport(state, report);
    return report;
  }

  // --- the sweep pays ---
  const depth = track.depth;
  const danger = poi.danger ?? 2;
  const decay = Math.pow(0.55, sweep - 1);
  const lucky = Math.random();

  let caps = 0;
  let intel = 0;
  const items: string[] = [];
  let heatAdd = 0;

  if (action === "listen") {
    intel = Math.max(1, Math.round((2 + Math.floor(depth / 2)) * decay));
    caps = Math.round((10 + Math.random() * 20) * decay);
  } else if (action === "salvage") {
    caps = Math.round((35 + danger * 15 + depth * 10) * decay);
    intel = sweep === 1 ? 1 : 0;
    if (sweep <= 2) items.push(stashSalvage(state, poi, depth));
    if (danger >= 3 && lucky < 0.28) heatAdd = 1;
  } else {
    caps = Math.round((20 + Math.random() * 25 + depth * 8) * decay);
    intel = Math.max(sweep === 1 ? 1 : 0, Math.floor(depth / 3));
  }

  // Discovery scales with how well the region is read, so a good scout opens
  // the map instead of drip-feeding one pin a day.
  const pins = Math.max(
    0,
    (sweep === 1 ? 1 : 0) + (lucky < 0.35 + depth * 0.08 ? 1 : 0) + (action === "listen" ? 1 : 0),
  );
  const found: RegionPointOfInterest[] = [];
  for (let i = 0; i < pins; i++) {
    const next = discoverNextPoi(state, loc);
    if (!next) break;
    found.push(next);
  }

  const threat = lucky < 0.18 + danger * 0.05 && sweep === 1;

  state.coins += caps;
  if (intel) {
    state.locations[loc] = { ...state.locations[loc], intel: (state.locations[loc]?.intel ?? 0) + intel };
  }
  if (heatAdd) state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + heatAdd);

  // Depth only grows on a fresh sweep, and slows as it climbs.
  if (sweep === 1 && track.depth < 4) {
    const gate = [1, 2, 3, 5][track.depth] ?? 5;
    const visits = track.sweeps + 1;
    if (visits >= gate || Math.random() < 0.45) track.depth = Math.min(4, track.depth + 1);
  }
  track.sweeps = track.lastDay === state.day ? track.sweeps + 1 : 1;
  track.lastDay = state.day;
  track.totalCaps += caps;
  track.cleared = track.depth >= 4;

  // Leads: a read site names its own next job.
  const leads: ReconLead[] = [];
  const leadOdds = (action === "listen" ? 0.75 : 0.45) + depth * 0.08 - (sweep - 1) * 0.25;
  if (Math.random() < leadOdds) {
    const lead = makeLead(state, loc, poi, depth);
    if (lead) {
      recon.leads.push(lead);
      leads.push(lead);
    }
  }
  pruneLeads(state);

  const threadLine = advanceThread(state, loc) ?? undefined;

  // Spend the watch before the steps are built, so the footer counts the clock
  // the player is actually looking at rather than the one they arrived with.
  if (state.shift) {
    state.shift.watchesLeft = Math.max(0, state.shift.watchesLeft - 1);
    state.shift.watch = watchFromLeft(state.shift.watchesLeft);
    state.shift.activeId = null;
  }

  const report: SiteReport = {
    ...base,
    depth: track.depth,
    depthLabel: DEPTH_LABELS[clamp(track.depth, 0, 4)],
    caps,
    intel,
    items,
    heat: state.kaneHeat ?? 0,
    watchSpent: 1,
    leadIds: leads.map((l) => l.id),
    headline:
      sweep === 1
        ? `${poi.name} · ${action === "listen" ? "the tower talks" : action === "salvage" ? "stripped and stowed" : "walked and read"}`
        : `${poi.name} · second pass`,
    findings: findingsFor({ action, poi, depth: track.depth, sweep, heat: state.kaneHeat ?? 0, caps, intel, found, items, threat }),
    tyrone: tyroneRead({ action, sweep, leads, threat, depth: track.depth, poi }),
    hollow: hollowLine(state, regionId, poi),
    threadLine,
    steps: stepsFor(state, loc, poi, leads),
  };

  fileReport(state, report);
  return report;
}

function tyroneRead(opts: {
  action: PoiAction;
  sweep: number;
  leads: ReconLead[];
  threat: boolean;
  depth: number;
  poi: RegionPointOfInterest;
}): string {
  const { action, sweep, leads, threat, depth, poi } = opts;
  if (leads.length) return `Tyrone · ${leads[0].read}`;
  if (threat) return "Tyrone · Something counted you. Do not use the same approach twice on this one.";
  if (sweep > 1) return `Tyrone · You have already read ${poi.name} today. Walking it again is exercise, not intel.`;
  if (depth >= 4) return `Tyrone · We own this ground now. Stop spending watches on it and go spend them somewhere that still lies to us.`;
  if (action === "listen") return "Tyrone · The tower gives you the Realm's rumours, not its truth. Both are worth a climb.";
  if (action === "salvage") return "Tyrone · Salvage pays the forge. The forge pays for the fights you cannot talk your way out of.";
  return "Tyrone · Good. A map is cheaper than a funeral, and it is the only thing you can spend twice.";
}

function hollowLine(state: GameState, regionId: RegionId, poi: RegionPointOfInterest): string {
  const stake = KANE_STAKES[regionId];
  const roll = Math.random();
  if (roll < 0.4 && stake) return `Hollow · ${stake.resource} moves through here. ${stake.why}`;
  if (roll < 0.7) return `Hollow · ${poi.description}`;
  return `Hollow · ${rumorFor(state.day, state.kaneHeat ?? 0)}`;
}

function fileReport(state: GameState, report: SiteReport) {
  const recon = ensureRecon(state);
  recon.reports = [report, ...recon.reports].slice(0, MAX_REPORTS);
  recon.openReportId = report.id;
  state.selectedPoiId = report.poiId;
}

export function openReport(state: GameState): SiteReport | null {
  const recon = ensureRecon(state);
  if (!recon.openReportId) return null;
  return recon.reports.find((r) => r.id === recon.openReportId) ?? null;
}

export function closeReport(state: GameState) {
  ensureRecon(state).openReportId = null;
}

export function reportsForRegion(state: GameState, regionId: RegionId): SiteReport[] {
  return ensureRecon(state).reports.filter((r) => r.regionId === regionId);
}

/** Region knowledge as one number, for the Profile tab. */
export function regionMastery(state: GameState, loc: LocationId): { known: number; total: number; depth: number } {
  const points = poisForLocation(loc).filter((p) => poiActionOf(p) !== "boss");
  const recon = ensureRecon(state);
  const known = knownPois(state, loc).filter((p) => poiActionOf(p) !== "boss").length;
  const depth = points.reduce((sum, p) => sum + (recon.sites[p.id]?.depth ?? 0), 0);
  return { known, total: points.length, depth };
}
