import type {
  ClassName,
  StatKey,
  Stats,
  Rarity,
  Item,
  ItemKind,
  RoomId,
  LocationId,
  RollEntry,
  Bounty,
  ShopOffer,
} from "./types";

export const TICK_SECONDS = 1.4;
export const SAVE_KEY = "synaps-t0880-v1";
export const SAVE_VERSION = 5;

export const CLASSES: ClassName[] = [
  "Warrior",
  "Wizard",
  "Rogue",
  "Healer",
  "Merchant",
  "Bard",
];

export const CLASS_HP: Record<ClassName, number> = {
  Warrior: 12,
  Wizard: 7,
  Rogue: 8,
  Healer: 9,
  Merchant: 8,
  Bard: 8,
};

export const CLASS_BASE: Record<ClassName, Stats> = {
  Warrior: { STR: 8, DEF: 7, INT: 3, WIS: 4, SPD: 4, CHA: 3, LCK: 3 },
  Wizard: { STR: 3, DEF: 2, INT: 9, WIS: 7, SPD: 5, CHA: 4, LCK: 4 },
  Rogue: { STR: 5, DEF: 3, INT: 5, WIS: 4, SPD: 9, CHA: 6, LCK: 7 },
  Healer: { STR: 3, DEF: 4, INT: 6, WIS: 9, SPD: 4, CHA: 7, LCK: 5 },
  Merchant: { STR: 3, DEF: 3, INT: 6, WIS: 5, SPD: 5, CHA: 8, LCK: 8 },
  Bard: { STR: 3, DEF: 2, INT: 5, WIS: 6, SPD: 6, CHA: 10, LCK: 5 },
};

export const PRIMARY_STAT: Record<ClassName, StatKey> = {
  Warrior: "STR",
  Wizard: "INT",
  Rogue: "SPD",
  Healer: "WIS",
  Merchant: "CHA",
  Bard: "CHA",
};

export const CLASS_GIFT: Record<ClassName, { name: string; desc: string }> = {
  Warrior: {
    name: "Shield Block",
    desc: "Absorb incoming damage for the squad this round. Once per day.",
  },
  Wizard: {
    name: "Arcane Surge",
    desc: "Double the effect of the next roll. Once per day.",
  },
  Rogue: {
    name: "Shadow Step",
    desc: "Avoid one consequence entirely. Once per day.",
  },
  Healer: {
    name: "Miracle Touch",
    desc: "Restore a downed operative to 1 HP instantly. Once per day.",
  },
  Merchant: {
    name: "Black Market",
    desc: "Pull one mid-sortie item from a contact. Once per day.",
  },
  Bard: {
    name: "Encore",
    desc: "Re-roll any failed check. Once per day.",
  },
};

export const CLASS_LORE: Record<
  ClassName,
  { tagline: string; playstyle: string }
> = {
  Warrior: {
    tagline: "They showed up when things were falling apart. They haven't left.",
    playstyle: "Anchor the party. Take the hit. Hold the line.",
  },
  Wizard: {
    tagline: "Magic in the Hollow is not a skill. It is a conversation.",
    playstyle: "Change what is possible. Do not take the hit.",
  },
  Rogue: {
    tagline: "Rogues exist in the space between things.",
    playstyle: "Do not fight fair. Use the exit, the dark, the other people.",
  },
  Healer: {
    tagline: "They have seen the worst the Hollow can do. They came back anyway.",
    playstyle: "Win days that should have ended.",
  },
  Merchant: {
    tagline: "Everything has a price. They are the one who set it.",
    playstyle: "Make the impossible affordable.",
  },
  Bard: {
    tagline: "They came to document the Hollow. Or to escape something.",
    playstyle: "Play the game at a different layer. The Hollow is an audience.",
  },
};

export const TRAIT_TIERS = [
  { level: "Weakened", range: [1, 4] as [number, number], bonus: -1 },
  { level: "Standard", range: [5, 9] as [number, number], bonus: 0 },
  { level: "Strong", range: [10, 14] as [number, number], bonus: 1 },
  { level: "Exceptional", range: [15, 19] as [number, number], bonus: 2 },
  { level: "Legendary", range: [20, 20] as [number, number], bonus: 3 },
];

export const ORIGINS = [
  "Ironclad",
  "Crumbling Kingdom",
  "Underground Caverns",
  "Veyra City",
  "Sunken Library",
];

export const FIRST_NAMES = [
  "Voss",
  "Ryn",
  "Kael",
  "Mira",
  "Thorn",
  "Ash",
  "Nyla",
  "Kade",
  "Sera",
  "Bram",
  "Lior",
  "Vex",
  "Tess",
  "Orin",
  "Wren",
  "Ilya",
  "Calder",
  "Nyx",
  "Rowan",
  "Pax",
  "Quill",
  "Hale",
  "Ione",
  "Maren",
];

export const LAST_NAMES = [
  "Ashford",
  "Vane",
  "Holloway",
  "Rudge",
  "Krell",
  "Drift",
  "Ember",
  "Stone",
  "Marsh",
  "Vale",
  "Quill",
  "Cinder",
  "Warden",
  "Moss",
  "Graves",
  "Pike",
  "Solace",
  "Dusk",
];

export function pickByRoll<T extends { r: [number, number] }>(
  table: T[],
  roll: number,
): T {
  return (
    table.find((t) => roll >= t.r[0] && roll <= t.r[1]) ??
    table[Math.floor(table.length / 2)]
  );
}

export const REP: Record<ClassName, RollEntry[]> = {
  Warrior: [
    { r: [1, 1], title: "The Broken Shield", passive: "-1 first combat roll each day." },
    { r: [2, 2], title: "The Deserter", passive: "Cannot call authority. +1 solo stealth." },
    { r: [3, 3], title: "The Cursed Blade", passive: "First weapon roll each arc disadvantaged." },
    { r: [4, 4], title: "The Unfinished War", passive: "-1 intimidation with nobility." },
    { r: [5, 7], title: "The Steadfast", passive: "Allies nearby cannot be coerced." },
    { r: [8, 9], title: "The Iron Wall", passive: "+1 DEF when protecting another." },
    { r: [10, 11], title: "The Oathkeeper", passive: "Declare an oath once/day. +2 if kept." },
    { r: [12, 13], title: "The Last Line", passive: "+2 combat at 3 HP or below." },
    { r: [14, 14], title: "The Hollow's Bulwark", passive: "Immune to first curse each arc." },
    { r: [15, 16], title: "The Undying", passive: "If dying, 10+ on d20 survive at 1 HP." },
    { r: [17, 18], title: "The Warlord of Ash", passive: "Can command allies on 15+." },
    { r: [19, 19], title: "The Unkillable", passive: "+1 all combat. Hostiles target others first." },
    { r: [20, 20], title: "THE HOLLOW'S CHAMPION", passive: "Once/arc, call the Hollow for auto-success." },
  ],
  Wizard: [
    { r: [1, 1], title: "The Silenced", passive: "First spell/day: d6, 1-2 backfire." },
    { r: [2, 2], title: "The Forbidden Scholar", passive: "+2 INT, -1 WIS. Restricted knowledge." },
    { r: [3, 3], title: "The Unstable", passive: "On fumble, spell hits a random target." },
    { r: [4, 4], title: "The Once-Great", passive: "-1 spell rolls, +2 in academic settings." },
    { r: [5, 7], title: "The Theorist", passive: "+1 puzzle and knowledge rolls." },
    { r: [8, 9], title: "The Practical Caster", passive: "Cast minor spells without a roll." },
    { r: [10, 11], title: "The Arcanist", passive: "+1 INT. Arcane locks open without a roll." },
    { r: [12, 13], title: "The Seeker", passive: "Once/day, one true answer from the Hollow." },
    { r: [14, 14], title: "The Hollow's Eye", passive: "+2 detecting illusions and Hollow entities." },
    { r: [15, 16], title: "The Void Speaker", passive: "Once/arc, attempt communication with any entity." },
    { r: [17, 18], title: "The Architect of Ruin", passive: "+2 area-effect and destructive spells." },
    { r: [19, 19], title: "The Worldbreaker", passive: "+2 all spells. Average-INT NPCs fear them." },
    { r: [20, 20], title: "THE HOLLOW'S ORACLE", passive: "Once/arc, one true future event." },
  ],
  Rogue: [
    { r: [1, 1], title: "The Marked", passive: "Once/day an NPC may recognise them." },
    { r: [2, 2], title: "The Burned Informant", passive: "-1 trust. +1 solo stealth." },
    { r: [3, 3], title: "The Clumsy Thief", passive: "First theft/day: 1-2 on d6 = caught." },
    { r: [4, 4], title: "The Wanted", passive: "A faction is actively looking for them." },
    { r: [5, 7], title: "The Shadow", passive: "+1 stealth in urban environments." },
    { r: [8, 9], title: "The Grifter", passive: "+1 deception. First lie believed." },
    { r: [10, 11], title: "The Ghost", passive: "Leave no trace unless rolling 1-3." },
    { r: [12, 13], title: "The Contractor", passive: "Once/arc, name a price. An NPC pays." },
    { r: [14, 14], title: "The Hollow's Shadow", passive: "+2 stealth in Hollow locations." },
    { r: [15, 16], title: "The Phantom", passive: "Undetectable by mundane means in darkness." },
    { r: [17, 18], title: "The Ghost Contract", passive: "Once/arc, one action with no roll." },
    { r: [19, 19], title: "The Unseen Hand", passive: "Others take blame unless witnessed." },
    { r: [20, 20], title: "THE HOLLOW'S KNIFE", passive: "Once/arc, any action succeeds. No consequence." },
  ],
  Healer: [
    { r: [1, 1], title: "The Burnout", passive: "First heal/day costs 1 HP from themselves." },
    { r: [2, 2], title: "The Doubted", passive: "-1 trust with strangers. +2 with those they've saved." },
    { r: [3, 3], title: "The Rattled", passive: "Healing -1 in combat until they take damage." },
    { r: [4, 4], title: "The Haunted", passive: "-1 in situations that mirror a past loss." },
    { r: [5, 7], title: "The Field Medic", passive: "+1 stabilising downed characters." },
    { r: [8, 9], title: "The Trusted", passive: "+1 social in distress. NPCs seek them out." },
    { r: [10, 11], title: "The Keeper", passive: "Once/day, prevent a character going below 1 HP." },
    { r: [12, 13], title: "The Order's Voice", passive: "Healing Order NPCs offer resources free." },
    { r: [14, 14], title: "The Hollow's Hands", passive: "+2 healing in Hollow locations." },
    { r: [15, 16], title: "The Saint", passive: "Once/arc, full heal any character. No roll." },
    { r: [17, 18], title: "The Death's Edge", passive: "Attempt revival of the dead. 15+ succeeds." },
    { r: [19, 19], title: "The Miracle", passive: "Once/arc, healing roll auto-succeeds at max." },
    { r: [20, 20], title: "THE HOLLOW'S GRACE", passive: "Once/arc, reverse a death this day." },
  ],
  Merchant: [
    { r: [1, 1], title: "The Debtor", passive: "Owes someone. The Hollow holds the debt." },
    { r: [2, 2], title: "The Fraudster", passive: "+1 deception, -2 with guilds if exposed." },
    { r: [3, 3], title: "The Undercut", passive: "First trade/day: a rival appears with a better offer." },
    { r: [4, 4], title: "The Blacklisted", passive: "One major faction refuses to deal." },
    { r: [5, 7], title: "The Traveller", passive: "+1 finding rare goods in new locations." },
    { r: [8, 9], title: "The Negotiator", passive: "+1 all trade and negotiation." },
    { r: [10, 11], title: "The Connected", passive: "In any location, knows one useful NPC." },
    { r: [12, 13], title: "The Broker", passive: "Once/day, create a deal between two NPCs." },
    { r: [14, 14], title: "The Hollow's Coin", passive: "+2 transactions in Hollow locations." },
    { r: [15, 16], title: "The Kingmaker", passive: "Once/arc, elevate or ruin one NPC's status." },
    { r: [17, 18], title: "The Cartel", passive: "Controls prices in one location. +3 there." },
    { r: [19, 19], title: "The Exchange", passive: "Once/arc, trade any item for any item." },
    { r: [20, 20], title: "THE HOLLOW'S PRICE", passive: "Once/arc, name a price. An NPC pays it." },
  ],
  Bard: [
    { r: [1, 1], title: "The Heckled", passive: "First performance/day: audience hostile on 1-3." },
    { r: [2, 2], title: "The One-Hit", passive: "-1 repeat performances with the same audience." },
    { r: [3, 3], title: "The Plagiarist", passive: "+1 copying styles. -2 if exposed." },
    { r: [4, 4], title: "The Forgotten", passive: "NPCs don't remember their name without prompting." },
    { r: [5, 7], title: "The Entertainer", passive: "+1 first performance in any new location." },
    { r: [8, 9], title: "The Crowd-Reader", passive: "+1 mass persuasion and performance." },
    { r: [10, 11], title: "The Storyteller", passive: "Once/day, reframe a situation. +2 result." },
    { r: [12, 13], title: "The Court Favourite", passive: "Noble NPCs grant access and favours." },
    { r: [14, 14], title: "The Hollow's Voice", passive: "+2 performances in Hollow locations." },
    { r: [15, 16], title: "The Legend", passive: "Once/arc, performance reaches any audience." },
    { r: [17, 18], title: "The Memory", passive: "Stories they tell become permanent NPC memories." },
    { r: [19, 19], title: "The Epoch", passive: "Once/arc, performance changes faction attitudes." },
    { r: [20, 20], title: "THE HOLLOW'S SONG", passive: "Once/arc, perform something the Hollow remembers forever." },
  ],
};

export const SIGNATURE: Record<ClassName, RollEntry[]> = {
  Warrior: [
    { r: [1, 2], name: "Reckless Charge", desc: "-1 DEF, +2 first attack each day." },
    { r: [3, 4], name: "Broken Form", desc: "Unpredictable. +1 to surprise strikes." },
    { r: [5, 6], name: "Shield Wall", desc: "Allies get +1 DEF while stationary." },
    { r: [7, 8], name: "Weapon Read", desc: "+1 vs same enemy after first exchange." },
    { r: [9, 10], name: "War Cry", desc: "Once/day, enemy must roll to act next turn." },
    { r: [11, 12], name: "Controlled Aggression", desc: "+2 first strike after observing." },
    { r: [13, 14], name: "Endurance Fighter", desc: "+1 each subsequent combat round." },
    { r: [15, 16], name: "Execution Strike", desc: "+3 attack vs enemies below half HP." },
    { r: [17, 18], name: "Counter", desc: "When an attack fails against them, free strike." },
    { r: [19, 19], name: "Battlefield Commander", desc: "Once/day, every ally gets +1 next roll." },
    { r: [20, 20], name: "THE HOLLOW'S BLADE", desc: "On a Critical, the effect lingers into next day." },
  ],
  Wizard: [
    { r: [1, 2], name: "Volatile Casting", desc: "Spells hit harder. 1-in-6 unexpected side effect." },
    { r: [3, 4], name: "Forbidden Indexing", desc: "Attempt any knowledge roll regardless of subject." },
    { r: [5, 6], name: "Spell Dampening", desc: "Halve an incoming magical effect. Once/day." },
    { r: [7, 8], name: "Rune Reading", desc: "+2 to decipher inscriptions and Hollow markings." },
    { r: [9, 10], name: "Projection", desc: "Cast a minor illusion without a roll. Once/day." },
    { r: [11, 12], name: "Arcane Diagnosis", desc: "Identify any magical effect by touch. No roll." },
    { r: [13, 14], name: "Counter-Spell", desc: "Interrupt enemy magic. INT vs difficulty." },
    { r: [15, 16], name: "Hollow Channelling", desc: "Once/arc, cast beyond normal tier." },
    { r: [17, 18], name: "Memory Casting", desc: "Replicate any spell witnessed. +1 to copies." },
    { r: [19, 19], name: "The Eye", desc: "See through one illusion or hidden thing per day." },
    { r: [20, 20], name: "THE HOLLOW'S TONGUE", desc: "Once/arc, ask the Hollow anything. It answers." },
  ],
  Rogue: [
    { r: [1, 2], name: "Pickpocketing", desc: "Lift small items on SPD. Fail means they notice." },
    { r: [3, 4], name: "Lock Reading", desc: "Identify any lock in 30 seconds. +2 lockpicking." },
    { r: [5, 6], name: "Forgery", desc: "Produce convincing false documents." },
    { r: [7, 8], name: "Tailing", desc: "Follow without detection unless actively watched." },
    { r: [9, 10], name: "Disguise", desc: "Assume a different identity. +2 CHA while disguised." },
    { r: [11, 12], name: "Poison Craft", desc: "Apply contact poison. Effect negotiated in the field." },
    { r: [13, 14], name: "Escape Artist", desc: "Cannot stay restrained more than one round." },
    { r: [15, 16], name: "Rooftop Navigation", desc: "Full speed across vertical terrain." },
    { r: [17, 18], name: "Dead Drop Network", desc: "Once/arc, retrieve intel from a hidden cache." },
    { r: [19, 19], name: "Ghost Entry", desc: "Enter any non-magical location. Leaves no trace." },
    { r: [20, 20], name: "THE HOLLOW'S SHADOW", desc: "Functionally invisible for one full scene." },
  ],
  Healer: [
    { r: [1, 2], name: "Field Stitching", desc: "Stabilise any wound without materials. Buys two rounds." },
    { r: [3, 4], name: "Poison Identification", desc: "Identify any toxin by sight. +2 treating poison." },
    { r: [5, 6], name: "Psychic First Aid", desc: "Treat fear and psychological status effects." },
    { r: [7, 8], name: "Curse Reading", desc: "Identify nature and source of any curse on contact." },
    { r: [9, 10], name: "Pain Management", desc: "Suppress injury penalty for one day." },
    { r: [11, 12], name: "Emergency Revival", desc: "Bring downed to consciousness. Once/day, no roll." },
    { r: [13, 14], name: "Herbal Synthesis", desc: "Create a restorative from available materials." },
    { r: [15, 16], name: "Hollow Medicine", desc: "Treatments in Hollow locations have doubled effect." },
    { r: [17, 18], name: "Death Diagnosis", desc: "Cause and time of death with complete accuracy." },
    { r: [19, 19], name: "Vital Read", desc: "Know exact HP and conditions by observation." },
    { r: [20, 20], name: "THE HOLLOW'S HANDS", desc: "Once/arc, full heal any character instantly." },
  ],
  Merchant: [
    { r: [1, 2], name: "Fast Talk", desc: "Distract an NPC. Buys one round without a roll." },
    { r: [3, 4], name: "Counterfeit Detection", desc: "Identify fakes instantly." },
    { r: [5, 6], name: "Bulk Negotiation", desc: "+2 group trade. Always better combined rates." },
    { r: [7, 8], name: "Market Reading", desc: "Know approximate value of any item. No roll." },
    { r: [9, 10], name: "Smuggling Routes", desc: "Move restricted goods. Risk only at checkpoints." },
    { r: [11, 12], name: "Credit Network", desc: "Access funds beyond inventory. Repaid next day." },
    { r: [13, 14], name: "Auction Control", desc: "Control pace and pressure of any bidding." },
    { r: [15, 16], name: "Bribery", desc: "CHA to find any NPC's price. They cooperate once." },
    { r: [17, 18], name: "Hollow Arbitrage", desc: "Once/arc, turn a worthless item useful." },
    { r: [19, 19], name: "The Long Game", desc: "Plant an arrangement. It pays off two days later." },
    { r: [20, 20], name: "THE HOLLOW'S PRICE", desc: "Once/arc, name a price. Anyone pays it." },
  ],
  Bard: [
    { r: [1, 2], name: "Crowd Reading", desc: "+2 to all mass persuasion rolls." },
    { r: [3, 4], name: "Improvisation", desc: "No penalty for unexpected situations." },
    { r: [5, 6], name: "Emotional Manipulation", desc: "Shift one NPC emotion. CHA roll." },
    { r: [7, 8], name: "Satire", desc: "Publicly humiliate a target. They lose one social this day." },
    { r: [9, 10], name: "Lullaby", desc: "Calm one hostile. They cannot attack for one round." },
    { r: [11, 12], name: "War Song", desc: "Allies gain +1 to their next roll in combat." },
    { r: [13, 14], name: "The Long Memory", desc: "Recall any lore heard before. +3 knowledge." },
    { r: [15, 16], name: "Hollow Resonance", desc: "In Hollow locations, extra unpredictable effect." },
    { r: [17, 18], name: "The Turning Song", desc: "Once/day, change the emotional state of a room." },
    { r: [19, 19], name: "The Epic", desc: "Once/arc, permanently change how a faction views a player." },
    { r: [20, 20], name: "THE HOLLOW'S SONG", desc: "Once/arc, performance becomes permanent world memory." },
  ],
};

export const SHADOW: Record<ClassName, RollEntry[]> = {
  Warrior: [
    { r: [1, 2], name: "The Coward's Scar", desc: "Has run from one fight. -1 in matching circumstances." },
    { r: [3, 4], name: "The Berserker Flaw", desc: "Below 3 HP, WIS 10+ or attack nearest." },
    { r: [5, 6], name: "The Oath-Breaker", desc: "Broke a vow. -2 with that faction." },
    { r: [7, 8], name: "The Blood Debt", desc: "Owes a life. The creditor hasn't collected yet." },
    { r: [9, 10], name: "The Haunted Blade", desc: "Weapon carries a death. Once/arc it reacts." },
    { r: [11, 12], name: "The War Fatigue", desc: "Extended combat: -1 cumulative after day 3." },
    { r: [13, 14], name: "The Fallen Banner", desc: "-1 trust with Kingdom remnants." },
    { r: [15, 16], name: "The Unnecessary Death", desc: "Someone died because of their choice." },
    { r: [17, 18], name: "The Pride", desc: "Cannot accept help at full HP. Must attempt alone first." },
    { r: [19, 20], name: "The Hollow's Claim", desc: "The Hollow marked them. It is owed a service." },
  ],
  Wizard: [
    { r: [1, 2], name: "The Forbidden Study", desc: "Something knows they know." },
    { r: [3, 4], name: "The Failed Spell", desc: "A spell went wrong. Someone was hurt." },
    { r: [5, 6], name: "The Dependency", desc: "Without an arcane substance: -1 after day 2." },
    { r: [7, 8], name: "The Stolen Research", desc: "Their best work isn't theirs." },
    { r: [9, 10], name: "The Unfinished Experiment", desc: "Left something running. It is still running." },
    { r: [11, 12], name: "The Hollow Contact", desc: "Something reached out. They responded. It remembers." },
    { r: [13, 14], name: "The Broken Equation", desc: "-1 WIS when the unsolved problem comes up." },
    { r: [15, 16], name: "The Rival", desc: "Another scholar wants their position." },
    { r: [17, 18], name: "The Hubris", desc: "Once/arc, intelligence does not exempt them." },
    { r: [19, 20], name: "The Void Conversation", desc: "The Hollow spoke. They are not sure they understood." },
  ],
  Rogue: [
    { r: [1, 2], name: "The Burned Contact", desc: "Sold someone out. They escaped. They know." },
    { r: [3, 4], name: "The Recognisable Face", desc: "-2 stealth in one location." },
    { r: [5, 6], name: "The Loose Ledger", desc: "Their name appears in a crime record." },
    { r: [7, 8], name: "The Unkept Promise", desc: "Failed to deliver. The client is patient. For now." },
    { r: [9, 10], name: "The Double Life", desc: "Once/arc, the wrong identity surfaces." },
    { r: [11, 12], name: "The Collateral", desc: "Someone innocent was hurt during a job." },
    { r: [13, 14], name: "The Ghost That Talks", desc: "Left a witness alive. The witness has been talking." },
    { r: [15, 16], name: "The Hollow's Record", desc: "The Hollow tracked one of their jobs." },
    { r: [17, 18], name: "The Price on the Head", desc: "A faction has an open contract on them." },
    { r: [19, 20], name: "The Thing They Kept", desc: "Stole something they should have returned." },
  ],
  Healer: [
    { r: [1, 2], name: "The One They Couldn't Save", desc: "A patient died. They remember every detail." },
    { r: [3, 4], name: "The Hollow Debt", desc: "Used the Hollow to save a life. It considers this a transaction." },
    { r: [5, 6], name: "The Restricted Knowledge", desc: "Knows a method the Order forbids. Has used it." },
    { r: [7, 8], name: "The Mercy Problem", desc: "Helped someone who later caused harm." },
    { r: [9, 10], name: "The Healer's Burnout", desc: "Once/arc, one healing roll automatically fails." },
    { r: [11, 12], name: "The Forbidden Patient", desc: "Healed someone they were told not to." },
    { r: [13, 14], name: "The Misdiagnosis", desc: "Got something wrong. The error remains in the record." },
    { r: [15, 16], name: "The Last Rite", desc: "Performed a death rite for someone who wasn't quite dead." },
    { r: [17, 18], name: "The Order's Eye", desc: "The Healing Order is watching their methods." },
    { r: [19, 20], name: "The Hollow's Ward", desc: "The Hollow protected them once. It expects something." },
  ],
  Merchant: [
    { r: [1, 2], name: "The Unpaid Debt", desc: "Owes a significant sum. Not yet called in." },
    { r: [3, 4], name: "The Forged Ledger", desc: "One major transaction was fraudulent." },
    { r: [5, 6], name: "The Ruined Partner", desc: "A previous partner lost everything in a shared deal." },
    { r: [7, 8], name: "The Cursed Stock", desc: "Sold something cursed. The buyer remembers." },
    { r: [9, 10], name: "The Guild Suspension", desc: "Removed from a guild. Reason: classified." },
    { r: [11, 12], name: "The Leverage", desc: "Someone has information. Has not used it. Yet." },
    { r: [13, 14], name: "The Hollow Trade", desc: "A Hollow transaction. The Hollow considers it binding." },
    { r: [15, 16], name: "The Undercut", desc: "Destroyed a competitor. They rebuilt. With allies." },
    { r: [17, 18], name: "The Stolen Route", desc: "Uses a route that belongs to someone else." },
    { r: [19, 20], name: "The Price of Everything", desc: "Once/arc this knowledge is used against them." },
  ],
  Bard: [
    { r: [1, 2], name: "The Stolen Song", desc: "Their most famous work belongs to someone else." },
    { r: [3, 4], name: "The Told Secret", desc: "Used someone's confidence in a performance." },
    { r: [5, 6], name: "The Exaggerated Legend", desc: "A story about themselves is not entirely true." },
    { r: [7, 8], name: "The Inspired Enemy", desc: "A performance moved the wrong person." },
    { r: [9, 10], name: "The Hollow Audience", desc: "Something in a Hollow audience has not forgotten." },
    { r: [11, 12], name: "The Unfinished Saga", desc: "Began a story they never finished. The subjects wait." },
    { r: [13, 14], name: "The Witness", desc: "Saw something they were not supposed to. Turned it into art." },
    { r: [15, 16], name: "The Price of Fame", desc: "Anonymity is impossible in populated areas." },
    { r: [17, 18], name: "The Last Performance", desc: "Performed for someone who died immediately after." },
    { r: [19, 20], name: "The Hollow's Memory", desc: "The Hollow recorded one performance. Purpose unknown." },
  ],
};

export const ENCHANTS: Record<ClassName, RollEntry[]> = {
  Warrior: [
    { r: [1, 3], name: "Iron Oath", desc: "Declare a target. +1 ATK until they fall." },
    { r: [4, 6], name: "Blood Memory", desc: "After taking damage, +1 ATK rest of day." },
    { r: [7, 9], name: "The Unbreaking", desc: "Weapon cannot be destroyed or disarmed." },
    { r: [10, 12], name: "Hollow Temper", desc: "In Hollow locations, +1 damage." },
    { r: [13, 15], name: "The Last Word", desc: "Once/arc, guaranteed final strike on a marked enemy." },
    { r: [16, 18], name: "War's Echo", desc: "First attack each day is maximum effect." },
    { r: [19, 19], name: "The Hollow's Hunger", desc: "Weapon grows +1 each day (resets per arc)." },
    { r: [20, 20], name: "THE VOID BLESSING", desc: "Strikes bypass all resistances." },
  ],
  Wizard: [
    { r: [1, 3], name: "Arcane Loop", desc: "Once/day, recast a failed spell without cost." },
    { r: [4, 6], name: "Hollow Resonance", desc: "Spells in Hollow locations +1 effect." },
    { r: [7, 9], name: "The Unbinding", desc: "Once/arc, break any ward. No roll." },
    { r: [10, 12], name: "Echo Casting", desc: "Spells may trigger again on 15+ next round." },
    { r: [13, 15], name: "Void Channel", desc: "Once/day, channel the Hollow directly." },
    { r: [16, 18], name: "Memory Archive", desc: "Store any knowledge. Perfect recall." },
    { r: [19, 19], name: "The Hollow's Library", desc: "Once/arc, access any knowledge the Hollow has." },
    { r: [20, 20], name: "THE VOID MIND", desc: "Spells cannot fail completely. Minimum Weak Hit." },
  ],
  Rogue: [
    { r: [1, 3], name: "Shadow Step", desc: "Once/day, avoid one consequence entirely." },
    { r: [4, 6], name: "The Clean Exit", desc: "Once/day, leave any situation unfollowed." },
    { r: [7, 9], name: "Hollow Fade", desc: "In Hollow locations, undetectable once/day." },
    { r: [10, 12], name: "The Long Memory", desc: "Never forget a face, location, or overheard word." },
    { r: [13, 15], name: "Ghost Touch", desc: "Handling items leaves no physical trace." },
    { r: [16, 18], name: "The Null", desc: "Once/arc, an action cannot be proven." },
    { r: [19, 19], name: "The Hollow's Cloak", desc: "Impossible to scry." },
    { r: [20, 20], name: "THE VOID STEP", desc: "Once/arc, be in two locations for one scene." },
  ],
  Healer: [
    { r: [1, 3], name: "The Mending", desc: "Healing always restores at least 1 HP." },
    { r: [4, 6], name: "Hollow Touch", desc: "Healing in Hollow locations +1 HP." },
    { r: [7, 9], name: "The Ward", desc: "Once/day, prevent all damage to one character one round." },
    { r: [10, 12], name: "Soul Read", desc: "By touch, know exact HP and conditions." },
    { r: [13, 15], name: "The Stitch", desc: "Repair item condition one tier. Once/day." },
    { r: [16, 18], name: "Life Debt", desc: "Revived characters get +1 all rolls next day." },
    { r: [19, 19], name: "The Hollow's Grace", desc: "Once/arc, heal is maximised without a roll." },
    { r: [20, 20], name: "THE VOID MEND", desc: "Once/arc, undo one physical event from this day." },
  ],
  Merchant: [
    { r: [1, 3], name: "Gilded Tongue", desc: "First trade each day automatically favours them." },
    { r: [4, 6], name: "Hollow Market", desc: "In Hollow locations, find one item unavailable elsewhere." },
    { r: [7, 9], name: "The Living Ledger", desc: "Automatically know if a deal is unfair." },
    { r: [10, 12], name: "Demand Creation", desc: "Once/day, make an NPC want something new." },
    { r: [13, 15], name: "The Network", desc: "Once/arc, a contact delivers something useful. No cost." },
    { r: [16, 18], name: "Compound Interest", desc: "Each day without a deal, next deal +1 (max +3)." },
    { r: [19, 19], name: "The Hollow's Economy", desc: "Once/arc, exchange anything at agreed value." },
    { r: [20, 20], name: "THE VOID MARKET", desc: "Once/arc, create an item that does not exist." },
  ],
  Bard: [
    { r: [1, 3], name: "The Encore", desc: "Once/day, repeat a successful performance's effect." },
    { r: [4, 6], name: "Hollow Song", desc: "In Hollow locations, extra unpredictable effect." },
    { r: [7, 9], name: "The Living Record", desc: "Stories become true memory for NPCs who hear them." },
    { r: [10, 12], name: "Crowd Pull", desc: "Once/day, draw any NPC's attention for one round." },
    { r: [13, 15], name: "The Long Note", desc: "A performance effect can persist until next day." },
    { r: [16, 18], name: "The Stirring", desc: "Once/day, change the emotional state of a crowd." },
    { r: [19, 19], name: "The Hollow's Resonance", desc: "Once/arc, performance affects Hollow entities." },
    { r: [20, 20], name: "THE VOID CHORUS", desc: "Once/arc, change one permanent world truth." },
  ],
};

export const DESTINY: Record<ClassName, RollEntry[]> = {
  Warrior: [
    { r: [1, 3], thread: "You will face something that cannot be killed by force alone." },
    { r: [4, 6], thread: "Someone you protect will betray you. You will let it happen." },
    { r: [7, 9], thread: "The war you fought is not over. The side was never the side you thought." },
    { r: [10, 12], thread: "You will choose between your weapon and something you value more." },
    { r: [13, 15], thread: "A battle is coming you cannot win. You will fight it anyway." },
    { r: [16, 18], thread: "You will become the thing others make stories about." },
    { r: [19, 19], thread: "The Hollow made you a warrior for a purpose you have not understood." },
    { r: [20, 20], thread: "You are the last of something. When you understand what, everything changes." },
  ],
  Wizard: [
    { r: [1, 3], thread: "The knowledge you seek will change what you are. You seek it anyway." },
    { r: [4, 6], thread: "You will find something in the Hollow no one was meant to find." },
    { r: [7, 9], thread: "The answer is in a place you cannot go without becoming someone else." },
    { r: [10, 12], thread: "Something you know will save a life and end another." },
    { r: [13, 15], thread: "The Hollow has a question for you. You will not recognise it." },
    { r: [16, 18], thread: "You will be offered everything you wanted. The offering is the test." },
    { r: [19, 19], thread: "You are not researching the Hollow. The Hollow is researching you." },
    { r: [20, 20], thread: "You already know how this ends. You have not admitted it yet." },
  ],
  Rogue: [
    { r: [1, 3], thread: "The person you are running from is not who you think. Neither are you." },
    { r: [4, 6], thread: "You will steal something that cannot be unfound." },
    { r: [7, 9], thread: "Someone is using you. When you find out, you will decide if it matters." },
    { r: [10, 12], thread: "The one job you refuse will find you anyway." },
    { r: [13, 15], thread: "Right place, wrong time — or the reverse. The Hollow has not decided." },
    { r: [16, 18], thread: "Your real name will surface." },
    { r: [19, 19], thread: "You have already changed something permanently. You do not know what." },
    { r: [20, 20], thread: "The Hollow has been following your work. It has an offer." },
  ],
  Healer: [
    { r: [1, 3], thread: "You will save someone who should not have survived." },
    { r: [4, 6], thread: "The one you could not save will become relevant again." },
    { r: [7, 9], thread: "You will be asked to choose between two lives." },
    { r: [10, 12], thread: "Your healing will be used for something you would not have chosen." },
    { r: [13, 15], thread: "Something is using your compassion against you." },
    { r: [16, 18], thread: "You will face a death you cannot prevent. The aftermath is the destiny." },
    { r: [19, 19], thread: "The Hollow wants something healed that it will not name." },
    { r: [20, 20], thread: "You are not here by accident. One moment has not happened yet." },
  ],
  Merchant: [
    { r: [1, 3], thread: "The deal that defines you is coming. You will not recognise it in time." },
    { r: [4, 6], thread: "You will possess something priceless. The price will be extracted either way." },
    { r: [7, 9], thread: "The network you built will be used against you from inside." },
    { r: [10, 12], thread: "You will be offered a transaction that is genuinely fair. It is the most dangerous offer." },
    { r: [13, 15], thread: "Something in the Hollow economy responds to you specifically." },
    { r: [16, 18], thread: "The currency you are actually trading is not coin." },
    { r: [19, 19], thread: "You will make a deal with something that does not deal in conventional terms." },
    { r: [20, 20], thread: "The Hollow considers you its merchant. This means something specific." },
  ],
  Bard: [
    { r: [1, 3], thread: "The song that defines the Hollow Realm is not yet written." },
    { r: [4, 6], thread: "You will tell a story that becomes true. You will not know it was prophecy." },
    { r: [7, 9], thread: "Your most important audience has not heard you yet." },
    { r: [10, 12], thread: "The story you are afraid to tell is the one that matters most." },
    { r: [13, 15], thread: "You will witness the defining moment of this arc." },
    { r: [16, 18], thread: "Something in the Hollow remembers an older version of a song you know." },
    { r: [19, 19], thread: "The Hollow is listening to everything you perform. It is building something." },
    { r: [20, 20], thread: "You are the narrator of this story. That means you can change how it ends." },
  ],
};

export interface RaceDef {
  name: string;
  tagline: string;
  stats: Stats;
  ability: string;
  kit: string[];
  lineage: Record<string, string>;
  vulnerability: string;
  desc: string;
}

export const RACES: Record<string, RaceDef> = {
  "Dust-Walker": {
    name: "Dust-Walker",
    tagline: "Nomads of the Edge. They walked too close to the void, and the void walked back.",
    stats: { STR: 0, DEF: 0, INT: 0, WIS: 2, SPD: 1, CHA: -2, LCK: 0 },
    ability: "Void-Scarred — Once per day, ignore a magical attack or curse entirely.",
    kit: ["Scavenged Breathing Mask", "Dried Void-Moss x3"],
    lineage: {
      "Ash-Stalker": "+2 stealth in grey environments. Starts with a serrated bone-knife.",
      "Void-Oracle": "+2 WIS. Can read an object's history by touch, at a cost of 1 HP.",
    },
    vulnerability: "Fragile Mind: -2 vs psychic or mind-control.",
    desc: "Lean, weathered, violet-eyed. Layered dusters and wide-brimmed hats. Photosensitive skin; perfect night vision.",
  },
  "Garrison-Born": {
    name: "Garrison-Born",
    tagline: "The stubborn descendants of a ruined empire.",
    stats: { STR: 1, DEF: 2, INT: 0, WIS: 0, SPD: -1, CHA: 0, LCK: 0 },
    ability: "Iron Discipline — Immune to Fear. +1 combat when fighting beside an ally.",
    kit: ["Dented Sigil Ring", "Standard Issue Whetstone", "Ration Tin"],
    lineage: {
      "Iron-Guard": "+3 DEF when standing still. Starts with a heavy tower shield.",
      "Vanguard-Scout": "+2 SPD. Ignore difficult terrain when moving toward an enemy.",
    },
    vulnerability: "Heavy-Footed: -4 stealth on water or metal flooring. Cannot swim.",
    desc: "Dense bone, rigid posture, battered plate over utilitarian coats. Relics of authority in a world that forgot the lease.",
  },
  "The Sunken": {
    name: "The Sunken",
    tagline: "Information is a currency, and they run the mint.",
    stats: { STR: -1, DEF: 0, INT: 2, WIS: 0, SPD: 0, CHA: 2, LCK: 1 },
    ability: "Silver Tongue — Start with a Black Ledger. 10% off black-market trades.",
    kit: ["Encoded Ledger", "Silver Pocket Watch", "Fine Silk Handkerchief"],
    lineage: {
      "Guild-Broker": "Starts with 500 extra coins and a Favour token.",
      "Inksmith": "Can craft a one-time Living Tattoo buff.",
    },
    vulnerability: "Dehydrated: exhaustion stacks twice as fast away from humidity.",
    desc: "Sleek, damp-hemmed coats, oxidized silver. Recessed gills. Aristocrats of the underworld.",
  },
  "Deep-Claimed": {
    name: "Deep-Claimed",
    tagline: "Trapped in the dark, they became harder than the stone.",
    stats: { STR: 2, DEF: 1, INT: -1, WIS: 0, SPD: 0, CHA: -1, LCK: 0 },
    ability: "Stonebreaker — Mine Hollow Ore without tools. Detect structural traps in the dark.",
    kit: ["Heavy Work Gloves", "Glowing Ore Fragment", "Chisel"],
    lineage: {
      "Bedrock-Bulwark": "Cannot be knocked down or pushed back.",
      "Ore-Seer": "Can smell precious metals through five feet of stone.",
    },
    vulnerability: "Light-Blinded: -3 to all rolls for an hour after bright light.",
    desc: "Hulking, ore-veined, pale. Mining tools as weapons. The mountain gives nothing; you take it.",
  },
  "Aether-Kith": {
    name: "Aether-Kith",
    tagline: "Remnants of the high-culture, drifting between states of matter.",
    stats: { STR: -2, DEF: -1, INT: 1, WIS: 1, SPD: 0, CHA: 1, LCK: 3 },
    ability: "Phase Shift — Once per combat, move through a solid object or enemy.",
    kit: ["Glass Vial of Essence", "Translucent Cape", "Ancient Map Fragment"],
    lineage: {
      "Wisp-Kin": "Hover over gaps or pressure plates without triggering them.",
      "Spark-Weaver": "Generate small electrical charges to power relics or shock.",
    },
    vulnerability: "Disrupted Form: 1d4 damage each turn inside anti-magic fields.",
    desc: "Translucent, weightless, prism-haze outlines. Form is temporary; energy is eternal.",
  },
  "Hollow-Touched": {
    name: "Hollow-Touched",
    tagline: "Marked by the void.",
    stats: { STR: 1, DEF: 0, INT: 1, WIS: 0, SPD: 0, CHA: -1, LCK: 3 },
    ability: "Void Resonance — Once per day, reroll a failed Hollow-related check. The Hollow notices.",
    kit: ["Void-Stained Cloth", "Unlabeled Vial"],
    lineage: {
      "Rift-Born": "+1 LCK. Once per arc, ignore a fumble in a Hollow location.",
      "Echo-Walker": "+1 INT. Sense nearby Hollow entities without a roll.",
    },
    vulnerability: "Hollow Hunger: after a fumble in a Hollow location, lose 1 HP as the void drinks.",
    desc: "Ordinary until the light hits wrong. A faint inner absence. People step aside without knowing why.",
  },
};

export interface CompanionDef {
  name: string;
  hp: number;
  cost: number;
  statBuff: Partial<Stats>;
  active: string;
  passive: string;
  maintenance: string;
  desc: string;
}

export const COMPANIONS: Record<string, CompanionDef> = {
  "Void-Hound": {
    name: "Void-Hound",
    hp: 5,
    cost: 900,
    statBuff: { CHA: 1 },
    active: "Echo Bark — Enemies nearby must resist Stun. Hidden enemies revealed.",
    passive: "Scent of the Collapse — +2 trap detection and initiative.",
    maintenance: "Feeds on raw meat and negative energy. Healed only by consuming a shadow.",
    desc: "Ash and cinder packed into a wolf's shape. Violet smoke for eyes.",
  },
  "Scavenger Crow": {
    name: "Scavenger Crow",
    hp: 3,
    cost: 700,
    statBuff: { LCK: 1 },
    active: "Pilfer — Retrieve a small unsecured object up to 30 feet without breaking stealth.",
    passive: "Grave Robber — extra loot chance after combat.",
    maintenance: "Requires a shiny bribe every few days or it drops your items.",
    desc: "Turkey-sized, serrated beak, copper wire in its feathers. Speaks with stolen last words.",
  },
  "Clockwork Mule": {
    name: "Clockwork Mule",
    hp: 8,
    cost: 1100,
    statBuff: { DEF: 1 },
    active: "Mobile Barricade — Locks joints. +2 DEF cover. Cannot move while locked.",
    passive: "Tireless Hauler — +5 inventory slots.",
    maintenance: "Needs scrap and oil. At 0 HP it dumps cargo.",
    desc: "Headless iron bulldog. Kingdom crests faded on its flanks. Always ticking.",
  },
  "Mender Sprite": {
    name: "Mender Sprite",
    hp: 2,
    cost: 850,
    statBuff: { WIS: 1 },
    active: "Cauterizing Sap — Heal 1d6, target takes -1 next attack from the pain.",
    passive: "Guardian Light — Once per day, if you hit 0 HP the sprite dies to stabilise you at 1.",
    maintenance: "Feeds on ambient magic. Double damage from area attacks.",
    desc: "A jagged shard of living amber. Smells of pine and ozone.",
  },
};

export interface WorldLoc {
  id: LocationId;
  name: string;
  short: string;
  x: number;
  y: number;
  danger: number;
  desc: string;
  features: string[];
  connectedTo: LocationId[];
  hollow: boolean;
  unlockDay: number;
  bossId: string;
  bossAfter: number;
}

export const WORLD: WorldLoc[] = [
  {
    id: "hq",
    name: "SYNAPSE Compound",
    short: "HQ",
    x: 52,
    y: 56,
    danger: 1,
    desc: "Tyrone's desk. Safe enough. The CRT never sleeps.",
    features: ["The Forge", "The Infirmary", "The Ledger", "The Bunkhouse"],
    connectedTo: ["ironclad", "kingdom", "caverns", "library", "veyra"],
    hollow: false,
    unlockDay: 1,
    bossId: "",
    bossAfter: 99,
  },
  {
    id: "ironclad",
    name: "Ironclad",
    short: "Ironclad",
    x: 16,
    y: 40,
    danger: 3,
    desc: "The first gate. Forged walls, slag lanterns, a checkpoint that pretends to be a welcome.",
    features: ["Slag-hound pens", "Gate caches", "The Watch still walks"],
    connectedTo: ["hq", "kingdom", "veyra"],
    hollow: false,
    unlockDay: 1,
    bossId: "gravenor",
    bossAfter: 3,
  },
  {
    id: "kingdom",
    name: "The Crumbling Kingdom",
    short: "Kingdom",
    x: 50,
    y: 18,
    danger: 2,
    desc: "What is left of an empire. The walls still stand in places.",
    features: ["Garrison footlockers", "Throne room", "Military remnants"],
    connectedTo: ["hq", "ironclad", "caverns", "library"],
    hollow: false,
    unlockDay: 2,
    bossId: "valdris",
    bossAfter: 4,
  },
  {
    id: "caverns",
    name: "Underground Caverns",
    short: "Caverns",
    x: 24,
    y: 80,
    danger: 3,
    desc: "The deep dark beneath everything else.",
    features: ["Hollow ore deposits", "Mushroom clusters", "Unmapped deep"],
    connectedTo: ["hq", "kingdom", "library"],
    hollow: true,
    unlockDay: 3,
    bossId: "thessaly",
    bossAfter: 4,
  },
  {
    id: "library",
    name: "The Sunken Library",
    short: "Library",
    x: 78,
    y: 82,
    danger: 2,
    desc: "Partially submerged. Still functional. Still sinking.",
    features: ["Scholar cases", "Restricted archive", "The Sink below"],
    connectedTo: ["hq", "kingdom", "caverns", "veyra"],
    hollow: true,
    unlockDay: 4,
    bossId: "sink",
    bossAfter: 4,
  },
  {
    id: "veyra",
    name: "Veyra City",
    short: "Veyra",
    x: 86,
    y: 22,
    danger: 5,
    desc: "The last city on the seam. Wet stone, brass signs, a skyline that does not promise a way home.",
    features: ["Rift markets", "The Null Warden", "Time keeps bad hours"],
    connectedTo: ["hq", "ironclad", "library"],
    hollow: true,
    unlockDay: 6,
    bossId: "warden",
    bossAfter: 3,
  },
];

export interface VillainDef {
  id: string;
  name: string;
  title: string;
  loc: LocationId;
  arc: string;
  threat: string;
  tagline: string;
  lore: string;
  hp: number;
  atk: number;
  def: number;
  dc: number;
  phases: { name: string; at: number; desc: string }[];
  lootName: string;
}

export const VILLAINS: VillainDef[] = [
  {
    id: "gravenor",
    name: "Gravenor",
    title: "The Hollow's Hound",
    loc: "ironclad",
    arc: "Arc I — Ironclad",
    threat: "Extreme",
    tagline: "He was a man once. The Hollow made him something more useful.",
    lore: "A Warrior stationed at the Ironclad gate. His unit did not come back. He did. He leads the Ashen Pack by agreement, not command. Patient. Not cruel. Worse.",
    hp: 28,
    atk: 6,
    def: 4,
    dc: 14,
    phases: [
      { name: "The Watcher", at: 28, desc: "Observes. Tests. Will speak if approached with respect." },
      { name: "The Hunter", at: 18, desc: "Targets whoever hurt his pack. Precise." },
      { name: "The Feral", at: 10, desc: "The man recedes. Reckless, devastating." },
      { name: "The Reckoning", at: 0, desc: "One round of lucidity. He speaks." },
    ],
    lootName: "Ashen Fang",
  },
  {
    id: "valdris",
    name: "Valdris the Unmourned",
    title: "Last Chancellor",
    loc: "kingdom",
    arc: "Arc II — The Kingdom's Debt",
    threat: "High",
    tagline: "The Kingdom fell. He did not have the decency to go with it.",
    lore: "He facilitated collapse with leverage. The Hollow noticed the accounting. He cannot leave the throne room. He cannot die. He cannot settle what he owes.",
    hp: 24,
    atk: 5,
    def: 3,
    dc: 15,
    phases: [
      { name: "The Chancellor", at: 24, desc: "Diplomatic. Helpful. Building trust to spend later." },
      { name: "The Negotiator", at: 14, desc: "Offers improve. Costs worsen." },
      { name: "The Unmourned", at: 6, desc: "Drops the facade. Uses every piece of leverage." },
    ],
    lootName: "Kingdom Vault Key",
  },
  {
    id: "thessaly",
    name: "Thessaly Vane",
    title: "The Burned Cartographer",
    loc: "caverns",
    arc: "Arc IV — The Unmapped",
    threat: "High",
    tagline: "She mapped the Hollow Realm. Then she started making changes.",
    lore: "Her maps are used by every faction. What she makes now describes changes she made to the Hollow itself. The changes are real.",
    hp: 26,
    atk: 5,
    def: 3,
    dc: 15,
    phases: [
      { name: "The Guide", at: 26, desc: "Presents as a resource. Her help always serves the project." },
      { name: "The Architect", at: 16, desc: "Stops pretending. Starts explaining." },
      { name: "The Burned", at: 8, desc: "Project near completion." },
    ],
    lootName: "Master Cavern Map",
  },
  {
    id: "sink",
    name: "The Sink",
    title: "What Lives at the Bottom",
    loc: "library",
    arc: "Arc III — The Drowned Archive",
    threat: "Unknown",
    tagline: "It did not sink the Library. It was why the Library was built there.",
    lore: "Proximity made knowledge more accessible. Nobody confirmed what the original negotiation cost. The record is in the flooded sections.",
    hp: 32,
    atk: 4,
    def: 5,
    dc: 16,
    phases: [
      { name: "The Archive", at: 32, desc: "Passive. Answers questions. Always truly." },
      { name: "The Collector", at: 20, desc: "The Pull intensifies. You are being read." },
      { name: "The Answer", at: 8, desc: "Asks each character one question about their Destiny Thread." },
    ],
    lootName: "Founding Document",
  },
  {
    id: "warden",
    name: "The Null Warden",
    title: "Keeper of Veyra",
    loc: "veyra",
    arc: "Arc V — Veyra City",
    threat: "Absolute",
    tagline: "It does not keep Veyra to keep things out. It keeps things in.",
    lore: "Before it arrived, things moved between the Hollow and the beyond without restriction. It established the last city as a boundary. It answers direct questions.",
    hp: 40,
    atk: 7,
    def: 6,
    dc: 17,
    phases: [
      { name: "The Boundary", at: 40, desc: "Felt as directional wrongness. Observes." },
      { name: "The Warden", at: 24, desc: "Tests each character against Shadow or Destiny." },
      { name: "The Keeper", at: 10, desc: "If you engaged honestly, it becomes a presence you can speak with." },
    ],
    lootName: "Moon Squad Challenge Coin",
  },
];

export const NPCS = [
  {
    name: "Voss",
    title: "The Ash-Peddler",
    loc: "veyra" as LocationId,
    quote: "The void demands equivalent exchange. Coins, blood, and memory.",
    stock: [
      { name: "Pure Void-Essence", price: 2000, rarity: "Rare" as Rarity },
      { name: "Rift Shard", price: 800, rarity: "Uncommon" as Rarity },
    ],
  },
  {
    name: "Quartermaster Rudge",
    title: "Kingdom Gate",
    loc: "kingdom" as LocationId,
    quote: "Show your identification, or pay the outlander tax.",
    stock: [
      { name: "Standard Rations", price: 150, rarity: "Common" as Rarity },
      { name: "Garrison Whetstone", price: 220, rarity: "Common" as Rarity },
    ],
  },
  {
    name: "Nylah the Dredge",
    title: "Arcane Merchant",
    loc: "library" as LocationId,
    quote: "The water keeps the best secrets. I just fetch them.",
    stock: [
      { name: "Focus Crystal", price: 300, rarity: "Uncommon" as Rarity },
      { name: "Waterlogged Grimoire", price: 1200, rarity: "Rare" as Rarity },
    ],
  },
  {
    name: "Sister Vex",
    title: "The Purifier",
    loc: "ironclad" as LocationId,
    quote: "Do not bring that filth into my chapel unless you are ready to bleed for it.",
    stock: [
      { name: "Aether Bandages", price: 250, rarity: "Uncommon" as Rarity },
      { name: "Holy Salt", price: 500, rarity: "Uncommon" as Rarity },
    ],
  },
  {
    name: "Krell the Foreman",
    title: "Bedrock Smith",
    loc: "caverns" as LocationId,
    quote: "The mountain don't care about your stories. Only the weight of your swing.",
    stock: [
      { name: "Hollow Ore", price: 400, rarity: "Uncommon" as Rarity },
      { name: "Deep-Blast Charge", price: 800, rarity: "Rare" as Rarity },
    ],
  },
];

export const BASE_ROOMS: Record<
  RoomId,
  { name: string; desc: string; income: number; tiers: { cost: number; bonus: string }[] }
> = {
  vault: {
    name: "The Vault",
    desc: "Stores loot. Generates a quiet tithe from organised salvage.",
    income: 3,
    tiers: [
      { cost: 0, bonus: "20 item capacity. +3 coins/tick." },
      { cost: 2500, bonus: "50 capacity. Items degrade slower. +6 coins/tick." },
      { cost: 8000, bonus: "100 capacity. Condition holds. +10 coins/tick." },
    ],
  },
  barracks: {
    name: "The Barracks",
    desc: "Housing for guards. More beds, more operatives.",
    income: 2,
    tiers: [
      { cost: 1800, bonus: "+2 roster slots. Base defended on 12+." },
      { cost: 5000, bonus: "+4 roster slots. Defended on 10+." },
      { cost: 12000, bonus: "+6 roster slots. Defended on 8+. Counter-attack." },
    ],
  },
  forge: {
    name: "The Forge",
    desc: "Repair and socket. Fumbles still eat steel.",
    income: 2,
    tiers: [
      { cost: 1400, bonus: "Repair 400c. Worn gear restored." },
      { cost: 4200, bonus: "Repair 220c. Socket one enchantment." },
      { cost: 11000, bonus: "Repair 80c. Two sockets. Self-repair on 16+." },
    ],
  },
  infirmary: {
    name: "The Infirmary",
    desc: "Heal the living. Bargain with the downed.",
    income: 1,
    tiers: [
      { cost: 2200, bonus: "Treat wounds 80c. Stabilise downed." },
      { cost: 6500, bonus: "Cure void infection. Heal companions." },
      { cost: 15000, bonus: "Attempt resurrection 10+. Full service." },
    ],
  },
  watchtower: {
    name: "The Watchtower",
    desc: "See farther. Die less often.",
    income: 2,
    tiers: [
      { cost: 2000, bonus: "Mission DC -1. Night raid warning." },
      { cost: 6000, bonus: "Mission DC -2. Track bounty movement." },
      { cost: 14000, bonus: "Mission DC -3. Villain intel unlocked." },
    ],
  },
  ledger: {
    name: "The Ledger",
    desc: "Daily shop. Moon Squad eats, trades, and keeps books.",
    income: 4,
    tiers: [
      { cost: 1600, bonus: "Bargain goods each dawn." },
      { cost: 4800, bonus: "Essential stock. Better prices." },
      { cost: 10000, bonus: "Artifact chance. 15% shop discount." },
    ],
  },
};

export const QUARTERS = {
  bunk: {
    name: "The Bunk",
    tiers: [
      { cost: 800, bonus: "+1 to first roll of the day." },
      { cost: 2000, bonus: "+2 Max HP." },
      { cost: 4500, bonus: "Full HP restoration at dawn." },
    ],
  },
  lockbox: {
    name: "The Lockbox",
    tiers: [
      { cost: 1000, bonus: "25% protection from night theft." },
      { cost: 2800, bonus: "50% protection." },
      { cost: 6000, bonus: "75% protection. Vault-grade." },
    ],
  },
  hearth: {
    name: "The Hearth",
    tiers: [
      { cost: 1200, bonus: "Companions heal 1 HP at dawn." },
      { cost: 2800, bonus: "Companions +1 to passive rolls." },
      { cost: 5500, bonus: "Companions fully restored at dawn." },
    ],
  },
};

export const RESIDENT_ROLES = {
  guard: { label: "Guard", bonus: "+1 HQ defense", cost: 400 },
  medic: { label: "Medic", bonus: "Infirmary costs -15%", cost: 500 },
  scout: { label: "Scout", bonus: "Watchtower DC -1 extra", cost: 450 },
  quartermaster: { label: "Quartermaster", bonus: "Vault income +2", cost: 480 },
  smith: { label: "Smith", bonus: "Forge repair -20%", cost: 520 },
  spymaster: { label: "Spymaster", bonus: "Once/day: villain intel", cost: 700 },
} as const;

export const BOUNTIES: Bounty[] = [
  { id: "b1", name: "The Ashen Deserter", type: "Rogue Warrior", reward: "5,000 coins", rewardCoins: 900, location: "ironclad", dc: 14, hp: 14 },
  { id: "b2", name: "Void-Touched Smuggler", type: "Corrupted Merchant", reward: "Rare weapon", rewardCoins: 700, location: "caverns", dc: 15, hp: 12 },
  { id: "b3", name: "The Mad Alchemist", type: "Rogue Healer", reward: "Legendary enchantment", rewardCoins: 1100, location: "kingdom", dc: 16, hp: 16 },
  { id: "b4", name: "Cultist of the Sink", type: "Zealot", reward: "8,000 coins", rewardCoins: 1200, location: "library", dc: 15, hp: 15 },
  { id: "b5", name: "Wandering Null-Spawn", type: "Entity", reward: "Mythic fragment", rewardCoins: 1600, location: "veyra", dc: 18, hp: 20 },
];

export const LEDGER_POOLS: Record<"bargain" | "essential" | "artifact", ShopOffer[]> = {
  bargain: [
    { name: "Iron Rations x3", price: 180, kind: "consumable", rarity: "Common", effect: "Restore 2 HP in the field." },
    { name: "Healing Salve", price: 220, kind: "consumable", rarity: "Common", effect: "Restore 3 HP." },
    { name: "Lockpicks", price: 160, kind: "trinket", rarity: "Common", effect: "+1 lockpicking." },
    { name: "Torch Bundle", price: 90, kind: "consumable", rarity: "Common", effect: "Ignore darkness penalties one sortie." },
    { name: "Common Dagger", price: 240, kind: "weapon", rarity: "Common", effect: "1d4. Last resort." },
  ],
  essential: [
    { name: "Hollow Ore x2", price: 700, kind: "material", rarity: "Uncommon", effect: "Forge fuel. Required for socketing." },
    { name: "Enchanted Bandage", price: 480, kind: "consumable", rarity: "Uncommon", effect: "Restore 5 HP. Clears bleed." },
    { name: "Stealth Cloak", price: 900, kind: "armor", rarity: "Uncommon", effect: "+1 stealth." },
    { name: "Scout's Compass", price: 620, kind: "trinket", rarity: "Uncommon", effect: "+1 tracking." },
    { name: "Alchemist's Flask", price: 540, kind: "consumable", rarity: "Uncommon", effect: "2d4 fire, one use." },
  ],
  artifact: [
    { name: "Void-Touched Coin", price: 2200, kind: "trinket", rarity: "Rare", effect: "+1 LCK. Slight Hollow attention." },
    { name: "Ashen Fang Shard", price: 2600, kind: "material", rarity: "Rare", effect: "Socket for +1 slashing." },
    { name: "Library Access Key", price: 3000, kind: "trinket", rarity: "Rare", effect: "Unlocks restricted archive checks." },
    { name: "Veyra Fragment", price: 3400, kind: "material", rarity: "Legendary", effect: "Mythic craft component." },
    { name: "Drowned Archive Text", price: 2800, kind: "trinket", rarity: "Rare", effect: "+2 knowledge in the Library." },
  ],
};

export interface WeaponDef {
  name: string;
  cls: ClassName;
  type: string;
  rarity: Rarity;
  damage: string;
  effect: string;
  lore: string;
  value: number;
}

export const WEAPONS: WeaponDef[] = [
  { name: "Ironhide Broadsword", cls: "Warrior", type: "Slashing", rarity: "Common", damage: "1d8", effect: "None.", lore: "Dull edge, heavy swing.", value: 120 },
  { name: "Rusted Garrison Mace", cls: "Warrior", type: "Blunt", rarity: "Common", damage: "1d6", effect: "+1 vs armored.", lore: "A crude tool for crude work.", value: 90 },
  { name: "Reinforced Halberd", cls: "Warrior", type: "Reach", rarity: "Uncommon", damage: "1d10", effect: "Strike from second rank.", lore: "Keeps monsters at arm's length.", value: 320 },
  { name: "Ash-Tempered Cleaver", cls: "Warrior", type: "Heavy", rarity: "Uncommon", damage: "1d8+1", effect: "Won't break on a fumble.", lore: "Blackened by fire, sharpened by bone.", value: 400 },
  { name: "Hollow-Iron Greatsword", cls: "Warrior", type: "Heavy", rarity: "Rare", damage: "2d6", effect: "Ignores 1 armor.", lore: "Cold. Silent when swung.", value: 1400 },
  { name: "The Warden's Judgement", cls: "Warrior", type: "Relic", rarity: "Legendary", damage: "2d8", effect: "Crit: stun one round.", lore: "Weight of a fallen empire.", value: 4200 },
  { name: "The Void Cleaver", cls: "Warrior", type: "Anomaly", rarity: "Mythic", damage: "3d6", effect: "Ignores armor.", lore: "It hums when it tastes blood.", value: 9000 },
  { name: "Gutter-Spike", cls: "Rogue", type: "Piercing", rarity: "Common", damage: "1d4", effect: "+1 from stealth.", lore: "A sharpened fence post.", value: 70 },
  { name: "Chipped Throwing Knives", cls: "Rogue", type: "Thrown", rarity: "Common", damage: "1d4", effect: "Ranged.", lore: "Quantity over quality.", value: 80 },
  { name: "Serrated Bone-Shiv", cls: "Rogue", type: "Piercing", rarity: "Uncommon", damage: "1d6", effect: "Bleed 1 for 2 rounds.", lore: "Leaves a jagged wound.", value: 280 },
  { name: "Shadow-Forged Blade", cls: "Rogue", type: "Finesse", rarity: "Rare", damage: "1d6+1", effect: "Draws no attention.", lore: "Absorbs light.", value: 1500 },
  { name: "The Ghost Blade", cls: "Rogue", type: "Relic", rarity: "Legendary", damage: "2d4", effect: "Damages vitality directly.", lore: "A blade made of memory.", value: 4000 },
  { name: "Splintered Staff", cls: "Wizard", type: "Focus", rarity: "Common", damage: "1d4", effect: "Light source.", lore: "Barely holds a spark.", value: 90 },
  { name: "Ash-Wood Wand", cls: "Wizard", type: "Wand", rarity: "Uncommon", damage: "1d6", effect: "+1 fire spells.", lore: "Smells of smoke.", value: 310 },
  { name: "Hollow-Glass Tome", cls: "Wizard", type: "Grimoire", rarity: "Rare", damage: "1d8", effect: "+2 spell dmg. Fumble: 1 self.", lore: "Words rearrange themselves.", value: 1600 },
  { name: "The Arcanist's Spine", cls: "Wizard", type: "Relic", rarity: "Legendary", damage: "2d6", effect: "Once/arc auto-succeed a spell.", lore: "Quicksilver through bone.", value: 4500 },
  { name: "Rusted Scalpel", cls: "Healer", type: "Piercing", rarity: "Common", damage: "1d4", effect: "Extract venom on INT.", lore: "Sterilized by fire too many times.", value: 70 },
  { name: "Order Censer", cls: "Healer", type: "AoE", rarity: "Uncommon", damage: "1d6", effect: "Allies nearby regen 1 out of combat.", lore: "Sweet smoke numbs pain.", value: 340 },
  { name: "Blood-Glass Syringe", cls: "Healer", type: "Precision", rarity: "Rare", damage: "1d6", effect: "Drain 2, heal ally 2.", lore: "Distills blood into vitality.", value: 1500 },
  { name: "The First Saint's Femur", cls: "Healer", type: "Relic", rarity: "Legendary", damage: "1d10", effect: "Healing spells maximise.", lore: "He never harmed a soul.", value: 4300 },
  { name: "Iron-Shod Stick", cls: "Merchant", type: "Blunt", rarity: "Common", damage: "1d6", effect: "Test for traps.", lore: "Cracks goblin jaws.", value: 80 },
  { name: "Weighted Ledger", cls: "Merchant", type: "Heavy", rarity: "Uncommon", damage: "1d8", effect: "20% knock loose coins.", lore: "Throwing the book.", value: 300 },
  { name: "Guildmaster's Cane", cls: "Merchant", type: "Finesse", rarity: "Rare", damage: "1d6+2", effect: "First strike +2.", lore: "A symbol of hollow status.", value: 1400 },
  { name: "Debt Collector's Scales", cls: "Merchant", type: "Flail", rarity: "Legendary", damage: "2d8", effect: "Damage scales with carried gold.", lore: "Heavier purse, harder hit.", value: 4100 },
  { name: "Scuffed Lute", cls: "Bard", type: "Instrument", rarity: "Common", damage: "1d4", effect: "+1 tavern performance.", lore: "Two strings out of tune.", value: 70 },
  { name: "Iron-Strung Harp", cls: "Bard", type: "Instrument", rarity: "Uncommon", damage: "1d6", effect: "Usable as a blunt weapon.", lore: "Heavy metal.", value: 290 },
  { name: "Hollow-Bone Flute", cls: "Bard", type: "Focus", rarity: "Rare", damage: "1d4", effect: "Dissonance: enemies attack nearest.", lore: "Makes your teeth itch.", value: 1500 },
  { name: "The Maestro's Baton", cls: "Bard", type: "Wand", rarity: "Legendary", damage: "1d8", effect: "Once/day dictate 3 enemy moves.", lore: "The music it demands is always a tragedy.", value: 4000 },
];

export const ARMOR: { name: string; cls: ClassName; rarity: Rarity; defense: number; effect: string; value: number }[] = [
  { name: "Leather Tunic", cls: "Warrior", rarity: "Common", defense: 1, effect: "None.", value: 80 },
  { name: "Ironhide Brigandine", cls: "Warrior", rarity: "Uncommon", defense: 2, effect: "First damage each day -1.", value: 340 },
  { name: "Hollow-Steel Cuirass", cls: "Warrior", rarity: "Rare", defense: 3, effect: "Immune to crits from standard weapons.", value: 1600 },
  { name: "Prowler's Leathers", cls: "Rogue", rarity: "Uncommon", defense: 1, effect: "+1 urban stealth.", value: 300 },
  { name: "Hollow-Shadow Wrap", cls: "Rogue", rarity: "Rare", defense: 2, effect: "-2 detection in Hollow locations.", value: 1500 },
  { name: "Acolyte's Mantle", cls: "Wizard", rarity: "Uncommon", defense: 1, effect: "+1 basic spell rolls.", value: 280 },
  { name: "Hollow-Weave Robes", cls: "Wizard", rarity: "Rare", defense: 2, effect: "Magical damage -1.", value: 1400 },
  { name: "Field Medic's Coat", cls: "Healer", rarity: "Uncommon", defense: 1, effect: "+2 medical inventory.", value: 260 },
  { name: "Sanctuary Robes", cls: "Healer", rarity: "Rare", defense: 2, effect: "Enemies WIS 12+ to target you first.", value: 1450 },
  { name: "Smuggler's Coat", cls: "Merchant", rarity: "Uncommon", defense: 1, effect: "Hidden pockets.", value: 300 },
  { name: "Briber's Velvet Mantle", cls: "Merchant", rarity: "Rare", defense: 1, effect: "+2 CHA on deals.", value: 1300 },
  { name: "Performer's Leathers", cls: "Bard", rarity: "Uncommon", defense: 1, effect: "Full mobility.", value: 250 },
  { name: "Echo-Weave Cloak", cls: "Bard", rarity: "Rare", defense: 1, effect: "Amplifies performances.", value: 1200 },
];

export const ENEMIES: Record<
  LocationId,
  { name: string; hp: number; atk: number; def: number; dc: number; flavor: string }[]
> = {
  hq: [],
  ironclad: [
    { name: "Slag-Hound", hp: 7, atk: 3, def: 1, dc: 11, flavor: "Low, patient. Waiting for a mistake at the gate." },
    { name: "Ironclad Watch", hp: 11, atk: 4, def: 2, dc: 13, flavor: "It has done this checkpoint before." },
    { name: "Ashen Briar", hp: 8, atk: 3, def: 3, dc: 12, flavor: "The walls remember knives." },
  ],
  kingdom: [
    { name: "Garrison Remnant", hp: 10, atk: 4, def: 3, dc: 12, flavor: "Still following orders that no longer exist." },
    { name: "Debt Shade", hp: 8, atk: 3, def: 2, dc: 13, flavor: "It knows what you owe." },
    { name: "Throne Guard", hp: 12, atk: 5, def: 4, dc: 14, flavor: "Armor older than the walls." },
  ],
  caverns: [
    { name: "Ore-Leech", hp: 6, atk: 3, def: 2, dc: 12, flavor: "It drinks metal." },
    { name: "Cave Horror", hp: 14, atk: 5, def: 3, dc: 14, flavor: "Too many joints." },
    { name: "Mapped Wrong", hp: 9, atk: 4, def: 2, dc: 13, flavor: "The corridor was not here yesterday." },
  ],
  library: [
    { name: "Drowned Page", hp: 7, atk: 3, def: 1, dc: 12, flavor: "It wants to be read. That is not a kindness." },
    { name: "Archive Warden", hp: 12, atk: 4, def: 3, dc: 14, flavor: "Silence is policy." },
    { name: "Memory That Bites", hp: 9, atk: 4, def: 2, dc: 13, flavor: "Someone else's worst day." },
  ],
  veyra: [
    { name: "Null-Spawn", hp: 10, atk: 5, def: 2, dc: 15, flavor: "It is the absence of a creature." },
    { name: "Static Walker", hp: 12, atk: 5, def: 3, dc: 16, flavor: "The hum arrives first." },
    { name: "Unbound Echo", hp: 16, atk: 6, def: 4, dc: 16, flavor: "A person-shaped hole in the air." },
  ],
};

export const DANGER_LABELS = ["Calm", "Tense", "Dangerous", "Hostile", "Extreme"];

export const RARITY_TINT: Record<Rarity, string> = {
  Common: "text-muted",
  Uncommon: "text-ok",
  Rare: "text-moon",
  Legendary: "text-ember",
  Mythic: "text-void",
  Cursed: "text-danger",
};

export function locById(id: LocationId) {
  return WORLD.find((l) => l.id === id) ?? WORLD[1];
}

export function villainById(id: string) {
  return VILLAINS.find((v) => v.id === id);
}

export function weaponDamageAvg(dice: string): number {
  const m = dice.match(/(\d+)d(\d+)(?:\+(\d+))?/);
  if (!m) return 4;
  const n = Number(m[1]);
  const s = Number(m[2]);
  const b = Number(m[3] ?? 0);
  return Math.round(n * ((s + 1) / 2) + b);
}

export function makeItemFromWeapon(w: WeaponDef): Omit<Item, "id"> {
  return {
    name: w.name,
    kind: "weapon",
    rarity: w.rarity,
    condition: "Pristine",
    slot: "weapon",
    classHint: w.cls,
    damage: w.damage,
    effect: w.effect,
    lore: w.lore,
    equipped: false,
    value: w.value,
  };
}

export function makeItemFromArmor(a: (typeof ARMOR)[number]): Omit<Item, "id"> {
  return {
    name: a.name,
    kind: "armor",
    rarity: a.rarity,
    condition: "Pristine",
    slot: "armor",
    classHint: a.cls,
    defense: a.defense,
    effect: a.effect,
    lore: "",
    equipped: false,
    value: a.value,
  };
}

export function starterWeapon(cls: ClassName): Omit<Item, "id"> {
  const w = WEAPONS.find((x) => x.cls === cls && x.rarity === "Common") ?? WEAPONS[0];
  return makeItemFromWeapon(w);
}
