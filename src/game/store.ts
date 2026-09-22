import { create } from "zustand";
import type {
  ArcadePayout,
  ClassName,
  GameState,
  Item,
  LocationId,
  MissionKind,
  PackKey,
  RoomId,
  QuarterId,
  Screen,
} from "./types";
import { BASE_ROOMS, COMPANIONS, QUARTERS, locById } from "./data";
import { chromeKind, isHubScreen, isTaskScreen } from "./shell";
import { resolveScenarioApproach, scenarioAtPoi } from "./scenario";
import { syncStorySpine } from "./story-spine";
import { queueCastPresence, presenceLineForSituation } from "./cast-presence";
import {
  advanceBeat,
  applyRollToBeat,
  buildMission,
  clamp,
  characterForged,
  cloneState,
  companionCost,
  completeMission,
  d20,
  defaultState,
  forgeCost,
  forgeOperative,
  hasPlayerProfile,
  healCost,
  hireResidentCost,
  idleAtHq,
  improve,
  incomePerTick,
  living,
  nextQuarterCost,
  nextRoomCost,
  packCap,
  pushLog,
  repairCost,
  resolvePlayerAction,
  restOvernight,
  rollBounty,
  rollShop,
  rosterCap,
  seatSoul,
  spawnCombat,
  spawnAegisYard,
  spawnScenarioCombat,
  stampPlayerProfile,
  finishCombat,
} from "./engine";
import { hackDud, hackGuess, openHack, seedPackIfNeeded, usePackItem } from "./inventory";
import { forgetInventorySessions } from "./inventory-session";
import {
  closeTermSession,
  emptyTerm,
  openTermSession,
  termGo,
  termLog,
  termSelect,
  type TermChoice,
  type TermPage,
} from "./terminal";
import { settleArcade, stampHackWin } from "./arcade";
import { clearSave, claimAnonymousIfNeeded, loadSave, setActiveIdentity, writeSave, adoptSaveIdentity } from "./save";
import {
  applyFloor,
  consumeAuthQuery,
  deltaEmpty,
  isPlaceholderName,
  isSnowflake,
  parseStampedLink,
  pullRemote,
  readWho,
  snapshotFromSearch,
  type HandshakeDelta,
} from "./discord";
import { sfx } from "./audio";
import { playFoundYou, armIntro, startPorchRadio } from "./radio";
import { enterWake } from "./opening";
import { advanceTalk as stepTalk, queueTalk, skipTalk as skipTalkFn, SCREEN_SCRIPT, scriptForScreen, TALK } from "./talk";
import { considerTyroneHint, speakTyrone, answerTyroneQuestion } from "./tyrone-voice";
import { ingestTyrone, snapshotTyrone } from "./tyrone-mind";
import {
  canTakeArcTurn,
  bindDiscordIdentity,
  clockPlate as tapClockPlate,
  depositToCard,
  ensureSquad,
  giftCaps,
  passArcTurn,
  registerMember,
  seatedMember,
  stampSeatedPlate,
  switchMember,
  withdrawFromCard,
} from "./squad";
import { fetchSoul, postSoul } from "./soul";
import { buyMarketLot, ensureMarket, MARKET_POI_ID, rollMarket, TOWER_POI_ID } from "./market";
import type { FieldDeploy } from "./field-ops";
import { workPoi, markFieldJob } from "./field-ops";
import { deliverTravisPart } from "./travis";
import { showTravisItem, travisFavorRepair } from "./item-story";
import { attachPart, stripPart } from "./weapon-ops";
import { setFlag, ensureNarrative, addJournal } from "./narrative-state";
import type { AttachmentSlot } from "./types";
import { meetCast } from "./cast";
import {
  canRestClean,
  ensureShift,
  resolveTask as applyTask,
  restPenalties,
  sortieWatchCost,
  type TaskPayload,
} from "./shift";

type Action =
  | "strike"
  | "guard"
  | "gift"
  | "item"
  | "flee"
  | "skill";

export type WorkJob =
  | { kind: "room"; room: RoomId }
  | { kind: "quarter"; quarter: QuarterId }
  | { kind: "repair"; opId: string | "vault"; itemId: string }
  | { kind: "travis"; itemId?: string };

interface Store {
  s: GameState;
  hydrated: boolean;
  confirmRest: boolean;
  handshake: HandshakeDelta | null;
  guideOpen: boolean;
  expansionOpen: boolean;
  work: WorkJob | null;
  filePane: "stat" | "plate" | "roster" | "data" | "people" | null;
  hydrate: () => void;
  pullArcade: () => Promise<void>;
  persist: () => void;
  reset: () => void;
  stampProfile: (name: string, handle?: string) => string | null;
  linkDiscord: (id: string, name?: string) => void;
  adoptVerifiedDiscord: (id: string, name?: string, handle?: string) => void;
  setScreen: (screen: Screen) => void;
  leaveTask: () => void;
  assumeCommand: () => void;
  finishBriefing: () => void;
  toastClear: () => void;
  selectOp: (id: string | null) => void;
  selectLoc: (id: LocationId) => void;
  selectPoi: (id: string | null) => void;
  openRegionMap: () => void;
  closeRegionMap: () => void;
  forge: (opts: {
    name: string;
    cls: ClassName;
    race: string;
    lineage: string;
    origin: string;
    rolls: Record<string, number>;
    portraitId?: string;
  }) => string | null;
  upgradeRoom: (room: RoomId) => string | null;
  upgradeQuarter: (q: QuarterId) => string | null;
  hireResident: (name: string, role: keyof typeof import("./data").RESIDENT_ROLES) => string | null;
  bondCompanion: (opId: string, type: string) => string | null;
  repairItem: (opId: string | "vault", itemId: string) => string | null;
  healOp: (opId: string) => string | null;
  stabilize: (opId: string) => string | null;
  equipItem: (opId: string, itemId: string) => void;
  stashItem: (opId: string, itemId: string) => string | null;
  takeFromVault: (opId: string, itemId: string) => string | null;
  buyOffer: (tier: "bargain" | "essential" | "artifact") => string | null;
  buyLot: (lotId: string) => string | null;
  workSite: (poiId?: string) => string | null;
  deliverTravis: (itemId?: string) => string | null;
  travisFavorRepair: (itemId: string) => string | null;
  showTravisItem: (itemId: string) => string | null;
  attachFirearmPart: (source: { kind: "vault" } | { kind: "operative"; opId: string }, partId: string, targetOpId: string, targetItemId: string) => string | null;
  stripFirearmPart: (opId: string, weaponId: string, slot: import("./types").AttachmentSlot) => string | null;
  openMarket: () => void;
  buyNpc: (name: string, price: number) => string | null;
  deploy: (loc: LocationId, kind: MissionKind, partyIds: string[], field?: FieldDeploy) => string | null;
  pickTactic: (id: string) => void;
  rollBeat: () => void;
  continueMission: () => void;
  combatAct: (a: Action) => void;
  rest: () => void;
  cancelRest: () => void;
  extractCombat: () => void;
  tick: () => void;
  renameOp: (id: string, name: string) => void;
  hof: (id: string) => void;
  usePack: (key: PackKey) => string | null;
  openTerminal: () => string | null;
  closeTerminal: () => void;
  termGo: (page: TermPage) => void;
  termLog: (line: string) => void;
  termSelect: (choice: TermChoice) => "nav" | "logoff" | "breach" | "idle";
  termBreach: () => string | null;
  hackPick: (word: string) => "ok" | "denied" | "lock" | "won" | "idle";
  hackBracket: () => string | null;
  advanceTalk: () => void;
  skipTalk: () => void;
  syncWakeLine: (i: number) => void;
  finishWakeReel: () => void;
  resumeSession: () => void;
  askTyrone: (script?: string) => void;
  askTyroneLine: (text: string) => void;
  setTyroneAssist: (level: import("./types").TyroneAssist) => void;
  toggleTyroneNumbers: () => void;
  openGuide: () => void;
  closeGuide: () => void;
  resolveScenario: (scenarioId: string, approachId: string) => string | null;
  openExpansion: () => void;
  closeExpansion: () => void;
  openWork: (job: WorkJob) => void;
  closeWork: () => void;
  openFile: (pane?: "stat" | "plate" | "roster" | "data" | "people") => void;
  registerRider: (name: string, handle?: string, discordId?: string) => string | null;
  playAs: (id: string) => void;
  giftRider: (toId: string, amount: number) => string | null;
  depositCard: (amount: number) => string | null;
  withdrawCard: (amount: number) => string | null;
  clockPlate: () => string | null;
  passTurn: () => void;
  openTask: (id: string) => string | null;
  closeTask: () => void;
  resolveTask: (payload: TaskPayload) => string | null;
  settleArcade: (pay: ArcadePayout) => void;
  mutateArcade: (fn: (s: GameState) => unknown) => unknown;
}

function mutate(set: (fn: (x: Store) => Partial<Store>) => void, fn: (s: GameState) => void) {
  set((st) => {
    const next = cloneState(st.s);
    const snap = snapshotTyrone(next);
    fn(next);
    ingestTyrone(next, snap);
    considerTyroneHint(next, snap);
    return { s: next };
  });
}

let lastRestAt = 0;

async function syncRemoteSoul() {
  const store = useGame.getState();
  if (!store.s.discordId) return;
  const remote = await fetchSoul();
  if (remote) {
    mutate(useGame.setState, (st) => {
      if (seatSoul(st, remote)) {
        st.toast = `${remote.name} sat from the shared file.`;
      }
    });
    return;
  }
  const local = store.s.operatives[0];
  if (local) void postSoul(local);
}

export const useGame = create<Store>((set, get) => ({
  s: defaultState(),
  hydrated: false,
  confirmRest: false,
  handshake: null,
  guideOpen: false,
  expansionOpen: false,
  work: null,
  filePane: null,
  hydrate: () => {
    if (get().hydrated) return;
    if (typeof window === "undefined") return;
    try {
      consumeAuthQuery();
      const urlSnap = snapshotFromSearch();
      const who = urlSnap ? { id: urlSnap.id, name: urlSnap.name } : readWho();
      if (who && isSnowflake(who.id)) {
        claimAnonymousIfNeeded(who.id);
        setActiveIdentity(who);
      } else {
        setActiveIdentity(null);
      }
      const loaded = loadSave();
      if (who && isSnowflake(who.id)) {
        loaded.discordId = who.id;
        loaded.discordName = isPlaceholderName(who.name) ? loaded.discordName : who.name;
        bindDiscordIdentity(loaded, who.id, who.name);
      } else if (loaded.discordId && !isSnowflake(loaded.discordId)) {
        loaded.discordId = null;
      }
      if (isPlaceholderName(loaded.playerName)) loaded.playerName = null;
      if (isPlaceholderName(loaded.playerHandle)) loaded.playerHandle = null;
      const delta = applyFloor(loaded, urlSnap);
      ensureSquad(loaded);
      if (!deltaEmpty(delta)) {
        loaded.toast = `Arcade synced. +${delta.caps} caps · +${delta.xp} XP.`;
        ensureSquad(loaded).personalCaps += delta.caps;
        queueTalk(loaded, "handshake", true);
      }
      if (loaded.started && !loaded.shop) loaded.shop = rollShop(loaded.day);
      if (loaded.started && (!loaded.market || loaded.market.day !== loaded.day || !loaded.market.lots?.length)) {
        loaded.market = rollMarket(loaded.day, loaded.locations);
      }
      if (loaded.started && !loaded.bounty) loaded.bounty = rollBounty(loaded);
      if (loaded.started) ensureShift(loaded);
      seedPackIfNeeded(loaded);
      if (
        loaded.started &&
        !loaded.seenTalk.includes("kane") &&
        !loaded.combat &&
        !loaded.mission &&
        loaded.talk?.script !== "wake" &&
        loaded.talk?.script !== "kane"
      ) {
        queueTalk(loaded, "kane", true);
      }
      set({ s: loaded, hydrated: true, handshake: deltaEmpty(delta) ? (urlSnap ? delta : null) : delta });
      void syncRemoteSoul();
    } catch (err) {
      console.error("Hollow file failed to boot. Starting a clean porch.", err);
      const fresh = defaultState();
      fresh.toast = "The last file would not seat. I opened a clean porch.";
      set({ s: fresh, hydrated: true, handshake: null });
    }
  },
  pullArcade: async () => {
    const id = get().s.discordId;
    if (!id) return;
    const snap = await pullRemote(id);
    if (!snap) return;
    mutate(set, (st) => {
      const d = applyFloor(st, snap);
      bindDiscordIdentity(st, snap.id, snap.name);
      const rider = st.squad.find((m) => m.discordId === snap.id);
      if (rider && d.caps) rider.personalCaps += d.caps;
      if (!deltaEmpty(d)) {
        st.toast = `Tyrone pulled the porch. +${d.caps} caps · +${d.xp} XP.`;
      }
    });
  },
  persist: () => writeSave(get().s),
  reset: () => {
    const prevName = get().s.playerName;
    const prevHandle = get().s.playerHandle;
    clearSave();
    forgetInventorySessions();
    const next = defaultState();
    const who = readWho();
    if (who) {
      next.discordId = who.id;
      next.discordName = who.name;
    }
    next.playerName = prevName;
    next.playerHandle = prevHandle;
    if (who) bindDiscordIdentity(next, who.id, who.name);
    else if (prevHandle && !next.discordName) next.discordName = prevHandle;
    ensureSquad(next);
    if (prevName) stampSeatedPlate(next);
    set({ s: next, hydrated: true, confirmRest: false, handshake: null, guideOpen: false });
  },
  linkDiscord: (id, name) => {
    const stamped = parseStampedLink(id);
    const snow = (stamped?.id || (isSnowflake(id) ? id.trim() : "")).slice(0, 32);
    const handle = (name || stamped?.name || "").replace(/^@/, "").trim().slice(0, 32);
    if (!isSnowflake(snow) && handle.length < 2) return;
    if (!isSnowflake(snow)) return;
    const prev = get().s.discordId;
    if (prev && prev !== snow && !isSnowflake(prev)) adoptSaveIdentity(prev, snow);
    setActiveIdentity({ id: snow, name: isPlaceholderName(handle) ? snow : handle });
    mutate(set, (st) => {
      const d = stamped ? applyFloor(st, { ...stamped, name: handle || stamped.name }) : { caps: 0, xp: 0, pack: {} };
      bindDiscordIdentity(st, snow, handle);
      const seated = st.squad.find((m) => m.discordId === snow);
      if (seated) switchMember(st, seated.id);
      if (d.caps) ensureSquad(st).personalCaps += d.caps;
      const plate = seatedMember(st);
      st.toast = st.playerName && !isPlaceholderName(st.playerName)
        ? `${st.playerName} sits the black card.`
        : `Discord @${(plate.discordHandle ?? handle ?? snow).replace(/^@/, "")} is on the plate. Stamp a name.`;
    });
    if (snow) get().pullArcade();
  },
  adoptVerifiedDiscord: (id, name, handle) => {
    const snow = (id ?? "").trim();
    if (!isSnowflake(snow)) return;
    const cleanName = (name ?? "").trim().replace(/^@/, "").slice(0, 24);
    const cleanHandle = (handle ?? "").trim().replace(/^@/, "").slice(0, 32);
    const prev = get().s.discordId;
    if (prev && prev !== snow) adoptSaveIdentity(prev, snow);
    setActiveIdentity({ id: snow, name: isPlaceholderName(cleanName) ? cleanHandle || snow : cleanName });
    mutate(set, (st) => {
      bindDiscordIdentity(st, snow, cleanHandle);
      if (!isPlaceholderName(cleanName)) stampPlayerProfile(st, cleanName, cleanHandle);
      else if (!isPlaceholderName(cleanHandle)) stampPlayerProfile(st, cleanHandle, cleanHandle);
    });
    get().persist();
  },
  stampProfile: (name, handle) => {
    let msg: string | null = null;
    mutate(set, (st) => {
      msg = stampPlayerProfile(st, name, handle);
      if (msg) return;
      stampSeatedPlate(st);
      const plate = seatedMember(st);
      const hid = (plate.discordHandle ?? st.playerHandle ?? "").replace(/^@/, "");
      st.toast = hid
        ? `${plate.name} sits the black card · @${hid}`
        : `${plate.name} sits the black card.`;
    });
    if (!msg) get().persist();
    return msg;
  },
  setScreen: (screen) =>
    mutate(set, (s) => {
      if (screen === "forge" && characterForged(s)) {
        s.toast = "Your file is already cut. The Machine Shop does not stamp a second soul.";
        s.screen = "hq";
        s.openedFrom = null;
        return;
      }
      if (isTaskScreen(screen) && isHubScreen(s.screen) && !s.openedFrom) {
        s.openedFrom = s.screen;
      }
      if (isHubScreen(screen) || chromeKind(screen) === "none") {
        s.openedFrom = null;
      }
      s.screen = screen;
      if (screen !== "map") s.regionMapOpen = false;
      const script = SCREEN_SCRIPT[screen];
      if (script) queueTalk(s, script);
    }),
  leaveTask: () =>
    mutate(set, (s) => {
      if (!isTaskScreen(s.screen)) return;
      const dest =
        s.openedFrom && isHubScreen(s.openedFrom)
          ? s.openedFrom
          : s.screen === "forge"
            ? "hq"
            : "more";
      s.openedFrom = null;
      s.screen = dest;
      if (dest !== "map") s.regionMapOpen = false;
    }),
  assumeCommand: () => {
    if (!hasPlayerProfile(get().s)) {
      mutate(set, (st) => {
        st.toast = "Stamp a name first, partner.";
      });
      return;
    }
    armIntro();
    enterWake();
    void playFoundYou();
    set({ guideOpen: false });
    mutate(set, (s) => {
      s.started = true;
      s.screen = "briefing";
      s.tutorial = "briefing";
      s.shop = rollShop(1);
      s.market = rollMarket(1, s.locations);
      s.poiWatch = { day: 1, used: [] };
      s.bounty = rollBounty(s);
      ensureSquad(s);
      pushLog(s, "session", "Tyrone", "Found you east of the highway. Kane's surveyors are already in Ironclad. Vault 13 holds.");
      s.nightNote = "Kane's surveyors posted a weigh-in at the Rail Cut. Count their crates before they count ours.";
      s.metCast = Array.from(new Set([...(s.metCast ?? []), "kane", "tyrone"]));
      queueTalk(s, "wake", true);
    });
    get().persist();
  },
  resumeSession: () => {
    const s = get().s;
    if (!s.started) return;
    const needsWake = s.tutorial === "briefing" && s.operatives.length === 0 && !s.seenTalk.includes("wake");
    mutate(set, (st) => {
      if (st.tutorial === "briefing" && st.operatives.length === 0) {
        if (!st.seenTalk.includes("wake")) {
          st.screen = "briefing";
          queueTalk(st, "wake", true);
          return;
        }
        if (!st.seenTalk.includes("welcome") && !st.seenTalk.includes("briefing")) {
          st.screen = "hq";
          st.tutorial = "forge";
          queueTalk(st, "welcome", true);
          return;
        }
        st.screen = "hq";
        st.tutorial = "forge";
        return;
      }
      queueTalk(st, "resume", !st.talk);
    });
    if (needsWake) {
      armIntro();
      enterWake();
      void playFoundYou();
    }
  },
  askTyrone: (script) => {
    set({ guideOpen: false });
    mutate(set, (s) => {
      const id = script ?? scriptForScreen(s);
      if (s.combat || (s.mission && !s.mission.waiting)) {
        s.toast = "I will not talk over a fight, partner. Read the card.";
        return;
      }
      queueTalk(s, id, true);
    });
  },
  askTyroneLine: (text) => {
    set({ guideOpen: false });
    mutate(set, (s) => {
      if (s.combat || (s.mission && !s.mission.waiting)) {
        s.toast = "I will not talk over a fight, partner. Read the card.";
        return;
      }
      const q = text.trim().slice(0, 180);
      if (!q) return;
      s.tyrone.working.lastAsk = q;
      const answer = answerTyroneQuestion(s, q);
      speakTyrone(s, { text: answer, concept: "ask", priority: 1, reason: `asked: ${q.slice(0, 48)}`, force: true });
    });
  },
  setTyroneAssist: (level) =>
    mutate(set, (s) => {
      s.tyrone.settings.assist = level;
    }),
  toggleTyroneNumbers: () =>
    mutate(set, (s) => {
      s.tyrone.settings.showNumbers = !s.tyrone.settings.showNumbers;
    }),
  openGuide: () => set({ guideOpen: true }),
  closeGuide: () => set({ guideOpen: false }),
  resolveScenario: (scenarioId, approachId) => {
    let err: string | null = null;
    mutate(set, (st) => {
      const result = resolveScenarioApproach(st, scenarioId, approachId);
      if (!result) {
        err = "That approach is not open.";
        st.toast = err;
        return;
      }
      syncStorySpine(st);
      if (result.spawnCombat) {
        spawnScenarioCombat(st, scenarioId);
      }
      if (result.followUpId) {
        const cue = presenceLineForSituation(st, result.followUpId);
        if (cue && st.tyrone) st.tyrone.utterance = cue;
      }
    });
    return err;
  },
  openExpansion: () => set({ expansionOpen: true }),
  closeExpansion: () => set({ expansionOpen: false }),
  openWork: (job) => set({ work: job }),
  closeWork: () => set({ work: null }),
  openFile: (pane = "stat") => {
    set({ filePane: pane });
    get().setScreen("file");
  },
  finishBriefing: () =>
    mutate(set, (s) => {
      if (characterForged(s)) {
        s.screen = "hq";
        s.tutorial = "shift";
        ensureShift(s);
        queueTalk(s, "shift");
        return;
      }
      s.openedFrom = "hq";
      s.screen = "forge";
      s.tutorial = "forge";
      queueTalk(s, "forge");
    }),
  toastClear: () =>
    mutate(set, (s) => {
      s.toast = null;
    }),
  selectOp: (id) =>
    mutate(set, (s) => {
      s.selectedId = id;
    }),
  selectLoc: (id) =>
    mutate(set, (s) => {
      s.selectedLoc = id;
      s.selectedPoiId = null;
    }),
  selectPoi: (id) =>
    mutate(set, (s) => {
      s.selectedPoiId = id;
    }),
  openRegionMap: () =>
    mutate(set, (s) => {
      s.screen = "map";
      s.regionMapOpen = true;
    }),
  closeRegionMap: () =>
    mutate(set, (s) => {
      s.regionMapOpen = false;
    }),
  forge: (opts) => {
    const s = get().s;
    if (characterForged(s)) return "Your file is already cut. The Machine Shop does not stamp a second soul.";
    const cost = forgeCost(s);
    if (living(s).length >= rosterCap(s)) return "Barracks full. Upgrade for more beds.";
    if (s.coins < cost) return `Need ${cost} caps to forge.`;
    if (!opts.name.trim()) return "They need a name. The Hollow keeps records.";
    mutate(set, (st) => {
      st.coins -= cost;
      const op = forgeOperative({
        name: opts.name,
        cls: opts.cls,
        race: opts.race,
        lineage: opts.lineage,
        origin: opts.origin,
        day: st.day,
        rolls: opts.rolls as never,
        portraitId: opts.portraitId,
      });
      st.operatives = [op, ...st.operatives];
      if (st.tutorial === "forge") {
        st.tutorial = "shift";
        st.screen = "hq";
        st.selectedId = null;
        ensureShift(st);
        queueTalk(st, "shift");
      } else {
        st.selectedId = op.id;
        st.screen = "roster";
      }
      pushLog(
        st,
        "hq",
        op.name,
        `Forged. ${op.cls} · ${op.race} · ${op.repTitle}. ${cost ? `-${cost} caps` : "First operative is a gift."}`,
      );
      st.toast = `${op.name} is on the roster.`;
    });
    sfx.forge();
    const forged = get().s.operatives[0];
    if (forged) void postSoul(forged);
    return null;
  },
  upgradeRoom: (room) => {
    const s = get().s;
    const cost = nextRoomCost(s, room);
    if (cost == null) return "Already at peak.";
    if (cost === 0 && s.rooms[room] > 0) return "Already at peak.";
    if (s.coins < cost) return `Need ${cost} caps.`;
    mutate(set, (st) => {
      st.coins -= cost;
      st.rooms[room] += 1;
      const lvl = st.rooms[room];
      const bonus = BASE_ROOMS[room].tiers[Math.min(lvl, BASE_ROOMS[room].tiers.length - 1)].bonus;
      pushLog(st, "hq", "HQ", `${BASE_ROOMS[room].name} → ${lvl}. ${bonus}`);
      st.toast = `${BASE_ROOMS[room].name} upgraded.`;
    });
    sfx.forge();
    return null;
  },
  upgradeQuarter: (q) => {
    const s = get().s;
    const cost = nextQuarterCost(s, q);
    if (cost == null) return "Already at peak.";
    if (s.coins < cost) return `Need ${cost} caps.`;
    mutate(set, (st) => {
      st.coins -= cost;
      st.quarters[q] += 1;
      const lvl = st.quarters[q];
      pushLog(st, "hq", "Bunkhouse", `${QUARTERS[q].name} → ${lvl}.`);
      st.toast = `${QUARTERS[q].name} upgraded.`;
    });
    sfx.forge();
    return null;
  },
  hireResident: (name, role) => {
    const s = get().s;
    const cost = hireResidentCost(s);
    if (s.rooms.barracks < 1) return "Barracks required before hiring staff.";
    if (s.coins < cost) return `Need ${cost} caps.`;
    mutate(set, (st) => {
      st.coins -= cost;
      st.residents.push({
        id: `rs-${Date.now()}`,
        name: name.trim() || "Unnamed",
        role,
      });
      pushLog(st, "hq", name || "Staff", `Hired as ${role}.`);
      st.toast = "Staff hired.";
    });
    return null;
  },
  bondCompanion: (opId, type) => {
    const s = get().s;
    const cost = companionCost(type);
    const op = s.operatives.find((o) => o.id === opId);
    if (!op) return "No operative.";
    if (op.companion) return "Already bonded.";
    if (s.coins < cost) return `Need ${cost} caps.`;
    const def = COMPANIONS[type];
    mutate(set, (st) => {
      st.coins -= cost;
      const i = st.operatives.findIndex((o) => o.id === opId);
      st.operatives[i] = {
        ...st.operatives[i],
        companion: { type, hp: def.hp, maxHp: def.hp, status: "active" },
      };
      pushLog(st, "hq", op.name, `Bonded ${type}.`);
      st.toast = `${type} bonded to ${op.name}.`;
    });
    return null;
  },
  repairItem: (opId, itemId) => {
    const s = get().s;
    if (s.rooms.forge < 1) return "Build the Forge first.";
    let item: Item | undefined;
    if (opId === "vault") item = s.vault.find((i) => i.id === itemId);
    else
      item = s.operatives.find((o) => o.id === opId)?.inventory.find((i) => i.id === itemId);
    if (!item) return "No such item.";
    if (item.condition === "Pristine") return "Already pristine.";
    const cost = repairCost(s, item);
    if (s.coins < cost) return `Need ${cost} caps.`;
    mutate(set, (st) => {
      st.coins -= cost;
      const bump = (it: Item) =>
        it.id === itemId ? { ...it, condition: improve(it.condition) } : it;
      if (opId === "vault") st.vault = st.vault.map(bump);
      else {
        const i = st.operatives.findIndex((o) => o.id === opId);
        st.operatives[i] = {
          ...st.operatives[i],
          inventory: st.operatives[i].inventory.map(bump),
        };
      }
      pushLog(st, "hq", "Forge", `Repaired toward pristine. -${cost} caps`);
      st.toast = "Steel remembers how to hold.";
    });
    return null;
  },
  healOp: (opId) => {
    const s = get().s;
    const op = s.operatives.find((o) => o.id === opId);
    if (!op) return "No operative.";
    if (op.hp >= op.maxHp) return "Already whole.";
    const missing = op.maxHp - op.hp;
    const cost = healCost(s, missing);
    if (s.coins < cost) return `Need ${cost} caps.`;
    mutate(set, (st) => {
      st.coins -= cost;
      const i = st.operatives.findIndex((o) => o.id === opId);
      st.operatives[i] = { ...st.operatives[i], hp: op.maxHp, status: "idle" };
      pushLog(st, "hp", op.name, `Infirmary. Full. -${cost} caps`);
      st.toast = `${op.name} stands up.`;
    });
    return null;
  },
  stabilize: (opId) => {
    const s = get().s;
    const op = s.operatives.find((o) => o.id === opId);
    if (!op || op.status !== "downed") return "They are not downed.";
    const field = s.rooms.infirmary < 1;
    const cost = field ? 180 : 0;
    if (s.coins < cost) return `Need ${cost} caps.`;
    mutate(set, (st) => {
      if (field) st.coins -= cost;
      const i = st.operatives.findIndex((o) => o.id === opId);
      st.operatives[i] = { ...st.operatives[i], hp: 1, status: "idle", location: "hq" };
      pushLog(st, "hp", op.name, field ? `Field dressing. 1 HP. -${cost} caps` : "Stabilised at 1 HP.");
      st.toast = `${op.name} is standing. Barely.`;
    });
    return null;
  },
  equipItem: (opId, itemId) =>
    mutate(set, (s) => {
      const i = s.operatives.findIndex((o) => o.id === opId);
      if (i < 0) return;
      const inv = s.operatives[i].inventory;
      const item = inv.find((x) => x.id === itemId);
      if (!item || !item.slot) return;
      s.operatives[i] = {
        ...s.operatives[i],
        inventory: inv.map((x) =>
          x.slot === item.slot ? { ...x, equipped: x.id === itemId ? !x.equipped : false } : x,
        ),
      };
    }),
  stashItem: (opId, itemId) => {
    const s = get().s;
    const op = s.operatives.find((o) => o.id === opId);
    const item = op?.inventory.find((i) => i.id === itemId);
    if (!op || !item) return "No item.";
    if (item.equipped) return "Unequip first.";
    mutate(set, (st) => {
      const i = st.operatives.findIndex((o) => o.id === opId);
      st.operatives[i] = {
        ...st.operatives[i],
        inventory: st.operatives[i].inventory.filter((x) => x.id !== itemId),
      };
      st.vault.push(item);
    });
    return null;
  },
  takeFromVault: (opId, itemId) => {
    const s = get().s;
    const op = s.operatives.find((o) => o.id === opId);
    const item = s.vault.find((i) => i.id === itemId);
    if (!op || !item) return "No item.";
    if (op.inventory.length >= packCap(op)) return "Rucksack full.";
    mutate(set, (st) => {
      st.vault = st.vault.filter((x) => x.id !== itemId);
      const i = st.operatives.findIndex((o) => o.id === opId);
      st.operatives[i] = {
        ...st.operatives[i],
        inventory: [...st.operatives[i].inventory, item],
      };
    });
    return null;
  },
  buyOffer: (tier) => {
    const s = get().s;
    if (!s.shop) return "Ledger is dark.";
    if (s.shop.bought?.[tier]) return "Already sold today. Wait for dawn.";
    const offer = s.shop[tier];
    const disc = s.rooms.ledger >= 3 ? 0.85 : 1;
    const price = Math.round(offer.price * disc);
    if (s.coins < price) return `Need ${price} caps.`;
    mutate(set, (st) => {
      if (!st.shop) return;
      st.coins -= price;
      st.shop = { ...st.shop, bought: { ...st.shop.bought, [tier]: true } };
      st.vault.push({
        id: `buy-${Date.now()}`,
        name: offer.name,
        kind: offer.kind,
        rarity: offer.rarity,
        condition: "Pristine",
        slot:
          offer.kind === "weapon" ? "weapon" : offer.kind === "armor" ? "armor" : offer.kind === "trinket" ? "trinket" : undefined,
        effect: offer.effect,
        lore: "Ledger stock.",
        value: price,
        damage: offer.damage ?? (offer.kind === "weapon" ? "1d6" : undefined),
        defense: offer.kind === "armor" ? 1 : undefined,
        weaponFamily: offer.weaponFamily,
        ammoType: offer.ammoType,
        rangeBand: offer.rangeBand,
        ap: offer.ap,
        accuracy: offer.accuracy,
        recoil: offer.recoil,
        attachmentSlot: offer.attachmentSlot,
        fitsFamilies: offer.fitsFamilies,
        ammoCount: offer.ammoCount,
        mag: offer.mag ?? offer.magSize,
        magSize: offer.magSize,
      });
      pushLog(st, "loot", "Ledger", `Bought ${offer.name} for ${price} caps.`);
      st.toast = `Acquired ${offer.name}.`;
    });
    return null;
  },
  buyLot: (lotId) => {
    let msg: string | null = null;
    mutate(set, (st) => {
      ensureMarket(st);
      msg = buyMarketLot(st, lotId);
      if (msg) return;
      const lot = st.market?.lots.find((l) => l.id === lotId);
      const name = lot?.name ?? "stock";
      pushLog(st, "loot", "Market", `Bought ${name} on the black card.`);
      st.toast = `Acquired ${name}. Stamped to the Salvage Depot.`;
    });
    return msg;
  },
  openMarket: () =>
    mutate(set, (st) => {
      if (isHubScreen(st.screen) && !st.openedFrom) st.openedFrom = st.screen;
      st.selectedLoc = "ironclad";
      st.selectedPoiId = MARKET_POI_ID;
      ensureMarket(st);
      meetCast(st, "holt");
      if (st.market?.visitor?.id) meetCast(st, st.market.visitor.id);
      queueCastPresence(st, "holt");
      st.screen = "market";
      st.regionMapOpen = false;
      markFieldJob(st, "market", "Walked the Moon Squad Market under the Iron Gate.", 1);
    }),
  workSite: (poiId) => {
    const s = get().s;
    const loc = s.selectedLoc && s.selectedLoc !== "hq" ? s.selectedLoc : "ironclad";
    const id = poiId ?? s.selectedPoiId;
    if (!id) return "Pin a site first.";
    let msg: string | null = null;
    let openBay = false;
    let openSituation = false;
    mutate(set, (st) => {
      const sit = scenarioAtPoi(st, loc, id);
      if (sit && !st.combat && !st.mission) {
        st.selectedLoc = loc;
        st.selectedPoiId = id;
        const cue = presenceLineForSituation(st, sit.id);
        if (cue && st.tyrone) st.tyrone.utterance = cue;
        if (sit.id === "travis_bay") queueCastPresence(st, "travis");
        if (sit.id === "halo_yard") queueCastPresence(st, "lyra");
        openSituation = true;
        msg = null;
        return;
      }
      msg = workPoi(st, loc, id);
      if (msg === "shop") {
        if (isHubScreen(st.screen) && !st.openedFrom) st.openedFrom = st.screen;
        st.selectedLoc = loc;
        st.selectedPoiId = id;
        ensureMarket(st);
        meetCast(st, "holt");
        if (st.market?.visitor?.id) meetCast(st, st.market.visitor.id);
        queueCastPresence(st, "holt");
        st.screen = "market";
        st.regionMapOpen = false;
        markFieldJob(st, "market", "Walked the Moon Squad Market under the Iron Gate.", 1);
        msg = null;
        return;
      }
      if (msg === "home") {
        st.screen = "hq";
        st.regionMapOpen = false;
        msg = null;
        return;
      }
      if (msg === "bay") {
        meetCast(st, "travis");
        queueCastPresence(st, "travis");
        st.selectedLoc = loc;
        st.selectedPoiId = id;
        st.regionMapOpen = false;
        openBay = true;
        msg = null;
        return;
      }
      if (msg === "boss") {
        st.regionMapOpen = false;
        st.toast = "Pin the site. Pick an approach. Deploy. That hill has a name.";
        msg = null;
      }
      // Tower listen — Rourke presence after workPoi mutates
      if (!msg && id.includes("tower")) {
        queueCastPresence(st, "rourke");
      }
      if (!msg && id.includes("berm")) {
        queueCastPresence(st, "lyra");
      }
    });
    if (openBay) set({ work: { kind: "travis" } });
    if (openSituation && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hollow:open-situation"));
    }
    return msg;
  },
  deliverTravis: (itemId) => {
    let line: string | null = null;
    mutate(set, (st) => {
      const result = deliverTravisPart(st, itemId);
      if (typeof result === "string") {
        line = result;
        st.toast = result;
        return;
      }
      ensureNarrative(st);
      setFlag(st, "travis_met", true);
      setFlag(st, "travis_bay_used", true);
      // Do not auto-set travis_jig_filled — that flag is the authored bay situation.
      addJournal(st, {
        act: st.narrative?.act ?? "act_i",
        day: st.day,
        title: `Travis seated ${result.mod.part}`,
        body: `${result.mod.fit} Paid ${result.pay} caps. ${result.mod.tagline}`,
        tags: ["travis", result.mod.id, "inventory"],
      });
      pushLog(st, "hq", "Travis", result.line);
      st.toast = result.line;
      queueTalk(st, "travis_fit", true);
      line = null;
    });
    return line;
  },
  travisFavorRepair: (itemId) => {
    let err: string | null = null;
    mutate(set, (st) => {
      const result = travisFavorRepair(st, itemId);
      if (typeof result === "string") {
        err = result;
        st.toast = result;
        return;
      }
      pushLog(st, "hq", "Travis", result.line);
      st.toast = result.line;
      queueTalk(st, "travis_weld", true);
      err = null;
    });
    return err;
  },
  showTravisItem: (itemId) => {
    let err: string | null = null;
    mutate(set, (st) => {
      const beat = showTravisItem(st, itemId);
      if (typeof beat === "string") {
        err = beat;
        st.toast = beat;
        return;
      }
      st.toast = `${beat.who}: ${beat.lines[0]}`;
      err = null;
    });
    return err;
  },
  attachFirearmPart: (source, partId, targetOpId, targetItemId) => {
    let err: string | null = null;
    mutate(set, (st) => {
      const msg = attachPart(st, source, partId, targetOpId, targetItemId);
      if (!msg || !/seated/i.test(msg)) {
        err = msg ?? "Could not seat that part.";
        st.toast = err;
        return;
      }
      st.toast = msg;
      pushLog(st, "hq", "Machine Shop", msg);
      err = null;
    });
    return err;
  },
  stripFirearmPart: (opId, weaponId, slot: AttachmentSlot) => {
    let err: string | null = null;
    mutate(set, (st) => {
      const msg = stripPart(st, opId, weaponId, slot);
      if (!msg || !/stripped from/i.test(msg)) {
        err = msg ?? "Could not strip that part.";
        st.toast = err;
        return;
      }
      st.toast = msg;
      pushLog(st, "hq", "Machine Shop", msg);
      err = null;
    });
    return err;
  },
  buyNpc: (name, price) => {
    const s = get().s;
    if (s.coins < price) return `Need ${price} caps.`;
    mutate(set, (st) => {
      st.coins -= price;
      if (name.includes("Ore")) st.ore += 1;
      else {
        st.vault.push({
          id: `npc-${Date.now()}`,
          name,
          kind: "consumable",
          rarity: "Uncommon",
          condition: "Pristine",
          effect: "Field supply.",
          lore: "Paid in full.",
          value: price,
        });
      }
      pushLog(st, "loot", "Trade", `Bought ${name}.`);
      st.toast = `Paid for ${name}.`;
    });
    return null;
  },
  deploy: (loc, kind, partyIds, field) => {
    const s = get().s;
    if (s.mission || s.combat) return "A sortie is already live.";
    if (!s.locations[loc].unlocked) return "That region is sealed.";
    if (kind === "boss" && !s.locations[loc].bossUnlocked) return "The name has not surfaced yet.";
    if (kind === "boss" && s.locations[loc].bossDefeated) return "That name is already down.";
    if (!partyIds.length) return "Send at least one operative.";
    const valid = partyIds.every((id) => idleAtHq(s).some((o) => o.id === id));
    if (!valid) return "Pick idle operatives at HQ.";
    if (kind === "raid" && partyIds.length < 1) return "Raid needs a body.";
    if (kind === "boss" && s.locations[loc]?.bossDefeated) {
      return "That hill is already cut. The Realm does not let you kill them twice.";
    }
    const cost = sortieWatchCost(kind);
    if ((s.shift?.watchesLeft ?? 4) < cost) return "No watches left on this shift. Rest until dawn.";
    if (!canTakeArcTurn(s, loc, kind)) {
      const wait = s.squad.find((m) => m.id === s.arc?.turnMemberId);
      return `${wait?.name ?? "another rider"} has the next loud job. Scout, forage, and the board stay open.`;
    }
    mutate(set, (st) => {
      st.mission = buildMission(st, loc, kind, partyIds, field);
      st.lastParty = partyIds;
      if (field?.poiId) st.selectedPoiId = field.poiId;
      partyIds.forEach((id) => {
        const i = st.operatives.findIndex((o) => o.id === id);
        st.operatives[i] = { ...st.operatives[i], status: "deployed", location: loc };
      });
      const site = field?.approach ? `${field.approach} ` : "";
      const sortie = st.shift?.board.find((t) => t.kind === "sortie" && (t.status === "open" || t.status === "active"));
      if (sortie) sortie.status = "active";
      pushLog(st, "action", locById(loc).short, `${site}${kind} sortie. ${partyIds.length} deployed.`);
    });
    return null;
  },
  pickTactic: (id) =>
    mutate(set, (st) => {
      const m = st.mission;
      if (!m?.waiting) return;
      const beat = m.beats[m.beatIndex];
      if (!beat || beat.tacticId) return;
      const tactic = beat.tactics?.find((t) => t.id === id);
      if (!tactic) return;
      beat.tacticId = tactic.id;
      beat.stat = tactic.stat;
      beat.dc = clamp(beat.dc + tactic.dcMod, 8, 19);
      m.narrative = [...m.narrative, `SYNAPSE · ${tactic.label}. ${tactic.blurb}`];
    }),
  rollBeat: () =>
    mutate(set, (st) => {
      if (!st.mission || !st.mission.waiting) return;
      const livingParty = st.mission.partyIds.some((id) => {
        const o = st.operatives.find((x) => x.id === id);
        return o && o.hp > 0 && o.status !== "dead";
      });
      if (!livingParty) {
        completeMission(st);
        return;
      }
      const raw = d20();
      const res = applyRollToBeat(st, raw);
      if (res.startCombat) spawnCombat(st, { boss: false });
      if (res.startBoss) spawnCombat(st, { boss: true });
    }),
  continueMission: () =>
    mutate(set, (st) => {
      if (!st.mission) return;
      if (st.combat) return;
      if (st.mission.waiting) return;
      const down = st.mission.partyIds.every((id) => {
        const o = st.operatives.find((x) => x.id === id);
        return !o || o.hp <= 0 || o.status === "dead";
      });
      if (down || st.mission.beatIndex >= st.mission.beats.length - 1) {
        completeMission(st);
        return;
      }
      advanceBeat(st);
    }),
  combatAct: (a) => {
    const had = !!get().s.combat;
    mutate(set, (st) => {
      if (!st.combat) return;
      resolvePlayerAction(st, a);
    });
    if (had && !get().s.combat) {
      const toast = get().s.toast ?? "";
      if (toast.includes("downed") || toast.includes("Extract")) sfx.hurt();
      else if (a === "flee") sfx.whoosh();
      else sfx.win();
    }
  },
  extractCombat: () =>
    mutate(set, (st) => {
      if (!st.combat) return;
      finishCombat(st, false);
    }),
  rest: () => {
    const s = get().s;
    if (s.mission || s.combat) return;
    const downed = s.operatives.filter((o) => o.status === "downed");
    if (downed.length && s.rooms.infirmary < 1 && !get().confirmRest) {
      set({ confirmRest: true });
      return;
    }
    const penalties = restPenalties(s);
    if (penalties.length && !get().confirmRest) {
      set({ confirmRest: true });
      return;
    }
    if (!canRestClean(s) && (s.shift?.watchesLeft ?? 0) > 0 && !get().confirmRest) {
      set({ confirmRest: true });
      return;
    }
    const now = Date.now();
    if (now - lastRestAt < 800) return;
    lastRestAt = now;
    set({ confirmRest: false });
    mutate(set, (st) => {
      restOvernight(st);
    });
    sfx.dawn();
  },
  cancelRest: () => set({ confirmRest: false }),
  tick: () =>
    mutate(set, (st) => {
      if (!st.started) return;
      st.ticks += 1;
      st.coins += incomePerTick(st);
    }),
  renameOp: (id, name) =>
    mutate(set, (s) => {
      const i = s.operatives.findIndex((o) => o.id === id);
      if (i >= 0 && name.trim()) s.operatives[i] = { ...s.operatives[i], name: name.trim() };
    }),
  hof: (id) =>
    mutate(set, (s) => {
      const i = s.operatives.findIndex((o) => o.id === id);
      if (i < 0) return;
      const op = s.operatives[i];
      if (op.raids + op.battles < 4) {
        s.toast = "Not yet. Survive more sorties.";
        return;
      }
      s.operatives[i] = { ...op, isHoF: !op.isHoF };
      s.toast = op.isHoF ? `${op.name} leaves the Hall.` : `${op.name} is inducted. +3 CHA.`;
      pushLog(s, "hq", op.name, op.isHoF ? "Removed from Hall of Fame." : "Inducted. +3 CHA.");
    }),
  usePack: (key) => {
    const s = get().s;
    if ((s.pack?.[key] ?? 0) <= 0) return `No ${key.replaceAll("_", " ")} in the vault.`;
    mutate(set, (st) => {
      usePackItem(st, key);
    });
    sfx.coin();
    return null;
  },
  openTerminal: () => {
    let msg: string | null = null;
    mutate(set, (st) => {
      msg = openTermSession(st);
      if (msg) st.toast = msg;
    });
    return msg;
  },
  closeTerminal: () =>
    mutate(set, (st) => {
      closeTermSession(st);
    }),
  termGo: (page) =>
    mutate(set, (st) => {
      termGo(st, page);
    }),
  termLog: (line) =>
    mutate(set, (st) => {
      termLog(st, line);
    }),
  termSelect: (choice) => {
    let result: "nav" | "logoff" | "breach" | "idle" = "idle";
    mutate(set, (st) => {
      result = termSelect(st, choice);
    });
    return result;
  },
  termBreach: () => {
    let msg: string | null = null;
    mutate(set, (st) => {
      if (!st.term) st.term = emptyTerm();
      msg = openHack(st);
      if (msg) {
        st.toast = msg;
        termLog(st, msg);
        st.term.page = "home";
      } else {
        st.term.page = "lock";
        st.term.booted = true;
      }
    });
    return msg;
  },
  hackPick: (word) => {
    let result: "ok" | "denied" | "lock" | "won" | "idle" = "idle";
    mutate(set, (st) => {
      const before = st.coins;
      result = hackGuess(st, word);
      if (result === "won") stampHackWin(st, Math.max(0, st.coins - before));
    });
    return result;
  },
  hackBracket: () => {
    let msg: string | null = null;
    mutate(set, (st) => {
      msg = hackDud(st);
    });
    return msg;
  },
  advanceTalk: () => {
    let leftWake = false;
    mutate(set, (st) => {
      const was = st.talk?.script;
      const result = stepTalk(st);
      if (was === "wake" && result === "done") leftWake = true;
      if (st.screen === "hq") ensureShift(st);
    });
    if (leftWake) void startPorchRadio();
  },
  skipTalk: () => {
    let leftWake = false;
    mutate(set, (st) => {
      const was = st.talk?.script;
      skipTalkFn(st);
      if (was === "wake" && st.talk?.script !== "wake") leftWake = true;
      if (st.screen === "hq") ensureShift(st);
    });
    if (leftWake) void startPorchRadio();
  },
  syncWakeLine: (i) =>
    mutate(set, (st) => {
      if (st.talk?.script !== "wake") return;
      const max = Math.max(0, (TALK.wake?.length ?? 1) - 1);
      const next = Math.max(0, Math.min(max, Math.floor(i)));
      if (st.talk.i === next) return;
      st.talk.i = next;
    }),
  finishWakeReel: () => {
    get().skipTalk();
  },
  registerRider: (name, handle, discordId) => {
    let msg: string | null = null;
    mutate(set, (st) => {
      const stamped = parseStampedLink(discordId || "") ?? parseStampedLink(handle || "");
      const did =
        stamped?.id ||
        discordId ||
        (handle && /^\d{17,22}$/.test(handle.trim()) ? handle.trim() : undefined);
      const label = name.trim() || stamped?.name || "";
      const hid = stamped ? stamped.name : handle;
      msg = registerMember(st, label, hid, did);
      if (!msg) {
        if (stamped) {
          const d = applyFloor(st, { ...stamped, name: label || stamped.name });
          if (d.caps) seatedMember(st).personalCaps += d.caps;
        }
        const who = seatedMember(st);
        st.toast = `${who.name} sits the black card.`;
      }
    });
    return msg;
  },
  playAs: (id) =>
    mutate(set, (st) => {
      switchMember(st, id);
      const m = st.squad.find((x) => x.id === id);
      if (m) st.toast = `Seated as ${m.name}.`;
    }),
  giftRider: (toId, amount) => {
    let msg: string | null = null;
    mutate(set, (st) => {
      msg = giftCaps(st, toId, amount);
      if (!msg) st.toast = "Caps moved between cards.";
    });
    return msg;
  },
  depositCard: (amount) => {
    let msg: string | null = null;
    mutate(set, (st) => {
      msg = depositToCard(st, amount);
      if (!msg) st.toast = "Deposited to the Moon Squad card.";
    });
    return msg;
  },
  withdrawCard: (amount) => {
    let msg: string | null = null;
    mutate(set, (st) => {
      msg = withdrawFromCard(st, amount);
      if (!msg) st.toast = "Withdrawn to the compound vault.";
    });
    return msg;
  },
  clockPlate: () => {
    let msg: string | null = null;
    mutate(set, (st) => {
      msg = tapClockPlate(st);
    });
    return msg;
  },
  passTurn: () =>
    mutate(set, (st) => {
      passArcTurn(st);
    }),
  openTask: (id) => {
    const s = get().s;
    const task = s.shift?.board.find((t) => t.id === id);
    if (!task) return "That job is not on the board.";
    if (task.status === "done" || task.status === "failed") return "Already closed.";
    if ((s.shift?.watchesLeft ?? 0) < task.watchCost) return "Not enough watches left.";
    if (task.kind === "sortie") {
      mutate(set, (st) => {
        const t = st.shift.board.find((x) => x.id === id);
        if (t) t.status = "active";
        st.shift.activeId = id;
        if (task.loc) {
          st.selectedLoc = task.loc;
          st.selectedPoiId = task.poiId ?? st.selectedPoiId;
          st.screen = "map";
        }
        st.toast = task.poiId
          ? `${task.title}. Approach is yours. Deploy when the line is ready.`
          : `${task.title}. Pin the site, pick an approach, deploy.`;
      });
      return null;
    }
    if (task.kind === "cabinet") {
      mutate(set, (st) => {
        const t = st.shift.board.find((x) => x.id === id);
        if (t) t.status = "active";
        st.shift.activeId = id;
        st.screen = "arcade";
        st.toast = "T-0888 glass is live. A scored win pays the vault and closes this job.";
      });
      return null;
    }
    if (task.kind === "market") {
      mutate(set, (st) => {
        const t = st.shift.board.find((x) => x.id === id);
        if (t) t.status = "active";
        st.shift.activeId = id;
        if (isHubScreen(st.screen) && !st.openedFrom) st.openedFrom = st.screen;
        st.selectedLoc = "ironclad";
        st.selectedPoiId = MARKET_POI_ID;
        ensureMarket(st);
        st.screen = "market";
        markFieldJob(st, "market", "Walked the Moon Squad Market under the Iron Gate.", 1);
        st.toast = "Moon Squad Market. Limited stalls. The black card pays.";
      });
      return null;
    }
    if (task.kind === "tower" || task.kind === "salvage") {
      mutate(set, (st) => {
        const t = st.shift.board.find((x) => x.id === id);
        if (t) t.status = "active";
        st.shift.activeId = id;
        st.selectedLoc = task.loc ?? "ironclad";
        st.selectedPoiId = task.poiId ?? (task.kind === "tower" ? TOWER_POI_ID : null);
        st.screen = "map";
        st.regionMapOpen = true;
        st.toast =
          task.kind === "tower"
            ? "Climb Relay Tower Three. Listen. That is the job."
            : "Pin a site. Scout or salvage. One watch.";
      });
      return null;
    }
    mutate(set, (st) => {
      st.shift.activeId = id;
    });
    return null;
  },
  closeTask: () =>
    mutate(set, (st) => {
      st.shift.activeId = null;
    }),
  resolveTask: (payload) => {
    let msg: string | null = null;
    mutate(set, (st) => {
      const id = st.shift?.activeId;
      if (!id) {
        msg = "No job is open.";
        return;
      }
      msg = applyTask(st, id, payload);
      if (msg === "fight") {
        spawnAegisYard(st);
        const t = st.shift.board.find((x) => x.id === id);
        if (t) {
          t.status = "done";
          t.report = `You met ${t.npcId ?? "AEGIS"} armed. The yard will remember.`;
        }
        st.shift.activeId = null;
        msg = null;
      } else if (msg) {
        st.toast = msg;
      }
    });
    return msg;
  },
  settleArcade: (pay) =>
    mutate(set, (st) => {
      settleArcade(st, pay);
    }),
  mutateArcade: (fn) => {
    let out: unknown;
    mutate(set, (st) => {
      out = fn(st);
    });
    return out;
  },
}));

if (typeof window !== "undefined") {
  (window as unknown as { __hollowQa?: Record<string, unknown> }).__hollowQa = {
    openRegionMap: (regionId = "ironclad") => {
      const api = useGame.getState();
      const loc =
        regionId === "slagtown"
          ? "kingdom"
          : regionId === "blackspire"
            ? "caverns"
            : regionId === "brasswater"
              ? "library"
              : regionId === "veyra"
                ? "veyra"
                : "ironclad";
      try {
        sessionStorage.setItem("hollow:region-dive", String(regionId));
      } catch {
        /* */
      }
      api.selectLoc(loc as never);
      api.openRegionMap();
    },
    getState: () => useGame.getState().s,
    hackPick: (word: string) => useGame.getState().hackPick(word),
    setState: (partial: Parameters<typeof useGame.setState>[0]) => useGame.setState(partial),
  };
}
