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
  | "material"
  | "special";

export type InventoryCategory = "all" | ItemKind;
export type InventoryScope = "all" | "vault" | "operatives";
export type InventorySort = "name" | "rarity" | "condition" | "value" | "owner";

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
}

export interface RegionDefinition {
  id: RegionId;
  name: string;
  short: string;
  biome: RegionBiome;
  description: string;
  danger: number;
  marker: GlobeMarker;
  mapAsset: string;
  accent?: string;
  points: RegionPointOfInterest[];
}

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

export type Screen =
  | "title"
  | "briefing"
  | "hq"
  | "world"
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
  | "squad";

export type MissionKind =
  | "scout"
  | "forage"
  | "raid"
  | "trade"
  | "bounty"
  | "boss";

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

export interface Item {
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
}

export interface Resident {
  id: string;
  name: string;
  role: "guard" | "medic" | "scout" | "quartermaster" | "smith" | "spymaster";
}

export interface ShopOffer {
  name: string;
  price: number;
  kind: ItemKind;
  rarity: Rarity;
  effect: string;
}

export interface DailyShop {
  bargain: ShopOffer;
  essential: ShopOffer;
  artifact: ShopOffer;
  day: number;
  bought?: Partial<Record<"bargain" | "essential" | "artifact", boolean>>;
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
}

export interface MissionBeat {
  id: string;
  title: string;
  prompt: string;
  stat: StatKey;
  dc: number;
  kind: "check" | "combat" | "loot" | "merchant" | "boss";
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

export interface GameState {
  version: number;
  started: boolean;
  tutorial: "briefing" | "forge" | "sortie" | "rest" | "done";
  screen: Screen;
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
  operatives: Operative[];
  shop: DailyShop | null;
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
  talk: { script: string; i: number } | null;
  seenTalk: string[];
  talkQueue: string[];
  squad: SquadMember[];
  activeMemberId: string | null;
  arc: ArcState | null;
  worldView?: WorldViewState;
  inventoryView?: InventoryViewState;
  spaceScene?: SpaceSceneSettings;
}
