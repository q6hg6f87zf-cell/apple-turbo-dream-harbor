import { canonicalRegionId, regionById } from "./data";
import { rumorFor } from "./market";
import type {
  GameState,
  LocationId,
  MissionApproach,
  MissionBeat,
  MissionKind,
  MissionTactic,
  PoiAction,
  RegionId,
  RegionPointOfInterest,
  StatKey,
} from "./types";

export interface FieldDeploy {
  poiId?: string;
  approach?: MissionApproach;
}

export const APPROACHES: {
  id: MissionApproach;
  label: string;
  blurb: string;
  dc: number;
  loot: number;
  heat: number;
  combatBias: number;
}[] = [
  {
    id: "ghost",
    label: "Ghost",
    blurb: "Slip the wire. Lower DC, thinner haul, AEGIS is slower to notice.",
    dc: -2,
    loot: 0.7,
    heat: 1,
    combatBias: -2,
  },
  {
    id: "standard",
    label: "Standard",
    blurb: "Walk in like a squad with a job. Balanced risk and salvage.",
    dc: 0,
    loot: 1,
    heat: 2,
    combatBias: 0,
  },
  {
    id: "breach",
    label: "Breach",
    blurb: "Kick the door. Louder, richer, and Kane's people hear it.",
    dc: 2,
    loot: 1.45,
    heat: 4,
    combatBias: 3,
  },
];

export const KANE_STAKES: Record<RegionId, { resource: string; why: string }> = {
  ironclad: { resource: "Rail steel", why: "Hull plating for the jump stack." },
  slagtown: { resource: "Furnace slag", why: "Burns hot enough to feed a starship stack." },
  blackspire: { resource: "Hollow ore", why: "The reason Kane wants the Realm at all." },
  brasswater: { resource: "Jump tables", why: "Pre-collapse math for intergalactic travel." },
  veyra: { resource: "AEGIS cores", why: "Human-run 2753 frames. Successors to the T-0880 line." },
};

export function approachById(id: MissionApproach | undefined) {
  return APPROACHES.find((a) => a.id === id) ?? APPROACHES[1];
}

export function locationToRegion(id: LocationId) {
  return canonicalRegionId(id === "hq" ? "ironclad" : id);
}

export function poisForLocation(loc: LocationId): RegionPointOfInterest[] {
  const regionId = locationToRegion(loc);
  if (!regionId) return [];
  return regionById(regionId).points;
}

export function knownPois(state: GameState, loc: LocationId): RegionPointOfInterest[] {
  const points = poisForLocation(loc);
  const progress = state.locations[loc];
  const discovered = new Set(progress?.discoveredPois ?? []);
  const sortie = state.shift?.board.find((t) => t.kind === "sortie" && (t.status === "open" || t.status === "active"));
  if (sortie?.poiId && (sortie.loc === loc || !sortie.loc)) discovered.add(sortie.poiId);
  if (state.selectedPoiId) discovered.add(state.selectedPoiId);
  return points.filter((p) => {
    if (p.kind === "boss") return !!progress?.bossUnlocked;
    return p.discovered || discovered.has(p.id);
  });
}

export function poiById(loc: LocationId, poiId: string | null | undefined) {
  if (!poiId) return undefined;
  return poisForLocation(loc).find((p) => p.id === poiId);
}

export function discoverPoi(
  state: GameState,
  loc: LocationId,
  poiId: string | null | undefined,
): RegionPointOfInterest | undefined {
  const poi = poiById(loc, poiId);
  if (!poi || poi.kind === "boss") return poi;
  const progress = state.locations[loc];
  if (!progress) return poi;
  const current = progress.discoveredPois ?? [];
  if (!poi.discovered && !current.includes(poi.id)) {
    progress.discoveredPois = [...current, poi.id];
  }
  return poi;
}

export function defaultPoi(state: GameState, loc: LocationId): RegionPointOfInterest | undefined {
  const selected = poiById(loc, state.selectedPoiId);
  if (selected && selected.kind !== "boss") return selected;
  const sortie = state.shift?.board.find((t) => t.kind === "sortie" && (t.status === "open" || t.status === "active"));
  if (sortie?.poiId && (sortie.loc === loc || !sortie.loc)) {
    const jobSite = poiById(loc, sortie.poiId);
    if (jobSite) return jobSite;
  }
  const field = knownPois(state, loc).filter(
    (p) => p.action !== "home" && p.action !== "shop" && p.action !== "listen" && p.kind !== "merchant" && p.kind !== "radio",
  );
  return field[0] ?? knownPois(state, loc)[0] ?? poisForLocation(loc)[0];
}

export function kaneBand(heat: number) {
  if (heat >= 24) return { label: "AEGIS lockdown", tone: "text-danger" as const };
  if (heat >= 16) return { label: "Kane hunting", tone: "text-danger" as const };
  if (heat >= 10) return { label: "AEGIS intercepts", tone: "text-ember" as const };
  if (heat >= 5) return { label: "Kane watching", tone: "text-moon" as const };
  return { label: "Cold trail", tone: "text-ok" as const };
}

export function approachHeatFor(kind: MissionKind, approach: MissionApproach) {
  const base = approachById(approach).heat;
  if (kind === "boss") return base + 5;
  if (kind === "raid") return base + 2;
  if (kind === "bounty") return base + 2;
  if (kind === "scout") return Math.max(0, base - 1);
  return base;
}

export function discoverNextPoi(state: GameState, loc: LocationId): RegionPointOfInterest | null {
  const points = poisForLocation(loc);
  const known = new Set(knownPois(state, loc).map((p) => p.id));
  const next = points.find((p) => !known.has(p.id) && p.kind !== "boss");
  if (!next) return null;
  const current = state.locations[loc].discoveredPois ?? [];
  if (!current.includes(next.id)) {
    state.locations[loc].discoveredPois = [...current, next.id];
  }
  return next;
}

export function tacticsFor(opts: {
  beatKind: MissionBeat["kind"];
  approach: MissionApproach;
  leadStat: StatKey;
}): MissionTactic[] {
  if (opts.beatKind === "combat" || opts.beatKind === "boss") {
    return [
      { id: "cut", label: "Cut the visor", blurb: "Slip the 2753 before it locks. SPD.", stat: "SPD", dcMod: -1 },
      { id: "face", label: "Walk like Kane's", blurb: "Pretend you belong to the program. CHA.", stat: "CHA", dcMod: 0 },
      { id: "break", label: "Break the frame", blurb: "Louder. They remember T-0880 serials. STR.", stat: "STR", dcMod: 1 },
    ];
  }
  if (opts.approach === "ghost") {
    return [
      { id: "wire", label: "Cut the wire", blurb: "Kill the alarm. Keep the trail cold. INT.", stat: "INT", dcMod: -1 },
      { id: "shadow", label: "Shadow the watch", blurb: "Do not exist. SPD.", stat: "SPD", dcMod: 0 },
      { id: "bribe", label: "Buy the lookaway", blurb: "Caps instead of blood. CHA.", stat: "CHA", dcMod: 1 },
    ];
  }
  if (opts.approach === "breach") {
    return [
      { id: "ram", label: "Ram the door", blurb: "Fast and expensive in heat. STR.", stat: "STR", dcMod: 0 },
      { id: "rush", label: "Rush the yard", blurb: "Get inside before AEGIS stacks. SPD.", stat: "SPD", dcMod: -1 },
      { id: "mark", label: "Call the shot", blurb: "Pick the weak point. WIS.", stat: "WIS", dcMod: 0 },
    ];
  }
  return [
    { id: "job", label: "Do the job", blurb: "Play it as briefed.", stat: opts.leadStat, dcMod: 0 },
    { id: "talk", label: "Talk it through", blurb: "Someone here still deals. CHA.", stat: "CHA", dcMod: 0 },
    { id: "luck", label: "Trust the Hollow", blurb: "The Realm likes a gamble. LCK.", stat: "LCK", dcMod: 1 },
  ];
}

export function poiActionOf(poi: RegionPointOfInterest): PoiAction {
  if (poi.action) return poi.action;
  if (poi.kind === "merchant") return "shop";
  if (poi.kind === "radio") return "listen";
  if (poi.kind === "boss") return "boss";
  if (poi.kind === "ruin" || poi.kind === "dungeon" || poi.kind === "facility") return "salvage";
  return "scout";
}

export function ensurePoiWatch(state: GameState) {
  if (!state.poiWatch || state.poiWatch.day !== state.day) {
    state.poiWatch = { day: state.day, used: [] };
  }
  return state.poiWatch;
}

export function poiUsedToday(state: GameState, poiId: string) {
  return ensurePoiWatch(state).used.includes(poiId);
}

function markUsed(state: GameState, poiId: string) {
  const log = ensurePoiWatch(state);
  if (!log.used.includes(poiId)) log.used = [...log.used, poiId];
}

function catalogSalvage(state: GameState, poi: RegionPointOfInterest) {
  const name =
    poi.regionId === "ironclad"
      ? "Rail spike bundle"
      : poi.regionId === "slagtown"
        ? "Coke-brick scrap"
        : poi.regionId === "blackspire"
          ? "Lift-cage tooth"
          : poi.regionId === "brasswater"
            ? "Brine-cut brass"
            : "Signal-cell shard";
  state.vault.push({
    id: `salv-${Math.random().toString(36).slice(2, 8)}`,
    name,
    kind: "material",
    rarity: "Common",
    condition: "Worn",
    effect: "Salvage pulled off a marked site.",
    lore: `${poi.name}. ${poi.description}`,
    value: 40 + (poi.danger ?? 1) * 12,
    sourceRegion: poi.regionId,
    discoveredDay: state.day,
  });
  return name;
}

export function markFieldJob(state: GameState, kind: "market" | "tower" | "salvage", report: string, watches = 1) {
  const board = state.shift?.board;
  if (!board) return;
  const task = board.find((t) => t.kind === kind && (t.status === "open" || t.status === "active"));
  if (!task || task.status === "done") return;
  const left = state.shift.watchesLeft;
  task.status = "done";
  task.report = report;
  state.shift.activeId = null;
  if (watches > 0 && left >= watches) {
    state.shift.watchesLeft = Math.max(0, left - watches);
    const n = state.shift.watchesLeft;
    state.shift.watch =
      n >= 6 ? "dawn" : n === 5 ? "morning" : n === 4 ? "midday" : n === 3 ? "afternoon" : n === 2 ? "dusk" : "night";
  }
  if (state.shift.watchesLeft <= 0) state.shift.watch = "night";
}

export function workPoi(state: GameState, loc: LocationId, poiId: string): string | null {
  const poi = poiById(loc, poiId);
  if (!poi) return "That site is not on this map.";
  const known = knownPois(state, loc).some((p) => p.id === poi.id);
  if (!known) return "You have not marked that site yet.";
  const action = poiActionOf(poi);
  if (action === "home") return "home";
  if (action === "shop") return "shop";
  if (action === "boss") return "boss";

  const left = state.shift?.watchesLeft ?? 0;
  if (left <= 0) return "Shift is over. Rest until dawn.";
  if (poiUsedToday(state, poi.id)) return "You already worked this site today. Dawn resets the ground.";

  if (action === "listen") {
    state.locations[loc] = { ...state.locations[loc], intel: state.locations[loc].intel + 2 };
    const found = discoverNextPoi(state, loc);
    const rumor = rumorFor(state.day, state.kaneHeat ?? 0);
    markUsed(state, poi.id);
    const report = found
      ? `${poi.name} talks. ${poi.description} ${rumor} Marked ${found.name}.`
      : `${poi.name} talks. ${poi.description} ${rumor}`;
    markFieldJob(state, "tower", report, 1);
    state.toast = report;
    return null;
  }

  if (action === "salvage") {
    const haul = catalogSalvage(state, poi);
    const caps = 35 + (poi.danger ?? 1) * 15;
    state.coins += caps;
    if ((poi.danger ?? 1) >= 3 && Math.random() < 0.28) {
      state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 1);
    }
    const found = Math.random() < 0.45 ? discoverNextPoi(state, loc) : null;
    markUsed(state, poi.id);
    const report = found
      ? `${poi.name} paid ${haul} and ${caps} caps. ${poi.description} Also marked ${found.name}.`
      : `${poi.name} paid ${haul} and ${caps} caps. ${poi.description}`;
    markFieldJob(state, "salvage", report, 1);
    state.toast = report;
    return null;
  }

  state.locations[loc] = { ...state.locations[loc], intel: state.locations[loc].intel + 1 };
  const found = discoverNextPoi(state, loc);
  const caps = 20 + Math.round(Math.random() * 25);
  state.coins += caps;
  markUsed(state, poi.id);
  const report = found
    ? `${poi.name} walked. ${poi.description} Marked ${found.name}. +${caps} caps.`
    : `${poi.name} walked. ${poi.description} +${caps} caps.`;
  markFieldJob(state, "salvage", report, 1);
  state.toast = report;
  return null;
}

