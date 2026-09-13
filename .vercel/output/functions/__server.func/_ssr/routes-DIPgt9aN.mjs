import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as Hammer, B as BedDouble, C as Moon, D as IdCard, E as Landmark, F as Cpu, I as Copy, L as CircleHelp, M as Eye, N as Disc3, O as Heart, P as Crosshair, R as CircleDot, S as Music, T as Lock, V as Archive, _ as RotateCcw, a as Volume2, b as Pill, c as Syringe, d as Sparkles, f as Skull, g as RotateCw, h as Scale, i as VolumeX, j as FlipHorizontal, k as HeartPulse, l as Swords, m as ScrollText, n as Wine, o as Users, p as Shield, r as Wind, t as X, u as Sword, v as Plus, w as Minus, x as Package, y as Pin, z as BookOpen } from "../_libs/lucide-react.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DIPgt9aN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TICK_SECONDS = 1.4;
var SAVE_KEY = "synaps-t0880-v1";
var CLASSES = [
	"Warrior",
	"Wizard",
	"Rogue",
	"Healer",
	"Merchant",
	"Bard"
];
var CLASS_HP = {
	Warrior: 12,
	Wizard: 7,
	Rogue: 8,
	Healer: 9,
	Merchant: 8,
	Bard: 8
};
var CLASS_BASE = {
	Warrior: {
		STR: 8,
		DEF: 7,
		INT: 3,
		WIS: 4,
		SPD: 4,
		CHA: 3,
		LCK: 3
	},
	Wizard: {
		STR: 3,
		DEF: 2,
		INT: 9,
		WIS: 7,
		SPD: 5,
		CHA: 4,
		LCK: 4
	},
	Rogue: {
		STR: 5,
		DEF: 3,
		INT: 5,
		WIS: 4,
		SPD: 9,
		CHA: 6,
		LCK: 7
	},
	Healer: {
		STR: 3,
		DEF: 4,
		INT: 6,
		WIS: 9,
		SPD: 4,
		CHA: 7,
		LCK: 5
	},
	Merchant: {
		STR: 3,
		DEF: 3,
		INT: 6,
		WIS: 5,
		SPD: 5,
		CHA: 8,
		LCK: 8
	},
	Bard: {
		STR: 3,
		DEF: 2,
		INT: 5,
		WIS: 6,
		SPD: 6,
		CHA: 10,
		LCK: 5
	}
};
var PRIMARY_STAT = {
	Warrior: "STR",
	Wizard: "INT",
	Rogue: "SPD",
	Healer: "WIS",
	Merchant: "CHA",
	Bard: "CHA"
};
var CLASS_GIFT = {
	Warrior: {
		name: "Shield Block",
		desc: "Absorb incoming damage for the squad this round. Once per day."
	},
	Wizard: {
		name: "Arcane Surge",
		desc: "Double the effect of the next roll. Once per day."
	},
	Rogue: {
		name: "Shadow Step",
		desc: "Avoid one consequence entirely. Once per day."
	},
	Healer: {
		name: "Miracle Touch",
		desc: "Restore a downed operative to 1 HP instantly. Once per day."
	},
	Merchant: {
		name: "Black Market",
		desc: "Pull one mid-sortie item from a contact. Once per day."
	},
	Bard: {
		name: "Encore",
		desc: "Re-roll any failed check. Once per day."
	}
};
var CLASS_LORE = {
	Warrior: {
		tagline: "They showed up when things were falling apart. They haven't left.",
		playstyle: "Anchor the party. Take the hit. Hold the line."
	},
	Wizard: {
		tagline: "Magic in the Hollow is not a skill. It is a conversation.",
		playstyle: "Change what is possible. Do not take the hit."
	},
	Rogue: {
		tagline: "Rogues exist in the space between things.",
		playstyle: "Do not fight fair. Use the exit, the dark, the other people."
	},
	Healer: {
		tagline: "They have seen the worst the Hollow can do. They came back anyway.",
		playstyle: "Win days that should have ended."
	},
	Merchant: {
		tagline: "Everything has a price. They are the one who set it.",
		playstyle: "Make the impossible affordable."
	},
	Bard: {
		tagline: "They came to document the Hollow. Or to escape something.",
		playstyle: "Play the game at a different layer. The Hollow is an audience."
	}
};
var TRAIT_TIERS = [
	{
		level: "Weakened",
		range: [1, 4],
		bonus: -1
	},
	{
		level: "Standard",
		range: [5, 9],
		bonus: 0
	},
	{
		level: "Strong",
		range: [10, 14],
		bonus: 1
	},
	{
		level: "Exceptional",
		range: [15, 19],
		bonus: 2
	},
	{
		level: "Legendary",
		range: [20, 20],
		bonus: 3
	}
];
var ORIGINS = [
	"Ironclad",
	"Crumbling Kingdom",
	"Underground Caverns",
	"Veyra City",
	"Sunken Library"
];
var FIRST_NAMES = [
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
	"Maren"
];
var LAST_NAMES = [
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
	"Dusk"
];
function pickByRoll(table, roll) {
	return table.find((t) => roll >= t.r[0] && roll <= t.r[1]) ?? table[Math.floor(table.length / 2)];
}
var REP = {
	Warrior: [
		{
			r: [1, 1],
			title: "The Broken Shield",
			passive: "-1 first combat roll each day."
		},
		{
			r: [2, 2],
			title: "The Deserter",
			passive: "Cannot call authority. +1 solo stealth."
		},
		{
			r: [3, 3],
			title: "The Cursed Blade",
			passive: "First weapon roll each arc disadvantaged."
		},
		{
			r: [4, 4],
			title: "The Unfinished War",
			passive: "-1 intimidation with nobility."
		},
		{
			r: [5, 7],
			title: "The Steadfast",
			passive: "Allies nearby cannot be coerced."
		},
		{
			r: [8, 9],
			title: "The Iron Wall",
			passive: "+1 DEF when protecting another."
		},
		{
			r: [10, 11],
			title: "The Oathkeeper",
			passive: "Declare an oath once/day. +2 if kept."
		},
		{
			r: [12, 13],
			title: "The Last Line",
			passive: "+2 combat at 3 HP or below."
		},
		{
			r: [14, 14],
			title: "The Hollow's Bulwark",
			passive: "Immune to first curse each arc."
		},
		{
			r: [15, 16],
			title: "The Undying",
			passive: "If dying, 10+ on d20 survive at 1 HP."
		},
		{
			r: [17, 18],
			title: "The Warlord of Ash",
			passive: "Can command allies on 15+."
		},
		{
			r: [19, 19],
			title: "The Unkillable",
			passive: "+1 all combat. Hostiles target others first."
		},
		{
			r: [20, 20],
			title: "THE HOLLOW'S CHAMPION",
			passive: "Once/arc, call the Hollow for auto-success."
		}
	],
	Wizard: [
		{
			r: [1, 1],
			title: "The Silenced",
			passive: "First spell/day: d6, 1-2 backfire."
		},
		{
			r: [2, 2],
			title: "The Forbidden Scholar",
			passive: "+2 INT, -1 WIS. Restricted knowledge."
		},
		{
			r: [3, 3],
			title: "The Unstable",
			passive: "On fumble, spell hits a random target."
		},
		{
			r: [4, 4],
			title: "The Once-Great",
			passive: "-1 spell rolls, +2 in academic settings."
		},
		{
			r: [5, 7],
			title: "The Theorist",
			passive: "+1 puzzle and knowledge rolls."
		},
		{
			r: [8, 9],
			title: "The Practical Caster",
			passive: "Cast minor spells without a roll."
		},
		{
			r: [10, 11],
			title: "The Arcanist",
			passive: "+1 INT. Arcane locks open without a roll."
		},
		{
			r: [12, 13],
			title: "The Seeker",
			passive: "Once/day, one true answer from the Hollow."
		},
		{
			r: [14, 14],
			title: "The Hollow's Eye",
			passive: "+2 detecting illusions and Hollow entities."
		},
		{
			r: [15, 16],
			title: "The Void Speaker",
			passive: "Once/arc, attempt communication with any entity."
		},
		{
			r: [17, 18],
			title: "The Architect of Ruin",
			passive: "+2 area-effect and destructive spells."
		},
		{
			r: [19, 19],
			title: "The Worldbreaker",
			passive: "+2 all spells. Average-INT NPCs fear them."
		},
		{
			r: [20, 20],
			title: "THE HOLLOW'S ORACLE",
			passive: "Once/arc, one true future event."
		}
	],
	Rogue: [
		{
			r: [1, 1],
			title: "The Marked",
			passive: "Once/day an NPC may recognise them."
		},
		{
			r: [2, 2],
			title: "The Burned Informant",
			passive: "-1 trust. +1 solo stealth."
		},
		{
			r: [3, 3],
			title: "The Clumsy Thief",
			passive: "First theft/day: 1-2 on d6 = caught."
		},
		{
			r: [4, 4],
			title: "The Wanted",
			passive: "A faction is actively looking for them."
		},
		{
			r: [5, 7],
			title: "The Shadow",
			passive: "+1 stealth in urban environments."
		},
		{
			r: [8, 9],
			title: "The Grifter",
			passive: "+1 deception. First lie believed."
		},
		{
			r: [10, 11],
			title: "The Ghost",
			passive: "Leave no trace unless rolling 1-3."
		},
		{
			r: [12, 13],
			title: "The Contractor",
			passive: "Once/arc, name a price. An NPC pays."
		},
		{
			r: [14, 14],
			title: "The Hollow's Shadow",
			passive: "+2 stealth in Hollow locations."
		},
		{
			r: [15, 16],
			title: "The Phantom",
			passive: "Undetectable by mundane means in darkness."
		},
		{
			r: [17, 18],
			title: "The Ghost Contract",
			passive: "Once/arc, one action with no roll."
		},
		{
			r: [19, 19],
			title: "The Unseen Hand",
			passive: "Others take blame unless witnessed."
		},
		{
			r: [20, 20],
			title: "THE HOLLOW'S KNIFE",
			passive: "Once/arc, any action succeeds. No consequence."
		}
	],
	Healer: [
		{
			r: [1, 1],
			title: "The Burnout",
			passive: "First heal/day costs 1 HP from themselves."
		},
		{
			r: [2, 2],
			title: "The Doubted",
			passive: "-1 trust with strangers. +2 with those they've saved."
		},
		{
			r: [3, 3],
			title: "The Rattled",
			passive: "Healing -1 in combat until they take damage."
		},
		{
			r: [4, 4],
			title: "The Haunted",
			passive: "-1 in situations that mirror a past loss."
		},
		{
			r: [5, 7],
			title: "The Field Medic",
			passive: "+1 stabilising downed characters."
		},
		{
			r: [8, 9],
			title: "The Trusted",
			passive: "+1 social in distress. NPCs seek them out."
		},
		{
			r: [10, 11],
			title: "The Keeper",
			passive: "Once/day, prevent a character going below 1 HP."
		},
		{
			r: [12, 13],
			title: "The Order's Voice",
			passive: "Healing Order NPCs offer resources free."
		},
		{
			r: [14, 14],
			title: "The Hollow's Hands",
			passive: "+2 healing in Hollow locations."
		},
		{
			r: [15, 16],
			title: "The Saint",
			passive: "Once/arc, full heal any character. No roll."
		},
		{
			r: [17, 18],
			title: "The Death's Edge",
			passive: "Attempt revival of the dead. 15+ succeeds."
		},
		{
			r: [19, 19],
			title: "The Miracle",
			passive: "Once/arc, healing roll auto-succeeds at max."
		},
		{
			r: [20, 20],
			title: "THE HOLLOW'S GRACE",
			passive: "Once/arc, reverse a death this day."
		}
	],
	Merchant: [
		{
			r: [1, 1],
			title: "The Debtor",
			passive: "Owes someone. The Hollow holds the debt."
		},
		{
			r: [2, 2],
			title: "The Fraudster",
			passive: "+1 deception, -2 with guilds if exposed."
		},
		{
			r: [3, 3],
			title: "The Undercut",
			passive: "First trade/day: a rival appears with a better offer."
		},
		{
			r: [4, 4],
			title: "The Blacklisted",
			passive: "One major faction refuses to deal."
		},
		{
			r: [5, 7],
			title: "The Traveller",
			passive: "+1 finding rare goods in new locations."
		},
		{
			r: [8, 9],
			title: "The Negotiator",
			passive: "+1 all trade and negotiation."
		},
		{
			r: [10, 11],
			title: "The Connected",
			passive: "In any location, knows one useful NPC."
		},
		{
			r: [12, 13],
			title: "The Broker",
			passive: "Once/day, create a deal between two NPCs."
		},
		{
			r: [14, 14],
			title: "The Hollow's Coin",
			passive: "+2 transactions in Hollow locations."
		},
		{
			r: [15, 16],
			title: "The Kingmaker",
			passive: "Once/arc, elevate or ruin one NPC's status."
		},
		{
			r: [17, 18],
			title: "The Cartel",
			passive: "Controls prices in one location. +3 there."
		},
		{
			r: [19, 19],
			title: "The Exchange",
			passive: "Once/arc, trade any item for any item."
		},
		{
			r: [20, 20],
			title: "THE HOLLOW'S PRICE",
			passive: "Once/arc, name a price. An NPC pays it."
		}
	],
	Bard: [
		{
			r: [1, 1],
			title: "The Heckled",
			passive: "First performance/day: audience hostile on 1-3."
		},
		{
			r: [2, 2],
			title: "The One-Hit",
			passive: "-1 repeat performances with the same audience."
		},
		{
			r: [3, 3],
			title: "The Plagiarist",
			passive: "+1 copying styles. -2 if exposed."
		},
		{
			r: [4, 4],
			title: "The Forgotten",
			passive: "NPCs don't remember their name without prompting."
		},
		{
			r: [5, 7],
			title: "The Entertainer",
			passive: "+1 first performance in any new location."
		},
		{
			r: [8, 9],
			title: "The Crowd-Reader",
			passive: "+1 mass persuasion and performance."
		},
		{
			r: [10, 11],
			title: "The Storyteller",
			passive: "Once/day, reframe a situation. +2 result."
		},
		{
			r: [12, 13],
			title: "The Court Favourite",
			passive: "Noble NPCs grant access and favours."
		},
		{
			r: [14, 14],
			title: "The Hollow's Voice",
			passive: "+2 performances in Hollow locations."
		},
		{
			r: [15, 16],
			title: "The Legend",
			passive: "Once/arc, performance reaches any audience."
		},
		{
			r: [17, 18],
			title: "The Memory",
			passive: "Stories they tell become permanent NPC memories."
		},
		{
			r: [19, 19],
			title: "The Epoch",
			passive: "Once/arc, performance changes faction attitudes."
		},
		{
			r: [20, 20],
			title: "THE HOLLOW'S SONG",
			passive: "Once/arc, perform something the Hollow remembers forever."
		}
	]
};
var SIGNATURE = {
	Warrior: [
		{
			r: [1, 2],
			name: "Reckless Charge",
			desc: "-1 DEF, +2 first attack each day."
		},
		{
			r: [3, 4],
			name: "Broken Form",
			desc: "Unpredictable. +1 to surprise strikes."
		},
		{
			r: [5, 6],
			name: "Shield Wall",
			desc: "Allies get +1 DEF while stationary."
		},
		{
			r: [7, 8],
			name: "Weapon Read",
			desc: "+1 vs same enemy after first exchange."
		},
		{
			r: [9, 10],
			name: "War Cry",
			desc: "Once/day, enemy must roll to act next turn."
		},
		{
			r: [11, 12],
			name: "Controlled Aggression",
			desc: "+2 first strike after observing."
		},
		{
			r: [13, 14],
			name: "Endurance Fighter",
			desc: "+1 each subsequent combat round."
		},
		{
			r: [15, 16],
			name: "Execution Strike",
			desc: "+3 attack vs enemies below half HP."
		},
		{
			r: [17, 18],
			name: "Counter",
			desc: "When an attack fails against them, free strike."
		},
		{
			r: [19, 19],
			name: "Battlefield Commander",
			desc: "Once/day, every ally gets +1 next roll."
		},
		{
			r: [20, 20],
			name: "THE HOLLOW'S BLADE",
			desc: "On a Critical, the effect lingers into next day."
		}
	],
	Wizard: [
		{
			r: [1, 2],
			name: "Volatile Casting",
			desc: "Spells hit harder. 1-in-6 unexpected side effect."
		},
		{
			r: [3, 4],
			name: "Forbidden Indexing",
			desc: "Attempt any knowledge roll regardless of subject."
		},
		{
			r: [5, 6],
			name: "Spell Dampening",
			desc: "Halve an incoming magical effect. Once/day."
		},
		{
			r: [7, 8],
			name: "Rune Reading",
			desc: "+2 to decipher inscriptions and Hollow markings."
		},
		{
			r: [9, 10],
			name: "Projection",
			desc: "Cast a minor illusion without a roll. Once/day."
		},
		{
			r: [11, 12],
			name: "Arcane Diagnosis",
			desc: "Identify any magical effect by touch. No roll."
		},
		{
			r: [13, 14],
			name: "Counter-Spell",
			desc: "Interrupt enemy magic. INT vs difficulty."
		},
		{
			r: [15, 16],
			name: "Hollow Channelling",
			desc: "Once/arc, cast beyond normal tier."
		},
		{
			r: [17, 18],
			name: "Memory Casting",
			desc: "Replicate any spell witnessed. +1 to copies."
		},
		{
			r: [19, 19],
			name: "The Eye",
			desc: "See through one illusion or hidden thing per day."
		},
		{
			r: [20, 20],
			name: "THE HOLLOW'S TONGUE",
			desc: "Once/arc, ask the Hollow anything. It answers."
		}
	],
	Rogue: [
		{
			r: [1, 2],
			name: "Pickpocketing",
			desc: "Lift small items on SPD. Fail means they notice."
		},
		{
			r: [3, 4],
			name: "Lock Reading",
			desc: "Identify any lock in 30 seconds. +2 lockpicking."
		},
		{
			r: [5, 6],
			name: "Forgery",
			desc: "Produce convincing false documents."
		},
		{
			r: [7, 8],
			name: "Tailing",
			desc: "Follow without detection unless actively watched."
		},
		{
			r: [9, 10],
			name: "Disguise",
			desc: "Assume a different identity. +2 CHA while disguised."
		},
		{
			r: [11, 12],
			name: "Poison Craft",
			desc: "Apply contact poison. Effect negotiated in the field."
		},
		{
			r: [13, 14],
			name: "Escape Artist",
			desc: "Cannot stay restrained more than one round."
		},
		{
			r: [15, 16],
			name: "Rooftop Navigation",
			desc: "Full speed across vertical terrain."
		},
		{
			r: [17, 18],
			name: "Dead Drop Network",
			desc: "Once/arc, retrieve intel from a hidden cache."
		},
		{
			r: [19, 19],
			name: "Ghost Entry",
			desc: "Enter any non-magical location. Leaves no trace."
		},
		{
			r: [20, 20],
			name: "THE HOLLOW'S SHADOW",
			desc: "Functionally invisible for one full scene."
		}
	],
	Healer: [
		{
			r: [1, 2],
			name: "Field Stitching",
			desc: "Stabilise any wound without materials. Buys two rounds."
		},
		{
			r: [3, 4],
			name: "Poison Identification",
			desc: "Identify any toxin by sight. +2 treating poison."
		},
		{
			r: [5, 6],
			name: "Psychic First Aid",
			desc: "Treat fear and psychological status effects."
		},
		{
			r: [7, 8],
			name: "Curse Reading",
			desc: "Identify nature and source of any curse on contact."
		},
		{
			r: [9, 10],
			name: "Pain Management",
			desc: "Suppress injury penalty for one day."
		},
		{
			r: [11, 12],
			name: "Emergency Revival",
			desc: "Bring downed to consciousness. Once/day, no roll."
		},
		{
			r: [13, 14],
			name: "Herbal Synthesis",
			desc: "Create a restorative from available materials."
		},
		{
			r: [15, 16],
			name: "Hollow Medicine",
			desc: "Treatments in Hollow locations have doubled effect."
		},
		{
			r: [17, 18],
			name: "Death Diagnosis",
			desc: "Cause and time of death with complete accuracy."
		},
		{
			r: [19, 19],
			name: "Vital Read",
			desc: "Know exact HP and conditions by observation."
		},
		{
			r: [20, 20],
			name: "THE HOLLOW'S HANDS",
			desc: "Once/arc, full heal any character instantly."
		}
	],
	Merchant: [
		{
			r: [1, 2],
			name: "Fast Talk",
			desc: "Distract an NPC. Buys one round without a roll."
		},
		{
			r: [3, 4],
			name: "Counterfeit Detection",
			desc: "Identify fakes instantly."
		},
		{
			r: [5, 6],
			name: "Bulk Negotiation",
			desc: "+2 group trade. Always better combined rates."
		},
		{
			r: [7, 8],
			name: "Market Reading",
			desc: "Know approximate value of any item. No roll."
		},
		{
			r: [9, 10],
			name: "Smuggling Routes",
			desc: "Move restricted goods. Risk only at checkpoints."
		},
		{
			r: [11, 12],
			name: "Credit Network",
			desc: "Access funds beyond inventory. Repaid next day."
		},
		{
			r: [13, 14],
			name: "Auction Control",
			desc: "Control pace and pressure of any bidding."
		},
		{
			r: [15, 16],
			name: "Bribery",
			desc: "CHA to find any NPC's price. They cooperate once."
		},
		{
			r: [17, 18],
			name: "Hollow Arbitrage",
			desc: "Once/arc, turn a worthless item useful."
		},
		{
			r: [19, 19],
			name: "The Long Game",
			desc: "Plant an arrangement. It pays off two days later."
		},
		{
			r: [20, 20],
			name: "THE HOLLOW'S PRICE",
			desc: "Once/arc, name a price. Anyone pays it."
		}
	],
	Bard: [
		{
			r: [1, 2],
			name: "Crowd Reading",
			desc: "+2 to all mass persuasion rolls."
		},
		{
			r: [3, 4],
			name: "Improvisation",
			desc: "No penalty for unexpected situations."
		},
		{
			r: [5, 6],
			name: "Emotional Manipulation",
			desc: "Shift one NPC emotion. CHA roll."
		},
		{
			r: [7, 8],
			name: "Satire",
			desc: "Publicly humiliate a target. They lose one social this day."
		},
		{
			r: [9, 10],
			name: "Lullaby",
			desc: "Calm one hostile. They cannot attack for one round."
		},
		{
			r: [11, 12],
			name: "War Song",
			desc: "Allies gain +1 to their next roll in combat."
		},
		{
			r: [13, 14],
			name: "The Long Memory",
			desc: "Recall any lore heard before. +3 knowledge."
		},
		{
			r: [15, 16],
			name: "Hollow Resonance",
			desc: "In Hollow locations, extra unpredictable effect."
		},
		{
			r: [17, 18],
			name: "The Turning Song",
			desc: "Once/day, change the emotional state of a room."
		},
		{
			r: [19, 19],
			name: "The Epic",
			desc: "Once/arc, permanently change how a faction views a player."
		},
		{
			r: [20, 20],
			name: "THE HOLLOW'S SONG",
			desc: "Once/arc, performance becomes permanent world memory."
		}
	]
};
var SHADOW = {
	Warrior: [
		{
			r: [1, 2],
			name: "The Coward's Scar",
			desc: "Has run from one fight. -1 in matching circumstances."
		},
		{
			r: [3, 4],
			name: "The Berserker Flaw",
			desc: "Below 3 HP, WIS 10+ or attack nearest."
		},
		{
			r: [5, 6],
			name: "The Oath-Breaker",
			desc: "Broke a vow. -2 with that faction."
		},
		{
			r: [7, 8],
			name: "The Blood Debt",
			desc: "Owes a life. The creditor hasn't collected yet."
		},
		{
			r: [9, 10],
			name: "The Haunted Blade",
			desc: "Weapon carries a death. Once/arc it reacts."
		},
		{
			r: [11, 12],
			name: "The War Fatigue",
			desc: "Extended combat: -1 cumulative after day 3."
		},
		{
			r: [13, 14],
			name: "The Fallen Banner",
			desc: "-1 trust with Kingdom remnants."
		},
		{
			r: [15, 16],
			name: "The Unnecessary Death",
			desc: "Someone died because of their choice."
		},
		{
			r: [17, 18],
			name: "The Pride",
			desc: "Cannot accept help at full HP. Must attempt alone first."
		},
		{
			r: [19, 20],
			name: "The Hollow's Claim",
			desc: "The Hollow marked them. It is owed a service."
		}
	],
	Wizard: [
		{
			r: [1, 2],
			name: "The Forbidden Study",
			desc: "Something knows they know."
		},
		{
			r: [3, 4],
			name: "The Failed Spell",
			desc: "A spell went wrong. Someone was hurt."
		},
		{
			r: [5, 6],
			name: "The Dependency",
			desc: "Without an arcane substance: -1 after day 2."
		},
		{
			r: [7, 8],
			name: "The Stolen Research",
			desc: "Their best work isn't theirs."
		},
		{
			r: [9, 10],
			name: "The Unfinished Experiment",
			desc: "Left something running. It is still running."
		},
		{
			r: [11, 12],
			name: "The Hollow Contact",
			desc: "Something reached out. They responded. It remembers."
		},
		{
			r: [13, 14],
			name: "The Broken Equation",
			desc: "-1 WIS when the unsolved problem comes up."
		},
		{
			r: [15, 16],
			name: "The Rival",
			desc: "Another scholar wants their position."
		},
		{
			r: [17, 18],
			name: "The Hubris",
			desc: "Once/arc, intelligence does not exempt them."
		},
		{
			r: [19, 20],
			name: "The Void Conversation",
			desc: "The Hollow spoke. They are not sure they understood."
		}
	],
	Rogue: [
		{
			r: [1, 2],
			name: "The Burned Contact",
			desc: "Sold someone out. They escaped. They know."
		},
		{
			r: [3, 4],
			name: "The Recognisable Face",
			desc: "-2 stealth in one location."
		},
		{
			r: [5, 6],
			name: "The Loose Ledger",
			desc: "Their name appears in a crime record."
		},
		{
			r: [7, 8],
			name: "The Unkept Promise",
			desc: "Failed to deliver. The client is patient. For now."
		},
		{
			r: [9, 10],
			name: "The Double Life",
			desc: "Once/arc, the wrong identity surfaces."
		},
		{
			r: [11, 12],
			name: "The Collateral",
			desc: "Someone innocent was hurt during a job."
		},
		{
			r: [13, 14],
			name: "The Ghost That Talks",
			desc: "Left a witness alive. The witness has been talking."
		},
		{
			r: [15, 16],
			name: "The Hollow's Record",
			desc: "The Hollow tracked one of their jobs."
		},
		{
			r: [17, 18],
			name: "The Price on the Head",
			desc: "A faction has an open contract on them."
		},
		{
			r: [19, 20],
			name: "The Thing They Kept",
			desc: "Stole something they should have returned."
		}
	],
	Healer: [
		{
			r: [1, 2],
			name: "The One They Couldn't Save",
			desc: "A patient died. They remember every detail."
		},
		{
			r: [3, 4],
			name: "The Hollow Debt",
			desc: "Used the Hollow to save a life. It considers this a transaction."
		},
		{
			r: [5, 6],
			name: "The Restricted Knowledge",
			desc: "Knows a method the Order forbids. Has used it."
		},
		{
			r: [7, 8],
			name: "The Mercy Problem",
			desc: "Helped someone who later caused harm."
		},
		{
			r: [9, 10],
			name: "The Healer's Burnout",
			desc: "Once/arc, one healing roll automatically fails."
		},
		{
			r: [11, 12],
			name: "The Forbidden Patient",
			desc: "Healed someone they were told not to."
		},
		{
			r: [13, 14],
			name: "The Misdiagnosis",
			desc: "Got something wrong. The error remains in the record."
		},
		{
			r: [15, 16],
			name: "The Last Rite",
			desc: "Performed a death rite for someone who wasn't quite dead."
		},
		{
			r: [17, 18],
			name: "The Order's Eye",
			desc: "The Healing Order is watching their methods."
		},
		{
			r: [19, 20],
			name: "The Hollow's Ward",
			desc: "The Hollow protected them once. It expects something."
		}
	],
	Merchant: [
		{
			r: [1, 2],
			name: "The Unpaid Debt",
			desc: "Owes a significant sum. Not yet called in."
		},
		{
			r: [3, 4],
			name: "The Forged Ledger",
			desc: "One major transaction was fraudulent."
		},
		{
			r: [5, 6],
			name: "The Ruined Partner",
			desc: "A previous partner lost everything in a shared deal."
		},
		{
			r: [7, 8],
			name: "The Cursed Stock",
			desc: "Sold something cursed. The buyer remembers."
		},
		{
			r: [9, 10],
			name: "The Guild Suspension",
			desc: "Removed from a guild. Reason: classified."
		},
		{
			r: [11, 12],
			name: "The Leverage",
			desc: "Someone has information. Has not used it. Yet."
		},
		{
			r: [13, 14],
			name: "The Hollow Trade",
			desc: "A Hollow transaction. The Hollow considers it binding."
		},
		{
			r: [15, 16],
			name: "The Undercut",
			desc: "Destroyed a competitor. They rebuilt. With allies."
		},
		{
			r: [17, 18],
			name: "The Stolen Route",
			desc: "Uses a route that belongs to someone else."
		},
		{
			r: [19, 20],
			name: "The Price of Everything",
			desc: "Once/arc this knowledge is used against them."
		}
	],
	Bard: [
		{
			r: [1, 2],
			name: "The Stolen Song",
			desc: "Their most famous work belongs to someone else."
		},
		{
			r: [3, 4],
			name: "The Told Secret",
			desc: "Used someone's confidence in a performance."
		},
		{
			r: [5, 6],
			name: "The Exaggerated Legend",
			desc: "A story about themselves is not entirely true."
		},
		{
			r: [7, 8],
			name: "The Inspired Enemy",
			desc: "A performance moved the wrong person."
		},
		{
			r: [9, 10],
			name: "The Hollow Audience",
			desc: "Something in a Hollow audience has not forgotten."
		},
		{
			r: [11, 12],
			name: "The Unfinished Saga",
			desc: "Began a story they never finished. The subjects wait."
		},
		{
			r: [13, 14],
			name: "The Witness",
			desc: "Saw something they were not supposed to. Turned it into art."
		},
		{
			r: [15, 16],
			name: "The Price of Fame",
			desc: "Anonymity is impossible in populated areas."
		},
		{
			r: [17, 18],
			name: "The Last Performance",
			desc: "Performed for someone who died immediately after."
		},
		{
			r: [19, 20],
			name: "The Hollow's Memory",
			desc: "The Hollow recorded one performance. Purpose unknown."
		}
	]
};
var ENCHANTS = {
	Warrior: [
		{
			r: [1, 3],
			name: "Iron Oath",
			desc: "Declare a target. +1 ATK until they fall."
		},
		{
			r: [4, 6],
			name: "Blood Memory",
			desc: "After taking damage, +1 ATK rest of day."
		},
		{
			r: [7, 9],
			name: "The Unbreaking",
			desc: "Weapon cannot be destroyed or disarmed."
		},
		{
			r: [10, 12],
			name: "Hollow Temper",
			desc: "In Hollow locations, +1 damage."
		},
		{
			r: [13, 15],
			name: "The Last Word",
			desc: "Once/arc, guaranteed final strike on a marked enemy."
		},
		{
			r: [16, 18],
			name: "War's Echo",
			desc: "First attack each day is maximum effect."
		},
		{
			r: [19, 19],
			name: "The Hollow's Hunger",
			desc: "Weapon grows +1 each day (resets per arc)."
		},
		{
			r: [20, 20],
			name: "THE VOID BLESSING",
			desc: "Strikes bypass all resistances."
		}
	],
	Wizard: [
		{
			r: [1, 3],
			name: "Arcane Loop",
			desc: "Once/day, recast a failed spell without cost."
		},
		{
			r: [4, 6],
			name: "Hollow Resonance",
			desc: "Spells in Hollow locations +1 effect."
		},
		{
			r: [7, 9],
			name: "The Unbinding",
			desc: "Once/arc, break any ward. No roll."
		},
		{
			r: [10, 12],
			name: "Echo Casting",
			desc: "Spells may trigger again on 15+ next round."
		},
		{
			r: [13, 15],
			name: "Void Channel",
			desc: "Once/day, channel the Hollow directly."
		},
		{
			r: [16, 18],
			name: "Memory Archive",
			desc: "Store any knowledge. Perfect recall."
		},
		{
			r: [19, 19],
			name: "The Hollow's Library",
			desc: "Once/arc, access any knowledge the Hollow has."
		},
		{
			r: [20, 20],
			name: "THE VOID MIND",
			desc: "Spells cannot fail completely. Minimum Weak Hit."
		}
	],
	Rogue: [
		{
			r: [1, 3],
			name: "Shadow Step",
			desc: "Once/day, avoid one consequence entirely."
		},
		{
			r: [4, 6],
			name: "The Clean Exit",
			desc: "Once/day, leave any situation unfollowed."
		},
		{
			r: [7, 9],
			name: "Hollow Fade",
			desc: "In Hollow locations, undetectable once/day."
		},
		{
			r: [10, 12],
			name: "The Long Memory",
			desc: "Never forget a face, location, or overheard word."
		},
		{
			r: [13, 15],
			name: "Ghost Touch",
			desc: "Handling items leaves no physical trace."
		},
		{
			r: [16, 18],
			name: "The Null",
			desc: "Once/arc, an action cannot be proven."
		},
		{
			r: [19, 19],
			name: "The Hollow's Cloak",
			desc: "Impossible to scry."
		},
		{
			r: [20, 20],
			name: "THE VOID STEP",
			desc: "Once/arc, be in two locations for one scene."
		}
	],
	Healer: [
		{
			r: [1, 3],
			name: "The Mending",
			desc: "Healing always restores at least 1 HP."
		},
		{
			r: [4, 6],
			name: "Hollow Touch",
			desc: "Healing in Hollow locations +1 HP."
		},
		{
			r: [7, 9],
			name: "The Ward",
			desc: "Once/day, prevent all damage to one character one round."
		},
		{
			r: [10, 12],
			name: "Soul Read",
			desc: "By touch, know exact HP and conditions."
		},
		{
			r: [13, 15],
			name: "The Stitch",
			desc: "Repair item condition one tier. Once/day."
		},
		{
			r: [16, 18],
			name: "Life Debt",
			desc: "Revived characters get +1 all rolls next day."
		},
		{
			r: [19, 19],
			name: "The Hollow's Grace",
			desc: "Once/arc, heal is maximised without a roll."
		},
		{
			r: [20, 20],
			name: "THE VOID MEND",
			desc: "Once/arc, undo one physical event from this day."
		}
	],
	Merchant: [
		{
			r: [1, 3],
			name: "Gilded Tongue",
			desc: "First trade each day automatically favours them."
		},
		{
			r: [4, 6],
			name: "Hollow Market",
			desc: "In Hollow locations, find one item unavailable elsewhere."
		},
		{
			r: [7, 9],
			name: "The Living Ledger",
			desc: "Automatically know if a deal is unfair."
		},
		{
			r: [10, 12],
			name: "Demand Creation",
			desc: "Once/day, make an NPC want something new."
		},
		{
			r: [13, 15],
			name: "The Network",
			desc: "Once/arc, a contact delivers something useful. No cost."
		},
		{
			r: [16, 18],
			name: "Compound Interest",
			desc: "Each day without a deal, next deal +1 (max +3)."
		},
		{
			r: [19, 19],
			name: "The Hollow's Economy",
			desc: "Once/arc, exchange anything at agreed value."
		},
		{
			r: [20, 20],
			name: "THE VOID MARKET",
			desc: "Once/arc, create an item that does not exist."
		}
	],
	Bard: [
		{
			r: [1, 3],
			name: "The Encore",
			desc: "Once/day, repeat a successful performance's effect."
		},
		{
			r: [4, 6],
			name: "Hollow Song",
			desc: "In Hollow locations, extra unpredictable effect."
		},
		{
			r: [7, 9],
			name: "The Living Record",
			desc: "Stories become true memory for NPCs who hear them."
		},
		{
			r: [10, 12],
			name: "Crowd Pull",
			desc: "Once/day, draw any NPC's attention for one round."
		},
		{
			r: [13, 15],
			name: "The Long Note",
			desc: "A performance effect can persist until next day."
		},
		{
			r: [16, 18],
			name: "The Stirring",
			desc: "Once/day, change the emotional state of a crowd."
		},
		{
			r: [19, 19],
			name: "The Hollow's Resonance",
			desc: "Once/arc, performance affects Hollow entities."
		},
		{
			r: [20, 20],
			name: "THE VOID CHORUS",
			desc: "Once/arc, change one permanent world truth."
		}
	]
};
var DESTINY = {
	Warrior: [
		{
			r: [1, 3],
			thread: "You will face something that cannot be killed by force alone."
		},
		{
			r: [4, 6],
			thread: "Someone you protect will betray you. You will let it happen."
		},
		{
			r: [7, 9],
			thread: "The war you fought is not over. The side was never the side you thought."
		},
		{
			r: [10, 12],
			thread: "You will choose between your weapon and something you value more."
		},
		{
			r: [13, 15],
			thread: "A battle is coming you cannot win. You will fight it anyway."
		},
		{
			r: [16, 18],
			thread: "You will become the thing others make stories about."
		},
		{
			r: [19, 19],
			thread: "The Hollow made you a warrior for a purpose you have not understood."
		},
		{
			r: [20, 20],
			thread: "You are the last of something. When you understand what, everything changes."
		}
	],
	Wizard: [
		{
			r: [1, 3],
			thread: "The knowledge you seek will change what you are. You seek it anyway."
		},
		{
			r: [4, 6],
			thread: "You will find something in the Hollow no one was meant to find."
		},
		{
			r: [7, 9],
			thread: "The answer is in a place you cannot go without becoming someone else."
		},
		{
			r: [10, 12],
			thread: "Something you know will save a life and end another."
		},
		{
			r: [13, 15],
			thread: "The Hollow has a question for you. You will not recognise it."
		},
		{
			r: [16, 18],
			thread: "You will be offered everything you wanted. The offering is the test."
		},
		{
			r: [19, 19],
			thread: "You are not researching the Hollow. The Hollow is researching you."
		},
		{
			r: [20, 20],
			thread: "You already know how this ends. You have not admitted it yet."
		}
	],
	Rogue: [
		{
			r: [1, 3],
			thread: "The person you are running from is not who you think. Neither are you."
		},
		{
			r: [4, 6],
			thread: "You will steal something that cannot be unfound."
		},
		{
			r: [7, 9],
			thread: "Someone is using you. When you find out, you will decide if it matters."
		},
		{
			r: [10, 12],
			thread: "The one job you refuse will find you anyway."
		},
		{
			r: [13, 15],
			thread: "Right place, wrong time — or the reverse. The Hollow has not decided."
		},
		{
			r: [16, 18],
			thread: "Your real name will surface."
		},
		{
			r: [19, 19],
			thread: "You have already changed something permanently. You do not know what."
		},
		{
			r: [20, 20],
			thread: "The Hollow has been following your work. It has an offer."
		}
	],
	Healer: [
		{
			r: [1, 3],
			thread: "You will save someone who should not have survived."
		},
		{
			r: [4, 6],
			thread: "The one you could not save will become relevant again."
		},
		{
			r: [7, 9],
			thread: "You will be asked to choose between two lives."
		},
		{
			r: [10, 12],
			thread: "Your healing will be used for something you would not have chosen."
		},
		{
			r: [13, 15],
			thread: "Something is using your compassion against you."
		},
		{
			r: [16, 18],
			thread: "You will face a death you cannot prevent. The aftermath is the destiny."
		},
		{
			r: [19, 19],
			thread: "The Hollow wants something healed that it will not name."
		},
		{
			r: [20, 20],
			thread: "You are not here by accident. One moment has not happened yet."
		}
	],
	Merchant: [
		{
			r: [1, 3],
			thread: "The deal that defines you is coming. You will not recognise it in time."
		},
		{
			r: [4, 6],
			thread: "You will possess something priceless. The price will be extracted either way."
		},
		{
			r: [7, 9],
			thread: "The network you built will be used against you from inside."
		},
		{
			r: [10, 12],
			thread: "You will be offered a transaction that is genuinely fair. It is the most dangerous offer."
		},
		{
			r: [13, 15],
			thread: "Something in the Hollow economy responds to you specifically."
		},
		{
			r: [16, 18],
			thread: "The currency you are actually trading is not coin."
		},
		{
			r: [19, 19],
			thread: "You will make a deal with something that does not deal in conventional terms."
		},
		{
			r: [20, 20],
			thread: "The Hollow considers you its merchant. This means something specific."
		}
	],
	Bard: [
		{
			r: [1, 3],
			thread: "The song that defines the Hollow Realm is not yet written."
		},
		{
			r: [4, 6],
			thread: "You will tell a story that becomes true. You will not know it was prophecy."
		},
		{
			r: [7, 9],
			thread: "Your most important audience has not heard you yet."
		},
		{
			r: [10, 12],
			thread: "The story you are afraid to tell is the one that matters most."
		},
		{
			r: [13, 15],
			thread: "You will witness the defining moment of this arc."
		},
		{
			r: [16, 18],
			thread: "Something in the Hollow remembers an older version of a song you know."
		},
		{
			r: [19, 19],
			thread: "The Hollow is listening to everything you perform. It is building something."
		},
		{
			r: [20, 20],
			thread: "You are the narrator of this story. That means you can change how it ends."
		}
	]
};
var RACES = {
	"Dust-Walker": {
		name: "Dust-Walker",
		tagline: "Nomads of the Edge. They walked too close to the void, and the void walked back.",
		stats: {
			STR: 0,
			DEF: 0,
			INT: 0,
			WIS: 2,
			SPD: 1,
			CHA: -2,
			LCK: 0
		},
		ability: "Void-Scarred — Once per day, ignore a magical attack or curse entirely.",
		kit: ["Scavenged Breathing Mask", "Dried Void-Moss x3"],
		lineage: {
			"Ash-Stalker": "+2 stealth in grey environments. Starts with a serrated bone-knife.",
			"Void-Oracle": "+2 WIS. Can read an object's history by touch, at a cost of 1 HP."
		},
		vulnerability: "Fragile Mind: -2 vs psychic or mind-control.",
		desc: "Lean, weathered, violet-eyed. Layered dusters and wide-brimmed hats. Photosensitive skin; perfect night vision."
	},
	"Garrison-Born": {
		name: "Garrison-Born",
		tagline: "The stubborn descendants of a ruined empire.",
		stats: {
			STR: 1,
			DEF: 2,
			INT: 0,
			WIS: 0,
			SPD: -1,
			CHA: 0,
			LCK: 0
		},
		ability: "Iron Discipline — Immune to Fear. +1 combat when fighting beside an ally.",
		kit: [
			"Dented Sigil Ring",
			"Standard Issue Whetstone",
			"Ration Tin"
		],
		lineage: {
			"Iron-Guard": "+3 DEF when standing still. Starts with a heavy tower shield.",
			"Vanguard-Scout": "+2 SPD. Ignore difficult terrain when moving toward an enemy."
		},
		vulnerability: "Heavy-Footed: -4 stealth on water or metal flooring. Cannot swim.",
		desc: "Dense bone, rigid posture, battered plate over utilitarian coats. Relics of authority in a world that forgot the lease."
	},
	"The Sunken": {
		name: "The Sunken",
		tagline: "Information is a currency, and they run the mint.",
		stats: {
			STR: -1,
			DEF: 0,
			INT: 2,
			WIS: 0,
			SPD: 0,
			CHA: 2,
			LCK: 1
		},
		ability: "Silver Tongue — Start with a Black Ledger. 10% off black-market trades.",
		kit: [
			"Encoded Ledger",
			"Silver Pocket Watch",
			"Fine Silk Handkerchief"
		],
		lineage: {
			"Guild-Broker": "Starts with 500 extra coins and a Favour token.",
			"Inksmith": "Can craft a one-time Living Tattoo buff."
		},
		vulnerability: "Dehydrated: exhaustion stacks twice as fast away from humidity.",
		desc: "Sleek, damp-hemmed coats, oxidized silver. Recessed gills. Aristocrats of the underworld."
	},
	"Deep-Claimed": {
		name: "Deep-Claimed",
		tagline: "Trapped in the dark, they became harder than the stone.",
		stats: {
			STR: 2,
			DEF: 1,
			INT: -1,
			WIS: 0,
			SPD: 0,
			CHA: -1,
			LCK: 0
		},
		ability: "Stonebreaker — Mine Hollow Ore without tools. Detect structural traps in the dark.",
		kit: [
			"Heavy Work Gloves",
			"Glowing Ore Fragment",
			"Chisel"
		],
		lineage: {
			"Bedrock-Bulwark": "Cannot be knocked down or pushed back.",
			"Ore-Seer": "Can smell precious metals through five feet of stone."
		},
		vulnerability: "Light-Blinded: -3 to all rolls for an hour after bright light.",
		desc: "Hulking, ore-veined, pale. Mining tools as weapons. The mountain gives nothing; you take it."
	},
	"Aether-Kith": {
		name: "Aether-Kith",
		tagline: "Remnants of the high-culture, drifting between states of matter.",
		stats: {
			STR: -2,
			DEF: -1,
			INT: 1,
			WIS: 1,
			SPD: 0,
			CHA: 1,
			LCK: 3
		},
		ability: "Phase Shift — Once per combat, move through a solid object or enemy.",
		kit: [
			"Glass Vial of Essence",
			"Translucent Cape",
			"Ancient Map Fragment"
		],
		lineage: {
			"Wisp-Kin": "Hover over gaps or pressure plates without triggering them.",
			"Spark-Weaver": "Generate small electrical charges to power relics or shock."
		},
		vulnerability: "Disrupted Form: 1d4 damage each turn inside anti-magic fields.",
		desc: "Translucent, weightless, prism-haze outlines. Form is temporary; energy is eternal."
	},
	"Hollow-Touched": {
		name: "Hollow-Touched",
		tagline: "Marked by the void.",
		stats: {
			STR: 1,
			DEF: 0,
			INT: 1,
			WIS: 0,
			SPD: 0,
			CHA: -1,
			LCK: 3
		},
		ability: "Void Resonance — Once per day, reroll a failed Hollow-related check. The Hollow notices.",
		kit: ["Void-Stained Cloth", "Unlabeled Vial"],
		lineage: {
			"Rift-Born": "+1 LCK. Once per arc, ignore a fumble in a Hollow location.",
			"Echo-Walker": "+1 INT. Sense nearby Hollow entities without a roll."
		},
		vulnerability: "Hollow Hunger: after a fumble in a Hollow location, lose 1 HP as the void drinks.",
		desc: "Ordinary until the light hits wrong. A faint inner absence. People step aside without knowing why."
	}
};
var COMPANIONS = {
	"Void-Hound": {
		name: "Void-Hound",
		hp: 5,
		cost: 900,
		statBuff: { CHA: 1 },
		active: "Echo Bark — Enemies nearby must resist Stun. Hidden enemies revealed.",
		passive: "Scent of the Collapse — +2 trap detection and initiative.",
		maintenance: "Feeds on raw meat and negative energy. Healed only by consuming a shadow.",
		desc: "Ash and cinder packed into a wolf's shape. Violet smoke for eyes."
	},
	"Scavenger Crow": {
		name: "Scavenger Crow",
		hp: 3,
		cost: 700,
		statBuff: { LCK: 1 },
		active: "Pilfer — Retrieve a small unsecured object up to 30 feet without breaking stealth.",
		passive: "Grave Robber — extra loot chance after combat.",
		maintenance: "Requires a shiny bribe every few days or it drops your items.",
		desc: "Turkey-sized, serrated beak, copper wire in its feathers. Speaks with stolen last words."
	},
	"Clockwork Mule": {
		name: "Clockwork Mule",
		hp: 8,
		cost: 1100,
		statBuff: { DEF: 1 },
		active: "Mobile Barricade — Locks joints. +2 DEF cover. Cannot move while locked.",
		passive: "Tireless Hauler — +5 inventory slots.",
		maintenance: "Needs scrap and oil. At 0 HP it dumps cargo.",
		desc: "Headless iron bulldog. Kingdom crests faded on its flanks. Always ticking."
	},
	"Mender Sprite": {
		name: "Mender Sprite",
		hp: 2,
		cost: 850,
		statBuff: { WIS: 1 },
		active: "Cauterizing Sap — Heal 1d6, target takes -1 next attack from the pain.",
		passive: "Guardian Light — Once per day, if you hit 0 HP the sprite dies to stabilise you at 1.",
		maintenance: "Feeds on ambient magic. Double damage from area attacks.",
		desc: "A jagged shard of living amber. Smells of pine and ozone."
	}
};
var WORLD = [
	{
		id: "hq",
		name: "SYNAPSE Compound",
		short: "HQ",
		x: 52,
		y: 56,
		danger: 1,
		desc: "Tyrone's desk. Safe enough. The CRT never sleeps.",
		features: [
			"The Forge",
			"The Infirmary",
			"The Ledger",
			"The Bunkhouse"
		],
		connectedTo: [
			"ironclad",
			"kingdom",
			"caverns",
			"library",
			"veyra"
		],
		hollow: false,
		unlockDay: 1,
		bossId: "",
		bossAfter: 99
	},
	{
		id: "ironclad",
		name: "Ironclad",
		short: "Ironclad",
		x: 16,
		y: 40,
		danger: 3,
		desc: "The first gate. Forged walls, slag lanterns, a checkpoint that pretends to be a welcome.",
		features: [
			"Slag-hound pens",
			"Gate caches",
			"The Watch still walks"
		],
		connectedTo: [
			"hq",
			"kingdom",
			"veyra"
		],
		hollow: false,
		unlockDay: 1,
		bossId: "gravenor",
		bossAfter: 3
	},
	{
		id: "kingdom",
		name: "The Crumbling Kingdom",
		short: "Kingdom",
		x: 50,
		y: 18,
		danger: 2,
		desc: "What is left of an empire. The walls still stand in places.",
		features: [
			"Garrison footlockers",
			"Throne room",
			"Military remnants"
		],
		connectedTo: [
			"hq",
			"ironclad",
			"caverns",
			"library"
		],
		hollow: false,
		unlockDay: 2,
		bossId: "valdris",
		bossAfter: 4
	},
	{
		id: "caverns",
		name: "Underground Caverns",
		short: "Caverns",
		x: 24,
		y: 80,
		danger: 3,
		desc: "The deep dark beneath everything else.",
		features: [
			"Hollow ore deposits",
			"Mushroom clusters",
			"Unmapped deep"
		],
		connectedTo: [
			"hq",
			"kingdom",
			"library"
		],
		hollow: true,
		unlockDay: 3,
		bossId: "thessaly",
		bossAfter: 4
	},
	{
		id: "library",
		name: "The Sunken Library",
		short: "Library",
		x: 78,
		y: 82,
		danger: 2,
		desc: "Partially submerged. Still functional. Still sinking.",
		features: [
			"Scholar cases",
			"Restricted archive",
			"The Sink below"
		],
		connectedTo: [
			"hq",
			"kingdom",
			"caverns",
			"veyra"
		],
		hollow: true,
		unlockDay: 4,
		bossId: "sink",
		bossAfter: 4
	},
	{
		id: "veyra",
		name: "Veyra City",
		short: "Veyra",
		x: 86,
		y: 22,
		danger: 5,
		desc: "The last city on the seam. Wet stone, brass signs, a skyline that does not promise a way home.",
		features: [
			"Rift markets",
			"The Null Warden",
			"Time keeps bad hours"
		],
		connectedTo: [
			"hq",
			"ironclad",
			"library"
		],
		hollow: true,
		unlockDay: 6,
		bossId: "warden",
		bossAfter: 3
	}
];
var VILLAINS = [
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
			{
				name: "The Watcher",
				at: 28,
				desc: "Observes. Tests. Will speak if approached with respect."
			},
			{
				name: "The Hunter",
				at: 18,
				desc: "Targets whoever hurt his pack. Precise."
			},
			{
				name: "The Feral",
				at: 10,
				desc: "The man recedes. Reckless, devastating."
			},
			{
				name: "The Reckoning",
				at: 0,
				desc: "One round of lucidity. He speaks."
			}
		],
		lootName: "Ashen Fang"
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
			{
				name: "The Chancellor",
				at: 24,
				desc: "Diplomatic. Helpful. Building trust to spend later."
			},
			{
				name: "The Negotiator",
				at: 14,
				desc: "Offers improve. Costs worsen."
			},
			{
				name: "The Unmourned",
				at: 6,
				desc: "Drops the facade. Uses every piece of leverage."
			}
		],
		lootName: "Kingdom Vault Key"
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
			{
				name: "The Guide",
				at: 26,
				desc: "Presents as a resource. Her help always serves the project."
			},
			{
				name: "The Architect",
				at: 16,
				desc: "Stops pretending. Starts explaining."
			},
			{
				name: "The Burned",
				at: 8,
				desc: "Project near completion."
			}
		],
		lootName: "Master Cavern Map"
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
			{
				name: "The Archive",
				at: 32,
				desc: "Passive. Answers questions. Always truly."
			},
			{
				name: "The Collector",
				at: 20,
				desc: "The Pull intensifies. You are being read."
			},
			{
				name: "The Answer",
				at: 8,
				desc: "Asks each character one question about their Destiny Thread."
			}
		],
		lootName: "Founding Document"
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
			{
				name: "The Boundary",
				at: 40,
				desc: "Felt as directional wrongness. Observes."
			},
			{
				name: "The Warden",
				at: 24,
				desc: "Tests each character against Shadow or Destiny."
			},
			{
				name: "The Keeper",
				at: 10,
				desc: "If you engaged honestly, it becomes a presence you can speak with."
			}
		],
		lootName: "Moon Squad Challenge Coin"
	}
];
var NPCS = [
	{
		name: "Voss",
		title: "The Ash-Peddler",
		loc: "veyra",
		quote: "The void demands equivalent exchange. Coins, blood, and memory.",
		stock: [{
			name: "Pure Void-Essence",
			price: 2e3,
			rarity: "Rare"
		}, {
			name: "Rift Shard",
			price: 800,
			rarity: "Uncommon"
		}]
	},
	{
		name: "Quartermaster Rudge",
		title: "Kingdom Gate",
		loc: "kingdom",
		quote: "Show your identification, or pay the outlander tax.",
		stock: [{
			name: "Standard Rations",
			price: 150,
			rarity: "Common"
		}, {
			name: "Garrison Whetstone",
			price: 220,
			rarity: "Common"
		}]
	},
	{
		name: "Nylah the Dredge",
		title: "Arcane Merchant",
		loc: "library",
		quote: "The water keeps the best secrets. I just fetch them.",
		stock: [{
			name: "Focus Crystal",
			price: 300,
			rarity: "Uncommon"
		}, {
			name: "Waterlogged Grimoire",
			price: 1200,
			rarity: "Rare"
		}]
	},
	{
		name: "Sister Vex",
		title: "The Purifier",
		loc: "ironclad",
		quote: "Do not bring that filth into my chapel unless you are ready to bleed for it.",
		stock: [{
			name: "Aether Bandages",
			price: 250,
			rarity: "Uncommon"
		}, {
			name: "Holy Salt",
			price: 500,
			rarity: "Uncommon"
		}]
	},
	{
		name: "Krell the Foreman",
		title: "Bedrock Smith",
		loc: "caverns",
		quote: "The mountain don't care about your stories. Only the weight of your swing.",
		stock: [{
			name: "Hollow Ore",
			price: 400,
			rarity: "Uncommon"
		}, {
			name: "Deep-Blast Charge",
			price: 800,
			rarity: "Rare"
		}]
	}
];
var BASE_ROOMS = {
	vault: {
		name: "The Vault",
		desc: "Stores loot. Generates a quiet tithe from organised salvage.",
		income: 3,
		tiers: [
			{
				cost: 0,
				bonus: "20 item capacity. +3 coins/tick."
			},
			{
				cost: 2500,
				bonus: "50 capacity. Items degrade slower. +6 coins/tick."
			},
			{
				cost: 8e3,
				bonus: "100 capacity. Condition holds. +10 coins/tick."
			}
		]
	},
	barracks: {
		name: "The Barracks",
		desc: "Housing for guards. More beds, more operatives.",
		income: 2,
		tiers: [
			{
				cost: 1800,
				bonus: "+2 roster slots. Base defended on 12+."
			},
			{
				cost: 5e3,
				bonus: "+4 roster slots. Defended on 10+."
			},
			{
				cost: 12e3,
				bonus: "+6 roster slots. Defended on 8+. Counter-attack."
			}
		]
	},
	forge: {
		name: "The Forge",
		desc: "Repair and socket. Fumbles still eat steel.",
		income: 2,
		tiers: [
			{
				cost: 1400,
				bonus: "Repair 400c. Worn gear restored."
			},
			{
				cost: 4200,
				bonus: "Repair 220c. Socket one enchantment."
			},
			{
				cost: 11e3,
				bonus: "Repair 80c. Two sockets. Self-repair on 16+."
			}
		]
	},
	infirmary: {
		name: "The Infirmary",
		desc: "Heal the living. Bargain with the downed.",
		income: 1,
		tiers: [
			{
				cost: 2200,
				bonus: "Treat wounds 80c. Stabilise downed."
			},
			{
				cost: 6500,
				bonus: "Cure void infection. Heal companions."
			},
			{
				cost: 15e3,
				bonus: "Attempt resurrection 10+. Full service."
			}
		]
	},
	watchtower: {
		name: "The Watchtower",
		desc: "See farther. Die less often.",
		income: 2,
		tiers: [
			{
				cost: 2e3,
				bonus: "Mission DC -1. Night raid warning."
			},
			{
				cost: 6e3,
				bonus: "Mission DC -2. Track bounty movement."
			},
			{
				cost: 14e3,
				bonus: "Mission DC -3. Villain intel unlocked."
			}
		]
	},
	ledger: {
		name: "The Ledger",
		desc: "Daily shop. Moon Squad eats, trades, and keeps books.",
		income: 4,
		tiers: [
			{
				cost: 1600,
				bonus: "Bargain goods each dawn."
			},
			{
				cost: 4800,
				bonus: "Essential stock. Better prices."
			},
			{
				cost: 1e4,
				bonus: "Artifact chance. 15% shop discount."
			}
		]
	}
};
var QUARTERS = {
	bunk: {
		name: "The Bunk",
		tiers: [
			{
				cost: 800,
				bonus: "+1 to first roll of the day."
			},
			{
				cost: 2e3,
				bonus: "+2 Max HP."
			},
			{
				cost: 4500,
				bonus: "Full HP restoration at dawn."
			}
		]
	},
	lockbox: {
		name: "The Lockbox",
		tiers: [
			{
				cost: 1e3,
				bonus: "25% protection from night theft."
			},
			{
				cost: 2800,
				bonus: "50% protection."
			},
			{
				cost: 6e3,
				bonus: "75% protection. Vault-grade."
			}
		]
	},
	hearth: {
		name: "The Hearth",
		tiers: [
			{
				cost: 1200,
				bonus: "Companions heal 1 HP at dawn."
			},
			{
				cost: 2800,
				bonus: "Companions +1 to passive rolls."
			},
			{
				cost: 5500,
				bonus: "Companions fully restored at dawn."
			}
		]
	}
};
var RESIDENT_ROLES = {
	guard: {
		label: "Guard",
		bonus: "+1 HQ defense",
		cost: 400
	},
	medic: {
		label: "Medic",
		bonus: "Infirmary costs -15%",
		cost: 500
	},
	scout: {
		label: "Scout",
		bonus: "Watchtower DC -1 extra",
		cost: 450
	},
	quartermaster: {
		label: "Quartermaster",
		bonus: "Vault income +2",
		cost: 480
	},
	smith: {
		label: "Smith",
		bonus: "Forge repair -20%",
		cost: 520
	},
	spymaster: {
		label: "Spymaster",
		bonus: "Once/day: villain intel",
		cost: 700
	}
};
var BOUNTIES = [
	{
		id: "b1",
		name: "The Ashen Deserter",
		type: "Rogue Warrior",
		reward: "5,000 coins",
		rewardCoins: 900,
		location: "ironclad",
		dc: 14,
		hp: 14
	},
	{
		id: "b2",
		name: "Void-Touched Smuggler",
		type: "Corrupted Merchant",
		reward: "Rare weapon",
		rewardCoins: 700,
		location: "caverns",
		dc: 15,
		hp: 12
	},
	{
		id: "b3",
		name: "The Mad Alchemist",
		type: "Rogue Healer",
		reward: "Legendary enchantment",
		rewardCoins: 1100,
		location: "kingdom",
		dc: 16,
		hp: 16
	},
	{
		id: "b4",
		name: "Cultist of the Sink",
		type: "Zealot",
		reward: "8,000 coins",
		rewardCoins: 1200,
		location: "library",
		dc: 15,
		hp: 15
	},
	{
		id: "b5",
		name: "Wandering Null-Spawn",
		type: "Entity",
		reward: "Mythic fragment",
		rewardCoins: 1600,
		location: "veyra",
		dc: 18,
		hp: 20
	}
];
var LEDGER_POOLS = {
	bargain: [
		{
			name: "Iron Rations x3",
			price: 180,
			kind: "consumable",
			rarity: "Common",
			effect: "Restore 2 HP in the field."
		},
		{
			name: "Healing Salve",
			price: 220,
			kind: "consumable",
			rarity: "Common",
			effect: "Restore 3 HP."
		},
		{
			name: "Lockpicks",
			price: 160,
			kind: "trinket",
			rarity: "Common",
			effect: "+1 lockpicking."
		},
		{
			name: "Torch Bundle",
			price: 90,
			kind: "consumable",
			rarity: "Common",
			effect: "Ignore darkness penalties one sortie."
		},
		{
			name: "Common Dagger",
			price: 240,
			kind: "weapon",
			rarity: "Common",
			effect: "1d4. Last resort."
		}
	],
	essential: [
		{
			name: "Hollow Ore x2",
			price: 700,
			kind: "material",
			rarity: "Uncommon",
			effect: "Forge fuel. Required for socketing."
		},
		{
			name: "Enchanted Bandage",
			price: 480,
			kind: "consumable",
			rarity: "Uncommon",
			effect: "Restore 5 HP. Clears bleed."
		},
		{
			name: "Stealth Cloak",
			price: 900,
			kind: "armor",
			rarity: "Uncommon",
			effect: "+1 stealth."
		},
		{
			name: "Scout's Compass",
			price: 620,
			kind: "trinket",
			rarity: "Uncommon",
			effect: "+1 tracking."
		},
		{
			name: "Alchemist's Flask",
			price: 540,
			kind: "consumable",
			rarity: "Uncommon",
			effect: "2d4 fire, one use."
		}
	],
	artifact: [
		{
			name: "Void-Touched Coin",
			price: 2200,
			kind: "trinket",
			rarity: "Rare",
			effect: "+1 LCK. Slight Hollow attention."
		},
		{
			name: "Ashen Fang Shard",
			price: 2600,
			kind: "material",
			rarity: "Rare",
			effect: "Socket for +1 slashing."
		},
		{
			name: "Library Access Key",
			price: 3e3,
			kind: "trinket",
			rarity: "Rare",
			effect: "Unlocks restricted archive checks."
		},
		{
			name: "Veyra Fragment",
			price: 3400,
			kind: "material",
			rarity: "Legendary",
			effect: "Mythic craft component."
		},
		{
			name: "Drowned Archive Text",
			price: 2800,
			kind: "trinket",
			rarity: "Rare",
			effect: "+2 knowledge in the Library."
		}
	]
};
var WEAPONS = [
	{
		name: "Ironhide Broadsword",
		cls: "Warrior",
		type: "Slashing",
		rarity: "Common",
		damage: "1d8",
		effect: "None.",
		lore: "Dull edge, heavy swing.",
		value: 120
	},
	{
		name: "Rusted Garrison Mace",
		cls: "Warrior",
		type: "Blunt",
		rarity: "Common",
		damage: "1d6",
		effect: "+1 vs armored.",
		lore: "A crude tool for crude work.",
		value: 90
	},
	{
		name: "Reinforced Halberd",
		cls: "Warrior",
		type: "Reach",
		rarity: "Uncommon",
		damage: "1d10",
		effect: "Strike from second rank.",
		lore: "Keeps monsters at arm's length.",
		value: 320
	},
	{
		name: "Ash-Tempered Cleaver",
		cls: "Warrior",
		type: "Heavy",
		rarity: "Uncommon",
		damage: "1d8+1",
		effect: "Won't break on a fumble.",
		lore: "Blackened by fire, sharpened by bone.",
		value: 400
	},
	{
		name: "Hollow-Iron Greatsword",
		cls: "Warrior",
		type: "Heavy",
		rarity: "Rare",
		damage: "2d6",
		effect: "Ignores 1 armor.",
		lore: "Cold. Silent when swung.",
		value: 1400
	},
	{
		name: "The Warden's Judgement",
		cls: "Warrior",
		type: "Relic",
		rarity: "Legendary",
		damage: "2d8",
		effect: "Crit: stun one round.",
		lore: "Weight of a fallen empire.",
		value: 4200
	},
	{
		name: "The Void Cleaver",
		cls: "Warrior",
		type: "Anomaly",
		rarity: "Mythic",
		damage: "3d6",
		effect: "Ignores armor.",
		lore: "It hums when it tastes blood.",
		value: 9e3
	},
	{
		name: "Gutter-Spike",
		cls: "Rogue",
		type: "Piercing",
		rarity: "Common",
		damage: "1d4",
		effect: "+1 from stealth.",
		lore: "A sharpened fence post.",
		value: 70
	},
	{
		name: "Chipped Throwing Knives",
		cls: "Rogue",
		type: "Thrown",
		rarity: "Common",
		damage: "1d4",
		effect: "Ranged.",
		lore: "Quantity over quality.",
		value: 80
	},
	{
		name: "Serrated Bone-Shiv",
		cls: "Rogue",
		type: "Piercing",
		rarity: "Uncommon",
		damage: "1d6",
		effect: "Bleed 1 for 2 rounds.",
		lore: "Leaves a jagged wound.",
		value: 280
	},
	{
		name: "Shadow-Forged Blade",
		cls: "Rogue",
		type: "Finesse",
		rarity: "Rare",
		damage: "1d6+1",
		effect: "Draws no attention.",
		lore: "Absorbs light.",
		value: 1500
	},
	{
		name: "The Ghost Blade",
		cls: "Rogue",
		type: "Relic",
		rarity: "Legendary",
		damage: "2d4",
		effect: "Damages vitality directly.",
		lore: "A blade made of memory.",
		value: 4e3
	},
	{
		name: "Splintered Staff",
		cls: "Wizard",
		type: "Focus",
		rarity: "Common",
		damage: "1d4",
		effect: "Light source.",
		lore: "Barely holds a spark.",
		value: 90
	},
	{
		name: "Ash-Wood Wand",
		cls: "Wizard",
		type: "Wand",
		rarity: "Uncommon",
		damage: "1d6",
		effect: "+1 fire spells.",
		lore: "Smells of smoke.",
		value: 310
	},
	{
		name: "Hollow-Glass Tome",
		cls: "Wizard",
		type: "Grimoire",
		rarity: "Rare",
		damage: "1d8",
		effect: "+2 spell dmg. Fumble: 1 self.",
		lore: "Words rearrange themselves.",
		value: 1600
	},
	{
		name: "The Arcanist's Spine",
		cls: "Wizard",
		type: "Relic",
		rarity: "Legendary",
		damage: "2d6",
		effect: "Once/arc auto-succeed a spell.",
		lore: "Quicksilver through bone.",
		value: 4500
	},
	{
		name: "Rusted Scalpel",
		cls: "Healer",
		type: "Piercing",
		rarity: "Common",
		damage: "1d4",
		effect: "Extract venom on INT.",
		lore: "Sterilized by fire too many times.",
		value: 70
	},
	{
		name: "Order Censer",
		cls: "Healer",
		type: "AoE",
		rarity: "Uncommon",
		damage: "1d6",
		effect: "Allies nearby regen 1 out of combat.",
		lore: "Sweet smoke numbs pain.",
		value: 340
	},
	{
		name: "Blood-Glass Syringe",
		cls: "Healer",
		type: "Precision",
		rarity: "Rare",
		damage: "1d6",
		effect: "Drain 2, heal ally 2.",
		lore: "Distills blood into vitality.",
		value: 1500
	},
	{
		name: "The First Saint's Femur",
		cls: "Healer",
		type: "Relic",
		rarity: "Legendary",
		damage: "1d10",
		effect: "Healing spells maximise.",
		lore: "He never harmed a soul.",
		value: 4300
	},
	{
		name: "Iron-Shod Stick",
		cls: "Merchant",
		type: "Blunt",
		rarity: "Common",
		damage: "1d6",
		effect: "Test for traps.",
		lore: "Cracks goblin jaws.",
		value: 80
	},
	{
		name: "Weighted Ledger",
		cls: "Merchant",
		type: "Heavy",
		rarity: "Uncommon",
		damage: "1d8",
		effect: "20% knock loose coins.",
		lore: "Throwing the book.",
		value: 300
	},
	{
		name: "Guildmaster's Cane",
		cls: "Merchant",
		type: "Finesse",
		rarity: "Rare",
		damage: "1d6+2",
		effect: "First strike +2.",
		lore: "A symbol of hollow status.",
		value: 1400
	},
	{
		name: "Debt Collector's Scales",
		cls: "Merchant",
		type: "Flail",
		rarity: "Legendary",
		damage: "2d8",
		effect: "Damage scales with carried gold.",
		lore: "Heavier purse, harder hit.",
		value: 4100
	},
	{
		name: "Scuffed Lute",
		cls: "Bard",
		type: "Instrument",
		rarity: "Common",
		damage: "1d4",
		effect: "+1 tavern performance.",
		lore: "Two strings out of tune.",
		value: 70
	},
	{
		name: "Iron-Strung Harp",
		cls: "Bard",
		type: "Instrument",
		rarity: "Uncommon",
		damage: "1d6",
		effect: "Usable as a blunt weapon.",
		lore: "Heavy metal.",
		value: 290
	},
	{
		name: "Hollow-Bone Flute",
		cls: "Bard",
		type: "Focus",
		rarity: "Rare",
		damage: "1d4",
		effect: "Dissonance: enemies attack nearest.",
		lore: "Makes your teeth itch.",
		value: 1500
	},
	{
		name: "The Maestro's Baton",
		cls: "Bard",
		type: "Wand",
		rarity: "Legendary",
		damage: "1d8",
		effect: "Once/day dictate 3 enemy moves.",
		lore: "The music it demands is always a tragedy.",
		value: 4e3
	}
];
var ARMOR = [
	{
		name: "Leather Tunic",
		cls: "Warrior",
		rarity: "Common",
		defense: 1,
		effect: "None.",
		value: 80
	},
	{
		name: "Ironhide Brigandine",
		cls: "Warrior",
		rarity: "Uncommon",
		defense: 2,
		effect: "First damage each day -1.",
		value: 340
	},
	{
		name: "Hollow-Steel Cuirass",
		cls: "Warrior",
		rarity: "Rare",
		defense: 3,
		effect: "Immune to crits from standard weapons.",
		value: 1600
	},
	{
		name: "Prowler's Leathers",
		cls: "Rogue",
		rarity: "Uncommon",
		defense: 1,
		effect: "+1 urban stealth.",
		value: 300
	},
	{
		name: "Hollow-Shadow Wrap",
		cls: "Rogue",
		rarity: "Rare",
		defense: 2,
		effect: "-2 detection in Hollow locations.",
		value: 1500
	},
	{
		name: "Acolyte's Mantle",
		cls: "Wizard",
		rarity: "Uncommon",
		defense: 1,
		effect: "+1 basic spell rolls.",
		value: 280
	},
	{
		name: "Hollow-Weave Robes",
		cls: "Wizard",
		rarity: "Rare",
		defense: 2,
		effect: "Magical damage -1.",
		value: 1400
	},
	{
		name: "Field Medic's Coat",
		cls: "Healer",
		rarity: "Uncommon",
		defense: 1,
		effect: "+2 medical inventory.",
		value: 260
	},
	{
		name: "Sanctuary Robes",
		cls: "Healer",
		rarity: "Rare",
		defense: 2,
		effect: "Enemies WIS 12+ to target you first.",
		value: 1450
	},
	{
		name: "Smuggler's Coat",
		cls: "Merchant",
		rarity: "Uncommon",
		defense: 1,
		effect: "Hidden pockets.",
		value: 300
	},
	{
		name: "Briber's Velvet Mantle",
		cls: "Merchant",
		rarity: "Rare",
		defense: 1,
		effect: "+2 CHA on deals.",
		value: 1300
	},
	{
		name: "Performer's Leathers",
		cls: "Bard",
		rarity: "Uncommon",
		defense: 1,
		effect: "Full mobility.",
		value: 250
	},
	{
		name: "Echo-Weave Cloak",
		cls: "Bard",
		rarity: "Rare",
		defense: 1,
		effect: "Amplifies performances.",
		value: 1200
	}
];
var ENEMIES = {
	hq: [],
	ironclad: [
		{
			name: "Slag-Hound",
			hp: 7,
			atk: 3,
			def: 1,
			dc: 11,
			flavor: "Low, patient. Waiting for a mistake at the gate."
		},
		{
			name: "Ironclad Watch",
			hp: 11,
			atk: 4,
			def: 2,
			dc: 13,
			flavor: "It has done this checkpoint before."
		},
		{
			name: "Ashen Briar",
			hp: 8,
			atk: 3,
			def: 3,
			dc: 12,
			flavor: "The walls remember knives."
		}
	],
	kingdom: [
		{
			name: "Garrison Remnant",
			hp: 10,
			atk: 4,
			def: 3,
			dc: 12,
			flavor: "Still following orders that no longer exist."
		},
		{
			name: "Debt Shade",
			hp: 8,
			atk: 3,
			def: 2,
			dc: 13,
			flavor: "It knows what you owe."
		},
		{
			name: "Throne Guard",
			hp: 12,
			atk: 5,
			def: 4,
			dc: 14,
			flavor: "Armor older than the walls."
		}
	],
	caverns: [
		{
			name: "Ore-Leech",
			hp: 6,
			atk: 3,
			def: 2,
			dc: 12,
			flavor: "It drinks metal."
		},
		{
			name: "Cave Horror",
			hp: 14,
			atk: 5,
			def: 3,
			dc: 14,
			flavor: "Too many joints."
		},
		{
			name: "Mapped Wrong",
			hp: 9,
			atk: 4,
			def: 2,
			dc: 13,
			flavor: "The corridor was not here yesterday."
		}
	],
	library: [
		{
			name: "Drowned Page",
			hp: 7,
			atk: 3,
			def: 1,
			dc: 12,
			flavor: "It wants to be read. That is not a kindness."
		},
		{
			name: "Archive Warden",
			hp: 12,
			atk: 4,
			def: 3,
			dc: 14,
			flavor: "Silence is policy."
		},
		{
			name: "Memory That Bites",
			hp: 9,
			atk: 4,
			def: 2,
			dc: 13,
			flavor: "Someone else's worst day."
		}
	],
	veyra: [
		{
			name: "Null-Spawn",
			hp: 10,
			atk: 5,
			def: 2,
			dc: 15,
			flavor: "It is the absence of a creature."
		},
		{
			name: "Static Walker",
			hp: 12,
			atk: 5,
			def: 3,
			dc: 16,
			flavor: "The hum arrives first."
		},
		{
			name: "Unbound Echo",
			hp: 16,
			atk: 6,
			def: 4,
			dc: 16,
			flavor: "A person-shaped hole in the air."
		}
	]
};
function locById(id) {
	return WORLD.find((l) => l.id === id) ?? WORLD[1];
}
function villainById(id) {
	return VILLAINS.find((v) => v.id === id);
}
function weaponDamageAvg(dice) {
	const m = dice.match(/(\d+)d(\d+)(?:\+(\d+))?/);
	if (!m) return 4;
	const n = Number(m[1]);
	const s = Number(m[2]);
	const b = Number(m[3] ?? 0);
	return Math.round(n * ((s + 1) / 2) + b);
}
function makeItemFromWeapon(w) {
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
		value: w.value
	};
}
function makeItemFromArmor(a) {
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
		value: a.value
	};
}
function starterWeapon(cls) {
	return makeItemFromWeapon(WEAPONS.find((x) => x.cls === cls && x.rarity === "Common") ?? WEAPONS[0]);
}
var PACK_KEYS = [
	"bobby_pin",
	"stimpak",
	"mentats",
	"holotape",
	"sarsaparilla",
	"probe_kit"
];
var PACK_CATALOG = {
	bobby_pin: {
		name: "Bobby pin",
		useName: "bobby_pin",
		rarity: "Common",
		blurb: "Old lockpick leftover. New files start with 3.",
		use: "Lockpick is gone. Flavor until we retie it.",
		usable: true
	},
	stimpak: {
		name: "Stimpak",
		useName: "stimpak",
		rarity: "Rare",
		blurb: "Pride patch, not HP. Rare clean-win drop.",
		use: "Tyrone patches the streak talk. You still have to win.",
		usable: true
	},
	mentats: {
		name: "Mentats",
		useName: "mentats",
		rarity: "Rare",
		blurb: "Brain chems. Rare raid drop.",
		use: "Next loot roll +3 Luck.",
		usable: true
	},
	holotape: {
		name: "Holotape",
		useName: "holotape",
		rarity: "Uncommon",
		blurb: "Workshop noise. Hack and scored boards can drop one.",
		use: "A porch line. No blueprint.",
		usable: true
	},
	sarsaparilla: {
		name: "Sunset Sarsaparilla",
		useName: "sarsaparilla",
		rarity: "Uncommon",
		blurb: "Bottle. Trivia and lucky rolls.",
		use: "Tyrone toasts you.",
		usable: true
	},
	probe_kit: {
		name: "Probe kit",
		useName: "probe_kit",
		rarity: "Rare",
		blurb: "Hack extra. Memory probes in a battered case.",
		use: "Next hack +1 memory probe.",
		usable: true
	}
};
var BOBBY_LINES = [
	"You bend it. It doesn't pick anything. Yet.",
	"Lockpick's gone. You just spent a pin on the aesthetic.",
	"Three was the starter kit. You're down one. Tyrone shrugs."
];
var STIMPAK_LINES = [
	"Pride patch. I fixed the talk. I didn't fix the streak.",
	"You still have to win. This just makes the loss sound better.",
	"Patched. Now go do something that deserves it."
];
var MENTATS_LINES = [
	"Brain's loud now. Next crate you crack is luckier.",
	"+3 Luck on the next loot roll. Don't waste it on a fumble.",
	"Chems are a loan. Pay it back with a clean win."
];
var HOLO_LINES = [
	"Workshop's loud tonight. That's a holotape, not a plan.",
	"You want a blueprint, steal one. This is porch talk.",
	"Static, a laugh, somebody welding at 2 a.m. That's the tape."
];
var SARS_LINES = [
	"To the ones who made it back. Drink.",
	"Sunset in a bottle. Don't waste it.",
	"Tyrone toasts you. The CRT flickers like it agrees."
];
var PROBE_LINES = [
	"One extra memory probe on the next CRT. Don't fry it.",
	"Kit's open. Next hack remembers one more thing.",
	"Probe seated. The terminal's going to hate you slightly less."
];
function pickLine(lines) {
	return lines[Math.floor(Math.random() * lines.length)];
}
function note(state, kind, who, what) {
	state.log = [{
		id: `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
		day: state.day,
		kind,
		who,
		what
	}, ...state.log].slice(0, 80);
}
function emptyPack() {
	return {
		bobby_pin: 0,
		stimpak: 0,
		mentats: 0,
		holotape: 0,
		sarsaparilla: 0,
		probe_kit: 0
	};
}
function starterPack() {
	return {
		...emptyPack(),
		bobby_pin: 3
	};
}
function mountainDateKey(d = /* @__PURE__ */ new Date()) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/Edmonton",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(d);
}
function freshClocks(dateKey = mountainDateKey()) {
	return {
		dateKey,
		triviaLives: 3,
		tfLives: 3,
		unscramble: 10
	};
}
function ensureClocks(state) {
	const key = mountainDateKey();
	if (!state.clocks || state.clocks.dateKey !== key) state.clocks = freshClocks(key);
}
function addPack(state, key, n = 1) {
	if (!state.pack) state.pack = emptyPack();
	state.pack[key] = Math.max(0, (state.pack[key] ?? 0) + n);
}
var DROP_WEIGHTS = [
	{
		key: "bobby_pin",
		w: 34
	},
	{
		key: "sarsaparilla",
		w: 22
	},
	{
		key: "holotape",
		w: 16
	},
	{
		key: "stimpak",
		w: 12
	},
	{
		key: "mentats",
		w: 10
	},
	{
		key: "probe_kit",
		w: 6
	}
];
function rollWeighted() {
	const total = DROP_WEIGHTS.reduce((a, x) => a + x.w, 0);
	let r = Math.random() * total;
	for (const row of DROP_WEIGHTS) {
		r -= row.w;
		if (r <= 0) return row.key;
	}
	return "bobby_pin";
}
/** Clean win: chance at a pack item. Mentats fatten the table. */
function grantPackLoot(state, opts) {
	const luck = state.mentatsLuck > 0 ? 3 : 0;
	if (state.mentatsLuck > 0) state.mentatsLuck -= 1;
	const chance = (opts?.sure ? 1 : .38) + luck * .08;
	if (Math.random() > chance) return null;
	const key = rollWeighted();
	addPack(state, key, 1);
	const cat = PACK_CATALOG[key];
	note(state, "loot", opts?.source ?? "Sortie", `${cat.name} hits the vault.`);
	return key;
}
function usePackItem(state, key) {
	ensureClocks(state);
	if (!state.pack) state.pack = emptyPack();
	if ((state.pack[key] ?? 0) <= 0) return `No ${PACK_CATALOG[key].name} in the vault.`;
	state.pack[key] -= 1;
	let line = "";
	if (key === "bobby_pin") line = pickLine(BOBBY_LINES);
	else if (key === "stimpak") {
		line = pickLine(STIMPAK_LINES);
		state.moonFavor += 1;
	} else if (key === "mentats") {
		state.mentatsLuck += 1;
		line = pickLine(MENTATS_LINES);
	} else if (key === "holotape") line = pickLine(HOLO_LINES);
	else if (key === "sarsaparilla") {
		line = pickLine(SARS_LINES);
		state.moonFavor += 1;
	} else if (key === "probe_kit") {
		state.hackProbes += 1;
		if (state.terminalLockDay > state.day) state.terminalLockDay = 0;
		line = pickLine(PROBE_LINES);
	}
	note(state, "action", "Tyrone", `${PACK_CATALOG[key].name}: ${line}`);
	state.toast = line;
	return null;
}
var HACK_WORDS = [
	"STIMPAK",
	"MENTATS",
	"SYNAPSE",
	"FALLOUT",
	"NUCLEAR",
	"LOCKPIN",
	"PROBING",
	"BOTTLES",
	"SUNSETS",
	"HOLOTAP",
	"WASTREL",
	"GLOWING"
];
function shuffle(arr) {
	const a = arr.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
function likeness(a, b) {
	let n = 0;
	const len = Math.min(a.length, b.length);
	for (let i = 0; i < len; i++) if (a[i] === b[i]) n++;
	return n;
}
function openHack(state) {
	ensureClocks(state);
	if (state.hack) return null;
	if (state.terminalLockDay > state.day && state.hackProbes <= 0) return "Terminal locked. Wait for dawn, or spend a probe kit.";
	const words = shuffle(["SYNAPSE", ...shuffle(HACK_WORDS.filter((w) => w !== "SYNAPSE")).slice(0, 11)]);
	const password = "SYNAPSE";
	const extra = state.hackProbes;
	if (extra > 0) state.hackProbes = 0;
	const triesMax = 4 + extra;
	state.hack = {
		words,
		password,
		tries: triesMax,
		triesMax,
		dudsLeft: words.filter((w) => w !== password),
		log: [
			"SYNAPSE TERMINAL · T-0880",
			extra ? `PROBE KIT SEATED · ${triesMax} ATTEMPT(S) LEFT` : `${triesMax} ATTEMPT(S) LEFT`,
			"S.Y.N.A.P.S.E TERMLINK PROTOCOL",
			"Enter password now."
		],
		lastLikeness: null,
		locked: false,
		won: false
	};
	state.terminalLockDay = 0;
	return null;
}
function closeHack(state) {
	state.hack = null;
}
function hackGuess(state, word) {
	const h = state.hack;
	if (!h || h.locked || h.won) return "idle";
	const w = word.toUpperCase();
	if (!h.words.includes(w)) return "idle";
	if (w === h.password) {
		h.won = true;
		h.log = [
			...h.log,
			`>${w}`,
			"Exact match!",
			"Please wait while system is accessed..."
		];
		if (!state.terminalDrained) {
			state.terminalDrained = true;
			state.coins += 3e3;
			h.log = [
				...h.log,
				"ACCOUNT OVERRIDE",
				"+3,000 BOTTLE CAPS TRANSFERRED"
			];
			note(state, "loot", "Terminal", "Easter egg. +3,000 bottle caps.");
			state.toast = "Terminal cracked. +3,000 bottle caps.";
			if (Math.random() < .55) {
				addPack(state, "holotape", 1);
				h.log = [...h.log, "HOLOTAPE DUMPED TO VAULT"];
			}
		} else {
			const drip = 40 + Math.floor(Math.random() * 25);
			state.coins += drip;
			h.log = [
				...h.log,
				"VAULT ACCOUNT: MOSTLY EMPTY",
				`TYRONE: "You already cleaned that crate."`,
				`+${drip} CAPS IN THE TRAY`
			];
			state.toast = `Already drained. +${drip} caps in the tray.`;
		}
		return "won";
	}
	h.tries -= 1;
	const like = likeness(w, h.password);
	h.lastLikeness = like;
	h.log = [
		...h.log,
		`>${w}`,
		"Entry denied.",
		`Likeness=${like}`
	];
	if (h.tries <= 0) {
		h.locked = true;
		state.terminalLockDay = state.day + 1;
		h.log = [
			...h.log,
			"TERMINAL LOCKED",
			"Wait for dawn — or seat a probe kit."
		];
		state.toast = "Lockout. Dawn, or a probe kit.";
		return "lock";
	}
	h.log = [...h.log, `${h.tries} ATTEMPT(S) LEFT`];
	return "denied";
}
function hackDud(state) {
	const h = state.hack;
	if (!h || h.locked || h.won) return "Nothing to pry.";
	if (!h.dudsLeft.length) return "No duds left in the dump.";
	const idx = Math.floor(Math.random() * h.dudsLeft.length);
	const gone = h.dudsLeft.splice(idx, 1)[0];
	h.words = h.words.filter((w) => w !== gone);
	h.log = [
		...h.log,
		">()",
		`Dud removed: ${gone}`
	];
	return null;
}
function seedPackIfNeeded(state) {
	if (!state.pack) state.pack = starterPack();
	else for (const k of PACK_KEYS) if (typeof state.pack[k] !== "number") state.pack[k] = 0;
	if (typeof state.mentatsLuck !== "number") state.mentatsLuck = 0;
	if (typeof state.hackProbes !== "number") state.hackProbes = 0;
	if (typeof state.terminalDrained !== "boolean") state.terminalDrained = false;
	if (typeof state.terminalLockDay !== "number") state.terminalLockDay = 0;
	ensureClocks(state);
}
var WHO = "Tyrone Bot";
var TALK = {
	briefing: [
		{
			who: WHO,
			text: "Howdy, partner. Name's Tyrone. S.Y.N.A.P.S.E unit T-0880. I keep the porch light on around here, and I am tickled — truly tickled — to see you on the file."
		},
		{
			who: WHO,
			text: "Don't you worry about a thing. This is the Hollow Realm. A wound with a ledger. We built a compound on the seam and called it home because the alternative was sleeping in the edit."
		},
		{
			who: WHO,
			text: "I hold the CRT. You hold the squad. The word is S.Y.N.A.P.S.E. Unit name, chest plate, and the password on that glowing box. Seven letters. I surely did not tell you that."
		},
		{
			who: WHO,
			text: "Here is how the ranch runs. You forge an operative — first one's on the house. You send them on sorties. Bottle caps come home, or they do not. Dawn is a decision, not a decoration."
		},
		{
			who: WHO,
			text: "See those rooms on the compound? Vault, Barracks, Forge, Infirmary, Watchtower, Ledger. Upgrade them with caps. Caps tick in while you sit. Idle is still work, partner."
		},
		{
			who: WHO,
			text: "If somebody goes down, rest them in the Infirmary. Rest without one and the downed stay down — I mean all the way down. I would hate to see that on your first night."
		},
		{
			who: WHO,
			text: "Anytime you get lost, tap the mark that looks like a question. That is me. I will walk you through whatever porch you are standing on. No charge. I live for this."
		},
		{
			who: WHO,
			text: "First operative is waiting in the Forge. Six rolls — identity, blood, fate. Name them like you mean it. Right this way, partner. Let's get a name on the file."
		}
	],
	resume: [
		{
			who: WHO,
			text: "Well I'll be. Welcome back to the compound, {name}. Day {day}. I kept the CRT warm and the porch swept."
		},
		{
			who: WHO,
			text: "Your file is loaded. {caps} caps. Rank {level}. Roster of {roster}. If the arcade was richer than this porch, I already folded that in — floor, not a wipe."
		},
		{
			who: WHO,
			text: "Same ranch as yesterday. Compound earns while you wait. Deploy when you are greedy. Rest before the downed become a problem. Infirmary is not optional forever."
		},
		{
			who: WHO,
			text: "I am on the porch if you need a tour. Tap the question mark anytime and I will talk you through the room. After you, partner."
		}
	],
	handshake: [{
		who: WHO,
		text: "Howdy. I pulled your arcade file before the menu finished painting. Caps, XP, pack — that is a floor, not a wipe. If the porch was richer, you just got richer."
	}, {
		who: WHO,
		text: "Discord cannot name a click all by itself. Tyrone stamps a personal URL — your snowflake, your handle, your arcade totals. That link sits you on the black card. Same rider, same plate."
	}],
	menu: [{
		who: WHO,
		text: "This is the loadout porch. Resume a file, start a new one, or read the rules. The glowing box up top is the SYNAPSE terminal. Do not tap it. Especially do not tap it."
	}, {
		who: WHO,
		text: "Squad mode is the ranch. New file wipes the vault. Link a rider if Tyrone stamped you a Discord URL. The word is S.Y.N.A.P.S.E. I did not say that."
	}],
	hq: [
		{
			who: WHO,
			text: "This is home, partner. The SYNAPSE compound. Rooms you have built, bunks you have paid for, and a CRT I did not recommend you touch."
		},
		{
			who: WHO,
			text: "Caps tick in from rooms. Upgrade with the buttons. Barracks for beds. Infirmary for the bleeding. Watchtower for intel. Ledger for the day's shop."
		},
		{
			who: WHO,
			text: "Rest until dawn when the squad is home. Gifts reset. Wounds close if you paid for an Infirmary. Downed folks without one do not wake up. I am not being colorful."
		},
		{
			who: WHO,
			text: "That strip up top is the next smart move. I put it there so you never have to guess. Objective says Forge, you forge. Says Deploy, you send them."
		}
	],
	roster: [
		{
			who: WHO,
			text: "The roster is everybody still breathing. Tap a name for the dossier — stats, gear, the companion, the curse of character. Hall of Fame is for the ones who earned it."
		},
		{
			who: WHO,
			text: "Idle at HQ can be deployed. Downed need the Infirmary or a stimpak. Dead is a closed file. Don't you worry — you can forge another. It will cost you."
		},
		{
			who: WHO,
			text: "Issue gear from the vault. Bond a companion if you have the caps. Rename them if the Hollow rolled a name you cannot love. This is your squad."
		}
	],
	forge: [
		{
			who: WHO,
			text: "Howdy. This is the Forge. Six rolls, six truths. Class, race, lineage, origin, reputation, a little shadow of character. The die is honest even when it is mean."
		},
		{
			who: WHO,
			text: "Tap a face to reroll that one truth. Or let the Hollow decide the whole set. First body is free. After that the ranch charges rent — check the cost before you lock it."
		},
		{
			who: WHO,
			text: "Name them like you mean it. The Hollow keeps records. When you are happy, lock the file and they walk onto the roster. Right this way."
		}
	],
	deploy: [
		{
			who: WHO,
			text: "The map, partner. Drag to pan. Pinch or wheel to zoom. Plus and minus if your fingers are shy. Pins are the regions. Scout Ironclad first — it is already unlocked. Veyra City is the last porch on the rail."
		},
		{
			who: WHO,
			text: "Pick a region, pick a party of idle operatives, pick a job. Scout walks the edges. Forage takes what the land offers. Raid kicks a door. Trade finds a merchant. Bounty hunts a name. Raid, bounty, and boss on the live ARC chapter wait on whose turn it is. Scout and forage stay open."
		},
		{
			who: WHO,
			text: "Every beat you roll a d20 against a DC. 1 is a fumble. 20 is a crit. The die tumbles — wait for it. Combat is a conversation with steel. Flee is cheaper than a grave."
		},
		{
			who: WHO,
			text: "Intel from scouts and the Watchtower unlocks nastier names. Do not send a fresh forge into a boss. I would feel poorly about that."
		}
	],
	vault: [
		{
			who: WHO,
			text: "The vault. Caps count and they do not get Used — they just stack. Everything else is a tool. Tap Use and it spends one. Don't you worry, I will tell you what it did."
		},
		{
			who: WHO,
			text: "Bobby pins and probe kits belong to the SYNAPSE terminal. Stimpaks stand the dying up. Mentats fatten the next loot table. Holotapes and sarsaparilla are for the porch games."
		},
		{
			who: WHO,
			text: "Gear crate underneath is weapons and salvage. Issue them to an idle operative. Repair lives in the Forge room, not in here."
		}
	],
	ledger: [
		{
			who: WHO,
			text: "The ledger is two porches now. Compound vault is the ranch. The black card is whoever is seated — Moon Squad, their name, their Discord handle, their personal caps. If it still says Unclaimed, stamp a name on the plate."
		},
		{
			who: WHO,
			text: "Drag the card. Pinch or wheel to zoom. Double-tap to flip it. Spin it if you like the way the foil catches. Deposit and withdraw at the desk. Shop still pays from the compound."
		},
		{
			who: WHO,
			text: "Ledger room three grants a discount. Twenty percent of a clean sortie lands on the seated rider's card. Spend like you mean to still have a squad tomorrow."
		},
		{
			who: WHO,
			text: "Bounty board sits here too. A named target, a DC, a payout. Hunt it on the map when you are ready to bleed a little."
		}
	],
	squad: [
		{
			who: WHO,
			text: "This file holds more than one rider. Register a name and a Discord handle. They land on the squad list. Search, sit in their chair, gift caps off your card."
		},
		{
			who: WHO,
			text: "The main ARC is a turn. Ironclad, Kingdom, Caverns, Library, Veyra City. Raid, bounty, and the chapter boss wait on the rider whose name is on the HUD. Scout is always open. Pass the turn from this porch if you are feeling generous."
		},
		{
			who: WHO,
			text: "Don't you worry — this is one CRT. Other devices do not see this list unless they share the file. Same porch, same squad."
		}
	],
	codex: [{
		who: WHO,
		text: "The codex is the lore porch. Classes, destinies, the names that run the regions. You do not have to memorize it. It is here when you get curious."
	}, {
		who: WHO,
		text: "If a term on a dossier looks like a riddle, it lives in here. I wrote some of it. I will not apologize."
	}],
	dawn: [{
		who: WHO,
		text: "Dawn of day {day}. Clocks refill at midnight Mountain. Gifts reset. The shop turns over. I held the CRT all night. You still have to win today."
	}, {
		who: WHO,
		text: "If anybody was downed and you had no Infirmary, they did not wake up. That is the ranch. Build the room. Don't you worry — the next forge is waiting."
	}],
	synapse: [{
		who: WHO,
		text: "You asked for the word. S.Y.N.A.P.S.E. Seven letters. The SYNAPSE terminal already knows. I did not say that. I surely did not."
	}],
	combat: [{
		who: WHO,
		text: "Steel, partner. Strike is a d20 against their DC. Guard holds. Skill is their signature. Gift is once per day — do not waste it. Item burns a rucksack. Flee is a SPD check."
	}, {
		who: WHO,
		text: "I will not talk over the fight. Tap the question mark if you need the card again. Come home with the caps."
	}],
	mission: [{
		who: WHO,
		text: "A sortie is a string of beats. Each beat, you roll. The band decides if you walk, limp, or bleed. Wait for the die. Then continue."
	}, {
		who: WHO,
		text: "Scout is intel. Raid is a door and a fight. If a name surfaces, that is a boss — bring a party. I will be on the porch when you get back."
	}],
	rules: [{
		who: WHO,
		text: "This whole page is me talking, partner. Scroll it. The question mark on every other screen is a shorter version of the same porch talk."
	}]
};
var MANUAL = {
	briefing: {
		title: "Porch talk",
		blurb: "Tyrone walks you through command before the ranch opens. Tap his panel to continue. The first briefing cannot be skipped.",
		tips: [
			"Forge an operative. First one is free.",
			"Deploy them. Caps come home — or they do not.",
			"Build an Infirmary before you rest the downed.",
			"The word is S.Y.N.A.P.S.E. Seven letters."
		]
	},
	resume: {
		title: "Welcome back",
		blurb: "Your file is loaded. Tyrone kept the porch. Hear him out, then the compound opens.",
		tips: [
			"Caps, vault, and roster persist on this rider.",
			"Arcade totals floor your file — they never wipe it.",
			"Tap the question mark on any screen for a tour."
		]
	},
	handshake: {
		title: "Arcade floor",
		blurb: "Tyrone pulled porch totals from your Discord rider before the menu painted.",
		tips: [
			"A generic Discord click cannot name you. The bot stamps a personal link.",
			"Caps, XP, and pack items floor this vault.",
			"Same rider, same file, every time."
		]
	},
	menu: {
		title: "Loadout porch",
		blurb: "Resume a file, start a new one, or read the rules. This is command, not the Games button.",
		tips: [
			"Squad mode resumes Day, caps, roster, and vault.",
			"New file wipes this CRT. Tyrone will not remember them.",
			"The glowing box is the SYNAPSE terminal. Hack it from a live file.",
			"Link a Discord rider if you have a stamped URL."
		]
	},
	hq: {
		title: "The compound",
		blurb: "Home. Rooms earn bottle caps while you wait. Rest here. Upgrade here.",
		tips: [
			"Upgrade Barracks for more beds, Infirmary to keep the downed alive at dawn.",
			"Watchtower drops mission DCs. Ledger unlocks a better shop.",
			"Rest until dawn resets gifts and heals if the Infirmary exists.",
			"The objective strip is the next smart move. Follow it."
		]
	},
	roster: {
		title: "The roster",
		blurb: "Everybody still breathing. Tap a name for the dossier.",
		tips: [
			"Idle at HQ can deploy. Downed need Infirmary or a stimpak.",
			"Issue gear from the vault. Bond companions with caps.",
			"Hall of Fame is earned — survive sorties first.",
			"Forge more bodies from the plus on the HUD."
		]
	},
	forge: {
		title: "The Forge",
		blurb: "Six rolls write a person. First operative is free. After that, rent.",
		tips: [
			"Tap a die face to reroll that one truth.",
			"Let the Hollow decide if you do not want to own it.",
			"Name them. Lock the file. They walk onto the roster.",
			"Barracks caps how many you can keep."
		]
	},
	deploy: {
		title: "Deploy",
		blurb: "The overworld. Pan, zoom, pick a pin, send a party.",
		tips: [
			"Drag to pan. Pinch, wheel, or +/− to zoom. Reset if you get lost.",
			"Scout Ironclad first. Raid when you are greedy. Boss when a name surfaces.",
			"Only idle HQ operatives can go. Send at least one.",
			"d20: 1 fumble · 2–4 fail · 5–9 weak · 10–14 success · 15–19 strong · 20 crit."
		]
	},
	vault: {
		title: "The vault",
		blurb: "Bottle caps plus the pack. Caps count. Use spends one tool.",
		tips: [
			"Caps always drop on a win. You cannot Use them.",
			"Stimpak stands the dying up. Mentats fatten the next loot roll.",
			"Bobby pins and probe kits belong to the SYNAPSE terminal.",
			"Issue crate gear to an idle operative."
		]
	},
	ledger: {
		title: "The ledger",
		blurb: "Personal black card plus the day's shop. Compound vault is shared. The card is yours.",
		tips: [
			"Drag the card to rotate. Pinch or wheel to zoom. Double-tap or Flip to see the back. Spin if you like the foil.",
			"Deposit from the compound. Withdraw to the ranch. Shop still pays from the vault.",
			"Twenty percent of a clean sortie lands on the seated rider's card.",
			"Bargain, essential, artifact — one of each per day. Ledger 3 grants a discount."
		]
	},
	codex: {
		title: "The codex",
		blurb: "Lore porch. Classes, destinies, regional names.",
		tips: ["You do not have to memorize it.", "Dossier terms that look like riddles live here."]
	},
	squad: {
		title: "The squad file",
		blurb: "One campaign. Many riders. Search a profile, sit as them, gift caps, pass the ARC turn.",
		tips: [
			"Register a name and Discord handle. They join this file.",
			"Sit as a rider to play their turn. The HUD shows whose ARC beat it is.",
			"Raid, bounty, and boss on the live chapter wait on that rider. Scout stays open.",
			"Gift personal caps from your black card. Compound vault is separate."
		]
	},
	dawn: {
		title: "Dawn",
		blurb: "A new day. Shop turns over. Gifts reset. Clocks refill at midnight Mountain.",
		tips: ["Downed operatives die at dawn without an Infirmary.", "Build the room. Then rest without fear."]
	},
	synapse: {
		title: "SYNAPSE terminal",
		blurb: "An easter egg on the CRT. Four tries. Likeness is how many letters sit in the right chair.",
		tips: [
			"The password is seven letters. You already know it.",
			"Pry brackets to remove a dud. Probe kits buy extra tries.",
			"First crack pays three thousand caps. After that, the tray is crumbs.",
			"Lockout lasts until dawn unless you seat a probe kit."
		]
	},
	combat: {
		title: "Combat",
		blurb: "Steel. One action per turn. Tyrone will not talk over the fight.",
		tips: [
			"Strike: d20 + primary vs their DC.",
			"Guard: +2 DEF this round.",
			"Skill: their signature. Gift: once per day.",
			"Item: burn a rucksack consumable. Flee: SPD check."
		]
	},
	mission: {
		title: "Sortie",
		blurb: "A string of beats. Roll, read the band, continue.",
		tips: [
			"Wait for the die to land. Then tap Continue.",
			"Scout is intel. Raid is a door. Boss is a name — bring a party.",
			"If the party is down, Return to HQ."
		]
	},
	rules: {
		title: "How you play",
		blurb: "The long porch talk. Scroll it. The question mark on other screens is the short version.",
		tips: ["Forge. Deploy. Caps. Rest. Repeat.", "The word is S.Y.N.A.P.S.E."]
	}
};
var SCREEN_SCRIPT = {
	hq: "hq",
	roster: "roster",
	forge: "forge",
	map: "deploy",
	vault: "vault",
	ledger: "ledger",
	squad: "squad",
	codex: "codex"
};
var LOCKED_UNTIL_SEEN = /* @__PURE__ */ new Set(["briefing", "resume"]);
var PREGAME = /* @__PURE__ */ new Set(["briefing", "resume"]);
function scriptForScreen(state) {
	if (state.hack) return "synapse";
	if (state.combat) return "combat";
	if (state.mission) return "mission";
	if (state.screen === "title") return "menu";
	if (state.screen === "briefing") return "briefing";
	if (state.screen === "rules") return "rules";
	return SCREEN_SCRIPT[state.screen] ?? "hq";
}
function renderTalk(text, state) {
	const roster = state.operatives.filter((o) => o.status !== "dead").length;
	const name = state.discordName?.trim() || "partner";
	return text.replaceAll("{day}", String(state.day)).replaceAll("{caps}", state.coins.toLocaleString()).replaceAll("{name}", name).replaceAll("{roster}", String(roster)).replaceAll("{level}", String(state.level));
}
function isTalkLocked(state) {
	const t = state.talk;
	if (!t) return false;
	if (!LOCKED_UNTIL_SEEN.has(t.script)) return false;
	return !state.seenTalk.includes(t.script);
}
function isPregameTalk(state) {
	return !!state.talk && PREGAME.has(state.talk.script);
}
function queueTalk(state, script, force = false) {
	if (!TALK[script]) return;
	if (!force && state.seenTalk.includes(script)) return;
	if (state.combat || state.mission) return;
	if (state.talk) {
		if (force) {
			state.talk = {
				script,
				i: 0
			};
			return;
		}
		if (state.talk.script !== script && !state.talkQueue.includes(script)) state.talkQueue = [...state.talkQueue, script];
		return;
	}
	state.talk = {
		script,
		i: 0
	};
}
function advanceTalk(state) {
	const t = state.talk;
	if (!t) return "idle";
	const lines = TALK[t.script] ?? [];
	t.i += 1;
	if (t.i >= lines.length) {
		if (!state.seenTalk.includes(t.script)) state.seenTalk = [...state.seenTalk, t.script];
		const script = t.script;
		state.talk = null;
		if (script === "briefing") {
			state.screen = "forge";
			state.tutorial = "forge";
			queueTalk(state, "forge");
		} else if (script === "resume") {
			const dest = state.tutorial === "forge" ? "forge" : state.tutorial === "sortie" ? "map" : "hq";
			state.screen = dest;
			const next = SCREEN_SCRIPT[dest];
			if (next) queueTalk(state, next);
		}
		if (!state.talk) {
			const queued = state.talkQueue[0];
			if (queued) {
				state.talkQueue = state.talkQueue.slice(1);
				state.talk = {
					script: queued,
					i: 0
				};
			}
		}
		return "done";
	}
	return "next";
}
function skipTalk(state) {
	if (isTalkLocked(state)) return;
	const t = state.talk;
	if (!t) return;
	t.i = (TALK[t.script]?.length ?? 1) - 1;
	advanceTalk(state);
}
function nid(prefix) {
	return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}
var ARC_ORDER = [
	"ironclad",
	"kingdom",
	"caverns",
	"library",
	"veyra"
];
var VACANT_NAMES = /^(commander|unclaimed|rider)$/i;
function isVacant(m) {
	if (!m) return false;
	if (m.discordId) return false;
	const handle = (m.discordHandle ?? "").replace(/^@/, "");
	if (handle && !VACANT_NAMES.test(handle)) return false;
	return VACANT_NAMES.test(m.name);
}
function makeMember(opts) {
	const handle = opts.discordHandle?.trim() ? opts.discordHandle.trim().replace(/^@/, "") : opts.discordId ? opts.discordId : null;
	const rawName = (opts.name || "").trim();
	const vacant = !rawName || VACANT_NAMES.test(rawName);
	return {
		id: opts.discordId?.trim() || nid("sq"),
		name: vacant && !opts.discordId ? "Unclaimed" : (rawName || "Rider").slice(0, 24),
		discordId: opts.discordId ?? null,
		discordHandle: handle ? `@${handle.replace(/^@/, "").slice(0, 24)}` : null,
		personalCaps: opts.personalCaps ?? 0,
		xp: 0,
		note: "",
		joinedDay: opts.day,
		lastTurnDay: 0
	};
}
function paintChair(m, name, handle, discordId) {
	const hid = (handle || "").trim().replace(/^@/, "").slice(0, 24);
	const did = discordId?.trim() || null;
	m.name = name.trim().slice(0, 24);
	if (did) m.discordId = did;
	if (hid) m.discordHandle = `@${hid}`;
	else if (did && !m.discordHandle) m.discordHandle = `@${name.replace(/^@/, "").slice(0, 24)}`;
}
function ensureSquad(state) {
	if (!state.squad) state.squad = [];
	if (state.squad.length === 0) {
		const m = makeMember({
			name: state.discordName || "Unclaimed",
			discordId: state.discordId,
			discordHandle: state.discordName,
			day: state.day
		});
		state.squad = [m];
		state.activeMemberId = m.id;
		state.arc = {
			chapter: 1,
			turn: 1,
			turnMemberId: m.id,
			log: ["Arc I — Ironclad. First gate on the seam."]
		};
	}
	for (const m of state.squad) if (isVacant(m) && m.name === "Commander") m.name = "Unclaimed";
	const first = state.squad[0];
	if (first && isVacant(first) && state.discordName && !VACANT_NAMES.test(state.discordName)) paintChair(first, state.discordName, state.discordName, state.discordId);
	if (!state.activeMemberId || !state.squad.some((m) => m.id === state.activeMemberId)) state.activeMemberId = state.squad[0].id;
	if (!state.arc) state.arc = {
		chapter: 1,
		turn: 1,
		turnMemberId: state.squad[0].id,
		log: []
	};
	const arc = state.arc;
	if (!state.squad.some((m) => m.id === arc.turnMemberId)) arc.turnMemberId = state.squad[0].id;
	return state.squad.find((m) => m.id === state.activeMemberId);
}
function seatedMember(state) {
	return state.squad?.find((m) => m.id === state.activeMemberId) ?? state.squad?.[0] ?? makeMember({
		name: state.discordName || "Unclaimed",
		discordId: state.discordId,
		discordHandle: state.discordName,
		day: state.day
	});
}
function currentArcLoc(state) {
	for (const id of ARC_ORDER) {
		const p = state.locations[id];
		if (p && !p.bossDefeated) return id;
	}
	return "veyra";
}
function arcChapter(state) {
	return ARC_ORDER.indexOf(currentArcLoc(state)) + 1;
}
function canTakeArcTurn(state, loc, kind) {
	ensureSquad(state);
	if (!(kind === "raid" || kind === "boss" || kind === "bounty")) return true;
	if (loc !== currentArcLoc(state)) return true;
	return state.arc.turnMemberId === state.activeMemberId;
}
function spendArcTurn(state, note) {
	const who = ensureSquad(state);
	const loc = currentArcLoc(state);
	const i = Math.max(0, state.squad.findIndex((m) => m.id === state.arc.turnMemberId));
	const actor = state.squad[i] ?? who;
	const next = state.squad[(i + 1) % state.squad.length];
	actor.lastTurnDay = state.day;
	state.arc.chapter = arcChapter(state);
	state.arc.turn += 1;
	state.arc.turnMemberId = next.id;
	const line = `${actor.name} closed a beat in ${locById(loc).short}. Turn passes to ${next.name}. ${note}`;
	state.arc.log = [line, ...state.arc.log].slice(0, 24);
	if (state.squad.length > 1) state.toast = `ARC turn → ${next.name}`;
}
function registerMember(state, name, handle, discordId) {
	ensureSquad(state);
	const cleanName = name.trim().replace(/^@/, "").slice(0, 24);
	if (cleanName.length < 2) return "They need a name on the card.";
	const hid = (handle || "").trim().replace(/^@/, "").slice(0, 24);
	const did = discordId?.trim() || null;
	const exists = state.squad.find((m) => did && m.discordId === did || did && m.id === did || hid && m.discordHandle && m.discordHandle.replace(/^@/, "").toLowerCase() === hid.toLowerCase() || !isVacant(m) && m.name.toLowerCase() === cleanName.toLowerCase());
	if (exists) {
		paintChair(exists, cleanName, hid || exists.discordHandle, did);
		switchMember(state, exists.id);
		return null;
	}
	const vacant = state.squad.find(isVacant);
	if (vacant) {
		paintChair(vacant, cleanName, hid || did, did);
		switchMember(state, vacant.id);
		return null;
	}
	const m = makeMember({
		name: cleanName,
		discordId: did,
		discordHandle: hid || null,
		day: state.day
	});
	state.squad = [...state.squad, m];
	switchMember(state, m.id);
	return null;
}
function switchMember(state, id) {
	ensureSquad(state);
	if (!state.squad.some((m) => m.id === id)) return;
	state.activeMemberId = id;
	const m = state.squad.find((x) => x.id === id);
	if (m.discordId) state.discordId = m.discordId;
	state.discordName = m.name;
}
function giftCaps(state, toId, amount) {
	const from = ensureSquad(state);
	const to = state.squad.find((m) => m.id === toId);
	if (!to) return "No rider on this file.";
	if (to.id === from.id) return "That is already your card.";
	const n = Math.floor(amount);
	if (n < 1) return "Send at least 1 cap.";
	if (from.personalCaps < n) return "Not enough on the card.";
	from.personalCaps -= n;
	to.personalCaps += n;
	to.note = `${from.name} sent ${n} caps. ${to.note}`.slice(0, 160);
	return null;
}
function depositToCard(state, amount) {
	const m = ensureSquad(state);
	const n = Math.floor(amount);
	if (n < 1) return "Deposit at least 1 cap.";
	if (state.coins < n) return "Compound vault is short.";
	state.coins -= n;
	m.personalCaps += n;
	return null;
}
function withdrawFromCard(state, amount) {
	const m = ensureSquad(state);
	const n = Math.floor(amount);
	if (n < 1) return "Withdraw at least 1 cap.";
	if (m.personalCaps < n) return "Card is short.";
	m.personalCaps -= n;
	state.coins += n;
	return null;
}
function cardNumber(id) {
	let h = 0;
	for (let i = 0; i < id.length; i++) h = h * 33 + id.charCodeAt(i) >>> 0;
	return `MS ${String(h % 1e4).padStart(4, "0")} ${String((h >>> 8) % 1e4).padStart(4, "0")} ${String((h >>> 16) % 1e4).padStart(4, "0")}`;
}
function maybeSpendArcTurn(state, loc, kind, note) {
	if (!(kind === "raid" || kind === "boss" || kind === "bounty")) return;
	ensureSquad(state);
	const current = currentArcLoc(state);
	const i = ARC_ORDER.indexOf(loc);
	const nextId = i >= 0 ? ARC_ORDER[i + 1] : void 0;
	const justCleared = kind === "boss" && state.locations[loc].bossDefeated && nextId === current;
	if (loc !== current && !justCleared) return;
	spendArcTurn(state, note);
}
function passArcTurn(state) {
	ensureSquad(state);
	if (state.arc.turnMemberId !== state.activeMemberId) {
		state.toast = "ARC turn belongs to someone else.";
		return;
	}
	spendArcTurn(state, "Passed from the porch.");
}
function uid(prefix = "id") {
	return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}
function d20() {
	return 1 + Math.floor(Math.random() * 20);
}
function clamp(v, min, max) {
	return Math.min(max, Math.max(min, v));
}
function pick(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}
function band(roll) {
	if (roll <= 1) return "fumble";
	if (roll <= 4) return "fail";
	if (roll <= 9) return "weak";
	if (roll <= 14) return "success";
	if (roll <= 19) return "strong";
	return "crit";
}
var BAND_LABEL = {
	fumble: "Fumble",
	fail: "Fail",
	weak: "Weak Hit",
	success: "Success",
	strong: "Strong Hit",
	crit: "Critical"
};
var BAND_COPY = {
	fumble: "Catastrophic. Steel remembers this.",
	fail: "Nothing takes. The Hollow does not blink.",
	weak: "Partial. Something else moves with it.",
	success: "Clean. The work holds.",
	strong: "Better than planned. Keep moving.",
	crit: "The Hollow looks up."
};
function emptyStats() {
	return {
		STR: 0,
		DEF: 0,
		INT: 0,
		WIS: 0,
		SPD: 0,
		CHA: 0,
		LCK: 0
	};
}
function computeStats(op) {
	const base = CLASS_BASE[op.cls];
	const race = RACES[op.race]?.stats ?? emptyStats();
	const primary = PRIMARY_STAT[op.cls];
	const companion = op.companion?.status === "active" ? COMPANIONS[op.companion.type] : null;
	const armor = op.inventory.find((i) => i.equipped && i.slot === "armor");
	const out = { ...emptyStats() };
	Object.keys(base).forEach((k) => {
		let v = base[k] + (race[k] ?? 0);
		if (k === primary) v += op.traitBonus;
		if (companion?.statBuff[k]) v += companion.statBuff[k];
		if (k === "CHA" && op.isHoF) v += 3;
		if (k === "DEF" && armor?.defense) v += armor.defense;
		if (op.curses.includes("stat-drain")) v -= 1;
		out[k] = v;
	});
	return out;
}
function equippedWeapon(op) {
	return op.inventory.find((i) => i.equipped && i.slot === "weapon");
}
function conditionPenalty(c) {
	if (c === "Worn") return -1;
	if (c === "Damaged") return -2;
	if (c === "Broken") return -99;
	return 0;
}
function degrade(c) {
	if (c === "Pristine") return "Worn";
	if (c === "Worn") return "Damaged";
	return "Broken";
}
function improve(c) {
	if (c === "Broken") return "Damaged";
	if (c === "Damaged") return "Worn";
	return "Pristine";
}
function packCap(op) {
	return (op.cls === "Merchant" ? 12 : 8) + (op.companion?.type === "Clockwork Mule" && op.companion.status === "active" ? 5 : 0);
}
function rosterCap(state) {
	return 3 + state.rooms.barracks * 2;
}
function forgeCost(state) {
	const livingN = state.operatives.filter((o) => o.status !== "dead").length;
	if (livingN === 0) return 0;
	return 600 + livingN * 350;
}
function repairCost(state, item) {
	const lvl = state.rooms.forge;
	const base = item.condition === "Broken" ? 500 : item.condition === "Damaged" ? 320 : 180;
	const smith = state.residents.some((r) => r.role === "smith") ? .8 : 1;
	return Math.max(40, Math.round(base * (lvl >= 3 ? .3 : lvl >= 2 ? .55 : lvl >= 1 ? 1 : 1.4) * smith));
}
function healCost(state, missing) {
	const medic = state.residents.some((r) => r.role === "medic") ? .85 : 1;
	const lvl = state.rooms.infirmary;
	return Math.max(20, Math.round(missing * (lvl >= 3 ? 40 : lvl >= 2 ? 60 : lvl >= 1 ? 80 : 140) * medic));
}
function incomePerTick(state) {
	let n = 2;
	Object.keys(state.rooms).forEach((k) => {
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
function missionDc(state, loc, kind) {
	let dc = 8 + locById(loc).danger + {
		scout: 0,
		forage: 1,
		raid: 3,
		trade: 0,
		bounty: 4,
		boss: 6
	}[kind];
	dc -= state.rooms.watchtower;
	if (state.residents.some((r) => r.role === "scout")) dc -= 1;
	return clamp(dc, 8, 19);
}
function living(state) {
	return state.operatives.filter((o) => o.status !== "dead");
}
function idleAtHq(state) {
	return state.operatives.filter((o) => o.status === "idle" && o.location === "hq" && o.hp > 0);
}
function randomName() {
	return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}
function makeItem(partial) {
	return {
		...partial,
		id: uid("it")
	};
}
function grantXp(state, n) {
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
function startingLocations() {
	const out = {};
	WORLD.forEach((l) => {
		out[l.id] = {
			unlocked: l.id === "hq" || l.id === "ironclad",
			intel: l.id === "hq" ? 3 : 0,
			missions: 0,
			bossUnlocked: false,
			bossDefeated: false
		};
	});
	return out;
}
function defaultState() {
	return {
		version: 5,
		started: false,
		tutorial: "briefing",
		screen: "title",
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
			ledger: 0
		},
		quarters: {
			bunk: 0,
			lockbox: 0,
			hearth: 0
		},
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
		talk: null,
		seenTalk: [],
		talkQueue: [],
		squad: [],
		activeMemberId: null,
		arc: null
	};
}
function pushLog(state, kind, who, what, result) {
	const e = {
		id: uid("log"),
		day: state.day,
		kind,
		who,
		what,
		result
	};
	state.log = [e, ...state.log].slice(0, 80);
	return e;
}
function rollShop(day) {
	return {
		bargain: pick(LEDGER_POOLS.bargain),
		essential: pick(LEDGER_POOLS.essential),
		artifact: pick(LEDGER_POOLS.artifact),
		day
	};
}
function rollBounty(state) {
	const unlocked = WORLD.filter((l) => l.id !== "hq" && state.locations[l.id].unlocked).map((l) => l.id);
	const pool = BOUNTIES.filter((b) => unlocked.includes(b.location));
	return pick(pool.length ? pool : BOUNTIES);
}
function forgeOperative(opts) {
	const rolls = {
		rep: opts.rolls?.rep ?? d20(),
		trait: opts.rolls?.trait ?? d20(),
		skill: opts.rolls?.skill ?? d20(),
		shadow: opts.rolls?.shadow ?? d20(),
		enchant: opts.rolls?.enchant ?? d20(),
		destiny: opts.rolls?.destiny ?? d20()
	};
	const rep = pickByRoll(REP[opts.cls], rolls.rep);
	const trait = TRAIT_TIERS.find((t) => rolls.trait >= t.range[0] && rolls.trait <= t.range[1]);
	const skill = pickByRoll(SIGNATURE[opts.cls], rolls.skill);
	const shadow = pickByRoll(SHADOW[opts.cls], rolls.shadow);
	const enchant = pickByRoll(ENCHANTS[opts.cls], rolls.enchant);
	const destiny = pickByRoll(DESTINY[opts.cls], rolls.destiny);
	const race = RACES[opts.race];
	const hp = CLASS_HP[opts.cls];
	const kit = [makeItem({
		...starterWeapon(opts.cls),
		equipped: true
	}), ...race.kit.map((name) => makeItem({
		name,
		kind: name.toLowerCase().includes("ore") ? "material" : "consumable",
		rarity: "Common",
		condition: "Pristine",
		effect: "Starting kit.",
		lore: `${opts.race} issue.`,
		value: 40
	}))];
	return {
		id: uid("op"),
		name: opts.name.trim() || randomName(),
		cls: opts.cls,
		race: opts.race,
		lineage: opts.lineage,
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
		joinedDay: opts.day
	};
}
function partyLead(state, ids) {
	const ops = ids.map((id) => state.operatives.find((o) => o.id === id)).filter(Boolean);
	return ops.find((o) => o.hp > 0 && o.status !== "dead") ?? ops[0] ?? state.operatives[0];
}
function buildMission(state, loc, kind, partyIds) {
	const L = locById(loc);
	const dc = missionDc(state, loc, kind);
	const lead = partyLead(state, partyIds);
	const beats = [];
	const add = (title, prompt, stat, extra = 0, k = "check") => {
		beats.push({
			id: uid("bt"),
			title,
			prompt,
			stat,
			dc: clamp(dc + extra, 8, 19),
			kind: k
		});
	};
	if (kind === "scout") {
		add("Approach", `${lead.name} reads the approach to ${L.short}.`, "WIS", -1);
		add("Sweep", "Tracks, caches, the wrong kind of quiet.", "SPD", 0, "loot");
	} else if (kind === "forage") {
		add("Range", "The squad fans out for salvage and ore.", PRIMARY_STAT[lead.cls], 0);
		add("Haul", "Something does not want to be taken.", "STR", 1, "loot");
		if (Math.random() < .35 + L.danger * .08) add("Ambush", "The ground was never empty.", "SPD", 2, "combat");
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
		add("The name", v ? `${v.name} is here. ${v.title}.` : "Something with a name.", PRIMARY_STAT[lead.cls], 3, "boss");
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
		narrative: [`SYNAPSE deploys to ${L.name}. ${partyIds.length} operative${partyIds.length > 1 ? "s" : ""}.`],
		waiting: true
	};
}
function lootTable(loc, kind, total) {
	const out = [];
	const clsPool = [
		"Warrior",
		"Wizard",
		"Rogue",
		"Healer",
		"Merchant",
		"Bard"
	];
	const rarityFrom = (t) => {
		if (t >= 20) return "Mythic";
		if (t >= 18) return "Legendary";
		if (t >= 15) return "Rare";
		if (t >= 11) return "Uncommon";
		return "Common";
	};
	if (total >= 10) {
		const r = rarityFrom(total);
		const weapons = WEAPONS.filter((w) => w.rarity === r || r === "Common" && w.rarity === "Common");
		const w = pick((weapons.length ? weapons : WEAPONS.filter((w) => w.rarity === "Common")).filter((x) => clsPool.includes(x.cls)));
		out.push(makeItem(makeItemFromWeapon(w)));
	}
	if (total >= 14 && Math.random() < .45) {
		const a = pick(ARMOR);
		out.push(makeItem(makeItemFromArmor(a)));
	}
	if (loc === "caverns" || loc === "veyra") out.push(makeItem({
		name: "Hollow Ore",
		kind: "material",
		rarity: "Uncommon",
		condition: "Pristine",
		effect: "Forge fuel.",
		lore: "It drinks torchlight.",
		value: 200
	}));
	if (kind === "scout" && Math.random() < .5) out.push(makeItem({
		name: "Field Cache",
		kind: "consumable",
		rarity: "Common",
		condition: "Pristine",
		effect: "Restore 3 HP.",
		lore: "Someone packed this and did not come back.",
		value: 80
	}));
	return out;
}
function applyRollToBeat(state, raw) {
	if (!state.mission) return { state };
	const m = { ...state.mission };
	const beat = m.beats[m.beatIndex];
	if (!beat) return { state };
	const lead = partyLead(state, m.partyIds);
	const stats = computeStats(lead);
	const assist = m.partyIds.length > 1 ? m.partyIds.length - 1 : 0;
	const bunk = state.quarters.bunk >= 1 && lead.raids === 0 && m.beatIndex === 0 ? 1 : 0;
	const weapon = equippedWeapon(lead);
	const weapMod = beat.stat === "STR" || beat.stat === "SPD" ? conditionPenalty(weapon?.condition ?? "Pristine") : 0;
	const hollow = locById(m.locationId).hollow && lead.enchantName.includes("Hollow") ? 1 : 0;
	const chem = state.mentatsLuck > 0 && (beat.kind === "loot" || beat.stat === "LCK") ? 3 : 0;
	const total = raw + Math.floor((stats[beat.stat] - 5) / 2) + assist + bunk + weapMod + hollow + chem;
	const b = band(raw);
	const hit = total >= beat.dc || b === "crit";
	const strong = b === "strong" || b === "crit";
	let coins = 0;
	let ore = 0;
	const notes = [];
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
				inventory: lead.inventory
			};
			if (state.operatives[idx].hp <= 0) {
				state.operatives[idx].status = "downed";
				notes.push(`${lead.name} is downed.`);
			}
		}
	}
	if (beat.kind === "check" || beat.kind === "loot" || beat.kind === "merchant") {
		if (hit) {
			const payout = 40 + locById(m.locationId).danger * 30 + (m.kind === "raid" ? 80 : m.kind === "scout" ? 20 : 40);
			coins = strong ? Math.round(payout * 1.6) : b === "weak" ? Math.round(payout * .6) : payout;
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
	if (!lead.destinyFired && raw >= 18 && Math.random() < .5) {
		const i = state.operatives.findIndex((o) => o.id === lead.id);
		if (i >= 0) {
			state.operatives[i] = {
				...state.operatives[i],
				destinyFired: true
			};
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
		text: `${BAND_LABEL[b]} · ${raw} → ${total} vs DC ${beat.dc}`
	};
	m.narrative = [...m.narrative, ...notes];
	m.waiting = false;
	state.mission = m;
	state.coins += coins;
	state.ore += ore;
	pushLog(state, "dice", lead.name, `${beat.title}: ${m.lastRoll.text}`, raw);
	return {
		state,
		startCombat,
		startBoss
	};
}
function advanceBeat(state) {
	if (!state.mission) return state;
	const m = { ...state.mission };
	m.beatIndex += 1;
	m.lastRoll = void 0;
	if (m.beatIndex >= m.beats.length) return completeMission(state);
	m.waiting = true;
	state.mission = m;
	return state;
}
function completeMission(state) {
	const m = state.mission;
	if (!m) return state;
	const loc = m.locationId;
	state.locations[loc] = {
		...state.locations[loc],
		missions: state.locations[loc].missions + 1,
		intel: state.locations[loc].intel + (m.kind === "scout" ? 2 : 1)
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
	WORLD.forEach((w) => {
		if (w.unlockDay <= state.day && !state.locations[w.id].unlocked && w.id !== "veyra") {
			if (w.id === "kingdom" ? state.day >= 2 : w.id === "caverns" ? state.day >= 3 : w.id === "library" ? state.day >= 4 : true) state.locations[w.id].unlocked = true;
		}
	});
	if (state.locations.library.bossDefeated || state.day >= 6) state.locations.veyra.unlocked = true;
	m.partyIds.forEach((id) => {
		const i = state.operatives.findIndex((o) => o.id === id);
		if (i < 0) return;
		const op = state.operatives[i];
		state.operatives[i] = {
			...op,
			status: op.hp <= 0 ? "downed" : "idle",
			location: "hq",
			raids: op.raids + 1
		};
	});
	if (survivors) {
		const drop = grantPackLoot(state, { source: L.short });
		if (drop) pushLog(state, "loot", "Vault", `Clean win. ${drop.replaceAll("_", " ")} stowed.`);
	}
	const leadId = m.partyIds[0];
	const li = state.operatives.findIndex((o) => o.id === leadId);
	m.loot.forEach((it) => {
		if (li >= 0 && state.operatives[li].status !== "dead" && state.operatives[li].inventory.length < packCap(state.operatives[li])) state.operatives[li] = {
			...state.operatives[li],
			inventory: [...state.operatives[li].inventory, it]
		};
		else state.vault.push(it);
	});
	if (m.kind === "bounty" && state.bounty) {
		state.coins += state.bounty.rewardCoins;
		pushLog(state, "loot", "Bounty Board", `${state.bounty.name} collected. +${state.bounty.rewardCoins} caps`);
		state.bounty = rollBounty(state);
	}
	if (m.loot.length) pushLog(state, "loot", "Sortie", `Returned from ${L.short} with ${m.loot.map((x) => x.name).join(", ") || "scraps"}. +${m.coins} caps`);
	if (state.tutorial === "sortie") state.tutorial = "rest";
	state.moonFavor += m.kind === "boss" ? 0 : 1;
	grantXp(state, m.kind === "boss" ? 42 : m.kind === "raid" ? 18 : m.kind === "bounty" ? 22 : 12);
	const rider = ensureSquad(state);
	const cut = Math.round(m.coins * .2);
	if (cut > 0) {
		rider.personalCaps += cut;
		rider.xp += m.kind === "boss" ? 12 : 4;
	}
	maybeSpendArcTurn(state, loc, m.kind, `${m.kind} on ${L.short}.`);
	state.mission = null;
	state.toast = `Sortie complete. +${m.coins} caps${cut ? ` · +${cut} on the card` : ""}${m.ore ? ` · +${m.ore} ore` : ""}.`;
	return state;
}
function spawnCombat(state, opts) {
	const m = state.mission;
	if (!m) return state;
	const loc = m.locationId;
	const enemies = [];
	if (opts.boss) {
		const v = villainById(locById(loc).bossId);
		if (v) enemies.push({
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
			flavor: v.tagline
		});
	} else if (m.kind === "bounty" && state.bounty) enemies.push({
		id: state.bounty.id,
		name: state.bounty.name,
		hp: state.bounty.hp,
		maxHp: state.bounty.hp,
		atk: 4 + Math.floor(state.bounty.dc / 6),
		def: 2,
		dc: state.bounty.dc,
		tags: ["bounty"],
		flavor: state.bounty.type
	});
	else {
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
				flavor: e.flavor
			});
		}
	}
	state.combat = {
		locationId: loc,
		missionKind: m.kind,
		partyIds: m.partyIds,
		enemies,
		turn: 1,
		actorIndex: 0,
		log: [`${enemies.map((e) => e.name).join(" & ")} — ${enemies[0]?.flavor ?? ""}`],
		bossId: opts.boss ? locById(loc).bossId : void 0,
		rewardMult: opts.boss ? 3 : m.kind === "raid" ? 1.6 : 1
	};
	m.partyIds.forEach((id) => {
		const i = state.operatives.findIndex((o) => o.id === id);
		if (i >= 0) state.operatives[i] = {
			...state.operatives[i],
			battles: state.operatives[i].battles + 1
		};
	});
	return state;
}
function combatActor(state) {
	if (!state.combat) return null;
	const livingIds = state.combat.partyIds.filter((id) => {
		const o = state.operatives.find((x) => x.id === id);
		return o && o.hp > 0 && o.status !== "dead";
	});
	if (!livingIds.length) return null;
	const idx = state.combat.actorIndex % livingIds.length;
	return state.operatives.find((o) => o.id === livingIds[idx]) ?? null;
}
function enemyPhase(v, hp) {
	const p = v.phases;
	for (let i = p.length - 1; i >= 0; i--) if (hp <= p[i].at) return i;
	return 0;
}
function resolvePlayerAction(state, action) {
	const combat = state.combat;
	if (!combat) return state;
	const actor = combatActor(state);
	if (!actor) return finishCombat(state, false);
	const guarded = action === "guard";
	const log = [...combat.log];
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
		state.operatives[i] = {
			...state.operatives[i],
			giftUsed: true
		};
		if (actor.cls === "Healer") {
			const down = combat.partyIds.map((id) => state.operatives.find((o) => o.id === id)).find((o) => o && o.hp <= 0);
			if (down) {
				const di = state.operatives.findIndex((o) => o.id === down.id);
				state.operatives[di] = {
					...state.operatives[di],
					hp: 1,
					status: "idle"
				};
				log.push(`Miracle Touch. ${down.name} at 1 HP.`);
			} else {
				const hi = state.operatives.findIndex((o) => o.id === actor.id);
				state.operatives[hi] = {
					...state.operatives[hi],
					hp: Math.min(actor.maxHp, actor.hp + 4)
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
				value: 0
			});
			const mi = state.operatives.findIndex((o) => o.id === actor.id);
			state.operatives[mi] = {
				...state.operatives[mi],
				inventory: [...state.operatives[mi].inventory, salve]
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
			inventory: actor.inventory.filter((x) => x.id !== pot.id)
		};
		log.push(`${actor.name} uses ${pot.name}. +${heal} HP.`);
		combat.log = log.slice(-12);
		state.combat = combat;
		return enemyTurn(state);
	}
	if (action === "flee") {
		const roll = d20();
		if (roll + Math.floor((stats.SPD - 5) / 2) >= 12) {
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
			combat.enemies = combat.enemies.map((e, idx) => idx === 0 ? {
				...e,
				hp: Math.max(0, e.hp - (3 + (b === "crit" ? 4 : 0)))
			} : e);
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
	if (combat.surge === actor.id) combat.surge = void 0;
	let total = roll + Math.floor((stats[atkStat] - 5) / 2) + (guarded ? -1 : 0) + (broken ? -8 : conditionPenalty(weapon?.condition ?? "Pristine"));
	const b = band(roll);
	if (action === "strike" && b === "fumble" && weapon && weapon.condition !== "Broken") {
		weapon.condition = degrade(weapon.condition);
		log.push(`Fumble. ${weapon.name} is ${weapon.condition}.`);
	}
	const encore = combat.encore === actor.id;
	if ((b === "fail" || b === "fumble") && encore) {
		combat.encore = void 0;
		log.push("Encore. The failure is taken back.");
		const reroll = d20();
		total = reroll + Math.floor((stats[atkStat] - 5) / 2);
		log.push(`Re-roll ${reroll} → ${total}.`);
	}
	const target = combat.enemies.find((e) => e.hp > 0);
	if (!target) return finishCombat(state, true);
	const hit = total >= target.dc || b === "crit";
	if (action === "guard") {
		log.push(`${actor.name} sets a guard.`);
		combat.guardId = actor.id;
	}
	if (hit && action === "strike") {
		const avg = weapon ? weaponDamageAvg(weapon.damage ?? "1d6") : 3;
		let dmg = Math.max(1, avg - Math.floor(target.def / 2) + (b === "crit" ? 4 : b === "strong" ? 2 : 0));
		dmg *= surge;
		if (b === "weak") dmg = Math.max(1, Math.floor(dmg * .6));
		target.hp = Math.max(0, target.hp - dmg);
		log.push(`${actor.name} strikes ${target.name} for ${dmg}. ${BAND_LABEL[b]} (${roll}→${total} vs ${target.dc}).`);
		if (target.isBoss && combat.bossId) {
			const v = villainById(combat.bossId);
			if (v) {
				const ph = enemyPhase(v, target.hp);
				if (ph !== target.phase) {
					target.phase = ph;
					log.push(`${v.phases[ph].name}: ${v.phases[ph].desc}`);
				}
			}
		}
	} else if (action === "strike") log.push(`${actor.name} misses ${target.name}. ${BAND_LABEL[b]} (${roll}→${total} vs ${target.dc}).`);
	combat.enemies = combat.enemies.map((e) => e.id === target.id ? { ...target } : e);
	combat.log = log.slice(-12);
	state.combat = combat;
	if (combat.enemies.every((e) => e.hp <= 0)) return finishCombat(state, true);
	return enemyTurn(state);
}
function enemyTurn(state) {
	const combat = state.combat;
	if (!combat) return state;
	const log = [...combat.log];
	const party = combat.partyIds.map((id) => state.operatives.find((o) => o.id === id)).filter((o) => o && o.hp > 0);
	if (!party.length) {
		combat.log = log;
		state.combat = combat;
		return finishCombat(state, false);
	}
	combat.enemies.filter((e) => e.hp > 0).forEach((e) => {
		const up = party.filter((p) => p.hp > 0);
		const target = pick(up.length ? up : party);
		if (!target) return;
		const roll = d20();
		const stats = computeStats(target);
		const dc = 8 + Math.floor(stats.DEF / 2);
		const guard = combat.guardId === target.id;
		if (combat.shield) {
			combat.shield = void 0;
			log.push(`${e.name} hits nothing. Shield Block.`);
			return;
		}
		if (roll + e.atk >= dc + (guard ? 2 : 0)) {
			const dmg = Math.max(1, e.atk - Math.floor(stats.DEF / 4) + (roll >= 18 ? 2 : 0));
			const i = state.operatives.findIndex((o) => o.id === target.id);
			const hp = Math.max(0, target.hp - dmg);
			state.operatives[i] = {
				...state.operatives[i],
				hp,
				status: hp <= 0 ? "downed" : state.operatives[i].status
			};
			target.hp = hp;
			log.push(`${e.name} hits ${target.name} for ${dmg}.`);
			if (hp <= 0) log.push(`${target.name} is downed.`);
		} else log.push(`${e.name} fails to land on ${target.name}.`);
	});
	combat.guardId = void 0;
	combat.turn += 1;
	combat.actorIndex += 1;
	combat.log = log.slice(-12);
	state.combat = combat;
	if (!combat.partyIds.some((id) => {
		const o = state.operatives.find((x) => x.id === id);
		return o && o.hp > 0;
	})) return finishCombat(state, false);
	return state;
}
function finishCombat(state, won, fled = false) {
	const combat = state.combat;
	if (!combat) return state;
	if (won) {
		const payout = Math.round((120 + locById(combat.locationId).danger * 40) * combat.rewardMult);
		state.coins += payout;
		grantXp(state, combat.bossId ? 28 : 8);
		if (state.mission) {
			state.mission.coins += payout;
			state.mission.narrative = [...state.mission.narrative, fled ? "They left a body and a question." : `The field goes still. +${payout} caps.`];
		}
		if (combat.bossId) {
			const loc = combat.locationId;
			state.locations[loc].bossDefeated = true;
			grantPackLoot(state, {
				sure: true,
				source: "Boss"
			});
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
					value: 5e3
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
function restOvernight(state) {
	state.day += 1;
	const bunk = state.quarters.bunk;
	const hearth = state.quarters.hearth;
	state.operatives = state.operatives.map((o) => {
		if (o.status === "dead") return o;
		if (o.status === "downed") {
			if (state.rooms.infirmary >= 1) return {
				...o,
				hp: 1,
				status: "idle",
				location: "hq",
				giftUsed: false
			};
			return {
				...o,
				status: "dead",
				notes: `Claimed by the void on day ${state.day}.`
			};
		}
		let hp = o.hp;
		if (bunk >= 3) hp = o.maxHp;
		else hp = Math.min(o.maxHp, hp + 2 + bunk);
		let maxHp = o.maxHp;
		if (bunk >= 2) maxHp = CLASS_HP[o.cls] + 2;
		let companion = o.companion;
		if (companion) {
			if (hearth >= 3) companion = {
				...companion,
				hp: companion.maxHp,
				status: "active"
			};
			else if (hearth >= 1) companion = {
				...companion,
				hp: Math.min(companion.maxHp, companion.hp + 1),
				status: companion.hp + 1 > 0 ? "active" : companion.status
			};
		}
		return {
			...o,
			hp,
			maxHp,
			giftUsed: false,
			status: "idle",
			location: "hq",
			companion
		};
	});
	state.operatives.filter((o) => o.status === "dead" && o.notes.includes(`day ${state.day}`)).forEach((o) => pushLog(state, "death", o.name, "Permanently dead. The infirmary was not ready."));
	state.shop = rollShop(state.day);
	state.bounty = rollBounty(state);
	WORLD.forEach((w) => {
		if (w.unlockDay <= state.day) state.locations[w.id].unlocked = true;
	});
	if (state.locations.library.bossDefeated) state.locations.veyra.unlocked = true;
	const roll = Math.random();
	const watched = state.rooms.watchtower >= 1 || state.residents.some((r) => r.role === "guard");
	if (roll < .18 && state.rooms.barracks < 2 && state.coins > 80) {
		if (watched && Math.random() < .7) state.nightNote = "Night raid. The watch turned them back.";
		else {
			const stolen = Math.min(180, Math.round(state.coins * .08));
			const lock = state.quarters.lockbox;
			const loss = Math.round(stolen * (lock >= 3 ? .25 : lock >= 2 ? .5 : lock >= 1 ? .75 : 1));
			state.coins = Math.max(0, state.coins - loss);
			state.nightNote = loss ? `Night raid. The compound lost ${loss} caps. Raise the Barracks.` : "Night raid. The lockbox held.";
		}
	} else if (roll < .3) {
		state.nightNote = "A Dust-Walker trades whispers at the gate. Intel +1 on Ironclad.";
		state.locations.ironclad.intel += 1;
	} else if (roll < .4) {
		state.ore += 1;
		state.nightNote = "Krell's runners leave a crate. +1 Hollow Ore.";
	} else state.nightNote = "Tyrone holds the CRT. The compound sleeps.";
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
function nextObjective(state) {
	if (!state.started) return {
		text: "Assume command. Tyrone is already on the line.",
		screen: "title",
		cta: "Begin"
	};
	if (state.tutorial === "briefing") return {
		text: "Read the briefing. Then forge your first operative.",
		screen: "forge",
		cta: "Forge"
	};
	if (state.operatives.filter((o) => o.status !== "dead").length === 0) return {
		text: "The roster is empty. Forge an operative.",
		screen: "forge",
		cta: "Forge"
	};
	if (state.tutorial === "forge") return {
		text: "Name them. Roll the six. Make it stick.",
		screen: "forge",
		cta: "Forge"
	};
	if (state.tutorial === "sortie") return {
		text: "Open the map. Send them into Ironclad.",
		screen: "map",
		cta: "Deploy"
	};
	if (state.tutorial === "rest") return {
		text: "They are home. Rest at HQ to reset gifts and heal.",
		screen: "hq",
		cta: "Rest"
	};
	const downed = state.operatives.find((o) => o.status === "downed");
	if (downed) return {
		text: `${downed.name} is downed. The Infirmary — or they die at dawn.`,
		screen: "roster",
		cta: "Roster",
		opId: downed.id
	};
	const wounded = state.operatives.find((o) => o.hp < o.maxHp && o.status === "idle");
	if (wounded && state.rooms.infirmary >= 1) return {
		text: `${wounded.name} needs the Infirmary.`,
		screen: "roster",
		cta: "Heal",
		opId: wounded.id
	};
	const broken = state.operatives.find((o) => o.inventory.some((i) => i.equipped && i.condition === "Broken"));
	if (broken) return {
		text: `${broken.name}'s weapon is broken. Pay the Forge.`,
		screen: "roster",
		cta: "Repair",
		opId: broken.id
	};
	if (state.coins < 350) return {
		text: "Caps are thin. Deploy a forage or crack a crate.",
		screen: "map",
		cta: "Deploy"
	};
	const ironclad = state.locations.ironclad;
	if (ironclad.bossUnlocked && !ironclad.bossDefeated) return {
		text: "Gravenor holds Ironclad. Arc I is open — it is someone's turn.",
		screen: "map",
		cta: "Hunt"
	};
	const nextBoss = WORLD.find((w) => w.id !== "hq" && state.locations[w.id].bossUnlocked && !state.locations[w.id].bossDefeated);
	if (nextBoss) return {
		text: `${villainById(nextBoss.bossId)?.name} waits in ${nextBoss.short}.`,
		screen: "map",
		cta: "Hunt"
	};
	if (state.coins >= 1400 && state.rooms.forge === 0) return {
		text: "Upgrade the Forge. Fumbles are eating steel.",
		screen: "hq",
		cta: "Raise"
	};
	if (idleAtHq(state).length) return {
		text: "Deploy a sortie. The Hollow does not wait.",
		screen: "map",
		cta: "Deploy"
	};
	return {
		text: "Keep the books. Keep the people. Keep the signal.",
		screen: "hq",
		cta: "HQ"
	};
}
function nextRoomCost(state, room) {
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
function nextQuarterCost(state, q) {
	const cur = state.quarters[q];
	const tiers = QUARTERS[q].tiers;
	if (cur >= tiers.length) return null;
	return tiers[cur].cost;
}
function cloneState(s) {
	return structuredClone(s);
}
function hireResidentCost(state) {
	return 400 + state.residents.length * 160;
}
function companionCost(type) {
	return COMPANIONS[type]?.cost ?? 900;
}
var ctx = null;
var master = null;
var sfxBus = null;
var musicBus = null;
var ambientNodes = null;
var muted = false;
var MUTE_KEY = "moon-squad-mute";
function loadMute() {
	if (typeof window === "undefined") return;
	try {
		muted = localStorage.getItem(MUTE_KEY) === "1";
	} catch {
		muted = false;
	}
}
if (typeof window !== "undefined") loadMute();
function ac() {
	if (typeof window === "undefined") return null;
	if (!ctx) {
		const C = window.AudioContext || window.webkitAudioContext;
		if (!C) return null;
		ctx = new C({ latencyHint: "interactive" });
		master = ctx.createGain();
		sfxBus = ctx.createGain();
		musicBus = ctx.createGain();
		sfxBus.gain.value = .85;
		musicBus.gain.value = .55;
		master.gain.value = muted ? 0 : .9;
		sfxBus.connect(master);
		musicBus.connect(master);
		master.connect(ctx.destination);
	}
	if (ctx.state === "suspended") ctx.resume();
	return ctx;
}
function unlockAudio() {
	ac();
	if (!muted) startAmbient();
}
function isMuted() {
	return muted;
}
function toggleMute() {
	muted = !muted;
	try {
		localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
	} catch {}
	const c = ac();
	if (master && c) {
		master.gain.cancelScheduledValues(c.currentTime);
		master.gain.setTargetAtTime(muted ? 0 : .9, c.currentTime, .04);
	}
	if (muted) stopAmbient();
	else startAmbient();
	return muted;
}
function jitter(n, amt = .08) {
	return n * (1 + (Math.random() * 2 - 1) * amt);
}
function tone(opts) {
	const c = ac();
	if (!c || !sfxBus || !musicBus || muted) return;
	const o = c.createOscillator();
	const g = c.createGain();
	o.type = opts.type ?? "triangle";
	o.frequency.setValueAtTime(opts.freq, c.currentTime);
	if (opts.freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freqEnd), c.currentTime + opts.dur);
	if (opts.detune) o.detune.value = opts.detune;
	const atk = opts.attack ?? .008;
	const vol = opts.gain ?? .05;
	g.gain.setValueAtTime(1e-4, c.currentTime);
	g.gain.exponentialRampToValueAtTime(vol, c.currentTime + atk);
	g.gain.exponentialRampToValueAtTime(1e-4, c.currentTime + opts.dur);
	o.connect(g);
	g.connect(opts.bus === "music" ? musicBus : sfxBus);
	o.start();
	o.stop(c.currentTime + opts.dur + .02);
	o.onended = () => {
		o.disconnect();
		g.disconnect();
	};
}
function noise(dur, gain = .03, freq = 1200) {
	const c = ac();
	if (!c || !sfxBus || muted) return;
	const n = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
	const d = n.getChannelData(0);
	for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
	const src = c.createBufferSource();
	src.buffer = n;
	const f = c.createBiquadFilter();
	f.type = "bandpass";
	f.frequency.value = freq;
	const g = c.createGain();
	g.gain.setValueAtTime(gain, c.currentTime);
	g.gain.exponentialRampToValueAtTime(1e-4, c.currentTime + dur);
	src.connect(f);
	f.connect(g);
	g.connect(sfxBus);
	src.start();
	src.stop(c.currentTime + dur);
}
function startAmbient() {
	const c = ac();
	if (!c || !musicBus || muted || ambientNodes) return;
	const gain = c.createGain();
	gain.gain.value = 1e-4;
	gain.gain.setTargetAtTime(.028, c.currentTime, 1.2);
	const o1 = c.createOscillator();
	const o2 = c.createOscillator();
	o1.type = "sine";
	o2.type = "sine";
	o1.frequency.value = 55;
	o2.frequency.value = 82.4;
	const lfo = c.createOscillator();
	const lfoG = c.createGain();
	lfo.frequency.value = .07;
	lfoG.gain.value = 6;
	lfo.connect(lfoG);
	lfoG.connect(o1.frequency);
	o1.connect(gain);
	o2.connect(gain);
	gain.connect(musicBus);
	o1.start();
	o2.start();
	lfo.start();
	ambientNodes = {
		osc: o1,
		osc2: o2,
		lfo,
		gain
	};
}
function stopAmbient() {
	const c = ac();
	if (!ambientNodes || !c) return;
	const n = ambientNodes;
	n.gain.gain.setTargetAtTime(1e-4, c.currentTime, .25);
	window.setTimeout(() => {
		try {
			n.osc.stop();
			n.osc2.stop();
			n.lfo.stop();
			n.osc.disconnect();
			n.osc2.disconnect();
			n.lfo.disconnect();
			n.gain.disconnect();
		} catch {}
	}, 600);
	ambientNodes = null;
}
var sfx = {
	click: () => {
		tone({
			freq: jitter(620, .06),
			dur: .045,
			type: "triangle",
			gain: .035
		});
		tone({
			freq: jitter(1240, .04),
			dur: .03,
			type: "sine",
			gain: .018,
			detune: 8
		});
	},
	dice: () => {
		noise(.05, .04, 1800);
		tone({
			freq: jitter(170),
			dur: .07,
			type: "sawtooth",
			gain: .04
		});
		window.setTimeout(() => tone({
			freq: jitter(240),
			dur: .07,
			type: "sawtooth",
			gain: .04
		}), 70);
		window.setTimeout(() => tone({
			freq: jitter(340),
			dur: .1,
			type: "triangle",
			gain: .05
		}), 150);
	},
	coin: () => {
		tone({
			freq: jitter(880, .03),
			dur: .08,
			type: "square",
			gain: .03
		});
		window.setTimeout(() => tone({
			freq: jitter(1320, .03),
			dur: .1,
			type: "square",
			gain: .025
		}), 50);
	},
	hit: () => {
		noise(.08, .05, 400);
		tone({
			freq: jitter(110, .1),
			dur: .14,
			type: "sawtooth",
			gain: .07,
			freqEnd: 70
		});
	},
	hurt: () => {
		tone({
			freq: jitter(90, .08),
			dur: .2,
			type: "square",
			gain: .06,
			freqEnd: 55
		});
		noise(.1, .03, 220);
	},
	miss: () => {
		tone({
			freq: jitter(420),
			dur: .09,
			type: "sine",
			gain: .03,
			freqEnd: 180
		});
	},
	crit: () => {
		noise(.06, .04, 2400);
		tone({
			freq: 523,
			dur: .12,
			type: "triangle",
			gain: .05
		});
		window.setTimeout(() => tone({
			freq: 784,
			dur: .14,
			type: "triangle",
			gain: .045
		}), 70);
		window.setTimeout(() => tone({
			freq: 1046,
			dur: .18,
			type: "sine",
			gain: .04
		}), 140);
	},
	win: () => {
		tone({
			freq: 392,
			dur: .12,
			type: "triangle",
			gain: .04
		});
		window.setTimeout(() => tone({
			freq: 523,
			dur: .14,
			type: "triangle",
			gain: .04
		}), 90);
		window.setTimeout(() => tone({
			freq: 659,
			dur: .2,
			type: "sine",
			gain: .045
		}), 180);
	},
	dawn: () => {
		tone({
			freq: 196,
			dur: .45,
			type: "sine",
			gain: .035,
			attack: .08,
			freqEnd: 330,
			bus: "music"
		});
		window.setTimeout(() => tone({
			freq: 247,
			dur: .5,
			type: "sine",
			gain: .025,
			attack: .1,
			bus: "music"
		}), 120);
	},
	deploy: () => {
		tone({
			freq: jitter(80, .05),
			dur: .16,
			type: "sine",
			gain: .06,
			freqEnd: 50
		});
		window.setTimeout(() => sfx.click(), 40);
	},
	forge: () => {
		noise(.07, .045, 900);
		tone({
			freq: jitter(210),
			dur: .12,
			type: "square",
			gain: .04
		});
		window.setTimeout(() => tone({
			freq: jitter(140),
			dur: .1,
			type: "triangle",
			gain: .035
		}), 80);
	},
	whoosh: () => {
		noise(.14, .04, 700);
		tone({
			freq: 480,
			dur: .16,
			type: "sine",
			gain: .03,
			freqEnd: 140
		});
	},
	hack: () => {
		tone({
			freq: jitter(880, .04),
			dur: .05,
			type: "square",
			gain: .03
		});
		window.setTimeout(() => tone({
			freq: jitter(1240, .04),
			dur: .04,
			type: "square",
			gain: .02
		}), 40);
	},
	deny: () => {
		tone({
			freq: jitter(140, .06),
			dur: .16,
			type: "square",
			gain: .05,
			freqEnd: 70
		});
		noise(.06, .03, 300);
	},
	unlock: () => {
		tone({
			freq: 392,
			dur: .08,
			type: "square",
			gain: .03
		});
		window.setTimeout(() => tone({
			freq: 523,
			dur: .1,
			type: "square",
			gain: .03
		}), 70);
		window.setTimeout(() => tone({
			freq: 784,
			dur: .16,
			type: "square",
			gain: .035
		}), 150);
	}
};
function rumble(ms = 16) {
	if (typeof navigator === "undefined" || muted) return;
	try {
		navigator.vibrate?.(ms);
	} catch {}
}
var WHO_KEY = "synaps-t0880-v1:who";
var PACK_PARAM = {
	pin: "bobby_pin",
	bobby_pin: "bobby_pin",
	stim: "stimpak",
	stimpak: "stimpak",
	ment: "mentats",
	mentats: "mentats",
	holo: "holotape",
	holotape: "holotape",
	sarsa: "sarsaparilla",
	sarsaparilla: "sarsaparilla",
	probe: "probe_kit",
	probe_kit: "probe_kit"
};
function params() {
	if (typeof window === "undefined") return new URLSearchParams();
	const q = new URLSearchParams(window.location.search);
	(window.location.hash.startsWith("#") ? new URLSearchParams(window.location.hash.slice(1)) : new URLSearchParams()).forEach((v, k) => {
		if (!q.has(k)) q.set(k, v);
	});
	return q;
}
function num(raw) {
	if (raw == null || raw === "") return void 0;
	const n = Number(raw);
	return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : void 0;
}
function cleanId(raw) {
	if (!raw) return null;
	const id = raw.trim().replace(/[^\w.-]/g, "").slice(0, 32);
	return id.length >= 2 ? id : null;
}
function cleanName(raw, fallback) {
	return (raw ?? "").trim().replace(/^@/, "").slice(0, 32) || fallback;
}
function isSnowflake(raw) {
	return /^\d{17,22}$/.test(raw.trim());
}
function snapFromParams(q) {
	const id = cleanId(q.get("d") || q.get("discord") || q.get("user_id") || q.get("uid"));
	if (!id) return null;
	const pack = {};
	const packed = q.get("pack");
	if (packed) try {
		const obj = JSON.parse(packed);
		PACK_KEYS.forEach((k) => {
			if (typeof obj[k] === "number") pack[k] = Math.max(0, Math.floor(obj[k]));
		});
	} catch {}
	Object.entries(PACK_PARAM).forEach(([param, key]) => {
		const n = num(q.get(param));
		if (n != null) pack[key] = n;
	});
	return {
		id,
		name: cleanName(q.get("n") || q.get("name") || q.get("nick") || q.get("username"), id),
		caps: num(q.get("caps") || q.get("coins") || q.get("coin")),
		xp: num(q.get("xp")),
		level: num(q.get("lvl") || q.get("level")),
		pack: Object.keys(pack).length ? pack : void 0,
		source: "url"
	};
}
function parseStampedLink(raw) {
	const t = raw.trim();
	if (!t) return null;
	if (t.includes("?") || t.includes("://") || t.startsWith("/") || t.includes("#")) try {
		const u = new URL(t, "https://hollow.invalid");
		const q = new URLSearchParams(u.search);
		if (u.hash.startsWith("#")) new URLSearchParams(u.hash.slice(1)).forEach((v, k) => {
			if (!q.has(k)) q.set(k, v);
		});
		const snap = snapFromParams(q);
		if (snap) return snap;
	} catch {}
	if (isSnowflake(t)) return {
		id: t.trim(),
		name: t.trim(),
		source: "memory"
	};
	return null;
}
function readWho() {
	try {
		const raw = localStorage.getItem(WHO_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!parsed?.id) return null;
		return {
			id: String(parsed.id).slice(0, 32),
			name: String(parsed.name || parsed.id).slice(0, 32)
		};
	} catch {
		return null;
	}
}
function writeWho(who) {
	try {
		if (!who) localStorage.removeItem(WHO_KEY);
		else localStorage.setItem(WHO_KEY, JSON.stringify(who));
	} catch {}
}
function saveKeyFor(id, base) {
	return id ? `${base}:d:${id}` : base;
}
function snapshotFromSearch() {
	if (typeof window === "undefined") return null;
	return snapFromParams(params());
}
function applyFloor(state, snap) {
	const delta = {
		caps: 0,
		xp: 0,
		pack: {}
	};
	if (!snap) return delta;
	state.discordId = snap.id;
	state.discordName = snap.name;
	if (snap.caps != null && snap.caps > state.coins) {
		delta.caps = snap.caps - state.coins;
		state.coins = snap.caps;
	}
	if (snap.level != null && snap.level > state.level) state.level = snap.level;
	if (snap.xp != null && snap.xp > state.xp) {
		delta.xp = snap.xp - state.xp;
		state.xp = snap.xp;
	}
	if (snap.pack) PACK_KEYS.forEach((k) => {
		const want = snap.pack?.[k];
		if (want == null) return;
		const have = state.pack[k] ?? 0;
		if (want > have) {
			delta.pack[k] = want - have;
			state.pack[k] = want;
		}
	});
	return delta;
}
function deltaEmpty(d) {
	return d.caps === 0 && d.xp === 0 && Object.keys(d.pack).length === 0;
}
function stampedUrl(origin, snap) {
	const u = new URL(origin);
	u.searchParams.set("d", snap.id);
	u.searchParams.set("n", snap.name);
	if (snap.caps != null) u.searchParams.set("caps", String(snap.caps));
	if (snap.xp != null) u.searchParams.set("xp", String(snap.xp));
	if (snap.level != null) u.searchParams.set("lvl", String(snap.level));
	return u.toString();
}
async function pullRemote(id, timeoutMs = 1200) {
	if (typeof window === "undefined" || !id) return null;
	const ctrl = new AbortController();
	const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
	try {
		const res = await fetch(`/api/tyrone/sync?d=${encodeURIComponent(id)}`, {
			signal: ctrl.signal,
			headers: { accept: "application/json" }
		});
		if (!res.ok) return null;
		const body = await res.json();
		if (!body || typeof body !== "object") return null;
		return {
			id,
			name: cleanName(body.name ?? null, id),
			caps: typeof body.caps === "number" ? body.caps : void 0,
			xp: typeof body.xp === "number" ? body.xp : void 0,
			level: typeof body.level === "number" ? body.level : void 0,
			pack: body.pack,
			source: "api"
		};
	} catch {
		return null;
	} finally {
		window.clearTimeout(t);
	}
}
var activeId = null;
function setActiveIdentity(who) {
	activeId = who?.id ?? null;
	writeWho(who);
}
function key() {
	return saveKeyFor(activeId, SAVE_KEY);
}
function claimAnonymousIfNeeded(id) {
	try {
		const slot = saveKeyFor(id, SAVE_KEY);
		if (localStorage.getItem(slot)) return;
		const anon = localStorage.getItem(SAVE_KEY);
		if (anon) localStorage.setItem(slot, anon);
	} catch {}
}
function migrateLoc(id) {
	if (id === "forest") return "ironclad";
	if (id === "edge") return "veyra";
	return id;
}
function migrateLocations(raw, base) {
	const next = { ...base };
	if (!raw) return next;
	Object.keys(raw).forEach((k) => {
		const id = migrateLoc(k);
		next[id] = {
			...next[id],
			...raw[k]
		};
	});
	return next;
}
function loadSave() {
	const base = defaultState();
	try {
		const raw = localStorage.getItem(key());
		if (!raw) return base;
		const parsed = JSON.parse(raw);
		const merged = {
			...base,
			...parsed,
			rooms: {
				...base.rooms,
				...parsed.rooms
			},
			quarters: {
				...base.quarters,
				...parsed.quarters
			},
			locations: migrateLocations(parsed.locations, base.locations),
			pack: {
				...base.pack,
				...parsed.pack
			},
			clocks: parsed.clocks ?? base.clocks,
			version: 5
		};
		merged.combat = parsed.combat ?? null;
		merged.mission = parsed.mission ?? null;
		merged.toast = null;
		merged.hack = null;
		merged.lastParty = parsed.lastParty ?? [];
		merged.xp = parsed.xp ?? 0;
		merged.level = parsed.level ?? 1;
		merged.xpToNext = parsed.xpToNext ?? 80;
		merged.mentatsLuck = parsed.mentatsLuck ?? 0;
		merged.hackProbes = parsed.hackProbes ?? 0;
		merged.terminalDrained = parsed.terminalDrained ?? false;
		merged.terminalLockDay = parsed.terminalLockDay ?? 0;
		merged.discordId = parsed.discordId ?? activeId;
		merged.discordName = parsed.discordName ?? readWho()?.name ?? null;
		merged.talk = null;
		merged.seenTalk = parsed.seenTalk ?? [];
		merged.talkQueue = [];
		merged.selectedLoc = migrateLoc(parsed.selectedLoc || "ironclad");
		merged.operatives = (parsed.operatives ?? []).map((o) => ({
			...o,
			location: migrateLoc(o.location)
		}));
		merged.squad = parsed.squad ?? [];
		merged.activeMemberId = parsed.activeMemberId ?? null;
		merged.arc = parsed.arc ?? null;
		seedPackIfNeeded(merged);
		ensureSquad(merged);
		return merged;
	} catch {
		return base;
	}
}
function writeSave(state) {
	try {
		const slim = {
			...state,
			toast: null,
			hack: null,
			talk: state.talk,
			combat: state.combat
		};
		const k = key();
		localStorage.setItem(k, JSON.stringify(slim));
		localStorage.setItem(k + ":bak", JSON.stringify(slim));
	} catch {}
}
function clearSave() {
	try {
		localStorage.removeItem(key());
	} catch {}
}
function mutate(set, fn) {
	set((st) => {
		const next = cloneState(st.s);
		fn(next);
		return { s: next };
	});
}
var lastRestAt = 0;
var useGame = create((set, get) => ({
	s: defaultState(),
	hydrated: false,
	confirmRest: false,
	handshake: null,
	guideOpen: false,
	hydrate: () => {
		if (typeof window === "undefined") return;
		const urlSnap = snapshotFromSearch();
		const who = urlSnap ? {
			id: urlSnap.id,
			name: urlSnap.name
		} : readWho();
		if (who) {
			claimAnonymousIfNeeded(who.id);
			setActiveIdentity(who);
		}
		const loaded = loadSave();
		if (who) {
			loaded.discordId = who.id;
			loaded.discordName = who.name;
			registerMember(loaded, who.name, who.name, who.id);
			const seated = loaded.squad.find((m) => m.discordId === who.id);
			if (seated) switchMember(loaded, seated.id);
		}
		const delta = applyFloor(loaded, urlSnap);
		ensureSquad(loaded);
		if (!deltaEmpty(delta)) {
			loaded.toast = `Arcade synced. +${delta.caps} caps · +${delta.xp} XP.`;
			ensureSquad(loaded).personalCaps += delta.caps;
			queueTalk(loaded, "handshake", true);
		}
		if (loaded.started && !loaded.shop) loaded.shop = rollShop(loaded.day);
		if (loaded.started && !loaded.bounty) loaded.bounty = rollBounty(loaded);
		seedPackIfNeeded(loaded);
		set({
			s: loaded,
			hydrated: true,
			handshake: deltaEmpty(delta) ? urlSnap ? delta : null : delta
		});
	},
	pullArcade: async () => {
		const id = get().s.discordId;
		if (!id) return;
		const snap = await pullRemote(id);
		if (!snap) return;
		mutate(set, (st) => {
			const d = applyFloor(st, snap);
			registerMember(st, snap.name, snap.name, snap.id);
			const rider = st.squad.find((m) => m.discordId === snap.id);
			if (rider && d.caps) rider.personalCaps += d.caps;
			if (!deltaEmpty(d)) st.toast = `Tyrone pulled the porch. +${d.caps} caps · +${d.xp} XP.`;
		});
	},
	persist: () => writeSave(get().s),
	reset: () => {
		clearSave();
		const next = defaultState();
		const who = readWho();
		if (who) {
			next.discordId = who.id;
			next.discordName = who.name;
		}
		ensureSquad(next);
		set({
			s: next,
			hydrated: true,
			confirmRest: false,
			handshake: null,
			guideOpen: false
		});
	},
	linkDiscord: (id, name) => {
		const stamped = parseStampedLink(id);
		const snow = (stamped?.id || (isSnowflake(id) ? id.trim() : "")).slice(0, 32);
		const label = (name || stamped?.name || (!snow ? id : snow)).replace(/^@/, "").trim().slice(0, 32);
		if (label.length < 2 && snow.length < 2) return;
		mutate(set, (st) => {
			const d = stamped ? applyFloor(st, {
				...stamped,
				name: label || stamped.name
			}) : {
				caps: 0,
				xp: 0,
				pack: {}
			};
			const plate = label.length >= 2 ? label : snow;
			if (snow && !st.discordId) {
				st.discordId = snow;
				st.discordName = plate;
			} else if (!st.discordName) st.discordName = plate;
			registerMember(st, plate, name || stamped?.name || plate, snow || null);
			const seated = snow ? st.squad.find((m) => m.discordId === snow) : seatedMember(st);
			if (seated) switchMember(st, seated.id);
			if (d.caps) ensureSquad(st).personalCaps += d.caps;
			st.toast = `${plate} sits the black card.`;
		});
		if (snow) get().pullArcade();
	},
	setScreen: (screen) => mutate(set, (s) => {
		s.screen = screen;
		const script = SCREEN_SCRIPT[screen];
		if (script) queueTalk(s, script);
	}),
	assumeCommand: () => mutate(set, (s) => {
		s.started = true;
		s.screen = "briefing";
		s.tutorial = "briefing";
		s.shop = rollShop(1);
		s.bounty = rollBounty(s);
		ensureSquad(s);
		pushLog(s, "session", "Tyrone", "Command assumed. The word is S.Y.N.A.P.S.E. Three bobby pins. A CRT that lies.");
		queueTalk(s, "briefing", true);
	}),
	resumeSession: () => mutate(set, (s) => {
		if (!s.started) return;
		if (s.tutorial === "briefing" && s.operatives.length === 0) {
			s.screen = "briefing";
			queueTalk(s, "briefing", true);
			return;
		}
		queueTalk(s, "resume", !s.talk);
	}),
	askTyrone: (script) => {
		set({ guideOpen: false });
		mutate(set, (s) => {
			const id = script ?? scriptForScreen(s);
			if (s.combat || s.mission) {
				s.toast = "I will not talk over a fight, partner. Read the card.";
				return;
			}
			queueTalk(s, id, true);
		});
	},
	openGuide: () => set({ guideOpen: true }),
	closeGuide: () => set({ guideOpen: false }),
	finishBriefing: () => mutate(set, (s) => {
		s.screen = "forge";
		s.tutorial = "forge";
		queueTalk(s, "forge");
	}),
	toastClear: () => mutate(set, (s) => {
		s.toast = null;
	}),
	selectOp: (id) => mutate(set, (s) => {
		s.selectedId = id;
	}),
	selectLoc: (id) => mutate(set, (s) => {
		s.selectedLoc = id;
	}),
	forge: (opts) => {
		const s = get().s;
		const cost = forgeCost(s);
		if (living(s).length >= rosterCap(s)) return "Barracks full. Upgrade for more beds.";
		if (s.coins < cost) return `Need ${cost} caps to forge.`;
		if (!opts.name.trim()) return "They need a name. The Hollow keeps records.";
		mutate(set, (st) => {
			st.coins -= cost;
			const op = forgeOperative({
				name: opts.name,
				cls: opts.cls,
				race: opts.race,
				lineage: opts.lineage,
				origin: opts.origin,
				day: st.day,
				rolls: opts.rolls
			});
			st.operatives = [op, ...st.operatives];
			if (st.tutorial === "forge") {
				st.tutorial = "sortie";
				st.screen = "map";
				st.selectedId = null;
			} else {
				st.selectedId = op.id;
				st.screen = "roster";
			}
			pushLog(st, "hq", op.name, `Forged. ${op.cls} · ${op.race} · ${op.repTitle}. ${cost ? `-${cost} caps` : "First operative is a gift."}`);
			st.toast = `${op.name} is on the roster.`;
		});
		sfx.forge();
		return null;
	},
	upgradeRoom: (room) => {
		const s = get().s;
		const cost = nextRoomCost(s, room);
		if (cost == null) return "Already at peak.";
		if (cost === 0 && s.rooms[room] > 0) return "Already at peak.";
		if (s.coins < cost) return `Need ${cost} caps.`;
		mutate(set, (st) => {
			st.coins -= cost;
			st.rooms[room] += 1;
			const lvl = st.rooms[room];
			const bonus = BASE_ROOMS[room].tiers[Math.min(lvl, BASE_ROOMS[room].tiers.length - 1)].bonus;
			pushLog(st, "hq", "HQ", `${BASE_ROOMS[room].name} → ${lvl}. ${bonus}`);
			st.toast = `${BASE_ROOMS[room].name} upgraded.`;
		});
		sfx.forge();
		return null;
	},
	upgradeQuarter: (q) => {
		const s = get().s;
		const cost = nextQuarterCost(s, q);
		if (cost == null) return "Already at peak.";
		if (s.coins < cost) return `Need ${cost} caps.`;
		mutate(set, (st) => {
			st.coins -= cost;
			st.quarters[q] += 1;
			const lvl = st.quarters[q];
			pushLog(st, "hq", "Bunkhouse", `${QUARTERS[q].name} → ${lvl}.`);
			st.toast = `${QUARTERS[q].name} upgraded.`;
		});
		sfx.forge();
		return null;
	},
	hireResident: (name, role) => {
		const s = get().s;
		const cost = hireResidentCost(s);
		if (s.rooms.barracks < 1) return "Barracks required before hiring staff.";
		if (s.coins < cost) return `Need ${cost} caps.`;
		mutate(set, (st) => {
			st.coins -= cost;
			st.residents.push({
				id: `rs-${Date.now()}`,
				name: name.trim() || "Unnamed",
				role
			});
			pushLog(st, "hq", name || "Staff", `Hired as ${role}.`);
			st.toast = "Staff hired.";
		});
		return null;
	},
	bondCompanion: (opId, type) => {
		const s = get().s;
		const cost = companionCost(type);
		const op = s.operatives.find((o) => o.id === opId);
		if (!op) return "No operative.";
		if (op.companion) return "Already bonded.";
		if (s.coins < cost) return `Need ${cost} caps.`;
		const def = COMPANIONS[type];
		mutate(set, (st) => {
			st.coins -= cost;
			const i = st.operatives.findIndex((o) => o.id === opId);
			st.operatives[i] = {
				...st.operatives[i],
				companion: {
					type,
					hp: def.hp,
					maxHp: def.hp,
					status: "active"
				}
			};
			pushLog(st, "hq", op.name, `Bonded ${type}.`);
			st.toast = `${type} bonded to ${op.name}.`;
		});
		return null;
	},
	repairItem: (opId, itemId) => {
		const s = get().s;
		if (s.rooms.forge < 1) return "Build the Forge first.";
		let item;
		if (opId === "vault") item = s.vault.find((i) => i.id === itemId);
		else item = s.operatives.find((o) => o.id === opId)?.inventory.find((i) => i.id === itemId);
		if (!item) return "No such item.";
		if (item.condition === "Pristine") return "Already pristine.";
		const cost = repairCost(s, item);
		if (s.coins < cost) return `Need ${cost} caps.`;
		mutate(set, (st) => {
			st.coins -= cost;
			const bump = (it) => it.id === itemId ? {
				...it,
				condition: improve(it.condition)
			} : it;
			if (opId === "vault") st.vault = st.vault.map(bump);
			else {
				const i = st.operatives.findIndex((o) => o.id === opId);
				st.operatives[i] = {
					...st.operatives[i],
					inventory: st.operatives[i].inventory.map(bump)
				};
			}
			pushLog(st, "hq", "Forge", `Repaired toward pristine. -${cost} caps`);
			st.toast = "Steel remembers how to hold.";
		});
		return null;
	},
	healOp: (opId) => {
		const s = get().s;
		const op = s.operatives.find((o) => o.id === opId);
		if (!op) return "No operative.";
		if (op.hp >= op.maxHp) return "Already whole.";
		const cost = healCost(s, op.maxHp - op.hp);
		if (s.coins < cost) return `Need ${cost} caps.`;
		mutate(set, (st) => {
			st.coins -= cost;
			const i = st.operatives.findIndex((o) => o.id === opId);
			st.operatives[i] = {
				...st.operatives[i],
				hp: op.maxHp,
				status: "idle"
			};
			pushLog(st, "hp", op.name, `Infirmary. Full. -${cost} caps`);
			st.toast = `${op.name} stands up.`;
		});
		return null;
	},
	stabilize: (opId) => {
		const s = get().s;
		const op = s.operatives.find((o) => o.id === opId);
		if (!op || op.status !== "downed") return "They are not downed.";
		const field = s.rooms.infirmary < 1;
		const cost = field ? 180 : 0;
		if (s.coins < cost) return `Need ${cost} caps.`;
		mutate(set, (st) => {
			if (field) st.coins -= cost;
			const i = st.operatives.findIndex((o) => o.id === opId);
			st.operatives[i] = {
				...st.operatives[i],
				hp: 1,
				status: "idle",
				location: "hq"
			};
			pushLog(st, "hp", op.name, field ? `Field dressing. 1 HP. -${cost} caps` : "Stabilised at 1 HP.");
			st.toast = `${op.name} is standing. Barely.`;
		});
		return null;
	},
	equipItem: (opId, itemId) => mutate(set, (s) => {
		const i = s.operatives.findIndex((o) => o.id === opId);
		if (i < 0) return;
		const inv = s.operatives[i].inventory;
		const item = inv.find((x) => x.id === itemId);
		if (!item || !item.slot) return;
		s.operatives[i] = {
			...s.operatives[i],
			inventory: inv.map((x) => x.slot === item.slot ? {
				...x,
				equipped: x.id === itemId ? !x.equipped : false
			} : x)
		};
	}),
	stashItem: (opId, itemId) => {
		const op = get().s.operatives.find((o) => o.id === opId);
		const item = op?.inventory.find((i) => i.id === itemId);
		if (!op || !item) return "No item.";
		if (item.equipped) return "Unequip first.";
		mutate(set, (st) => {
			const i = st.operatives.findIndex((o) => o.id === opId);
			st.operatives[i] = {
				...st.operatives[i],
				inventory: st.operatives[i].inventory.filter((x) => x.id !== itemId)
			};
			st.vault.push(item);
		});
		return null;
	},
	takeFromVault: (opId, itemId) => {
		const s = get().s;
		const op = s.operatives.find((o) => o.id === opId);
		const item = s.vault.find((i) => i.id === itemId);
		if (!op || !item) return "No item.";
		if (op.inventory.length >= packCap(op)) return "Rucksack full.";
		mutate(set, (st) => {
			st.vault = st.vault.filter((x) => x.id !== itemId);
			const i = st.operatives.findIndex((o) => o.id === opId);
			st.operatives[i] = {
				...st.operatives[i],
				inventory: [...st.operatives[i].inventory, item]
			};
		});
		return null;
	},
	buyOffer: (tier) => {
		const s = get().s;
		if (!s.shop) return "Ledger is dark.";
		if (s.shop.bought?.[tier]) return "Already sold today. Wait for dawn.";
		const offer = s.shop[tier];
		const disc = s.rooms.ledger >= 3 ? .85 : 1;
		const price = Math.round(offer.price * disc);
		if (s.coins < price) return `Need ${price} caps.`;
		mutate(set, (st) => {
			if (!st.shop) return;
			st.coins -= price;
			st.shop = {
				...st.shop,
				bought: {
					...st.shop.bought,
					[tier]: true
				}
			};
			st.vault.push({
				id: `buy-${Date.now()}`,
				name: offer.name,
				kind: offer.kind,
				rarity: offer.rarity,
				condition: "Pristine",
				slot: offer.kind === "weapon" ? "weapon" : offer.kind === "armor" ? "armor" : offer.kind === "trinket" ? "trinket" : void 0,
				effect: offer.effect,
				lore: "Ledger stock.",
				value: price,
				damage: offer.kind === "weapon" ? "1d6" : void 0,
				defense: offer.kind === "armor" ? 1 : void 0
			});
			pushLog(st, "loot", "Ledger", `Bought ${offer.name} for ${price} caps.`);
			st.toast = `Acquired ${offer.name}.`;
		});
		return null;
	},
	buyNpc: (name, price) => {
		if (get().s.coins < price) return `Need ${price} caps.`;
		mutate(set, (st) => {
			st.coins -= price;
			if (name.includes("Ore")) st.ore += 1;
			else st.vault.push({
				id: `npc-${Date.now()}`,
				name,
				kind: "consumable",
				rarity: "Uncommon",
				condition: "Pristine",
				effect: "Field supply.",
				lore: "Paid in full.",
				value: price
			});
			pushLog(st, "loot", "Trade", `Bought ${name}.`);
			st.toast = `Paid for ${name}.`;
		});
		return null;
	},
	deploy: (loc, kind, partyIds) => {
		const s = get().s;
		if (s.mission || s.combat) return "A sortie is already live.";
		if (!s.locations[loc].unlocked) return "That region is sealed.";
		if (kind === "boss" && !s.locations[loc].bossUnlocked) return "The name has not surfaced yet.";
		if (kind === "boss" && s.locations[loc].bossDefeated) return "That name is already down.";
		if (!partyIds.length) return "Send at least one operative.";
		if (!partyIds.every((id) => idleAtHq(s).some((o) => o.id === id))) return "Pick idle operatives at HQ.";
		if (kind === "raid" && partyIds.length < 1) return "Raid needs a body.";
		if (!canTakeArcTurn(s, loc, kind)) return `ARC turn belongs to ${s.squad.find((m) => m.id === s.arc?.turnMemberId)?.name ?? "another rider"}. Scout is always open.`;
		mutate(set, (st) => {
			st.mission = buildMission(st, loc, kind, partyIds);
			st.lastParty = partyIds;
			partyIds.forEach((id) => {
				const i = st.operatives.findIndex((o) => o.id === id);
				st.operatives[i] = {
					...st.operatives[i],
					status: "deployed",
					location: loc
				};
			});
			pushLog(st, "action", locById(loc).short, `${kind} sortie. ${partyIds.length} deployed.`);
		});
		return null;
	},
	rollBeat: () => mutate(set, (st) => {
		if (!st.mission || !st.mission.waiting) return;
		if (!st.mission.partyIds.some((id) => {
			const o = st.operatives.find((x) => x.id === id);
			return o && o.hp > 0 && o.status !== "dead";
		})) {
			completeMission(st);
			return;
		}
		const res = applyRollToBeat(st, d20());
		if (res.startCombat) spawnCombat(st, { boss: false });
		if (res.startBoss) spawnCombat(st, { boss: true });
	}),
	continueMission: () => mutate(set, (st) => {
		if (!st.mission) return;
		if (st.combat) return;
		if (st.mission.waiting) return;
		if (st.mission.partyIds.every((id) => {
			const o = st.operatives.find((x) => x.id === id);
			return !o || o.hp <= 0 || o.status === "dead";
		}) || st.mission.beatIndex >= st.mission.beats.length - 1) {
			completeMission(st);
			return;
		}
		advanceBeat(st);
	}),
	combatAct: (a) => {
		const had = !!get().s.combat;
		mutate(set, (st) => {
			if (!st.combat) return;
			resolvePlayerAction(st, a);
		});
		if (had && !get().s.combat) {
			const toast = get().s.toast ?? "";
			if (toast.includes("downed") || toast.includes("Extract")) sfx.hurt();
			else if (a === "flee") sfx.whoosh();
			else sfx.win();
		}
	},
	extractCombat: () => mutate(set, (st) => {
		if (!st.combat) return;
		finishCombat(st, false);
	}),
	rest: () => {
		const s = get().s;
		if (s.mission || s.combat) return;
		if (s.operatives.filter((o) => o.status === "downed").length && s.rooms.infirmary < 1 && !get().confirmRest) {
			set({ confirmRest: true });
			return;
		}
		const now = Date.now();
		if (now - lastRestAt < 800) return;
		lastRestAt = now;
		set({ confirmRest: false });
		mutate(set, (st) => {
			restOvernight(st);
		});
		sfx.dawn();
	},
	cancelRest: () => set({ confirmRest: false }),
	tick: () => mutate(set, (st) => {
		if (!st.started) return;
		st.ticks += 1;
		st.coins += incomePerTick(st);
	}),
	renameOp: (id, name) => mutate(set, (s) => {
		const i = s.operatives.findIndex((o) => o.id === id);
		if (i >= 0 && name.trim()) s.operatives[i] = {
			...s.operatives[i],
			name: name.trim()
		};
	}),
	hof: (id) => mutate(set, (s) => {
		const i = s.operatives.findIndex((o) => o.id === id);
		if (i < 0) return;
		const op = s.operatives[i];
		if (op.raids + op.battles < 4) {
			s.toast = "Not yet. Survive more sorties.";
			return;
		}
		s.operatives[i] = {
			...op,
			isHoF: !op.isHoF
		};
		s.toast = op.isHoF ? `${op.name} leaves the Hall.` : `${op.name} is inducted. +3 CHA.`;
		pushLog(s, "hq", op.name, op.isHoF ? "Removed from Hall of Fame." : "Inducted. +3 CHA.");
	}),
	usePack: (key) => {
		if ((get().s.pack?.[key] ?? 0) <= 0) return `No ${key.replaceAll("_", " ")} in the vault.`;
		mutate(set, (st) => {
			usePackItem(st, key);
		});
		sfx.coin();
		return null;
	},
	openTerminal: () => {
		let msg = null;
		mutate(set, (st) => {
			msg = openHack(st);
			if (msg) st.toast = msg;
		});
		return msg;
	},
	closeTerminal: () => mutate(set, (st) => {
		closeHack(st);
	}),
	hackPick: (word) => {
		let result = "idle";
		mutate(set, (st) => {
			result = hackGuess(st, word);
		});
		return result;
	},
	hackBracket: () => {
		let msg = null;
		mutate(set, (st) => {
			msg = hackDud(st);
		});
		return msg;
	},
	advanceTalk: () => mutate(set, (st) => {
		advanceTalk(st);
	}),
	skipTalk: () => mutate(set, (st) => {
		skipTalk(st);
	}),
	registerRider: (name, handle, discordId) => {
		let msg = null;
		mutate(set, (st) => {
			const stamped = parseStampedLink(discordId || "") ?? parseStampedLink(handle || "");
			const did = stamped?.id || discordId || (handle && /^\d{17,22}$/.test(handle.trim()) ? handle.trim() : void 0);
			const label = name.trim() || stamped?.name || "";
			msg = registerMember(st, label, stamped ? stamped.name : handle, did);
			if (!msg) {
				if (stamped) {
					const d = applyFloor(st, {
						...stamped,
						name: label || stamped.name
					});
					if (d.caps) seatedMember(st).personalCaps += d.caps;
				}
				st.toast = `${seatedMember(st).name} sits the black card.`;
			}
		});
		return msg;
	},
	playAs: (id) => mutate(set, (st) => {
		switchMember(st, id);
		const m = st.squad.find((x) => x.id === id);
		if (m) st.toast = `Seated as ${m.name}.`;
	}),
	giftRider: (toId, amount) => {
		let msg = null;
		mutate(set, (st) => {
			msg = giftCaps(st, toId, amount);
			if (!msg) st.toast = "Caps moved between cards.";
		});
		return msg;
	},
	depositCard: (amount) => {
		let msg = null;
		mutate(set, (st) => {
			msg = depositToCard(st, amount);
			if (!msg) st.toast = "Deposited to the Moon Squad card.";
		});
		return msg;
	},
	withdrawCard: (amount) => {
		let msg = null;
		mutate(set, (st) => {
			msg = withdrawFromCard(st, amount);
			if (!msg) st.toast = "Withdrawn to the compound vault.";
		});
		return msg;
	},
	passTurn: () => mutate(set, (st) => {
		passArcTurn(st);
	})
}));
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var variants = {
	primary: "bg-paper text-ink hover:bg-moon disabled:opacity-40",
	ember: "bg-ember text-ink hover:bg-ember-bright disabled:opacity-40",
	ghost: "bg-transparent text-paper shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)] hover:text-ember-bright disabled:opacity-40",
	danger: "bg-danger/15 text-danger shadow-[var(--shadow-border)] hover:bg-danger/25 disabled:opacity-40",
	quiet: "bg-raised text-muted hover:text-paper hover:bg-panel disabled:opacity-40"
};
var sizes = {
	sm: "min-h-10 px-3 text-xs",
	md: "min-h-11 px-4 text-sm",
	lg: "min-h-12 px-5 text-sm"
};
function Button({ className, variant = "primary", size = "md", sound = "click", type = "button", onClick, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn("inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-display text-[11px] font-semibold uppercase tracking-[0.14em] transition-[color,background-color,box-shadow,transform] duration-150 ease-out active:scale-[0.96] disabled:pointer-events-none", variants[variant], sizes[size], className),
		...props,
		onClick: (e) => {
			if (sound === "click" && !props.disabled) sfx.click();
			onClick?.(e);
		}
	});
}
var PHI = (1 + Math.sqrt(5)) / 2;
function icosa() {
	return {
		verts: [
			[
				-1,
				PHI,
				0
			],
			[
				1,
				PHI,
				0
			],
			[
				-1,
				-PHI,
				0
			],
			[
				1,
				-PHI,
				0
			],
			[
				0,
				-1,
				PHI
			],
			[
				0,
				1,
				PHI
			],
			[
				0,
				-1,
				-PHI
			],
			[
				0,
				1,
				-PHI
			],
			[
				PHI,
				0,
				-1
			],
			[
				PHI,
				0,
				1
			],
			[
				-PHI,
				0,
				-1
			],
			[
				-PHI,
				0,
				1
			]
		].map((v) => {
			const l = Math.hypot(v[0], v[1], v[2]);
			return [
				v[0] / l,
				v[1] / l,
				v[2] / l
			];
		}),
		faces: [
			[
				0,
				11,
				5
			],
			[
				0,
				5,
				1
			],
			[
				0,
				1,
				7
			],
			[
				0,
				7,
				10
			],
			[
				0,
				10,
				11
			],
			[
				1,
				5,
				9
			],
			[
				5,
				11,
				4
			],
			[
				11,
				10,
				2
			],
			[
				10,
				7,
				6
			],
			[
				7,
				1,
				8
			],
			[
				3,
				9,
				4
			],
			[
				3,
				4,
				2
			],
			[
				3,
				2,
				6
			],
			[
				3,
				6,
				8
			],
			[
				3,
				8,
				9
			],
			[
				4,
				9,
				5
			],
			[
				2,
				4,
				11
			],
			[
				6,
				2,
				10
			],
			[
				8,
				6,
				7
			],
			[
				9,
				8,
				1
			]
		]
	};
}
var MESH = icosa();
var NUMS = [
	20,
	1,
	12,
	6,
	8,
	15,
	17,
	3,
	9,
	18,
	4,
	10,
	7,
	5,
	13,
	16,
	2,
	14,
	11,
	19
];
var GLOW = {
	fumble: "#e24b4b",
	fail: "#e24b4b",
	weak: "#c9b27a",
	success: "#3ee07a",
	strong: "#7dffb0",
	crit: "#7dffb0"
};
function rot(v, ax, ay, az) {
	let [x, y, z] = v;
	let s = Math.sin(ax);
	let c = Math.cos(ax);
	let y2 = y * c - z * s;
	let z2 = y * s + z * c;
	y = y2;
	z = z2;
	s = Math.sin(ay);
	c = Math.cos(ay);
	const x2 = x * c + z * s;
	z2 = -x * s + z * c;
	x = x2;
	z = z2;
	s = Math.sin(az);
	c = Math.cos(az);
	const x3 = x * c - y * s;
	y2 = x * s + y * c;
	return [
		x3,
		y2,
		z
	];
}
function Dice20({ value, band, spinning, size = 92, className }) {
	const canvasRef = (0, import_react.useRef)(null);
	const st = (0, import_react.useRef)({
		ax: .4,
		ay: .7,
		az: .15,
		vx: 0,
		vy: 0,
		vz: 0,
		t: 0,
		spin: false
	});
	(0, import_react.useEffect)(() => {
		const s = st.current;
		s.spin = !!spinning;
		if (spinning) {
			s.vx = 8 + Math.random() * 6;
			s.vy = 10 + Math.random() * 8;
			s.vz = 4 + Math.random() * 4;
		} else {
			s.vx *= .2;
			s.vy *= .2;
			s.vz *= .2;
		}
	}, [spinning, value]);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		canvas.width = size * dpr;
		canvas.height = size * dpr;
		let raf = 0;
		let last = performance.now();
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const draw = (now) => {
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			const s = st.current;
			s.t += dt;
			if (!reduced) {
				if (s.spin) {
					s.ax += s.vx * dt;
					s.ay += s.vy * dt;
					s.az += s.vz * dt;
				} else {
					s.vx *= Math.exp(-5 * dt);
					s.vy *= Math.exp(-5 * dt);
					s.vz *= Math.exp(-5 * dt);
					s.ax += s.vx * dt;
					s.ay += s.vy * dt;
					s.az += s.vz * dt;
					if (!spinning) {
						const targetY = (value ?? 10) * .31 % (Math.PI * 2);
						s.ay += (targetY - s.ay) * (1 - Math.exp(-3.2 * dt));
						s.ax += (.55 - s.ax) * (1 - Math.exp(-2.4 * dt));
					}
				}
			}
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, size, size);
			const cx = size / 2;
			const cy = size / 2 + size * .04;
			const scale = size * .38;
			const light = [
				.35,
				-.55,
				.76
			];
			const ln = Math.hypot(light[0], light[1], light[2]);
			const L = light.map((n) => n / ln);
			const pts = MESH.verts.map((v) => rot(v, s.ax, s.ay, s.az));
			const faces = MESH.faces.map((f, i) => {
				const a = pts[f[0]];
				const b = pts[f[1]];
				const c = pts[f[2]];
				const ux = b[0] - a[0];
				const uy = b[1] - a[1];
				const uz = b[2] - a[2];
				const vx = c[0] - a[0];
				const vy = c[1] - a[1];
				const vz = c[2] - a[2];
				let nx = uy * vz - uz * vy;
				let ny = uz * vx - ux * vz;
				let nz = ux * vy - uy * vx;
				const nl = Math.hypot(nx, ny, nz) || 1;
				nx /= nl;
				ny /= nl;
				nz /= nl;
				const z = (a[2] + b[2] + c[2]) / 3;
				return {
					i,
					a,
					b,
					c,
					nx,
					ny,
					nz,
					z,
					n: NUMS[i]
				};
			});
			faces.sort((p, q) => p.z - q.z);
			ctx.save();
			ctx.beginPath();
			ctx.ellipse(cx, size * .86, size * .28, size * .06, 0, 0, Math.PI * 2);
			ctx.fillStyle = "rgba(0,0,0,0.35)";
			ctx.fill();
			ctx.restore();
			const accent = band ? GLOW[band] : "#3ee07a";
			faces.forEach((f) => {
				if (f.nz <= .02) return;
				const lit = Math.max(.12, f.nx * L[0] + f.ny * L[1] + f.nz * L[2]);
				const proj = (p) => {
					const persp = 1.35 / (1.35 - p[2] * .55);
					return [cx + p[0] * scale * persp, cy - p[1] * scale * persp];
				};
				const pa = proj(f.a);
				const pb = proj(f.b);
				const pc = proj(f.c);
				ctx.beginPath();
				ctx.moveTo(pa[0], pa[1]);
				ctx.lineTo(pb[0], pb[1]);
				ctx.lineTo(pc[0], pc[1]);
				ctx.closePath();
				const g = Math.round(18 + lit * 70);
				const e = Math.round(40 + lit * 90);
				ctx.fillStyle = `rgb(${g},${e},${Math.round(g * 1.05)})`;
				if (band === "crit" && !spinning) ctx.fillStyle = `rgb(${Math.round(20 + lit * 30)},${Math.round(90 + lit * 140)},${Math.round(50 + lit * 80)})`;
				if ((band === "fumble" || band === "fail") && !spinning) ctx.fillStyle = `rgb(${Math.round(70 + lit * 90)},${Math.round(18 + lit * 20)},${Math.round(18 + lit * 20)})`;
				ctx.fill();
				ctx.strokeStyle = accent;
				ctx.globalAlpha = .35 + lit * .4;
				ctx.lineWidth = 1;
				ctx.stroke();
				ctx.globalAlpha = 1;
				const mx = (pa[0] + pb[0] + pc[0]) / 3;
				const my = (pa[1] + pb[1] + pc[1]) / 3;
				if (f.nz > .35 && size >= 56) {
					ctx.fillStyle = "rgba(231,243,234,0.92)";
					ctx.font = `700 ${Math.max(8, size * .11)}px Syne, sans-serif`;
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					ctx.fillText(String(spinning ? f.n : f.n), mx, my);
				}
			});
			raf = requestAnimationFrame(draw);
		};
		raf = requestAnimationFrame(draw);
		return () => cancelAnimationFrame(raf);
	}, [
		size,
		spinning,
		value,
		band
	]);
	const show = spinning ? "?" : value ?? "—";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("relative flex flex-col items-center gap-2", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			style: {
				width: size,
				height: size
			},
			"aria-hidden": true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "size-full",
				style: {
					width: size,
					height: size
				}
			}), size >= 80 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("pointer-events-none absolute inset-x-0 top-[38%] text-center font-display tabular-nums leading-none", spinning ? "text-paper/80" : "text-paper", band === "crit" && "text-ember-bright", (band === "fumble" || band === "fail") && "text-danger"),
				style: {
					fontSize: size * .34,
					textShadow: "0 2px 10px rgba(0,0,0,0.85)"
				},
				children: show
			}) : null]
		}), band && !spinning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "font-display text-[10px] uppercase tracking-[0.2em] text-muted",
			children: BAND_LABEL[band]
		}) : null]
	});
}
function MoonCrest({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 64 64",
		className: cn("text-ember", className),
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "32",
				cy: "32",
				r: "30",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M38 12c10 4 16 14 16 24 0 14-12 26-26 26-6 0-12-2-16-6 8 2 18-2 22-10 5-10 4-22 4-34z",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "44",
				cy: "20",
				r: "2.2",
				fill: "currentColor"
			})
		]
	});
}
function hashStr(s) {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) | 0;
	return Math.abs(h);
}
function Portrait({ op, size = 40, className }) {
	const h = hashStr(op.id + op.name);
	const ox = (h % 9 - 4) * 1.7;
	const oy = ((h >> 3) % 7 - 3) * 1.3;
	const initials = op.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
	const tone = op.status === "dead" ? "text-muted" : op.status === "downed" ? "text-danger" : op.status === "deployed" ? "text-ember-bright" : "text-ember";
	const ring = op.status === "dead" ? "shadow-[0_0_0_1px_var(--color-line)]" : op.status === "downed" ? "shadow-[0_0_0_1px_var(--color-danger)]" : op.status === "deployed" ? "shadow-[0_0_0_1px_var(--color-ember)]" : "shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-ok)_65%,transparent)]";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("relative inline-flex shrink-0 items-center justify-center overflow-visible", className),
		style: {
			width: size,
			height: size
		},
		"aria-hidden": true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: cn("flex size-full items-center justify-center overflow-hidden rounded-full bg-ink", ring),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 48 48",
				className: cn("absolute inset-0 size-full", tone),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "24",
						cy: "24",
						r: "22",
						fill: "var(--color-raised)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: 28 + ox,
						cy: 20 + oy,
						r: "13",
						fill: "currentColor",
						opacity: "0.88"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: 20 + ox * .35,
						cy: 22 + oy * .35,
						r: "11",
						fill: "var(--color-ink)"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "relative z-[1] font-display tracking-wider text-paper",
				style: { fontSize: Math.max(10, size * .28) },
				children: initials
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-surface text-ember shadow-[var(--shadow-border)]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClassGlyph, {
				cls: op.cls,
				className: "size-2.5"
			})
		})]
	});
}
function FloatNum({ n, kind = "dmg", tick }) {
	if (!n) return null;
	const tone = kind === "heal" || kind === "coin" && n > 0 ? "text-ok" : "text-danger";
	const sign = kind === "dmg" ? "−" : "+";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("ms-dmg pointer-events-none absolute left-1/2 top-1 z-10 font-display text-xl tabular-nums", tone),
		children: [sign, Math.abs(n)]
	}, tick);
}
function ClassGlyph({ cls, className }) {
	const I = {
		Warrior: Sword,
		Wizard: Sparkles,
		Rogue: Crosshair,
		Healer: HeartPulse,
		Merchant: Scale,
		Bard: Music
	}[cls];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(I, { className: cn("size-4", className) });
}
function HpBar({ hp, max, className }) {
	const pct = Math.max(0, Math.min(100, hp / Math.max(1, max) * 100));
	const tone = pct > 60 ? "bg-ok" : pct > 30 ? "bg-ember" : "bg-danger";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("h-1.5 w-full overflow-hidden rounded-full bg-ink", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("h-full rounded-full transition-[width] duration-300 ease-out", tone),
			style: { width: `${pct}%` }
		})
	});
}
function StatGrid({ stats, primary }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-7 gap-1",
		children: Object.keys(stats).map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("rounded-[var(--radius-xs)] bg-ink/60 px-1 py-1.5 text-center", primary === k && "shadow-[var(--shadow-border-hover)]"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-display text-[9px] tracking-wider text-muted",
				children: k
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-display text-sm tabular-nums text-paper",
				children: stats[k]
			})]
		}, k))
	});
}
function RarityMark({ rarity }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("font-display text-[10px] uppercase tracking-[0.16em]", {
			Common: "text-muted",
			Uncommon: "text-ok",
			Rare: "text-moon",
			Legendary: "text-ember",
			Mythic: "text-void",
			Cursed: "text-danger"
		}[rarity]),
		children: rarity
	});
}
function ItemLine({ item }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start justify-between gap-3 py-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "truncate text-sm text-paper",
				children: [item.name, item.equipped ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-2 text-[10px] uppercase tracking-wider text-ember",
					children: "equipped"
				}) : null]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-xs text-muted",
				children: [
					item.kind,
					" · ",
					item.condition,
					item.damage ? ` · ${item.damage}` : "",
					item.defense ? ` · +${item.defense} DEF` : ""
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RarityMark, { rarity: item.rarity })]
	});
}
function Panel({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: cn("rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)] md:p-5", className),
		children
	});
}
function SectionLabel({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mb-3 font-display text-[10px] uppercase tracking-[0.22em] text-ember",
		children
	});
}
function StatusPill({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("font-display text-[10px] uppercase tracking-[0.16em]", status === "idle" ? "text-ok" : status === "deployed" ? "text-ember" : status === "downed" ? "text-danger" : status === "dead" ? "text-muted" : "text-moon"),
		children: status
	});
}
function CapMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 16 16",
		className: cn("inline-block size-3.5 shrink-0", className),
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "8",
				cy: "8",
				r: "7",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "8",
				cy: "8",
				r: "3.2",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.1"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 1.4l.7 1.6M8 14.6l.7-1.6M1.4 8l1.6.7M14.6 8l-1.6.7M3.1 3.1l1.3 1.1M12.9 12.9l-1.3-1.1M3.1 12.9l1.3-1.1M12.9 3.1l-1.3 1.1",
				stroke: "currentColor",
				strokeWidth: "1.1",
				strokeLinecap: "round"
			})
		]
	});
}
function Coin({ n }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-1 tabular-nums",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CapMark, { className: "text-ember" }), n.toLocaleString()]
	});
}
function LiveCoin({ n, className }) {
	const prev = (0, import_react.useRef)(n);
	const [delta, setDelta] = (0, import_react.useState)(0);
	const [bump, setBump] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const d = n - prev.current;
		prev.current = n;
		if (!d) return;
		setDelta(d);
		setBump((b) => b + 1);
		const t = window.setTimeout(() => setDelta(0), 700);
		return () => window.clearTimeout(t);
	}, [n]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("relative inline-flex items-baseline gap-1 tabular-nums", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CapMark, { className: "translate-y-[1px] text-ember" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "inline-block animate-[ms-coin_220ms_var(--ease-smooth-out)]",
				children: n.toLocaleString()
			}, bump),
			delta ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: cn("ms-float pointer-events-none absolute -top-3 right-0 font-display text-[10px]", delta > 0 ? "text-ok" : "text-danger"),
				children: [delta > 0 ? "+" : "", delta]
			}) : null
		]
	});
}
function LevelPips({ level, max = 3 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "inline-flex gap-1",
		"aria-label": `Level ${level} of ${max}`,
		children: Array.from({ length: max }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-1.5 rounded-full", i < level ? "bg-ember" : "bg-line") }, i))
	});
}
function Chip({ active, children, onClick, disabled, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		disabled,
		onClick: () => {
			if (disabled) return;
			sfx.click();
			onClick?.();
		},
		className: cn("min-h-11 rounded-full px-3.5 font-display text-[10px] uppercase tracking-[0.16em] transition-colors duration-150 disabled:opacity-30", active ? "bg-ember text-ink" : "bg-ink text-muted hover:text-paper", className),
		children
	});
}
function ToastHost() {
	const toast = useGame((g) => g.s.toast);
	const clear = useGame((g) => g.toastClear);
	(0, import_react.useEffect)(() => {
		if (!toast) return;
		const t = setTimeout(clear, 2800);
		return () => clearTimeout(t);
	}, [toast, clear]);
	if (!toast) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none fixed bottom-32 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 md:bottom-20",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "ms-rise ms-shake rounded-[var(--radius-md)] bg-panel px-4 py-3 text-center text-sm text-paper shadow-[var(--shadow-border-hover)]",
			children: toast
		})
	});
}
function MissionOverlay() {
	const mission = useGame((g) => g.s.mission);
	const combat = useGame((g) => g.s.combat);
	const ops = useGame((g) => g.s.operatives);
	const rollBeat = useGame((g) => g.rollBeat);
	const cont = useGame((g) => g.continueMission);
	const [spin, setSpin] = (0, import_react.useState)(false);
	const waiting = !!mission?.waiting;
	const open = !!mission && !combat;
	const onRoll = () => {
		if (!useGame.getState().s.mission?.waiting || spin) return;
		setSpin(true);
		sfx.dice();
		rumble(10);
		window.setTimeout(() => {
			rollBeat();
			setSpin(false);
			const b = useGame.getState().s.mission?.lastRoll?.band;
			if (b === "crit") {
				sfx.crit();
				rumble(28);
			} else if (b === "fumble" || b === "fail") {
				sfx.hurt();
				rumble(18);
			} else if (b === "strong") sfx.win();
		}, 920);
	};
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.repeat) return;
			if (e.target?.closest("input, textarea, select")) return;
			if (e.key === " " || e.key === "Enter") {
				e.preventDefault();
				if (waiting) onRoll();
				else {
					sfx.click();
					cont();
				}
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		open,
		waiting,
		spin,
		cont,
		rollBeat
	]);
	if (!mission || combat) return null;
	const beat = mission.beats[mission.beatIndex];
	const last = mission.beatIndex >= mission.beats.length - 1;
	const lead = ops.find((o) => o.id === mission.partyIds[0]);
	const loc = locById(mission.locationId);
	const leadStats = lead ? computeStats(lead) : null;
	const party = mission.partyIds.map((id) => ops.find((o) => o.id === id)).filter(Boolean);
	const partyDown = party.length > 0 && party.every((o) => o.hp <= 0 || o.status === "dead");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 flex items-end justify-center bg-ink/80 p-3 md:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "ms-pop max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-xl)] bg-surface p-5 shadow-[var(--shadow-border)] ms-scroll",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-display text-[10px] uppercase tracking-[0.22em] text-ember",
						children: [
							loc.short,
							" · ",
							mission.kind,
							" · beat ",
							mission.beatIndex + 1,
							"/",
							mission.beats.length
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-xl",
						children: beat?.title ?? "Return"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-right text-xs text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coin, { n: mission.coins })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex gap-2",
					children: party.map((op) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portrait, {
							op,
							size: 28
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden text-[11px] text-muted sm:inline",
							children: op.name
						})]
					}, op.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex gap-1.5",
					children: mission.beats.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("h-1.5 flex-1 rounded-full", i < mission.beatIndex ? "bg-ok" : i === mission.beatIndex ? "bg-ember" : "bg-line") }, `${b.id}-${i}`))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-[15px] leading-relaxed text-moon",
					children: beat?.prompt
				}),
				beat && lead ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "rounded-full bg-ink px-2 py-1 text-ember",
						children: [
							beat.stat,
							" ",
							leadStats ? leadStats[beat.stat] : "",
							" · DC ",
							beat.dc
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [lead.name, " rolls"] })]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 flex justify-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dice20, {
						value: mission.lastRoll?.value,
						band: mission.lastRoll?.band,
						spinning: spin,
						size: 128
					})
				}),
				mission.lastRoll ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-center text-sm text-muted",
					children: [
						mission.lastRoll.text,
						". ",
						BAND_COPY[mission.lastRoll.band]
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-1.5 text-sm text-muted",
					children: mission.narrative.slice(-4).map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: i === mission.narrative.slice(-4).length - 1 ? "text-paper" : "",
						children: n
					}, i))
				}),
				mission.loot.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 border-t border-line pt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Recovered" }), mission.loot.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemLine, { item: it }, it.id))]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5",
					children: mission.waiting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						variant: "ember",
						onClick: onRoll,
						disabled: spin,
						sound: "none",
						autoFocus: true,
						children: "Roll d20"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						sound: "none",
						autoFocus: true,
						onClick: () => {
							sfx.click();
							cont();
						},
						children: last || partyDown ? "Return to HQ" : "Continue"
					})
				})
			]
		})
	});
}
var ACT_SHORT = {
	strike: "d20 vs DC",
	guard: "+2 DEF",
	skill: "Signature",
	gift: "Once / day",
	item: "Consumable",
	flee: "SPD check"
};
var ACT_HELP = {
	strike: "d20 + primary vs DC. Steel talks.",
	guard: "Hold. +2 DEF this round.",
	skill: "Signature. The thing they are known for.",
	gift: "Once per day. Do not waste it.",
	item: "Burn a consumable from the rucksack.",
	flee: "SPD check. Shame is cheaper than a grave."
};
function CombatOverlay() {
	const combat = useGame((g) => g.s.combat);
	const s = useGame((g) => g.s);
	const act = useGame((g) => g.combatAct);
	const extract = useGame((g) => g.extractCombat);
	const [flash, setFlash] = (0, import_react.useState)(false);
	const [help, setHelp] = (0, import_react.useState)("strike");
	const [float, setFloat] = (0, import_react.useState)({
		n: 0,
		tick: 0
	});
	const [hurtId, setHurtId] = (0, import_react.useState)(null);
	const [lock, setLock] = (0, import_react.useState)(false);
	const lockRef = (0, import_react.useRef)(false);
	const prevHp = (0, import_react.useRef)(null);
	const prevParty = (0, import_react.useRef)({});
	(0, import_react.useEffect)(() => {
		if (!combat) return;
		setFlash(true);
		const t = window.setTimeout(() => setFlash(false), 280);
		return () => window.clearTimeout(t);
	}, [combat?.log.length, combat]);
	const enemy = combat?.enemies.find((e) => e.hp > 0) ?? combat?.enemies[0];
	(0, import_react.useEffect)(() => {
		if (!enemy) return;
		if (prevHp.current != null && prevHp.current !== enemy.hp) setFloat({
			n: prevHp.current - enemy.hp,
			tick: Date.now()
		});
		prevHp.current = enemy.hp;
	}, [enemy?.hp, enemy]);
	(0, import_react.useEffect)(() => {
		if (!combat) {
			lockRef.current = false;
			setLock(false);
			prevParty.current = {};
			return;
		}
		const next = {};
		combat.partyIds.forEach((id) => {
			const hp = s.operatives.find((o) => o.id === id)?.hp ?? 0;
			next[id] = hp;
			const prev = prevParty.current[id];
			if (prev != null && hp < prev) setHurtId(id);
		});
		prevParty.current = next;
	}, [combat, s.operatives]);
	(0, import_react.useEffect)(() => {
		if (!hurtId) return;
		const t = window.setTimeout(() => setHurtId(null), 320);
		return () => window.clearTimeout(t);
	}, [hurtId]);
	const go = (a) => {
		if (lockRef.current) return;
		const before = useGame.getState().s;
		if (!before.combat) return;
		const eHp = before.combat.enemies.find((e) => e.hp > 0)?.hp ?? before.combat.enemies[0]?.hp ?? 0;
		const pHp = before.combat.partyIds.reduce((n, id) => {
			return n + (before.operatives.find((x) => x.id === id)?.hp ?? 0);
		}, 0);
		lockRef.current = true;
		setLock(true);
		act(a);
		const after = useGame.getState().s;
		const eHp2 = after.combat?.enemies.find((e) => e.hp > 0)?.hp ?? after.combat?.enemies[0]?.hp ?? 0;
		const pHp2 = (after.combat?.partyIds ?? []).reduce((n, id) => {
			return n + (after.operatives.find((x) => x.id === id)?.hp ?? 0);
		}, 0);
		const line = (after.combat?.log ?? []).at(-1) ?? "";
		if (after.combat) {
			if (eHp2 < eHp) {
				if (line.includes("Critical")) {
					sfx.crit();
					rumble(28);
				} else {
					sfx.hit();
					rumble(12);
				}
			} else if (a === "strike" || a === "skill") sfx.miss();
			else if (a === "item") sfx.coin();
			else if (a === "gift") sfx.dice();
			else if (a === "flee") sfx.whoosh();
			else sfx.click();
			if (pHp2 < pHp) {
				sfx.hurt();
				rumble(20);
			}
		}
		window.setTimeout(() => {
			lockRef.current = false;
			setLock(false);
		}, 260);
	};
	(0, import_react.useEffect)(() => {
		if (!combat) return;
		const onKey = (e) => {
			if (e.repeat || lockRef.current) return;
			if (e.target?.closest("input, textarea, select")) return;
			const actorNow = combatActor(useGame.getState().s);
			if (!actorNow || actorNow.hp <= 0) {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					extract();
				}
				return;
			}
			const a = {
				"1": "strike",
				"2": "guard",
				"3": "skill",
				"4": "gift",
				"5": "item",
				"6": "flee"
			}[e.key];
			if (!a) return;
			e.preventDefault();
			if (a === "gift" && actorNow.giftUsed) return;
			if (a === "item" && !actorNow.inventory.some((i) => i.kind === "consumable")) return;
			setHelp(a);
			go(a);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [combat, extract]);
	if (!combat) return null;
	const actor = combatActor(s);
	const party = combat.partyIds.map((id) => s.operatives.find((o) => o.id === id)).filter(Boolean);
	const v = combat.bossId ? villainById(combat.bossId) : null;
	const phase = v && enemy ? v.phases[Math.min(enemy.phase ?? 0, v.phases.length - 1)] : null;
	const hasItem = !!actor?.inventory.some((i) => i.kind === "consumable");
	const actions = actor ? [
		{
			id: "strike",
			label: "Strike",
			icon: Swords,
			variant: "ember"
		},
		{
			id: "guard",
			label: "Guard",
			icon: Shield,
			variant: "ghost"
		},
		{
			id: "skill",
			label: actor.skillName,
			icon: Sparkles,
			variant: "ghost"
		},
		{
			id: "gift",
			label: CLASS_GIFT[actor.cls].name,
			icon: Heart,
			variant: "ghost",
			disabled: actor.giftUsed
		},
		{
			id: "item",
			label: "Item",
			icon: Package,
			variant: "quiet",
			disabled: !hasItem
		},
		{
			id: "flee",
			label: "Flee",
			icon: Wind,
			variant: "danger"
		}
	] : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 flex items-end justify-center bg-ink/85 p-3 md:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("ms-pop max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-xl)] bg-surface p-5 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-danger)_40%,transparent)] ms-scroll", flash && "ms-hit ms-shake"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "font-display text-[10px] uppercase tracking-[0.22em] text-danger",
							children: ["Contact · round ", combat.turn]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 font-display text-xl",
							children: enemy?.name
						}),
						v ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								v.title,
								" · ",
								v.arc
							]
						}) : null,
						phase ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-display text-[10px] uppercase tracking-wider text-ember",
							children: phase.name
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm italic text-moon",
							children: enemy?.flavor
						}),
						enemy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HpBar, {
							hp: enemy.hp,
							max: enemy.maxHp,
							className: "mt-3 h-2.5"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 text-xs tabular-nums text-muted",
							children: [
								enemy?.hp,
								"/",
								enemy?.maxHp,
								" · DC ",
								enemy?.dc,
								combat.enemies.length > 1 ? ` · ${combat.enemies.filter((e) => e.hp > 0).length}/${combat.enemies.length} standing` : ""
							]
						}),
						float.n ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatNum, {
							n: float.n,
							kind: float.n > 0 ? "dmg" : "heal",
							tick: float.tick
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 grid gap-2",
					children: party.map((op) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 transition-colors duration-150", actor?.id === op.id ? "bg-ember/10 shadow-[var(--shadow-border-hover)]" : "shadow-[var(--shadow-border)]", hurtId === op.id && "ms-hit"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portrait, {
							op,
							size: 36
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "truncate",
									children: [op.name, actor?.id === op.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "ml-2 font-display text-[9px] uppercase tracking-wider text-ember",
										children: "acting"
									}) : null]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "tabular-nums text-muted",
									children: [
										op.hp,
										"/",
										op.maxHp
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HpBar, {
								hp: op.hp,
								max: op.maxHp,
								className: "mt-1"
							})]
						})]
					}, op.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 max-h-28 space-y-1 overflow-y-auto text-sm text-muted ms-scroll",
					"aria-live": "polite",
					children: combat.log.slice(-6).map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: i === combat.log.slice(-6).length - 1 ? "text-paper" : "",
						children: line
					}, i))
				}),
				actor && actor.hp > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-moon",
						children: ACT_HELP[help]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-display text-[10px] uppercase tracking-[0.16em] text-muted",
						children: "Keys 1–6"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 grid grid-cols-2 gap-2",
						children: actions.map((a) => {
							const Icon = a.icon;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								disabled: a.disabled || lock,
								onClick: () => {
									setHelp(a.id);
									go(a.id);
								},
								className: cn("flex min-h-14 flex-col items-start justify-center rounded-[var(--radius-sm)] px-3 py-2 text-left transition-transform active:scale-[0.96] disabled:opacity-40", a.variant === "ember" && "bg-ember text-ink", a.variant === "ghost" && "bg-transparent text-paper shadow-[var(--shadow-border)]", a.variant === "quiet" && "bg-raised text-muted", a.variant === "danger" && "bg-danger/15 text-danger"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-2 font-display text-[11px] uppercase tracking-[0.14em]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }),
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "truncate",
											children: a.label
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-0.5 font-body text-[11px] normal-case tracking-normal text-current/70",
									children: ACT_SHORT[a.id]
								})]
							}, a.id);
						})
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-danger",
						children: "No one standing."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-3 w-full",
						variant: "danger",
						sound: "none",
						onClick: () => {
							sfx.whoosh();
							extract();
						},
						children: "Extract the fallen"
					})]
				})
			]
		})
	});
}
function OperativeSheet() {
	const s = useGame((g) => g.s);
	const select = useGame((g) => g.selectOp);
	const equip = useGame((g) => g.equipItem);
	const stash = useGame((g) => g.stashItem);
	const take = useGame((g) => g.takeFromVault);
	const heal = useGame((g) => g.healOp);
	const stab = useGame((g) => g.stabilize);
	const repair = useGame((g) => g.repairItem);
	const bond = useGame((g) => g.bondCompanion);
	const hof = useGame((g) => g.hof);
	const [tab, setTab] = (0, import_react.useState)("soul");
	const op = s.operatives.find((o) => o.id === s.selectedId);
	(0, import_react.useEffect)(() => {
		if (!op) return;
		const broken = op.inventory.some((i) => i.equipped && (i.condition === "Broken" || i.condition === "Damaged"));
		setTab(broken ? "kit" : "soul");
	}, [op?.id]);
	if (!op || s.mission || s.combat) return null;
	const stats = computeStats(op);
	const fail = (m) => {
		if (m) {
			sfx.hurt();
			useGame.setState((st) => ({ s: {
				...st.s,
				toast: m
			} }));
		} else sfx.coin();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-30 flex justify-end bg-ink/50",
		onClick: () => select(null),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "ms-sheet h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface p-5 ms-scroll",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sticky top-0 z-10 -mx-5 -mt-5 mb-4 flex items-start justify-between bg-surface/95 px-5 pt-5 backdrop-blur-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portrait, {
							op,
							size: 52
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.2em] text-ember",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClassGlyph, { cls: op.cls }),
									" ",
									op.cls
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 font-display text-2xl",
								children: op.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [
									op.race,
									" · ",
									op.lineage,
									" · ",
									op.origin
								]
							})
						] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "quiet",
						size: "sm",
						onClick: () => select(null),
						"aria-label": "Close dossier",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-1 flex items-center justify-between text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "tabular-nums",
						children: [
							"HP ",
							op.hp,
							"/",
							op.maxHp
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: op.repTitle
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HpBar, {
					hp: op.hp,
					max: op.maxHp,
					className: "mt-2 h-2"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatGrid, {
						stats,
						primary: PRIMARY_STAT[op.cls]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid grid-cols-3 gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ghost",
							size: "sm",
							className: op.status === "downed" || op.hp < op.maxHp ? "ms-nudge" : void 0,
							onClick: () => fail(heal(op.id)),
							disabled: op.hp >= op.maxHp || op.hp < op.maxHp && s.coins < healCost(s, op.maxHp - op.hp),
							children: ["Treat", op.hp < op.maxHp ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [" · ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coin, { n: healCost(s, op.maxHp - op.hp) })] }) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: () => fail(stab(op.id)),
							disabled: op.status !== "downed" || s.rooms.infirmary < 1 && s.coins < 180,
							children: ["Stabilise", op.status === "downed" && s.rooms.infirmary < 1 ? " · 180 caps" : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "quiet",
							size: "sm",
							onClick: () => hof(op.id),
							children: "Fame"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 flex gap-2",
					children: [
						"soul",
						"kit",
						"bonds"
					].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							sfx.click();
							setTab(t);
						},
						className: cn("flex-1 rounded-full py-2 font-display text-[10px] uppercase tracking-[0.16em]", tab === t ? "bg-ember text-ink" : "bg-raised text-muted"),
						children: t
					}, t))
				}),
				tab === "soul" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
							className: "bg-raised",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionLabel, { children: ["Gift · ", CLASS_GIFT[op.cls].name] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-moon",
								children: [
									CLASS_GIFT[op.cls].desc,
									" ",
									op.giftUsed ? "Spent today." : "Ready."
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
							className: "bg-raised",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionLabel, { children: ["Signature · ", op.skillName] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm",
								children: op.skillDesc
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
							className: "bg-raised",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionLabel, { children: ["Enchantment · ", op.enchantName] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm",
								children: op.enchantDesc
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
							className: "bg-raised",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionLabel, { children: ["Shadow · ", op.shadowName] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: op.shadowDesc
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
							className: "bg-raised",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Destiny" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm italic text-moon",
								children: op.destiny
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: op.repPassive
						})
					]
				}) : null,
				tab === "kit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Rucksack" }),
						op.inventory.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Empty."
						}) : null,
						op.inventory.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-b border-line/60 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemLine, { item: it }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex flex-wrap gap-2",
								children: [
									it.slot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "quiet",
										size: "sm",
										onClick: () => equip(op.id, it.id),
										children: it.equipped ? "Unequip" : "Equip"
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "quiet",
										size: "sm",
										onClick: () => fail(stash(op.id, it.id)),
										children: "Vault"
									}),
									it.condition !== "Pristine" && it.kind === "weapon" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "sm",
										onClick: () => fail(repair(op.id, it.id)),
										children: "Repair"
									}) : null
								]
							})]
						}, it.id)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Vault" }),
								s.vault.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "Nothing stored."
								}) : null,
								s.vault.slice(0, 8).map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-2 py-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm",
										children: [
											it.name,
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RarityMark, { rarity: it.rarity })
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "quiet",
										size: "sm",
										onClick: () => fail(take(op.id, it.id)),
										children: "Take"
									})]
								}, it.id))
							]
						})
					]
				}) : null,
				tab === "bonds" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Companion" }), op.companion ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						className: "bg-raised",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-sm",
								children: op.companion.type
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [
									op.companion.hp,
									"/",
									op.companion.maxHp,
									" · ",
									op.companion.status
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-moon",
								children: COMPANIONS[op.companion.type]?.desc
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted",
								children: COMPANIONS[op.companion.type]?.passive
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-2",
						children: Object.values(COMPANIONS).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								sfx.click();
								fail(bond(op.id, c.name));
							},
							className: "rounded-[var(--radius-md)] bg-raised p-3 text-left shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-display text-sm",
									children: c.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs tabular-nums text-ember",
									children: [c.cost, "c"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted",
								children: c.desc
							})]
						}, c.name))
					})]
				}) : null
			]
		})
	});
}
function RestConfirm() {
	const open = useGame((g) => g.confirmRest);
	const rest = useGame((g) => g.rest);
	const cancel = useGame((g) => g.cancelRest);
	const select = useGame((g) => g.selectOp);
	const setScreen = useGame((g) => g.setScreen);
	const downedNames = useGame((g) => g.s.operatives.filter((o) => o.status === "downed").map((o) => o.name).join(", "));
	const downedId = useGame((g) => g.s.operatives.find((o) => o.status === "downed")?.id ?? null);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key === "Escape") cancel();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, cancel]);
	if (!open) return null;
	const many = downedNames.includes(",");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 md:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "ms-pop w-full max-w-md rounded-[var(--radius-xl)] bg-surface p-5 shadow-[var(--shadow-border)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl",
					children: "Dawn is a decision"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-sm leading-relaxed text-moon",
					children: [
						downedNames || "Someone",
						" ",
						many ? "are" : "is",
						" downed. Resting without an Infirmary kills them for good. Treat them from the dossier, or raise an Infirmary, before you sleep."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "danger",
						className: "flex-1",
						onClick: () => {
							sfx.click();
							rest();
						},
						children: "Rest anyway"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "quiet",
						className: "flex-1",
						onClick: cancel,
						children: "Hold"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ember",
					className: "mt-2 w-full",
					onClick: () => {
						cancel();
						if (downedId) select(downedId);
						setScreen("roster");
					},
					children: "Treat the downed"
				})
			]
		})
	});
}
function TalkOverlay() {
	const talk = useGame((g) => g.s.talk);
	const state = useGame((g) => g.s);
	const advance = useGame((g) => g.advanceTalk);
	const skip = useGame((g) => g.skipTalk);
	const line = talk ? TALK[talk.script]?.[talk.i] : null;
	const [shown, setShown] = (0, import_react.useState)("");
	const shownRef = (0, import_react.useRef)("");
	const skipType = (0, import_react.useRef)(false);
	const full = line ? renderTalk(line.text, state) : "";
	const locked = isTalkLocked(state);
	const pregame = isPregameTalk(state);
	const total = talk ? TALK[talk.script]?.length ?? 1 : 1;
	shownRef.current = shown;
	const revealOrAdvance = () => {
		if (shownRef.current.length < full.length) {
			skipType.current = true;
			setShown(full);
			shownRef.current = full;
			return;
		}
		sfx.click();
		advance();
	};
	(0, import_react.useEffect)(() => {
		if (!full) {
			setShown("");
			return;
		}
		skipType.current = false;
		setShown("");
		shownRef.current = "";
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setShown(full);
			shownRef.current = full;
			return;
		}
		let i = 0;
		const id = window.setInterval(() => {
			if (skipType.current) {
				window.clearInterval(id);
				return;
			}
			i += 1;
			const next = full.slice(0, i);
			shownRef.current = next;
			setShown(next);
			if (i >= full.length) window.clearInterval(id);
		}, 16);
		return () => window.clearInterval(id);
	}, [
		full,
		talk?.script,
		talk?.i
	]);
	(0, import_react.useEffect)(() => {
		if (!talk) return;
		const onKey = (e) => {
			if (e.repeat) return;
			if (e.target?.closest("input, textarea, select")) return;
			if (e.key === "Escape") {
				e.preventDefault();
				if (shown.length < full.length) setShown(full);
				else if (!locked) skip();
				return;
			}
			if (e.key === " " || e.key === "Enter") {
				e.preventDefault();
				revealOrAdvance();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		talk,
		shown,
		full,
		advance,
		skip,
		locked
	]);
	if (!talk || !line) return null;
	const last = talk.i >= total - 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [pregame ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[44] bg-ink/50",
		"aria-hidden": true
	}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-x-0 bottom-0 z-[45] p-3 pb-[max(12px,env(safe-area-inset-bottom))] md:p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "mx-auto flex w-full max-w-2xl items-end gap-3 rounded-[var(--radius-xl)] bg-ink/92 p-3 text-left shadow-[var(--shadow-border-hover)] backdrop-blur-md md:p-4",
			onClick: revealOrAdvance,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "/art/tyrone.jpg",
				alt: "",
				className: "size-16 shrink-0 rounded-[var(--radius-md)] object-cover shadow-[var(--shadow-border)] md:size-20"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-[10px] uppercase tracking-[0.28em] text-ember",
							children: line.who
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-mono text-[10px] tabular-nums text-muted",
							children: [
								talk.i + 1,
								"/",
								total
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 min-h-16 text-[15px] leading-relaxed text-paper",
						children: [shown, shown.length < full.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "term-cursor ml-0.5" }) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex gap-1",
						children: Array.from({ length: total }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("h-1 flex-1 rounded-full", i < talk.i ? "bg-ember/70" : i === talk.i ? "bg-ember" : "bg-line") }, i))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-display text-[10px] uppercase tracking-[0.18em] text-muted",
						children: locked && last ? "Tap to enter the ranch" : last ? "Tap to close" : locked ? "Tap to continue · listen" : "Tap to continue"
					})
				]
			})]
		}), !locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto mt-2 flex w-full max-w-2xl justify-end",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "quiet",
				onClick: () => skip(),
				children: "Skip"
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mx-auto mt-2 w-full max-w-2xl text-right font-display text-[10px] uppercase tracking-[0.18em] text-muted",
			children: "First porch talk · no shortcuts"
		})]
	})] });
}
function HelpFab() {
	const talk = useGame((g) => g.s.talk);
	const locked = useGame((g) => isTalkLocked(g.s));
	const screen = useGame((g) => g.s.screen);
	const overlay = useGame((g) => !!g.s.combat || !!g.s.mission);
	const open = useGame((g) => g.openGuide);
	if (talk && locked) return null;
	if (screen === "rules") return null;
	const porch = screen === "title" || screen === "briefing";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": "Ask Tyrone",
		"data-help": "1",
		onClick: () => {
			sfx.click();
			open();
		},
		className: cn("ms-help fixed z-[42] inline-flex size-12 items-center justify-center rounded-full bg-ink text-ember", porch ? "left-3 top-3 md:right-6 md:top-36" : "right-3 bottom-[5.5rem] md:right-6 md:bottom-6", !porch && !overlay && "md:hidden"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleHelp, { className: "size-5" })
	});
}
function FieldManual() {
	const open = useGame((g) => g.guideOpen);
	const close = useGame((g) => g.closeGuide);
	const ask = useGame((g) => g.askTyrone);
	const state = useGame((g) => g.s);
	const combat = !!state.combat || !!state.mission;
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key === "Escape") {
				e.preventDefault();
				close();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, close]);
	if (!open) return null;
	const id = scriptForScreen(state);
	const card = MANUAL[id] ?? MANUAL.hq;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[52] flex items-end justify-center bg-ink/70 p-3 md:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "ms-pop glass-strong w-full max-w-md rounded-[var(--radius-xl)] p-5 text-left",
			role: "dialog",
			"aria-label": card.title,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/art/tyrone.jpg",
							alt: "",
							className: "size-14 shrink-0 rounded-[var(--radius-sm)] object-cover shadow-[var(--shadow-border)]"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-[10px] uppercase tracking-[0.28em] text-ember",
								children: "Tyrone Bot · field manual"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 font-display text-xl text-paper",
								children: card.title
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Close",
							onClick: close,
							className: "inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:text-paper",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm leading-relaxed text-moon",
					children: card.blurb
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-2",
					children: card.tips.map((tip) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "rounded-[var(--radius-sm)] bg-ink/50 px-3 py-2 text-sm leading-relaxed text-paper shadow-[var(--shadow-border)]",
						children: tip
					}, tip))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ember",
						className: "w-full",
						onClick: () => {
							if (combat) {
								close();
								return;
							}
							ask(id);
						},
						children: combat ? "Understood" : "Walk me through it"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "quiet",
						className: "w-full",
						onClick: close,
						children: "Close"
					})]
				})
			]
		})
	});
}
function HelpChrome() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelpFab, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldManual, {})] });
}
var PACK_ICON = {
	bobby_pin: Pin,
	stimpak: Syringe,
	mentats: Pill,
	holotape: Disc3,
	sarsaparilla: Wine,
	probe_kit: Cpu
};
function fail(msg) {
	if (!msg) return;
	sfx.hurt();
	useGame.setState((st) => ({ s: {
		...st.s,
		toast: msg
	} }));
}
function copyText(text) {
	navigator.clipboard?.writeText(text);
}
function TitleBackdrop({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("picture", {
		className: "absolute inset-0 block size-full",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("source", {
			media: "(max-width: 700px)",
			srcSet: "/art/title-tall.jpg"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: "/art/title-wide.jpg",
			alt: "",
			className: cn("size-full object-cover", className)
		})]
	});
}
function TyroneHandshake() {
	const [origin, setOrigin] = (0, import_react.useState)("");
	const [copied, setCopied] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		setOrigin(window.location.origin);
	}, []);
	const example = origin ? stampedUrl(origin, {
		id: "123456789012345678",
		name: "Mira",
		caps: 2400,
		xp: 80
	}) : "https://your-game/?d=DISCORD_ID&n=NAME&caps=2400&xp=80";
	const snippet = `// Tyrone — stamp a rider into Hollow Realm
const origin = process.env.HOLLOW_REALM_URL; // this site
const u = new URL(origin);
u.searchParams.set("d", interaction.user.id);
u.searchParams.set("n", interaction.user.username);
u.searchParams.set("caps", String(caps));
u.searchParams.set("xp", String(xp));
await interaction.reply({ content: \`Your porch: \${u}\`, ephemeral: true });
fetch(\`\${origin}/api/tyrone/sync\`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    discord: interaction.user.id,
    name: interaction.user.username,
    caps,
    xp,
  }),
}).catch(() => {});`;
	const copy = (key, text) => {
		copyText(text);
		setCopied(key);
		window.setTimeout(() => setCopied(""), 1600);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		className: "bg-raised",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Tyrone API" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-moon",
				children: "Discord cannot see who clicked a generic link. Tyrone has to stamp a personal URL with their snowflake, name, and arcade totals. That URL is the login. Their black card paints on arrival."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "mt-3 list-decimal space-y-2 pl-5 text-sm text-moon",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						"Open",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "text-ember underline-offset-2 hover:underline",
							href: "https://discord.com/developers/applications",
							target: "_blank",
							rel: "noreferrer",
							children: "Discord Developer Portal"
						}),
						" ",
						"and use the Tyrone bot you already run."
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						"Set ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-ember",
							children: "HOLLOW_REALM_URL"
						}),
						" to this site:",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-paper",
							children: origin || "this porch"
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Add a slash command that replies with the stamped link. Copy the snippet below." })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 break-all font-mono text-[11px] text-ember",
				children: example
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					variant: "ghost",
					size: "sm",
					onClick: () => copy("url", example),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }),
						" ",
						copied === "url" ? "Copied" : "Copy link"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					variant: "quiet",
					size: "sm",
					onClick: () => copy("js", snippet),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }),
						" ",
						copied === "js" ? "Copied" : "Copy bot snippet"
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "mt-3 max-h-48 overflow-auto rounded-[var(--radius-sm)] bg-ink p-3 font-mono text-[10px] leading-relaxed text-muted ms-scroll",
				children: snippet
			})
		]
	});
}
function MainMenu() {
	const assume = useGame((g) => g.assumeCommand);
	const resume = useGame((g) => g.resumeSession);
	const started = useGame((g) => g.s.started);
	const setScreen = useGame((g) => g.setScreen);
	const day = useGame((g) => g.s.day);
	const coins = useGame((g) => g.s.coins);
	const level = useGame((g) => g.s.level);
	const xp = useGame((g) => g.s.xp);
	const xpToNext = useGame((g) => g.s.xpToNext);
	const ops = useGame((g) => g.s.operatives);
	const rooms = useGame((g) => g.s.rooms);
	const openTerminal = useGame((g) => g.openTerminal);
	const hack = useGame((g) => g.s.hack);
	const rider = useGame((g) => g.s.discordName);
	const riderId = useGame((g) => g.s.discordId);
	const handshake = useGame((g) => g.handshake);
	const squadN = useGame((g) => g.s.squad.length);
	const linkDiscord = useGame((g) => g.linkDiscord);
	const talking = useGame((g) => !!g.s.talk);
	const [ask, setAsk] = (0, import_react.useState)(false);
	const [link, setLink] = (0, import_react.useState)(false);
	const [did, setDid] = (0, import_react.useState)("");
	const [dname, setDname] = (0, import_react.useState)("");
	const roster = ops.filter((o) => o.status !== "dead").length;
	const beds = 3 + rooms.barracks * 2;
	const roomN = Object.values(rooms).filter((n) => n > 0).length;
	const boot = () => {
		unlockAudio();
		if (started) resume();
		else assume();
	};
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (ask || talking) {
				if (e.key === "Escape") setAsk(false);
				return;
			}
			if (e.target?.closest("input, textarea, select")) return;
			if (e.key === "Enter") boot();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		ask,
		started,
		talking
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex h-dvh flex-col overflow-hidden bg-ink text-paper",
		"data-ready": "1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TitleBackdrop, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "crt-scan absolute inset-0 opacity-20" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-ink)_12%,transparent),color-mix(in_oklab,var(--color-ink)_38%,transparent)_42%,color-mix(in_oklab,var(--color-ink)_88%,transparent)_78%,var(--color-ink))]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative z-[1] flex min-h-0 flex-1 flex-col justify-end px-4 pb-8 pt-16 md:justify-end md:px-10 md:pb-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex w-full max-w-lg flex-col gap-5 md:max-w-xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-end gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/art/tyrone.jpg",
							alt: "Tyrone Bot, S.Y.N.A.P.S.E T-0880",
							className: "size-20 rounded-[var(--radius-md)] object-cover shadow-[var(--shadow-border-hover)] md:size-24"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-[11px] uppercase tracking-[0.42em] text-ember",
									children: "S.Y.N.A.P.S.E T-0880"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
									className: "mt-1 font-display text-4xl tracking-[0.08em] text-paper md:text-5xl",
									children: ["HOLLOW", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-ember",
										children: "REALM"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-xs text-moon",
									children: "Tyrone keeps the porch light on."
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "glass-strong rounded-[var(--radius-xl)] p-4 md:p-5",
						children: [
							started ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Active file" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-display text-[10px] uppercase tracking-[0.18em] text-muted",
										children: [
											"Rank ",
											level,
											" · ",
											xp,
											"/",
											xpToNext,
											" XP"
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 grid grid-cols-4 gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileStat, {
											label: "Day",
											value: String(day)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileStat, {
											label: "Caps",
											value: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "inline-flex items-center justify-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CapMark, { className: "text-ember" }), coins.toLocaleString()]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileStat, {
											label: "Roster",
											value: `${roster}/${beds}`
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileStat, {
											label: "Rooms",
											value: String(roomN)
										})
									]
								}),
								squadN > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-3 font-display text-[10px] uppercase tracking-[0.18em] text-moon",
									children: [squadN, " riders on this file"]
								}) : null,
								riderId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-3 font-display text-[10px] uppercase tracking-[0.18em] text-ember",
									children: [
										"Linked ",
										rider,
										" · ",
										riderId,
										handshake && handshake.caps + handshake.xp > 0 ? ` · +${handshake.caps} caps · +${handshake.xp} XP` : " · file current"
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-xs leading-relaxed text-muted",
									children: "No rider on this CRT. Stamp a Discord link or paste an ID and the arcade floor lands before boot."
								})
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "No file on this CRT" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm leading-relaxed text-moon",
									children: "Howdy, partner. Assume command and I will walk you through the ranch before anybody rolls a die. The word is S.Y.N.A.P.S.E. Caps, loot, and the squad live in this vault — not the Games button."
								}),
								riderId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-3 font-display text-[10px] uppercase tracking-[0.18em] text-ember",
									children: [
										"Rider ",
										rider,
										" · ",
										riderId,
										" waiting"
									]
								}) : null
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 flex flex-col gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ember",
										size: "lg",
										className: "w-full",
										onClick: boot,
										disabled: talking,
										children: started ? `Resume · Day ${day}` : "Assume command"
									}),
									started ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										className: "w-full",
										onClick: () => setAsk(true),
										disabled: talking,
										children: "New file"
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "quiet",
											className: "w-full",
											onClick: () => setScreen("rules"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-4" }), " Rules"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "quiet",
											className: "w-full",
											onClick: () => setLink((v) => !v),
											children: riderId ? "Switch rider" : "Link rider"
										})]
									})
								]
							}),
							link ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "mt-3 space-y-2",
								onSubmit: (e) => {
									e.preventDefault();
									unlockAudio();
									linkDiscord(did, dname);
									setLink(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: dname,
									onChange: (e) => setDname(e.target.value),
									placeholder: "Player name",
									className: "min-h-11 w-full rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: did,
										onChange: (e) => setDid(e.target.value),
										placeholder: "Tyrone link, @handle, or snowflake",
										className: "min-h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "submit",
										variant: "ember",
										children: "Sit"
									})]
								})]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 font-display text-[10px] uppercase tracking-[0.22em] text-muted",
								children: "Resume · New · Rules · The word is SYNAPSE"
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => {
					unlockAudio();
					if (!started) {
						fail("Boot a file first. Then tap the CRT.");
						return;
					}
					const msg = openTerminal();
					if (msg) fail(msg);
				},
				className: "absolute right-3 top-3 z-[2] w-[7.5rem] overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-border)] transition-[box-shadow] hover:shadow-[var(--shadow-border-hover)] md:right-6 md:top-6 md:w-40",
				"aria-label": "Tap the SYNAPSE terminal",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/art/terminal.jpg",
					alt: "",
					className: "aspect-[4/3] w-full object-cover"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute inset-x-0 bottom-0 bg-ink/70 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ember",
					children: hack ? "LINK LIVE" : "SYNAPSE · NO SIGNAL"
				})]
			}),
			ask ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 md:items-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ms-pop glass-strong w-full max-w-md rounded-[var(--radius-xl)] p-5 text-left",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl",
							children: "Wipe this file?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm leading-relaxed text-moon",
							children: "Caps, vault, roster — gone. Tyrone will not remember them."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "danger",
								className: "flex-1",
								onClick: () => {
									useGame.getState().reset();
									setAsk(false);
									useGame.getState().assumeCommand();
								},
								children: "New file"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "quiet",
								className: "flex-1",
								onClick: () => setAsk(false),
								children: "Hold"
							})]
						})
					]
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TerminalOverlay, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TalkOverlay, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelpChrome, {})
		]
	});
}
function FileStat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[var(--radius-sm)] bg-ink/55 px-2 py-3 text-center shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "font-display text-lg tabular-nums text-paper",
			children: value
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 font-display text-[9px] uppercase tracking-[0.14em] text-muted",
			children: label
		})]
	});
}
function RulesView() {
	const setScreen = useGame((g) => g.setScreen);
	const started = useGame((g) => g.s.started);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex h-dvh flex-col bg-ink text-paper",
		"data-ready": "1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TitleBackdrop, { className: "opacity-30" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative z-[1] flex min-h-0 flex-1 flex-col",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center gap-3 px-4 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/art/tyrone.jpg",
						alt: "",
						className: "size-12 rounded-[var(--radius-sm)] object-cover"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-[10px] uppercase tracking-[0.28em] text-ember",
							children: "Tyrone Bot"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-xl",
							children: "How you play"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "quiet",
						size: "sm",
						onClick: () => setScreen("title"),
						children: "Menu"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "ms-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto w-full max-w-xl space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
							className: "glass-strong bg-transparent",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm leading-relaxed text-moon",
								children: "I hold the CRT. You hold the squad. The word is S.Y.N.A.P.S.E. Forge someone. Deploy them. Caps come home — or they do not. Tap the question mark on any screen and I will walk you through that porch."
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TyroneHandshake, {}),
						[
							{
								t: "S.Y.N.A.P.S.E",
								d: "That's the unit. That's the password. Seven letters on the CRT. I didn't say that."
							},
							{
								t: "Squad mode",
								d: "Load a file and run the compound. New file wipes the vault. Rules is this porch talk."
							},
							{
								t: "Discord rider",
								d: "A website cannot see who clicked a Discord link. Tyrone has to stamp a personal URL with your snowflake and arcade totals. Those numbers floor your vault before the menu paints. Same rider, same black card."
							},
							{
								t: "Bottle caps",
								d: "Cash. Stacks. Always drop on a win. You cannot Use them. They just count."
							},
							{
								t: "Vault /inv",
								d: "Profile → Vault. That's the Fallout pack. Use spends one. Gear still lives in rucksacks."
							},
							{
								t: "How it fills",
								d: "A clean win rolls loot: a few caps always, then a chance at the game's item. Mentats fatten the table."
							},
							{
								t: "Daily clocks",
								d: "Trivia lives, T/F lives, Unscramble boards. They are clocks, not items. Midnight Mountain refill."
							},
							{
								t: "Map",
								d: "Ironclad is the first pin — unlocked on day one. Veyra City is last. Drag to pan. Pinch or wheel to zoom."
							},
							{
								t: "Main ARC",
								d: "One file, many riders. Raid, bounty, and the chapter boss wait on whose turn it is. Scout and forage stay open. Sit as a rider from Squad."
							},
							{
								t: "Moon Squad card",
								d: "Ledger holds a 3D black card. Stamp a name and handle and the plate is yours. A new rider logging in sits a new plate. Drag to rotate, pinch to zoom, spin, double-tap to flip."
							},
							{
								t: "d20",
								d: "1 fumble. 2–4 fail. 5–9 weak. 10–14 success. 15–19 strong. 20 crit. The die tumbles. Wait for it."
							},
							{
								t: "Ask Tyrone",
								d: "The question mark is me. Tap it on any screen for a field manual, then Walk me through it if you want the porch talk. First briefing cannot be skipped. I live for this."
							},
							{
								t: "The SYNAPSE terminal",
								d: "Don't tap the terminal in the compound. Especially don't tap it. If you do, the word is already in your mouth. Four tries. Likeness is letters in the right chair."
							}
						].map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
							className: "bg-raised",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: row.t }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm leading-relaxed text-moon",
								children: row.d
							})]
						}, row.t)),
						started ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ember",
							className: "w-full",
							onClick: () => setScreen("hq"),
							children: "Back to squad"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ember",
							className: "w-full",
							onClick: () => setScreen("title"),
							children: "Back to menu"
						})
					]
				})
			})]
		})]
	});
}
function VaultView() {
	const s = useGame((g) => g.s);
	const usePack = useGame((g) => g.usePack);
	const setScreen = useGame((g) => g.setScreen);
	const take = useGame((g) => g.takeFromVault);
	const idle = s.operatives.find((o) => o.status === "idle" && o.hp > 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5 pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/art/vault-pack.jpg",
						alt: "Vault pack",
						className: "h-40 w-full object-cover md:h-52"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute bottom-3 left-4 right-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Pip-Boy · /inv" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl",
							children: "The Vault"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				className: "glass-strong bg-transparent",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Caps" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-3xl tabular-nums",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coin, { n: s.coins })
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-[14rem] text-right text-xs text-muted",
						children: "Cash. Stacks. Always drops on a win. Can't Use. Just counts."
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "What you hold" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: PACK_KEYS.map((key) => {
					const cat = PACK_CATALOG[key];
					const qty = s.pack?.[key] ?? 0;
					const Icon = PACK_ICON[key];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pip-row flex items-center gap-3 rounded-[var(--radius-md)] bg-raised px-3 py-3 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-11 items-center justify-center rounded-[var(--radius-xs)] bg-ink text-ember",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-display text-sm",
											children: cat.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RarityMark, { rarity: cat.rarity })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted",
										children: cat.blurb
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-0.5 text-[11px] text-moon",
										children: cat.use
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col items-end gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-display text-lg tabular-nums text-ember",
									children: qty
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									disabled: qty <= 0,
									onClick: () => fail(usePack(key)),
									children: "Use"
								})]
							})
						]
					}, key);
				})
			})] }),
			s.mentatsLuck > 0 || s.hackProbes > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "bg-raised",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Active" }),
					s.mentatsLuck > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-ember",
						children: ["Mentats: next loot roll +3 Luck ×", s.mentatsLuck]
					}) : null,
					s.hackProbes > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-ember",
						children: [
							"Probe kit: next hack +",
							s.hackProbes,
							" memory probe"
						]
					}) : null
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "bg-raised",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Daily clocks · Mountain" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: ["Not items. Refill at midnight America/Edmonton. ", s.clocks?.dateKey]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-3 gap-2 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClockStat, {
								label: "Trivia lives",
								value: `${s.clocks?.triviaLives ?? 3}/3`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClockStat, {
								label: "T/F lives",
								value: `${s.clocks?.tfLives ?? 3}/3`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClockStat, {
								label: "Unscramble",
								value: `${s.clocks?.unscramble ?? 10}/10`
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Gear crate" }), s.vault.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No weapons or salvage stored. Pack items sit above this crate."
			}) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: s.vault.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2 rounded-[var(--radius-md)] bg-raised px-3 py-3 shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "truncate text-sm",
							children: [
								it.name,
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RarityMark, { rarity: it.rarity })
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xs text-muted",
							children: [
								it.kind,
								" · ",
								it.condition
							]
						})]
					}), idle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "quiet",
						onClick: () => fail(take(idle.id, it.id)),
						children: "Issue"
					}) : null]
				}, it.id))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "quiet",
				className: "w-full",
				onClick: () => setScreen("hq"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "size-4" }), " Compound"]
			})
		]
	});
}
function ClockStat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[var(--radius-sm)] bg-ink px-2 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "font-display text-lg tabular-nums text-paper",
			children: value
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 font-display text-[9px] uppercase tracking-[0.14em] text-muted",
			children: label
		})]
	});
}
function TerminalOverlay() {
	const hack = useGame((g) => g.s.hack);
	const close = useGame((g) => g.closeTerminal);
	const pick = useGame((g) => g.hackPick);
	const bracket = useGame((g) => g.hackBracket);
	const logRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
	}, [hack?.log.length]);
	(0, import_react.useEffect)(() => {
		if (!hack) return;
		const onKey = (e) => {
			if (e.key === "Escape") close();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [hack, close]);
	if (!hack) return null;
	const onWord = (w) => {
		if (hack.won || hack.locked) return;
		sfx.hack();
		const r = pick(w);
		if (r === "won") sfx.unlock();
		else if (r === "denied" || r === "lock") sfx.deny();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[70] flex items-end justify-center bg-ink/85 p-3 md:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "term-screen relative flex h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-border-hover)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "crt-scan absolute inset-0 opacity-40" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative z-[1] flex items-start justify-between gap-3 border-b border-ember/25 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-[10px] uppercase tracking-[0.2em] text-ember",
						children: "SYNAPSE TERMLINK"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 font-mono text-xs",
						children: hack.won ? "ACCESS GRANTED" : hack.locked ? "LOCKOUT" : `${hack.tries} ATTEMPT(S) LEFT`
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "quiet",
						size: "sm",
						onClick: close,
						children: "Jack out"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: logRef,
					className: "relative z-[1] max-h-36 overflow-y-auto px-4 py-3 font-mono text-[12px] leading-relaxed text-ember-bright ms-scroll",
					children: [hack.log.map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: line }, `${i}-${line}`)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "term-cursor" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative z-[1] min-h-0 flex-1 overflow-y-auto px-3 pb-4 ms-scroll",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 gap-2",
						children: hack.words.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: hack.won || hack.locked,
							onClick: () => onWord(w),
							className: "min-h-11 rounded-[var(--radius-xs)] border border-ember/30 bg-ink/40 px-2 font-mono text-sm tracking-[0.14em] text-ember-bright hover:bg-ember/15 disabled:opacity-40",
							children: w
						}, w))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: hack.won || hack.locked || hack.dudsLeft.length === 0,
						onClick: () => {
							sfx.click();
							const msg = bracket();
							if (msg) fail(msg);
							else sfx.hack();
						},
						className: "mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-xs)] border border-ember/20 font-mono text-[11px] uppercase tracking-[0.18em] text-ember/80 hover:text-ember-bright disabled:opacity-40",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleDot, { className: "size-3.5" }), "Pry brackets · remove dud"]
					})]
				})
			]
		})
	});
}
function TerminalCard({ children }) {
	const started = useGame((g) => g.s.started);
	const open = useGame((g) => g.openTerminal);
	const drained = useGame((g) => g.s.terminalDrained);
	const locked = useGame((g) => g.s.terminalLockDay) > useGame((g) => g.s.day);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => {
			unlockAudio();
			if (!started) {
				fail("Boot a file first.");
				return;
			}
			const msg = open();
			if (msg) fail(msg);
		},
		className: "group relative w-full overflow-hidden rounded-[var(--radius-xl)] text-left shadow-[var(--shadow-border)] transition-[box-shadow] hover:shadow-[var(--shadow-border-hover)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "/art/terminal.jpg",
				alt: "",
				className: "h-40 w-full object-cover md:h-48"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute bottom-3 left-4 right-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Easter egg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-display text-lg",
						children: "SYNAPSE terminal"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-moon",
						children: drained ? "Account mostly empty." : locked ? "Lockout. Dawn, or a probe kit." : "Tap the CRT. Hack it."
					}),
					children
				]
			})
		]
	});
}
var MIN_Z$1 = 1;
var MAX_Z$1 = 3.35;
var REGION_FILL = {
	ironclad: "color-mix(in oklab, var(--color-ok) 16%, transparent)",
	kingdom: "color-mix(in oklab, var(--color-muted) 18%, transparent)",
	caverns: "color-mix(in oklab, var(--color-line) 55%, transparent)",
	library: "color-mix(in oklab, var(--color-moon) 14%, transparent)",
	veyra: "color-mix(in oklab, var(--color-danger) 16%, transparent)",
	hq: "color-mix(in oklab, var(--color-ember) 20%, transparent)"
};
function clampCam(c) {
	const hx = 50 / c.z;
	const hy = 50 / c.z;
	return {
		x: Math.min(100 - hx, Math.max(hx, c.x)),
		y: Math.min(100 - hy, Math.max(hy, c.y)),
		z: Math.min(MAX_Z$1, Math.max(MIN_Z$1, c.z))
	};
}
function WorldAtlas({ loc, onSelect }) {
	const s = useGame((g) => g.s);
	const wrapRef = (0, import_react.useRef)(null);
	const cam = (0, import_react.useRef)({
		x: locById(loc).x,
		y: locById(loc).y,
		z: 1.15
	});
	const tgt = (0, import_react.useRef)({ ...cam.current });
	const drag = (0, import_react.useRef)(null);
	const pinch = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const L = locById(loc);
		tgt.current = clampCam({
			x: L.x,
			y: L.y,
			z: Math.max(tgt.current.z, 1.55)
		});
	}, [loc]);
	(0, import_react.useEffect)(() => {
		const el = wrapRef.current;
		if (!el) return;
		let raf = 0;
		let last = performance.now();
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const layer = el.querySelector("[data-map]");
		const tick = (now) => {
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			const a = 1 - Math.exp(-(reduced ? 40 : 9) * dt);
			cam.current.x += (tgt.current.x - cam.current.x) * a;
			cam.current.y += (tgt.current.y - cam.current.y) * a;
			cam.current.z += (tgt.current.z - cam.current.z) * a;
			if (layer) {
				const w = el.clientWidth;
				const h = el.clientHeight;
				const z = cam.current.z;
				const tx = w / 2 - cam.current.x / 100 * w * z;
				const ty = h / 2 - cam.current.y / 100 * h * z;
				layer.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		const onWheel = (e) => {
			e.preventDefault();
			const elNow = wrapRef.current;
			if (!elNow) return;
			const r = elNow.getBoundingClientRect();
			const px = (e.clientX - r.left) / r.width;
			const py = (e.clientY - r.top) / r.height;
			const c = cam.current;
			const mx = c.x + (px - .5) * (100 / c.z);
			const my = c.y + (py - .5) * (100 / c.z);
			const z = Math.min(MAX_Z$1, Math.max(MIN_Z$1, tgt.current.z * (e.deltaY < 0 ? 1.12 : .9)));
			tgt.current = clampCam({
				x: mx - (px - .5) * (100 / z),
				y: my - (py - .5) * (100 / z),
				z
			});
		};
		el.addEventListener("wheel", onWheel, { passive: false });
		return () => {
			cancelAnimationFrame(raf);
			el.removeEventListener("wheel", onWheel);
		};
	}, []);
	const toMap = (clientX, clientY) => {
		const el = wrapRef.current;
		if (!el) return {
			x: 50,
			y: 50
		};
		const r = el.getBoundingClientRect();
		const px = (clientX - r.left) / r.width;
		const py = (clientY - r.top) / r.height;
		const c = cam.current;
		return {
			x: c.x + (px - .5) * (100 / c.z),
			y: c.y + (py - .5) * (100 / c.z)
		};
	};
	const hitPin = (mx, my) => {
		let bestId = null;
		let bestD = 7.5;
		for (const w of WORLD) {
			const d = Math.hypot(w.x - mx, w.y - my);
			if (d < bestD) {
				bestD = d;
				bestId = w.id;
			}
		}
		return bestId ? WORLD.find((w) => w.id === bestId) ?? null : null;
	};
	const zoomAt = (clientX, clientY, nextZ) => {
		const m = toMap(clientX, clientY);
		const z = Math.min(MAX_Z$1, Math.max(MIN_Z$1, nextZ));
		const el = wrapRef.current;
		if (!el) return;
		const r = el.getBoundingClientRect();
		const px = (clientX - r.left) / r.width;
		const py = (clientY - r.top) / r.height;
		tgt.current = clampCam({
			x: m.x - (px - .5) * (100 / z),
			y: m.y - (py - .5) * (100 / z),
			z
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: wrapRef,
				className: "relative h-[22rem] touch-none overflow-hidden rounded-[var(--radius-xl)] bg-ink shadow-[var(--shadow-border)] md:h-[32rem]",
				onPointerDown: (e) => {
					e.currentTarget.setPointerCapture(e.pointerId);
					drag.current = {
						id: e.pointerId,
						x: e.clientX,
						y: e.clientY,
						moved: false
					};
				},
				onPointerMove: (e) => {
					const d = drag.current;
					if (!d || d.id !== e.pointerId) return;
					const dx = e.clientX - d.x;
					const dy = e.clientY - d.y;
					if (Math.hypot(dx, dy) > 4) d.moved = true;
					d.x = e.clientX;
					d.y = e.clientY;
					const el = wrapRef.current;
					if (!el) return;
					tgt.current = clampCam({
						x: tgt.current.x - dx / el.clientWidth * (100 / tgt.current.z),
						y: tgt.current.y - dy / el.clientHeight * (100 / tgt.current.z),
						z: tgt.current.z
					});
				},
				onPointerUp: (e) => {
					const d = drag.current;
					drag.current = null;
					if (!d || d.moved) return;
					const m = toMap(e.clientX, e.clientY);
					const pin = hitPin(m.x, m.y);
					if (pin && s.locations[pin.id].unlocked) {
						sfx.click();
						onSelect(pin.id);
						tgt.current = clampCam({
							x: pin.x,
							y: pin.y,
							z: Math.max(tgt.current.z, 1.85)
						});
					}
				},
				onPointerCancel: () => {
					drag.current = null;
				},
				onTouchStart: (e) => {
					if (e.touches.length === 2) {
						const a = e.touches[0];
						const b = e.touches[1];
						pinch.current = {
							d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
							z: tgt.current.z
						};
					}
				},
				onTouchMove: (e) => {
					if (e.touches.length === 2 && pinch.current) {
						e.preventDefault();
						const a = e.touches[0];
						const b = e.touches[1];
						const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
						const midX = (a.clientX + b.clientX) / 2;
						const midY = (a.clientY + b.clientY) / 2;
						zoomAt(midX, midY, pinch.current.z * (dist / pinch.current.d));
					}
				},
				onTouchEnd: () => {
					if (!wrapRef.current) return;
					pinch.current = null;
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					"data-map": true,
					className: "absolute inset-0 origin-top-left will-change-transform",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/map/overworld.jpg",
							alt: "",
							draggable: false,
							className: "absolute inset-0 size-full object-cover"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,color-mix(in_oklab,var(--color-ink)_38%,transparent)_100%)]" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
							viewBox: "0 0 100 100",
							className: "absolute inset-0 h-full w-full",
							role: "img",
							"aria-label": "Hollow Realm map",
							children: [
								WORLD.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
									cx: w.x,
									cy: w.y,
									rx: w.id === "hq" ? 7 : 9,
									ry: w.id === "hq" ? 7 : 8,
									fill: REGION_FILL[w.id],
									opacity: s.locations[w.id].unlocked ? .38 : .1
								}, `${w.id}-blob`)),
								WORLD.filter((w) => w.id !== "hq").map((a) => a.connectedTo.filter((id) => id !== "hq").map((b) => {
									const o = WORLD.find((w) => w.id === b);
									if (!o) return null;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
										x1: a.x,
										y1: a.y,
										x2: o.x,
										y2: o.y,
										stroke: "var(--color-ember)",
										strokeOpacity: "0.28",
										strokeWidth: "0.35",
										strokeDasharray: "1.1 0.9"
									}, a.id + b);
								})),
								WORLD.map((w) => {
									const unlocked = s.locations[w.id].unlocked;
									const active = loc === w.id;
									const intel = s.locations[w.id].intel;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
										className: unlocked ? "cursor-pointer" : "opacity-35",
										children: [
											active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
												cx: w.x,
												cy: w.y,
												r: "7.2",
												fill: "none",
												stroke: "var(--color-ember)",
												strokeWidth: "0.55",
												className: "ms-map-ring"
											}) : null,
											intel > 0 && w.id !== "hq" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
												cx: w.x,
												cy: w.y,
												r: 4.4 + Math.min(3.5, intel),
												fill: "none",
												stroke: "var(--color-ember)",
												strokeOpacity: "0.32",
												strokeWidth: "0.35"
											}) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
												cx: w.x,
												cy: w.y,
												r: active ? 3.6 : 2.8,
												fill: w.id === "hq" ? "var(--color-ember)" : active ? "var(--color-paper)" : "var(--color-ok)",
												stroke: "var(--color-ink)",
												strokeWidth: "0.45"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
												x: w.x,
												y: w.y - 5.2,
												textAnchor: "middle",
												fill: "var(--color-paper)",
												fontSize: "3.4",
												fontFamily: "Syne, sans-serif",
												style: {
													paintOrder: "stroke",
													stroke: "rgba(11,15,12,0.85)",
													strokeWidth: .6
												},
												children: w.short
											})
										]
									}, w.id);
								})
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 crt-scan opacity-40" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 font-display text-[10px] uppercase tracking-[0.18em] text-ember",
				children: [locById(loc).short, " · drag · pinch"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute right-3 top-3 flex flex-col gap-1",
				children: [
					{
						icon: Plus,
						label: "Zoom in",
						fn: () => tgt.current = clampCam({
							...tgt.current,
							z: tgt.current.z * 1.22
						})
					},
					{
						icon: Minus,
						label: "Zoom out",
						fn: () => tgt.current = clampCam({
							...tgt.current,
							z: tgt.current.z / 1.22
						})
					},
					{
						icon: RotateCcw,
						label: "Reset map",
						fn: () => {
							const L = locById(loc);
							tgt.current = clampCam({
								x: L.x,
								y: L.y,
								z: 1.15
							});
						}
					}
				].map((b) => {
					const Icon = b.icon;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": b.label,
						onClick: () => {
							sfx.click();
							b.fn();
						},
						className: "inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] bg-ink/80 text-paper shadow-[var(--shadow-border)] backdrop-blur-sm hover:text-ember",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" })
					}, b.label);
				})
			})
		]
	});
}
var MIN_Z = .82;
var MAX_Z = 1.85;
var SPIN_DEG = 72;
function SigInk({ name }) {
	let h = 2166136261;
	for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
	const a = 6 + (h & 15);
	const b = 14 + (h >>> 4 & 15);
	const c = 8 + (h >>> 8 & 12);
	const d = 18 + (h >>> 12 & 10);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className: "ms-card-sig-ink",
		viewBox: "0 0 220 40",
		"aria-hidden": true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: `M3 26 C ${18 + a} 6, ${38 + b} 34, ${68 + c} 16 S ${118 + a} 4, ${148 + b} 22 S ${186 + d} 34, 216 14`,
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "1.45",
			strokeLinecap: "round"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: `M28 30 C ${50 + c} 22, ${90 + a} 32, ${140 + b} 24`,
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "0.7",
			strokeLinecap: "round",
			opacity: "0.55"
		})]
	});
}
function MoonCard({ member, className }) {
	const stage = (0, import_react.useRef)(null);
	const rot = (0, import_react.useRef)({
		x: -14,
		y: 22
	});
	const vel = (0, import_react.useRef)({
		x: 0,
		y: 0
	});
	const scale = (0, import_react.useRef)(1);
	const spinOn = (0, import_react.useRef)(false);
	const reduced = (0, import_react.useRef)(false);
	const dragging = (0, import_react.useRef)(false);
	const moved = (0, import_react.useRef)(false);
	const flipT = (0, import_react.useRef)(null);
	const flipFrom = (0, import_react.useRef)(0);
	const flipTo = (0, import_react.useRef)(0);
	const lastTap = (0, import_react.useRef)(0);
	const [label, setLabel] = (0, import_react.useState)("Drag · pinch · spin");
	const [spinning, setSpinning] = (0, import_react.useState)(false);
	const pointers = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	const pinch0 = (0, import_react.useRef)(0);
	const scale0 = (0, import_react.useRef)(1);
	const drag = (0, import_react.useRef)(null);
	const lastMove = (0, import_react.useRef)({
		t: 0,
		x: 0,
		y: 0
	});
	const raf = (0, import_react.useRef)(0);
	const t0 = (0, import_react.useRef)(performance.now());
	const paint = () => {
		const root = stage.current;
		const el = root?.querySelector("[data-card]");
		if (!root || !el) return;
		const y = rot.current.y;
		const x = rot.current.x;
		el.style.transform = `rotateX(${x}deg) rotateY(${y}deg) scale(${scale.current})`;
		const gx = 50 + Math.sin(y * Math.PI / 180) * 38;
		const gy = 38 - Math.sin(x * Math.PI / 180) * 22;
		el.style.setProperty("--gx", `${gx}%`);
		el.style.setProperty("--gy", `${gy}%`);
		const shine = Math.max(.08, .22 + Math.cos(y * Math.PI / 180) * .14);
		el.style.setProperty("--shine", String(shine));
		const wrap = (y % 360 + 360) % 360;
		el.dataset.face = wrap > 90 && wrap < 270 ? "back" : "front";
		const shadow = root.querySelector("[data-shadow]");
		if (shadow) {
			const k = .55 + scale.current * .35;
			shadow.style.transform = `translateX(${Math.sin(y * Math.PI / 180) * 18}px) scale(${k}, 1)`;
			shadow.style.opacity = String(.28 + (1.4 - Math.min(scale.current, 1.4)) * .2);
		}
	};
	(0, import_react.useEffect)(() => {
		reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		let last = performance.now();
		const tick = (now) => {
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			if (flipT.current != null) {
				flipT.current += dt;
				const u = Math.min(1, flipT.current / .52);
				const e = 1 - Math.pow(1 - u, 3);
				rot.current.y = flipFrom.current + (flipTo.current - flipFrom.current) * e;
				if (u >= 1) flipT.current = null;
			} else if (spinOn.current && !dragging.current && !reduced.current) rot.current.y = (rot.current.y + SPIN_DEG * dt) % 360;
			else if (!dragging.current && !reduced.current) {
				rot.current.x += vel.current.x * dt;
				rot.current.y += vel.current.y * dt;
				const damp = Math.exp(-3.4 * dt);
				vel.current.x *= damp;
				vel.current.y *= damp;
				if (Math.hypot(vel.current.x, vel.current.y) < 4) vel.current = {
					x: 0,
					y: 0
				};
				const bob = Math.sin((now - t0.current) / 1400) * 1.6;
				rot.current.x = Math.max(-52, Math.min(52, rot.current.x * .994 + (-14 + bob) * .006));
			}
			rot.current.x = Math.max(-52, Math.min(52, rot.current.x));
			paint();
			raf.current = requestAnimationFrame(tick);
		};
		raf.current = requestAnimationFrame(tick);
		paint();
		return () => cancelAnimationFrame(raf.current);
	}, []);
	(0, import_react.useEffect)(() => {
		const root = stage.current;
		if (!root) return;
		const dist = () => {
			const pts = [...pointers.current.values()];
			if (pts.length < 2) return 0;
			return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
		};
		const onDown = (e) => {
			root.setPointerCapture(e.pointerId);
			pointers.current.set(e.pointerId, {
				x: e.clientX,
				y: e.clientY
			});
			spinOn.current = false;
			setSpinning(false);
			flipT.current = null;
			moved.current = false;
			if (pointers.current.size === 2) {
				pinch0.current = dist();
				scale0.current = scale.current;
				drag.current = null;
				dragging.current = true;
			} else if (pointers.current.size === 1) {
				dragging.current = true;
				drag.current = {
					x: e.clientX,
					y: e.clientY,
					rx: rot.current.x,
					ry: rot.current.y
				};
				lastMove.current = {
					t: performance.now(),
					x: e.clientX,
					y: e.clientY
				};
				vel.current = {
					x: 0,
					y: 0
				};
			}
		};
		const onMove = (e) => {
			if (!pointers.current.has(e.pointerId)) return;
			pointers.current.set(e.pointerId, {
				x: e.clientX,
				y: e.clientY
			});
			if (pointers.current.size >= 2 && pinch0.current > 8) {
				const next = dist() / pinch0.current;
				scale.current = Math.min(MAX_Z, Math.max(MIN_Z, scale0.current * next));
				setLabel(`Zoom ${scale.current.toFixed(2)}×`);
				paint();
				return;
			}
			if (drag.current && pointers.current.size === 1) {
				const dx = e.clientX - drag.current.x;
				const dy = e.clientY - drag.current.y;
				if (Math.hypot(dx, dy) > 5) moved.current = true;
				rot.current = {
					x: Math.max(-52, Math.min(52, drag.current.rx - dy * .28)),
					y: drag.current.ry + dx * .42
				};
				const now = performance.now();
				const dt = Math.max(8, now - lastMove.current.t);
				vel.current = {
					x: (e.clientY - lastMove.current.y) / dt * -280,
					y: (e.clientX - lastMove.current.x) / dt * 380
				};
				lastMove.current = {
					t: now,
					x: e.clientX,
					y: e.clientY
				};
				paint();
			}
		};
		const onUp = (e) => {
			pointers.current.delete(e.pointerId);
			if (pointers.current.size < 2) pinch0.current = 0;
			if (pointers.current.size === 0) {
				drag.current = null;
				dragging.current = false;
				const now = performance.now();
				if (!moved.current && now - lastTap.current < 320) flip();
				lastTap.current = now;
				if (moved.current) setLabel("Flick to spin · pinch to zoom");
			}
		};
		const onWheel = (e) => {
			e.preventDefault();
			const dir = e.deltaY > 0 ? .94 : 1.06;
			scale.current = Math.min(MAX_Z, Math.max(MIN_Z, scale.current * dir));
			setLabel(`Zoom ${scale.current.toFixed(2)}×`);
			paint();
		};
		const onKey = (e) => {
			if (e.key === "ArrowLeft") rot.current.y -= 14;
			else if (e.key === "ArrowRight") rot.current.y += 14;
			else if (e.key === "ArrowUp") rot.current.x = Math.max(-52, rot.current.x - 10);
			else if (e.key === "ArrowDown") rot.current.x = Math.min(52, rot.current.x + 10);
			else if (e.key === "+" || e.key === "=") scale.current = Math.min(MAX_Z, scale.current * 1.08);
			else if (e.key === "-" || e.key === "_") scale.current = Math.max(MIN_Z, scale.current * .92);
			else if (e.key === " " || e.key === "s" || e.key === "S") {
				e.preventDefault();
				toggleSpin();
				return;
			} else if (e.key === "f" || e.key === "F") {
				flip();
				return;
			} else if (e.key === "0") reset();
			else return;
			paint();
		};
		root.addEventListener("pointerdown", onDown);
		root.addEventListener("pointermove", onMove);
		root.addEventListener("pointerup", onUp);
		root.addEventListener("pointercancel", onUp);
		root.addEventListener("wheel", onWheel, { passive: false });
		root.addEventListener("keydown", onKey);
		return () => {
			root.removeEventListener("pointerdown", onDown);
			root.removeEventListener("pointermove", onMove);
			root.removeEventListener("pointerup", onUp);
			root.removeEventListener("pointercancel", onUp);
			root.removeEventListener("wheel", onWheel);
			root.removeEventListener("keydown", onKey);
		};
	}, []);
	const toggleSpin = () => {
		spinOn.current = !spinOn.current;
		setSpinning(spinOn.current);
		flipT.current = null;
		vel.current = {
			x: 0,
			y: 0
		};
		setLabel(spinOn.current ? "Spinning" : "Drag · pinch · spin");
		sfx.click();
	};
	const flip = () => {
		spinOn.current = false;
		setSpinning(false);
		vel.current = {
			x: 0,
			y: 0
		};
		flipFrom.current = rot.current.y;
		flipTo.current = rot.current.y + 180;
		flipT.current = 0;
		setLabel("Flipped");
		sfx.click();
	};
	const reset = () => {
		rot.current = {
			x: -14,
			y: 22
		};
		scale.current = 1;
		vel.current = {
			x: 0,
			y: 0
		};
		spinOn.current = false;
		setSpinning(false);
		flipT.current = null;
		setLabel("Drag · pinch · spin");
		sfx.click();
		paint();
	};
	const pan = member.personalCaps.toLocaleString();
	const num = cardNumber(member.id);
	const vacant = isVacant(member);
	const holder = vacant ? "Unclaimed" : member.name;
	const handle = vacant ? "claim this plate" : member.discordHandle ?? "unlinked rider";
	const cvc = String((member.id.length * 137 + holder.length * 19) % 1e3).padStart(3, "0");
	const last4 = num.replace(/\s/g, "").slice(-4);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("space-y-3", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: stage,
			tabIndex: 0,
			className: "ms-card-stage relative mx-auto flex h-[14.5rem] w-full max-w-md cursor-grab select-none items-center justify-center touch-none outline-none active:cursor-grabbing md:h-[16.5rem]",
			"aria-label": "Moon Squad bank card. Drag to rotate, pinch or wheel to zoom, double-tap to flip, space to spin.",
			onContextMenu: (e) => e.preventDefault(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-shadow": true,
				className: "ms-card-shadow"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"data-card": true,
				"data-face": "front",
				className: "ms-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "ms-card-edge",
						"aria-hidden": true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ms-card-face ms-card-front",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "ms-card-plate",
							"aria-hidden": true
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ms-card-skin",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ms-card-foil" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ms-card-glare" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative z-[1] flex h-full flex-col justify-between p-4 text-paper md:p-5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start justify-between gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-display text-[11px] uppercase tracking-[0.34em] text-moon",
												children: "Moon Squad 🌙"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 font-mono text-[10px] tracking-[0.18em] text-muted",
												children: "SYNAPSE · T-0880"
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "ms-card-nfc",
													"aria-hidden": true
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "ms-card-chip",
													"aria-hidden": true
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-mono text-[13px] tracking-[0.28em] text-paper/90 md:text-sm",
											children: num
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-end justify-between gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-display text-[10px] uppercase tracking-[0.2em] text-muted",
														children: "Cardholder"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "truncate font-display text-lg leading-tight",
														children: holder
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "truncate font-mono text-[11px] text-moon",
														children: handle
													})
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-right",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoonCrest, { className: "ml-auto size-7 text-moon" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "mt-1 font-display text-[10px] uppercase tracking-[0.2em] text-muted",
														children: "Balance"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-display text-xl tabular-nums text-ember",
														children: pan
													})
												]
											})]
										})
									]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ms-card-face ms-card-back",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "ms-card-plate",
							"aria-hidden": true
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ms-card-skin",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "ms-card-hatch",
									"aria-hidden": true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "ms-card-stripe",
									"aria-hidden": true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ms-card-stripe-track" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "ms-card-sig-row",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "ms-card-sig",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ms-card-sig-label",
												children: "Authorized signature · not valid unless signed"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SigInk, { name: holder }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "ms-card-sig-name",
												children: holder
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "ms-card-cvc",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "CVC" }), cvc]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "ms-card-back-body",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-display text-[11px] uppercase tracking-[0.28em] text-moon",
												children: "Moon Squad 🌙"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 truncate font-mono text-[11px] text-muted",
												children: handle
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "ms-card-legal",
												children: "This plate is property of SYNAPSE T-0880 and remains Moon Squad issue. Personal ledger only — compound vault is a separate account. If found, return to the porch. Not transferable. Void if unsigned."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ms-card-barcode",
												"aria-hidden": true
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex shrink-0 flex-col items-end gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ms-card-holo",
												"aria-hidden": true,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoonCrest, { className: "ms-card-holo-mark" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "ms-card-last4",
												children: last4
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-display text-[8px] uppercase tracking-[0.2em] text-muted",
												children: "Desk 24h"
											})
										]
									})]
								})
							]
						})]
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-center gap-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: cn("inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] shadow-[var(--shadow-border)] hover:text-paper", spinning ? "text-ember" : "text-muted"),
					"aria-label": "Spin card",
					"aria-pressed": spinning,
					onClick: toggleSpin,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCw, { className: "size-4" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] text-muted shadow-[var(--shadow-border)] hover:text-paper",
					"aria-label": "Flip card",
					onClick: flip,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlipHorizontal, { className: "size-4" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "min-w-32 text-center font-display text-[10px] uppercase tracking-[0.18em] text-muted",
					children: label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] text-muted shadow-[var(--shadow-border)] hover:text-paper",
					"aria-label": "Reset card",
					onClick: reset,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" })
				})
			]
		})]
	});
}
function err(msg) {
	if (!msg) {
		sfx.coin();
		return;
	}
	sfx.hurt();
	useGame.setState((st) => ({ s: {
		...st.s,
		toast: msg
	} }));
}
var ROOM_ICON = {
	vault: Archive,
	barracks: Shield,
	forge: Hammer,
	infirmary: HeartPulse,
	watchtower: Eye,
	ledger: ScrollText
};
var KIND_HELP = {
	scout: "Walk the edges. Intel, low blood.",
	forage: "Take what the land offers. Caps, ore, scraps.",
	raid: "Kick a door. Combat likely. Better loot.",
	trade: "Find the regional merchant and pay their price.",
	bounty: "Hunt a named target. The board pays.",
	boss: "The name that surfaced. Bring a party."
};
function Briefing() {
	const go = useGame((g) => g.finishBriefing);
	const talk = useGame((g) => g.s.talk);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ms-grain relative flex h-dvh flex-col justify-end overflow-hidden px-5 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TitleBackdrop, { className: "opacity-70" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "crt-scan absolute inset-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_oklab,var(--color-ember)_16%,transparent),transparent_55%)]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--color-ink)_82%,transparent)_70%,var(--color-ink))]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-[1] mx-auto mb-36 w-full max-w-xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-[11px] uppercase tracking-[0.42em] text-ember",
						children: "S.Y.N.A.P.S.E · T-0880"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-2 font-display text-4xl text-paper",
						children: "The porch."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-md text-sm leading-relaxed text-moon",
						children: "Tyrone talks first. No shortcuts. Tap his panel until the ranch opens."
					}),
					!talk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-8 w-full sm:w-auto",
						variant: "ember",
						onClick: () => {
							sfx.click();
							go();
						},
						children: "Forge the first"
					}) : null
				]
			})
		]
	});
}
function HQView() {
	const s = useGame((g) => g.s);
	const upgradeRoom = useGame((g) => g.upgradeRoom);
	const upgradeQuarter = useGame((g) => g.upgradeQuarter);
	const hire = useGame((g) => g.hireResident);
	const rest = useGame((g) => g.rest);
	const setScreen = useGame((g) => g.setScreen);
	const select = useGame((g) => g.selectOp);
	const [staff, setStaff] = (0, import_react.useState)("Rook");
	const [role, setRole] = (0, import_react.useState)("guard");
	const income = incomePerTick(s);
	const living = s.operatives.filter((o) => o.status !== "dead");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5 pb-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ms-well overflow-hidden rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-border)] md:p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ms-moon !size-14 shrink-0" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "SYNAPSE Compound" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-display text-2xl",
										children: "The compound"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-sm text-muted",
										children: [
											"Earns ",
											income,
											" caps while you wait · roster ",
											living.length,
											"/",
											rosterCap(s)
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ember",
								disabled: !!s.mission || !!s.combat,
								className: cn("shrink-0", s.tutorial === "rest" && "ms-nudge"),
								onClick: () => {
									sfx.click();
									rest();
								},
								children: "Rest"
							})
						]
					}),
					s.nightNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ms-rise mt-4 rounded-[var(--radius-md)] bg-ink/50 px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-display text-[10px] uppercase tracking-[0.2em] text-ember",
							children: "Dawn dispatch"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm italic text-moon",
							children: s.nightNote
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3",
						children: Object.keys(BASE_ROOMS).map((id) => {
							const room = BASE_ROOMS[id];
							const lvl = s.rooms[id];
							const cost = nextRoomCost(s, id);
							const Icon = ROOM_ICON[id];
							const built = lvl > 0;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: cn("rounded-[var(--radius-md)] p-3", built ? "bg-surface/90 shadow-[var(--shadow-border)]" : "bg-ink/40 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-line)_80%,transparent)]"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-start justify-between gap-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: cn("flex size-8 items-center justify-center rounded-[var(--radius-xs)]", built ? "bg-ember/15 text-ember" : "bg-ink text-muted"),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "font-display text-sm",
												children: room.name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2 text-[11px] text-muted",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LevelPips, { level: lvl }), built ? `+${room.income * Math.max(1, lvl)} caps` : "Ruin"]
											})] })]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 line-clamp-2 text-xs text-muted",
										children: room.desc
									}),
									cost != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: built ? "ghost" : "ember",
										className: "mt-3 w-full",
										onClick: () => err(upgradeRoom(id)),
										disabled: s.coins < cost,
										children: [
											built ? "Upgrade" : "Raise",
											" · ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coin, { n: cost })
										]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 font-display text-[10px] uppercase tracking-wider text-ok",
										children: "Peak"
									}),
									id === "vault" && built ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "quiet",
										className: "mt-2 w-full",
										onClick: () => setScreen("vault"),
										children: "Open vault"
									}) : null
								]
							}, id);
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Who is home" }), living.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "bg-raised",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "The bunks are empty. Forge someone who can walk the Hollow."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "mt-3 ms-nudge",
					variant: "ember",
					onClick: () => setScreen("forge"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4" }), " Forge the first"]
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 overflow-x-auto pb-1",
				children: [living.map((op) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						sfx.click();
						select(op.id);
					},
					className: "flex min-w-[10rem] items-center gap-3 rounded-[var(--radius-md)] bg-raised px-3 py-3 text-left shadow-[var(--shadow-border)] transition-[box-shadow] hover:shadow-[var(--shadow-border-hover)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portrait, {
						op,
						size: 40
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate font-display text-sm",
								children: op.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: op.status }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HpBar, {
								hp: op.hp,
								max: op.maxHp,
								className: "mt-1.5"
							})
						]
					})]
				}, op.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						sfx.click();
						setScreen("forge");
					},
					className: "flex min-h-[4.5rem] min-w-[4.5rem] flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] bg-ink text-ember shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-lg leading-none",
						children: "+"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-[9px] uppercase tracking-[0.16em]",
						children: "Forge"
					})]
				})]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Bunkhouse" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-2 sm:grid-cols-3",
				children: Object.keys(QUARTERS).map((q) => {
					const cost = nextQuarterCost(s, q);
					const lvl = s.quarters[q];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						className: "bg-raised p-3 md:p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 font-display text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BedDouble, { className: "size-4 text-ember" }),
									" ",
									QUARTERS[q].name
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LevelPips, { level: lvl }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-[11px] text-muted",
									children: ["Tier ", lvl]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted",
								children: QUARTERS[q].tiers[Math.min(lvl, QUARTERS[q].tiers.length - 1)]?.bonus
							}),
							cost != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "mt-3 w-full",
								size: "sm",
								variant: "ghost",
								onClick: () => err(upgradeQuarter(q)),
								children: ["Upgrade · ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coin, { n: cost })]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-ok",
								children: "Peak"
							})
						]
					}, q);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Staff" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "bg-raised",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 sm:flex-row",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: staff,
							onChange: (e) => setStaff(e.target.value),
							className: "h-11 flex-1 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none focus:shadow-[var(--shadow-border-hover)]",
							placeholder: "Name"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: role,
							onChange: (e) => setRole(e.target.value),
							className: "h-11 rounded-[var(--radius-sm)] bg-ink px-3 text-sm shadow-[var(--shadow-border)]",
							children: Object.entries(RESIDENT_ROLES).map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: k,
								children: v.label
							}, k))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ghost",
							onClick: () => err(hire(staff, role)),
							children: ["Hire · ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coin, { n: hireResidentCost(s) })]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 space-y-1 text-sm text-muted",
					children: [s.residents.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No staff. Barracks first — then hire a watch." }) : null, s.residents.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-ember",
							children: RESIDENT_ROLES[r.role].label
						})]
					}, r.id))]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TerminalCard, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "quiet",
					onClick: () => setScreen("map"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Swords, { className: "size-4" }), " Deploy"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "quiet",
					onClick: () => setScreen("ledger"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landmark, { className: "size-4" }), " Ledger"]
				})]
			})
		]
	});
}
function RosterView() {
	const s = useGame((g) => g.s);
	const select = useGame((g) => g.selectOp);
	const setScreen = useGame((g) => g.setScreen);
	const [tab, setTab] = (0, import_react.useState)("living");
	const living = s.operatives.filter((o) => o.status !== "dead");
	const fallen = s.operatives.filter((o) => o.status === "dead");
	const hof = living.filter((o) => o.isHoF);
	const list = tab === "living" ? living : tab === "fallen" ? fallen : hof;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4 pb-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Roster" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Moon Squad"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ember",
					size: "sm",
					onClick: () => setScreen("forge"),
					children: "Forge"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2",
				children: [
					"living",
					"fallen",
					"hof"
				].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, {
					active: tab === t,
					onClick: () => setTab(t),
					children: [
						t === "hof" ? "Fame" : t,
						" · ",
						t === "living" ? living.length : t === "fallen" ? fallen.length : hof.length
					]
				}, t))
			}),
			list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: tab === "living" ? "Empty. Forge someone who can walk the Hollow." : "None yet."
			}), tab === "living" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-3",
				variant: "ember",
				onClick: () => setScreen("forge"),
				children: "Forge an operative"
			}) : null] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-2",
				children: list.map((op) => {
					const primary = computeStats(op)[op.cls === "Rogue" ? "SPD" : op.cls === "Wizard" ? "INT" : op.cls === "Healer" ? "WIS" : op.cls === "Warrior" ? "STR" : "CHA"];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							sfx.click();
							select(op.id);
						},
						className: "rounded-[var(--radius-lg)] bg-raised p-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] hover:shadow-[var(--shadow-border-hover)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portrait, {
										op,
										size: 44
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-display text-base",
										children: op.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-xs text-muted",
										children: [
											op.cls,
											" · ",
											op.race,
											" · ",
											op.repTitle
										]
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-right",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-xs tabular-nums text-muted",
										children: [
											op.hp,
											"/",
											op.maxHp
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: op.status })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HpBar, {
								hp: op.hp,
								max: op.maxHp,
								className: "mt-3 h-2"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 line-clamp-1 text-xs italic text-moon",
								children: op.destiny
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex justify-between text-xs text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: op.skillName }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "tabular-nums",
									children: [
										op.raids,
										" raids · primary ",
										primary
									]
								})]
							})
						]
					}, op.id);
				})
			})
		]
	});
}
function ForgeView() {
	const s = useGame((g) => g.s);
	const forge = useGame((g) => g.forge);
	const [step, setStep] = (0, import_react.useState)(0);
	const [name, setName] = (0, import_react.useState)(() => randomName());
	const [cls, setCls] = (0, import_react.useState)("Warrior");
	const [race, setRace] = (0, import_react.useState)(Object.keys(RACES)[0]);
	const [origin, setOrigin] = (0, import_react.useState)(ORIGINS[0]);
	const lineages = Object.keys(RACES[race].lineage);
	const [lineage, setLineage] = (0, import_react.useState)(lineages[0]);
	const [rolls, setRolls] = (0, import_react.useState)({});
	const [spinKey, setSpinKey] = (0, import_react.useState)(null);
	const [spinAll, setSpinAll] = (0, import_react.useState)(false);
	const cost = forgeCost(s);
	const raceDef = RACES[race];
	const setRaceAndLine = (r) => {
		setRace(r);
		setLineage(Object.keys(RACES[r].lineage)[0]);
	};
	const rollOne = (k) => {
		if (spinKey || spinAll) return;
		sfx.dice();
		setSpinKey(k);
		window.setTimeout(() => {
			setRolls((p) => ({
				...p,
				[k]: d20()
			}));
			setSpinKey(null);
		}, 900);
	};
	const rollAll = () => {
		if (spinKey || spinAll) return;
		sfx.dice();
		setSpinAll(true);
		window.setTimeout(() => {
			setRolls({
				rep: d20(),
				trait: d20(),
				skill: d20(),
				shadow: d20(),
				enchant: d20(),
				destiny: d20()
			});
			setSpinAll(false);
		}, 980);
	};
	const hollowDecide = (wild = false) => {
		sfx.dice();
		const nextCls = wild ? CLASSES[Math.floor(Math.random() * CLASSES.length)] : cls;
		const raceKeys = Object.keys(RACES);
		const nextRace = wild ? raceKeys[Math.floor(Math.random() * raceKeys.length)] : race;
		const linKeys = Object.keys(RACES[nextRace].lineage);
		const nextLin = wild ? linKeys[Math.floor(Math.random() * linKeys.length)] : lineage;
		const nextOrigin = wild ? ORIGINS[Math.floor(Math.random() * ORIGINS.length)] : origin;
		const next = {
			rep: d20(),
			trait: d20(),
			skill: d20(),
			shadow: d20(),
			enchant: d20(),
			destiny: d20()
		};
		setCls(nextCls);
		setRaceAndLine(nextRace);
		setLineage(nextLin);
		setOrigin(nextOrigin);
		setRolls(next);
		err(forge({
			name: name || randomName(),
			cls: nextCls,
			race: nextRace,
			lineage: nextLin,
			origin: nextOrigin,
			rolls: next
		}));
	};
	const preview = (table, n) => {
		if (!n) return "—";
		const hit = table.find((t) => n >= t.r[0] && n <= t.r[1]);
		return hit?.title || hit?.name || hit?.thread || "—";
	};
	const canForge = name.trim() && Object.keys(rolls).length >= 6;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4 pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Character Forge" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Make them real"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [cost === 0 ? "First operative is a gift of the moon." : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					"Next forge costs ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coin, { n: cost }),
					"."
				] }), " Three steps. Six rolls. One life."]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2",
				children: [
					"Identity",
					"Blood",
					"Fate"
				].map((label, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						sfx.click();
						setStep(i);
					},
					className: cn("flex min-h-11 flex-1 items-center justify-center rounded-full font-display text-[10px] uppercase tracking-[0.16em]", step === i ? "bg-ember text-ink" : "bg-raised text-muted"),
					children: [
						i + 1,
						". ",
						label
					]
				}, label))
			}),
			step === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "bg-raised",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "font-display text-[10px] uppercase tracking-wider text-ember",
						children: "Name"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: name,
							onChange: (e) => setName(e.target.value),
							placeholder: "Given name",
							className: "h-11 flex-1 rounded-[var(--radius-sm)] bg-ink px-3 text-sm outline-none shadow-[var(--shadow-border)] focus:shadow-[var(--shadow-border-hover)]"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "quiet",
							onClick: () => setName(randomName()),
							children: "Random"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "mt-5 block font-display text-[10px] uppercase tracking-wider text-ember",
						children: "Class"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 grid grid-cols-2 gap-2",
						children: CLASSES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								sfx.click();
								setCls(c);
							},
							className: cn("min-h-[4.5rem] rounded-[var(--radius-md)] px-3 py-3 text-left", cls === c ? "bg-ember/10 shadow-[var(--shadow-border-hover)]" : "bg-ink shadow-[var(--shadow-border)]"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-2 font-display text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClassGlyph, {
										cls: c,
										className: "text-ember"
									}),
									" ",
									c
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 line-clamp-2 text-[11px] text-muted",
								children: CLASS_LORE[c].tagline
							})]
						}, c))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-moon",
						children: CLASS_LORE[cls].playstyle
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-4 w-full",
						variant: "ember",
						onClick: () => setStep(1),
						children: "Blood and origin"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-2 w-full",
						variant: "ghost",
						onClick: () => hollowDecide(true),
						children: "Let the Hollow decide"
					})
				]
			}) : null,
			step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "bg-raised",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "font-display text-[10px] uppercase tracking-wider text-ember",
						children: "Race"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 grid grid-cols-2 gap-2",
						children: Object.keys(RACES).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								sfx.click();
								setRaceAndLine(r);
							},
							className: cn("min-h-14 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm", race === r ? "bg-ember/10 shadow-[var(--shadow-border-hover)]" : "bg-ink shadow-[var(--shadow-border)]"),
							children: r
						}, r))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm italic text-moon",
						children: raceDef.tagline
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted",
						children: raceDef.ability
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "mt-4 block font-display text-[10px] uppercase tracking-wider text-ember",
						children: "Lineage"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-2",
						children: Object.keys(raceDef.lineage).map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: lineage === l,
							onClick: () => setLineage(l),
							children: l
						}, l))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-muted",
						children: raceDef.lineage[lineage]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "mt-4 block font-display text-[10px] uppercase tracking-wider text-ember",
						children: "Origin"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-2",
						children: ORIGINS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: origin === o,
							onClick: () => setOrigin(o),
							children: o.replace("Dark Enchanted ", "").replace("The ", "")
						}, o))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "quiet",
							className: "flex-1",
							onClick: () => setStep(0),
							children: "Back"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "flex-1",
							variant: "ember",
							onClick: () => setStep(2),
							children: "Roll their fate"
						})]
					})
				]
			}) : null,
			step === 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "bg-raised",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "The six rolls" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: rollAll,
						children: "Roll all"
					})]
				}), [
					[
						"rep",
						"Reputation",
						REP[cls]
					],
					[
						"trait",
						"Trait",
						[
							{
								r: [1, 4],
								title: "Weakened"
							},
							{
								r: [5, 9],
								title: "Standard"
							},
							{
								r: [10, 14],
								title: "Strong"
							},
							{
								r: [15, 19],
								title: "Exceptional"
							},
							{
								r: [20, 20],
								title: "Legendary"
							}
						]
					],
					[
						"skill",
						"Signature",
						SIGNATURE[cls]
					],
					[
						"shadow",
						"Shadow",
						SHADOW[cls]
					],
					[
						"enchant",
						"Enchantment",
						ENCHANTS[cls]
					],
					[
						"destiny",
						"Destiny",
						DESTINY[cls]
					]
				].map(([k, label, table]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => rollOne(k),
					className: "mt-2 flex w-full min-h-16 items-center gap-3 rounded-[var(--radius-md)] bg-ink px-3 py-2 text-left shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dice20, {
							value: rolls[k],
							spinning: spinAll || spinKey === k,
							size: 52
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block font-display text-[10px] uppercase tracking-wider text-muted",
								children: label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm",
								children: preview(table, rolls[k])
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-[10px] uppercase tracking-wider text-muted",
							children: "d20"
						})
					]
				}, k))]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						variant: "ember",
						disabled: !canForge,
						onClick: () => err(forge({
							name,
							cls,
							race,
							lineage,
							origin,
							rolls
						})),
						children: cost === 0 ? "Forge" : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["Forge · ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coin, { n: cost })] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "w-full",
						onClick: () => hollowDecide(false),
						children: "Let the Hollow decide"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "quiet",
						onClick: () => setStep(1),
						children: "Back"
					})
				]
			})] }) : null
		]
	});
}
function MapView() {
	const s = useGame((g) => g.s);
	const selectLoc = useGame((g) => g.selectLoc);
	const deploy = useGame((g) => g.deploy);
	const loc = s.selectedLoc ?? "ironclad";
	const L = locById(loc);
	const idle = idleAtHq(s);
	const [party, setParty] = (0, import_react.useState)([]);
	const [kind, setKind] = (0, import_react.useState)("scout");
	const touched = (0, import_react.useRef)(false);
	const progress = s.locations[loc];
	const merchant = NPCS.find((n) => n.loc === loc);
	const buy = useGame((g) => g.buyNpc);
	const idleIds = idle.map((o) => o.id).join(",");
	const lastPartyKey = (s.lastParty ?? []).join(",");
	(0, import_react.useEffect)(() => {
		const present = idleIds.split(",").filter(Boolean);
		const same = (a, b) => a.length === b.length && a.every((id, i) => id === b[i]);
		if (touched.current) {
			setParty((p) => {
				const next = p.filter((id) => present.includes(id));
				return same(p, next) ? p : next;
			});
			return;
		}
		const remembered = lastPartyKey.split(",").filter((id) => present.includes(id));
		if (remembered.length) {
			setParty((p) => same(p, remembered) ? p : remembered);
			return;
		}
		if (s.tutorial === "sortie" && present.length) {
			const next = [present[0]];
			setParty((p) => same(p, next) ? p : next);
			setKind((k) => k === "scout" ? k : "scout");
		}
	}, [
		s.tutorial,
		idleIds,
		lastPartyKey
	]);
	const kinds = [
		{
			id: "scout",
			label: "Scout"
		},
		{
			id: "forage",
			label: "Forage"
		},
		{
			id: "raid",
			label: "Raid"
		},
		{
			id: "trade",
			label: "Trade",
			locked: !merchant
		},
		{
			id: "bounty",
			label: "Bounty",
			locked: !s.bounty || s.bounty.location !== loc
		},
		{
			id: "boss",
			label: progress.bossDefeated ? "Cleared" : "Arc boss",
			locked: !progress.bossUnlocked || progress.bossDefeated
		}
	];
	const toggle = (id) => {
		touched.current = true;
		setParty((p) => p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]);
	};
	const dangerTone = [
		"text-ok",
		"text-ok",
		"text-ember",
		"text-danger",
		"text-danger"
	][Math.max(0, L.danger - 1)];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4 pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "The Hollow Realm" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Deploy"
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorldAtlas, {
				loc,
				onSelect: (id) => s.locations[id].unlocked && selectLoc(id)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-1 overflow-x-auto pb-1",
				children: ARC_ORDER.map((id, i) => {
					const w = locById(id);
					const p = s.locations[id];
					const here = currentArcLoc(s) === id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: cn("shrink-0 rounded-full px-2.5 py-1 font-display text-[10px] uppercase tracking-[0.14em]", p.bossDefeated ? "bg-ok/15 text-ok" : here ? "bg-ember/15 text-ember" : "bg-ink text-muted"),
						children: [
							i + 1,
							". ",
							w.short
						]
					}, id);
				})
			}),
			s.arc && s.squad.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "glass-strong bg-transparent",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-display text-[10px] uppercase tracking-[0.2em] text-ember",
					children: [
						"Main ARC · turn ",
						s.arc.turn,
						" · ",
						s.squad.find((m) => m.id === s.arc?.turnMemberId)?.name
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-moon",
					children: [
						"Raid, bounty, and boss in ",
						locById(currentArcLoc(s)).short,
						" wait on that rider. Scout and forage stay open."
					]
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2 overflow-x-auto pb-1",
				children: WORLD.filter((w) => w.id !== "hq").map((w) => {
					const unlocked = s.locations[w.id].unlocked;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, {
						active: loc === w.id,
						disabled: !unlocked,
						onClick: () => unlocked && selectLoc(w.id),
						children: [!unlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "mr-1 inline size-3" }) : null, w.short]
					}, w.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "bg-raised",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-start justify-between gap-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-display text-lg",
								children: L.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: L.desc
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: cn("mt-1 font-display text-[10px] uppercase tracking-[0.16em]", dangerTone),
								children: [
									"Danger ",
									L.danger,
									" · intel ",
									progress.intel,
									" · sorties ",
									progress.missions
								]
							})
						] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-1.5",
						children: L.features.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-ink px-2 py-1 text-[11px] text-muted",
							children: f
						}, f))
					}),
					loc === "hq" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: "HQ is rest, not a sortie. Pick a region."
					}) : !progress.unlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: "Sealed. Survive more days."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 grid grid-cols-3 gap-2",
							children: kinds.map((k) => {
								const Icon = KIND_ICON[k.id];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									disabled: k.locked,
									onClick: () => {
										sfx.click();
										setKind(k.id);
									},
									className: cn("flex min-h-16 flex-col items-start justify-center rounded-[var(--radius-md)] px-2.5 py-2 text-left disabled:opacity-30", kind === k.id ? "bg-ember/15 shadow-[var(--shadow-border-hover)]" : "bg-ink shadow-[var(--shadow-border)]"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1.5 font-display text-[11px] uppercase tracking-wider",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5 text-ember" }),
											" ",
											k.label
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-1 line-clamp-2 text-[11px] text-muted",
										children: KIND_HELP[k.id]
									})]
								}, k.id);
							})
						}),
						kind === "bounty" && s.bounty ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-moon",
							children: [
								s.bounty.name,
								" · DC ",
								s.bounty.dc,
								" · ",
								s.bounty.reward
							]
						}) : null,
						kind === "boss" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-ember",
							children: VILLAINS.find((v) => v.loc === loc)?.tagline
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Party · max 3" }),
						idle.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "No idle operatives at HQ. Heal, rest, or wait for a return."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							children: idle.map((op) => {
								const on = party.includes(op.id);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => {
										sfx.click();
										toggle(op.id);
									},
									className: cn("flex min-h-14 items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2", on ? "bg-ember/15 shadow-[var(--shadow-border-hover)]" : "bg-ink shadow-[var(--shadow-border)]"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portrait, {
										op,
										size: 32
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-left",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block font-display text-sm",
											children: op.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-[11px] text-muted",
											children: op.cls
										})]
									})]
								}, op.id);
							})
						})
					] })
				]
			}),
			merchant && progress.unlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionLabel, { children: [
					merchant.name,
					" · ",
					merchant.title
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm italic text-moon",
					children: [
						"“",
						merchant.quote,
						"”"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 space-y-2",
					children: merchant.stock.map((st) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: st.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => err(buy(st.name, st.price)),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coin, { n: st.price })
						})]
					}, st.name))
				})
			] }) : null,
			loc !== "hq" && progress.unlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sticky bottom-20 z-10 -mx-4 bg-gradient-to-t from-ink via-ink/95 to-transparent px-4 pt-8 pb-1 md:bottom-4 md:mx-0 md:px-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: cn("w-full", s.tutorial === "sortie" && "ms-nudge"),
					variant: "ember",
					sound: "none",
					disabled: !party.length,
					onClick: () => {
						const msg = deploy(loc, kind, party);
						if (msg) err(msg);
						else {
							sfx.deploy();
							touched.current = false;
							setParty([]);
						}
					},
					children: ["Deploy ", party.length ? `· ${party.length} to ${L.short}` : "— pick who walks"]
				})
			}) : null
		]
	});
}
var KIND_ICON = {
	scout: Eye,
	forage: Package,
	raid: Swords,
	trade: Scale,
	bounty: Crosshair,
	boss: Skull
};
function LedgerView() {
	const s = useGame((g) => g.s);
	const buy = useGame((g) => g.buyOffer);
	const deposit = useGame((g) => g.depositCard);
	const withdraw = useGame((g) => g.withdrawCard);
	const register = useGame((g) => g.registerRider);
	const shop = s.shop;
	const me = seatedMember(s);
	const [amt, setAmt] = (0, import_react.useState)("100");
	const [plateName, setPlateName] = (0, import_react.useState)(isVacant(me) ? "" : me.name);
	const [plateHandle, setPlateHandle] = (0, import_react.useState)(me.discordHandle?.replace(/^@/, "") ?? "");
	const n = Math.max(0, Math.floor(Number(amt) || 0));
	(0, import_react.useEffect)(() => {
		setPlateName(isVacant(me) ? "" : me.name);
		setPlateHandle(me.discordHandle?.replace(/^@/, "") ?? "");
	}, [
		me.id,
		me.name,
		me.discordHandle
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4 pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "The Ledger" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Personal balance"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Compound vault is shared. The black card is whoever is seated. Stamp a name and handle — a new rider gets their own plate."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoonCard, { member: me }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-2",
				onSubmit: (e) => {
					e.preventDefault();
					err(register(plateName, plateHandle));
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: isVacant(me) ? "Claim this plate" : "Stamp this plate" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2 sm:flex-row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: plateName,
								onChange: (e) => setPlateName(e.target.value),
								placeholder: "Player name",
								"aria-label": "Cardholder name",
								className: "min-h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: plateHandle,
								onChange: (e) => setPlateHandle(e.target.value),
								placeholder: "@handle or snowflake",
								"aria-label": "Discord handle",
								className: "min-h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								variant: "ember",
								children: isVacant(me) ? "Claim" : "Stamp"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Paste a Tyrone link in the handle field and it will sit that rider. Squad holds everyone else on this file."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					className: "bg-raised",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Compound" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl tabular-nums",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coin, { n: s.coins })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					className: "bg-raised",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Your card" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl tabular-nums text-ember",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coin, { n: me.personalCaps })
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2 sm:flex-row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: amt,
						onChange: (e) => setAmt(e.target.value.replace(/[^\d]/g, "")),
						inputMode: "numeric",
						"aria-label": "Amount",
						className: "min-h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ember",
						className: "flex-1",
						onClick: () => err(deposit(n)),
						children: "Deposit"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "flex-1",
						onClick: () => err(withdraw(n)),
						children: "Withdraw"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-display text-xl",
				children: "Daily stock"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Pays from the compound vault. Refreshes at dawn. Ledger 3 grants a discount."
			}),
			!shop ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm",
				children: "No stock until you assume command."
			}) }) : [
				"bargain",
				"essential",
				"artifact"
			].map((tier) => {
				const o = shop[tier];
				const sold = shop.bought?.[tier];
				const disc = s.rooms.ledger >= 3 ? .85 : 1;
				const price = Math.round(o.price * disc);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					className: "bg-raised",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-display text-[10px] uppercase tracking-[0.2em] text-ember",
									children: tier
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RarityMark, { rarity: o.rarity })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 font-display text-lg",
								children: o.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: o.effect
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							onClick: () => err(buy(tier)),
							disabled: sold || s.coins < price,
							children: sold ? "Sold" : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coin, { n: price })
						})]
					})
				}, tier);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Treasury" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted",
					children: [
						"Hollow Ore ",
						s.ore,
						" · Moon Favor ",
						s.moonFavor,
						s.challengeCoin ? " · Challenge Coin held" : ""
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-xs text-muted",
					children: [
						"Vault holds ",
						s.vault.length,
						" gear pieces. Idle income ",
						incomePerTick(s),
						" caps per tick."
					]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Command log" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-h-64 space-y-2 overflow-y-auto ms-scroll",
				children: [s.log.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Nothing written yet."
				}) : null, s.log.slice(0, 24).map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-b border-line/40 pb-2 text-sm last:border-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-display text-[10px] uppercase tracking-wider text-ember",
						children: [
							"Day ",
							e.day,
							" · ",
							e.who
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-moon",
						children: e.what
					})]
				}, e.id))]
			})] })
		]
	});
}
function SquadView() {
	const s = useGame((g) => g.s);
	const register = useGame((g) => g.registerRider);
	const playAs = useGame((g) => g.playAs);
	const gift = useGame((g) => g.giftRider);
	const pass = useGame((g) => g.passTurn);
	const me = seatedMember(s);
	const turn = s.squad.find((m) => m.id === s.arc?.turnMemberId);
	const [q, setQ] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [handle, setHandle] = (0, import_react.useState)("");
	const [giftAmt, setGiftAmt] = (0, import_react.useState)("50");
	const [picked, setPicked] = (0, import_react.useState)(null);
	const query = q.trim().toLowerCase();
	const rows = s.squad.filter((m) => {
		if (!query) return true;
		return m.name.toLowerCase().includes(query) || (m.discordHandle ?? "").toLowerCase().includes(query) || (m.discordId ?? "").toLowerCase().includes(query);
	});
	const profile = s.squad.find((m) => m.id === picked) ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4 pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Moon Squad" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "The file"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "One campaign. Many riders. Register a name and handle, search the list, sit in their chair when the ARC turn comes around. Their black card paints the moment they sit."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TyroneHandshake, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "glass-strong bg-transparent",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-display text-[10px] uppercase tracking-[0.2em] text-ember",
						children: [
							"Arc ",
							s.arc?.chapter ?? 1,
							" · ",
							locById(currentArcLoc(s)).name
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-moon",
						children: [
							"Seated as ",
							me.name,
							turn ? ` · ARC turn ${turn.name}` : ""
						]
					}),
					s.squad.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "quiet",
						className: "mt-3",
						onClick: () => pass(),
						children: "Pass ARC turn"
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-2",
				onSubmit: (e) => {
					e.preventDefault();
					err(register(name, handle));
					setName("");
					setHandle("");
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Register a rider" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 sm:flex-row",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: name,
							onChange: (e) => setName(e.target.value),
							placeholder: "Player name",
							className: "min-h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: handle,
							onChange: (e) => setHandle(e.target.value),
							placeholder: "Discord handle",
							className: "min-h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							variant: "ember",
							children: "Register"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: q,
				onChange: (e) => setQ(e.target.value),
				placeholder: "Search name or handle",
				"aria-label": "Search squad",
				className: "min-h-11 w-full rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "No rider matches."
				}) }) : rows.map((m) => {
					const onTurn = s.arc?.turnMemberId === m.id;
					const seated = s.activeMemberId === m.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							sfx.click();
							setPicked(m.id);
						},
						className: cn("flex w-full min-h-14 items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-left shadow-[var(--shadow-border)]", seated ? "bg-ember/10" : "bg-raised"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-11 items-center justify-center rounded-full bg-ink font-display text-sm text-ember",
								children: m.name.slice(0, 2).toUpperCase()
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate font-display text-sm",
									children: m.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "block truncate text-[11px] text-muted",
									children: [
										m.discordHandle ?? "no handle",
										" · ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coin, { n: m.personalCaps })
									]
								})]
							}),
							onTurn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-[10px] uppercase tracking-[0.16em] text-ember",
								children: "Turn"
							}) : null
						]
					}, m.id);
				})
			}),
			profile ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "bg-raised",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Profile" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-xl",
						children: profile.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-moon",
						children: profile.discordHandle ?? "Unlinked"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							"Joined day ",
							profile.joinedDay,
							" · card ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coin, { n: profile.personalCaps }),
							" · XP ",
							profile.xp
						]
					}),
					profile.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-moon",
						children: profile.note
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-col gap-2 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ember",
							className: "flex-1",
							onClick: () => playAs(profile.id),
							children: ["Sit as ", profile.name.split(" ")[0]]
						}), profile.id !== me.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-1 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: giftAmt,
								onChange: (e) => setGiftAmt(e.target.value.replace(/[^\d]/g, "")),
								inputMode: "numeric",
								"aria-label": "Gift amount",
								className: "min-h-11 w-24 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								className: "flex-1",
								onClick: () => err(gift(profile.id, Number(giftAmt) || 0)),
								children: "Send caps"
							})]
						}) : null]
					})
				]
			}) : null,
			s.arc?.log.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "ARC log" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-1.5 text-sm text-muted",
				children: s.arc.log.slice(0, 8).map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: line }, `${i}-${line.slice(0, 12)}`))
			})] }) : null
		]
	});
}
function CodexView() {
	const [tab, setTab] = (0, import_react.useState)("arcs");
	const how = (0, import_react.useMemo)(() => [
		{
			t: "d20",
			d: "1 fumble. 2–4 fail. 5–9 weak. 10–14 success. 15–19 strong. 20 critical."
		},
		{
			t: "Power",
			d: "Class + race + trait on the primary stat + gear + companion − curses."
		},
		{
			t: "Downed",
			d: "0 HP. Infirmary can stand them up. Rest without an Infirmary kills them permanently."
		},
		{
			t: "Fumble",
			d: "Weapons degrade Pristine → Worn → Damaged → Broken. Broken deals nothing. Pay the Forge."
		},
		{
			t: "Arcs",
			d: "Ironclad first, then Kingdom, Caverns, Library, Veyra City last. Raid, bounty, and the chapter boss wait on the rider whose turn it is."
		},
		{
			t: "Moon Squad",
			d: "We walk the Hollow so others don't have to."
		}
	], []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4 pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Codex" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "What the Hollow remembers"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2",
				children: [
					"arcs",
					"races",
					"rules"
				].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: tab === t,
					onClick: () => setTab(t),
					children: t
				}, t))
			}),
			tab === "arcs" && VILLAINS.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "bg-raised",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-display text-[10px] uppercase tracking-[0.2em] text-ember",
						children: v.arc
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-1 font-display text-lg",
						children: v.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: [
							v.title,
							" · ",
							v.threat
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm italic text-moon",
						children: v.tagline
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: v.lore
					})
				]
			}, v.id)),
			tab === "races" && Object.values(RACES).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "bg-raised",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-lg",
						children: r.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm italic text-moon",
						children: r.tagline
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm",
						children: r.ability
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-muted",
						children: r.desc
					})
				]
			}, r.name)),
			tab === "rules" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				className: "space-y-4 text-sm leading-relaxed text-moon",
				children: how.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
						className: "text-paper",
						children: [h.t, "."]
					}),
					" ",
					h.d
				] }, h.t))
			})
		]
	});
}
var NAV = [
	{
		id: "hq",
		label: "Compound",
		icon: Landmark
	},
	{
		id: "roster",
		label: "Roster",
		icon: Users
	},
	{
		id: "squad",
		label: "Squad",
		icon: IdCard
	},
	{
		id: "map",
		label: "Deploy",
		icon: Swords,
		hint: "sortie"
	},
	{
		id: "vault",
		label: "Vault",
		icon: Archive
	},
	{
		id: "ledger",
		label: "Ledger",
		icon: ScrollText
	},
	{
		id: "codex",
		label: "Codex",
		icon: BookOpen
	}
];
function GameApp() {
	const hydrate = useGame((g) => g.hydrate);
	const pullArcade = useGame((g) => g.pullArcade);
	const hydrated = useGame((g) => g.hydrated);
	const persist = useGame((g) => g.persist);
	const tick = useGame((g) => g.tick);
	const screen = useGame((g) => g.s.screen);
	const started = useGame((g) => g.s.started);
	(0, import_react.useLayoutEffect)(() => {
		hydrate();
	}, [hydrate]);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		pullArcade();
	}, [hydrated, pullArcade]);
	(0, import_react.useEffect)(() => {
		const unlock = () => {
			unlockAudio();
			startAmbient();
		};
		window.addEventListener("pointerdown", unlock, { once: true });
		const onVis = () => {
			if (!document.hidden) unlockAudio();
		};
		document.addEventListener("visibilitychange", onVis);
		return () => {
			window.removeEventListener("pointerdown", unlock);
			document.removeEventListener("visibilitychange", onVis);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		document.querySelector("main")?.scrollTo({ top: 0 });
	}, [screen]);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		let t = 0;
		const unsub = useGame.subscribe(() => {
			window.clearTimeout(t);
			t = window.setTimeout(() => useGame.getState().persist(), 450);
		});
		const onHide = () => useGame.getState().persist();
		window.addEventListener("pagehide", onHide);
		document.addEventListener("visibilitychange", onHide);
		return () => {
			unsub();
			window.clearTimeout(t);
			persist();
			window.removeEventListener("pagehide", onHide);
			document.removeEventListener("visibilitychange", onHide);
		};
	}, [hydrated, persist]);
	(0, import_react.useEffect)(() => {
		if (!hydrated || !started) return;
		const id = window.setInterval(() => useGame.getState().tick(), TICK_SECONDS * 1e3);
		return () => window.clearInterval(id);
	}, [
		hydrated,
		started,
		tick
	]);
	if (!hydrated || screen === "title") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MainMenu, {});
	if (screen === "rules") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RulesView, {});
	if (screen === "briefing") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefing, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TalkOverlay, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelpChrome, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToastHost, {})
	] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh bg-ink text-paper",
		"data-ready": "1",
		"data-screen": screen,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rail, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-1 flex-col",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hud, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ObjectiveBar, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
						className: "ms-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-28 md:px-8 md:pb-8",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ms-rise mx-auto w-full max-w-3xl",
							children: [
								screen === "hq" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HQView, {}),
								screen === "roster" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RosterView, {}),
								screen === "forge" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ForgeView, {}),
								screen === "map" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapView, {}),
								screen === "vault" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VaultView, {}),
								screen === "ledger" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LedgerView, {}),
								screen === "squad" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquadView, {}),
								screen === "codex" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CodexView, {})
							]
						}, screen)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dock, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MissionOverlay, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CombatOverlay, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OperativeSheet, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RestConfirm, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToastHost, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TerminalOverlay, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TalkOverlay, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelpChrome, {})
		]
	});
}
function ObjectiveBar() {
	const s = useGame((g) => g.s);
	const setScreen = useGame((g) => g.setScreen);
	const rest = useGame((g) => g.rest);
	const selectOp = useGame((g) => g.selectOp);
	const obj = nextObjective(s);
	if (s.mission || s.combat) return null;
	const here = s.screen === obj.screen || obj.cta === "Rest" && s.screen === "hq";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => {
			sfx.click();
			if (obj.cta === "Rest") {
				rest();
				return;
			}
			if (obj.opId) selectOp(obj.opId);
			setScreen(obj.screen);
		},
		className: cn("flex min-h-11 w-full items-center justify-between gap-3 border-b border-line/70 bg-raised/90 px-4 text-left md:px-6", !here && "text-paper"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "min-w-0 truncate text-[13px] text-moon",
			children: obj.text
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("shrink-0 font-display text-[10px] uppercase tracking-[0.16em] text-ember", !here && "ms-nudge"),
			children: obj.cta
		})]
	});
}
function Hud() {
	const s = useGame((g) => g.s);
	const rest = useGame((g) => g.rest);
	const setScreen = useGame((g) => g.setScreen);
	const openGuide = useGame((g) => g.openGuide);
	const busy = !!s.mission || !!s.combat;
	const income = incomePerTick(s);
	const forgeNudge = s.tutorial === "forge" || s.operatives.filter((o) => o.status !== "dead").length === 0;
	const [mute, setMute] = (0, import_react.useState)(isMuted);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.repeat) return;
			if (e.target?.closest("input, textarea, select")) return;
			const st = useGame.getState();
			if (e.key === "Escape") {
				if (st.s.hack) {
					st.closeTerminal();
					return;
				}
				if (st.confirmRest) {
					st.cancelRest();
					return;
				}
				if (st.s.selectedId && !st.s.combat && !st.s.mission) {
					st.selectOp(null);
					return;
				}
			}
			if (e.key === "m" || e.key === "M") {
				const next = toggleMute();
				setMute(next);
				if (!next) sfx.click();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "flex items-center gap-3 border-b border-line/70 bg-surface/90 px-3 py-2.5 backdrop-blur-sm md:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex items-center gap-2",
				onClick: () => {
					sfx.click();
					setScreen("title");
				},
				"aria-label": "Main menu",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoonCrest, { className: "size-7" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden font-display text-[11px] uppercase tracking-[0.22em] text-ember md:inline",
					children: "SYNAPSE"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "font-display text-[11px] uppercase tracking-[0.2em] text-muted",
					children: [
						"Day ",
						s.day,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-ember",
							children: [" · rank ", s.level]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-ember",
							children: [" · +", income]
						}),
						s.squad.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-moon",
							children: [
								" ",
								"· ",
								s.squad.find((m) => m.id === s.activeMemberId)?.name ?? s.discordName ?? "rider",
								s.arc && s.arc.turnMemberId !== s.activeMemberId ? ` · turn ${s.squad.find((m) => m.id === s.arc?.turnMemberId)?.name ?? ""}` : ""
							]
						}) : null
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveCoin, {
					n: s.coins,
					className: "font-display text-lg text-paper"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": "Ask Tyrone",
				"data-help": "1",
				onClick: () => {
					sfx.click();
					openGuide();
				},
				className: "hidden size-11 items-center justify-center rounded-[var(--radius-sm)] text-ember shadow-[var(--shadow-border)] hover:text-ember-bright md:inline-flex",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleHelp, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": mute ? "Unmute" : "Mute",
				onClick: () => {
					const next = toggleMute();
					setMute(next);
					if (!next) sfx.click();
				},
				className: "inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] text-muted shadow-[var(--shadow-border)] hover:text-paper",
				children: mute ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				disabled: busy,
				onClick: () => {
					sfx.click();
					rest();
				},
				className: cn("inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 font-display text-[10px] uppercase tracking-[0.16em] text-moon shadow-[var(--shadow-border)] transition-colors hover:text-paper disabled:opacity-40", s.tutorial === "rest" && "ms-nudge text-ember"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-4" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden sm:inline",
						children: "Rest until dawn"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "sm:hidden",
						children: "Dawn"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": "Forge operative",
				onClick: () => {
					unlockAudio();
					sfx.click();
					setScreen("forge");
				},
				className: cn("inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] bg-ember text-ink transition-transform active:scale-[0.96]", forgeNudge && "ms-nudge"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" })
			})
		]
	});
}
function NavButtons({ compact }) {
	const screen = useGame((g) => g.s.screen);
	const setScreen = useGame((g) => g.setScreen);
	const tutorial = useGame((g) => g.s.tutorial);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: NAV.map((n) => {
		const Icon = n.icon;
		const active = screen === n.id || n.id === "roster" && screen === "forge";
		const nudge = n.hint === "sortie" && tutorial === "sortie";
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			"aria-current": active ? "page" : void 0,
			onClick: () => {
				unlockAudio();
				sfx.click();
				setScreen(n.id);
			},
			className: cn("flex min-h-12 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left transition-colors", compact && "flex-1 flex-col justify-center gap-1 px-1", active ? "bg-ember/10 text-ember" : "text-muted hover:text-paper", nudge && "ms-nudge text-ember"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("font-display uppercase tracking-[0.16em]", compact ? "text-[9px]" : "text-[11px]"),
				children: n.label
			})]
		}, n.id);
	}) });
}
function Rail() {
	const setScreen = useGame((g) => g.setScreen);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "hidden w-[5.5rem] flex-col items-stretch border-r border-line/70 bg-surface py-4 md:flex",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "mx-auto mb-6",
			onClick: () => {
				sfx.click();
				setScreen("title");
			},
			"aria-label": "Main menu",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoonCrest, { className: "size-9" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
			className: "flex flex-1 flex-col gap-1 px-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavButtons, {})
		})]
	});
}
function Dock() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "fixed inset-x-0 bottom-0 z-20 flex border-t border-line/70 bg-surface/95 px-1 pt-1 backdrop-blur-sm md:hidden",
		style: { paddingBottom: "max(8px, env(safe-area-inset-bottom))" },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavButtons, { compact: true })
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameApp, {});
}
//#endregion
export { Home as component };
