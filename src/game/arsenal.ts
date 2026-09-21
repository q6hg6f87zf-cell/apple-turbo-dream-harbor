import { gradeFromLoad } from "./ammo-matrix";
import type {
  AmmoType,
  AttachmentSlot,
  ClassName,
  ItemKind,
  LocationId,
  LocationProgress,
  Rarity,
  RangeBand,
  RegionId,
  WeaponFamily,
  WeaponSpec,
} from "./types";

/** Structurally compatible with CatalogItem. Do not import hollow-catalog (cycle). */
export type ArsenalEntry = {
  name: string;
  kind: ItemKind;
  rarity: Rarity;
  effect: string;
  lore: string;
  value: number;
  sourceRegion: RegionId;
  classHint?: ClassName;
  damage?: string;
  defense?: number;
  unlockDay?: number;
  unlockRegion?: RegionId;
} & WeaponSpec;

const SKIP = new Set([
  "Railspike Carbine",
  "Obsidian Coilgun",
  "Coil-Harpoon",
  "Arc Lance",
  "Gatekeeper Shotcaster",
  "Stormcoil Pistol",
  "2753 Rail",
  "Grav-Shear Knife",
  "Blast-Vent Maul",
  "Phase Baton",
  "Vault 13 Work Knife",
  "Spire Needle",
  "Dockhook",
  "Molten Chain",
  "Slagglass Shiv",
]);

const BRANDS: Record<
  RegionId,
  { prefix: string; smith: string; lore: string; rarityBump: number; value: number }
> = {
  ironclad: {
    prefix: "Watchworks",
    smith: "the Iron Gate smiths",
    lore: "Stamped Watchworks. Repairable with a rail tooth and a bad attitude.",
    rarityBump: 0,
    value: 1,
  },
  slagtown: {
    prefix: "Union Forge",
    smith: "the furnace floor",
    lore: "Union Forge heat-treat. The grip still smells like coke.",
    rarityBump: 1,
    value: 1.12,
  },
  blackspire: {
    prefix: "Nine-Lift",
    smith: "Lift Nine's cage brokers",
    lore: "Nine-Lift issue. Cold enough to bite through gloves.",
    rarityBump: 2,
    value: 1.28,
  },
  brasswater: {
    prefix: "Dockcoil",
    smith: "the tide fences",
    lore: "Dockcoil brass. The serial is underwater more often than not.",
    rarityBump: 1,
    value: 1.18,
  },
  veyra: {
    prefix: "Surplus 2753",
    smith: "Kane's leftover crates",
    lore: "Surplus 2753. Clean lines. No receipt. Kane would call this theft.",
    rarityBump: 2,
    value: 1.45,
  },
};

const RARITY_LADDER: Rarity[] = ["Common", "Uncommon", "Rare", "Legendary", "Mythic"];

function bumpRarity(base: Rarity, n: number): Rarity {
  const i = Math.min(RARITY_LADDER.length - 1, Math.max(0, RARITY_LADDER.indexOf(base) + n));
  return RARITY_LADDER[i]!;
}

type Frame = {
  stem: string;
  family: WeaponFamily;
  ammoType: AmmoType;
  rangeBand: RangeBand;
  damage: string;
  ap: number;
  accuracy: number;
  recoil: number;
  magSize: number;
  classHint: ClassName;
  effect: string;
  value: number;
  rarity: Rarity;
  spend?: number;
  unlockDay?: number;
  unlockRegion?: RegionId;
  regions?: RegionId[];
  /** What the gun is actually like to carry and fire. Written for the player. */
  read?: string;
  /** What it is for, and what it is not for. */
  doctrine?: string;
};

const RANGE_READ: Record<RangeBand, string> = {
  close: "Close is home: inside a room, across a stall, over a gate.",
  mid: "Mid is home: yard to yard, street to street, across a rail cut.",
  long: "Long is home: ridge to ridge. Anything inside thirty feet is a problem you brought on yourself.",
};

const RECOIL_READ = [
  "It barely moves. You can call your own shots.",
  "A polite push. The sights come back on their own.",
  "It climbs. Second shot is yours if you are honest about the first.",
  "It fights you every round. Recoil is a lifestyle, not a statistic.",
];

const AP_READ = [
  "It does not punch plate. Find the gaps or find another gun.",
  "It will open soft armour and argue with plate.",
  "It gets through plate if you have the angle.",
  "Plate is a suggestion at this end of the barrel.",
];

const FRAMES: Frame[] = [
  {
    stem: "BB Rifle",
    family: "rifle",
    ammoType: "bb",
    rangeBand: "close",
    damage: "1d3",
    ap: 0,
    accuracy: 2,
    recoil: 0,
    magSize: 40,
    classHint: "Rogue",
    effect: "Spring-air BB rifle. 1d3. No report worth hearing — a hit never raises the alarm.",
    value: 60,
    rarity: "Common",
    read:
      "A pre-collapse spring-air rifle with a forty-shot tube under the barrel and a stock somebody has re-glued twice.",
    doctrine:
      "It will not kill a Slag-Hound and it was never going to. What it does is put out a lamp, drop a bird, break a window on the far side of a yard, and make no sound anyone will come to investigate. Every rider in the Realm learns to shoot on one of these, and the good ones never quite stop carrying it.",
  },
  { stem: "Service Pistol", family: "pistol", ammoType: "9mm", rangeBand: "mid", damage: "1d6", ap: 0, accuracy: 1, recoil: 0, magSize: 8, classHint: "Rogue", effect: "Sidearm. +1 accuracy at mid.", value: 220, rarity: "Common" },
  { stem: "Heavy Pistol", family: "pistol", ammoType: ".45", rangeBand: "close", damage: "1d8", ap: 1, accuracy: 0, recoil: 1, magSize: 6, classHint: "Warrior", effect: "AP 1. Close argument.", value: 340, rarity: "Common" },
  { stem: "Machine Pistol", family: "smg", ammoType: "9mm", rangeBand: "close", damage: "1d6", ap: 0, accuracy: -1, recoil: 2, magSize: 18, classHint: "Rogue", effect: "Spends 2 rounds per strike.", value: 480, rarity: "Uncommon", spend: 2 },
  { stem: "Subgun", family: "smg", ammoType: ".45", rangeBand: "close", damage: "1d8", ap: 0, accuracy: 0, recoil: 2, magSize: 16, classHint: "Warrior", effect: "Spends 2 rounds per strike.", value: 620, rarity: "Uncommon", spend: 2 },
  { stem: "M4 Carbine", family: "rifle", ammoType: "5.56", rangeBand: "close", damage: "1d8", ap: 0, accuracy: 1, recoil: 1, magSize: 20, classHint: "Rogue", effect: "M4 pattern. Short 5.56. Handy in alleys.", value: 720, rarity: "Uncommon" },
  { stem: "M16 Service", family: "rifle", ammoType: "5.56", rangeBand: "mid", damage: "1d8+1", ap: 0, accuracy: 1, recoil: 1, magSize: 20, classHint: "Warrior", effect: "M16 pattern. 5.56 workhorse. Mid is home.", value: 900, rarity: "Uncommon" },
  { stem: "M94 Lever", family: "rifle", ammoType: ".30-30", rangeBand: "mid", damage: "1d8+1", ap: 0, accuracy: 1, recoil: 0, magSize: 7, classHint: "Warrior", effect: "M94 lever. Tube mag. Close and mid are home.", value: 740, rarity: "Common" },
  { stem: "M336 Brush", family: "rifle", ammoType: ".30-30", rangeBand: "close", damage: "1d10", ap: 0, accuracy: 1, recoil: 0, magSize: 6, classHint: "Warrior", effect: "M336 brush gun. Tube mag. Woods and gates.", value: 880, rarity: "Uncommon" },
  { stem: "M700 Survey", family: "rifle", ammoType: ".270", rangeBand: "long", damage: "1d10", ap: 0, accuracy: 2, recoil: 1, magSize: 4, classHint: "Rogue", effect: "M700 bolt. Hunting .270. Long is home. Flat as a rumor.", value: 1280, rarity: "Uncommon" },
  {
    stem: "M70 Springfield",
    family: "rifle",
    ammoType: ".30-06",
    rangeBand: "long",
    damage: "1d10+1",
    ap: 1,
    accuracy: 1,
    recoil: 2,
    magSize: 5,
    classHint: "Warrior",
    effect: "M70 bolt in .30-06. AP 1. Beasts and plate both notice.",
    value: 1480,
    rarity: "Uncommon",
    read:
      "A controlled-round-feed bolt gun with a five-round internal box and a claw extractor you could hang a truck off.",
    doctrine:
      "The .30-06 is the Realm's honest cartridge: a hundred-plus years of load data, a case that will take anything from a soft point to a steel-core, and enough powder behind it to make plate carriers an opinion rather than a fact. The M70 is the cheapest way to own that. It is slow, it is five rounds, and every one of them arrives.",
  },
  {
    stem: "M1903 Marksman",
    family: "sniper",
    ammoType: ".30-06",
    rangeBand: "long",
    damage: "1d12",
    ap: 2,
    accuracy: 3,
    recoil: 2,
    magSize: 5,
    classHint: "Rogue",
    effect: "M1903 pattern in .30-06. AP 2, +3 accuracy at long. Close is a mistake.",
    value: 2400,
    rarity: "Rare",
    unlockRegion: "slagtown",
    read:
      "A stripped 1903 service rifle on a bedded stock, stripper-clip cut still in the receiver, glass sitting low over a two-stage trigger.",
    doctrine:
      "This is what the '06 was built around before anything else was. Match-grade brass, a barrel that has been shot in and not shot out, and a five-round clip that drops straight down through the bridge. It out-ranges every ballistic weapon on the frontier and it punishes anyone who brings it into a room.",
  },
  { stem: "M14 Battle", family: "rifle", ammoType: ".308", rangeBand: "mid", damage: "1d10", ap: 1, accuracy: 0, recoil: 2, magSize: 10, classHint: "Warrior", effect: "M14 battle. .308. AP 1. Punches plate if you sit still.", value: 1400, rarity: "Rare" },
  { stem: "M10 Battle", family: "rifle", ammoType: ".308", rangeBand: "mid", damage: "1d10+1", ap: 1, accuracy: 1, recoil: 2, magSize: 10, classHint: "Warrior", effect: "M10 pattern. Modern .308. Mag dumps with manners.", value: 1680, rarity: "Rare" },
  { stem: "M24 Marksman", family: "sniper", ammoType: ".308", rangeBand: "long", damage: "1d12", ap: 1, accuracy: 2, recoil: 2, magSize: 5, classHint: "Rogue", effect: "M24 bolt. .308 long. Close is a problem.", value: 1800, rarity: "Rare" },
  { stem: "M70 Magnum", family: "sniper", ammoType: ".300", rangeBand: "long", damage: "1d12+1", ap: 2, accuracy: 1, recoil: 3, magSize: 3, classHint: "Warrior", effect: "M70 magnum. .300 Win Mag. AP 2. Recoil is a lifestyle.", value: 2600, rarity: "Rare", unlockRegion: "blackspire" },
  { stem: "Pump", family: "shotgun", ammoType: "12g", rangeBand: "close", damage: "2d4", ap: 0, accuracy: 0, recoil: 2, magSize: 5, classHint: "Warrior", effect: "Close shreds. Long is a rumor.", value: 560, rarity: "Common" },
  { stem: "Combat Shotgun", family: "shotgun", ammoType: "12g", rangeBand: "close", damage: "2d6", ap: 0, accuracy: 1, recoil: 2, magSize: 6, classHint: "Warrior", effect: "Close shreds beasts and doors.", value: 1100, rarity: "Uncommon" },
  { stem: "Coil Pistol", family: "energy", ammoType: "cell", rangeBand: "mid", damage: "1d8", ap: 1, accuracy: 1, recoil: 0, magSize: 12, classHint: "Wizard", effect: "AP 1 coil. Plate shrugs unless charged.", value: 1600, rarity: "Rare" },
  { stem: "Arc Rifle", family: "energy", ammoType: "cell", rangeBand: "mid", damage: "1d10", ap: 2, accuracy: 1, recoil: 1, magSize: 10, classHint: "Wizard", effect: "AP 2 coil. Punches powered plate.", value: 2800, rarity: "Rare" },
  { stem: "Phase Carbine", family: "energy", ammoType: "cell", rangeBand: "mid", damage: "1d8+1", ap: 1, accuracy: 2, recoil: 0, magSize: 12, classHint: "Rogue", effect: "Phase-tuned coil. Weak to nothing that bleeds.", value: 2400, rarity: "Rare" },
  { stem: "L4 Pulse", family: "energy", ammoType: "laser", rangeBand: "mid", damage: "1d8", ap: 1, accuracy: 2, recoil: 0, magSize: 16, classHint: "Wizard", effect: "L4 pulse laser. AP 1. Coil cells will not seat.", value: 2400, rarity: "Rare", unlockRegion: "blackspire", regions: ["blackspire", "brasswater", "veyra"] },
  { stem: "L6 Carbine", family: "energy", ammoType: "laser", rangeBand: "mid", damage: "1d10", ap: 2, accuracy: 2, recoil: 0, magSize: 20, classHint: "Rogue", effect: "L6 laser carbine. AP 2. No recoil. Powered plate notices.", value: 3800, rarity: "Rare", unlockRegion: "brasswater", regions: ["brasswater", "veyra"] },
  { stem: "L8 Rifle", family: "energy", ammoType: "laser", rangeBand: "long", damage: "1d10+2", ap: 2, accuracy: 3, recoil: 0, magSize: 18, classHint: "Wizard", effect: "L8 coherent rifle. Long is home. AP 2 vs AEGIS.", value: 5600, rarity: "Legendary", unlockRegion: "veyra", regions: ["veyra"] },
  { stem: "L9 Long", family: "energy", ammoType: "laser", rangeBand: "long", damage: "2d8", ap: 3, accuracy: 3, recoil: 0, magSize: 16, classHint: "Wizard", effect: "L9 successor laser. AP 3. Drones take it personally.", value: 7200, rarity: "Legendary", unlockRegion: "veyra", regions: ["veyra"] },
  { stem: "SAW", family: "heavy", ammoType: "5.56", rangeBand: "mid", damage: "2d6", ap: 0, accuracy: -1, recoil: 3, magSize: 20, classHint: "Warrior", effect: "Spends 3 rounds per strike. Recoil is a lifestyle.", value: 2200, rarity: "Rare", spend: 3 },
  { stem: "Rail Cannon", family: "heavy", ammoType: "rail", rangeBand: "long", damage: "2d8", ap: 3, accuracy: 0, recoil: 3, magSize: 4, classHint: "Warrior", effect: "AP 3. The Warden notices this.", value: 4200, rarity: "Legendary" },
  { stem: "Harpoon Gun", family: "heavy", ammoType: "bolt", rangeBand: "mid", damage: "1d10+2", ap: 1, accuracy: 0, recoil: 2, magSize: 3, classHint: "Warrior", effect: "Strong hit drags small targets.", value: 1900, rarity: "Rare" },
];

const REGIONS: RegionId[] = ["ironclad", "slagtown", "blackspire", "brasswater", "veyra"];

function gunFrom(frame: Frame, region: RegionId): ArsenalEntry {
  const brand = BRANDS[region];
  const rarity = bumpRarity(frame.rarity, brand.rarityBump > 2 ? 2 : brand.rarityBump === 2 && frame.rarity === "Legendary" ? 1 : brand.rarityBump);
  // A weapon line should answer three questions before the player has to ask:
  // what it is chambered in, where it wants to be used, and what it costs to
  // shoot. The generated lore says all three.
  const recoilRead = RECOIL_READ[Math.min(RECOIL_READ.length - 1, Math.max(0, frame.recoil))];
  const apRead = AP_READ[Math.min(AP_READ.length - 1, Math.max(0, frame.ap))];
  const lore = [
    `${brand.lore}`,
    frame.read ?? `${frame.stem} pattern, built by ${brand.smith}.`,
    `Chambered ${frame.ammoType}; ${frame.magSize} up.`,
    RANGE_READ[frame.rangeBand],
    recoilRead,
    apRead,
    frame.doctrine ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    name: `${brand.prefix} ${frame.stem}`,
    kind: "weapon",
    rarity,
    damage: frame.damage,
    effect: frame.effect,
    lore,
    value: Math.round(frame.value * brand.value),
    sourceRegion: region,
    classHint: frame.classHint,
    weaponFamily: frame.family,
    ammoType: frame.ammoType,
    rangeBand: frame.rangeBand,
    ap: frame.ap,
    accuracy: frame.accuracy,
    recoil: frame.recoil,
    magSize: frame.magSize,
    mag: frame.magSize,
    unlockDay: frame.unlockDay,
    unlockRegion: frame.unlockRegion,
  };
}

const GUNS: ArsenalEntry[] = FRAMES.flatMap((frame) =>
  (frame.regions ?? REGIONS).map((region) => gunFrom(frame, region)),
);

const UNIQUES: ArsenalEntry[] = [
  {
    name: "Vault 13 BB Rifle",
    kind: "weapon",
    rarity: "Common",
    damage: "1d3",
    effect: "Spring-air. 1d3. Silent hits never raise an alarm, and it will never jam on you.",
    lore:
      "Tyrone keeps it on two nails by the Vault 13 door and hands it to every rider who walks in, which is most of the ceremony there is. Forty BBs under the barrel, a spring you cock with your whole arm, and a stock worn pale where forty years of hands have held it. It is not a weapon. It is the first thing the Realm lets you be responsible for. Chambered BB; 40 up. Close is home. It does not move when it fires. It does not punch plate and it does not pretend to.",
    value: 60,
    sourceRegion: "ironclad",
    classHint: "Rogue",
    weaponFamily: "rifle",
    ammoType: "bb",
    rangeBand: "close",
    ap: 0,
    accuracy: 2,
    recoil: 0,
    magSize: 40,
    mag: 40,
  },
  {
    name: "Ought-Six Covenant",
    kind: "weapon",
    rarity: "Legendary",
    damage: "2d8",
    effect: "'06 bolt. AP 3, +2 accuracy at long. A strong hit staggers armoured targets for a round.",
    lore:
      "A pre-collapse hunting rifle rebarreled by somebody who knew exactly what they were doing, chambered in the one cartridge every smith on the frontier can still load from scratch. There is a covenant cut into the floorplate in letters small enough to need light: ONE ROUND, ONE ANSWER. Ironclad says it belonged to the gate clerk who first wrote Kane's name in the ledger and then decided to stop writing. Chambered .30-06; 5 up. Long is home. It climbs, and it comes back down where you left it. Plate is a suggestion at this end of the barrel.",
    value: 7400,
    sourceRegion: "ironclad",
    classHint: "Warrior",
    weaponFamily: "sniper",
    ammoType: ".30-06",
    rangeBand: "long",
    ap: 3,
    accuracy: 2,
    recoil: 2,
    magSize: 5,
    mag: 5,
  },
  {
    name: "Pack-Tooth Scattergun",
    kind: "weapon",
    rarity: "Legendary",
    damage: "2d8",
    effect: "Close shreds. Weakness bait for beasts. Spends 1.",
    lore: "Gravenor used to issue these to the Ashen Pack. The teeth on the muzzle are not decorative.",
    value: 5400,
    sourceRegion: "ironclad",
    classHint: "Warrior",
    weaponFamily: "shotgun",
    ammoType: "12g",
    rangeBand: "close",
    ap: 1,
    accuracy: 1,
    recoil: 2,
    magSize: 6,
    mag: 6,
  },
  {
    name: "Furnace Court M14",
    kind: "weapon",
    rarity: "Legendary",
    damage: "1d10+2",
    effect: "M14 battle. AP 2. Mid is home. Plate remembers this serial.",
    lore: "Valdris signed the chit. Kane's buyers still honor it. Chambered .308.",
    value: 6100,
    sourceRegion: "slagtown",
    classHint: "Warrior",
    weaponFamily: "rifle",
    ammoType: ".308",
    rangeBand: "mid",
    ap: 2,
    accuracy: 1,
    recoil: 2,
    magSize: 10,
    mag: 10,
  },
  {
    name: "Vein-Survey Marksman",
    kind: "weapon",
    rarity: "Legendary",
    damage: "2d8",
    effect: "M24 pattern. Long is home. AP 2. Thessaly mapped with this, then sold the veins.",
    lore: "A survey M24 with the safety filed off. The scope still has her elevation marks. Chambered .308.",
    value: 6400,
    sourceRegion: "blackspire",
    classHint: "Rogue",
    weaponFamily: "sniper",
    ammoType: ".308",
    rangeBand: "long",
    ap: 2,
    accuracy: 3,
    recoil: 2,
    magSize: 5,
    mag: 5,
  },
  {
    name: "Archive Flood-Lance",
    kind: "weapon",
    rarity: "Legendary",
    damage: "2d6+1",
    effect: "Energy. AP 2. The Sink answers questions. This asks louder.",
    lore: "Brasswater archive staff. Still wet. Still charged.",
    value: 5800,
    sourceRegion: "brasswater",
    classHint: "Wizard",
    weaponFamily: "energy",
    ammoType: "cell",
    rangeBand: "close",
    ap: 2,
    accuracy: 1,
    recoil: 0,
    magSize: 10,
    mag: 10,
  },
  {
    name: "Ashen Gate M94",
    kind: "weapon",
    rarity: "Rare",
    damage: "1d10",
    effect: "M94 lever. Tube mag. Beasts notice the soft point in the tube.",
    lore: "Pack hunting rifle. The lever is worn smooth. Chambered .30-30.",
    value: 2100,
    sourceRegion: "ironclad",
    classHint: "Warrior",
    weaponFamily: "rifle",
    ammoType: ".30-30",
    rangeBand: "mid",
    ap: 0,
    accuracy: 1,
    recoil: 0,
    magSize: 7,
    mag: 7,
  },
  {
    name: "Vein M700 Survey",
    kind: "weapon",
    rarity: "Rare",
    damage: "1d10+1",
    effect: "M700 bolt. Hunting .270. Long is home. +2 accuracy.",
    lore: "Thessaly's spare survey bolt. Elevation marks still on the stock. Chambered .270.",
    value: 2800,
    sourceRegion: "blackspire",
    classHint: "Rogue",
    weaponFamily: "rifle",
    ammoType: ".270",
    rangeBand: "long",
    ap: 0,
    accuracy: 2,
    recoil: 1,
    magSize: 4,
    mag: 4,
  },
  {
    name: "Nine-Lift M70 Magnum",
    kind: "weapon",
    rarity: "Legendary",
    damage: "2d8",
    effect: "M70 magnum. .300 Win Mag. AP 2. Recoil is a lifestyle. Long is home.",
    lore: "Cage-broker magnum. The brake is a suggestion. Chambered .300.",
    value: 6400,
    sourceRegion: "blackspire",
    classHint: "Warrior",
    weaponFamily: "sniper",
    ammoType: ".300",
    rangeBand: "long",
    ap: 2,
    accuracy: 2,
    recoil: 3,
    magSize: 3,
    mag: 3,
    unlockRegion: "blackspire",
  },
  {
    name: "Kane-Pattern Coherent",
    kind: "weapon",
    rarity: "Mythic",
    damage: "2d10",
    effect: "L9 laser. AP 3. Powered plate and drones take it personally. Coil cells will not seat.",
    lore: "Successor-suit coherent emitter. Tyrone declined the appointment. The rifle did not.",
    value: 9800,
    sourceRegion: "veyra",
    classHint: "Wizard",
    weaponFamily: "energy",
    ammoType: "laser",
    rangeBand: "long",
    ap: 3,
    accuracy: 3,
    recoil: 0,
    magSize: 16,
    mag: 16,
    unlockRegion: "veyra",
  },
  {
    name: "Kane-Pattern 2753",
    kind: "weapon",
    rarity: "Mythic",
    damage: "2d10",
    effect: "AP 3 energy. Weakness bait for the Warden. Spends 1.",
    lore: "Successor-suit issue. Tyrone declined the appointment. The rifle did not.",
    value: 9200,
    sourceRegion: "veyra",
    classHint: "Wizard",
    weaponFamily: "energy",
    ammoType: "cell",
    rangeBand: "mid",
    ap: 3,
    accuracy: 2,
    recoil: 1,
    magSize: 12,
    mag: 12,
  },
  {
    name: "Ashen Gate Breaker",
    kind: "weapon",
    rarity: "Legendary",
    damage: "2d6",
    effect: "AP 2. Spends 3 rounds per strike. Recoil is a lifestyle.",
    lore: "Watchworks SAW with Pack teeth welded to the heat shield.",
    value: 4700,
    sourceRegion: "ironclad",
    classHint: "Warrior",
    weaponFamily: "heavy",
    ammoType: "5.56",
    rangeBand: "mid",
    ap: 2,
    accuracy: -1,
    recoil: 3,
    magSize: 24,
    mag: 24,
  },
  {
    name: "Nine-Lift M24 Needle",
    kind: "weapon",
    rarity: "Rare",
    damage: "1d12+1",
    effect: "M24 needle. Long is home. AP 1. Stairwell argument finisher.",
    lore: "Balanced for the kind of vertical fight Blackspire is famous for. Chambered .308.",
    value: 3100,
    sourceRegion: "blackspire",
    classHint: "Rogue",
    weaponFamily: "sniper",
    ammoType: ".308",
    rangeBand: "long",
    ap: 1,
    accuracy: 2,
    recoil: 1,
    magSize: 5,
    mag: 5,
  },
  {
    name: "White-Glove Coil",
    kind: "weapon",
    rarity: "Legendary",
    damage: "1d10+1",
    effect: "AP 2 energy. No serial. No receipt.",
    lore: "Veyra grey market. White Glove swears the ads were removed with a soldering iron.",
    value: 6700,
    sourceRegion: "veyra",
    classHint: "Rogue",
    weaponFamily: "energy",
    ammoType: "cell",
    rangeBand: "mid",
    ap: 2,
    accuracy: 2,
    recoil: 0,
    magSize: 14,
    mag: 14,
  },
  {
    name: "Cinder Bess Scatter",
    kind: "weapon",
    rarity: "Rare",
    damage: "2d6+1",
    effect: "Close shreds. Heat-soaked 12g.",
    lore: "She smells like coke and wet coin. The shotgun smells worse.",
    value: 2400,
    sourceRegion: "slagtown",
    classHint: "Warrior",
    weaponFamily: "shotgun",
    ammoType: "12g",
    rangeBand: "close",
    ap: 1,
    accuracy: 0,
    recoil: 2,
    magSize: 5,
    mag: 5,
  },
  {
    name: "Salt-Wren Harpoon",
    kind: "weapon",
    rarity: "Rare",
    damage: "1d10+3",
    effect: "Strong hit drags small targets one step closer.",
    lore: "Built for things in the water. Nobody agrees what things.",
    value: 2700,
    sourceRegion: "brasswater",
    classHint: "Warrior",
    weaponFamily: "heavy",
    ammoType: "bolt",
    rangeBand: "mid",
    ap: 1,
    accuracy: 0,
    recoil: 2,
    magSize: 3,
    mag: 3,
  },
];

type PartFrame = {
  stem: string;
  slot: AttachmentSlot;
  effect: string;
  value: number;
  rarity: Rarity;
  fits?: WeaponFamily[];
  lore: string;
};

const PART_FRAMES: PartFrame[] = [
  { stem: "Iron Sight", slot: "optic", effect: "Optic. +1 accuracy.", value: 120, rarity: "Common", lore: "A notch and a post. Honest." },
  { stem: "Reflex", slot: "optic", effect: "Optic. +2 accuracy.", value: 420, rarity: "Uncommon", lore: "Red dot that still thinks the war is on." },
  { stem: "Holo", slot: "optic", effect: "Optic. +2 accuracy. +1 at close.", value: 780, rarity: "Rare", lore: "A window of light. Do not drop it." },
  { stem: "ACOG", slot: "optic", effect: "Optic. +2 accuracy. Range long.", value: 1100, rarity: "Rare", lore: "Glass for people who plan to live past mid." },
  { stem: "Thermal", slot: "optic", effect: "Optic. +3 accuracy. Ignores darkness.", value: 2400, rarity: "Legendary", lore: "Heat is a language. This reads it." },
  { stem: "Compensator", slot: "muzzle", effect: "Muzzle. -2 recoil.", value: 280, rarity: "Uncommon", lore: "Directs the argument forward." },
  { stem: "Suppressor", slot: "muzzle", effect: "Muzzle. -1 recoil. Ghost-friendly.", value: 640, rarity: "Rare", lore: "Kane's people still hear it. Everyone else does not." },
  { stem: "Brake", slot: "muzzle", effect: "Muzzle. -3 recoil. +1 damage.", value: 900, rarity: "Rare", lore: "Loud. Effective. Neighbors hate it." },
  { stem: "Choke", slot: "muzzle", effect: "Muzzle. +1 accuracy. Shotgun close shreds.", value: 360, rarity: "Uncommon", fits: ["shotgun"], lore: "Tightens the pattern. Beasts notice." },
  { stem: "Flash Hider", slot: "muzzle", effect: "Muzzle. -1 recoil.", value: 180, rarity: "Common", lore: "Keeps the night from pointing at you." },
  { stem: "Short Barrel", slot: "barrel", effect: "Barrel. Range close. +1 accuracy.", value: 300, rarity: "Uncommon", lore: "Cuts the rifle down to alley length." },
  { stem: "Long Barrel", slot: "barrel", effect: "Barrel. Range long. +1 accuracy.", value: 520, rarity: "Uncommon", lore: "Adds reach. Adds weight. Adds opinions." },
  { stem: "Heavy Barrel", slot: "barrel", effect: "Barrel. +1 AP. -1 recoil.", value: 860, rarity: "Rare", lore: "Thick steel. Plate starts to care." },
  { stem: "Match Barrel", slot: "barrel", effect: "Barrel. +2 accuracy. Range long.", value: 1600, rarity: "Legendary", lore: "Survey-grade. Thessaly would steal this." },
  { stem: "Extended Mag", slot: "mag", effect: "Mag. +6 mag.", value: 240, rarity: "Uncommon", lore: "More rounds. More weight. More chances." },
  { stem: "Drum Mag", slot: "mag", effect: "Mag. +12 mag. +1 recoil.", value: 720, rarity: "Rare", lore: "A lunchbox of ammunition. Do not drop it on a toe." },
  { stem: "Fast Mag", slot: "mag", effect: "Mag. +2 mag. Rushed reload is free.", value: 480, rarity: "Uncommon", lore: "The spring is meaner than the smith." },
  { stem: "AP Mag", slot: "mag", effect: "Mag. +1 AP. +2 mag.", value: 1100, rarity: "Rare", lore: "Tips that remember plate." },
  { stem: "Folding Stock", slot: "stock", effect: "Stock. Range close. -1 recoil.", value: 200, rarity: "Common", lore: "Folds. Fits a locker. Starts fights." },
  { stem: "Precision Stock", slot: "stock", effect: "Stock. +1 accuracy. -1 recoil.", value: 540, rarity: "Uncommon", lore: "A cheek weld for people who aim." },
  { stem: "Recoil Pad", slot: "stock", effect: "Stock. -2 recoil.", value: 310, rarity: "Uncommon", lore: "Rubber and prayer." },
  { stem: "Vertical Grip", slot: "underbarrel", effect: "Underbarrel. -1 recoil. +1 accuracy.", value: 260, rarity: "Uncommon", lore: "A handle for the other hand." },
  { stem: "Laser", slot: "underbarrel", effect: "Underbarrel. +2 accuracy at close.", value: 640, rarity: "Rare", lore: "A red line. Honest as a threat." },
  { stem: "Bayonet", slot: "underbarrel", effect: "Underbarrel. +1 damage. Fits melee.", value: 180, rarity: "Common", fits: ["melee", "rifle", "shotgun"], lore: "A knife that admits the gun might fail." },
  { stem: "Flashlight", slot: "underbarrel", effect: "Underbarrel. Ignore darkness. +1 accuracy close.", value: 220, rarity: "Common", lore: "Points at what you are about to regret." },
  { stem: "Match Receiver", slot: "receiver", effect: "Receiver. +1 accuracy. +1 damage.", value: 1400, rarity: "Rare", lore: "Tight tolerances. Loose morals." },
  { stem: "Heavy Receiver", slot: "receiver", effect: "Receiver. +1 AP. +1 damage.", value: 1800, rarity: "Legendary", lore: "Overbuilt. The Warden's people use these." },
  { stem: "Lightweight Receiver", slot: "receiver", effect: "Receiver. +1 accuracy. -1 recoil.", value: 900, rarity: "Rare", lore: "Less steel. Faster hands." },
];

const PART_BRAND_ROTATION: RegionId[] = ["ironclad", "slagtown", "blackspire", "brasswater", "veyra"];

const ATTACHMENTS: ArsenalEntry[] = PART_FRAMES.flatMap((part, i) => {
  const region = PART_BRAND_ROTATION[i % 5]!;
  const brand = BRANDS[region];
  const extra = PART_BRAND_ROTATION.filter((r) => r !== region).slice(0, part.rarity === "Common" ? 2 : 1);
  const regions = [region, ...extra];
  return regions.map((r) => {
    const b = BRANDS[r];
    return {
      name: `${b.prefix} ${part.stem}`,
      kind: "attachment" as const,
      rarity: bumpRarity(part.rarity, b.rarityBump > 1 ? 1 : 0),
      effect: part.effect,
      lore: `${part.lore} ${b.lore}`,
      value: Math.round(part.value * b.value),
      sourceRegion: r,
      attachmentSlot: part.slot,
      fitsFamilies: part.fits,
    };
  });
});

const AMMO_FRAMES: { ammoType: AmmoType; name: string; count: number; effect: string; value: number; rarity: Rarity; ap?: number; unlockDay?: number; unlockRegion?: RegionId; regions?: RegionId[] }[] = [
  { ammoType: "bb", name: "BB Tube", count: 60, effect: "60 steel BBs in a paper tube. Feeds any spring-air rifle. Costs almost nothing and makes almost no noise.", value: 15, rarity: "Common" },
  { ammoType: "bb", name: "BB Tin (bulk)", count: 200, effect: "200 steel BBs in a dented tin. Bulk. The tin rattles, so pack it deep.", value: 40, rarity: "Common" },
  { ammoType: "bb", name: "Match BB Tin", count: 100, effect: "100 sorted, round, polished BBs. +2 accuracy when spent from this tin.", value: 110, rarity: "Uncommon" },
  { ammoType: "9mm", name: "9mm Surplus Crate", count: 36, effect: "36 mixed 9mm. Surplus grade. Dents. A cheap pistol barely notices a better lot.", value: 40, rarity: "Common" },
  { ammoType: ".45", name: ".45 Surplus Crate", count: 28, effect: "28 mixed .45. Surplus grade. Whoever stacked it last did not care.", value: 55, rarity: "Common" },
  { ammoType: "5.56", name: "5.56 Surplus Crate", count: 40, effect: "40 mixed 5.56. Surplus grade. Accuracy suffers in a worn carbine.", value: 60, rarity: "Common" },
  { ammoType: ".30-30", name: ".30-30 Surplus Crate", count: 24, effect: "24 mixed .30-30. Surplus grade. Tube guns still fire it.", value: 70, rarity: "Common" },
  { ammoType: ".270", name: ".270 Surplus Crate", count: 20, effect: "20 mixed .270. Surplus grade. A hunting bolt deserves better.", value: 80, rarity: "Common" },
  { ammoType: ".30-06", name: ".30-06 Surplus Crate", count: 20, effect: "20 mixed .30-06. Surplus grade. Wet tins and mismatched lots.", value: 90, rarity: "Common" },
  { ammoType: ".308", name: ".308 Surplus Crate", count: 20, effect: "20 mixed .308. Surplus grade. An M14 will shoot it. It will not love it.", value: 85, rarity: "Common" },
  { ammoType: ".300", name: ".300 Surplus Crate", count: 10, effect: "10 mixed .300. Surplus grade. Magnum brass that has seen weather.", value: 120, rarity: "Uncommon" },
  { ammoType: "12g", name: "12g Surplus Crate", count: 16, effect: "16 mixed 12g. Surplus grade. Some bird, some buck, some rust.", value: 45, rarity: "Common" },
  { ammoType: "cell", name: "Surplus Cell Crate", count: 20, effect: "20 tired cells. Surplus grade. Coil weapons still drink them.", value: 180, rarity: "Common" },
  { ammoType: "laser", name: "Surplus Laser Crate", count: 16, effect: "16 tired laser cells. Surplus grade. An L8 wastes them.", value: 220, rarity: "Uncommon", unlockRegion: "blackspire", regions: ["blackspire", "brasswater", "veyra"] },
  { ammoType: "9mm", name: "9mm Box", count: 24, effect: "24 rounds of 9mm. Load a pistol or SMG.", value: 80, rarity: "Common" },
  { ammoType: "9mm", name: "9mm AP Box", count: 16, effect: "16 AP 9mm. +1 AP when spent from this box.", value: 180, rarity: "Uncommon", ap: 1 },
  { ammoType: ".45", name: ".45 Box", count: 18, effect: "18 rounds of .45. Heavy pistol and subgun feed.", value: 110, rarity: "Common" },
  { ammoType: ".45", name: ".45 Hollow Box", count: 12, effect: "12 hollow .45. +1 damage when spent from this box.", value: 220, rarity: "Uncommon" },
  { ammoType: "5.56", name: "5.56 Box", count: 30, effect: "30 rounds of 5.56. M4, M16 and SAW feed.", value: 140, rarity: "Common" },
  { ammoType: "5.56", name: "5.56 AP Box", count: 20, effect: "20 AP 5.56. +1 AP when spent from this box.", value: 280, rarity: "Uncommon", ap: 1 },
  { ammoType: "5.56", name: "5.56 Tracer Box", count: 20, effect: "20 tracer 5.56. +1 accuracy when spent from this box.", value: 200, rarity: "Uncommon" },
  { ammoType: "5.56", name: "5.56 Match Box", count: 20, effect: "20 match 5.56. +2 accuracy when spent from this box.", value: 320, rarity: "Rare" },
  { ammoType: ".30-30", name: ".30-30 Box", count: 20, effect: "20 rounds of .30-30. M94 and M336 levers feed.", value: 150, rarity: "Common" },
  { ammoType: ".30-30", name: ".30-30 Soft Point Box", count: 12, effect: "12 hunting .30-30. +1 damage when spent from this box.", value: 240, rarity: "Uncommon" },
  { ammoType: ".30-30", name: ".30-30 Hot Load Box", count: 10, effect: "10 hot .30-30. +1 damage and +1 AP when spent from this box.", value: 360, rarity: "Rare", ap: 1 },
  { ammoType: ".270", name: ".270 Box", count: 16, effect: "16 rounds of .270. M700 bolts feed.", value: 190, rarity: "Uncommon" },
  { ammoType: ".270", name: ".270 Soft Point Box", count: 10, effect: "10 hunting .270. +1 damage when spent from this box.", value: 300, rarity: "Uncommon" },
  { ammoType: ".270", name: ".270 Match Box", count: 8, effect: "8 match .270. +2 accuracy when spent from this box.", value: 420, rarity: "Rare" },
  { ammoType: ".270", name: ".270 Bonded Box", count: 8, effect: "8 bonded .270. +1 damage and +1 AP when spent from this box.", value: 480, rarity: "Rare", ap: 1 },
  { ammoType: ".30-06", name: ".30-06 Box", count: 16, effect: "16 rounds of .30-06. M70 Springfield bolts feed.", value: 210, rarity: "Uncommon" },
  { ammoType: ".30-06", name: ".30-06 Soft Point Box", count: 10, effect: "10 hunting .30-06. +1 damage when spent from this box.", value: 320, rarity: "Uncommon" },
  { ammoType: ".30-06", name: ".30-06 AP Box", count: 8, effect: "8 AP .30-06. +2 AP when spent from this box.", value: 460, rarity: "Rare", ap: 2 },
  { ammoType: ".30-06", name: ".30-06 Match Box", count: 8, effect: "8 match .30-06. Sorted brass, single lot, one headstamp. +2 accuracy when spent from this box.", value: 440, rarity: "Rare" },
  { ammoType: ".30-06", name: ".30-06 M2 Ball Tin", count: 24, effect: "24 rounds of M2-pattern .30-06 ball on stripper clips. The load the cartridge was standardised around.", value: 260, rarity: "Uncommon" },
  { ammoType: ".30-06", name: ".30-06 Black Tip Box", count: 6, effect: "6 steel-core .30-06. +3 AP when spent from this box. Kane's plate was not rated for this.", value: 720, rarity: "Legendary", ap: 3, unlockRegion: "blackspire" },
  { ammoType: ".308", name: ".308 Box", count: 16, effect: "16 rounds of .308. M14, M10 and M24 feed.", value: 180, rarity: "Uncommon" },
  { ammoType: ".308", name: ".308 AP Box", count: 10, effect: "10 AP .308. +2 AP when spent from this box.", value: 420, rarity: "Rare", ap: 2 },
  { ammoType: ".308", name: ".308 Match Box", count: 10, effect: "10 match .308. +2 accuracy when spent from this box.", value: 380, rarity: "Rare" },
  { ammoType: ".308", name: ".308 Bonded Box", count: 10, effect: "10 bonded .308. +1 damage and +1 AP when spent from this box.", value: 460, rarity: "Rare", ap: 1 },
  { ammoType: ".300", name: ".300 Box", count: 8, effect: "8 rounds of .300 Win Mag. M70 magnum bolts feed.", value: 280, rarity: "Rare" },
  { ammoType: ".300", name: ".300 AP Magnum Box", count: 6, effect: "6 AP .300. +2 AP when spent from this box.", value: 640, rarity: "Legendary", ap: 2 },
  { ammoType: ".300", name: ".300 Match Box", count: 6, effect: "6 match .300. +2 accuracy when spent from this box.", value: 540, rarity: "Rare" },
  { ammoType: ".300", name: ".300 Partition Box", count: 6, effect: "6 partition .300. +1 damage when spent from this box.", value: 580, rarity: "Rare" },
  { ammoType: "12g", name: "12g Box", count: 12, effect: "12 shells of 12g. Pump and combat feed.", value: 90, rarity: "Common" },
  { ammoType: "12g", name: "12g Slug Box", count: 8, effect: "8 slugs. +1 AP. Range mid when spent from this box.", value: 240, rarity: "Uncommon", ap: 1 },
  { ammoType: "12g", name: "12g Incendiary Box", count: 6, effect: "6 incendiary 12g. +2 damage vs beast.", value: 360, rarity: "Rare" },
  { ammoType: "rail", name: "Rail Spike Bundle", count: 8, effect: "8 rail spikes. Heavy rail feed.", value: 520, rarity: "Rare" },
  { ammoType: "cell", name: "Charge Cell Pack", count: 16, effect: "16 cell charges. Coil and arc weapons feed.", value: 400, rarity: "Uncommon" },
  { ammoType: "cell", name: "Overcharged Cell Pack", count: 8, effect: "8 overcharged cells. +1 AP when spent from this box.", value: 720, rarity: "Rare", ap: 1 },
  { ammoType: "laser", name: "Laser Cell Pack", count: 16, effect: "16 laser cells. L4, L6 and L8 rifles feed. Coil cells will not seat.", value: 520, rarity: "Rare", unlockRegion: "blackspire", regions: ["blackspire", "brasswater", "veyra"] },
  { ammoType: "laser", name: "Overcharged Laser Pack", count: 8, effect: "8 overcharged laser cells. +1 AP and +1 damage when spent from this box.", value: 880, rarity: "Legendary", ap: 1, unlockRegion: "veyra", regions: ["veyra"] },
  { ammoType: "laser", name: "Focusing Crystal Pack", count: 8, effect: "8 focusing laser cells. +2 accuracy when spent from this box.", value: 760, rarity: "Rare", unlockRegion: "blackspire", regions: ["blackspire", "veyra"] },
  { ammoType: "laser", name: "Pulse Capacitor Pack", count: 6, effect: "6 pulse capacitors. +2 AP when spent from this box.", value: 1100, rarity: "Legendary", ap: 2, unlockRegion: "veyra", regions: ["veyra"] },
  { ammoType: "bolt", name: "Harpoon Bolt Bundle", count: 6, effect: "6 bolts. Harpoon feed.", value: 260, rarity: "Uncommon" },
];

const AMMO: ArsenalEntry[] = AMMO_FRAMES.flatMap((a, i) => {
  const regions = a.regions ?? (() => {
    const region = PART_BRAND_ROTATION[i % 5]!;
    const extras = i % 2 === 0 ? [PART_BRAND_ROTATION[(i + 2) % 5]!] : [];
    return [region, ...extras];
  })();
  return regions.map((r) => ({
    name: `${BRANDS[r].prefix} ${a.name}`,
    kind: "consumable" as const,
    rarity: a.rarity,
    effect: a.effect,
    lore: `Sealed crate. ${BRANDS[r].lore}`,
    value: Math.round(a.value * BRANDS[r].value),
    sourceRegion: r,
    ammoType: a.ammoType,
    ammoCount: a.count,
    ammoGrade: gradeFromLoad(a.name),
    ap: a.ap,
    unlockDay: a.unlockDay,
    unlockRegion: a.unlockRegion,
  }));
});

const ARMOR_EXTRA: ArsenalEntry[] = [
  { name: "Watchworks Plate Carrier", kind: "armor", rarity: "Uncommon", defense: 2, effect: "Plate. First ballistic chip each sortie ignored.", lore: "Riveted carrier. The plates are rail stock.", value: 640, sourceRegion: "ironclad", classHint: "Warrior" },
  { name: "Watchworks Soft Vest", kind: "armor", rarity: "Common", defense: 1, effect: "Soft. Quiet. Does not stop a rifle.", lore: "Canvas and hope.", value: 180, sourceRegion: "ironclad", classHint: "Rogue" },
  { name: "Union Forge Heat Shell", kind: "armor", rarity: "Rare", defense: 2, effect: "Plate. Fire and heat -2.", lore: "Foundry apron that learned to be armor.", value: 1600, sourceRegion: "slagtown", classHint: "Warrior" },
  { name: "Union Forge Slag Wrap", kind: "armor", rarity: "Uncommon", defense: 1, effect: "Soft. Heat -1.", lore: "Conveyor belt and wire.", value: 420, sourceRegion: "slagtown" },
  { name: "Nine-Lift Climb Harness", kind: "armor", rarity: "Uncommon", defense: 1, effect: "Soft. +1 on vertical and cage checks.", lore: "Clips, black webbing, no promises.", value: 520, sourceRegion: "blackspire", classHint: "Rogue" },
  { name: "Nine-Lift Ice Plate", kind: "armor", rarity: "Rare", defense: 2, effect: "Plate. Cold -2.", lore: "The plates sweat frost even in Ironclad.", value: 1900, sourceRegion: "blackspire", classHint: "Warrior" },
  { name: "Dockcoil Dive Plate", kind: "armor", rarity: "Rare", defense: 2, effect: "Plate. Ignore first water penalty.", lore: "Brass scales over waxed canvas.", value: 1700, sourceRegion: "brasswater", classHint: "Warrior" },
  { name: "Dockcoil Tidecoat Mk2", kind: "armor", rarity: "Uncommon", defense: 1, effect: "Soft. Storms do not slow the first move.", lore: "The original Tidecoat had opinions. This one has pockets.", value: 560, sourceRegion: "brasswater" },
  { name: "Surplus 2753 Aegis Weave", kind: "armor", rarity: "Legendary", defense: 3, effect: "Powered. Energy -1. +1 SPD.", lore: "Successor-suit offcut. Tyrone will not wear it.", value: 6200, sourceRegion: "veyra", classHint: "Warrior" },
  { name: "Surplus 2753 Softshell", kind: "armor", rarity: "Rare", defense: 2, effect: "Phase. +1 stealth vs drones.", lore: "Seamless black. Never creases.", value: 2800, sourceRegion: "veyra", classHint: "Rogue" },
  { name: "Watchworks Riot Collar", kind: "armor", rarity: "Uncommon", defense: 1, effect: "Plate. Crits from pistols become strong hits.", lore: "A neck that remembers riots.", value: 480, sourceRegion: "ironclad" },
  { name: "Union Forge Foreman Plate", kind: "armor", rarity: "Rare", defense: 3, effect: "Plate. First strike each combat -1 incoming.", lore: "The punchcard is still in the pocket.", value: 2100, sourceRegion: "slagtown", classHint: "Warrior" },
  { name: "Nine-Lift Void Mantle", kind: "armor", rarity: "Legendary", defense: 2, effect: "Phase. Darkness is home. +1 stealth.", lore: "It refuses to stay warm.", value: 4800, sourceRegion: "blackspire", classHint: "Rogue" },
  { name: "Dockcoil Pressure Suit", kind: "armor", rarity: "Legendary", defense: 3, effect: "Powered. Water, mud and pressure ignored once per sortie.", lore: "Built for the archive floor. The Sink noticed.", value: 5100, sourceRegion: "brasswater", classHint: "Wizard" },
  { name: "Surplus 2753 Pilot Liner", kind: "armor", rarity: "Rare", defense: 1, effect: "Powered. +1 vs AEGIS and drones.", lore: "The visor is missing. The liner still knows the suit.", value: 2400, sourceRegion: "veyra", classHint: "Rogue" },
];

const CONSUMABLE_EXTRA: ArsenalEntry[] = [
  { name: "Watchworks Gun-Oil", kind: "consumable", rarity: "Common", effect: "Restore a Broken or Damaged firearm one step after the sortie.", lore: "Smells like the Machine Shop on a good day.", value: 90, sourceRegion: "ironclad" },
  { name: "Watchworks Mag Loader", kind: "consumable", rarity: "Common", effect: "Reload is not rushed this encounter.", lore: "A strip of spring steel and a prayer.", value: 70, sourceRegion: "ironclad" },
  { name: "Union Forge Thermite Stick", kind: "consumable", rarity: "Rare", effect: "+2 weapon damage for one encounter, then lose 1 HP.", lore: "Industrial use only. Slag Town considers that a serving suggestion.", value: 860, sourceRegion: "slagtown" },
  { name: "Nine-Lift Climb Chalk", kind: "consumable", rarity: "Common", effect: "+2 on the next climb or cage check.", lore: "Blue dust. Blackspire hands.", value: 60, sourceRegion: "blackspire" },
  { name: "Dockcoil Desiccant", kind: "consumable", rarity: "Uncommon", effect: "Clear waterlog, rust-start or one environmental debuff.", lore: "The cleanest packet in Brasswater.", value: 280, sourceRegion: "brasswater", classHint: "Healer" },
  { name: "Surplus 2753 Field Stim", kind: "consumable", rarity: "Rare", effect: "Restore 6 HP with no secondary penalty.", lore: "Sterile. Measured. Distrusted.", value: 1250, sourceRegion: "veyra", classHint: "Healer" },
  { name: "Watchworks Bore Snake", kind: "material", rarity: "Common", effect: "Machine Shop cleaning stock. One repair bill reduced.", lore: "It has seen every caliber Vault 13 admits to.", value: 55, sourceRegion: "ironclad" },
  { name: "Union Forge Spring Kit", kind: "material", rarity: "Uncommon", effect: "Receiver and mag repair stock.", lore: "Springs that still remember how to bite.", value: 210, sourceRegion: "slagtown" },
  { name: "Nine-Lift Scope Glass", kind: "material", rarity: "Rare", effect: "Optic craft stock.", lore: "Scratched. Still true.", value: 640, sourceRegion: "blackspire" },
  { name: "Dockcoil Sealant", kind: "material", rarity: "Uncommon", effect: "Waterproofs one firearm for a sortie.", lore: "It never fully dries. That is the point.", value: 190, sourceRegion: "brasswater" },
  { name: "Surplus 2753 Cell Frame", kind: "material", rarity: "Legendary", effect: "Energy weapon craft core.", lore: "Transparent casing. No screws. Kane numbering.", value: 3100, sourceRegion: "veyra" },
  { name: "Pack Muzzle Brake", kind: "attachment", rarity: "Legendary", effect: "Muzzle. -2 recoil. +1 damage. Fits shotgun.", lore: "Ashen Pack issue. Gravenor's teeth, welded.", value: 2200, sourceRegion: "ironclad", attachmentSlot: "muzzle", fitsFamilies: ["shotgun", "rifle"] },
  { name: "Dockcoil Tide-Choke", kind: "attachment", rarity: "Rare", effect: "Muzzle. +1 accuracy. Shotgun close shreds.", lore: "The Sink does not choke. This does.", value: 980, sourceRegion: "brasswater", attachmentSlot: "muzzle", fitsFamilies: ["shotgun"] },
  { name: "Nine-Lift Match Barrel", kind: "attachment", rarity: "Legendary", effect: "Barrel. +2 accuracy. Range long. +1 AP.", lore: "Thessaly's elevation marks are still on the steel.", value: 2600, sourceRegion: "blackspire", attachmentSlot: "barrel" },
  { name: "Surplus 2753 Heavy Receiver", kind: "attachment", rarity: "Mythic", effect: "Receiver. +2 AP. +1 damage.", lore: "Successor-suit fire control. Tyrone will not socket this into himself.", value: 5400, sourceRegion: "veyra", attachmentSlot: "receiver" },
];

function dedupe(list: ArsenalEntry[]): ArsenalEntry[] {
  const seen = new Set<string>();
  const out: ArsenalEntry[] = [];
  for (const row of list) {
    if (SKIP.has(row.name)) continue;
    const key = `${row.kind}:${row.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export const ARSENAL_CATALOG: ArsenalEntry[] = dedupe([
  ...GUNS,
  ...UNIQUES,
  ...ATTACHMENTS,
  ...AMMO,
  ...ARMOR_EXTRA,
  ...CONSUMABLE_EXTRA,
]);

const STEM_ALIASES: [string, string][] = [
  ["Furnace Court Service Rifle", "Furnace Court M14"],
  ["Ashen Gate Lever", "Ashen Gate M94"],
  ["Vein .270 Survey Bolt", "Vein M700 Survey"],
  ["Nine-Lift .300 Magnum", "Nine-Lift M70 Magnum"],
  ["Nine-Lift Needle Rifle", "Nine-Lift M24 Needle"],
  ["Watchworks Carbine", "Watchworks M4 Carbine"],
  ["Union Forge Carbine", "Union Forge M4 Carbine"],
  ["Nine-Lift Carbine", "Nine-Lift M4 Carbine"],
  ["Dockcoil Carbine", "Dockcoil M4 Carbine"],
  ["Surplus 2753 Carbine", "Surplus 2753 M4 Carbine"],
  ["Pulse Pistol", "L4 Pulse"],
  ["Laser Carbine", "L6 Carbine"],
  ["Laser Rifle", "L8 Rifle"],
  ["Service Rifle", "M16 Service"],
  ["Battle Rifle", "M14 Battle"],
  ["Marksman Rifle", "M24 Marksman"],
  ["30-30 Lever", "M94 Lever"],
  [".270 Bolt", "M700 Survey"],
  [".300 Magnum", "M70 Magnum"],
];

function aliasName(name: string): string {
  let out = name;
  for (const [from, to] of STEM_ALIASES) {
    if (out.includes(from)) out = out.replace(from, to);
  }
  return out;
}

export function arsenalByName(name: string): ArsenalEntry | undefined {
  const key = name.trim().toLowerCase();
  const hit = ARSENAL_CATALOG.find((row) => row.name.toLowerCase() === key);
  if (hit) return hit;
  const aliased = aliasName(name).trim().toLowerCase();
  if (aliased === key) return undefined;
  return ARSENAL_CATALOG.find((row) => row.name.toLowerCase() === aliased);
}

/** Location IDs that hold each region's campaign flag. */
export const REGION_LOCATION: Record<RegionId, LocationId> = {
  ironclad: "ironclad",
  slagtown: "kingdom",
  blackspire: "caverns",
  brasswater: "library",
  veyra: "veyra",
};

/** Day floor + previous boss. Veyra never opens from rest-spam. */
export const ARC_OPEN: Record<RegionId, { day: number; need?: LocationId; label: string }> = {
  ironclad: { day: 1, label: "Ironclad" },
  slagtown: { day: 8, need: "ironclad", label: "Slag Town" },
  blackspire: { day: 16, need: "kingdom", label: "Blackspire" },
  brasswater: { day: 28, need: "caverns", label: "Brasswater" },
  veyra: { day: 36, need: "library", label: "Veyra" },
};

type LocFlags = Partial<Record<LocationId, Pick<LocationProgress, "unlocked" | "bossDefeated">>>;

export function campaignOpenRegions(day: number, locations?: LocFlags): RegionId[] {
  const loc = locations && typeof locations === "object" ? locations : {};
  const hasFlags = Object.keys(loc).length > 0;
  const beaten = (id: LocationId) => !!loc[id]?.bossDefeated;
  const flagged = (id: LocationId) => !!loc[id]?.unlocked;
  const open: RegionId[] = ["ironclad"];

  const slag = hasFlags
    ? flagged("kingdom") || (beaten("ironclad") && day >= ARC_OPEN.slagtown.day)
    : day >= ARC_OPEN.slagtown.day;
  if (slag) open.push("slagtown");

  const spire = hasFlags
    ? flagged("caverns") || (beaten("kingdom") && day >= ARC_OPEN.blackspire.day)
    : day >= ARC_OPEN.blackspire.day;
  if (spire) open.push("blackspire");

  const brass = hasFlags
    ? flagged("library") || (beaten("caverns") && day >= ARC_OPEN.brasswater.day)
    : day >= ARC_OPEN.brasswater.day;
  if (brass) open.push("brasswater");

  // Veyra is the Sink's door. Calendar alone never opens it.
  const veyra = hasFlags
    ? flagged("veyra") || (beaten("library") && day >= ARC_OPEN.veyra.day)
    : false;
  if (veyra) open.push("veyra");

  return open;
}

export type UnlockCtx = { day: number; open: RegionId[] };

export function arsenalUnlocked(
  row: { unlockDay?: number; unlockRegion?: RegionId },
  ctx: number | UnlockCtx,
) {
  const day = typeof ctx === "number" ? ctx : ctx.day;
  const open = typeof ctx === "number" ? campaignOpenRegions(day) : ctx.open;
  if (row.unlockDay && day < row.unlockDay) return false;
  if (row.unlockRegion && !open.includes(row.unlockRegion)) return false;
  return true;
}

export function arsenalGuns(): ArsenalEntry[] {
  return ARSENAL_CATALOG.filter((row) => row.kind === "weapon");
}

export function arsenalParts(): ArsenalEntry[] {
  return ARSENAL_CATALOG.filter((row) => row.kind === "attachment");
}

export function arsenalAmmo(): ArsenalEntry[] {
  return ARSENAL_CATALOG.filter((row) => row.kind === "consumable" && row.ammoType);
}

export const CALIBER_ROSTER: {
  model: string;
  ammo: AmmoType;
  family: WeaponFamily;
  unlockRegion?: RegionId;
  note: string;
}[] = [
  { model: "M4 Carbine", ammo: "5.56", family: "rifle", note: "Short barrel. Alleys and porches." },
  { model: "M16 Service", ammo: "5.56", family: "rifle", note: "Mid-range workhorse. Ironclad issue." },
  { model: "M94 Lever", ammo: ".30-30", family: "rifle", note: "Tube mag. Close and mid are home." },
  { model: "M336 Brush", ammo: ".30-30", family: "rifle", note: "Brush gun. Woods and gates." },
  { model: "M700 Survey", ammo: ".270", family: "rifle", note: "Bolt hunting rifle. Flat as a rumor." },
  { model: "BB Rifle", ammo: "bb", family: "rifle", note: "Spring-air. The first gun every rider is handed. Silent, harmless, and never useless." },
  { model: "M70 Springfield", ammo: ".30-06", family: "rifle", note: "Classic '06 bolt. Five up. Beasts and plate both notice." },
  { model: "M1903 Marksman", ammo: ".30-06", family: "sniper", unlockRegion: "slagtown", note: "The rifle the .30-06 was built around. AP 2, out-ranges everything ballistic." },
  { model: "M14 Battle", ammo: ".308", family: "rifle", note: "AP 1. Punches plate if you sit still." },
  { model: "M10 Battle", ammo: ".308", family: "rifle", note: "Modern .308. Mag dumps with manners." },
  { model: "M24 Marksman", ammo: ".308", family: "sniper", note: "Long is home. Close is a problem." },
  { model: "M70 Magnum", ammo: ".300", family: "sniper", unlockRegion: "blackspire", note: ".300 Win Mag. After Slag Town. Recoil is a lifestyle." },
  { model: "L4 Pulse", ammo: "laser", family: "energy", unlockRegion: "blackspire", note: "Arc III. Blackspire. Coil cells will not seat." },
  { model: "L6 Carbine", ammo: "laser", family: "energy", unlockRegion: "brasswater", note: "Arc IV. Brasswater. No recoil. Powered plate notices." },
  { model: "L8 Rifle", ammo: "laser", family: "energy", unlockRegion: "veyra", note: "Arc V. Veyra. Long laser. AP 2 vs AEGIS." },
  { model: "L9 Long", ammo: "laser", family: "energy", unlockRegion: "veyra", note: "Arc V. Successor-pattern coherent. After the Sink." },
];
