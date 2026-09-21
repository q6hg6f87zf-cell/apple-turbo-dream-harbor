import { locById, villainById } from "./data";
import { approachById, kaneBand, KANE_STAKES, locationToRegion } from "./field-ops";
import { porchSeats } from "./presence";
import { seatedMember } from "./squad";
import type {
  GameState,
  LocationId,
  MissionBeat,
  MissionKind,
  MissionState,
  Operative,
  StatKey,
} from "./types";

export const KIND_LABEL: Record<MissionKind, string> = {
  scout: "Scout",
  forage: "Forage",
  raid: "Raid",
  trade: "Trade",
  bounty: "Bounty",
  boss: "Named raid",
};

export const KIND_WHY: Record<MissionKind, string> = {
  scout: "Read the ground. Come home with a map, not a body.",
  forage: "Pull salvage and ore. Something usually notices.",
  raid: "Loud work. Heat, haul, and a fight if you miss the cut.",
  trade: "Price is a conversation. So is a knife.",
  bounty: "A name on the board. No speeches.",
  boss: "The hill has a name. The Realm does not let you kill it twice.",
};

const RADIO: Record<MissionKind, string[]> = {
  scout: [
    "Keep the visor down. You are counting, not claiming.",
    "If the quiet feels wrong, it is. Mark it and leave a trail home.",
    "Intel is the cheap blood. Spend it before you spend a body.",
  ],
  forage: [
    "Take what the Hollow dropped. Leave what it is still holding.",
    "Ore sings if you listen. So do the things that nest on it.",
    "Heavy packs make slow exits. Count the watches.",
  ],
  raid: [
    "Breach is a promise to Kane. He keeps receipts.",
    "Hold the door or do not open it. Halfway is a grave.",
    "Extract means walking. Caps do not walk themselves.",
  ],
  trade: [
    "Smile with the teeth you still have.",
    "If the price is kind, the crate is not.",
    "Count your fingers when you leave the stall.",
  ],
  bounty: [
    "The board does not care how you bring them. It cares that you do.",
    "No speeches. The contract is the speech.",
    "Alive costs more. Dead still pays.",
  ],
  boss: [
    "This is the name on the map. Everything else was practice.",
    "Phases are not flavor. They are the way it refuses to die.",
    "When it speaks, let it. Then finish the job.",
  ],
};

const WORLD_LINE: Partial<Record<LocationId, string>> = {
  ironclad: "Rail steel ticks in the cold. Kane's yard is never empty for long.",
  kingdom: "Slag light paints the smoke. The furnaces do not sleep.",
  caverns: "The mountain drinks torchlight. Do not follow the pretty veins too deep.",
  library: "Floodwater and old math. The tables still think they are in charge.",
  veyra: "2753 frames walk like people. Do not wave.",
};

function partyNames(state: GameState, ids: string[]) {
  return ids
    .map((id) => state.operatives.find((op) => op.id === id)?.name)
    .filter(Boolean) as string[];
}

function leadOf(state: GameState, ids: string[]): Operative | undefined {
  return ids.map((id) => state.operatives.find((op) => op.id === id)).find((op) => op && op.hp > 0) ?? state.operatives.find((op) => ids.includes(op.id));
}

function solo(ids: string[]) {
  return ids.length <= 1;
}

function porchOthers(selfName: string) {
  const seats = porchSeats().filter((seat) => !seat.self);
  if (!seats.length) return "";
  const names = seats.map((seat) => seat.name || "Rider").filter((name) => name !== selfName);
  if (!names.length) return "The porch is lit.";
  if (names.length === 1) return `${names[0]} has a stool. Quiet jobs stay yours. Loud jobs rotate.`;
  return `${names.slice(0, 3).join(", ")} on the porch. You do not wait on an empty chair.`;
}

export function eventBriefing(
  state: GameState,
  loc: LocationId,
  kind: MissionKind,
  partyIds: string[],
): { briefing: string; stakes: string; open: string[] } {
  const L = locById(loc);
  const lead = leadOf(state, partyIds);
  const names = partyNames(state, partyIds);
  const rider = seatedMember(state);
  const region = locationToRegion(loc);
  const kane = region ? KANE_STAKES[region] : null;
  const v = kind === "boss" ? villainById(L.bossId) : null;
  const bounty = kind === "bounty" ? state.bounty : null;
  const alone = solo(partyIds);
  const company = alone
    ? `${lead?.name ?? "The file"} walks it alone.`
    : `${names.join(" · ")} on the line.`;
  const porch = porchOthers(rider.name);

  const briefing = v
    ? `${v.name} — ${v.title}. ${v.tagline}`
    : bounty
      ? `${bounty.name}. ${bounty.type}. Last seen near ${L.short}.`
      : `${KIND_LABEL[kind]} in ${L.name}. ${KIND_WHY[kind]}`;

  const stakes = kane
    ? `${kane.resource}. ${kane.why}`
    : L.desc ?? "Come home with more than you spent.";

  const open = [
    `SYNAPSE · ${company} ${L.short}.`,
    `Tyrone · ${RADIO[kind][0]}`,
    WORLD_LINE[loc] ? `Hollow · ${WORLD_LINE[loc]}` : `Hollow · ${L.name} does not blink.`,
    porch ? `Porch · ${porch}` : `Porch · Vault 13 holds the light. You do not wait on a ghost.`,
  ];

  return { briefing, stakes, open };
}

export function beatPrompt(
  state: GameState,
  loc: LocationId,
  kind: MissionKind,
  beatKind: MissionBeat["kind"],
  title: string,
  partyIds: string[],
): string {
  const lead = leadOf(state, partyIds)?.name ?? "The file";
  const L = locById(loc);
  const v = villainById(L.bossId);
  const bounty = state.bounty;
  if (kind === "scout" && title === "Approach") return `${lead} reads the ridgeline into ${L.short}. Count the watches. Do not announce.`;
  if (kind === "scout" && title === "Sweep") return `Tracks, caches, the wrong kind of quiet. ${lead} puts a finger on the map.`;
  if (kind === "scout" && title === "Report") return `SYNAPSE wants a picture, not a hero. ${lead} calls it in.`;
  if (kind === "forage" && title === "Range") return `${lead} fans the squad for salvage. ${L.short} drops what it does not want to keep.`;
  if (kind === "forage" && title === "Haul") return `The pack gets heavy. Something in ${L.short} notices the taking.`;
  if (title === "Ambush") return `The ground was never empty. ${lead} finds out who was counting them.`;
  if (kind === "raid" && title === "Breach") return `${lead} goes in through a wound in the world. Kane will hear the hinge.`;
  if (kind === "raid" && title === "Hold") return `Noise buys a fight. Hold the door or lose the haul.`;
  if (kind === "raid" && title === "Extract") return `Leave with more than you brought. Caps do not walk.`;
  if (kind === "trade" && title === "Haggle") return `Price is a conversation. ${lead} keeps both hands visible.`;
  if (kind === "trade" && title === "Walk away") return `Deals have teeth. Count your fingers on the way out of ${L.short}.`;
  if (kind === "bounty" && title === "Track") return bounty ? `${bounty.name} last seen near ${L.short}. ${lead} takes the scent.` : `The board named a shadow. ${lead} follows it.`;
  if (kind === "bounty" && title === "Engage") return `No speeches. The contract is the speech.`;
  if (title === "Threshold") return v ? `${v.tagline} ${lead} crosses anyway.` : `The air changes register.`;
  if (title === "The name") return v ? `${v.name} is here. ${v.title}. Phases are the way it refuses.` : `Something with a name.`;
  return `${lead} works ${title.toLowerCase()} in ${L.short}.`;
}

export function radioFor(kind: MissionKind, beatIndex: number) {
  const lines = RADIO[kind];
  return `Tyrone · ${lines[Math.min(beatIndex, lines.length - 1)]}`;
}

export function rollLines(opts: {
  lead: string;
  title: string;
  band: string;
  hit: boolean;
  strong: boolean;
  kind: MissionKind;
  beatKind: MissionBeat["kind"];
  dc: number;
  total: number;
}): string[] {
  const { lead, title, band, hit, strong, beatKind, dc, total } = opts;
  const lines = [`${lead} · ${title}. ${band}.`];
  if (beatKind === "boss") {
    lines.push("SYNAPSE · No more map. Only the name.");
    return lines;
  }
  if (beatKind === "combat") {
    if (!hit) lines.push("Hollow · They were waiting.");
    else if (!strong) lines.push("Hollow · Contact. Ugly, but you saw it coming.");
    else lines.push(`${lead} · ends it before it starts.`);
    return lines;
  }
  if (hit) lines.push(strong ? `${lead} · makes it look inevitable.` : `${lead} · gets it done.`);
  else lines.push(`SYNAPSE · miss. DC ${dc}, total ${total}.`);
  return lines;
}

export function debriefLines(state: GameState, mission: MissionState): string[] {
  const L = locById(mission.locationId);
  const names = partyNames(state, mission.partyIds);
  const lead = names[0] ?? "The file";
  const loot = mission.loot.length ? mission.loot.map((item) => item.name).join(", ") : "empty hands";
  const v = mission.kind === "boss" ? villainById(L.bossId) : null;
  const lines = [
    `SYNAPSE · ${KIND_LABEL[mission.kind]} closed in ${L.short}. +${mission.coins} caps${mission.ore ? ` · +${mission.ore} ore` : ""}.`,
    `Tyrone · ${lead} is on the porch. ${loot === "empty hands" ? "We still learned the ground." : `Stow ${loot}.`}`,
  ];
  if (v && state.locations[mission.locationId].bossDefeated) {
    lines.push(`Hollow · ${v.name} is a story now. The arc does not rewind.`);
  }
  const others = porchSeats().filter((seat) => !seat.self);
  if (others.length) {
    lines.push(`Porch · ${others.map((seat) => seat.name).join(", ")} saw the lights. Your card kept the caps.`);
  } else {
    lines.push("Porch · Quiet compound. The next loud job is still yours.");
  }
  return lines;
}

export type EventChip = { label: string; value: string; warn?: boolean };

export function eventChips(state: GameState, mission: MissionState): EventChip[] {
  const L = locById(mission.locationId);
  const progress = state.locations[mission.locationId];
  const approach = approachById(mission.approach);
  const heat = state.kaneHeat ?? 0;
  const kane = kaneBand(heat);
  const beat = mission.beats[mission.beatIndex];
  const chips: EventChip[] = [
    { label: "Job", value: KIND_LABEL[mission.kind] },
    { label: "Ground", value: L.short },
    { label: "Approach", value: approach.label },
  ];
  if (beat) chips.push({ label: beat.stat, value: `DC ${beat.dc}` });
  chips.push({ label: "Intel", value: String(progress?.intel ?? 0) });
  chips.push({ label: "Kane", value: kane.label, warn: heat >= 10 });
  if (mission.kind === "bounty" && state.bounty) {
    chips.push({ label: "Mark", value: state.bounty.name, warn: true });
  }
  if (mission.kind === "boss") {
    const v = villainById(L.bossId);
    if (v) chips.push({ label: "Name", value: v.name, warn: true });
  }
  if (mission.coins) chips.push({ label: "Haul", value: `${mission.coins}c` });
  if (solo(mission.partyIds)) chips.push({ label: "Line", value: "Solo" });
  else chips.push({ label: "Line", value: `${mission.partyIds.length} up` });
  return chips;
}

export function contactFlavor(state: GameState, loc: LocationId, boss?: boolean, bounty?: boolean) {
  const L = locById(loc);
  if (boss) {
    const v = villainById(L.bossId);
    return v ? `${v.name} · ${v.title}` : "Named contact";
  }
  if (bounty && state.bounty) return `${state.bounty.name} · contract`;
  return `Contact · ${L.short}`;
}

export function shiftRadio(kind: string) {
  const lines: Record<string, string> = {
    crates: "Tyrone · One crate is a gift. Two is a test. Three is a mistake.",
    visitor: "Tyrone · Be kind until the visor tells you not to.",
    aegis: "Tyrone · 2753 on the wire. Do not wave. Do not run until I say.",
    treat: "Tyrone · Blood first. Pride second. Dawn does not wait on either.",
    scan: "Tyrone · Look twice. The Hollow hides the important thing under the loud thing.",
    repair: "Tyrone · Steel remembers how to hold if you ask it correctly.",
    run: "Tyrone · Caps on the card. Feet on the ground. That is a shift.",
    tribute: "Tyrone · Kane collects. Pay, stall, or make him work for it.",
    crisis: "Tyrone · This is the board telling the truth. Handle it before the next watch.",
  };
  return lines[kind] ?? "Tyrone · Do the job in front of you.";
}

export function dawnLines(state: GameState): string[] {
  const rider = seatedMember(state);
  const living = state.operatives.filter((op) => op.status !== "dead");
  const downed = state.operatives.filter((op) => op.status === "downed");
  const others = porchSeats().filter((seat) => !seat.self);
  const lines = [
    `SYNAPSE · Day ${state.day}. Watches reprint.`,
    `Tyrone · ${rider.name}, the board is new. Idle is still work.`,
  ];
  if (downed.length) lines.push(`Med Bay · ${downed.map((op) => op.name).join(", ")} still on the floor.`);
  else if (living.length) lines.push(`Compound · ${living.map((op) => op.name).join(", ")} standing.`);
  if (state.nightNote) lines.push(`Hollow · ${state.nightNote}`);
  if (others.length) lines.push(`Porch · ${others.map((seat) => seat.name).join(", ")} made dawn with you.`);
  else lines.push("Porch · You kept the light. Loud jobs stay yours until someone sits.");
  return lines;
}

export function parseEventLine(line: string): { speaker: string; text: string } {
  const cut = line.indexOf(" · ");
  if (cut > 0 && cut < 18) return { speaker: line.slice(0, cut), text: line.slice(cut + 3) };
  const quoted = line.match(/^([^:]{1,24}):\s*"?(.*)"?$/);
  if (quoted) return { speaker: quoted[1], text: quoted[2].replace(/"$/, "") };
  return { speaker: "", text: line };
}

export function eventStatHint(stat: StatKey, dc: number): string {
  const why: Record<StatKey, string> = {
    STR: "Force the hinge. Broken things remember being doors.",
    DEF: "Hold still. Let it spend itself.",
    INT: "Read the wire before it reads you.",
    WIS: "The Hollow lies. Listen anyway.",
    SPD: "Be gone before the second thought.",
    CHA: "Talk like you belong to the program.",
    LCK: "The Realm likes a gamble. It also collects.",
  };
  return `${stat} vs DC ${dc}. ${why[stat]}`;
}
