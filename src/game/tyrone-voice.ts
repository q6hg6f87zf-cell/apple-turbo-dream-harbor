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

  if (/how many cap|how rich|bottle cap|treasury|how much (do i|we) have/.test(low)) {
    return `${state.coins.toLocaleString()} bottle caps on the Vault 13 ledger, ${name}. Ore ${state.ore}. Moon Favor ${state.moonFavor}.`;
  }

  if (/what (do i |should i )?roll|what roll|this beat|this check|dc\b|what is the dc/.test(low)) {
    const beat = currentBeat(state);
    if (!beat) return "No die on the table. The sortie is the one that still uses it.";
    const phrase = dcPhrase(state, beat.dc, beat.stat);
    return `${beat.stat} check. ${beat.title}. ${phrase} after Perimeter Control and the scout watch. ${beat.lead}'s ${beat.stat} modifier is the thing that matters, partner.`;
  }

  if (/raid matrix|can we take|boss|gravenor|valdris|thessaly|null warden|why is the raid/.test(low)) {
    const gate = raidGate(state, loc, defaultPartyIds(state));
    if (!gate) return `Raid Matrix is green on ${locById(loc).name}. That is not the same as easy.`;
    return `Raid Matrix says no. ${gate} I am not being colorful.`;
  }

  if (/machine shop|forge locked|why is the (machine|forge|shop)|upgrade/.test(low)) {
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
    if (!hit) return "I don't remember forging that name.";
    if (hit.status === "dead") return `${hit.name} is a closed file. I remember.`;
    if (hit.status === "downed")
      return `${hit.name} is downed. ${state.rooms.infirmary >= 1 ? "Med Bay can stand them up." : "Med Bay is dark. Dawn will not be kind."}`;
    const where = hit.location === "hq" || hit.status === "idle" ? "Idle at Vault 13." : `Out on ${locById(hit.location).short}.`;
    return `${hit.name}, ${hit.cls}. ${hit.hp}/${hit.maxHp} on the meter. ${where}`;
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
    if (state.screen === "hq") return "Vault 13. Roof leaks. Door sticks. Home is a generous word, but it is ours.";
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

  if (/who are you|what are you/.test(low)) {
    return "Name's Tyrone. S.Y.N.A.P.S.E unit T-0880. I live in Vault 13. You hold the squad.";
  }

  if (/help|lost|what do i do|stuck/.test(low)) {
    const downed = state.operatives.filter((o) => o.status === "downed");
    if (downed.length && state.rooms.infirmary < 1)
      return `${downed[0]!.name} is downed and the Med Bay is dark. That is the job, partner.`;
    if (state.operatives.filter((o) => o.status !== "dead").length === 0)
      return "Roster is empty. Machine Shop. Name them like you mean it.";
    if ((state.shift?.board.filter((t) => t.status === "open") ?? []).length)
      return "The board still has jobs. A day with one dice roll is a simulation.";
    return "Forge. Deploy. Salvage. Recover. I put the next smart move on the strip up top.";
  }

  const mem = retrieveMemories(state, { limit: 1 })[0];
  if (mem && /we|last time|before/.test(low)) return `Yeah. ${mem.description}`;
  return "I've got nothing in my records on that. Ask me about the roll, the Matrix, a name on the roster, or this place.";
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
        promise.kept = true;
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
