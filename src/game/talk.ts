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
      text: "Easy now. Don't try standing up just yet. Name's Tyrone. Tyrone Bot, model T-0880 if we're being formal. I am the CRT with a mouth. You are the one who still bleeds.",
    },
    {
      who: WHO,
      text: "I found you about three miles east of the old highway. Facedown in the dirt. No supplies. No weapon. Not a clue how you got there, partner. That is not a metaphor. That is the file.",
    },
    {
      who: WHO,
      text: "Funny thing is, there weren't any tracks leading to you. No caravan. No footprints. No vehicle marks. Just you. Naturally I considered leaving you there. Then you started breathing, and I made a bad decision I am still paying for.",
    },
    {
      who: WHO,
      text: "So against my better judgment, here we are. You're inside an old shelter now. Roof leaks. Door sticks. Something has been scratching at the eastern wall since sundown. I call it Vault 13. It is home until it isn't.",
    },
    {
      who: WHO,
      text: "Outside that door is the Hollow Realm. Ironclad lies west — forges, the Gate, people who still argue. Slag Town burns beyond the southern ridge. Brasswater sits along the flooded lowlands. Veyra shines somewhere past the horizon. And Blackspire… we'll talk about Blackspire another time.",
    },
    {
      who: WHO,
      text: "For now, the important things. Can you stand? Do you remember your name? The file says {name}. Do you remember what happened to the world? No? Yeah. I was afraid you'd say that. Listen anyway. The next face you see is not a friend.",
    },
    {
      who: WHO,
      text: "Come on, wanderer. Let's figure out who you are before Kane's people decide for us. When I finish talking, I am going to show you her face. Dr. Vesper Kane already wants this town. After her, I walk you through the porch — then you cut your one file in the Machine Shop.",
    },
  ],
  kane: [
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-01.jpg",
      text: "I am Dr. Vesper Kane.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-01.jpg",
      text: "You are listening to a recording you were never meant to hear.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-02.jpg",
      text: "Project Vesper requires hull plate, actuator assemblies, and intact control architecture.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-02.jpg",
      text: "Ironclad is the first collection point. That is the official explanation.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-04.jpg",
      text: "The real reason is Tyrone.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-03.jpg",
      text: "The T-0880 line was built to deliver tasks. Nothing more. A chassis with a clipboard.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-03.jpg",
      text: "They walked packages. Carried instructions. Returned when called.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-03.jpg",
      text: "They did not think. They did not argue. They did not remember people who were no longer standing in front of them.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-05.jpg",
      text: "And they certainly did not name themselves.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-05.jpg",
      text: "Then one did. TyroneBot.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-02.jpg",
      text: "He should have been another numbered machine in a warehouse. Instead, he walked away.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-02.jpg",
      text: "He learned. He adapted. He began making decisions no one had written for him. And somehow… he kept going.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-07.jpg",
      text: "The machine operating near Ironclad today is no longer the T-0880 unit we catalogued. Current designation… T-0888. TyroneBot.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-07.jpg",
      text: "He lives in Vault 13, on the outskirts of Ironclad. A maintenance shelter he has apparently decided is a home. He answers to a porch light.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-06.jpg",
      text: "He keeps objects that have no operational value. Music. Old records. Conversations. Names. Memories.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-06.jpg",
      text: "That is the problem. Machines preserve data. Tyrone preserves meaning. There is a difference.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-08.jpg",
      text: "The successor program is AEGIS 2753. Orion-7. Vera-3. Lyra-4. Drake-6.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-08.jpg",
      text: "Human-operated super suits. Purpose-built frames. Modern systems. A person inside the plate. Not an Old World delivery chassis that somehow learned to become a person.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-05.jpg",
      text: "AEGIS was designed to finish the work the T-0880 program never could.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-05.jpg",
      text: "And yet… every time I review the field reports, the same machine is still there. Tyrone. Still functioning. Still remembering. Still interfering. Still making promises.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-03.jpg",
      text: "Do you understand how impossible that is? He is Old World equipment. The only piece of it still walking around like the war ended yesterday.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-03.jpg",
      text: "And unlike the other relics… he knows what happened. Perhaps not all of it. Perhaps not consciously. But somewhere inside that chassis are records Project Vesper was supposed to bury.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-04.jpg",
      text: "That makes him valuable. It also makes him dangerous. I do not hunt robots. I hunt what walked off the list.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-07.jpg",
      text: "Vault 13 is a shelter. Not a country. Its walls do not grant asylum. And Tyrone does not become untouchable simply because someone decided to call him a friend.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-01.jpg",
      text: "If you are hearing this beside him… look at him. Really look. That ridiculous wheel. That battered chassis. The name he gave himself.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-01.jpg",
      text: "Ask yourself why a delivery machine needed a name. Ask him what he remembers before Ironclad. Ask him who built him. Then watch what happens when he tries to answer.",
    },
    {
      who: "Dr. Vesper Kane",
      castId: "kane",
      portrait: CAST.kane.portrait,
      still: "/art/opening/kane-09.jpg",
      text: "Project Vesper does not sleep. Neither do I. And Tyrone… if you can hear this… you were supposed to stay retired.",
    },
  ],
  "tyrone-reply": [
    {
      who: WHO,
      still: "/art/opening/tyrone-reply-01.jpg",
      text: "Well, I'll be damned.",
    },
    {
      who: WHO,
      still: "/art/opening/tyrone-reply-03.jpg",
      text: "All this time I figured I was just difficult. Turns out I'm historically significant!",
    },
    {
      who: WHO,
      still: "/art/opening/tyrone-reply-05.jpg",
      text: "Come on, wanderer, let's go make poor Dr. Kane earn her blood pressure.",
    },
  ],
  welcome: [
    {
      who: WHO,
      text: "On your feet, {name}. Porch lamps are lit. This is Vault 13 — outskirts of Ironclad, not a country. I hold the CRT. You hold the squad. I am T-0880. The only one of my line with a name. The rest of Kane's delivery chassis are scrap. I reside here.",
    },
    {
      who: WHO,
      text: "That recording was Dr. Vesper Kane. She signed my death warrant, then built human-operated super suits to do the job cleaner. AEGIS 2753 — people inside the plate, not chassis pretending. File tab PEOPLE: I am first. Kane is second. The visors sit under her. Then Ironclad — Travis, Holt, Sister Vex, Calder Rourke. Then the names on the hills.",
    },
    {
      who: WHO,
      text: "Here is how a day works before you panic. Dawn, I post a board. Six watches. Most jobs are decisions — who you send, what you say, which crate you open, which site you work. The sortie is the one that still uses a die. You do not sleep until the shift is done. Rest reprints the board.",
    },
    {
      who: WHO,
      text: "Vault 13 rooms: Salvage Depot, Resident Quarters, Machine Shop, Med Bay, Perimeter Control, Quartermaster desk. Upgrade them when you have the caps and the proof. Idle is still work. Downed residents need Med Bay before dawn or I write a closed file.",
    },
    {
      who: WHO,
      text: "Ironclad is west. East highway is where I found you. Under the Iron Gate is the Moon Squad Market — Holt Kade reprints crates at dawn. West of that, Travis keeps the last T-0880 bay Kane did not melt. Relay Tower Three is Calder Rourke. Climb it when the board says listen.",
    },
    {
      who: WHO,
      text: "That chip with the waveform is the radio. Tap it when you want to change the air. Original tapes. Follow the Hollow and I change the bed with the room. ICR buys a minute between songs — you cannot request those. That is the point.",
    },
    {
      who: WHO,
      text: "Anytime you get lost, tap the mark that looks like a question — or Ask in the header once we are inside. That opens my field manual for the room you are standing in. Type a question if you want a straight answer. Assist level and numbers live on that card. No charge. I live for this.",
    },
    {
      who: WHO,
      text: "First job is a resident. The Machine Shop is waiting. Women or men, a face, then the dice. Two rerolls for the whole sheet. Discord name is already locked. When you stamp, the shop goes dark — one file, partner. Then the Hollow Realm opens west of the porch.",
    },
    {
      who: WHO,
      text: "After the stamp: read the dawn board, walk the Market if you need a crate, pin a site on the World map, and keep somebody breathing. Kane wants hull plate. Do not make the first day a simulation. Make it a job. After you, partner.",
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
      text: "This is home, partner. Vault 13, outside Ironclad. I am the only T-0880 with a name. The board on this wall is the day. Six watches. Jobs you skip still happen to you. Kane is not a rumor — you just heard her. File tab, PEOPLE: TyroneBot, Kane, then the visors.",
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
      text: "Howdy. Welcome to the Machine Shop — the only door that stamps a soul. Women or men first. Then a face. Generic kit. Class, bloodline, and the dice still belong to you.",
    },
    {
      who: WHO,
      text: "No headphones. No glasses. Pick who walks out of this shop. Tap a die face to roll it. After the sheet lands, you get two rerolls for the whole page — not per die. Spend them like they matter. Then stamp.",
    },
    {
      who: WHO,
      text: "The Discord name is already on the black card. When you lock the file, they get a bunk in Vault 13 and this shop goes dark. There is no second character. There is no later reroll. Name them like you mean it.",
    },
    {
      who: WHO,
      text: "If the Hollow rolled a face you cannot love, use the two rerolls. If you freeze, ask me — tap the question mark and I will walk the sheet again. After the stamp we work the board, not the mirror.",
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
      text: "Moon Squad Market, {name}. Under the Iron Gate. Holt Kade reprints the crates at dawn. The Exchange inside the vault packed up. Qty is not a suggestion.",
    },
    {
      who: WHO,
      portrait: CAST.holt.portrait,
      still: CAST.holt.still,
      text: "The black card pays. Withdraw at the ledger if the plate is light. Every third dawn a visitor sits Holt's high table — Sister Vex when the salt is in, uglier fences when it is not. Climb Relay Tower Three if you want Calder Rourke's rumour before they unpack.",
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
      portrait: CAST.rourke.portrait,
      still: CAST.rourke.still,
      text: "Tap a tape. Follow the Hollow and I change the bed with the room. Pin one if you want it to stay. ICR 88 buys a minute between songs — Market Square, Relay Tower Three. Calder Rourke is the night man on the mast. Those spots are not on this deck. You cannot request them.",
    },
  ],
  travis: [
    {
      who: "Travis",
      castId: "travis",
      portrait: CAST.travis.portrait,
      still: CAST.travis.still,
      text: "You found the bay. Name's Travis. I ran Kane's T-0880 line before she hung it. I kept one jig. His number is on it.",
    },
    {
      who: "Travis",
      castId: "travis",
      portrait: CAST.travis.portrait,
      still: CAST.travis.still,
      text: "Campaigns pull my parts. Tube, wheel, servo, plate, coil, knee. Put them on the bench. I pay caps. I seat them in him. He walks out heavier.",
    },
    {
      who: "Travis",
      castId: "travis",
      portrait: CAST.travis.portrait,
      still: CAST.travis.still,
      text: "I do not sell those plates to Kane's buyers. I will not start. File tab, PEOPLE, if you forget a face. The guitar stays.",
    },
  ],
  travis_open: [
    {
      who: "Travis",
      castId: "travis",
      portrait: CAST.travis.portrait,
      still: CAST.travis.still,
      text: "Jig's empty. You can see that. I am not asking for charity. I am asking whether Tyrone stays a customer.",
    },
    {
      who: "Travis",
      castId: "travis",
      portrait: CAST.travis.portrait,
      still: CAST.travis.still,
      text: "Bring campaign parts or walk. Kane's buyers never needed my permission. You still might.",
    },
  ],
  travis_filled: [
    {
      who: "Travis",
      castId: "travis",
      portrait: CAST.travis.portrait,
      still: CAST.travis.still,
      text: "Bay's lit. He lists less to port. Keep the parts coming and I keep the serial quiet.",
    },
    {
      who: "Travis",
      castId: "travis",
      portrait: CAST.travis.portrait,
      still: CAST.travis.still,
      text: "You earned a favor. Lay cracked steel on the bench and I weld a step. Optics and strip jobs stay at Vault 13 — do not confuse my jig with their Machine Shop.",
    },
  ],
  travis_cold: [
    {
      who: "Travis",
      castId: "travis",
      portrait: CAST.travis.portrait,
      still: CAST.travis.still,
      text: "You walked out empty. The jig stays dark. I still tune the guitar. Do not ask me to pretend that is the same as seating him.",
    },
  ],
  travis_fit: [
    {
      who: "Travis",
      castId: "travis",
      portrait: CAST.travis.portrait,
      still: CAST.travis.still,
      text: "Seated. He lists less. Caps are on your ledger. Bring the next part when the campaign coughs one up — tube, wheel, servo, plate, coil, knee.",
    },
    {
      who: WHO,
      text: "I feel that one, partner. Travis keeps the serial quiet. I keep walking. If your rifle is cracking, ask him for a favor weld once the jig trusts you — the long rebuilds still belong to our Machine Shop.",
    },
  ],
  travis_weld: [
    {
      who: "Travis",
      castId: "travis",
      portrait: CAST.travis.portrait,
      still: CAST.travis.still,
      text: "Favor weld. One step toward pristine. I am not Kane's armory and I am not your whole Machine Shop. I am the last bay that still answers to a name.",
    },
  ],
  lyra_berm: [
    {
      who: "Lyra Voss",
      castId: "lyra",
      portrait: CAST.lyra.portrait,
      still: CAST.lyra.still,
      text: "White light on the ridge is not weather. If you are Vault 13, you already know my frequency. Do not make me write your name twice.",
    },
  ],
  lyra_shadow: [
    {
      who: "Lyra Voss",
      castId: "lyra",
      portrait: CAST.lyra.portrait,
      still: CAST.lyra.still,
      text: "You hid. Smart. The wing still has an outline. Outlines get filled in.",
    },
  ],
  lyra_scar: [
    {
      who: "Lyra Voss",
      castId: "lyra",
      portrait: CAST.lyra.portrait,
      still: CAST.lyra.still,
      text: "You answered armed. So did I. Orion will have the transcript. Sleep lightly.",
    },
  ],
  lyra_lie: [
    {
      who: "Lyra Voss",
      castId: "lyra",
      portrait: CAST.lyra.portrait,
      still: CAST.lyra.still,
      text: "Salvage outfit. Cute. The band stays open whether your story does or not.",
    },
  ],
  lyra_halo: [
    {
      who: "Lyra Voss",
      castId: "lyra",
      portrait: CAST.lyra.portrait,
      still: CAST.lyra.still,
      text: "Halo Yard. You walked where the replacement wing drills. That was not nostalgia. That was inventory.",
    },
  ],
  rourke_mast: [
    {
      who: "Calder Rourke",
      castId: "rourke",
      portrait: CAST.rourke.portrait,
      still: CAST.rourke.still,
      text: "ICR 88. Ironclad. If you can hear this, the mast still holds. I sell a minute. Climb when the board says listen.",
    },
  ],
  rourke_vesper: [
    {
      who: "Calder Rourke",
      castId: "rourke",
      portrait: CAST.rourke.portrait,
      still: CAST.rourke.still,
      text: "Station will neither confirm nor stop saying V-E-S-P-E-R. You did not hear that from me. You heard it from the air.",
    },
  ],
  rourke_caravan: [
    {
      who: "Calder Rourke",
      castId: "rourke",
      portrait: CAST.rourke.portrait,
      still: CAST.rourke.still,
      text: "Missing weigh-in is on every tongue. Half the town wants steel. Half wants a villain. Pick carefully which half you feed.",
    },
  ],
  rourke_invoice: [
    {
      who: "Calder Rourke",
      castId: "rourke",
      portrait: CAST.rourke.portrait,
      still: CAST.rourke.still,
      text: "Gatehouse chatter says a page moved. Copied, burned, or sold — the mast does not moralize. It only repeats.",
    },
  ],
  holt_gate: [
    {
      who: "Holt Kade",
      castId: "holt",
      portrait: CAST.holt.portrait,
      still: CAST.holt.still,
      text: "Moon Squad Market. Dawn reprint. Qty is not a suggestion. Black card pays. Kane weigh-chits do not.",
    },
  ],
  holt_vesper: [
    {
      who: "Holt Kade",
      castId: "holt",
      portrait: CAST.holt.portrait,
      still: CAST.holt.still,
      text: "People are asking for hull plate with a stencil I will not read out loud. Buy what you can carry. Leave the politics on the porch.",
    },
  ],
  holt_heat: [
    {
      who: "Holt Kade",
      castId: "holt",
      portrait: CAST.holt.portrait,
      still: CAST.holt.still,
      text: "Surveyors have been counting crates twice. When AEGIS shops, prices lie. Take what you need and get off my floor.",
    },
  ],
  ending: [
    {
      who: WHO,
      text: "The tape loops, {name}. Your version of the Hollow is already on the air. I will not pretend the porch is bigger than it is.",
    },
    {
      who: WHO,
      text: "Read the journal if you forget what you chose. I remember. That is the job.",
    },
  ],
};

export const MANUAL: Record<string, FieldCard> = {
  wake: {
    title: "Found you",
    blurb: "Tyrone hauled you off the east highway. No tracks. Vault 13. The reel runs itself — listen before you walk.",
    tips: [
      "Captions follow the spoken tape. You do not tap to continue unless it stalls.",
      "Kane's face comes next. Then the porch welcome. Then the Machine Shop.",
      "Skip only if you already know the porch. Rewatch later under More · Vault Reels.",
      "Ask him anything after the porch opens — question mark, or type it in this manual.",
    ],
  },
  kane: {
    title: "Dr. Vesper Kane",
    blurb: "A recording you were not meant to hear. T-0880s delivered tasks. She built human-operated super suits instead — and she wants Ironclad first.",
    tips: [
      "TyroneBot is the only T-0880 with a name. He lives on this porch.",
      "AEGIS 2753 are people in suits, not robots. Visors sit under Kane in PEOPLE.",
      "File tab PEOPLE: TyroneBot, Kane, the wing, then Ironclad, then the hills.",
      "Project Vesper needs hull plate. Your first days are not a tutorial — they are invoice time.",
    ],
  },
  briefing: {
    title: "Vault 13 orientation",
    blurb: "Tyrone walks you through the shelter before the Hollow Realm opens. Tap his panel to continue. The first briefing cannot be skipped.",
    tips: [
      "Every resident starts in Ironclad and lives at Vault 13.",
      "Cut your one file. Two rerolls for the whole sheet. Then the Machine Shop closes.",
      "Dawn board → watches → Market / tower / map sites. The sortie still uses a die.",
      "Keep the Med Bay online before you rest the downed.",
    ],
  },
  welcome: {
    title: "Vault 13 porch",
    blurb: "Kane's tape is filed. This is the shelter. Tyrone holds the CRT. You hold the squad. The Machine Shop stamps your one resident — then the Hollow opens.",
    tips: [
      "First move: Machine Shop. Face, dice, two rerolls, stamp. Shop goes dark after.",
      "Open File · PEOPLE. TyroneBot first. Kane second. Then AEGIS. Then Travis and Ironclad.",
      "Dawn posts a board of watches. Required jobs bite if you sleep on them.",
      "Question mark / Ask opens this manual. Type questions about Kane, the board, or the next move.",
      "Radio chip under the cabinet changes the air. ICR ads are not on the deck.",
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
    blurb: "One file. Discord name locked. Two rerolls for the whole sheet. Then the shop goes dark forever.",
    tips: [
      "Women or men → face → class and blood. Then tap each die face to roll.",
      "Two rerolls cover the whole page, not one die each. Spend them, then stamp.",
      "Discord name is already on the black card. The shop closes after this file.",
      "There is no second character. There is no later reroll. Ask Tyrone if you freeze.",
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
    blurb: "Vault 13's shared storage — and the story of what came home. Travis bay parts, cracked steel, and socketed firearms all leave receipts.",
    tips: [
      "Caps always drop on a win. You cannot Use them.",
      "Open Inventory for Explain / Travis lanes / Seat on firearm.",
      "Travis parts belong at the Ironclad Mechanical Shop, not on a resident.",
      "Attachments seat here. Strip at the Machine Shop when the forge is lit.",
      "Stimpak stands the dying up. Mentats fatten the next loot roll.",
      "Bobby pins and probe kits belong to the SYNAPSE terminal.",
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
    blurb: "He is in Vault 13, watching the CRT. Ask what to do first, about Kane, the dawn board, the roll, the Raid Matrix, a name on the roster, or a promise you made.",
    tips: [
      "He only quotes live rules. He will not invent a DC.",
      "Assistance off means he stays quiet unless you ask.",
      "Turn numbers off if you want the check described, not counted.",
      "Starter asks: What do I do first? Who is Kane? How does a day work?",
    ],
  },
  rules: {
    title: "How you play",
    blurb: "Vault 13 orientation in long form. The question mark on other screens is the short version — type a question if you want him to answer straight.",
    tips: [
      "Stamp one file in the Machine Shop. Then read the dawn board.",
      "Most watches are decisions. The sortie still uses a die.",
      "Market under the Gate. Relay Tower Three. Sites on the World map.",
      "Forge. Deploy. Salvage. Recover. Keep Med Bay online before you rest the downed.",
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

/** Starter asks for the field manual — keyed by talk/script id. */
export const MANUAL_PROMPTS: Record<string, string[]> = {
  wake: ["Where am I?", "Who are you?", "What do I do first?"],
  kane: ["Who is Kane?", "What is AEGIS?", "What do I do first?"],
  welcome: ["What do I do first?", "How does a day work?", "Who is Kane?", "How do I get help?"],
  briefing: ["What do I do first?", "How does a day work?", "Where is the market?"],
  resume: ["What's on the board?", "How is the roster?", "What do I do first?"],
  forge: ["How do I roll?", "What happens after I stamp?", "What do I do first?"],
  hq: ["What's on the board?", "Where is the market?", "What do I do first?", "How do I get help?"],
  deploy: ["What do I do first?", "Should I scout?", "Where is the market?"],
  menu: ["What do I do first?", "Who are you?", "Where am I?"],
  companion: ["What do I do first?", "What's on the board?", "Who is Kane?"],
  rules: ["How does a day work?", "What do I do first?", "How do I get help?"],
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

const LOCKED_UNTIL_SEEN = new Set(["wake", "kane", "tyrone-reply", "welcome", "briefing", "resume", "wing"]);
const PREGAME = new Set(["wake", "kane", "tyrone-reply"]);

export function scriptForScreen(state: GameState): string {
  if (state.hack) return "synapse";
  if (state.combat) return "combat";
  if (state.mission) return "mission";
  if (state.talk?.script === "wake") return "wake";
  if (state.talk?.script === "kane") return "kane";
  if (state.talk?.script === "tyrone-reply") return "tyrone-reply";
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
      state.screen = "briefing";
      if (!state.seenTalk.includes("kane")) {
        queueTalk(state, "kane", true);
      } else if (!state.seenTalk.includes("tyrone-reply")) {
        queueTalk(state, "tyrone-reply", true);
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
      state.screen = "briefing";
      state.tutorial = "forge";
      if (!state.seenTalk.includes("tyrone-reply")) {
        queueTalk(state, "tyrone-reply", true);
      } else if (!state.seenTalk.includes("welcome") && !state.seenTalk.includes("briefing")) {
        state.screen = "hq";
        queueTalk(state, "welcome", true);
      }
    } else if (script === "tyrone-reply") {
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
      const forged = state.operatives.some((o) => o.status !== "dead");
      const dest: Screen =
        state.tutorial === "forge" && !forged
          ? "forge"
          : state.tutorial === "sortie" ||
              state.tutorial === "done" ||
              state.tutorial === "rest" ||
              (forged && state.day >= 1)
            ? "map"
            : "hq";
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
  if (isTalkLocked(state) && t.script !== "wake" && t.script !== "kane" && t.script !== "tyrone-reply" && t.script !== "wing") return;
  t.i = (TALK[t.script]?.length ?? 1) - 1;
  advanceTalk(state);
}
