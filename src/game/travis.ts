import type { GameState, Item, LocationId, MissionKind } from "./types";
import { CAST } from "./cast";
import { rememberTyrone } from "./tyrone-mind";

export interface TravisModule {
  id: string;
  name: string;
  part: string;
  pay: number;
  slot: string;
  tagline: string;
  fit: string;
  lore: string;
  pois: string[];
}

export const TRAVIS_SHOP_POI = "ironclad-shop";

export const TRAVIS_MODULES: TravisModule[] = [
  {
    id: "crt-tube",
    name: "Spare CRT Tube",
    part: "CRT tube",
    pay: 95,
    slot: "sight",
    tagline: "Tyrone sees the berm again.",
    fit: "Seats in the head. The picture stops rolling.",
    lore: "Kane's line used surplus television tubes. Travis still has the jig. A good tube is a named chassis that can look you in the eye.",
    pois: ["ironclad-tower", "ironclad-exchange", "ironclad-gate"],
  },
  {
    id: "drive-wheel",
    name: "T-0880 Drive Wheel",
    part: "drive wheel",
    pay: 120,
    slot: "mobility",
    tagline: "The porch light gets a shorter walk.",
    fit: "One motorcycle wheel, balanced. He stops listing to port.",
    lore: "Every T-0880 rolled on one wheel. The rest of the line hangs. This one still has tread. Travis will not put a bald tire on a friend.",
    pois: ["ironclad-highway", "ironclad-rail", "ironclad-berm"],
  },
  {
    id: "clipboard-servo",
    name: "Clipboard Servo",
    part: "clipboard servo",
    pay: 110,
    slot: "hands",
    tagline: "He can hold a job and a wrench in the same sentence.",
    fit: "The right claw remembers how to clip a ticket.",
    lore: "Delivery chassis were built around a clipboard. Kane called it a task. Travis calls it a handshake. The servo is the difference.",
    pois: ["ironclad-gate", "ironclad-market", "ironclad-shop"],
  },
  {
    id: "chest-plate",
    name: "Bay Plate 0880",
    part: "chest plate",
    pay: 140,
    slot: "armor",
    tagline: "AEGIS knocks. The plate knocks back.",
    fit: "Rivets the S.Y.N.A.P.S.E stencil back where Kane tried to grind it off.",
    lore: "Original T-0880 breastwork. Travis keeps a stack behind the guitar. He will not sell it to Kane's buyers. He will fit it for the one that walked.",
    pois: ["ironclad-works", "ironclad-rail", "ironclad-halo"],
  },
  {
    id: "voice-coil",
    name: "ICR Voice Coil",
    part: "voice coil",
    pay: 105,
    slot: "voice",
    tagline: "The CRT talks cleaner. Rourke hears it from the tower.",
    fit: "Solders the growl back into a sentence.",
    lore: "Pulled from a dead ICR mike. Calder Rourke swears the coil still knows the porch frequency. Travis believes in solder, not ghosts. Both of them are right.",
    pois: ["ironclad-tower", "ironclad-highway"],
  },
  {
    id: "knee-ram",
    name: "Hydraulic Knee",
    part: "knee ram",
    pay: 130,
    slot: "legs",
    tagline: "He stops dragging the porch.",
    fit: "Bleeds the ram. The chassis stands like it means the room.",
    lore: "T-0880 knees were never rated for a named life. Travis rates them anyway. A ram from the Works will keep TyroneBot off the floor for another season.",
    pois: ["ironclad-works", "ironclad-halo", "ironclad-berm"],
  },
];

export function emptyTravis(): GameState["travis"] {
  return { fitted: [], paid: 0, jobs: 0 };
}

export function restoreTravis(raw: unknown): GameState["travis"] {
  const base = emptyTravis();
  if (!raw || typeof raw !== "object") return base;
  const t = raw as Partial<GameState["travis"]>;
  const fitted = Array.isArray(t.fitted) ? t.fitted.filter((id): id is string => typeof id === "string") : [];
  return {
    fitted: [...new Set(fitted)].filter((id) => TRAVIS_MODULES.some((m) => m.id === id)),
    paid: typeof t.paid === "number" && Number.isFinite(t.paid) ? Math.max(0, t.paid) : 0,
    jobs: typeof t.jobs === "number" && Number.isFinite(t.jobs) ? Math.max(0, t.jobs) : 0,
  };
}

export function moduleById(id: string): TravisModule | undefined {
  return TRAVIS_MODULES.find((m) => m.id === id);
}

export function moduleByPartName(name: string): TravisModule | undefined {
  return TRAVIS_MODULES.find((m) => m.name === name);
}

export function isTravisPart(item: Pick<Item, "tags" | "name">): boolean {
  if (item.tags?.some((t) => t === "travis" || t.startsWith("travis:"))) return true;
  return TRAVIS_MODULES.some((m) => m.name === item.name);
}

function bags(state: GameState): Item[][] {
  return [state.vault, ...state.operatives.map((o) => o.inventory)];
}

function alreadyHas(state: GameState, id: string): boolean {
  if (!state.travis) state.travis = emptyTravis();
  if (state.travis.fitted.includes(id)) return true;
  const name = moduleById(id)?.name;
  return bags(state).some((bag) => bag.some((it) => it.tags?.includes(`travis:${id}`) || it.name === name));
}

export function maybeTravisPart(opts: {
  state: GameState;
  kind: MissionKind;
  poiId?: string;
  loc: LocationId;
  total: number;
}): Omit<Item, "id"> | null {
  const { state, kind, poiId, total } = opts;
  if (total < 9) return null;
  if (!state.travis) state.travis = emptyTravis();
  const open = TRAVIS_MODULES.filter((m) => !alreadyHas(state, m.id));
  if (!open.length) return null;
  const siteHit = open.filter((m) => poiId && m.pois.includes(poiId));
  const campaign = kind === "raid" || kind === "forage" || kind === "scout" || kind === "boss" || kind === "bounty";
  const pool = siteHit.length ? siteHit : campaign ? open : [];
  if (!pool.length) return null;
  const chance = siteHit.length ? 0.78 : kind === "boss" ? 0.62 : kind === "forage" ? 0.48 : kind === "scout" ? 0.38 : 0.32;
  if (Math.random() > chance) return null;
  const mod = pool[Math.floor(Math.random() * pool.length)]!;
  return {
    name: mod.name,
    kind: "material",
    rarity: "Uncommon",
    condition: "Worn",
    effect: `Travis part · ${mod.slot}. Deliver to the Mechanical Shop. He pays ${mod.pay} caps and fits TyroneBot.`,
    lore: `${mod.lore} Marked for Travis at the Ironclad Mechanical Shop.`,
    value: mod.pay,
    tags: ["travis", `travis:${mod.id}`],
    sourceRegion: "ironclad",
    discoveredDay: state.day,
  };
}

export function travisPartsOnHand(state: GameState): Item[] {
  return bags(state).flat().filter(isTravisPart);
}

export function pendingModules(state: GameState): { item: Item; mod: TravisModule }[] {
  if (!state.travis) state.travis = emptyTravis();
  const seen = new Set<string>();
  return travisPartsOnHand(state)
    .map((item) => {
      const fromTag = item.tags?.find((t) => t.startsWith("travis:"))?.slice(7);
      const mod = (fromTag && moduleById(fromTag)) || moduleByPartName(item.name);
      return mod && !state.travis.fitted.includes(mod.id) && !seen.has(mod.id) ? (seen.add(mod.id), { item, mod }) : null;
    })
    .filter((row): row is { item: Item; mod: TravisModule } => Boolean(row));
}

function pullItem(state: GameState, itemId: string): Item | null {
  const vi = state.vault.findIndex((it) => it.id === itemId);
  if (vi >= 0) {
    const [item] = state.vault.splice(vi, 1);
    return item ?? null;
  }
  for (const op of state.operatives) {
    const i = op.inventory.findIndex((it) => it.id === itemId);
    if (i >= 0) {
      const [item] = op.inventory.splice(i, 1);
      return item ?? null;
    }
  }
  return null;
}

export function deliverTravisPart(state: GameState, itemId?: string): { pay: number; mod: TravisModule; line: string } | string {
  if (!state.travis) state.travis = emptyTravis();
  const pending = pendingModules(state);
  const row = itemId ? pending.find((p) => p.item.id === itemId) : pending[0];
  if (!row) return "Nothing on the bench. Run a campaign and bring me a part.";
  if (state.travis.fitted.includes(row.mod.id)) return `${row.mod.name} is already seated.`;
  const pulled = pullItem(state, row.item.id);
  if (!pulled) return "That part walked off the bench.";
  state.travis.fitted = [...state.travis.fitted, row.mod.id];
  state.travis.paid += row.mod.pay;
  state.travis.jobs += 1;
  state.coins += row.mod.pay;
  rememberTyrone(state, {
    id: `travis-fit-${row.mod.id}`,
    type: "fit",
    description: `Travis fitted a ${row.mod.part} on TyroneBot. ${row.mod.fit}`,
    locationId: "ironclad",
    regionId: "ironclad",
    poiId: TRAVIS_SHOP_POI,
    operativeIds: [],
    importance: 7,
    weight: 5,
    tags: ["travis", "tyrone", row.mod.slot, row.mod.id],
    permanent: true,
    outcome: `+${row.mod.pay} caps`,
  });
  if (state.tyrone?.relationship) {
    state.tyrone.relationship.trust = Math.min(100, state.tyrone.relationship.trust + 5);
    state.tyrone.relationship.loyalty = Math.min(100, state.tyrone.relationship.loyalty + 4);
    state.tyrone.relationship.sharedHistory = Math.min(100, state.tyrone.relationship.sharedHistory + 3);
  }
  const line = `${CAST.travis.name} seats the ${row.mod.part}. ${row.mod.fit} Pays ${row.mod.pay} caps. ${row.mod.tagline}`;
  return { pay: row.mod.pay, mod: row.mod, line };
}

export function travisIncomeBonus(state: GameState): number {
  return (state.travis?.fitted.length ?? 0) * 3;
}

export function travisRepairFactor(state: GameState): number {
  const n = state.travis?.fitted.length ?? 0;
  return Math.max(0.55, 1 - n * 0.08);
}

export function fittedModules(state: GameState): TravisModule[] {
  return (state.travis?.fitted ?? []).map((id) => moduleById(id)).filter((m): m is TravisModule => Boolean(m));
}

export function travisBayBlurb(state: GameState): string {
  const n = state.travis?.fitted.length ?? 0;
  if (n <= 0) {
    return "Travis keeps the last T-0880 bay Kane did not melt. Bring him parts from the campaign. He pays caps and keeps TyroneBot walking.";
  }
  if (n >= TRAVIS_MODULES.length) {
    return `Bay complete. ${n} fittings. Travis has no more empty jigs. TyroneBot is as whole as a named chassis gets.`;
  }
  return `${n} of ${TRAVIS_MODULES.length} fittings. Travis has paid ${state.travis.paid} caps into this porch. The next part still has a jig.`;
}
