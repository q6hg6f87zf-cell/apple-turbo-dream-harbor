export type ClassName =
  | "Warrior"
  | "Wizard"
  | "Rogue"
  | "Healer"
  | "Merchant"
  | "Bard";

export type StatKey = "STR" | "DEF" | "INT" | "WIS" | "SPD" | "CHA" | "LCK";

export type Rarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Legendary"
  | "Mythic"
  | "Cursed";

export type Condition = "Pristine" | "Worn" | "Damaged" | "Broken";

export type ItemKind =
  | "weapon"
  | "armor"
  | "trinket"
  | "consumable"
  | "enchantment"
  | "attachment"
  | "material"
  | "special";

export type InventoryCategory = "all" | ItemKind | "ammo";
export type InventoryScope = "all" | "vault" | "operatives";
export type InventorySort = "name" | "rarity" | "condition" | "value" | "owner";

/** Ballistic / energy / heavy families used by rifles, attachments and ammo. */
export type WeaponFamily =
  | "melee"
  | "pistol"
  | "smg"
  | "rifle"
  | "shotgun"
  | "sniper"
  | "energy"
  | "heavy";

export type AttachmentSlot =
  | "optic"
  | "muzzle"
  | "barrel"
  | "mag"
  | "stock"
  | "underbarrel"
  | "receiver";

export type AmmoType =
  | "9mm"
  | ".45"
  | "5.56"
  | ".30-30"
  | ".270"
  | ".30-06"
  | ".308"
  | ".300"
  | "12g"
  | "bb"
  | "rail"
  | "bolt"
  | "cell"
  | "laser";

export type AmmoGrade = "surplus" | "ball" | "plus" | "match" | "special";


export type ArmorClass = "soft" | "plate" | "powered" | "phase" | "beast" | "machine";

export type RangeBand = "close" | "mid" | "long";

/** Optional rifle / attachment / ammo fields. Missing on old saves; hydrate at use. */
export interface WeaponSpec {
  weaponFamily?: WeaponFamily;
  ammoType?: AmmoType;
  rangeBand?: RangeBand;
  ap?: number;
  accuracy?: number;
  recoil?: number;
  attachmentSlot?: AttachmentSlot;
  fitsFamilies?: WeaponFamily[];
  sockets?: Partial<Record<AttachmentSlot, string>>;
  ammoCount?: number;
  mag?: number;
  magSize?: number;
  /** Stamped when a mag is seated from a named box. Factory loads leave this empty. */
  ammoLoad?: string;
  ammoGrade?: AmmoGrade;
  loadAp?: number;
  loadDamage?: number;
  loadAccuracy?: number;
}

export interface InventoryViewState {
  category: InventoryCategory;
  scope: InventoryScope;
  sort: InventorySort;
  query: string;
  equippedOnly: boolean;
  selectedItemId: string | null;
}

export type RoomId =
  | "vault"
  | "barracks"
  | "forge"
  | "infirmary"
  | "watchtower"
  | "ledger";

export type QuarterId = "bunk" | "lockbox" | "hearth";

/** Canonical Hollow Realm regions for the rebuilt planetary overworld. */
export type RegionId =
  | "ironclad"
  | "slagtown"
  | "blackspire"
  | "brasswater"
  | "veyra";

/** Legacy runtime IDs stay in place until engine/save migration is complete. */
export type LegacyRegionId = "kingdom" | "caverns" | "library";

export type LocationId =
  | "hq"
  | "ironclad"
  | "kingdom"
  | "caverns"
  | "library"
  | "veyra";

export type RegionBiome =
  | "industrial-frontier"
  | "slag-wastes"
  | "volcanic-highlands"
  | "metallic-wetlands"
  | "city";

export type RegionPoiKind =
  | "settlement"
  | "district"
  | "landmark"
  | "mission"
  | "merchant"
  | "dungeon"
  | "boss"
  | "facility"
  | "ruin"
  | "radio"
  | "unknown";

export interface GlobeMarker {
  lat: number;
  lon: number;
  altitude?: number;
}

export interface RegionPointOfInterest {
  id: string;
  regionId: RegionId;
  name: string;
  kind: RegionPoiKind;
  x: number;
  y: number;
  description: string;
  discovered: boolean;
  unlocked: boolean;
  danger?: number;
  missionKind?: MissionKind;
  merchantId?: string;
  bossId?: string;
  icon?: string;
  action?: PoiAction;
}

export interface RegionDefinition {
  id: RegionId;
  name: string;
  short: string;
  continent: string;
  biome: RegionBiome;
  description: string;
  danger: number;
  marker: GlobeMarker;
  mapAsset: string;
  streetAsset?: string;
  accent?: string;
  points: RegionPointOfInterest[];
}

export type PoiAction = "shop" | "listen" | "salvage" | "scout" | "home" | "boss" | "bay";

export type WorldViewMode = "globe" | "region";

export interface WorldViewState {
  mode: WorldViewMode;
  selectedRegion: RegionId | null;
  selectedPoiId: string | null;
  globeZoom: number;
}

export interface SpaceSceneSettings {
  meteors: boolean;
  orbitalDebris: boolean;
  distantTraffic: boolean;
  clouds: boolean;
  aurora: boolean;
  atmosphere: boolean;
  starParallax: boolean;
  quality: "low" | "medium" | "high";
}

export interface GameArtAssets {
  tyronePortrait: string;
  titleWide: string;
  titleTall: string;
  globeSurface?: string;
  globeClouds?: string;
  globeNightLights?: string;
  galaxyBackdrop?: string;
  regionMaps: Partial<Record<RegionId, string>>;
}

export type OperativeStatus =
  | "idle"
  | "deployed"
  | "downed"
  | "dead"
  | "infirmary";

export type TutorialStep = "briefing" | "forge" | "sortie" | "shift" | "rest" | "done";

export type Screen =
  | "title"
  | "briefing"
  | "hq"
  | "inventory"
  | "more"
  | "roster"
  | "forge"
  | "map"
  | "ledger"
  | "codex"
  | "arcade"
  | "rules"
  | "vault"
  | "squad"
  | "market"
  | "gallery"
  | "file";

export type MissionKind =
  | "scout"
  | "forage"
  | "raid"
  | "trade"
  | "bounty"
  | "boss";

export type MissionApproach = "ghost" | "standard" | "breach";

export type WatchId = "dawn" | "morning" | "midday" | "afternoon" | "dusk" | "night";

export type DayTaskKind =
  | "sortie"
  | "crates"
  | "visitor"
  | "aegis"
  | "treat"
  | "scan"
  | "repair"
  | "run"
  | "tribute"
  | "crisis"
  | "cabinet"
  | "market"
  | "tower"
  | "salvage";

export interface TaskChoice {
  id: string;
  label: string;
  blurb: string;
  need?: "caps" | "ore" | "op";
  cost?: number;
}

export interface TaskCrate {
  id: string;
  label: string;
  result: "good" | "junk" | "trap";
  payload: string;
}

export interface DayTask {
  id: string;
  kind: DayTaskKind;
  title: string;
  brief: string;
  why: string;
  watchCost: number;
  required: boolean;
  loc?: LocationId;
  poiId?: string;
  missionKind?: MissionKind;
  npcId?: string;
  choices?: TaskChoice[];
  crates?: TaskCrate[];
  status: "open" | "active" | "done" | "failed";
  report?: string;
  failNote?: string;
}

export interface ShiftState {
  day: number;
  watch: WatchId;
  watchesLeft: number;
  board: DayTask[];
  log: string[];
  activeId: string | null;
}

export type RollBand =
  | "fumble"
  | "fail"
  | "weak"
  | "success"
  | "strong"
  | "crit";

export type LogKind =
  | "session"
  | "dice"
  | "hp"
  | "death"
  | "action"
  | "loot"
  | "hq"
  | "combat"
  | "destiny"
  | "note";

export type PackKey =
  | "bobby_pin"
  | "stimpak"
  | "mentats"
  | "holotape"
  | "sarsaparilla"
  | "probe_kit";

export type PackCounts = Record<PackKey, number>;

export interface DailyClocks {
  dateKey: string;
  triviaLives: number;
  tfLives: number;
  unscramble: number;
  knowledgeDraws: number;
  lockpicks: number;
  slots: number;
  cardTap: number;
}

export type ArcadeGameId =
  | "trivia"
  | "truefalse"
  | "scramble"
  | "wordsearch"
  | "lockpick"
  | "slots"
  | "hack"
  | "cree"
  | "blackjack"
  | "roulette"
  | "poker";

export interface ArcadeState {
  triviaSeen: string[];
  tfSeen: string[];
  scrambleSeen: string[];
  creeRead: string[];
  earned: Record<ArcadeGameId, number>;
  lastGame: ArcadeGameId | null;
}

export interface ArcadePayout {
  game: ArcadeGameId;
  caps: number;
  xp: number;
  loc?: LocationId;
  moonFavor?: number;
  pack?: boolean;
  packKey?: PackKey;
  note: string;
  retireId?: string;
  retireKind?: "trivia" | "tf" | "scramble" | "cree";
}

export interface HackState {
  words: string[];
  password: string;
  tries: number;
  triesMax: number;
  dudsLeft: string[];
  log: string[];
  lastLikeness: number | null;
  locked: boolean;
  won: boolean;
}

export type TermPage =
  | "boot"
  | "home"
  | "records"
  | "squad"
  | "radio"
  | "ledger"
  | "mail"
  | "porch"
  | "lock";

export interface TermSession {
  page: TermPage;
  booted: boolean;
  output: string[];
  sessionId: string;
}

export interface Stats {
  STR: number;
  DEF: number;
  INT: number;
  WIS: number;
  SPD: number;
  CHA: number;
  LCK: number;
}

export interface RollEntry {
  r: [number, number];
  title?: string;
  name?: string;
  thread?: string;
  passive?: string;
  desc?: string;
}

export interface Item extends WeaponSpec {
  id: string;
  name: string;
  kind: ItemKind;
  rarity: Rarity;
  condition: Condition;
  slot?: "weapon" | "armor" | "trinket";
  classHint?: ClassName;
  damage?: string;
  defense?: number;
  effect: string;
  lore: string;
  equipped?: boolean;
  cursed?: boolean;
  value: number;
  tags?: string[];
  sourceRegion?: RegionId;
  discoveredDay?: number;
}

export interface CompanionState {
  type: string;
  hp: number;
  maxHp: number;
  status: "active" | "fled";
}

export interface Operative {
  id: string;
  name: string;
  cls: ClassName;
  race: string;
  lineage: string;
  origin: string;
  hp: number;
  maxHp: number;
  repTitle: string;
  repPassive: string;
  traitLevel: string;
  traitBonus: number;
  skillName: string;
  skillDesc: string;
  shadowName: string;
  shadowDesc: string;
  enchantName: string;
  enchantDesc: string;
  destiny: string;
  destinyFired: boolean;
  giftUsed: boolean;
  inventory: Item[];
  companion: CompanionState | null;
  status: OperativeStatus;
  location: LocationId;
  raids: number;
  battles: number;
  isHoF: boolean;
  curses: string[];
  notes: string;
  joinedDay: number;
  /** Rider face chosen at the Machine Shop. Missing on old saves — Portrait falls back to class. */
  portraitId?: string;
  /** d20s stamped at the forge. Missing on old saves — computeStats uses class floor. */
  statDice?: Stats;
}

export interface Resident {
  id: string;
  name: string;
  role: "guard" | "medic" | "scout" | "quartermaster" | "smith" | "spymaster";
}

export interface ShopOffer extends WeaponSpec {
  name: string;
  price: number;
  kind: ItemKind;
  rarity: Rarity;
  effect: string;
  damage?: string;
}

export interface DailyShop {
  bargain: ShopOffer;
  essential: ShopOffer;
  artifact: ShopOffer;
  day: number;
  bought?: Partial<Record<"bargain" | "essential" | "artifact", boolean>>;
}

export interface MarketLot extends WeaponSpec {
  id: string;
  name: string;
  kind: ItemKind;
  rarity: Rarity;
  effect: string;
  lore: string;
  value: number;
  price: number;
  qty: number;
  sourceRegion: RegionId;
  visitor?: boolean;
  classHint?: ClassName;
  damage?: string;
  defense?: number;
  slot?: "weapon" | "armor" | "trinket";
}

export interface VisitingMerchant {
  id: string;
  name: string;
  title: string;
  blurb: string;
  regionId: RegionId;
  portrait?: string;
}

export interface MarketState {
  day: number;
  lots: MarketLot[];
  visitor: VisitingMerchant | null;
}

export interface PoiWatchLog {
  day: number;
  used: string[];
}

export interface Bounty {
  id: string;
  name: string;
  type: string;
  reward: string;
  rewardCoins: number;
  location: LocationId;
  dc: number;
  hp: number;
}

export interface LogEntry {
  id: string;
  day: number;
  kind: LogKind;
  who: string;
  what: string;
  result?: number;
}

export interface Combatant {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  dc: number;
  isBoss?: boolean;
  phase?: number;
  tags: string[];
  flavor: string;
  armorClass?: ArmorClass;
  preferredRange?: RangeBand;
  resist?: string[];
  weakness?: string[];
  resistAmt?: number;
  portrait?: string;
  castId?: string;
}

export interface CombatState {
  locationId: LocationId;
  missionKind: MissionKind;
  partyIds: string[];
  enemies: Combatant[];
  turn: number;
  actorIndex: number;
  log: string[];
  pendingFlee?: boolean;
  bossId?: string;
  rewardMult: number;
  shield?: string;
  surge?: string;
  encore?: string;
  guardId?: string;
  regionId?: RegionId;
  poiId?: string;
  incomingSoft?: number;
  /** Damage each operative has dealt this fight. A focused boss hunts the top. */
  threat?: Record<string, number>;
  /** Set when a boss has entered a `speaks` phase: it is down, and owed a beat. */
  reckoning?: string;
}

export interface MissionTactic {
  id: string;
  label: string;
  blurb: string;
  stat: StatKey;
  dcMod: number;
}

export interface MissionBeat {
  id: string;
  title: string;
  prompt: string;
  stat: StatKey;
  dc: number;
  kind: "check" | "combat" | "loot" | "merchant" | "boss";
  tactics?: MissionTactic[];
  tacticId?: string;
}

export interface MissionState {
  id: string;
  locationId: LocationId;
  kind: MissionKind;
  partyIds: string[];
  beats: MissionBeat[];
  beatIndex: number;
  coins: number;
  ore: number;
  loot: Item[];
  narrative: string[];
  waiting: boolean;
  briefing?: string;
  stakes?: string;
  lastRoll?: {
    value: number;
    band: RollBand;
    total: number;
    dc: number;
    text: string;
  };
  combatQueued?: boolean;
  regionId?: RegionId;
  poiId?: string;
  approach?: MissionApproach;
  npcId?: string;
}

export interface LocationProgress {
  unlocked: boolean;
  intel: number;
  missions: number;
  bossUnlocked: boolean;
  bossDefeated: boolean;
  regionMapUnlocked?: boolean;
  discoveredPois?: string[];
}

export interface SquadMember {
  id: string;
  name: string;
  discordId: string | null;
  discordHandle: string | null;
  personalCaps: number;
  xp: number;
  note: string;
  joinedDay: number;
  lastTurnDay: number;
}

export interface ArcState {
  chapter: number;
  turn: number;
  turnMemberId: string;
  log: string[];
}

export type TyroneAssist = "off" | "minimal" | "normal" | "helpful" | "high";

export type TyroneEventType =
  | "forge"
  | "deploy"
  | "roll"
  | "mission"
  | "combat"
  | "dawn"
  | "death"
  | "downed"
  | "upgrade"
  | "hack"
  | "buy"
  | "rest"
  | "promise"
  | "ask"
  | "region"
  | "boss"
  | "fit";

export interface TyroneEpisode {
  id: string;
  day: number;
  ticks: number;
  type: TyroneEventType;
  locationId?: string;
  regionId?: string;
  poiId?: string;
  operativeIds: string[];
  missionKind?: string;
  description: string;
  outcome?: string;
  importance: number;
  weight: number;
  tags: string[];
  permanent: boolean;
  recalled: number;
}

export interface TyroneFact {
  id: string;
  claim: string;
  evidence: number;
  tags: string[];
}

export interface TyronePromise {
  id: string;
  text: string;
  poiId?: string;
  locationId?: string;
  day: number;
  kept?: boolean;
}

export interface TyroneBond {
  trust: number;
  familiarity: number;
  respect: number;
  conflict: number;
  sharedHistory: number;
  humor: number;
  concern: number;
  loyalty: number;
}

export interface TyroneWorking {
  actions: string[];
  lastRegion: string | null;
  lastPoi: string | null;
  lastAsk: string | null;
}

export interface TyroneMind {
  episodic: TyroneEpisode[];
  semantic: TyroneFact[];
  story: string[];
  promises: TyronePromise[];
  relationship: TyroneBond;
  settings: { assist: TyroneAssist; showNumbers: boolean };
  cooldowns: Record<string, number>;
  lastSpeechAt: number;
  lastSpeechConcept: string | null;
  lastSilentReason: string;
  lastSpeakReason: string;
  speechCount: number;
  failedBeats: Record<string, number>;
  working: TyroneWorking;
  utterance: string | null;
}

export interface TravisBay {
  fitted: string[];
  paid: number;
  jobs: number;
}

/** Re-export shape from narrative-state (type-only circular import is fine). */
export type NarrativeState = import("./narrative-state").NarrativeState

export interface GameState {
  version: number;
  started: boolean;
  tutorial: TutorialStep;
  screen: Screen;
  openedFrom: Screen | null;
  day: number;
  coins: number;
  ore: number;
  moonFavor: number;
  xp: number;
  level: number;
  xpToNext: number;
  rooms: Record<RoomId, number>;
  quarters: Record<QuarterId, number>;
  residents: Resident[];
  vault: Item[];
  pack: PackCounts;
  clocks: DailyClocks;
  mentatsLuck: number;
  hackProbes: number;
  terminalDrained: boolean;
  terminalLockDay: number;
  hack: HackState | null;
  term: TermSession | null;
  operatives: Operative[];
  shop: DailyShop | null;
  market: MarketState | null;
  poiWatch: PoiWatchLog;
  bounty: Bounty | null;
  locations: Record<LocationId, LocationProgress>;
  mission: MissionState | null;
  combat: CombatState | null;
  log: LogEntry[];
  challengeCoin: boolean;
  selectedId: string | null;
  selectedLoc: LocationId | null;
  toast: string | null;
  nightNote: string | null;
  ticks: number;
  lastParty: string[];
  discordId: string | null;
  discordName: string | null;
  playerName: string | null;
  playerHandle: string | null;
  talk: { script: string; i: number } | null;
  seenTalk: string[];
  talkQueue: string[];
  squad: SquadMember[];
  activeMemberId: string | null;
  arc: ArcState | null;
  worldView?: WorldViewState;
  inventoryView?: InventoryViewState;
  spaceScene?: SpaceSceneSettings;
  kaneHeat: number;
  metCast: string[];
  selectedPoiId: string | null;
  regionMapOpen: boolean;
  shift: ShiftState;
  arcade: ArcadeState;
  tyrone: TyroneMind;
  travis: TravisBay;
  /** Story spine, flags, journal — optional on old saves; restored with defaults. */
  narrative?: NarrativeState;
}
