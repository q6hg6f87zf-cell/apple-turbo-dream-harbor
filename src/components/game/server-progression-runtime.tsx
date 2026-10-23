import { AUTHORITY_BOSS_GATES } from "@/game/authority-rules";
import { scoreMission } from "@/game/campaign-balance";
import { canonicalRegionId } from "@/game/data";
import { cloneState } from "@/game/engine";
import { claimServerMissionTreasure } from "@/game/server-inventory";
import {
  advanceServerDay,
  pullServerProgression,
  settleServerMission,
  startServerMission,
  upgradeServerQuarter,
  upgradeServerRoom,
  type ServerMissionTicket,
  type ServerProgressionSnapshot,
} from "@/game/server-progression";
import { playSettleSpectacle } from "@/game/spectacle-kits";
import { isLiveRailHealthy, registerLiveRefresh } from "@/game/server-live-rail";
import { isSortiePlan, missionBeatsFromSortiePlan } from "@/game/sortie-plan";
import { shouldApplyServerSnapshot } from "@/game/apply-snapshot-revision";
import { playAtlasBeatCue } from "@/game/live-cues";
import { settleBeatCueId } from "@/game/settle-beat-audio";
import { useGame } from "@/game/store";
import type { GameState, LocationId, MissionState, Operative, RegionId } from "@/game/types";
import { useEffect } from "react";

const REGION_TO_LOCATION: Record<RegionId, LocationId> = {
  ironclad: "ironclad",
  slagtown: "kingdom",
  blackspire: "caverns",
  brasswater: "library",
  veyra: "veyra",
};

type AuthorityProgressOp = Operative & {
  residentLevel?: number;
  residentXp?: number;
  residentXpToNext?: number;
};

export type AuthorityCampaignCache = {
  active: boolean;
  commandRank: number;
  materials: Partial<Record<RegionId, number>>;
  residentLevels: Record<string, number>;
  /** Campaign ledger revision from authority snapshot. */
  revision: number;
  /** Member/card ledger revision — used with campaign rev to gate applySnapshot. */
  memberRevision: number;
};

type AuthorityGameState = GameState & {
  authorityCampaign?: AuthorityCampaignCache;
};

const tickets = new Map<string, Promise<ServerMissionTicket | null>>();
let applyingSnapshot = false;
let dayPending = false;
let upgradePending = false;

export function authorityCampaignCache(state: GameState): AuthorityCampaignCache | null {
  return (state as AuthorityGameState).authorityCampaign ?? null;
}

function applySnapshot(snapshot: ServerProgressionSnapshot, toast?: string) {
  const cached = authorityCampaignCache(useGame.getState().s);
  if (!shouldApplyServerSnapshot(snapshot, cached)) {
    // Stale poll / racing settle — never clobber a fresher authority ledger.
    return;
  }
  applyingSnapshot = true;
  try {
    useGame.setState((store) => {
      // Re-check inside the write in case a newer snapshot landed between gate and mutate.
      const liveCache = authorityCampaignCache(store.s);
      if (!shouldApplyServerSnapshot(snapshot, liveCache)) {
        return store;
      }
      const s = cloneState(store.s) as AuthorityGameState;
      s.day = Math.max(1, Number(snapshot.campaign.day || 1));
      s.coins = Math.max(0, Number(snapshot.treasury.caps || 0));
      s.ore = Math.max(0, Number(snapshot.treasury.ore || 0));
      s.moonFavor = Math.max(0, Number(snapshot.treasury.moonFavor || 0));

      const rooms = snapshot.treasury.rooms ?? {};
      s.rooms.vault = Math.max(0, Number(rooms.vault ?? s.rooms.vault));
      s.rooms.barracks = Math.max(0, Number(rooms.barracks ?? s.rooms.barracks));
      s.rooms.forge = Math.max(0, Number(rooms.forge ?? s.rooms.forge));
      s.rooms.infirmary = Math.max(0, Number(rooms.infirmary ?? s.rooms.infirmary));
      s.rooms.watchtower = Math.max(0, Number(rooms.watchtower ?? s.rooms.watchtower));
      s.rooms.ledger = Math.max(0, Number(rooms.ledger ?? s.rooms.ledger));

      const quarters = snapshot.treasury.quarters ?? {};
      s.quarters.bunk = Math.max(0, Number(quarters.bunk ?? s.quarters.bunk));
      s.quarters.lockbox = Math.max(0, Number(quarters.lockbox ?? s.quarters.lockbox));
      s.quarters.hearth = Math.max(0, Number(quarters.hearth ?? s.quarters.hearth));

      (Object.keys(REGION_TO_LOCATION) as RegionId[]).forEach((region) => {
        const loc = REGION_TO_LOCATION[region];
        const current = s.locations[loc];
        if (!current) return;
        const intel = Math.max(0, Number(snapshot.campaign.intel?.[region] ?? current.intel));
        const missions = Math.max(0, Number(snapshot.campaign.missions?.[region] ?? current.missions));
        const defeated = !!snapshot.campaign.bossClears?.[region];
        s.locations[loc] = {
          ...current,
          unlocked: !!snapshot.campaign.unlocked?.[region],
          intel,
          missions,
          bossUnlocked: defeated || intel >= AUTHORITY_BOSS_GATES[region].minIntel,
          bossDefeated: defeated,
        };
      });

      const residentById = new Map(snapshot.residents.map((resident) => [resident.id, resident]));
      s.operatives = s.operatives.map((op) => {
        const serverResident = residentById.get(op.id);
        if (!serverResident) return op;
        const next = { ...op } as AuthorityProgressOp;
        next.residentLevel = Math.max(1, Number(serverResident.level || 1));
        next.residentXp = Math.max(0, Number(serverResident.xp || 0));
        next.residentXpToNext = Math.max(1, Number(serverResident.xpToNext || 1));
        return next;
      });

      s.authorityCampaign = {
        active: true,
        commandRank: Math.max(1, Number(snapshot.campaign.commandRank || 1)),
        materials: { ...snapshot.campaign.materials },
        residentLevels: Object.fromEntries(snapshot.residents.map((resident) => [resident.id, resident.level])),
        revision: Number(snapshot.campaign.revision || 0),
        memberRevision: Number(snapshot.card.revision || 0),
      };

      const rider = s.squad.find((member) => member.discordId === snapshot.card.discordId);
      if (rider) {
        rider.personalCaps = Math.max(0, Number(snapshot.card.caps || 0));
        rider.xp = Math.max(0, Number(snapshot.card.xp || 0));
      }
      if (s.discordId === snapshot.card.discordId) {
        s.xp = Math.max(0, Number(snapshot.card.xp || 0));
        s.level = Math.max(1, Number(snapshot.card.level || 1));
      }
      if (toast) s.toast = toast;
      return { s };
    });
  } finally {
    applyingSnapshot = false;
  }
}

function toast(message: string) {
  useGame.setState((store) => ({ s: { ...store.s, toast: message } }));
}

function standDownMission(mission: MissionState, reason: string) {
  useGame.setState((store) => {
    if (store.s.mission?.id !== mission.id) return store;
    const s = cloneState(store.s);
    s.mission = null;
    s.combat = null;
    for (const id of mission.partyIds) {
      const index = s.operatives.findIndex((op) => op.id === id);
      if (index < 0) continue;
      const op = s.operatives[index];
      if (op.status !== "dead") s.operatives[index] = { ...op, status: op.hp > 0 ? "idle" : "downed", location: "hq" };
    }
    s.toast = `Tyrone stood the sortie down: ${reason}`;
    return { s };
  });
}

function ensureTicket(mission: MissionState): Promise<ServerMissionTicket | null> {
  const existing = tickets.get(mission.id);
  if (existing) return existing;
  const region = canonicalRegionId(mission.locationId);
  if (!region) return Promise.resolve(null);

  const state = useGame.getState().s;
  const party = mission.partyIds
    .map((id) => state.operatives.find((op) => op.id === id))
    .filter((op): op is Operative => !!op)
    .map((op) => ({ id: op.id, name: op.name, cls: op.cls }));

  const promise = startServerMission(region, mission.kind, mission.id, party)
    .then((response) => {
      applySnapshot(response);
      const ticket = response.ticket ?? null;
      if (ticket?.sortiePlan && isSortiePlan(ticket.sortiePlan)) {
        useGame.setState((g) => {
          const live = g.s.mission;
          if (!live || live.id !== mission.id) return g;
          const beats = missionBeatsFromSortiePlan(ticket.sortiePlan!);
          g.s = {
            ...g.s,
            mission: {
              ...live,
              beats,
              beatIndex: Math.min(live.beatIndex, Math.max(0, beats.length - 1)),
            },
          };
          return g;
        });
      }
      return ticket;
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : "server contract unavailable";
      standDownMission(mission, message);
      tickets.delete(mission.id);
      return null;
    });
  tickets.set(mission.id, promise);
  return promise;
}

async function settleCompletedMission(
  prevState: ReturnType<typeof useGame.getState>["s"],
  nextState: ReturnType<typeof useGame.getState>["s"],
  mission: MissionState,
) {
  const ticket = await ensureTicket(mission);
  if (!ticket) return;
  const wait = Math.max(0, new Date(ticket.availableAt).getTime() - Date.now() + 80);
  if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait));

  try {
    const matrix = scoreMission(prevState, nextState, mission);
    const result = await settleServerMission(ticket.id, matrix.score);
    const treasure = await claimServerMissionTreasure(ticket.id).catch(() => null);
    const drops = treasure?.treasure?.result?.drops ?? [];
    const reward = result.reward;
    const parts = [
      reward?.vaultCaps ? `Vault +${reward.vaultCaps.toLocaleString()} caps` : null,
      reward?.cardCaps ? `card +${reward.cardCaps.toLocaleString()}` : null,
      reward?.ore ? `+${reward.ore} ore` : null,
      reward?.favor ? `+${reward.favor} favor` : null,
      reward?.residentXp ? `residents +${reward.residentXp} XP` : null,
      reward?.materialQty ? `+${reward.materialQty} regional material${reward.materialQty === 1 ? "" : "s"}` : null,
      drops.length ? `recovered ${drops.map((drop) => drop.name).join(" + ")}` : null,
    ].filter(Boolean);
    applySnapshot(
      result,
      `${result.duplicate ? "Contract already settled" : "Tyrone settled the contract"}${parts.length ? ` · ${parts.join(" · ")}` : ""}.`,
    );
    // Forge settle theater: HTTP beat from Vault (presentation only — never mint).
    if (result.beat) {
      playSettleSpectacle(result.beat);
      const cue = settleBeatCueId(result.beat);
      if (cue) playAtlasBeatCue(cue);
    } else if (!result.duplicate) {
      // Fallback when older servers omit beat — still show the board changed.
      const fallbackBeat = {
        theater: result.reward?.kind === "boss" ? "BossCleared" : "MissionSettled",
        beatId: result.reward?.kind === "boss" ? "boss_clear" : Number(result.reward?.intel || 0) > 0 ? "intel_drop" : "vault_flash",
        intelDelta: Number(result.reward?.intel || 0) || undefined,
        region: result.reward?.region,
        kind: result.reward?.kind,
        revision: {
          campaign: Number(result.campaign?.revision || 0),
          member: Number(result.card?.revision || 0),
        },
      };
      playSettleSpectacle(fallbackBeat);
      const cue = settleBeatCueId(fallbackBeat);
      if (cue) playAtlasBeatCue(cue);
    }
  } catch (error) {
    const fresh = await pullServerProgression().catch(() => null);
    if (fresh) applySnapshot(fresh);
    toast(error instanceof Error ? error.message : "Tyrone could not settle the mission contract.");
  } finally {
    tickets.delete(mission.id);
  }
}

export function ServerProgressionRuntime() {
  const discordId = useGame((store) => store.s.discordId);

  useEffect(() => {
    if (!discordId) return;
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    let upgradesInstalled = false;
    let originalUpgradeRoom: ReturnType<typeof useGame.getState>["upgradeRoom"] | null = null;
    let originalUpgradeQuarter: ReturnType<typeof useGame.getState>["upgradeQuarter"] | null = null;

    const refresh = async (quiet = true) => {
      const snapshot = await pullServerProgression().catch(() => null);
      if (cancelled || !snapshot || snapshot.card.discordId !== discordId) return null;
      applySnapshot(snapshot, quiet ? undefined : "Tyrone verified the shared campaign ledger.");
      return snapshot;
    };

    void (async () => {
      const authority = await refresh(false);
      if (!authority || cancelled) return;

      const current = useGame.getState();
      originalUpgradeRoom = current.upgradeRoom;
      originalUpgradeQuarter = current.upgradeQuarter;

      const upgradeRoom: typeof current.upgradeRoom = (room) => {
        if (upgradePending) return "Vault 13 is already settling a construction order.";
        upgradePending = true;
        toast("Vault 13 · authorizing construction…");
        void upgradeServerRoom(room)
          .then((snapshot) => {
            const level = Number(snapshot.treasury.rooms?.[room] ?? 0);
            applySnapshot(snapshot, `${room} construction settled on the server · Tier ${level}.`);
          })
          .catch(async (error) => {
            const fresh = await pullServerProgression().catch(() => null);
            if (fresh) applySnapshot(fresh);
            toast(error instanceof Error ? error.message : "Tyrone rejected the construction order.");
          })
          .finally(() => {
            upgradePending = false;
          });
        return null;
      };

      const upgradeQuarter: typeof current.upgradeQuarter = (quarter) => {
        if (upgradePending) return "Vault 13 is already settling a construction order.";
        upgradePending = true;
        toast("Resident Quarters · authorizing construction…");
        void upgradeServerQuarter(quarter)
          .then((snapshot) => {
            const level = Number(snapshot.treasury.quarters?.[quarter] ?? 0);
            applySnapshot(snapshot, `${quarter} construction settled on the server · Tier ${level}.`);
          })
          .catch(async (error) => {
            const fresh = await pullServerProgression().catch(() => null);
            if (fresh) applySnapshot(fresh);
            toast(error instanceof Error ? error.message : "Tyrone rejected the construction order.");
          })
          .finally(() => {
            upgradePending = false;
          });
        return null;
      };

      upgradesInstalled = true;
      useGame.setState({ upgradeRoom, upgradeQuarter });

      const currentMission = useGame.getState().s.mission;
      if (currentMission) void ensureTicket(currentMission);

      unsubscribe = useGame.subscribe((nextStore, prevStore) => {
        if (applyingSnapshot) return;
        const next = nextStore.s;
        const prev = prevStore.s;

        if (next.mission && next.mission.id !== prev.mission?.id) {
          void ensureTicket(next.mission);
        }

        if (prev.mission && !next.mission) {
          void settleCompletedMission(prev, next, prev.mission);
        }

        if (!dayPending && next.day > prev.day) {
          dayPending = true;
          void advanceServerDay()
            .then((snapshot) => applySnapshot(snapshot, `Vault 13 campaign day ${snapshot.campaign.day}.`))
            .catch(async (error) => {
              const snapshot = await pullServerProgression().catch(() => null);
              if (snapshot) applySnapshot(snapshot);
              toast(error instanceof Error ? error.message : "Tyrone rejected the day advance.");
            })
            .finally(() => {
              dayPending = false;
            });
        }
      });
    })();

    const onFocus = () => void refresh(true);
    window.addEventListener("focus", onFocus);
    // 30s poll is backup only — Pulse SSE demotes it while healthy.
    const timer = window.setInterval(() => {
      if (isLiveRailHealthy()) return;
      void refresh(true);
    }, 30_000);
    const unregisterLive = registerLiveRefresh(() => {
      void refresh(true);
    });

    return () => {
      cancelled = true;
      unregisterLive();
      unsubscribe?.();
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
      if (upgradesInstalled && originalUpgradeRoom && originalUpgradeQuarter) {
        useGame.setState({ upgradeRoom: originalUpgradeRoom, upgradeQuarter: originalUpgradeQuarter });
      }
    };
  }, [discordId]);

  return null;
}
