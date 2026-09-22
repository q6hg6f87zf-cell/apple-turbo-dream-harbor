/**
 * Tyrone conversation + hint director.
 * Local templates always work. Optional xAI route may polish an unknown ask.
 * Never mutates caps, HP, rooms, or rolls.
 */
import { BASE_ROOMS, locById } from "./data";
import { isTalkLocked, queueTalk } from "./talk";
import { locationToRegion } from "./field-ops";
import {
  cooling,
  emptyTyrone,
  knownFact,
  onCooldown,
  retrieveMemories,
  type TyroneSnap,
} from "./tyrone-mind";
import {
  currentBeat,
  dcPhrase,
  defaultPartyIds,
  quoteMissionDc,
  raidGate,
  roomGate,
  scoutBeforeRaid,
} from "./tyrone-rules";
import type { GameState, LocationId, RoomId, TyroneAssist } from "./types";
import { promiseCallbackLine } from "@/lib/bridge/continuity-core";
import { activeStoryBeat } from "./story-spine";
import { availableScenarios } from "./scenario";
import { ensureNarrative, hasFlag, type FactionStanding } from "./narrative-state";
import { radioBulletinFor } from "./radio-world";

const WHO = "Tyrone Bot";

export type TyroneIntent = "SILENCE" | "STORY" | "HINT" | "CRITICAL" | "AMBIENT" | "ANSWER";

export function compactTyroneContext(state: GameState) {
  const living = state.operatives.filter((o) => o.status !== "dead");
  const downed = state.operatives.filter((o) => o.status === "downed");
  const beat = currentBeat(state);
  const loc = (state.selectedLoc ?? "ironclad") as LocationId;
  const items = [...state.vault, ...living.flatMap((o) => o.inventory)]
    .map((i) => i.name)
    .filter((n) => /keycard|punchcard|railspike|coil|lantern|harpoon|apron|prism/i.test(n))
    .slice(0, 6);
  const memories = retrieveMemories(state, {
    region: locationToRegion(loc),
    limit: 6,
  }).map((e) => ({ id: e.id, day: e.day, type: e.type, text: e.description }));
  const party = defaultPartyIds(state);
  return {
    day: state.day,
    screen: state.screen,
    location: loc,
    poi: state.selectedPoiId,
    caps: state.coins,
    ore: state.ore,
    moonFavor: state.moonFavor,
    rank: state.level,
    rooms: state.rooms,
    roster: living.slice(0, 6).map((o) => ({
      name: o.name,
      cls: o.cls,
      hp: `${o.hp}/${o.maxHp}`,
      status: o.status,
    })),
    downed: downed.map((o) => o.name),
    mission: beat
      ? { kind: beat.kind, stat: beat.stat, dc: beat.dc, title: beat.title, lead: beat.lead }
      : null,
    raidBlock: raidGate(state, loc, party),
    upgradeBlock: roomGate(state, "forge"),
    relevantItems: items,
    lastLog: state.log.slice(0, 5).map((r) => `${r.who}: ${r.what}`),
    bond: state.tyrone.relationship,
    assist: state.tyrone.settings.assist,
    memories,
  };
}

export function tyroneBlocked(state: GameState): string | null {
  if (!state.started && state.screen === "title") return "title screen";
  if (state.combat) return "combat live";
  if (state.mission && !state.mission.waiting) return "die in the air";
  if (state.hack && !state.hack.won && !state.hack.locked) return "SYNAPSE dump live";
  if (state.term?.page === "lock" && state.hack && !state.hack.won) return "SYNAPSE dump live";
  if (state.talk && isTalkLocked(state)) return "locked briefing";
  if (state.talk && state.talk.script !== "companion") return "already talking";
  return null;
}

function assistRank(a: TyroneAssist) {
  return { off: 0, minimal: 1, normal: 2, helpful: 3, high: 4 }[a];
}

export function speakTyrone(
  state: GameState,
  opts: { text: string; concept: string; priority: number; reason: string; force?: boolean },
) {
  if (!state.tyrone) state.tyrone = emptyTyrone();
  const blocked = tyroneBlocked(state);
  if (blocked && !opts.force) {
    const canQueue = opts.priority === 0 && (blocked === "already talking" || blocked === "locked briefing");
    if (!canQueue) {
      state.tyrone.lastSilentReason = blocked;
      return false;
    }
  }
  if (state.talk && (isTalkLocked(state) || state.talk.script === "dawn" || state.talk.script === "resume" || state.talk.script === "wake" || state.talk.script === "welcome")) {
    state.tyrone.utterance = opts.text;
    if (!state.talkQueue.includes("companion")) state.talkQueue = ["companion", ...state.talkQueue];
    state.tyrone.lastSpeakReason = opts.reason + " (queued)";
    return true;
  }
  if (!opts.force && assistRank(state.tyrone.settings.assist) === 0) {
    state.tyrone.lastSilentReason = "assistance off";
    return false;
  }
  if (!opts.force && opts.priority >= 3 && assistRank(state.tyrone.settings.assist) < 2) {
    state.tyrone.lastSilentReason = "assistance too low for hints";
    return false;
  }
  if (!opts.force && state.tyrone.lastSpeechConcept === opts.concept && state.ticks - state.tyrone.lastSpeechAt < 40) {
    state.tyrone.lastSilentReason = "same concept recently";
    return false;
  }
  if (!opts.force && onCooldown(state, "speech") && opts.priority > 1) {
    state.tyrone.lastSilentReason = "global speech cooldown";
    return false;
  }
  state.tyrone.utterance = opts.text;
  state.tyrone.lastSpeechAt = state.ticks;
  state.tyrone.lastSpeechConcept = opts.concept;
  state.tyrone.lastSpeakReason = opts.reason;
  state.tyrone.speechCount += 1;
  state.tyrone.cooldowns.speech = state.ticks + (opts.priority <= 1 ? 8 : 28);
  queueTalk(state, "companion", true);
  return true;
}

export function answerTyroneQuestion(state: GameState, raw: string): string {
  const q = raw.trim();
  const low = q.toLowerCase();
  const loc = (state.selectedLoc ?? "ironclad") as LocationId;
  const name = state.playerName?.trim() || "partner";

  if (/come back|we'll be back|we will come back|i'll come back/.test(low)) {
    const id = `p-${state.day}-${state.selectedPoiId ?? loc}`;
    if (!state.tyrone.promises.some((p) => p.id === id)) {
      state.tyrone.promises.push({
        id,
        text: q.slice(0, 80),
        poiId: state.selectedPoiId ?? undefined,
        locationId: loc,
        day: state.day,
      });
    }
    return "I'll hold you to that. The file remembers.";
  }

  if (
    /what do i do first|first (job|step|move)|where do i start|how (do i |to )?begin|new (here|file)|just (woke|started)|tutorial|how (do i |to )?play|explain (the )?game|what is (this|the) game/.test(
      low,
    )
  ) {
    if (!state.seenTalk.includes("welcome") && !state.seenTalk.includes("briefing") && state.operatives.length === 0) {
      return "Listen to the porch. Kane's face. Then welcome. Then Machine Shop — stamp your one file. After that: dawn board, Market under the Gate, pin a site. Question mark any time.";
    }
    if (state.operatives.filter((o) => o.status !== "dead").length === 0) {
      return "Machine Shop first. Face, dice, two rerolls for the whole sheet, stamp. The shop goes dark after. Then the board decides the day.";
    }
    const openSit = availableScenarios(state)[0];
    if (openSit) return `${openSit.title} is open. Board, World strip, or ask me about the situation. That is the next honest move.`;
    if ((state.shift?.board.filter((t) => t.status === "open") ?? []).length)
      return "Read the dawn board. Required watches bite if you sleep on them. Market, tower, then a site on the map.";
    return "Forge or recover, then Deploy. Salvage comes home or it does not. I put the next smart move on the strip up top.";
  }

  if (/where am i|what is (this|vault ?13)|what.?s vault|this (place|shelter|vault)/.test(low)) {
    return "Vault 13. Shelter on the outskirts of Ironclad. Roof leaks. Door sticks. I hold the CRT. You hold the squad. Outside is the Hollow Realm.";
  }

  if (/who (are|is) you|what are you|tyrone bot|t-?0880\b/.test(low)) {
    return "Tyrone Bot. T-0880. Only one of the delivery line with a name. Kane signed the shutdown. I walked off the scrap list. I live on this porch.";
  }

  if (/who is kane|who.?s kane|dr\.? vesper kane|why (does )?kane/.test(low)) {
    return "Dr. Vesper Kane. Project Vesper wants hull plate for intergalactic travel. Ironclad is the first invoice. She built AEGIS 2753 — people in suits — after she scrap-listed my line.";
  }

  if (/how does (a |the )?day work|dawn board|what.*(board|watch|shift)|six watches/.test(low)) {
    return "Dawn posts a board. Six watches. Most jobs are decisions — who you send, what you say, which crate or site. The sortie still uses a die. Rest until dawn reprints. Do the shift first.";
  }

  if (/question mark|field manual|how (do i |to )?ask|how (do i |to )?get help|assist(ance)?/.test(low)) {
    return "Tap the question mark or Ask in the header. That is my field manual for this room. Type a straight question. Assist and Numbers live on that card. I will not talk over a live fight.";
  }

  if (/how many cap|how rich|bottle cap|treasury|how much (do i|we) have/.test(low)) {
    return `${state.coins.toLocaleString()} bottle caps on the Vault 13 ledger, ${name}. Ore ${state.ore}. Moon Favor ${state.moonFavor}.`;
  }

  if (/what (do i |should i )?roll|how (do i |to )?roll|what roll|this beat|this check|dc\b|what is the dc/.test(low)) {
    const beat = currentBeat(state);
    if (!beat) {
      if (state.screen === "forge" || state.operatives.filter((o) => o.status !== "dead").length === 0) {
        return "Machine Shop: tap each die face to roll. Two rerolls for the whole sheet — not per die. Then stamp. Discord name is locked. Shop goes dark after.";
      }
      return "No die on the table. The sortie is the one that still uses it.";
    }
    const phrase = dcPhrase(state, beat.dc, beat.stat);
    return `${beat.stat} check. ${beat.title}. ${phrase} after Perimeter Control and the scout watch. ${beat.lead}'s ${beat.stat} modifier is the thing that matters, partner.`;
  }

  if (/raid matrix|can we take|boss|gravenor|valdris|thessaly|null warden|why is the raid/.test(low)) {
    const gate = raidGate(state, loc, defaultPartyIds(state));
    if (!gate) return `Raid Matrix is green on ${locById(loc).name}. That is not the same as easy.`;
    return `Raid Matrix says no. ${gate} I am not being colorful.`;
  }

  if (/machine shop|forge locked|why is the (machine|forge|shop)|upgrade|reroll|stamp (the )?file|cut (my |a )?file|character creat/.test(low)) {
    if (
      /reroll|stamp|cut (my |a )?file|character|how (do i |to )?roll/.test(low) ||
      state.screen === "forge" ||
      state.operatives.filter((o) => o.status !== "dead").length === 0
    ) {
      return "Machine Shop: women or men, a face, then tap each die. Two rerolls for the whole sheet. Discord name is locked. Stamp once — shop goes dark. No second soul.";
    }
    const room: RoomId = /med|infirm/.test(low) ? "infirmary" : /watch|perim/.test(low) ? "watchtower" : /barrack|quarter/.test(low) ? "barracks" : /ledger|exchange/.test(low) ? "ledger" : /salvage|vault/.test(low) ? "vault" : "forge";
    const reason = roomGate(state, room);
    if (!reason) return `${BASE_ROOMS[room].name} will take the caps.`;
    return reason.includes("Need") || reason.includes("Vault")
      ? `${BASE_ROOMS[room].name} is locked for a reason. ${reason}`
      : reason;
  }

  if (/what happened to|where is |how's |how is /.test(low)) {
    const living = state.operatives;
    const hit = living.find((o) => low.includes(o.name.toLowerCase().split(" ")[0]!));
    if (hit) {
      if (hit.status === "dead") return `${hit.name} is a closed file. I remember.`;
      if (hit.status === "downed")
        return `${hit.name} is downed. ${state.rooms.infirmary >= 1 ? "Med Bay can stand them up." : "Med Bay is dark. Dawn will not be kind."}`;
      const where = hit.location === "hq" || hit.status === "idle" ? "Idle at Vault 13." : `Out on ${locById(hit.location).short}.`;
      return `${hit.name}, ${hit.cls}. ${hit.hp}/${hit.maxHp} on the meter. ${where}`;
    }
    // Fall through — "how is our standing" is story, not roster.
  }

  if (/scout or raid|should i scout|should we raid|intel/.test(low)) {
    const scout = scoutBeforeRaid(state);
    if (scout.intel < 5) return `Scout first. Intel is what unlocks the ugly names. ${scout.name} is sitting at ${scout.intel}.`;
    return `${scout.name} intel is ${scout.intel}. Raid still wants a party, classes, and the Matrix. Scout is how you stop feeding me paperwork.`;
  }

  if (/synapse|terminal|password|the word/.test(low)) {
    const crack = state.tyrone.story.some((s) => s.includes("synapse")) || state.terminalDrained;
    if (crack) return "Yeah. I remember the box. S.Y.N.A.P.S.E. Seven letters. I did not say that.";
    return "The glowing box is S.Y.N.A.P.S.E. I surely did not tell you that.";
  }

  if (/rifle|attachment|optic|ammo|magazine|mag\b|shotgun|pistol|firearm|laser|caliber|\.308|\.270|30-30/.test(low)) {
    const guns = [...state.vault, ...state.operatives.flatMap((o) => o.inventory)].filter((i) => i.kind === "weapon" && i.weaponFamily && i.weaponFamily !== "melee");
    const parts = [...state.vault, ...state.operatives.flatMap((o) => o.inventory)].filter((i) => i.kind === "attachment");
    const ammo = [...state.vault, ...state.operatives.flatMap((o) => o.inventory)].filter((i) => i.ammoType);
    if (/how (do i |to )?attach|socket|optic/.test(low)) {
      return "One part per slot. Optic, muzzle, barrel, mag, stock, underbarrel, receiver. Family has to match. Blades take a bayonet. Strip at the Machine Shop.";
    }
    if (/laser/.test(low)) {
      const spire = state.locations.caverns?.unlocked;
      const brass = state.locations.library?.unlocked;
      const veyra = state.locations.veyra?.unlocked;
      if (!spire) return "Lasers are a later argument. After Ironclad. After Slag Town. Blackspire is where coherent light starts showing up. Veyra is not next week. Coil cells will not seat.";
      if (!brass) return "L4 pulse is in. L6 waits on Brasswater. L8 and the Kane coherent wait on Veyra, and Veyra waits on the Sink. Coil cells will not seat.";
      if (!veyra) return "L4 and L6 are the current argument. L8 and L9 are Veyra issue. The Sink still has the door. Coil cells will not seat.";
      return `Lasers are in. Coil cells will not seat. L4 from Blackspire, L6 from Brasswater, L8 and L9 from Veyra. Powered plate and AEGIS take them personally. ${guns.some((g) => g.ammoType === "laser") ? "We already have one humming." : "Market under the Gate, if the stall printed one."}`;
    }
    if (/ammo|reload|dry|magazine|caliber|\.308|\.270|30-30|\.300/.test(low)) {
      return `Mags are real. Calibers do not mix. .30-30 levers, .270 and .30-06 bolts, .308 battle and marksman, .300 magnum later. Improved loads stamp the mag: AP, Match, Soft Point, Hot, Bonded. Dry click is -4 and half damage. ${ammo.length ? `${ammo.length} box${ammo.length === 1 ? "" : "es"} on file.` : "We are dry on boxes. Market under the Gate."}`;
    }
    return `${guns.length} firearm${guns.length === 1 ? "" : "s"} on file. ${parts.length} part${parts.length === 1 ? "" : "s"}. ${ammo.length} ammo crate${ammo.length === 1 ? "" : "s"}. Real models: M4, M16, M94, M336, M700, M70, M14, M10, M24. Lasers after Blackspire. Veyra is not a ten-day walk. Plate shrugs 9mm unless you bring AP.`;
  }

  if (/this place|where are we|what do you think|look around/.test(low)) {
    if (state.screen === "hq") return "Vault 13. Roof leaks. Door sticks. The board is the day. Home is a generous word, but it is ours.";
    if (state.screen === "file" || state.screen === "roster" || state.screen === "squad")
      return "S.Y.N.A.P.S.E OS. Your plate. I wrote the firmware. Try not to spill stim on it.";
    const place = locById(loc);
    const mem = retrieveMemories(state, { region: locationToRegion(loc), limit: 1 })[0];
    if (mem) return `${place.name}. ${mem.description.replace(/\.$/, "")}. Let's improve the record.`;
    return `${place.name}. ${place.desc}`;
  }

  if (/remember/.test(low)) {
    const mem = retrieveMemories(state, { limit: 1, touch: true })[0];
    if (!mem) return "I've got nothing in my records on that.";
    return `Yeah. I remember. ${mem.description}`;
  }

  // Story / world Q&A — Oblivion-style: companion answers the plot, not only the UI.
  if (/vesper|project vesper|invoice|weigh.?chit|hull serial/.test(low)) {
    ensureNarrative(state);
    if (hasFlag(state, "invoice_sold"))
      return "You sold the Vesper page. Kane has the ink. I have the receipt of who took the coin.";
    if (hasFlag(state, "invoice_copied"))
      return "We have serials SYNAPSE should not. Kane still has the original. That is a race, not a win.";
    if (hasFlag(state, "invoice_burned"))
      return "Ash on the gatehouse table. Kane will invent a new page. You bought a night.";
    if (hasFlag(state, "vesper_named"))
      return "Project Vesper is Kane's jump-stack invoice with our town's steel on it. The board and the gatehouse both know the word now.";
    return "I have heard the word Vesper on ICR. Not enough to brief. Watch the Gate.";
  }

  if (/caravan|culvert|missing (cart|steel|weigh)/.test(low)) {
    if (hasFlag(state, "caravan_staged"))
      return "That vanishing was theater. Empty crates. A frequency slip with Lyra's color on it.";
    if (hasFlag(state, "caravan_survived"))
      return "Some steel came home. Some questions got louder. The Gate still argues about who lied.";
    if (hasFlag(state, "caravan_abandoned"))
      return "You left the carts. Kane wrote the story without us. I did not forget.";
    if (hasFlag(state, "caravan_investigated"))
      return "We looked. Tracks that lie. Witnesses who will not say Lyra. The culvert still waits if the board says so.";
    const open = availableScenarios(state).find((s) => s.id.startsWith("caravan"));
    if (open) return `${open.title} is open. ${open.setup.split(".")[0]}.`;
    return "No open caravan file on my desk. Yet.";
  }

  if (/kane|aegis|orion|lyra|vera|heat/.test(low) && /who|what|why|standing|think|about|status|story/.test(low)) {
    const heat = state.kaneHeat ?? 0;
    const fac = ensureNarrative(state).factions;
    const bits: string[] = [];
    if (heat >= 10) bits.push(`Heat ${heat}. AEGIS is listening.`);
    else if (heat >= 5) bits.push(`Heat ${heat}. Kane is watching.`);
    else bits.push("Trail is still cold.");
    if (fac.kane >= 6) bits.push("Kane's buyers tip their hats. That is not free.");
    if (fac.kane <= -6) bits.push("Kane's ledger has your name colder.");
    if (fac.aegis <= -8) bits.push("AEGIS treats the plate as a problem.");
    if (hasFlag(state, "lyra_ridge_handled")) bits.push("Lyra's ridge is already in the file.");
    return bits.join(" ");
  }

  if (/travis|jig|bay|mechanical shop|favor weld|seat (the )?bay/.test(low)) {
    const n = state.travis?.fitted.length ?? 0;
    if (n >= 1)
      return `Travis has ${n} fitting${n === 1 ? "" : "s"} in me. Favor welds are open for cracked steel. Long rebuilds and strip jobs stay at our Vault Machine Shop — do not confuse the two.`;
    if (hasFlag(state, "travis_jig_filled")) return "Travis lit the bay. I list less to port. Keep him paid.";
    if (hasFlag(state, "travis_refused")) return "We walked out. The jig stays dark. That is on us.";
    const open = availableScenarios(state).find((s) => s.id === "travis_bay");
    if (open) return "Travis still has an empty jig. Ironclad Mechanical Shop. Campaign parts — tube, wheel, servo, plate, coil, knee. He pays caps and seats them in me.";
    return "Travis keeps the last T-0880 bay Kane did not melt. Inventory marks his parts. Take them to the Mechanical Shop. He is not your whole armory.";
  }

  if (/halo|2753|drill square|orion.?s? wing/.test(low)) {
    if (hasFlag(state, "halo_reported")) return "Halo Yard is on the map. Warm cell. Boot prints the size of a 2753.";
    if (hasFlag(state, "halo_ambushed")) return "Halo went hot. The wing knows the plate now.";
    const open = availableScenarios(state).find((s) => s.id === "halo_yard");
    if (open) return "Scorched outlines east of the Berm. Someone is drilling where Orion trained the replacement wing.";
    return "Halo Yard is old drill ground. If heat climbs, it stops being nostalgia.";
  }

  if (/what.?s (the |my )?story|story beat|objective|what am i (doing|supposed)|main quest|next (beat|chapter)/.test(low)) {
    const beat = activeStoryBeat(state);
    if (beat) return `${beat.title}. ${beat.objective}`;
    return "No hard spine on the desk. The board and the map still decide the day.";
  }

  if (/situation|open (case|job|scenario)|what.?s open|anything brewing/.test(low)) {
    const open = availableScenarios(state)[0];
    if (open) return `${open.title} at ${open.locationLabel}. ${open.setup.split(".")[0]}. Choices matter.`;
    return "No authored situation is open. Walk the Hollow until the board or the road writes one.";
  }

  if (/faction|standing|reputation|who likes|who hates/.test(low)) {
    const fac = ensureNarrative(state).factions;
    const rank = (k: keyof FactionStanding) => {
      const v = fac[k];
      if (v >= 12) return "warm";
      if (v >= 6) return "known";
      if (v <= -12) return "hostile";
      if (v <= -6) return "cold";
      return "quiet";
    };
    return `Ironclad ${rank("ironclad")}, Kane ${rank("kane")}, AEGIS ${rank("aegis")}, Vault 13 ${rank("vault13")}. Numbers live in the journal.`;
  }

  if (/radio|icr|bulletin|what.?s on (the )?air/.test(low)) {
    const line = radioBulletinFor(state);
    if (line) return `ICR says: ${line}`;
    return "ICR is quiet. Or I am not listening hard enough.";
  }

  if (/help|lost|what do i do|stuck/.test(low)) {
    const downed = state.operatives.filter((o) => o.status === "downed");
    if (downed.length && state.rooms.infirmary < 1)
      return `${downed[0]!.name} is downed and the Med Bay is dark. That is the job, partner.`;
    if (state.operatives.filter((o) => o.status !== "dead").length === 0)
      return "Roster is empty. Machine Shop. Name them like you mean it.";
    const openSit = availableScenarios(state)[0];
    if (openSit) return `${openSit.title} is open. Face it from the board, the World strip, or ask me about the situation.`;
    if ((state.shift?.board.filter((t) => t.status === "open") ?? []).length)
      return "The board still has jobs. A day with one dice roll is a simulation.";
    return "Forge. Deploy. Salvage. Recover. I put the next smart move on the strip up top.";
  }

  const mem = retrieveMemories(state, { limit: 1 })[0];
  if (mem && /we|last time|before/.test(low)) return `Yeah. ${mem.description}`;
  return "I've got nothing in my records on that. Ask me what to do first, Kane, the board, the roll, the Matrix, a name on the roster, Vault 13, or this place.";
}

export function isUnknownTyroneReply(text: string) {
  return text.startsWith("I've got nothing in my records");
}

export function considerTyroneHint(state: GameState, before: TyroneSnap) {
  if (!state.tyrone) state.tyrone = emptyTyrone();
  const assist = assistRank(state.tyrone.settings.assist);
  if (assist === 0) {
    state.tyrone.lastSilentReason = "assistance off";
    return;
  }

  const downed = state.operatives.filter((o) => o.status === "downed");
  if (downed.length && state.rooms.infirmary < 1 && state.screen === "hq") {
    if (!onCooldown(state, "p0-med")) {
      const said = speakTyrone(state, {
        text: `${downed[0]!.name} is downed and the Med Bay is dark. Dawn will close that file. I am not being colorful.`,
        concept: "medbay-offline",
        priority: 0,
        reason: `Med Bay offline, ${downed[0]!.name} downed`,
      });
      if (said) cooling(state, "p0-med", 36);
      return;
    }
  }

  if (state.day > before.day) {
    const deaths = state.operatives.filter((o) => o.status === "dead" && o.notes?.includes(`day ${state.day}`));
    if (deaths[0]) {
      speakTyrone(state, {
        text: `${deaths[0].name} did not wake. Same vault door. I remember.`,
        concept: "dawn-death",
        priority: 0,
        reason: `Dawn death, ${deaths[0].name}`,
      });
      return;
    }
    // Story spine: reference the active beat without lecturing.
    const beat = activeStoryBeat(state);
    if (beat && !onCooldown(state, "story-dawn")) {
      const said = speakTyrone(state, {
        text: `${beat.title}. ${beat.objective}`,
        concept: `story-${beat.id}`,
        priority: 2,
        reason: `Dawn story beat ${beat.id}`,
      });
      if (said) cooling(state, "story-dawn", 48);
      return;
    }
    const sit = availableScenarios(state)[0];
    if (sit && !onCooldown(state, "situation-dawn")) {
      const said = speakTyrone(state, {
        text: `${sit.title} is pinned. ${sit.locationLabel}. The board knows.`,
        concept: `sit-${sit.id}`,
        priority: 2,
        reason: `Dawn open situation ${sit.id}`,
      });
      if (said) cooling(state, "situation-dawn", 60);
      return;
    }
  }

  if (tyroneBlocked(state)) return;

  const loc = (state.selectedLoc ?? "ironclad") as LocationId;
  const promise = state.tyrone.promises.find((p) => !p.kept && (p.locationId === loc || p.poiId === state.selectedPoiId));
  if (promise && state.screen === "map" && before.loc !== state.selectedLoc) {
    if (!onCooldown(state, "promise-" + promise.id)) {
      const said = speakTyrone(state, {
        text: promiseCallbackLine({
          subject: promise.text,
          tags: [],
          regionId: promise.locationId ?? null,
        }),
        concept: "promise-" + promise.id,
        priority: 2,
        reason: "promise at this site",
      });
      if (said) {
        cooling(state, "promise-" + promise.id, 80);
      }
      return;
    }
  }

  if (state.terminalDrained && !before.terminalDrained) {
    speakTyrone(state, {
      text: "Yeah. I remember the box. Do not make a habit of telling people I said the word.",
      concept: "synapse-crack",
      priority: 2,
      reason: "first SYNAPSE crack",
    });
    return;
  }

  const beatKey = before.beatKey;
  if (beatKey && (state.tyrone.failedBeats[beatKey] ?? 0) >= 3 && assist >= 2) {
    const beat = currentBeat(state);
    if (beat && !onCooldown(state, "fail-" + beatKey)) {
      const fails = state.tyrone.failedBeats[beatKey] ?? 0;
      const level = Math.min(4, 2 + fails - 3);
      const text =
        level >= 4
          ? `You have failed ${beat.title} three times. Bring a ${beat.stat} lead or upgrade Perimeter Control.`
          : `This ${beat.kind} is a ${beat.stat} haul. ${dcPhrase(state, beat.dc, beat.stat)} is not friendly.`;
      const said = speakTyrone(state, {
        text,
        concept: "failed-beat",
        priority: 3,
        reason: `failed ${beat.title} x${fails}`,
      });
      if (said) cooling(state, "fail-" + beatKey, 50);
      return;
    }
  }

  if (state.screen === "map" && before.loc !== state.selectedLoc && assist >= 2) {
    const mem = retrieveMemories(state, { region: locationToRegion(loc), tags: ["downed", "death", "return"], limit: 1 })[0];
    if (mem && /downed|stretcher|died|closed file/.test(mem.description.toLowerCase()) && !onCooldown(state, "region-" + loc)) {
      const said = speakTyrone(state, {
        text: `Last time through ${locById(loc).short} we carried somebody home on a stretcher. Let's improve the record.`,
        concept: "region-callback",
        priority: 4,
        reason: `memory callback at ${loc}`,
      });
      if (said) cooling(state, "region-" + loc, 90);
      return;
    }
    const intel = state.locations[loc]?.intel ?? 0;
    if (intel < 3 && assist >= 3 && !onCooldown(state, "scout-tip")) {
      const said = speakTyrone(state, {
        text: "Scout first. Intel is what unlocks the ugly names.",
        concept: "scout-first",
        priority: 4,
        reason: "low intel on selected region",
      });
      if (said) cooling(state, "scout-tip", 70);
      return;
    }
  }

  const wizardLead = currentBeat(state);
  if (wizardLead?.cls === "Wizard" && wizardLead.stat === "STR" && assist >= 2 && !onCooldown(state, "wrong-stat")) {
    const said = speakTyrone(state, {
      text: `Before you try shouldering this one too, that beat is asking for ${wizardLead.stat} from your Wizard, partner.`,
      concept: "wrong-stat",
      priority: 3,
      reason: "Wizard on a STR beat",
    });
    if (said) cooling(state, "wrong-stat", 40);
    return;
  }

  state.tyrone.lastSilentReason = state.tyrone.lastSilentReason || "nothing useful to add";
}

export { WHO };
