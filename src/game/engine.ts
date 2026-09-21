import type {
  ClassName,
  CombatState,
  Combatant,
  Condition,
  GameState,
  Item,
  LocationId,
  LocationProgress,
  LogEntry,
  LogKind,
  MissionBeat,
  MissionKind,
  MissionState,
  Operative,
  Resident,
  RollBand,
  Screen,
  ShopOffer,
  Stats,
  StatKey,
} from "./types";
import {
  ARMOR,
  BASE_ROOMS,
  BOUNTIES,
  CLASS_BASE,
  CLASS_GIFT,
  CLASS_HP,
  COMPANIONS,
  DESTINY,
  ENCHANTS,
  ENEMIES,
  FIRST_NAMES,
  LAST_NAMES,
  LEDGER_POOLS,
  PRIMARY_STAT,
  QUARTERS,
  RACES,
  REP,
  RESIDENT_ROLES,
  SAVE_VERSION,
  SHADOW,
  SIGNATURE,
  TRAIT_TIERS,
  VILLAINS,
  WEAPONS,
  WORLD,
  locById,
  makeItemFromArmor,
  makeItemFromWeapon,
  pickByRoll,
  resolveLineage,
  resolveRaceName,
  starterWeapon,
  villainById,
  weaponDamageAvg,
} from "./data";
import { REGION_LOCATION, campaignOpenRegions } from "./arsenal";
import { applyArmor, fieldArmor, rangeHitMod, resolveWeapon } from "./weapon-ops";
import { APPROACHES, locationToRegion, type FieldDeploy } from "./field-ops";
import { emptyMarket } from "./market";
import { emptyShift } from "./shift";
import { emptyTyrone } from "./tyrone-mind";
import { scoreFromDice, STAT_ORDER } from "./stats-copy";
import { freshClocks, grantPackLoot, starterPack } from "./inventory";
import { queueTalk } from "./talk";
import { ensureSquad, maybeSpendArcTurn, stampSeatedPlate } from "./squad";

export function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

export function d20(): number {
  return 1 + Math.floor(Math.random() * 20);
}

export function d(n: number, s: number): number {
  let t = 0;
  for (let i = 0; i < n; i++) t += 1 + Math.floor(Math.random() * s);
  return t;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function band(roll: number): RollBand {
  if (roll <= 1) return "fumble";
  if (roll <= 4) return "fail";
  if (roll <= 9) return "weak";
  if (roll <= 14) return "success";
  if (roll <= 19) return "strong";
  return "crit";
}

export const BAND_LABEL: Record<RollBand, string> = {
  fumble: "Fumble",
  fail: "Fail",
  weak: "Weak Hit",
  success: "Success",
  strong: "Strong Hit",
  crit: "Critical",
};

export const BAND_COPY: Record<RollBand, string> = {
  fumble: "Catastrophic. Steel remembers this.",
  fail: "Nothing takes. The Hollow does not blink.",
  weak: "Partial. Something else moves with it.",
  success: "Clean. The work holds.",
  strong: "Better than planned. Keep moving.",
  crit: "The Hollow looks up.",
};

export function emptyStats(): Stats {
  return { STR: 0, DEF: 0, INT: 0, WIS: 0, SPD: 0, CHA: 0, LCK: 0 };
}

export function computeStats(op: Operative): Stats {
  const base = CLASS_BASE[op.cls];
  const race = RACES[resolveRaceName(op.race)]?.stats ?? emptyStats();
  const primary = PRIMARY_STAT[op.cls];
  const companion = op.companion?.status === "active" ? COMPANIONS[op.companion.type] : null;
  const armor = op.inventory.find((i) => i.equipped && i.slot === "armor");
  const out: Stats = { ...emptyStats() };
  (Object.keys(base) as (keyof Stats)[]).forEach((k) => {
    const dice = op.statDice?.[k];
    let v = typeof dice === "number" ? scoreFromDice(base[k], dice) : base[k];
    v += race[k] ?? 0;
    if (k === primary) v += op.traitBonus;
    if (companion?.statBuff[k]) v += companion.statBuff[k] as number;
    if (k === "CHA" && op.isHoF) v += 3;
    if (k === "DEF" && armor?.defense) v += armor.defense;
    if (op.curses.includes("stat-drain")) v -= 1;
    out[k] = v;
  });
  return out;
}

export function equippedWeapon(op: Operative): Item | undefined {
  return op.inventory.find((i) => i.equipped && i.slot === "weapon");
}

export function conditionPenalty(c: Condition): number {
  if (c === "Worn") return -1;
  if (c === "Damaged") return -2;
  if (c === "Broken") return -99;
  return 0;
}

export function degrade(c: Condition): Condition {
  if (c === "Pristine") return "Worn";
  if (c === "Worn") return "Damaged";
  return "Broken";
}

export function improve(c: Condition): Condition {
  if (c === "Broken") return "Damaged";
  if (c === "Damaged") return "Worn";
  return "Pristine";
}

export function packCap(op: Operative): number {
  const base = op.cls === "Merchant" ? 12 : 8;
  const mule =
    op.companion?.type === "Clockwork Mule" && op.companion.status === "active" ? 5 : 0;
  return base + mule;
}

export function rosterCap(state: GameState): number {
  return 3 + state.rooms.barracks * 2;
}

export function forgeCost(state: GameState): number {
  const livingN = state.operatives.filter((o) => o.status !== "dead").length;
  if (livingN === 0) return 0;
  return 600 + livingN * 350;
}

export function repairCost(state: GameState, item: Item): number {
  const lvl = state.rooms.forge;
  const base = item.condition === "Broken" ? 500 : item.condition === "Damaged" ? 320 : 180;
  const smith = state.residents.some((r) => r.role === "smith") ? 0.8 : 1;
  const tier = lvl >= 3 ? 0.3 : lvl >= 2 ? 0.55 : lvl >= 1 ? 1 : 1.4;
  return Math.max(40, Math.round(base * tier * smith));
}

export function healCost(state: GameState, missing: number): number {
  const medic = state.residents.some((r) => r.role === "medic") ? 0.85 : 1;
  const lvl = state.rooms.infirmary;
  const per = lvl >= 3 ? 40 : lvl >= 2 ? 60 : lvl >= 1 ? 80 : 140;
  return Math.max(20, Math.round(missing * per * medic));
}

export function incomePerTick(state: GameState): number {
  let n = 2;
  (Object.keys(state.rooms) as (keyof GameState["rooms"])[]).forEach((k) => {
    const lvl = state.rooms[k];
    if (lvl <= 0 && k !== "vault") return;
    const inc = BASE_ROOMS[k].income;
    n += inc * Math.max(1, lvl);
  });
  n += state.residents.length * 2;
  if (state.residents.some((r) => r.role === "quartermaster")) n += 2;
  n += state.operatives.filter((o) => o.status === "idle" && o.location === "hq").length;
  n += Math.floor(state.moonFavor / 8);
  return n;
}

export function missionDc(state: GameState, loc: LocationId, kind: MissionKind): number {
  const danger = locById(loc).danger;
  const kindMod: Record<MissionKind, number> = {
    scout: 0,
    forage: 1,
    raid: 3,
    trade: 0,
    bounty: 4,
    boss: 6,
  };
  let dc = 8 + danger + kindMod[kind];
  dc -= state.rooms.watchtower;
  if (state.residents.some((r) => r.role === "scout")) dc -= 1;
  return clamp(dc, 8, 19);
}

export function living(state: GameState): Operative[] {
  return state.operatives.filter((o) => o.status !== "dead");
}

export function idleAtHq(state: GameState): Operative[] {
  return state.operatives.filter((o) => o.status === "idle" && o.location === "hq" && o.hp > 0);
}

export function randomName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

export function makeItem(partial: Omit<Item, "id">): Item {
  return { ...partial, id: uid("it") };
}

export function grantXp(state: GameState, n: number): void {
  if (n <= 0) return;
  state.xp += n;
  let guard = 0;
  while (state.xp >= state.xpToNext && guard++ < 8) {
    state.xp -= state.xpToNext;
    state.level += 1;
    state.xpToNext = Math.round(state.xpToNext * 1.35);
    state.toast = `SYNAPSE rank ${state.level}. Tyrone nods.`;
    pushLog(state, "hq", "Tyrone", `Rank ${state.level}. The CRT holds a little longer.`);
  }
}

export function startingLocations(): Record<LocationId, LocationProgress> {
  const out = {} as Record<LocationId, LocationProgress>;
  WORLD.forEach((l) => {
    out[l.id] = {
      unlocked: l.id === "hq" || l.id === "ironclad",
      intel: l.id === "hq" ? 3 : 0,
      missions: 0,
      bossUnlocked: false,
      bossDefeated: false,
    };
  });
  return out;
}

export function defaultState(): GameState {
  return {
    version: SAVE_VERSION,
    started: false,
    tutorial: "briefing",
    screen: "title",
    openedFrom: null,
    day: 1,
    coins: 1400,
    ore: 0,
    moonFavor: 0,
    xp: 0,
    level: 1,
    xpToNext: 80,
    rooms: {
      vault: 1,
      barracks: 0,
      forge: 0,
      infirmary: 0,
      watchtower: 0,
      ledger: 0,
    },
    quarters: { bunk: 0, lockbox: 0, hearth: 0 },
    residents: [],
    vault: [],
    pack: starterPack(),
    clocks: freshClocks(),
    mentatsLuck: 0,
    hackProbes: 0,
    terminalDrained: false,
    terminalLockDay: 0,
    hack: null,
    operatives: [],
    shop: null,
    bounty: null,
    locations: startingLocations(),
    mission: null,
    combat: null,
    log: [],
    challengeCoin: false,
    selectedId: null,
    selectedLoc: "ironclad",
    toast: null,
    nightNote: null,
    ticks: 0,
    lastParty: [],
    discordId: null,
    discordName: null,
    playerName: null,
    playerHandle: null,
    talk: null,
    seenTalk: [],
    talkQueue: [],
    squad: [],
    activeMemberId: null,
    arc: null,
    kaneHeat: 0,
    selectedPoiId: null,
    regionMapOpen: false,
    market: emptyMarket(1),
    poiWatch: { day: 1, used: [] },
    term: null,
    shift: emptyShift(1),
    arcade: {
      triviaSeen: [],
      tfSeen: [],
      scrambleSeen: [],
      creeRead: [],
      earned: { trivia: 0, truefalse: 0, scramble: 0, wordsearch: 0, lockpick: 0, slots: 0, hack: 0, cree: 0, blackjack: 0, roulette: 0, poker: 0 },
      lastGame: null,
    },
    tyrone: emptyTyrone(),
  };
}

export function pushLog(
  state: GameState,
  kind: LogKind,
  who: string,
  what: string,
  result?: number,
): LogEntry {
  const e: LogEntry = { id: uid("log"), day: state.day, kind, who, what, result };
  state.log = [e, ...state.log].slice(0, 80);
  return e;
}

export function rollShop(day: number) {
  const bargain = pick(LEDGER_POOLS.bargain);
  const essential = pick(LEDGER_POOLS.essential);
  const artifact = pick(LEDGER_POOLS.artifact);
  return { bargain, essential, artifact, day };
}

export function rollBounty(state: GameState) {
  const unlocked = WORLD.filter((l) => l.id !== "hq" && state.locations[l.id].unlocked).map((l) => l.id);
  const pool = BOUNTIES.filter((b) => unlocked.includes(b.location));
  return pick(pool.length ? pool : BOUNTIES);
}

export function forgeOperative(opts: {
  name: string;
  cls: ClassName;
  race: string;
  lineage: string;
  origin: string;
  day: number;
  rolls?: Partial<Record<"rep" | "trait" | "skill" | "shadow" | "enchant" | "destiny" | StatKey, number>>;
}): Operative {
  const rolls = {
    rep: opts.rolls?.rep ?? d20(),
    trait: opts.rolls?.trait ?? d20(),
    skill: opts.rolls?.skill ?? d20(),
    shadow: opts.rolls?.shadow ?? d20(),
    enchant: opts.rolls?.enchant ?? d20(),
    destiny: opts.rolls?.destiny ?? d20(),
  };
  const statDice = emptyStats();
  STAT_ORDER.forEach((k) => {
    statDice[k] = opts.rolls?.[k] ?? d20();
  });
  const rep = pickByRoll(REP[opts.cls], rolls.rep);
  const trait = TRAIT_TIERS.find((t) => rolls.trait >= t.range[0] && rolls.trait <= t.range[1])!;
  const skill = pickByRoll(SIGNATURE[opts.cls], rolls.skill);
  const shadow = pickByRoll(SHADOW[opts.cls], rolls.shadow);
  const enchant = pickByRoll(ENCHANTS[opts.cls], rolls.enchant);
  const destiny = pickByRoll(DESTINY[opts.cls], rolls.destiny);
  const raceName = resolveRaceName(opts.race);
  const race = RACES[raceName];
  const lineage = resolveLineage(raceName, opts.lineage);
  const hp = CLASS_HP[opts.cls];
  const weapon = makeItem({ ...starterWeapon(opts.cls), equipped: true });
  const kit: Item[] = [
    weapon,
    ...race.kit.map((name) =>
      makeItem({
        name,
        kind: name.toLowerCase().includes("ore") ? "material" : "consumable",
        rarity: "Common",
        condition: "Pristine",
        effect: "Starting kit.",
        lore: `${raceName} issue.`,
        value: 40,
      }),
    ),
  ];
  return {
    id: uid("op"),
    name: opts.name.trim() || randomName(),
    cls: opts.cls,
    race: raceName,
    lineage,
    origin: opts.origin,
    hp,
    maxHp: hp,
    repTitle: rep.title ?? "Unknown",
    repPassive: rep.passive ?? "",
    traitLevel: trait.level,
    traitBonus: trait.bonus,
    skillName: skill.name ?? "Unknown",
    skillDesc: skill.desc ?? "",
    shadowName: shadow.name ?? "Unknown",
    shadowDesc: shadow.desc ?? "",
    enchantName: enchant.name ?? "Unknown",
    enchantDesc: enchant.desc ?? "",
    destiny: destiny.thread ?? "",
    destinyFired: false,
    giftUsed: false,
    inventory: kit,
    companion: null,
    status: "idle",
    location: "hq",
    raids: 0,
    battles: 0,
    isHoF: false,
    curses: [],
    notes: "",
    joinedDay: opts.day,
    statDice,
  };
}

function partyLead(state: GameState, ids: string[]): Operative {
  const ops = ids
    .map((id) => state.operatives.find((o) => o.id === id))
    .filter(Boolean) as Operative[];
  return ops.find((o) => o.hp > 0 && o.status !== "dead") ?? ops[0] ?? state.operatives[0];
}

export function buildMission(
  state: GameState,
  loc: LocationId,
  kind: MissionKind,
  partyIds: string[],
  field?: FieldDeploy,
): MissionState {
  const L = locById(loc);
  const approach = APPROACHES.find((a) => a.id === field?.approach);
  const dc = clamp(missionDc(state, loc, kind) + (approach?.dc ?? 0), 8, 19);
  const lead = partyLead(state, partyIds);
  const beats: MissionBeat[] = [];
  const add = (
    title: string,
    prompt: string,
    stat: StatKey,
    extra = 0,
    k: MissionBeat["kind"] = "check",
  ) => {
    beats.push({
      id: uid("bt"),
      title,
      prompt,
      stat,
      dc: clamp(dc + extra, 8, 19),
      kind: k,
    });
  };

  if (kind === "scout") {
    add("Approach", `${lead.name} reads the approach to ${L.short}.`, "WIS", -1);
    add("Sweep", "Tracks, caches, the wrong kind of quiet.", "SPD", 0, "loot");
  } else if (kind === "forage") {
    add("Range", "The squad fans out for salvage and ore.", PRIMARY_STAT[lead.cls], 0);
    add("Haul", "Something does not want to be taken.", "STR", 1, "loot");
    if (Math.random() < 0.35 + L.danger * 0.08) {
      add("Ambush", "The ground was never empty.", "SPD", 2, "combat");
    }
  } else if (kind === "raid") {
    add("Breach", "In through a wound in the world.", "SPD", 1);
    add("Hold", "Something answers the noise.", PRIMARY_STAT[lead.cls], 2, "combat");
    add("Extract", "Leave with more than you brought. Or don't.", "LCK", 1, "loot");
  } else if (kind === "trade") {
    add("Haggle", "Price is a conversation. So is threat.", "CHA", 0, "merchant");
    add("Walk away", "Deals have teeth. Count your fingers.", "WIS", 0, "loot");
  } else if (kind === "bounty") {
    const b = state.bounty;
    add("Track", b ? `${b.name} last seen near ${L.short}.` : "The board named a shadow.", "WIS", 1);
    add("Engage", "No speeches. The contract is the speech.", "STR", 2, "combat");
  } else {
    const v = villainById(L.bossId);
    add("Threshold", v ? v.tagline : "The air changes register.", "WIS", 1);
    add(
      "The name",
      v ? `${v.name} is here. ${v.title}.` : "Something with a name.",
      PRIMARY_STAT[lead.cls],
      3,
      "boss",
    );
  }

  return {
    id: uid("ms"),
    locationId: loc,
    kind,
    partyIds,
    beats,
    beatIndex: 0,
    coins: 0,
    ore: 0,
    loot: [],
    narrative: [
      `SYNAPSE deploys to ${L.name}. ${partyIds.length} operative${partyIds.length > 1 ? "s" : ""}.`,
    ],
    waiting: true,
    regionId: locationToRegion(loc) ?? undefined,
    poiId: field?.poiId,
    approach: field?.approach,
  };
}

function lootTable(loc: LocationId, kind: MissionKind, total: number): Item[] {
  const out: Item[] = [];
  const clsPool: ClassName[] = ["Warrior", "Wizard", "Rogue", "Healer", "Merchant", "Bard"];
  const rarityFrom = (t: number): Item["rarity"] => {
    if (t >= 20) return "Mythic";
    if (t >= 18) return "Legendary";
    if (t >= 15) return "Rare";
    if (t >= 11) return "Uncommon";
    return "Common";
  };
  if (total >= 10) {
    const r = rarityFrom(total);
    const weapons = WEAPONS.filter((w) => w.rarity === r || (r === "Common" && w.rarity === "Common"));
    const pool = weapons.length ? weapons : WEAPONS.filter((w) => w.rarity === "Common");
    const w = pick(pool.filter((x) => clsPool.includes(x.cls)));
    out.push(makeItem(makeItemFromWeapon(w)));
  }
  if (total >= 14 && Math.random() < 0.45) {
    const a = pick(ARMOR);
    out.push(makeItem(makeItemFromArmor(a)));
  }
  if (loc === "caverns" || loc === "veyra") {
    out.push(
      makeItem({
        name: "Hollow Ore",
        kind: "material",
        rarity: "Uncommon",
        condition: "Pristine",
        effect: "Forge fuel.",
        lore: "It drinks torchlight.",
        value: 200,
      }),
    );
  }
  if (kind === "scout" && Math.random() < 0.5) {
    out.push(
      makeItem({
        name: "Field Cache",
        kind: "consumable",
        rarity: "Common",
        condition: "Pristine",
        effect: "Restore 3 HP.",
        lore: "Someone packed this and did not come back.",
        value: 80,
      }),
    );
  }
  return out;
}

export function applyRollToBeat(
  state: GameState,
  raw: number,
): { state: GameState; startCombat?: boolean; startBoss?: boolean } {
  if (!state.mission) return { state };
  const m = { ...state.mission };
  const beat = m.beats[m.beatIndex];
  if (!beat) return { state };
  const lead = partyLead(state, m.partyIds);
  const stats = computeStats(lead);
  const assist = m.partyIds.length > 1 ? m.partyIds.length - 1 : 0;
  const bunk = state.quarters.bunk >= 1 && lead.raids === 0 && m.beatIndex === 0 ? 1 : 0;
  const weapon = equippedWeapon(lead);
  const weapMod =
    beat.stat === "STR" || beat.stat === "SPD" ? conditionPenalty(weapon?.condition ?? "Pristine") : 0;
  const hollow = locById(m.locationId).hollow && lead.enchantName.includes("Hollow") ? 1 : 0;
  const chem = state.mentatsLuck > 0 && (beat.kind === "loot" || beat.stat === "LCK") ? 3 : 0;
  const total = raw + Math.floor((stats[beat.stat] - 5) / 2) + assist + bunk + weapMod + hollow + chem;
  const b = band(raw);
  const hit = total >= beat.dc || b === "crit";
  const strong = b === "strong" || b === "crit";

  let coins = 0;
  let ore = 0;
  const notes: string[] = [];
  let startCombat = false;
  let startBoss = false;

  if (b === "fumble") {
    notes.push(`${lead.name} fumbles. The world takes a piece.`);
    const w = equippedWeapon(lead);
    if (w && w.condition !== "Broken") {
      w.condition = degrade(w.condition);
      notes.push(`${w.name} is now ${w.condition}.`);
    }
    const idx = state.operatives.findIndex((o) => o.id === lead.id);
    if (idx >= 0) {
      state.operatives[idx] = {
        ...state.operatives[idx],
        hp: Math.max(0, lead.hp - 1),
        inventory: lead.inventory,
      };
      if (state.operatives[idx].hp <= 0) {
        state.operatives[idx].status = "downed";
        notes.push(`${lead.name} is downed.`);
      }
    }
  }

  if (beat.kind === "check" || beat.kind === "loot" || beat.kind === "merchant") {
    if (hit) {
      const payout =
        40 + locById(m.locationId).danger * 30 + (m.kind === "raid" ? 80 : m.kind === "scout" ? 20 : 40);
      coins = strong ? Math.round(payout * 1.6) : b === "weak" ? Math.round(payout * 0.6) : payout;
      if (m.locationId === "caverns" || m.kind === "forage") ore = strong ? 2 : 1;
      if (beat.kind === "loot" || beat.kind === "merchant") {
        m.loot = [...m.loot, ...lootTable(m.locationId, m.kind, total)];
        const drop = grantPackLoot(state, { source: locById(m.locationId).short });
        if (drop) notes.push(`Vault tick: ${drop.replace("_", " ")}.`);
      }
      notes.push(strong ? `${lead.name} makes it look inevitable.` : `${lead.name} gets it done.`);
    } else {
      notes.push(`${lead.name} misses the beat. DC ${beat.dc}, total ${total}.`);
      if (b === "weak") {
        coins = 15;
        notes.push("A scrap. Not nothing.");
      }
    }
  }

  if (beat.kind === "combat") {
    if (b === "fail" || b === "fumble" || !hit) {
      startCombat = true;
      notes.push("They were waiting.");
    } else if (b === "weak") {
      startCombat = true;
      notes.push("Contact. Ugly, but you saw it coming.");
    } else {
      coins = 90 + locById(m.locationId).danger * 20;
      notes.push(`${lead.name} ends it before it starts.`);
      m.loot = [...m.loot, ...lootTable(m.locationId, m.kind, total)];
    }
  }

  if (beat.kind === "boss") {
    startBoss = true;
    notes.push("No more map. Only the name.");
  }

  if (!lead.destinyFired && raw >= 18 && Math.random() < 0.5) {
    const i = state.operatives.findIndex((o) => o.id === lead.id);
    if (i >= 0) {
      state.operatives[i] = { ...state.operatives[i], destinyFired: true };
      notes.push(`Destiny thread stirs: ${lead.destiny}`);
      state.moonFavor += 2;
      pushLog(state, "destiny", lead.name, lead.destiny);
    }
  }

  m.coins += coins;
  m.ore += ore;
  m.lastRoll = {
    value: raw,
    band: b,
    total,
    dc: beat.dc,
    text: `${BAND_LABEL[b]} · ${raw} → ${total} vs DC ${beat.dc}`,
  };
  m.narrative = [...m.narrative, ...notes];
  m.waiting = false;
  state.mission = m;
  state.coins += coins;
  state.ore += ore;
  pushLog(state, "dice", lead.name, `${beat.title}: ${m.lastRoll.text}`, raw);
  return { state, startCombat, startBoss };
}

export function advanceBeat(state: GameState): GameState {
  if (!state.mission) return state;
  const m = { ...state.mission };
  m.beatIndex += 1;
  m.lastRoll = undefined;
  if (m.beatIndex >= m.beats.length) {
    return completeMission(state);
  }
  m.waiting = true;
  state.mission = m;
  return state;
}

export function completeMission(state: GameState): GameState {
  const m = state.mission;
  if (!m) return state;
  const loc = m.locationId;
  state.locations[loc] = {
    ...state.locations[loc],
    missions: state.locations[loc].missions + 1,
    intel: state.locations[loc].intel + (m.kind === "scout" ? 2 : 1),
  };
  const L = locById(loc);
  const survivors = m.partyIds.some((id) => {
    const o = state.operatives.find((x) => x.id === id);
    return !!o && o.hp > 0 && o.status !== "dead";
  });
  if (!state.locations[loc].bossUnlocked && state.locations[loc].missions >= L.bossAfter) {
    state.locations[loc].bossUnlocked = true;
    state.toast = `${L.name}: ${villainById(L.bossId)?.name ?? "A name"} is in play.`;
    pushLog(state, "note", "Watchtower", `Boss unlocked in ${L.short}: ${villainById(L.bossId)?.name ?? "Unknown"}.`);
  }
  // Campaign flags, not the calendar, open the next continent.
  syncWorldUnlocks(state);

  m.partyIds.forEach((id) => {
    const i = state.operatives.findIndex((o) => o.id === id);
    if (i < 0) return;
    const op = state.operatives[i];
    state.operatives[i] = {
      ...op,
      status: op.hp <= 0 ? "downed" : "idle",
      location: "hq",
      raids: op.raids + 1,
    };
  });
  if (survivors) {
    const drop = grantPackLoot(state, { source: L.short });
    if (drop) {
      pushLog(state, "loot", "Vault", `Clean win. ${drop.replaceAll("_", " ")} stowed.`);
    }
  }
  const leadId = m.partyIds[0];
  const li = state.operatives.findIndex((o) => o.id === leadId);
  m.loot.forEach((it) => {
    if (
      li >= 0 &&
      state.operatives[li].status !== "dead" &&
      state.operatives[li].inventory.length < packCap(state.operatives[li])
    ) {
      state.operatives[li] = {
        ...state.operatives[li],
        inventory: [...state.operatives[li].inventory, it],
      };
    } else {
      state.vault.push(it);
    }
  });
  if (m.kind === "bounty" && state.bounty) {
    state.coins += state.bounty.rewardCoins;
    pushLog(state, "loot", "Bounty Board", `${state.bounty.name} collected. +${state.bounty.rewardCoins} caps`);
    state.bounty = rollBounty(state);
  }
  if (m.loot.length) {
    pushLog(
      state,
      "loot",
      "Sortie",
      `Returned from ${L.short} with ${m.loot.map((x) => x.name).join(", ") || "scraps"}. +${m.coins} caps`,
    );
  }
  if (state.tutorial === "sortie") state.tutorial = "rest";
  state.moonFavor += m.kind === "boss" ? 0 : 1;
  grantXp(state, m.kind === "boss" ? 42 : m.kind === "raid" ? 18 : m.kind === "bounty" ? 22 : 12);
  const rider = ensureSquad(state);
  const cut = Math.round(m.coins * 0.2);
  if (cut > 0) {
    rider.personalCaps += cut;
    rider.xp += m.kind === "boss" ? 12 : 4;
  }
  maybeSpendArcTurn(state, loc, m.kind, `${m.kind} on ${L.short}.`);
  state.mission = null;
  state.toast = `Sortie complete. +${m.coins} caps${cut ? ` · +${cut} on the card` : ""}${m.ore ? ` · +${m.ore} ore` : ""}.`;
  return state;
}

export function spawnCombat(state: GameState, opts: { boss?: boolean }): GameState {
  const m = state.mission;
  if (!m) return state;
  const loc = m.locationId;
  const enemies: Combatant[] = [];
  if (opts.boss) {
    const v = villainById(locById(loc).bossId);
    if (v) {
      enemies.push({
        id: v.id,
        name: v.name,
        hp: v.hp,
        maxHp: v.hp,
        atk: v.atk,
        def: v.def,
        dc: v.dc,
        isBoss: true,
        phase: 0,
        tags: ["boss"],
        flavor: v.tagline,
        // The matchup the villain was written with: Gravenor shrugs off a blade
        // and opens up to a shotgun. Without these it is just a bag of HP.
        armorClass: v.armorClass,
        preferredRange: v.preferredRange,
        resist: v.resist,
        weakness: v.weakness,
        resistAmt: v.resistAmt,
      });
      applyPhase(enemies[enemies.length - 1]!, v, 0);
    }
  } else if (m.kind === "bounty" && state.bounty) {
    enemies.push({
      id: state.bounty.id,
      name: state.bounty.name,
      hp: state.bounty.hp,
      maxHp: state.bounty.hp,
      atk: 4 + Math.floor(state.bounty.dc / 6),
      def: 2,
      dc: state.bounty.dc,
      tags: ["bounty"],
      flavor: state.bounty.type,
      ...fieldArmor(state.bounty.name),
    });
  } else {
    const pool = ENEMIES[loc];
    const n = 1 + (m.kind === "raid" ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const e = pick(pool);
      enemies.push({
        id: uid("en"),
        name: e.name,
        hp: e.hp,
        maxHp: e.hp,
        atk: e.atk,
        def: e.def,
        dc: e.dc,
        tags: [],
        flavor: e.flavor,
        ...fieldArmor(e.name),
      });
    }
  }
  const combat: CombatState = {
    locationId: loc,
    missionKind: m.kind,
    partyIds: m.partyIds,
    enemies,
    turn: 1,
    actorIndex: 0,
    log: [`${enemies.map((e) => e.name).join(" & ")} — ${enemies[0]?.flavor ?? ""}`],
    bossId: opts.boss ? locById(loc).bossId : undefined,
    rewardMult: opts.boss ? 3 : m.kind === "raid" ? 1.6 : 1,
  };
  state.combat = combat;
  m.partyIds.forEach((id) => {
    const i = state.operatives.findIndex((o) => o.id === id);
    if (i >= 0) {
      state.operatives[i] = {
        ...state.operatives[i],
        battles: state.operatives[i].battles + 1,
      };
    }
  });
  return state;
}

export function combatActor(state: GameState): Operative | null {
  if (!state.combat) return null;
  const ids = state.combat.partyIds;
  const livingIds = ids.filter((id) => {
    const o = state.operatives.find((x) => x.id === id);
    return o && o.hp > 0 && o.status !== "dead";
  });
  if (!livingIds.length) return null;
  const idx = state.combat.actorIndex % livingIds.length;
  return state.operatives.find((o) => o.id === livingIds[idx]) ?? null;
}

function enemyPhase(v: NonNullable<ReturnType<typeof villainById>>, hp: number): number {
  const p = v.phases;
  for (let i = p.length - 1; i >= 0; i--) {
    if (hp <= p[i].at) return i;
  }
  return 0;
}

/**
 * Re-cut a boss's line from its base stats plus the phase it has just entered.
 * Always from base, never from the current values, so a phase never stacks on
 * the one before it and the numbers stay the ones the villain was written with.
 */
function applyPhase(target: Combatant, v: NonNullable<ReturnType<typeof villainById>>, index: number) {
  const fx = v.phases[index]?.effect;
  target.atk = Math.max(1, v.atk + (fx?.atk ?? 0));
  target.def = Math.max(0, v.def + (fx?.def ?? 0));
  target.dc = Math.max(6, v.dc + (fx?.dc ?? 0));
}

function topThreat(combat: CombatState, party: Operative[]): Operative | null {
  const threat = combat.threat ?? {};
  let best: Operative | null = null;
  for (const member of party) {
    if (!best || (threat[member.id] ?? 0) > (threat[best.id] ?? 0)) best = member;
  }
  return best && (threat[best.id] ?? 0) > 0 ? best : null;
}

export function resolvePlayerAction(
  state: GameState,
  action: "strike" | "guard" | "gift" | "item" | "flee" | "skill",
): GameState {
  const combat = state.combat;
  if (!combat) return state;
  const actor = combatActor(state);
  if (!actor) return finishCombat(state, false);

  // A boss in a `speaks` phase is at zero and still standing. Whatever the
  // squad does with that round, the last word is his.
  if (combat.reckoning) {
    const v = villainById(combat.reckoning);
    combat.reckoning = undefined;
    combat.log = [...combat.log, v?.lastWord ? `${v.name}: "${v.lastWord}"` : "It stops."].slice(-12);
    state.combat = combat;
    return finishCombat(state, true);
  }

  const guarded = action === "guard";
  const log: string[] = [...combat.log];
  const stats = computeStats(actor);
  const weapon = equippedWeapon(actor);
  const broken = weapon?.condition === "Broken";

  if (action === "gift") {
    if (actor.giftUsed) {
      log.push(`${actor.name} already spent their gift today.`);
      combat.log = log.slice(-12);
      state.combat = combat;
      return enemyTurn(state);
    }
    const gift = CLASS_GIFT[actor.cls];
    const i = state.operatives.findIndex((o) => o.id === actor.id);
    state.operatives[i] = { ...state.operatives[i], giftUsed: true };
    if (actor.cls === "Healer") {
      const down = combat.partyIds
        .map((id) => state.operatives.find((o) => o.id === id))
        .find((o) => o && o.hp <= 0);
      if (down) {
        const di = state.operatives.findIndex((o) => o.id === down.id);
        state.operatives[di] = { ...state.operatives[di], hp: 1, status: "idle" };
        log.push(`Miracle Touch. ${down.name} at 1 HP.`);
      } else {
        const hi = state.operatives.findIndex((o) => o.id === actor.id);
        state.operatives[hi] = {
          ...state.operatives[hi],
          hp: Math.min(actor.maxHp, actor.hp + 4),
        };
        log.push("Miracle Touch finds no downed — the healer takes the remainder.");
      }
    } else if (actor.cls === "Warrior") {
      log.push("Shield Block. The next hit is nothing.");
      combat.shield = actor.id;
    } else if (actor.cls === "Rogue") {
      log.push("Shadow Step. The consequence does not land.");
      log.push(`${gift.name}.`);
      combat.log = log.slice(-12);
      combat.actorIndex += 1;
      combat.turn += 1;
      state.combat = combat;
      return state;
    } else if (actor.cls === "Wizard") {
      log.push("Arcane Surge. The next strike doubles.");
      combat.surge = actor.id;
    } else if (actor.cls === "Merchant") {
      const salve = makeItem({
        name: "Contact's Vial",
        kind: "consumable",
        rarity: "Uncommon",
        condition: "Pristine",
        effect: "Restore 4 HP.",
        lore: "A pocket that should not exist.",
        value: 0,
      });
      const mi = state.operatives.findIndex((o) => o.id === actor.id);
      state.operatives[mi] = {
        ...state.operatives[mi],
        inventory: [...state.operatives[mi].inventory, salve],
      };
      log.push("Black Market. A vial appears that was not packed.");
    } else if (actor.cls === "Bard") {
      log.push("Encore is held — the next failed roll will be taken back.");
      combat.encore = actor.id;
    }
    log.push(`${gift.name}.`);
    combat.log = log.slice(-12);
    state.combat = combat;
    return enemyTurn(state);
  }

  if (action === "item") {
    const pot = actor.inventory.find((i) => i.kind === "consumable");
    if (!pot) {
      log.push(`${actor.name} has nothing left to drink.`);
      combat.log = log.slice(-12);
      state.combat = combat;
      return state;
    }
    const i = state.operatives.findIndex((o) => o.id === actor.id);
    const parsed = pot.effect.match(/(\d+)\s*HP/i);
    const heal = parsed ? Number(parsed[1]) : pot.name.includes("Essence") ? 8 : pot.name.includes("Bandage") ? 5 : 3;
    state.operatives[i] = {
      ...state.operatives[i],
      hp: Math.min(actor.maxHp, actor.hp + heal),
      inventory: actor.inventory.filter((x) => x.id !== pot.id),
    };
    log.push(`${actor.name} uses ${pot.name}. +${heal} HP.`);
    combat.log = log.slice(-12);
    state.combat = combat;
    return enemyTurn(state);
  }

  if (action === "flee") {
    const roll = d20();
    const total = roll + Math.floor((stats.SPD - 5) / 2);
    if (total >= 12) {
      log.push(`${actor.name} cuts a line out. The squad follows.`);
      combat.log = log;
      state.combat = combat;
      return finishCombat(state, false, true);
    }
    log.push(`${actor.name} cannot shake them (${roll}).`);
    combat.log = log.slice(-12);
    state.combat = combat;
    return enemyTurn(state);
  }

  if (action === "skill") {
    log.push(`${actor.name} leans on ${actor.skillName}. ${actor.skillDesc}`);
    const roll = d20();
    const total = roll + Math.floor((stats[PRIMARY_STAT[actor.cls]] - 5) / 2) + 2;
    const b = band(roll);
    log.push(`${BAND_LABEL[b]} ${roll} → ${total}.`);
    if (total >= combat.enemies[0].dc - 1) {
      combat.enemies = combat.enemies.map((e, idx) =>
        idx === 0 ? { ...e, hp: Math.max(0, e.hp - (3 + (b === "crit" ? 4 : 0))) } : e,
      );
      log.push("The skill lands.");
    }
    combat.log = log.slice(-12);
    state.combat = combat;
    if (combat.enemies.every((e) => e.hp <= 0)) return finishCombat(state, true);
    return enemyTurn(state);
  }

  const roll = d20();
  const atkStat = PRIMARY_STAT[actor.cls];
  const surge = combat.surge === actor.id ? 2 : 1;
  if (combat.surge === actor.id) combat.surge = undefined;
  let total =
    roll +
    Math.floor((stats[atkStat] - 5) / 2) +
    (guarded ? -1 : 0) +
    (broken ? -8 : conditionPenalty(weapon?.condition ?? "Pristine"));
  const b = band(roll);
  if (action === "strike" && b === "fumble" && weapon && weapon.condition !== "Broken") {
    weapon.condition = degrade(weapon.condition);
    log.push(`Fumble. ${weapon.name} is ${weapon.condition}.`);
  }
  const encore = combat.encore === actor.id;
  if ((b === "fail" || b === "fumble") && encore) {
    combat.encore = undefined;
    log.push("Encore. The failure is taken back.");
    const reroll = d20();
    total = reroll + Math.floor((stats[atkStat] - 5) / 2);
    log.push(`Re-roll ${reroll} → ${total}.`);
  }
  const target = combat.enemies.find((e) => e.hp > 0);
  if (!target) return finishCombat(state, true);
  // Bringing a close-range gun to a target that fights at distance is a choice
  // the squad makes in the Vault, and it is paid for here.
  const profile = resolveWeapon(weapon);
  const reach = action === "strike" ? rangeHitMod(profile.rangeBand, target.preferredRange, profile.family) : 0;
  const swing = total + reach;
  const hit = swing >= target.dc || b === "crit";
  if (action === "guard") {
    log.push(`${actor.name} sets a guard.`);
    combat.guardId = actor.id;
  }
  if (hit && action === "strike") {
    const avg = weapon ? weaponDamageAvg(weapon.damage ?? "1d6") : 3;
    let dmg = Math.max(1, avg - Math.floor(target.def / 2) + (b === "crit" ? 4 : b === "strong" ? 2 : 0));
    const plain = dmg;
    dmg = applyArmor(dmg, profile, target);
    dmg *= surge;
    if (b === "weak") dmg = Math.max(1, Math.floor(dmg * 0.6));
    target.hp = Math.max(0, target.hp - dmg);
    combat.threat = { ...(combat.threat ?? {}), [actor.id]: (combat.threat?.[actor.id] ?? 0) + dmg };
    const matchup = dmg > plain * surge ? " Weak point." : dmg < plain * surge ? " Armor eats it." : "";
    log.push(
      `${actor.name} strikes ${target.name} for ${dmg}. ${BAND_LABEL[b]} (${roll}→${swing} vs ${target.dc}).${matchup}`,
    );
    if (target.isBoss && combat.bossId) {
      const v = villainById(combat.bossId);
      if (v) {
        const ph = enemyPhase(v, target.hp);
        if (ph !== target.phase) {
          target.phase = ph;
          applyPhase(target, v, ph);
          log.push(`${v.phases[ph].name}: ${v.phases[ph].desc}`);
          const alone = combat.enemies.every((e) => e.id === target.id || e.hp <= 0);
          if (v.phases[ph].effect?.speaks && alone) combat.reckoning = v.id;
        }
      }
    }
  } else if (action === "strike") {
    const short = reach < 0 ? " Wrong range." : "";
    log.push(`${actor.name} misses ${target.name}. ${BAND_LABEL[b]} (${roll}→${swing} vs ${target.dc}).${short}`);
  }

  combat.enemies = combat.enemies.map((e) => (e.id === target.id ? { ...target } : e));
  combat.log = log.slice(-12);
  state.combat = combat;
  // A reckoning holds the fight open: the villain is down and still owed a beat.
  if (combat.reckoning) return state;
  if (combat.enemies.every((e) => e.hp <= 0)) return finishCombat(state, true);
  return enemyTurn(state);
}

function enemyTurn(state: GameState): GameState {
  const combat = state.combat;
  if (!combat) return state;
  const log = [...combat.log];
  const party = combat.partyIds
    .map((id) => state.operatives.find((o) => o.id === id)!)
    .filter((o) => o && o.hp > 0);
  if (!party.length) {
    combat.log = log;
    state.combat = combat;
    return finishCombat(state, false);
  }
  const bossPhase = combat.bossId ? villainById(combat.bossId)?.phases : undefined;
  combat.enemies
    .filter((e) => e.hp > 0)
    .forEach((e) => {
      const up = party.filter((p) => p.hp > 0);
      const focused = e.isBoss && bossPhase?.[e.phase ?? 0]?.effect?.focus;
      const target = (focused ? topThreat(combat, up.length ? up : party) : null)
        ?? pick(up.length ? up : party);
      if (!target) return;
      const roll = d20();
      const stats = computeStats(target);
      const dc = 8 + Math.floor(stats.DEF / 2);
      const guard = combat.guardId === target.id;
      const shield = combat.shield;
      if (shield) {
        combat.shield = undefined;
        log.push(`${e.name} hits nothing. Shield Block.`);
        return;
      }
      const hit = roll + e.atk >= dc + (guard ? 2 : 0);
      if (hit) {
        const dmg = Math.max(1, e.atk - Math.floor(stats.DEF / 4) + (roll >= 18 ? 2 : 0));
        const i = state.operatives.findIndex((o) => o.id === target.id);
        const hp = Math.max(0, target.hp - dmg);
        state.operatives[i] = {
          ...state.operatives[i],
          hp,
          status: hp <= 0 ? "downed" : state.operatives[i].status,
        };
        target.hp = hp;
        log.push(`${e.name} hits ${target.name} for ${dmg}.`);
        if (hp <= 0) log.push(`${target.name} is downed.`);
      } else {
        log.push(`${e.name} fails to land on ${target.name}.`);
      }
    });
  combat.guardId = undefined;
  combat.turn += 1;
  combat.actorIndex += 1;
  combat.log = log.slice(-12);
  state.combat = combat;
  const anyUp = combat.partyIds.some((id) => {
    const o = state.operatives.find((x) => x.id === id);
    return o && o.hp > 0;
  });
  if (!anyUp) return finishCombat(state, false);
  return state;
}

export function finishCombat(state: GameState, won: boolean, fled = false): GameState {
  const combat = state.combat;
  if (!combat) return state;
  if (won) {
    const payout = Math.round((120 + locById(combat.locationId).danger * 40) * combat.rewardMult);
    state.coins += payout;
    grantXp(state, combat.bossId ? 28 : 8);
    // The fight's own log dies with the overlay. A villain's last word belongs
    // in the debrief, where the squad is still standing there reading it.
    const dying = !fled && combat.bossId ? villainById(combat.bossId) : null;
    const farewell = dying?.lastWord ? [`${dying.name}: "${dying.lastWord}"`] : [];
    if (dying?.lastWord) pushLog(state, "note", dying.name, dying.lastWord);
    if (state.mission) {
      state.mission.coins += payout;
      state.mission.narrative = [
        ...state.mission.narrative,
        ...farewell,
        fled ? "They left a body and a question." : `The field goes still. +${payout} caps.`,
      ];
    }
    if (combat.bossId) {
      const loc = combat.locationId;
      state.locations[loc].bossDefeated = true;
      grantPackLoot(state, { sure: true, source: "Boss" });
      const v = villainById(combat.bossId);
      if (v) {
        const relic = makeItem({
          name: v.lootName,
          kind: "trinket",
          rarity: v.id === "warden" ? "Mythic" : "Legendary",
          condition: "Pristine",
          slot: "trinket",
          effect: "Arc trophy. +1 all rolls in this region.",
          lore: v.tagline,
          value: 5000,
        });
        state.vault.push(relic);
        if (v.id === "warden") state.challengeCoin = true;
        state.moonFavor += 8;
        pushLog(state, "combat", v.name, `Fallen. ${v.lootName} recovered.`);
        state.toast = `${v.name} is down. ${v.arc} breaks.`;
      }
    }
    pushLog(state, "combat", "SYNAPSE", won ? "The field is ours." : "We left.");
  } else if (!fled) {
    pushLog(state, "combat", "SYNAPSE", "The field took them. Get them home.");
    state.toast = "The squad is downed. Extract to HQ.";
  }
  state.combat = null;
  if (state.mission) {
    state.mission.waiting = false;
    state.mission.combatQueued = false;
  }
  return state;
}

export function restOvernight(state: GameState): GameState {
  state.day += 1;
  const bunk = state.quarters.bunk;
  const hearth = state.quarters.hearth;
  state.operatives = state.operatives.map((o) => {
    if (o.status === "dead") return o;
    if (o.status === "downed") {
      if (state.rooms.infirmary >= 1) {
        return { ...o, hp: 1, status: "idle" as const, location: "hq" as const, giftUsed: false };
      }
      return { ...o, status: "dead" as const, notes: `Claimed by the void on day ${state.day}.` };
    }
    let hp = o.hp;
    if (bunk >= 3) hp = o.maxHp;
    else hp = Math.min(o.maxHp, hp + 2 + bunk);
    let maxHp = o.maxHp;
    if (bunk >= 2) maxHp = CLASS_HP[o.cls] + 2;
    let companion = o.companion;
    if (companion) {
      if (hearth >= 3) companion = { ...companion, hp: companion.maxHp, status: "active" };
      else if (hearth >= 1)
        companion = {
          ...companion,
          hp: Math.min(companion.maxHp, companion.hp + 1),
          status: companion.hp + 1 > 0 ? "active" : companion.status,
        };
    }
    return { ...o, hp, maxHp, giftUsed: false, status: "idle" as const, location: "hq" as const, companion };
  });
  const deaths = state.operatives.filter((o) => o.status === "dead" && o.notes.includes(`day ${state.day}`));
  deaths.forEach((o) => pushLog(state, "death", o.name, "Permanently dead. The infirmary was not ready."));
  state.shop = rollShop(state.day);
  state.bounty = rollBounty(state);
  syncWorldUnlocks(state);

  const roll = Math.random();
  const watched = state.rooms.watchtower >= 1 || state.residents.some((r) => r.role === "guard");
  if (roll < 0.18 && state.rooms.barracks < 2 && state.coins > 80) {
    if (watched && Math.random() < 0.7) {
      state.nightNote = "Night raid. The watch turned them back.";
    } else {
      const stolen = Math.min(180, Math.round(state.coins * 0.08));
      const lock = state.quarters.lockbox;
      const kept = lock >= 3 ? 0.25 : lock >= 2 ? 0.5 : lock >= 1 ? 0.75 : 1;
      const loss = Math.round(stolen * kept);
      state.coins = Math.max(0, state.coins - loss);
      state.nightNote = loss
        ? `Night raid. The compound lost ${loss} caps. Raise the Barracks.`
        : "Night raid. The lockbox held.";
    }
  } else if (roll < 0.3) {
    state.nightNote = "A Dust-Walker trades whispers at the gate. Intel +1 on Ironclad.";
    state.locations.ironclad.intel += 1;
  } else if (roll < 0.4) {
    state.ore += 1;
    state.nightNote = "Krell's runners leave a crate. +1 Hollow Ore.";
  } else {
    state.nightNote = "Tyrone holds the CRT. The compound sleeps.";
  }
  if (state.residents.some((r) => r.role === "spymaster")) {
    const open = WORLD.filter((w) => w.id !== "hq" && state.locations[w.id].unlocked);
    if (open.length) {
      const t = pick(open);
      state.locations[t.id].intel += 1;
      state.nightNote = `${state.nightNote} Spymaster marks ${t.short}.`;
    }
  }
  grantXp(state, 6);
  pushLog(state, "session", "HQ", `Day ${state.day} begins. ${state.nightNote}`);
  if (state.tutorial === "rest") state.tutorial = "done";
  state.toast = `Dawn of day ${state.day}.`;
  queueTalk(state, "dawn");
  return state;
}

export function nextObjective(state: GameState): { text: string; screen: Screen; cta: string; opId?: string } {
  if (!state.started)
    return { text: "Log in with Discord. Tyrone is already on the line.", screen: "title", cta: "Login" };
  if (state.tutorial === "briefing" && !characterForged(state))
    return { text: "Read the briefing. Then cut your file in the Machine Shop.", screen: "forge", cta: "Forge" };
  if (state.tutorial === "forge" && !characterForged(state))
    return { text: "Two rerolls. Then stamp. The file does not open again.", screen: "forge", cta: "Forge" };
  if (state.operatives.filter((o) => o.status !== "dead").length === 0) {
    if (characterForged(state))
      return { text: "Your file is closed. The Machine Shop will not cut a second soul.", screen: "hq", cta: "HQ" };
    return { text: "Cut your file in the Machine Shop. Two rerolls. Then it locks.", screen: "forge", cta: "Forge" };
  }
  if (state.tutorial === "sortie")
    return { text: "Open the map. Send them into Ironclad.", screen: "map", cta: "Deploy" };
  if (state.tutorial === "rest")
    return { text: "They are home. Rest at HQ to reset gifts and heal.", screen: "hq", cta: "Rest" };
  const downed = state.operatives.find((o) => o.status === "downed");
  if (downed)
    return {
      text: `${downed.name} is downed. The Infirmary — or they die at dawn.`,
      screen: "roster",
      cta: "Roster",
      opId: downed.id,
    };
  const wounded = state.operatives.find((o) => o.hp < o.maxHp && o.status === "idle");
  if (wounded && state.rooms.infirmary >= 1)
    return { text: `${wounded.name} needs the Infirmary.`, screen: "roster", cta: "Heal", opId: wounded.id };
  const broken = state.operatives.find((o) => o.inventory.some((i) => i.equipped && i.condition === "Broken"));
  if (broken)
    return { text: `${broken.name}'s weapon is broken. Pay the Forge.`, screen: "roster", cta: "Repair", opId: broken.id };
  if (state.coins < 350)
    return { text: "Caps are thin. Deploy a forage or crack a crate.", screen: "map", cta: "Deploy" };
  const ironclad = state.locations.ironclad;
  if (ironclad.bossUnlocked && !ironclad.bossDefeated)
    return { text: "Gravenor holds Ironclad. Arc I is open — it is someone's turn.", screen: "map", cta: "Hunt" };
  const nextBoss = WORLD.find(
    (w) => w.id !== "hq" && state.locations[w.id].bossUnlocked && !state.locations[w.id].bossDefeated,
  );
  if (nextBoss)
    return {
      text: `${villainById(nextBoss.bossId)?.name} waits in ${nextBoss.short}.`,
      screen: "map",
      cta: "Hunt",
    };
  if (state.coins >= 1400 && state.rooms.forge === 0)
    return { text: "Upgrade the Forge. Fumbles are eating steel.", screen: "hq", cta: "Raise" };
  if (idleAtHq(state).length)
    return { text: "Deploy a sortie. The Hollow does not wait.", screen: "map", cta: "Deploy" };
  return { text: "Keep the books. Keep the people. Keep the signal.", screen: "hq", cta: "HQ" };
}

export function nextHint(state: GameState): string {
  return nextObjective(state).text;
}

export function nextRoomCost(state: GameState, room: keyof GameState["rooms"]): number | null {
  const cur = state.rooms[room];
  const tiers = BASE_ROOMS[room].tiers;
  if (cur >= tiers.length) return null;
  const cost = tiers[cur].cost;
  if (cost === 0 && cur === 0 && room === "vault") {
    if (cur + 1 >= tiers.length) return null;
    return tiers[1].cost;
  }
  if (cost === 0 && cur > 0) return null;
  return cost || (cur === 0 ? tiers[0].cost : null);
}

export function nextQuarterCost(state: GameState, q: keyof GameState["quarters"]): number | null {
  const cur = state.quarters[q];
  const tiers = QUARTERS[q].tiers;
  if (cur >= tiers.length) return null;
  return tiers[cur].cost;
}

export function cloneState(s: GameState): GameState {
  return structuredClone(s);
}

export function hireResidentCost(state: GameState): number {
  return 400 + state.residents.length * 160;
}

export function companionCost(type: string): number {
  return COMPANIONS[type]?.cost ?? 900;
}

export function characterForged(state: GameState): boolean {
  return state.operatives.length > 0;
}

export const FORGE_REROLLS = 2;

export function hasPlayerProfile(state: GameState): boolean {
  return Boolean(state.playerName?.trim());
}

export function stampPlayerProfile(state: GameState, name: string, handle?: string | null): string | null {
  const clean = name.trim().replace(/^@/, "").slice(0, 24);
  const hid = (handle ?? "").trim().replace(/^@/, "").slice(0, 32);
  if (state.playerName?.trim() && state.playerHandle) {
    return null;
  }
  if (clean.length < 2) return "Stamp a name first, partner.";
  state.playerName = state.playerName?.trim() || clean;
  if (hid.length >= 2 && !state.playerHandle) state.playerHandle = hid;
  return stampSeatedPlate(state);
}

export function syncWorldUnlocks(state: GameState) {
  const open = campaignOpenRegions(state.day, state.locations);
  for (const region of open) {
    const loc = REGION_LOCATION[region];
    if (state.locations[loc]) state.locations[loc].unlocked = true;
  }
  if (!open.includes("veyra") && state.locations.veyra) {
    state.locations.veyra.unlocked = false;
  }
}

export function spawnAegisYard(state: GameState): GameState {
  const idle = idleAtHq(state);
  const party = (idle.length ? idle : living(state)).slice(0, 3).map((o) => o.id);
  const enemy: Combatant = {
    id: uid("aegis"),
    name: "AEGIS 2753",
    hp: 28,
    maxHp: 28,
    atk: 7,
    def: 5,
    dc: 14,
    tags: ["aegis", "powered"],
    flavor: "Kane leftover on the porch. Serial still warm.",
    armorClass: "powered",
  };
  state.combat = {
    locationId: "hq",
    missionKind: "raid",
    partyIds: party,
    enemies: [enemy],
    turn: 1,
    actorIndex: 0,
    log: ["A 2753 frame is on the porch. Tyrone did not invite it."],
    rewardMult: 1.4,
  };
  return state;
}

export type { ShopOffer, Resident };
