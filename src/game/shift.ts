import { locById, WORLD } from "./data";
import { discoverNextPoi, KANE_STAKES, locationToRegion } from "./field-ops";
import { aegisJob, boardPostedLine, sortieJob } from "./story";
import { CAST, meetCast } from "./cast";
import { queueTalk } from "./talk";
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
    brief: "Three unmarked boxes came in overnight. One still ticks. One smells like oil. One has a Kane stencil half scraped. Pick one. Leave the rest.",
    why: "Salvage is a decision, not a roll.",
    watchCost: 1,
    required: false,
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
      brief: "She will not come inside. She has a map fragment and a thirst.",
      choices: [
        { id: "buy", label: "Buy the whispers", blurb: "80 caps. Ironclad intel.", need: "caps" as const, cost: 80 },
        { id: "feed", label: "Feed her", blurb: "Moon favor. She remembers Vault 13." },
        { id: "turn", label: "Turn her away", blurb: "The gate stays simple." },
      ],
    },
    {
      title: "Slag Town runner",
      brief: "He wants furnace slag moved before Kane's buyers price it.",
      choices: [
        { id: "move", label: "Move the slag", blurb: "Spend a watch of labor. Caps now." },
        { id: "tax", label: "Tax the run", blurb: "Take a cut. He will not forget." },
        { id: "turn", label: "Not our problem", blurb: "He takes the road alone." },
      ],
    },
    {
      title: "Brasswater diver",
      brief: "She offers a wet page from the Drowned Archive. Wants a bunk for one night.",
      choices: [
        { id: "bunk", label: "Give her a bunk", blurb: "Jump-table fragment. Heat stays cold." },
        { id: "buy", label: "Buy the page only", blurb: "120 caps. No guests.", need: "caps" as const, cost: 120 },
        { id: "turn", label: "Keep the vault sealed", blurb: "Kane's divers will find her first." },
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
    brief: v.brief,
    why: "People at the gate are the Realm talking.",
    watchCost: 1,
    required: false,
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
    brief: `${stake.why} A buyer is waiting at ${loc.short}.`,
    why: "Paying her buys time. Refusing buys a hunt.",
    watchCost: 1,
    required: state.kaneHeat >= 8,
    loc: loc.id,
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

export function generateBoard(state: GameState): ShiftState {
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
      brief: `${wounded.map((o) => o.name).join(", ")} need a bunk and a needle. You pick who. Kane does not wait on the wounded.`,
      why: "Dawn will finish anyone still downed without a Med Bay.",
      watchCost: 1,
      required: wounded.some((o) => o.status === "downed"),
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
      brief: "Oil, weld, swear. The BB gun still kicks if the receiver is proud. Pick a piece of kit or spend the watch on the line.",
      why: "Broken steel is a choice you already made.",
      watchCost: 1,
      required: broken,
      failNote: "A broken piece stays broken. Next sortie will notice.",
      status: "open",
    });
  }

  board.push({
    id: uid("job"),
    kind: "scan",
    title: "Walk the perimeter",
    brief: "Cameras, such as they are. Count visors on the West Berm. Lyra paints ridges. If a white light is out there, the rest of the wing already has a map.",
    why: "Intel is how Ghost routes open. Kane's outline of us is the other number.",
    watchCost: 1,
    required: false,
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
      brief: "Send one operative down the slag road. They walk. You get the report. Kane's buyers use the same road after dusk.",
      why: "The roster is the mechanic. Class decides the haul.",
      watchCost: 1,
      required: false,
      failNote: "Nobody walked. The pantry stayed thin.",
      status: "open",
    });
  }

  board.push({
    id: uid("job"),
    kind: "market",
    title: "Walk the Moon Squad Market",
    brief: "Stalls under the Iron Gate. Kane's surveyors already bought a table at the gatehouse. Limited stock. Dawn reset. The black card pays.",
    why: "Gear lives on the ground now, not in a ledger drawer.",
    watchCost: 1,
    required: state.day % 2 === 1,
    loc: "ironclad",
    poiId: "ironclad-market",
    failNote: "The stalls packed up without Moon Squad. Dawn will reprint thinner.",
    status: "open",
  });

  board.push({
    id: uid("job"),
    kind: "tower",
    title: "Climb Relay Tower Three",
    brief: "ICR 88's iron spine. Kane frequencies, visiting stalls, sites the board has not named yet. Lyra listens here whether we climb or not.",
    why: "A day Kane talks and we do not is a day we donate the map.",
    watchCost: 1,
    required: state.day >= 2 && state.day % 2 === 0,
    loc: "ironclad",
    poiId: "ironclad-tower",
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
    board,
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
      if (idle) {
        const i = state.operatives.findIndex((o) => o.id === idle.id);
        state.operatives[i] = { ...idle, hp: Math.max(1, idle.hp - 3) };
      }
      finish(state, task, `Trap. ${crate.payload}. Kane just got a ping.`);
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
      state.operatives[i] = { ...op, hp: Math.max(2, Math.floor(op.maxHp / 3)), status: "idle", location: "hq" };
      finish(state, task, `${op.name} is standing. Ugly, but standing.`);
    } else {
      state.operatives[i] = { ...op, hp: Math.min(op.maxHp, op.hp + 6) };
      finish(state, task, `${op.name} took the med pass. +6 HP.`);
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
      const next = it.condition === "Broken" ? "Damaged" : it.condition === "Damaged" ? "Worn" : "Pristine";
      it.condition = next;
      finish(state, task, `${it.name} is ${next}. The line holds.`);
    } else {
      state.coins += 25;
      finish(state, task, "Nothing broken. You oiled the line. +25 caps in saved parts.");
    }
    return null;
  }

  if (task.kind === "scan") {
    const loc = (payload.loc ?? unlockedField(state)[0]?.id ?? "ironclad") as LocationId;
    if (!state.locations[loc]?.unlocked) return "That region is sealed.";
    state.locations[loc] = { ...state.locations[loc], intel: state.locations[loc].intel + 2 };
    const found = discoverNextPoi(state, loc);
    finish(
      state,
      task,
      found
        ? `Perimeter marked ${found.name} in ${locById(loc).short}. Ghost routes open when intel is on the board.`
        : `${locById(loc).short} scanned. Intel +2. Kane's people were already walking it.`,
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
      const hurt = op.hp > 4 && Math.random() < 0.35;
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
      finish(state, task, "Whispers bought. Ironclad intel +2.");
    } else if (choice.id === "feed" || choice.id === "bunk") {
      state.moonFavor += 2;
      state.locations.ironclad.intel += 1;
      finish(state, task, "They eat. They talk. Vault 13 just made a friend.");
    } else if (choice.id === "move") {
      state.coins += 110;
      finish(state, task, "Slag moved. +110 caps. Kane's buyer is late.");
    } else if (choice.id === "tax") {
      state.coins += 50;
      state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 1);
      finish(state, task, "You took a cut. He will mention it.");
    } else {
      finish(state, task, "Gate stays simple. The Realm does not.");
    }
    return null;
  }

  if (task.kind === "aegis") {
    const tower = state.rooms.watchtower >= 1;
    const talker = state.operatives.find((o) => o.status === "idle" && (o.cls === "Bard" || o.cls === "Merchant"));
    const person = CAST[(task.npcId as keyof typeof CAST) ?? "lyra"] ?? CAST.lyra;
    meetCast(state, person.id);
    if (choice.id === "hide") {
      if (tower) {
        state.kaneHeat = Math.max(0, (state.kaneHeat ?? 0) - 1);
        finish(state, task, `Perimeter Control buried me. ${person.name} logged an empty ridge.`);
      } else {
        state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 2);
        finish(state, task, `No cameras. ${person.name} walked a bunk. Heat up. I stayed in the walls.`);
      }
    } else if (choice.id === "lie") {
      if (talker) {
        finish(state, task, `${talker.name} sold ${person.name} the salvage-outfit line. They bought it. For now.`);
      } else {
        state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 3);
        finish(state, task, `Nobody here talks like a foundry. ${person.name} logged a question mark.`);
      }
    } else {
      state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 4);
      finish(state, task, `You met ${person.name}'s 2753 armed. That is a conversation for the yard.`);
      state.shift.activeId = task.id;
      task.status = "active";
      return "fight";
    }
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
      if (rogue) {
        state.coins += 70;
        state.kaneHeat = Math.min(40, (state.kaneHeat ?? 0) + 1);
        finish(state, task, "The shipment looked right. It was sand. A Rogue made it so.");
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
