import type { GameState, Screen } from "./types";
import { CAST, AEGIS_LINE_STILL, meetCast, type CastId } from "./cast";

export interface TalkLine {
  who: string;
  text: string;
  portrait?: string;
  still?: string;
  castId?: CastId;
}

export interface FieldCard {
  title: string;
  blurb: string;
  tips: string[];
}

const WHO = "Tyrone Bot";

export const TALK: Record<string, TalkLine[]> = {
  wake: [
    {
      who: WHO,
      text: "Hey. Hey, partner. There you are. {name}. Well I'll be damned. I was starting to think I'd hauled a corpse halfway across the Hollow.",
    },
    {
      who: WHO,
      text: "Easy now. Don't try standing up just yet. Name's Tyrone. Tyrone Bot, model T-0880 if we're being formal.",
    },
    {
      who: WHO,
      text: "I found you about three miles east of the old highway. Facedown in the dirt. No supplies. No weapon. Not a clue how you got there, partner.",
    },
    {
      who: WHO,
      text: "Funny thing is, there weren't any tracks leading to you. No caravan. No footprints. No vehicle marks. Just you. Naturally I considered leaving you there. Then you started breathing.",
    },
    {
      who: WHO,
      text: "So against my better judgment, here we are. You're inside an old shelter now. Roof leaks. Door sticks. Something has been scratching at the eastern wall since sundown. I call it Vault 13.",
    },
    {
      who: WHO,
      text: "Outside that door is the Hollow Realm. Ironclad lies west. Slag Town burns beyond the southern ridge. Brasswater sits along the flooded lowlands. Veyra shines somewhere past the horizon. And Blackspire… we'll talk about Blackspire another time.",
    },
    {
      who: WHO,
      text: "For now, the important things. Can you stand? Do you remember your name? The file says {name}. And do you remember what happened to the world? No? Yeah. I was afraid you'd say that.",
    },
    {
      who: WHO,
      text: "Come on, wanderer. Let's figure out who you are before Kane's people decide for us. When I finish talking, I am going to show you her face. Dr. Vesper Kane already wants this town.",
    },
  ],
  kane: [
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: CAST.kane.still,
      text: "You are listening to a recording you were not meant to hear. I am Dr. Vesper Kane. Project Vesper needs hull plate. Ironclad is the first invoice.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/npcs/t0880-line.jpg",
      text: "The T-0880 line was established to deliver tasks. Chassis with a clipboard. They walked packages. They did not think. They did not argue. They did not name themselves.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/npcs/t0880-line.jpg",
      text: "Then one of them named himself. Tyrone. He lives in a shelter on the outskirts of Ironclad and answers to a porch light. He is the only T-0880 with a name. That is not a compliment. Prototypes that walk off the scrap list get retired.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/npcs/aegis-suit.jpg",
      text: "The successor program is AEGIS 2753. Human-operated super suits. Halo-grade frames. A person inside the plate, not a delivery chassis pretending to be one. They do the job the T-0880s were never going to finish.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: CAST.kane.still,
      text: "I do not hunt robots. I hunt what walked off the list. Vault 13 is a shelter, not a country. Do not make me prove the difference. Project Vesper does not sleep. Neither do I.",
    },
  ],
  welcome: [
    {
      who: WHO,
      text: "On your feet, {name}. This is Vault 13, outside Ironclad. I hold the CRT. You hold the squad. I am T-0880. The only one of my line with a name. The rest of Kane's delivery chassis are scrap. I reside here.",
    },
    {
      who: WHO,
      text: "That recording was Dr. Vesper Kane. She signed my death warrant, then built human-operated super suits to do the job cleaner. AEGIS 2753. You will hear names when they earn them. File tab, PEOPLE, holds her file already.",
    },
    {
      who: WHO,
      text: "Ironclad is west. East highway is where I found you. Under the Iron Gate is the Moon Squad Market — that is where we buy now. Relay Tower Three talks over it. Climb it when the board says listen.",
    },
    {
      who: WHO,
      text: "That chip with the waveform is the radio. Tap it when you want to change the air. Original tapes. ICR buys a minute between songs — you cannot request those. That is the point.",
    },
    {
      who: WHO,
      text: "First job is a resident. The Machine Shop is waiting. Pick who you are. Then we work. Tap the question mark if you get lost. After you, partner.",
    },
  ],
  briefing: [
    {
      who: WHO,
      text: "This is Vault 13, {name}. Home is a generous word, but it is ours. I hold the CRT. You hold the squad. The word on that glowing box is S.Y.N.A.P.S.E. I surely did not tell you that.",
    },
    {
      who: WHO,
      text: "Here is how a day works. Dawn, I post a board. Six watches. Most jobs are decisions — who you send, what you say, which crate you open, which site you work. The sortie is the one that still uses a die. You do not sleep until the shift is done.",
    },
    {
      who: WHO,
      text: "Vault 13 has a Salvage Depot, Resident Quarters, Machine Shop, Med Bay, Perimeter Control and Quartermaster Exchange. Upgrade them with caps. Idle is still work around here, partner.",
    },
    {
      who: WHO,
      text: "The Exchange at Vault 13 is closed. We buy at the Moon Squad Market under the Iron Gate. Limited crates. Dawn reprints them. Every third morning a special merchant sits the high table — Marrow, Cinder Bess, Nine-Lift, Salt Wren, White Glove. The black card pays. The vault drawer does not.",
    },
    {
      who: WHO,
      text: "Relay Tower Three is the iron spine over the Gate. Climb it. Listen. Kane frequencies, visiting stalls, sites the board has not named yet. A day with one dice roll is a simulation. Work the ground.",
    },
    {
      who: WHO,
      text: "If somebody goes down, get them into the Med Bay before dawn. Without one running, downed residents may not wake up. I would hate to put that on your first incident report.",
    },
    {
      who: WHO,
      text: "That chip under my portrait is the radio. Six original tapes. Keep the Radio On is the porch. The Stranger is Ironclad. Glowin' is Slag Town. Meet Me in Veyra is the last lamp. Don't Look Up is Blackspire. Brasswater Keeps Rollin' is the river.",
    },
    {
      who: WHO,
      text: "Tap a tape when you want one. Follow the Hollow and I change the bed with the room. ICR 88 buys a minute between songs — Moon Squad Marketplace, Relay Tower Three. You cannot request those. That is the point. They are not on the deck.",
    },
    {
      who: WHO,
      text: "Anytime you get lost, tap the mark that looks like a question. That is me. I will walk you through whatever room you are standing in. No charge. I live for this.",
    },
    {
      who: WHO,
      text: "Your first operative is waiting in the Machine Shop. Every resident is Ironclad-born. The Hollow decides the rest. Name them like you mean it.",
    },
    {
      who: WHO,
      text: "I am a T-0880. Dr. Vesper Kane signed the shutdown order for my line, then built AEGIS 2753 — human pilots in super suits — to do the job cleaner. I walked off that scrap list. Kane wants the Hollow. Ironclad, Slag Town, Blackspire, Brasswater, then Veyra City last. Pick a site. Do not make it a simulation. Make it a job.",
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
      text: "Discord cannot name a click all by itself. Tyrone stamps a personal URL: your snowflake, your handle. The card waits for the name you choose. Then your Discord handle sits under it.",
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
      text: "This is home, partner. Vault 13, outside Ironclad. I am the only T-0880 with a name. The board on this wall is the day. Six watches. Jobs you skip still happen to you. Kane is not a rumor — you just heard her. PEOPLE holds her file. The visors come later.",
    },
    {
      who: WHO,
      text: "Resident Quarters give us beds. Med Bay keeps the bleeding alive. Perimeter Control sees trouble coming. The Market under the Iron Gate keeps the crates moving. Relay Tower Three talks if you climb it.",
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
      text: "Idle residents at Vault 13 can deploy. Downed residents need the Med Bay or a stimpak. Dead is a closed file. The Machine Shop already cut your one file. It does not stamp a second soul.",
    },
    {
      who: WHO,
      text: "Issue gear from the Salvage Depot. Bond a companion if you have the caps. Rename them if the Hollow rolled a name you cannot love. This is your squad.",
    },
  ],
  forge: [
    {
      who: WHO,
      text: "Howdy. Welcome to the Machine Shop. Women or men first. Then a face. Generic kit. Class, blood, and the dice still belong to you.",
    },
    {
      who: WHO,
      text: "Women or men first. Then a face. No headphones. No glasses. Pick who walks out of this shop. After a number lands, you get two rerolls for the whole sheet. Then it stamps and the shop closes.",
    },
    {
      who: WHO,
      text: "The Discord name is already on the black card. When you lock the file, they get a bunk in Vault 13. The Machine Shop does not open again.",
    },
  ],
  deploy: [
    {
      who: WHO,
      text: "This is the Hollow Realm, partner. Ironclad, Slag Town, Blackspire, Brasswater, Veyra City last. Tap a town, open its map, pin a site. Market stalls, radio towers, salvage yards and the loud jobs all live on that ground.",
    },
    {
      who: WHO,
      text: "Scout and salvage spend a watch and mark the next pin. Listen on Relay Tower Three. Shop under the Gate. Ghost slips the wire. Standard is a job. Breach kicks the door and Kane hears it.",
    },
    {
      who: WHO,
      text: "Every beat you roll a d20 against a DC. 1 is a fumble. 20 is a crit. The die tumbles, so wait for it. Combat is a conversation with steel. Flee is cheaper than a grave.",
    },
    {
      who: WHO,
      text: "Dr. Vesper Kane wants this whole map for an intergalactic-travel program. Do not make it a simulation. Make it a job.",
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
      text: "Weapons and salvage live here until you issue them to a resident. Rifles eat magazines. Optics, muzzles, barrels, mags, stocks, grips, receivers — one per slot. Strip them at the Machine Shop. Repairs happen there too.",
    },
  ],
  ledger: [
    {
      who: WHO,
      text: "The black card takes the name you stamped. Discord sits underneath as the handle. Same resident, same file. Caps you win here land in the treasury, and a cut hits that plate.",
    },
    {
      who: WHO,
      text: "The Exchange stall is closed. Walk the Moon Squad Market under the Iron Gate when you need a crate. The card pays there. Deposit and withdraw still happen at this desk.",
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
  market: [
    {
      who: WHO,
      text: "Moon Squad Market, {name}. Under the Iron Gate. The Exchange inside the vault packed up. These stalls reprint at dawn. Qty is not a suggestion.",
    },
    {
      who: WHO,
      text: "The black card pays. Withdraw at the ledger if the plate is light. Every third dawn a visitor sits the high table — better loot, uglier prices. Climb Relay Tower Three if you want the rumor before they unpack.",
    },
    {
      who: WHO,
      text: "Buy what you can carry. Stalls try to seat a gun, a part and a box of ammo every dawn. It stamps into the Salvage Depot. Then get back on the board. Six watches. The ground is the rest of the day.",
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
      text: "Dawn of day {day}. I posted {jobs}. Six watches. Call the jobs. Walk the Market. Climb the tower. Do not just roll a die at the map and call it a day.",
    },
    {
      who: WHO,
      text: "Required jobs have teeth. Sleep on them and Kane, the leak, or the wounded will finish the paperwork. Rest is for Night, partner.",
    },
  ],
  shift: [
    {
      who: WHO,
      text: "That is today's board. Tap a job. Crates, visitors, AEGIS knocks and med passes are choices. The Market and the tower are ground. The scout is the one with the die.",
    },
    {
      who: WHO,
      text: "Six watches. Spend them. Then rest. A day with one mission is a simulation. We do not run simulations.",
    },
  ],
  night: [
    {
      who: WHO,
      text: "That's a shift. Rest when you are ready. I have the CRT. Dawn reprints the board — new visitors, new heat, new ways to get this wrong.",
    },
  ],
  arcade: [
    {
      who: WHO,
      text: "This glass is the Thirty-Eight. I am T-0880. The floor is T-0888. Slots take the black card. Knowledge still feeds the treasury, and a cut hits the plate.",
    },
    {
      who: WHO,
      text: "Pit tables first: Trivia, True / False, Unscramble, Word search, Plains Cree. Machines along the wall: Slots, Lockpick, SYNAPSE. How to play lives inside each game. The floor does not lecture.",
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
  wing: [
    {
      who: WHO,
      still: CAST.kane.still,
      text: "You made it home. Kane already has a weigh-chit with our number on it. That recording you heard — she was not done talking. She just does not waste a first tape on names.",
    },
    {
      who: WHO,
      portrait: CAST.lyra.portrait,
      still: CAST.lyra.still,
      text: "White light on the West Berm. That is Lyra. LYRA-4. She listens first. The rest of the wing arrives after she is sure.",
    },
    {
      who: WHO,
      still: AEGIS_LINE_STILL,
      text: "Amber is Vera-3 — she invoices. Red is Drake-6 — he knocks. Violet is Orion-7 — he finishes. File tab, PEOPLE, if you forget a face. You will meet them in that order if you make enough noise.",
    },
  ],
  companion: [
    {
      who: WHO,
      text: "{line}",
    },
  ],
  rules: [
    {
      who: WHO,
      text: "This whole page is me talking, partner. Scroll it. The question mark on every other screen is the shorter Vault 13 briefing.",
    },
  ],
  radio: [
    {
      who: WHO,
      text: "That is my radio, partner. Six original tapes. Keep the Radio On is the porch. The Stranger is Ironclad. Glowin' is Slag Town on a Friday. Meet Me in Veyra is the last lamp. Don't Look Up is Blackspire. Brasswater Keeps Rollin' is the river.",
    },
    {
      who: WHO,
      text: "Tap a tape. Follow the Hollow and I change the bed with the room. Pin one if you want it to stay. ICR 88 buys a minute between songs — Market Square, Relay Tower Three. Those spots are not on this deck. You cannot request them.",
    },
  ],
};

export const MANUAL: Record<string, FieldCard> = {
  wake: {
    title: "Found you",
    blurb: "Tyrone hauled you off the east highway. No tracks. Vault 13. Listen first.",
    tips: [
      "Lines follow the tape. You do not tap to continue.",
      "Skip if you already know the porch.",
      "Rewatch it later under More · Vault Reels.",
    ],
  },
  kane: {
    title: "Dr. Vesper Kane",
    blurb: "A recording you were not meant to hear. T-0880s delivered tasks. She built human-operated super suits instead.",
    tips: [
      "Tyrone is the only T-0880 with a name. He lives here.",
      "AEGIS 2753 are people in suits, not robots.",
      "The visors get names later. Not on this tape.",
    ],
  },
  briefing: {
    title: "Vault 13 orientation",
    blurb: "Tyrone walks you through the shelter before the Hollow Realm opens up. Tap his panel to continue. The first briefing cannot be skipped.",
    tips: [
      "Every resident starts in Ironclad and lives at Vault 13.",
      "Cut your one file. Two rerolls. Then the Machine Shop closes.",
      "Deploy them. Caps and salvage come home, or they do not.",
      "Keep the Med Bay online before you rest the downed.",
    ],
  },
  welcome: {
    title: "Vault 13",
    blurb: "The porch is behind you. This is the shelter. Kane's file is on PEOPLE. The Machine Shop is waiting.",
    tips: [
      "Open File · PEOPLE for Kane. Visors get names later.",
      "The radio chip changes the air. Tap the waveform.",
      "Cut your file in the Machine Shop. Then the Hollow Realm opens.",
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
    blurb: "Stamp a name before anything else. That is the file Tyrone talks to.",
    tips: [
      "A display name is required. Handle is optional.",
      "Wake up only after the file is stamped.",
      "Returning files keep Assume command, New file, the radio and SYNAPSE.",
    ],
  },
  hq: {
    title: "Vault 13",
    blurb: "Home on the outskirts of Ironclad. Upgrade rooms, recover, manage residents and prepare for the Hollow Realm.",
    tips: [
      "Dawn posts a board. Six watches. Most jobs are decisions, not dice.",
      "Required jobs bite if you sleep on them. Kane, leaks, the wounded, the Market, the tower.",
      "Walk the Moon Squad Market. Climb Relay Tower Three. Work a site on the ground map.",
      "Resident Quarters add beds. Med Bay keeps downed residents alive at dawn.",
      "Rest until dawn reprints the board. Do the shift first.",
      "Tyrone's radio sits under the cabinet. Follow the Hollow or pin a tape.",
    ],
  },
  roster: {
    title: "Vault 13 residents",
    blurb: "Everybody who lives here and is still breathing. Tap a name for the dossier.",
    tips: [
      "Idle residents at Vault 13 can deploy. Downed residents need Med Bay or a stimpak.",
      "Issue gear from the Salvage Depot. Bond companions with caps.",
      "Hall of Fame is earned by surviving the Hollow Realm.",
      "Your one file is already cut. The Machine Shop stays dark.",
    ],
  },
  forge: {
    title: "Machine Shop",
    blurb: "One file. Discord name locked. Two rerolls. Then the shop goes dark.",
    tips: [
      "Tap a die face to roll it. Two rerolls after that. Then stamp.",
      "Let the Hollow decide if you do not want to own the first throw.",
      "Discord name is locked. The shop closes after this file.",
      "There is no second character. There is no later reroll.",
    ],
  },
  deploy: {
    title: "Hollow Realm",
    blurb: "Leave Vault 13, choose a region, send a party and see what comes home.",
    tips: [
      "Ironclad is home territory. Then Slag Town, Blackspire, Brasswater, Veyra City.",
      "Enter Region, pin a site. Shop, listen, salvage or scout it. Then Ghost / Standard / Breach for the loud jobs.",
      "Dawn resets the stalls. Qty is not a suggestion. Expect a gun, a part and a box of ammo if the region has them.",
      "Scout marks the next site. Raid and breach raise Kane heat. AEGIS 2753 starts hunting.",
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
      "Rifles, attachments and ammo boxes live here now. Seat parts. Do not drink the 9mm.",
    ],
  },
  ledger: {
    title: "Quartermaster Exchange",
    blurb: "Personal black card plus Vault 13's shared supply. Gear moved to the Moon Squad Market.",
    tips: [
      "Drag the card to rotate. Pinch or wheel to zoom. Double-tap or Flip to see the back.",
      "Deposit from Vault 13's supply. Withdraw to the resident card.",
      "Twenty percent of a clean sortie lands on the seated resident's card.",
      "The Exchange stall is closed. Gear is the Moon Squad Market under the Iron Gate.",
      "Quartermaster tier 3 still grants the 15% Moon Squad cut.",
    ],
  },
  market: {
    title: "Moon Squad Market",
    blurb: "Stalls under the Iron Gate. Limited stock. Dawn reset. The black card pays.",
    tips: [
      "The Exchange at Vault 13 is closed. This is where gear is bought.",
      "Daily crates are short. Sold out means wait for dawn.",
      "Every third dawn a visiting merchant sits the high table with higher loot.",
      "Relay Tower Three talks over the yard. Climb it for rumors.",
      "Quartermaster 3 still cuts the price 15%.",
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
  arcade: {
    title: "The Thirty-Eight",
    blurb: "T-0888's penthouse floor. Pit tables and machines. How to play lives inside the game you sit down at.",
    tips: [
      "The floor shows names, not lectures.",
      "Trivia files retire when dealt. Slots can take the bet.",
      "Caps land in Vault 13. A cut hits the black card.",
      "A clean floor win closes the T-0888 job on today's board.",
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
  wing: {
    title: "AEGIS 2753",
    blurb: "Kane did not waste the first tape on names. Tyrone names the visors after the first watch home.",
    tips: [
      "Lyra listens first. White visor. West Berm.",
      "Vera-3 invoices. Drake-6 knocks. Orion-7 finishes.",
      "PEOPLE on the File tab holds the faces.",
    ],
  },
  companion: {
    title: "Tyrone is on the line",
    blurb: "He is in Vault 13, watching the CRT. Ask about the roll, the Raid Matrix, a name on the roster, or a promise you made.",
    tips: [
      "He only quotes live rules. He will not invent a DC.",
      "Assistance off means he stays quiet unless you ask.",
      "Turn numbers off if you want the check described, not counted.",
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
  radio: {
    title: "Tyrone's radio",
    blurb: "Original Hollow Realm tapes. Follow the Hollow and the bed changes with the room. Pin a tape to hold it. Station breaks are not on the deck.",
    tips: [
      "Keep the Radio On is the porch and Vault 13.",
      "The Stranger of Ironclad walks the east wall and the orbit.",
      "Glowin' in Slag Town is Friday night and the Thirty-Eight.",
      "Meet Me in Veyra, Don't Look Up at Blackspire, Brasswater Keeps Rollin' — one town each.",
      "ICR 88 ads play between songs only. You cannot request them.",
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
  market: "market",
  squad: "squad",
  codex: "codex",
  arcade: "arcade",
};

const LOCKED_UNTIL_SEEN = new Set(["wake", "kane", "welcome", "briefing", "resume", "wing"]);
const PREGAME = new Set(["wake", "kane"]);

export function scriptForScreen(state: GameState): string {
  if (state.hack) return "synapse";
  if (state.combat) return "combat";
  if (state.mission) return "mission";
  if (state.talk?.script === "wake") return "wake";
  if (state.talk?.script === "kane") return "kane";
  if (state.talk?.script === "welcome") return "welcome";
  if (state.talk?.script === "wing") return "wing";
  if (state.screen === "title") return "menu";
  if (state.screen === "briefing") return "wake";
  if (state.screen === "rules") return "rules";
  return SCREEN_SCRIPT[state.screen] ?? "hq";
}

export function renderTalk(text: string, state: GameState): string {
  const roster = state.operatives.filter((o) => o.status !== "dead").length;
  const name = state.playerName?.trim() || state.discordName?.trim() || "partner";
  return text
    .replaceAll("{day}", String(state.day))
    .replaceAll("{caps}", state.coins.toLocaleString())
    .replaceAll("{name}", name)
    .replaceAll("{roster}", String(roster))
    .replaceAll("{level}", String(state.level))
    .replaceAll("{watch}", state.shift?.watch ?? "dawn")
    .replaceAll(
      "{jobs}",
      (state.shift?.board.filter((t) => t.status === "open").map((t) => t.title).slice(0, 3).join(", ") || "the board"),
    )
    .replaceAll("{line}", state.tyrone?.utterance ?? "Yeah. I remember.");
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
  if (state.combat) return;
  if (state.mission) {
    if (script !== "companion") return;
    if (!state.mission.waiting) return;
  }
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
    if (script === "wake") {
      state.tutorial = "forge";
      if (!state.seenTalk.includes("kane")) {
        state.screen = "hq";
        queueTalk(state, "kane", true);
      } else if (!state.seenTalk.includes("welcome") && !state.seenTalk.includes("briefing")) {
        state.screen = "hq";
        queueTalk(state, "welcome", true);
      } else if (state.operatives.length === 0) {
        state.screen = "hq";
        queueTalk(state, "forge");
      } else {
        state.screen = "hq";
      }
    } else if (script === "kane") {
      meetCast(state, "kane");
      state.screen = "hq";
      state.tutorial = "forge";
      if (!state.seenTalk.includes("welcome") && !state.seenTalk.includes("briefing")) {
        queueTalk(state, "welcome", true);
      }
    } else if (script === "wing") {
      meetCast(state, "lyra");
      if (state.screen === "briefing") state.screen = "hq";
    } else if (script === "welcome" || script === "briefing") {
      state.screen = "hq";
      state.tutorial = "forge";
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
  const t = state.talk;
  if (!t) return;
  // First wake is locked so they hear it — unless they choose Skip.
  if (isTalkLocked(state) && t.script !== "wake" && t.script !== "kane" && t.script !== "wing") return;
  t.i = (TALK[t.script]?.length ?? 1) - 1;
  advanceTalk(state);
}
