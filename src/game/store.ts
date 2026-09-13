import { create } from "zustand";
import type {
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
import {
  advanceBeat,
  applyRollToBeat,
  buildMission,
  cloneState,
  companionCost,
  completeMission,
  d20,
  defaultState,
  forgeCost,
  forgeOperative,
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
  spawnCombat,
  finishCombat,
} from "./engine";
import { closeHack, hackDud, hackGuess, openHack, seedPackIfNeeded, usePackItem } from "./inventory";
import { clearSave, claimAnonymousIfNeeded, loadSave, setActiveIdentity, writeSave } from "./save";
import {
  applyFloor,
  deltaEmpty,
  isSnowflake,
  parseStampedLink,
  pullRemote,
  readWho,
  snapshotFromSearch,
  type HandshakeDelta,
} from "./discord";
import { sfx } from "./audio";
import { advanceTalk as stepTalk, queueTalk, skipTalk as skipTalkFn, SCREEN_SCRIPT, scriptForScreen } from "./talk";
import {
  canTakeArcTurn,
  depositToCard,
  ensureSquad,
  giftCaps,
  passArcTurn,
  registerMember,
  seatedMember,
  switchMember,
  withdrawFromCard,
} from "./squad";

type Action =
  | "strike"
  | "guard"
  | "gift"
  | "item"
  | "flee"
  | "skill";

interface Store {
  s: GameState;
  hydrated: boolean;
  confirmRest: boolean;
  handshake: HandshakeDelta | null;
  guideOpen: boolean;
  hydrate: () => void;
  pullArcade: () => Promise<void>;
  persist: () => void;
  reset: () => void;
  linkDiscord: (id: string, name?: string) => void;
  setScreen: (screen: Screen) => void;
  assumeCommand: () => void;
  finishBriefing: () => void;
  toastClear: () => void;
  selectOp: (id: string | null) => void;
  selectLoc: (id: LocationId) => void;
  forge: (opts: {
    name: string;
    cls: ClassName;
    race: string;
    lineage: string;
    origin: string;
    rolls: Record<string, number>;
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
  buyNpc: (name: string, price: number) => string | null;
  deploy: (loc: LocationId, kind: MissionKind, partyIds: string[]) => string | null;
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
  hackPick: (word: string) => "ok" | "denied" | "lock" | "won" | "idle";
  hackBracket: () => string | null;
  advanceTalk: () => void;
  skipTalk: () => void;
  resumeSession: () => void;
  askTyrone: (script?: string) => void;
  openGuide: () => void;
  closeGuide: () => void;
  registerRider: (name: string, handle?: string, discordId?: string) => string | null;
  playAs: (id: string) => void;
  giftRider: (toId: string, amount: number) => string | null;
  depositCard: (amount: number) => string | null;
  withdrawCard: (amount: number) => string | null;
  passTurn: () => void;
}

function mutate(set: (fn: (x: Store) => Partial<Store>) => void, fn: (s: GameState) => void) {
  set((st) => {
    const next = cloneState(st.s);
    fn(next);
    return { s: next };
  });
}

let lastRestAt = 0;

export const useGame = create<Store>((set, get) => ({
  s: defaultState(),
  hydrated: false,
  confirmRest: false,
  handshake: null,
  guideOpen: false,
  hydrate: () => {
    if (typeof window === "undefined") return;
    const urlSnap = snapshotFromSearch();
    const who = urlSnap ? { id: urlSnap.id, name: urlSnap.name } : readWho();
    if (who) {
      claimAnonymousIfNeeded(who.id);
      setActiveIdentity(who);
    }
    const loaded = loadSave();
    if (who) {
      loaded.discordId = who.id;
      loaded.discordName = who.name;
      registerMember(loaded, who.name, who.name, who.id);
      const seated = loaded.squad.find((m) => m.discordId === who.id);
      if (seated) switchMember(loaded, seated.id);
    }
    const delta = applyFloor(loaded, urlSnap);
    ensureSquad(loaded);
    if (!deltaEmpty(delta)) {
      loaded.toast = `Arcade synced. +${delta.caps} caps · +${delta.xp} XP.`;
      ensureSquad(loaded).personalCaps += delta.caps;
      queueTalk(loaded, "handshake", true);
    }
    if (loaded.started && !loaded.shop) loaded.shop = rollShop(loaded.day);
    if (loaded.started && !loaded.bounty) loaded.bounty = rollBounty(loaded);
    seedPackIfNeeded(loaded);
    set({ s: loaded, hydrated: true, handshake: deltaEmpty(delta) ? (urlSnap ? delta : null) : delta });
  },
  pullArcade: async () => {
    const id = get().s.discordId;
    if (!id) return;
    const snap = await pullRemote(id);
    if (!snap) return;
    mutate(set, (st) => {
      const d = applyFloor(st, snap);
      registerMember(st, snap.name, snap.name, snap.id);
      const rider = st.squad.find((m) => m.discordId === snap.id);
      if (rider && d.caps) rider.personalCaps += d.caps;
      if (!deltaEmpty(d)) {
        st.toast = `Tyrone pulled the porch. +${d.caps} caps · +${d.xp} XP.`;
      }
    });
  },
  persist: () => writeSave(get().s),
  reset: () => {
    clearSave();
    const next = defaultState();
    const who = readWho();
    if (who) {
      next.discordId = who.id;
      next.discordName = who.name;
    }
    ensureSquad(next);
    set({ s: next, hydrated: true, confirmRest: false, handshake: null, guideOpen: false });
  },
  linkDiscord: (id, name) => {
    const stamped = parseStampedLink(id);
    const snow = (stamped?.id || (isSnowflake(id) ? id.trim() : "")).slice(0, 32);
    const label = (name || stamped?.name || (!snow ? id : snow)).replace(/^@/, "").trim().slice(0, 32);
    if (label.length < 2 && snow.length < 2) return;
    mutate(set, (st) => {
      const d = stamped ? applyFloor(st, { ...stamped, name: label || stamped.name }) : { caps: 0, xp: 0, pack: {} };
      const plate = label.length >= 2 ? label : snow;
      if (snow && !st.discordId) {
        st.discordId = snow;
        st.discordName = plate;
      } else if (!st.discordName) {
        st.discordName = plate;
      }
      registerMember(st, plate, name || stamped?.name || plate, snow || null);
      const seated = snow ? st.squad.find((m) => m.discordId === snow) : seatedMember(st);
      if (seated) switchMember(st, seated.id);
      if (d.caps) ensureSquad(st).personalCaps += d.caps;
      st.toast = `${plate} sits the black card.`;
    });
    if (snow) get().pullArcade();
  },
  setScreen: (screen) =>
    mutate(set, (s) => {
      s.screen = screen;
      const script = SCREEN_SCRIPT[screen];
      if (script) queueTalk(s, script);
    }),
  assumeCommand: () =>
    mutate(set, (s) => {
      s.started = true;
      s.screen = "briefing";
      s.tutorial = "briefing";
      s.shop = rollShop(1);
      s.bounty = rollBounty(s);
      ensureSquad(s);
      pushLog(s, "session", "Tyrone", "Command assumed. The word is S.Y.N.A.P.S.E. Three bobby pins. A CRT that lies.");
      queueTalk(s, "briefing", true);
    }),
  resumeSession: () =>
    mutate(set, (s) => {
      if (!s.started) return;
      if (s.tutorial === "briefing" && s.operatives.length === 0) {
        s.screen = "briefing";
        queueTalk(s, "briefing", true);
        return;
      }
      queueTalk(s, "resume", !s.talk);
    }),
  askTyrone: (script) => {
    set({ guideOpen: false });
    mutate(set, (s) => {
      const id = script ?? scriptForScreen(s);
      if (s.combat || s.mission) {
        s.toast = "I will not talk over a fight, partner. Read the card.";
        return;
      }
      queueTalk(s, id, true);
    });
  },
  openGuide: () => set({ guideOpen: true }),
  closeGuide: () => set({ guideOpen: false }),
  finishBriefing: () =>
    mutate(set, (s) => {
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
    }),
  forge: (opts) => {
    const s = get().s;
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
      });
      st.operatives = [op, ...st.operatives];
      if (st.tutorial === "forge") {
        st.tutorial = "sortie";
        st.screen = "map";
        st.selectedId = null;
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
        damage: offer.kind === "weapon" ? "1d6" : undefined,
        defense: offer.kind === "armor" ? 1 : undefined,
      });
      pushLog(st, "loot", "Ledger", `Bought ${offer.name} for ${price} caps.`);
      st.toast = `Acquired ${offer.name}.`;
    });
    return null;
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
  deploy: (loc, kind, partyIds) => {
    const s = get().s;
    if (s.mission || s.combat) return "A sortie is already live.";
    if (!s.locations[loc].unlocked) return "That region is sealed.";
    if (kind === "boss" && !s.locations[loc].bossUnlocked) return "The name has not surfaced yet.";
    if (kind === "boss" && s.locations[loc].bossDefeated) return "That name is already down.";
    if (!partyIds.length) return "Send at least one operative.";
    const valid = partyIds.every((id) => idleAtHq(s).some((o) => o.id === id));
    if (!valid) return "Pick idle operatives at HQ.";
    if (kind === "raid" && partyIds.length < 1) return "Raid needs a body.";
    if (!canTakeArcTurn(s, loc, kind)) {
      const wait = s.squad.find((m) => m.id === s.arc?.turnMemberId);
      return `ARC turn belongs to ${wait?.name ?? "another rider"}. Scout is always open.`;
    }
    mutate(set, (st) => {
      st.mission = buildMission(st, loc, kind, partyIds);
      st.lastParty = partyIds;
      partyIds.forEach((id) => {
        const i = st.operatives.findIndex((o) => o.id === id);
        st.operatives[i] = { ...st.operatives[i], status: "deployed", location: loc };
      });
      pushLog(st, "action", locById(loc).short, `${kind} sortie. ${partyIds.length} deployed.`);
    });
    return null;
  },
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
      msg = openHack(st);
      if (msg) st.toast = msg;
    });
    return msg;
  },
  closeTerminal: () =>
    mutate(set, (st) => {
      closeHack(st);
    }),
  hackPick: (word) => {
    let result: "ok" | "denied" | "lock" | "won" | "idle" = "idle";
    mutate(set, (st) => {
      result = hackGuess(st, word);
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
  advanceTalk: () =>
    mutate(set, (st) => {
      stepTalk(st);
    }),
  skipTalk: () =>
    mutate(set, (st) => {
      skipTalkFn(st);
    }),
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
  passTurn: () =>
    mutate(set, (st) => {
      passArcTurn(st);
    }),
}));
