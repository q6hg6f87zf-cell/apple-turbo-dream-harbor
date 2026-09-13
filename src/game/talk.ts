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
      text: "Howdy, partner. Name's Tyrone. S.Y.N.A.P.S.E unit T-0880. Welcome to Vault 13. I live here too, so try not to break anything I cannot weld back together.",
    },
    {
      who: WHO,
      text: "This whole world is the Hollow Realm. Vault 13 sits outside Ironclad, buried into the ridge where the old rail line gives up. Everyone on this file starts here. Home is a generous word, but it is ours.",
    },
    {
      who: WHO,
      text: "I hold the CRT. You hold the squad. The word is S.Y.N.A.P.S.E. Unit name, chest plate, and the password on that glowing box. Seven letters. I surely did not tell you that.",
    },
    {
      who: WHO,
      text: "Here is how Vault 13 runs. You forge an operative. First one's on the house. You send them beyond Ironclad, bring back caps and salvage, and keep this place alive another day.",
    },
    {
      who: WHO,
      text: "Vault 13 has a Salvage Depot, Resident Quarters, Machine Shop, Med Bay, Perimeter Control and Quartermaster Exchange. Upgrade them with caps. Idle is still work around here, partner.",
    },
    {
      who: WHO,
      text: "If somebody goes down, get them into the Med Bay before dawn. Without one running, downed residents may not wake up. I would hate to put that on your first incident report.",
    },
    {
      who: WHO,
      text: "Anytime you get lost, tap the mark that looks like a question. That is me. I will walk you through whatever room you are standing in. No charge. I live for this.",
    },
    {
      who: WHO,
      text: "Your first operative is waiting in the Machine Shop. Every resident is Ironclad-born. The Hollow decides the rest. Name them like you mean it. Let's get a file stamped.",
    },
  ],
  resume: [
    {
      who: WHO,
      text: "Well I'll be. Welcome back to Vault 13, {name}. Day {day}. I kept the CRT warm and the bulkhead mostly attached.",
    },
    {
      who: WHO,
      text: "Your file is loaded. {caps} caps. Rank {level}. Roster of {roster}. If the arcade was richer than this file, I already folded that in. Floor, not a wipe.",
    },
    {
      who: WHO,
      text: "Same vault as yesterday. Rooms earn while you wait. Deploy when you are greedy. Get the wounded to the Med Bay before they become paperwork.",
    },
    {
      who: WHO,
      text: "I am somewhere in Vault 13 if you need a tour. Tap the question mark anytime and I will talk you through the room. After you, partner.",
    },
  ],
  handshake: [
    {
      who: WHO,
      text: "Howdy. I pulled your arcade file before the menu finished painting. Caps, XP, pack. That is a floor, not a wipe. If your old file was richer, Vault 13 just got richer.",
    },
    {
      who: WHO,
      text: "Discord cannot name a click all by itself. Tyrone stamps a personal URL: your snowflake, your handle, your arcade totals. That link sits you on the black card. Same resident, same file.",
    },
  ],
  menu: [
    {
      who: WHO,
      text: "This is the Vault 13 loadout screen. Resume a file, start a new one, or read the rules. The glowing box up top is the SYNAPSE terminal. Do not tap it. Especially do not tap it.",
    },
    {
      who: WHO,
      text: "A new file resets this Vault 13 save. Link a resident if Tyrone stamped you a Discord URL. The word is S.Y.N.A.P.S.E. I did not say that.",
    },
  ],
  hq: [
    {
      who: WHO,
      text: "This is home, partner. Vault 13. Ironclad is out past the ridge, the wastes are farther, and everything we care about sleeps behind these bulkheads.",
    },
    {
      who: WHO,
      text: "Resident Quarters give us beds. Med Bay keeps the bleeding alive. Perimeter Control sees trouble coming. Quartermaster Exchange keeps supplies and caps moving.",
    },
    {
      who: WHO,
      text: "Rest until dawn when the squad is home. Gifts reset. Wounds close if the Med Bay is online. Downed folks without one do not wake up. I am not being colorful.",
    },
    {
      who: WHO,
      text: "That strip up top is the next smart move. I put it there so you never have to guess. If it says forge, use the Machine Shop. If it says deploy, head into the Hollow Realm.",
    },
  ],
  roster: [
    {
      who: WHO,
      text: "The roster is everybody who calls Vault 13 home and is still breathing. Tap a name for the dossier: stats, gear, companion, curses, all of it.",
    },
    {
      who: WHO,
      text: "Idle residents at Vault 13 can deploy. Downed residents need the Med Bay or a stimpak. Dead is a closed file. Do not worry, the Machine Shop can forge another operative. It will cost you.",
    },
    {
      who: WHO,
      text: "Issue gear from the Salvage Depot. Bond a companion if you have the caps. Rename them if the Hollow rolled a name you cannot love. This is your squad.",
    },
  ],
  forge: [
    {
      who: WHO,
      text: "Howdy. Welcome to the Machine Shop. Every operative is from Ironclad. The rest of the file comes from class, blood, reputation, talent, shadow and whatever destiny crawls out of the die.",
    },
    {
      who: WHO,
      text: "Tap a face to reroll that truth. Or let the Hollow decide the whole set. First resident is free. After that Vault 13 charges for the resources. Check the cost before you lock it.",
    },
    {
      who: WHO,
      text: "Name them like you mean it. The Hollow keeps records. When you lock the file, they get a bunk in Vault 13 and a place on the roster.",
    },
  ],
  deploy: [
    {
      who: WHO,
      text: "This is the Hollow Realm, partner. Ironclad is home territory. Beyond it are Slag Town, Blackspire, Brasswater and Veyra City. Pick a region and decide how badly you want to know what is there.",
    },
    {
      who: WHO,
      text: "Pick a region, pick a party of idle residents, pick a job. Scout walks the edges. Forage takes what the land offers. Raid kicks a door. Trade finds a merchant. Bounty hunts a name.",
    },
    {
      who: WHO,
      text: "Every beat you roll a d20 against a DC. 1 is a fumble. 20 is a crit. The die tumbles, so wait for it. Combat is a conversation with steel. Flee is cheaper than a grave.",
    },
    {
      who: WHO,
      text: "Intel from scouts and Perimeter Control unlocks nastier names. Do not send a fresh resident into a boss fight unless you dislike their bunk being occupied.",
    },
  ],
  vault: [
    {
      who: WHO,
      text: "This is the Salvage Depot. Caps stay counted. Everything else is a tool, weapon, material or bad decision somebody carried back through Vault 13's door.",
    },
    {
      who: WHO,
      text: "Bobby pins and probe kits belong to the SYNAPSE terminal. Stimpaks stand the dying up. Mentats fatten the next loot table. Holotapes and sarsaparilla are for quieter nights.",
    },
    {
      who: WHO,
      text: "Weapons and salvage live here until you issue them to a resident. Repairs happen in the Machine Shop.",
    },
  ],
  ledger: [
    {
      who: WHO,
      text: "Welcome to the Quartermaster Exchange. Vault 13 keeps the shared stores. The black card belongs to whoever is seated: their name, Discord handle and personal caps.",
    },
    {
      who: WHO,
      text: "Drag the card. Pinch or wheel to zoom. Double-tap to flip it. Deposit and withdraw at the desk. Purchases still come out of Vault 13's shared supply unless the card says otherwise.",
    },
    {
      who: WHO,
      text: "Quartermaster tier three grants a discount. Twenty percent of a clean sortie lands on the seated resident's card. Spend like you mean to survive tomorrow.",
    },
    {
      who: WHO,
      text: "The bounty board sits here too. A named target, a DC and a payout. Hunt it when you are ready to make the Med Bay earn its keep.",
    },
  ],
  squad: [
    {
      who: WHO,
      text: "Vault 13 holds more than one resident. Register a name and Discord handle. They land on the squad file, get a bunk, and can take their turn in the Hollow Realm.",
    },
    {
      who: WHO,
      text: "The main ARC moves through Ironclad, Slag Town, Blackspire, Brasswater and Veyra City. Raid, bounty and chapter bosses wait on the resident whose name is on the HUD. Scout stays open.",
    },
    {
      who: WHO,
      text: "Do not worry. This is one CRT for now. Other devices do not see this list unless they share the file. Same Vault 13, same squad.",
    },
  ],
  codex: [
    {
      who: WHO,
      text: "The codex is Vault 13's field archive. Classes, destinies, regional names and the things we survived long enough to write down.",
    },
    {
      who: WHO,
      text: "If a term on a dossier looks like a riddle, it probably lives in here. I wrote some of it. I will not apologize.",
    },
  ],
  dawn: [
    {
      who: WHO,
      text: "Dawn of day {day}. Clocks refill at midnight Mountain. The Quartermaster rotates stock. Gifts reset. I held Vault 13 together all night. You still have to win today.",
    },
    {
      who: WHO,
      text: "If anybody was downed and the Med Bay was offline, they may not have made it. Keep the room powered. Vault 13 remembers every empty bunk.",
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
      text: "Steel, partner. Strike is a d20 against their DC. Guard holds. Skill is their signature. Gift is once per day. Item burns a rucksack. Flee is a SPD check.",
    },
    {
      who: WHO,
      text: "I will not talk over the fight. Tap the question mark if you need the card again. Come home to Vault 13 with the caps.",
    },
  ],
  mission: [
    {
      who: WHO,
      text: "A sortie is a string of beats. Each beat, you roll. The band decides if you walk, limp or bleed. Wait for the die. Then continue.",
    },
    {
      who: WHO,
      text: "Scout is intel. Raid is a door and a fight. If a name surfaces, that is a boss. Bring a party. I will be waiting at Vault 13 when you get back.",
    },
  ],
  rules: [
    {
      who: WHO,
      text: "This whole page is me talking, partner. Scroll it. The question mark on every other screen is the shorter Vault 13 briefing.",
    },
  ],
};

export const MANUAL: Record<string, FieldCard> = {
  briefing: {
    title: "Vault 13 orientation",
    blurb: "Tyrone walks you through the shelter before the Hollow Realm opens up. Tap his panel to continue. The first briefing cannot be skipped.",
    tips: [
      "Every resident starts in Ironclad and lives at Vault 13.",
      "Forge an operative. First one is free.",
      "Deploy them. Caps and salvage come home, or they do not.",
      "Keep the Med Bay online before you rest the downed.",
    ],
  },
  resume: {
    title: "Welcome home",
    blurb: "Your file is loaded. Tyrone kept Vault 13 running. Hear him out, then the shelter opens.",
    tips: [
      "Caps, salvage and roster persist on this resident file.",
      "Arcade totals floor your file. They never wipe it.",
      "Tap the question mark on any screen for a tour.",
    ],
  },
  handshake: {
    title: "Arcade floor",
    blurb: "Tyrone pulled your Discord totals before the Vault 13 menu finished painting.",
    tips: [
      "A generic Discord click cannot name you. The bot stamps a personal link.",
      "Caps, XP and pack items floor this file.",
      "Same resident, same file, every time.",
    ],
  },
  menu: {
    title: "Vault 13 terminal",
    blurb: "Resume a file, start a new one, or read the rules before heading into the Hollow Realm.",
    tips: [
      "Squad mode resumes day, caps, roster and salvage.",
      "New file resets this CRT save.",
      "The glowing box is the SYNAPSE terminal. Hack it from a live file.",
      "Link a Discord resident if you have a stamped URL.",
    ],
  },
  hq: {
    title: "Vault 13",
    blurb: "Home on the outskirts of Ironclad. Upgrade rooms, recover, manage residents and prepare for the Hollow Realm.",
    tips: [
      "Resident Quarters add beds. Med Bay keeps downed residents alive at dawn.",
      "Perimeter Control lowers mission DCs. Quartermaster Exchange improves daily stock.",
      "Machine Shop repairs gear. Salvage Depot stores what comes home.",
      "Rest until dawn resets gifts and heals when the Med Bay is online.",
    ],
  },
  roster: {
    title: "Vault 13 residents",
    blurb: "Everybody who lives here and is still breathing. Tap a name for the dossier.",
    tips: [
      "Idle residents at Vault 13 can deploy. Downed residents need Med Bay or a stimpak.",
      "Issue gear from the Salvage Depot. Bond companions with caps.",
      "Hall of Fame is earned by surviving the Hollow Realm.",
      "Forge more residents from the plus on the HUD.",
    ],
  },
  forge: {
    title: "Machine Shop",
    blurb: "Every operative is Ironclad-born. The Hollow writes the rest of the file.",
    tips: [
      "Tap a die face to reroll that truth.",
      "Let the Hollow decide if you do not want to own it.",
      "Name them. Lock the file. They receive a bunk in Vault 13.",
      "Resident Quarters cap how many operatives you can house.",
    ],
  },
  deploy: {
    title: "Hollow Realm",
    blurb: "Leave Vault 13, choose a region, send a party and see what comes home.",
    tips: [
      "Ironclad is home territory. Slag Town, Blackspire, Brasswater and Veyra City lie beyond it.",
      "Scout first. Raid when you are greedy. Boss when a name surfaces.",
      "Only idle Vault 13 residents can deploy. Send at least one.",
      "d20: 1 fumble · 2–4 fail · 5–9 weak · 10–14 success · 15–19 strong · 20 crit.",
    ],
  },
  vault: {
    title: "Salvage Depot",
    blurb: "Vault 13's shared storage for caps, field supplies, weapons and whatever survived the trip home.",
    tips: [
      "Caps always drop on a win. You cannot Use them.",
      "Stimpak stands the dying up. Mentats fatten the next loot roll.",
      "Bobby pins and probe kits belong to the SYNAPSE terminal.",
      "Issue stored gear to an idle resident.",
    ],
  },
  ledger: {
    title: "Quartermaster Exchange",
    blurb: "Personal black card plus Vault 13's shared supply and daily stock.",
    tips: [
      "Drag the card to rotate. Pinch or wheel to zoom. Double-tap or Flip to see the back.",
      "Deposit from Vault 13's supply. Withdraw to the resident card.",
      "Twenty percent of a clean sortie lands on the seated resident's card.",
      "Bargain, essential, artifact: one of each per day. Quartermaster tier 3 grants a discount.",
    ],
  },
  codex: {
    title: "Field archive",
    blurb: "Vault 13's record of classes, destinies, regional names and Hollow Realm lore.",
    tips: [
      "You do not have to memorize it.",
      "Dossier terms that look like riddles live here.",
    ],
  },
  squad: {
    title: "Vault 13 resident file",
    blurb: "One home. Many residents. Search a profile, sit as them, gift caps and pass the ARC turn.",
    tips: [
      "Register a name and Discord handle. They become a Vault 13 resident.",
      "Sit as a resident to play their turn. The HUD shows whose ARC beat it is.",
      "Raid, bounty and boss on the live chapter wait on that resident. Scout stays open.",
      "Gift personal caps from your black card. Vault 13's shared supply is separate.",
    ],
  },
  dawn: {
    title: "Dawn at Vault 13",
    blurb: "A new day. Quartermaster stock turns over. Gifts reset. Clocks refill at midnight Mountain.",
    tips: [
      "Downed residents can die at dawn without the Med Bay.",
      "Keep the room online before you rest.",
    ],
  },
  synapse: {
    title: "SYNAPSE terminal",
    blurb: "An easter egg on Tyrone's CRT. Four tries. Likeness is how many letters sit in the right chair.",
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
    blurb: "A string of beats beyond Vault 13. Roll, read the band, continue.",
    tips: [
      "Wait for the die to land. Then tap Continue.",
      "Scout is intel. Raid is a door. Boss is a name. Bring a party.",
      "If the party is down, return to Vault 13.",
    ],
  },
  rules: {
    title: "How you play",
    blurb: "Vault 13 orientation in long form. The question mark on other screens is the short version.",
    tips: [
      "Forge. Deploy. Salvage. Recover. Repeat.",
      "The world is the Hollow Realm. Home is Vault 13.",
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
