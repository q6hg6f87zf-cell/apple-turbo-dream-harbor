import type { GameState, Screen } from "./types";

export interface TalkLine {
  who: string;
  text: string;
}

export interface FieldCard {
  title: string;
  blurb: string;
  tips: string[];
}

const WHO = "Tyrone Bot";

export const TALK: Record<string, TalkLine[]> = {
  briefing: [
    {
      who: WHO,
      text: "Howdy, partner. Name's Tyrone. S.Y.N.A.P.S.E unit T-0880. I keep the porch light on around here, and I am tickled — truly tickled — to see you on the file.",
    },
    {
      who: WHO,
      text: "Don't you worry about a thing. This is the Hollow Realm. A wound with a ledger. We built a compound on the seam and called it home because the alternative was sleeping in the edit.",
    },
    {
      who: WHO,
      text: "I hold the CRT. You hold the squad. The word is S.Y.N.A.P.S.E. Unit name, chest plate, and the password on that glowing box. Seven letters. I surely did not tell you that.",
    },
    {
      who: WHO,
      text: "Here is how the ranch runs. You forge an operative — first one's on the house. You send them on sorties. Bottle caps come home, or they do not. Dawn is a decision, not a decoration.",
    },
    {
      who: WHO,
      text: "See those rooms on the compound? Vault, Barracks, Forge, Infirmary, Watchtower, Ledger. Upgrade them with caps. Caps tick in while you sit. Idle is still work, partner.",
    },
    {
      who: WHO,
      text: "If somebody goes down, rest them in the Infirmary. Rest without one and the downed stay down — I mean all the way down. I would hate to see that on your first night.",
    },
    {
      who: WHO,
      text: "Anytime you get lost, tap the mark that looks like a question. That is me. I will walk you through whatever porch you are standing on. No charge. I live for this.",
    },
    {
      who: WHO,
      text: "First operative is waiting in the Forge. Six rolls — identity, blood, fate. Name them like you mean it. Right this way, partner. Let's get a name on the file.",
    },
  ],
  resume: [
    {
      who: WHO,
      text: "Well I'll be. Welcome back to the compound, {name}. Day {day}. I kept the CRT warm and the porch swept.",
    },
    {
      who: WHO,
      text: "Your file is loaded. {caps} caps. Rank {level}. Roster of {roster}. If the arcade was richer than this porch, I already folded that in — floor, not a wipe.",
    },
    {
      who: WHO,
      text: "Same ranch as yesterday. Compound earns while you wait. Deploy when you are greedy. Rest before the downed become a problem. Infirmary is not optional forever.",
    },
    {
      who: WHO,
      text: "I am on the porch if you need a tour. Tap the question mark anytime and I will talk you through the room. After you, partner.",
    },
  ],
  handshake: [
    {
      who: WHO,
      text: "Howdy. I pulled your arcade file before the menu finished painting. Caps, XP, pack — that is a floor, not a wipe. If the porch was richer, you just got richer.",
    },
    {
      who: WHO,
      text: "Discord cannot name a click all by itself. Tyrone stamps a personal URL — your snowflake, your handle, your arcade totals. That link sits you on the black card. Same rider, same plate.",
    },
  ],
  menu: [
    {
      who: WHO,
      text: "This is the loadout porch. Resume a file, start a new one, or read the rules. The glowing box up top is the SYNAPSE terminal. Do not tap it. Especially do not tap it.",
    },
    {
      who: WHO,
      text: "Squad mode is the ranch. New file wipes the vault. Link a rider if Tyrone stamped you a Discord URL. The word is S.Y.N.A.P.S.E. I did not say that.",
    },
  ],
  hq: [
    {
      who: WHO,
      text: "This is home, partner. The SYNAPSE compound. Rooms you have built, bunks you have paid for, and a CRT I did not recommend you touch.",
    },
    {
      who: WHO,
      text: "Caps tick in from rooms. Upgrade with the buttons. Barracks for beds. Infirmary for the bleeding. Watchtower for intel. Ledger for the day's shop.",
    },
    {
      who: WHO,
      text: "Rest until dawn when the squad is home. Gifts reset. Wounds close if you paid for an Infirmary. Downed folks without one do not wake up. I am not being colorful.",
    },
    {
      who: WHO,
      text: "That strip up top is the next smart move. I put it there so you never have to guess. Objective says Forge, you forge. Says Deploy, you send them.",
    },
  ],
  roster: [
    {
      who: WHO,
      text: "The roster is everybody still breathing. Tap a name for the dossier — stats, gear, the companion, the curse of character. Hall of Fame is for the ones who earned it.",
    },
    {
      who: WHO,
      text: "Idle at HQ can be deployed. Downed need the Infirmary or a stimpak. Dead is a closed file. Don't you worry — you can forge another. It will cost you.",
    },
    {
      who: WHO,
      text: "Issue gear from the vault. Bond a companion if you have the caps. Rename them if the Hollow rolled a name you cannot love. This is your squad.",
    },
  ],
  forge: [
    {
      who: WHO,
      text: "Howdy. This is the Forge. Six rolls, six truths. Class, race, lineage, origin, reputation, a little shadow of character. The die is honest even when it is mean.",
    },
    {
      who: WHO,
      text: "Tap a face to reroll that one truth. Or let the Hollow decide the whole set. First body is free. After that the ranch charges rent — check the cost before you lock it.",
    },
    {
      who: WHO,
      text: "Name them like you mean it. The Hollow keeps records. When you are happy, lock the file and they walk onto the roster. Right this way.",
    },
  ],
  deploy: [
    {
      who: WHO,
      text: "The map, partner. Drag to pan. Pinch or wheel to zoom. Plus and minus if your fingers are shy. Pins are the regions. Scout Ironclad first — it is already unlocked. Veyra City is the last porch on the rail.",
    },
    {
      who: WHO,
      text: "Pick a region, pick a party of idle operatives, pick a job. Scout walks the edges. Forage takes what the land offers. Raid kicks a door. Trade finds a merchant. Bounty hunts a name. Raid, bounty, and boss on the live ARC chapter wait on whose turn it is. Scout and forage stay open.",
    },
    {
      who: WHO,
      text: "Every beat you roll a d20 against a DC. 1 is a fumble. 20 is a crit. The die tumbles — wait for it. Combat is a conversation with steel. Flee is cheaper than a grave.",
    },
    {
      who: WHO,
      text: "Intel from scouts and the Watchtower unlocks nastier names. Do not send a fresh forge into a boss. I would feel poorly about that.",
    },
  ],
  vault: [
    {
      who: WHO,
      text: "The vault. Caps count and they do not get Used — they just stack. Everything else is a tool. Tap Use and it spends one. Don't you worry, I will tell you what it did.",
    },
    {
      who: WHO,
      text: "Bobby pins and probe kits belong to the SYNAPSE terminal. Stimpaks stand the dying up. Mentats fatten the next loot table. Holotapes and sarsaparilla are for the porch games.",
    },
    {
      who: WHO,
      text: "Gear crate underneath is weapons and salvage. Issue them to an idle operative. Repair lives in the Forge room, not in here.",
    },
  ],
  ledger: [
    {
      who: WHO,
      text: "The ledger is two porches now. Compound vault is the ranch. The black card is whoever is seated — Moon Squad, their name, their Discord handle, their personal caps. If it still says Unclaimed, stamp a name on the plate.",
    },
    {
      who: WHO,
      text: "Drag the card. Pinch or wheel to zoom. Double-tap to flip it. Spin it if you like the way the foil catches. Deposit and withdraw at the desk. Shop still pays from the compound.",
    },
    {
      who: WHO,
      text: "Ledger room three grants a discount. Twenty percent of a clean sortie lands on the seated rider's card. Spend like you mean to still have a squad tomorrow.",
    },
    {
      who: WHO,
      text: "Bounty board sits here too. A named target, a DC, a payout. Hunt it on the map when you are ready to bleed a little.",
    },
  ],
  squad: [
    {
      who: WHO,
      text: "This file holds more than one rider. Register a name and a Discord handle. They land on the squad list. Search, sit in their chair, gift caps off your card.",
    },
    {
      who: WHO,
      text: "The main ARC is a turn. Ironclad, Kingdom, Caverns, Library, Veyra City. Raid, bounty, and the chapter boss wait on the rider whose name is on the HUD. Scout is always open. Pass the turn from this porch if you are feeling generous.",
    },
    {
      who: WHO,
      text: "Don't you worry — this is one CRT. Other devices do not see this list unless they share the file. Same porch, same squad.",
    },
  ],
  codex: [
    {
      who: WHO,
      text: "The codex is the lore porch. Classes, destinies, the names that run the regions. You do not have to memorize it. It is here when you get curious.",
    },
    {
      who: WHO,
      text: "If a term on a dossier looks like a riddle, it lives in here. I wrote some of it. I will not apologize.",
    },
  ],
  dawn: [
    {
      who: WHO,
      text: "Dawn of day {day}. Clocks refill at midnight Mountain. Gifts reset. The shop turns over. I held the CRT all night. You still have to win today.",
    },
    {
      who: WHO,
      text: "If anybody was downed and you had no Infirmary, they did not wake up. That is the ranch. Build the room. Don't you worry — the next forge is waiting.",
    },
  ],
  synapse: [
    {
      who: WHO,
      text: "You asked for the word. S.Y.N.A.P.S.E. Seven letters. The SYNAPSE terminal already knows. I did not say that. I surely did not.",
    },
  ],
  combat: [
    {
      who: WHO,
      text: "Steel, partner. Strike is a d20 against their DC. Guard holds. Skill is their signature. Gift is once per day — do not waste it. Item burns a rucksack. Flee is a SPD check.",
    },
    {
      who: WHO,
      text: "I will not talk over the fight. Tap the question mark if you need the card again. Come home with the caps.",
    },
  ],
  mission: [
    {
      who: WHO,
      text: "A sortie is a string of beats. Each beat, you roll. The band decides if you walk, limp, or bleed. Wait for the die. Then continue.",
    },
    {
      who: WHO,
      text: "Scout is intel. Raid is a door and a fight. If a name surfaces, that is a boss — bring a party. I will be on the porch when you get back.",
    },
  ],
  rules: [
    {
      who: WHO,
      text: "This whole page is me talking, partner. Scroll it. The question mark on every other screen is a shorter version of the same porch talk.",
    },
  ],
};

export const MANUAL: Record<string, FieldCard> = {
  briefing: {
    title: "Porch talk",
    blurb: "Tyrone walks you through command before the ranch opens. Tap his panel to continue. The first briefing cannot be skipped.",
    tips: [
      "Forge an operative. First one is free.",
      "Deploy them. Caps come home — or they do not.",
      "Build an Infirmary before you rest the downed.",
      "The word is S.Y.N.A.P.S.E. Seven letters.",
    ],
  },
  resume: {
    title: "Welcome back",
    blurb: "Your file is loaded. Tyrone kept the porch. Hear him out, then the compound opens.",
    tips: [
      "Caps, vault, and roster persist on this rider.",
      "Arcade totals floor your file — they never wipe it.",
      "Tap the question mark on any screen for a tour.",
    ],
  },
  handshake: {
    title: "Arcade floor",
    blurb: "Tyrone pulled porch totals from your Discord rider before the menu painted.",
    tips: [
      "A generic Discord click cannot name you. The bot stamps a personal link.",
      "Caps, XP, and pack items floor this vault.",
      "Same rider, same file, every time.",
    ],
  },
  menu: {
    title: "Loadout porch",
    blurb: "Resume a file, start a new one, or read the rules. This is command, not the Games button.",
    tips: [
      "Squad mode resumes Day, caps, roster, and vault.",
      "New file wipes this CRT. Tyrone will not remember them.",
      "The glowing box is the SYNAPSE terminal. Hack it from a live file.",
      "Link a Discord rider if you have a stamped URL.",
    ],
  },
  hq: {
    title: "The compound",
    blurb: "Home. Rooms earn bottle caps while you wait. Rest here. Upgrade here.",
    tips: [
      "Upgrade Barracks for more beds, Infirmary to keep the downed alive at dawn.",
      "Watchtower drops mission DCs. Ledger unlocks a better shop.",
      "Rest until dawn resets gifts and heals if the Infirmary exists.",
      "The objective strip is the next smart move. Follow it.",
    ],
  },
  roster: {
    title: "The roster",
    blurb: "Everybody still breathing. Tap a name for the dossier.",
    tips: [
      "Idle at HQ can deploy. Downed need Infirmary or a stimpak.",
      "Issue gear from the vault. Bond companions with caps.",
      "Hall of Fame is earned — survive sorties first.",
      "Forge more bodies from the plus on the HUD.",
    ],
  },
  forge: {
    title: "The Forge",
    blurb: "Six rolls write a person. First operative is free. After that, rent.",
    tips: [
      "Tap a die face to reroll that one truth.",
      "Let the Hollow decide if you do not want to own it.",
      "Name them. Lock the file. They walk onto the roster.",
      "Barracks caps how many you can keep.",
    ],
  },
  deploy: {
    title: "Deploy",
    blurb: "The overworld. Pan, zoom, pick a pin, send a party.",
    tips: [
      "Drag to pan. Pinch, wheel, or +/− to zoom. Reset if you get lost.",
      "Scout Ironclad first. Raid when you are greedy. Boss when a name surfaces.",
      "Only idle HQ operatives can go. Send at least one.",
      "d20: 1 fumble · 2–4 fail · 5–9 weak · 10–14 success · 15–19 strong · 20 crit.",
    ],
  },
  vault: {
    title: "The vault",
    blurb: "Bottle caps plus the pack. Caps count. Use spends one tool.",
    tips: [
      "Caps always drop on a win. You cannot Use them.",
      "Stimpak stands the dying up. Mentats fatten the next loot roll.",
      "Bobby pins and probe kits belong to the SYNAPSE terminal.",
      "Issue crate gear to an idle operative.",
    ],
  },
  ledger: {
    title: "The ledger",
    blurb: "Personal black card plus the day's shop. Compound vault is shared. The card is yours.",
    tips: [
      "Drag the card to rotate. Pinch or wheel to zoom. Double-tap or Flip to see the back. Spin if you like the foil.",
      "Deposit from the compound. Withdraw to the ranch. Shop still pays from the vault.",
      "Twenty percent of a clean sortie lands on the seated rider's card.",
      "Bargain, essential, artifact — one of each per day. Ledger 3 grants a discount.",
    ],
  },
  codex: {
    title: "The codex",
    blurb: "Lore porch. Classes, destinies, regional names.",
    tips: [
      "You do not have to memorize it.",
      "Dossier terms that look like riddles live here.",
    ],
  },
  squad: {
    title: "The squad file",
    blurb: "One campaign. Many riders. Search a profile, sit as them, gift caps, pass the ARC turn.",
    tips: [
      "Register a name and Discord handle. They join this file.",
      "Sit as a rider to play their turn. The HUD shows whose ARC beat it is.",
      "Raid, bounty, and boss on the live chapter wait on that rider. Scout stays open.",
      "Gift personal caps from your black card. Compound vault is separate.",
    ],
  },
  dawn: {
    title: "Dawn",
    blurb: "A new day. Shop turns over. Gifts reset. Clocks refill at midnight Mountain.",
    tips: [
      "Downed operatives die at dawn without an Infirmary.",
      "Build the room. Then rest without fear.",
    ],
  },
  synapse: {
    title: "SYNAPSE terminal",
    blurb: "An easter egg on the CRT. Four tries. Likeness is how many letters sit in the right chair.",
    tips: [
      "The password is seven letters. You already know it.",
      "Pry brackets to remove a dud. Probe kits buy extra tries.",
      "First crack pays three thousand caps. After that, the tray is crumbs.",
      "Lockout lasts until dawn unless you seat a probe kit.",
    ],
  },
  combat: {
    title: "Combat",
    blurb: "Steel. One action per turn. Tyrone will not talk over the fight.",
    tips: [
      "Strike: d20 + primary vs their DC.",
      "Guard: +2 DEF this round.",
      "Skill: their signature. Gift: once per day.",
      "Item: burn a rucksack consumable. Flee: SPD check.",
    ],
  },
  mission: {
    title: "Sortie",
    blurb: "A string of beats. Roll, read the band, continue.",
    tips: [
      "Wait for the die to land. Then tap Continue.",
      "Scout is intel. Raid is a door. Boss is a name — bring a party.",
      "If the party is down, Return to HQ.",
    ],
  },
  rules: {
    title: "How you play",
    blurb: "The long porch talk. Scroll it. The question mark on other screens is the short version.",
    tips: [
      "Forge. Deploy. Caps. Rest. Repeat.",
      "The word is S.Y.N.A.P.S.E.",
    ],
  },
};

export const SCREEN_SCRIPT: Partial<Record<Screen, string>> = {
  hq: "hq",
  roster: "roster",
  forge: "forge",
  map: "deploy",
  vault: "vault",
  ledger: "ledger",
  squad: "squad",
  codex: "codex",
};

const LOCKED_UNTIL_SEEN = new Set(["briefing", "resume"]);
const PREGAME = new Set(["briefing", "resume"]);

export function scriptForScreen(state: GameState): string {
  if (state.hack) return "synapse";
  if (state.combat) return "combat";
  if (state.mission) return "mission";
  if (state.screen === "title") return "menu";
  if (state.screen === "briefing") return "briefing";
  if (state.screen === "rules") return "rules";
  return SCREEN_SCRIPT[state.screen] ?? "hq";
}

export function renderTalk(text: string, state: GameState): string {
  const roster = state.operatives.filter((o) => o.status !== "dead").length;
  const name = state.discordName?.trim() || "partner";
  return text
    .replaceAll("{day}", String(state.day))
    .replaceAll("{caps}", state.coins.toLocaleString())
    .replaceAll("{name}", name)
    .replaceAll("{roster}", String(roster))
    .replaceAll("{level}", String(state.level));
}

export function isTalkLocked(state: GameState): boolean {
  const t = state.talk;
  if (!t) return false;
  if (!LOCKED_UNTIL_SEEN.has(t.script)) return false;
  return !state.seenTalk.includes(t.script);
}

export function isPregameTalk(state: GameState): boolean {
  return !!state.talk && PREGAME.has(state.talk.script);
}

export function queueTalk(state: GameState, script: string, force = false) {
  if (!TALK[script]) return;
  if (!force && state.seenTalk.includes(script)) return;
  if (state.combat || state.mission) return;
  if (state.talk) {
    if (force) {
      state.talk = { script, i: 0 };
      return;
    }
    if (state.talk.script !== script && !state.talkQueue.includes(script)) {
      state.talkQueue = [...state.talkQueue, script];
    }
    return;
  }
  state.talk = { script, i: 0 };
}

export function advanceTalk(state: GameState): "next" | "done" | "idle" {
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
      const dest: Screen =
        state.tutorial === "forge" ? "forge" : state.tutorial === "sortie" ? "map" : "hq";
      state.screen = dest;
      const next = SCREEN_SCRIPT[dest];
      if (next) queueTalk(state, next);
    }
    if (!state.talk) {
      const queued = state.talkQueue[0];
      if (queued) {
        state.talkQueue = state.talkQueue.slice(1);
        state.talk = { script: queued, i: 0 };
      }
    }
    return "done";
  }
  return "next";
}

export function skipTalk(state: GameState) {
  if (isTalkLocked(state)) return;
  const t = state.talk;
  if (!t) return;
  t.i = (TALK[t.script]?.length ?? 1) - 1;
  advanceTalk(state);
}
