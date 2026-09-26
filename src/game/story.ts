import { aegisOnDuty, CAST, kaneHeatLine, meetCast, type CastId, type CastPerson } from "./cast";
import { locById } from "./data";
import { KANE_STAKES, discoverPoi, locationToRegion, poiById, poisForLocation } from "./field-ops";
import { hasFlag } from "./narrative-state";
import type { DayTask, GameState, LocationId, MissionKind, RegionPointOfInterest } from "./types";

export interface SiteCopy {
  title: string;
  brief: string;
  why: string;
  fail: string;
}

interface SitePack {
  scout: SiteCopy;
  forage: SiteCopy;
  approach: string;
  sweep: string;
  report: string;
  hollow: string;
  range?: string;
  haul?: string;
}

const SITES: Record<string, SitePack> = {
  "ironclad-rail": {
    scout: {
      title: "The Invoice",
      brief:
        "The chit from the East Highway names a dawn weigh-in at the Rail Cut. Read the contract. Do not just count crates. Winter steel, signed when Ironclad was hungry. One line is a black-tag list of old T-0880 bays. If Tyrone goes quiet, that line is why.",
      why: "Project Vesper is not buying scrap. It is buying the town, and it already knows where the couriers slept.",
      fail: "Kane's surveyors walked the Cut without us. The invoice is on her desk, including the line that is not steel.",
    },
    forage: {
      title: "Strip the Rail Cut",
      brief: "Spikes, plate, anything the night crews dropped. Kane's buyers come at dusk. Beat them to the trench.",
      why: "Every spike we take is a spike Project Vesper does not get.",
      fail: "Kane's buyers loaded the trench. We kept the map and lost the steel.",
    },
    approach: "{lead} drops into the Cut along the slag side. The chit said dawn. The lamps are already live.",
    sweep: "The contract is legal and mean. Winter steel, paid in parts no local forge can make. Under the tonnage, a black-tag line: T-0880 bays, Atlas cores, Reeve's mark. {lead} copies it. Tyrone does not comment.",
    report: "SYNAPSE gets the page, not a crate count. {lead} brings the black-tag line home. Tyrone says he remembers the mark and does not want to talk. That is different from not remembering.",
    hollow: "Rail steel ticks in the cold. Kane's yard is never empty for long.",
    range: "{lead} fans the trench for dropped plate. The Cut still smells like a mill that has not admitted it died.",
    haul: "The pack gets heavy with spikes. Something on the far bank notices the taking.",
  },
  "ironclad-highway": {
    scout: {
      title: "No Tracks",
      brief:
        "Tyrone found you facedown on the East Highway. No supplies. No tracks in. Walk it before Kane's people rewrite the dirt. You are looking for what was not there when he stopped.",
      why: "He had no mission reason to pick you up. The first job is to see the place with your own eyes.",
      fail: "The highway stays his story. Kane writes the reason without us.",
    },
    forage: {
      title: "Salvage the East Highway",
      brief: "Three miles of cracked asphalt. Cache boxes in the culverts. Rats, and worse than rats, have been at them.",
      why: "This is where your file started. It still pays if you pick it clean.",
      fail: "The culverts stayed full of other people's leftovers.",
    },
    approach: "{lead} takes the long shoulder. The asphalt still holds the shape of a body. No tracks leading in. Same as the night Tyrone stopped.",
    sweep: "The dirt is still clean. No boots, no tires, no drag marks. A Vesper weigh-chit is nailed to the mile marker. Fresh. It was not there when he carried you home. {lead} takes the paper, not a speech.",
    report: "Tyrone reads the chit and goes quiet in the way that means he remembers and will not talk yet. The paper names a dawn weigh-in. {lead} files it. Tomorrow is the Rail Cut.",
    hollow: "The highway does not explain itself. It never did.",
  },
  "ironclad-gate": {
    scout: {
      title: "Read the Iron Gate",
      brief:
        "Kane's surveyors bought a table at the gatehouse. Count their crates. Listen to what they invoice. Do not drink with them.",
      why: "The Gate is how steel leaves Ironclad. Watch the door or lose the town.",
      fail: "The gatehouse talked to Kane's people. They have our outline now.",
    },
    forage: {
      title: "Work the Gate yard",
      brief: "Rejected plate, dropped bolts, a stall that packed in a hurry. The Market sits under it. The scrap sits behind it.",
      why: "What Kane's buyers refuse still has weight.",
      fail: "The yard went to the rats and the surveyors. Same difference.",
    },
    approach: "{lead} walks up like a foundry hand. The gatehouse already has Kane's people at a table. Listen. Do not introduce yourself.",
    sweep: "Invoice books, a crate stamped VESPER, a visor hanging on a peg that is not ours. {lead} counts what is leaving town.",
    report: "The Gate is a mouth. {lead} tells SYNAPSE what it swallowed today.",
    hollow: "Warm wall. Cold books. Steel leaves Ironclad through this door.",
  },
  "ironclad-halo": {
    scout: {
      title: "Scout Halo Yard",
      brief:
        "Old AEGIS paint on a drill square. Orion trained 2753 frames here before Veyra had a hangar. The outlines still scorch. See who is using them now.",
      why: "If the wing is back in Ironclad, Halo Yard is where they will stage.",
      fail: "Halo Yard stayed dark to us. Orion already knows we blinked.",
    },
    forage: {
      title: "Strip Halo Yard",
      brief: "Scorched concrete, spent cells, a visor shard in the gravel. 2753 leftovers are still better than porch scrap.",
      why: "Kane's old drill square still drops parts if you are quiet.",
      fail: "The square was already picked. Vera logs empty yards.",
    },
    approach: "{lead} keeps to the slag berm. Halo Yard is a drill square scorched into the concrete. Violet paint. Orion's old work.",
    sweep: "Boot prints the size of a 2753. A spent cell still warm. {lead} is counting frames, not salvage.",
    report: "If the wing is staging here, Vault 13 is already on their map. {lead} brings the print home.",
    hollow: "The square remembers the people Kane built to replace Tyrone.",
  },
  "ironclad-berm": {
    scout: {
      title: "Watch the West Berm",
      brief: "Earth and scrap against the slag wind. The Pack watches from the hills. Kane's people use it as a blind. Count visors, not wolves.",
      why: "Lyra paints ridges. If a white visor is here, the rest of the wing has a map.",
      fail: "The Berm watched us back. Lyra already has the outline.",
    },
    forage: {
      title: "Pick the West Berm",
      brief: "Cover first. Salvage second. The Pack leaves teeth. AEGIS leaves spent cells.",
      why: "A blind that is also a cache, if you get there before the Pack does.",
      fail: "The Berm kept its scrap. The Pack kept the hill.",
    },
    approach: "{lead} crawls the berm from the vault side. White light on the ridge would be Lyra. Do not wave.",
    sweep: "Wolf sign. A spent white cell. Someone has been painting this ridge from above. {lead} marks the nest, not the Pack.",
    report: "If Lyra is on the Berm, Orion already has our outline. {lead} says whether the light was real.",
    hollow: "The wind off the slag never stops. Neither does the listening.",
  },
  "ironclad-works": {
    scout: {
      title: "Scout Ironclad Works",
      brief: "A foundry whose night shift never officially ended. Kane pays for anything still hot enough to roll plate.",
      why: "If the Works is running, Project Vesper has a mill in our town.",
      fail: "The Works ran without us. Kane's night shift kept the books.",
    },
    forage: {
      title: "Haul the Works",
      brief: "Slag, offcuts, a crate stamped VESPER that nobody claimed. Hot work. Fast exits.",
      why: "Offcuts are still hull plate if you get them home.",
      fail: "The night shift boxed the offcuts for Kane. We watched the chimney.",
    },
    approach: "{lead} comes in through the slag door, not the office. The chimney is still breathing. That is not a ruin. That is a mill.",
    sweep: "Hot rollers. A night book with Kane's mark. {lead} copies the page and does not touch the steel yet.",
    report: "A mill in Ironclad is an invoice with a chimney. {lead} tells SYNAPSE if it is hers.",
    hollow: "The night shift never clocked out. Kane pays them anyway.",
  },
  "ironclad-tower": {
    scout: {
      title: "Climb Relay Tower Three",
      brief: "ICR 88's iron spine. Kane frequencies, visiting stalls, sites the board has not named yet. Lyra listens here whether we climb or not.",
      why: "A day Kane talks and we do not is a day we donate the map.",
      fail: "The tower talked to empty air. Lyra kept the transcript.",
    },
    forage: {
      title: "Work the tower foot",
      brief: "Dropped tools, a fried coil, a page of frequencies somebody should not have printed.",
      why: "What falls off a relay is never junk.",
      fail: "The foot of the tower stayed clean. Kane's people sweep it.",
    },
    approach: "{lead} takes the cage, not the stairs. The tower talks even when nobody is on it. Lyra already has a stool up here.",
    sweep: "Kane frequencies. A stall rumor. A site the board has not named. {lead} writes it down in the wind.",
    report: "ICR 88 does not care who is listening. {lead} makes sure we are.",
    hollow: "The iron spine over the Gate. It talks whether you climb it or not.",
  },
  "ironclad-exchange": {
    scout: {
      title: "Scout the old Exchange",
      brief: "Shutters down. A stencil says the market moved under the Gate. Rats kept the ledger. Kane's buyers still check the door.",
      why: "Closed stalls still talk if you read the dust.",
      fail: "The Exchange stayed shuttered. Kane already knew it was dead.",
    },
    forage: {
      title: "Crack the Exchange",
      brief: "Old crates, a locked till, a weigh-chit with Kane's mark still on it.",
      why: "Whatever they left is no longer theirs.",
      fail: "The shutters beat us. The rats did the rest.",
    },
    approach: "{lead} works the alley, not the front. The stencil is honest. The dust is not.",
    sweep: "A till that still clicks. A page of names Kane's people already copied. {lead} takes what they missed.",
    report: "Dead markets still have a pulse. {lead} says how hard it is beating.",
    hollow: "The Exchange died. The stencil told the truth. The rats kept the books.",
  },
  "ironclad-shop": {
    scout: {
      title: "Walk the Mechanical Shop",
      brief:
        "Travis keeps the last T-0880 bay Kane did not melt. Campaign parts go on his bench. He pays caps and seats them in TyroneBot. The guitar on the wall is in tune. The jig is empty until you fill it.",
      why: "A named chassis is still a customer. Kane's invoice is not the last word.",
      fail: "The bay stayed empty. Tyrone listed to port another day.",
    },
    forage: {
      title: "Sweep Travis's scrap",
      brief: "Offcuts behind the guitar. A clipboard jig. A plate Kane's buyers will not be sold. Ask first.",
      why: "What Travis will not sell still has a number.",
      fail: "Travis kept the scrap. He always does.",
    },
    approach: "{lead} comes in off the Gate alley, not the office. Grey beard. Crossed arms. The sign still says Ironclad Mechanical Shop.",
    sweep: "A jig with 0880 stamped in the lip. A stack of breastplates. {lead} does not touch them. Travis will.",
    report: "The last T-0880 bay Kane did not melt. {lead} says whether the jig is empty.",
    hollow: "Sparks, solder, a guitar that has outlived the line.",
  },
  "slag-foundry-row": {
    scout: {
      title: "Walk Foundry Row",
      brief: "Boilers, union halls, chop shops. Kane's buyers take anything that still burns hot enough to feed a jump stack. Count the slag carts, not the speeches.",
      why: "Furnace slag is how Project Vesper keeps a starship stack alight.",
      fail: "Foundry Row sold the day's slag without us. Kane's invoice is already warm.",
    },
    forage: {
      title: "Pick Foundry Row",
      brief: "Offcuts, union crates, a cart that never made the weigh. Hot. Fast. The union notices taking.",
      why: "What the union no longer claims still burns.",
      fail: "The Row kept its slag. Kane's buyers did not wait.",
    },
    approach: "{lead} comes in under the pipewalk, not the union door. Foundry Row never sleeps. It just changes who is bleeding.",
    sweep: "Slag carts. A Kane weigh-chit on a boiler. {lead} counts what is leaving for Veyra.",
    report: "If the Row is feeding her stack, Ironclad was only the first invoice. {lead} says how hot it is running.",
    hollow: "Ten thousand rivets. One buyer. She does not live here.",
  },
  "slag-coke": {
    scout: {
      title: "Scout the Coke Stacks",
      brief: "Black towers that still breathe. Kane wants the burn, not the town. Count which stacks are hers.",
      why: "A stack that still burns is a stack she can steal.",
      fail: "The Coke Stacks breathed without us. Kane already knows which ones.",
    },
    forage: {
      title: "Haul the Coke Stacks",
      brief: "Salvage here costs lungs. Take what the union no longer claims. Leave before the next cart.",
      why: "Coke is furnace food. Project Vesper is always hungry.",
      fail: "The stacks kept their burn. We kept the cough.",
    },
    approach: "{lead} takes the windward catwalk. The stacks breathe black. One of them is invoiced.",
    sweep: "Union marks scraped off. Kane stencils underneath. {lead} copies the stack numbers.",
    report: "Which towers still belong to the town. {lead} makes a list before they all belong to her.",
    hollow: "The air here has a job. So do you. Do not swap.",
  },
  "slag-pipewalk": {
    scout: {
      title: "Scout the Pipewalk",
      brief: "A catwalk of steam lines over the slag. Ghost routes, if you do not fall. Kane's people do not like heights. Use that.",
      why: "A way across the Row that does not go through her buyers.",
      fail: "The Pipewalk stayed a rumor. We walked the road like everyone else.",
    },
    forage: {
      title: "Work the Pipewalk",
      brief: "Dropped tools, a union badge, a coil that still holds. Do not look down.",
      why: "What falls off a steam line is never junk.",
      fail: "The walk kept its scrap. Gravity did the rest.",
    },
    approach: "{lead} steps onto wet iron. Steam hides you. It also hides the drop.",
    sweep: "A ghost route over the slag. {lead} marks the safe bays and the ones that lie.",
    report: "SYNAPSE wants a way across that Kane's carts cannot take. {lead} draws it.",
    hollow: "Steam, slag, and a long way down. Keep the visor down anyway.",
  },
  "slag-glass-yard": {
    scout: {
      title: "Scout the Glass Yard",
      brief: "A blast crater vitrified into black glass. Scavengers picked it. Kane's people still come at dusk for what the glass hid.",
      why: "Glass that used to be a mill still holds heat — and secrets.",
      fail: "The Yard stayed a crater. Kane's dusk crew walked it instead.",
    },
    forage: {
      title: "Pick the Glass Yard",
      brief: "Black glass, a fused crate, something that used to be a nameplate. Bring gloves.",
      why: "What the blast hid is still under the shine.",
      fail: "The glass kept its dead. We kept the cuts.",
    },
    approach: "{lead} comes in off the slag, not the road. The Yard shines even at noon. That is not a kindness.",
    sweep: "Fused boots. A Kane stencil melted into the glass. {lead} reads it anyway.",
    report: "A mill that became a mirror. {lead} says who is still using the reflection.",
    hollow: "The blast made a mirror. Kane still checks her hair in it.",
  },
  "blackspire-lift": {
    scout: {
      title: "Ride Grand Lift Nine",
      brief: "A freight elevator disappearing into cloud and stone. Hollow ore comes up. Kane's buyers wait at the cage. Count the loads. Do not ride with them.",
      why: "Hollow ore is the reason she wants the Realm at all.",
      fail: "Lift Nine ran without us. Kane's people already have the tally.",
    },
    forage: {
      title: "Work the Lift cage",
      brief: "Ore dust, a dropped sample tin, a chain that should have been condemned. Take the tin. Leave the chain.",
      why: "What the cage drops is still ore.",
      fail: "The cage kept its dust. The buyers kept the rest.",
    },
    approach: "{lead} takes the service ladder, not the passenger deck. Lift Nine does not care who is on it. Kane's people do.",
    sweep: "Load tallies. Ore that disagrees with the mountain. {lead} copies the numbers and does not touch the cage door.",
    report: "How much ore left the mountain today. {lead} says whether it left for Veyra.",
    hollow: "The mountain goes both ways. So does the invoice.",
  },
  "blackspire-frost": {
    scout: {
      title: "Walk Frost Camp",
      brief: "Tents pegged into ice above the cage line. They sell heat and lies about the Deepworks. Kane's surveyors buy both.",
      why: "The camp is how rumors about ore become invoices.",
      fail: "Frost Camp talked to Kane. We got the weather.",
    },
    forage: {
      title: "Pick Frost Camp",
      brief: "A stove, a sample tin, a map they should not have sold. Pay or take. Do not do both.",
      why: "Liars still drop true things.",
      fail: "The tents kept their heat. We kept the cold.",
    },
    approach: "{lead} comes in like a buyer, not a vault. Frost Camp sells what the Deepworks will not admit.",
    sweep: "Lies about the ore. One true sample tin. {lead} can tell them apart if they listen.",
    report: "Which rumor is an invoice. {lead} brings the true one home.",
    hollow: "The ice here has better manners than the people.",
  },
  "blackspire-cage": {
    scout: {
      title: "Scout the Cageworks",
      brief: "Repair bays for lift cages that should have been condemned. Kane's people keep the ones that still hold ore. See which chains are hers.",
      why: "A cage that holds is a cage that feeds Project Vesper.",
      fail: "The Cageworks ran its books without us.",
    },
    forage: {
      title: "Strip the Cageworks",
      brief: "Condemned chain, a winch drum, a tag that still says KANE. Salvage if the chain holds.",
      why: "Condemned steel still lifts if you are lucky.",
      fail: "The bays kept their drums. We kept the warning tags.",
    },
    approach: "{lead} stays off the live cages. The condemned ones talk louder.",
    sweep: "Kane tags on chains that should be scrap. {lead} marks which bays still feed the Lift.",
    report: "If she owns the cages, she owns the mountain. {lead} says how many are hers.",
    hollow: "The chain remembers every load it should not have held.",
  },
  "blackspire-deepworks": {
    scout: {
      title: "Scout the Deepworks",
      brief: "Ore tunnels that disagree with the mountain above them. Hollow ore is why Kane came to the Realm. Walk the first gallery. Do not go to the name.",
      why: "This is the resource. Everything else was practice.",
      fail: "The Deepworks stayed a rumor. Kane's divers did not.",
    },
    forage: {
      title: "Haul the Deepworks",
      brief: "Ore that drinks torchlight. Take a sample. Leave before the tunnel notices.",
      why: "A tin of Hollow ore is an invoice she cannot ignore.",
      fail: "The tunnels kept the ore. We kept the dark.",
    },
    approach: "{lead} takes gallery one, visor lamp low. The mountain above does not agree with the map. That is the point.",
    sweep: "Ore that drinks the light. Survey nails with Kane's mark. {lead} copies the gallery, not the vein.",
    report: "How close she is to the reason she came. {lead} does not guess.",
    hollow: "The ore listens. So does she.",
  },
  "brasswater-docks": {
    scout: {
      title: "Walk Brasswater Docks",
      brief: "Pontoon streets, steam launches, markets tied to whatever still floats. Kane's divers work at night for the old jump tables. Count the boats that do not belong.",
      why: "Jump tables are pre-collapse math. She does not have them yet.",
      fail: "The docks sold the night to her divers. We watched the tide.",
    },
    forage: {
      title: "Work the Docks",
      brief: "A crate that missed the launch, brass fittings, a page that should have drowned. Tide is a clock.",
      why: "What the tide leaves is not hers until she picks it up.",
      fail: "The pontoons kept their crates. The tide took the rest.",
    },
    approach: "{lead} takes a steam launch that is not Kane's. The docks never sit still. Neither do her divers.",
    sweep: "Boats that do not belong. A night schedule nailed to a pontoon. {lead} copies the hours they dive.",
    report: "When she works the water. {lead} brings the clock home.",
    hollow: "The street continues under the tide. So does the invoice.",
  },
  "brasswater-chapel": {
    scout: {
      title: "Listen at Pontoon Chapel",
      brief: "A bell that rings when the water is about to get worse. Listeners leave offerings. Kane's divers leave with the offerings and the tide charts.",
      why: "The bell knows the water. So should we.",
      fail: "The Chapel rang for someone else. Kane's people took the chart.",
    },
    forage: {
      title: "Work the Chapel",
      brief: "Offerings, a drowned hymnal, a tide chart tucked in the bell. Salvagers leave with them.",
      why: "Faith here is a weather service.",
      fail: "The bell kept its chart. We kept the wet.",
    },
    approach: "{lead} waits for the bell, not the priest. The Chapel tells the truth about water. People do not.",
    sweep: "A tide chart in the hymnal. Kane's divers have been tearing pages. {lead} takes what is left.",
    report: "When the water gets worse — and who already knows. {lead} says both.",
    hollow: "The bell does not pray. It warns.",
  },
  "brasswater-floodgate": {
    scout: {
      title: "Scout Floodgate Two",
      brief: "A gate that forgot which way is shut. Machinery, brine, and a chance at archive brass. Kane's people want it open. The town wants it shut.",
      why: "The gate is the door to the Archive. She will not knock.",
      fail: "Floodgate Two decided without us. Kane liked the decision.",
    },
    forage: {
      title: "Strip Floodgate Two",
      brief: "Brass gears, a drowned motor, a key that still turns. Work fast. The water does not.",
      why: "Archive brass is jump-table brass.",
      fail: "The gate kept its gears. The brine kept us.",
    },
    approach: "{lead} comes in along the catwalk, not the water. The gate is thinking. Do not help it.",
    sweep: "Which way is shut. Who has been forcing it. {lead} marks the winch Kane's people left.",
    report: "Open or shut is an invoice. {lead} says which way it leans.",
    hollow: "The gate has an opinion. So does the tide.",
  },
  "brasswater-archive": {
    scout: {
      title: "Scout the Drowned Archive",
      brief: "A library descending beneath black water one floor at a time. Jump tables for intergalactic travel live here. Kane's divers work at night. Walk the dry floors. Do not go to the Sink.",
      why: "This is the math. The ore was the fuel. She needs both.",
      fail: "The Archive stayed a rumor. Her divers did not.",
    },
    forage: {
      title: "Haul the Archive",
      brief: "A page that should have drowned, a brass plate of numbers, a crate of tables. Tide is the clock. The Sink is the name.",
      why: "One table she does not have is a stack that cannot jump.",
      fail: "The water kept the pages. She kept the night.",
    },
    approach: "{lead} takes the dry stair. The wet floors are hers after dark. Be gone before the bell.",
    sweep: "Jump tables. Kane nails in the stacks. {lead} copies a page and leaves the rest to drown.",
    report: "How many floors are still dry. How many she has already taken. {lead} does not round.",
    hollow: "The library is sinking on purpose. She is in a hurry.",
  },
  "veyra-rift-market": {
    scout: {
      title: "Walk Rift Market",
      brief: "Everything arrives eventually. Kane's quartermasters buy Hollow ore, jump-table fragments and T-0880 serial plates. See what they are paying for. Do not sell Tyrone.",
      why: "The Market is how she prices the Realm.",
      fail: "Rift Market priced us without us. Vera already has the number.",
    },
    forage: {
      title: "Work Rift Market",
      brief: "A crate that missed the quartermaster, a serial plate, a stim they will not miss. The plate is heavy if you get greedy.",
      why: "What she prices, we can steal.",
      fail: "The stalls packed. Vera noticed the number.",
    },
    approach: "{lead} walks like a buyer. Rift Market smells like every region we already walked — because it is.",
    sweep: "Ore prices. Jump-table fragments. A board of T-0880 serials. {lead} finds whether Tyrone is on it.",
    report: "What she is paying, and for whom. {lead} brings the board home.",
    hollow: "Everything arrives. Including the people who want you melted.",
  },
  "veyra-hangar": {
    scout: {
      title: "Scout Hangar 2753",
      brief: "Human-piloted super suits on gantries. Halo-grade frames. The successors Kane built after she ordered the robots scrapped. Count which visors are home.",
      why: "If the wing is in the hangar, they are not on our ridge. Yet.",
      fail: "The hangar stayed a rumor. The wing did not.",
    },
    forage: {
      title: "Strip Hangar 2753",
      brief: "Spent cells, a visor shard, a stencil that says ORION-7. Loud. Fast. Drake will notice a missing cell.",
      why: "2753 leftovers are still better than vault scrap.",
      fail: "The gantries were empty. The wing was not.",
    },
    approach: "{lead} takes the service gantry, not the floor. Four frames. Four visors. Count who is missing.",
    sweep: "Violet, amber, crimson, white. {lead} says which 2753 is flying tonight.",
    report: "A hangar with an empty hook is a visor on our ridge. {lead} names the empty one.",
    hollow: "They move like the T-0880 line used to. Only the pilots bleed.",
  },
  "veyra-spire": {
    scout: {
      title: "Scout Kane Spire",
      brief: "Dr. Vesper Kane's classified offices. Intergalactic-travel math on one wall. A Hollow Realm resource map on the other. You are on it. Walk the plaza. Do not knock.",
      why: "This is her. The visors are just the hands.",
      fail: "The Spire watched us back. She already knew the outline.",
    },
    forage: {
      title: "Work the Spire plaza",
      brief: "A dropped prism, a page of math, a mug that says KANE — LEVEL CLEARANCE. The plaza drops things. The office does not.",
      why: "What falls off her desk is still an invoice.",
      fail: "The plaza stayed clean. She sweeps it.",
    },
    approach: "{lead} stays in the plaza crowd. The Spire does not admit salvage outfits. It invoices them.",
    sweep: "A resource map of the Hollow in a lobby glass. Ironclad is marked. Vault 13 is a smudge. {lead} copies the smudge.",
    report: "How she sees us. {lead} brings the map home before she erases the smudge.",
    hollow: "She does not hunt robots. She hunts what walked off the scrap list.",
  },
  "veyra-yards": {
    scout: {
      title: "Scout the Suit Yards",
      brief: "Training ground for AEGIS specialists. They move like the T-0880 line used to, only the pilots bleed. See the drill. Do not join it.",
      why: "A yard that is drilling is a wing that is coming.",
      fail: "The Yards drilled without us. Orion already has the next ridge.",
    },
    forage: {
      title: "Pick the Suit Yards",
      brief: "Spent cells, a cracked visor, a stencil. The Yards drop what the hangar will not miss.",
      why: "Drill leftovers still power a porch lamp.",
      fail: "The Yards were already swept. Vera logs empty yards.",
    },
    approach: "{lead} takes the berm, visor down. The Yards drill in formation. Four colors if they are all home.",
    sweep: "Which visor is running the drill. {lead} names the color and the route they will fly.",
    report: "A drill is a promise. {lead} says who made it.",
    hollow: "The T-0880 walked. The 2753 does not. That is the point of the yard.",
  },
  "veyra-mast": {
    scout: {
      title: "Climb the Signal Mast",
      brief: "Kane's city-frequency. Listen if you want to know which 2753 is flying the ridge tonight. Lyra lives on this band.",
      why: "A day she talks and we do not is a day we donate Veyra too.",
      fail: "The Mast talked to empty air. Lyra kept the tape.",
    },
    forage: {
      title: "Work the Mast foot",
      brief: "A fried coil, a page of callsigns, a visor chip. What falls off a mast is never junk.",
      why: "Callsigns are names. Names are people.",
      fail: "The foot of the Mast stayed clean.",
    },
    approach: "{lead} takes the cage. The Mast does not care who is listening. Lyra does.",
    sweep: "Callsigns: ORION-7, VERA-3, DRAKE-6, LYRA-4. {lead} writes who is in the air.",
    report: "Which visor is flying. {lead} says it in plain speech.",
    hollow: "The city talks. The visors answer. We should too.",
  },
};

function fallbackCopy(poi: RegionPointOfInterest, kind: MissionKind): SiteCopy {
  const kane = KANE_STAKES[poi.regionId];
  const verb = kind === "forage" ? "Strip" : kind === "raid" ? "Hit" : "Scout";
  return {
    title: `${verb} ${poi.name}`,
    brief: poi.description,
    why: kane ? `${kane.resource}. ${kane.why}` : `${poi.name} does not explain itself. Walk it anyway.`,
    fail: `${poi.name} went unanswered. Kane's surveyors walked it instead.`,
  };
}

function packFor(poi: RegionPointOfInterest | undefined): SitePack | undefined {
  if (!poi) return undefined;
  return SITES[poi.id];
}

function openingPoiId(state: GameState, loc: LocationId): string | null {
  if (loc !== "ironclad" || state.day > 3) return null;
  if (!hasFlag(state, "highway_walked")) return "ironclad-highway";
  if (!hasFlag(state, "rail_cut_scouted")) return "ironclad-rail";
  return null;
}

export function resolveMissionSite(
  state: GameState,
  loc: LocationId,
  poiId?: string | null,
): RegionPointOfInterest | undefined {
  const pinned = poiById(loc, poiId);
  if (pinned) return pinned;
  const usable = poisForLocation(loc).filter(
    (p) => p.kind !== "boss" && p.action !== "home" && p.action !== "shop" && p.action !== "bay" && p.id !== "ironclad-vault13",
  );
  const discovered = new Set(state.locations[loc]?.discoveredPois ?? []);
  const known = usable.filter((p) => p.discovered || discovered.has(p.id));
  if (state.day <= 1 && loc === "ironclad" && !hasFlag(state, "highway_walked")) {
    return usable.find((p) => p.id === "ironclad-highway") ?? known[0] ?? usable[0];
  }
  const sortie = state.shift?.board.find((t) => t.kind === "sortie" && (t.status === "open" || t.status === "active"));
  if (sortie?.poiId && sortie.loc === loc) {
    const jobSite = poiById(loc, sortie.poiId);
    if (jobSite) return jobSite;
  }
  return known[0] ?? usable[0];
}

export function pickFieldSite(state: GameState): { loc: LocationId; poi: RegionPointOfInterest } {
  const open = (Object.keys(state.locations) as LocationId[]).filter(
    (id) => id !== "hq" && state.locations[id]?.unlocked,
  );
  const loc = (open[0] ?? "ironclad") as LocationId;
  const forcedId = openingPoiId(state, loc);
  const forced = forcedId ? poiById(loc, forcedId) : undefined;
  if (forced) return { loc, poi: forced };
  const poi = resolveMissionSite(state, loc, state.selectedPoiId);
  const fallback = poisForLocation(loc)[0];
  return { loc, poi: poi ?? fallback! };
}

export function siteCopyFor(poi: RegionPointOfInterest, kind: MissionKind): SiteCopy {
  const pack = packFor(poi);
  if (pack) return kind === "forage" ? pack.forage : pack.scout;
  return fallbackCopy(poi, kind);
}

export function sortieJob(state: GameState): DayTask {
  const { loc, poi } = pickFieldSite(state);
  const kinds: MissionKind[] = state.day === 1 ? ["scout"] : state.day % 3 === 0 ? ["forage"] : ["scout", "forage"];
  const kind = (
    state.locations[loc].bossUnlocked && !state.locations[loc].bossDefeated && state.day > 3
      ? "raid"
      : kinds[state.day % kinds.length]
  ) as MissionKind;
  const copy = siteCopyFor(poi, kind);
  discoverPoi(state, loc, poi.id);
  if (openingPoiId(state, loc) === poi.id || state.day <= 1 || !state.selectedPoiId) {
    state.selectedLoc = loc;
    state.selectedPoiId = poi.id;
  }
  return {
    id: uid("job"),
    kind: "sortie",
    title: copy.title,
    brief: copy.brief,
    why: copy.why,
    watchCost: kind === "raid" || kind === "boss" || kind === "bounty" ? 2 : 1,
    required: state.day <= 2 || kind !== "scout",
    loc,
    poiId: poi.id,
    missionKind: kind,
    failNote: copy.fail,
    status: "open",
  };
}

export function aegisJob(state: GameState): DayTask {
  const heat = state.kaneHeat ?? 0;
  const person = aegisOnDuty(state.day, heat);
  meetCast(state, person.id);
  if (person.id === "lyra" || state.day <= 1) discoverPoi(state, "ironclad", "ironclad-berm");
  const pack = aegisCopy(person, heat, state.day);
  return {
    id: uid("job"),
    kind: "aegis",
    title: pack.title,
    brief: pack.brief,
    why: "Kane does not roll dice. She sends people with names.",
    watchCost: 1,
    required: heat >= 10 || state.day === 1,
    npcId: person.id,
    failNote: pack.fail,
    choices: pack.choices,
    status: "open",
  };
}

function aegisCopy(person: CastPerson, heat: number, day: number) {
  if (day <= 1 && heat < 5) {
    return {
      title: "White light on the West Berm",
      brief:
        "Lyra is already on the West Berm. White visor. She is painting Vault 13 because somebody told her a body was on the East Highway. She is not knocking. Decide what she gets to report — an empty ridge, a boring foundry, or a fight.",
      fail: "Lyra kept the transcript. Kane has our outline before we have hers.",
      choices: [
        { id: "hide", label: "Kill the porch lamps", blurb: "Let her paint an empty ridge. Perimeter Control helps if it is raised." },
        { id: "lie", label: "Look like a foundry", blurb: "Busy. Boring. She is listening for a T-0880, not a mill." },
        { id: "fight", label: "Walk the ridge armed", blurb: "She will call Drake. Do not start that on day one unless you mean it." },
      ],
    };
  }
  if (person.id === "orion" || heat >= 16) {
    return {
      title: "Orion wants a word",
      brief: CAST.orion.intro,
      fail: "Orion logged the ridge as uncooperative. Kane marked Vault 13.",
      choices: [
        { id: "hide", label: "Hide Tyrone", blurb: "Perimeter Control or a dark bunk. He wants the robot, not you." },
        { id: "lie", label: "We are a salvage outfit", blurb: "Talk. Needs a face at the door." },
        { id: "fight", label: "Meet him armed", blurb: "Loud. He is a hand-to-hand specialist. The lance is the other hand." },
      ],
    };
  }
  if (person.id === "drake" || heat >= 10) {
    return {
      title: "Drake at the bulkhead",
      brief: CAST.drake.intro,
      fail: "Drake walked the bunks. Heat climbs. He will be back with Orion.",
      choices: [
        { id: "hide", label: "Kill the lights", blurb: "Dark bunk. He wants T-0880, not a foundry." },
        { id: "lie", label: "Talk him off the hinge", blurb: "Needs a Bard or a Merchant. Otherwise he hears a lie." },
        { id: "fight", label: "Meet him armed", blurb: "Red visor. The twelve-gauge is already up." },
      ],
    };
  }
  if (person.id === "vera") {
    return {
      title: "Vera wants manifests",
      brief: CAST.vera.intro,
      fail: "Vera left with a blank page. Kane treats blanks as theft.",
      choices: [
        { id: "hide", label: "Misplace the books", blurb: "Perimeter cameras. A dark ledger. She hates a missing number." },
        { id: "lie", label: "Show a clean page", blurb: "Talk. A Merchant makes this true." },
        { id: "fight", label: "Show her the door", blurb: "Ugly. She has a rifle, and she comes back with Drake." },
      ],
    };
  }
  return {
    title: "Lyra on the ridge",
    brief: CAST.lyra.intro,
    fail: "Lyra kept the transcript. The wing has our outline.",
    choices: [
      { id: "hide", label: "Go dark", blurb: "Kill the porch lamps. Let her paint an empty ridge." },
      { id: "lie", label: "Wave like a foundry", blurb: "Look busy. Look boring. She is listening for Tyrone." },
      { id: "fight", label: "Walk the ridge armed", blurb: "She already has the long gun. She will still call Drake." },
    ],
  };
}

export function dawnDispatch(state: GameState): string {
  const { poi } = pickFieldSite(state);
  const copy = siteCopyFor(poi, state.day % 3 === 0 ? "forage" : "scout");
  const heat = state.kaneHeat ?? 0;
  if (!hasFlag(state, "highway_walked")) {
    return "No tracks on the East Highway. Tyrone stopped anyway. Walk it before Kane writes the reason. Lyra is already listening on the West Berm.";
  }
  if (state.day <= 3 && !hasFlag(state, "rail_cut_scouted")) {
    return "The chit names a weigh-in at the Rail Cut. Read the invoice. One line is not about steel.";
  }
  if (heat >= 10) {
    const person = aegisOnDuty(state.day, heat);
    return `${person.name} is in Ironclad. ${copy.title} still has to walk.`;
  }
  return `${copy.title}. ${kaneHeatLine(heat)}`;
}

export function boardPostedLine(state: GameState, board: DayTask[]): string {
  const lead = board.find((t) => t.kind === "sortie") ?? board[0];
  const heat = kaneHeatLine(state.kaneHeat ?? 0);
  if (!lead) return `Day ${state.day}. The wall is blank. That is never good.`;
  if (!hasFlag(state, "highway_walked")) {
    return `Day ${state.day}. No tracks. ${lead.title} is the lead ticket. Kane does not get to write this one first.`;
  }
  if (state.day <= 3 && !hasFlag(state, "rail_cut_scouted")) {
    return `Day ${state.day}. The invoice is the lead ticket. ${lead.title}.`;
  }
  return `Day ${state.day}. ${lead.title} is the lead ticket. ${heat}`;
}

export function kaneFileBlurb(state: GameState): string {
  const heat = state.kaneHeat ?? 0;
  const region = locationToRegion(state.selectedLoc ?? "ironclad") ?? "ironclad";
  const stake = KANE_STAKES[region];
  if (state.day <= 2) {
    return "Tyrone found you with no tracks and no reason to stop. Walk the East Highway before Kane writes one. The invoice at the Rail Cut can wait until you have seen the dirt.";
  }
  return `${stake.resource}. ${stake.why} ${kaneHeatLine(heat)}`;
}

export function nightTale(state: GameState): string {
  const heat = state.kaneHeat ?? 0;
  const person = aegisOnDuty(state.day, heat);
  const tales = [
    `${person.name}'s visor painted the West Berm after midnight. ${person.visor ?? "Dark"} light. Listening.`,
    "Kane's buyers left a weigh-chit on the rail. Rail steel. Due at dusk. Project Vesper does not sleep.",
    "Halo Yard scorch marks looked fresh. Orion's people have been drilling frames that used to be Tyrone's job.",
    "Relay Tower Three coughed a Kane frequency and went quiet. Lyra already has the tape.",
    "A 2753 walked the Gate and did not knock. They were counting lamps, not doors.",
  ];
  return tales[state.day % tales.length]!;
}

export function missionOpeners(
  state: GameState,
  loc: LocationId,
  kind: MissionKind,
  poiId: string | undefined,
  company: string,
): string[] {
  const L = locById(loc);
  const poi = poiById(loc, poiId) ?? resolveMissionSite(state, loc, poiId);
  const pack = packFor(poi);
  const copy = poi ? siteCopyFor(poi, kind) : null;
  const heat = state.kaneHeat ?? 0;
  const person = heat >= 5 ? aegisOnDuty(state.day, heat) : CAST.kane;
  const site = poi?.name ?? L.short;
  const radio =
    kind === "scout"
      ? "Keep the visor down. You are counting, not claiming."
      : kind === "forage"
        ? "Take what the Hollow dropped. Leave what Kane is still holding."
        : kind === "raid"
          ? "Breach is a promise to Kane. She keeps receipts."
          : "Do the job in front of you.";
  const hollow = pack?.hollow ?? copy?.brief ?? poi?.description ?? L.desc;
  return [
    `SYNAPSE · ${company} ${site}.`,
    `Tyrone · ${radio}`,
    `Hollow · ${hollow}`,
    `${person.faction === "aegis" ? person.name : "Kane"} · ${person.voice[state.day % person.voice.length]}`,
  ];
}

function withLead(template: string, lead: string) {
  return template.replaceAll("{lead}", lead);
}

export function beatSitePrompt(
  state: GameState,
  loc: LocationId,
  kind: MissionKind,
  title: string,
  lead: string,
  poiId?: string,
): string | null {
  const poi = poiById(loc, poiId) ?? resolveMissionSite(state, loc, poiId);
  const pack = packFor(poi);
  const site = poi?.name ?? locById(loc).short;
  if (pack) {
    if (kind === "scout" && title === "Approach") return withLead(pack.approach, lead);
    if (kind === "scout" && title === "Sweep") return withLead(pack.sweep, lead);
    if (kind === "scout" && title === "Report") return withLead(pack.report, lead);
    if (kind === "forage" && title === "Range" && pack.range) return withLead(pack.range, lead);
    if (kind === "forage" && title === "Haul" && pack.haul) return withLead(pack.haul, lead);
  }
  if (kind === "scout" && title === "Approach") {
    return poi
      ? `${lead} takes the long way into ${site}. ${poi.description}`
      : `${lead} reads the ridgeline into ${site}. Count the watches. Do not announce.`;
  }
  if (kind === "scout" && title === "Sweep") {
    return `Tracks, caches, Kane stencils, the wrong kind of quiet. ${lead} puts a finger on ${site}.`;
  }
  if (kind === "scout" && title === "Report") {
    return `SYNAPSE wants a picture of ${site}, not a hero. ${lead} calls it in before Kane's people do.`;
  }
  if (title === "Contact") {
    return `Something small and hungry stepped into ${site}. ${lead} can drop it. The BB gun is not a joke.`;
  }
  if (title === "AEGIS contact") {
    const person = aegisOnDuty(state.day, state.kaneHeat ?? 0);
    meetCast(state, person.id);
    return `${person.name}'s visor caught ${site}. ${person.tagline} ${lead} can still walk away — or not.`;
  }
  return null;
}

export function aegisRunner(person: CastPerson): {
  name: string;
  hp: number;
  atk: number;
  def: number;
  dc: number;
  flavor: string;
  portrait: string;
  castId: CastId;
} {
  const scale =
    person.id === "orion"
      ? { hp: 14, atk: 6, def: 4, dc: 14 }
      : person.id === "drake"
        ? { hp: 12, atk: 5, def: 3, dc: 13 }
        : person.id === "vera"
          ? { hp: 10, atk: 4, def: 3, dc: 12 }
          : { hp: 9, atk: 4, def: 2, dc: 12 };
  return {
    name: `${person.name}'s 2753`,
    ...scale,
    flavor: `${person.callsign}. Human in a successor-suit. ${person.tagline}`,
    portrait: person.portrait,
    castId: person.id,
  };
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
