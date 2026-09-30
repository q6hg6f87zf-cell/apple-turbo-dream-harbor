import { locById, WORLD } from "./data";
import { discoverNextPoi, KANE_STAKES, locationToRegion } from "./field-ops";
import { aegisJob, boardPostedLine, sortieJob } from "./story";
import { CAST, meetCast } from "./cast";
import { queueTalk } from "./talk";
import { applyAegisChoice } from "./consequences";
import { syncStorySpine } from "./story-spine";
import { bumpFaction, hasFlag, setFlag } from "./narrative-state";
import { crateRead, jobSkill, medicineHeal, repairSteps, skillValue } from "./skills";
import type {
  DayTask,
  GameState,
  Item,
  LocationId,
  MissionKind,
  ShiftState,
  TaskChoice,
  WatchId,
} from "./types";

export const WATCH_ORDER: WatchId[] = ["dawn", "morning", "midday", "afternoon", "dusk", "night"];

export const SHIFT_WATCHES = 6;

export const WATCH_LABEL: Record<WatchId, string> = {
  dawn: "Dawn",
  morning: "Morning",
  midday: "Midday",
  afternoon: "Afternoon",
  dusk: "Dusk",
  night: "Night",
};

export function emptyShift(day = 1): ShiftState {
  return { day, watch: "dawn", watchesLeft: SHIFT_WATCHES, board: [], log: [], activeId: null };
}

function seedRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function pickN<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)] ?? arr[0];
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function cogTask(): DayTask {
  return {
    id: "job-travis-cog",
    kind: "cog",
    title: "Sit Travis's cognitive",
    order: "Bay 13. Eight words. Tag three skills. Spend what he puts on the bench.",
    spoken: {
      who: "Travis",
      line: "I don't fit a chassis I haven't tested. Sit. First word. Don't perform.",
    },
    brief:
      "He stamps three skills from how you answer, not from the class you wish you rolled. You can change the tags. The jobs use whatever you stamp.",
    why: "Until this is stamped, the board does not know which way you bend.",
    watchCost: 1,
    required: true,
    npcId: "travis",
    loc: "ironclad",
    skill: "science",
    failNote: "You skipped Bay 13. Travis files you unsorted. The jobs stay dumb until you sit.",
    status: "open",
  };
}

function withCog(state: GameState, board: DayTask[]): DayTask[] {
  if (!state.operatives.length || hasFlag(state, "travis_cog")) return board;
  if (board.some((t) => t.kind === "cog")) return board;
  return [cogTask(), ...board];
}

function note(state: GameState, what: string) {
  state.log = [{ id: uid("log"), day: state.day, kind: "hq" as const, who: "Tyrone", what }, ...state.log].slice(0, 80);
  state.shift.log = [what, ...state.shift.log].slice(0, 12);
}

function watchFromLeft(n: number): WatchId {
  if (n >= 6) return "dawn";
  if (n === 5) return "morning";
  if (n === 4) return "midday";
  if (n === 3) return "afternoon";
  if (n === 2) return "dusk";
  return "night";
}

export function spendWatches(state: GameState, n: number) {
  const shift = ensureShift(state);
  shift.watchesLeft = Math.max(0, shift.watchesLeft - n);
  shift.watch = watchFromLeft(shift.watchesLeft);
}

export function sortieWatchCost(kind: MissionKind) {
  return kind === "raid" || kind === "boss" || kind === "bounty" ? 2 : 1;
}

export function openRequired(state: GameState) {
  return ensureShift(state).board.filter((t) => t.status === "open" && t.required);
}

export function openJobs(state: GameState) {
  return ensureShift(state).board.filter((t) => t.status === "open" || t.status === "active");
}

export function restPenalties(state: GameState): string[] {
  return openRequired(state).map((t) => t.failNote ?? `Ignored: ${t.title}.`);
}

export function canRestClean(state: GameState) {
  return openRequired(state).length === 0 && ensureShift(state).watchesLeft <= 2;
}

function unlockedField(state: GameState) {
  return WORLD.filter((w) => w.id !== "hq" && state.locations[w.id]?.unlocked);
}

function crateTask(rand: () => number): DayTask {
  const stamps = [
    ["Left crate still ticks.", "Middle one smells like oil.", "Right one has a rail stamp."],
    ["Wire-bound. Warm.", "Cloth wrap. Quiet.", "Kane stencil, half scraped."],
    ["Bolted shut.", "Already cracked.", "Marked for the buyer."],
  ];
  const labels = pickN(rand, stamps);
  const kinds: Array<"good" | "junk" | "trap"> = ["good", "junk", "trap"];
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  return {
    id: uid("job"),
    kind: "crates",
    title: "Crack the depot crates",
    order: "Open one crate. Leave the other two. Lockpick 45 names the tick.",
    spoken: {
      who: "Tyrone",
      line: "Three boxes. One ticks, one pays, one is an insult. I am not guessing for you.",
    },
    brief: "Three unmarked boxes came in overnight. One still ticks. One smells like oil. One has a Kane stencil half scraped. Pick one. Leave the rest.",
    why: "Salvage is a decision, not a roll.",
    watchCost: 1,
    required: false,
    skill: "lockpick",
    failNote: "The crates went to Kane's people or the rats. Same difference.",
    crates: labels.map((label, i) => ({
      id: `c${i}`,
      label,
      result: kinds[i],
      payload:
        kinds[i] === "good"
          ? pickN(rand, ["Rail bolt bundle", "Sealed stim case", "Ore sample tin"])
          : kinds[i] === "trap"
            ? pickN(rand, ["Needle charge", "AEGIS tracker", "Rot gas"])
            : pickN(rand, ["Wet rags", "Empty tin", "Someone's teeth"]),
    })),
    status: "open",
  };
}

function visitorTask(rand: () => number, day: number): DayTask {
  const pack = [
    {
      title: "Slag-blood at the gate",
      order: "She will not come in. Buy the map, feed her, or send her down the road.",
      spoken: { who: "Slag-blood", line: "I don't cross your door. I crossed the ridge. The map is wet. I'm thirsty. Pick." },
      brief: "She will not come inside. She has a map fragment and a thirst.",
      choices: [
        { id: "buy", label: "Buy the whispers", blurb: "“Eighty caps. Talk, then go.” Intel on Ironclad.", need: "caps" as const, cost: 80 },
        { id: "feed", label: "Feed her", blurb: "“Sit. Eat. Don't say our name on the road.” She will anyway." },
        { id: "turn", label: "Turn her away", blurb: "“Gate's closed. Kane's road is that way.”" },
      ],
    },
    {
      title: "Slag Town runner",
      order: "Move his slag, tax the run, or tell him the road is his.",
      spoken: { who: "Runner", line: "Furnace slag. Kane's buyers price it at dusk. I need it gone before they name a number." },
      brief: "He wants furnace slag moved before Kane's buyers price it.",
      choices: [
        { id: "move", label: "Move the slag", blurb: "“Load it. I walk with you as far as the cut.” Caps now." },
        { id: "tax", label: "Tax the run", blurb: "“Vault 13's road. You pay for the quiet.” He will not forget." },
        { id: "turn", label: "Not our problem", blurb: "“Take the road alone. Don't use our name.”" },
      ],
    },
    {
      title: "Brasswater diver",
      order: "A bunk, the page for caps, or a sealed door.",
      spoken: { who: "Diver", line: "Page is from the drowned stacks. I want a dry floor for one night. You can buy the ink and keep the door shut." },
      brief: "She offers a wet page from the Drowned Archive. Wants a bunk for one night.",
      choices: [
        { id: "bunk", label: "Give her a bunk", blurb: "“One night. You leave at dawn with less paper.”" },
        { id: "buy", label: "Buy the page only", blurb: "“One twenty. You sleep in the wet.”", need: "caps" as const, cost: 120 },
        { id: "turn", label: "Keep the vault sealed", blurb: "“No guests. Kane's divers are already looking.”" },
      ],
    },
  ];
  const v = pack[Math.min(pack.length - 1, Math.floor((day - 1) / 2) % pack.length)] ?? pack[0];
  if (rand() < 0.4) {
    /* keep calendar visitor */
  }
  return {
    id: uid("job"),
    kind: "visitor",
    title: v.title,
    order: v.order,
    spoken: v.spoken,
    brief: v.brief,
    why: "People at the gate are the Realm talking.",
    watchCost: 1,
    required: false,
    skill: "speech",
    failNote: "They walked. The Realm talked to someone else.",
    choices: v.choices,
    status: "open",
  };
}

function tributeTask(state: GameState): DayTask {
  const open = unlockedField(state);
  const loc = open[state.day % open.length] ?? WORLD.find((w) => w.id === "ironclad")!;
  const regionId = locationToRegion(loc.id) ?? "ironclad";
  const stake = KANE_STAKES[regionId];
  return {
    id: uid("job"),
    kind: "tribute",
    title: `Kane wants ${stake.resource.toLowerCase()}`,
    order: `Hand over the ${stake.resource.toLowerCase()}, refuse, or pack a fake. Sneak or Explosives sells the fake. A Rogue does too.`,
    spoken: { who: "Kane's buyer", line: `${stake.why} I'm not here to negotiate the noun. I'm here for the weight.` },
    brief: `${stake.why} A buyer is waiting at ${loc.short}.`,
    why: "Paying her buys time. Refusing buys a hunt.",
    watchCost: 1,
    required: state.kaneHeat >= 8,
    loc: loc.id,
    skill: "barter",
    failNote: `Kane took the ${stake.resource.toLowerCase()} anyway. Heat up.`,
    choices: [
      { id: "pay", label: `Hand over ${stake.resource.toLowerCase()}`, blurb: "1 Hollow Ore. She pays. Heat drops.", need: "ore", cost: 1 },
      { id: "refuse", label: "Vault 13 does not tithe", blurb: "Heat climbs. The buyer leaves a mark." },
      { id: "fake", label: "Fake the shipment", blurb: "A Rogue makes this work. Anyone else gets caught." },
    ],
    status: "open",
  };
}

function crisisTask(day: number, heat: number): DayTask {
  const pack: Array<{ title: string; brief: string; fail: string; choices: TaskChoice[] }> = [
    {
      title: "Vent leak in the depot",
      brief: "The Salvage Depot is coughing black air. Someone has to crawl in.",
      fail: "The leak cooked a crate. Caps and pride down.",
      choices: [
        { id: "send", label: "Send a body in", blurb: "Warrior or a hired smith. They come back filthy." },
        { id: "pay", label: "Pay a patch crew", blurb: "120 caps. Nobody crawls.", need: "caps", cost: 120 },
        { id: "seal", label: "Weld it shut", blurb: "Lose access to one crate line. Vault holds." },
      ],
    },
    {
      title: "Missing crate",
      brief: "A rail-stamped box walked off the porch between ticks.",
      fail: "Kane's buyer found it first. Heat and a lost lead.",
      choices: [
        { id: "hunt", label: "Send a Ghostrunner", blurb: "Rogue or nobody. Fast feet." },
        { id: "pay", label: "Write it off", blurb: "80 caps to the ledger as loss.", need: "caps", cost: 80 },
        { id: "accuse", label: "Shake the gate", blurb: "Ugly. Might be the runner. Might be us." },
      ],
    },
    {
      title: "AEGIS flyover",
      brief: "A 2753 frame is drawing a circle over the ridge. Lights will talk.",
      fail: "They mapped the bunkers. Kane has our outline.",
      choices: [
        { id: "dark", label: "Kill the lights", blurb: "We go blind on the perimeter tonight." },
        { id: "lit", label: "Look like a foundry", blurb: "Heat +2. They log a working plant." },
        { id: "signal", label: "Spoof a friendly ping", blurb: "Needs a Signalist or a Bard. Otherwise they hear a lie." },
      ],
    },
  ];
  const c = pack[(day + heat) % pack.length]!;
  return {
    id: uid("job"),
    kind: "crisis",
    title: c.title,
    brief: c.brief,
    why: "If you sleep on this, it sleeps on you.",
    watchCost: 1,
    required: true,
    failNote: c.fail,
    choices: c.choices,
    status: "open",
  };
}

function openingBoard(state: GameState): ShiftState {
  const board: DayTask[] = [
    sortieJob(state),
    aegisJob(state),
    {
      id: uid("job"),
      kind: "scan",
      title: "Leave the porch light",
      order: "Walk the ridge once. If the white visor is up, do not wave.",
      spoken: { who: "Tyrone", line: "The light means the shelter is still mine. A dark porch is also a choice. Don't make it by accident." },
      brief: "One walk of the ridge after the highway. The light means the shelter is still his. If the white visor is already up, do not wave.",
      why: "Lyra paints outlines. A dark porch is a choice. A lit porch is also a choice.",
      watchCost: 1,
      required: false,
      skill: "sneak",
      failNote: "The ridge went unwalked. She painted whatever the lamps gave her.",
      status: "open",
    },
  ];
  return {
    day: state.day,
    watch: "dawn",
    watchesLeft: SHIFT_WATCHES,
    board: withCog(state, board),
    log: [boardPostedLine(state, board)],
    activeId: null,
  };
}

export function generateBoard(state: GameState): ShiftState {
  if (state.day <= 1 && !hasFlag(state, "highway_walked")) return openingBoard(state);
  const rand = seedRng(state.day * 9176 + (state.kaneHeat ?? 0) * 13 + state.level * 7);
  const board: DayTask[] = [];
  const field = unlockedField(state);
  const loc = field[0] ?? WORLD.find((w) => w.id === "ironclad")!;

  board.push(sortieJob(state));

  const wounded = state.operatives.filter((o) => o.status === "downed" || (o.hp < o.maxHp && o.status !== "dead"));
  if (wounded.length) {
    board.push({
      id: uid("job"),
      kind: "treat",
      title: wounded.some((o) => o.status === "downed") ? "Med pass — someone is down" : "Med pass",
      order: "Pick who gets the needle. Downed riders do not see another dawn without it.",
      spoken: { who: "Tyrone", line: "Blood first. Pride second. I will not watch you sort this with a speech." },
      brief: `${wounded.map((o) => o.name).join(", ")} need a bunk and a needle. You pick who. Kane does not wait on the wounded.`,
      why: "Dawn will finish anyone still downed without a Med Bay.",
      watchCost: 1,
      required: wounded.some((o) => o.status === "downed"),
      skill: "medicine",
      failNote: "The wounded were left to the night.",
      status: "open",
    });
  }

  board.push(crateTask(rand));

  const broken = state.operatives.some((o) =>
    (o.inventory ?? []).some((i) => i.condition === "Broken" || i.condition === "Damaged"),
  );
  if (broken || rand() > 0.55) {
    board.push({
      id: uid("job"),
      kind: "repair",
      title: "Machine Shop hour",
      order: "Pick a broken piece, or oil the line if nothing is proud. Repair 55 jumps the condition twice.",
      spoken: { who: "Travis", line: "Put it on the bench. Don't narrate the weld." },
      brief: "Oil, weld, swear. The BB gun still kicks if the receiver is proud. Pick a piece of kit or spend the watch on the line.",
      why: "Broken steel is a choice you already made.",
      watchCost: 1,
      required: broken,
      skill: "repair",
      failNote: "A broken piece stays broken. Next sortie will notice.",
      status: "open",
    });
  }

  board.push({
    id: uid("job"),
    kind: "scan",
    title: "Walk the perimeter",
    order: "Count visors on the West Berm. Do not wave. Sneak 40 marks one extra site.",
    spoken: { who: "Tyrone", line: "Look twice. The Hollow hides the important thing under the loud thing." },
    brief: "Cameras, such as they are. Count visors on the West Berm. Lyra paints ridges. If a white light is out there, the rest of the wing already has a map.",
    why: "Intel is how Ghost routes open. Kane's outline of us is the other number.",
    watchCost: 1,
    required: false,
    skill: "sneak",
    failNote: "The perimeter walked itself. Kane's outline of us is sharper.",
    status: "open",
  });

  if (state.day >= 2) board.push(visitorTask(rand, state.day));

  if (state.day >= 1) board.push(aegisJob(state));

  if (state.day >= 2 && (state.ore > 0 || state.day % 2 === 0)) board.push(tributeTask(state));

  if (state.day % 3 === 0 || (state.kaneHeat ?? 0) >= 10) board.push(crisisTask(state.day, state.kaneHeat ?? 0));

  if (state.coins < 500 || state.day % 2 === 1) {
    board.push({
      id: uid("job"),
      kind: "run",
      title: "Supply run",
      order: "Send one idle operative down the slag road. Survival 40 means they come back unhurt.",
      spoken: { who: "Tyrone", line: "Caps on the card. Feet on the ground. Pick who walks. Class still decides the haul." },
      brief: "Send one operative down the slag road. They walk. You get the report. Kane's buyers use the same road after dusk.",
      why: "The roster is the mechanic. Class decides the haul.",
      watchCost: 1,
      required: false,
      skill: "survival",
      failNote: "Nobody walked. The pantry stayed thin.",
      status: "open",
    });
  }

  board.push({
    id: uid("job"),
    kind: "market",
    title: "Walk the Moon Squad Market",
    order: "Go to the Iron Gate. Buy with the black card. Barter 45 shaves the price.",
    spoken: { who: "Holt Kade", line: "Dawn stock. Qty is not a suggestion. I don't take the vault drawer." },
    brief: "Stalls under the Iron Gate. Kane's surveyors already bought a table at the gatehouse. Limited stock. Dawn reset. The black card pays.",
    why: "Gear lives on the ground now, not in a ledger drawer.",
    watchCost: 1,
    required: state.day % 2 === 1,
    loc: "ironclad",
    poiId: "ironclad-market",
    skill: "barter",
    failNote: "The stalls packed up without Moon Squad. Dawn will reprint thinner.",
    status: "open",
  });

  board.push({
    id: uid("job"),
    kind: "tower",
    title: "Climb Relay Tower Three",
    order: "Climb. Listen. Science is what you bring back that wasn't on the board.",
    spoken: { who: "Tyrone", line: "The tower talks whether we are on it or not. I'd rather it talk to us." },
    brief: "ICR 88's iron spine. Kane frequencies, visiting stalls, sites the board has not named yet. Lyra listens here whether we climb or not.",
    why: "A day Kane talks and we do not is a day we donate the map.",
    watchCost: 1,
    required: state.day >= 2 && state.day % 2 === 0,
    loc: "ironclad",
    poiId: "ironclad-tower",
    skill: "science",
    failNote: "The tower talked to empty air. Lyra kept the transcript.",
    status: "open",
  });

  const salvage = board.find((t) => t.kind === "sortie");
  board.push({
    id: uid("job"),
    kind: "salvage",
    title: salvage?.poiId ? `Work ${locById(loc.id).short} on the ground` : `Work a site in ${loc.short}`,
    brief: salvage?.brief
      ? `Pin it on the ground map. Scout or salvage. One site, one watch. ${salvage.title} is already on the wall if you want the die.`
      : "Open the ground map. Pin a landmark, ruin or yard. Scout or salvage. One site, one watch, once per day.",
    why: "The map is the job. Dice are only the loud ones.",
    watchCost: 1,
    required: false,
    loc: loc.id,
    poiId: salvage?.poiId,
    failNote: `${loc.short} went unworked. Kane's surveyors pocketed the easy scrap.`,
    status: "open",
  });

  return {
    day: state.day,
    watch: "dawn",
    watchesLeft: SHIFT_WATCHES,
    board: withCog(state, board),
    log: [boardPostedLine(state, board)],
    activeId: null,
  };
}

export function ensureShift(state: GameState): ShiftState {
  if (!state.shift || state.shift.day !== state.day || !state.shift.board.length) {
    state.shift = generateBoard(state);
    return state.shift;
  }
  const board = state.shift.board.filter((t) => t.kind !== "cabinet");
  state.shift.board = board;
  const sortie = board.find((t) => t.kind === "sortie");
  if (sortie && !sortie.poiId) {
    const fresh = sortieJob(state);
    sortie.title = fresh.title;
    sortie.brief = fresh.brief;
    sortie.why = fresh.why;
    sortie.loc = fresh.loc;
    sortie.poiId = fresh.poiId;
    sortie.missionKind = fresh.missionKind;
    sortie.failNote = fresh.failNote;
  }
  if (!board.some((t) => t.kind === "market")) {
    board.push({
      id: uid("job"),
      kind: "market",
      title: "Walk the Moon Squad Market",
      brief: "The Exchange at Vault 13 is closed. Stalls sit under the Iron Gate. The black card pays.",
      why: "Gear lives on the ground now.",
      watchCost: 1,
      required: false,
      loc: "ironclad",
      poiId: "ironclad-market",
      failNote: "The stalls packed up without Moon Squad. Dawn will reprint thinner.",
      status: "open",
    });
  }
  if (!board.some((t) => t.kind === "tower")) {
    board.push({
      id: uid("job"),
      kind: "tower",
      title: "Climb Relay Tower Three",
      brief: "Listen. Kane frequencies, visiting stalls, unmarked sites.",
      why: "The tower talks if you climb it.",
      watchCost: 1,
      required: false,
      loc: "ironclad",
      poiId: "ironclad-tower",
      failNote: "The tower talked to empty air. A site went unmarked.",
      status: "open",
    });
  }
  if (!board.some((t) => t.kind === "salvage")) {
    board.push({
      id: uid("job"),
      kind: "salvage",
      title: "Work a site",
      brief: "Open the ground map. Pin a landmark. Scout or salvage. One watch.",
      why: "The map is the job.",
      watchCost: 1,
      required: false,
      loc: "ironclad",
      failNote: "The site went unworked. Kane's surveyors pocketed the easy scrap.",
      status: "open",
    });
  }
  state.shift.board = withCog(state, state.shift.board);
  return state.shift;
}

function item(partial: Omit<Item, "id" | "condition"> & { condition?: Item["condition"] }): Item {
  return {
    id: uid("it"),
    condition: "Pristine",
    ...partial,
  };
}

function finish(state: GameState, task: DayTask, report: string, watches = task.watchCost) {
  task.status = "done";
  task.report = report;
  spendWatches(state, watches);
  note(state, report);
  state.toast = report;
  state.shift.activeId = null;
  // Board work writes the story — Oblivion radiant jobs leave marks.
  if (task.kind === "tower") {
    setFlag(state, "gate_watched", true);
    bumpFaction(state, "ironclad", 1);
  }
  if (task.kind === "aegis") {
    setFlag(state, "aegis_contact_survived", true);
  }
  if (task.kind === "tribute") {
    setFlag(state, "kane_weigh_in_seen", true);
    bumpFaction(state, "kane", 1);
  }
  if (task.kind === "market") {
    bumpFaction(state, "ironclad", 1);
  }
  if (task.kind === "crisis") {
    bumpFaction(state, "vault13", 1);
  }
  if (task.loc === "kingdom" || task.kind === "salvage") {
    if (state.locations.kingdom?.unlocked) setFlag(state, "slag_entered", true);
  }
  syncStorySpine(state);
  if (state.shift.watchesLeft <= 0) {
    state.shift.watch = "night";
    state.toast = `${report} Shift over. Rest when you are ready.`;
    queueTalk(state, "night");
  }
  if (state.tutorial === "sortie" || state.tutorial === "shift") {
    const still = openJobs(state).length;
    if (!still) state.tutorial = "rest";
  }
}

export function completeCog(state: GameState, report: string) {
  const shift = state.shift;
  if (!shift) return;
  const task = shift.board.find((t) => t.kind === "cog" && (t.status === "open" || t.status === "active"));
  if (!task) return;
  if (shift.watchesLeft < task.watchCost) {
    task.status = "done";
    task.report = report;
    shift.activeId = null;
    state.toast = report;
    return;
  }
  finish(state, task, report);
}

export function finishCabinetJob(state: GameState, report: string) {
  const shift = state.shift;
  if (!shift?.board?.length) return;
  const task = shift.board.find((t) => t.kind === "cabinet" && (t.status === "open" || t.status === "active"));
  if (!task) return;
  if (task.status === "done") return;
  if (shift.watchesLeft < task.watchCost) {
    task.status = "done";
    task.report = report;
    shift.activeId = null;
    return;
  }
  finish(state, task, report);
}

export interface TaskPayload {
  choiceId?: string;
  crateId?: string;
  opId?: string;
  loc?: LocationId;
  itemKey?: string;
}

export function resolveTask(state: GameState, taskId: string, payload: TaskPayload = {}): string | null {
  const shift = ensureShift(state);
  if (shift.watchesLeft <= 0) return "Shift is over. Rest until dawn.";
  const task = shift.board.find((t) => t.id === taskId);
  if (!task) return "That job is not on the board.";
  if (task.status === "done" || task.status === "failed") return "Already closed.";
  if (shift.watchesLeft < task.watchCost) return "Not enough watches left on this shift.";

  if (task.kind === "sortie") {
    return "World already has the site pinned. Pick an approach and deploy.";
  }

  if (task.kind === "cabinet") {
    return "Sit the T-0888 glass. A scored win closes this job.";
  }

  if (task.kind === "market") {
    return "World. Ironclad. Moon Squad Market under the Gate. The black card pays.";
  }

  if (task.kind === "tower") {
    return "World. Climb Relay Tower Three. Listen. That is the job.";
  }

  if (task.kind === "salvage") {
    return "World. Open the ground map. Pin a site. Scout or salvage it.";
  }

  if (task.kind === "crates") {
    const crate = task.crates?.find((c) => c.id === payload.crateId);
    if (!crate) return "Pick a crate.";
    if (crate.result === "good") {
      state.coins += 90;
      state.vault.push(
        item({
          name: crate.payload,
          kind: "material",
          rarity: "Uncommon",
          effect: "Salvage from the depot line.",
          lore: "Tyrone would have opened the other one.",
          value: 70,
        }),
      );
      finish(state, task, `Crate paid. ${crate.payload}. +90 caps.`);
    } else if (crate.result === "trap") {
      state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 2);
      const idle = state.operatives.find((o) => o.status === "idle");
      const soft = skillValue(state, "explosives") >= 50;
      if (idle) {
        const i = state.operatives.findIndex((o) => o.id === idle.id);
        state.operatives[i] = { ...idle, hp: Math.max(1, idle.hp - (soft ? 1 : 3)) };
      }
      finish(
        state,
        task,
        soft
          ? `Trap. ${crate.payload}. Explosives ${skillValue(state, "explosives")} — you stepped off. Kane still got a ping.`
          : `Trap. ${crate.payload}. Kane just got a ping.`,
      );
    } else {
      finish(state, task, `Junk. ${crate.payload}. The watch is still spent.`);
    }
    return null;
  }

  if (task.kind === "treat") {
    const op = state.operatives.find((o) => o.id === payload.opId);
    if (!op) return "Pick who gets the needle.";
    const i = state.operatives.findIndex((o) => o.id === op.id);
    if (op.status === "downed") {
      const heal = Math.max(2, medicineHeal(skillValue(state, "medicine")));
      state.operatives[i] = { ...op, hp: Math.max(2, Math.min(op.maxHp, heal)), status: "idle", location: "hq" };
      finish(state, task, `${op.name} is standing. Medicine put ${heal} back. Ugly, but standing.`);
    } else {
      const heal = medicineHeal(skillValue(state, "medicine"));
      state.operatives[i] = { ...op, hp: Math.min(op.maxHp, op.hp + heal) };
      finish(state, task, `${op.name} took the med pass. Medicine ${skillValue(state, "medicine")}. +${heal} HP.`);
    }
    return null;
  }

  if (task.kind === "repair") {
    const ops = state.operatives;
    let found: { oi: number; ii: number } | null = null;
    ops.forEach((op, oi) => {
      op.inventory.forEach((it, ii) => {
        if (!found && (it.condition === "Broken" || it.condition === "Damaged" || it.condition === "Worn")) {
          found = { oi, ii };
        }
      });
    });
    if (payload.itemKey) {
      const [oi, ii] = payload.itemKey.split(":").map(Number);
      if (!Number.isNaN(oi) && !Number.isNaN(ii)) found = { oi, ii };
    }
    if (found) {
      const op = state.operatives[found.oi]!;
      const it = op.inventory[found.ii]!;
      const steps = repairSteps(skillValue(state, "repair"));
      let next = it.condition;
      for (let s = 0; s < steps; s++) {
        next = next === "Broken" ? "Damaged" : next === "Damaged" ? "Worn" : "Pristine";
      }
      it.condition = next;
      finish(
        state,
        task,
        steps > 1
          ? `${it.name} is ${next}. Repair ${skillValue(state, "repair")} jumped it twice.`
          : `${it.name} is ${next}. The line holds.`,
      );
    } else {
      state.coins += 25;
      finish(state, task, "Nothing broken. You oiled the line. +25 caps in saved parts.");
    }
    return null;
  }

  if (task.kind === "scan") {
    const loc = (payload.loc ?? unlockedField(state)[0]?.id ?? "ironclad") as LocationId;
    if (!state.locations[loc]?.unlocked) return "That region is sealed.";
    const bonus = skillValue(state, "sneak") >= 40 ? 1 : 0;
    state.locations[loc] = { ...state.locations[loc], intel: state.locations[loc].intel + 2 + bonus };
    const found = discoverNextPoi(state, loc);
    finish(
      state,
      task,
      found
        ? `Perimeter marked ${found.name} in ${locById(loc).short}.${bonus ? ` Sneak ${skillValue(state, "sneak")} saw one more.` : ""} Ghost routes open when intel is on the board.`
        : `${locById(loc).short} scanned. Intel +${2 + bonus}. Kane's people were already walking it.`,
    );
    return null;
  }

  if (task.kind === "run") {
    const op = state.operatives.find((o) => o.id === payload.opId && o.status === "idle");
    if (!op) return "Send someone idle.";
    const i = state.operatives.findIndex((o) => o.id === op.id);
    state.operatives[i] = { ...op, status: "deployed", location: "ironclad" };
    let report = `${op.name} walks the slag road.`;
    if (op.cls === "Merchant" || op.cls === "Bard") {
      state.coins += 140;
      report = `${op.name} talks a stall into paying. +140 caps.`;
    } else if (op.cls === "Rogue") {
      state.locations.ironclad.intel += 2;
      state.coins += 60;
      report = `${op.name} cuts a quieter line. Intel +2, +60 caps.`;
    } else if (op.cls === "Healer") {
      state.pack = { ...state.pack, stimpak: (state.pack.stimpak ?? 0) + 1 };
      report = `${op.name} trades a favor for a stim.`;
    } else if (op.cls === "Wizard") {
      state.ore += 1;
      report = `${op.name} comes back with ore that should not have been on that road.`;
    } else {
      state.coins += 90;
      const hurt = op.hp > 4 && Math.random() < 0.35 && skillValue(state, "survival") < 40;
      if (hurt) {
        state.operatives[i] = { ...state.operatives[i]!, hp: op.hp - 2, status: "deployed", location: "ironclad" };
        report = `${op.name} hauls scrap. +90 caps. They will feel it.`;
      } else {
        report = `${op.name} hauls scrap. +90 caps. Clean run.`;
      }
    }
    finish(state, task, report);
    return null;
  }

  const choice = task.choices?.find((c) => c.id === payload.choiceId);
  if (!choice) return "Call it.";
  if (choice.need === "caps" && (choice.cost ?? 0) > state.coins) return `Need ${choice.cost} caps.`;
  if (choice.need === "ore" && (choice.cost ?? 0) > state.ore) return "Need 1 Hollow Ore.";
  if (choice.need === "caps") state.coins -= choice.cost ?? 0;
  if (choice.need === "ore") state.ore -= choice.cost ?? 0;

  if (task.kind === "visitor") {
    if (choice.id === "buy") {
      state.locations.ironclad.intel += 2;
      const haggle = skillValue(state, "barter") >= 45;
      if (haggle) state.coins += 20;
      finish(state, task, haggle ? "Whispers bought. Barter talked twenty caps back. Ironclad intel +2." : "Whispers bought. Ironclad intel +2.");
    } else if (choice.id === "feed" || choice.id === "bunk") {
      state.moonFavor += 2;
      state.locations.ironclad.intel += 1;
      finish(state, task, "They eat. They talk. Vault 13 just made a friend.");
    } else if (choice.id === "move") {
      state.coins += 110;
      finish(state, task, "Slag moved. +110 caps. Kane's buyer is late.");
    } else if (choice.id === "tax") {
      state.coins += 50;
      const smooth = skillValue(state, "speech") >= 50;
      if (!smooth) state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 1);
      finish(state, task, smooth ? "You taxed him and he thanked you. Speech. Kane did not hear it." : "You took a cut. He will mention it.");
    } else {
      const talked = skillValue(state, "speech") >= 40;
      if (talked) state.coins += 30;
      finish(state, task, talked ? "You turned them out. They still talked on the road. Speech. +30 caps." : "Gate stays simple. The Realm does not.");
    }
    return null;
  }

  if (task.kind === "aegis") {
    const tower = state.rooms.watchtower >= 1 || skillValue(state, "sneak") >= 50;
    const talker =
      state.operatives.find((o) => o.status === "idle" && (o.cls === "Bard" || o.cls === "Merchant")) ||
      skillValue(state, "speech") >= 45;
    const person = CAST[(task.npcId as keyof typeof CAST) ?? "lyra"] ?? CAST.lyra;
    meetCast(state, person.id);
    if (choice.id === "hide") {
      if (tower && state.rooms.watchtower >= 1) {
        state.kaneHeat = Math.max(0, (state.kaneHeat ?? 0) - 1);
        finish(state, task, `Perimeter Control buried me. ${person.name} logged an empty ridge.`);
      } else if (tower) {
        state.kaneHeat = Math.max(0, (state.kaneHeat ?? 0) - 1);
        finish(state, task, `Sneak ${skillValue(state, "sneak")}. ${person.name} painted an empty ridge. No cameras. Just you, gone.`);
      } else {
        state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 2);
        finish(state, task, `No cameras. ${person.name} walked a bunk. Heat up. I stayed in the walls.`);
      }
      applyAegisChoice(state, "hide", person.id);
    } else if (choice.id === "lie") {
      if (talker && typeof talker !== "boolean") {
        finish(state, task, `${talker.name} sold ${person.name} the salvage-outfit line. They bought it. For now.`);
      } else if (talker) {
        finish(state, task, `Speech ${skillValue(state, "speech")}. ${person.name} bought the salvage-outfit line. For now.`);
      } else {
        state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 3);
        finish(state, task, `Nobody here talks like a foundry. ${person.name} logged a question mark.`);
      }
      applyAegisChoice(state, "lie", person.id);
    } else {
      state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 4);
      finish(state, task, `You met ${person.name}'s 2753 armed. That is a conversation for the yard.`);
      applyAegisChoice(state, "fight", person.id);
      state.shift.activeId = task.id;
      task.status = "active";
      return "fight";
    }
    syncStorySpine(state);
    return null;
  }

  if (task.kind === "tribute") {
    if (choice.id === "pay") {
      state.coins += 80;
      state.kaneHeat = Math.max(0, (state.kaneHeat ?? 0) - 2);
      finish(state, task, "She paid. Heat down. Ore gone. The jump stack eats.");
    } else if (choice.id === "refuse") {
      state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 3);
      finish(state, task, "Vault 13 does not tithe. The buyer left a mark.");
    } else {
      const rogue = state.operatives.some((o) => o.status === "idle" && o.cls === "Rogue");
      const packed = rogue || skillValue(state, "sneak") >= 45 || skillValue(state, "explosives") >= 50;
      if (packed) {
        state.coins += 70;
        state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 1);
        finish(
          state,
          task,
          rogue
            ? "The shipment looked right. It was sand. A Rogue made it so."
            : `The shipment looked right. It was sand. ${skillValue(state, "sneak") >= 45 ? "Sneak" : "Explosives"} packed it.`,
        );
      } else {
        state.ore = Math.max(0, state.ore - 1);
        state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 5);
        finish(state, task, "They opened it on the porch. Heat way up. Ore gone anyway.");
      }
    }
    return null;
  }

  if (task.kind === "crisis") {
    const muscle = state.operatives.find((o) => o.status === "idle" && (o.cls === "Warrior" || o.cls === "Rogue"));
    const signal = state.operatives.find((o) => o.status === "idle" && (o.cls === "Bard" || o.cls === "Wizard"));
    if (choice.id === "pay" || choice.id === "seal") {
      finish(state, task, choice.id === "seal" ? "Welded. One line dead. Vault holds." : "Patch crew paid. The air is air again.");
    } else if (choice.id === "send" || choice.id === "hunt") {
      if (muscle) {
        finish(state, task, `${muscle.name} crawled it. Filthy. Done.`);
      } else {
        const idle = state.operatives.find((o) => o.status === "idle");
        if (idle) {
          const i = state.operatives.findIndex((o) => o.id === idle.id);
          state.operatives[i] = { ...idle, hp: Math.max(1, idle.hp - 4) };
          finish(state, task, `${idle.name} is not built for this. They did it. Barely.`);
        } else {
          state.coins = Math.max(0, state.coins - 60);
          finish(state, task, "Nobody to send. You paid the leak in caps and time.");
        }
      }
    } else if (choice.id === "dark") {
      finish(state, task, "Lights out. The flyover sees a dead plant. We see nothing either.");
    } else if (choice.id === "lit") {
      state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 2);
      finish(state, task, "We looked like a foundry. They logged us as one.");
    } else if (choice.id === "signal") {
      if (signal) {
        finish(state, task, `${signal.name} spoofed a friendly. The frame peeled off.`);
      } else {
        state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 3);
        finish(state, task, "The ping was a lie and they heard a lie. Heat up.");
      }
    } else if (choice.id === "accuse") {
      state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 1);
      state.coins += 40;
      finish(state, task, "You shook the gate. A runner dropped 40 caps and a grudge.");
    } else {
      finish(state, task, "Crisis closed. Ugly, but closed.");
    }
    return null;
  }

  return "That job does not resolve that way.";
}

export function failOpenRequired(state: GameState) {
  const shift = state.shift;
  if (!shift) return;
  shift.board.forEach((t) => {
    if (t.status !== "open" && t.status !== "active") return;
    if (!t.required) {
      t.status = "failed";
      return;
    }
    t.status = "failed";
    t.report = t.failNote ?? `Ignored: ${t.title}.`;
    state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 2);
    note(state, t.report);
  });
}

export function markSortieDone(state: GameState, loc: LocationId, kind: MissionKind) {
  const shift = ensureShift(state);
  const task =
    shift.board.find((t) => t.status === "active" && t.kind === "sortie") ??
    shift.board.find((t) => t.status === "open" && t.kind === "sortie" && t.loc === loc && t.missionKind === kind) ??
    shift.board.find((t) => t.status === "open" && t.kind === "sortie");
  if (task && task.status !== "done") {
    task.status = "done";
    task.report = `${locById(loc).short} ${kind} is on the books.`;
    shift.activeId = null;
  }
}

export function watchCostForKind(kind: MissionKind) {
  return sortieWatchCost(kind);
}
